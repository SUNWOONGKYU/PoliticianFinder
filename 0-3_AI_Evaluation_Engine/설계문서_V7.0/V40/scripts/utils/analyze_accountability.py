#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""책임감 25개 실패 원인 분석"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(V40_DIR))

# UTF-8 출력
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env 로드
env_path = V40_DIR / '.env'
load_dotenv(dotenv_path=env_path, override=True)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

POLITICIAN_ID = 'd0a5d6e1'
CATEGORY = 'accountability'

print("="*80)
print("책임감 데이터 분석")
print("="*80)
print()

# 1. 전체 collected_data 조회
collected_result = supabase.table('collected_data_v40').select('id, title').eq(
    'politician_id', POLITICIAN_ID
).eq('category', CATEGORY).execute()

all_collected_ids = {item['id'] for item in (collected_result.data or [])}
print(f"1. 전체 수집 데이터: {len(all_collected_ids)}개")

# 2. 이미 평가된 데이터 조회
evaluated_result = supabase.table('evaluations_v40').select('collected_data_id').eq(
    'politician_id', POLITICIAN_ID
).eq('category', CATEGORY).eq('evaluator_ai', 'ChatGPT').execute()

evaluated_ids = {item['collected_data_id'] for item in (evaluated_result.data or []) if item.get('collected_data_id')}
print(f"2. 이미 평가된 데이터: {len(evaluated_ids)}개")

# 3. 미평가 데이터
unevaluated_list = [item for item in (collected_result.data or []) if item['id'] not in evaluated_ids]
unevaluated_ids = [item['id'] for item in unevaluated_list]
print(f"3. 미평가 데이터: {len(unevaluated_ids)}개")
print()

# 4. 미평가 데이터 상세 확인
print("="*80)
print("미평가 데이터 상세 정보")
print("="*80)

for i, item in enumerate(unevaluated_list[:10], 1):
    data_id = item['id']
    title = item.get('title', '제목 없음')[:50]

    # collected_data_v40에 존재하는지 재확인
    check_result = supabase.table('collected_data_v40').select('id').eq('id', data_id).execute()
    exists = "✅ 존재" if check_result.data else "❌ 없음"

    print(f"{i}. {exists} | ID: {data_id[:8]}... | 제목: {title}")

print()
print(f"전체 미평가 데이터 {len(unevaluated_ids)}개 중 샘플 10개 확인")
print()

# 5. 결론
print("="*80)
print("분석 결과")
print("="*80)

if len(unevaluated_ids) > 0:
    print(f"📊 미평가 데이터가 collected_data_v40에 존재함")
    print(f"   → Foreign key constraint 오류 원인: 다른 문제")
    print()
    print("가능한 원인:")
    print("  1. 트랜잭션 타이밍 문제 (평가 중 데이터 삭제)")
    print("  2. ID 불일치 (UUID 변환 오류)")
    print("  3. 데이터베이스 레플리케이션 지연")
else:
    print(f"⚠️ 미평가 데이터 없음 (이미 다른 방법으로 평가됨?)")
