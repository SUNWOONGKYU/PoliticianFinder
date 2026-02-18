# encoding: utf-8
import os
from supabase import create_client
from dotenv import load_dotenv
import json
from collections import defaultdict

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'd0a5d6e1'

print("Extracting data for JoEunHee...")

# 1. Final scores
print("  1/5 Final scores...")
final = supabase.table('politician_final_scores_v40').select('*').eq('politician_id', politician_id).execute()

# 2. Category scores
print("  2/5 Category scores...")
categories = supabase.table('politician_category_scores_v40').select('*').eq('politician_id', politician_id).execute()

# 3. Collected data
print("  3/5 Collected data...")
collected = supabase.table('collected_data_v40').select('id, title, content, source_name, source_url, published_date, collector_ai, data_type, topic_mode, category').eq('politician_id', politician_id).execute()

# 4. Evaluations (with reasoning)
print("  4/5 Evaluations...")
evals = supabase.table('evaluations_v40').select('*').eq('politician_id', politician_id).execute()

# 5. Extract TOP/BOTTOM examples by category
print("  5/5 Extracting examples...")
category_data = defaultdict(lambda: {'positive': [], 'negative': []})

for ev in evals.data:
    cat = ev['category']
    score = ev.get('score', 0)
    item = next((c for c in collected.data if c['id'] == ev['id']), None)
    if item:
        entry = {
            'title': item['title'],
            'content': item.get('content', '')[:200],
            'source': item['source_name'],
            'url': item['source_url'],
            'date': item['published_date'],
            'rating': ev['rating'],
            'score': score,
            'reasoning': ev['reasoning'],
            'ai': ev['evaluator_ai']
        }
        if score >= 4:
            category_data[cat]['positive'].append(entry)
        elif score <= -2:
            category_data[cat]['negative'].append(entry)

for cat in category_data:
    category_data[cat]['positive'].sort(key=lambda x: x['score'], reverse=True)
    category_data[cat]['negative'].sort(key=lambda x: x['score'])

output = {
    'final_scores': final.data[0] if final.data else {},
    'category_scores': categories.data,
    'category_examples': dict(category_data),
    'stats': {
        'total_collected': len(collected.data),
        'total_evaluations': len(evals.data),
        'by_data_type': {
            'OFFICIAL': len([c for c in collected.data if c['data_type'] == 'official']),
            'PUBLIC': len([c for c in collected.data if c['data_type'] == 'public'])
        },
        'by_topic': {
            'positive': len([c for c in collected.data if c['topic_mode'] == 'positive']),
            'negative': len([c for c in collected.data if c['topic_mode'] == 'negative']),
            'free': len([c for c in collected.data if c['topic_mode'] == 'free'])
        }
    }
}

with open('report_data_조은희.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("\nData extraction completed!")
print(f"  Final score: {output['final_scores'].get('final_score')} points")
print(f"  Collected: {output['stats']['total_collected']} items")
print(f"  Evaluations: {output['stats']['total_evaluations']} items")
print(f"  OFFICIAL: {output['stats']['by_data_type']['OFFICIAL']} items")
print(f"  PUBLIC: {output['stats']['by_data_type']['PUBLIC']} items")
