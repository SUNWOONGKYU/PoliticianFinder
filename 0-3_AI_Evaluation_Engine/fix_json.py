#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json

# JSON 파일 로드
with open('G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/AI_Evaluation_Engine/results_oh_sehoon_20251026_182403.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 올바른 점수 계산
category_scores = [data['categories'][str(i)]['category_score'] for i in range(1, 11)]
correct_total = sum(category_scores)

print(f'Current total_score: {data["total_score"]:.2f}')
print(f'Correct total_score: {correct_total:.2f}')
print(f'Current grade: {data["grade"]["code"]} - {data["grade"]["name"]}')

# 등급 계산
def get_grade(score):
    if score >= 93:
        return 'M', 'Mugunghwa', '🌺'
    elif score >= 86:
        return 'D', 'Diamond', '💎'
    elif score >= 79:
        return 'E', 'Emerald', '💚'
    elif score >= 72:
        return 'P', 'Platinum', '🥇'
    elif score >= 65:
        return 'G', 'Gold', '🥇'
    elif score >= 58:
        return 'S', 'Silver', '🥈'
    elif score >= 51:
        return 'B', 'Bronze', '🥉'
    elif score >= 44:
        return 'I', 'Iron', '⚫'
    else:
        return 'F', 'Fail', '❌'

code, name, emoji = get_grade(correct_total)
print(f'Correct grade: {code} - {name}')

# 점수 및 등급 수정
data['total_score'] = correct_total
data['grade'] = {
    'code': code,
    'name': name,
    'emoji': emoji
}

# 저장
with open('G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/AI_Evaluation_Engine/results_oh_sehoon_20251026_182403.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('JSON file updated successfully!')
print(f'New total_score: {correct_total:.2f}')
print(f'New grade: {code} - {name}')
