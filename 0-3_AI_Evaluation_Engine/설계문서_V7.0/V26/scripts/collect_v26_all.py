# -*- coding: utf-8 -*-
"""
V26.0 전체 AI 일괄 데이터 수집
- 4개 AI: Claude, ChatGPT, Grok, Gemini
- 기간 제한: OFFICIAL 4년, PUBLIC 1년
- 순차 또는 병렬 실행 지원
"""

import os
import sys
import argparse
import subprocess
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv()

# 스크립트 경로
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# 4개 AI 수집 스크립트
AI_SCRIPTS = [
    ("Claude", "collect_v26_claude.py"),
    ("ChatGPT", "collect_v26_chatgpt.py"),
    ("Grok", "collect_v26_grok.py"),
    ("Gemini", "collect_v26_gemini.py"),
]


def run_ai_collection(ai_name, script_name, politician_id, politician_name):
    """개별 AI 수집 스크립트 실행"""
    script_path = os.path.join(SCRIPT_DIR, script_name)

    print(f"\n{'='*60}")
    print(f"🚀 {ai_name} 수집 시작")
    print(f"{'='*60}")

    start_time = datetime.now()

    try:
        result = subprocess.run(
            [
                sys.executable, script_path,
                "--politician_id", politician_id,
                "--politician_name", politician_name
            ],
            capture_output=False,
            text=True,
            encoding='utf-8'
        )

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        if result.returncode == 0:
            print(f"\n✅ {ai_name} 수집 완료 ({duration:.1f}초)")
            return True, ai_name, duration
        else:
            print(f"\n❌ {ai_name} 수집 실패")
            return False, ai_name, duration

    except Exception as e:
        print(f"\n❌ {ai_name} 실행 에러: {e}")
        return False, ai_name, 0


def collect_sequential(politician_id, politician_name):
    """4개 AI 순차 수집"""
    print("="*60)
    print("V26.0 전체 AI 순차 수집")
    print("="*60)
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"AI: Claude, ChatGPT, Grok, Gemini (4개)")
    print(f"실행 방식: 순차 (Sequential)")
    print("="*60)

    total_start = datetime.now()
    results = []

    for ai_name, script_name in AI_SCRIPTS:
        success, name, duration = run_ai_collection(ai_name, script_name, politician_id, politician_name)
        results.append((success, name, duration))

    total_end = datetime.now()
    total_duration = (total_end - total_start).total_seconds()

    print_summary(results, total_duration, "순차")


def collect_parallel(politician_id, politician_name):
    """4개 AI 병렬 수집"""
    print("="*60)
    print("V26.0 전체 AI 병렬 수집")
    print("="*60)
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"AI: Claude, ChatGPT, Grok, Gemini (4개)")
    print(f"실행 방식: 병렬 (Parallel)")
    print("="*60)

    total_start = datetime.now()
    results = []

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {}
        for ai_name, script_name in AI_SCRIPTS:
            future = executor.submit(
                run_ai_collection,
                ai_name, script_name, politician_id, politician_name
            )
            futures[future] = ai_name

        for future in as_completed(futures):
            result = future.result()
            results.append(result)

    total_end = datetime.now()
    total_duration = (total_end - total_start).total_seconds()

    print_summary(results, total_duration, "병렬")


def print_summary(results, total_duration, mode):
    """결과 요약 출력"""
    print("\n" + "="*60)
    print(f"📊 수집 결과 요약 ({mode} 모드)")
    print("="*60)

    success_count = sum(1 for r in results if r[0])
    fail_count = len(results) - success_count

    for success, ai_name, duration in results:
        status = "✅ 성공" if success else "❌ 실패"
        print(f"  {ai_name}: {status} ({duration:.1f}초)")

    print("-"*60)
    print(f"성공: {success_count}/4")
    print(f"실패: {fail_count}/4")
    print(f"총 소요 시간: {total_duration:.1f}초 ({total_duration/60:.1f}분)")
    print("="*60)


def main():
    parser = argparse.ArgumentParser(description='V26.0 전체 AI 데이터 수집')
    parser.add_argument('--politician_id', type=str, required=True, help='정치인 ID')
    parser.add_argument('--politician_name', type=str, required=True, help='정치인 이름')
    parser.add_argument('--parallel', action='store_true', help='병렬 실행 (기본: 순차)')

    args = parser.parse_args()

    if args.parallel:
        collect_parallel(args.politician_id, args.politician_name)
    else:
        collect_sequential(args.politician_id, args.politician_name)


if __name__ == "__main__":
    main()
