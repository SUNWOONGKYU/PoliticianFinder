# -*- coding: utf-8 -*-
"""
V60 Alpha 데이터 검증 스크립트

수집된 Alpha 데이터의 품질을 검증한다:
  1. 중복 제거 (title 기준)
  2. 기간 제한 위반 제거 (OFFICIAL 4년, PUBLIC 2년)
  3. 카테고리별 최소 건수 확인
  4. 검증 보고서 출력

사용법:
    # Dry-run (삭제 안 함, 보고만)
    python validate_alpha.py --politician-id 17270f25

    # 실제 삭제
    python validate_alpha.py --politician-id 17270f25 --no-dry-run

    # 그룹 전체
    python validate_alpha.py --group-name "2026 서울시장" --no-dry-run
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'helpers'))
from common_cci import (
    supabase,
    ALPHA_CATEGORIES, ALPHA_CATEGORY_NAMES, ALPHA_TYPE_MAP,
    MIN_PER_CATEGORY, OFFICIAL_YEARS, PUBLIC_YEARS,
    TABLE_COLLECTED_ALPHA, TABLE_COMPETITOR_GROUPS,
    get_politician_info, get_period_limit, fetch_all_rows, print_status
)


def normalize_title(title: str) -> str:
    """제목 정규화 (중복 비교용)"""
    if not title:
        return ''
    import re
    t = re.sub(r'\s+', ' ', title.strip().lower())
    t = re.sub(r'[^\w\s]', '', t)
    return t


def validate_alpha_data(politician_id: str, dry_run: bool = True) -> dict:
    """Alpha 데이터 검증

    Returns:
        {
            'total_before': int,
            'duplicates_removed': int,
            'period_violations_removed': int,
            'total_after': int,
            'categories': {cat: {'before': N, 'after': N, 'ok': bool}}
        }
    """
    info = get_politician_info(politician_id)
    name = info.get('name', '?') if info else '?'

    print(f"\n{'═'*60}")
    print(f"🔍 Alpha 데이터 검증: {name} ({politician_id})")
    print(f"   모드: {'DRY-RUN (삭제 안 함)' if dry_run else '실제 삭제'}")
    print(f"{'═'*60}")

    total_duplicates = 0
    total_period = 0
    total_before = 0
    total_after = 0
    cat_results = {}

    now = datetime.now()
    official_cutoff = get_period_limit('OFFICIAL')
    public_cutoff = get_period_limit('PUBLIC')

    for cat in ALPHA_CATEGORIES:
        alpha_type = ALPHA_TYPE_MAP[cat]

        # 수집 데이터 조회
        collected = fetch_all_rows(TABLE_COLLECTED_ALPHA, {
            'politician_id': politician_id,
            'category': cat,
        })

        before_count = len(collected)
        total_before += before_count

        if not collected:
            cat_results[cat] = {'before': 0, 'after': 0, 'ok': False}
            print(f"  ❌ [{alpha_type}] {cat}: 데이터 없음")
            continue

        # 1. 중복 제거 (title 기준)
        seen_titles = set()
        dup_ids = []
        for item in collected:
            norm = normalize_title(item.get('title', ''))
            if norm and norm in seen_titles:
                dup_ids.append(item['id'])
            else:
                if norm:
                    seen_titles.add(norm)

        # 2. 기간 제한 위반 제거
        period_ids = []
        for item in collected:
            if item['id'] in dup_ids:
                continue  # 이미 중복으로 삭제 예정

            data_date = item.get('data_date')
            source_type = item.get('source_type', 'PUBLIC')

            if data_date:
                try:
                    if isinstance(data_date, str):
                        dt = datetime.fromisoformat(data_date.replace('Z', '+00:00'))
                    else:
                        dt = data_date

                    cutoff = official_cutoff if source_type == 'OFFICIAL' else public_cutoff

                    if dt.replace(tzinfo=None) < cutoff:
                        period_ids.append(item['id'])
                except (ValueError, TypeError):
                    pass  # 날짜 파싱 실패 → 유지

        # 삭제 실행
        all_remove_ids = dup_ids + period_ids
        total_duplicates += len(dup_ids)
        total_period += len(period_ids)

        if all_remove_ids and not dry_run:
            # 100개씩 chunk 삭제
            for i in range(0, len(all_remove_ids), 100):
                chunk = all_remove_ids[i:i+100]
                for rid in chunk:
                    try:
                        supabase.table(TABLE_COLLECTED_ALPHA).delete().eq('id', rid).execute()
                    except Exception as e:
                        print_status(f"  삭제 오류 ({rid}): {e}", 'warn')

        after_count = before_count - len(all_remove_ids)
        total_after += after_count
        is_ok = after_count >= MIN_PER_CATEGORY

        cat_results[cat] = {
            'before': before_count,
            'after': after_count,
            'duplicates': len(dup_ids),
            'period_violations': len(period_ids),
            'ok': is_ok,
        }

        status = '✅' if is_ok else '⚠️' if after_count > 0 else '❌'
        label = f"[{alpha_type}] {cat} ({ALPHA_CATEGORY_NAMES[cat]})"
        print(f"  {status} {label:<40} {before_count:>3} → {after_count:>3} (중복-{len(dup_ids)}, 기간-{len(period_ids)})")

    # 요약
    print(f"\n{'─'*60}")
    print(f"📊 검증 요약")
    print(f"{'─'*60}")
    print(f"  검증 전: {total_before}개")
    print(f"  중복 제거: {total_duplicates}개")
    print(f"  기간 위반: {total_period}개")
    print(f"  검증 후: {total_after}개")
    print(f"  {'(DRY-RUN: 실제 삭제 안 됨)' if dry_run else '(삭제 완료)'}")

    insufficient = [c for c, r in cat_results.items() if not r['ok']]
    if insufficient:
        print(f"\n  ⚠️ 부족 카테고리: {', '.join(insufficient)}")
        print(f"  → collect_alpha.py로 추가 수집 필요")
    else:
        print(f"\n  ✅ 모든 카테고리 기준 충족")

    print(f"{'═'*60}")

    return {
        'total_before': total_before,
        'duplicates_removed': total_duplicates,
        'period_violations_removed': total_period,
        'total_after': total_after,
        'categories': cat_results,
    }


def validate_group(group_name: str, dry_run: bool = True):
    """그룹 전체 검증"""
    result = supabase.table(TABLE_COMPETITOR_GROUPS).select('*').eq(
        'group_name', group_name
    ).execute()

    if not result.data:
        print_status(f"'{group_name}' 그룹을 찾을 수 없습니다.", 'error')
        return

    group = result.data[0]
    print(f"\n{'═'*60}")
    print(f"📋 그룹 Alpha 검증: {group_name}")
    print(f"{'═'*60}")

    for pid in group.get('politician_ids', []):
        validate_alpha_data(pid, dry_run)

    print(f"\n{'═'*60}")
    print(f"✅ 그룹 검증 완료")
    print(f"{'═'*60}")


def main():
    parser = argparse.ArgumentParser(description='V60 Alpha 데이터 검증')
    parser.add_argument('--politician-id', type=str, help='정치인 ID')
    parser.add_argument('--group-name', type=str, help='그룹명')
    parser.add_argument('--no-dry-run', action='store_true', help='실제 삭제 (기본: dry-run)')
    args = parser.parse_args()

    dry_run = not args.no_dry_run

    if args.group_name:
        validate_group(args.group_name, dry_run)
    elif args.politician_id:
        validate_alpha_data(args.politician_id, dry_run)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
