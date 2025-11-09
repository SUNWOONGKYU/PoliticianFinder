#!/usr/bin/env python3
"""
Setup PROJECT_GRID_REVISED Database in Supabase
Executes SQL files in order using psycopg2
"""

import os
import sys

# Supabase PostgreSQL connection string (Direct connection)
SUPABASE_CONNECTION = "postgresql://postgres:jCWzY7SKmbAV5ESZ@db.ooddlafwdpzgxfefgsrx.supabase.co:5432/postgres"

# SQL files to execute in order
SQL_FILES = [
    'project_grid_revised_36_schema.sql',
    'phase_gates_schema.sql',
    'project_grid_revised_36_data.sql',
    'phase_gates_data.sql'
]

def execute_sql_file(cursor, filename):
    """Execute a SQL file"""
    print(f"\n[*] Executing {filename}...")

    try:
        filepath = os.path.join(os.path.dirname(__file__), filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            sql = f.read()

        # Execute the SQL
        cursor.execute(sql)

        print(f"[OK] {filename} executed successfully")
        return True
    except Exception as e:
        print(f"[ERROR] Error executing {filename}: {e}")
        return False

def main():
    """Main function"""
    print("[START] PROJECT_GRID_REVISED Database Setup...\n")
    print(f"[DIR] Working directory: {os.path.dirname(__file__)}\n")

    try:
        import psycopg2
    except ImportError:
        print("[INSTALL] psycopg2 not installed. Installing...")
        os.system(f"{sys.executable} -m pip install psycopg2-binary")
        import psycopg2

    try:
        # Connect to Supabase PostgreSQL
        print("[CONNECT] Connecting to Supabase...")
        conn = psycopg2.connect(SUPABASE_CONNECTION)
        conn.autocommit = False
        cursor = conn.cursor()
        print("[OK] Connected to Supabase\n")

        success_count = 0
        fail_count = 0

        # Execute each SQL file
        for filename in SQL_FILES:
            if execute_sql_file(cursor, filename):
                conn.commit()
                success_count += 1
            else:
                conn.rollback()
                fail_count += 1

        # Close connection
        cursor.close()
        conn.close()

        # Print summary
        print('\n' + '=' * 50)
        print(f"[SUCCESS] Successful: {success_count}")
        print(f"[FAILED] Failed: {fail_count}")
        print('=' * 50)

        if fail_count == 0:
            print('\n[COMPLETE] DATABASE SETUP COMPLETE!')
            print('\nNext steps:')
            print('1. Verify tables in Supabase Dashboard')
            print('2. Check project_grid_tasks_revised table has 36 rows')
            print('3. Check phase_gates table has 6 rows')
            return 0
        else:
            print('\n[WARNING] Some SQL files failed to execute.')
            return 1

    except Exception as e:
        print(f"\n[FATAL ERROR] Fatal error: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
