#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
평가 시스템 작업 추가 스크립트
PHASE 3: P3BA11, P3BA12 (기본 Real API 전환)
PHASE 4: P4BA14~P4BA19 (고급 기능)
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
    print("평가 시스템 작업 추가")
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
        "work_type": "AI-Only",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "dependencies": "P2D1, P3BA1, P3BA2",
        "expected_deliverables": "src/app/api/politicians/[id]/evaluation/route.ts (Mock → Real), src/app/api/evaluations/[evaluationId]/route.ts, src/app/api/evaluations/history/route.ts",
        "tools": "Read, Edit, Write, Grep, Glob, Bash",
        "tech_stack": "TypeScript, Next.js API Routes, Supabase, Zod",
        "skills": "api-builder, api-test",
        "instructions": "Mock API를 Supabase 연동 Real API로 전환하여 실제 AI 평가 데이터 조회 기능 구현. 5개 AI 모델 평가, 10개 평가 기준, 시계열 데이터 조회.",
        "validation_result": "AI 평가 조회 API 실제 Supabase 데이터 반환, Mock 코드 제거, 5개 AI 모델 평가 데이터 정상 조회, RLS 정책 적용",
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
        "work_type": "AI-Only",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "dependencies": "P2D1, P3BA1, P3BA2, P3BA11",
        "expected_deliverables": "src/app/api/evaluations/generate/route.ts, src/app/api/evaluations/[evaluationId]/update/route.ts, src/app/api/evaluations/batch/route.ts",
        "tools": "Read, Edit, Write, Grep, Glob, Bash",
        "tech_stack": "TypeScript, Next.js API Routes, Supabase, Zod",
        "skills": "api-builder, api-test",
        "instructions": "Mock API를 Supabase 연동 Real API로 전환하여 AI 평가 데이터 생성/업데이트 기능 구현. Upsert, 관리자 권한 확인, 일괄 평가 생성. (실제 AI 연동은 P4BA14에서)",
        "validation_result": "AI 평가 생성 API 실제 Supabase 저장, Upsert 기능 정상 작동, 관리자 권한 확인, 트랜잭션 에러 처리",
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
        "work_type": "AI-Only",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "dependencies": "P3BA11, P3BA12",
        "expected_deliverables": "src/lib/ai/evaluation-engine.ts, src/lib/ai/prompts/evaluation-prompt.ts, src/lib/ai/clients/openai-client.ts, src/lib/ai/clients/anthropic-client.ts, src/lib/ai/clients/google-client.ts, src/lib/ai/clients/xai-client.ts, src/lib/ai/clients/perplexity-client.ts, src/app/api/evaluations/generate-ai/route.ts",
        "tools": "Read, Edit, Write, Grep, Glob, Bash",
        "tech_stack": "TypeScript, Next.js, OpenAI API, Anthropic API, Google AI API, Zod",
        "skills": "api-builder, api-test",
        "instructions": "OpenAI API 통합으로 실제 AI 평가 생성. 5개 AI 모델(Claude, ChatGPT, Gemini, Grok, Perplexity) 병렬 호출, 10개 평가 기준, 30,000자 평가 리포트, 에러 처리 및 재시도.",
        "validation_result": "5개 AI 클라이언트 구현, 평가 프롬프트 설계, AI 평가 생성 엔진, 병렬 호출 정상 작동, 실제 AI 호출 테스트 성공",
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
        "work_type": "AI-Only",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "dependencies": "P3BA11, P4BA14",
        "expected_deliverables": "src/lib/pdf/report-generator.ts, src/lib/pdf/templates/evaluation-report.tsx, src/app/api/reports/generate/route.ts, src/lib/storage/upload.ts",
        "tools": "Read, Edit, Write, Grep, Glob, Bash",
        "tech_stack": "TypeScript, Next.js, Puppeteer, React, Tailwind CSS, Supabase Storage",
        "skills": "api-builder, api-test",
        "instructions": "Puppeteer로 30,000자 AI 평가 리포트를 PDF 변환, Supabase Storage 업로드. A4 사이즈, 한글 폰트, 표지/차트/상세 평가, 공개 URL 생성.",
        "validation_result": "PDF 리포트 템플릿 구현, Puppeteer PDF 생성, 한글 폰트 렌더링, 30,000자 이상 리포트, Supabase Storage 업로드 성공",
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
        "work_type": "AI-Only",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "dependencies": "P3BA1, P4BA15, P4BA17",
        "expected_deliverables": "src/app/api/reports/download/[evaluationId]/route.ts, src/lib/auth/payment-verification.ts, src/lib/storage/signed-url.ts, 0-4_Database/Supabase/migrations/015_create_download_history.sql",
        "tools": "Read, Edit, Write, Grep, Glob, Bash",
        "tech_stack": "TypeScript, Next.js, Supabase, Zod",
        "skills": "api-builder, api-test",
        "instructions": "유료 구매자 PDF 다운로드 API. 사용자 인증, 결제 검증, 서명된 URL 생성(1시간), 다운로드 이력 기록, 다운로드 횟수 제한(10회).",
        "validation_result": "사용자 인증, 결제 검증, 서명된 URL 생성, 다운로드 이력 기록, 다운로드 횟수 제한, download_history 테이블 생성",
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
        "work_type": "AI-Only",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "dependencies": "P3BA1, P3BA2, P3BA11",
        "expected_deliverables": "src/lib/payment/toss-client.ts, src/app/api/payments/checkout/route.ts, src/app/api/payments/confirm/route.ts, src/app/api/payments/webhook/route.ts, src/app/api/payments/history/route.ts",
        "tools": "Read, Edit, Write, Grep, Glob, Bash",
        "tech_stack": "TypeScript, Next.js, Supabase, Zod, 토스페이먼츠 API",
        "skills": "api-builder, api-test",
        "instructions": "토스페이먼츠 API 통합으로 AI 평가 리포트 구매 결제. AI 모델별 ₩500,000, 전체 ₩2,500,000, 결제 요청/승인/웹훅/이력 조회.",
        "validation_result": "토스페이먼츠 SDK 통합, 결제 요청/승인/웹훅/이력 API, 금액 계산, 트랜잭션 처리, 실제 결제 테스트(테스트 모드)",
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
        "work_type": "AI-Only",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "dependencies": "P3BA1, P3BA2",
        "expected_deliverables": "src/app/api/politicians/verification/request/route.ts, src/app/api/politicians/verification/verify/route.ts, src/app/api/politicians/verification/status/[politicianId]/route.ts, src/lib/verification/email-sender.ts, 0-4_Database/Supabase/migrations/016_create_verification_requests.sql",
        "tools": "Read, Edit, Write, Grep, Glob, Bash",
        "tech_stack": "TypeScript, Next.js, Supabase, Zod, Nodemailer",
        "skills": "api-builder, api-test",
        "instructions": "정치인 본인 인증 시스템. 공직 이메일(*.go.kr) 인증, 6자리 코드 발송(15분 유효), Verified 배지 부여, 관리자 수동 검증.",
        "validation_result": "검증 요청 API, 공직 이메일 검증, 인증 코드 생성/발송, 검증 승인 API, verification_requests 테이블, politicians.verified 컬럼",
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
        "work_type": "AI-Only",
        "status": "대기",
        "progress": 0,
        "assigned_agent": "backend-developer",
        "dependencies": "P3BA11, P4BA14",
        "expected_deliverables": "src/app/api/evaluations/history/[politicianId]/route.ts, src/app/api/evaluations/trends/route.ts, src/app/api/evaluations/compare/route.ts, src/app/api/evaluations/archive/route.ts, 0-4_Database/Supabase/migrations/017_create_evaluation_snapshots.sql",
        "tools": "Read, Edit, Write, Grep, Glob, Bash",
        "tech_stack": "TypeScript, Next.js, Supabase, Zod",
        "skills": "api-builder, api-test",
        "instructions": "시계열 AI 평가 데이터 관리 및 분석. 평가 이력 조회(날짜/AI 모델별), 점수 변화 추이, 정치인 간 비교(2-5명), 평가 아카이브(월 1회 스냅샷).",
        "validation_result": "평가 이력 조회 API, 점수 변화 추이 API, 정치인 간 비교 API, 평가 아카이브 API, evaluation_snapshots 테이블, 통계 계산 로직",
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

if __name__ == "__main__":
    main()
