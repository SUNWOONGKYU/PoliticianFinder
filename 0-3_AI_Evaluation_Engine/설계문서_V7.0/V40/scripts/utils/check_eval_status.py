#!/usr/bin/env python3
"""V40 평가 완료 현황 확인"""

from supabase import create_client
import os
from dotenv import load_dotenv

# 프로젝트 루트의 .env 파일 로드
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
env_path = os.path.join(project_root, '.env')
load_dotenv(env_path)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'f9e00370'
ais = ['Claude', 'ChatGPT', 'Gemini', 'Grok']

print("=" * 60)
print("V40 평가 완료 현황: 김민석 (f9e00370)")
print("=" * 60)

total_by_ai = {}

for ai in ais:
    result = supabase.table('evaluations_v40')\
        .select('*', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('evaluator_ai', ai)\
        .execute()

    count = result.count if hasattr(result, 'count') else 0
    total_by_ai[ai] = count
    percentage = (count / 1000) * 100  # V40: 1000개 per AI (Gemini 500 + Naver 500 = 1000 total, 각 AI가 평가)
    status = "✅" if count == 1000 else "⚠️"
    print(f"- {ai}: {count}/1000 ({percentage:.1f}%) {status}")

total = sum(total_by_ai.values())
print("=" * 60)
print(f"총 평가: {total}/4000 ({(total/4000)*100:.1f}%)")  # 4 AIs × 1000 items = 4000
print("=" * 60)

# 카테고리별 통계 (Claude만)
print("\n📊 Claude 카테고리별 평가:")
print("-" * 60)

categories = [
    ('expertise', '전문성'),
    ('leadership', '리더십'),
    ('vision', '비전'),
    ('integrity', '청렴성'),
    ('ethics', '윤리성'),
    ('accountability', '책임감'),
    ('transparency', '투명성'),
    ('communication', '소통능력'),
    ('responsiveness', '대응성'),
    ('publicinterest', '공익성')
]

for cat_eng, cat_kor in categories:
    result = supabase.table('evaluations_v40')\
        .select('*', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('evaluator_ai', 'Claude')\
        .eq('category', cat_eng)\
        .execute()

    count = result.count if hasattr(result, 'count') else 0
    status = "✅" if count == 100 else "❌"
    print(f"  {status} {cat_kor} ({cat_eng}): {count}/100")  # V40: 100 items per category

print("=" * 60)
