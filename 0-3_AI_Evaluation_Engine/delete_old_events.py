# -*- coding: utf-8 -*-
"""
기간 외 사건 데이터 제거
김민석 청렴성 데이터 중 2004-2019년 사건 7개 제거
"""
import os
import json
import sys
import io
from dotenv import load_dotenv
from supabase import create_client

# UTF-8 출력
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# 제거 대상 로드
with open('integrity_negative_content.json', 'r', encoding='utf-8') as f:
    to_delete = json.load(f)

print(f'=== 기간 외 사건 데이터 제거 ===')
print(f'제거 대상: {len(to_delete)}개\n')

for i, item in enumerate(to_delete, 1):
    print(f'{i}. [{item["keyword"]}년] {item["type"]}')
    print(f'   ID: {item["id"]}')
    print(f'   제목: {item["title"]}')
    print(f'   사유: {item["reason"]}')
    print()

print('\n⚠️ 자동 삭제 모드 - 사용자 승인 완료')
print('\n삭제 시작...\n')

deleted = 0
errors = 0

for item in to_delete:
    try:
        result = supabase.from_('collected_data_v30')\
            .delete()\
            .eq('id', item['id'])\
            .execute()

        print(f'✅ 삭제 완료: {item["id"][:8]}... ({item["keyword"]}년)')
        deleted += 1
    except Exception as e:
        print(f'❌ 삭제 실패: {item["id"][:8]}... - {e}')
        errors += 1

print(f'\n=== 완료 ===')
print(f'삭제 성공: {deleted}개')
print(f'삭제 실패: {errors}개')

# 삭제 후 확인
print('\n=== 삭제 후 확인 ===')
result = supabase.from_('collected_data_v30')\
    .select('id')\
    .eq('politician_id', 'f9e00370')\
    .eq('category', 'integrity')\
    .execute()

print(f'남은 청렴성 데이터: {len(result.data)}개 (기존 75개 - 삭제 {deleted}개 = {75 - deleted}개)')
