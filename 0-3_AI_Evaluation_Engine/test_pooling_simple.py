#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
간편 데이터 풀링 테스트
- 김동연 Expertise 카테고리로 현재 방식 vs 풀링 방식 비교
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv
from difflib import SequenceMatcher

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

POLITICIAN_ID = "0756ec15"
POLITICIAN_NAME = "김동연"
CATEGORY = "Expertise"

ALPHABET_GRADES = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}

def similarity(a, b):
    """두 문자열 유사도 계산 (0.0 ~ 1.0)"""
    return SequenceMatcher(None, a, b).ratio()

def get_all_data():
    """150개 데이터 전부 가져오기"""
    print(f"\n[Step 1] {CATEGORY} 카테고리 데이터 수집 중...")

    response = supabase.table('collected_data').select('*').eq(
        'politician_id', POLITICIAN_ID
    ).eq('category_name', CATEGORY).execute()

    print(f"✅ 총 {len(response.data)}개 항목 수집 완료")
    return response.data

def find_duplicates(items, threshold=0.85):
    """중복 그룹 탐지 (URL + 내용 유사도 기반)"""
    print(f"\n[Step 2] 중복 탐지 중 (URL 기반 + 내용 유사도 95%)...")

    groups = []
    used = set()

    for i, item1 in enumerate(items):
        if i in used:
            continue

        group = [item1]
        used.add(i)

        for j, item2 in enumerate(items):
            if j <= i or j in used:
                continue

            # URL 기준 중복 (가장 정확)
            url1 = item1.get('source_url', '').strip()
            url2 = item2.get('source_url', '').strip()

            is_duplicate = False

            # URL이 동일하면 확실한 중복
            if url1 and url2 and url1 == url2:
                is_duplicate = True
            else:
                # URL이 다르면 내용 유사도로 판단
                content1 = item1.get('data_content', '')
                content2 = item2.get('data_content', '')

                if content1 and content2:
                    sim = similarity(content1[:500], content2[:500])  # 앞 500자만 비교
                    if sim >= 0.95:  # 내용 유사도는 높게 설정
                        is_duplicate = True

            if is_duplicate:
                group.append(item2)
                used.add(j)

        groups.append(group)

    # 통계
    dup_1 = sum(1 for g in groups if len(g) == 1)
    dup_2 = sum(1 for g in groups if len(g) == 2)
    dup_3 = sum(1 for g in groups if len(g) >= 3)

    print(f"✅ 중복 탐지 완료:")
    print(f"   - 유니크 항목 (중복 1회): {dup_1}개")
    print(f"   - 중복 2회 그룹: {dup_2}개")
    print(f"   - 중복 3회 이상 그룹: {dup_3}개")
    print(f"   - 총 그룹 수: {len(groups)}개")

    return groups

def calculate_current_scores(items):
    """현재 방식 점수 계산 (AI별 개별)"""
    print(f"\n[Step 3] 현재 방식 점수 계산...")

    scores = {}
    for ai_name in ["ChatGPT", "Grok", "claude-3-5-haiku-20241022"]:
        ai_items = [item for item in items if item['ai_name'] == ai_name]

        total = 0
        count = 0
        for item in ai_items:
            rating = item.get('rating', '').strip().upper()
            if rating in ALPHABET_GRADES:
                total += ALPHABET_GRADES[rating]
                count += 1

        if count > 0:
            avg = total / count
            score = (6.0 + avg * 0.5) * 10
            display_name = "Claude" if ai_name.startswith("claude") else ai_name
            scores[display_name] = {
                'score': score,
                'avg_rating': avg,
                'count': count
            }
            print(f"   {display_name:10s}: {score:5.1f}점 (평균 {avg:+5.2f}, 항목 {count}개)")

    return scores

def calculate_pooled_score(groups):
    """풀링 방식 점수 계산"""
    print(f"\n[Step 4] 풀링 방식 점수 계산...")

    total = 0
    valid_groups = 0

    for group in groups:
        # 그룹 내 모든 rating 수집
        ratings = []
        for item in group:
            rating = item.get('rating', '').strip().upper()
            if rating in ALPHABET_GRADES:
                ratings.append(ALPHABET_GRADES[rating])

        if not ratings:
            continue

        # 평균 rating
        avg_rating = sum(ratings) / len(ratings)

        # 가중치 = 중복 횟수
        weight = len(group)

        # 가중 점수
        weighted_score = avg_rating * weight
        total += weighted_score
        valid_groups += 1

    # 최종 점수 (V24 알고리즘)
    if valid_groups > 0:
        category_avg = total / sum(len(g) for g in groups)  # 전체 항목 수로 나눔
        final_score = (6.0 + category_avg * 0.5) * 10
    else:
        final_score = 0

    print(f"✅ 풀링 점수: {final_score:.1f}점")
    print(f"   - 유효 그룹: {valid_groups}개")
    print(f"   - 평균 rating: {category_avg:+.2f}")

    return final_score

def show_duplicate_examples(groups, top_n=5):
    """중복 예시 출력"""
    print(f"\n[참고] 중복 3회 예시 (상위 {top_n}개):")

    dup_3_groups = [g for g in groups if len(g) >= 3]
    dup_3_groups.sort(key=lambda g: len(g), reverse=True)

    for i, group in enumerate(dup_3_groups[:top_n], 1):
        print(f"\n{i}. {group[0]['data_title'][:50]}...")
        print(f"   중복 {len(group)}회:")
        for item in group:
            rating = item.get('rating', 'N/A')
            ai_name = "Claude" if item['ai_name'].startswith("claude") else item['ai_name']
            print(f"      - {ai_name:10s}: {rating}등급")

def main():
    print("="*80)
    print(f"데이터 풀링 시스템 - 간편 테스트")
    print(f"정치인: {POLITICIAN_NAME} | 카테고리: {CATEGORY}")
    print("="*80)

    # Step 1: 데이터 수집
    all_items = get_all_data()

    # Step 2: 중복 탐지
    groups = find_duplicates(all_items)

    # Step 3: 현재 방식 점수
    current_scores = calculate_current_scores(all_items)

    # Step 4: 풀링 방식 점수
    pooled_score = calculate_pooled_score(groups)

    # Step 5: 비교 분석
    print(f"\n{'='*80}")
    print("결과 비교")
    print(f"{'='*80}")

    print(f"\n현재 방식 (AI별 개별 점수):")
    for ai, data in current_scores.items():
        print(f"  {ai:10s}: {data['score']:5.1f}점")

    print(f"\n풀링 방식 (통합 점수):")
    print(f"  통합:       {pooled_score:5.1f}점")

    # 차이 분석
    avg_current = sum(d['score'] for d in current_scores.values()) / len(current_scores)
    diff = pooled_score - avg_current

    print(f"\n분석:")
    print(f"  현재 방식 평균: {avg_current:.1f}점")
    print(f"  풀링 방식:      {pooled_score:.1f}점")
    print(f"  차이:          {diff:+.1f}점")

    # 중복 예시
    show_duplicate_examples(groups)

    print(f"\n{'='*80}")
    print("테스트 완료!")
    print(f"{'='*80}")

if __name__ == "__main__":
    main()
