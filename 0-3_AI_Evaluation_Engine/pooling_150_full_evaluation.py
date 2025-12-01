#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
데이터 풀링 시스템 (올바른 버전)
- 150개 전체를 3개 AI가 각각 평가
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
CATEGORY_ENG = "Expertise"
CATEGORY_KOR = "전문성"

# 등급 매핑
ALPHABET_GRADES = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}

def get_all_150_items(politician_id, category_eng):
    """150개 데이터 풀 생성 (중복 제거 없음)"""
    print(f"\n[Step 1] {category_eng} 카테고리 데이터 풀 생성 중...")

    all_items = []

    for ai_name in ["ChatGPT", "Grok", "claude-3-5-haiku-20241022"]:
        response = supabase.table('collected_data').select('*').eq(
            'politician_id', politician_id
        ).eq('ai_name', ai_name).eq('category_name', category_eng).execute()

        if response.data:
            for item in response.data:
                all_items.append({
                    'id': item.get('collected_data_id', ''),
                    'data_title': item['data_title'],
                    'data_content': item['data_content'],
                    'data_source': item['data_source'],
                    'source_type': item['source_type'],
                    'collected_by': ai_name,
                    'original_rating': item.get('rating', '')
                })

    print(f"  총 데이터 풀: {len(all_items)}개")
    print(f"    - ChatGPT 수집: {sum(1 for x in all_items if x['collected_by'] == 'ChatGPT')}개")
    print(f"    - Grok 수집: {sum(1 for x in all_items if x['collected_by'] == 'Grok')}개")
    print(f"    - Claude 수집: {sum(1 for x in all_items if x['collected_by'] == 'claude-3-5-haiku-20241022')}개")

    return all_items

def evaluate_with_ai(ai_name, item, category_kor):
    """특정 AI에게 데이터 평가 요청"""
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

def evaluate_all_150_items(data_pool, category_kor):
    """150개를 3개 AI가 각각 평가"""
    print(f"\n[Step 2] {category_kor} 데이터 풀 150개 평가 시작...")
    print(f"  예상 API 호출: {len(data_pool)} × 3 = {len(data_pool) * 3}회")
    print(f"  예상 소요 시간: 약 {len(data_pool) * 3 * 3 // 60}분")

    results = {
        'ChatGPT': [],
        'Grok': [],
        'Claude': []
    }

    total_calls = len(data_pool) * 3
    current_call = 0

    for idx, item in enumerate(data_pool, 1):
        print(f"\n  [{idx}/{len(data_pool)}] {item['data_title'][:50]}...")
        print(f"    수집자: {item['collected_by']}")

        # 3개 AI로 평가
        for ai_name in ['ChatGPT', 'Grok', 'Claude']:
            current_call += 1
            print(f"    - {ai_name} 평가 중 ({current_call}/{total_calls})...", end=' ')

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

def calculate_final_scores(results):
    """3개 AI의 점수 계산 및 평균"""
    print(f"\n{'='*80}")
    print("최종 점수 계산")
    print(f"{'='*80}")

    scores = {}

    for ai_name in ['ChatGPT', 'Grok', 'Claude']:
        ratings = [ALPHABET_GRADES[item['new_rating']] for item in results[ai_name]]

        # V24 알고리즘: (6.0 + 평균 등급 * 0.5) * 10
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        category_score = (6.0 + avg_rating * 0.5) * 10

        scores[ai_name] = {
            'avg_rating': avg_rating,
            'category_score': category_score,
            'total_items': len(ratings),
            'positive': sum(1 for r in ratings if r >= 2),
            'negative': sum(1 for r in ratings if r < 2)
        }

        print(f"\n[{ai_name}]")
        print(f"  평균 등급: {avg_rating:+.2f}")
        print(f"  카테고리 점수: {category_score:.1f}점")
        print(f"  긍정(A~D): {scores[ai_name]['positive']}개 ({scores[ai_name]['positive']*100//len(ratings)}%)")
        print(f"  부정(E~H): {scores[ai_name]['negative']}개 ({scores[ai_name]['negative']*100//len(ratings)}%)")

    # 최종 평균 점수
    avg_score = sum(s['category_score'] for s in scores.values()) / 3

    print(f"\n{'='*80}")
    print("📊 최종 점수 요약")
    print(f"{'='*80}")
    print(f"  ChatGPT 점수: {scores['ChatGPT']['category_score']:.1f}점")
    print(f"  Grok 점수:    {scores['Grok']['category_score']:.1f}점")
    print(f"  Claude 점수:  {scores['Claude']['category_score']:.1f}점")
    print(f"  ─────────────────────────────")
    print(f"  ✅ 최종 통합 점수: {avg_score:.1f}점 (3개 AI 평균)")
    print(f"{'='*80}")

    return scores, avg_score

def main():
    print("="*80)
    print("데이터 풀링 시스템 - 150개 전체 평가")
    print("="*80)
    print(f"정치인: {POLITICIAN_NAME}")
    print(f"카테고리: {CATEGORY_ENG} ({CATEGORY_KOR})")
    print("="*80)

    # Step 1: 150개 데이터 풀 생성
    data_pool = get_all_150_items(POLITICIAN_ID, CATEGORY_ENG)

    if len(data_pool) == 0:
        print("❌ 데이터 풀이 비어있습니다!")
        return

    # Step 2: 3개 AI로 150개 모두 평가
    results = evaluate_all_150_items(data_pool, CATEGORY_KOR)

    # Step 3: 최종 점수 계산
    scores, final_score = calculate_final_scores(results)

    # 결과 저장
    output_file = f"pooling_150_results_{POLITICIAN_NAME}_{CATEGORY_ENG}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'data_pool_size': len(data_pool),
            'evaluation_results': results,
            'scores': scores,
            'final_score': final_score
        }, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*80}")
    print(f"✅ 데이터 풀링 시스템 테스트 완료!")
    print(f"결과 파일: {output_file}")
    print(f"{'='*80}")

if __name__ == "__main__":
    main()
