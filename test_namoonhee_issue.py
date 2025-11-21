#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
나문희 이슈 테스트
- 정치인 검색 시 동명이인 문제 확인
- 나문희(배우) vs 나문희(정치인) 구분
"""
import os, sys
import requests

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

# 배포된 프로덕션 URL
BASE_URL = "https://politician-finder-9swpbd657-finder-world.vercel.app"

print("\n" + "="*70)
print("나문희 이슈 테스트")
print("="*70 + "\n")

print("테스트 1: 정치인 검색 - '나문희'")
print("-" * 70)

try:
    response = requests.get(
        f"{BASE_URL}/api/politicians",
        params={"search": "나문희"},
        timeout=10
    )

    print(f"응답 코드: {response.status_code}")

    if response.status_code == 200:
        data = response.json()

        if data.get('success'):
            politicians = data.get('data', [])
            print(f"검색 결과: {len(politicians)}명\n")

            for idx, politician in enumerate(politicians, 1):
                print(f"{idx}. {politician.get('name')}")
                print(f"   ID: {politician.get('id')}")
                print(f"   직업/직위: {politician.get('position', 'N/A')}")
                print(f"   소속: {politician.get('party', 'N/A')}")
                print(f"   identity: {politician.get('identity', 'N/A')}")
                print()

            # 분석
            if len(politicians) == 0:
                print("⚠️ 문제: 나문희 검색 결과 없음")
            elif len(politicians) == 1:
                pol = politicians[0]
                if pol.get('identity') == 'politician':
                    print("✅ 정상: 정치인 나문희만 검색됨")
                else:
                    print("⚠️ 문제: 배우 나문희가 검색됨")
            else:
                print("⚠️ 주의: 여러 명의 나문희 검색됨")
                politicians_only = [p for p in politicians if p.get('identity') == 'politician']
                print(f"   정치인: {len(politicians_only)}명")
                print(f"   기타: {len(politicians) - len(politicians_only)}명")
        else:
            print(f"❌ API 오류: {data.get('error')}")
    else:
        print(f"❌ HTTP 오류: {response.status_code}")
        print(f"응답: {response.text[:200]}")

except requests.exceptions.Timeout:
    print("❌ 타임아웃: 서버 응답 없음")
except requests.exceptions.RequestException as e:
    print(f"❌ 요청 실패: {str(e)}")

print("\n" + "="*70)

print("\n테스트 2: 직접 DB 확인 - Supabase")
print("-" * 70)

from supabase import create_client

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    result = supabase.table('politicians').select('*').ilike('name', '%나문희%').execute()

    print(f"DB에서 찾은 나문희: {len(result.data)}명\n")

    for idx, pol in enumerate(result.data, 1):
        print(f"{idx}. {pol.get('name')}")
        print(f"   ID: {pol.get('id')}")
        print(f"   직위: {pol.get('position')}")
        print(f"   소속: {pol.get('party')}")
        print(f"   identity: {pol.get('identity')}")
        print(f"   title: {pol.get('title')}")
        print()

except Exception as e:
    print(f"❌ DB 조회 실패: {str(e)}")

print("="*70 + "\n")

print("테스트 3: 필터링 확인 - identity='politician' 조건")
print("-" * 70)

try:
    # API가 자동으로 필터링하는지 확인
    response = requests.get(
        f"{BASE_URL}/api/politicians",
        params={"search": "나문희"},
        timeout=10
    )

    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            politicians = data.get('data', [])

            print("API 응답 분석:")
            print(f"- 전체 결과: {len(politicians)}명")

            for pol in politicians:
                identity = pol.get('identity', 'N/A')
                print(f"- {pol.get('name')}: identity={identity}")

            # 필터링 제대로 되는지 확인
            non_politicians = [p for p in politicians if p.get('identity') != 'politician']

            if len(non_politicians) > 0:
                print("\n⚠️ 문제 발견!")
                print(f"정치인이 아닌 사람 {len(non_politicians)}명이 포함됨:")
                for p in non_politicians:
                    print(f"  - {p.get('name')} (identity: {p.get('identity')})")
            else:
                print("\n✅ 필터링 정상: 모두 정치인만 검색됨")

except Exception as e:
    print(f"❌ 테스트 실패: {str(e)}")

print("\n" + "="*70 + "\n")
