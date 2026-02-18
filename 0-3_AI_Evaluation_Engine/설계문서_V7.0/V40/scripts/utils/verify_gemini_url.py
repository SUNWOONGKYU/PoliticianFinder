#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V40 검색 엔진(Gemini, Naver) URL 검증

⚠️ 주의: V40에서 Gemini는 CLI 방식을 사용합니다 (API 아님).
이 스크립트의 test_gemini() 함수는 V30 시절 API 방식 테스트용입니다.
V40 실제 워크플로우에서 Gemini는 CLI 터미널에서 직접 실행합니다.
참조: instructions/2_collect/GEMINI_CLI_수집_가이드.md
"""

import sys
import os
import google.genai as genai
import requests
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env 파일 로드
load_dotenv(override=True)

# API 키
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")

def test_gemini():
    """Gemini URL 검증"""
    if not GEMINI_API_KEY:
        print("[오류] GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.")
        return

    # New API usage
    client = genai.Client(api_key=GEMINI_API_KEY)

    prompt = """조은희 의원 관련 최신 뉴스를 검색하세요.
실제 존재하는 URL (예: https://www.chosun.com/..., https://www.joongang.co.kr/...)을 제공해야 합니다.
예시(example.com)가 아닌 실제 URL만 제공하세요."""

    print("=" * 70)
    print("1. Gemini URL 검증")
    print("=" * 70)
    print()

    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )

        print("✅ Gemini 응답:")
        print("-" * 70)
        print(response.text)
        print("-" * 70)

        # URL 개수 세기
        url_count = response.text.count('http')
        print(f"\n📊 발견된 URL: 약 {url_count}개")

    except Exception as e:
        print(f"❌ 오류: {e}")

def test_naver():
    """Naver URL 검증"""
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print("[오류] NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET 환경 변수가 설정되지 않았습니다.")
        return

    print("\n" + "=" * 70)
    print("2. Naver URL 검증")
    print("=" * 70)
    print()

    try:
        url = "https://openapi.naver.com/v1/search/news.json"
        headers = {
            "X-Naver-Client-Id": NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
        }
        params = {
            "query": "조은희 의원",
            "display": 3,
            "sort": "date"
        }

        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()

        data = response.json()
        items = data.get('items', [])

        print(f"✅ Naver 응답: {len(items)}개 뉴스 발견")
        print("-" * 70)

        for i, item in enumerate(items, 1):
            title = item.get('title', '').replace('<b>', '').replace('</b>', '')
            link = item.get('link', '')
            print(f"{i}. {title}")
            print(f"   URL: {link}")
            print()

        print("-" * 70)
        print(f"\n📊 실제 URL: {len(items)}개")

        # URL 유효성 검증
        real_domains = ['chosun.com', 'joongang.co.kr', 'donga.com', 'hankyung.com',
                       'hani.co.kr', 'khan.co.kr', 'ytn.co.kr', 'sbs.co.kr',
                       'kbs.co.kr', 'mbc.co.kr', 'yna.co.kr', 'newsis.com']

        real_count = 0
        for item in items:
            link = item.get('link', '')
            if any(domain in link for domain in real_domains):
                real_count += 1

        print(f"📊 실제 한국 언론사 URL: {real_count}개")

    except Exception as e:
        print(f"❌ 오류: {e}")

def main():
    print("=" * 70)
    print("V40 검색 엔진 URL 검증")
    print("=" * 70)
    print("\n목표: 조은희 의원 관련 실제 뉴스 URL 검증")
    print("대상: Gemini, Naver\n")

    test_gemini()
    test_naver()

    print("\n" + "=" * 70)
    print("검증 완료")
    print("=" * 70)

if __name__ == "__main__":
    main()
