#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
선택적 Gemini CLI 수집 (목표 미달 카테고리만)
"""

import sys
import io
import os
import subprocess
import argparse
from pathlib import Path

# UTF-8 출력 설정
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent

# Supabase
from dotenv import load_dotenv
env_path = V40_DIR.parent / '.env'
if env_path.exists():
    load_dotenv(env_path, override=True)
else:
    load_dotenv(override=True)

from supabase import create_client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

def get_current_count(politician_name, category):
    """현재 카테고리 데이터 수 조회"""
    result = supabase.table('collected_data_v40')\
        .select('id', count='exact')\
        .eq('politician_name', politician_name)\
        .eq('category', category)\
        .execute()
    return result.count

def collect_category(politician_name, category):
    """단일 카테고리 수집"""
    script = SCRIPT_DIR / 'collect_gemini_subprocess.py'

    cmd = [
        sys.executable,
        str(script),
        '--politician', politician_name,
        '--category', category
    ]

    print(f'\n[{category}] Gemini 수집 시작...')
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        print(f'[{category}] ✅ 완료')
    else:
        print(f'[{category}] ❌ 실패')
        if result.stderr:
            print(f'  Error: {result.stderr[:200]}')

    return result.returncode == 0

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--politician', required=True)
    parser.add_argument('--categories', required=True, help='쉼표로 구분된 카테고리 목록')
    parser.add_argument('--target', type=int, default=100, help='카테고리당 목표')

    args = parser.parse_args()

    categories = [c.strip() for c in args.categories.split(',')]

    print(f'선택적 Gemini 수집: {args.politician}')
    print(f'대상 카테고리: {len(categories)}개')
    print(f'목표: {args.target}개/카테고리')
    print('='*60)

    results = []

    for i, category in enumerate(categories, 1):
        # 현재 수 확인
        before = get_current_count(args.politician, category)

        print(f'\n[{i}/{len(categories)}] {category}')
        print(f'  현재: {before}/{args.target}')

        if before >= args.target:
            print(f'  ✅ 이미 목표 달성, 스킵')
            results.append({'category': category, 'status': 'skipped'})
            continue

        # 수집
        success = collect_category(args.politician, category)

        # 수집 후 수 확인
        after = get_current_count(args.politician, category)
        collected = after - before

        print(f'  결과: {before} → {after} (+{collected})')

        results.append({
            'category': category,
            'before': before,
            'after': after,
            'collected': collected,
            'status': 'complete' if after >= args.target else 'incomplete'
        })

    # 최종 요약
    print(f'\n{"="*60}')
    print('수집 완료 요약:')
    print(f'{"="*60}')

    total_collected = sum(r.get('collected', 0) for r in results)
    complete = sum(1 for r in results if r['status'] in ['complete', 'skipped'])

    print(f'총 수집: +{total_collected}개')
    print(f'완료: {complete}/{len(results)} 카테고리')
    print()

    for r in results:
        status_mark = '✅' if r['status'] in ['complete', 'skipped'] else '⚠️'
        if r['status'] == 'skipped':
            print(f'{status_mark} {r["category"]:20s}: 이미 목표 달성')
        else:
            print(f'{status_mark} {r["category"]:20s}: {r["before"]} → {r["after"]} (+{r["collected"]})')

if __name__ == '__main__':
    main()
