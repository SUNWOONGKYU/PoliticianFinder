# -*- coding: utf-8 -*-
"""
V60 경쟁자 그룹 등록 스크립트

같은 선거구 출마 예상 후보들을 하나의 그룹으로 등록한다.
CCI 상대평가의 기반 단위.

사용법:
    python register_competitor_group.py \
        --group-name "2026 서울시장" \
        --election-type mayor \
        --region "서울특별시" \
        --politician-ids "17270f25,62e7b453,88aaecf2"

    # 기존 그룹에 후보 추가
    python register_competitor_group.py \
        --group-id "uuid-here" \
        --add-politician "de49f056"

    # 그룹 목록 조회
    python register_competitor_group.py --list

    # 특정 정치인의 그룹 조회
    python register_competitor_group.py --politician-id "17270f25"
"""

import sys
import argparse
from pathlib import Path

# 상위 모듈 import
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'helpers'))
from common_cci import (
    supabase, TABLE_COMPETITOR_GROUPS, TABLE_POLITICIANS,
    get_politician_info, get_competitor_group, print_status
)


def create_group(group_name: str, election_type: str, region: str,
                 politician_ids: list, district: str = None):
    """새 경쟁자 그룹 생성"""

    # 정치인 ID 검증
    valid_ids = []
    for pid in politician_ids:
        pid = pid.strip()
        info = get_politician_info(pid)
        if info:
            valid_ids.append(pid)
            print_status(f"  {info['name']} ({info.get('party', '?')}) — {pid}", 'ok')
        else:
            print_status(f"  {pid} — DB에 없음, 건너뜀", 'warn')

    if len(valid_ids) < 2:
        print_status("최소 2명 이상의 유효한 정치인이 필요합니다.", 'error')
        return None

    # 중복 그룹 확인
    existing = supabase.table(TABLE_COMPETITOR_GROUPS).select('*').eq(
        'group_name', group_name
    ).execute()

    if existing.data:
        print_status(f"'{group_name}' 그룹이 이미 존재합니다. --group-id로 수정하세요.", 'warn')
        return None

    # 그룹 생성
    data = {
        'group_name': group_name,
        'election_type': election_type,
        'region': region,
        'politician_ids': valid_ids,
    }
    if district:
        data['district'] = district

    result = supabase.table(TABLE_COMPETITOR_GROUPS).insert(data).execute()

    if result.data:
        group = result.data[0]
        print_status(f"그룹 생성 완료: {group_name} ({len(valid_ids)}명)", 'ok')
        print(f"  Group ID: {group['id']}")
        return group
    else:
        print_status("그룹 생성 실패", 'error')
        return None


def add_to_group(group_id: str, politician_id: str):
    """기존 그룹에 후보 추가"""
    groups = get_competitor_group(group_id=group_id)
    if not groups:
        print_status(f"그룹 {group_id}를 찾을 수 없습니다.", 'error')
        return

    group = groups[0]
    current_ids = group['politician_ids'] or []

    if politician_id in current_ids:
        print_status(f"{politician_id}는 이미 그룹에 포함되어 있습니다.", 'warn')
        return

    info = get_politician_info(politician_id)
    if not info:
        print_status(f"{politician_id}가 DB에 없습니다.", 'error')
        return

    current_ids.append(politician_id)
    supabase.table(TABLE_COMPETITOR_GROUPS).update({
        'politician_ids': current_ids,
        'updated_at': 'now()'
    }).eq('id', group_id).execute()

    print_status(f"{info['name']} ({politician_id})를 '{group['group_name']}' 그룹에 추가했습니다.", 'ok')


def list_groups():
    """전체 그룹 목록 조회"""
    result = supabase.table(TABLE_COMPETITOR_GROUPS).select('*').execute()

    if not result.data:
        print("등록된 그룹이 없습니다.")
        return

    print(f"\n{'='*70}")
    print(f"{'그룹명':<25} {'유형':<10} {'지역':<15} {'인원':<5}")
    print(f"{'='*70}")

    for g in result.data:
        count = len(g.get('politician_ids', []))
        print(f"{g['group_name']:<25} {g['election_type']:<10} {g['region']:<15} {count:<5}")

        # 멤버 목록
        for pid in g.get('politician_ids', []):
            info = get_politician_info(pid)
            name = info.get('name', '?') if info else '?'
            party = info.get('party', '?') if info else '?'
            print(f"  └─ {name} ({party}) — {pid}")

    print(f"{'='*70}")
    print(f"총 {len(result.data)}개 그룹")


def show_politician_groups(politician_id: str):
    """특정 정치인이 속한 그룹 조회"""
    info = get_politician_info(politician_id)
    name = info.get('name', '?') if info else '?'

    groups = get_competitor_group(politician_id=politician_id)

    if not groups:
        print(f"{name} ({politician_id})는 어떤 그룹에도 속하지 않습니다.")
        return

    print(f"\n{name} ({politician_id})의 소속 그룹:")
    for g in groups:
        count = len(g.get('politician_ids', []))
        print(f"  • {g['group_name']} ({g['election_type']}, {g['region']}) — {count}명")


def main():
    parser = argparse.ArgumentParser(description='V60 경쟁자 그룹 등록')
    parser.add_argument('--group-name', type=str, help='그룹명 (예: "2026 서울시장")')
    parser.add_argument('--election-type', type=str, choices=['mayor', 'governor', 'assembly'],
                        help='선거 유형')
    parser.add_argument('--region', type=str, help='지역 (예: "서울특별시")')
    parser.add_argument('--district', type=str, help='선거구 (국회의원용)')
    parser.add_argument('--politician-ids', type=str, help='정치인 ID 목록 (쉼표 구분)')
    parser.add_argument('--group-id', type=str, help='기존 그룹 ID (후보 추가 시)')
    parser.add_argument('--add-politician', type=str, help='추가할 정치인 ID')
    parser.add_argument('--list', action='store_true', help='전체 그룹 목록')
    parser.add_argument('--politician-id', type=str, help='해당 정치인의 그룹 조회')

    args = parser.parse_args()

    if args.list:
        list_groups()
    elif args.politician_id and not args.group_name:
        show_politician_groups(args.politician_id)
    elif args.group_id and args.add_politician:
        add_to_group(args.group_id, args.add_politician)
    elif args.group_name and args.election_type and args.region and args.politician_ids:
        ids = [x.strip() for x in args.politician_ids.split(',')]
        create_group(args.group_name, args.election_type, args.region, ids, args.district)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
