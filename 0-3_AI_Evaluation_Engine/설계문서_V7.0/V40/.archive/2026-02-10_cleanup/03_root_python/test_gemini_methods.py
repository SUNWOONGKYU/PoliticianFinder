#!/usr/bin/env python3
"""
Gemini CLI 실행 방식 비교 연구
================================

목적: 수동(대화형) vs Subprocess(비대화형) 차이 분석

테스트 항목:
1. API 할당량 소비 차이
2. 응답 시간 차이
3. 응답 품질 차이
4. 세션 유지 여부
"""

import subprocess
import time
import json
from datetime import datetime

# 테스트 프롬프트 (짧은 버전)
TEST_PROMPT = """
정치인 박주민에 대해 간단히 설명해주세요 (100자 이내).

JSON 형식으로 응답:
{
  "name": "박주민",
  "summary": "설명"
}
"""

def test_method_1_stdin():
    """방법 1: stdin으로 프롬프트 전달 (현재 방식)"""
    print("\n" + "="*60)
    print("[TEST 1] Subprocess with stdin")
    print("="*60)

    start = time.time()

    try:
        result = subprocess.run(
            ['gemini.cmd', '--yolo'],
            input=TEST_PROMPT,
            capture_output=True,
            text=True,
            timeout=120,
            encoding='utf-8',
            errors='replace'
        )

        elapsed = time.time() - start

        print(f"\n[OK] Success!")
        print(f"Time: {elapsed:.1f}s")
        print(f"Exit code: {result.returncode}")
        print(f"Output length: {len(result.stdout)} chars")
        print(f"\nOutput preview:")
        print(result.stdout[:500])

        if result.stderr:
            print(f"\nStderr:")
            print(result.stderr[:500])

        return {
            "method": "stdin",
            "success": result.returncode == 0,
            "time": elapsed,
            "output": result.stdout,
            "error": result.stderr
        }

    except subprocess.TimeoutExpired:
        elapsed = time.time() - start
        print(f"\n[ERROR] Timeout after {elapsed:.1f}s")
        return {"method": "stdin", "success": False, "time": elapsed, "error": "timeout"}

    except Exception as e:
        elapsed = time.time() - start
        print(f"\n[ERROR] Error: {e}")
        return {"method": "stdin", "success": False, "time": elapsed, "error": str(e)}


def test_method_2_flag():
    """방법 2: -p 플래그로 프롬프트 전달"""
    print("\n" + "="*60)
    print("[TEST 2] Subprocess with -p flag")
    print("="*60)

    start = time.time()

    try:
        result = subprocess.run(
            ['gemini.cmd', '-p', TEST_PROMPT, '--yolo'],
            capture_output=True,
            text=True,
            timeout=120,
            encoding='utf-8',
            errors='replace'
        )

        elapsed = time.time() - start

        print(f"\n[OK] Success!")
        print(f"Time: {elapsed:.1f}s")
        print(f"Exit code: {result.returncode}")
        print(f"Output length: {len(result.stdout)} chars")
        print(f"\nOutput preview:")
        print(result.stdout[:500])

        if result.stderr:
            print(f"\nStderr:")
            print(result.stderr[:500])

        return {
            "method": "flag",
            "success": result.returncode == 0,
            "time": elapsed,
            "output": result.stdout,
            "error": result.stderr
        }

    except subprocess.TimeoutExpired:
        elapsed = time.time() - start
        print(f"\n[ERROR] Timeout after {elapsed:.1f}s")
        return {"method": "flag", "success": False, "time": elapsed, "error": "timeout"}

    except Exception as e:
        elapsed = time.time() - start
        print(f"\n[ERROR] Error: {e}")
        return {"method": "flag", "success": False, "time": elapsed, "error": str(e)}


def test_method_3_shell():
    """방법 3: Shell 명령으로 직접 실행"""
    print("\n" + "="*60)
    print("[TEST 3] Shell command with echo pipe")
    print("="*60)

    start = time.time()

    try:
        # echo로 프롬프트를 gemini에 파이프
        cmd = f'echo "{TEST_PROMPT}" | gemini.cmd --yolo'

        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=120,
            encoding='utf-8',
            errors='replace'
        )

        elapsed = time.time() - start

        print(f"\n[OK] Success!")
        print(f"Time: {elapsed:.1f}s")
        print(f"Exit code: {result.returncode}")
        print(f"Output length: {len(result.stdout)} chars")
        print(f"\nOutput preview:")
        print(result.stdout[:500])

        if result.stderr:
            print(f"\nStderr:")
            print(result.stderr[:500])

        return {
            "method": "shell",
            "success": result.returncode == 0,
            "time": elapsed,
            "output": result.stdout,
            "error": result.stderr
        }

    except subprocess.TimeoutExpired:
        elapsed = time.time() - start
        print(f"\n[ERROR] Timeout after {elapsed:.1f}s")
        return {"method": "shell", "success": False, "time": elapsed, "error": "timeout"}

    except Exception as e:
        elapsed = time.time() - start
        print(f"\n[ERROR] Error: {e}")
        return {"method": "shell", "success": False, "time": elapsed, "error": str(e)}


def analyze_results(results):
    """결과 분석"""
    print("\n" + "="*60)
    print("ANALYSIS")
    print("="*60)

    print("\n### 방법별 비교:\n")
    print(f"{'Method':<15} {'Success':<10} {'Time':<10} {'Note'}")
    print("-" * 60)

    for r in results:
        success = "[OK]" if r['success'] else "[X]"
        time_str = f"{r['time']:.1f}s" if r['success'] else "N/A"
        note = ""

        if not r['success']:
            if 'quota' in str(r.get('error', '')).lower():
                note = "API Quota Error"
            elif 'timeout' in str(r.get('error', '')).lower():
                note = "Timeout"
            else:
                note = "Error"

        print(f"{r['method']:<15} {success:<10} {time_str:<10} {note}")

    # 성공한 방법들의 평균 시간
    success_results = [r for r in results if r['success']]
    if success_results:
        avg_time = sum(r['time'] for r in success_results) / len(success_results)
        print(f"\n평균 응답 시간 (성공): {avg_time:.1f}s")

    # API Quota 에러 확인
    quota_errors = [r for r in results if 'quota' in str(r.get('error', '')).lower()]
    if quota_errors:
        print(f"\n[WARNING] API Quota 에러 발생: {len(quota_errors)}개 방법")
        print("-> Gemini API 할당량 제한이 모든 방법에 동일하게 적용됨")

    print("\n### 결론:\n")
    if len(success_results) == 0:
        print("[FAIL] 모든 방법이 실패 -> API 할당량 문제")
    elif len(success_results) == len(results):
        print("[SUCCESS] 모든 방법이 성공 -> 방법 간 큰 차이 없음")
        print(f"   가장 빠른 방법: {min(success_results, key=lambda x: x['time'])['method']}")
    else:
        print(f"[WARNING] 일부 방법만 성공 ({len(success_results)}/{len(results)})")
        print(f"   성공한 방법: {', '.join(r['method'] for r in success_results)}")


def save_report(results):
    """결과 저장"""
    report = {
        "timestamp": datetime.now().isoformat(),
        "test_prompt": TEST_PROMPT,
        "results": results
    }

    filename = f"gemini_method_comparison_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n[REPORT] Saved: {filename}")


def main():
    print("\n" + "="*60)
    print("Gemini CLI 실행 방식 비교 연구")
    print("="*60)
    print("\n[주의] API 할당량을 소비합니다!")
    print("각 테스트는 2분 타임아웃으로 실행됩니다.\n")

    # input("계속하려면 Enter를 누르세요...")  # 자동 실행을 위해 비활성화

    results = []

    # 테스트 1: stdin
    results.append(test_method_1_stdin())

    # 대기 (할당량 리셋)
    print("\n[WAIT] Waiting 10s before next test...")
    time.sleep(10)

    # 테스트 2: -p flag
    results.append(test_method_2_flag())

    # 대기
    print("\n[WAIT] Waiting 10s before next test...")
    time.sleep(10)

    # 테스트 3: shell
    results.append(test_method_3_shell())

    # 분석
    analyze_results(results)

    # 저장
    save_report(results)

    print("\n" + "="*60)
    print("연구 완료!")
    print("="*60)


if __name__ == '__main__':
    main()
