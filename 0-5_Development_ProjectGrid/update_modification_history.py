#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 4 검증 중 수정된 파일의 modification_history 업데이트 스크립트
"""

import requests
import json
import sys
from datetime import datetime

# Windows 콘솔 UTF-8 설정
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

def update_modification_history(task_id, new_history):
    """
    Task의 modification_history에 새 기록 추가
    """
    # 1. 현재 modification_history 조회
    url = f"{SUPABASE_URL}/rest/v1/project_grid_tasks_revised"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.get(
        f"{url}?task_id=eq.{task_id}&select=modification_history",
        headers=headers
    )

    if response.status_code != 200:
        print(f"❌ {task_id} 조회 실패: {response.text}")
        return False

    data = response.json()
    if not data:
        print(f"❌ {task_id} 찾을 수 없음")
        return False

    current_history = data[0].get('modification_history', '') or ''

    # 2. 새 기록 추가
    if current_history and current_history.strip():
        updated_history = f"{current_history}\n{new_history}"
    else:
        updated_history = new_history

    # 3. 업데이트
    response = requests.patch(
        f"{url}?task_id=eq.{task_id}",
        headers=headers,
        json={"modification_history": updated_history}
    )

    if response.status_code in [200, 204]:
        print(f"✅ {task_id} modification_history 업데이트 완료")
        return True
    else:
        print(f"❌ {task_id} 업데이트 실패: {response.text}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Phase 4 검증 중 수정 내역 기록")
    print("=" * 60)

    # P4BA8 - action-logs/stats/route.ts 수정
    p4ba8_history = "[ERROR] TypeScript 타입 오류 (localeCompare) → [FIX] Claude Code 직접 수정 (a.date.localeCompare(b.date)) → [PASS] 빌드 성공 [2025-11-09 검증 중]"

    # P4O1 - cron/update-politicians/route.ts 수정 (3곳)
    p4o1_history = """[ERROR] TypeScript 타입 오류 3건 → [FIX] Claude Code 직접 수정 → [PASS] 빌드 성공 [2025-11-09 검증 중]
  - Line 6: CareerItem 타입 import 추가
  - Line 37: career?: CareerItem[] 타입 수정
  - Line 101-102: metadata.sourceUrl, metadata.crawledAt 구조 수정"""

    # 업데이트 실행
    print("\n1. P4BA8 (감사 로그 관리 API) 수정 내역 추가...")
    update_modification_history("P4BA8", p4ba8_history)

    print("\n2. P4O1 (크롤링 스케줄러) 수정 내역 추가...")
    update_modification_history("P4O1", p4o1_history)

    print("\n" + "=" * 60)
    print("✅ modification_history 업데이트 완료")
    print("=" * 60)
    print("\n참고: tsconfig.json 수정은 전역 설정으로 별도 Task 없음")
