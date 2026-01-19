# -*- coding: utf-8 -*-
"""
조은희 정치인 expertise 카테고리 첫 10개 평가 상세 보고서
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

def get_first_10_evaluations():
    """첫 10개 평가 결과 상세 조회"""
    print(f"\n{'='*80}")
    print(f"조은희 정치인 expertise 카테고리 첫 10개 평가 상세 보고서")
    print(f"{'='*80}\n")

    try:
        # 첫 10개 평가 조회
        result = supabase.table('evaluations_v30')\
            .select('*')\
            .eq('politician_id', POLITICIAN_ID)\
            .eq('category', 'expertise')\
            .order('evaluated_at', desc=False)\
            .limit(10)\
            .execute()

        if not result.data:
            print("⚠️ 평가 결과가 없습니다.\n")
            return

        print(f"✅ {len(result.data)}개 평가 결과 발견\n")

        # 각 평가에 대해 원본 데이터도 함께 조회
        for i, ev in enumerate(result.data, 1):
            print(f"\n{'='*80}")
            print(f"[평가 {i}]")
            print(f"{'='*80}")

            # 평가 정보
            print(f"\n▶ 평가 정보:")
            print(f"  - 평가 AI: {ev.get('evaluator_ai')}")
            print(f"  - 등급: {ev.get('rating')} (점수: {ev.get('score')})")
            print(f"  - 평가 근거:")
            print(f"    {ev.get('reasoning', 'N/A')}")
            print(f"  - 평가 시각: {ev.get('evaluated_at')}")

            # 원본 데이터 조회
            collected_data_id = ev.get('collected_data_id')
            if collected_data_id:
                try:
                    data_result = supabase.table('collected_data_v30')\
                        .select('*')\
                        .eq('id', collected_data_id)\
                        .execute()

                    if data_result.data and len(data_result.data) > 0:
                        data = data_result.data[0]
                        print(f"\n▶ 원본 데이터:")
                        print(f"  - 제목: {data.get('title', 'N/A')}")
                        print(f"  - 내용 (요약):")
                        content = data.get('content', 'N/A')
                        # 내용이 길면 처음 300자만
                        if len(content) > 300:
                            content = content[:300] + "..."
                        print(f"    {content}")
                        print(f"  - 출처: {data.get('source_name', 'N/A')}")
                        print(f"  - URL: {data.get('source_url', 'N/A')}")
                        print(f"  - 발행일: {data.get('published_date', 'N/A')}")
                        print(f"  - 수집 AI: {data.get('collector_ai', 'N/A')}")
                except:
                    print(f"\n▶ 원본 데이터: 조회 실패")

        # 통계
        print(f"\n{'='*80}")
        print(f"[평가 통계]")
        print(f"{'='*80}")

        ratings = [ev.get('rating') for ev in result.data]
        scores = [ev.get('score', 0) for ev in result.data]

        # 등급 분포
        rating_counts = {}
        for r in ratings:
            rating_counts[r] = rating_counts.get(r, 0) + 1

        print(f"\n등급 분포:")
        for rating in sorted(rating_counts.keys(), key=lambda x: int(x), reverse=True):
            count = rating_counts[rating]
            score = ev.get('score', 0)
            print(f"  {rating} ({score:+2d}점): {count}개")

        print(f"\n평균 점수: {sum(scores)/len(scores):.2f}")
        print(f"최고 등급: {max(ratings, key=lambda x: int(x))}")
        print(f"최저 등급: {min(ratings, key=lambda x: int(x))}")
        print(f"\n{'='*80}\n")

    except Exception as e:
        print(f"❌ 조회 실패: {e}\n")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    get_first_10_evaluations()
