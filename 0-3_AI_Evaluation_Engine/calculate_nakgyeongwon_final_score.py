#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
나경원 최종 점수 계산 스크립트
V6.2 프레임워크 기반 8단계 등급 체계
"""

import json
import os
from pathlib import Path

def calculate_item_score(rating_avg):
    """
    Rating 평균으로부터 Item Score 계산
    Formula: Item_Score = 7.0 + (rating_avg × 0.6)
    Range: 4.0 ~ 10.0
    """
    return 7.0 + (rating_avg * 0.6)

def calculate_category_score(item_scores):
    """
    7개 항목 점수의 평균 × 10 = Category Score
    Range: 40 ~ 100
    """
    if not item_scores:
        return 0
    avg = sum(item_scores) / len(item_scores)
    return avg * 10

def assign_grade(total_score):
    """
    총점으로부터 8단계 등급 부여
    """
    if total_score >= 925:
        return 'M', 'Mugunghwa', '🌺'
    elif total_score >= 850:
        return 'D', 'Diamond', '💎'
    elif total_score >= 775:
        return 'E', 'Emerald', '💚'
    elif total_score >= 700:
        return 'P', 'Platinum', '🥇'
    elif total_score >= 625:
        return 'G', 'Gold', '🥇'
    elif total_score >= 550:
        return 'S', 'Silver', '🥈'
    elif total_score >= 475:
        return 'B', 'Bronze', '🥉'
    else:
        return 'I', 'Iron', '⚫'

def main():
    # 결과 폴더 경로
    results_dir = Path("results_나경원_V6.2")

    print("=" * 80)
    print("나경원 의원 V6.2 최종 점수 계산")
    print("=" * 80)
    print()

    # 10개 분야 파일명 매핑
    category_files = {
        1: "category_1_전문성.json",
        2: "category_2_리더십.json",
        3: "category_3_비전.json",
        4: "category_4_청렴성.json",
        5: "category_5_윤리성.json",
        6: "category_6_책임감.json",
        7: "category_7_투명성.json",
        8: "category_8_소통능력.json",
        9: "category_9_대응성.json",
        10: "category_10_공익추구.json"
    }

    category_names = {
        1: "전문성",
        2: "리더십",
        3: "비전",
        4: "청렴성",
        5: "윤리성",
        6: "책임감",
        7: "투명성",
        8: "소통능력",
        9: "대응성",
        10: "공익추구"
    }

    all_category_scores = []
    category_details = []

    # 각 분야별 계산
    for cat_id, filename in sorted(category_files.items()):
        filepath = results_dir / filename

        if not filepath.exists():
            print(f"⚠️  분야 {cat_id} ({category_names[cat_id]}): 파일 없음")
            continue

        # JSON 파일 읽기
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        items = data.get('items', [])

        if not items or len(items) != 7:
            print(f"⚠️  분야 {cat_id} ({category_names[cat_id]}): 항목 수 오류 ({len(items)}개)")
            continue

        # 각 항목별 평균 rating 계산
        item_ratings = []
        item_scores = []

        for item in items:
            data_points = item.get('data_points', [])
            if not data_points:
                continue

            ratings = [dp.get('rating', 0) for dp in data_points if 'rating' in dp]
            if ratings:
                avg_rating = sum(ratings) / len(ratings)
                item_ratings.append(avg_rating)
                item_score = calculate_item_score(avg_rating)
                item_scores.append(item_score)

        if not item_ratings:
            print(f"⚠️  분야 {cat_id} ({category_names[cat_id]}): Rating 데이터 없음")
            continue

        # 분야 평균 rating 및 점수
        category_avg_rating = sum(item_ratings) / len(item_ratings)
        category_score = calculate_category_score(item_scores)

        all_category_scores.append(category_score)
        category_details.append({
            'id': cat_id,
            'name': category_names[cat_id],
            'avg_rating': category_avg_rating,
            'score': category_score,
            'item_count': len(item_ratings)
        })

        print(f"분야 {cat_id:2d}. {category_names[cat_id]:8s} | "
              f"평균 Rating: {category_avg_rating:+6.2f} | "
              f"점수: {category_score:6.2f}/100")

    print()
    print("=" * 80)

    # 최종 점수 계산
    if len(all_category_scores) != 10:
        print(f"⚠️  오류: 10개 분야 중 {len(all_category_scores)}개만 계산됨")
        return

    final_score = sum(all_category_scores)
    avg_category_score = final_score / 10

    # 전체 평균 rating 계산
    total_avg_rating = sum([d['avg_rating'] for d in category_details]) / 10

    # 등급 부여
    grade_code, grade_name, grade_emoji = assign_grade(final_score)

    print(f"전체 평균 Rating: {total_avg_rating:+.2f}")
    print(f"전체 평균 분야 점수: {avg_category_score:.2f}/100")
    print()
    print(f"🎯 최종 점수: {final_score:.2f}/1,000")
    print()
    print(f"🏅 등급: {grade_code} ({grade_name}) {grade_emoji}")
    print()
    print("=" * 80)

    # 상세 분석
    print()
    print("📊 분야별 상세 분석")
    print()

    # 강점 분야 (상위 3개)
    sorted_by_score = sorted(category_details, key=lambda x: x['score'], reverse=True)
    print("✅ 강점 분야 (상위 3개)")
    for i, cat in enumerate(sorted_by_score[:3], 1):
        print(f"  {i}. {cat['name']:8s}: {cat['score']:.2f}점 (Rating: {cat['avg_rating']:+.2f})")

    print()

    # 약점 분야 (하위 3개)
    print("⚠️  약점 분야 (하위 3개)")
    for i, cat in enumerate(sorted_by_score[-3:][::-1], 1):
        print(f"  {i}. {cat['name']:8s}: {cat['score']:.2f}점 (Rating: {cat['avg_rating']:+.2f})")

    print()
    print("=" * 80)

    # 등급별 기준점과 비교
    print()
    print("📈 등급 기준점 비교")
    print()

    grade_thresholds = [
        ('M', 'Mugunghwa', '🌺', 925),
        ('D', 'Diamond', '💎', 850),
        ('E', 'Emerald', '💚', 775),
        ('P', 'Platinum', '🥇', 700),
        ('G', 'Gold', '🥇', 625),
        ('S', 'Silver', '🥈', 550),
        ('B', 'Bronze', '🥉', 475),
        ('I', 'Iron', '⚫', 400)
    ]

    for code, name, emoji, threshold in grade_thresholds:
        diff = final_score - threshold
        if code == grade_code:
            status = "✅ 현재 등급"
        elif diff >= 0:
            status = f"✓ 통과 (+{diff:.0f}점)"
        else:
            status = f"✗ 미달 ({diff:.0f}점)"

        print(f"{code} ({name:10s}) {emoji} {threshold:4d}점 | {status}")

    print()
    print("=" * 80)

    # JSON 결과 저장
    result = {
        'politician_name': '나경원',
        'evaluation_date': '2025-10-31',
        'framework_version': 'V6.2',
        'final_score': round(final_score, 2),
        'grade_code': grade_code,
        'grade_name': grade_name,
        'grade_emoji': grade_emoji,
        'total_avg_rating': round(total_avg_rating, 2),
        'avg_category_score': round(avg_category_score, 2),
        'category_details': [
            {
                'id': d['id'],
                'name': d['name'],
                'avg_rating': round(d['avg_rating'], 2),
                'score': round(d['score'], 2)
            }
            for d in category_details
        ]
    }

    output_file = results_dir / "나경원_최종점수_V6.2.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✅ 결과 저장: {output_file}")
    print()

if __name__ == '__main__':
    main()
