#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
평가 시스템 8개 작업 완료 상태로 Supabase DB 업데이트
PHASE 3: P3BA11, P3BA12
PHASE 4: P4BA14, P4BA15, P4BA16, P4BA17, P4BA18, P4BA19
"""
import sys
import os
from supabase import create_client
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

def update_task(supabase, task_id, update_data):
    """특정 task_id 업데이트"""
    try:
        result = supabase.table("project_grid_tasks_revised").update(update_data).eq("task_id", task_id).execute()
        if result.data:
            print(f"[OK] {task_id} updated")
            return True
        else:
            print(f"[WARN] {task_id} not found")
            return False
    except Exception as e:
        print(f"[FAIL] {task_id} error: {e}")
        return False

def main():
    print("=" * 80)
    print("평가 시스템 8개 작업 완료 업데이트")
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
    print("\n--- P3BA11: AI 평가 조회 API ---")
    update_task(supabase, "P3BA11", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/app/api/politicians/[id]/evaluation/route.ts (Modified), src/app/api/evaluations/[evaluationId]/route.ts (New), src/app/api/evaluations/history/route.ts (New), claude_code/inbox/P3BA11.json",
        "generator": "Claude-Sonnet-4.5 (backend-developer)",
        "duration": "45분",
        "modification_history": "Mock → Real Supabase 연동, 5개 AI 모델 평가 조회, 10개 평가 기준, 시계열 데이터, 캐싱 전략(5분)",
        "test_history": "Next.js 빌드 성공, TypeScript 타입 체크 통과",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "3개 API 엔드포인트 생성, Supabase 연동 완료, RLS 정책 적용, 캐싱 구현",
        "updated_at": current_time
    })

    # P3BA12
    print("\n--- P3BA12: AI 평가 생성 API ---")
    update_task(supabase, "P3BA12", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/app/api/evaluations/generate/route.ts (291 lines), src/app/api/evaluations/[evaluationId]/update/route.ts (256 lines), src/app/api/evaluations/batch/route.ts (340 lines), src/app/api/evaluations/__tests__/evaluations-generation.test.ts (251 lines), src/lib/database.types.ts (Modified), P3BA12_IMPLEMENTATION_SUMMARY.md, P3BA12_API_TESTING_GUIDE.md",
        "generator": "Claude-Sonnet-4.5 (backend-developer)",
        "duration": "55분",
        "modification_history": "Mock → Real Supabase 연동, Upsert 로직(중복 방지), 관리자 권한 확인, Mock 데이터 생성(10개 기준), 일괄 평가(Promise.all)",
        "test_history": "TypeScript 타입 체크 통과, Next.js 빌드 성공, 테스트 케이스 251 lines",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "3개 API 생성(generate, update, batch), Upsert 기능, 점수 검증(0-100), 887 lines 코드",
        "updated_at": current_time
    })

    # PHASE 4 작업들
    print("\n--- PHASE 4 추가 작업 ---")

    # P4BA14
    print("\n--- P4BA14: AI 평가 생성 엔진 (OpenAI API 통합) ---")
    update_task(supabase, "P4BA14", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/lib/ai/types.ts, src/lib/ai/evaluation-engine.ts, src/lib/ai/prompts/evaluation-prompt.ts, src/lib/ai/clients/openai-client.ts, src/lib/ai/clients/anthropic-client.ts, src/lib/ai/clients/google-client.ts, src/lib/ai/clients/xai-client.ts, src/lib/ai/clients/perplexity-client.ts, src/lib/ai/index.ts, src/app/api/evaluations/generate-ai/route.ts, src/lib/ai/README.md, .env.ai.example, __tests__/evaluation-engine.test.ts",
        "generator": "Claude-Sonnet-4.5 (backend-developer)",
        "duration": "60분",
        "modification_history": "5개 AI 클라이언트 구현(OpenAI, Anthropic, Google, xAI, Perplexity), 병렬 호출(Promise.allSettled), Mock 데이터 폴백, 재시도 로직(exponential backoff), 10개 평가 기준 프롬프트",
        "test_history": "TypeScript 타입 체크 통과, Next.js 빌드 성공, npm 패키지 설치(openai, @anthropic-ai/sdk, @google/generative-ai)",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "13개 파일 생성(85KB), 5개 AI 클라이언트, 병렬 처리 30-60초, Mock 모드 지원",
        "updated_at": current_time
    })

    # P4BA15
    print("\n--- P4BA15: PDF 리포트 생성 API (Puppeteer) ---")
    update_task(supabase, "P4BA15", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/lib/pdf/types.ts, src/lib/pdf/html-generator.ts, src/lib/pdf/report-generator.ts, src/lib/pdf/templates/evaluation-report.tsx, src/lib/pdf/index.ts, src/lib/pdf/README.md, src/lib/storage/upload.ts, src/lib/storage/index.ts (updated), src/app/api/reports/generate/route.ts, migrations/add_report_url_to_ai_evaluations.sql, src/lib/database.types.ts (updated)",
        "generator": "Claude-Sonnet-4.5 (backend-developer)",
        "duration": "65분",
        "modification_history": "Puppeteer 기반 PDF 생성, 한글 폰트(Noto Sans KR), A4 사이즈, 30,000자 리포트, Supabase Storage 업로드, 브라우저 풀링, 캐싱(7일)",
        "test_history": "TypeScript 타입 체크 통과, Next.js 빌드 성공, Puppeteer 설치 완료(~170MB Chromium)",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "11개 파일 생성, PDF 생성 10-30초, 공개 URL 생성, report_url 업데이트, server-only 모듈",
        "updated_at": current_time
    })

    # P4BA16
    print("\n--- P4BA16: 리포트 다운로드 API ---")
    update_task(supabase, "P4BA16", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/lib/database.types.ts (Modified), src/lib/auth/payment-verification.ts, src/lib/storage/signed-url.ts, src/app/api/reports/download/[evaluationId]/route.ts, 0-4_Database/Supabase/migrations/044_create_download_history.sql, P4BA16_IMPLEMENTATION_SUMMARY.md, src/app/api/reports/download/API_DOCUMENTATION.md, scripts/test-download-api.sh",
        "generator": "Claude-Sonnet-4.5 (backend-developer)",
        "duration": "50분",
        "modification_history": "결제 검증 시스템, 서명된 URL(1시간 유효), 다운로드 횟수 제한(10회), 다운로드 이력 추적, IP/User Agent 기록",
        "test_history": "TypeScript 타입 체크 통과, Next.js 빌드 성공, download_history 테이블 마이그레이션",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "8개 파일 생성, 결제 검증, 다운로드 제한, RLS 정책, 보안 강화",
        "updated_at": current_time
    })

    # P4BA17
    print("\n--- P4BA17: 결제 시스템 통합 (토스페이먼츠) ---")
    update_task(supabase, "P4BA17", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/lib/payment/toss-client.ts, src/app/api/payments/checkout/route.ts, src/app/api/payments/confirm/route.ts, src/app/api/payments/webhook/route.ts, src/app/api/payments/history/route.ts, src/app/api/payments/[id]/cancel/route.ts, src/lib/payment/README.md, .env.local (updated), claude_code/inbox/P4BA17.json",
        "generator": "Claude-Sonnet-4.5 (backend-developer)",
        "duration": "55분",
        "modification_history": "토스페이먼츠 API 통합, AI 모델별 ₩500,000/전체 ₩2,500,000, Mock 모드 지원, 결제 승인/취소/환불, 웹훅 처리",
        "test_history": "TypeScript 타입 체크 통과, Next.js 빌드 성공, Mock 모드 테스트 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "6개 API 엔드포인트, 결제 플로우 완성, 보안 검증, payments 테이블 연동",
        "updated_at": current_time
    })

    # P4BA18
    print("\n--- P4BA18: 정치인 검증 API ---")
    update_task(supabase, "P4BA18", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/app/api/politicians/verification/request/route.ts, src/app/api/politicians/verification/verify/route.ts, src/app/api/politicians/verification/status/[politicianId]/route.ts, src/lib/verification/email-sender.ts, 0-4_Database/Supabase/migrations/043_update_verification_system.sql, src/app/api/politicians/verification/README.md, .env.local.example (updated)",
        "generator": "Claude-Sonnet-4.5 (backend-developer)",
        "duration": "45분",
        "modification_history": "공직 이메일 검증(*.go.kr), 6자리 인증 코드(15분 유효), Verified 배지, Nodemailer 이메일 발송, RLS 정책",
        "test_history": "TypeScript 타입 체크 통과, Next.js 빌드 성공, Nodemailer 설치 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "3개 API 엔드포인트, verification_requests 테이블, politicians.is_verified 컬럼, 보안 강화",
        "updated_at": current_time
    })

    # P4BA19
    print("\n--- P4BA19: 평가 이력 관리 API ---")
    update_task(supabase, "P4BA19", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/app/api/evaluations/history/[politicianId]/route.ts, src/app/api/evaluations/trends/route.ts, src/app/api/evaluations/compare/route.ts, src/app/api/evaluations/archive/route.ts, 0-4_Database/Supabase/migrations/021_create_evaluation_snapshots.sql, P4BA19_IMPLEMENTATION_REPORT.md",
        "generator": "Claude-Sonnet-4.5 (backend-developer)",
        "duration": "50분",
        "modification_history": "시계열 평가 이력, 점수 변화 추이, 정치인 간 비교(2-5명), 월간 스냅샷 아카이브, 캐싱 전략(3-10분)",
        "test_history": "TypeScript 타입 체크 통과, Next.js 빌드 성공, evaluation_snapshots 테이블 마이그레이션",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "4개 API 엔드포인트, 시계열 분석, 레이더 차트 데이터, 통계 계산, RLS 정책",
        "updated_at": current_time
    })

    print("\n" + "=" * 80)
    print("8개 작업 업데이트 완료!")
    print("=" * 80)

    # 최종 확인
    print("\n=== 평가 시스템 작업 상태 확인 ===")
    result = supabase.table("project_grid_tasks_revised").select("task_id, task_name, status, progress").in_("task_id", ["P3BA11", "P3BA12", "P4BA14", "P4BA15", "P4BA16", "P4BA17", "P4BA18", "P4BA19"]).order("task_id").execute()

    if result.data:
        completed = len([t for t in result.data if t['status'] == '완료'])
        total = len(result.data)

        for task in result.data:
            status = "[OK]" if task['status'] == '완료' else "[TODO]"
            print(f"{status} {task['task_id']}: {task['task_name']} - {task['status']} ({task['progress']}%)")

        print()
        print(f"Total: {total} | Completed: {completed}")

        if completed == total:
            print()
            print("=" * 80)
            print("평가 시스템 8개 작업 - 100% COMPLETE!")
            print("=" * 80)

    print("\n=== 전체 프로젝트 현황 ===")
    count_result = supabase.table("project_grid_tasks_revised").select("*", count="exact", head=True).execute()
    completed_result = supabase.table("project_grid_tasks_revised").select("*", count="exact", head=True).eq("status", "완료").execute()

    print(f"Total tasks in DB: {count_result.count}")
    print(f"Completed tasks: {completed_result.count}")
    print(f"Completion rate: {completed_result.count}/{count_result.count} ({int(completed_result.count/count_result.count*100)}%)")

if __name__ == "__main__":
    main()
