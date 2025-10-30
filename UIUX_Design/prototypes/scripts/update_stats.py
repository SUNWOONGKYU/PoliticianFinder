#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
통계 데이터 업데이트
- 정치인 통계: 총수, 신분별, 직종별
- 회원 통계: 총수, 레벨별, 이번 달 가입자
- 커뮤니티 통계: 총 게시글/댓글, 회원글/정치인글, 오늘/이번 주 작성 수
"""

import json
from datetime import datetime, timedelta

def main():
    """메인 함수"""
    print('Updating statistics...')

    # 데이터 로드
    with open('G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/UIUX_Design/prototypes/html/assets/mock-data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    politicians = data['politicians']
    users = data['users']
    posts = data['posts']
    comments = data['comments']

    # 현재 시간
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # ============================================
    # 1. 정치인 통계
    # ============================================
    politician_stats = {
        'total': len(politicians),
        'by_status': {},
        'by_category': {}
    }

    # 신분별
    for p in politicians:
        status = p['status']
        politician_stats['by_status'][status] = politician_stats['by_status'].get(status, 0) + 1

    # 직종별
    for p in politicians:
        category = p['category']
        politician_stats['by_category'][category] = politician_stats['by_category'].get(category, 0) + 1

    # ============================================
    # 2. 회원 통계
    # ============================================
    user_stats = {
        'total': len(users),
        'by_level': {},
        'new_this_month': 0
    }

    # 레벨별
    for u in users:
        level = u['level']
        user_stats['by_level'][level] = user_stats['by_level'].get(level, 0) + 1

    # 이번 달 가입자
    for u in users:
        created = datetime.fromisoformat(u['created_at'].replace('Z', ''))
        if created >= month_ago:
            user_stats['new_this_month'] += 1

    # ============================================
    # 3. 커뮤니티 통계
    # ============================================

    # 회원글 / 정치인글 구분
    user_posts = [p for p in posts if p['author_type'] == 'user']
    politician_posts = [p for p in posts if p['author_type'] == 'politician']

    # 오늘/이번 주 작성 글
    posts_today = 0
    posts_this_week = 0
    for p in posts:
        created = datetime.fromisoformat(p['created_at'].replace('Z', ''))
        if created >= today_start:
            posts_today += 1
        if created >= week_ago:
            posts_this_week += 1

    # 오늘/이번 주 작성 댓글
    comments_today = 0
    comments_this_week = 0
    for c in comments:
        created = datetime.fromisoformat(c['created_at'].replace('Z', ''))
        if created >= today_start:
            comments_today += 1
        if created >= week_ago:
            comments_this_week += 1

    community_stats = {
        'total_posts': len(posts),
        'user_posts': len(user_posts),
        'politician_posts': len(politician_posts),
        'total_comments': len(comments),
        'posts_today': posts_today,
        'comments_today': comments_today,
        'posts_this_week': posts_this_week,
        'comments_this_week': comments_this_week
    }

    # ============================================
    # 통계 저장
    # ============================================
    data['stats'] = {
        'politician_stats': politician_stats,
        'user_stats': user_stats,
        'community_stats': community_stats
    }

    # 파일 저장
    with open('G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/UIUX_Design/prototypes/html/assets/mock-data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'\nStatistics updated successfully!')

    # 통계 출력
    print(f'\n=== Politician Stats ===')
    print(f'Total: {politician_stats["total"]}')
    print(f'By Status: {politician_stats["by_status"]}')
    print(f'By Category: {politician_stats["by_category"]}')

    print(f'\n=== User Stats ===')
    print(f'Total: {user_stats["total"]}')
    print(f'By Level: {user_stats["by_level"]}')
    print(f'New This Month: {user_stats["new_this_month"]}')

    print(f'\n=== Community Stats ===')
    print(f'Total Posts: {community_stats["total_posts"]} (User: {community_stats["user_posts"]}, Politician: {community_stats["politician_posts"]})')
    print(f'Total Comments: {community_stats["total_comments"]}')
    print(f'Today: {community_stats["posts_today"]} posts, {community_stats["comments_today"]} comments')
    print(f'This Week: {community_stats["posts_this_week"]} posts, {community_stats["comments_this_week"]} comments')

if __name__ == '__main__':
    main()
