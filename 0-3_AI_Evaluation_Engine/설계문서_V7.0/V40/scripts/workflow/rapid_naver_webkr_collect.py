#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

"""
Naver Webkr API 긴급 수집 (웹 문서 전문)
======================================

목표:
- integrity, ethics 등 부족한 카테고리에 웹 문서 데이터 추가
- Webkr API는 위키, 블로그, 커뮤니티 등 다양한 웹 페이지 색인
- news/blog보다 훨씬 많은 결과 제공

특징:
- 모든 카테고리에 Webkr 추가 호출
- 기간 제한 없음 (웹 데이터는 일반적으로 명확한 날짜 없음)
- 필터링 완화 (title에 정치인명만 포함되면 수집)
"""

import os
import sys
import json
import requests
import time
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent

ENV_PATH = V40_DIR.parent / '.env'
load_dotenv(ENV_PATH)

NAVER_CLIENT_ID = os.getenv('NAVER_CLIENT_ID')
NAVER_CLIENT_SECRET = os.getenv('NAVER_CLIENT_SECRET')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

sys.path.insert(0, str(V40_DIR / "scripts" / "core"))
from supabase import create_client

# Webkr 검색 쿼리 (카테고리별)
WEBKR_QUERIES = {
    'integrity': ['오준환 청렴', '오준환 재산', '오준환 비리', '오준환 윤리'],
    'ethics': ['오준환 윤리', '오준환 도덕', '오준환 학력', '오준환 가족'],
    'responsiveness': ['오준환 대응', '오준환 피드백', '오준환 소통'],
    'publicinterest': ['오준환 공익', '오준환 시민', '오준환 사회']
}


def search_webkr(query: str, display: int = 50) -> list:
    """Naver Webkr API 호출"""
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
        print(f"  🔍 Webkr 검색: {query}")
        response = requests.get(url, headers=headers, params=params, timeout=10)

        if response.status_code == 429:
            print(f"    ⚠️  Rate Limit - 대기 중...")
            time.sleep(5)
            return search_webkr(query, display)

        if response.status_code != 200:
            print(f"    ❌ 오류: {response.status_code}")
            return []

        data = response.json()
        items = []

        for item in data.get('items', []):
            items.append({
                'title': item['title'].replace('<b>', '').replace('</b>', ''),
                'link': item['link'],
                'description': item['description'].replace('<b>', '').replace('</b>', ''),
                'pub_date': item.get('pubdate', datetime.now().strftime('%Y-%m-%d'))
            })

        print(f"    ✅ {len(items)}개 발견")
        return items

    except Exception as e:
        print(f"    ❌ 오류: {e}")
        return []


def save_to_db(politician_id: str, politician_name: str, category: str, items: list) -> int:
    """Supabase에 저장"""
    if not items:
        return 0

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        saved = 0

        for item in items:
            # 제목이 정치인명 포함 여부 확인
            if politician_name not in item['title'] and politician_name not in item.get('description', ''):
                continue

            try:
                result = supabase.table('collected_data_v40').insert({
                    'politician_id': politician_id,
                    'politician_name': politician_name,
                    'category': category,
                    'title': item['title'][:300],
                    'content': item['description'][:1000],
                    'source_url': item['link'],
                    'source_name': 'webkr',
                    'data_type': 'PUBLIC',  # Webkr는 공개 데이터
                    'collector_ai': 'Naver',
                    'sentiment': 'free',  # 기본값
                    'published_date': item['pub_date']
                }).execute()

                if result.data:
                    saved += 1

            except Exception as e:
                if "duplicate" in str(e).lower():
                    pass  # 중복 무시
                else:
                    print(f"      ⚠️  저장 오류: {e}")

        return saved

    except Exception as e:
        print(f"  ❌ DB 오류: {e}")
        return 0


def main():
    print("""
╔════════════════════════════════════════════════════════════════════════════╗
║          Naver Webkr API 긴급 수집 (웹 문서 전문) 🚀                      ║
╚════════════════════════════════════════════════════════════════════════════╝
""")

    politician_id = '37e39502'
    politician_name = '오준환'

    total_saved = 0

    for category, queries in WEBKR_QUERIES.items():
        print(f"\n📂 {category} 수집 시작")

        for query in queries:
            items = search_webkr(query)
            saved = save_to_db(politician_id, politician_name, category, items)

            total_saved += saved
            print(f"    💾 {saved}개 저장됨")

            time.sleep(1)  # Rate Limit 회피

    print(f"""
╔════════════════════════════════════════════════════════════════════════════╗
║                       수집 완료: {total_saved}개 ✅                        ║
╚════════════════════════════════════════════════════════════════════════════╝
""")


if __name__ == '__main__':
    main()
