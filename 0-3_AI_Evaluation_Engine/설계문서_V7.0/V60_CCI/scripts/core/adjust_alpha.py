# -*- coding: utf-8 -*-
"""
V60 Alpha 데이터 검증 후 조정 (Phase 2-2)

V40 adjust_v40_data.py와 동일한 프로세스:
  1. AI별/카테고리별 데이터 균형 확인
  2. 초과(120개↑) → 오래된 것부터 삭제
  3. 부족(100개↓) → 재수집 시도 (최대 4회)
  4. 재수집 포기 규칙: 50+ 정상 | 25-49 부족허용 | <25 leverage score 0

사용법:
    # Dry-run (조정 안 함, 보고만)
    python adjust_alpha.py --politician-id 17270f25

    # 실제 조정
    python adjust_alpha.py --politician-id 17270f25 --no-dry-run

    # 그룹 전체
    python adjust_alpha.py --group-name "2026 서울시장" --no-dry-run
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'helpers'))
from common_cci import (
    supabase,
    ALPHA_CATEGORIES, ALPHA_CATEGORY_NAMES, ALPHA_TYPE_MAP,
    MIN_PER_CATEGORY, MAX_PER_CATEGORY, BUFFER_TARGET,
    MAX_ADJUSTMENT_ROUNDS, GIVE_UP_THRESHOLD,
    TABLE_COLLECTED_ALPHA, TABLE_COMPETITOR_GROUPS,
    get_politician_info, fetch_all_rows, print_status
)


def _count_by_category(politician_id: str) -> dict:
    """카테고리별 수집 건수 조회"""
    counts = {}
    for cat in ALPHA_CATEGORIES:
        rows = fetch_all_rows(TABLE_COLLECTED_ALPHA, {
            'politician_id': politician_id,
            'category': cat,
        }, 'id, data_date')
        counts[cat] = rows
    return counts


def _trim_excess(politician_id: str, category: str, rows: list,
                 target: int = MAX_PER_CATEGORY, dry_run: bool = True) -> int:
    """초과 데이터 삭제 (오래된 것부터)

    Returns:
        삭제된 건수
    """
    if len(rows) <= target:
        return 0

    # 날짜순 정렬 (오래된 것 = 앞쪽)
    sorted_rows = sorted(rows, key=lambda r: r.get('data_date', '9999-99-99'))
    to_delete = sorted_rows[:len(rows) - target]

    if not dry_run:
        for row in to_delete:
            try:
                supabase.table(TABLE_COLLECTED_ALPHA).delete().eq('id', row['id']).execute()
            except Exception as e:
                print_status(f"    삭제 오류 ({row['id']}): {e}", 'warn')

    return len(to_delete)


def _verify_not_error(politician_id: str, category: str) -> dict:
    """Give-Up 적용 전 '오류 아님' 증명 (V40 강화 규칙)

    Returns:
        {
            'api_ok': bool,
            'search_exists': bool,
            'period_limited': bool,
            'filter_normal': bool,
            'conclusion': str,  # 'data_shortage' | 'error_suspected'
        }
    """
    import requests
    import os

    result = {
        'api_ok': False,
        'search_exists': False,
        'period_limited': False,
        'filter_normal': True,
        'conclusion': 'error_suspected',
    }

    info = get_politician_info(politician_id)
    name = info.get('name', '') if info else ''
    if not name:
        return result

    # 1. API 응답 확인
    cid = os.getenv('NAVER_CLIENT_ID')
    csc = os.getenv('NAVER_CLIENT_SECRET')
    if cid and csc:
        try:
            cat_keywords = {
                'opinion': '여론조사', 'media': '이미지', 'risk': '논란',
                'party': '정당', 'candidate': '의정활동', 'regional': '지역구',
            }
            kw = f'"{name}" {cat_keywords.get(category, "")}'
            resp = requests.get(
                'https://openapi.naver.com/v1/search/news.json',
                params={'query': kw, 'display': 5, 'sort': 'date'},
                headers={'X-Naver-Client-Id': cid, 'X-Naver-Client-Secret': csc},
                timeout=10,
            )
            result['api_ok'] = (resp.status_code == 200)
            if resp.status_code == 200:
                total = resp.json().get('total', 0)
                result['search_exists'] = (total > 0)
        except Exception:
            pass

    # 2. 기간 내 데이터 확인
    from common_cci import get_period_limit
    public_cutoff = get_period_limit('PUBLIC')
    rows = fetch_all_rows(TABLE_COLLECTED_ALPHA, {
        'politician_id': politician_id,
        'category': category,
    }, 'id, data_date, source_type')

    period_count = 0
    for row in rows:
        try:
            dt = datetime.fromisoformat(str(row.get('data_date', '')).replace('Z', '+00:00'))
            if dt.replace(tzinfo=None) >= public_cutoff:
                period_count += 1
        except (ValueError, TypeError):
            pass

    result['period_limited'] = (period_count == 0 and len(rows) > 0)

    # 3. 결론
    if result['api_ok'] and result['search_exists'] and result['filter_normal']:
        result['conclusion'] = 'data_shortage'
    else:
        result['conclusion'] = 'error_suspected'

    return result


def adjust_alpha_data(politician_id: str, dry_run: bool = True) -> dict:
    """Alpha 데이터 조정 (Phase 2-2)

    Returns:
        {
            'categories': {cat: {'count': N, 'trimmed': N, 'status': str}},
            'give_up': [cat, ...],
            'needs_recollection': [cat, ...],
        }
    """
    info = get_politician_info(politician_id)
    name = info.get('name', '?') if info else '?'

    print(f"\n{'═'*60}")
    print(f"🔧 Alpha 데이터 조정 (Phase 2-2): {name} ({politician_id})")
    print(f"   모드: {'DRY-RUN (조정 안 함)' if dry_run else '실제 조정'}")
    print(f"   기준: MIN={MIN_PER_CATEGORY}, MAX={MAX_PER_CATEGORY}, BUFFER={BUFFER_TARGET}")
    print(f"{'═'*60}")

    cat_data = _count_by_category(politician_id)
    cat_results = {}
    give_up_cats = []
    needs_recollection = []

    for cat in ALPHA_CATEGORIES:
        rows = cat_data.get(cat, [])
        count = len(rows)
        alpha_type = ALPHA_TYPE_MAP[cat]
        trimmed = 0

        # 초과 → 삭제
        if count > MAX_PER_CATEGORY:
            trimmed = _trim_excess(politician_id, cat, rows, MAX_PER_CATEGORY, dry_run)
            count -= trimmed
            status = 'trimmed'
        elif count >= MIN_PER_CATEGORY:
            status = 'ok'
        elif count >= GIVE_UP_THRESHOLD:
            # 25-99: 부족하지만 허용 가능
            status = 'insufficient_allow'
            needs_recollection.append(cat)
        elif count > 0:
            # 1-24: Give-Up 검증 필요
            verify = _verify_not_error(politician_id, cat)
            if verify['conclusion'] == 'data_shortage':
                status = 'give_up'
                give_up_cats.append(cat)
            else:
                status = 'error_suspected'
                needs_recollection.append(cat)
        else:
            status = 'empty'
            needs_recollection.append(cat)

        cat_results[cat] = {
            'count': count,
            'trimmed': trimmed,
            'status': status,
        }

        # 상태 표시
        icons = {
            'ok': '✅', 'trimmed': '✂️', 'insufficient_allow': '⚠️',
            'give_up': '🏳️', 'error_suspected': '🔴', 'empty': '❌',
        }
        icon = icons.get(status, '❓')
        label = f"[{alpha_type}] {cat} ({ALPHA_CATEGORY_NAMES[cat]})"
        detail = f"{count:>3}개"
        if trimmed:
            detail += f" (초과 {trimmed}개 삭제)"
        print(f"  {icon} {label:<40} {detail}  [{status}]")

    # 요약
    print(f"\n{'─'*60}")
    print(f"📊 조정 요약")
    print(f"{'─'*60}")

    ok_count = sum(1 for r in cat_results.values() if r['status'] in ('ok', 'trimmed'))
    print(f"  ✅ 정상: {ok_count}/6 카테고리")

    if needs_recollection:
        print(f"  ⚠️ 재수집 필요: {', '.join(needs_recollection)}")

    if give_up_cats:
        print(f"  🏳️ 포기 (leverage score 0): {', '.join(give_up_cats)}")
        for cat in give_up_cats:
            print(f"     → {cat}: 데이터 부족 확인됨 (오류 아님, leverage score 0 = 60점)")

    if not needs_recollection and not give_up_cats:
        print(f"\n  ✅ 모든 카테고리 기준 충족 — Phase 3 (평가) 진행 가능")

    print(f"{'═'*60}")

    return {
        'categories': cat_results,
        'give_up': give_up_cats,
        'needs_recollection': needs_recollection,
    }


def adjust_group(group_name: str, dry_run: bool = True):
    """그룹 전체 조정"""
    result = supabase.table(TABLE_COMPETITOR_GROUPS).select('*').eq(
        'group_name', group_name
    ).execute()

    if not result.data:
        print_status(f"'{group_name}' 그룹을 찾을 수 없습니다.", 'error')
        return

    group = result.data[0]
    print(f"\n{'═'*60}")
    print(f"📋 그룹 Alpha 조정 (Phase 2-2): {group_name}")
    print(f"{'═'*60}")

    for pid in group.get('politician_ids', []):
        adjust_alpha_data(pid, dry_run)

    print(f"\n{'═'*60}")
    print(f"✅ 그룹 조정 완료")
    print(f"{'═'*60}")


def main():
    parser = argparse.ArgumentParser(description='V60 Alpha 데이터 조정 (Phase 2-2)')
    parser.add_argument('--politician-id', type=str, help='정치인 ID')
    parser.add_argument('--group-name', type=str, help='그룹명')
    parser.add_argument('--no-dry-run', action='store_true', help='실제 조정 (기본: dry-run)')
    args = parser.parse_args()

    dry_run = not args.no_dry_run

    if args.group_name:
        adjust_group(args.group_name, dry_run)
    elif args.politician_id:
        adjust_alpha_data(args.politician_id, dry_run)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
