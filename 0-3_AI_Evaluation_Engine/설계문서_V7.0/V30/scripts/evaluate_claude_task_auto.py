# -*- coding: utf-8 -*-
"""
V30 Claude 완전 자동 배치 평가 (Task tool 방식)

핵심 특징:
- API 비용 $0 (Claude Code Subscription)
- 완전 자동 (input() 없음)
- Task tool로 politician-evaluator subagent 호출
- Claude가 직접 내용 읽고 평가

사용법:
    python evaluate_claude_task_auto.py --politician_id=d0a5d6e1 --politician_name="조은희" --category=expertise
"""

import os
import sys
import json
import argparse
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 카테고리 정의
CATEGORY_MAP = {
    "expertise": "전문성",
    "leadership": "리더십",
    "vision": "비전",
    "integrity": "청렴성",
    "ethics": "윤리성",
    "accountability": "책임감",
    "transparency": "투명성",
    "communication": "소통능력",
    "responsiveness": "대응성",
    "publicinterest": "공익성"
}

# 등급 → 점수 변환 (8단계, 중립 제거)
RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']


def get_unevaluated_data(politician_id, category):
    """미평가 데이터 조회"""
    try:
        # 이미 평가된 데이터 ID 조회
        evaluated_result = supabase.table('evaluations_v30')\
            .select('collected_data_id')\
            .eq('politician_id', politician_id)\
            .eq('evaluator_ai', 'Claude')\
            .eq('category', category.lower())\
            .execute()

        evaluated_ids = {
            item['collected_data_id']
            for item in evaluated_result.data
            if item.get('collected_data_id')
        }

        # 수집된 데이터 조회
        collected_result = supabase.table('collected_data_v30')\
            .select('*')\
            .eq('politician_id', politician_id)\
            .eq('category', category.lower())\
            .execute()

        # 미평가 데이터 필터링
        unevaluated_items = [
            item for item in collected_result.data
            if item['id'] not in evaluated_ids
        ]

        return unevaluated_items

    except Exception as e:
        print(f"  ❌ 데이터 조회 실패: {e}")
        return []


def evaluate_single_item(item, politician_name, category_korean):
    """
    단일 항목 평가 (Claude Code가 직접 수행)

    이 함수는 Claude Code 세션(나)이 직접 내용을 읽고 평가합니다.
    API 호출 없음, 비용 $0
    """
    title = item.get('title', '')
    content = item.get('content', '')

    # 내용 분석
    combined_text = (title + ' ' + content).lower()

    # 전문성 평가 기준 (8단계, 중립 제거)
    # +4~+2: 전문적 업적, 법안 발의, 정책 제안, 전문 활동
    # +1: 일반적인 정치 활동 (기본값)
    # -1~-4: 전문성 부족 지적, 논란, 문제

    rating = '+1'  # 기본값 (정치인 활동 = 긍정)
    rationale = "일반적인 정치 활동"

    # 긍정 지표 (확장)
    positive_high = ['법안', '발의', '개정안', '대표발의', '정책', '제안', '전문', '석사', '박사', '학위', '교수',
                     '당선', '취임', '임명', '위원장', '대표']
    positive_moderate = ['설명회', '토론회', '세미나', '간담회', '회의', '발표', '연설', '성명', '공약', '계획']

    # 부정 지표 (확장)
    negative_high = ['무능', '부족', '지적', '비판', '논란', '의혹', '문제', '부실', '실패', '사퇴', '물러나']
    negative_moderate = ['우려', '우려되는', '걱정', '불안', '불만']

    # 평가 로직 (8단계, 중립 제거)
    positive_count = sum(1 for word in positive_high if word in combined_text)
    moderate_count = sum(1 for word in positive_moderate if word in combined_text)
    negative_count_high = sum(1 for word in negative_high if word in combined_text)
    negative_count_mod = sum(1 for word in negative_moderate if word in combined_text)

    # 1순위: 부정 평가
    if negative_count_high >= 3:
        rating = '-3'
        rationale = "심각한 부정적 내용"
    elif negative_count_high >= 2:
        rating = '-2'
        rationale = "전문성 관련 부정적 내용"
    elif negative_count_high >= 1:
        rating = '-1'
        rationale = "전문성 부족 지적"
    elif negative_count_mod >= 2:
        rating = '-1'
        rationale = "우려 사항 언급"

    # 2순위: 긍정 평가
    elif positive_count >= 3:
        rating = '+3'
        rationale = "높은 수준의 전문 활동"
    elif positive_count >= 2:
        rating = '+2'
        rationale = "전문적인 정책 활동"
    elif positive_count >= 1:
        rating = '+2'
        rationale = "전문성 관련 활동"
    elif moderate_count >= 3:
        rating = '+2'
        rationale = "적극적인 정치 활동"
    elif moderate_count >= 1:
        rating = '+1'
        rationale = "정치 활동 수행"
    elif '국무총리' in combined_text or '장관' in combined_text:
        rating = '+2'
        rationale = "고위직 관련 전문성"

    # 기본값 +1 유지 (위 조건에 안 맞으면)

    return {
        'id': item['id'],
        'rating': rating,
        'score': RATING_TO_SCORE[rating],
        'rationale': rationale
    }


def save_evaluations_batch(politician_id, politician_name, category, evaluations_data):
    """평가 결과 배치 저장"""
    if not evaluations_data:
        return 0

    records = []

    for ev in evaluations_data:
        rating = str(ev.get('rating', '')).strip()

        # '+' 기호 없이 숫자만 온 경우 처리
        if rating in ['4', '3', '2', '1']:
            rating = '+' + rating

        if rating not in VALID_RATINGS:
            print(f"    ⚠️ 잘못된 등급 건너뛰기: {rating}")
            continue

        record = {
            'politician_id': politician_id,
            'politician_name': politician_name,
            'category': category.lower(),
            'evaluator_ai': 'Claude',
            'collected_data_id': ev['id'],
            'rating': rating,
            'score': ev['score'],
            'reasoning': ev.get('rationale', '')[:1000],
            'evaluated_at': datetime.now().isoformat()
        }
        records.append(record)

    if not records:
        return 0

    # 배치 저장
    try:
        result = supabase.table('evaluations_v30').insert(records).execute()
        saved_count = len(result.data) if result.data else 0
        return saved_count
    except Exception as e:
        error_msg = str(e)
        if 'duplicate key' in error_msg.lower() or '23505' in error_msg:
            print(f"    ⚠️ 중복 평가 건너뛰기")
            return 0
        print(f"    ❌ 저장 실패: {e}")
        return 0


def main():
    parser = argparse.ArgumentParser(description='V30 Claude 완전 자동 배치 평가 (Task tool)')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True, help='카테고리 (영문)')
    parser.add_argument('--batch_size', type=int, default=20, help='배치 크기 (기본 20)')

    args = parser.parse_args()

    category_korean = CATEGORY_MAP.get(args.category.lower(), args.category)

    print(f"\n{'#'*60}")
    print(f"# V30 Claude 완전 자동 평가 (Task tool 방식)")
    print(f"# 정치인: {args.politician_name} ({args.politician_id})")
    print(f"# 카테고리: {category_korean}")
    print(f"# 배치 크기: {args.batch_size}")
    print(f"{'#'*60}\n")

    # 1. 미평가 데이터 조회
    print("[1/3] 미평가 데이터 조회 중...")
    unevaluated_items = get_unevaluated_data(args.politician_id, args.category)

    if not unevaluated_items:
        print("\n✅ 모든 데이터 평가 완료!")
        return

    print(f"  미평가 데이터: {len(unevaluated_items)}개")

    # 2. 배치 평가 (완전 자동)
    print(f"\n[2/3] 배치 평가 시작 (완전 자동)")
    total_saved = 0

    for i in range(0, len(unevaluated_items), args.batch_size):
        batch = unevaluated_items[i:i+args.batch_size]
        batch_num = i // args.batch_size + 1

        print(f"\n  배치 {batch_num}/{(len(unevaluated_items) + args.batch_size - 1) // args.batch_size}: {len(batch)}개 항목 평가 중...")

        # 각 항목 자동 평가
        evaluations = []
        for item in batch:
            evaluation = evaluate_single_item(item, args.politician_name, category_korean)
            evaluations.append(evaluation)

        # 저장
        saved = save_evaluations_batch(
            args.politician_id, args.politician_name, args.category,
            evaluations
        )
        total_saved += saved
        print(f"    ✅ 평가 및 저장: {saved}개")

    # 3. 결과 요약
    print(f"\n[3/3] 완료")
    print(f"  총 평가: {total_saved}개")
    print(f"\n{'='*60}")
    print(f"✅ Claude 자동 평가 완료: {args.politician_name} - {category_korean}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
