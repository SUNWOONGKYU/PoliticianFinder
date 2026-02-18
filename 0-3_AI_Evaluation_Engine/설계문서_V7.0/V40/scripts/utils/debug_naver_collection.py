#!/usr/bin/env python3
"""
Naver API 수집 디버깅 스크립트
================================

실제로 어떤 URL이 수집되는지 확인

사용법:
    python debug_naver_collection.py --politician "박주민" --category expertise
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import requests
from urllib.parse import quote

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
ENV_PATH = V40_DIR.parent / '.env'

# .env 파일 로드
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

NAVER_CLIENT_ID = os.getenv('NAVER_CLIENT_ID')
NAVER_CLIENT_SECRET = os.getenv('NAVER_CLIENT_SECRET')


def search_naver_api(query: str, display: int = 10, api_type: str = "news"):
    """Naver Search API 호출"""

    if api_type == "news":
        url = "https://openapi.naver.com/v1/search/news.json"
    else:
        url = "https://openapi.naver.com/v1/search/blog.json"

    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
    }

    params = {
        "query": query,
        "display": display,
        "sort": "date"
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        return data.get('items', [])
    except Exception as e:
        print(f"[ERROR] API call failed: {e}")
        return []


def classify_data_type(url: str) -> str:
    """URL로 data_type 분류"""
    url_lower = url.lower()

    if '.go.kr' in url_lower:
        return 'official'

    return 'public'


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Naver API 디버깅')
    parser.add_argument('--politician', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True, help='카테고리')

    args = parser.parse_args()

    politician_name = args.politician
    category_kr = {
        'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
        'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
        'transparency': '투명성', 'communication': '소통능력',
        'responsiveness': '대응성', 'publicinterest': '공익성'
    }.get(args.category, args.category)

    print(f"\n=== Naver API 디버깅: {politician_name} - {category_kr} ===\n")

    # 테스트 쿼리들
    queries = [
        f"{politician_name} {category_kr} 국회",
        f"{politician_name} {category_kr} assembly.go.kr",
        f"{politician_name} 법안 {category_kr}",
    ]

    for query in queries:
        print(f"\n[QUERY] {query}")
        print("-" * 80)

        # News API
        print("\n[NEWS API]")
        news_items = search_naver_api(query, display=20, api_type="news")
        official_count = 0
        public_count = 0

        for i, item in enumerate(news_items[:10], 1):
            url = item['link']
            data_type = classify_data_type(url)

            if data_type == 'official':
                official_count += 1
                print(f"  [{i}] ✅ OFFICIAL: {url}")
            else:
                public_count += 1
                print(f"  [{i}] PUBLIC: {url}")

        print(f"\n  Summary: OFFICIAL={official_count}, PUBLIC={public_count}, Total={len(news_items[:10])}")

        # Blog API
        print("\n[BLOG API]")
        blog_items = search_naver_api(query, display=20, api_type="blog")
        official_count = 0
        public_count = 0

        for i, item in enumerate(blog_items[:10], 1):
            url = item['link']
            data_type = classify_data_type(url)

            if data_type == 'official':
                official_count += 1
                print(f"  [{i}] ✅ OFFICIAL: {url}")
            else:
                public_count += 1
                print(f"  [{i}] PUBLIC: {url}")

        print(f"\n  Summary: OFFICIAL={official_count}, PUBLIC={public_count}, Total={len(blog_items[:10])}")


if __name__ == '__main__':
    main()
