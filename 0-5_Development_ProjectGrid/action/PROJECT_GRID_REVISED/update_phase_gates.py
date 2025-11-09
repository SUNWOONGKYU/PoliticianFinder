#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase Gates 달성 조건 업데이트 스크립트
"""
import sys
import io
import requests
import json

# 윈도우 콘솔 UTF-8 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

phase_gates = {
    1: "Build✅ | Lint✅ | Dev서버 정상구동 | 33페이지 렌더링 | Mock API 23개 응답200 | 작업지시서 검증완료",
    2: "30+테이블 생성 | RLS정책 적용 | Storage Buckets 생성 | Types 파일생성 | 작업지시서 검증완료",
    3: "Build✅ | Real API 23개 응답200 | DB연동 정상 | Auth 로그인성공 | E2E Smoke Test | 작업지시서 검증완료",
    4: "Build✅ | 크롤링성공+시딩 | 헬퍼16개 동작확인 | Admin API 7개 응답200 | Cron 3개 정상구동 | 작업지시서 검증완료",
    5: "Unit Test 80%+ | E2E Test 100% | Integration Test 90%+ | 실패케이스 0개 | 작업지시서 검증완료",
    6: "CI/CD 파이프라인 구축 | Vercel 배포성공 | Sentry 통합완료 | Security 설정완료 | Smoke Test 통과 | 최종검증완료"
}

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

print("Phase Gates 달성 조건 업데이트 중...")
print("=" * 60)

for phase, criteria in phase_gates.items():
    url = f"{SUPABASE_URL}/rest/v1/phase_gates?phase=eq.{phase}"
    data = {"criteria": criteria}

    response = requests.patch(url, headers=headers, json=data)

    if response.status_code == 204:
        print(f"✅ Phase {phase} Gate 업데이트 완료")
    else:
        print(f"❌ Phase {phase} Gate 업데이트 실패: {response.status_code}")
        print(f"   응답: {response.text}")

print("=" * 60)
print("업데이트 완료!")
