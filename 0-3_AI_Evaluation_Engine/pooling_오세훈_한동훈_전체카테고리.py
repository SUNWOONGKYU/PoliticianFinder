#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
오세훈, 한동훈 전체 10개 카테고리 풀링 시스템
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

# 테스트할 정치인 2명
TEST_POLITICIANS = [
    {'id': '62e7b453', 'name': '오세훈'},
    {'id': '7abadf92', 'name': '한동훈'}
]

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

# 등급 매핑
ALPHABET_GRADES = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}

BATCH_SIZE = 10

def get_all_150_items(politician_id, category_eng):
    """150개 데이터 풀 생성"""
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

    return all_items

def create_batch_prompt(items, politician_name, category_kor):
    """배치 평가 프롬프트"""
    prompt = f"""다음은 정치인 "{politician_name}"에 대한 {len(items)}개의 뉴스 자료입니다.
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
"""

    prompt += f"""

JSON 배열 형식으로 답변:
[
  {{"news_number": 1, "rating": "A-H", "rating_rationale": "50자 이상"}},
  ...
]
"""
    return prompt

def validate_and_extract_rating(rating_str):
    """Rating 문자열에서 A-H 등급만 추출"""
    rating_str = str(rating_str).strip().upper()
    for grade in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']:
        if grade in rating_str:
            return grade
    return 'D'  # 기본값

def evaluate_batch_with_ai(ai_name, items, politician_name, category_kor):
    """배치 평가"""
    prompt = create_batch_prompt(items, politician_name, category_kor)

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

        return json.loads(content)

    except Exception as e:
        print(f" ❌ {ai_name} 오류: {e}")
        return None

def evaluate_category(politician_id, politician_name, category_eng, category_kor):
    """단일 카테고리 평가"""
    print(f"\n  [{category_eng} ({category_kor})]")

    # 데이터 풀 생성
    data_pool = get_all_150_items(politician_id, category_eng)

    if len(data_pool) == 0:
        print(f"    ❌ 데이터 없음!")
        return None

    print(f"    데이터: {len(data_pool)}개")

    # 배치 평가
    results = {'ChatGPT': [], 'Grok': [], 'Claude': []}
    num_batches = (len(data_pool) + BATCH_SIZE - 1) // BATCH_SIZE

    for batch_idx in range(num_batches):
        start_idx = batch_idx * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, len(data_pool))
        batch_items = data_pool[start_idx:end_idx]

        for ai_name in ['ChatGPT', 'Grok', 'Claude']:
            batch_results = evaluate_batch_with_ai(ai_name, batch_items, politician_name, category_kor)

            if batch_results:
                for idx, item in enumerate(batch_items):
                    if idx < len(batch_results):
                        rating = validate_and_extract_rating(batch_results[idx].get('rating', 'D'))
                        results[ai_name].append({
                            'item_id': item['id'],
                            'data_title': item['data_title'],
                            'new_rating': rating
                        })

            time.sleep(2)

    # 점수 계산
    scores = {}
    for ai_name in ['ChatGPT', 'Grok', 'Claude']:
        ratings = [ALPHABET_GRADES[item['new_rating']] for item in results[ai_name]]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        category_score = (6.0 + avg_rating * 0.5) * 10

        scores[ai_name] = category_score

    final_score = sum(scores.values()) / 3

    print(f"    ChatGPT: {scores['ChatGPT']:.1f} | Grok: {scores['Grok']:.1f} | Claude: {scores['Claude']:.1f} → 최종: {final_score:.1f} (차이: {max(scores.values()) - min(scores.values()):.1f})")

    return {
        'category_eng': category_eng,
        'category_kor': category_kor,
        'scores': scores,
        'final_score': final_score,
        'max_diff': max(scores.values()) - min(scores.values())
    }

def evaluate_politician(politician_id, politician_name):
    """단일 정치인 전체 카테고리 평가"""
    print(f"\n{'='*80}")
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"{'='*80}")

    start_time = datetime.now()
    category_results = []

    for category_eng, category_kor in CATEGORIES:
        result = evaluate_category(politician_id, politician_name, category_eng, category_kor)
        if result:
            category_results.append(result)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds() / 60

    # 종합 점수 계산
    total_chatgpt = sum(r['scores']['ChatGPT'] for r in category_results)
    total_grok = sum(r['scores']['Grok'] for r in category_results)
    total_claude = sum(r['scores']['Claude'] for r in category_results)

    avg_chatgpt = total_chatgpt / len(category_results) if category_results else 0
    avg_grok = total_grok / len(category_results) if category_results else 0
    avg_claude = total_claude / len(category_results) if category_results else 0
    avg_final = (avg_chatgpt + avg_grok + avg_claude) / 3

    print(f"\n  [종합 점수]")
    print(f"    ChatGPT: {avg_chatgpt:.1f}점")
    print(f"    Grok:    {avg_grok:.1f}점")
    print(f"    Claude:  {avg_claude:.1f}점")
    print(f"    최종:    {avg_final:.1f}점")
    print(f"    소요시간: {duration:.1f}분")

    return {
        'politician_id': politician_id,
        'politician_name': politician_name,
        'category_results': category_results,
        'overall_scores': {
            'chatgpt': avg_chatgpt,
            'grok': avg_grok,
            'claude': avg_claude,
            'final': avg_final
        },
        'duration_minutes': duration
    }

def main():
    print("="*80)
    print("오세훈, 한동훈 전체 10개 카테고리 풀링 시스템")
    print("="*80)
    print(f"정치인: {', '.join([p['name'] for p in TEST_POLITICIANS])}")
    print(f"카테고리: 10개 전체")
    print("="*80)

    overall_start = datetime.now()
    all_results = []

    for politician in TEST_POLITICIANS:
        result = evaluate_politician(politician['id'], politician['name'])
        if result:
            all_results.append(result)

    overall_end = datetime.now()
    total_duration = (overall_end - overall_start).total_seconds() / 60

    # 최종 요약
    print(f"\n{'='*80}")
    print("📊 최종 결과 요약")
    print(f"{'='*80}")

    for r in all_results:
        print(f"\n{r['politician_name']}:")
        print(f"  ChatGPT 평균: {r['overall_scores']['chatgpt']:.1f}점")
        print(f"  Grok 평균:    {r['overall_scores']['grok']:.1f}점")
        print(f"  Claude 평균:  {r['overall_scores']['claude']:.1f}점")
        print(f"  최종 평균:    {r['overall_scores']['final']:.1f}점")

        print(f"\n  카테고리별 상세:")
        for cat in r['category_results']:
            print(f"    {cat['category_eng']:15s}: ChatGPT {cat['scores']['ChatGPT']:.1f} | Grok {cat['scores']['Grok']:.1f} | Claude {cat['scores']['Claude']:.1f} (차이: {cat['max_diff']:.1f})")

    print(f"\n총 소요 시간: {total_duration:.1f}분 ({total_duration/60:.1f}시간)")
    print(f"{'='*80}")

    # 저장
    with open('pooling_오세훈_한동훈_전체카테고리_results.json', 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print(f"\n결과 저장: pooling_오세훈_한동훈_전체카테고리_results.json")

if __name__ == "__main__":
    main()
