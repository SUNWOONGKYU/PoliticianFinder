#!/usr/bin/env python3
import os
import sys
from supabase import create_client
from dotenv import load_dotenv

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
env_path = os.path.join(project_root, '.env')
load_dotenv(env_path)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'f9e00370'
ais = ['Claude', 'ChatGPT', 'Gemini', 'Grok']

print("V30 Evaluation Status (Kim Min-seok f9e00370)")
print("=" * 60)

for ai in ais:
    result = supabase.table('evaluations_v30')\
        .select('*', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('evaluator_ai', ai)\
        .execute()

    count = result.count if hasattr(result, 'count') else 0
    percentage = (count / 500) * 100  # V30 500개 (Gemini 300 + Perplexity 200)
    print(f"{ai}: {count}/500 ({percentage:.1f}%)")

print("=" * 60)

# Claude category breakdown
print("\nClaude by category:")
categories = ['expertise', 'leadership', 'vision', 'integrity', 'ethics',
              'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest']

for cat in categories:
    result = supabase.table('evaluations_v30')\
        .select('*', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('evaluator_ai', 'Claude')\
        .eq('category', cat)\
        .execute()

    count = result.count if hasattr(result, 'count') else 0
    print(f"  {cat}: {count}/100")  # V30 카테고리당 100개 (Gemini 75 + Perplexity 25)
