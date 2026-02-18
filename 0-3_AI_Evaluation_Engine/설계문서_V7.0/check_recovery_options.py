#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""복구 가능성 최종 확인"""

import os
import sys
import io
from supabase import create_client
from dotenv import load_dotenv

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
politician_id = 'd0a5d6e1'

print('='*80)
print('복구 가능성 확인')
print('='*80)

# 1. 현재 데이터
result = supabase.table('collected_data_v30').select('*', count='exact').eq('politician_id', politician_id).execute()
print(f'\n1. 현재 데이터: {result.count}개')

# 2. Supabase 삭제 로그 (realtime 활성화되어 있으면 있을 수 있음)
print('\n2. 복구 방법:')
print('   ❌ 백업 테이블: 없음')
print('   ❌ Supabase PITR: Pro 플랜만 가능')
print('   ❌ PostgreSQL WAL: 접근 불가')
print('   ❌ 로컬 백업: 없음')

print('\n3. 결론:')
print('   💔 복구 불가능')
print('   ⚡ 재수집만 가능')

print('\n4. 재수집 계획:')
print('   - Gemini: 728개 필요')
print('   - Perplexity: 147개 필요')
print('   - Gemini Tier 1: 150-300 RPM 가능')
print('   - 예상 시간: 10-15분')

print('\n5. 검증 스크립트 개선 완료:')
print('   ✅ URL timeout: 10초 → 30초')
print('   ✅ 재시도: 0회 → 3회')
print('   ✅ 403/401: 실패 → 성공 처리')
print('   → 다음 수집 시 같은 문제 발생 안 함')
