#!/usr/bin/env python3
"""
Naver Webkr API 테스트 스크립트
===============================

Web Document Search API로 .go.kr 검색 테스트

사용법:
    python test_naver_webkr.py --politician "박주민" --category expertise
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import requests

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


def search_naver_webkr(query: str, display: int = 10):
    """Naver Web Document Search API (Webkr)"""

    url = "https://openapi.naver.com/v1/search/webkr.json"

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
        print(f"[ERROR] Webkr API failed: {e}")
        return []


def classify_data_type(url: str) -> str:
    """URL로 data_type 분류"""
    url_lower = url.lower()

    if '.go.kr' in url_lower:
        return 'official'

    return 'public'


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Naver Webkr API 테스트')
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

    print(f"\n=== Naver Webkr API 테스트: {politician_name} - {category_kr} ===\n")

    # 테스트 쿼리들
    queries = [
        f"{politician_name} {category_kr} site:go.kr",
        f"{politician_name} site:assembly.go.kr",
        f"{politician_name} 법안 site:likms.assembly.go.kr",
        f"{politician_name} 국회 site:go.kr",
    ]

    total_official = 0
    total_public = 0

    for query in queries:
        print(f"\n[QUERY] {query}")
        print("-" * 80)

        items = search_naver_webkr(query, display=20)

        official_count = 0
        public_count = 0

        for i, item in enumerate(items, 1):
            url = item['link']
            title = item['title']
            data_type = classify_data_type(url)

            if data_type == 'official':
                official_count += 1
                total_official += 1
                print(f"  [{i}] OFFICIAL: {url}")
                print(f"       Title: {title}")
            else:
                public_count += 1
                total_public += 1

        print(f"\n  Summary: OFFICIAL={official_count}, PUBLIC={public_count}, Total={len(items)}")

    print(f"\n{'='*80}")
    print(f"전체 요약: OFFICIAL={total_official}, PUBLIC={total_public}")
    print(f"{'='*80}")


if __name__ == '__main__':
    main()
