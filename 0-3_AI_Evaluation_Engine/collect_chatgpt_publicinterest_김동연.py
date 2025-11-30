#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ChatGPT - 김동연 PublicInterest 누락분 50개 수집
"""
import os
import sys
from openai import OpenAI
from supabase import create_client
from dotenv import load_dotenv
import json
import time

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

POLITICIAN_ID = "0756ec15"
POLITICIAN_NAME = "김동연"
CATEGORY_ENG = "PublicInterest"
CATEGORY_KOR = "공익성"

SYSTEM_PROMPT = """당신은 정치인 평가 데이터 수집 전문가입니다.

**등급 기준 (8단계)**:
A (8점): 매우 우수
B (6점): 우수
C (4점): 양호
D (2점): 보통
E (-2점): 미흡
F (-4점): 부족
G (-6점): 매우 부족
H (-8점): 치명적 결함

**필수 요구사항**:
1. rating_rationale은 반드시 50자 이상
2. 긍정(A,B,C,D) 50% + 부정(E,F,G,H) 50% 균형
3. OFFICIAL/PUBLIC 출처 50:50 비율
4. 각 항목은 서로 다른 사례

**출력 형식**: JSON 배열만 (마크다운 없이)
[
  {
    "item_num": 1,
    "data_title": "제목",
    "data_content": "100자 이상 상세 내용",
    "data_source": "구체적 출처",
    "source_type": "OFFICIAL 또는 PUBLIC",
    "rating": "A-H 중 하나",
    "rating_rationale": "50자 이상 평가 근거"
  }
]
"""

def collect_batch(start_num, batch_size=10):
    """배치 수집"""
    user_prompt = f"""
정치인: {POLITICIAN_NAME}
평가 카테고리: {CATEGORY_KOR} (PublicInterest)
시작 번호: {start_num}
수집 개수: {batch_size}개

{POLITICIAN_NAME}의 {CATEGORY_KOR}에 대한 평가 데이터를 {batch_size}개 수집하세요.
공익성은 다음을 평가합니다:
- 공공의 이익을 우선시하는가
- 사익보다 공익을 중시하는가
- 공공복지 증진에 기여했는가
- 사회적 약자 배려 정도

각 항목은 독립적이고 서로 다른 내용이어야 합니다.
"""

    try:
        print(f"  [{start_num}~{start_num+batch_size-1}] 수집 중...", end=' ')

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7
        )

        content = response.choices[0].message.content.strip()

        # JSON 파싱
        if '```' in content:
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
        content = content.strip()

        items = json.loads(content)
        if isinstance(items, dict) and 'items' in items:
            items = items['items']

        print(f"✅ {len(items)}개 수집")
        return items

    except Exception as e:
        print(f"❌ 오류: {e}")
        return []

def save_to_db(items):
    """DB 저장"""
    from datetime import datetime
    saved_count = 0

    for idx, item in enumerate(items, 1):
        try:
            data = {
                'politician_id': POLITICIAN_ID,
                'ai_name': 'ChatGPT',
                'category_name': CATEGORY_ENG,
                'item_num': item.get('item_num', idx),
                'data_title': item['data_title'],
                'data_content': item['data_content'],
                'data_source': item['data_source'],
                'source_url': None,  # 옵션널
                'collection_date': datetime.now().isoformat(),  # 필수
                'source_type': item['source_type'],
                'rating': item['rating'].upper(),
                'rating_rationale': item['rating_rationale']
            }

            response = supabase.table('collected_data').insert(data).execute()
            saved_count += 1

        except Exception as e:
            print(f"    ❌ 저장 실패: {e}")

    return saved_count

def main():
    print("="*80)
    print(f"ChatGPT - {POLITICIAN_NAME} PublicInterest 누락분 수집")
    print("="*80)
    print(f"목표: 50개")
    print("="*80)

    all_items = []

    # 5회에 걸쳐 10개씩 수집
    for i in range(5):
        start_num = i * 10 + 1
        items = collect_batch(start_num, 10)

        if items:
            all_items.extend(items)

        time.sleep(2)  # API 제한

    print(f"\n총 수집: {len(all_items)}개")

    # DB 저장
    if all_items:
        print(f"\nDB 저장 중...")
        saved = save_to_db(all_items)
        print(f"✅ {saved}개 저장 완료")

        # 통계
        from collections import Counter
        ratings = Counter([item['rating'].upper() for item in all_items])
        source_types = Counter([item['source_type'] for item in all_items])

        print(f"\n등급 분포: {dict(ratings)}")
        print(f"출처 분포: {dict(source_types)}")

    print(f"\n{'='*80}")
    print(f"✅ 수집 완료!")
    print(f"{'='*80}")

if __name__ == "__main__":
    main()
