#!/usr/bin/env python3
"""V40 수집 현황 확인 스크립트"""

import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from collections import Counter

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env 로드
V40_DIR = Path(__file__).resolve().parent.parent.parent
env_paths = [V40_DIR.parent.parent / '.env', V40_DIR.parent / '.env', V40_DIR / '.env']
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path, override=True)
        break

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

def main():
    parser = argparse.ArgumentParser(description='V40 수집 현황 확인')
    parser.add_argument('--politician-id', required=True, help='정치인 ID (8자리 hex)')
    parser.add_argument('--politician-name', default='', help='정치인 이름 (표시용)')
    args = parser.parse_args()

    politician_id = args.politician_id
    politician_name = args.politician_name or politician_id

    # 전체 수집 데이터 조회 (pagination)
    all_data = []
    offset = 0
    while True:
        result = supabase.table('collected_data_v40')\
            .select('category, data_type, collector_ai')\
            .eq('politician_id', politician_id)\
            .range(offset, offset + 999)\
            .execute()
        if not result.data:
            break
        all_data.extend(result.data)
        if len(result.data) < 1000:
            break
        offset += 1000

    total = len(all_data)

    print(f'\n{"="*60}')
    print(f'  V40 수집 현황: {politician_name} ({politician_id})')
    print(f'{"="*60}')
    print(f'총 수집 데이터: {total}개\n')

    # 카테고리별, data_type별, collector_ai별 통계
    cats = Counter([(d['category'], d['data_type'], d['collector_ai']) for d in all_data])

    print(f"{'카테고리':<20} {'데이터타입':<10} {'수집AI':<10} {'건수':>5}")
    print("-" * 50)

    for key in sorted(cats.keys()):
        cat, dtype, ai = key
        print(f"{cat:<20} {dtype:<10} {ai:<10} {cats[key]:>5}")

    # 카테고리별 합계
    print(f"\n{'='*50}")
    print(f"카테고리별 합계 (목표: Gemini 50+ / Naver 50+):")
    print(f"{'='*50}")
    print(f"{'카테고리':<20} {'Gemini':>7} {'Naver':>7} {'합계':>7} {'상태'}")
    print("-" * 50)

    all_ok = True
    for cat in CATEGORIES:
        gemini = sum(v for (c, d, a), v in cats.items() if c == cat and a == 'Gemini')
        naver = sum(v for (c, d, a), v in cats.items() if c == cat and a == 'Naver')
        total_cat = gemini + naver

        if gemini >= 50 and naver >= 50:
            status = '✅ OK'
        elif gemini >= 50 or naver >= 50:
            status = '⚠️ 일부부족'
            all_ok = False
        else:
            status = '❌ 부족'
            all_ok = False

        print(f"{cat:<20} {gemini:>7} {naver:>7} {total_cat:>7} {status}")

    print("-" * 50)
    print(f"\n{'✅ 수집 완료!' if all_ok else '⚠️ 일부 카테고리 수집 부족 - 추가 수집 필요'}")
    print(f"\n다음 단계: Phase 2 검증 (validate_v40_fixed.py)" if all_ok else "")

if __name__ == '__main__':
    main()
