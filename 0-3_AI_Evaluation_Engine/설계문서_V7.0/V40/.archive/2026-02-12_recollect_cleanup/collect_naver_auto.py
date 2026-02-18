#!/usr/bin/env python3
"""
Naver API 자동 수집 스크립트 (병렬 처리)
========================================

최적화:
- 10개 카테고리 병렬 실행 (ProcessPoolExecutor)
- Naver Search API (News + Blog)
- 목표 시간: 2-3분

사용법:
    python collect_naver_auto.py --politician-id 8c5dcc89 --politician-name "박주민"
"""

import os
import sys
import json
import requests
from pathlib import Path
from datetime import datetime, timedelta
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import Dict, List
from urllib.parse import quote
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
ENV_PATH = V40_DIR.parent.parent / '.env'

# .env 파일 로드
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
    print(f"[INFO] .env 로드 완료: {ENV_PATH}")
else:
    print(f"[WARNING] .env 파일 없음: {ENV_PATH}")

sys.path.insert(0, str(V40_DIR / "scripts" / "core"))

from supabase import create_client

# 환경 변수
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')  # 수정: SUPABASE_KEY → SUPABASE_SERVICE_KEY
NAVER_CLIENT_ID = os.getenv('NAVER_CLIENT_ID')
NAVER_CLIENT_SECRET = os.getenv('NAVER_CLIENT_SECRET')

# 10개 카테고리
CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

# 카테고리별 한글 이름 및 검색 키워드
CATEGORY_KEYWORDS = {
    'expertise': ['전문성', '전문가', '법안', '정책'],
    'leadership': ['리더십', '지도력', '주도'],
    'vision': ['비전', '미래', '계획', '방향'],
    'integrity': ['청렴', '청렴성', '부패'],
    'ethics': ['윤리', '도덕', '품성'],
    'accountability': ['책임', '책임성', '의무'],
    'transparency': ['투명', '투명성', '공개'],
    'communication': ['소통', '대화', '답변'],
    'responsiveness': ['대응', '반응', '신속'],
    'publicinterest': ['공익', '국민', '시민']
}

# Naver API 수집 목표 (카테고리당 60개 = 50개 + 20% 버퍼)
NAVER_TARGETS = {
    'news': 36,     # 뉴스 36개 (30 + 20% 버퍼)
    'blog': 24      # 블로그 24개 (20 + 20% 버퍼)
}


def search_naver_news(query: str, display: int = 30) -> List[Dict]:
    """Naver 뉴스 검색"""

    url = "https://openapi.naver.com/v1/search/news.json"
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
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        items = []
        for item in data.get('items', []):
            items.append({
                'title': item['title'].replace('<b>', '').replace('</b>', ''),
                'link': item['link'],
                'description': item['description'].replace('<b>', '').replace('</b>', ''),
                'pub_date': item['pubDate']
            })

        return items

    except Exception as e:
        print(f"[WARNING] Naver News API 오류: {e}")
        return []


def search_naver_blog(query: str, display: int = 20) -> List[Dict]:
    """Naver 블로그 검색"""

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
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        items = []
        for item in data.get('items', []):
            items.append({
                'title': item['title'].replace('<b>', '').replace('</b>', ''),
                'link': item['link'],
                'description': item['description'].replace('<b>', '').replace('</b>', ''),
                'pub_date': item['postdate']  # YYYYMMDD 형식
            })

        return items

    except Exception as e:
        print(f"[WARNING] Naver Blog API 오류: {e}")
        return []


def parse_naver_date(date_str: str) -> str:
    """Naver 날짜 형식을 YYYY-MM-DD로 변환"""

    # Blog: YYYYMMDD
    if len(date_str) == 8 and date_str.isdigit():
        return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"

    # News: RFC 1123 format (Thu, 09 Feb 2023 12:34:56 +0900)
    try:
        dt = datetime.strptime(date_str, "%a, %d %b %Y %H:%M:%S %z")
        return dt.strftime("%Y-%m-%d")
    except:
        return datetime.now().strftime("%Y-%m-%d")


def determine_sentiment(title: str, description: str) -> str:
    """제목과 내용으로 sentiment 간단히 판단"""

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


def save_to_database(politician_id: str, politician_name: str,
                    category: str, items: List[Dict],
                    source_type: str) -> int:
    """Naver 수집 데이터를 DB에 저장"""

    if not items:
        return 0

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    saved_count = 0

    for item in items:
        try:
            # sentiment 자동 판단
            sentiment = determine_sentiment(item['title'], item['description'])

            # data_type은 public으로 (Naver는 모두 PUBLIC)
            data_type = 'public'

            # collected_data_v40 테이블에 저장
            insert_data = {
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category,
                'data_type': data_type,
                'sentiment': sentiment,
                'title': item['title'],
                'content': item['description'],
                'source_url': item['link'],
                'source_name': f'Naver {source_type.capitalize()}',
                'published_date': parse_naver_date(item['pub_date']),
                'summary': item['description'][:200],  # 최대 200자
                'collector_ai': 'Naver',
                'is_verified': False,
                'created_at': datetime.now().isoformat()
            }

            result = supabase.table('collected_data_v40').insert(insert_data).execute()

            if result.data:
                saved_count += 1

        except Exception as e:
            print(f"[WARNING] DB 저장 실패: {e}")
            continue

    return saved_count


def collect_single_category(politician_id: str, politician_name: str,
                           category: str) -> Dict:
    """단일 카테고리 Naver 수집 (News + Blog)"""

    print(f"[INFO] [{category}] Naver 수집 시작...")

    total_collected = 0
    errors = []

    # 검색 쿼리 생성
    keywords = CATEGORY_KEYWORDS.get(category, [])
    base_query = politician_name

    # News 수집
    news_items = []
    for keyword in keywords[:2]:  # 상위 2개 키워드만 사용
        query = f"{base_query} {keyword}"
        items = search_naver_news(query, display=15)
        news_items.extend(items)

    # 중복 제거 (URL 기준)
    seen_urls = set()
    unique_news = []
    for item in news_items:
        if item['link'] not in seen_urls:
            seen_urls.add(item['link'])
            unique_news.append(item)

    # 최대 30개
    unique_news = unique_news[:NAVER_TARGETS['news']]

    saved_news = save_to_database(
        politician_id, politician_name, category, unique_news, 'news'
    )
    total_collected += saved_news
    print(f"  [OK] News: {saved_news}개")

    # Blog 수집
    blog_items = []
    for keyword in keywords[:2]:
        query = f"{base_query} {keyword}"
        items = search_naver_blog(query, display=10)
        blog_items.extend(items)

    # 중복 제거
    seen_urls = set()
    unique_blogs = []
    for item in blog_items:
        if item['link'] not in seen_urls:
            seen_urls.add(item['link'])
            unique_blogs.append(item)

    # 최대 20개
    unique_blogs = unique_blogs[:NAVER_TARGETS['blog']]

    saved_blogs = save_to_database(
        politician_id, politician_name, category, unique_blogs, 'blog'
    )
    total_collected += saved_blogs
    print(f"  [OK] Blog: {saved_blogs}개")

    return {
        'category': category,
        'collected': total_collected,
        'errors': errors
    }


def collect_naver_parallel(politician_id: str, politician_name: str,
                          max_workers: int = 10) -> Dict:
    """10개 카테고리 병렬 Naver 수집"""

    print(f"\n{'='*60}")
    print(f"[START] Naver API 병렬 수집 시작 - {politician_name}")
    print(f"   병렬 작업 수: {max_workers}")
    print(f"{'='*60}\n")

    start_time = datetime.now()
    results = {}

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = {}

        # 10개 카테고리 동시 실행
        for category in CATEGORIES:
            future = executor.submit(
                collect_single_category,
                politician_id,
                politician_name,
                category
            )
            futures[future] = category

        # 결과 수집
        for future in as_completed(futures):
            category = futures[future]
            try:
                result = future.result(timeout=300)  # 5분 타임아웃
                results[category] = result

            except Exception as e:
                print(f"[ERROR] [{category}] 오류 발생: {e}")
                results[category] = {
                    'category': category,
                    'collected': 0,
                    'errors': [str(e)]
                }

    # 결과 요약
    elapsed = (datetime.now() - start_time).total_seconds()
    total_collected = sum(r.get('collected', 0) for r in results.values())
    total_errors = sum(len(r.get('errors', [])) for r in results.values())

    print(f"\n{'='*60}")
    print(f"[OK] Naver 수집 완료 - {elapsed:.1f}초 소요")
    print(f"   총 수집: {total_collected}개")
    print(f"   총 오류: {total_errors}개")
    print(f"{'='*60}\n")

    return {
        'success': total_collected > 0,
        'total_collected': total_collected,
        'total_errors': total_errors,
        'elapsed_seconds': elapsed,
        'results': results
    }


def main():
    """메인 실행 함수"""
    import argparse

    parser = argparse.ArgumentParser(description='Naver API 자동 수집')
    parser.add_argument('--politician-id', required=True, help='정치인 ID')
    parser.add_argument('--politician-name', required=True, help='정치인 이름')
    parser.add_argument('--workers', type=int, default=10, help='병렬 작업 수')

    args = parser.parse_args()

    # 환경 변수 확인
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print("[ERROR] Naver API 키가 설정되지 않았습니다.")
        print("   .env 파일에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET을 추가하세요.")
        sys.exit(1)

    result = collect_naver_parallel(
        args.politician_id,
        args.politician_name,
        args.workers
    )

    if result['success']:
        print(f"\n[OK] 성공: {result['total_collected']}개 수집")
        sys.exit(0)
    else:
        print(f"\n[ERROR] 실패: {result['total_errors']}개 오류")
        sys.exit(1)


if __name__ == '__main__':
    main()
