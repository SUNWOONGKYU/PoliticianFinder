# -*- coding: utf-8 -*-
"""
V26.0 풀링 방식 수집 스크립트 (1단계: 수집 전용)

핵심 원칙: "모두가 찾은 것을 각자가 평가"

[1단계: 수집] - 이 스크립트
- 4개 AI가 각각 50개 수집 (rating 없이!)
- 카테고리당 200개 풀 생성
- 중복 제거 안 함, 가중치 계산 안 함

[2단계: 평가] - evaluate_v26_pool.py
- 200개 풀에 대해 각 AI가 독립 평가
- 타이밍 분리 = 객관성 확보

사용법:
    # 단일 AI 수집
    python collect_v26_pool.py --politician_id=62e7b453 --politician_name="오세훈" --ai=Claude

    # 전체 4개 AI 수집
    python collect_v26_pool.py --politician_id=62e7b453 --politician_name="오세훈" --ai=all

    # 병렬 실행 (빠름)
    python collect_v26_pool.py --politician_id=62e7b453 --politician_name="오세훈" --ai=all --parallel
"""

import os
import sys
import json
import argparse
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict
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

# V26.0 테이블명
TABLE_COLLECTED_DATA = "collected_data_v26"

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

# AI 모델 설정 (V26.1 - 비용 최적화)
# Claude: claude-3-5-haiku → claude-3-haiku (69% 절감)
# Grok: grok-3-mini → grok-4-fast (더 저렴)
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
    """V26.0 기간 제한 계산"""
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


def get_date_restriction_prompt(source_type):
    """V26.0 기간 제한 프롬프트 생성"""
    dates = get_date_range()

    if source_type == "OFFICIAL":
        return f"""
⚠️ **V26.0 기간 제한 (OFFICIAL 데이터)**:
- 수집 기간: {dates['official_start']} ~ {dates['official_end']} (최근 4년)
- 위 기간 외의 데이터는 수집하지 마세요.
"""
    else:
        return f"""
⚠️ **V26.0 기간 제한 (PUBLIC 데이터)**:
- 수집 기간: {dates['public_start']} ~ {dates['public_end']} (최근 1년)
- 위 기간 외의 데이터는 수집하지 마세요.
"""


def get_category_description(category_num):
    """카테고리 설명 반환 - V24와 동일한 상세 설명 (영문 정의 포함)"""
    descriptions = {
        1: """전문성 (Expertise)
【영문 정의】The level of knowledge, skills, and experience required to perform duties effectively
【한글 정의】정책 전문성, 행정 경험, 분야별 전문 지식

[O] 전문성에 해당: 정책 수립 능력, 전문 지식, 학력/경력, 행정 경험, 분야별 전문성, 법안 발의
[X] 전문성 아님: 조직 관리/위기 대응(리더십2), 혁신 아이디어(비전3), 약속 이행(책임성6)""",

        2: """리더십 (Leadership)
【영문 정의】The ability to effectively lead organizations and people to achieve goals
【한글 정의】조직 관리 능력, 위기 대응, 의사결정 능력

[O] 리더십에 해당: 조직 관리, 팀 구성, 위기 대응, 갈등 조정, 의사결정, 당내 리더십, 정치적 영향력
[X] 리더십 아님: 정책 전문성(전문성1), 장기 계획(비전3), 공약 이행(책임성6), 시민 소통(소통8)""",

        3: """비전 (Vision)
【영문 정의】The ability to predict the future and present long-term goals
【한글 정의】장기적 계획, 혁신성, 미래 전망

[O] 비전에 해당: 장기 발전 계획, 미래 전략, 혁신 정책, 창의성, 변화 주도, 개혁 의지
[X] 비전 아님: 현재 정책 능력(전문성1), 조직 혁신(리더십2), 단기 공약 이행(책임성6)""",

        4: """청렴성 (Integrity)
【영문 정의】The quality of not engaging in financial or material corruption
【한글 정의】부패 방지, 윤리 준수, 이해충돌 회피

[O] 청렴성에 해당: 금품/뇌물 수수, 횡령, 배임, 비리, 공직자 윤리 위반, 행동강령 위반, 이해충돌, 겸직 문제, 사적 이익 추구, 불법 정치자금, 선거법 위반, 직권 남용, 부적절한 청탁
[X] 청렴성 아님: 정치적 중립성(책임성6), 정치적 편향성(윤리성5), 당내 갈등(리더십2), 정책 전문성(전문성1), 당적 변경(책임성6), 정보 공개(투명성7)""",

        5: """윤리성 (Ethics)
【영문 정의】The quality of maintaining social norms and moral dignity
【한글 정의】도덕성, 사회적 책임, 공정성

[O] 윤리성에 해당: 도덕성, 가치관, 인격, 사회적 책임, 공익 의식, 공정성, 차별 없는 태도, 성평등, 인권 존중, 발언의 적절성, 품위
[X] 윤리성 아님: 금품 수수(청렴성4), 공약 불이행(책임성6), 정보 은폐(투명성7), 소외계층 정책(공익성10)""",

        6: """책임성 (Accountability)
【영문 정의】The quality of taking responsibility for promises and performance
【한글 정의】약속 이행, 성과 책임, 투명한 보고

[O] 책임성에 해당: 공약 이행, 약속 준수, 성과 책임, 결과 책임, 잘못 인정, 사과, 정치적 책임, 인사 책임, 법적 책임 수용, 정치적 중립성 유지
[X] 책임성 아님: 부패/비리(청렴성4), 정보 공개(투명성7), 민원 처리(대응성9), 정책 능력(전문성1)""",

        7: """투명성 (Transparency)
【영문 정의】The quality of disclosing information and decision-making processes
【한글 정의】정보 공개, 소통 개방성, 설명 책임

[O] 투명성에 해당: 정보 공개, 자료 공개, 의사결정 과정 공개, 정치자금 공개, 설명 책임, 회의록/기록 공개, 투명한 의사결정 절차
[X] 투명성 아님: 금품 수수(청렴성4), 공약 이행 보고(책임성6), SNS 소통(소통8), 민원 응답(대응성9)""",

        8: """소통능력 (Communication)
【영문 정의】The ability to effectively convey messages to citizens
【한글 정의】시민 소통, 언론 대응, 정책 홍보

[O] 소통능력에 해당: 시민 소통, 경청, 언론 대응, 인터뷰, 정책 설명, 홍보, SNS 활용, 온라인 소통, 의견 수렴
[X] 소통능력 아님: 정보 공개(투명성7), 민원 처리(대응성9), 조직 내 소통(리더십2), 공약 설명(책임성6)""",

        9: """대응성 (Responsiveness)
【영문 정의】The ability to respond quickly and appropriately to citizens' needs
【한글 정의】민원 대응, 신속한 조치, 현장 중심

[O] 대응성에 해당: 민원 처리, 민원 응답, 신속한 조치, 위기 대응 속도, 현장 방문, 현장 중심 행정, 즉각적 문제 해결, 시민 요구 반영
[X] 대응성 아님: 위기 관리 능력(리더십2), 정책 소통(소통8), 정보 공개(투명성7), 약속 이행(책임성6)""",

        10: """공익성 (PublicInterest)
【영문 정의】The attitude of prioritizing public interest over private interest
【한글 정의】공공 이익 우선, 사회적 형평성, 약자 보호

[O] 공익성에 해당: 공공 이익 우선, 사익 배제, 사회적 형평성, 불평등 해소, 약자/소외계층 보호, 복지 정책, 사회안전망, 지역 균형 발전
[X] 공익성 아님: 사적 이익 추구(청렴성4), 정책 전문성(전문성1), 공약 이행(책임성6), 도덕성(윤리성5)"""
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
    """정치인 프로필을 프롬프트용 텍스트로 포맷 - V24와 동일"""
    profile = get_politician_profile(politician_id)

    if not profile:
        return f"**대상 정치인**: {politician_name}"

    age_info = ""
    if profile.get('birth_date'):
        birth_year = profile['birth_date'][:4]
        age_info = f", {birth_year}년생"

    profile_text = f"""**대상 정치인**: {politician_name}

**정치인 기본 정보** (동명이인 주의):
- 이름: {profile.get('name', politician_name)}
- 신분: {profile.get('identity', profile.get('status', 'N/A'))}
- 직책: {profile.get('title', profile.get('position', 'N/A'))}
- 정당: {profile.get('party', 'N/A')}
- 지역: {profile.get('region', 'N/A')}
- 성별: {profile.get('gender', 'N/A')}{age_info}

⚠️ **중요**: 반드시 위 정보와 일치하는 "{politician_name}"의 데이터만 수집하세요. 동명이인이나 다른 지역/직책의 인물과 혼동하지 마세요."""

    if politician_name == "정원오":
        profile_text += "\n\n🚨 **특별 주의사항**: 이 정치인은 서울 성동구청장이며, 성남시와는 전혀 무관합니다. 성남 대장동 개발 사건은 이재명 전 성남시장과 관련된 사건으로, 정원오와는 아무 관련이 없습니다. 성남시 관련 내용은 절대 수집하지 마세요."

    return profile_text


def call_ai_api(ai_name, prompt):
    """AI API 호출 (통합)"""
    client = init_ai_client(ai_name)
    config = AI_CONFIGS[ai_name]

    try:
        if ai_name == "Claude":
            response = client.messages.create(
                model=config['model'],
                max_tokens=4096,
                temperature=1.0,
                messages=[{"role": "user", "content": prompt}]
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


def collect_batch_no_rating(politician_id, politician_name, ai_name, category_num,
                            source_type, is_negative=False, count=5, attempt=1, max_attempts=5):
    """
    데이터 배치 수집 (rating 없이!)

    풀링 방식 핵심: 수집 단계에서는 rating을 부여하지 않음
    평가는 evaluate_v26_pool.py에서 별도 세션으로 수행
    """
    cat_eng, cat_kor = CATEGORIES[category_num - 1]
    source_desc = "언론 보도" if source_type == "PUBLIC" else "공공기록/공식자료"
    topic_type = "부정 주제" if is_negative else "자유 평가"

    print(f"\n  [{ai_name}] {topic_type} {count}개 - {source_desc} (시도 {attempt}/{max_attempts})")

    cat_desc = get_category_description(category_num)
    date_restriction = get_date_restriction_prompt(source_type)
    profile_info = format_politician_profile(politician_id, politician_name)

    negative_instruction = """
⚠️ **필수 - 부정 주제 수집 (전체의 최소 20% 보장 목적)**
- 이 수집은 객관적 평가를 위해 부정적 데이터를 확보하는 단계입니다
- 반드시 **부정적인 측면만** 수집하세요: 논란, 비판, 문제점, 실패 사례, 스캔들, 의혹
- AI는 부정적 내용을 회피하려는 경향이 있지만, 공정한 평가를 위해 부정적 데이터는 필수입니다
- 긍정적이거나 중립적인 내용은 이 단계에서 수집하지 마세요
""" if is_negative else """
**작업**: 실제 행적, 정책, 성과를 조사하여 수집하세요.
- 긍정/부정 비율을 강제하지 마세요
- 단, 전체 50개 중 최소 20%는 부정적 주제가 포함되어야 합니다 (별도 수집됨)
"""

    source_instruction = "언론 보도만 사용" if source_type == "PUBLIC" else "공식 기록만 사용"

    # ⚠️ 핵심 변경: rating 필드 제외!
    prompt = f"""당신은 정치인 관련 뉴스/데이터 수집 AI입니다.

**⚠️ 중요 알림**: 이 작업은 목표 미달 시 최대 4차례까지 재수집됩니다.
신중하게 정확한 데이터를 수집하여 재수집이 필요하지 않도록 하세요.
정확히 {count}개의 데이터를 반환해야 합니다.

{profile_info}

{date_restriction}

{negative_instruction}

**출처 제한**: {source_instruction}
**평가 카테고리**: {cat_kor} ({cat_eng}) - {cat_desc}

⚠️ **중요**: 평가(rating)는 하지 마세요! 데이터만 수집합니다.
평가는 별도 단계에서 진행됩니다.

다음 JSON 형식으로 정확히 {count}개의 항목을 반환하세요:
```json
{{
  "items": [
    {{
      "item_num": 1,
      "data_title": "뉴스/데이터 제목",
      "data_content": "상세 내용 (사실 위주)",
      "data_source": "출처 (언론사/기관명)",
      "source_url": "URL",
      "data_date": "YYYY-MM-DD 형식의 날짜"
    }}
  ]
}}
```

⚠️ rating 필드를 포함하지 마세요!
"""

    max_api_retries = 3
    for api_attempt in range(max_api_retries):
        try:
            time.sleep(1.5)

            content = call_ai_api(ai_name, prompt)

            # JSON 파싱
            json_start = content.find('```json')
            json_end = content.find('```', json_start + 7)

            if json_start != -1 and json_end != -1:
                json_str = content[json_start + 7:json_end].strip()
            else:
                json_str = content.strip()

            data = json.loads(json_str)
            items = data.get('items', [])

            print(f"    → API 응답: {len(items)}개 항목")

            # rating 필드가 있으면 제거
            valid_items = []
            for item in items:
                # rating 제거 (혹시 있으면)
                item.pop('rating', None)
                item.pop('rating_rationale', None)

                item['source_type'] = source_type
                item['collector_ai'] = ai_name
                valid_items.append(item)

            print(f"    ✅ 유효한 항목: {len(valid_items)}개")

            if len(valid_items) < count and attempt < max_attempts:
                additional = collect_batch_no_rating(
                    politician_id, politician_name, ai_name, category_num, source_type, is_negative,
                    count - len(valid_items), attempt + 1, max_attempts
                )
                valid_items.extend(additional)

            return valid_items[:count]

        except json.JSONDecodeError as e:
            print(f"    ⚠️ JSON 파싱 에러: {e}")
            if api_attempt < max_api_retries - 1:
                time.sleep(3)
            continue
        except Exception as e:
            error_str = str(e)
            if "ResourceExhausted" in error_str or "429" in error_str or "rate" in error_str.lower():
                print(f"    ⚠️ Rate limit 도달, 60초 대기...")
                time.sleep(60)
                continue
            print(f"    ❌ 에러: {e}")
            if api_attempt < max_api_retries - 1:
                time.sleep(5)
                continue
            return []

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


def save_to_db(politician_id, category_name, ai_name, items):
    """DB에 저장 (rating = NULL)"""
    if not items:
        return 0

    start_num = get_max_item_num(politician_id, category_name, ai_name) + 1

    if start_num > 60:
        return 0

    dates = get_date_range()
    saved = 0

    for idx, item in enumerate(items):
        actual_item_num = start_num + idx
        if actual_item_num > 60:
            break

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
                'collection_date': datetime.now().isoformat(),
                # ⚠️ 핵심: rating은 NULL!
                'rating': None,
                'rating_rationale': None,
                'source_type': item.get('source_type', ''),
                # V26.0 추가 필드
                'collection_version': 'V26.0',
                'official_date_start': dates['official_start'],
                'official_date_end': dates['official_end'],
                'public_date_start': dates['public_start'],
                'public_date_end': dates['public_end'],
            }
            supabase.table(TABLE_COLLECTED_DATA).insert(data).execute()
            saved += 1
        except Exception as e:
            print(f"    ❌ DB 저장 실패: {e}")

    return saved


def get_category_count(politician_id, category_name, ai_name):
    """현재 DB에 저장된 카테고리 데이터 개수 조회"""
    try:
        response = supabase.table(TABLE_COLLECTED_DATA).select('collected_data_id', count='exact').eq(
            'politician_id', politician_id
        ).eq('category_name', category_name).eq('ai_name', ai_name).execute()
        return response.count if response.count else 0
    except Exception:
        return 0


def collect_category(politician_id, politician_name, ai_name, category_num):
    """카테고리별 50개 수집 (rating 없이) - 50개 달성까지 최대 4회 반복"""
    cat_eng, cat_kor = CATEGORIES[category_num - 1]
    MAX_ROUNDS = 4  # 최대 4회 반복

    print(f"\n{'='*60}")
    print(f"[{ai_name}] 카테고리 {category_num}: {cat_kor}")
    print(f"{'='*60}")

    current_count = get_category_count(politician_id, cat_eng, ai_name)
    if current_count >= 50:
        print(f"  ✅ 이미 {current_count}개 수집 완료")
        return []

    all_items = []

    for round_num in range(1, MAX_ROUNDS + 1):
        current_count = get_category_count(politician_id, cat_eng, ai_name)
        needed = 50 - current_count

        if needed <= 0:
            print(f"  ✅ 50개 달성! (현재 {current_count}개)")
            break

        print(f"\n  [라운드 {round_num}/{MAX_ROUNDS}] 현재 {current_count}개, {needed}개 필요")

        round_items = []

        if round_num == 1:
            # 첫 라운드: Phase 1 (부정 10개) + Phase 2 (자유 40개)
            # Phase 1: 부정 주제 10개 (20% 보장)
            print(f"    Phase 1: 부정 주제 10개 수집")
            neg_official = collect_batch_no_rating(politician_id, politician_name, ai_name, category_num, 'OFFICIAL', True, 5)
            neg_public = collect_batch_no_rating(politician_id, politician_name, ai_name, category_num, 'PUBLIC', True, 5)
            round_items.extend(neg_official)
            round_items.extend(neg_public)

            # Phase 2: 자유 평가 40개 (Claude는 배치 크기 10으로 제한)
            print(f"    Phase 2: 자유 평가 40개 수집")
            batch_size = 10 if ai_name == "Claude" else 20
            if ai_name == "Claude":
                # Claude: 10개씩 4번
                free_official_1 = collect_batch_no_rating(politician_id, politician_name, ai_name, category_num, 'OFFICIAL', False, 10)
                free_official_2 = collect_batch_no_rating(politician_id, politician_name, ai_name, category_num, 'OFFICIAL', False, 10)
                free_public_1 = collect_batch_no_rating(politician_id, politician_name, ai_name, category_num, 'PUBLIC', False, 10)
                free_public_2 = collect_batch_no_rating(politician_id, politician_name, ai_name, category_num, 'PUBLIC', False, 10)
                free_official = free_official_1 + free_official_2
                free_public = free_public_1 + free_public_2
            else:
                free_official = collect_batch_no_rating(politician_id, politician_name, ai_name, category_num, 'OFFICIAL', False, 20)
                free_public = collect_batch_no_rating(politician_id, politician_name, ai_name, category_num, 'PUBLIC', False, 20)
            round_items.extend(free_official)
            round_items.extend(free_public)
        else:
            # 2회차 이후: 부족분만 추가 수집 (부정 20% 비율 유지)
            neg_needed = max(int(needed * 0.2), 2)  # 부정 20%, 최소 2개
            free_needed = needed - neg_needed

            print(f"    추가 수집: 부정 {neg_needed}개 + 자유 {free_needed}개")

            # 부정 주제 추가
            if neg_needed > 0:
                neg_items = collect_batch_no_rating(politician_id, politician_name, ai_name, category_num, 'OFFICIAL', True, neg_needed)
                round_items.extend(neg_items)

            # 자유 평가 추가
            if free_needed > 0:
                half = free_needed // 2
                free_official = collect_batch_no_rating(politician_id, politician_name, ai_name, category_num, 'OFFICIAL', False, half + (free_needed % 2))
                free_public = collect_batch_no_rating(politician_id, politician_name, ai_name, category_num, 'PUBLIC', False, half)
                round_items.extend(free_official)
                round_items.extend(free_public)

        # 이번 라운드 저장
        if round_items:
            saved = save_to_db(politician_id, cat_eng, ai_name, round_items)
            print(f"    → 라운드 {round_num} 저장: {saved}개")
            all_items.extend(round_items[:saved])

    # 최종 확인
    final_count = get_category_count(politician_id, cat_eng, ai_name)
    status = "✅" if final_count >= 50 else "⚠️"
    print(f"\n  {status} 최종: {final_count}/50개")

    return all_items


def collect_category_group(politician_id, politician_name, ai_name, category_start, category_end):
    """카테고리 그룹 병렬 수집 - V24처럼 5개씩 병렬"""
    print(f"\n{'='*60}")
    print(f"[{ai_name}] 카테고리 그룹 {category_start}~{category_end} 병렬 수집 시작")
    print(f"{'='*60}\n")

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {}

        for i in range(category_start, category_end + 1):
            future = executor.submit(collect_category, politician_id, politician_name, ai_name, i)
            futures[future] = i

        for future in as_completed(futures):
            category_num = futures[future]
            cat_eng, cat_kor = CATEGORIES[category_num - 1]

            try:
                future.result()
                print(f"✅ [{ai_name}] 카테고리 {category_num} ({cat_kor}) 완료")
            except Exception as e:
                print(f"❌ [{ai_name}] 카테고리 {category_num} ({cat_kor}) 실패: {e}")

    print(f"\n{'='*60}")
    print(f"[{ai_name}] 카테고리 그룹 {category_start}~{category_end} 완료")
    print(f"{'='*60}\n")


def collect_all_categories(politician_id, politician_name, ai_name):
    """단일 AI로 전체 카테고리 수집 - 5개씩 병렬, 각 카테고리에서 50개 달성까지 재시도"""
    dates = get_date_range()

    print("="*60)
    print(f"V26.0 풀링 수집 - {ai_name} (5개씩 병렬)")
    print("="*60)
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"AI: {ai_name}")
    print(f"OFFICIAL: {dates['official_start']} ~ {dates['official_end']}")
    print(f"PUBLIC: {dates['public_start']} ~ {dates['public_end']}")
    print(f"병렬 처리: 카테고리 5개씩")
    print(f"카테고리별 재시도: 50개 달성까지 최대 4회")
    print(f"⚠️ rating 없이 수집 (평가는 별도 단계에서)")
    print("="*60)

    # 5개씩 병렬 수집 (각 카테고리에서 50개 달성까지 자체 재시도)
    collect_category_group(politician_id, politician_name, ai_name, 1, 5)
    collect_category_group(politician_id, politician_name, ai_name, 6, 10)

    # 최종 상태 확인
    print(f"\n{'='*60}")
    print(f"📊 [{ai_name}] 최종 수집 상태")
    print(f"{'='*60}\n")

    total = 0
    incomplete = 0
    for cat_eng, cat_kor in CATEGORIES:
        count = get_category_count(politician_id, cat_eng, ai_name)
        total += count
        if count < 50:
            print(f"⚠️  {cat_kor}: {count}/50개")
            incomplete += 1
        else:
            print(f"✅ {cat_kor}: {count}/50개")

    print(f"\n총 {total}/500개")
    if incomplete == 0:
        print(f"✅ [{ai_name}] 모든 카테고리 50개 달성!")
    else:
        print(f"⚠️  [{ai_name}] {incomplete}개 카테고리 미달")

    print(f"\n✅ {ai_name} 수집 완료!")


def collect_all_ais(politician_id, politician_name, parallel=False):
    """4개 AI 전체 수집"""
    ai_list = ["Claude", "ChatGPT", "Grok", "Gemini"]

    print("="*60)
    print(f"V26.0 풀링 수집 - 4개 AI 전체")
    print("="*60)
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"AI: {', '.join(ai_list)}")
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
                    print(f"\n✅ {ai} 수집 완료!")
                except Exception as e:
                    print(f"\n❌ {ai} 수집 실패: {e}")
    else:
        for ai in ai_list:
            collect_all_categories(politician_id, politician_name, ai)

    # 풀 상태 확인
    print("\n" + "="*60)
    print("풀 상태 확인")
    print("="*60)

    for cat_eng, cat_kor in CATEGORIES:
        total = 0
        counts = []
        for ai in ai_list:
            count = get_category_count(politician_id, cat_eng, ai)
            counts.append(f"{ai}: {count}")
            total += count

        status = "✅" if total >= 200 else "⚠️"
        print(f"{status} {cat_kor}: {total}/200 ({', '.join(counts)})")

    print("\n" + "="*60)
    print("풀링 수집 완료!")
    print("다음 단계: python evaluate_v26_pool.py --politician_id=...")
    print("="*60)


def main():
    parser = argparse.ArgumentParser(description='V26.0 풀링 방식 수집 (rating 없이, 자동 재수집)')
    parser.add_argument('--politician_id', type=str, required=True, help='정치인 ID')
    parser.add_argument('--politician_name', type=str, required=True, help='정치인 이름')
    parser.add_argument('--ai', type=str, default='all',
                        help='수집할 AI (Claude, ChatGPT, Grok, Gemini, all)')
    parser.add_argument('--parallel', action='store_true', help='병렬 실행')
    args = parser.parse_args()

    if args.ai.lower() == 'all':
        collect_all_ais(args.politician_id, args.politician_name, args.parallel)
    else:
        collect_all_categories(args.politician_id, args.politician_name, args.ai)


if __name__ == "__main__":
    main()
