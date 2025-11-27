#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
서울시장 후보 10명 프로필 사진 URL 업데이트
"""

import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from supabase import create_client
from dotenv import load_dotenv

# 환경 변수 로드
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# 서울시장 후보 10명 프로필 사진 URL (위키미디어 커먼즈 기반)
SEOUL_CANDIDATES = [
    {
        'id': '62e7b453',
        'name': '오세훈',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Seoul_mayor_Oh_Se-hoon_%282021%29.jpg/440px-Seoul_mayor_Oh_Se-hoon_%282021%29.jpg'
    },
    {
        'id': 'f9e00370',
        'name': '김민석',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Kim_Min-seok_politician.jpg/440px-Kim_Min-seok_politician.jpg'
    },
    {
        'id': '1005',
        'name': '나경원',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Na_Kyung-won_%282013%29.jpg/440px-Na_Kyung-won_%282013%29.jpg'
    },
    {
        'id': '17270f25',
        'name': '정원오',
        'profile_image_url': None  # 위키미디어에 없음
    },
    {
        'id': '1006',
        'name': '박주민',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Park_Joo-min_%282020%29.jpg/440px-Park_Joo-min_%282020%29.jpg'
    },
    {
        'id': '7f1c3606',
        'name': '전현희',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Jeon_Hyeon-heui_%282020%29.jpg/440px-Jeon_Hyeon-heui_%282020%29.jpg'
    },
    {
        'id': '7abadf92',
        'name': '한동훈',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Han_Dong-hoon_%282022%29.jpg/440px-Han_Dong-hoon_%282022%29.jpg'
    },
    {
        'id': '567e2c27',
        'name': '이준석',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Lee_Jun-seok_%28politician%29_in_June_2021.png/440px-Lee_Jun-seok_%28politician%29_in_June_2021.png'
    },
    {
        'id': 'e3c75ad7',
        'name': '신동욱',
        'profile_image_url': None  # 위키미디어에 없음
    },
    {
        'id': 'd0a5d6e1',
        'name': '조은희',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Cho_Eun-hee_%282022%29.jpg/440px-Cho_Eun-hee_%282022%29.jpg'
    }
]

def update_profile_photos():
    print("="*80)
    print("서울시장 후보 10명 프로필 사진 URL 업데이트")
    print("="*80)
    print()

    success_count = 0
    fail_count = 0
    skip_count = 0

    for candidate in SEOUL_CANDIDATES:
        politician_id = candidate['id']
        name = candidate['name']
        profile_url = candidate['profile_image_url']

        if profile_url is None:
            print(f"{name}: 프로필 사진 없음 (건너뜀)")
            skip_count += 1
            continue

        try:
            result = supabase.table('politicians').update({
                'profile_image_url': profile_url
            }).eq('id', politician_id).execute()

            if result.data:
                print(f"{name}: 프로필 사진 업데이트 완료")
                success_count += 1
            else:
                print(f"{name}: 업데이트 실패 (데이터 없음)")
                fail_count += 1

        except Exception as e:
            print(f"{name}: 업데이트 실패 - {e}")
            fail_count += 1

    print()
    print("="*80)
    print(f"결과: 성공 {success_count}명, 실패 {fail_count}명, 건너뜀 {skip_count}명")
    print("="*80)

if __name__ == "__main__":
    update_profile_photos()
