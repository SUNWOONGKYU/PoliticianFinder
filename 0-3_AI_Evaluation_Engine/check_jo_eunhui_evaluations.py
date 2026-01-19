# -*- coding: utf-8 -*-
"""
조은희 정치인 expertise 카테고리 평가 결과 확인
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 환경 변수 로드
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path, override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

POLITICIAN_ID = 'd0a5d6e1'
POLITICIAN_NAME = '조은희'

def check_evaluations():
    """평가 결과 확인"""
    print(f"\n{'='*60}")
    print(f"조은희 expertise 평가 결과 확인")
    print(f"{'='*60}\n")

    try:
        # 평가 결과 조회
        result = supabase.table('evaluations_v30')\
            .select('*')\
            .eq('politician_id', POLITICIAN_ID)\
            .eq('category', 'expertise')\
            .order('evaluated_at', desc=False)\
            .execute()

        if not result.data:
            print("⚠️ 평가 결과가 없습니다.\n")
            return

        print(f"✅ {len(result.data)}개 평가 결과 발견\n")
        print(f"{'='*60}")

        for i, ev in enumerate(result.data, 1):
            print(f"\n[평가 {i}]")
            print(f"  - 평가 AI: {ev.get('evaluator_ai')}")
            print(f"  - 등급: {ev.get('rating')} (점수: {ev.get('score')})")
            print(f"  - 근거: {ev.get('reasoning', 'N/A')}")
            print(f"  - 평가 시각: {ev.get('evaluated_at')}")
            print(f"  - collected_data_id: {ev.get('collected_data_id')}")

        print(f"\n{'='*60}")

        # 통계
        ratings = [ev.get('rating') for ev in result.data]
        scores = [ev.get('score', 0) for ev in result.data]

        print(f"\n[통계]")
        print(f"  - 총 평가: {len(result.data)}개")
        print(f"  - 평균 점수: {sum(scores)/len(scores):.2f}")
        print(f"  - 최고 등급: {max(ratings, key=lambda x: int(x))}")
        print(f"  - 최저 등급: {min(ratings, key=lambda x: int(x))}")
        print(f"{'='*60}\n")

    except Exception as e:
        print(f"❌ 조회 실패: {e}\n")


if __name__ == "__main__":
    check_evaluations()
