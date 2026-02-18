#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Naver OFFICIAL 데이터 타입 수정 스크립트

목적:
  Naver가 수집한 .go.kr 도메인 데이터를 data_type='OFFICIAL'로 재분류

배경:
  - Naver가 수집한 448개 중 109개가 .go.kr 도메인
  - 하지만 모두 data_type='public'으로 잘못 저장됨
  - OFFICIAL로 재분류 필요

사용법:
  python fix_naver_official_data_type.py --politician_id=8c5dcc89 [--dry-run]

옵션:
  --politician_id: 정치인 ID (필수)
  --politician_name: 정치인 이름 (선택, 출력용)
  --dry-run: 시뮬레이션만 (실제 업데이트 안 함)
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv
import argparse

# UTF-8 Output
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        pass

# Load environment
load_dotenv()

# Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

def fix_naver_official_data_type(politician_id, politician_name="", dry_run=True):
    """Fix Naver OFFICIAL data_type for .go.kr domains"""

    print("=" * 80)
    print("Naver OFFICIAL 데이터 타입 수정")
    print("=" * 80)
    print(f"정치인 ID: {politician_id}")
    if politician_name:
        print(f"정치인 이름: {politician_name}")
    print(f"모드: {'시뮬레이션 (DRY RUN)' if dry_run else '실제 업데이트'}")
    print("=" * 80)
    print()

    # Step 1: 현재 상태 조회
    print("[1단계] 현재 Naver 데이터 상태 확인...")
    result = supabase.table('collected_data_v40')\
        .select('id, category, data_type, source_url')\
        .eq('politician_id', politician_id)\
        .eq('collector_ai', 'Naver')\
        .execute()

    total_naver = len(result.data)
    print(f"  총 Naver 데이터: {total_naver}개")

    # Step 2: 현재 data_type 분포
    current_official = sum(1 for row in result.data if row['data_type'] == 'official')
    current_public = sum(1 for row in result.data if row['data_type'] == 'public')

    print(f"  현재 OFFICIAL: {current_official}개")
    print(f"  현재 PUBLIC: {current_public}개")
    print()

    # Step 3: .go.kr 도메인 분류
    print("[2단계] .go.kr 도메인 데이터 분류...")
    gokr_items = []
    for row in result.data:
        if '.go.kr' in row.get('source_url', ''):
            gokr_items.append(row)

    print(f"  .go.kr 도메인 발견: {len(gokr_items)}개")

    # 카테고리별 분포
    from collections import defaultdict
    category_counts = defaultdict(int)
    for item in gokr_items:
        category_counts[item['category']] += 1

    print(f"\n  카테고리별 .go.kr 분포:")
    for cat in sorted(category_counts.keys()):
        print(f"    {cat:20s}: {category_counts[cat]:3d}개")
    print()

    # Step 4: data_type 확인
    gokr_already_official = sum(1 for item in gokr_items if item['data_type'] == 'official')
    gokr_need_fix = sum(1 for item in gokr_items if item['data_type'] != 'official')

    print(f"  이미 OFFICIAL: {gokr_already_official}개")
    print(f"  수정 필요: {gokr_need_fix}개")
    print()

    if gokr_need_fix == 0:
        print("✅ 수정할 항목이 없습니다.")
        return

    # Step 5: 업데이트 실행
    if dry_run:
        print("[3단계] 시뮬레이션 (DRY RUN)")
        print(f"  {gokr_need_fix}개 항목을 OFFICIAL로 업데이트할 예정")
        print()
        print("  샘플 (처음 5개):")
        count = 0
        for item in gokr_items:
            if item['data_type'] != 'OFFICIAL':
                print(f"    - [{item['category']}] {item['source_url'][:70]}")
                count += 1
                if count >= 5:
                    break
        print()
        print("⚠️ 실제 업데이트하려면 --no-dry-run 옵션 사용")
    else:
        print("[3단계] 실제 업데이트 실행...")
        updated_count = 0
        error_count = 0

        for item in gokr_items:
            if item['data_type'] == 'OFFICIAL':
                continue  # 이미 OFFICIAL이면 건너뛰기

            try:
                supabase.table('collected_data_v40')\
                    .update({'data_type': 'official'})\
                    .eq('id', item['id'])\
                    .execute()
                updated_count += 1

                if updated_count % 10 == 0:
                    print(f"  진행: {updated_count}/{gokr_need_fix}")

            except Exception as e:
                print(f"  ❌ 업데이트 실패 (ID: {item['id']}): {e}")
                error_count += 1

        print()
        print(f"✅ 업데이트 완료: {updated_count}개")
        if error_count > 0:
            print(f"⚠️ 오류 발생: {error_count}개")
        print()

    # Step 6: 예상 결과
    print("[4단계] 예상 결과")
    print("-" * 80)

    if dry_run:
        expected_official = current_official + gokr_need_fix
        expected_public = current_public - gokr_need_fix
    else:
        # 실제 업데이트 후 다시 조회
        result_after = supabase.table('collected_data_v40')\
            .select('data_type', count='exact')\
            .eq('politician_id', politician_id)\
            .eq('collector_ai', 'Naver')\
            .execute()

        expected_official = sum(1 for row in result_after.data if row['data_type'] == 'OFFICIAL')
        expected_public = sum(1 for row in result_after.data if row['data_type'] == 'public')

    target_official = 100  # 10 categories × 10
    target_public = 400    # 10 categories × 40

    print(f"  구분        현재     →   {'예상' if dry_run else '실제'}     목표      상태")
    print("-" * 80)
    print(f"  OFFICIAL  {current_official:4d}개   →   {expected_official:4d}개   {target_official:4d}개   "
          f"{'✅' if expected_official >= target_official else '⚠️'} "
          f"({expected_official/target_official*100:.1f}%)")
    print(f"  PUBLIC    {current_public:4d}개   →   {expected_public:4d}개   {target_public:4d}개   "
          f"{'✅' if expected_public >= target_public else '⚠️'} "
          f"({expected_public/target_public*100:.1f}%)")
    print(f"  TOTAL     {total_naver:4d}개   →   {total_naver:4d}개   500개   "
          f"{'✅' if total_naver >= 500 else '⚠️'} "
          f"({total_naver/500*100:.1f}%)")
    print("-" * 80)
    print()

    # Step 7: 추가 작업 권장사항
    if expected_official < target_official:
        shortage = target_official - expected_official
        print(f"⚠️ OFFICIAL 부족: {shortage}개")
        print(f"  권장사항: Naver OFFICIAL 재수집 실행")
        print(f"  명령어: python collect_v40.py --politician_id={politician_id} "
              f"--politician_name=\"{politician_name}\" --ai=Naver")
        print()

    if expected_public < target_public:
        shortage = target_public - expected_public
        print(f"⚠️ PUBLIC 부족: {shortage}개")
        print(f"  권장사항: Naver PUBLIC 재수집 실행")
        print()

    print("=" * 80)
    print("완료")
    print("=" * 80)


def main():
    parser = argparse.ArgumentParser(
        description='Naver OFFICIAL 데이터 타입 수정'
    )
    parser.add_argument(
        '--politician_id',
        type=str,
        required=True,
        help='정치인 ID (8-char hex)'
    )
    parser.add_argument(
        '--politician_name',
        type=str,
        default='',
        help='정치인 이름 (선택)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        default=True,
        help='시뮬레이션만 (기본값)'
    )
    parser.add_argument(
        '--no-dry-run',
        action='store_false',
        dest='dry_run',
        help='실제 업데이트 실행'
    )

    args = parser.parse_args()

    fix_naver_official_data_type(
        politician_id=args.politician_id,
        politician_name=args.politician_name,
        dry_run=args.dry_run
    )


if __name__ == '__main__':
    main()
