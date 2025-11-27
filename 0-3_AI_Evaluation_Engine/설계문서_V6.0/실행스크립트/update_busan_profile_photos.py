#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
부산시장 후보 10명 프로필 사진 URL 업데이트
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

# 부산시장 후보 10명 프로필 사진 URL
# 출처: 국회 공식 사이트 (assembly.go.kr/photo/{dept_cd}.jpg), 위키미디어, 공식 홈페이지
BUSAN_CANDIDATES = [
    {
        'id': '81fafa15',
        'name': '전재수',
        'profile_image_url': 'https://www.assembly.go.kr/photo/9770951.jpg'  # 국회 공식 사진
    },
    {
        'id': 'd756cb91',
        'name': '박형준',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/%EB%B0%95%ED%98%95%EC%A4%80_%EB%B6%80%EC%82%B0%EC%8B%9C%EC%9E%A5.jpg'  # 위키미디어
    },
    {
        'id': '60e55d2a',
        'name': '김도읍',
        'profile_image_url': 'https://www.assembly.go.kr/photo/9770719.jpg'  # 국회 공식 사진
    },
    {
        'id': 'b99c4d6e',
        'name': '조경태',
        'profile_image_url': 'https://www.assembly.go.kr/photo/9770450.jpg'  # 국회 공식 사진
    },
    {
        'id': 'ab673715',
        'name': '박수영',
        'profile_image_url': 'https://www.assembly.go.kr/photo/9771065.jpg'  # 국회 공식 사진
    },
    {
        'id': 'b6ec6ee4',
        'name': '최인호',
        'profile_image_url': 'https://www.assembly.go.kr/photo/9770933.jpg'  # 국회 공식 사진 (21대)
    },
    {
        'id': '3ee57024',
        'name': '이재성',
        'profile_image_url': None  # 비국회의원 - 공식 프로필 사진 없음
    },
    {
        'id': 'ea36290f',
        'name': '차정인',
        'profile_image_url': 'https://www.pusan.ac.kr/bbs/kor/snsFiles_MN145/20200512/20200512_160149_F62C5C5FDD.jpg'  # 부산대 공식
    },
    {
        'id': 'adaaadc3',
        'name': '홍순헌',
        'profile_image_url': None  # 공식 프로필 사진 없음
    },
    {
        'id': '935ea93a',
        'name': '이진복',
        'profile_image_url': 'https://www.assembly.go.kr/photo/9770626.jpg'  # 국회 공식 사진 (21대)
    }
]

def update_profile_photos():
    print("="*80)
    print("부산시장 후보 10명 프로필 사진 URL 업데이트")
    print("="*80)
    print()

    success_count = 0
    fail_count = 0
    skip_count = 0

    for candidate in BUSAN_CANDIDATES:
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
