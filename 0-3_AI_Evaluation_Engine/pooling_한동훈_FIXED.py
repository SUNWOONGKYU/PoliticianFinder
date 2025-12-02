#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
배치 풀링 시스템 - API 호출 최적화
- 한 번의 API 호출로 10개 뉴스 동시 평가
- API 호출 수: 450회 → 45회 (90% 감소)
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv
from openai import OpenAI
from anthropic import Anthropic
import json
import time
from datetime import datetime

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

# API 클라이언트
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
grok_client = OpenAI(api_key=os.getenv('XAI_API_KEY'), base_url="https://api.x.ai/v1")
claude_client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

POLITICIAN_ID = "7abadf92"
POLITICIAN_NAME = "한동훈"

# 등급 매핑
ALPHABET_GRADES = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}

# 전체 10개 카테고리
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

BATCH_SIZE = 10  # 한 번에 평가할 뉴스 개수

def get_all_150_items(politician_id, category_eng):
    """150개 데이터 풀 생성"""
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
    return all_items

def create_batch_prompt(items, category_kor):
    """배치 평가 프롬프트 생성"""
    prompt = f"""다음은 정치인 "{POLITICIAN_NAME}"에 대한 {len(items)}개의 뉴스 자료입니다.
각 뉴스를 "{category_kor}" 관점에서 A~H 등급을 부여하고 근거를 작성해주세요.

등급 기준:
A (8점): 매우 우수
B (6점): 우수
C (4점): 양호
D (2점): 보통
E (-2점): 미흡
F (-4점): 부족
G (-6점): 매우 부족
H (-8점): 치명적 결함

"""

    for idx, item in enumerate(items, 1):
        prompt += f"""
뉴스 {idx}:
제목: {item['data_title']}
내용: {item['data_content'][:300]}
출처: {item['data_source']}
"""

    prompt += f"""

JSON 배열 형식으로 답변 (정확히 {len(items)}개):
[
  {{
    "news_number": 1,
    "rating": "A-H 중 하나",
    "rating_rationale": "50자 이상 평가 근거"
  }},
  ...
]
"""

    return prompt

def evaluate_batch_with_ai(ai_name, items, category_kor):
    """배치로 평가 요청"""
    prompt = create_batch_prompt(items, category_kor)

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
                max_tokens=4000,
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

        results = json.loads(content)

        # 결과 검증
        if len(results) != len(items):
            print(f"    ⚠️ 예상 {len(items)}개, 받음 {len(results)}개")

        return results

    except Exception as e:
        print(f"    ❌ {ai_name} 배치 평가 오류: {e}")
        return None

def evaluate_all_150_items_batch(data_pool, category_kor):
    """배치 방식으로 150개 평가"""
    print(f"\n[Step 2] {category_kor} 데이터 풀 배치 평가 시작...")

    num_batches = (len(data_pool) + BATCH_SIZE - 1) // BATCH_SIZE
    total_api_calls = num_batches * 3

    print(f"  배치 크기: {BATCH_SIZE}개")
    print(f"  배치 수: {num_batches}개")
    print(f"  API 호출 수: {total_api_calls}회 (기존 {len(data_pool) * 3}회 대비 {100 - total_api_calls*100//(len(data_pool)*3)}% 감소)")
    print(f"  예상 소요 시간: 약 {total_api_calls * 3 // 60}분")

    results = {
        'ChatGPT': [],
        'Grok': [],
        'Claude': []
    }

    current_api_call = 0

    # 배치별 처리
    for batch_idx in range(num_batches):
        start_idx = batch_idx * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, len(data_pool))
        batch_items = data_pool[start_idx:end_idx]

        print(f"\n  [배치 {batch_idx+1}/{num_batches}] {start_idx+1}~{end_idx}번 뉴스 ({len(batch_items)}개)")

        # 3개 AI로 배치 평가
        for ai_name in ['ChatGPT', 'Grok', 'Claude']:
            current_api_call += 1
            print(f"    - {ai_name} 배치 평가 중 ({current_api_call}/{total_api_calls})...", end=' ')

            batch_results = evaluate_batch_with_ai(ai_name, batch_items, category_kor)















                print(f"✅ {len(batch_results)}개 완료")
            else:
                print(f"❌ 실패")

            time.sleep(2)  # API 호출 제한

    print(f"\n  최종 평가 결과:")
    print(f"    ChatGPT: {len(results['ChatGPT'])}개")
    print(f"    Grok: {len(results['Grok'])}개")
    print(f"    Claude: {len(results['Claude'])}개")

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

def process_category(category_eng, category_kor):
    """단일 카테고리 처리"""
    print("\n" + "="*80)
    print(f"카테고리: {category_eng} ({category_kor})")
    print("="*80)

    start_time = datetime.now()

    # Step 1: 150개 데이터 풀 생성
    data_pool = get_all_150_items(POLITICIAN_ID, category_eng)

    if len(data_pool) == 0:
        print(f"❌ {category_eng} 데이터 풀이 비어있습니다!")
        return None

    # Step 2: 배치로 평가
    results = evaluate_all_150_items_batch(data_pool, category_kor)

    # Step 3: 최종 점수 계산
    scores, final_score = calculate_final_scores(results)

    # 결과 저장
    output_file = f"pooling_batch_results_{POLITICIAN_NAME}_{category_eng}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'data_pool_size': len(data_pool),
            'evaluation_results': results,
            'scores': scores,
            'final_score': final_score
        }, f, ensure_ascii=False, indent=2)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds() / 60

    print(f"\n✅ {category_eng} 완료! (소요시간: {duration:.1f}분)")

    return {
        'category_eng': category_eng,
        'category_kor': category_kor,
        'final_score': final_score,
        'scores': scores,
        'duration_minutes': duration
    }

def main():
    print("="*80)
    print("배치 풀링 시스템 - 전체 카테고리 평가 (API 호출 최적화)")
    print("="*80)
    print(f"정치인: {POLITICIAN_NAME}")
    print(f"카테고리: 10개 전체")
    print(f"배치 크기: {BATCH_SIZE}개")
    print(f"API 호출 최적화: 4,500회 → 450회 (90% 감소)")
    print(f"예상 비용 절감: 약 90%")
    print("="*80)

    overall_start = datetime.now()
    all_results = []

    for idx, (category_eng, category_kor) in enumerate(CATEGORIES, 1):
        print(f"\n{'='*80}")
        print(f"[{idx}/10] {category_eng} ({category_kor}) 시작...")
        print(f"{'='*80}")

        result = process_category(category_eng, category_kor)

        if result:
            all_results.append(result)

        print(f"\n진행률: {idx}/10 완료 ({idx*10}%)")

    overall_end = datetime.now()
    total_duration = (overall_end - overall_start).total_seconds() / 60

    # 전체 결과 요약
    print("\n" + "="*80)
    print("📊 전체 카테고리 결과 요약 (김동연)")
    print("="*80)

    total_chatgpt = 0
    total_grok = 0
    total_claude = 0
    total_final = 0

    for result in all_results:
        chatgpt_score = result['scores']['ChatGPT']['category_score']
        grok_score = result['scores']['Grok']['category_score']
        claude_score = result['scores']['Claude']['category_score']

        total_chatgpt += chatgpt_score
        total_grok += grok_score
        total_claude += claude_score
        total_final += result['final_score']

        print(f"\n{result['category_eng']} ({result['category_kor']}):")
        print(f"  ChatGPT: {chatgpt_score:.1f}점")
        print(f"  Grok:    {grok_score:.1f}점")
        print(f"  Claude:  {claude_score:.1f}점")
        print(f"  최종:    {result['final_score']:.1f}점")

    # 10개 카테고리 종합 점수
    avg_chatgpt = total_chatgpt / len(all_results)
    avg_grok = total_grok / len(all_results)
    avg_claude = total_claude / len(all_results)
    avg_final = total_final / len(all_results)

    print(f"\n{'='*80}")
    print("🏆 김동연 종합 점수 (10개 카테고리 평균)")
    print(f"{'='*80}")
    print(f"  ChatGPT 종합: {avg_chatgpt:.1f}점")
    print(f"  Grok 종합:    {avg_grok:.1f}점")
    print(f"  Claude 종합:  {avg_claude:.1f}점")
    print(f"  ─────────────────────────────")
    print(f"  ✅ 최종 종합 점수: {avg_final:.1f}점")
    print(f"{'='*80}")

    print(f"\n총 소요 시간: {total_duration:.1f}분 ({total_duration/60:.1f}시간)")

    # 전체 결과 저장
    summary_file = f"pooling_batch_summary_{POLITICIAN_NAME}.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump({
            'politician_name': POLITICIAN_NAME,
            'total_categories': len(all_results),
            'total_duration_minutes': total_duration,
            'results': all_results,
            'overall_scores': {
                'chatgpt_average': avg_chatgpt,
                'grok_average': avg_grok,
                'claude_average': avg_claude,
                'final_average': avg_final
            }
        }, f, ensure_ascii=False, indent=2)

    print(f"\n전체 요약 파일: {summary_file}")
    print(f"{'='*80}")

if __name__ == "__main__":
    main()
