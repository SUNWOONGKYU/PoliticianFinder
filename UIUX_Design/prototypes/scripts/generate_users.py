#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
일반 회원(User) Mock 데이터 생성 스크립트
20명의 회원 데이터 생성
"""

import json
import random
from datetime import datetime, timedelta

# 회원 닉네임 목록 (커뮤니티에서 사용된 것들)
user_nicknames = [
    '정치관심러', '민주시민', '정의로운세상', '청년의목소리', '투명한정치',
    '정치평론가', '시민참여자', '민생이우선', '깨어있는시민', '정치개혁',
    '공정한사회', '정치는우리의것', '변화를원해', '더나은내일', '시민의힘',
    '정치토론러', '올바른선택', '미래세대', '투표하는시민', '정책분석가'
]

# 실명용 이름 (가명)
real_names = [
    '박준혁', '김서영', '이동현', '정민아', '최재원',
    '강수진', '조현우', '윤지혜', '장민수', '임유정',
    '한준호', '오서연', '서민재', '신지수', '권태준',
    '황수빈', '안재현', '송지원', '전민준', '홍서아'
]

# 이메일 도메인
email_domains = ['gmail.com', 'naver.com', 'daum.net', 'kakao.com', 'hanmail.net']

def generate_users():
    """회원 20명 생성"""
    users = []
    now = datetime.now()

    for i in range(20):
        user_id = f'user_{1000 + i}'
        nickname = user_nicknames[i]
        real_name = real_names[i]

        # 이메일 생성
        email_local = nickname.lower().replace(' ', '') if random.random() < 0.5 else f'user{1000 + i}'
        email_domain = random.choice(email_domains)
        email = f'{email_local}@{email_domain}'

        # 가입일 (최근 1년 내)
        days_ago = random.randint(30, 365)
        created_at = now - timedelta(days=days_ago)

        # 활동 통계
        posts_count = random.randint(0, 10)
        comments_count = random.randint(5, 30)

        # 북마크한 정치인 (1-5명)
        num_bookmarks = random.randint(1, 5)
        bookmarks = random.sample(range(1, 31), num_bookmarks)  # 1-30번 정치인 중 랜덤

        user = {
            'id': user_id,
            'name': real_name,
            'nickname': nickname,
            'email': email,
            'avatar': f'https://api.dicebear.com/7.x/avataaars/svg?seed={nickname}',
            'role': 'admin' if i == 0 else 'user',  # 첫 번째 회원만 admin
            'created_at': created_at.isoformat() + 'Z',
            'posts_count': posts_count,
            'comments_count': comments_count,
            'bookmarks': bookmarks
        }
        users.append(user)

    return users

def main():
    """메인 함수"""
    print('Generating users...')

    users = generate_users()
    print(f'Users created: {len(users)}')

    # JSON 파일로 저장
    output_path = 'G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/UIUX_Design/prototypes/html/assets/users-data.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({'users': users}, f, ensure_ascii=False, indent=2)

    print(f'\nUsers data created: {output_path}')
    print(f'   - Total users: {len(users)}')
    print(f'   - Admin: 1')
    print(f'   - Regular users: {len(users) - 1}')

    # 샘플 출력
    print('\nSample users:')
    for i, user in enumerate(users[:3]):
        print(f'{i+1}. {user["nickname"]} ({user["name"]}) - {user["email"]}')
        print(f'   Posts: {user["posts_count"]}, Comments: {user["comments_count"]}, Bookmarks: {len(user["bookmarks"])}')

if __name__ == '__main__':
    main()
