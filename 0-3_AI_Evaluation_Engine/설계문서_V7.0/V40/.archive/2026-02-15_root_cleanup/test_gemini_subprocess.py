#!/usr/bin/env python3
"""
Gemini CLI Direct Subprocess 테스트
===================================

MCP 방식을 제거하고 직접 subprocess로 Gemini CLI 호출하는 방식 테스트

성능 목표:
    - 단일 호출: 25-30초
    - 10개 병렬: 30-35초

Usage:
    python test_gemini_subprocess.py
"""

import time
import sys
from pathlib import Path

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR / 'scripts' / 'workflow'))

# subprocess 실행 함수 import
from collect_gemini_subprocess import execute_gemini_cli


def test_simple_prompt():
    """간단한 프롬프트 테스트"""
    print("[TEST] Starting Gemini CLI Direct Subprocess test...")
    print("="*60)

    prompt = "Say 'Hello World' in Korean and explain why Korea is called '한국'."

    print(f"\n[PROMPT] {prompt}\n")

    start_time = time.time()

    # Gemini CLI 실행
    result = execute_gemini_cli(prompt, timeout=120)

    elapsed = time.time() - start_time

    print("="*60)
    print(f"\n[RESULT] Execution complete in {elapsed:.1f} seconds")
    print("="*60)

    if result['success']:
        print(f"\n[OK] Success!")
        print(f"\n[OUTPUT]:\n{result['output'][:500]}...")
        print("\n" + "="*60)
        print(f"\n✅ TEST PASSED")
        print(f"Performance: {elapsed:.1f}s (Target: < 30s)")

        if elapsed < 30:
            print(f"🚀 EXCELLENT - Faster than target!")
        elif elapsed < 35:
            print(f"✅ GOOD - Within acceptable range")
        else:
            print(f"⚠️ WARNING - Slower than expected")

        print("="*60)
        return True

    else:
        print(f"\n[ERROR] Failed: {result['error']}")
        print("\n" + "="*60)
        print(f"\n❌ TEST FAILED")
        print("="*60)
        return False


def test_with_json_response():
    """JSON 응답 테스트"""
    print("\n\n[TEST] Testing JSON response...")
    print("="*60)

    prompt = """
Please provide the following information in JSON format:

{
  "politician": "박주민",
  "party": "더불어민주당",
  "position": "국회의원",
  "district": "서울 은평구갑",
  "key_achievements": ["업적1", "업적2", "업적3"]
}

Return only the JSON, no explanation.
"""

    print(f"\n[PROMPT] (JSON response expected)\n")

    start_time = time.time()

    # Gemini CLI 실행
    result = execute_gemini_cli(prompt, timeout=120)

    elapsed = time.time() - start_time

    print("="*60)
    print(f"\n[RESULT] Execution complete in {elapsed:.1f} seconds")
    print("="*60)

    if result['success']:
        print(f"\n[OK] Success!")
        print(f"\n[OUTPUT]:\n{result['output']}")
        print("\n" + "="*60)
        print(f"\n✅ TEST PASSED")
        print(f"Performance: {elapsed:.1f}s")
        print("="*60)
        return True

    else:
        print(f"\n[ERROR] Failed: {result['error']}")
        print("\n" + "="*60)
        print(f"\n❌ TEST FAILED")
        print("="*60)
        return False


if __name__ == '__main__':
    print("\n" + "="*60)
    print("Gemini CLI Direct Subprocess Test Suite")
    print("="*60)

    # Test 1: 간단한 프롬프트
    print("\n[TEST 1/2] Simple prompt test")
    test1_passed = test_simple_prompt()

    # Test 2: JSON 응답
    print("\n[TEST 2/2] JSON response test")
    test2_passed = test_with_json_response()

    # 최종 결과
    print("\n\n" + "="*60)
    print("FINAL RESULTS")
    print("="*60)
    print(f"Test 1 (Simple): {'✅ PASS' if test1_passed else '❌ FAIL'}")
    print(f"Test 2 (JSON): {'✅ PASS' if test2_passed else '❌ FAIL'}")

    if test1_passed and test2_passed:
        print("\n🎉 ALL TESTS PASSED!")
        print("\n✅ Gemini CLI Direct Subprocess is ready for production")
        print("\nNext steps:")
        print("1. Test parallel collection (10 categories)")
        print("2. Test evaluation with actual politician data")
        print("3. Integrate with workflow orchestrator")
    else:
        print("\n❌ SOME TESTS FAILED")
        print("\nPlease check:")
        print("1. Gemini CLI is installed: npm install -g @google/generative-ai-cli")
        print("2. Gemini CLI is in PATH")
        print("3. Network connection is stable")

    print("="*60)

    sys.exit(0 if (test1_passed and test2_passed) else 1)
