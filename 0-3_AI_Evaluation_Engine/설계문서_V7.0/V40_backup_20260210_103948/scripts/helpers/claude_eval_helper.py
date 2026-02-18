# -*- coding: utf-8 -*-
"""
V40 Claude 평가 헬퍼 스크립트

Claude Code 세션에서 호출하여 DB 조회/저장을 수행합니다.
평가 자체는 Claude Code가 직접 수행 (CLI Direct Mode, $0).

사용법:
    # 1. 미평가 데이터 조회 (프롬프트 생성)
    python claude_eval_helper.py fetch --politician_id={ID} --politician_name={이름} --category={카테고리}

    # 2. 평가 결과 저장
    python claude_eval_helper.py save --politician_id={ID} --politician_name={이름} --category={카테고리} --input=eval_result.json

    # 3. 진행 상황 확인
    python claude_eval_helper.py status --politician_id={ID}

파라미터:
    fetch:  미평가 데이터 조회 + 평가 프롬프트 파일 생성
    save:   Claude CLI 평가 결과 JSON을 DB에 저장
    status: 정치인별 전체 평가 현황 표시

    --politician_id:   정치인 ID (8자리 hex, 예: 62e7b453)
    --politician_name: 정치인 이름 (예: "박주민")
    --category:        카테고리 영문명 (expertise, leadership, vision, integrity, ethics,
                       accountability, transparency, communication, responsiveness, publicinterest)
    --input:           (save 전용) 저장할 JSON 파일 경로
    --batch_size:      (fetch 전용) 배치 크기 (기본 25)
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

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 테이블명
TABLE_COLLECTED = "collected_data_v40"
TABLE_EVALUATIONS = "evaluations_v40"

# 카테고리 정의
CATEGORY_MAP = {
    "expertise": "전문성",
    "leadership": "리더십",
    "vision": "비전",
    "integrity": "청렴성",
    "ethics": "윤리성",
    "accountability": "책임감",
    "transparency": "투명성",
    "communication": "소통능력",
    "responsiveness": "대응성",
    "publicinterest": "공익성"
}

CATEGORIES = list(CATEGORY_MAP.keys())

# V40 등급 체계 (+4 ~ -4, X)
VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4', 'X']

# ⚠️ 점수 계산은 calculate_v40_scores.py의 단독 책임
# 이 헬퍼는 rating(등급)만 저장, score는 저장하지 않음


def fetch_unevaluated(politician_id, politician_name, category):
    """미평가 데이터 조회 (Claude 평가 기준)

    Returns:
        JSON 출력: {profile, items, total_count, batch_info}
    """
    cat_lower = category.lower()
    cat_kor = CATEGORY_MAP.get(cat_lower, category)

    # 1. 정치인 프로필 조회
    profile = {}
    try:
        result = supabase.table('politicians').select('*').eq('id', politician_id).execute()
        if result.data:
            profile = result.data[0]
    except Exception as e:
        print(f"  WARNING: 프로필 조회 실패: {e}", file=sys.stderr)

    # 2. 이미 평가된 collected_data_id 목록 (개선: collected_data_id로 필터링)
    try:
        eval_result = supabase.table(TABLE_EVALUATIONS)\
            .select('collected_data_id')\
            .eq('politician_id', politician_id)\
            .eq('evaluator_ai', 'Claude')\
            .eq('category', cat_lower)\
            .execute()
        evaluated_ids = {item['collected_data_id'] for item in (eval_result.data or []) if item.get('collected_data_id')}
        evaluated_count = len(evaluated_ids)
    except Exception as e:
        print(f"  WARNING: 평가 현황 조회 실패: {e}", file=sys.stderr)
        evaluated_ids = set()
        evaluated_count = 0

    # 3. 수집된 데이터 전체 조회
    try:
        collected_result = supabase.table(TABLE_COLLECTED)\
            .select('*')\
            .eq('politician_id', politician_id)\
            .eq('category', cat_lower)\
            .execute()
    except Exception as e:
        print(json.dumps({
            'error': f'데이터 조회 실패: {e}',
            'items': [],
            'total_count': 0
        }, ensure_ascii=False))
        return

    all_items = collected_result.data or []

    # 4. AI별 URL 중복 제거 + 미평가 필터링 (개선)
    seen_by_ai = {}
    unique_items = []
    for item in all_items:
        item_id = item.get('id')

        # 이미 평가된 항목은 제외
        if item_id in evaluated_ids:
            continue

        ai_name = item.get('collector_ai', 'unknown')
        url = item.get('source_url', '')

        if ai_name not in seen_by_ai:
            seen_by_ai[ai_name] = set()

        if url and url in seen_by_ai[ai_name]:
            continue

        if url:
            seen_by_ai[ai_name].add(url)
        unique_items.append(item)

    # 5. 이미 완료되었는지 확인
    if len(unique_items) == 0 and evaluated_count > 0:
        print(json.dumps({
            'message': f'{politician_name} - {cat_kor}: 이미 평가 완료 ({evaluated_count}/{len(unique_items)})',
            'items': [],
            'total_count': 0,
            'already_evaluated': evaluated_count
        }, ensure_ascii=False))
        return

    # 6. 미평가 데이터만 필터링 (evaluated_count가 있으면 앞에서부터 스킵)
    # 정확한 필터링: 이미 평가된 collected_data ID를 기준으로 제외
    try:
        if evaluated_count > 0:
            # 평가된 항목의 collected_data 정보 조회 (reasoning에서 ID 매칭 불가하므로 count 기반)
            # V40에는 collected_data_id 컬럼이 없으므로 count 기반으로 스킵
            # 안전한 방법: 전체 데이터를 보내되, 이미 평가된 개수를 알려줌
            pass
    except Exception:
        pass

    # 7. 배치 분할 정보
    batch_size = 25  # 기본값 25 (품질과 속도의 최적 균형)
    items_for_eval = unique_items  # 전체 보내고, 이미 평가된 수를 알려줌
    batch_info = []
    for i in range(0, len(items_for_eval), batch_size):
        end = min(i + batch_size, len(items_for_eval))
        batch_info.append({
            'batch_num': i // batch_size + 1,
            'start': i,
            'end': end,
            'count': end - i
        })

    # 8. 출력 (프로필 정보 축소)
    profile_summary = {
        'name': profile.get('name', politician_name),
        'identity': profile.get('identity', 'N/A'),
        'title': profile.get('title', profile.get('position', 'N/A')),
        'party': profile.get('party', 'N/A'),
        'region': profile.get('region', 'N/A'),
        'gender': profile.get('gender', 'N/A')
    }

    # items에서 불필요한 필드 제거 (출력 축소)
    slim_items = []
    for item in items_for_eval:
        slim_items.append({
            'id': item.get('id'),
            'title': item.get('title', ''),
            'content': item.get('content', '')[:500],
            'source_url': item.get('source_url', ''),
            'source_name': item.get('source_name', ''),
            'published_date': item.get('published_date', ''),
            'collector_ai': item.get('collector_ai', ''),
            'data_type': item.get('data_type', ''),
            'sentiment': item.get('sentiment', '')
        })

    output = {
        'politician_id': politician_id,
        'politician_name': politician_name,
        'category': cat_lower,
        'category_korean': cat_kor,
        'profile': profile_summary,
        'items': slim_items,
        'total_count': len(slim_items),
        'already_evaluated': evaluated_count,
        'batch_size': batch_size,
        'batch_info': batch_info
    }

    print(json.dumps(output, ensure_ascii=False, indent=2))


def save_evaluations(politician_id, politician_name, category, input_file):
    """평가 결과를 DB에 저장

    Args:
        input_file: JSON 파일 경로 (evaluations 배열 포함)
    """
    cat_lower = category.lower()

    # 1. JSON 파일 읽기
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"ERROR: 파일 읽기 실패: {e}", file=sys.stderr)
        sys.exit(1)

    evaluations = data.get('evaluations', [])
    if not evaluations:
        print("WARNING: 평가 데이터 없음")
        return

    # 2. 레코드 생성
    records = []
    skipped = 0
    x_count = 0

    for ev in evaluations:
        rating = str(ev.get('rating', '')).strip()

        # 등급 정규화
        if rating in ['4', '3', '2', '1']:
            rating = '+' + rating
        rating = rating.upper()

        if rating not in VALID_RATINGS:
            print(f"  WARNING: 잘못된 등급 건너뛰기: {rating}")
            skipped += 1
            continue

        if rating == 'X':
            x_count += 1

        # collected_data_id 추출 (평가-수집 데이터 연결)
        collected_data_id = ev.get('id')  # JSON의 id = collected_data의 id

        record = {
            'politician_id': politician_id,
            'politician_name': politician_name,
            'category': cat_lower,
            'evaluator_ai': 'Claude',
            'collected_data_id': collected_data_id,
            'rating': rating,
            'reasoning': ev.get('rationale', ev.get('reasoning', ''))[:1000],
            'evaluated_at': ev.get('evaluated_at', datetime.now().isoformat())
        }
        records.append(record)

    if not records:
        print("WARNING: 저장할 유효한 평가 없음")
        return

    if x_count > 0:
        print(f"  INFO: 평가 제외(X) 판정: {x_count}개")

    # 3. 배치 INSERT
    try:
        result = supabase.table(TABLE_EVALUATIONS).insert(records).execute()
        saved_count = len(result.data) if result.data else 0
        print(f"OK: {saved_count}개 저장 완료 (건너뜀: {skipped}개, X판정: {x_count}개)")
    except Exception as e:
        error_msg = str(e)
        if "'code': '23505'" in error_msg or 'duplicate key' in error_msg.lower():
            print(f"WARNING: 중복 평가 건너뛰기 (이미 저장됨)")
        else:
            print(f"ERROR: 저장 실패: {error_msg}", file=sys.stderr)
            sys.exit(1)


def show_status(politician_id):
    """카테고리별 평가 현황 출력"""
    # 정치인 이름 조회
    try:
        result = supabase.table('politicians').select('name').eq('id', politician_id).execute()
        name = result.data[0]['name'] if result.data else '(알 수 없음)'
    except Exception:
        name = '(조회 실패)'

    print(f"\n{'='*60}")
    print(f" V40 Claude 평가 현황: {name} ({politician_id})")
    print(f"{'='*60}")
    print(f"{'카테고리':<15} {'수집':<8} {'Claude평가':<10} {'완료율':<10} {'상태'}")
    print(f"{'-'*60}")

    total_collected = 0
    total_evaluated = 0

    for cat_eng in CATEGORIES:
        cat_kor = CATEGORY_MAP[cat_eng]

        # 수집 데이터 수
        try:
            col_result = supabase.table(TABLE_COLLECTED)\
                .select('id', count='exact')\
                .eq('politician_id', politician_id)\
                .eq('category', cat_eng)\
                .execute()
            collected = col_result.count if col_result.count else 0
        except Exception:
            collected = 0

        # Claude 평가 수
        try:
            eval_result = supabase.table(TABLE_EVALUATIONS)\
                .select('id', count='exact')\
                .eq('politician_id', politician_id)\
                .eq('evaluator_ai', 'Claude')\
                .eq('category', cat_eng)\
                .execute()
            evaluated = eval_result.count if eval_result.count else 0
        except Exception:
            evaluated = 0

        total_collected += collected
        total_evaluated += evaluated

        rate = f"{evaluated/collected*100:.0f}%" if collected > 0 else "N/A"
        status = "DONE" if collected > 0 and evaluated >= collected else "TODO" if collected > 0 else "NO DATA"

        print(f"{cat_kor:<12} {cat_eng:<12} {collected:<8} {evaluated:<10} {rate:<10} {status}")

    print(f"{'-'*60}")
    total_rate = f"{total_evaluated/total_collected*100:.0f}%" if total_collected > 0 else "N/A"
    print(f"{'합계':<25} {total_collected:<8} {total_evaluated:<10} {total_rate}")
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description='V40 Claude 평가 헬퍼')
    subparsers = parser.add_subparsers(dest='command', help='명령어')

    # fetch 명령
    fetch_parser = subparsers.add_parser('fetch', help='미평가 데이터 조회')
    fetch_parser.add_argument('--politician_id', required=True, help='정치인 ID')
    fetch_parser.add_argument('--politician_name', required=True, help='정치인 이름')
    fetch_parser.add_argument('--category', required=True, help='카테고리 영문명')

    # save 명령
    save_parser = subparsers.add_parser('save', help='평가 결과 저장')
    save_parser.add_argument('--politician_id', required=True, help='정치인 ID')
    save_parser.add_argument('--politician_name', required=True, help='정치인 이름')
    save_parser.add_argument('--category', required=True, help='카테고리 영문명')
    save_parser.add_argument('--input', required=True, help='평가 결과 JSON 파일')

    # status 명령
    status_parser = subparsers.add_parser('status', help='진행 상황 확인')
    status_parser.add_argument('--politician_id', required=True, help='정치인 ID')

    args = parser.parse_args()

    if args.command == 'fetch':
        fetch_unevaluated(args.politician_id, args.politician_name, args.category)
    elif args.command == 'save':
        save_evaluations(args.politician_id, args.politician_name, args.category, args.input)
    elif args.command == 'status':
        show_status(args.politician_id)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
