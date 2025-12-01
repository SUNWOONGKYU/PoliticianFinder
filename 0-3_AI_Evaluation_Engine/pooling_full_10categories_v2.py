#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
30명 명단 정치인 2명 풀링 시스템 테스트
- 오세훈, 한동훈 (서울특별시)
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

# 테스트할 정치인 2명 (30명 명단에서)
TEST_POLITICIANS = [
    {'id': '62e7b453', 'name': '오세훈'},  # 서울특별시 #1
    {'id': '7abadf92', 'name': '한동훈'}   # 서울특별시 #7
]

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

BATCH_SIZE = 10

def get_all_150_items(politician_id, category_eng):
    """150개 데이터 풀 생성"""
    print(f"  [데이터 풀 생성] {category_eng}...")

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

    print(f"    총 {len(all_items)}개 (ChatGPT: {sum(1 for x in all_items if x['collected_by'] == 'ChatGPT')}, Grok: {sum(1 for x in all_items if x['collected_by'] == 'Grok')}, Claude: {sum(1 for x in all_items if x['collected_by'] == 'claude-3-5-haiku-20241022')})")
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

def evaluate_politician(politician_id, politician_name):
    """단일 정치인 평가"""
    print(f"\n{'='*80}")
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"카테고리: {CATEGORY_ENG} ({CATEGORY_KOR})")
    print(f"{'='*80}")

    # 데이터 풀 생성
    data_pool = get_all_150_items(politician_id, CATEGORY_ENG)

    if len(data_pool) == 0:
        print(f"  ❌ 데이터 없음!")
        return None

    # 배치 평가
    results = {'ChatGPT': [], 'Grok': [], 'Claude': []}
    num_batches = (len(data_pool) + BATCH_SIZE - 1) // BATCH_SIZE

    print(f"  [평가 시작] {num_batches}배치 × 3 AI = {num_batches * 3}회 호출")

    for batch_idx in range(num_batches):
        start_idx = batch_idx * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, len(data_pool))
        batch_items = data_pool[start_idx:end_idx]

        print(f"    배치 {batch_idx+1}/{num_batches} ({len(batch_items)}개):", end=' ')

        for ai_name in ['ChatGPT', 'Grok', 'Claude']:
            batch_results = evaluate_batch_with_ai(ai_name, batch_items, politician_name, CATEGORY_KOR)

            if batch_results:
                for idx, item in enumerate(batch_items):
                    if idx < len(batch_results):
                        results[ai_name].append({
                            'item_id': item['id'],
                            'data_title': item['data_title'],
                            'new_rating': batch_results[idx]['rating'].upper()
                        })

            time.sleep(2)

        print("✅")

    # 점수 계산
    scores = {}
    for ai_name in ['ChatGPT', 'Grok', 'Claude']:
        ratings = [ALPHABET_GRADES[item['new_rating']] for item in results[ai_name]]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        category_score = (6.0 + avg_rating * 0.5) * 10

        scores[ai_name] = category_score

    final_score = sum(scores.values()) / 3

    print(f"\n  [결과]")
    print(f"    ChatGPT: {scores['ChatGPT']:.1f}점")
    print(f"    Grok:    {scores['Grok']:.1f}점")
    print(f"    Claude:  {scores['Claude']:.1f}점")
    print(f"    최종:    {final_score:.1f}점")
    print(f"    차이:    {max(scores.values()) - min(scores.values()):.1f}점")

    return {
        'politician_id': politician_id,
        'politician_name': politician_name,
        'scores': scores,
        'final_score': final_score,
        'max_diff': max(scores.values()) - min(scores.values())
    }

def main():
    print("="*80)
    print("30명 명단 정치인 2명 풀링 시스템 테스트")
    print("="*80)
    print(f"테스트 정치인: {', '.join([p['name'] for p in TEST_POLITICIANS])}")
    print(f"테스트 카테고리: {CATEGORY_ENG} ({CATEGORY_KOR})")
    print("="*80)

    start_time = datetime.now()
    results = []

    for politician in TEST_POLITICIANS:
        result = evaluate_politician(politician['id'], politician['name'])
        if result:
            results.append(result)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds() / 60

    # 최종 요약
    print(f"\n{'='*80}")
    print("📊 최종 결과 요약")
    print(f"{'='*80}")

    for r in results:
        print(f"\n{r['politician_name']}:")
        print(f"  ChatGPT: {r['scores']['ChatGPT']:.1f}점")
        print(f"  Grok:    {r['scores']['Grok']:.1f}점")
        print(f"  Claude:  {r['scores']['Claude']:.1f}점")
        print(f"  최종:    {r['final_score']:.1f}점")
        print(f"  AI 간 차이: {r['max_diff']:.1f}점")

    print(f"\n소요 시간: {duration:.1f}분")
    print(f"{'='*80}")

    # 저장
    with open('pooling_test_오세훈_한동훈_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n결과 저장: pooling_test_오세훈_한동훈_results.json")

if __name__ == "__main__":
    main()
