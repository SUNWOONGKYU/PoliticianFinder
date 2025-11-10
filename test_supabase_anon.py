#!/usr/bin/env python3
"""Test Supabase anon key access to project_grid_tasks_revised"""

from supabase import create_client

SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8'

def test_access():
    print('Testing anon key access to project_grid_tasks_revised...\n')

    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    try:
        result = supabase.table('project_grid_tasks_revised').select('*').execute()

        print(f'SUCCESS!')
        print(f'Total rows: {len(result.data)}')

        if result.data:
            print('\nFirst 3 tasks:')
            for task in result.data[:3]:
                print(f"  - {task['task_id']}: {task['task_name']} ({task['status']})")
        else:
            print('\nNo data returned (but no error - might be RLS policy)')

    except Exception as e:
        print(f'ERROR: {e}')
        print(f'Type: {type(e).__name__}')

if __name__ == '__main__':
    test_access()
