#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Add status column to politicians table and update existing data
"""
import os
import sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

# Supabase 자격증명
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.bSPJXuXZ66bx7_i4YzAYQgIJXNiN99tEYUYYlLZHBfo"

def main():
    print("Connecting to Supabase...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # SQL to add status column
    sql_add_column = """
    ALTER TABLE politicians
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT '현직';
    """

    # SQL to create index
    sql_create_index = """
    CREATE INDEX IF NOT EXISTS idx_politicians_status ON politicians(status);
    """

    try:
        print("\nAdding 'status' column to politicians table...")
        result = supabase.rpc('exec_sql', {'query': sql_add_column}).execute()
        print("✓ Status column added successfully")

        print("\nCreating index on status column...")
        result = supabase.rpc('exec_sql', {'query': sql_create_index}).execute()
        print("✓ Index created successfully")

        print("\nFetching all politicians...")
        response = supabase.table('politicians').select('id, name, is_active, position').execute()
        politicians = response.data

        print(f"Found {len(politicians)} politicians")

        # Update each politician with appropriate status
        for politician in politicians:
            # Determine status based on position and is_active
            if politician.get('is_active'):
                status = '현직'
            else:
                status = '전직'

            print(f"Updating {politician['name']}: {status}")
            supabase.table('politicians').update({
                'status': status
            }).eq('id', politician['id']).execute()

        print("\n✓ All politicians updated with status!")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nPlease run this SQL manually in Supabase SQL Editor:")
        print(sql_add_column)
        print(sql_create_index)

if __name__ == '__main__':
    main()
