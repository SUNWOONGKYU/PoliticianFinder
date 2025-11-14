#!/usr/bin/env python3
"""
Check project_grid_tasks_revised table schema
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

# Get one record to see the schema
result = supabase.table('project_grid_tasks_revised').select('*').limit(1).execute()

if result.data and len(result.data) > 0:
    task = result.data[0]
    print("=== project_grid_tasks_revised Table Schema ===\n")
    print("Column names found in database:")
    for key in sorted(task.keys()):
        value = task[key]
        value_type = type(value).__name__
        print(f"  - {key}: {value_type}")
else:
    print("No tasks found in database")
