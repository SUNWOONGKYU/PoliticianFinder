# -*- coding: utf-8 -*-
"""
V23.0 최종 데이터 수집
- 목표: 50개 (허용: 45~60개)
- OFFICIAL 50% + PUBLIC 50%
- 부정 주제 20% 보장
- 재시도: 5번
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

# V23.0 알파벳 등급 시스템 (8단계) - A~H
ALPHABET_GRADES = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}
VALID_RATINGS = [-8, -6, -4, -2, 2, 4, 6, 8]

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

    # -D, -C, -B, -A 형식 처리
    if rating_str.startswith('-'):
        letter = rating_str[1:]
        if letter in ['D', 'C', 'B', 'A']:
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
        1: "전문성: 정책 전문성, 행정 경험, 분야별 전문 지식",
        2: "리더십: 조직 관리 능력, 위기 대응, 의사결정 능력",
        3: "비전: 장기적 계획, 혁신성, 미래 전망",
        4: "청렴성: 부패 방지, 윤리 준수, 이해충돌 회피",
        5: "윤리성: 도덕성, 사회적 책임, 공정성",
        6: "책임성: 약속 이행, 성과 책임, 투명한 보고",
        7: "투명성: 정보 공개, 소통 개방성, 설명 책임",
        8: "소통능력: 시민 소통, 언론 대응, 정책 홍보",
        9: "대응성: 민원 대응, 신속한 조치, 현장 중심",
        10: "공익성: 공공 이익 우선, 사회적 형평성, 약자 보호"
    }
    return descriptions.get(category_num, "")

def collect_negative_topic_batch(politician_id, politician_name, category_num, source_type,
                                  count=5, attempt=1, max_attempts=5):
    """
    V23.0: 부정적 주제 수집 후 객관적 평가
    - 논란, 비판, 문제점 등 부정적 주제를 수집
    - 하지만 각 내용을 객관적으로 평가 (A~-A 모든 등급 가능)
    - source_type: PUBLIC(언론) 또는 OFFICIAL(공식)
    """
    cat_eng, cat_kor = CATEGORIES[category_num - 1]
    source_desc = "언론 보도" if source_type == "PUBLIC" else "공공기록/공식자료"

    print(f"\n{'='*80}")
    print(f"[부정 주제 {count}개 - {source_desc}] {cat_kor} (시도 {attempt}/{max_attempts})")
    print(f"{'='*80}")

    # 카테고리 설명
    cat_desc = get_category_description(category_num)

    # V23.0: 부정적 주제 수집 + 객관적 평가 + 출처 유형 명시
    source_instruction = """
**출처 제한**: 언론 보도만 사용하세요 (뉴스 기사, 신문, 방송)
- 예: 연합뉴스, 조선일보, KBS, MBC 등
""" if source_type == "PUBLIC" else """
**출처 제한**: 공식 기록만 사용하세요 (정부 자료, 의회 기록, 공공 데이터)
- 예: 국회 회의록, 정부 보도자료, 공공기관 발표, 법원 판결문 등
"""

    prompt = f"""당신은 정치인 평가 데이터 수집 AI입니다.

**대상 정치인**: {politician_name}

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

**등급 체계** (8단계 알파벳: A가 최고, H가 최저):
- A: 매우 우수 (Excellent)
- B: 우수 (Very Good)
- C: 양호 (Good)
- D: 보통 (Average)
- E: 미흡 (Below Average)
- F: 부족 (Poor)
- G: 매우 부족 (Very Poor)
- H: 심각한 문제 (Critical)

**중요**: 부정적 주제를 다루되, 실제 심각도에 따라 **모든 등급(A~H) 사용 가능**합니다. A가 최고, H가 최저입니다.

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

        # V23.0: 알파벳 등급 검증 및 변환
        valid_items = []
        for idx, item in enumerate(items, 1):
            raw_rating = item.get('rating')
            numeric_rating = convert_rating_to_number(raw_rating)

            if numeric_rating is None:
                print(f"  ⚠️  항목 {idx}: 알 수 없는 등급 '{raw_rating}', 건너뛰기")
                continue

            if numeric_rating not in VALID_RATINGS:
                print(f"  ⚠️  항목 {idx}: 유효하지 않은 등급 {numeric_rating}, 건너뛰기")
                continue

            # V23.0: source_type 설정 (중요!)
            item['rating'] = numeric_rating
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
    V23.0: 자유 평가 수집
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

    prompt = f"""당신은 정치인 평가 데이터 수집 AI입니다.

**대상 정치인**: {politician_name}

**중요 알림**: 이 작업은 목표 미달 시 최대 5차례까지 재수집됩니다.
신중하게 정확한 데이터를 수집하여 재수집이 필요하지 않도록 하세요.

**작업**:
1. {politician_name}의 실제 행적, 정책, 성과를 조사하여 {count}개의 평가 항목을 수집하세요
2. 각 항목마다 실제 내용에 맞는 등급을 자유롭게 선택하세요
3. 긍정/부정 비율을 강제하지 마세요. 실제 내용에 따라 자연스럽게 등급을 선택하세요

{source_instruction}

**평가 카테고리**: {cat_kor} ({cat_eng})
**카테고리 평가 기준**: {cat_desc}

**등급 체계** (8단계 알파벳: A가 최고, H가 최저):
- A: 매우 우수 (Excellent)
- B: 우수 (Very Good)
- C: 양호 (Good)
- D: 보통 (Average)
- E: 미흡 (Below Average)
- F: 부족 (Poor)
- G: 매우 부족 (Very Poor)
- H: 심각한 문제 (Critical)

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

        # V23.0: 알파벳 등급 검증 및 변환
        valid_items = []
        for idx, item in enumerate(items, 1):
            raw_rating = item.get('rating')
            numeric_rating = convert_rating_to_number(raw_rating)

            if numeric_rating is None:
                print(f"  ⚠️  항목 {idx}: 알 수 없는 등급 '{raw_rating}', 건너뛰기")
                continue

            if numeric_rating not in VALID_RATINGS:
                print(f"  ⚠️  항목 {idx}: 유효하지 않은 등급 {numeric_rating}, 건너뛰기")
                continue

            # V23.0: source_type 설정 (중요!)
            item['rating'] = numeric_rating
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
    V23.0 최종: 카테고리별 50개 수집
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

    # 등급 분포
    positive_count = sum(1 for item in all_items if item['rating'] > 0)
    negative_count = sum(1 for item in all_items if item['rating'] < 0)
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
    parser = argparse.ArgumentParser(description='V23.0 최종 데이터 수집')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category', type=int, help='특정 카테고리만 수집 (1-10)')

    args = parser.parse_args()

    print(f"\n{'='*80}")
    print(f"V23.0 최종 데이터 수집 시작")
    print(f"{'='*80}")
    print(f"정치인: {args.politician_name} (ID: {args.politician_id})")
    print(f"모델: claude-3-5-haiku-20241022")
    print(f"목표: 50개 (허용: 45~60개)")
    print(f"재시도: 최대 5번")
    print(f"비율: OFFICIAL 50% + PUBLIC 50%")
    print(f"{'='*80}\n")

    if args.category:
        # 특정 카테고리만
        collect_category(args.politician_id, args.politician_name, args.category)
    else:
        # 전체 10개 카테고리
        for cat_num in range(1, 11):
            collect_category(args.politician_id, args.politician_name, cat_num)

    print(f"\n{'='*80}")
    print(f"✅ V23.0 수집 완료!")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()
