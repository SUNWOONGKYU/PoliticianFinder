# -*- coding: utf-8 -*-
"""
V26.0 Claude 데이터 수집
- 기간 제한: OFFICIAL 4년, PUBLIC 1년
- AI: Claude (claude-3-5-haiku-20241022)
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
from anthropic import Anthropic

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
client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

# V26.0 설정
MODEL = "claude-3-haiku-20240307"  # V26.1 비용 최적화
AI_NAME = "Claude"  # DB 저장용 (모델명 아닌 시스템명)

# V26.0 테이블명 (기존 테이블과 분리)
TABLE_COLLECTED_DATA = "collected_data_v26"
TABLE_CATEGORY_SCORES = "ai_category_scores_v26"
TABLE_FINAL_SCORES = "ai_final_scores_v26"
TABLE_EVALUATIONS = "ai_evaluations_v26"

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
    official_start = evaluation_date - timedelta(days=365*4)  # 4년 전
    public_start = evaluation_date - timedelta(days=365)       # 1년 전

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
- 날짜가 불분명한 경우, 내용에서 시점을 유추하여 기간 내 데이터만 포함하세요.
"""
    else:  # PUBLIC
        return f"""
⚠️ **V26.0 기간 제한 (PUBLIC 데이터)**:
- 수집 기간: {dates['public_start']} ~ {dates['public_end']} (최근 1년)
- 위 기간 외의 데이터는 수집하지 마세요.
- 날짜가 불분명한 경우, 내용에서 시점을 유추하여 기간 내 데이터만 포함하세요.
"""


def get_category_description(category_num):
    """카테고리 설명 반환"""
    descriptions = {
        1: """전문성: 정책 전문성, 행정 경험, 분야별 전문 지식

[O] 전문성에 해당: 정책 수립 능력, 전문 지식, 학력/경력, 행정 경험, 분야별 전문성, 법안 발의
[X] 전문성 아님: 조직 관리/위기 대응(리더십2), 혁신 아이디어(비전3), 약속 이행(책임성6)""",

        2: """리더십: 조직 관리 능력, 위기 대응, 의사결정 능력

[O] 리더십에 해당: 조직 관리, 팀 구성, 위기 대응, 갈등 조정, 의사결정, 당내 리더십, 정치적 영향력
[X] 리더십 아님: 정책 전문성(전문성1), 장기 계획(비전3), 공약 이행(책임성6), 시민 소통(소통8)""",

        3: """비전: 장기적 계획, 혁신성, 미래 전망

[O] 비전에 해당: 장기 발전 계획, 미래 전략, 혁신 정책, 창의성, 변화 주도, 개혁 의지
[X] 비전 아님: 현재 정책 능력(전문성1), 조직 혁신(리더십2), 단기 공약 이행(책임성6)""",

        4: """청렴성: 부패 방지, 윤리 준수, 이해충돌 회피

[O] 청렴성에 해당: 금품/뇌물 수수, 횡령, 배임, 비리, 공직자 윤리 위반, 행동강령 위반, 이해충돌, 겸직 문제, 사적 이익 추구, 불법 정치자금, 선거법 위반, 직권 남용, 부적절한 청탁
[X] 청렴성 아님: 정치적 중립성(책임성6), 정치적 편향성(윤리성5), 당내 갈등(리더십2), 정책 전문성(전문성1), 당적 변경(책임성6), 정보 공개(투명성7)""",

        5: """윤리성: 도덕성, 사회적 책임, 공정성

[O] 윤리성에 해당: 도덕성, 가치관, 인격, 사회적 책임, 공익 의식, 공정성, 차별 없는 태도, 성평등, 인권 존중, 발언의 적절성, 품위
[X] 윤리성 아님: 금품 수수(청렴성4), 공약 불이행(책임성6), 정보 은폐(투명성7), 소외계층 정책(공익성10)""",

        6: """책임성: 약속 이행, 성과 책임, 투명한 보고

[O] 책임성에 해당: 공약 이행, 약속 준수, 성과 책임, 결과 책임, 잘못 인정, 사과, 정치적 책임, 인사 책임, 법적 책임 수용, 정치적 중립성 유지
[X] 책임성 아님: 부패/비리(청렴성4), 정보 공개(투명성7), 민원 처리(대응성9), 정책 능력(전문성1)""",

        7: """투명성: 정보 공개, 소통 개방성, 설명 책임

[O] 투명성에 해당: 정보 공개, 자료 공개, 의사결정 과정 공개, 정치자금 공개, 설명 책임, 회의록/기록 공개, 투명한 의사결정 절차
[X] 투명성 아님: 금품 수수(청렴성4), 공약 이행 보고(책임성6), SNS 소통(소통8), 민원 응답(대응성9)""",

        8: """소통능력: 시민 소통, 언론 대응, 정책 홍보

[O] 소통능력에 해당: 시민 소통, 경청, 언론 대응, 인터뷰, 정책 설명, 홍보, SNS 활용, 온라인 소통, 의견 수렴
[X] 소통능력 아님: 정보 공개(투명성7), 민원 처리(대응성9), 조직 내 소통(리더십2), 공약 설명(책임성6)""",

        9: """대응성: 민원 대응, 신속한 조치, 현장 중심

[O] 대응성에 해당: 민원 처리, 민원 응답, 신속한 조치, 위기 대응 속도, 현장 방문, 현장 중심 행정, 즉각적 문제 해결, 시민 요구 반영
[X] 대응성 아님: 위기 관리 능력(리더십2), 정책 소통(소통8), 정보 공개(투명성7), 약속 이행(책임성6)""",

        10: """공익성: 공공 이익 우선, 사회적 형평성, 약자 보호

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
    """정치인 프로필을 프롬프트용 텍스트로 포맷"""
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


def collect_negative_topic_batch(politician_id, politician_name, category_num, source_type,
                                  count=5, attempt=1, max_attempts=5):
    """부정적 주제 수집 후 객관적 평가"""
    cat_eng, cat_kor = CATEGORIES[category_num - 1]
    source_desc = "언론 보도" if source_type == "PUBLIC" else "공공기록/공식자료"

    print(f"\n{'='*80}")
    print(f"[부정 주제 {count}개 - {source_desc}] {cat_kor} (시도 {attempt}/{max_attempts})")
    print(f"{'='*80}")

    cat_desc = get_category_description(category_num)
    date_restriction = get_date_restriction_prompt(source_type)

    source_instruction = """
**출처 제한**: 언론 보도만 사용하세요 (뉴스 기사, 신문, 방송)
- 예: 연합뉴스, 조선일보, KBS, MBC 등
""" if source_type == "PUBLIC" else """
**출처 제한**: 공식 기록만 사용하세요 (정부 자료, 의회 기록, 공공 데이터)
- 예: 국회 회의록, 정부 보도자료, 공공기관 발표, 법원 판결문 등
"""

    profile_info = format_politician_profile(politician_id, politician_name)

    prompt = f"""당신은 정치인 평가 데이터 수집 AI입니다.

{profile_info}

{date_restriction}

**중요 알림**: 이 작업은 목표 미달 시 최대 5차례까지 재수집됩니다.
신중하게 정확한 데이터를 수집하여 재수집이 필요하지 않도록 하세요.

**작업**:
1. {politician_name}의 **부정적인 측면, 논란, 비판, 문제점**을 주제로 {count}개의 평가 항목을 수집하세요
2. 각 항목은 **논란/비판/실패 사례** 등 부정적 주제여야 합니다
3. **하지만** 각 내용을 **객관적으로 평가**하여 적절한 등급을 부여하세요
   - 경미한 논란 → D, C 등급 가능
   - 중간 수준 문제 → E, D 등급
   - 심각한 문제 → F, G, H 등급

{source_instruction}

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

    # API 호출 재시도 로직
    max_api_retries = 3
    for api_attempt in range(max_api_retries):
        try:
            time.sleep(1.5)

            response = client.messages.create(
                model=MODEL,
                max_tokens=4096,
                temperature=1.0,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text

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

                if isinstance(raw_rating, str):
                    alphabet_rating = raw_rating.strip().upper()
                else:
                    alphabet_rating = str(raw_rating).strip().upper()

                if alphabet_rating not in ALPHABET_GRADES:
                    print(f"  ⚠️  항목 {idx}: 알 수 없는 등급 '{raw_rating}', 건너뛰기")
                    continue

                numeric_value = ALPHABET_GRADES[alphabet_rating]
                if numeric_value not in VALID_RATINGS:
                    print(f"  ⚠️  항목 {idx}: 유효하지 않은 등급 {alphabet_rating} ({numeric_value}), 건너뛰기")
                    continue

                item['rating'] = alphabet_rating
                item['source_type'] = source_type
                valid_items.append(item)

            print(f"  ✅ 유효한 항목: {len(valid_items)}개")

            if len(valid_items) < count and attempt < max_attempts:
                print(f"  ⚠️  목표 미달 ({len(valid_items)}/{count}), 재시도...")
                additional = collect_negative_topic_batch(
                    politician_id, politician_name, category_num, source_type,
                    count - len(valid_items), attempt + 1, max_attempts
                )
                valid_items.extend(additional)

            return valid_items[:count]

        except json.JSONDecodeError as e:
            print(f"  ⚠️ JSON 파싱 에러 (API 재시도 {api_attempt+1}/{max_api_retries}): {e}")
            if api_attempt < max_api_retries - 1:
                time.sleep(3)
            continue
        except Exception as e:
            if "Expecting value" in str(e) and api_attempt < max_api_retries - 1:
                print(f"  ⚠️ 빈 응답 (API 재시도 {api_attempt+1}/{max_api_retries})")
                time.sleep(5)
                continue
            print(f"  ❌ 에러: {e}")
            return []

    print(f"  ❌ API 재시도 {max_api_retries}회 실패")
    return []


def collect_free_batch(politician_id, politician_name, category_num, source_type,
                       count=20, attempt=1, max_attempts=5):
    """자유 평가 수집"""
    cat_eng, cat_kor = CATEGORIES[category_num - 1]
    source_desc = "언론 보도" if source_type == "PUBLIC" else "공공기록/공식자료"

    print(f"\n{'='*80}")
    print(f"[자유 평가 {count}개 - {source_desc}] {cat_kor} (시도 {attempt}/{max_attempts})")
    print(f"{'='*80}")

    cat_desc = get_category_description(category_num)
    date_restriction = get_date_restriction_prompt(source_type)

    source_instruction = """
**출처 제한**: 언론 보도만 사용하세요 (뉴스 기사, 신문, 방송)
- 예: 연합뉴스, 조선일보, KBS, MBC 등
""" if source_type == "PUBLIC" else """
**출처 제한**: 공식 기록만 사용하세요 (정부 자료, 의회 기록, 공공 데이터)
- 예: 국회 회의록, 정부 보도자료, 공공기관 발표, 법원 판결문 등
"""

    profile_info = format_politician_profile(politician_id, politician_name)

    prompt = f"""당신은 정치인 평가 데이터 수집 AI입니다.

{profile_info}

{date_restriction}

**중요 알림**: 이 작업은 목표 미달 시 최대 5차례까지 재수집됩니다.
신중하게 정확한 데이터를 수집하여 재수집이 필요하지 않도록 하세요.

**작업**:
1. {politician_name}의 실제 행적, 정책, 성과를 조사하여 {count}개의 평가 항목을 수집하세요
2. 각 항목마다 실제 내용에 맞는 등급을 자유롭게 선택하세요
3. 긍정/부정 비율을 강제하지 마세요. 실제 내용에 따라 자연스럽게 등급을 선택하세요

{source_instruction}

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

    # API 호출 재시도 로직
    max_api_retries = 3
    for api_attempt in range(max_api_retries):
        try:
            time.sleep(1.5)

            response = client.messages.create(
                model=MODEL,
                max_tokens=4096,
                temperature=1.0,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text

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

                if isinstance(raw_rating, str):
                    alphabet_rating = raw_rating.strip().upper()
                else:
                    alphabet_rating = str(raw_rating).strip().upper()

                if alphabet_rating not in ALPHABET_GRADES:
                    print(f"  ⚠️  항목 {idx}: 알 수 없는 등급 '{raw_rating}', 건너뛰기")
                    continue

                numeric_value = ALPHABET_GRADES[alphabet_rating]
                if numeric_value not in VALID_RATINGS:
                    print(f"  ⚠️  항목 {idx}: 유효하지 않은 등급 {alphabet_rating} ({numeric_value}), 건너뛰기")
                    continue

                item['rating'] = alphabet_rating
                item['source_type'] = source_type
                valid_items.append(item)

            print(f"  ✅ 유효한 항목: {len(valid_items)}개")

            if len(valid_items) < count and attempt < max_attempts:
                print(f"  ⚠️  목표 미달 ({len(valid_items)}/{count}), 재시도...")
                additional = collect_free_batch(
                    politician_id, politician_name, category_num, source_type,
                    count - len(valid_items), attempt + 1, max_attempts
                )
                valid_items.extend(additional)

            return valid_items[:count]

        except json.JSONDecodeError as e:
            print(f"  ⚠️ JSON 파싱 에러 (API 재시도 {api_attempt+1}/{max_api_retries}): {e}")
            if api_attempt < max_api_retries - 1:
                time.sleep(3)
            continue
        except Exception as e:
            if "Expecting value" in str(e) and api_attempt < max_api_retries - 1:
                print(f"  ⚠️ 빈 응답 (API 재시도 {api_attempt+1}/{max_api_retries})")
                time.sleep(5)
                continue
            print(f"  ❌ 에러: {e}")
            return []

    print(f"  ❌ API 재시도 {max_api_retries}회 실패")
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

    # 기존 max item_num 조회 (AI별로 구분)
    start_num = get_max_item_num(politician_id, category_name, AI_NAME) + 1

    if start_num > 60:
        print(f"  ⚠️ item_num {start_num}부터 시작 - DB 제약(1-60) 초과, 저장 건너뛰기")
        return 0

    # V26.0 기간 정보
    dates = get_date_range()

    saved = 0
    for idx, item in enumerate(items):
        actual_item_num = start_num + idx

        if actual_item_num > 60:
            print(f"  ⚠️ item_num {actual_item_num} - DB 제약(1-60) 초과, 저장 중단")
            break

        try:
            data = {
                'politician_id': politician_id,
                'ai_name': AI_NAME,  # "Claude" (시스템명)
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
            print(f"  ❌ DB 저장 실패 (항목 {actual_item_num}): {e}")

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

    print(f"\n{'='*80}")
    print(f"카테고리 {category_num}: {cat_kor} ({cat_eng}) - AI: {AI_NAME}")
    print(f"{'='*80}")

    # 이미 완료된 카테고리 건너뛰기
    current_count = get_category_count(politician_id, cat_eng, AI_NAME)
    if current_count >= 50:
        print(f"  ✅ 이미 {current_count}개 수집 완료 - 건너뛰기")
        return []

    print(f"  📊 현재 {current_count}개 저장됨, 추가 수집 시작...")

    all_items = []

    # Phase 1: 부정 주제 10개
    print("\n📌 Phase 1: 부정 주제 10개 수집")
    negative_official = collect_negative_topic_batch(
        politician_id, politician_name, category_num,
        source_type='OFFICIAL', count=5, max_attempts=5
    )
    negative_public = collect_negative_topic_batch(
        politician_id, politician_name, category_num,
        source_type='PUBLIC', count=5, max_attempts=5
    )

    all_items.extend(negative_official)
    all_items.extend(negative_public)
    print(f"\n  → 부정 주제: {len(all_items)}개 수집")

    # Phase 2: 자유 평가 40개 (10개씩 4번 - JSON 트렁케이션 방지)
    print("\n📌 Phase 2: 자유 평가 40개 수집 (10개씩 배치)")
    free_official_1 = collect_free_batch(
        politician_id, politician_name, category_num,
        source_type='OFFICIAL', count=10, max_attempts=5
    )
    free_official_2 = collect_free_batch(
        politician_id, politician_name, category_num,
        source_type='OFFICIAL', count=10, max_attempts=5
    )
    free_public_1 = collect_free_batch(
        politician_id, politician_name, category_num,
        source_type='PUBLIC', count=10, max_attempts=5
    )
    free_public_2 = collect_free_batch(
        politician_id, politician_name, category_num,
        source_type='PUBLIC', count=10, max_attempts=5
    )
    free_official = free_official_1 + free_official_2
    free_public = free_public_1 + free_public_2

    all_items.extend(free_official)
    all_items.extend(free_public)

    total = len(all_items)
    if total == 0:
        print(f"\n❌ 수집 실패: 0개")
        return []

    official_count = sum(1 for item in all_items if item.get('source_type') == 'OFFICIAL')
    public_count = sum(1 for item in all_items if item.get('source_type') == 'PUBLIC')

    print(f"\n{'='*80}")
    print(f"수집 결과 (AI: {AI_NAME})")
    print(f"{'='*80}")
    print(f"총 개수: {total}개")
    print(f"  OFFICIAL: {official_count}개 ({official_count/total*100:.1f}%)")
    print(f"  PUBLIC: {public_count}개 ({public_count/total*100:.1f}%)")

    if total > 60:
        print(f"\n⚠️  60개 초과 ({total}개) → 60개로 제한")
        all_items = all_items[:60]
        total = 60

    if total >= 50:
        print(f"\n✅ 목표 달성: {total}개")
    elif total >= 45:
        print(f"\n⚠️  목표 미달이지만 허용 범위: {total}개")
    else:
        print(f"\n❌ 심각한 미달: {total}개")

    positive_count = sum(1 for item in all_items if ALPHABET_GRADES.get(item['rating'], 0) > 0)
    negative_count = sum(1 for item in all_items if ALPHABET_GRADES.get(item['rating'], 0) < 0)
    print(f"\n등급 분포:")
    print(f"  긍정: {positive_count}개 ({positive_count/total*100:.1f}%)")
    print(f"  부정: {negative_count}개 ({negative_count/total*100:.1f}%)")

    for idx, item in enumerate(all_items, 1):
        item['item_num'] = idx

    print(f"\n💾 DB 저장 중...")
    saved = save_to_db(politician_id, cat_eng, all_items)
    print(f"   → DB 저장 완료: {saved}/{total}개\n")

    return all_items


def collect_category_group(politician_id, politician_name, category_start, category_end):
    """카테고리 그룹 병렬 수집"""
    print(f"\n{'='*80}")
    print(f"카테고리 그룹 {category_start}~{category_end} 병렬 수집 시작 (AI: {AI_NAME})")
    print(f"{'='*80}\n")

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {}

        for i in range(category_start, category_end + 1):
            future = executor.submit(collect_category, politician_id, politician_name, i)
            futures[future] = i

        for future in as_completed(futures):
            category_num = futures[future]
            cat_eng, cat_kor = CATEGORIES[category_num - 1]

            try:
                future.result()
                print(f"✅ 카테고리 {category_num} ({cat_kor}) 완료")
            except Exception as e:
                print(f"❌ 카테고리 {category_num} ({cat_kor}) 실패: {e}")

    print(f"\n{'='*80}")
    print(f"카테고리 그룹 {category_start}~{category_end} 완료")
    print(f"{'='*80}\n")


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
    """전체 10개 카테고리를 5개씩 2그룹으로 병렬 수집"""
    dates = get_date_range()

    print("="*80)
    print("V26.0 Claude 데이터 수집 시작")
    print("="*80)
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"AI: {AI_NAME} (모델: {MODEL})")
    print(f"평가일: {dates['evaluation_date']}")
    print(f"OFFICIAL 기간: {dates['official_start']} ~ {dates['official_end']} (4년)")
    print(f"PUBLIC 기간: {dates['public_start']} ~ {dates['public_end']} (1년)")
    print(f"병렬 처리: 카테고리 5개씩 병렬")
    print(f"자동 재수집: 최대 {max_retries}회")
    print("="*80)
    print()

    retry_count = 0

    while retry_count <= max_retries:
        if retry_count > 0:
            print(f"\n{'='*80}")
            print(f"🔄 재수집 {retry_count}회차 시작")
            print(f"{'='*80}\n")

        collect_category_group(politician_id, politician_name, 1, 5)
        collect_category_group(politician_id, politician_name, 6, 10)

        print(f"\n{'='*80}")
        print(f"📊 수집 상태 확인 (재수집 {retry_count}회차 완료)")
        print(f"{'='*80}\n")

        category_counts = check_collection_status(politician_id, AI_NAME)

        incomplete_categories = []
        for i, (cat_eng, cat_kor) in enumerate(CATEGORIES, 1):
            count = category_counts.get(cat_eng, 0)
            if count < 50:
                print(f"⚠️  카테고리 {i} ({cat_kor}): {count}/50개 (부족: {50-count}개)")
                incomplete_categories.append((i, cat_eng, cat_kor, count))
            else:
                print(f"✅ 카테고리 {i} ({cat_kor}): {count}/50개")

        if not incomplete_categories:
            print(f"\n{'='*80}")
            print("✅ 모든 카테고리 50개 달성! 수집 완료!")
            print(f"{'='*80}")
            break

        if retry_count >= max_retries:
            print(f"\n{'='*80}")
            print(f"⚠️  최대 재수집 횟수({max_retries}회) 도달")
            print(f"   미달 카테고리: {len(incomplete_categories)}개")
            for i, cat_eng, cat_kor, count in incomplete_categories:
                print(f"   - 카테고리 {i} ({cat_kor}): {count}/50개")
            print(f"{'='*80}")
            break

        retry_count += 1

    print("\n" + "="*80)
    print(f"✅ V26.0 {AI_NAME} 수집 완료!")
    print("="*80)


def main():
    parser = argparse.ArgumentParser(description='V26.0 Claude 데이터 수집')
    parser.add_argument('--politician_id', type=str, required=True, help='정치인 ID')
    parser.add_argument('--politician_name', type=str, required=True, help='정치인 이름')

    args = parser.parse_args()

    collect_all_parallel(args.politician_id, args.politician_name)


if __name__ == "__main__":
    main()
