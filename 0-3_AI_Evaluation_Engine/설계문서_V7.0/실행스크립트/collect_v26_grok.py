# -*- coding: utf-8 -*-
"""
V26.0 Grok 데이터 수집
- 기간 제한: OFFICIAL 4년, PUBLIC 1년
- AI: Grok (grok-3-mini)
- 카테고리 5개씩 병렬 처리
- 목표 미달 시 최대 4회 자동 재수집
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
from openai import OpenAI  # Grok uses OpenAI-compatible API

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv()

# Clients
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# Grok API (xAI) - OpenAI compatible
client = OpenAI(
    api_key=os.getenv('XAI_API_KEY'),
    base_url="https://api.x.ai/v1"
)

# V26.0 설정
MODEL = "grok-3-mini"
AI_NAME = "Grok"  # DB 저장용 (모델명 아닌 시스템명)

# V26.0 테이블명 (기존 테이블과 분리)
TABLE_COLLECTED_DATA = "collected_data_v26"

# V26.0 알파벳 등급 시스템 (8단계)
ALPHABET_GRADES = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}
VALID_RATINGS = [8, 6, 4, 2, -2, -4, -6, -8]

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


def collect_batch(politician_id, politician_name, category_num, source_type, is_negative=False,
                  count=5, attempt=1, max_attempts=5):
    """데이터 배치 수집"""
    cat_eng, cat_kor = CATEGORIES[category_num - 1]
    source_desc = "언론 보도" if source_type == "PUBLIC" else "공공기록/공식자료"
    topic_type = "부정 주제" if is_negative else "자유 평가"

    print(f"\n[{topic_type} {count}개 - {source_desc}] {cat_kor} (시도 {attempt}/{max_attempts})")

    cat_desc = get_category_description(category_num)
    date_restriction = get_date_restriction_prompt(source_type)
    profile_info = format_politician_profile(politician_id, politician_name)

    negative_instruction = """
**작업**: 부정적인 측면, 논란, 비판, 문제점을 주제로 수집하되 객관적으로 평가하세요.
""" if is_negative else """
**작업**: 실제 행적, 정책, 성과를 조사하여 수집하세요. 긍정/부정 비율을 강제하지 마세요.
"""

    source_instruction = "언론 보도만 사용" if source_type == "PUBLIC" else "공식 기록만 사용"

    prompt = f"""당신은 정치인 평가 데이터 수집 AI입니다.

{profile_info}

{date_restriction}

{negative_instruction}

**출처 제한**: {source_instruction}
**평가 카테고리**: {cat_kor} ({cat_eng})
**카테고리 평가 기준**: {cat_desc}

**등급 체계** (V26.0 - 8단계):
- A: 매우 우수 (가장 긍정적)
- B: 우수
- C: 양호
- D: 보통
- E: 미흡
- F: 부족
- G: 매우 부족
- H: 심각한 문제 (가장 부정적)

**중요**: 부정적 주제를 다루되, 실제 심각도에 따라 **모든 등급(A~H) 사용 가능**합니다.

다음 JSON 형식으로 정확히 {count}개의 항목을 반환하세요:
```json
{{
  "items": [
    {{
      "item_num": 1,
      "data_title": "항목 제목",
      "data_content": "상세 내용",
      "data_source": "출처",
      "source_url": "URL",
      "rating": "A",
      "rating_rationale": "평가 근거"
    }}
  ]
}}
```
"""

    max_api_retries = 3
    for api_attempt in range(max_api_retries):
        try:
            time.sleep(1.5)

            response = client.chat.completions.create(
                model=MODEL,
                max_tokens=8000,
                temperature=1.0,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.choices[0].message.content

            json_start = content.find('```json')
            json_end = content.find('```', json_start + 7)

            if json_start != -1 and json_end != -1:
                json_str = content[json_start + 7:json_end].strip()
            else:
                json_str = content.strip()

            data = json.loads(json_str)
            items = data.get('items', [])

            print(f"  → API 응답: {len(items)}개 항목")

            valid_items = []
            for idx, item in enumerate(items, 1):
                raw_rating = item.get('rating')
                alphabet_rating = str(raw_rating).strip().upper() if raw_rating else ''

                if alphabet_rating not in ALPHABET_GRADES:
                    continue

                item['rating'] = alphabet_rating
                item['source_type'] = source_type
                valid_items.append(item)

            print(f"  ✅ 유효한 항목: {len(valid_items)}개")

            if len(valid_items) < count and attempt < max_attempts:
                additional = collect_batch(
                    politician_id, politician_name, category_num, source_type, is_negative,
                    count - len(valid_items), attempt + 1, max_attempts
                )
                valid_items.extend(additional)

            return valid_items[:count]

        except json.JSONDecodeError as e:
            print(f"  ⚠️ JSON 파싱 에러: {e}")
            if api_attempt < max_api_retries - 1:
                time.sleep(3)
            continue
        except Exception as e:
            print(f"  ❌ 에러: {e}")
            if api_attempt < max_api_retries - 1:
                time.sleep(5)
                continue
            return []

    return []


def get_max_item_num(politician_id, category_name, ai_name):
    """현재 DB에 저장된 최대 item_num 조회 (V26 테이블)"""
    try:
        response = supabase.table(TABLE_COLLECTED_DATA).select('item_num').eq(
            'politician_id', politician_id
        ).eq('category_name', category_name).eq('ai_name', ai_name).order('item_num', desc=True).limit(1).execute()

        if response.data:
            return response.data[0]['item_num']
        return 0
    except Exception:
        return 0


def save_to_db(politician_id, category_name, items):
    """DB에 저장 (V26 테이블)"""
    if not items:
        return 0

    start_num = get_max_item_num(politician_id, category_name, AI_NAME) + 1

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
                'ai_name': AI_NAME,
                'category_name': category_name,
                'item_num': actual_item_num,
                'data_title': item['data_title'],
                'data_content': item['data_content'],
                'data_source': item['data_source'],
                'source_url': item.get('source_url', ''),
                'collection_date': datetime.now().isoformat(),
                'rating': item['rating'],
                'rating_rationale': item['rating_rationale'],
                'source_type': item['source_type'],
                'collection_version': 'V26.0',
                'official_date_start': dates['official_start'],
                'official_date_end': dates['official_end'],
                'public_date_start': dates['public_start'],
                'public_date_end': dates['public_end'],
            }
            supabase.table(TABLE_COLLECTED_DATA).insert(data).execute()
            saved += 1
        except Exception as e:
            print(f"  ❌ DB 저장 실패: {e}")

    return saved


def get_category_count(politician_id, category_name, ai_name):
    """현재 DB에 저장된 카테고리 데이터 개수 조회 (V26 테이블)"""
    try:
        response = supabase.table(TABLE_COLLECTED_DATA).select('collected_data_id', count='exact').eq(
            'politician_id', politician_id
        ).eq('category_name', category_name).eq('ai_name', ai_name).execute()
        return response.count if response.count else 0
    except Exception:
        return 0


def collect_category(politician_id, politician_name, category_num):
    """카테고리별 50개 수집"""
    cat_eng, cat_kor = CATEGORIES[category_num - 1]

    print(f"\n{'='*60}")
    print(f"카테고리 {category_num}: {cat_kor} - AI: {AI_NAME}")
    print(f"{'='*60}")

    current_count = get_category_count(politician_id, cat_eng, AI_NAME)
    if current_count >= 50:
        print(f"  ✅ 이미 {current_count}개 수집 완료")
        return []

    all_items = []

    # Phase 1: 부정 주제 10개
    neg_official = collect_batch(politician_id, politician_name, category_num, 'OFFICIAL', True, 5)
    neg_public = collect_batch(politician_id, politician_name, category_num, 'PUBLIC', True, 5)
    all_items.extend(neg_official)
    all_items.extend(neg_public)

    # Phase 2: 자유 평가 40개
    free_official = collect_batch(politician_id, politician_name, category_num, 'OFFICIAL', False, 20)
    free_public = collect_batch(politician_id, politician_name, category_num, 'PUBLIC', False, 20)
    all_items.extend(free_official)
    all_items.extend(free_public)

    total = len(all_items)
    if total > 60:
        all_items = all_items[:60]
        total = 60

    print(f"\n  총 수집: {total}개")

    saved = save_to_db(politician_id, cat_eng, all_items)
    print(f"  DB 저장: {saved}개")

    return all_items


def collect_category_group(politician_id, politician_name, category_start, category_end):
    """카테고리 그룹 병렬 수집"""
    print(f"\n카테고리 {category_start}~{category_end} 병렬 수집 ({AI_NAME})")

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(collect_category, politician_id, politician_name, i): i
                   for i in range(category_start, category_end + 1)}

        for future in as_completed(futures):
            cat_num = futures[future]
            try:
                future.result()
                print(f"✅ 카테고리 {cat_num} 완료")
            except Exception as e:
                print(f"❌ 카테고리 {cat_num} 실패: {e}")


def check_collection_status(politician_id, ai_name):
    """현재 수집 상태 확인 (V26 테이블)"""
    response = supabase.table(TABLE_COLLECTED_DATA).select('category_name').eq(
        'politician_id', politician_id
    ).eq('ai_name', ai_name).execute()

    if not response.data:
        return {}

    category_counts = defaultdict(int)
    for item in response.data:
        category_counts[item['category_name']] += 1

    return dict(category_counts)


def collect_all_parallel(politician_id, politician_name, max_retries=4):
    """전체 수집"""
    dates = get_date_range()

    print("="*60)
    print(f"V26.0 {AI_NAME} 데이터 수집")
    print("="*60)
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"AI: {AI_NAME} (모델: {MODEL})")
    print(f"OFFICIAL: {dates['official_start']} ~ {dates['official_end']}")
    print(f"PUBLIC: {dates['public_start']} ~ {dates['public_end']}")
    print("="*60)

    retry_count = 0

    while retry_count <= max_retries:
        if retry_count > 0:
            print(f"\n🔄 재수집 {retry_count}회차")

        collect_category_group(politician_id, politician_name, 1, 5)
        collect_category_group(politician_id, politician_name, 6, 10)

        category_counts = check_collection_status(politician_id, AI_NAME)

        incomplete = [(i, cat[0], cat[1], category_counts.get(cat[0], 0))
                      for i, cat in enumerate(CATEGORIES, 1)
                      if category_counts.get(cat[0], 0) < 50]

        if not incomplete:
            print("\n✅ 모든 카테고리 완료!")
            break

        if retry_count >= max_retries:
            print(f"\n⚠️ 최대 재수집 횟수 도달. 미달: {len(incomplete)}개")
            break

        retry_count += 1

    print(f"\n✅ {AI_NAME} 수집 완료!")


def main():
    parser = argparse.ArgumentParser(description=f'V26.0 {AI_NAME} 데이터 수집')
    parser.add_argument('--politician_id', type=str, required=True)
    parser.add_argument('--politician_name', type=str, required=True)
    args = parser.parse_args()

    collect_all_parallel(args.politician_id, args.politician_name)


if __name__ == "__main__":
    main()
