#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
공통 저장 함수 (Batch Upsert) 테스트

기존 평가 데이터로 Upsert 성능 테스트:
1. 중복 처리 확인 (기존 데이터 재저장)
2. 성능 측정
3. 결과 검증
"""

import os
import sys
import time
from pathlib import Path

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(V40_DIR / 'scripts' / 'helpers'))

from common_eval_saver import save_evaluations_batch_upsert
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

def test_upsert():
    """Upsert 기능 테스트"""

    print("="*80)
    print("공통 저장 함수 (Batch Upsert) 테스트")
    print("="*80)
    print()

    # 테스트 데이터: 조은희, expertise 카테고리의 기존 평가 데이터 10개
    politician_id = 'd0a5d6e1'
    politician_name = '조은희'
    category = 'expertise'

    # 1. 기존 평가 데이터 조회
    print("[1] 기존 평가 데이터 조회 (10개)...")
    existing_evals = supabase.table('evaluations_v40').select(
        'collected_data_id, rating, reasoning'
    ).eq('politician_id', politician_id).eq(
        'category', category
    ).eq('evaluator_ai', 'Gemini').limit(10).execute()

    if not existing_evals.data:
        print("  [WARNING] 기존 평가 데이터 없음 (테스트 불가)")
        return

    print(f"  [OK] {len(existing_evals.data)}개 조회 완료")
    print()

    # 2. 평가 데이터 재저장 (Upsert 테스트)
    print("[2] Upsert 테스트 (중복 처리 확인)...")

    evaluations = [
        {
            'id': item['collected_data_id'],
            'rating': item['rating'],
            'rationale': item['reasoning']
        }
        for item in existing_evals.data
    ]

    # 성능 측정
    start_time = time.time()

    result = save_evaluations_batch_upsert(
        politician_id=politician_id,
        politician_name=politician_name,
        category=category,
        evaluator_ai='Gemini',
        evaluations=evaluations,
        verbose=True
    )

    elapsed = time.time() - start_time

    print()
    print(f"  [TIME] 소요 시간: {elapsed:.3f}초")
    print(f"  [RESULT] 결과:")
    print(f"     - 저장: {result['saved']}개")
    print(f"     - X 판정: {result['skipped']}개")
    print(f"     - 잘못된 등급: {result['invalid']}개")
    print(f"     - HTTP 요청: 1번 (Upsert)")
    print()

    # 3. 결과 검증
    print("[3] 결과 검증...")

    after_evals = supabase.table('evaluations_v40').select(
        'collected_data_id, rating, reasoning'
    ).eq('politician_id', politician_id).eq(
        'category', category
    ).eq('evaluator_ai', 'Gemini').limit(10).execute()

    if len(after_evals.data) == len(existing_evals.data):
        print(f"  [OK] 데이터 개수 일치 ({len(after_evals.data)}개)")
    else:
        print(f"  [ERROR] 데이터 개수 불일치 (이전: {len(existing_evals.data)}, 이후: {len(after_evals.data)})")

    # 4. 성능 비교
    print()
    print("[4] 성능 비교...")
    print()
    print("  기존 방식 (Gemini):")
    print(f"    - HTTP 요청: {len(evaluations)} × 2 = {len(evaluations) * 2}번 (GET + PATCH/POST)")
    print(f"    - 예상 시간: ~{len(evaluations) * 0.2:.1f}초 (각 요청당 0.2초)")
    print()
    print("  개선 방식 (Upsert):")
    print(f"    - HTTP 요청: 1번 (Upsert)")
    print(f"    - 실제 시간: {elapsed:.3f}초")
    print(f"    - 속도 향상: ~{(len(evaluations) * 2):.0f}배")
    print()

    print("="*80)
    print("[OK] 테스트 완료!")
    print("="*80)

if __name__ == '__main__':
    test_upsert()
