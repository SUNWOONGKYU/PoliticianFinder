#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
데이터 풀링 시스템 (Data Pooling System)

원리:
1. 3개 AI가 각자 수집한 뉴스를 모두 합침 (중복 제거)
2. 합쳐진 뉴스를 3개 AI가 모두 평가
3. 같은 데이터에 대한 평가 차이만 비교

예시:
- ChatGPT가 수집한 "김동연 경제부총리 시절 GDP 3% 성장"
- Grok이 수집한 "김동연, 경기도지사 시절 재정 건전성 악화"
- Claude가 수집한 "김동연의 청년배당 정책 논란"
→ 이 3개 뉴스를 3개 AI가 모두 평가
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv
from openai import OpenAI
from anthropic import Anthropic
import json
import time

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

# API 클라이언트
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
grok_client = OpenAI(api_key=os.getenv('XAI_API_KEY'), base_url="https://api.x.ai/v1")
claude_client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

POLITICIAN_ID = "0756ec15"
POLITICIAN_NAME = "김동연"

# 등급 매핑
ALPHABET_GRADES = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}

CATEGORIES = [
    ('Expertise', '전문성'),
    ('Leadership', '리더십'),
    ('Vision', '비전'),
    ('Integrity', '청렴성'),
    ('Ethics', '윤리성'),
    ('Accountability', '책임성'),
    ('Transparency', '투명성'),
    ('Communication', '소통능력'),
    ('Responsiveness', '대응성'),
    ('PublicInterest', '공익성')
]

# ============================================
# Step 1: 공통 데이터 풀 생성
# ============================================

def create_data_pool(politician_id, category_eng):
    """
    3개 AI가 수집한 데이터를 모두 합쳐서 공통 풀 생성
    중복은 제목 유사도로 제거
    """
    print(f"\n[Step 1] {category_eng} 카테고리 데이터 풀 생성 중...")

    # 3개 AI가 수집한 데이터 모두 가져오기
    all_items = []

    for ai_name in ["ChatGPT", "Grok", "claude-3-5-haiku-20241022"]:
        response = supabase.table('collected_data').select('*').eq(
            'politician_id', politician_id
        ).eq('ai_name', ai_name).eq('category_name', category_eng).execute()

        if response.data:
            for item in response.data:
                all_items.append({
                    'id': item['collected_data_id'],
                    'data_title': item['data_title'],
                    'data_content': item['data_content'],
                    'data_source': item['data_source'],
                    'source_type': item['source_type'],
                    'category_name': item['category_name'],
                    'collected_by': ai_name,
                    'original_rating': item.get('rating', '')
                })

    print(f"  총 수집된 데이터: {len(all_items)}개")

    # 중복 제거 (제목 완전 일치 기준)
    unique_items = []
    seen_titles = set()

    for item in all_items:
        title_normalized = item['data_title'].strip().lower()
        if title_normalized not in seen_titles:
            seen_titles.add(title_normalized)
            unique_items.append(item)

    print(f"  중복 제거 후: {len(unique_items)}개")

    # 50개로 제한 (OFFICIAL 25 + PUBLIC 25)
    official_items = [item for item in unique_items if item['source_type'] == 'OFFICIAL'][:25]
    public_items = [item for item in unique_items if item['source_type'] == 'PUBLIC'][:25]

    data_pool = official_items + public_items

    print(f"  최종 데이터 풀: {len(data_pool)}개 (OFFICIAL: {len(official_items)}, PUBLIC: {len(public_items)})")

    return data_pool

# ============================================
# Step 2: AI별 평가 (같은 데이터 풀 사용)
# ============================================

def evaluate_with_ai(ai_name, item, category_kor):
    """
    특정 AI에게 데이터 평가 요청 (수집 없이 평가만)
    """
    prompt = f"""
다음은 정치인 "{POLITICIAN_NAME}"에 대한 뉴스 자료입니다.
"{category_kor}" 관점에서 A~H 등급을 부여하고 근거를 작성해주세요.

제목: {item['data_title']}
내용: {item['data_content'][:500]}
출처: {item['data_source']}

등급 기준:
A (8점): 매우 우수
B (6점): 우수
C (4점): 양호
D (2점): 보통
E (-2점): 미흡
F (-4점): 부족
G (-6점): 매우 부족
H (-8점): 치명적 결함

JSON 형식으로 답변:
{{
  "rating": "A-H 중 하나",
  "rating_rationale": "50자 이상 평가 근거"
}}
"""

    try:
        if ai_name == "ChatGPT":
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            content = response.choices[0].message.content

        elif ai_name == "Grok":
            response = grok_client.chat.completions.create(
                model="grok-2-1212",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            content = response.choices[0].message.content

        elif ai_name == "Claude":
            response = claude_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            content = response.content[0].text

        # JSON 파싱
        content = content.strip()
        if '```' in content:
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
        content = content.strip()

        result = json.loads(content)

        return {
            'rating': result['rating'].upper(),
            'rating_rationale': result['rating_rationale']
        }

    except Exception as e:
        print(f"    ❌ {ai_name} 평가 오류: {e}")
        return None

def evaluate_data_pool(data_pool, category_eng, category_kor):
    """
    데이터 풀의 모든 항목을 3개 AI로 평가
    """
    print(f"\n[Step 2] {category_kor} 데이터 풀 평가 중...")

    results = {
        'ChatGPT': [],
        'Grok': [],
        'Claude': []
    }

    for idx, item in enumerate(data_pool, 1):
        print(f"\n  [{idx}/{len(data_pool)}] {item['data_title'][:50]}...")

        # 3개 AI로 평가
        for ai_name in ['ChatGPT', 'Grok', 'Claude']:
            print(f"    - {ai_name} 평가 중...", end=' ')

            evaluation = evaluate_with_ai(ai_name, item, category_kor)

            if evaluation:
                results[ai_name].append({
                    'item_id': item['id'],
                    'data_title': item['data_title'],
                    'collected_by': item['collected_by'],
                    'original_rating': item['original_rating'],
                    'new_rating': evaluation['rating'],
                    'rating_rationale': evaluation['rating_rationale']
                })
                print(f"✅ {evaluation['rating']}")
            else:
                print(f"❌ 실패")

            time.sleep(1)  # API 호출 제한

    return results

# ============================================
# Step 3: 결과 분석 및 비교
# ============================================

def analyze_pooling_results(results):
    """
    풀링 시스템 결과 분석
    """
    print(f"\n{'='*80}")
    print("데이터 풀링 결과 분석")
    print(f"{'='*80}")

    # 각 AI의 평균 등급
    for ai_name in ['ChatGPT', 'Grok', 'Claude']:
        ratings = [ALPHABET_GRADES[item['new_rating']] for item in results[ai_name]]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0

        # 긍정/부정 비율
        positive = sum(1 for r in ratings if r >= 2)
        negative = sum(1 for r in ratings if r < 2)

        print(f"\n[{ai_name}]")
        print(f"  평균 등급: {avg_rating:+.2f}")
        print(f"  긍정(A~D): {positive}개 ({positive*100//len(ratings) if ratings else 0}%)")
        print(f"  부정(E~H): {negative}개 ({negative*100//len(ratings) if ratings else 0}%)")

        # 등급 분포
        from collections import Counter
        rating_dist = Counter([item['new_rating'] for item in results[ai_name]])
        print(f"  등급 분포: {dict(rating_dist)}")

    # 같은 뉴스에 대한 평가 차이 분석
    print(f"\n{'='*80}")
    print("같은 뉴스에 대한 AI별 평가 차이 (상위 10개)")
    print(f"{'='*80}")

    # 첫 10개 뉴스에 대해 비교
    for i in range(min(10, len(results['ChatGPT']))):
        chatgpt_item = results['ChatGPT'][i]
        grok_item = results['Grok'][i]
        claude_item = results['Claude'][i]

        print(f"\n{i+1}. {chatgpt_item['data_title'][:60]}...")
        print(f"   수집자: {chatgpt_item['collected_by']}")
        print(f"   ChatGPT: {chatgpt_item['new_rating']} | Grok: {grok_item['new_rating']} | Claude: {claude_item['new_rating']}")

        # 평가 차이
        chatgpt_score = ALPHABET_GRADES[chatgpt_item['new_rating']]
        grok_score = ALPHABET_GRADES[grok_item['new_rating']]
        claude_score = ALPHABET_GRADES[claude_item['new_rating']]

        max_diff = max(chatgpt_score, grok_score, claude_score) - min(chatgpt_score, grok_score, claude_score)
        print(f"   점수 차이: 최대 {max_diff}점")

def main():
    print("="*80)
    print("데이터 풀링 시스템 - 테스트 실행")
    print("="*80)
    print(f"정치인: {POLITICIAN_NAME}")
    print(f"테스트 카테고리: Expertise (전문성)")
    print("="*80)

    # Step 1: 데이터 풀 생성
    data_pool = create_data_pool(POLITICIAN_ID, 'Expertise')

    if len(data_pool) == 0:
        print("❌ 데이터 풀이 비어있습니다!")
        return

    # Step 2: 3개 AI로 평가
    results = evaluate_data_pool(data_pool, 'Expertise', '전문성')

    # Step 3: 결과 분석
    analyze_pooling_results(results)

    # 결과 저장
    output_file = f"data_pooling_results_{POLITICIAN_NAME}_Expertise.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'data_pool': data_pool,
            'evaluation_results': results
        }, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*80}")
    print(f"✅ 데이터 풀링 시스템 테스트 완료!")
    print(f"결과 파일: {output_file}")
    print(f"{'='*80}")

if __name__ == "__main__":
    main()
