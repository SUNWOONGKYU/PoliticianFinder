# -*- coding: utf-8 -*-
"""
V24.0 순차 데이터 수집 (디버깅/테스트 전용)
- 용도: 단일 카테고리 테스트, 디버깅, 수동 재수집
- 실제 사용: collect_v24.py (병렬 처리) 사용 권장
- 목표: 50개 (허용: 45~60개)
- OFFICIAL 50% + PUBLIC 50%
- 부정 주제 20% 보장
- 재시도: 5번
- 등급: A부터 H까지 (8단계)
"""
import os
import sys
import json
import argparse
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
from anthropic import Anthropic

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# Anthropic 클라이언트
client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

# V24.0 알파벳 등급 시스템 (8단계) - A부터 H까지
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

def convert_rating_to_number(rating_str):
    """알파벳 등급을 숫자로 변환"""
    if not rating_str:
        return None

    rating_str = str(rating_str).strip().upper()

    # 직접 매칭
    if rating_str in ALPHABET_GRADES:
        return ALPHABET_GRADES[rating_str]

    # E, F, G, H 형식 처리 (부정 등급)
    if rating_str in ['E', 'F', 'G', 'H']:
        return ALPHABET_GRADES[rating_str]

    # 숫자 형식
    try:
        num = int(rating_str)
        if num in VALID_RATINGS:
            return num
    except:
        pass

    return None

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

    # 나이 계산 (생년월일에서)
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

    # 특별 경고 (정원오의 경우)
    if politician_name == "정원오":
        profile_text += "\n\n🚨 **특별 주의사항**: 이 정치인은 서울 성동구청장이며, 성남시와는 전혀 무관합니다. 성남 대장동 개발 사건은 이재명 전 성남시장과 관련된 사건으로, 정원오와는 아무 관련이 없습니다. 성남시 관련 내용은 절대 수집하지 마세요."

    return profile_text

def collect_negative_topic_batch(politician_id, politician_name, category_num, source_type,
                                  count=5, attempt=1, max_attempts=5):
    """
    V24.0: 부정적 주제 수집 후 객관적 평가
    - 논란, 비판, 문제점 등 부정적 주제를 수집
    - 하지만 각 내용을 객관적으로 평가 (A~H 모든 등급 가능)
    - source_type: PUBLIC(언론) 또는 OFFICIAL(공식)
    """
    cat_eng, cat_kor = CATEGORIES[category_num - 1]
    source_desc = "언론 보도" if source_type == "PUBLIC" else "공공기록/공식자료"

    print(f"\n{'='*80}")
    print(f"[부정 주제 {count}개 - {source_desc}] {cat_kor} (시도 {attempt}/{max_attempts})")
    print(f"{'='*80}")

    # 카테고리 설명
    cat_desc = get_category_description(category_num)

    # V24.0: 부정적 주제 수집 + 객관적 평가 + 출처 유형 명시
    source_instruction = """
**출처 제한**: 언론 보도만 사용하세요 (뉴스 기사, 신문, 방송)
- 예: 연합뉴스, 조선일보, KBS, MBC 등
""" if source_type == "PUBLIC" else """
**출처 제한**: 공식 기록만 사용하세요 (정부 자료, 의회 기록, 공공 데이터)
- 예: 국회 회의록, 정부 보도자료, 공공기관 발표, 법원 판결문 등
"""

    # 정치인 프로필 정보 가져오기
    profile_info = format_politician_profile(politician_id, politician_name)

    prompt = f"""당신은 정치인 평가 데이터 수집 AI입니다.

{profile_info}

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

**등급 체계** (V24.0 - 8단계):
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

    try:
        # API 호출
        response = client.messages.create(
            model="claude-3-5-haiku-20241022",  # Haiku 3.5
            max_tokens=8000,
            temperature=1.0,
            messages=[{"role": "user", "content": prompt}]
        )

        # 응답 파싱
        content = response.content[0].text

        # JSON 추출
        json_start = content.find('```json')
        json_end = content.find('```', json_start + 7)

        if json_start != -1 and json_end != -1:
            json_str = content[json_start + 7:json_end].strip()
        else:
            json_str = content.strip()

        data = json.loads(json_str)
        items = data.get('items', [])

        print(f"  → API 응답: {len(items)}개 항목")

        # V24.0: 알파벳 등급 검증 (숫자 변환 없이 알파벳 그대로 저장)
        valid_items = []
        for idx, item in enumerate(items, 1):
            raw_rating = item.get('rating')

            # 알파벳 등급 정규화 (대문자로 변환)
            if isinstance(raw_rating, str):
                alphabet_rating = raw_rating.strip().upper()
            else:
                alphabet_rating = str(raw_rating).strip().upper()

            # 유효성 검증 (A~H만 허용)
            if alphabet_rating not in ALPHABET_GRADES:
                print(f"  ⚠️  항목 {idx}: 알 수 없는 등급 '{raw_rating}', 건너뛰기")
                continue

            # 숫자값 검증 (내부 검증용)
            numeric_value = ALPHABET_GRADES[alphabet_rating]
            if numeric_value not in VALID_RATINGS:
                print(f"  ⚠️  항목 {idx}: 유효하지 않은 등급 {alphabet_rating} ({numeric_value}), 건너뛰기")
                continue

            # V24.0: 알파벳 등급 그대로 저장 (중요!)
            item['rating'] = alphabet_rating  # 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'
            item['source_type'] = source_type  # OFFICIAL 또는 PUBLIC
            valid_items.append(item)

        print(f"  ✅ 유효한 항목: {len(valid_items)}개")

        # 부족하면 재시도 (최대 5번)
        if len(valid_items) < count and attempt < max_attempts:
            print(f"  ⚠️  목표 미달 ({len(valid_items)}/{count}), 재시도...")
            additional = collect_negative_topic_batch(
                politician_id, politician_name, category_num, source_type,
                count - len(valid_items), attempt + 1, max_attempts
            )
            valid_items.extend(additional)

        # 초과 시 잘라내기 (count개만)
        return valid_items[:count]

    except Exception as e:
        print(f"  ❌ 에러: {e}")
        return []

def collect_free_batch(politician_id, politician_name, category_num, source_type,
                       count=20, attempt=1, max_attempts=5):
    """
    V24.0: 자유 평가 수집
    - source_type: PUBLIC(언론) 또는 OFFICIAL(공식)
    """
    cat_eng, cat_kor = CATEGORIES[category_num - 1]
    source_desc = "언론 보도" if source_type == "PUBLIC" else "공공기록/공식자료"

    print(f"\n{'='*80}")
    print(f"[자유 평가 {count}개 - {source_desc}] {cat_kor} (시도 {attempt}/{max_attempts})")
    print(f"{'='*80}")

    cat_desc = get_category_description(category_num)

    source_instruction = """
**출처 제한**: 언론 보도만 사용하세요 (뉴스 기사, 신문, 방송)
- 예: 연합뉴스, 조선일보, KBS, MBC 등
""" if source_type == "PUBLIC" else """
**출처 제한**: 공식 기록만 사용하세요 (정부 자료, 의회 기록, 공공 데이터)
- 예: 국회 회의록, 정부 보도자료, 공공기관 발표, 법원 판결문 등
"""

    # 정치인 프로필 정보 가져오기
    profile_info = format_politician_profile(politician_id, politician_name)

    prompt = f"""당신은 정치인 평가 데이터 수집 AI입니다.

{profile_info}

**중요 알림**: 이 작업은 목표 미달 시 최대 5차례까지 재수집됩니다.
신중하게 정확한 데이터를 수집하여 재수집이 필요하지 않도록 하세요.

**작업**:
1. {politician_name}의 실제 행적, 정책, 성과를 조사하여 {count}개의 평가 항목을 수집하세요
2. 각 항목마다 실제 내용에 맞는 등급을 자유롭게 선택하세요
3. 긍정/부정 비율을 강제하지 마세요. 실제 내용에 따라 자연스럽게 등급을 선택하세요

{source_instruction}

**평가 카테고리**: {cat_kor} ({cat_eng})
**카테고리 평가 기준**: {cat_desc}

**등급 체계** (V24.0 - 8단계):
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

    try:
        # API 호출
        response = client.messages.create(
            model="claude-3-5-haiku-20241022",  # Haiku 3.5
            max_tokens=8000,
            temperature=1.0,
            messages=[{"role": "user", "content": prompt}]
        )

        # 응답 파싱
        content = response.content[0].text

        # JSON 추출
        json_start = content.find('```json')
        json_end = content.find('```', json_start + 7)

        if json_start != -1 and json_end != -1:
            json_str = content[json_start + 7:json_end].strip()
        else:
            json_str = content.strip()

        data = json.loads(json_str)
        items = data.get('items', [])

        print(f"  → API 응답: {len(items)}개 항목")

        # V24.0: 알파벳 등급 검증 (숫자 변환 없이 알파벳 그대로 저장)
        valid_items = []
        for idx, item in enumerate(items, 1):
            raw_rating = item.get('rating')

            # 알파벳 등급 정규화 (대문자로 변환)
            if isinstance(raw_rating, str):
                alphabet_rating = raw_rating.strip().upper()
            else:
                alphabet_rating = str(raw_rating).strip().upper()

            # 유효성 검증 (A~H만 허용)
            if alphabet_rating not in ALPHABET_GRADES:
                print(f"  ⚠️  항목 {idx}: 알 수 없는 등급 '{raw_rating}', 건너뛰기")
                continue

            # 숫자값 검증 (내부 검증용)
            numeric_value = ALPHABET_GRADES[alphabet_rating]
            if numeric_value not in VALID_RATINGS:
                print(f"  ⚠️  항목 {idx}: 유효하지 않은 등급 {alphabet_rating} ({numeric_value}), 건너뛰기")
                continue

            # V24.0: 알파벳 등급 그대로 저장 (중요!)
            item['rating'] = alphabet_rating  # 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'
            item['source_type'] = source_type  # OFFICIAL 또는 PUBLIC
            valid_items.append(item)

        print(f"  ✅ 유효한 항목: {len(valid_items)}개")

        # 부족하면 재시도 (최대 5번)
        if len(valid_items) < count and attempt < max_attempts:
            print(f"  ⚠️  목표 미달 ({len(valid_items)}/{count}), 재시도...")
            additional = collect_free_batch(
                politician_id, politician_name, category_num, source_type,
                count - len(valid_items), attempt + 1, max_attempts
            )
            valid_items.extend(additional)

        # 초과 시 잘라내기 (count개만)
        return valid_items[:count]

    except Exception as e:
        print(f"  ❌ 에러: {e}")
        return []

def save_to_db(politician_id, category_name, items):
    """DB에 저장"""
    if not items:
        return 0

    saved = 0
    for item in items:
        try:
            data = {
                'politician_id': politician_id,
                'ai_name': 'claude-3-5-haiku-20241022',
                'category_name': category_name,
                'item_num': item['item_num'],
                'data_title': item['data_title'],
                'data_content': item['data_content'],
                'data_source': item['data_source'],
                'source_url': item.get('source_url', ''),
                'collection_date': datetime.now().isoformat(),
                'rating': item['rating'],
                'rating_rationale': item['rating_rationale'],
                'source_type': item['source_type']  # ✅ 실제 값 사용!
            }

            supabase.table('collected_data').insert(data).execute()
            saved += 1

        except Exception as e:
            print(f"  ❌ DB 저장 실패 (항목 {item['item_num']}): {e}")

    return saved

def collect_category(politician_id, politician_name, category_num):
    """
    V24.0 최종: 카테고리별 50개 수집
    - 목표: 50개 (허용: 45~60개)
    - OFFICIAL 25개 + PUBLIC 25개
    - 부정 주제 10개 (OFFICIAL 5 + PUBLIC 5)
    - 자유 평가 40개 (OFFICIAL 20 + PUBLIC 20)
    """
    cat_eng, cat_kor = CATEGORIES[category_num - 1]

    print(f"\n{'='*80}")
    print(f"카테고리 {category_num}: {cat_kor} ({cat_eng})")
    print(f"{'='*80}")

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
    print(f"\n  → 부정 주제: {len(all_items)}개 수집 (OFFICIAL {len(negative_official)} + PUBLIC {len(negative_public)})")

    # Phase 2: 자유 평가 40개
    print("\n📌 Phase 2: 자유 평가 40개 수집")
    free_official = collect_free_batch(
        politician_id, politician_name, category_num,
        source_type='OFFICIAL', count=20, max_attempts=5
    )
    free_public = collect_free_batch(
        politician_id, politician_name, category_num,
        source_type='PUBLIC', count=20, max_attempts=5
    )

    all_items.extend(free_official)
    all_items.extend(free_public)
    print(f"\n  → 자유 평가: {len(free_official) + len(free_public)}개 수집 (OFFICIAL {len(free_official)} + PUBLIC {len(free_public)})")

    # 총 개수 확인
    total = len(all_items)
    official_count = sum(1 for item in all_items if item.get('source_type') == 'OFFICIAL')
    public_count = sum(1 for item in all_items if item.get('source_type') == 'PUBLIC')

    print(f"\n{'='*80}")
    print(f"수집 결과")
    print(f"{'='*80}")
    print(f"총 개수: {total}개")
    print(f"  OFFICIAL: {official_count}개 ({official_count/total*100:.1f}%)")
    print(f"  PUBLIC: {public_count}개 ({public_count/total*100:.1f}%)")

    # 60개 초과 시 제한
    if total > 60:
        print(f"\n⚠️  60개 초과 ({total}개) → 60개로 제한")
        all_items = all_items[:60]
        total = 60

    # 개수별 상태 출력
    if total >= 50:
        print(f"\n✅ 목표 달성: {total}개")
    elif total >= 45:
        print(f"\n⚠️  목표 미달이지만 허용 범위: {total}개 (45개 이상)")
    else:
        print(f"\n❌ 심각한 미달: {total}개 (45개 미만)")

    # 등급 분포 (V24.0: 알파벳 → 숫자 변환 후 비교)
    positive_count = sum(1 for item in all_items if ALPHABET_GRADES.get(item['rating'], 0) > 0)
    negative_count = sum(1 for item in all_items if ALPHABET_GRADES.get(item['rating'], 0) < 0)
    print(f"\n등급 분포:")
    print(f"  긍정: {positive_count}개 ({positive_count/total*100:.1f}%)")
    print(f"  부정: {negative_count}개 ({negative_count/total*100:.1f}%)")

    # item_num 재정렬 (1부터 시작)
    for idx, item in enumerate(all_items, 1):
        item['item_num'] = idx

    # DB 저장
    print(f"\n💾 DB 저장 중...")
    saved = save_to_db(politician_id, cat_eng, all_items)
    print(f"   → DB 저장 완료: {saved}/{total}개\n")

    return all_items

def main():
    parser = argparse.ArgumentParser(description='V24.0 순차 데이터 수집 (디버깅/테스트 전용)')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category', type=int, help='특정 카테고리만 수집 (1-10)')

    args = parser.parse_args()

    print(f"\n{'='*80}")
    print(f"V24.0 순차 데이터 수집 (디버깅/테스트 전용)")
    print(f"{'='*80}")
    print(f"정치인: {args.politician_name} (ID: {args.politician_id})")
    print(f"모델: claude-3-5-haiku-20241022")
    print(f"목표: 50개 (허용: 45~60개)")
    print(f"재시도: 최대 5번")
    print(f"비율: OFFICIAL 50% + PUBLIC 50%")
    print(f"등급: A부터 H까지 (8단계, A=최우수 → H=심각한 문제)")
    print(f"{'='*80}\n")

    if args.category:
        # 특정 카테고리만
        collect_category(args.politician_id, args.politician_name, args.category)
    else:
        # 전체 10개 카테고리
        for cat_num in range(1, 11):
            collect_category(args.politician_id, args.politician_name, cat_num)

    print(f"\n{'='*80}")
    print(f"✅ V24.0 수집 완료!")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()
