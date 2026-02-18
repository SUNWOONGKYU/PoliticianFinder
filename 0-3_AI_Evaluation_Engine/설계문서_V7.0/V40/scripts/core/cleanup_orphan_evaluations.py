#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
고아 평가 정리 스크립트

고아 평가(Orphan Evaluations):
- evaluations_v40에 있지만 collected_data_v40에 없는 평가
- 원본 데이터가 삭제되었는데 평가는 남아있는 상태
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client
from collections import Counter

# UTF-8 출력 설정
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# .env 로드
load_dotenv()

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

def get_all_collected_ids(politician_id):
    """모든 수집 데이터 ID 가져오기"""
    all_collected = []
    offset = 0
    while True:
        page = supabase.table('collected_data_v40').select('id').eq('politician_id', politician_id).range(offset, offset + 999).execute()
        if not page.data:
            break
        all_collected.extend([row['id'] for row in page.data])
        if len(page.data) < 1000:
            break
        offset += 1000
    return set(all_collected)

def get_all_evaluations(politician_id):
    """모든 평가 가져오기"""
    all_evaluations = []
    offset = 0
    while True:
        page = supabase.table('evaluations_v40').select('id', 'collected_data_id', 'category', 'evaluator_ai').eq('politician_id', politician_id).range(offset, offset + 999).execute()
        if not page.data:
            break
        all_evaluations.extend(page.data)
        if len(page.data) < 1000:
            break
        offset += 1000
    return all_evaluations

def find_orphan_evaluations(politician_id):
    """고아 평가 찾기"""
    print('=' * 80)
    print('고아 평가 검색 중...')
    print('=' * 80)

    collected_ids = get_all_collected_ids(politician_id)
    print(f'수집 데이터: {len(collected_ids)}개')

    all_evaluations = get_all_evaluations(politician_id)
    print(f'전체 평가: {len(all_evaluations)}개')

    orphans = [eval for eval in all_evaluations if eval['collected_data_id'] not in collected_ids]
    print(f'고아 평가: {len(orphans)}개')
    print()

    return orphans

def show_orphan_stats(orphans):
    """고아 평가 통계 출력"""
    if not orphans:
        print('고아 평가가 없습니다.')
        return

    print('카테고리별 분포:')
    cat_count = Counter(eval['category'] for eval in orphans)
    for cat, count in sorted(cat_count.items()):
        print(f'  {cat:20s}: {count:2d}개')
    print()

    print('AI별 분포:')
    ai_count = Counter(eval['evaluator_ai'] for eval in orphans)
    for ai, count in sorted(ai_count.items()):
        print(f'  {ai:20s}: {count:2d}개')
    print()

    print(f'고아 평가 ID 목록 (처음 10개):')
    for i, eval in enumerate(orphans[:10]):
        print(f'  {i+1:2d}. {eval["id"]} (category={eval["category"]}, ai={eval["evaluator_ai"]})')
    if len(orphans) > 10:
        print(f'  ... 외 {len(orphans)-10}개')
    print()

def delete_orphan_evaluations(orphans, dry_run=True):
    """고아 평가 삭제"""
    if not orphans:
        print('삭제할 고아 평가가 없습니다.')
        return 0

    if dry_run:
        print('[DRY RUN 모드] 실제 삭제하지 않고 시뮬레이션만 수행합니다.')
        print()

    print('=' * 80)
    print(f'고아 평가 삭제 중... ({len(orphans)}개)')
    print('=' * 80)

    deleted_count = 0
    failed_count = 0

    for i, eval in enumerate(orphans, 1):
        eval_id = eval['id']
        category = eval['category']
        ai = eval['evaluator_ai']

        print(f'[{i}/{len(orphans)}] {eval_id} (category={category}, ai={ai})... ', end='', flush=True)

        if not dry_run:
            try:
                result = supabase.table('evaluations_v40').delete().eq('id', eval_id).execute()
                print('✅ 삭제 완료')
                deleted_count += 1
            except Exception as e:
                print(f'❌ 삭제 실패: {e}')
                failed_count += 1
        else:
            print('[DRY RUN]')
            deleted_count += 1

    print()
    print('=' * 80)
    print('삭제 완료')
    print('=' * 80)
    print(f'삭제 성공: {deleted_count}개')
    if failed_count > 0:
        print(f'삭제 실패: {failed_count}개')

    return deleted_count

def main():
    import argparse

    parser = argparse.ArgumentParser(description='고아 평가 정리')
    parser.add_argument('--politician', type=str, required=True, help='정치인 이름')
    parser.add_argument('--no-dry-run', action='store_true', help='실제 삭제 수행 (기본: DRY RUN)')

    args = parser.parse_args()

    # 정치인 ID 조회
    politician_result = supabase.table('politicians').select('id', 'name').eq('name', args.politician).execute()
    if not politician_result.data:
        print(f'❌ 정치인을 찾을 수 없습니다: {args.politician}')
        return

    politician_id = politician_result.data[0]['id']
    politician_name = politician_result.data[0]['name']

    print('=' * 80)
    print(f'고아 평가 정리: {politician_name}')
    print('=' * 80)
    print(f'politician_id: {politician_id}')
    print()

    # 고아 평가 찾기
    orphans = find_orphan_evaluations(politician_id)

    if not orphans:
        print('✅ 고아 평가가 없습니다.')
        return

    # 통계 출력
    show_orphan_stats(orphans)

    # 삭제
    dry_run = not args.no_dry_run
    deleted = delete_orphan_evaluations(orphans, dry_run=dry_run)

    if dry_run:
        print()
        print('⚠️ DRY RUN 모드였습니다. 실제로 삭제하려면 --no-dry-run 옵션을 추가하세요.')
        print()
        print('예시:')
        print(f'  python cleanup_orphan_evaluations.py --politician "{politician_name}" --no-dry-run')

if __name__ == '__main__':
    main()
