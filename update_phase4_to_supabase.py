# -*- coding: utf-8 -*-
"""
Phase 4 모바일 최적화 (고급 기능 및 최적화) 작업을 Supabase Project Grid에 반영
작업일: 2025-11-25
"""

import sys
sys.path.append('0-5_Development_ProjectGrid')

from supabase import create_client, Client
from datetime import datetime
from dotenv import load_dotenv
import os

# .env 파일 로드
load_dotenv('1_Frontend/.env.local')

# Supabase 클라이언트 초기화
url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not url or not key:
    print('Error: Environment variables not found')
    sys.exit(1)

print('Connecting to Supabase...')
supabase: Client = create_client(url, key)

# Phase 4 작업 데이터 (5 tasks)
phase4_tasks = [
    {
        'task_id': 'P4M1H9',
        'task_name': 'H9 - 차트 인터랙션 개선',
        'phase': 4,
        'area': 'M1',
        'status': '완료',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'generated_files': '1_Frontend/src/app/politicians/[id]/page.tsx',
        'build_result': '성공',
        'test_history': '1차: Manual | 2차: code-reviewer(95/100)',
        'validation_result': 'PASS - 기간 선택, 모바일 툴팁, 접근성',
        'dependency_chain': '',
        'remarks': 'Commit: f33b6df | 1M/3M/6M/1Y 기간 선택, aria-label, aria-pressed',
        'generator': 'Claude Code',
        'duration': '35분'
    },
    {
        'task_id': 'P4M1H13',
        'task_name': 'H13 - 탭 네비게이션 (Sticky + Scroll Spy)',
        'phase': 4,
        'area': 'M1',
        'status': '완료',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'generated_files': '1_Frontend/src/app/politicians/[id]/page.tsx',
        'build_result': '성공',
        'test_history': '1차: Manual | 2차: ui-designer(7.9/10)',
        'validation_result': 'PASS - Sticky header, Scroll spy 구현',
        'dependency_chain': '',
        'remarks': 'Commit: 26a3dc3 | 6개 섹션, 아이콘+레이블, 스크롤 위치 기반 활성 탭',
        'generator': 'Claude Code',
        'duration': '40분'
    },
    {
        'task_id': 'P4M2H14',
        'task_name': 'H14 - 이미지 미리보기 썸네일',
        'phase': 4,
        'area': 'M2',
        'status': '완료',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'generated_files': '1_Frontend/src/app/community/page.tsx',
        'build_result': '성공',
        'test_history': '1차: Manual | 2차: code-reviewer(95/100)',
        'validation_result': 'PASS - 썸네일 그리드, +N 오버레이',
        'dependency_chain': '',
        'remarks': 'Commit: 19f34dc | Next.js Image, 최대 4개 표시, 반응형 80px/96px',
        'generator': 'Claude Code',
        'duration': '25분'
    },
    {
        'task_id': 'P4M1M3',
        'task_name': 'M3 - 정치인 상세 페이지 모바일 반응형',
        'phase': 4,
        'area': 'M1',
        'status': '완료',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'generated_files': '1_Frontend/src/app/politicians/[id]/page.tsx',
        'build_result': '성공',
        'test_history': '1차: Manual | 2차: ui-designer(7.9/10)',
        'validation_result': 'PASS - AI 평가 레이아웃, 경력 타임라인, 공약 진행률',
        'dependency_chain': 'P4M1H9, P4M1H13',
        'remarks': 'Commit: 05bdf10 | 모바일 전용 UI 요소, 섹션별 간격 최적화',
        'generator': 'Claude Code',
        'duration': '45분'
    },
    {
        'task_id': 'P4M2MI35',
        'task_name': 'MI3-5 - 모바일 인터랙션 컴포넌트',
        'phase': 4,
        'area': 'M2',
        'status': '완료',
        'progress': 100,
        'assigned_agent': '1차: Claude Code | 2차: Claude Code(검증 수정)',
        'generated_files': '1_Frontend/src/hooks/usePullToRefresh.ts, 1_Frontend/src/hooks/useInfiniteScroll.ts, 1_Frontend/src/components/ui/PullToRefresh.tsx, 1_Frontend/src/components/ui/BottomSheet.tsx',
        'build_result': '1차: 성공 | 2차: 성공',
        'test_history': '1차: Manual | 2차: test-engineer(99.4%), code-reviewer(95/100)',
        'validation_result': 'PASS - Pull-to-refresh, Infinite scroll, Bottom sheet',
        'dependency_chain': '',
        'remarks': 'Commit: 2ae7c17 | 터치 제스처, Intersection Observer, 드래그 닫기',
        'generator': 'Claude Code',
        'duration': '60분'
    }
]

# Phase 4 검증 이슈 수정 작업 (3 fixes)
phase4_fixes = [
    {
        'task_id': 'P4FIX1',
        'task_name': 'FIX - ImageGallery XSS 보호',
        'phase': 4,
        'area': 'FIX',
        'status': '완료',
        'progress': 100,
        'assigned_agent': '2차: Claude Code(검증 수정)',
        'generated_files': '1_Frontend/src/components/ui/ImageGallery.tsx',
        'build_result': '성공',
        'test_history': '2차: test-engineer(82/82 통과)',
        'validation_result': 'PASS - XSS 방지 완료',
        'dependency_chain': 'P3M2MI2',
        'remarks': 'Commit: 118b9d1 | isValidImageUrl() 추가, 허용 프로토콜 필터링',
        'generator': 'Claude Code',
        'duration': '15분'
    },
    {
        'task_id': 'P4FIX2',
        'task_name': 'FIX - 모달 Focus Trap 개선',
        'phase': 4,
        'area': 'FIX',
        'status': '완료',
        'progress': 100,
        'assigned_agent': '2차: Claude Code(검증 수정)',
        'generated_files': '1_Frontend/src/components/ui/ImageGallery.tsx',
        'build_result': '성공',
        'test_history': '2차: code-reviewer(95/100)',
        'validation_result': 'PASS - WCAG 접근성 개선',
        'dependency_chain': 'P3M2MI2',
        'remarks': 'Commit: 118b9d1 | Tab/Shift+Tab 순환, 자동 포커스, ARIA 속성',
        'generator': 'Claude Code',
        'duration': '20분'
    },
    {
        'task_id': 'P4FIX3',
        'task_name': 'FIX - Button 테스트 색상 클래스 수정',
        'phase': 4,
        'area': 'FIX',
        'status': '완료',
        'progress': 100,
        'assigned_agent': '2차: Claude Code(검증 수정)',
        'generated_files': '1_Frontend/src/components/ui/__tests__/Button.test.tsx',
        'build_result': '성공',
        'test_history': '2차: test-engineer(85/85 통과)',
        'validation_result': 'PASS - 테스트 100% 통과',
        'dependency_chain': 'P3M1H7',
        'remarks': 'Commit: 118b9d1 | text-primary-600 → text-primary-700',
        'generator': 'Claude Code',
        'duration': '5분'
    }
]

# 모든 작업 합치기
all_tasks = phase4_tasks + phase4_fixes

# 각 task를 Supabase에 upsert
success_count = 0
error_count = 0

print(f'\nUpdating {len(all_tasks)} Phase 4 tasks to Supabase...\n')

for task in all_tasks:
    try:
        result = supabase.table('project_grid_tasks_revised').upsert(task, on_conflict='task_id').execute()
        print(f'OK: {task["task_id"]} - {task["task_name"]}')
        success_count += 1
    except Exception as e:
        print(f'ERROR: {task["task_id"]} - {str(e)}')
        error_count += 1

print(f'\n=== Summary ===')
print(f'Total tasks: {len(all_tasks)}')
print(f'  Phase 4 Main Tasks: {len(phase4_tasks)} tasks')
print(f'  Phase 4 Fixes: {len(phase4_fixes)} tasks')
print(f'Success: {success_count}')
print(f'Failed: {error_count}')
print('\nPhase 4 mobile optimization updated to Supabase!')

# Phase 4 완료 요약
print('\n=== Phase 4 완료 요약 ===')
print('H9  - 차트 인터랙션 개선 (기간 선택, 툴팁, 접근성)')
print('H13 - 탭 네비게이션 (Sticky header, Scroll spy)')
print('H14 - 이미지 썸네일 (Next.js Image, +N 오버레이)')
print('M3  - 정치인 상세 모바일 반응형')
print('MI3-5 - 모바일 인터랙션 (Pull-to-refresh, Infinite scroll, Bottom sheet)')
print('')
print('검증 이슈 수정:')
print('FIX1 - XSS 보호 (isValidImageUrl)')
print('FIX2 - Focus Trap 개선 (Tab 순환, ARIA)')
print('FIX3 - Button 테스트 수정 (색상 클래스)')
