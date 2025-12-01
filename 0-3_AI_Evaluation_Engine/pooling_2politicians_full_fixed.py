#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Oh Se-hoon, Han Dong-hoon Full 10-Category Pooling System (Fixed)
- Batch processing (10 items per batch)
- Optimized parallel processing
- Enhanced rating parsing error handling
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

# UTF-8 encoding setup for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

load_dotenv()

# API clients
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
grok_client = OpenAI(api_key=os.getenv('XAI_API_KEY'), base_url="https://api.x.ai/v1")
claude_client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

# Test politicians
TEST_POLITICIANS = [
    {'id': '62e7b453', 'name': 'Oh Se-hoon'},
    {'id': '7abadf92', 'name': 'Han Dong-hoon'}
]

# All 10 categories
CATEGORIES = [
    ('Expertise', 'Expertise'),
    ('Leadership', 'Leadership'),
    ('Vision', 'Vision'),
    ('Integrity', 'Integrity'),
    ('Ethics', 'Ethics'),
    ('Accountability', 'Accountability'),
    ('Transparency', 'Transparency'),
    ('Communication', 'Communication'),
    ('Responsiveness', 'Responsiveness'),
    ('PublicInterest', 'Public Interest')
]

# Grade mapping
ALPHABET_GRADES = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}

BATCH_SIZE = 10

def get_all_150_items(politician_id, category_eng):
    """Create 150-item data pool"""
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
    """Create batch evaluation prompt"""
    prompt = f"""The following are {len(items)} news articles about politician "{politician_name}".
Please evaluate each article from the "{category_kor}" perspective and assign a grade from A to H.

Grading criteria:
A (8 points): Very excellent
B (6 points): Excellent
C (4 points): Good
D (2 points): Average
E (-2 points): Insufficient
F (-4 points): Poor
G (-6 points): Very poor
H (-8 points): Critical flaw

"""
    for idx, item in enumerate(items, 1):
        prompt += f"""
News {idx}:
Title: {item['data_title']}
Content: {item['data_content'][:300]}
"""

    prompt += f"""

**IMPORTANT: The rating field MUST contain ONLY one letter: A, B, C, D, E, F, G, or H. Do NOT include explanations in the rating field.**

Respond in JSON array format:
[
  {{"news_number": 1, "rating": "A", "rating_rationale": "Rationale with 50+ characters"}},
  {{"news_number": 2, "rating": "B", "rating_rationale": "Rationale with 50+ characters"}},
  ...
]
"""
    return prompt

def validate_and_extract_rating(rating_str):
    """Extract A-H grade from rating string (enhanced error handling)"""
    rating_str = str(rating_str).strip().upper()

    # Extract one of A-H
    for grade in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']:
        if grade in rating_str:
            return grade

    # Default to D (average)
    print(f"    Warning: Invalid rating: {rating_str[:50]}... -> Replaced with D")
    return 'D'

def evaluate_batch_with_ai(ai_name, items, politician_name, category_kor):
    """Batch evaluation (enhanced error handling)"""
    prompt = create_batch_prompt(items, politician_name, category_kor)
    max_retries = 3

    for attempt in range(max_retries):
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

            # Parse JSON
            content = content.strip()
            if '```' in content:
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
            content = content.strip()

            results = json.loads(content)

            # Validate and fix ratings
            for result in results:
                if 'rating' in result:
                    result['rating'] = validate_and_extract_rating(result['rating'])

            return results

        except Exception as e:
            print(f"    Warning: {ai_name} attempt {attempt+1}/{max_retries} failed: {str(e)[:100]}")
            if attempt < max_retries - 1:
                time.sleep(5)
            else:
                print(f"    Error: {ai_name} final failure")
                return None

def evaluate_category(politician_id, politician_name, category_eng, category_kor):
    """Evaluate single category"""
    print(f"\n  [{category_eng} ({category_kor})]")

    # Create data pool
    data_pool = get_all_150_items(politician_id, category_eng)

    if len(data_pool) == 0:
        print(f"    Error: No data!")
        return None

    print(f"    Data: {len(data_pool)} items")

    # Batch evaluation
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

    # Calculate scores
    scores = {}
    for ai_name in ['ChatGPT', 'Grok', 'Claude']:
        if results[ai_name]:
            ratings = [ALPHABET_GRADES[item['new_rating']] for item in results[ai_name]]
            avg_rating = sum(ratings) / len(ratings) if ratings else 0
            category_score = (6.0 + avg_rating * 0.5) * 10
            scores[ai_name] = category_score
        else:
            scores[ai_name] = 60.0  # Default

    final_score = sum(scores.values()) / 3

    print(f"    ChatGPT: {scores['ChatGPT']:.1f} | Grok: {scores['Grok']:.1f} | Claude: {scores['Claude']:.1f} -> Final: {final_score:.1f} (Diff: {max(scores.values()) - min(scores.values()):.1f})")

    return {
        'category_eng': category_eng,
        'category_kor': category_kor,
        'scores': scores,
        'final_score': final_score,
        'max_diff': max(scores.values()) - min(scores.values())
    }

def evaluate_politician(politician_id, politician_name):
    """Evaluate all categories for single politician"""
    print(f"\n{'='*80}")
    print(f"Politician: {politician_name} (ID: {politician_id})")
    print(f"{'='*80}")

    start_time = datetime.now()
    category_results = []

    for category_eng, category_kor in CATEGORIES:
        result = evaluate_category(politician_id, politician_name, category_eng, category_kor)
        if result:
            category_results.append(result)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds() / 60

    # Calculate overall scores
    if category_results:
        total_chatgpt = sum(r['scores']['ChatGPT'] for r in category_results)
        total_grok = sum(r['scores']['Grok'] for r in category_results)
        total_claude = sum(r['scores']['Claude'] for r in category_results)

        avg_chatgpt = total_chatgpt / len(category_results)
        avg_grok = total_grok / len(category_results)
        avg_claude = total_claude / len(category_results)
        avg_final = (avg_chatgpt + avg_grok + avg_claude) / 3

        print(f"\n  [Overall Scores]")
        print(f"    ChatGPT: {avg_chatgpt:.1f} points")
        print(f"    Grok:    {avg_grok:.1f} points")
        print(f"    Claude:  {avg_claude:.1f} points")
        print(f"    Final:   {avg_final:.1f} points")
        print(f"    Duration: {duration:.1f} minutes")

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

    return None

def main():
    print("="*80)
    print("Oh Se-hoon, Han Dong-hoon Full 10-Category Pooling System (Fixed)")
    print("="*80)
    print(f"Politicians: {', '.join([p['name'] for p in TEST_POLITICIANS])}")
    print(f"Categories: All 10")
    print("="*80)

    overall_start = datetime.now()
    all_results = []

    for politician in TEST_POLITICIANS:
        result = evaluate_politician(politician['id'], politician['name'])
        if result:
            all_results.append(result)

    overall_end = datetime.now()
    total_duration = (overall_end - overall_start).total_seconds() / 60

    # Final summary
    print(f"\n{'='*80}")
    print("Final Results Summary")
    print(f"{'='*80}")

    for r in all_results:
        print(f"\n{r['politician_name']}:")
        print(f"  ChatGPT avg: {r['overall_scores']['chatgpt']:.1f} points")
        print(f"  Grok avg:    {r['overall_scores']['grok']:.1f} points")
        print(f"  Claude avg:  {r['overall_scores']['claude']:.1f} points")
        print(f"  Final avg:   {r['overall_scores']['final']:.1f} points")

        print(f"\n  Category details:")
        for cat in r['category_results']:
            print(f"    {cat['category_eng']:15s}: ChatGPT {cat['scores']['ChatGPT']:.1f} | Grok {cat['scores']['Grok']:.1f} | Claude {cat['scores']['Claude']:.1f} (Diff: {cat['max_diff']:.1f})")

    print(f"\nTotal duration: {total_duration:.1f} minutes ({total_duration/60:.1f} hours)")
    print(f"{'='*80}")

    # Save results
    output_file = 'pooling_2politicians_full_results_fixed.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print(f"\nResults saved: {output_file}")

if __name__ == "__main__":
    main()
