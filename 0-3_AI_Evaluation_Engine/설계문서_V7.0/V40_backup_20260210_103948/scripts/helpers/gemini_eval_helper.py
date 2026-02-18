# -*- coding: utf-8 -*-
"""
V40 Gemini CLI 평가 헬퍼 스크립트

Gemini CLI 터미널에서 호출하여 DB 조회/저장을 수행합니다.
평가 자체는 Gemini CLI가 직접 수행 (CLI Direct Mode, $0).

사용법:
    # 1. 평가할 데이터 조회 (프롬프트 생성)
    python gemini_eval_helper.py fetch --politician_id={ID} --politician_name={이름} --category={카테고리}

    # 2. 평가 결과 저장
    python gemini_eval_helper.py save --politician_id={ID} --politician_name={이름} --category={카테고리} --input=gemini_eval_result.json

    # 3. 평가 현황 확인
    python gemini_eval_helper.py status --politician_id={ID}

파라미터:
    fetch:  미평가 데이터 조회 + 평가 프롬프트 파일 생성
    save:   Gemini CLI 평가 결과 JSON을 DB에 저장
    status: 정치인별 전체 평가 현황 표시

    --politician_id:   정치인 ID (8자리 hex, 예: 62e7b453)
    --politician_name: 정치인 이름 (예: "박주민")
    --category:        카테고리 영문명 (expertise, leadership, vision, integrity, ethics,
                       accountability, transparency, communication, responsiveness, publicinterest)
    --input:           (save 전용) 저장할 JSON 파일 경로
"""

import os
import sys
import json
import argparse
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# .env 로드 (상위 디렉토리들에서 찾기)
for env_path in [
    os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'),
    os.path.join(os.path.dirname(__file__), '.env'),
    '.env'
]:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        break

TABLE_COLLECTED = 'collected_data_v40'
TABLE_EVALUATIONS = 'evaluations_v40'

CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

CATEGORY_KR = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력', 'responsiveness': '대응성',
    'publicinterest': '공익성'
}

VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4', 'X']

# ⚠️ 점수 계산은 calculate_v40_scores.py의 단독 책임
# 이 헬퍼는 rating(등급)만 저장, score는 저장하지 않음

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))


def cmd_fetch(args):
    """평가할 데이터 조회 - Gemini CLI에게 전달할 정보 출력"""
    pid = args.politician_id
    pname = args.politician_name
    category = args.category

    if category == 'all':
        cats = CATEGORIES
    else:
        cats = [category]

    result = {"politician_id": pid, "politician_name": pname, "categories": []}

    for cat in cats:
        # 수집된 데이터 조회
        collected = supabase.table(TABLE_COLLECTED).select('*')\
            .eq('politician_id', pid).eq('category', cat).execute()

        # 이미 평가된 collected_data_id 목록 (개선: collected_data_id로 필터링)
        evaluated = supabase.table(TABLE_EVALUATIONS).select('collected_data_id')\
            .eq('politician_id', pid).eq('category', cat)\
            .eq('evaluator_ai', 'Gemini').execute()

        evaluated_ids = {item['collected_data_id'] for item in (evaluated.data or []) if item.get('collected_data_id')}

        # 미평가 데이터 필터링 (AI별 URL 중복 제거)
        seen_urls = {}
        unevaluated = []
        for item in (collected.data or []):
            item_id = item.get('id')
            if item_id in evaluated_ids:
                continue

            collector = item.get('collector_ai', 'unknown')
            url = item.get('source_url', '')

            if collector not in seen_urls:
                seen_urls[collector] = set()

            if url and url in seen_urls[collector]:
                continue

            if url:
                seen_urls[collector].add(url)

            # 출력용 간소화
            unevaluated.append({
                'id': item_id,
                'title': item.get('title', '')[:100],
                'content': item.get('content', '')[:500],
                'source_url': url,
                'source_name': item.get('source_name', ''),
                'published_date': item.get('published_date', ''),
                'collector_ai': collector,
                'data_type': item.get('data_type', ''),
                'sentiment': item.get('sentiment', '')
            })

        cat_info = {
            "category": cat,
            "category_kr": CATEGORY_KR.get(cat, cat),
            "total_collected": len(collected.data or []),
            "already_evaluated": len(evaluated_ids),
            "need_evaluation": len(unevaluated),
            "items": unevaluated
        }
        result["categories"].append(cat_info)

    print(json.dumps(result, ensure_ascii=False, indent=2))


def cmd_save(args):
    """평가 결과를 DB에 저장"""
    pid = args.politician_id
    pname = args.politician_name
    category = args.category
    input_file = args.input

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    evaluations = data.get('evaluations', data if isinstance(data, list) else [])

    if not evaluations:
        print("ERROR: 저장할 평가 데이터가 없습니다.")
        return

    saved = 0
    skipped = 0
    errors = 0
    x_count = 0

    for ev in evaluations:
        try:
            rating = str(ev.get('rating', '')).strip().upper()

            # 등급 정규화
            if rating in ['4', '3', '2', '1']:
                rating = '+' + rating

            if rating not in VALID_RATINGS:
                print(f"WARNING: 잘못된 등급 건너뛰기: {rating}")
                skipped += 1
                continue

            if rating == 'X':
                x_count += 1

            # collected_data_id 추출 (평가-수집 데이터 연결)
            collected_data_id = ev.get('id')  # JSON의 id = collected_data의 id

            db_item = {
                'politician_id': pid,
                'politician_name': pname,
                'category': category,
                'evaluator_ai': 'Gemini',
                'collected_data_id': collected_data_id,
                'rating': rating,
                'reasoning': str(ev.get('rationale', ev.get('reasoning', '')))[:1000],
                'evaluated_at': ev.get('evaluated_at', datetime.now().isoformat())
            }

            supabase.table(TABLE_EVALUATIONS).insert(db_item).execute()
            saved += 1

        except Exception as e:
            err_str = str(e)
            if 'duplicate' in err_str.lower() or '23505' in err_str:
                skipped += 1
            else:
                print(f"ERROR: {e}")
                errors += 1

    print(f"OK: {saved}개 저장, {skipped}개 스킵(중복), {x_count}개 X판정, {errors}개 에러")


def cmd_status(args):
    """전체 평가 현황"""
    pid = args.politician_id

    print(f"=== Gemini 평가 현황 ({pid}) ===")
    print()
    print(f"{'#':>2} {'카테고리':18s} | 수집 | Gemini평가 | 완료율 | 판정")
    print("-" * 70)

    total_collected = 0
    total_evaluated = 0
    pass_count = 0

    for i, cat in enumerate(CATEGORIES):
        collected = supabase.table(TABLE_COLLECTED).select('id', count='exact')\
            .eq('politician_id', pid).eq('category', cat).execute()
        evaluated = supabase.table(TABLE_EVALUATIONS).select('id', count='exact')\
            .eq('politician_id', pid).eq('category', cat)\
            .eq('evaluator_ai', 'Gemini').execute()

        c = collected.count or 0
        e = evaluated.count or 0

        total_collected += c
        total_evaluated += e

        rate = f"{e/c*100:.0f}%" if c > 0 else "N/A"

        if c > 0 and e >= c:
            verdict = 'DONE'
            pass_count += 1
        elif c > 0:
            verdict = f'TODO(-{c-e})'
        else:
            verdict = 'NO DATA'

        print(f"{i+1:2d} {cat:18s} | {c:4d} | {e:4d} | {rate:>7s} | {verdict}")

    print("-" * 70)
    total_rate = f"{total_evaluated/total_collected*100:.0f}%" if total_collected > 0 else "N/A"
    print(f"합계: {total_collected:4d} | {total_evaluated:4d} | {total_rate:>7s}")
    print(f"완료: {pass_count}/10 카테고리")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='V40 Gemini CLI 평가 헬퍼')
    subparsers = parser.add_subparsers(dest='command')

    # fetch
    p_fetch = subparsers.add_parser('fetch', help='평가할 데이터 조회')
    p_fetch.add_argument('--politician_id', required=True)
    p_fetch.add_argument('--politician_name', required=True)
    p_fetch.add_argument('--category', required=True, help='카테고리명 또는 all')

    # save
    p_save = subparsers.add_parser('save', help='평가 결과 저장')
    p_save.add_argument('--politician_id', required=True)
    p_save.add_argument('--politician_name', required=True)
    p_save.add_argument('--category', required=True)
    p_save.add_argument('--input', required=True, help='JSON 파일 경로')

    # status
    p_status = subparsers.add_parser('status', help='전체 현황')
    p_status.add_argument('--politician_id', required=True)

    args = parser.parse_args()

    if args.command == 'fetch':
        cmd_fetch(args)
    elif args.command == 'save':
        cmd_save(args)
    elif args.command == 'status':
        cmd_status(args)
    else:
        parser.print_help()
