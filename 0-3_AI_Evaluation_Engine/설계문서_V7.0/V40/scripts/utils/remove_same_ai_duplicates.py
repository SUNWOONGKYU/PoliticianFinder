#!/usr/bin/env python3
"""같은 AI가 중복 수집한 데이터 제거"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from collections import defaultdict

ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent.parent / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

print("\n=== 같은 AI 중복 제거 시작 ===\n")

# 1. 모든 데이터 조회
result = supabase.table('collected_data_v40').select('id, category, source_url, collector_ai, created_at').eq(
    'politician_id', '8c5dcc89'
).execute()

print(f"전체 데이터: {len(result.data)}개")

# 2. (category, collector_ai, url) 기준으로 그룹화
groups = defaultdict(list)
for item in result.data:
    key = (item['category'], item['collector_ai'], item['source_url'])
    groups[key].append(item)

# 3. 중복 찾기 및 제거할 ID 선정
to_delete = []
for key, items in groups.items():
    if len(items) > 1:
        # 가장 오래된 것만 유지, 나머지는 제거
        items.sort(key=lambda x: x['created_at'])
        to_delete.extend([item['id'] for item in items[1:]])

print(f"제거할 중복: {len(to_delete)}개\n")

if not to_delete:
    print("중복 없음!")
    exit(0)

# 4. 중복 제거
print("중복 제거 중...")
deleted_count = 0

# Supabase는 한 번에 여러 개 삭제할 수 없으므로 배치로 처리
batch_size = 100
for i in range(0, len(to_delete), batch_size):
    batch = to_delete[i:i+batch_size]

    for item_id in batch:
        try:
            supabase.table('collected_data_v40').delete().eq('id', item_id).execute()
            deleted_count += 1
        except Exception as e:
            print(f"[ERROR] Failed to delete {item_id}: {e}")

    print(f"  진행: {deleted_count}/{len(to_delete)}")

print(f"\n✅ 중복 제거 완료: {deleted_count}개 삭제")

# 5. 최종 확인
result = supabase.table('collected_data_v40').select('id', count='exact').eq(
    'politician_id', '8c5dcc89'
).execute()

print(f"남은 데이터: {result.count}개\n")
