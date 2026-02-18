#!/usr/bin/env python3
"""
V40 Naver API Perfect Instruction-Based Collection
==================================================

완벽한 Instruction 파일 기반 수집:
- instructions/2_collect/prompts/naver_official.md (12개, 1-1-10 센티멘트)
- instructions/2_collect/prompts/naver_public.md (48개, 10-10-28 센티멘트)
- instructions/2_collect/cat01~10.md (카테고리별 상세 지침)

V40 정확한 배분:
- OFFICIAL: 12개 (10 + 20% 버퍼), negative 1 / positive 1 / free 10
- PUBLIC: 48개 (40 + 20% 버퍼), negative 10 / positive 10 / free 28
- OFFICIAL 기간: 4년, PUBLIC 기간: 2년

사용법:
    python collect_naver_v40_final.py --politician-id 8c5dcc89 --politician-name "박주민" --category expertise
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
from urllib.parse import quote
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
INSTRUCTIONS_DIR = V40_DIR / "instructions" / "2_collect"
PROMPTS_DIR = INSTRUCTIONS_DIR / "prompts"
ENV_PATH = V40_DIR.parent / '.env'

# 캐시 설정
CACHE_DIR = SCRIPT_DIR / ".cache"
CACHE_FILE = CACHE_DIR / "naver_cache.json"
CACHE_DIR.mkdir(exist_ok=True)

# .env 파일 로드
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
    print(f"[INFO] .env loaded: {ENV_PATH}")
else:
    load_dotenv()

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


# ✅ 캐시 관리 함수 (Step 1: 중복 검색 방지)
def _get_cache() -> Dict:
    """캐시 파일 로드 (없으면 빈 딕셔너리 반환)"""
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
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
        print(f"  ✅ [CACHE HIT] {query} ({api_type})")
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

    예: "조은희" → "국회의원", "정원오" → "성동구청장", "오세훈" → "서울시장"

    Naver API는 키워드 검색이므로, 검색어에 직책/직함을 추가하여
    동명이인 결과를 최소화합니다.
    """
    pol_file = V40_DIR / 'instructions' / '1_politicians' / f'{politician_name}.md'
    if not pol_file.exists():
        return ''

    with open(pol_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1순위: "수집 시 키워드 사용 필수" 라인에서 추출
    for line in content.split('\n'):
        if '키워드 사용 필수' in line:
            # "조은희 국회의원" 또는 "정원오 성동구" 같은 패턴 추출
            import re
            m = re.search(r'"([^"]+)"', line)
            if m:
                keyword = m.group(1)
                # 정치인 이름 제거하고 한정어만 반환
                qualifier = keyword.replace(politician_name, '').strip()
                if qualifier:
                    return qualifier

    # 2순위: 현 직책에서 짧은 한정어 추출
    for line in content.split('\n'):
        if '현 직책' in line:
            import re
            m = re.search(r'\|\s*(.+?)\s*\|', line.split('현 직책')[1])
            if m:
                position = m.group(1).strip()
                # 짧은 핵심어 추출: "국회의원 (재선)" → "국회의원"
                # "성동구청장 (3선, 민선 6~8기)" → "성동구청장"
                # "서울특별시장 (민선 8기, 4선)" → "서울시장"
                core = position.split('(')[0].strip()
                core = core.replace('서울특별시장', '서울시장')
                return core

    return ''


def load_category_instruction(category: str) -> Dict:
    """
    카테고리별 instruction 로드
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

    # === 섹션 4: 10개 평가 항목 추출 ===
    items_match = re.search(r'##\s*4\..*?평가 범위.*?\n(.*?)(?=\n##\s*5\.)', content, re.DOTALL)
    evaluation_items = []

    if items_match:
        items_section = items_match.group(1)
        # 테이블에서 항목명 추출 (| 4-1 | **항목명** | 설명 | 형식)
        item_pattern = r'\|\s*\d+-\d+\s*\|\s*\*\*(.*?)\*\*\s*\|'
        items_found = re.findall(item_pattern, items_section)
        evaluation_items = [item.strip() for item in items_found if item.strip()]

    # === 섹션 11: 검색 키워드 추출 ===
    keywords_match = re.search(r'##\s*11\..*?검색 키워드.*?\n(.*?)(?=\n##\s*12\.|\n##\s*13\.|\Z)', content, re.DOTALL)

    keywords_positive = []
    keywords_negative = []
    keywords_free = []

    if keywords_match:
        keywords_section = keywords_match.group(1)

        # 긍정 키워드 추출
        pos_match = re.search(r'긍정[:\s]*\n(.*?)(?=\n부정[:\s]*|\n자유)', keywords_section, re.DOTALL | re.IGNORECASE)
        if pos_match:
            pos_text = pos_match.group(1)
            keywords_positive = [
                line.strip().replace('- ', '').replace('"', '').replace('{정치인명}', '').strip()
                for line in pos_text.split('\n')
                if line.strip() and line.strip().startswith('-')
            ]

        # 부정 키워드 추출
        neg_match = re.search(r'부정[:\s]*\n(.*?)(?=\n자유|\n\n|$)', keywords_section, re.DOTALL | re.IGNORECASE)
        if neg_match:
            neg_text = neg_match.group(1)
            keywords_negative = [
                line.strip().replace('- ', '').replace('"', '').replace('{정치인명}', '').strip()
                for line in neg_text.split('\n')
                if line.strip() and line.strip().startswith('-')
            ]

        # 자유 키워드 추출
        free_match = re.search(r'자유.*?[:\s]*\n(.*?)(?=\n\n|⚠️|$)', keywords_section, re.DOTALL | re.IGNORECASE)
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

    Rate Limit 극복 방법:
    - throttle_ms: 각 요청 간 대기 시간 (기본 300ms)
    - max_retries: 429 에러 시 최대 재시도 횟수 (기본 3회)
    - 캐싱: 같은 쿼리 반복 요청 시 캐시 결과 반환 (중복 검색 방지)
    """

    # ✅ Step 1: 캐시 확인 (중복 검색 방지)
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

    # Throttle: 요청 전에 대기
    time.sleep(throttle_ms / 1000)

    # Exponential Backoff with Retry
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

            # ✅ Step 1: 캐시 저장 (다음 번 재요청 시 사용)
            _save_cache_result(query, api_type, sentiment_type, items)

            return items

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:  # Rate Limit
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

    # Blog: YYYYMMDD
    if len(date_str) == 8 and date_str.isdigit():
        return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"

    # News: RFC 1123 format
    try:
        dt = datetime.strptime(date_str, "%a, %d %b %Y %H:%M:%S %z")
        return dt.strftime("%Y-%m-%d")
    except:
        return datetime.now().strftime("%Y-%m-%d")


def is_within_period(date_str: str, period_years: int) -> bool:
    """날짜가 기간 내인지 확인"""
    try:
        item_date = datetime.strptime(date_str, "%Y-%m-%d")
        cutoff_date = datetime.now() - timedelta(days=365 * period_years)
        return item_date >= cutoff_date
    except:
        return False  # 날짜 파싱 실패 시 제외


def determine_sentiment(title: str, description: str) -> str:
    """제목과 내용으로 sentiment 판단"""

    text = (title + " " + description).lower()

    # 부정 키워드 (확장)
    negative_keywords = ['논란', '비판', '사퇴', '의혹', '문제', '실책', '반발', '비난',
                        '부적절', '실망', '우려', '지적', '비난', '반대', '경고']
    # 긍정 키워드 (확장)
    positive_keywords = ['성과', '수상', '칭찬', '모범', '공헌', '선정', '1위',
                        '성공', '발전', '우수', '표창', '수상', '인정', '향상']

    neg_count = sum(1 for kw in negative_keywords if kw in text)
    pos_count = sum(1 for kw in positive_keywords if kw in text)

    if neg_count > pos_count:
        return 'negative'
    elif pos_count > neg_count:
        return 'positive'
    else:
        return 'free'


def classify_data_type(url: str) -> str:
    """URL 도메인으로 data_type 분류 (개선 버전)"""

    # OFFICIAL 도메인 (정확한 목록)
    official_domains = [
        '.go.kr',           # 모든 정부 도메인
        'assembly.go.kr',   # 국회
        'korea.kr',         # 정부24
        'law.go.kr',        # 국가법령정보센터
        'nanet.go.kr',      # 국회 전자도서관
        'moleg.go.kr'       # 법제처
    ]

    url_lower = url.lower()

    # .go.kr 체크만으로도 충분 (다른 것들은 모두 .go.kr 포함)
    if '.go.kr' in url_lower:
        return 'official'

    return 'public'


def distribute_by_sentiment(items: List[Dict], target_neg: int, target_pos: int,
                           target_free: int) -> List[Dict]:
    """센티멘트 배분에 맞게 데이터 선택 (완벽 버전)"""

    # 센티멘트별로 분류
    negative_items = [item for item in items if item.get('sentiment') == 'negative']
    positive_items = [item for item in items if item.get('sentiment') == 'positive']
    free_items = [item for item in items if item.get('sentiment') == 'free']

    result = []

    # 1. negative 목표 수만큼 선택
    selected_neg = negative_items[:target_neg]
    result.extend(selected_neg)

    # 2. positive 목표 수만큼 선택
    selected_pos = positive_items[:target_pos]
    result.extend(selected_pos)

    # 3. free 목표 수만큼 선택
    selected_free = free_items[:target_free]
    result.extend(selected_free)

    # 4. 부족분은 남은 항목에서 추가 (센티멘트 무관)
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
                    data_type: str) -> int:
    """Naver 수집 데이터를 DB에 저장"""

    if not items:
        return 0

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    saved_count = 0

    for item in items:
        try:
            # 중복 체크 (같은 AI가 수집한 URL만 체크)
            url = item['link']
            existing = supabase.table('collected_data_v40').select('id').eq(
                'politician_id', politician_id
            ).eq('category', category).eq('source_url', url).eq(
                'collector_ai', 'Naver'
            ).execute()

            if existing.data:
                continue  # 이미 Naver가 수집한 URL은 스킵

            # 모든 필드 설정
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
                'published_date': item.get('published_date', ''),
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
                    category: str, qualifier: str = '') -> Dict:
    """
    OFFICIAL 데이터 수집 (12개 = 10 + 20% 버퍼)
    센티멘트: negative 1 / positive 1 / free 10
    기간: 4년

    Webkr API 사용 - .go.kr 도메인 직접 검색
    """
    print(f"\n[INFO] [OFFICIAL] Collecting {category} (target: 12 items)...")
    if qualifier:
        print(f"  [동명이인 필터] 한정어: '{qualifier}'")

    category_kr = CATEGORY_KR_MAP.get(category, category)
    cat_inst = load_category_instruction(category)

    # 검색명: 한정어가 있으면 포함 (동명이인 방지)
    search_name = f"{politician_name} {qualifier}" if qualifier else politician_name

    # 기본 쿼리 (한정어 포함)
    queries = [
        f"{search_name} {category_kr} site:go.kr",
        f"{search_name} site:assembly.go.kr",
        f"{search_name} site:likms.assembly.go.kr",
    ]

    # 10개 항목으로 검색 쿼리 생성
    for item in cat_inst['evaluation_items'][:5]:  # 상위 5개 항목
        queries.append(f"{search_name} {item} site:go.kr")

    # 키워드로 검색 쿼리 생성 (긍정/부정/자유 모두 활용)
    all_keywords = (
        cat_inst['keywords_positive'][:2] +
        cat_inst['keywords_negative'][:2] +
        cat_inst['keywords_free'][:2]
    )
    for kw in all_keywords:
        if kw:
            queries.append(f"{politician_name} {kw} site:go.kr")

    all_items = []

    # Webkr API로 수집 (Web Document Search - 정부 사이트 직접 검색)
    # Throttle: 300ms 간격으로 요청 (Rate Limit 극복)
    for query in queries[:6]:  # 최대 6개 쿼리
        items = search_naver_api(query, display=50, api_type="webkr", throttle_ms=300, max_retries=3, sentiment_type="free")

        for item in items:
            # Webkr는 postdate 필드 사용
            date_str = item.get('postdate', '')

            # 날짜가 없으면 현재 날짜 사용 (Webkr는 날짜 정보가 없는 경우 많음)
            if not date_str or date_str == '':
                from datetime import datetime
                date_str = datetime.now().strftime('%Y-%m-%d')
            elif len(date_str) == 8:
                # YYYYMMDD 형식을 YYYY-MM-DD로 변환
                date_str = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"

            item['published_date'] = date_str
            item['sentiment'] = determine_sentiment(item['title'], item['description'])
            item['data_type'] = classify_data_type(item['link'])
            item['source_name'] = 'Naver Webkr'
            item['pub_date'] = date_str  # 호환성을 위해 추가

            # OFFICIAL 타입만 추가 + 기간 필터링 (4년)
            if item['data_type'] == 'official':
                # 기간 필터링: 수집일로부터 4년 이내만
                if is_within_period(date_str, period_years=4):
                    all_items.append(item)

    # OFFICIAL만 필터링
    official_items = [item for item in all_items if item['data_type'] == 'official']

    # 중복 제거 (URL 기준)
    seen_urls = set()
    unique_items = []
    for item in official_items:
        if item['link'] not in seen_urls:
            seen_urls.add(item['link'])
            unique_items.append(item)

    # 센티멘트 배분 (1-1-10 = 12개)
    distributed = distribute_by_sentiment(unique_items, target_neg=1, target_pos=1, target_free=10)

    # DB 저장
    saved = save_to_database(politician_id, politician_name, category, distributed, 'official')

    print(f"  [OK] OFFICIAL: {saved} items saved (target: 12)")

    return {
        'collected': saved,
        'target': 12
    }


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

    # 검색명: 한정어가 있으면 포함 (동명이인 방지)
    search_name = f"{politician_name} {qualifier}" if qualifier else politician_name

    # 기본 쿼리 (한정어 포함으로 동명이인 방지)
    queries = [f"{search_name} {category_kr}"]

    # 10개 항목으로 검색 쿼리 생성 (한정어 포함)
    for item in cat_inst['evaluation_items'][:8]:  # 상위 8개 항목 (PUBLIC은 더 많이)
        queries.append(f"{search_name} {item}")

    # 키워드로 검색 쿼리 생성 (긍정/부정/자유 모두 활용)
    # PUBLIC은 더 많은 키워드 사용 (48개 목표이므로)
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

    # News API (display=50으로 증가)
    # Throttle: 300ms 간격으로 요청 (Rate Limit 극복)
    for query in queries[:3]:
        items = search_naver_api(query, display=50, api_type="news", throttle_ms=300, max_retries=3, sentiment_type="free")
        for item in items:
            date_str = parse_naver_date(item['pub_date'])
            item['published_date'] = date_str
            item['sentiment'] = determine_sentiment(item['title'], item['description'])
            item['data_type'] = classify_data_type(item['link'])
            item['source_name'] = 'Naver News'

            # 기간 필터링: 2년 이내만
            if is_within_period(date_str, period_years=2):
                all_items.append(item)

    # Blog API (display=50으로 증가)
    # Throttle: 300ms 간격으로 요청 (Rate Limit 극복)
    for query in queries[:3]:
        items = search_naver_api(query, display=50, api_type="blog", throttle_ms=300, max_retries=3, sentiment_type="free")
        for item in items:
            date_str = parse_naver_date(item['pub_date'])
            item['published_date'] = date_str
            item['sentiment'] = determine_sentiment(item['title'], item['description'])
            item['data_type'] = classify_data_type(item['link'])
            item['source_name'] = 'Naver Blog'

            # 기간 필터링: 2년 이내만
            if is_within_period(date_str, period_years=2):
                all_items.append(item)

    # PUBLIC만 필터링
    public_items = [item for item in all_items if item['data_type'] == 'public']

    # 중복 제거
    seen_urls = set()
    unique_items = []
    for item in public_items:
        if item['link'] not in seen_urls:
            seen_urls.add(item['link'])
            unique_items.append(item)

    # 센티멘트 배분 (10-10-28 = 48개)
    distributed = distribute_by_sentiment(unique_items, target_neg=10, target_pos=10, target_free=28)

    # DB 저장
    saved = save_to_database(politician_id, politician_name, category, distributed, 'public')

    print(f"  [OK] PUBLIC: {saved} items saved (target: 48)")

    return {
        'collected': saved,
        'target': 48
    }


def collect_category(politician_id: str, politician_name: str,
                    category: str, data_type: str = None, limit: int = None) -> Dict:
    """
    단일 카테고리 수집

    Args:
        data_type: 'official' or 'public' (None이면 둘 다)
        limit: 수집 개수 제한 (None이면 기본값)
    """

    # 동명이인 방지: 정치인 MD 파일에서 검색 한정어 로드
    qualifier = _load_politician_qualifier(politician_name)

    print(f"\n{'='*60}")
    print(f"[START] {category.upper()} - {politician_name}")
    if qualifier:
        print(f"  [동명이인 필터] 검색 한정어: '{qualifier}'")
    if data_type:
        print(f"  타입: {data_type.upper()}")
    if limit:
        print(f"  제한: {limit}개")
    print(f"{'='*60}")

    official_result = {'collected': 0, 'target': 0}
    public_result = {'collected': 0, 'target': 0}

    # OFFICIAL 수집 (한정어 전달)
    if data_type is None or data_type == 'official':
        official_result = collect_official(politician_id, politician_name, category, qualifier)

    # PUBLIC 수집 (한정어 전달)
    if data_type is None or data_type == 'public':
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

    parser = argparse.ArgumentParser(description='Naver API Perfect Instruction-Based Collection')
    parser.add_argument('--politician-id', required=True, help='정치인 ID')
    parser.add_argument('--politician-name', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True,
                       choices=[
                           'expertise', 'leadership', 'vision', 'integrity', 'ethics',
                           'accountability', 'transparency', 'communication',
                           'responsiveness', 'publicinterest'
                       ],
                       help='카테고리')
    parser.add_argument('--data-type', choices=['official', 'public'],
                       help='데이터 타입 (지정하지 않으면 둘 다 수집)')
    parser.add_argument('--limit', type=int,
                       help='수집 개수 제한')

    args = parser.parse_args()

    # 환경 변수 확인
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print("[ERROR] Naver API keys not found in .env file")
        sys.exit(1)

    result = collect_category(
        args.politician_id,
        args.politician_name,
        args.category,
        data_type=args.data_type,
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
