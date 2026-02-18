#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V30 7개 카테고리 평가 결과 요약 생성
"""

import os
import sys
import json
from collections import Counter

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

CATEGORIES = [
    ('integrity', '청렴성'),
    ('ethics', '윤리성'),
    ('accountability', '책임성'),
    ('transparency', '투명성'),
    ('communication', '소통능력'),
    ('responsiveness', '대응성'),
    ('publicinterest', '공익추구')
]


def analyze_category(category, cat_kor):
    """카테고리 평가 결과 분석"""
    result_file = os.path.join(SCRIPT_DIR, f"eval_{category}_result.json")

    if not os.path.exists(result_file):
        return None

    with open(result_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    evaluations = data.get('evaluations', [])

    if not evaluations:
        return None

    # 통계 계산
    ratings = [e['rating'] for e in evaluations]
    scores = [e['score'] for e in evaluations]

    rating_counts = Counter(ratings)
    avg_score = sum(scores) / len(scores) if scores else 0

    return {
        'category': category,
        'category_kor': cat_kor,
        'total': len(evaluations),
        'avg_score': avg_score,
        'rating_counts': dict(rating_counts),
        'scores': scores
    }


def main():
    """전체 요약 생성"""
    print("="*80)
    print("V30 김민석 - 7개 카테고리 평가 결과 요약")
    print("="*80)

    all_results = []

    for category, cat_kor in CATEGORIES:
        result = analyze_category(category, cat_kor)
        if result:
            all_results.append(result)

    # 카테고리별 요약
    print(f"\n{'카테고리':<15} {'평가수':>8} {'평균점수':>10} {'등급 분포'}")
    print("-"*80)

    total_evaluations = 0
    total_score = 0

    for res in all_results:
        total_evaluations += res['total']
        total_score += sum(res['scores'])

        # 등급 분포
        rating_dist = []
        for rating in ['+4', '+3', '+2', '+1', '0', '-1', '-2', '-3', '-4']:
            count = res['rating_counts'].get(rating, 0)
            if count > 0:
                rating_dist.append(f"{rating}({count})")

        print(f"{res['category_kor']:<15} {res['total']:>8} {res['avg_score']:>10.2f} {', '.join(rating_dist)}")

    # 전체 요약
    print("-"*80)
    overall_avg = total_score / total_evaluations if total_evaluations > 0 else 0
    print(f"{'전체':<15} {total_evaluations:>8} {overall_avg:>10.2f}")

    # 상세 통계
    print(f"\n{'='*80}")
    print("상세 통계")
    print(f"{'='*80}\n")

    for res in all_results:
        print(f"[{res['category_kor']}]")
        print(f"  총 평가: {res['total']}개")
        print(f"  평균 점수: {res['avg_score']:.2f}")
        print(f"  등급 분포:")
        for rating in ['+4', '+3', '+2', '+1', '0', '-1', '-2', '-3', '-4']:
            count = res['rating_counts'].get(rating, 0)
            if count > 0:
                pct = (count / res['total']) * 100
                print(f"    {rating}: {count:>3}개 ({pct:>5.1f}%)")
        print()

    # 평가 결과 해석
    print(f"{'='*80}")
    print("평가 결과 해석 (V30 기준)")
    print(f"{'='*80}\n")

    print("✅ 완료된 카테고리: 7개")
    print("   - integrity (청렴성)")
    print("   - ethics (윤리성)")
    print("   - accountability (책임성)")
    print("   - transparency (투명성)")
    print("   - communication (소통능력)")
    print("   - responsiveness (대응성)")
    print("   - publicinterest (공익추구)")

    print(f"\n총 평가 항목: {total_evaluations}개")
    print(f"전체 평균 점수: {overall_avg:.2f}")

    if overall_avg > 2:
        print("\n📊 종합 평가: 긍정적")
    elif overall_avg > 0:
        print("\n📊 종합 평가: 다소 긍정적")
    elif overall_avg == 0:
        print("\n📊 종합 평가: 중립적")
    elif overall_avg > -2:
        print("\n📊 종합 평가: 다소 부정적")
    else:
        print("\n📊 종합 평가: 부정적")

    print(f"\n{'='*80}")


if __name__ == "__main__":
    main()
