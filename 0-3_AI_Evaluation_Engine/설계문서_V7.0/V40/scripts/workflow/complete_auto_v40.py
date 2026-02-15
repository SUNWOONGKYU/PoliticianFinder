#!/usr/bin/env python3
"""
V40 완전 자동화 실행 스크립트
=================================

**실행 시간 목표: 10-15분**

수집 채널 (2개):
- Gemini CLI (Gemini 2.0 Flash) - 50%
- Naver API - 50%

평가 AI (4개):
- Claude Haiku 4.5 (CLI Direct, 배치 25/50, 저렴한 모델)
- ChatGPT gpt-5.1-codex-mini (CLI Direct, 배치 25)
- Gemini 2.0 Flash (CLI Subprocess, 배치 50)
- Grok 2 (xAI API Direct, 배치 25)

최적화 전략:
1. 배치 처리 (API 25개, Gemini Subprocess 50개)
2. 프롬프트 캐싱 (90% 시간/비용 절감)
3. 병렬 처리 (10 카테고리 동시 실행)

실행 방법:
    python complete_auto_v40.py --politician-id 8c5dcc89 --politician-name "박주민"

    옵션:
    --skip-collection: 수집 단계 건너뛰기
    --skip-evaluation: 평가 단계 건너뛰기
    --workers: 병렬 작업 수 (기본값: 10)
    --batch-size: 배치 크기 (기본값: 25)
"""

import os
import sys
import time
import argparse
import json
from pathlib import Path
from datetime import datetime
from concurrent.futures import ProcessPoolExecutor, as_completed

# V40 루트 디렉토리 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent  # scripts/workflow/ -> V40/
CORE_DIR = V40_DIR / "scripts" / "core"

# 시스템 경로에 추가
sys.path.insert(0, str(CORE_DIR))
sys.path.insert(0, str(V40_DIR / "scripts" / "helpers"))

from collect_gemini_mcp import collect_gemini_parallel
from collect_naver_auto import collect_naver_parallel
from evaluate_claude_cli import evaluate_claude_parallel
from evaluate_gemini_mcp import evaluate_gemini_parallel
from evaluate_chatgpt_api import evaluate_chatgpt_parallel
from evaluate_grok_api import evaluate_grok_parallel

# 10개 카테고리
CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]


class ProgressTracker:
    """진행 상황 실시간 추적"""

    def __init__(self, politician_name: str):
        self.politician_name = politician_name
        self.start_time = time.time()
        self.phase_times = {}
        self.phase_start = None

    def start_phase(self, phase_name: str):
        """단계 시작"""
        self.phase_start = time.time()
        print(f"\n{'='*60}")
        print(f"🚀 [{phase_name}] 시작 - {self.politician_name}")
        print(f"{'='*60}")

    def end_phase(self, phase_name: str, success: bool = True):
        """단계 종료"""
        if self.phase_start:
            elapsed = time.time() - self.phase_start
            self.phase_times[phase_name] = elapsed
            status = "✅ 완료" if success else "❌ 실패"
            print(f"\n{status} [{phase_name}] - {elapsed:.1f}초 소요")

    def print_summary(self):
        """최종 요약 출력"""
        total_time = time.time() - self.start_time
        print(f"\n{'='*60}")
        print(f"📊 실행 완료 요약 - {self.politician_name}")
        print(f"{'='*60}")

        for phase, elapsed in self.phase_times.items():
            print(f"  {phase:20s}: {elapsed:6.1f}초")

        print(f"{'='*60}")
        print(f"  {'총 실행 시간':20s}: {total_time:6.1f}초 ({total_time/60:.1f}분)")
        print(f"{'='*60}\n")


def validate_prerequisites(politician_id: str) -> bool:
    """실행 전 필수 조건 검증"""
    print("🔍 실행 전 검증 중...")

    # 1. 환경 변수 확인
    required_env = ['SUPABASE_URL', 'SUPABASE_KEY', 'ANTHROPIC_API_KEY']
    missing = [var for var in required_env if not os.getenv(var)]

    if missing:
        print(f"❌ 환경 변수 누락: {', '.join(missing)}")
        print("   .env 파일을 확인하세요.")
        return False

    # 2. Gemini CLI 설치 확인
    import subprocess
    try:
        result = subprocess.run(['gemini', '--version'],
                              capture_output=True, timeout=5)
        if result.returncode != 0:
            print("❌ Gemini CLI가 설치되지 않았습니다.")
            print("   npm install -g @google/generative-ai-cli")
            return False
    except FileNotFoundError:
        print("❌ Gemini CLI를 찾을 수 없습니다.")
        return False

    # 3. Claude CLI 설치 확인
    try:
        result = subprocess.run(['claude', '--version'],
                              capture_output=True, timeout=5)
        if result.returncode != 0:
            print("❌ Claude CLI가 설치되지 않았습니다.")
            return False
    except FileNotFoundError:
        print("❌ Claude CLI를 찾을 수 없습니다.")
        return False

    # 4. DB 연결 확인
    from supabase import create_client
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_KEY')
    )

    try:
        result = supabase.table('politicians') \
            .select('id, name') \
            .eq('id', politician_id) \
            .execute()

        if not result.data:
            print(f"❌ 정치인 ID {politician_id}를 찾을 수 없습니다.")
            return False

        print(f"✅ 정치인 확인: {result.data[0]['name']}")

    except Exception as e:
        print(f"❌ DB 연결 실패: {e}")
        return False

    print("✅ 모든 필수 조건 충족\n")
    return True


def phase1_collection(politician_id: str, politician_name: str,
                      workers: int, tracker: ProgressTracker) -> bool:
    """Phase 1: 2채널 병렬 수집 (Gemini CLI + Naver API)"""
    tracker.start_phase("Phase 1: 데이터 수집 (Gemini 50% + Naver 50%)")

    try:
        # Gemini와 Naver를 동시에 병렬 실행
        with ProcessPoolExecutor(max_workers=2) as executor:
            # Gemini CLI 수집
            gemini_future = executor.submit(
                collect_gemini_parallel,
                politician_id=politician_id,
                politician_name=politician_name,
                max_workers=workers
            )

            # Naver API 수집
            naver_future = executor.submit(
                collect_naver_parallel,
                politician_id=politician_id,
                politician_name=politician_name,
                max_workers=workers
            )

            # 결과 대기
            gemini_result = gemini_future.result(timeout=600)  # 10분
            naver_result = naver_future.result(timeout=600)    # 10분

        # 결과 확인
        gemini_collected = gemini_result.get('total_collected', 0)
        naver_collected = naver_result.get('total_collected', 0)
        total_collected = gemini_collected + naver_collected

        print(f"\n{'='*60}")
        print(f"✅ 전체 수집 완료:")
        print(f"   Gemini CLI: {gemini_collected}개")
        print(f"   Naver API:  {naver_collected}개")
        print(f"   총합:       {total_collected}개")
        print(f"{'='*60}\n")

        if total_collected > 0:
            tracker.end_phase("Phase 1: 데이터 수집", success=True)
            return True
        else:
            print("❌ 수집된 데이터가 없습니다.")
            tracker.end_phase("Phase 1: 데이터 수집", success=False)
            return False

    except Exception as e:
        print(f"❌ 수집 중 오류 발생: {e}")
        tracker.end_phase("Phase 1: 데이터 수집", success=False)
        return False


def phase2_validation(politician_id: str, tracker: ProgressTracker) -> bool:
    """Phase 2: 수집 데이터 검증"""
    tracker.start_phase("Phase 2: 데이터 검증")

    try:
        import subprocess

        # validate_v40_fixed.py 실행
        result = subprocess.run(
            ['python', str(CORE_DIR / 'validate_v40_fixed.py'),
             '--politician-id', politician_id],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(CORE_DIR)
        )

        if result.returncode == 0:
            print("✅ 데이터 검증 통과")
            tracker.end_phase("Phase 2: 데이터 검증", success=True)
            return True
        else:
            print(f"❌ 검증 실패:\n{result.stderr}")
            tracker.end_phase("Phase 2: 데이터 검증", success=False)
            return False

    except Exception as e:
        print(f"❌ 검증 중 오류 발생: {e}")
        tracker.end_phase("Phase 2: 데이터 검증", success=False)
        return False


def phase3_evaluation(politician_id: str, politician_name: str,
                     workers: int, batch_size: int,
                     tracker: ProgressTracker) -> bool:
    """Phase 3: 4개 AI 병렬 평가"""
    tracker.start_phase("Phase 3: AI 평가 (Claude, ChatGPT, Gemini, Grok)")

    # 4개 AI를 병렬로 실행
    ai_functions = {
        'Claude': evaluate_claude_parallel,
        'ChatGPT': evaluate_chatgpt_parallel,
        'Gemini': evaluate_gemini_parallel,
        'Grok': evaluate_grok_parallel
    }

    results = {}

    try:
        with ProcessPoolExecutor(max_workers=4) as executor:
            futures = {}

            for ai_name, func in ai_functions.items():
                future = executor.submit(
                    func,
                    politician_id=politician_id,
                    politician_name=politician_name,
                    max_workers=workers,
                    batch_size=batch_size
                )
                futures[future] = ai_name

            # 결과 수집
            for future in as_completed(futures):
                ai_name = futures[future]
                try:
                    result = future.result(timeout=600)  # 10분 타임아웃
                    results[ai_name] = result

                    if result['success']:
                        print(f"✅ {ai_name}: {result['total_evaluated']}개 평가 완료")
                    else:
                        print(f"❌ {ai_name}: 평가 실패 - {result.get('error', 'Unknown')}")

                except Exception as e:
                    print(f"❌ {ai_name}: 오류 발생 - {e}")
                    results[ai_name] = {'success': False, 'error': str(e)}

        # 모든 AI가 성공했는지 확인
        all_success = all(r.get('success', False) for r in results.values())

        if all_success:
            total = sum(r.get('total_evaluated', 0) for r in results.values())
            print(f"\n✅ 전체 평가 완료: {total}개")
            tracker.end_phase("Phase 3: AI 평가", success=True)
            return True
        else:
            failed = [name for name, r in results.items() if not r.get('success', False)]
            print(f"\n❌ 일부 AI 평가 실패: {', '.join(failed)}")
            tracker.end_phase("Phase 3: AI 평가", success=False)
            return False

    except Exception as e:
        print(f"❌ 평가 중 오류 발생: {e}")
        tracker.end_phase("Phase 3: AI 평가", success=False)
        return False


def phase4_scoring(politician_id: str, politician_name: str,
                  tracker: ProgressTracker) -> bool:
    """Phase 4: 점수 계산"""
    tracker.start_phase("Phase 4: 점수 계산")

    try:
        import subprocess

        # calculate_v40_scores.py 실행
        result = subprocess.run(
            ['python', str(CORE_DIR / 'calculate_v40_scores.py'),
             '--politician-id', politician_id],
            capture_output=True,
            text=True,
            timeout=60,
            cwd=str(CORE_DIR)
        )

        if result.returncode == 0:
            print("✅ 점수 계산 완료")
            tracker.end_phase("Phase 4: 점수 계산", success=True)
            return True
        else:
            print(f"❌ 점수 계산 실패:\n{result.stderr}")
            tracker.end_phase("Phase 4: 점수 계산", success=False)
            return False

    except Exception as e:
        print(f"❌ 점수 계산 중 오류 발생: {e}")
        tracker.end_phase("Phase 4: 점수 계산", success=False)
        return False


def phase5_report(politician_id: str, politician_name: str,
                 tracker: ProgressTracker) -> bool:
    """Phase 5: 보고서 생성"""
    tracker.start_phase("Phase 5: 보고서 생성")

    try:
        from generate_report_v40 import generate_report

        # 보고서 생성
        report_path = generate_report(politician_id, politician_name)

        print(f"✅ 보고서 생성 완료: {report_path}")
        tracker.end_phase("Phase 5: 보고서 생성", success=True)
        return True

    except Exception as e:
        print(f"❌ 보고서 생성 실패: {e}")
        tracker.end_phase("Phase 5: 보고서 생성", success=False)
        return False


def main():
    """메인 실행 함수"""
    parser = argparse.ArgumentParser(
        description='V40 완전 자동화 실행 (10-15분 목표)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  python complete_auto_v40.py --politician-id 8c5dcc89 --politician-name "박주민"
  python complete_auto_v40.py --politician-id 8c5dcc89 --politician-name "박주민" --skip-collection
  python complete_auto_v40.py --politician-id 8c5dcc89 --politician-name "박주민" --workers 5
        """
    )

    parser.add_argument('--politician-id', required=True,
                       help='정치인 ID (예: 8c5dcc89)')
    parser.add_argument('--politician-name', required=True,
                       help='정치인 이름 (예: 박주민)')
    parser.add_argument('--skip-collection', action='store_true',
                       help='수집 단계 건너뛰기')
    parser.add_argument('--skip-evaluation', action='store_true',
                       help='평가 단계 건너뛰기')
    parser.add_argument('--workers', type=int, default=10,
                       help='병렬 작업 수 (기본값: 10)')
    parser.add_argument('--batch-size', type=int, default=25,
                       help='배치 크기 (기본값: 25)')

    args = parser.parse_args()

    # 진행 상황 추적기 초기화
    tracker = ProgressTracker(args.politician_name)

    print(f"""
╔══════════════════════════════════════════════════════════════╗
║                   V40 완전 자동화 실행                         ║
║                  목표 실행 시간: 10-15분                       ║
╚══════════════════════════════════════════════════════════════╝

정치인: {args.politician_name} ({args.politician_id})
병렬 작업 수: {args.workers}
배치 크기: {args.batch_size}
""")

    # 사전 검증
    if not validate_prerequisites(args.politician_id):
        print("\n❌ 실행 전 검증 실패. 종료합니다.")
        sys.exit(1)

    # Phase 1: 수집
    if not args.skip_collection:
        if not phase1_collection(args.politician_id, args.politician_name,
                                args.workers, tracker):
            print("\n❌ 수집 단계 실패. 종료합니다.")
            sys.exit(1)
    else:
        print("⏭️  수집 단계 건너뛰기\n")

    # Phase 2: 검증
    if not args.skip_collection:
        if not phase2_validation(args.politician_id, tracker):
            print("\n⚠️  검증 실패. 계속 진행하시겠습니까? (y/N): ", end='')
            if input().lower() != 'y':
                sys.exit(1)

    # Phase 3: 평가
    if not args.skip_evaluation:
        if not phase3_evaluation(args.politician_id, args.politician_name,
                                args.workers, args.batch_size, tracker):
            print("\n❌ 평가 단계 실패. 종료합니다.")
            sys.exit(1)
    else:
        print("⏭️  평가 단계 건너뛰기\n")

    # Phase 4: 점수 계산
    if not args.skip_evaluation:
        if not phase4_scoring(args.politician_id, args.politician_name, tracker):
            print("\n❌ 점수 계산 실패. 종료합니다.")
            sys.exit(1)

    # Phase 5: 보고서 생성
    if not phase5_report(args.politician_id, args.politician_name, tracker):
        print("\n⚠️  보고서 생성 실패")

    # 최종 요약
    tracker.print_summary()

    print("""
╔══════════════════════════════════════════════════════════════╗
║                     ✅ 모든 작업 완료!                         ║
╚══════════════════════════════════════════════════════════════╝
""")


if __name__ == '__main__':
    main()
