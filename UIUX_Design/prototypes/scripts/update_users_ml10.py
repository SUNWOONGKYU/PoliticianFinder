#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
회원 데이터 업데이트: ML1-ML10 레벨 시스템
- yearly_points (연간 POINT)
- monthly_points (월간 POINT)
- level (ML1 ~ ML10)
"""

import json
import random

# 레벨 정의 (ML1 ~ ML10)
LEVEL_TIERS = [
    {"level": "ML1", "min_points": 0, "max_points": 99},
    {"level": "ML2", "min_points": 100, "max_points": 299},
    {"level": "ML3", "min_points": 300, "max_points": 599},
    {"level": "ML4", "min_points": 600, "max_points": 999},
    {"level": "ML5", "min_points": 1000, "max_points": 1999},
    {"level": "ML6", "min_points": 2000, "max_points": 3499},
    {"level": "ML7", "min_points": 3500, "max_points": 5499},
    {"level": "ML8", "min_points": 5500, "max_points": 8499},
    {"level": "ML9", "min_points": 8500, "max_points": 14999},
    {"level": "ML10", "min_points": 15000, "max_points": 999999}
]

# ROLE 정의
ROLES = {
    'admin': 1,          # 정관리자 1명
    'sub_admin': 2,      # 부관리자 2명
    'moderator': 2,      # 운영위원 2명 (연간 1-2위)
    'user': 15           # 일반회원 15명
}

def calculate_level(yearly_points):
    """연간 POINT로 레벨 계산"""
    for tier in LEVEL_TIERS:
        if tier["min_points"] <= yearly_points <= tier["max_points"]:
            return tier["level"]
    return "ML1"

def calculate_yearly_points(user):
    """활동 기록으로 연간 POINT 계산"""
    # 기본 활동 POINT
    posts_points = user["posts_count"] * 10
    comments_points = user["comments_count"] * 5

    # 추천 POINT
    upvotes_points = user["received_upvotes"] * 2
    downvotes_penalty = user["received_downvotes"] * -0.33

    # 베스트글 보너스
    best_posts = user.get("best_posts_count", random.randint(0, min(2, user["posts_count"])))
    best_posts_points = best_posts * 50

    # 로그인 POINT (올해 활동일 추정)
    days_this_year = random.randint(30, 300)
    login_points = days_this_year * 1

    # 월간 보너스 (랜덤)
    monthly_bonus = random.choice([0, 20, 30, 50, 70]) * random.randint(1, 10)

    total = int(
        posts_points +
        comments_points +
        upvotes_points +
        downvotes_penalty +
        best_posts_points +
        login_points +
        monthly_bonus
    )

    return max(0, total)

def main():
    """메인 함수"""
    print('Updating users with ML1-ML10 level system...')

    # 기존 데이터 로드
    with open('G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/UIUX_Design/prototypes/html/assets/mock-data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # ROLE 재배정
    role_assignment = []
    role_assignment.append('admin')  # 1명
    role_assignment.extend(['sub_admin'] * 2)  # 2명
    role_assignment.extend(['moderator'] * 2)  # 2명 (연간 1-2위로 선정된 운영위원)
    role_assignment.extend(['user'] * 15)  # 15명

    random.shuffle(role_assignment)

    # 회원 데이터 업데이트
    for idx, user in enumerate(data['users']):
        # ROLE 재배정
        user['role'] = role_assignment[idx]

        # 받은 추천/비추천 수 (이미 있으면 유지)
        if 'received_upvotes' not in user:
            user['received_upvotes'] = random.randint(
                user['comments_count'] * 0,
                user['comments_count'] * 3 + user['posts_count'] * 10
            )
        if 'received_downvotes' not in user:
            user['received_downvotes'] = random.randint(
                0,
                int(user['received_upvotes'] * 0.1)
            )

        # 베스트글 수
        if 'best_posts_count' not in user:
            user['best_posts_count'] = random.randint(0, min(2, user['posts_count']))

        # 연간 POINT 계산
        yearly_points = calculate_yearly_points(user)
        user['yearly_points'] = yearly_points

        # 월간 POINT (연간의 5-15%)
        user['monthly_points'] = random.randint(
            int(yearly_points * 0.05),
            int(yearly_points * 0.15)
        )

        # 레벨 계산
        user['level'] = calculate_level(yearly_points)

        # 불필요한 필드 제거
        if 'points' in user:
            del user['points']
        if 'level_name' in user:
            del user['level_name']

    # 레벨별 분포 확인
    level_distribution = {}
    for user in data['users']:
        level = user['level']
        level_distribution[level] = level_distribution.get(level, 0) + 1

    # ROLE별 분포 확인
    role_distribution = {}
    for user in data['users']:
        role = user['role']
        role_distribution[role] = role_distribution.get(role, 0) + 1

    print(f'Users updated: {len(data["users"])}')
    print(f'\nRole distribution:')
    for role, count in sorted(role_distribution.items()):
        print(f'  {role}: {count}')

    print(f'\nLevel distribution:')
    for level in ['ML1', 'ML2', 'ML3', 'ML4', 'ML5', 'ML6', 'ML7', 'ML8', 'ML9', 'ML10']:
        count = level_distribution.get(level, 0)
        if count > 0:
            print(f'  {level}: {count} users')

    # 저장
    with open('G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/UIUX_Design/prototypes/html/assets/mock-data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'\nData updated successfully!')

    # 상위 5명 출력
    print(f'\nTop 5 users by yearly_points:')
    sorted_users = sorted(data['users'], key=lambda x: x['yearly_points'], reverse=True)
    for i, user in enumerate(sorted_users[:5]):
        print(f'{i+1}. {user["nickname"]} ({user["level"]}) - {user["role"]}')
        print(f'   Yearly: {user["yearly_points"]:,} POINT, Monthly: {user["monthly_points"]:,} POINT')
        print(f'   Posts: {user["posts_count"]}, Comments: {user["comments_count"]}')

if __name__ == '__main__':
    main()
