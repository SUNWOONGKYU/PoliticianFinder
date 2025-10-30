#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
점수 재계산 스크립트
Prior 7.0 → 6.0, 편차 ±3 → ±4로 변경
"""

import json

def calculate_bayesian_score_v5(scores, count):
    """V5.0: Prior 6.0, 편차 ±4"""
    if count == 0:
        return 6.0

    total_sum = sum(scores)
    deviation = (total_sum * 4) / (10 * count)
    final_score = 6.0 + deviation
    final_score = max(2.0, min(10.0, final_score))

    return final_score

def main():
    json_file = "G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/AI_Evaluation_Engine/results_oh_sehoon_20251026_182403.json"

    print("Loading JSON file...")
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Original total_score: {data['total_score']:.2f}")

    # 각 항목 점수 재계산
    for cat_id, cat in data['categories'].items():
        for item in cat['items']:
            # 개별 데이터 점수 추출
            scores = [d['score'] * 10 for d in item['data']]  # -10~+10 범위로 복원
            count = item['data_count']

            # V5.0 공식으로 재계산
            new_score = calculate_bayesian_score_v5(scores, count)

            print(f"Category {cat_id}, Item {item['item_num']}: {item['item_score']:.2f} -> {new_score:.2f}")

            item['item_score'] = new_score

        # 분야 점수 재계산 (항목 평균)
        item_scores = [item['item_score'] for item in cat['items']]
        cat['category_score'] = sum(item_scores) / len(item_scores)

        print(f"Category {cat_id} total: {cat['category_score']:.2f}")

    # 최종 점수 재계산
    category_scores = [data['categories'][str(i)]['category_score'] for i in range(1, 11)]
    new_total = sum(category_scores)

    print(f"\nNew total_score: {new_total:.2f}")

    # 등급 재계산
    def get_grade(score):
        if score >= 93: return 'M', 'Mugunghwa', '🌺'
        elif score >= 86: return 'D', 'Diamond', '💎'
        elif score >= 79: return 'E', 'Emerald', '💚'
        elif score >= 72: return 'P', 'Platinum', '🥇'
        elif score >= 65: return 'G', 'Gold', '🥇'
        elif score >= 58: return 'S', 'Silver', '🥈'
        elif score >= 51: return 'B', 'Bronze', '🥉'
        elif score >= 44: return 'I', 'Iron', '⚫'
        else: return 'F', 'Fail', '❌'

    code, name, emoji = get_grade(new_total)

    print(f"New grade: {code} - {name}")

    # 업데이트
    data['total_score'] = new_total
    data['grade'] = {
        'code': code,
        'name': name,
        'emoji': emoji
    }

    # 저장
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("\nJSON file updated successfully!")
    print(f"Total score: {new_total:.2f}")
    print(f"Grade: {code} - {name}")

if __name__ == "__main__":
    main()
