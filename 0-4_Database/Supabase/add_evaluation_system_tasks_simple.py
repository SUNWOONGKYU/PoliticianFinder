#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
평가 시스템 작업 추가 스크립트 (간소화 버전)
PHASE 3: P3BA11, P3BA12
PHASE 4: P4BA14~P4BA19
"""
import sys
import os
from supabase import create_client
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

def insert_task(supabase, task_data):
    """작업 삽입"""
    try:
        result = supabase.table("project_grid_tasks_revised").insert(task_data).execute()
        if result.data:
            print(f"[OK] {task_data['task_id']} inserted")
            return True
        else:
            print(f"[WARN] {task_data['task_id']} insertion failed")
            return False
    except Exception as e:
        print(f"[FAIL] {task_data['task_id']} error: {e}")
        return False

def main():
    print("=" * 80)
    print("평가 시스템 작업 추가 (간소화 버전)")
    print("PHASE 3: P3BA11, P3BA12")
    print("PHASE 4: P4BA14~P4BA19")
    print("=" * 80)
    print()

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("[OK] Supabase connected")
    except Exception as e:
        print(f"[FAIL] Connection failed: {e}")
        return

    current_time = datetime.now().isoformat()

    # PHASE 3 작업들
    print("\n--- PHASE 3 추가 작업 ---")

    # P3BA11
    print("\n[P3BA11] AI 평가 조회 API (Mock → Real)")
    insert_task(supabase, {
        "task_id": "P3BA11",
        "task_name": "AI 평가 조회 API (Mock → Real)",
        "phase": 3,
        "area": "BA",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "generator": "Not started",
        "duration": "미정",
        "modification_history": "Mock API를 Supabase 연동 Real API로 전환하여 실제 AI 평가 데이터 조회 기능 구현",
        "test_history": "미실행",
        "build_result": "대기",
        "dependency_propagation": "대기",
        "validation_result": "대기",
        "generated_files": "예상: src/app/api/politicians/[id]/evaluation/route.ts, src/app/api/evaluations/[evaluationId]/route.ts",
        "created_at": current_time,
        "updated_at": current_time
    })

    # P3BA12
    print("\n[P3BA12] AI 평가 생성 API (Mock → Real)")
    insert_task(supabase, {
        "task_id": "P3BA12",
        "task_name": "AI 평가 생성 API (Mock → Real)",
        "phase": 3,
        "area": "BA",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "generator": "Not started",
        "duration": "미정",
        "modification_history": "Mock API를 Supabase 연동 Real API로 전환하여 AI 평가 데이터 생성/업데이트 기능 구현",
        "test_history": "미실행",
        "build_result": "대기",
        "dependency_propagation": "대기",
        "validation_result": "대기",
        "generated_files": "예상: src/app/api/evaluations/generate/route.ts, src/app/api/evaluations/[evaluationId]/update/route.ts",
        "created_at": current_time,
        "updated_at": current_time
    })

    # PHASE 4 작업들
    print("\n--- PHASE 4 추가 작업 ---")

    # P4BA14
    print("\n[P4BA14] AI 평가 생성 엔진 (OpenAI API 통합)")
    insert_task(supabase, {
        "task_id": "P4BA14",
        "task_name": "AI 평가 생성 엔진 (OpenAI API 통합)",
        "phase": 4,
        "area": "BA",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "generator": "Not started",
        "duration": "미정",
        "modification_history": "OpenAI API 통합으로 실제 AI 평가 생성. 5개 AI 모델 병렬 호출",
        "test_history": "미실행",
        "build_result": "대기",
        "dependency_propagation": "대기",
        "validation_result": "대기",
        "generated_files": "예상: src/lib/ai/evaluation-engine.ts, src/lib/ai/clients/openai-client.ts",
        "created_at": current_time,
        "updated_at": current_time
    })

    # P4BA15
    print("\n[P4BA15] PDF 리포트 생성 API (Puppeteer)")
    insert_task(supabase, {
        "task_id": "P4BA15",
        "task_name": "PDF 리포트 생성 API (Puppeteer)",
        "phase": 4,
        "area": "BA",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "generator": "Not started",
        "duration": "미정",
        "modification_history": "Puppeteer로 30,000자 AI 평가 리포트를 PDF 변환, Supabase Storage 업로드",
        "test_history": "미실행",
        "build_result": "대기",
        "dependency_propagation": "대기",
        "validation_result": "대기",
        "generated_files": "예상: src/lib/pdf/report-generator.ts, src/app/api/reports/generate/route.ts",
        "created_at": current_time,
        "updated_at": current_time
    })

    # P4BA16
    print("\n[P4BA16] 리포트 다운로드 API")
    insert_task(supabase, {
        "task_id": "P4BA16",
        "task_name": "리포트 다운로드 API",
        "phase": 4,
        "area": "BA",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "generator": "Not started",
        "duration": "미정",
        "modification_history": "유료 구매자 PDF 다운로드 API. 사용자 인증, 결제 검증, 서명된 URL 생성",
        "test_history": "미실행",
        "build_result": "대기",
        "dependency_propagation": "대기",
        "validation_result": "대기",
        "generated_files": "예상: src/app/api/reports/download/[evaluationId]/route.ts, src/lib/auth/payment-verification.ts",
        "created_at": current_time,
        "updated_at": current_time
    })

    # P4BA17
    print("\n[P4BA17] 결제 시스템 통합 (토스페이먼츠)")
    insert_task(supabase, {
        "task_id": "P4BA17",
        "task_name": "결제 시스템 통합 (토스페이먼츠)",
        "phase": 4,
        "area": "BA",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "generator": "Not started",
        "duration": "미정",
        "modification_history": "토스페이먼츠 API 통합으로 AI 평가 리포트 구매 결제. AI 모델별 ₩500,000",
        "test_history": "미실행",
        "build_result": "대기",
        "dependency_propagation": "대기",
        "validation_result": "대기",
        "generated_files": "예상: src/lib/payment/toss-client.ts, src/app/api/payments/checkout/route.ts",
        "created_at": current_time,
        "updated_at": current_time
    })

    # P4BA18
    print("\n[P4BA18] 정치인 검증 API")
    insert_task(supabase, {
        "task_id": "P4BA18",
        "task_name": "정치인 검증 API",
        "phase": 4,
        "area": "BA",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "generator": "Not started",
        "duration": "미정",
        "modification_history": "정치인 본인 인증 시스템. 공직 이메일 인증, 6자리 코드 발송, Verified 배지",
        "test_history": "미실행",
        "build_result": "대기",
        "dependency_propagation": "대기",
        "validation_result": "대기",
        "generated_files": "예상: src/app/api/politicians/verification/request/route.ts, src/lib/verification/email-sender.ts",
        "created_at": current_time,
        "updated_at": current_time
    })

    # P4BA19
    print("\n[P4BA19] 평가 이력 관리 API")
    insert_task(supabase, {
        "task_id": "P4BA19",
        "task_name": "평가 이력 관리 API",
        "phase": 4,
        "area": "BA",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "generator": "Not started",
        "duration": "미정",
        "modification_history": "시계열 AI 평가 데이터 관리 및 분석. 평가 이력 조회, 점수 변화 추이, 정치인 간 비교",
        "test_history": "미실행",
        "build_result": "대기",
        "dependency_propagation": "대기",
        "validation_result": "대기",
        "generated_files": "예상: src/app/api/evaluations/history/[politicianId]/route.ts, src/app/api/evaluations/trends/route.ts",
        "created_at": current_time,
        "updated_at": current_time
    })

    print("\n" + "=" * 80)
    print("8개 작업 추가 완료!")
    print("=" * 80)

    # 최종 확인
    print("\n=== 추가된 작업 확인 ===")
    result = supabase.table("project_grid_tasks_revised").select("task_id, task_name, phase, status").in_("task_id", ["P3BA11", "P3BA12", "P4BA14", "P4BA15", "P4BA16", "P4BA17", "P4BA18", "P4BA19"]).order("task_id").execute()

    if result.data:
        for task in result.data:
            print(f"[OK] {task['task_id']}: {task['task_name']} (Phase {task['phase']}) - {task['status']}")

        print()
        print(f"Total: {len(result.data)} tasks added")
    else:
        print("[WARN] No tasks found")

    print("\n=== 전체 작업 개수 확인 ===")
    count_result = supabase.table("project_grid_tasks_revised").select("*", count="exact", head=True).execute()
    print(f"Total tasks in DB: {count_result.count}")
    print(f"Expected: 36 + 8 = 44 tasks")

if __name__ == "__main__":
    main()
