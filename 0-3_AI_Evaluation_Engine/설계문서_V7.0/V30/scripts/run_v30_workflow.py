# -*- coding: utf-8 -*-
"""
V30 전체 워크플로우 자동 실행 스크립트

프로세스:
1. 수집 (collect_v30.py)
2. 수집 검증 (품질 기준: 110% 이내)
3. 데이터 검증, 중복 제거 및 재수집 (validate_v30.py) ✅ 자동화
   - URL 실제 존재 여부 확인
   - 도메인 유효성 검사 (OFFICIAL/PUBLIC)
   - 기간 제한 검증 (공식 4년, 공개 2년)
   - 중복 데이터 자동 제거 (같은 AI + 같은 URL) ✅ 통합
   - 검증 실패 시 자동 재수집
4. 평가 (evaluate_v30.py)
5. 평가 검증 (품질 기준: 97% 이상)
6. 재평가 (누락 평가 자동 처리) ✅ 자동화
7. 점수 계산 (calculate_v30_scores.py)
"""

import os
import sys
import subprocess
import argparse
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 평가 AI (4개)
EVALUATION_AIS = ["Claude", "ChatGPT", "Gemini", "Grok"]

# 카테고리
CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]


def print_step(step_num, title):
    """단계 출력"""
    print(f"\n{'='*60}")
    print(f"[단계 {step_num}] {title}")
    print(f"{'='*60}\n")


def run_command(cmd, description):
    """명령어 실행"""
    print(f"▶ {description}")
    print(f"  명령어: {cmd}\n")

    # UTF-8 인코딩 강제 (subprocess 자식 프로세스용)
    env = os.environ.copy()
    env['PYTHONIOENCODING'] = 'utf-8'

    result = subprocess.run(cmd, shell=True, capture_output=False, text=True, env=env)

    if result.returncode != 0:
        print(f"\n❌ 오류 발생: 명령어 실행 실패 (exit code: {result.returncode})")
        return False

    print(f"\n✅ 완료\n")
    return True


def check_collection_quality(politician_id):
    """수집 품질 확인"""
    print_step("2", "수집 검증")

    # 수집 데이터 개수 확인
    result = supabase.table('collected_data_v30').select('id', count='exact').eq('politician_id', politician_id).execute()
    collected_count = result.count if result.count else 0

    target = 1000
    collect_pct = (collected_count / target) * 100

    print(f"수집 데이터: {collected_count}개")
    print(f"수집 비율: {collect_pct:.1f}% (목표: 110% 이내)")

    if collect_pct > 110:
        print(f"⚠️ 경고: 수집 비율이 110%를 초과했습니다.")
        print(f"  → 데이터 품질에 영향을 줄 수 있습니다.\n")
        return False

    if collected_count < 100:
        print(f"❌ 오류: 수집 데이터가 너무 적습니다 (최소 100개 필요)")
        return False

    print(f"✅ 수집 품질 검증 통과\n")
    return True


def check_evaluation_quality(politician_id):
    """평가 품질 확인"""
    print_step("5", "평가 검증")

    # 수집 데이터 개수
    collected_result = supabase.table('collected_data_v30').select('id', count='exact').eq('politician_id', politician_id).execute()
    collected_count = collected_result.count if collected_result.count else 0

    # 평가 데이터 개수
    eval_result = supabase.table('evaluations_v30').select('id', count='exact').eq('politician_id', politician_id).execute()
    eval_count = eval_result.count if eval_result.count else 0

    # 기대 평가 개수
    expected = collected_count * 4  # 4 AIs

    completion = eval_count / expected * 100 if expected > 0 else 0

    print(f"수집 데이터: {collected_count}개")
    print(f"평가 데이터: {eval_count}개")
    print(f"기대 평가: {expected}개 (수집 × 4 AIs)")
    print(f"완성도: {completion:.2f}%")

    if completion < 97:
        print(f"\n⚠️ 경고: 평가 완성도가 97% 미만입니다.")
        print(f"  → 재평가가 필요합니다.\n")
        return False

    print(f"\n✅ 평가 품질 검증 통과\n")
    return True


def get_missing_evaluations(politician_id):
    """누락된 평가 찾기"""
    from collections import defaultdict

    print("누락된 평가 조회 중...")

    # 모든 수집 데이터 조회
    all_collected = []
    offset = 0
    while True:
        result = supabase.table('collected_data_v30').select('*').eq('politician_id', politician_id).range(offset, offset + 999).execute()
        if not result.data:
            break
        all_collected.extend(result.data)
        offset += 1000
        if len(result.data) < 1000:
            break

    # 모든 평가 데이터 조회
    all_evals = []
    offset = 0
    while True:
        result = supabase.table('evaluations_v30').select('collected_data_id, evaluator_ai').eq('politician_id', politician_id).range(offset, offset + 999).execute()
        if not result.data:
            break
        all_evals.extend(result.data)
        offset += 1000
        if len(result.data) < 1000:
            break

    # collected_data_id별로 평가한 AI 매핑
    cid_to_ais = defaultdict(set)
    for ev in all_evals:
        cid = ev.get('collected_data_id')
        ai = ev.get('evaluator_ai')
        if cid and ai:
            cid_to_ais[cid].add(ai)

    # 누락된 평가 찾기
    missing = []
    for item in all_collected:
        cid = item.get('id')
        evaluated_by = cid_to_ais.get(cid, set())

        for ai in EVALUATION_AIS:
            if ai not in evaluated_by:
                missing.append({
                    'item': item,
                    'ai': ai
                })

    print(f"  총 수집 데이터: {len(all_collected)}개")
    print(f"  총 평가: {len(all_evals)}개")
    print(f"  누락 평가: {len(missing)}개\n")

    return missing


def reevaluate_missing(politician_id, politician_name, parallel=False):
    """누락된 평가 재실행 (evaluate_v30.py 재실행으로 자동 처리)"""
    print_step("6", "재평가 (누락 평가 처리)")

    missing = get_missing_evaluations(politician_id)

    if not missing:
        print("✅ 누락된 평가 없음\n")
        return True

    print(f"⚠️ 누락된 평가 {len(missing)}개 발견")
    print(f"재평가를 시작합니다...\n")
    print(f"▶ evaluate_v30.py를 재실행하여 누락된 평가만 처리합니다.\n")

    # evaluate_v30.py 재실행 (check_already_evaluated가 100% 체크하므로 누락된 것만 평가)
    parallel_flag = "--parallel" if parallel else ""
    cmd = f'python evaluate_v30.py --politician_id={politician_id} --politician_name="{politician_name}" {parallel_flag}'

    success = run_command(cmd, "evaluate_v30.py 재실행 (누락 평가 자동 처리)")

    if not success:
        print("❌ 재평가 실패\n")
        return False

    # 재평가 후 다시 확인
    remaining = get_missing_evaluations(politician_id)

    print(f"\n재평가 후 남은 누락: {len(remaining)}개")

    if len(remaining) > 0:
        print(f"⚠️ 일부 평가가 여전히 누락되어 있습니다.")
        print(f"  → 수동 확인이 필요할 수 있습니다.\n")
        return False

    print(f"✅ 모든 누락 평가 완료\n")
    return True


def main():
    parser = argparse.ArgumentParser(description='V30 전체 워크플로우 자동 실행')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--skip_collect', action='store_true', help='수집 단계 건너뛰기')
    parser.add_argument('--skip_evaluate', action='store_true', help='평가 단계 건너뛰기')
    parser.add_argument('--parallel', action='store_true', help='병렬 실행')

    args = parser.parse_args()

    print(f"\n{'#'*60}")
    print(f"# V30 전체 워크플로우 자동 실행")
    print(f"# 정치인: {args.politician_name} ({args.politician_id})")
    print(f"# 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'#'*60}\n")

    # 1. 수집
    if not args.skip_collect:
        print_step("1", "데이터 수집")
        parallel_flag = "--parallel" if args.parallel else ""
        cmd = f'python collect_v30.py --politician_id={args.politician_id} --politician_name="{args.politician_name}" {parallel_flag}'
        if not run_command(cmd, "데이터 수집 실행"):
            print("❌ 워크플로우 중단: 수집 실패")
            return

    # 2. 수집 검증
    collection_quality_ok = check_collection_quality(args.politician_id)

    if not collection_quality_ok:
        print("⚠️ 수집 품질 검증 실패")
        user_input = input("계속 진행하시겠습니까? (y/n): ")
        if user_input.lower() != 'y':
            print("워크플로우 중단")
            return

    # 3. 데이터 검증, 중복 제거 및 재수집 (validate_v30.py)
    print_step("3", "데이터 검증, 중복 제거 및 재수집")
    cmd = f'python validate_v30.py --politician_id={args.politician_id} --politician_name="{args.politician_name}" --mode=all'

    print("▶ 수집 데이터 검증 중...")
    print("  - URL 실제 존재 여부 확인")
    print("  - 도메인 유효성 검사 (OFFICIAL/PUBLIC)")
    print("  - 기간 제한 검증 (공식 4년, 공개 2년)")
    print("  - 중복 데이터 자동 제거 (같은 AI + 같은 URL)")
    print("  - 검증 실패 시 자동 재수집\n")

    if not run_command(cmd, "데이터 검증 및 재수집 실행"):
        print("⚠️ 검증/재수집 중 오류 발생")
        user_input = input("계속 진행하시겠습니까? (y/n): ")
        if user_input.lower() != 'y':
            print("워크플로우 중단")
            return

    # 4. 평가
    if not args.skip_evaluate:
        print_step("4", "데이터 평가")
        parallel_flag = "--parallel" if args.parallel else ""
        cmd = f'python evaluate_v30.py --politician_id={args.politician_id} --politician_name="{args.politician_name}" {parallel_flag}'
        if not run_command(cmd, "데이터 평가 실행"):
            print("❌ 워크플로우 중단: 평가 실패")
            return

    # 5. 평가 검증
    needs_reevaluation = not check_evaluation_quality(args.politician_id)

    # 6. 재평가 (누락 평가 처리)
    if needs_reevaluation:
        if not reevaluate_missing(args.politician_id, args.politician_name, args.parallel):
            print("⚠️ 재평가 중 일부 실패")
            user_input = input("계속 진행하시겠습니까? (y/n): ")
            if user_input.lower() != 'y':
                print("워크플로우 중단")
                return

        # 재평가 후 다시 검증
        if not check_evaluation_quality(args.politician_id):
            print("⚠️ 재평가 후에도 품질 기준 미달")

    # 7. 점수 계산
    print_step("7", "점수 계산")
    cmd = f'python calculate_v30_scores.py --politician_id={args.politician_id} --politician_name="{args.politician_name}"'
    if not run_command(cmd, "점수 계산 실행"):
        print("❌ 워크플로우 중단: 점수 계산 실패")
        return

    # 완료
    print(f"\n{'='*60}")
    print(f"✅ V30 전체 워크플로우 완료!")
    print(f"종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
