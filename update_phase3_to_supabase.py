# -*- coding: utf-8 -*-
"""
Phase 3 작업 내용을 Supabase Project Grid에 반영
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

# 각 task를 Supabase에 upsert
success_count = 0
error_count = 0

for task in phase3_tasks:
    try:
        result = supabase.table('project_grid_tasks').upsert(task, on_conflict='task_id').execute()
        print(f'OK: {task["task_id"]}: {task["task_name"]}')
        success_count += 1
    except Exception as e:
        print(f'ERROR: {task["task_id"]}: {str(e)}')
        error_count += 1

print(f'\nTotal {len(phase3_tasks)} tasks: Success {success_count}, Failed {error_count}')
print('Phase 3 tasks updated to Supabase!')
