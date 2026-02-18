#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V40 재수집 워크플로우

목적: 검증 후 목표 미달 카테고리에 대해 자동 재수집
방법: Gemini CLI + Naver API 병렬 수집

사용법:
    python recollect_workflow_v40.py --politician-id 8c5dcc89 --politician-name "박주민"
    python recollect_workflow_v40.py --politician-id 8c5dcc89 --politician-name "박주민" --category vision
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
import subprocess
from pathlib import Path
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
CORE_DIR = V40_DIR / 'scripts' / 'core'
sys.path.insert(0, str(CORE_DIR))

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

CATEGORY_KR_MAP = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력',
    'responsiveness': '대응성', 'publicinterest': '공익성'
}


def get_current_count(politician_id, category):
    """현재 카테고리별 데이터 수 조회"""
    result = supabase.table('collected_data_v40')\
        .select('id', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('category', category)\
        .execute()
    return result.count


def analyze_gaps(politician_id, politician_name, target=120):
    """목표 미달 카테고리 분석"""
    print(f'\n{"="*60}')
    print(f'[분석] {politician_name} 데이터 현황')
    print(f'{"="*60}\n')

    gaps = []
    total_current = 0

    for category in CATEGORIES:
        count = get_current_count(politician_id, category)
        total_current += count
        gap = target - count

        category_kr = CATEGORY_KR_MAP.get(category, category)
        status = 'CRITICAL' if gap > 0 else 'OK'

        print(f'{category:20s} ({category_kr:10s}): {count:3d}/{target} ({gap:+3d}) [{status}]')

        if gap > 0:
            gaps.append({
                'category': category,
                'category_kr': category_kr,
                'current': count,
                'gap': gap
            })

    print(f'\n{"="*60}')
    print(f'전체: {total_current:4d}/1,200 ({1200 - total_current:+4d})')
    print(f'미달 카테고리: {len(gaps)}개')
    print(f'{"="*60}\n')

    return gaps


def run_gemini_collection(politician_name, category, items_needed):
    """Gemini CLI 수집 실행"""
    print(f'\n[GEMINI] {category} 수집 시작...')
    print(f'목표: +{items_needed}개')

    script_path = SCRIPT_DIR / 'collect_gemini_v40_final.py'

    if not script_path.exists():
        print(f'[ERROR] Gemini 수집 스크립트를 찾을 수 없습니다: {script_path}')
        return False

    try:
        cmd = [
            sys.executable,
            str(script_path),
            '--politician', politician_name,
            '--category', category
        ]

        print(f'[CMD] {" ".join(cmd)}')

        result = subprocess.run(
            cmd,
            cwd=str(SCRIPT_DIR),
            capture_output=True,
            text=True,
            encoding='utf-8',
            timeout=300  # 5분 타임아웃
        )

        if result.returncode == 0:
            print(f'[OK] Gemini 수집 완료')
            # 출력 표시
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print(f'[ERROR] Gemini 수집 실패: {result.returncode}')
            if result.stderr:
                print(f'[STDERR] {result.stderr}')
            return False

    except subprocess.TimeoutExpired:
        print(f'[ERROR] Gemini 수집 타임아웃 (5분 초과)')
        return False
    except Exception as e:
        print(f'[ERROR] Gemini 수집 오류: {e}')
        return False


def run_naver_collection(politician_id, politician_name, category, items_needed):
    """Naver API 수집 실행"""
    print(f'\n[NAVER] {category} 수집 시작...')
    print(f'목표: +{items_needed}개')

    script_path = SCRIPT_DIR / 'collect_naver_v40_final.py'

    if not script_path.exists():
        print(f'[ERROR] Naver 수집 스크립트를 찾을 수 없습니다: {script_path}')
        return False

    try:
        cmd = [
            sys.executable,
            str(script_path),
            '--politician-id', politician_id,
            '--politician-name', politician_name,
            '--category', category
        ]

        print(f'[CMD] {" ".join(cmd)}')

        result = subprocess.run(
            cmd,
            cwd=str(SCRIPT_DIR),
            capture_output=True,
            text=True,
            encoding='utf-8',
            timeout=300  # 5분 타임아웃
        )

        if result.returncode == 0:
            print(f'[OK] Naver 수집 완료')
            # 출력 표시
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print(f'[ERROR] Naver 수집 실패: {result.returncode}')
            if result.stderr:
                print(f'[STDERR] {result.stderr}')
            return False

    except subprocess.TimeoutExpired:
        print(f'[ERROR] Naver 수집 타임아웃 (5분 초과)')
        return False
    except Exception as e:
        print(f'[ERROR] Naver 수집 오류: {e}')
        return False


def recollect_category(politician_id, politician_name, category, target=120):
    """단일 카테고리 재수집"""
    print(f'\n{"="*60}')
    print(f'[재수집] {politician_name} - {category}')
    print(f'{"="*60}')

    # 1. 현재 상태 확인
    before_count = get_current_count(politician_id, category)
    gap = target - before_count

    if gap <= 0:
        print(f'[OK] 이미 목표 달성: {before_count}/{target}')
        return {
            'category': category,
            'before': before_count,
            'collected': 0,
            'after': before_count,
            'status': 'already_complete'
        }

    print(f'현재: {before_count}/{target}')
    print(f'부족: {gap}개')

    # 2. Gemini CLI 수집
    gemini_success = run_gemini_collection(politician_name, category, gap)

    # 3. Naver API 수집
    naver_success = run_naver_collection(politician_id, politician_name, category, gap)

    # 4. 수집 후 데이터 수 재확인
    after_count = get_current_count(politician_id, category)
    collected = after_count - before_count

    print(f'\n{"="*60}')
    print(f'재수집 결과:')
    print(f'  이전: {before_count}개')
    print(f'  수집: +{collected}개')
    print(f'  이후: {after_count}/{target}')

    if after_count >= target:
        print(f'  상태: [OK] 목표 달성')
        status = 'complete'
    else:
        remaining = target - after_count
        print(f'  상태: [INCOMPLETE] {remaining}개 더 필요')
        status = 'incomplete'

    print(f'{"="*60}')

    return {
        'category': category,
        'before': before_count,
        'collected': collected,
        'after': after_count,
        'target': target,
        'status': status,
        'gemini_success': gemini_success,
        'naver_success': naver_success
    }


def recollect_all_gaps(politician_id, politician_name, target=120):
    """모든 목표 미달 카테고리 재수집"""
    print(f'\n{"="*60}')
    print(f'[전체 재수집] {politician_name}')
    print(f'{"="*60}')

    # 1. Gap 분석
    gaps = analyze_gaps(politician_id, politician_name, target)

    if not gaps:
        print('[OK] 모든 카테고리가 이미 목표 달성')
        return

    # 2. 우선순위 정렬 (gap이 큰 순서대로)
    gaps.sort(key=lambda x: -x['gap'])

    print('재수집 우선순위:')
    for i, gap_info in enumerate(gaps, 1):
        print(f'  {i}. {gap_info["category"]:20s} ({gap_info["category_kr"]:10s}): +{gap_info["gap"]}개')
    print()

    # 3. 순차적으로 재수집
    results = []
    for i, gap_info in enumerate(gaps, 1):
        category = gap_info['category']
        print(f'\n[{i}/{len(gaps)}] {category} 재수집 시작...')

        result = recollect_category(politician_id, politician_name, category, target)
        results.append(result)

        # 진행 상황 저장
        progress_file = V40_DIR / f'recollect_progress_{politician_id}.txt'
        with open(progress_file, 'a', encoding='utf-8') as f:
            f.write(f'{datetime.now().isoformat()} | {category} | {result["before"]} → {result["after"]} | {result["status"]}\n')

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

    # 5. 최종 상태 저장
    summary_file = V40_DIR / f'recollect_summary_{politician_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(f'재수집 결과 요약 - {politician_name}\n')
        f.write(f'{"="*60}\n')
        f.write(f'총 수집: +{total_collected}개\n')
        f.write(f'완료 카테고리: {complete_count}/{len(results)}\n\n')
        f.write('카테고리별 결과:\n')
        for r in results:
            status_mark = '[OK]' if r['status'] in ['complete', 'already_complete'] else '[INCOMPLETE]'
            f.write(f'  {r["category"]:20s}: {r["before"]:3d} → {r["after"]:3d} (+{r["collected"]}) {status_mark}\n')

    print(f'\n[SAVE] 결과 저장: {summary_file}')


def main():
    parser = argparse.ArgumentParser(description='V40 재수집 워크플로우')
    parser.add_argument('--politician-id', required=True, help='정치인 ID')
    parser.add_argument('--politician-name', required=True, help='정치인 이름')
    parser.add_argument('--category', help='재수집할 카테고리 (지정하지 않으면 전체)')
    parser.add_argument('--target', type=int, default=120, help='목표 수량 (기본 120)')

    args = parser.parse_args()

    if args.category:
        # 단일 카테고리 재수집
        if args.category not in CATEGORIES:
            print(f'[ERROR] 잘못된 카테고리: {args.category}')
            print(f'[INFO] 사용 가능한 카테고리: {", ".join(CATEGORIES)}')
            return

        result = recollect_category(
            args.politician_id,
            args.politician_name,
            args.category,
            args.target
        )

        print(f'\n최종 결과: {result["before"]} → {result["after"]} (+{result["collected"]})')
    else:
        # 전체 미달 카테고리 재수집
        recollect_all_gaps(
            args.politician_id,
            args.politician_name,
            args.target
        )


if __name__ == '__main__':
    main()
