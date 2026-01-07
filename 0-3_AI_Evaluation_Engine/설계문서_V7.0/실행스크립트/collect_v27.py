# -*- coding: utf-8 -*-
"""
V27.0 독립 방식 수집+평가 스크립트

핵심 원칙: "각자 수집, 각자 평가"
- 풀링 방식 폐기 (변별력 없음)
- 각 AI가 독립적으로 50개 수집 → 50개 평가

프로세스:
[1] 정치인 ID 사전 등록 확인 (FK 에러 방지)
[2] 각 AI가 50개 수집 (rating 포함)
[3] DB 저장

사용법:
    # 전체 4개 AI 실행
    python collect_v27.py --politician_id=62e7b453 --politician_name="오세훈"

    # 특정 AI만 실행
    python collect_v27.py --politician_id=62e7b453 --politician_name="오세훈" --ai=Claude

    # 병렬 실행
    python collect_v27.py --politician_id=62e7b453 --politician_name="오세훈" --parallel
"""

import os
import sys
import json
import re
import argparse
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv()

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V27.0 테이블명
TABLE_COLLECTED_DATA = "collected_data_v27"

# AI 클라이언트 (필요 시 초기화)
ai_clients = {}

# 카테고리 정의
CATEGORIES = [
    ("Expertise", "전문성"),
    ("Leadership", "리더십"),
    ("Vision", "비전"),
    ("Integrity", "청렴성"),
    ("Ethics", "윤리성"),
    ("Accountability", "책임성"),
    ("Transparency", "투명성"),
    ("Communication", "소통능력"),
    ("Responsiveness", "대응성"),
    ("PublicInterest", "공익성")
]

# AI 모델 설정
AI_CONFIGS = {
    "Claude": {
        "model": "claude-3-haiku-20240307",
        "env_key": "ANTHROPIC_API_KEY"
    },
    "ChatGPT": {
        "model": "gpt-4o-mini",
        "env_key": "OPENAI_API_KEY"
    },
    "Grok": {
        "model": "grok-4-fast",
        "env_key": "XAI_API_KEY"
    },
    "Gemini": {
        "model": "gemini-2.0-flash",
        "env_key": "GEMINI_API_KEY"
    }
}


def check_politician_exists(politician_id):
    """정치인 ID 사전 등록 확인 (필수!)"""
    try:
        result = supabase.table('politicians').select('id, name').eq('id', politician_id).execute()
        if result.data and len(result.data) > 0:
            return True, result.data[0].get('name', '')
        return False, None
    except Exception as e:
        print(f"❌ 정치인 확인 에러: {e}")
        return False, None


def init_ai_client(ai_name):
    """AI 클라이언트 초기화"""
    global ai_clients

    if ai_name in ai_clients:
        return ai_clients[ai_name]

    config = AI_CONFIGS.get(ai_name)
    if not config:
        raise ValueError(f"알 수 없는 AI: {ai_name}")

    api_key = os.getenv(config['env_key'])
    if not api_key:
        raise ValueError(f"{config['env_key']} 환경변수가 설정되지 않았습니다.")

    if ai_name == "Claude":
        import anthropic
        ai_clients[ai_name] = anthropic.Anthropic(api_key=api_key)
    elif ai_name == "ChatGPT":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(api_key=api_key)
    elif ai_name == "Grok":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(
            api_key=api_key,
            base_url="https://api.x.ai/v1"
        )
    elif ai_name == "Gemini":
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        ai_clients[ai_name] = genai.GenerativeModel(config['model'])

    return ai_clients[ai_name]


def get_date_range():
    """V27.0 기간 제한 계산"""
    evaluation_date = datetime.now()
    official_start = evaluation_date - timedelta(days=365*4)
    public_start = evaluation_date - timedelta(days=365)

    return {
        'evaluation_date': evaluation_date.strftime('%Y-%m-%d'),
        'official_start': official_start.strftime('%Y-%m-%d'),
        'official_end': evaluation_date.strftime('%Y-%m-%d'),
        'public_start': public_start.strftime('%Y-%m-%d'),
        'public_end': evaluation_date.strftime('%Y-%m-%d'),
    }


def get_category_description(category_num):
    """카테고리 설명 반환"""
    descriptions = {
        1: """전문성 (Expertise)
【영문 정의】The level of knowledge, skills, and experience required to perform duties effectively
【한글 정의】정책 전문성, 행정 경험, 분야별 전문 지식
[O] 해당: 정책 수립 능력, 전문 지식, 학력/경력, 행정 경험, 법안 발의
[X] 비해당: 조직 관리(리더십), 혁신 아이디어(비전), 약속 이행(책임성)""",

        2: """리더십 (Leadership)
【영문 정의】The ability to effectively lead organizations and people to achieve goals
【한글 정의】조직 관리 능력, 위기 대응, 의사결정 능력
[O] 해당: 조직 관리, 위기 대응, 갈등 조정, 당내 리더십
[X] 비해당: 정책 전문성(전문성), 장기 계획(비전)""",

        3: """비전 (Vision)
【영문 정의】The ability to predict the future and present long-term goals
【한글 정의】장기적 계획, 혁신성, 미래 전망
[O] 해당: 장기 발전 계획, 미래 전략, 혁신 정책, 개혁 의지
[X] 비해당: 현재 정책 능력(전문성), 조직 혁신(리더십)""",

        4: """청렴성 (Integrity)
【영문 정의】The quality of not engaging in financial or material corruption
【한글 정의】부패 방지, 윤리 준수, 이해충돌 회피
[O] 해당: 금품/뇌물 수수, 횡령, 배임, 비리, 이해충돌, 불법 정치자금
[X] 비해당: 정치적 중립성(책임성), 정치적 편향성(윤리성)""",

        5: """윤리성 (Ethics)
【영문 정의】The quality of maintaining social norms and moral dignity
【한글 정의】도덕성, 사회적 책임, 공정성
[O] 해당: 도덕성, 인격, 공정성, 인권 존중, 발언의 적절성
[X] 비해당: 금품 수수(청렴성), 공약 불이행(책임성)""",

        6: """책임성 (Accountability)
【영문 정의】The quality of taking responsibility for promises and performance
【한글 정의】약속 이행, 성과 책임, 투명한 보고
[O] 해당: 공약 이행, 성과 책임, 잘못 인정, 정치적 책임
[X] 비해당: 부패/비리(청렴성), 정보 공개(투명성)""",

        7: """투명성 (Transparency)
【영문 정의】The quality of disclosing information and decision-making processes
【한글 정의】정보 공개, 소통 개방성, 설명 책임
[O] 해당: 정보 공개, 의사결정 과정 공개, 정치자금 공개
[X] 비해당: 금품 수수(청렴성), SNS 소통(소통능력)""",

        8: """소통능력 (Communication)
【영문 정의】The ability to effectively convey messages to citizens
【한글 정의】시민 소통, 언론 대응, 정책 홍보
[O] 해당: 시민 소통, 언론 대응, SNS 활용, 의견 수렴
[X] 비해당: 정보 공개(투명성), 민원 처리(대응성)""",

        9: """대응성 (Responsiveness)
【영문 정의】The ability to respond quickly and appropriately to citizens' needs
【한글 정의】민원 대응, 신속한 조치, 현장 중심
[O] 해당: 민원 처리, 신속한 조치, 현장 방문, 위기 대응 속도
[X] 비해당: 위기 관리 능력(리더십), 정책 소통(소통능력)""",

        10: """공익성 (PublicInterest)
【영문 정의】The attitude of prioritizing public interest over private interest
【한글 정의】공공 이익 우선, 사회적 형평성, 약자 보호
[O] 해당: 공공 이익 우선, 약자/소외계층 보호, 복지 정책
[X] 비해당: 사적 이익 추구(청렴성), 정책 전문성(전문성)"""
    }
    return descriptions.get(category_num, "")


def get_politician_profile(politician_id):
    """DB에서 정치인 프로필 조회"""
    try:
        result = supabase.table('politicians').select('*').eq('id', politician_id).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
    except Exception as e:
        print(f"  ⚠️ 프로필 조회 실패: {e}")
    return None


def format_politician_profile(politician_id, politician_name):
    """정치인 프로필을 프롬프트용 텍스트로 포맷"""
    profile = get_politician_profile(politician_id)

    if not profile:
        return f"**대상 정치인**: {politician_name}"

    profile_text = f"""**대상 정치인**: {politician_name}

**정치인 기본 정보** (동명이인 주의):
- 이름: {profile.get('name', politician_name)}
- 신분: {profile.get('identity', 'N/A')}
- 직책: {profile.get('title', profile.get('position', 'N/A'))}
- 정당: {profile.get('party', 'N/A')}
- 지역: {profile.get('region', 'N/A')}
- 성별: {profile.get('gender', 'N/A')}

⚠️ **중요**: 반드시 위 정보와 일치하는 "{politician_name}"의 데이터만 수집하세요."""

    return profile_text


def extract_json(content):
    """다양한 방식으로 JSON 추출 시도 (Claude JSON 파싱 문제 해결)"""
    if not content or not content.strip():
        return None

    content = content.strip()
    json_str = None

    # 방법 1: ```json 블록
    json_match = re.search(r'```json\s*([\s\S]*?)\s*```', content)
    if json_match:
        json_str = json_match.group(1).strip()
    else:
        # 방법 2: ``` 블록 (언어 명시 없음)
        code_match = re.search(r'```\s*([\s\S]*?)\s*```', content)
        if code_match:
            json_str = code_match.group(1).strip()
        else:
            # 방법 3: { } 직접 추출 (가장 바깥 중괄호)
            brace_match = re.search(r'\{[\s\S]*\}', content)
            if brace_match:
                json_str = brace_match.group(0)
            else:
                json_str = content

    # 방법 4: trailing comma 제거 (Claude 문제 해결)
    # ,] → ]  또는 ,} → } 패턴 수정
    if json_str:
        json_str = re.sub(r',\s*([}\]])', r'\1', json_str)

    return json_str


def call_ai_api(ai_name, prompt):
    """AI API 호출 (Claude JSON 문제 해결 적용)"""
    client = init_ai_client(ai_name)
    config = AI_CONFIGS[ai_name]

    try:
        if ai_name == "Claude":
            # Claude JSON 문제 해결: system 프롬프트 + 낮은 temperature
            response = client.messages.create(
                model=config['model'],
                max_tokens=4096,
                temperature=0.7,  # 1.0 → 0.7 (안정성 향상)
                system="You are a JSON response bot. Always respond with valid JSON only. No markdown code blocks, no explanations, no additional text. Start with { and end with }.",
                messages=[{"role": "user", "content": prompt + "\n\nRespond with JSON only:"}]
            )
            return response.content[0].text

        elif ai_name in ["ChatGPT", "Grok"]:
            response = client.chat.completions.create(
                model=config['model'],
                max_tokens=8000,
                temperature=1.0,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content

        elif ai_name == "Gemini":
            response = client.generate_content(
                prompt,
                generation_config={
                    'temperature': 1.0,
                    'max_output_tokens': 8000,
                }
            )
            return response.text

    except Exception as e:
        raise e


def collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num,
                               source_type, is_negative=False, count=5):
    """
    V27.0: 수집 + 평가 통합 (rating 포함)

    각 AI가 자기가 수집한 데이터를 직접 평가
    """
    cat_eng, cat_kor = CATEGORIES[category_num - 1]
    source_desc = "언론 보도" if source_type == "PUBLIC" else "공공기록/공식자료"
    topic_type = "부정 주제" if is_negative else "자유 평가"
    dates = get_date_range()

    print(f"    [{ai_name}] {topic_type} {count}개 - {source_desc}")

    cat_desc = get_category_description(category_num)
    profile_info = format_politician_profile(politician_id, politician_name)

    date_restriction = f"""
⚠️ **V27.0 기간 제한 ({source_type})**:
- OFFICIAL: {dates['official_start']} ~ {dates['official_end']} (최근 4년)
- PUBLIC: {dates['public_start']} ~ {dates['public_end']} (최근 1년)
"""

    negative_instruction = """
⚠️ **필수 - 부정 주제 수집**
- 반드시 **부정적인 측면만** 수집: 논란, 비판, 문제점, 실패, 스캔들
- 긍정적이거나 중립적인 내용은 수집하지 마세요
""" if is_negative else """
**작업**: 실제 행적, 정책, 성과를 조사하여 수집하고 평가하세요.
"""

    # V27.0: 수집 + 평가 통합 프롬프트 (rating 포함)
    prompt = f"""당신은 정치인 평가 AI입니다.

{profile_info}

{date_restriction}

{negative_instruction}

**출처**: {source_desc}만 사용
**평가 카테고리**: {cat_kor} ({cat_eng})
{cat_desc}

**등급 체계** (A~H):
| 등급 | 판단 기준 |
|------|-----------|
| A | 탁월함 - 해당 분야 모범 사례 |
| B | 우수함 - 긍정적 평가 |
| C | 양호함 - 기본 충족, 큰 문제 없음 |
| D | 보통 - 평균 수준 |
| E | 미흡함 - 개선 필요 |
| F | 부족함 - 문제 있음 |
| G | 매우 부족 - 심각한 문제 |
| H | 극히 부족 - 정치인 부적합 수준 |

정확히 {count}개의 데이터를 수집하고 **각각 평가(rating)**하세요.

다음 JSON 형식으로 반환:
```json
{{
  "items": [
    {{
      "item_num": 1,
      "data_title": "제목 (20자 이내)",
      "data_content": "내용 (100-300자, 사실 위주)",
      "data_source": "출처명",
      "source_url": "URL",
      "data_date": "YYYY-MM-DD",
      "rating": "A~H 중 하나",
      "rating_rationale": "평가 근거 (1-2문장)"
    }}
  ]
}}
```
"""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            time.sleep(1.5)
            content = call_ai_api(ai_name, prompt)

            # JSON 파싱 (extract_json 사용 - Claude 문제 해결)
            json_str = extract_json(content)
            if not json_str:
                raise json.JSONDecodeError("Empty response", "", 0)

            data = json.loads(json_str)
            items = data.get('items', [])

            # 유효성 검증
            valid_items = []
            for item in items:
                rating = item.get('rating', '').upper()
                if rating in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']:
                    item['rating'] = rating
                    item['source_type'] = source_type
                    valid_items.append(item)

            print(f"      → {len(valid_items)}개 수집+평가 완료")
            return valid_items[:count]

        except json.JSONDecodeError as e:
            print(f"      ⚠️ JSON 파싱 에러: {e}")
            if attempt < max_retries - 1:
                time.sleep(3)
            continue
        except Exception as e:
            error_str = str(e)
            if "rate" in error_str.lower() or "429" in error_str:
                print(f"      ⚠️ Rate limit, 60초 대기...")
                time.sleep(60)
                continue
            print(f"      ❌ 에러: {e}")
            if attempt < max_retries - 1:
                time.sleep(5)
            continue

    return []


def get_max_item_num(politician_id, category_name, ai_name):
    """현재 DB에 저장된 최대 item_num 조회"""
    try:
        response = supabase.table(TABLE_COLLECTED_DATA).select('item_num').eq(
            'politician_id', politician_id
        ).eq('category_name', category_name).eq('ai_name', ai_name).order('item_num', desc=True).limit(1).execute()

        if response.data:
            return response.data[0]['item_num']
        return 0
    except Exception:
        return 0


def get_category_count(politician_id, category_name, ai_name):
    """현재 DB에 저장된 카테고리 데이터 개수 조회"""
    try:
        response = supabase.table(TABLE_COLLECTED_DATA).select('collected_data_id', count='exact').eq(
            'politician_id', politician_id
        ).eq('category_name', category_name).eq('ai_name', ai_name).execute()
        return response.count if response.count else 0
    except Exception:
        return 0


def save_to_db(politician_id, category_name, ai_name, items):
    """DB에 저장 (rating 포함)"""
    if not items:
        return 0

    start_num = get_max_item_num(politician_id, category_name, ai_name) + 1
    dates = get_date_range()
    saved = 0

    for idx, item in enumerate(items):
        actual_item_num = start_num + idx

        try:
            data = {
                'politician_id': politician_id,
                'ai_name': ai_name,
                'category_name': category_name,
                'item_num': actual_item_num,
                'data_title': item.get('data_title', ''),
                'data_content': item.get('data_content', ''),
                'data_source': item.get('data_source', ''),
                'source_url': item.get('source_url', ''),
                'source_type': item.get('source_type', ''),
                'data_date': item.get('data_date', ''),
                'collection_date': datetime.now().isoformat(),
                # V27: rating 포함
                'rating': item.get('rating'),
                'rating_rationale': item.get('rating_rationale', ''),
                'evaluation_date': datetime.now().isoformat(),
                # 메타데이터
                'collection_version': 'V27.0',
                'official_date_start': dates['official_start'],
                'official_date_end': dates['official_end'],
                'public_date_start': dates['public_start'],
                'public_date_end': dates['public_end'],
            }
            supabase.table(TABLE_COLLECTED_DATA).insert(data).execute()
            saved += 1
        except Exception as e:
            print(f"      ❌ DB 저장 실패: {e}")

    return saved


def collect_category(politician_id, politician_name, ai_name, category_num):
    """카테고리별 50개 수집+평가"""
    cat_eng, cat_kor = CATEGORIES[category_num - 1]
    MAX_ROUNDS = 4

    print(f"\n  [{ai_name}] 카테고리 {category_num}: {cat_kor}")

    current_count = get_category_count(politician_id, cat_eng, ai_name)
    if current_count >= 50:
        print(f"    ✅ 이미 {current_count}개 완료")
        return

    for round_num in range(1, MAX_ROUNDS + 1):
        current_count = get_category_count(politician_id, cat_eng, ai_name)
        needed = 50 - current_count

        if needed <= 0:
            print(f"    ✅ 50개 달성!")
            break

        print(f"    라운드 {round_num}/{MAX_ROUNDS}: 현재 {current_count}개, {needed}개 필요")

        round_items = []

        if round_num == 1:
            # Phase 1: 부정 주제 10개
            neg_official = collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num, 'OFFICIAL', True, 5)
            neg_public = collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num, 'PUBLIC', True, 5)
            round_items.extend(neg_official)
            round_items.extend(neg_public)

            # Phase 2: 자유 평가 40개
            free_official = collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num, 'OFFICIAL', False, 20)
            free_public = collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num, 'PUBLIC', False, 20)
            round_items.extend(free_official)
            round_items.extend(free_public)
        else:
            # 추가 수집
            half = needed // 2
            add_official = collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num, 'OFFICIAL', False, half + (needed % 2))
            add_public = collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num, 'PUBLIC', False, half)
            round_items.extend(add_official)
            round_items.extend(add_public)

        if round_items:
            saved = save_to_db(politician_id, cat_eng, ai_name, round_items)
            print(f"    → 저장: {saved}개")

    final_count = get_category_count(politician_id, cat_eng, ai_name)
    status = "✅" if final_count >= 50 else "⚠️"
    print(f"    {status} 최종: {final_count}/50개")


def collect_all_categories(politician_id, politician_name, ai_name):
    """단일 AI로 전체 10개 카테고리 수집+평가"""
    dates = get_date_range()

    print(f"\n{'='*60}")
    print(f"V27.0 독립 방식 - {ai_name}")
    print(f"{'='*60}")
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"OFFICIAL: {dates['official_start']} ~ {dates['official_end']}")
    print(f"PUBLIC: {dates['public_start']} ~ {dates['public_end']}")
    print(f"{'='*60}")

    for i in range(1, 11):
        collect_category(politician_id, politician_name, ai_name, i)

    # 최종 상태
    print(f"\n{'='*60}")
    print(f"[{ai_name}] 최종 상태")
    print(f"{'='*60}")

    total = 0
    for cat_eng, cat_kor in CATEGORIES:
        count = get_category_count(politician_id, cat_eng, ai_name)
        total += count
        status = "✅" if count >= 50 else "⚠️"
        print(f"  {status} {cat_kor}: {count}/50개")

    print(f"\n  총 {total}/500개")
    print(f"{'='*60}")


def collect_all_ais(politician_id, politician_name, parallel=False):
    """4개 AI 전체 실행"""
    ai_list = ["Claude", "ChatGPT", "Grok", "Gemini"]

    print("="*60)
    print("V27.0 독립 방식 - 4개 AI 전체")
    print("="*60)
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"병렬 실행: {'예' if parallel else '아니오'}")
    print("="*60)

    if parallel:
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                executor.submit(collect_all_categories, politician_id, politician_name, ai): ai
                for ai in ai_list
            }

            for future in as_completed(futures):
                ai = futures[future]
                try:
                    future.result()
                    print(f"\n✅ {ai} 완료!")
                except Exception as e:
                    print(f"\n❌ {ai} 실패: {e}")
    else:
        for ai in ai_list:
            collect_all_categories(politician_id, politician_name, ai)

    # 최종 상태
    print("\n" + "="*60)
    print("전체 상태")
    print("="*60)

    for ai in ai_list:
        total = 0
        for cat_eng, cat_kor in CATEGORIES:
            count = get_category_count(politician_id, cat_eng, ai)
            total += count
        status = "✅" if total >= 500 else "⚠️"
        print(f"  {status} {ai}: {total}/500개")

    print("\n" + "="*60)
    print("V27.0 수집+평가 완료!")
    print("다음 단계: python calculate_v27_scores.py --politician_id=...")
    print("="*60)


def main():
    parser = argparse.ArgumentParser(description='V27.0 독립 방식 수집+평가')
    parser.add_argument('--politician_id', type=str, required=True, help='정치인 ID')
    parser.add_argument('--politician_name', type=str, required=True, help='정치인 이름')
    parser.add_argument('--ai', type=str, default='all', help='실행할 AI (Claude, ChatGPT, Grok, Gemini, all)')
    parser.add_argument('--parallel', action='store_true', help='병렬 실행')
    args = parser.parse_args()

    # ⚠️ 정치인 ID 사전 등록 확인 (필수!)
    exists, db_name = check_politician_exists(args.politician_id)
    if not exists:
        print("="*60)
        print("❌ 오류: 정치인 ID가 DB에 등록되어 있지 않습니다!")
        print("="*60)
        print(f"politician_id: {args.politician_id}")
        print(f"\n먼저 politicians 테이블에 등록해주세요.")
        print("="*60)
        sys.exit(1)

    print(f"✅ 정치인 확인: {db_name} (ID: {args.politician_id})")

    if args.ai.lower() == 'all':
        collect_all_ais(args.politician_id, args.politician_name, args.parallel)
    else:
        collect_all_categories(args.politician_id, args.politician_name, args.ai)


if __name__ == "__main__":
    main()
