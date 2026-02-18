#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V40 간단한 재수집 스크립트

subprocess 출력 문제를 피하기 위해 os.system() 사용
"""

import sys
import io

# UTF-8 출력 설정
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        pass

import os
import argparse
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent

# 환경 변수 로드
env_path = V40_DIR.parent / '.env'
if env_path.exists():
    load_dotenv(env_path, override=True)
else:
    load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 카테고리 목록
CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]


def get_current_count(politician_id, category):
    """현재 카테고리별 데이터 수 조회"""
    result = supabase.table('collected_data_v40')\
        .select('id', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('category', category)\
        .execute()
    return result.count


def analyze_gaps(politician_id, target=120):
    """목표 미달 카테고리 분석"""
    gaps = []
    for category in CATEGORIES:
        count = get_current_count(politician_id, category)
        gap = target - count
        if gap > 0:
            gaps.append((category, count, gap))
    return gaps


def recollect_category_simple(politician_id, politician_name, category):
    """단일 카테고리 재수집 (간단 버전)"""
    print(f'\n{"="*60}')
    print(f'[재수집] {politician_name} - {category}')
    print(f'{"="*60}\n')

    # 현재 상태
    before = get_current_count(politician_id, category)
    print(f'현재: {before}/120\n')

    # Naver API 수집
    print('[1/2] Naver API 수집 중...')
    naver_script = SCRIPT_DIR / 'collect_naver_v40_final.py'
    naver_cmd = f'python "{naver_script}" --politician-id {politician_id} --politician-name "{politician_name}" --category {category}'
    print(f'[CMD] {naver_cmd}\n')

    os.system(naver_cmd)

    # Gemini CLI 수집 (manual step - Gemini CLI requires interactive input)
    print('\n[2/2] Gemini CLI 수집...')
    print(f'[INFO] Gemini CLI는 대화형이므로 별도 실행이 필요합니다:')
    print(f'       python collect_gemini_v40_final.py --politician "{politician_name}" --category {category}')
    print()

    # 수집 후 상태
    after = get_current_count(politician_id, category)
    collected = after - before

    print(f'\n{"="*60}')
    print(f'재수집 결과:')
    print(f'  이전: {before}개')
    print(f'  수집: +{collected}개 (Naver만)')
    print(f'  이후: {after}/120')

    if after >= 120:
        print(f'  상태: [OK] 목표 달성')
    else:
        print(f'  상태: [INCOMPLETE] {120 - after}개 더 필요')
    print(f'{"="*60}\n')

    return after, collected


def main():
    parser = argparse.ArgumentParser(description='V40 간단 재수집')
    parser.add_argument('--politician-id', required=True, help='정치인 ID')
    parser.add_argument('--politician-name', required=True, help='정치인 이름')
    parser.add_argument('--category', help='재수집할 카테고리 (지정하지 않으면 전체)')
    parser.add_argument('--target', type=int, default=120, help='목표 수량')

    args = parser.parse_args()

    if args.category:
        # 단일 카테고리
        if args.category not in CATEGORIES:
            print(f'[ERROR] 잘못된 카테고리: {args.category}')
            return

        recollect_category_simple(args.politician_id, args.politician_name, args.category)
    else:
        # 전체 미달 카테고리
        print(f'\n{"="*60}')
        print(f'[분석] {args.politician_name} - 전체 카테고리')
        print(f'{"="*60}\n')

        gaps = analyze_gaps(args.politician_id, args.target)

        if not gaps:
            print('[OK] 모든 카테고리가 이미 목표 달성')
            return

        # Gap이 큰 순서대로 정렬
        gaps.sort(key=lambda x: -x[2])

        print('재수집 필요 카테고리:')
        for i, (category, count, gap) in enumerate(gaps, 1):
            print(f'  {i}. {category:20s}: {count:3d}/120 (+{gap})')
        print()

        total_collected = 0
        for i, (category, count, gap) in enumerate(gaps, 1):
            print(f'\n[{i}/{len(gaps)}] {category} 처리 중...')
            after, collected = recollect_category_simple(
                args.politician_id,
                args.politician_name,
                category
            )
            total_collected += collected

            # 다음 카테고리로 계속 진행 여부 (자동으로 계속)
            print(f'계속 진행...\n')

        # 최종 요약
        print(f'\n{"="*60}')
        print('전체 재수집 완료')
        print(f'{"="*60}')
        print(f'총 수집: +{total_collected}개 (Naver만)')
        print(f'처리 카테고리: {len(gaps)}개')
        print(f'{"="*60}')


if __name__ == '__main__':
    main()
