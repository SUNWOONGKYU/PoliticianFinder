from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('1_Frontend/.env.local')
url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
supabase = create_client(url, key)

print('=== FAVORITES API QUERY TEST ===\n')

politician_id = 'c34753dd'
print(f'Testing politician_id: {politician_id}')
print(f'Type: {type(politician_id)}\n')

# Test 1: 정치인 조회 (favorites API Line 116-120)
print('Test 1: SELECT id, name, party, position')
try:
    result = supabase.table('politicians').select('id, name, party, position').eq('id', politician_id).single().execute()
    print('SUCCESS!')
    print(f'Data: {result.data}\n')
except Exception as e:
    print(f'FAILED: {e}\n')

# Test 2: favorite_politicians 테이블 확인
print('Test 2: Check favorite_politicians table schema')
try:
    result = supabase.table('favorite_politicians').select('*').limit(1).execute()
    if result.data:
        print('Columns:')
        for col in sorted(result.data[0].keys()):
            print(f'  - {col}')
    else:
        print('Table is empty, checking structure...')
        # RLS 때문에 데이터가 안 보일 수 있음
        print('Table exists (will check INSERT)\n')
except Exception as e:
    print(f'Error: {e}\n')

# Test 3: INSERT 시뮬레이션
print('Test 3: Simulate INSERT')
insert_data = {
    'politician_id': politician_id,
}
print(f'INSERT data: {insert_data}')
print('Note: Actual INSERT requires user_id from auth\n')

print('=== CONCLUSION ===')
print('If Test 1 succeeded, the query is correct.')
print('The API should work after deployment.')
