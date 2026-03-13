#!/usr/bin/env python3
"""
V50 Naver 수집 스크립트 (Naver Cloud Platform API)
==================================================

Instruction 파일 기반 수집:
- instructions/2_collect_v50/prompts/naver_official.md
- instructions/2_collect_v50/prompts/naver_public.md
- instructions/2_collect_v50/cat01~10.md (카테고리별 상세 지침)

V50 배분:
- OFFICIAL: 12개 (10 + 20% 버퍼), negative 1 / positive 1 / free 10
- PUBLIC: 48개 (40 + 20% 버퍼), negative 10 / positive 10 / free 28
- OFFICIAL 기간: 4년, PUBLIC 기간: 2년

사용법:
    python collect_naver_v50.py --politician-id 8c5dcc89 --politician-name "박주민" --category expertise
"""

import os
import sys
import json
import requests
import re
import time
import random
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List

# Encoding fix for Windows
if sys.platform == 'win32':
    try:
        sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
        sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf-8', buffering=1)
    except Exception:
        pass
from urllib.parse import quote
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V50_DIR = SCRIPT_DIR.parent
INSTRUCTIONS_DIR = V50_DIR / "instructions" / "2_collect_v50"
PROMPTS_DIR = INSTRUCTIONS_DIR / "prompts"

# 캐시 설정
CACHE_DIR = SCRIPT_DIR / ".cache"
CACHE_FILE = CACHE_DIR / "naver_cache_v50.json"  # main()에서 politician_id로 재설정됨
CACHE_DIR.mkdir(exist_ok=True)

# .env 파일 로드 (V50/.env 우선)
for env_path in [V50_DIR / '.env', V50_DIR.parent / '.env']:
    if env_path.exists():
        load_dotenv(env_path, override=True)
        print(f"[INFO] .env loaded: {env_path}")
        break
else:
    load_dotenv()

from supabase import create_client

# 환경 변수
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
NAVER_CLIENT_ID = os.getenv('NAVER_CLIENT_ID')
NAVER_CLIENT_SECRET = os.getenv('NAVER_CLIENT_SECRET')

# 모듈 레벨 Supabase 클라이언트 (1회 초기화)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 테이블명
TABLE_COLLECTED = "collected_data_v50"

# 카테고리별 한글명
CATEGORY_KR_MAP = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력',
    'responsiveness': '대응성', 'publicinterest': '공익성'
}


# === 캐시 관리 함수 ===
def _get_cache() -> Dict:
    """캐시 파일 로드 (없으면 빈 딕셔너리 반환)"""
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_cache(cache: Dict) -> None:
    """캐시를 파일에 저장"""
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[WARNING] 캐시 저장 실패: {e}")


def _get_cache_key(query: str, api_type: str, sentiment_type: str) -> str:
    """쿼리를 기반으로 캐시 키 생성"""
    key_str = f"{query}_{api_type}_{sentiment_type}"
    return hashlib.md5(key_str.encode()).hexdigest()


def _check_cache(query: str, api_type: str, sentiment_type: str) -> List:
    """캐시에서 쿼리 결과 확인"""
    cache = _get_cache()
    cache_key = _get_cache_key(query, api_type, sentiment_type)
    if cache_key in cache:
        print(f"  [CACHE HIT] {query} ({api_type})")
        return cache[cache_key].get('items', [])
    return None


def _save_cache_result(query: str, api_type: str, sentiment_type: str, items: List) -> None:
    """API 결과를 캐시에 저장"""
    if not items:
        return
    cache = _get_cache()
    cache_key = _get_cache_key(query, api_type, sentiment_type)
    cache[cache_key] = {
        'query': query,
        'api_type': api_type,
        'sentiment_type': sentiment_type,
        'timestamp': datetime.now().isoformat(),
        'items': items
    }
    _save_cache(cache)


def _load_politician_qualifier(politician_name: str) -> str:
    """
    정치인 MD 파일에서 동명이인 구분용 검색 한정어를 추출

    예: "조은희" -> "국회의원", "정원오" -> "성동구청장", "오세훈" -> "서울시장"
    """
    pol_file = V50_DIR / 'instructions' / '1_politicians' / f'{politician_name}.md'
    if not pol_file.exists():
        return ''

    with open(pol_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1순위: "수집 시 키워드 사용 필수" 라인에서 추출
    for line in content.split('\n'):
        if '키워드 사용 필수' in line:
            m = re.search(r'"([^"]+)"', line)
            if m:
                keyword = m.group(1)
                qualifier = keyword.replace(politician_name, '').strip()
                if qualifier:
                    return qualifier

    # 2순위: 현 직책에서 짧은 한정어 추출
    for line in content.split('\n'):
        if '현 직책' in line:
            m = re.search(r'\|\s*(.+?)\s*\|', line.split('현 직책')[1])
            if m:
                position = m.group(1).strip()
                core = position.split('(')[0].strip()
                core = core.replace('서울특별시장', '서울시장')
                return core

    return ''


def load_category_instruction(category: str) -> Dict:
    """
    카테고리별 instruction 로드 (V50 경로)
    - 섹션 4: 10개 평가 항목 추출
    - 섹션 11: 검색 키워드 추출 (긍정/부정/자유)
    """
    cat_num = {
        'expertise': '01', 'leadership': '02', 'vision': '03',
        'integrity': '04', 'ethics': '05', 'accountability': '06',
        'transparency': '07', 'communication': '08',
        'responsiveness': '09', 'publicinterest': '10'
    }.get(category, '01')

    cat_file = INSTRUCTIONS_DIR / f"cat{cat_num}_{category}.md"

    if not cat_file.exists():
        print(f"[WARNING] Category instruction not found: {cat_file}")
        return {
            "evaluation_items": [],
            "keywords_positive": [],
            "keywords_negative": [],
            "keywords_free": []
        }

    with open(cat_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 섹션 4: 10개 평가 항목 추출
    items_match = re.search(r'##\s*4\..*?평가 범위.*?\n(.*?)(?=\n##\s*5\.)', content, re.DOTALL)
    evaluation_items = []
    if items_match:
        items_section = items_match.group(1)
        item_pattern = r'\|\s*\d+-\d+\s*\|\s*\*\*(.*?)\*\*\s*\|'
        items_found = re.findall(item_pattern, items_section)
        evaluation_items = [item.strip() for item in items_found if item.strip()]

    # 섹션 11: 검색 키워드 추출
    keywords_match = re.search(
        r'##\s*11\..*?검색 키워드.*?\n(.*?)(?=\n##\s*12\.|\n##\s*13\.|\Z)',
        content, re.DOTALL
    )
    keywords_positive = []
    keywords_negative = []
    keywords_free = []

    if keywords_match:
        keywords_section = keywords_match.group(1)

        pos_match = re.search(
            r'긍정[:\s]*\n(.*?)(?=\n부정[:\s]*|\n자유)', keywords_section, re.DOTALL | re.IGNORECASE
        )
        if pos_match:
            pos_text = pos_match.group(1)
            keywords_positive = [
                line.strip().replace('- ', '').replace('"', '').replace('{정치인명}', '').strip()
                for line in pos_text.split('\n')
                if line.strip() and line.strip().startswith('-')
            ]

        neg_match = re.search(
            r'부정[:\s]*\n(.*?)(?=\n자유|\n\n|$)', keywords_section, re.DOTALL | re.IGNORECASE
        )
        if neg_match:
            neg_text = neg_match.group(1)
            keywords_negative = [
                line.strip().replace('- ', '').replace('"', '').replace('{정치인명}', '').strip()
                for line in neg_text.split('\n')
                if line.strip() and line.strip().startswith('-')
            ]

        free_match = re.search(
            r'자유.*?[:\s]*\n(.*?)(?=\n\n|$)', keywords_section, re.DOTALL | re.IGNORECASE
        )
        if free_match:
            free_text = free_match.group(1)
            keywords_free = [
                line.strip().replace('- ', '').replace('"', '').replace('{정치인명}', '').strip()
                for line in free_text.split('\n')
                if line.strip() and line.strip().startswith('-')
            ]

    print(f"[CAT] Loaded {category}:")
    print(f"  - Evaluation items: {len(evaluation_items)}")
    print(f"  - Keywords: pos={len(keywords_positive)}, neg={len(keywords_negative)}, free={len(keywords_free)}")

    return {
        "evaluation_items": evaluation_items,
        "keywords_positive": keywords_positive,
        "keywords_negative": keywords_negative,
        "keywords_free": keywords_free
    }


def search_naver_api(query: str, display: int = 10, sort: str = "date",
                    api_type: str = "news", throttle_ms: int = 300, max_retries: int = 3,
                    sentiment_type: str = "free") -> List[Dict]:
    """
    Naver Search API 호출 (Throttle + Exponential Backoff + 캐싱 포함)
    """
    cached_items = _check_cache(query, api_type, sentiment_type)
    if cached_items is not None:
        return cached_items

    if api_type == "news":
        url = "https://openapi.naver.com/v1/search/news.json"
    elif api_type == "webkr":
        url = "https://openapi.naver.com/v1/search/webkr.json"
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

    time.sleep(throttle_ms / 1000)

    for attempt in range(max_retries):
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

            _save_cache_result(query, api_type, sentiment_type, items)
            return items

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    print(f"[RETRY] Rate limit hit. Waiting {wait_time:.1f}s (attempt {attempt+1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"[FAILED] Rate limit exceeded after {max_retries} attempts")
                    return []
            else:
                print(f"[WARNING] Naver API HTTP error ({api_type}): {e}")
                return []
        except Exception as e:
            print(f"[WARNING] Naver API error ({api_type}): {e}")
            return []

    return []


def parse_naver_date(date_str: str) -> str:
    """Naver 날짜 형식을 YYYY-MM-DD로 변환"""
    if len(date_str) == 8 and date_str.isdigit():
        return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
    try:
        dt = datetime.strptime(date_str, "%a, %d %b %Y %H:%M:%S %z")
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return datetime.now().strftime("%Y-%m-%d")


def is_within_period(date_str: str, period_years: int) -> bool:
    """날짜가 기간 내인지 확인"""
    try:
        item_date = datetime.strptime(date_str, "%Y-%m-%d")
        cutoff_date = datetime.now() - timedelta(days=365 * period_years)
        return item_date >= cutoff_date
    except Exception:
        return False


def determine_sentiment(title: str, description: str) -> str:
    """제목과 내용으로 sentiment 판단"""
    text = (title + " " + description).lower()
    negative_keywords = ['논란', '비판', '사퇴', '의혹', '문제', '실책', '반발', '비난',
                        '부적절', '실망', '우려', '지적', '반대', '경고']
    positive_keywords = ['성과', '수상', '칭찬', '모범', '공헌', '선정', '1위',
                        '성공', '발전', '우수', '표창', '인정', '향상']
    neg_count = sum(1 for kw in negative_keywords if kw in text)
    pos_count = sum(1 for kw in positive_keywords if kw in text)
    if neg_count > pos_count:
        return 'negative'
    elif pos_count > neg_count:
        return 'positive'
    else:
        return 'free'


def classify_source_type(url: str) -> str:
    """URL 도메인으로 source_type 분류"""
    url_lower = url.lower()
    if '.go.kr' in url_lower:
        return 'OFFICIAL'
    return 'PUBLIC'


def distribute_by_sentiment(items: List[Dict], target_neg: int, target_pos: int,
                           target_free: int) -> List[Dict]:
    """센티멘트 배분에 맞게 데이터 선택"""
    negative_items = [item for item in items if item.get('sentiment') == 'negative']
    positive_items = [item for item in items if item.get('sentiment') == 'positive']
    free_items = [item for item in items if item.get('sentiment') == 'free']

    result = []
    result.extend(negative_items[:target_neg])
    result.extend(positive_items[:target_pos])
    result.extend(free_items[:target_free])

    total_target = target_neg + target_pos + target_free
    if len(result) < total_target:
        remaining_count = total_target - len(result)
        remaining_items = [item for item in items if item not in result]
        result.extend(remaining_items[:remaining_count])

    actual_distribution = {
        'negative': sum(1 for item in result if item.get('sentiment') == 'negative'),
        'positive': sum(1 for item in result if item.get('sentiment') == 'positive'),
        'free': sum(1 for item in result if item.get('sentiment') == 'free')
    }
    print(f"  [SENTIMENT] Target: neg={target_neg}, pos={target_pos}, free={target_free}")
    print(f"  [SENTIMENT] Actual: {actual_distribution}")
    return result


def save_to_database(politician_id: str, politician_name: str,
                    category: str, items: List[Dict],
                    source_type: str) -> int:
    """Naver 수집 데이터를 V50 DB에 저장"""
    if not items:
        return 0

    saved_count = 0

    for item in items:
        try:
            url = item['link']
            # 중복 체크 (같은 AI가 수집한 URL만 체크)
            existing = supabase.table(TABLE_COLLECTED).select('id').eq(
                'politician_id', politician_id
            ).eq('category', category).eq('source_url', url).eq(
                'collector_ai', 'Naver'
            ).execute()

            if existing.data:
                continue

            sentiment = item.get('sentiment', 'free')
            actual_source_type = item.get('source_type', source_type)

            insert_data = {
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category,
                'source_type': actual_source_type,
                'sentiment': sentiment,
                'title': item['title'],
                'content': item['description'],
                'source_url': item['link'],
                'source_name': item.get('source_name', 'Naver'),
                'published_date': item.get('published_date', ''),
                'summary': item['description'][:200],
                'collector_ai': 'Naver',
                'is_verified': False,
                'created_at': datetime.now().isoformat()
            }

            result = supabase.table(TABLE_COLLECTED).insert(insert_data).execute()
            if result.data:
                saved_count += 1

        except Exception as e:
            print(f"[WARNING] DB save failed: {e}")
            continue

    return saved_count


def collect_official(politician_id: str, politician_name: str,
                    category: str, qualifier: str = '') -> Dict:
    """
    OFFICIAL 데이터 수집 (12개 = 10 + 20% 버퍼)
    센티멘트: negative 1 / positive 1 / free 10
    기간: 4년
    """
    print(f"\n[INFO] [OFFICIAL] Collecting {category} (target: 12 items)...")
    if qualifier:
        print(f"  [동명이인 필터] 한정어: '{qualifier}'")

    category_kr = CATEGORY_KR_MAP.get(category, category)
    cat_inst = load_category_instruction(category)
    search_name = f"{politician_name} {qualifier}" if qualifier else politician_name

    queries = [
        f"{search_name} {category_kr} site:go.kr",
        f"{search_name} site:assembly.go.kr",
        f"{search_name} site:likms.assembly.go.kr",
    ]

    for item in cat_inst['evaluation_items'][:5]:
        queries.append(f"{search_name} {item} site:go.kr")

    all_keywords = (
        cat_inst['keywords_positive'][:2] +
        cat_inst['keywords_negative'][:2] +
        cat_inst['keywords_free'][:2]
    )
    for kw in all_keywords:
        if kw:
            queries.append(f"{politician_name} {kw} site:go.kr")

    all_items = []

    for query in queries[:6]:
        items = search_naver_api(
            query, display=50, api_type="webkr",
            throttle_ms=300, max_retries=3, sentiment_type="free"
        )
        for item in items:
            date_str = item.get('postdate', '')
            if not date_str or date_str == '':
                date_str = datetime.now().strftime('%Y-%m-%d')
            elif len(date_str) == 8:
                date_str = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"

            item['published_date'] = date_str
            item['sentiment'] = determine_sentiment(item['title'], item['description'])
            item['source_type'] = classify_source_type(item['link'])
            item['source_name'] = 'Naver Webkr'
            item['pub_date'] = date_str

            if item['source_type'] == 'OFFICIAL':
                if is_within_period(date_str, period_years=4):
                    all_items.append(item)

    official_items = [item for item in all_items if item['source_type'] == 'OFFICIAL']

    seen_urls = set()
    unique_items = []
    for item in official_items:
        if item['link'] not in seen_urls:
            seen_urls.add(item['link'])
            unique_items.append(item)

    distributed = distribute_by_sentiment(unique_items, target_neg=1, target_pos=1, target_free=10)
    saved = save_to_database(politician_id, politician_name, category, distributed, 'OFFICIAL')
    print(f"  [OK] OFFICIAL: {saved} items saved (target: 12)")
    return {'collected': saved, 'target': 12}


def collect_public(politician_id: str, politician_name: str,
                  category: str, qualifier: str = '') -> Dict:
    """
    PUBLIC 데이터 수집 (48개 = 40 + 20% 버퍼)
    센티멘트: negative 10 / positive 10 / free 28
    기간: 2년
    """
    print(f"\n[INFO] [PUBLIC] Collecting {category} (target: 48 items)...")
    if qualifier:
        print(f"  [동명이인 필터] 한정어: '{qualifier}'")

    category_kr = CATEGORY_KR_MAP.get(category, category)
    cat_inst = load_category_instruction(category)
    search_name = f"{politician_name} {qualifier}" if qualifier else politician_name

    queries = [f"{search_name} {category_kr}"]

    for item in cat_inst['evaluation_items'][:8]:
        queries.append(f"{search_name} {item}")

    for kw in cat_inst['keywords_positive'][:5]:
        if kw:
            queries.append(f"{search_name} {kw}")

    for kw in cat_inst['keywords_negative'][:5]:
        if kw:
            queries.append(f"{search_name} {kw}")

    for kw in cat_inst['keywords_free'][:5]:
        if kw:
            queries.append(f"{search_name} {kw}")

    all_items = []

    # News API
    for query in queries[:3]:
        items = search_naver_api(
            query, display=50, api_type="news",
            throttle_ms=300, max_retries=3, sentiment_type="free"
        )
        for item in items:
            date_str = parse_naver_date(item['pub_date'])
            item['published_date'] = date_str
            item['sentiment'] = determine_sentiment(item['title'], item['description'])
            item['source_type'] = classify_source_type(item['link'])
            item['source_name'] = 'Naver News'
            if is_within_period(date_str, period_years=2):
                all_items.append(item)

    # Blog API
    for query in queries[:3]:
        items = search_naver_api(
            query, display=50, api_type="blog",
            throttle_ms=300, max_retries=3, sentiment_type="free"
        )
        for item in items:
            date_str = parse_naver_date(item['pub_date'])
            item['published_date'] = date_str
            item['sentiment'] = determine_sentiment(item['title'], item['description'])
            item['source_type'] = classify_source_type(item['link'])
            item['source_name'] = 'Naver Blog'
            if is_within_period(date_str, period_years=2):
                all_items.append(item)

    public_items = [item for item in all_items if item['source_type'] == 'PUBLIC']

    seen_urls = set()
    unique_items = []
    for item in public_items:
        if item['link'] not in seen_urls:
            seen_urls.add(item['link'])
            unique_items.append(item)

    distributed = distribute_by_sentiment(unique_items, target_neg=10, target_pos=10, target_free=28)
    saved = save_to_database(politician_id, politician_name, category, distributed, 'PUBLIC')
    print(f"  [OK] PUBLIC: {saved} items saved (target: 48)")
    return {'collected': saved, 'target': 48}


def collect_category(politician_id: str, politician_name: str,
                    category: str, source_type: str = None, limit: int = None) -> Dict:
    """단일 카테고리 수집"""
    qualifier = _load_politician_qualifier(politician_name)

    print(f"\n{'='*60}")
    print(f"[START] {category.upper()} - {politician_name}")
    if qualifier:
        print(f"  [동명이인 필터] 검색 한정어: '{qualifier}'")
    if source_type:
        print(f"  타입: {source_type.upper()}")
    if limit:
        print(f"  제한: {limit}개")
    print(f"{'='*60}")

    official_result = {'collected': 0, 'target': 0}
    public_result = {'collected': 0, 'target': 0}

    if source_type is None or source_type.upper() == 'OFFICIAL':
        official_result = collect_official(politician_id, politician_name, category, qualifier)

    if source_type is None or source_type.upper() == 'PUBLIC':
        public_result = collect_public(politician_id, politician_name, category, qualifier)

    total_collected = official_result['collected'] + public_result['collected']
    total_target = official_result['target'] + public_result['target']

    print(f"\n{'='*60}")
    print(f"[COMPLETE] {category.upper()}: {total_collected}/{total_target} items")
    if official_result['target'] > 0:
        print(f"  OFFICIAL: {official_result['collected']}/{official_result['target']}")
    if public_result['target'] > 0:
        print(f"  PUBLIC:   {public_result['collected']}/{public_result['target']}")
    print(f"{'='*60}\n")

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

    parser = argparse.ArgumentParser(description='V50 Naver API Instruction-Based Collection')
    parser.add_argument('--politician-id', required=True, help='정치인 ID (8자리 hex)')
    parser.add_argument('--politician-name', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True,
                       choices=[
                           'expertise', 'leadership', 'vision', 'integrity', 'ethics',
                           'accountability', 'transparency', 'communication',
                           'responsiveness', 'publicinterest'
                       ],
                       help='카테고리')
    parser.add_argument('--source-type', choices=['OFFICIAL', 'PUBLIC', 'official', 'public'],
                       help='소스 타입 (지정하지 않으면 둘 다 수집)')
    parser.add_argument('--limit', type=int, help='수집 개수 제한')

    args = parser.parse_args()

    # 동시 실행 시 캐시 파일 경쟁 조건 방지: politician_id별 고유 캐시 파일 사용
    global CACHE_FILE
    CACHE_FILE = CACHE_DIR / f"naver_cache_v50_{args.politician_id}.json"

    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print("[ERROR] Naver API keys not found in .env file")
        print("  NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 환경변수 설정 필요")
        sys.exit(1)

    result = collect_category(
        args.politician_id,
        args.politician_name,
        args.category,
        source_type=args.source_type,
        limit=args.limit
    )

    if result['success']:
        print(f"\n[SUCCESS] {result['collected']}/{result['target']} items collected")
        sys.exit(0)
    else:
        print(f"\n[FAILED] 0 items collected")
        sys.exit(1)


if __name__ == '__main__':
    main()
