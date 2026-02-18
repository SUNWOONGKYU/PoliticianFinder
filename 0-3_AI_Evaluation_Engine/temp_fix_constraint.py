# -*- coding: utf-8 -*-
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# 테스트로 0 rating 삽입 시도
try:
    test_record = {
        'politician_id': 'test123',
        'politician_name': 'TEST',
        'category': 'expertise',
        'evaluator_ai': 'Gemini',
        'rating': '0',
        'score': 0,
        'reasoning': 'Test'
    }
    result = supabase.table('evaluations_v30').insert([test_record]).execute()
    print('✅ 제약 조건이 이미 수정되었거나 0 rating 저장 가능')
    # 테스트 데이터 삭제
    supabase.table('evaluations_v30').delete().eq('politician_id', 'test123').execute()
except Exception as e:
    if '23514' in str(e) or 'rating_check' in str(e):
        print('❌ 제약 조건 수정 필요')
        print()
        print('Supabase SQL Editor에서 다음을 실행하세요:')
        print('https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx/sql/new')
        print()
        print('ALTER TABLE evaluations_v30 DROP CONSTRAINT IF EXISTS evaluations_v30_rating_check;')
        print('ALTER TABLE evaluations_v30 DROP CONSTRAINT IF EXISTS evaluations_v30_score_check;')
        print("ALTER TABLE evaluations_v30 ADD CONSTRAINT evaluations_v30_rating_check CHECK (rating IN ('+4', '+3', '+2', '+1', '0', '-1', '-2', '-3', '-4'));")
        print("ALTER TABLE evaluations_v30 ADD CONSTRAINT evaluations_v30_score_check CHECK (score IN (8, 6, 4, 2, 0, -2, -4, -6, -8));")
    else:
        print(f'기타 에러: {e}')
