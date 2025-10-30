#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
모든 Mock 데이터를 하나의 파일로 통합
- politicians (30명)
- users (20명)
- posts (20개)
- comments (59개)
- stats (통계)
"""

import json

def main():
    """메인 함수"""
    print('Merging all data...')

    # 1. 정치인 데이터 로드
    with open('G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/UIUX_Design/prototypes/html/assets/mock-data.json', 'r', encoding='utf-8') as f:
        politician_data = json.load(f)

    print(f'Politicians loaded: {len(politician_data["politicians"])}')

    # 2. 커뮤니티 데이터 로드
    with open('G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/UIUX_Design/prototypes/html/assets/community-data.json', 'r', encoding='utf-8') as f:
        community_data = json.load(f)

    print(f'Posts loaded: {len(community_data["posts"])}')
    print(f'Comments loaded: {len(community_data["comments"])}')

    # 3. 회원 데이터 로드
    with open('G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/UIUX_Design/prototypes/html/assets/users-data.json', 'r', encoding='utf-8') as f:
        user_data = json.load(f)

    print(f'Users loaded: {len(user_data["users"])}')

    # 4. 모든 데이터 통합
    merged_data = {
        'politicians': politician_data['politicians'],
        'users': user_data['users'],
        'posts': community_data['posts'],
        'comments': community_data['comments'],
        'stats': community_data['stats']
    }

    # 5. 통합 파일 저장
    output_path = 'G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/UIUX_Design/prototypes/html/assets/mock-data.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(merged_data, f, ensure_ascii=False, indent=2)

    print(f'\nAll data merged successfully: {output_path}')
    print('\nData summary:')
    print(f'  - Politicians: {len(merged_data["politicians"])}')
    print(f'  - Users: {len(merged_data["users"])}')
    print(f'  - Posts: {len(merged_data["posts"])}')
    print(f'  - Comments: {len(merged_data["comments"])}')
    print(f'  - Stats: politician_stats, community_stats')
    print(f'\nTotal file size: {len(json.dumps(merged_data, ensure_ascii=False)):,} bytes')

if __name__ == '__main__':
    main()
