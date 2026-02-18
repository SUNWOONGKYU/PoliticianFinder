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

print("V40 Evaluation Status (Kim Min-seok f9e00370)")
print("=" * 60)

for ai in ais:
    result = supabase.table('evaluations_v40')\
        .select('*', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('evaluator_ai', ai)\
        .execute()

    count = result.count if hasattr(result, 'count') else 0
    percentage = (count / 1000) * 100  # V40 1000개 (Gemini 500 + Naver 500)
    print(f"{ai}: {count}/1000 ({percentage:.1f}%)")

print("=" * 60)

# Claude category breakdown
print("\nClaude by category:")
categories = ['expertise', 'leadership', 'vision', 'integrity', 'ethics',
              'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest']

for cat in categories:
    result = supabase.table('evaluations_v40')\
        .select('*', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('evaluator_ai', 'Claude')\
        .eq('category', cat)\
        .execute()

    count = result.count if hasattr(result, 'count') else 0
    print(f"  {cat}: {count}/100")  # V40 카테고리당 100개 (Gemini 50 + Naver 50)
