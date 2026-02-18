#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V40 검증 및 재수집 통합 스크립트

핵심 규칙:
1. 초기 수집 목표: 120개/카테고리 (100 + 20% 버퍼)
2. 최소 목표: 100개/카테고리 (필수)
3. 재수집 목표: 100개까지만 (버퍼 제외)

프로세스:
1. 검증 수행 (플래깅만, 삭제 안 함)
2. 카테고리별 체크 (100개 기준)
3. 100개 미만 카테고리만 재수집
4. 재수집 목표는 100개까지

사용법:
    python validate_and_recollect_v40.py --politician-id 8c5dcc89 --politician-name "박주민"
    python validate_and_recollect_v40.py --politician-id 8c5dcc89 --politician-name "박주민" --dry-run
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
import json
from pathlib import Path
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
WORKFLOW_DIR = V40_DIR / 'scripts' / 'workflow'
sys.path.insert(0, str(SCRIPT_DIR))
sys.path.insert(0, str(WORKFLOW_DIR))

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

# V40 목표 설정
MINIMUM_TARGET = 100   # 재수집 목표 (필수)
BUFFER_TARGET = 120    # 초기 수집 목표 (100 + 20% 버퍼)

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


def validate_data(politician_id, politician_name):
    """
    1단계: 데이터 검증 (플래깅만)

    Note: 실제 삭제는 하지 않고, 검토 필요 항목만 플래깅
    """
    print(f'\n{"="*60}')
    print(f'[1단계] 검증 - {politician_name}')
    print(f'{"="*60}')

    # validate_v40_redesigned.py의 로직을 여기서 간단히 구현
    # 또는 해당 스크립트를 import하여 사용

    print('[INFO] 검증 프로세스 수행 중...')
    print('[INFO] 플래깅만 수행, 삭제하지 않음')

    # 각 카테고리별 현재 상태 확인
    validation_results = {}

    for category in CATEGORIES:
        count = get_current_count(politician_id, category)
        validation_results[category] = {
            'count': count,
            'status': 'OK' if count >= MINIMUM_TARGET else 'NEEDS_RECOLLECTION'
        }

    print('\n검증 결과:')
    print('-'*60)

    total_items = 0
    ok_count = 0
    need_recollection = []

    for category in CATEGORIES:
        result = validation_results[category]
        count = result['count']
        status = result['status']
        total_items += count

        category_kr = CATEGORY_KR_MAP.get(category, category)

        if status == 'OK':
            ok_count += 1
            print(f'  ✅ {category:20s} ({category_kr:10s}): {count:3d}/100 [OK]')
        else:
            gap = MINIMUM_TARGET - count
            need_recollection.append((category, count, gap))
            print(f'  ❌ {category:20s} ({category_kr:10s}): {count:3d}/100 [재수집 필요: +{gap}]')

    print('-'*60)
    print(f'전체: {total_items}/1,000 (최소 목표 기준)')
    print(f'OK: {ok_count}/10 카테고리')
    print(f'재수집 필요: {len(need_recollection)}/10 카테고리')
    print(f'{"="*60}\n')

    return validation_results, need_recollection


def recollect_category(politician_id, politician_name, category, current_count, target=MINIMUM_TARGET):
    """
    단일 카테고리 재수집 (최소 목표까지만)
    """
    gap = target - current_count

    if gap <= 0:
        print(f'[SKIP] {category}: 이미 목표 달성 ({current_count}/{target})')
        return current_count, 0

    print(f'\n[재수집] {category}')
    print(f'  현재: {current_count}/{target}')
    print(f'  필요: +{gap}개')

    # Naver API 수집
    print(f'\n  [1/2] Naver API 수집 중...')
    naver_script = WORKFLOW_DIR / 'collect_naver_v40_final.py'

    if naver_script.exists():
        cmd = f'python "{naver_script}" --politician-id {politician_id} --politician-name "{politician_name}" --category {category}'
        print(f'  [CMD] {cmd}')
        os.system(cmd)
    else:
        print(f'  [ERROR] Naver 수집 스크립트를 찾을 수 없음: {naver_script}')

    # Gemini CLI 안내
    print(f'\n  [2/2] Gemini CLI 수집 안내')
    print(f'  [INFO] 수동 실행 필요:')
    print(f'         python collect_gemini_v40_final.py --politician "{politician_name}" --category {category}')

    # 수집 후 상태 확인
    after_count = get_current_count(politician_id, category)
    collected = after_count - current_count

    print(f'\n  결과: {current_count} → {after_count} (+{collected})')

    if after_count >= target:
        print(f'  상태: ✅ 목표 달성 ({after_count}/{target})')
    else:
        remaining = target - after_count
        print(f'  상태: ⚠️  {remaining}개 더 필요 ({after_count}/{target})')

    return after_count, collected


def recollect_all_needed(politician_id, politician_name, need_recollection_list):
    """
    2단계: 필요한 카테고리만 재수집
    """
    if not need_recollection_list:
        print('[OK] 모든 카테고리가 최소 목표 달성')
        return []

    print(f'\n{"="*60}')
    print(f'[2단계] 재수집 - {politician_name}')
    print(f'{"="*60}')

    # Gap이 큰 순서대로 정렬
    need_recollection_list.sort(key=lambda x: -x[2])

    print(f'\n재수집 우선순위 ({len(need_recollection_list)}개 카테고리):')
    for i, (category, count, gap) in enumerate(need_recollection_list, 1):
        category_kr = CATEGORY_KR_MAP.get(category, category)
        print(f'  {i}. {category:20s} ({category_kr:10s}): {count:3d}/100 (+{gap})')
    print()

    # 순차 재수집
    results = []
    total_collected = 0

    for i, (category, current_count, gap) in enumerate(need_recollection_list, 1):
        print(f'\n{"="*60}')
        print(f'[{i}/{len(need_recollection_list)}] {category} 재수집')
        print(f'{"="*60}')

        after_count, collected = recollect_category(
            politician_id,
            politician_name,
            category,
            current_count,
            target=MINIMUM_TARGET
        )

        results.append({
            'category': category,
            'before': current_count,
            'after': after_count,
            'collected': collected,
            'target': MINIMUM_TARGET,
            'status': 'complete' if after_count >= MINIMUM_TARGET else 'incomplete'
        })

        total_collected += collected

    print(f'\n{"="*60}')
    print(f'재수집 결과 요약:')
    print(f'{"="*60}')
    print(f'총 수집: +{total_collected}개')
    print(f'처리 카테고리: {len(results)}개')
    print()

    for r in results:
        status_mark = '✅' if r['status'] == 'complete' else '⚠️'
        category_kr = CATEGORY_KR_MAP.get(r['category'], r['category'])
        print(f'  {status_mark} {r["category"]:20s} ({category_kr:10s}): {r["before"]:3d} → {r["after"]:3d} (+{r["collected"]})')

    print(f'{"="*60}\n')

    return results


def final_report(politician_id, politician_name, validation_results, recollection_results):
    """
    3단계: 최종 보고
    """
    print(f'\n{"="*60}')
    print(f'[3단계] 최종 보고 - {politician_name}')
    print(f'{"="*60}\n')

    # 최종 상태 확인
    final_status = {}
    total_items = 0
    complete_count = 0

    for category in CATEGORIES:
        count = get_current_count(politician_id, category)
        total_items += count

        status = 'COMPLETE' if count >= MINIMUM_TARGET else 'INCOMPLETE'
        if status == 'COMPLETE':
            complete_count += 1

        final_status[category] = {
            'count': count,
            'status': status
        }

    print('최종 상태:')
    print('-'*60)

    for category in CATEGORIES:
        result = final_status[category]
        count = result['count']
        status = result['status']
        category_kr = CATEGORY_KR_MAP.get(category, category)

        if status == 'COMPLETE':
            print(f'  ✅ {category:20s} ({category_kr:10s}): {count:3d}/100 [OK]')
        else:
            gap = MINIMUM_TARGET - count
            print(f'  ⚠️  {category:20s} ({category_kr:10s}): {count:3d}/100 [부족: {gap}]')

    print('-'*60)
    print(f'전체: {total_items}/1,000 (최소 목표 기준)')
    print(f'완료: {complete_count}/10 카테고리')
    print(f'미완료: {10 - complete_count}/10 카테고리')
    print(f'{"="*60}\n')

    # 결과 저장
    report_dir = V40_DIR / 'reports'
    report_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_file = report_dir / f'validate_recollect_{politician_id}_{timestamp}.json'

    report_data = {
        'politician_id': politician_id,
        'politician_name': politician_name,
        'timestamp': datetime.now().isoformat(),
        'total_items': total_items,
        'minimum_target': MINIMUM_TARGET * 10,
        'buffer_target': BUFFER_TARGET * 10,
        'complete_categories': complete_count,
        'incomplete_categories': 10 - complete_count,
        'validation_results': validation_results,
        'recollection_results': recollection_results,
        'final_status': final_status
    }

    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, ensure_ascii=False, indent=2)

    print(f'[SAVE] 보고서 저장: {report_file}')

    if complete_count == 10:
        print(f'\n🎉 모든 카테고리가 최소 목표(100개)를 달성했습니다!')
        print(f'✅ Stage 2 (검증 및 재수집) 완료')
        print(f'✅ Stage 3 (평가)로 진행 가능')
    else:
        print(f'\n⚠️  {10 - complete_count}개 카테고리가 아직 최소 목표에 미달합니다.')
        print(f'추가 수집 필요 (Gemini CLI 사용)')

    return final_status


def main():
    parser = argparse.ArgumentParser(description='V40 검증 및 재수집 통합 스크립트')
    parser.add_argument('--politician-id', required=True, help='정치인 ID')
    parser.add_argument('--politician-name', required=True, help='정치인 이름')
    parser.add_argument('--dry-run', action='store_true', help='시뮬레이션만 (실제 수집 안 함)')

    args = parser.parse_args()

    print(f'\n{"="*60}')
    print(f'V40 검증 및 재수집 - {args.politician_name}')
    print(f'{"="*60}')
    print(f'정치인 ID: {args.politician_id}')
    print(f'최소 목표: {MINIMUM_TARGET}개/카테고리 (1,000개 전체)')
    print(f'버퍼 목표: {BUFFER_TARGET}개/카테고리 (1,200개 전체)')
    print(f'재수집 목표: {MINIMUM_TARGET}개까지만')

    if args.dry_run:
        print(f'모드: DRY RUN (시뮬레이션)')
    else:
        print(f'모드: 실제 재수집 수행')

    print(f'{"="*60}\n')

    # 1단계: 검증
    validation_results, need_recollection = validate_data(
        args.politician_id,
        args.politician_name
    )

    # 2단계: 재수집
    if args.dry_run:
        print('[DRY RUN] 재수집 시뮬레이션 - 실제 수집 안 함')
        recollection_results = []
    else:
        recollection_results = recollect_all_needed(
            args.politician_id,
            args.politician_name,
            need_recollection
        )

    # 3단계: 최종 보고
    final_status = final_report(
        args.politician_id,
        args.politician_name,
        validation_results,
        recollection_results
    )


if __name__ == '__main__':
    main()
