#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V40 재수집 스크립트

목적: 검증 후 목표 미달 카테고리에 대해 추가 데이터 수집
"""

import sys
import io

# UTF-8 출력 설정 (최우선)
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

# 환경 변수 로드
SCRIPT_DIR = Path(__file__).resolve().parent
env_path = SCRIPT_DIR.parent.parent.parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path, override=True)
else:
    load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V40 프로세스 호출
sys.path.insert(0, str(SCRIPT_DIR))

# collect_v40.py의 함수들을 재사용
def get_current_count(politician_id, category):
    """현재 카테고리별 데이터 수 조회"""
    result = supabase.table('collected_data_v40')\
        .select('id', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('category', category)\
        .execute()
    return result.count


def recollect_category(politician_id, politician_name, category, target=120):
    """
    특정 카테고리에 대해 목표 수량까지 재수집

    Args:
        politician_id: 정치인 ID
        politician_name: 정치인 이름
        category: 재수집할 카테고리
        target: 목표 수량 (기본 120)
    """
    print(f'\n{"="*60}')
    print(f'[재수집] {politician_name} - {category}')
    print(f'{"="*60}')

    # 현재 데이터 수 확인
    current_count = get_current_count(politician_id, category)
    gap = target - current_count

    if gap <= 0:
        print(f'[OK] 이미 목표 달성: {current_count}/{target}')
        return {
            'category': category,
            'before': current_count,
            'collected': 0,
            'after': current_count,
            'status': 'already_complete'
        }

    print(f'현재: {current_count}/{target}')
    print(f'부족: {gap}개')
    print(f'목표: +{gap}개 추가 수집')
    print()

    # collect_v40.py 호출 (카테고리별 재수집)
    # 기존 collect_v40.py를 수정해서 특정 카테고리만 수집하도록 호출
    import subprocess

    # Gemini CLI로 수집
    print(f'[1/2] Gemini CLI로 {category} 수집 중...')
    try:
        # Gemini CLI 수집 스크립트 호출
        # 실제 구현은 collect_v40.py의 로직을 참조해야 함
        print('[INFO] Gemini CLI 수집은 수동으로 실행해야 합니다')
        print(f'       gemini-cli ask "정치인 {politician_name}의 {category} 관련 자료 검색"')
    except Exception as e:
        print(f'[ERROR] Gemini CLI 수집 실패: {e}')

    # Naver API로 수집
    print(f'\n[2/2] Naver API로 {category} 수집 중...')
    try:
        # Naver API 수집 스크립트 호출
        print('[INFO] Naver API 수집은 수동으로 실행해야 합니다')
        print(f'       또는 collect_naver.py 스크립트 사용')
    except Exception as e:
        print(f'[ERROR] Naver API 수집 실패: {e}')

    # 수집 후 데이터 수 재확인
    after_count = get_current_count(politician_id, category)
    collected = after_count - current_count

    print(f'\n{"="*60}')
    print(f'재수집 결과:')
    print(f'  이전: {current_count}개')
    print(f'  수집: +{collected}개')
    print(f'  이후: {after_count}/{target}')

    if after_count >= target:
        print(f'  상태: [OK] 목표 달성')
    else:
        print(f'  상태: [INCOMPLETE] {target - after_count}개 더 필요')
    print(f'{"="*60}')

    return {
        'category': category,
        'before': current_count,
        'collected': collected,
        'after': after_count,
        'target': target,
        'status': 'complete' if after_count >= target else 'incomplete'
    }


def recollect_all_gaps(politician_id, politician_name, target=120):
    """
    모든 목표 미달 카테고리 재수집
    """
    categories = [
        'expertise', 'leadership', 'vision', 'integrity', 'ethics',
        'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
    ]

    print(f'\n{"="*60}')
    print(f'[전체 재수집] {politician_name}')
    print(f'{"="*60}')

    # 1. 현재 상태 확인
    print('\n현재 상태:')
    gaps = []
    for category in categories:
        count = get_current_count(politician_id, category)
        gap = target - count
        if gap > 0:
            gaps.append((category, gap))
            print(f'  {category:20s}: {count:3d}/{target} ({gap:+3d})')

    if not gaps:
        print('[OK] 모든 카테고리가 이미 목표 달성')
        return

    print(f'\n총 {len(gaps)}개 카테고리에서 {sum(g[1] for g in gaps)}개 부족')
    print()

    # 2. 우선순위 정렬 (gap이 큰 순서대로)
    gaps.sort(key=lambda x: -x[1])

    print('재수집 우선순위:')
    for i, (category, gap) in enumerate(gaps, 1):
        print(f'  {i}. {category:20s}: +{gap}개')
    print()

    # 3. 순차적으로 재수집
    results = []
    for i, (category, gap) in enumerate(gaps, 1):
        print(f'\n[{i}/{len(gaps)}] {category} 재수집 시작...')
        result = recollect_category(politician_id, politician_name, category, target)
        results.append(result)

    # 4. 최종 결과 요약
    print(f'\n{"="*60}')
    print('전체 재수집 결과 요약:')
    print(f'{"="*60}')

    total_collected = sum(r['collected'] for r in results)
    complete_count = sum(1 for r in results if r['status'] in ['complete', 'already_complete'])

    print(f'총 수집: +{total_collected}개')
    print(f'완료 카테고리: {complete_count}/{len(results)}')
    print()

    print('카테고리별 결과:')
    for r in results:
        status_mark = '[OK]' if r['status'] in ['complete', 'already_complete'] else '[INCOMPLETE]'
        print(f'  {r["category"]:20s}: {r["before"]:3d} → {r["after"]:3d} (+{r["collected"]}) {status_mark}')

    print(f'{"="*60}')


def main():
    parser = argparse.ArgumentParser(description='V40 재수집 스크립트')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category', help='재수집할 카테고리 (지정하지 않으면 전체)')
    parser.add_argument('--target', type=int, default=120, help='목표 수량 (기본 120)')

    args = parser.parse_args()

    if args.category:
        # 단일 카테고리 재수집
        result = recollect_category(
            args.politician_id,
            args.politician_name,
            args.category,
            args.target
        )
    else:
        # 전체 미달 카테고리 재수집
        recollect_all_gaps(
            args.politician_id,
            args.politician_name,
            args.target
        )


if __name__ == '__main__':
    main()
