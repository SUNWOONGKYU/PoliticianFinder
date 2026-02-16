# -*- coding: utf-8 -*-
"""
V40 점수 계산 스크립트

핵심 (V40):
1. 4개 AI 평가 결과 종합 (풀링 평가)
   - Claude Haiku 4.5 (저렴한 모델)
   - ChatGPT gpt-5.1-codex-mini
   - Gemini 2.0 Flash
   - Grok 3
2. 등급 체계: +4 ~ -4 (점수 = 등급 × 2)
3. 카테고리별 점수 계산 (20~100점)
4. 최종 점수 계산 (200~1000점)
5. 10단계 등급 산정 (M, D, E, P, G, S, B, I, Tn, L)

점수 계산 과정 (4단계):
[Step 1] 등급(Rating) 평균 구하기
    - AI가 한 카테고리에서 여러 데이터 평가
    - 각 평가의 Rating 합산 (X 제외)
    - Rating 평균 계산 (-4 ~ +4 범위)
    예: ChatGPT 전문성 Rating 평균 = 2.77

[Step 2] 점수(Score)로 환산
    - Score = Rating 평균 × 2
    - Score 범위: -8 ~ +8
    예: 2.77 × 2 = 5.54점

[Step 3] 카테고리 점수 계산
    - 공식: (Score × 0.5 + 6.0) × 10
    - PRIOR = 6.0, COEFFICIENT = 0.5
    - 범위: 20 ~ 100점
    예: (5.54 × 0.5 + 6.0) × 10 = 87.7 ≈ 88점

[Step 4] 최종 점수 계산
    - 10개 카테고리 점수 합산
    - 범위: 200 ~ 1000점
    예: 88 + 87 + 90 + ... (10개) = 881점

등급 기준 (10단계):
- M (Mugunghwa): 920~1000점
- D (Diamond): 840~919점
- E (Emerald): 760~839점
- P (Platinum): 680~759점
- G (Gold): 600~679점
- S (Silver): 520~599점
- B (Bronze): 440~519점
- I (Iron): 360~439점
- Tn (Tin): 280~359점
- L (Lead): 200~279점

사용법:
    python calculate_v40_scores.py --politician_id=62e7b453 --politician_name="오세훈"
"""

import os
import sys
import argparse
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 테이블명
TABLE_EVALUATIONS = "evaluations_v40"
TABLE_CATEGORY_SCORES = "ai_category_scores_v40"
TABLE_FINAL_SCORES = "ai_final_scores_v40"

# 점수 계산 상수
PRIOR = 6.0
COEFFICIENT = 0.5

# 카테고리 정의 (V40 기준)
CATEGORIES = [
    ("expertise", "전문성"),
    ("leadership", "리더십"),
    ("vision", "비전"),
    ("integrity", "청렴성"),
    ("ethics", "윤리성"),
    ("accountability", "책임감"),
    ("transparency", "투명성"),
    ("communication", "소통능력"),
    ("responsiveness", "대응성"),
    ("publicinterest", "공익성")
]

# 평가 AI (4개)
EVALUATION_AIS = ["Claude", "ChatGPT", "Gemini", "Grok"]

# V40 등급 → 점수 변환 (점수 = 등급 × 2)
# ⚠️ 이 매핑은 calculate_v40_scores.py에만 존재 (단독 책임)
# evaluate_v40.py, claude_eval_helper.py, gemini_eval_helper.py는 rating만 저장
RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8,
    'X': 0  # 평가 제외 판정 (모수에서 제외됨)
}

# 10단계 등급 체계
GRADE_BOUNDARIES = [
    (920, 1000, 'M', 'Mugunghwa'),   # 최우수
    (840, 919, 'D', 'Diamond'),      # 우수
    (760, 839, 'E', 'Emerald'),      # 양호
    (680, 759, 'P', 'Platinum'),     # 보통+
    (600, 679, 'G', 'Gold'),         # 보통
    (520, 599, 'S', 'Silver'),       # 보통-
    (440, 519, 'B', 'Bronze'),       # 미흡
    (360, 439, 'I', 'Iron'),         # 부족
    (280, 359, 'Tn', 'Tin'),         # 상당히 부족
    (200, 279, 'L', 'Lead')          # 매우 부족
]


def get_grade(score):
    """점수에 따른 등급 반환 (10단계)"""
    for min_score, max_score, grade_code, grade_name in GRADE_BOUNDARIES:
        if min_score <= score <= max_score:
            return grade_code, grade_name
    return 'L', 'Lead'


def get_evaluations(politician_id, category=None):
    """평가 결과 조회 (페이지네이션 - Supabase 1,000행 제한 대응)"""
    try:
        all_rows = []
        offset = 0
        page_size = 1000
        while True:
            query = supabase.table(TABLE_EVALUATIONS)\
                .select('*')\
                .eq('politician_id', politician_id)

            if category:
                query = query.eq('category', category.lower())

            result = query.range(offset, offset + page_size - 1).execute()
            batch = result.data or []
            all_rows.extend(batch)
            if len(batch) < page_size:
                break
            offset += page_size

        return all_rows
    except Exception as e:
        print(f"  ⚠️ 평가 조회 실패: {e}")
        return []


def calculate_category_score(avg_score):
    """카테고리 점수 계산 (Step 3)

    입력: avg_score (점수, Score 평균)
        - Rating 평균 × 2로 계산된 값
        - 범위: -8 ~ +8
        - 예: Rating 평균 2.77 → Score 5.54

    공식: (avg_score × COEFFICIENT + PRIOR) × 10
        - COEFFICIENT = 0.5
        - PRIOR = 6.0

    출력: 카테고리 점수
        - 범위: 20 ~ 100점
        - 예: (5.54 × 0.5 + 6.0) × 10 = 87.7 ≈ 88점
    """
    score = (PRIOR + avg_score * COEFFICIENT) * 10
    # 20~100 범위 제한
    return max(20, min(100, round(score)))


def calculate_scores(politician_id, politician_name):
    """전체 점수 계산"""
    print(f"\n{'#'*60}")
    print(f"# V40 점수 계산: {politician_name} ({politician_id})")
    print(f"# 등급 체계: +4 ~ -4 (V40 기준)")
    print(f"{'#'*60}")

    category_scores = {}
    ai_category_details = {}
    ai_category_scores = {ai: {} for ai in EVALUATION_AIS}  # AI별 카테고리 점수

    # 카테고리별 점수 계산
    for cat_name, cat_korean in CATEGORIES:
        print(f"\n[{cat_korean}] 점수 계산 중...")

        evaluations = get_evaluations(politician_id, cat_name)

        if not evaluations:
            print(f"  ⚠️ 평가 데이터 없음 → leverage score 0 처리 ({int(PRIOR * 10)}점)")
            category_scores[cat_name] = int(PRIOR * 10)  # leverage score = 0
            continue

        # 재수집 포기 규칙: 평가 25개 미만 → leverage score 0 처리
        GIVE_UP_THRESHOLD = 25
        if len(evaluations) < GIVE_UP_THRESHOLD:
            print(f"  ⚠️ 평가 {len(evaluations)}개 < {GIVE_UP_THRESHOLD}개 → leverage score 0 처리 ({int(PRIOR * 10)}점)")
            category_scores[cat_name] = int(PRIOR * 10)  # leverage score = 0
            continue

        # AI별 점수 수집 — rating에서 직접 계산 (DB score 사용 안 함)
        ai_scores = {}
        ai_excluded_counts = {}  # X 판정 개수 추적
        for eval_data in evaluations:
            ai_name = eval_data.get('evaluator_ai')
            rating = str(eval_data.get('rating', '+1')).strip().upper()

            # X 판정은 모수에서 제외
            if rating == 'X':
                if ai_name not in ai_excluded_counts:
                    ai_excluded_counts[ai_name] = 0
                ai_excluded_counts[ai_name] += 1
                continue  # ai_scores에 추가하지 않음

            # ✅ rating에서 직접 score 계산 (단독 책임)
            if rating not in RATING_TO_SCORE:
                print(f"  ⚠️ 알 수 없는 등급 '{rating}' → +1(2점) 기본값 적용 (AI: {ai_name})")
            score = RATING_TO_SCORE.get(rating, 2)  # 기본값 +1 → 2점

            if ai_name not in ai_scores:
                ai_scores[ai_name] = []
            ai_scores[ai_name].append({
                'rating': rating,
                'score': score
            })

        # AI별 평균 계산 및 AI별 카테고리 점수 계산
        ai_averages = {}
        for ai_name, scores in ai_scores.items():
            if not scores:  # 모두 X 판정인 경우
                print(f"  [{ai_name}] 모든 평가 제외됨 (X 판정)")
                continue

            avg = sum(s['score'] for s in scores) / len(scores)
            ai_averages[ai_name] = avg
            # AI별 카테고리 점수 계산
            ai_cat_score = calculate_category_score(avg)
            ai_category_scores[ai_name][cat_name] = ai_cat_score

            # 제외된 개수 표시
            excluded = ai_excluded_counts.get(ai_name, 0)
            if excluded > 0:
                print(f"  [{ai_name}] 평균: {avg:+.2f}점 → {ai_cat_score}점 (제외: {excluded}개)")
            else:
                print(f"  [{ai_name}] 평균: {avg:+.2f}점 → {ai_cat_score}점")

        # 전체 평균 (4개 AI 평균의 평균)
        if ai_averages:
            overall_avg = sum(ai_averages.values()) / len(ai_averages)
        else:
            overall_avg = 0.0  # 기본값 (중립)

        # 카테고리 점수 계산
        cat_score = calculate_category_score(overall_avg)
        category_scores[cat_name] = cat_score
        ai_category_details[cat_name] = ai_averages

        print(f"  📊 전체 평균: {overall_avg:+.2f} → 카테고리 점수: {cat_score}점")

    # AI별 최종 점수 계산
    ai_final_scores = {}
    for ai_name in EVALUATION_AIS:
        if ai_category_scores[ai_name]:
            ai_total = sum(ai_category_scores[ai_name].values())
            ai_total = max(200, min(1000, ai_total))
            ai_final_scores[ai_name] = ai_total
        else:
            ai_final_scores[ai_name] = 600  # 기본값

    # 최종 점수 계산
    final_score = sum(category_scores.values())
    final_score = max(200, min(1000, final_score))  # 200~1000 범위
    grade_code, grade_name = get_grade(final_score)

    print(f"\n{'='*60}")
    print(f"📊 카테고리별 점수")
    print(f"{'='*60}")
    for cat_name, cat_korean in CATEGORIES:
        score = category_scores.get(cat_name, 60)
        print(f"  {cat_korean}: {score}점")

    print(f"\n{'='*60}")
    print(f"🤖 AI별 최종 점수")
    print(f"{'='*60}")
    for ai_name in EVALUATION_AIS:
        ai_score = ai_final_scores.get(ai_name, 600)
        ai_grade, ai_grade_name = get_grade(ai_score)
        print(f"  {ai_name:10} {ai_score:4}점 ({ai_grade} - {ai_grade_name})")

    print(f"\n{'='*60}")
    print(f"🏆 최종 결과 (4 AIs 평균)")
    print(f"{'='*60}")
    print(f"  최종 점수: {final_score}점")
    print(f"  등급: {grade_code} ({grade_name})")

    # DB 저장
    save_scores_to_db(politician_id, politician_name, category_scores, ai_category_details,
                      ai_category_scores, ai_final_scores, final_score, grade_code, grade_name)

    return {
        'politician_id': politician_id,
        'politician_name': politician_name,
        'category_scores': category_scores,
        'ai_category_scores': ai_category_scores,
        'ai_final_scores': ai_final_scores,
        'final_score': final_score,
        'grade_code': grade_code,
        'grade_name': grade_name
    }


def save_scores_to_db(politician_id, politician_name, category_scores, ai_details,
                      ai_category_scores, ai_final_scores, final_score, grade_code, grade_name):
    """점수를 DB에 저장"""
    timestamp = datetime.now().isoformat()

    # 카테고리별 점수 저장
    for cat_name, score in category_scores.items():
        try:
            # 기존 데이터 삭제
            supabase.table(TABLE_CATEGORY_SCORES)\
                .delete()\
                .eq('politician_id', politician_id)\
                .eq('category', cat_name)\
                .execute()

            # 새 데이터 삽입
            record = {
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': cat_name,
                'score': score,
                'ai_details': ai_details.get(cat_name, {}),
                'calculated_at': timestamp
            }
            supabase.table(TABLE_CATEGORY_SCORES).insert(record).execute()
        except Exception as e:
            print(f"  ⚠️ 카테고리 점수 저장 실패 ({cat_name}): {e}")

    # 최종 점수 저장
    try:
        # 기존 데이터 삭제
        supabase.table(TABLE_FINAL_SCORES)\
            .delete()\
            .eq('politician_id', politician_id)\
            .execute()

        # 새 데이터 삽입
        record = {
            'politician_id': politician_id,
            'politician_name': politician_name,
            'final_score': final_score,
            'grade': grade_code,
            'grade_name': grade_name,
            'category_scores': category_scores,
            'ai_category_scores': ai_category_scores,
            'ai_final_scores': ai_final_scores,
            'calculated_at': timestamp,
            'version': 'V40'
        }
        supabase.table(TABLE_FINAL_SCORES).insert(record).execute()
        print(f"\n  ✅ 최종 점수 저장 완료")
    except Exception as e:
        print(f"  ❌ 최종 점수 저장 실패: {e}")


def main():
    parser = argparse.ArgumentParser(description='V40 점수 계산')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')

    args = parser.parse_args()

    calculate_scores(args.politician_id, args.politician_name)


if __name__ == "__main__":
    main()
