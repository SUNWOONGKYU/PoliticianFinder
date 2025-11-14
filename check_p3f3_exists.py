#!/usr/bin/env python3
"""
Check if P3F3 task exists in project_grid_tasks_revised database
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('1_Frontend/.env.local')

# Initialize Supabase client
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("Error: Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key.strip())

# Check P3F3
result_p3f3 = supabase.table('project_grid_tasks_revised').select('*').eq('task_id', 'P3F3').execute()

print("=== P3F3 Task Check ===")
if result_p3f3.data and len(result_p3f3.data) > 0:
    print("[OK] P3F3 task EXISTS in database")
    task = result_p3f3.data[0]
    print(f"  - Description: {task.get('task_description')}")
    print(f"  - Status: {task.get('status')}")
    print(f"  - Progress: {task.get('progress')}%")
else:
    print("[MISSING] P3F3 task does NOT exist in database")
    print("  => Need to register P3F3 task")

# Check P3F4
result_p3f4 = supabase.table('project_grid_tasks_revised').select('*').eq('task_id', 'P3F4').execute()

print("\n=== P3F4 Task Check ===")
if result_p3f4.data and len(result_p3f4.data) > 0:
    print("[OK] P3F4 task EXISTS in database")
    task = result_p3f4.data[0]
    print(f"  - Description: {task.get('task_description')}")
    print(f"  - Status: {task.get('status')}")
    print(f"  - Progress: {task.get('progress')}%")
else:
    print("[MISSING] P3F4 task does NOT exist in database")
    print("  => Need to register P3F4 task")
