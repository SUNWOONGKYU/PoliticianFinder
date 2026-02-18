# -*- coding: utf-8 -*-
"""
김민석 데이터 전체 삭제
- collected_data_v30
- evaluations_v30 (있으면)
"""
import sys
import io
import os
from dotenv import load_dotenv
from supabase import create_client

# UTF-8 출력
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv()

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

POLITICIAN_ID = 'f9e00370'
POLITICIAN_NAME = '김민석'

print(f"""
============================================================
김민석 데이터 전체 삭제
============================================================
정치인 ID: {POLITICIAN_ID}
정치인 이름: {POLITICIAN_NAME}

⚠️ 이 작업은 되돌릴 수 없습니다!
============================================================
""")

# 1. collected_data_v30 개수 확인
result = supabase.table('collected_data_v30')\
    .select('*', count='exact')\
    .eq('politician_id', POLITICIAN_ID)\
    .execute()

collected_count = result.count if result.count else 0

print(f"📊 collected_data_v30: {collected_count}개")

# 2. evaluations_v30 개수 확인 (테이블이 있으면)
try:
    result = supabase.table('evaluations_v30')\
        .select('*', count='exact')\
        .eq('politician_id', POLITICIAN_ID)\
        .execute()
    
    eval_count = result.count if result.count else 0
    print(f"📊 evaluations_v30: {eval_count}개")
except:
    eval_count = 0
    print(f"📊 evaluations_v30: 테이블 없음")

if collected_count == 0 and eval_count == 0:
    print("\n⚠️ 삭제할 데이터가 없습니다.")
    sys.exit(0)

print(f"\n삭제 진행 중...\n")

# 3. evaluations_v30 삭제 (있으면)
if eval_count > 0:
    try:
        result = supabase.table('evaluations_v30')\
            .delete()\
            .eq('politician_id', POLITICIAN_ID)\
            .execute()
        
        print(f"✅ evaluations_v30 삭제 완료: {eval_count}개")
    except Exception as e:
        print(f"⚠️ evaluations_v30 삭제 실패: {e}")

# 4. collected_data_v30 삭제
if collected_count > 0:
    try:
        result = supabase.table('collected_data_v30')\
            .delete()\
            .eq('politician_id', POLITICIAN_ID)\
            .execute()
        
        print(f"✅ collected_data_v30 삭제 완료: {collected_count}개")
    except Exception as e:
        print(f"⚠️ collected_data_v30 삭제 실패: {e}")

print(f"""
============================================================
삭제 완료!
============================================================

다음 단계:
1. 재수집:
   python 설계문서_V7.0/V30/scripts/collect_v30.py \
     --politician_id={POLITICIAN_ID} \
     --politician_name="{POLITICIAN_NAME}" \
     --parallel

2. 검증 (자동 재수집 포함):
   python 설계문서_V7.0/V30/scripts/validate_v30.py \
     --politician_id={POLITICIAN_ID} \
     --politician_name="{POLITICIAN_NAME}" \
     --mode=all

3. 평가:
   python 설계문서_V7.0/V30/scripts/evaluate_v30.py \
     --politician_id={POLITICIAN_ID} \
     --politician_name="{POLITICIAN_NAME}" \
     --parallel

4. 점수 계산:
   python 설계문서_V7.0/V30/scripts/calculate_v30_scores.py \
     --politician_id={POLITICIAN_ID} \
     --politician_name="{POLITICIAN_NAME}"

============================================================
""")
