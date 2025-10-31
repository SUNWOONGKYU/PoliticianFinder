#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V6.2 스키마 자동 설치 스크립트
"""

import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')
password = os.getenv('SUPABASE_PASSWORD')

print('V6.2 Schema Installation')
print('=' * 80)
print()

# Read schema file
schema_file = '설계문서_V3.0/schema_v6.2.sql'
try:
    with open(schema_file, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    print(f'✓ Read schema file: {len(schema_sql)} characters')
except Exception as e:
    print(f'✗ Error reading schema file: {e}')
    sys.exit(1)

# Use psycopg2 to execute SQL
try:
    import psycopg2

    # Try different connection methods
    connection_attempts = [
        {
            'host': 'aws-0-ap-northeast-2.pooler.supabase.com',
            'user': 'postgres.ooddlafwdpzgxfefgsrx',
            'database': 'postgres',
        },
        {
            'host': 'db.ooddlafwdpzgxfefgsrx.supabase.co',
            'user': 'postgres',
            'database': 'postgres',
        }
    ]

    conn = None
    for attempt in connection_attempts:
        try:
            print(f'\nTrying to connect to {attempt["host"]}...')
            conn = psycopg2.connect(
                host=attempt['host'],
                port=5432,
                database=attempt['database'],
                user=attempt['user'],
                password=password,
                connect_timeout=10
            )
            print(f'✓ Connected to {attempt["host"]}')
            break
        except Exception as e:
            print(f'✗ Failed: {str(e)[:100]}')
            continue

    if not conn:
        print('\n✗ Could not connect to database')
        print('\nPlease install schema manually:')
        print(f'1. Go to: {url}/project/ooddlafwdpzgxfefgsrx/sql')
        print(f'2. Copy contents of: {schema_file}')
        print('3. Paste and run in SQL Editor')
        sys.exit(1)

    print('\nExecuting SQL statements...')
    print('-' * 80)

    cursor = conn.cursor()

    # Execute the entire schema as one transaction
    try:
        cursor.execute(schema_sql)
        conn.commit()
        print('✓ Schema executed successfully')
    except Exception as e:
        conn.rollback()
        print(f'✗ Error executing schema: {e}')
        sys.exit(1)

    # Verify installation
    print('\nVerifying installation...')
    print('-' * 80)

    tables = [
        'collected_data',
        'ai_item_scores',
        'ai_category_scores',
        'ai_final_scores',
        'combined_final_scores'
    ]

    all_ok = True
    for table in tables:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = %s
            )
        """, (table,))

        exists = cursor.fetchone()[0]
        if exists:
            print(f'  ✓ {table}')
        else:
            print(f'  ✗ {table} (missing)')
            all_ok = False

    cursor.close()
    conn.close()

    print()
    print('=' * 80)
    if all_ok:
        print('SUCCESS: V6.2 schema installed successfully!')
    else:
        print('PARTIAL: Some tables are missing')
    print('=' * 80)

except ImportError:
    print('\n✗ psycopg2 not installed')
    print('\nInstall with: pip install psycopg2-binary')
    sys.exit(1)

except Exception as e:
    print(f'\n✗ Unexpected error: {e}')
    sys.exit(1)
