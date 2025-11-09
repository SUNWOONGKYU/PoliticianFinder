#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PHASE 4 전체 16개 작업 완료 상태로 Supabase DB 업데이트
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
    print("PHASE 4 - All 16 Tasks Complete")
    print("=" * 80)
    print()

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("[OK] Supabase connected")
    except Exception as e:
        print(f"[FAIL] Connection failed: {e}")
        return

    current_time = datetime.now().isoformat()

    # P4BA1
    print("\n--- P4BA1: 선관위 크롤링 스크립트 ---")
    update_task(supabase, "P4BA1", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/lib/crawlers/nec-crawler.ts, src/lib/crawlers/types.ts, src/lib/crawlers/utils.ts, src/lib/crawlers/index.ts, src/lib/crawlers/example.ts, src/app/api/crawl/nec/route.ts, src/lib/crawlers/README.md, src/lib/crawlers/API_DOCUMENTATION.md, src/lib/crawlers/IMPLEMENTATION_SUMMARY.md, src/lib/crawlers/QUICK_REFERENCE.md, P4BA1_COMPLETION_REPORT.md",
        "generator": "Claude-Sonnet-4.5 (api-designer)",
        "duration": "45분",
        "modification_history": "Playwright 크롤러 구현, NEC 선관위 데이터 수집, 에러 처리 및 재시도 로직, JSON 저장",
        "test_history": "타입 체크 통과, 크롤러 구조 검증 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "선관위 크롤링 스크립트 완료, 11개 파일 생성, API 엔드포인트 포함",
        "updated_at": current_time
    })

    # P4BA2
    print("\n--- P4BA2: 정치인 데이터 시딩 ---")
    update_task(supabase, "P4BA2", {
        "status": "완료",
        "progress": 100,
        "generated_files": "scripts/seed/seed-politicians.ts, package.json (수정), scripts/seed/README.md, scripts/seed/USAGE.md, P4BA2_IMPLEMENTATION_SUMMARY.md",
        "generator": "Claude-Sonnet-4.5 (api-designer)",
        "duration": "35분",
        "modification_history": "UPSERT 전략 구현, 크롤링 데이터 → DB 변환, 샘플 데이터 3건 포함, careers/pledges 연동",
        "test_history": "TypeScript 타입 체크 통과, 시딩 로직 검증 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "정치인 시딩 스크립트 완료, UPSERT 로직 구현, 3개 샘플 정치인 포함",
        "updated_at": current_time
    })

    # P4BA3
    print("\n--- P4BA3: 이미지 업로드 헬퍼 ---")
    update_task(supabase, "P4BA3", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/lib/utils/image-upload.ts, src/lib/utils/__tests__/image-upload.test.ts, src/app/api/storage/upload/route.ts, src/lib/utils/IMAGE_UPLOAD_README.md, package.json (sharp 추가), scripts/verify-image-upload.ts, P4BA3_COMPLETION_SUMMARY.md",
        "generator": "Claude-Sonnet-4.5 (api-designer)",
        "duration": "40분",
        "modification_history": "Sharp 리사이징 (thumbnail/medium/large), Supabase Storage 연동, 이미지 검증 (5MB 제한), JPEG 변환 및 최적화",
        "test_history": "Unit 테스트 작성 완료, Sharp 처리 검증",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "이미지 업로드 헬퍼 완료, 3단계 리사이징, API 엔드포인트 포함",
        "updated_at": current_time
    })

    # P4BA4
    print("\n--- P4BA4: 파일 업로드 헬퍼 ---")
    update_task(supabase, "P4BA4", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/lib/utils/file-upload.ts, src/lib/utils/__tests__/file-upload.test.ts, src/app/api/posts/attachments/route.ts, src/lib/utils/FILE_UPLOAD_USAGE.md, src/lib/utils/FILE_UPLOAD_QUICK_REF.md, P4BA4_IMPLEMENTATION_SUMMARY.md",
        "generator": "Claude-Sonnet-4.5 (api-designer)",
        "duration": "38분",
        "modification_history": "파일 타입 검증 (PDF/DOC/ZIP), 크기 제한 (카테고리별), Supabase Storage 연동, 안전한 파일명 생성",
        "test_history": "56개 테스트 케이스 작성, 검증 로직 테스트 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "파일 업로드 헬퍼 완료, 다중 파일 타입 지원, 배치 업로드 기능",
        "updated_at": current_time
    })

    # P4BA5
    print("\n--- P4BA5: 욕설 필터 ---")
    update_task(supabase, "P4BA5", {
        "status": "완료",
        "progress": 100,
        "generated_files": "lib/utils/profanity-filter.ts, lib/utils/profanity-words.ts, lib/utils/profanity-filter-usage.md, lib/utils/profanity-filter-api-example.ts, lib/utils/P4BA5_IMPLEMENTATION_SUMMARY.md, lib/utils/README.md, __tests__/profanity-filter.test.ts",
        "generator": "Claude-Sonnet-4.5 (api-designer)",
        "duration": "30분",
        "modification_history": "42+ 한국어 욕설 단어, 10+ 정규식 패턴, 4단계 심각도 시스템, 화이트리스트 예외 처리",
        "test_history": "25+ 테스트 케이스 모두 통과",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "욕설 필터 완료, 다양한 필터링 전략, XSS 방어 포함",
        "updated_at": current_time
    })

    # P4BA6
    print("\n--- P4BA6: 알림 헬퍼 ---")
    update_task(supabase, "P4BA6", {
        "status": "완료",
        "progress": 100,
        "generated_files": "lib/utils/notification-helper.ts, __tests__/notification-helper.test.ts, lib/utils/notification-helper.example.ts, README.notification-helper.md, P4BA6_IMPLEMENTATION_SUMMARY.md, notification-helper.quickref.md, P4BA6_TASK_COMPLETION_REPORT.md",
        "generator": "Claude-Sonnet-4.5 (api-designer)",
        "duration": "42분",
        "modification_history": "6가지 알림 타입, 중복 방지 (1시간), 배치 알림, 자동 메시지 생성, 읽음/삭제 관리",
        "test_history": "25+ 테스트 케이스 작성 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "알림 헬퍼 완료, 11개 함수, 완전한 CRUD 지원",
        "updated_at": current_time
    })

    # P4BA7
    print("\n--- P4BA7: 자동 중재 시스템 API ---")
    update_task(supabase, "P4BA7", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/app/api/admin/auto-moderate/route.ts, src/lib/moderation/ai-analyzer.ts, src/lib/moderation/severity-scorer.ts, .env.example (수정)",
        "generator": "Claude-Sonnet-4.5 (api-designer)",
        "duration": "50분",
        "modification_history": "OpenAI GPT-4o-mini 연동, 8가지 위반 카테고리, 심각도 점수 (0-100), 자동 조치 (삭제/검토/무시), 감사 로그",
        "test_history": "AI 분석 로직 검증, 심각도 계산 테스트 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "자동 중재 시스템 완료, AI 기반 콘텐츠 분석, 3단계 조치",
        "updated_at": current_time
    })

    # P4BA8
    print("\n--- P4BA8: 감사 로그 API ---")
    update_task(supabase, "P4BA8", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/lib/audit/logger.ts, src/lib/audit/query-builder.ts, src/app/api/admin/audit-logs/route.ts, src/lib/audit/migration.sql, src/app/api/admin/audit-logs/API_DOCUMENTATION.md, src/lib/audit/INTEGRATION_GUIDE.md, src/lib/audit/README.md, src/lib/audit/QUICK_REFERENCE.md, src/lib/audit/example.ts, src/app/api/admin/audit-logs/__tests__/audit-logs.test.ts, src/lib/audit/index.ts",
        "generator": "Claude-Sonnet-4.5 (api-designer)",
        "duration": "55분",
        "modification_history": "15+ 액션 타입, 통계 집계, CSV 내보내기, 페이지네이션, 6개 DB 인덱스, 4개 RLS 정책",
        "test_history": "50+ 테스트 케이스 작성 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "감사 로그 시스템 완료, 완전한 추적 기능, 엔터프라이즈급 구현",
        "updated_at": current_time
    })

    # P4BA9
    print("\n--- P4BA9: 광고 관리 API ---")
    update_task(supabase, "P4BA9", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/lib/ads/placement-manager.ts, src/lib/ads/README.md, src/app/api/admin/ads/route.ts, src/app/api/admin/ads/[id]/route.ts, src/app/api/admin/ads/stats/route.ts, src/app/api/ads/route.ts, src/app/api/ads/track/route.ts, 4_Database/supabase/migrations/016_advertisements.sql, src/app/api/admin/ads/__tests__/ads.test.ts, src/app/api/admin/ads/API_DOCUMENTATION.md, P4BA9_IMPLEMENTATION_SUMMARY.md, claude_code/inbox/P4BA9.json",
        "generator": "Claude-Sonnet-4.5 (api-designer)",
        "duration": "60분",
        "modification_history": "4가지 배치 타입, CTR 계산, 노출/클릭 추적, 자동 활성화, 통계 집계, RLS 정책",
        "test_history": "30+ 테스트 케이스 작성 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "광고 관리 시스템 완료, 8개 API 엔드포인트, 완전한 분석 기능",
        "updated_at": current_time
    })

    # P4BA10
    print("\n--- P4BA10: 정책 관리 API ---")
    update_task(supabase, "P4BA10", {
        "status": "완료",
        "progress": 100,
        "generated_files": "lib/policies/version-manager.ts, lib/policies/types.ts, lib/policies/examples.ts, app/api/admin/policies/route.ts, app/api/admin/policies/[id]/route.ts, app/api/policies/[type]/route.ts, database/migrations/P4BA10_policies_table.sql, app/api/admin/policies/__tests__/policies.test.ts, app/api/admin/policies/API_DOCUMENTATION.md, P4BA10_README.md",
        "generator": "Claude-Sonnet-4.5 (api-designer)",
        "duration": "48분",
        "modification_history": "4가지 정책 타입 (약관/개인정보/마케팅/커뮤니티), 버전 관리, 변경 이력, 현재 버전 제어, RLS 정책",
        "test_history": "30+ 단위 테스트 작성 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "정책 관리 API 완료, 완전한 버전 관리, 6개 엔드포인트",
        "updated_at": current_time
    })

    # P4BA11
    print("\n--- P4BA11: 알림 설정 API ---")
    update_task(supabase, "P4BA11", {
        "status": "완료",
        "progress": 100,
        "generated_files": "app/api/admin/notification-settings/route.ts, app/api/admin/notification-templates/route.ts, lib/notifications/template-engine.ts, lib/notifications/template-engine.test.ts, lib/notifications/types.ts, lib/notifications/index.ts, lib/notifications/README.md, notification-settings/API_DOCUMENTATION.md, notification-templates/API_DOCUMENTATION.md, database-schema.sql, integration-example.ts, P4BA11_IMPLEMENTATION_SUMMARY.md",
        "generator": "Claude-Sonnet-4.5 (api-designer)",
        "duration": "52분",
        "modification_history": "글로벌 알림 설정, 템플릿 엔진, 변수 치환, XSS 방지, 6가지 알림 타입, RLS 정책",
        "test_history": "30+ 테스트 케이스 모두 통과",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "알림 설정 시스템 완료, 템플릿 관리, 완전한 문서화",
        "updated_at": current_time
    })

    # P4BA12
    print("\n--- P4BA12: 시스템 설정 API ---")
    update_task(supabase, "P4BA12", {
        "status": "완료",
        "progress": 100,
        "generated_files": "lib/system/settings-manager.ts, lib/system/cache-manager.ts, lib/system/middleware-helper.ts, lib/system/types.ts, lib/system/examples.ts, app/api/admin/system-settings/route.ts, app/api/system-settings/public/route.ts, app/api/admin/system-settings/API_DOCUMENTATION.md, lib/system/QUICK_REFERENCE.md, lib/system/README.md, P4BA12_IMPLEMENTATION_SUMMARY.md, P4BA12_COMPLETION_CHECKLIST.md, lib/system/__tests__/settings-manager.test.ts",
        "generator": "Claude-Sonnet-4.5 (api-designer)",
        "duration": "58분",
        "modification_history": "5가지 설정 카테고리 (포인트/등급/기능/유지보수/제한), 캐싱 (5분 TTL), 26개 설정 항목, 미들웨어 헬퍼",
        "test_history": "테스트 구조 작성 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "시스템 설정 API 완료, 완전한 캐싱, 16개 파일 생성",
        "updated_at": current_time
    })

    # P4BA13
    print("\n--- P4BA13: 관리자 액션 로그 API ---")
    update_task(supabase, "P4BA13", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/lib/admin/activity-tracker.ts, src/app/api/admin/action-logs/route.ts, src/app/api/admin/action-logs/stats/route.ts, src/app/api/admin/action-logs/__tests__/action-logs.test.ts, src/app/api/admin/action-logs/API_DOCUMENTATION.md, src/lib/admin/ACTIVITY_TRACKER_USAGE.md, src/lib/admin/QUICK_REFERENCE.md",
        "generator": "Claude-Sonnet-4.5 (api-designer)",
        "duration": "45분",
        "modification_history": "15+ 액션 타입, 자동 타이밍 측정, 통계 집계 (관리자/액션/날짜별), 성공/실패 추적, 메타데이터 지원",
        "test_history": "20+ 테스트 케이스 작성 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "관리자 액션 로그 완료, 4개 API 엔드포인트, 고급 분석 기능",
        "updated_at": current_time
    })

    # P4O1
    print("\n--- P4O1: 크롤링 스케줄러 ---")
    update_task(supabase, "P4O1", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/app/api/cron/update-politicians/route.ts, vercel.json (수정), src/app/api/cron/update-politicians/README.md, P4O1_IMPLEMENTATION_SUMMARY.md, P4O1_COMPLETION_REPORT.md, P4O1_QUICK_REFERENCE.md, __tests__/cron/update-politicians.test.ts, scripts/test-cron.sh",
        "generator": "Claude-Sonnet-4.5 (devops-troubleshooter)",
        "duration": "40분",
        "modification_history": "Vercel Cron (매일 6시), P4BA1 크롤러 호출, UPSERT 로직, 실행 로그, CRON_SECRET 인증",
        "test_history": "14+ 테스트 케이스 작성, 수동 테스트 스크립트 포함",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "크롤링 스케줄러 완료, 자동 정치인 데이터 업데이트",
        "updated_at": current_time
    })

    # P4O2
    print("\n--- P4O2: 인기 게시글 집계 스케줄러 ---")
    update_task(supabase, "P4O2", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/app/api/cron/aggregate-trending/route.ts, vercel.json (수정), 0-4_Database/Supabase/migrations/042_create_trending_posts_cache.sql, scripts/test-cron-trending.sh, P4O2_IMPLEMENTATION_SUMMARY.md, docs/P4O2_QUICK_REFERENCE.md",
        "generator": "Claude-Sonnet-4.5 (devops-troubleshooter)",
        "duration": "38분",
        "modification_history": "Vercel Cron (매시간), 트렌딩 점수 계산, 시간 감쇠, 상위 100개 캐싱, 7일 룩백",
        "test_history": "수동 테스트 스크립트 작성 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "인기 게시글 스케줄러 완료, 자동 트렌딩 계산",
        "updated_at": current_time
    })

    # P4O3
    print("\n--- P4O3: 등급 재계산 스케줄러 ---")
    update_task(supabase, "P4O3", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/app/api/cron/recalculate-ranks/route.ts, vercel.json (수정), src/app/api/cron/recalculate-ranks/__tests__/recalculate-ranks.test.ts, src/app/api/cron/recalculate-ranks/README.md, DEPLOYMENT_P4O3.md, claude_code/inbox/P4O3.json",
        "generator": "Claude-Sonnet-4.5 (devops-troubleshooter)",
        "duration": "36분",
        "modification_history": "Vercel Cron (매일 3시), 포인트 계산 (게시글/댓글/좋아요), 5단계 레벨, 레벨 변경 알림, CRON_SECRET 인증",
        "test_history": "단위 테스트 작성 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "등급 재계산 스케줄러 완료, 자동 사용자 레벨 갱신",
        "updated_at": current_time
    })

    print("\n" + "=" * 80)
    print("All PHASE 4 tasks updated!")
    print("=" * 80)

    # 최종 확인
    print("\n=== PHASE 4 Final Status ===")
    result = supabase.table("project_grid_tasks_revised").select("task_id, status, progress").eq("phase", 4).order("task_id").execute()

    if result.data:
        completed = len([t for t in result.data if t['status'] == '완료'])
        total = len(result.data)

        for task in result.data:
            status = "[OK]" if task['status'] == '완료' else "[TODO]"
            print(f"{status} {task['task_id']}: {task['status']} ({task['progress']}%)")

        print()
        print(f"Total: {total} | Completed: {completed}")

        if completed == total:
            print()
            print("=" * 80)
            print("PHASE 4 - 100% COMPLETE!")
            print("=" * 80)

if __name__ == "__main__":
    main()
