#!/usr/bin/env python3
"""Check total data count"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent.parent / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

result = supabase.table('collected_data_v40').select('id', count='exact').eq(
    'politician_id', '8c5dcc89'
).execute()

print(f'\nTotal data count: {result.count}')

# Category breakdown
categories = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

print('\nCategory breakdown:')
for cat in categories:
    cat_result = supabase.table('collected_data_v40').select('id', count='exact').eq(
        'politician_id', '8c5dcc89'
    ).eq('category', cat).execute()
    print(f'  {cat}: {cat_result.count}')
