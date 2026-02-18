#!/usr/bin/env python3
"""
V40 Naver API Instruction-Based Collection
=========================================

Instruction 파일 기반 수집:
- instructions/2_collect/prompts/naver_official.md (12개, 1-1-10 센티멘트)
- instructions/2_collect/prompts/naver_public.md (48개, 10-10-28 센티멘트)

V40 배분:
- OFFICIAL: 12개 (10 + 20% 버퍼), negative 1 / positive 1 / free 10
- PUBLIC: 48개 (40 + 20% 버퍼), negative 10 / positive 10 / free 28

사용법:
    python collect_naver_instruction_based.py --politician-id 8c5dcc89 --politician-name "박주민" --category expertise
"""

import os
import sys
import json
import requests
import re
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List
from urllib.parse import quote
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
INSTRUCTIONS_DIR = V40_DIR / "instructions" / "2_collect"
PROMPTS_DIR = INSTRUCTIONS_DIR / "prompts"
ENV_PATH = V40_DIR.parent / '.env'

# .env 파일 로드
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
    print(f"[INFO] .env loaded: {ENV_PATH}")
else:
    load_dotenv()
    print(f"[WARNING] .env not found: {ENV_PATH}")

sys.path.insert(0, str(V40_DIR / "scripts" / "core"))

from supabase import create_client

# 환경 변수
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
NAVER_CLIENT_ID = os.getenv('NAVER_CLIENT_ID')
NAVER_CLIENT_SECRET = os.getenv('NAVER_CLIENT_SECRET')

# 카테고리별 한글명
CATEGORY_KR_MAP = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력',
    'responsiveness': '대응성', 'publicinterest': '공익성'
}


def search_naver_api(query: str, display: int = 10, sort: str = "date",
                    api_type: str = "news") -> List[Dict]:
    """Naver Search API 호출"""

    if api_type == "news":
        url = "https://openapi.naver.com/v1/search/news.json"
    else:  # blog
        url = "https://openapi.naver.com/v1/search/blog.json"

    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
    }
    params = {
        "query": query,
        "display": display,
        "sort": sort
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        items = []
        for item in data.get('items', []):
            items.append({
                'title': item['title'].replace('<b>', '').replace('</b>', ''),
                'link': item['link'],
                'description': item['description'].replace('<b>', '').replace('</b>', ''),
                'pub_date': item.get('pubDate', item.get('postdate', ''))
            })

        return items

    except Exception as e:
        print(f"[WARNING] Naver API error ({api_type}): {e}")
        return []


def parse_naver_date(date_str: str) -> str:
    """Naver 날짜 형식을 YYYY-MM-DD로 변환"""

    # Blog: YYYYMMDD
    if len(date_str) == 8 and date_str.isdigit():
        return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"

    # News: RFC 1123 format
    try:
        dt = datetime.strptime(date_str, "%a, %d %b %Y %H:%M:%S %z")
        return dt.strftime("%Y-%m-%d")
    except:
        return datetime.now().strftime("%Y-%m-%d")


def determine_sentiment(title: str, description: str) -> str:
    """제목과 내용으로 sentiment 판단"""

    text = (title + " " + description).lower()

    # 부정 키워드
    negative_keywords = ['논란', '비판', '사퇴', '의혹', '문제', '실책', '반발', '비난']
    # 긍정 키워드
    positive_keywords = ['성과', '수상', '칭찬', '모범', '공헌', '선정', '1위']

    neg_count = sum(1 for kw in negative_keywords if kw in text)
    pos_count = sum(1 for kw in positive_keywords if kw in text)

    if neg_count > pos_count:
        return 'negative'
    elif pos_count > neg_count:
        return 'positive'
    else:
        return 'free'


def classify_data_type(url: str) -> str:
    """URL 도메인으로 data_type 분류"""

    # OFFICIAL 도메인
    official_domains = ['.go.kr', 'assembly.go.kr', 'korea.kr', 'moleg.go.kr',
                       'nanet.go.kr', 'law.go.kr']

    url_lower = url.lower()

    for domain in official_domains:
        if domain in url_lower:
            return 'official'

    return 'public'


def distribute_by_sentiment(items: List[Dict], target_neg: int, target_pos: int,
                           target_free: int) -> List[Dict]:
    """센티멘트 배분에 맞게 데이터 선택"""

    negative_items = [item for item in items if item.get('sentiment') == 'negative']
    positive_items = [item for item in items if item.get('sentiment') == 'positive']
    free_items = [item for item in items if item.get('sentiment') == 'free']

    result = []

    # negative 목표 수만큼 선택
    result.extend(negative_items[:target_neg])

    # positive 목표 수만큼 선택
    result.extend(positive_items[:target_pos])

    # free 목표 수만큼 선택
    result.extend(free_items[:target_free])

    # 목표 수에 못 미치면 free에서 더 채우기
    if len(result) < (target_neg + target_pos + target_free):
        remaining = (target_neg + target_pos + target_free) - len(result)
        additional = [item for item in items if item not in result][:remaining]
        result.extend(additional)

    return result


def save_to_database(politician_id: str, politician_name: str,
                    category: str, items: List[Dict],
                    data_type: str) -> int:
    """Naver 수집 데이터를 DB에 저장"""

    if not items:
        return 0

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    saved_count = 0

    for item in items:
        try:
            # sentiment와 data_type 설정
            sentiment = item.get('sentiment', 'free')
            actual_data_type = item.get('data_type', data_type)

            # collected_data_v40 테이블에 저장
            insert_data = {
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category,
                'data_type': actual_data_type,
                'sentiment': sentiment,
                'title': item['title'],
                'content': item['description'],
                'source_url': item['link'],
                'source_name': item.get('source_name', 'Naver'),
                'published_date': parse_naver_date(item['pub_date']),
                'summary': item['description'][:200],
                'collector_ai': 'Naver',
                'is_verified': False,
                'created_at': datetime.now().isoformat()
            }

            result = supabase.table('collected_data_v40').insert(insert_data).execute()

            if result.data:
                saved_count += 1

        except Exception as e:
            print(f"[WARNING] DB save failed: {e}")
            continue

    return saved_count


def collect_official(politician_id: str, politician_name: str,
                    category: str) -> Dict:
    """
    OFFICIAL 데이터 수집 (12개)
    센티멘트: negative 1 / positive 1 / free 10
    """
    print(f"[INFO] [OFFICIAL] Collecting {category}...")

    category_kr = CATEGORY_KR_MAP.get(category, category)

    # OFFICIAL 도메인 포함 검색
    queries = [
        f"{politician_name} {category_kr} site:go.kr",
        f"{politician_name} {category_kr} 국회",
        f"{politician_name} {category_kr} 정부"
    ]

    all_items = []

    # News API로 수집
    for query in queries:
        items = search_naver_api(query, display=10, api_type="news")
        for item in items:
            item['sentiment'] = determine_sentiment(item['title'], item['description'])
            item['data_type'] = classify_data_type(item['link'])
            item['source_name'] = 'Naver News'
        all_items.extend(items)

    # OFFICIAL만 필터링
    official_items = [item for item in all_items if item['data_type'] == 'official']

    # 중복 제거 (URL 기준)
    seen_urls = set()
    unique_items = []
    for item in official_items:
        if item['link'] not in seen_urls:
            seen_urls.add(item['link'])
            unique_items.append(item)

    # 센티멘트 배분 (1-1-10)
    distributed = distribute_by_sentiment(unique_items, target_neg=1, target_pos=1, target_free=10)

    # DB 저장
    saved = save_to_database(politician_id, politician_name, category, distributed, 'official')

    print(f"  [OK] OFFICIAL: {saved} items saved")

    return {
        'collected': saved,
        'target': 12
    }


def collect_public(politician_id: str, politician_name: str,
                  category: str) -> Dict:
    """
    PUBLIC 데이터 수집 (48개)
    센티멘트: negative 10 / positive 10 / free 28
    """
    print(f"[INFO] [PUBLIC] Collecting {category}...")

    category_kr = CATEGORY_KR_MAP.get(category, category)

    # PUBLIC 소스 검색
    queries = [f"{politician_name} {category_kr}"]

    all_items = []

    # News API (24개)
    for query in queries:
        items = search_naver_api(query, display=30, api_type="news")
        for item in items:
            item['sentiment'] = determine_sentiment(item['title'], item['description'])
            item['data_type'] = classify_data_type(item['link'])
            item['source_name'] = 'Naver News'
        all_items.extend(items)

    # Blog API (24개)
    for query in queries:
        items = search_naver_api(query, display=30, api_type="blog")
        for item in items:
            item['sentiment'] = determine_sentiment(item['title'], item['description'])
            item['data_type'] = classify_data_type(item['link'])
            item['source_name'] = 'Naver Blog'
        all_items.extend(items)

    # PUBLIC만 필터링
    public_items = [item for item in all_items if item['data_type'] == 'public']

    # 중복 제거
    seen_urls = set()
    unique_items = []
    for item in public_items:
        if item['link'] not in seen_urls:
            seen_urls.add(item['link'])
            unique_items.append(item)

    # 센티멘트 배분 (10-10-28)
    distributed = distribute_by_sentiment(unique_items, target_neg=10, target_pos=10, target_free=28)

    # DB 저장
    saved = save_to_database(politician_id, politician_name, category, distributed, 'public')

    print(f"  [OK] PUBLIC: {saved} items saved")

    return {
        'collected': saved,
        'target': 48
    }


def collect_category(politician_id: str, politician_name: str,
                    category: str) -> Dict:
    """단일 카테고리 수집 (OFFICIAL 12 + PUBLIC 48 = 60)"""

    print(f"\n[INFO] [{category.upper()}] Starting collection...")

    # OFFICIAL 수집
    official_result = collect_official(politician_id, politician_name, category)

    # PUBLIC 수집
    public_result = collect_public(politician_id, politician_name, category)

    total_collected = official_result['collected'] + public_result['collected']
    total_target = official_result['target'] + public_result['target']

    print(f"[OK] [{category.upper()}] Complete: {total_collected}/{total_target} items")

    return {
        'success': total_collected > 0,
        'collected': total_collected,
        'target': total_target,
        'official': official_result,
        'public': public_result
    }


def main():
    """메인 실행 함수"""
    import argparse

    parser = argparse.ArgumentParser(description='Naver API Instruction-Based Collection')
    parser.add_argument('--politician-id', required=True, help='정치인 ID')
    parser.add_argument('--politician-name', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True,
                       choices=[
                           'expertise', 'leadership', 'vision', 'integrity', 'ethics',
                           'accountability', 'transparency', 'communication',
                           'responsiveness', 'publicinterest'
                       ],
                       help='카테고리')

    args = parser.parse_args()

    # 환경 변수 확인
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print("[ERROR] Naver API keys not found in .env file")
        print("   Add NAVER_CLIENT_ID and NAVER_CLIENT_SECRET to .env")
        sys.exit(1)

    result = collect_category(args.politician_id, args.politician_name, args.category)

    if result['success']:
        print(f"\n[OK] Success: {result['collected']}/{result['target']} items collected")
        sys.exit(0)
    else:
        print(f"\n[ERROR] Failed: 0 items collected")
        sys.exit(1)


if __name__ == '__main__':
    main()
