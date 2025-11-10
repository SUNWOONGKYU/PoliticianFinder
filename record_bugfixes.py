#!/usr/bin/env python3
"""Record BUGFIX_004 and BUGFIX_006 to Supabase project_grid_tasks_revised"""

from supabase import create_client
import json
import os
from dotenv import load_dotenv

load_dotenv('1_Frontend/.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# BUGFIX_004: politician_details 관계 오류
bugfix_004 = {
    'task_id': 'BUGFIX_004',
    'task_name': 'Fix politician_details table relationship error',
    'phase': 7,
    'area': 'Backend',
    'status': 'completed',
    'progress': 100,
    'assigned_agent': 'Claude Code (Sonnet 4.5)',
    'generated_files': json.dumps([
        '1_Frontend/src/app/api/politicians/[id]/route.ts (수정)'
    ]),
    'test_history': 'Local Test ✅ | API 정상 작동',
    'build_result': 'Success ✅',
    'modification_history': json.dumps([{
        'timestamp': '2025-11-10T04:20:00Z',
        'file': '1_Frontend/src/app/api/politicians/[id]/route.ts',
        'changes': [
            'Removed politician_details table join (lines 25-41)',
            'Removed politician_details reference from response (line 106)',
        ],
        'reason': 'politician_details table does not exist - causing PGRST200 error',
        'impact': 'Politician detail API now works correctly'
    }])
}

# BUGFIX_006: Vercel 캐시 문제
bugfix_006 = {
    'task_id': 'BUGFIX_006',
    'task_name': 'Fix Vercel Edge Cache preventing 24 politicians display',
    'phase': 7,
    'area': 'Frontend',
    'status': 'completed',
    'progress': 100,
    'assigned_agent': 'Claude Code (Sonnet 4.5)',
    'generated_files': json.dumps([
        '1_Frontend/src/app/politicians/page.tsx (수정)'
    ]),
    'test_history': 'Local Test ✅ | Vercel Deploy 진행 중',
    'build_result': 'Success ✅',
    'modification_history': json.dumps([{
        'timestamp': '2025-11-10T04:20:00Z',
        'file': '1_Frontend/src/app/politicians/page.tsx',
        'changes': [
            'Added cache: "no-store" to fetch options (line 146)',
            'Added comment explaining Vercel cache invalidation'
        ],
        'reason': 'Vercel Edge Cache serving old version with only 3 politicians despite BUGFIX_001',
        'impact': 'Users can now see all 24 politicians on politicians page'
    }])
}

print('Recording BUGFIX_004 to Supabase...')
result = supabase.table('project_grid_tasks_revised').insert(bugfix_004).execute()
print(f'BUGFIX_004 recorded: {result.data[0]["task_id"]} - {result.data[0]["task_name"]}')

print('\nRecording BUGFIX_006 to Supabase...')
result = supabase.table('project_grid_tasks_revised').insert(bugfix_006).execute()
print(f'BUGFIX_006 recorded: {result.data[0]["task_id"]} - {result.data[0]["task_name"]}')

print('\n✅ All bugfixes recorded to Supabase!')
print(f'Total tasks in project_grid_tasks_revised: {len(supabase.table("project_grid_tasks_revised").select("task_id").execute().data)}')
