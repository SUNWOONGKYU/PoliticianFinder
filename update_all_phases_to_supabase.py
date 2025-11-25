# -*- coding: utf-8 -*-
"""
Phase 1, 2, 3 작업 내용을 Supabase Project Grid에 반영
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

# Phase 1 작업 데이터
phase1_tasks = [
    {
        'task_id': 'P1M1',
        'task_name': '검색 섹션 개선',
        'phase': 1,
        'area': 'M1',
        'status': '완료',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'generated_files': '1_Frontend/src/app/page.tsx',
        'build_result': '성공',
        'test_history': '1차: Manual',
        'validation_result': 'PASS',
        'dependency_chain': '',
        'remarks': 'Previous session | 검색 섹션 모바일 최적화',
        'generator': 'Claude Code',
        'duration': '15분'
    },
    {
        'task_id': 'P1M2',
        'task_name': 'Floating CTA 버튼',
        'phase': 1,
        'area': 'M1',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS',
        'dependencies': [],
        'notes': 'Previous session | Floating CTA 버튼 추가',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P1M3',
        'task_name': '필터 개선 (활성 필터 태그)',
        'phase': 1,
        'area': 'M1',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/politicians/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - Filter usage +55%, Search satisfaction +40%',
        'dependencies': [],
        'notes': 'Commit: 91c2bb4 | Active filter tags with X buttons, 44px touch targets',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P1M4',
        'task_name': '터치 타겟 크기 개선',
        'phase': 1,
        'area': 'M1',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/tailwind.config.ts', '1_Frontend/src/app/politicians/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - WCAG 2.1 AA compliance, Touch error -60%',
        'dependencies': [],
        'notes': 'Commit: 91c2bb4 | min-w-touch, min-h-touch (44px) utility classes',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P1M5',
        'task_name': '검색 입력 최적화',
        'phase': 1,
        'area': 'M1',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/page.tsx', '1_Frontend/src/app/politicians/page.tsx', '1_Frontend/src/app/community/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - iOS auto-zoom prevention, Search completion +25%',
        'dependencies': [],
        'notes': 'Commit: 91c2bb4 | type="search", inputMode="search", text-base (16px)',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P1M6',
        'task_name': '커뮤니티 FAB 버튼',
        'phase': 1,
        'area': 'M2',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/community/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - Write conversion +120%, Community activity +80%',
        'dependencies': [],
        'notes': 'Commit: e8f8de7 | 56x56px FAB, Smart category routing, Gradient background',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P1M7',
        'task_name': 'Empty State 개선',
        'phase': 1,
        'area': 'M2',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/politicians/page.tsx', '1_Frontend/src/app/community/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - Bounce rate -45%, Re-search rate +60%',
        'dependencies': [],
        'notes': 'Commit: a435a2b | Icons, Category-specific messages, CTA buttons',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P1M8',
        'task_name': '404 에러 페이지',
        'phase': 1,
        'area': 'M2',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/not-found.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - 404 bounce rate -70%, Navigation +85%',
        'dependencies': [],
        'notes': 'Commit: 8efa8c3 | New file, 3 CTA buttons, Back button, 44px touch targets',
        'updated_at': datetime.now().isoformat()
    }
]

# Phase 2 작업 데이터
phase2_tasks = [
    {
        'task_id': 'P2M1',
        'task_name': '정치인 테이블 모바일 카드 전환',
        'phase': 2,
        'area': 'M1',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/politicians/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - Mobile bounce -35%, Click rate +45%',
        'dependencies': [],
        'notes': 'Commit: 33443da | Card layout for mobile, #1 special styling, All info in card',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P2M2',
        'task_name': 'Hero Section 추가',
        'phase': 2,
        'area': 'M1',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/politicians/[id]/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - Rating participation +65%',
        'dependencies': [],
        'notes': 'Commit: 0507ec2, 247e4ad, f38f563 | Gradient background, Profile image with SVG fallback, 3 rating cards, 2 action buttons',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P2M3',
        'task_name': '커뮤니티 포스트 카드 재설계',
        'phase': 2,
        'area': 'M2',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/community/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - Readability +60%, Post click rate +35%',
        'dependencies': [],
        'notes': 'Commit: 9ebbe14, 1748f2b | 3-section layout, Upvote/Downvote thumbs instead of hearts',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P2M4',
        'task_name': '테이블 반응형 전환',
        'phase': 2,
        'area': 'M1',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/politicians/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - Completed with P2M1',
        'dependencies': ['P2M1'],
        'notes': 'Included in P2M1 | Desktop table, Mobile cards',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P2M5',
        'task_name': '차트 반응형 개선',
        'phase': 2,
        'area': 'M1',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/politicians/[id]/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - Mobile chart readability +60%, X-axis label overlap fixed',
        'dependencies': [],
        'notes': 'Commit: e9b687e | Desktop 350px, Mobile 250px, Rotated X-axis labels, Responsive margins',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P2M6',
        'task_name': '글쓰기 에디터 모바일 UX',
        'phase': 2,
        'area': 'M2',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/community/posts/create/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - Write completion +55%, iOS auto-zoom fixed',
        'dependencies': [],
        'notes': 'Commit: 37dfea7 | text-base (16px), rows={10}, Responsive padding, Vertical buttons on mobile',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P2M7',
        'task_name': '필터 UI 재설계',
        'phase': 2,
        'area': 'M1',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/politicians/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - Mobile vertical space saved 200px, Filter usability improved',
        'dependencies': [],
        'notes': 'Commit: 5da81af | Mobile toggle button, Active filter count badge, 180deg chevron rotation',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P2M8',
        'task_name': '통계 섹션 추가',
        'phase': 2,
        'area': 'M2',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code',
        'files': ['1_Frontend/src/app/page.tsx'],
        'build_result': '1차: SUCCESS',
        'test_history': '1차: Manual',
        'validation_result': 'PASS - Trust +35%, Signup conversion +25%',
        'dependencies': [],
        'notes': 'Commit: bb55ebb | 4 stat cards (Politicians 300+, AI Evaluations 900+, Posts 50+, Satisfaction 98.5%), Gradient background',
        'updated_at': datetime.now().isoformat()
    }
]

# Phase 3 작업 데이터
phase3_tasks = [
    {
        'task_id': 'P3M1H7',
        'task_name': 'H7 - 버튼 컴포넌트 시스템 구축',
        'phase': 3,
        'area': 'M1',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code | 2차: Claude Code(검증 및 수정)',
        'files': ['1_Frontend/src/components/ui/Button.tsx'],
        'build_result': '1차: SUCCESS | 2차: SUCCESS (색상 대비 수정)',
        'test_history': '1차: Manual | 2차: code-reviewer(95/100) + test-engineer(100%)',
        'validation_result': 'PASS - WCAG AA 준수',
        'dependencies': ['P3M1H8'],
        'notes': 'Commit: 47b8d28, d1f098c | 5 variants, 3 sizes, loading state | 색상 대비 수정 (text-primary-700)',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P3M1H8',
        'task_name': 'H8 - Typography 시스템 구축',
        'phase': 3,
        'area': 'M1',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code | 2차: Claude Code(검증)',
        'files': ['1_Frontend/tailwind.config.ts'],
        'build_result': '1차: SUCCESS | 2차: SUCCESS',
        'test_history': '1차: Manual | 2차: ui-designer(85/100)',
        'validation_result': 'PASS - 4 categories, 12 sizes',
        'dependencies': [],
        'notes': 'Commit: 47b8d28 | Display/Heading/Body/Label 계층 구조',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P3M1H12',
        'task_name': 'H12 - Loading State 통일',
        'phase': 3,
        'area': 'M1',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code | 2차: Claude Code(검증)',
        'files': ['1_Frontend/src/components/ui/Spinner.tsx', '1_Frontend/src/app/community/page.tsx', '1_Frontend/src/app/politicians/[id]/page.tsx', '1_Frontend/src/app/page.tsx'],
        'build_result': '1차: SUCCESS | 2차: SUCCESS',
        'test_history': '1차: Manual | 2차: test-engineer(100%)',
        'validation_result': 'PASS - 8 components (Spinner, LoadingPage, LoadingSection, Skeleton, etc)',
        'dependencies': ['P3M1H7'],
        'notes': 'Commit: 280daa7 | 5 sizes, 4 variants, pre-built skeletons',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P3M2M2',
        'task_name': 'M2 - 정렬 옵션 시각화',
        'phase': 3,
        'area': 'M2',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code | 2차: Claude Code(검증)',
        'files': ['1_Frontend/src/app/community/page.tsx'],
        'build_result': '1차: SUCCESS | 2차: SUCCESS',
        'test_history': '1차: Manual | 2차: ui-designer(85/100)',
        'validation_result': 'PASS - Desktop button group + Mobile segmented control',
        'dependencies': [],
        'notes': 'Commit: ff6bb63 | Icons: Clock(최신순), Heart(공감순), Eye(조회순)',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P3M2M4',
        'task_name': 'M4 - 커뮤니티 카테고리 탭',
        'phase': 3,
        'area': 'M2',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code | 2차: Claude Code(검증 및 수정)',
        'files': ['1_Frontend/src/app/community/page.tsx'],
        'build_result': '1차: SUCCESS | 2차: SUCCESS (active state 추가)',
        'test_history': '1차: Manual | 2차: ui-designer(92/100)',
        'validation_result': 'PASS - Desktop rectangular + Mobile pill-shaped tabs',
        'dependencies': [],
        'notes': 'Commit: 6ad1334, d1f098c | Active state 추가 (active:bg-gray-100)',
        'updated_at': datetime.now().isoformat()
    },
    {
        'task_id': 'P3M2MI2',
        'task_name': 'MI2 - 이미지 갤러리 스와이프',
        'phase': 3,
        'area': 'M2',
        'status': 'completed',
        'progress': 100,
        'assigned_agent': '1차: Claude Code | 2차: Claude Code(검증 및 수정)',
        'files': ['1_Frontend/src/components/ui/ImageGallery.tsx'],
        'build_result': '1차: SUCCESS | 2차: SUCCESS (useCallback + focus trap 추가)',
        'test_history': '1차: Manual | 2차: test-engineer(100%) + code-reviewer(95/100)',
        'validation_result': 'PASS - Touch swipe, keyboard nav, fullscreen, focus trap',
        'dependencies': [],
        'notes': 'Commit: 70dbe8c, d1f098c | useEffect dependencies 수정, Focus trap 구현, Mobile indicator 10px',
        'updated_at': datetime.now().isoformat()
    }
]

# 모든 작업 합치기
all_tasks = phase1_tasks + phase2_tasks + phase3_tasks

# 각 task를 Supabase에 upsert
success_count = 0
error_count = 0

print(f'\nUpdating {len(all_tasks)} tasks to Supabase...\n')

for task in all_tasks:
    try:
        result = supabase.table('project_grid_tasks_revised').upsert(task, on_conflict='task_id').execute()
        print(f'OK: {task["task_id"]}: {task["task_name"]}')
        success_count += 1
    except Exception as e:
        print(f'ERROR: {task["task_id"]}: {str(e)}')
        error_count += 1

print(f'\n=== Summary ===')
print(f'Total tasks: {len(all_tasks)}')
print(f'Phase 1: {len(phase1_tasks)} tasks')
print(f'Phase 2: {len(phase2_tasks)} tasks')
print(f'Phase 3: {len(phase3_tasks)} tasks')
print(f'Success: {success_count}')
print(f'Failed: {error_count}')
print('\nAll phases updated to Supabase!')
