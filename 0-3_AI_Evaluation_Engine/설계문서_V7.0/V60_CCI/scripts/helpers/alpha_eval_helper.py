# -*- coding: utf-8 -*-
"""
V60 Alpha 평가 헬퍼

Claude Code가 직접 Alpha 데이터를 평가할 때 사용하는 fetch/save/status 도구.
플래툰 포메이션에서 분대원(Subagent)이 호출하는 스크립트.

사용법:
    # 평가할 데이터 가져오기
    python alpha_eval_helper.py fetch \
        --politician_id 17270f25 \
        --politician_name "정원오" \
        --category opinion

    # 평가 결과 저장
    python alpha_eval_helper.py save \
        --politician_id 17270f25 \
        --politician_name "정원오" \
        --category opinion \
        --input eval_alpha_opinion_batch_1.json

    # 평가 상태 확인
    python alpha_eval_helper.py status --politician_id 17270f25
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common_cci import (
    supabase,
    ALPHA_CATEGORIES, ALPHA_TYPE_MAP, ALPHA_CATEGORY_NAMES, VALID_RATINGS,
    TABLE_COLLECTED_ALPHA, TABLE_EVALUATIONS_ALPHA,
    get_politician_info, fetch_all_rows, load_instruction, print_status
)


def cmd_fetch(args):
    """평가할 Alpha 데이터 가져오기 (이미 평가된 것 제외)"""
    politician_id = args.politician_id
    category = args.category
    alpha_type = ALPHA_TYPE_MAP.get(category, 'alpha1')

    # 수집 데이터 조회
    collected = fetch_all_rows(TABLE_COLLECTED_ALPHA, {
        'politician_id': politician_id,
        'category': category,
    })

    if not collected:
        print(json.dumps({
            'total_count': 0,
            'items': [],
            'message': f'{category} 수집 데이터 없음'
        }, ensure_ascii=False))
        return

    # 이미 평가된 ID 조회 (Pre-filtering)
    evaluated = fetch_all_rows(TABLE_EVALUATIONS_ALPHA, {
        'politician_id': politician_id,
        'category': category,
    }, 'collected_alpha_id')

    evaluated_ids = {e['collected_alpha_id'] for e in evaluated if e.get('collected_alpha_id')}

    # 미평가 데이터만 필터
    pending = [c for c in collected if c['id'] not in evaluated_ids]

    # 정치인 프로필
    profile = get_politician_info(politician_id)

    # 인스트럭션 로드
    instruction = load_instruction(category)

    output = {
        'total_count': len(pending),
        'already_evaluated': len(evaluated_ids),
        'category': category,
        'alpha_type': alpha_type,
        'category_name': ALPHA_CATEGORY_NAMES.get(category, category),
        'profile': {
            'name': profile.get('name', args.politician_name),
            'party': profile.get('party', ''),
            'position': profile.get('position', ''),
            'region': profile.get('region', ''),
        } if profile else {'name': args.politician_name},
        'instruction_excerpt': instruction[:500] if instruction else '',
        'items': [{
            'id': item['id'],
            'title': item.get('title', ''),
            'content': (item.get('content', '') or '')[:500],
            'source_name': item.get('source_name', ''),
            'source_url': item.get('source_url', ''),
            'data_date': item.get('data_date', ''),
            'source_type': item.get('source_type', ''),
            'collector': item.get('collector', ''),
        } for item in pending],
    }

    print(json.dumps(output, ensure_ascii=False, indent=2))


def cmd_save(args):
    """평가 결과 저장"""
    politician_id = args.politician_id
    category = args.category
    alpha_type = ALPHA_TYPE_MAP.get(category, 'alpha1')
    input_file = args.input

    # JSON 파일 읽기
    input_path = Path(input_file)
    if not input_path.is_absolute():
        input_path = Path(__file__).resolve().parent / input_file

    if not input_path.exists():
        print_status(f"파일 없음: {input_path}", 'error')
        return

    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    evaluations = data.get('evaluations', [])
    if not evaluations:
        print_status("evaluations 배열이 비어있습니다.", 'error')
        return

    # 경쟁자 그룹 ID 조회
    from common_cci import get_competitor_group
    groups = get_competitor_group(politician_id=politician_id)
    group_id = groups[0]['id'] if groups else None

    saved = 0
    skipped = 0
    errors = 0

    for ev in evaluations:
        rating = ev.get('rating', '')
        if rating not in VALID_RATINGS:
            print_status(f"잘못된 rating: {rating} (id: {ev.get('id', '?')})", 'warn')
            errors += 1
            continue

        row = {
            'politician_id': politician_id,
            'alpha_type': alpha_type,
            'category': category,
            'evaluator_ai': 'Claude',
            'collected_alpha_id': ev.get('id'),
            'rating': rating,
            'reasoning': ev.get('rationale', ''),
        }
        if group_id:
            row['competitor_group_id'] = group_id

        try:
            # 중복 체크
            existing = supabase.table(TABLE_EVALUATIONS_ALPHA).select('id').eq(
                'collected_alpha_id', ev.get('id')
            ).eq('evaluator_ai', 'Claude').execute()

            if existing.data:
                skipped += 1
                continue

            supabase.table(TABLE_EVALUATIONS_ALPHA).insert(row).execute()
            saved += 1
        except Exception as e:
            print_status(f"저장 오류 (id: {ev.get('id', '?')}): {e}", 'warn')
            errors += 1

    print(f"OK: {saved}개 저장 / {skipped}개 중복 스킵 / {errors}개 오류")


def cmd_status(args):
    """평가 상태 확인"""
    politician_id = args.politician_id
    info = get_politician_info(politician_id)
    name = info.get('name', '?') if info else '?'

    print(f"\n{'═'*50}")
    print(f"Alpha 평가 상태: {name} ({politician_id})")
    print(f"{'═'*50}")

    for cat in ALPHA_CATEGORIES:
        alpha_type = ALPHA_TYPE_MAP[cat]

        # 수집 건수
        collected = supabase.table(TABLE_COLLECTED_ALPHA).select(
            'id', count='exact'
        ).eq('politician_id', politician_id).eq('category', cat).execute()
        collected_count = collected.count if collected.count else 0

        # 평가 건수
        evaluated = supabase.table(TABLE_EVALUATIONS_ALPHA).select(
            'id', count='exact'
        ).eq('politician_id', politician_id).eq('category', cat).execute()
        evaluated_count = evaluated.count if evaluated.count else 0

        status = '✅' if evaluated_count >= collected_count and collected_count > 0 else '⚠️' if evaluated_count > 0 else '❌'
        label = f"[{alpha_type}] {cat} ({ALPHA_CATEGORY_NAMES[cat]})"
        print(f"  {status} {label:<40} 수집: {collected_count:>3} / 평가: {evaluated_count:>3}")

    print(f"{'═'*50}")


def main():
    parser = argparse.ArgumentParser(description='V60 Alpha 평가 헬퍼')
    subparsers = parser.add_subparsers(dest='command')

    # fetch
    fetch_parser = subparsers.add_parser('fetch', help='평가할 데이터 가져오기')
    fetch_parser.add_argument('--politician_id', required=True)
    fetch_parser.add_argument('--politician_name', required=True)
    fetch_parser.add_argument('--category', required=True)

    # save
    save_parser = subparsers.add_parser('save', help='평가 결과 저장')
    save_parser.add_argument('--politician_id', required=True)
    save_parser.add_argument('--politician_name', required=True)
    save_parser.add_argument('--category', required=True)
    save_parser.add_argument('--input', required=True)

    # status
    status_parser = subparsers.add_parser('status', help='평가 상태 확인')
    status_parser.add_argument('--politician_id', required=True)

    args = parser.parse_args()

    if args.command == 'fetch':
        cmd_fetch(args)
    elif args.command == 'save':
        cmd_save(args)
    elif args.command == 'status':
        cmd_status(args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
