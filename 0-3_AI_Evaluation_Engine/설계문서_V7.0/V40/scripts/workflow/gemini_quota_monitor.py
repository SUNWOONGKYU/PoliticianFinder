#!/usr/bin/env python3
"""
Gemini API 할당량 모니터 + 자동 수집 시작
- 15분마다 할당량 체크
- 할당량 복구 감지 시 자동으로 gemini_api_fill.py 실행
- 두 정치인 순차 실행

Usage:
    python gemini_quota_monitor.py
"""

import os
import sys
import time
import subprocess
from pathlib import Path
from datetime import datetime

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf-8', buffering=1)

V40_DIR = Path(__file__).resolve().parent.parent.parent
SCRIPT_DIR = Path(__file__).resolve().parent

from dotenv import load_dotenv
load_dotenv(V40_DIR / '.env', override=True)

import requests

API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
KEYS = [k for k in [os.getenv('GEMINI_API_KEY', ''), os.getenv('GEMINI_API_KEY_2', '')] if k]

POLITICIANS = [
    {"name": "명재성", "id": "1e43d6f1"},
    {"name": "이재준", "id": "c45565d7"},
]

CHECK_INTERVAL = 900  # 15분


def test_quota(api_key: str) -> bool:
    """API 키의 할당량 가용 여부 테스트"""
    url = f'{API_BASE}/gemini-2.5-flash:generateContent?key={api_key}'
    payload = {'contents': [{'parts': [{'text': 'Say OK'}]}]}
    try:
        r = requests.post(url, json=payload, timeout=30)
        return r.status_code == 200
    except:
        return False


def run_fill(politician_name: str, target: int = 60, max_rounds: int = 20):
    """gemini_api_fill.py 실행"""
    fill_script = SCRIPT_DIR / 'gemini_api_fill.py'
    cmd = [sys.executable, str(fill_script),
           '--politician', politician_name,
           '--target', str(target),
           '--max-rounds', str(max_rounds)]

    print(f"\n[FILL] Starting: {politician_name}")
    result = subprocess.run(cmd, cwd=str(SCRIPT_DIR), timeout=7200)
    print(f"[FILL] Done: {politician_name} (exit code: {result.returncode})")
    return result.returncode == 0


def main():
    print(f"{'='*60}")
    print(f"Gemini API 할당량 모니터 시작")
    print(f"체크 간격: {CHECK_INTERVAL}초 ({CHECK_INTERVAL//60}분)")
    print(f"API 키: {len(KEYS)}개")
    print(f"대상: {', '.join(p['name'] for p in POLITICIANS)}")
    print(f"{'='*60}")

    while True:
        now = datetime.now().strftime('%H:%M:%S')
        any_available = False

        for i, key in enumerate(KEYS):
            available = test_quota(key)
            status = "OK (사용 가능)" if available else "429 (소진)"
            print(f"[{now}] Key #{i+1}: {status}")
            if available:
                any_available = True

        if any_available:
            print(f"\n[{now}] 할당량 복구 감지! 수집을 시작합니다...")

            for pol in POLITICIANS:
                success = run_fill(pol['name'], target=60, max_rounds=20)
                if not success:
                    print(f"[WARN] {pol['name']} 수집 중 문제 발생")

            print(f"\n[DONE] 모든 정치인 수집 완료!")
            print(f"다음 단계: Phase 2 검증을 실행하세요.")
            break
        else:
            print(f"[{now}] 모든 키 소진. {CHECK_INTERVAL//60}분 후 재확인...")
            time.sleep(CHECK_INTERVAL)


if __name__ == '__main__':
    main()
