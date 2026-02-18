#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PostgreSQL 시스템 뷰로 백업 정보 확인
"""

import os
import sys
import io
from supabase import create_client
from dotenv import load_dotenv

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

print('='*80)
print('PostgreSQL 백업 정보 확인 (간접적)')
print('='*80)

# Supabase의 service_role은 일반 사용자 권한이라 시스템 뷰 접근 제한적
# 대신 확인 가능한 정보들:

print('\n[1] 현재 데이터 상태')
print('-'*80)
politician_id = 'd0a5d6e1'

result = supabase.table('collected_data_v30')\
    .select('collector_ai', count='exact')\
    .eq('politician_id', politician_id)\
    .execute()

print(f"총 데이터: {result.count}개")

# AI별 분포
for ai in ['Claude', 'ChatGPT', 'Gemini', 'Grok', 'Perplexity']:
    result = supabase.table('collected_data_v30')\
        .select('*', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('collector_ai', ai)\
        .execute()
    print(f"  {ai}: {result.count}개")

print('\n[2] 삭제 전 예상 데이터')
print('-'*80)
print("수집 완료: 1002개")
print("  - Gemini: ~752개")
print("  - Perplexity: ~250개")

print('\n[3] 손실 추정')
print('-'*80)
print(f"현재: {supabase.table('collected_data_v30').select('*', count='exact').eq('politician_id', politician_id).execute().count}개")
print(f"삭제됨: ~946개")
print(f"  - Gemini: ~728개")
print(f"  - Perplexity: ~147개")

print('\n' + '='*80)
print('CLI로는 PITR 상태를 직접 확인할 수 없습니다.')
print('='*80)

print('\n✅ Pro 플랜이라면 Dashboard에서 확인하세요:')
print('\n1. Dashboard 접속:')
print('   https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx')

print('\n2. 메뉴 이동:')
print('   Settings → Database → Backups (또는 Point in Time Recovery)')

print('\n3. 확인 사항:')
print('   ✓ "Point in Time Recovery" 섹션이 있는지')
print('   ✓ "PITR Enabled" 상태인지')
print('   ✓ 백업 목록에 2026-01-26 날짜가 있는지')

print('\n4. 복구 시점:')
print('   → 2026-01-26 21:40:00 KST (삭제 1분 전)')

print('\n5. 복구 방법:')
print('   옵션 A: Fork (안전) - 새 프로젝트로 복구 후 데이터 추출')
print('   옵션 B: Restore (빠름) - 전체 DB를 해당 시점으로 롤백')

print('\n' + '='*80)
print('또는 Personal Access Token을 생성하면 API로 확인 가능합니다:')
print('https://supabase.com/dashboard/account/tokens')
print('='*80)
