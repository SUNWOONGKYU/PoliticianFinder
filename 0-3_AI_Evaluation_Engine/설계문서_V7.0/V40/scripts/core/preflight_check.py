# -*- coding: utf-8 -*-
"""
V40 Pre-flight Check - Phase 시작 전 전체 상태 확인

Phase 시작 전 한 줄로 전체 상태를 확인합니다.
선행 Phase가 미완료면 경고 및 차단.

사용법:
    # 전체 상태 확인
    python preflight_check.py --politician_id=37e39502

    # 특정 Phase 시작 가능 여부 확인
    python preflight_check.py --politician_id=37e39502 --target_phase=3

    # 다음 실행할 Phase 안내
    python preflight_check.py --politician_id=37e39502 --next
"""

import sys
import io
import os
import argparse
from pathlib import Path

# UTF-8 출력 설정
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        pass

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
HELPERS_DIR = SCRIPT_DIR.parent / 'helpers'
sys.path.insert(0, str(HELPERS_DIR))

from phase_tracker import (
    print_status,
    check_phase_gate,
    get_next_phase,
    PHASE_NAMES,
    PHASE_ORDER
)


def main():
    parser = argparse.ArgumentParser(
        description='V40 Pre-flight Check - Phase 상태 확인',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예시:
  # 전체 상태 확인
  python preflight_check.py --politician_id=37e39502

  # Phase 3 시작 가능 여부 확인
  python preflight_check.py --politician_id=37e39502 --target_phase=3

  # 다음 실행할 Phase 안내
  python preflight_check.py --politician_id=37e39502 --next
        """
    )

    parser.add_argument('--politician_id', required=True, help='정치인 ID (8자리 hex)')
    parser.add_argument('--target_phase', choices=PHASE_ORDER, help='시작하려는 Phase 번호')
    parser.add_argument('--next', action='store_true', help='다음 실행할 Phase 안내')

    args = parser.parse_args()

    # 전체 상태 출력
    print_status(args.politician_id)

    # 특정 Phase 시작 가능 여부 확인
    if args.target_phase:
        ok, msg, missing = check_phase_gate(args.politician_id, args.target_phase)
        if ok:
            phase_name = PHASE_NAMES.get(args.target_phase, '')
            print(f"  Phase {args.target_phase} ({phase_name}) 시작 가능합니다.")
            sys.exit(0)
        else:
            print(msg)
            sys.exit(1)

    # 다음 실행할 Phase 안내
    if args.next:
        next_phase = get_next_phase(args.politician_id)
        if next_phase == 'ALL_DONE':
            print("  모든 Phase가 완료되었습니다!")
        else:
            phase_name = PHASE_NAMES.get(next_phase, '')
            print(f"  다음 실행할 Phase: {next_phase} ({phase_name})")

            # 해당 Phase에 필요한 스크립트 안내
            phase_scripts = {
                '0': '정치인 정보 등록 (instructions/1_politicians/ 에 MD 파일 생성)',
                '1': 'collect_gemini_subprocess.py + collect_naver_v40_final.py',
                '2': 'python scripts/core/validate_v40_fixed.py --politician_id=ID --politician_name="이름" --no-dry-run',
                '2-2': 'python scripts/core/adjust_v40_data.py --politician_id=ID --politician_name="이름" --no-dry-run',
                '3': '4개 AI 평가 (Claude/ChatGPT/Gemini/Grok eval helpers)',
                '4': 'python scripts/core/calculate_v40_scores.py --politician_id=ID --politician_name="이름"',
                '5': 'python scripts/core/generate_report_v40.py --politician_id=ID --politician_name="이름"',
            }
            script = phase_scripts.get(next_phase, '')
            if script:
                print(f"  실행 방법: {script}")


if __name__ == '__main__':
    main()
