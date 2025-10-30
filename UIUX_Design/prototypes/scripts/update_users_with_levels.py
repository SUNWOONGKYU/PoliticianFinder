#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
회원 데이터에 레벨, 포인트, 활동 기록 추가
"""

import json
import random

# 레벨 정의
LEVEL_TIERS = [
    {"level": 1, "name": "🌱 새싹 시민", "min_points": 0, "max_points": 99},
    {"level": 2, "name": "🌿 활동 시민", "min_points": 100, "max_points": 499},
    {"level": 3, "name": "🌳 열정 시민", "min_points": 500, "max_points": 1499},
    {"level": 4, "name": "⭐ 핵심 시민", "min_points": 1500, "max_points": 4999},
    {"level": 5, "name": "👑 명예 시민", "min_points": 5000, "max_points": 999999}
]

def calculate_level(points):
    """포인트로 레벨 계산"""
    for tier in LEVEL_TIERS:
        if tier["min_points"] <= points <= tier["max_points"]:
            return tier["level"], tier["name"]
    return 1, "🌱 새싹 시민"

def calculate_points(user):
    """활동 기록으로 포인트 계산"""
    # 기본 활동 포인트
    posts_points = user["posts_count"] * 10
    comments_points = user["comments_count"] * 5

    # 추천 포인트
    upvotes_points = user["received_upvotes"] * 2
    downvotes_penalty = user["received_downvotes"] * -0.33  # 3개당 -1

    # 베스트글 보너스 (랜덤으로 0-2개)
    best_posts = random.randint(0, min(2, user["posts_count"]))
    best_posts_points = best_posts * 50

    # 로그인 포인트 (가입 이후 일수의 30% 정도)
    days_since_join = random.randint(30, 365)
    login_days = int(days_since_join * random.uniform(0.2, 0.4))
    login_points = login_days * 1

    # 월간 보너스 (랜덤)
    monthly_bonus = random.choice([0, 20, 30, 50, 70])

    total = int(
        posts_points +
        comments_points +
        upvotes_points +
        downvotes_penalty +
        best_posts_points +
        login_points +
        monthly_bonus
    )

    return max(0, total), best_posts

def main():
    """메인 함수"""
    print('Updating users with levels and points...')

    # 기존 데이터 로드
    with open('G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/UIUX_Design/prototypes/html/assets/mock-data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 회원 데이터 업데이트
    for user in data['users']:
        # 받은 추천/비추천 수 추가
        user['received_upvotes'] = random.randint(
            user['comments_count'] * 0,  # 최소
            user['comments_count'] * 3 + user['posts_count'] * 10  # 최대
        )
        user['received_downvotes'] = random.randint(
            0,
            int(user['received_upvotes'] * 0.1)  # 추천의 10% 정도
        )

        # 포인트 계산
        points, best_posts = calculate_points(user)
        user['points'] = points

        # 이번 달 포인트 (전체의 10-30%)
        user['monthly_points'] = random.randint(
            int(points * 0.1),
            int(points * 0.3)
        )

        # 레벨 계산
        level, level_name = calculate_level(points)
        user['level'] = level
        user['level_name'] = level_name

        # 베스트글 수
        user['best_posts_count'] = best_posts

    # 레벨별 분포 확인
    level_distribution = {}
    for user in data['users']:
        level = user['level']
        level_distribution[level] = level_distribution.get(level, 0) + 1

    print(f'Users updated: {len(data["users"])}')
    print(f'\nLevel distribution:')
    for level in sorted(level_distribution.keys()):
        count = level_distribution[level]
        print(f'  Level {level}: {count} users')

    # 저장
    with open('G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/UIUX_Design/prototypes/html/assets/mock-data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'\nData updated successfully!')

    # 샘플 출력
    print(f'\nTop 5 users by points:')
    for i, user in enumerate(sorted(data['users'], key=lambda x: x['points'], reverse=True)[:5]):
        print(f'{i+1}. {user["nickname"]} (Level {user["level"]})')
        print(f'   Points: {user["points"]:,} (monthly: {user["monthly_points"]})')
        print(f'   Posts: {user["posts_count"]}, Comments: {user["comments_count"]}')
        print(f'   Upvotes: {user["received_upvotes"]}, Downvotes: {user["received_downvotes"]}')
        print(f'   Best posts: {user["best_posts_count"]}')

if __name__ == '__main__':
    main()
