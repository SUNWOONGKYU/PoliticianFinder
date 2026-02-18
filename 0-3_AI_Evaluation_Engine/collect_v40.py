# -*- coding: utf-8 -*-
#
# V40 Data Collection Script (50-50 Gemini+Naver 배분 확정 - 2026-02-01)
#
# ============================================================
# 🚨 절대 규칙 (50-50 배분, 카테고리당 100개+20%버퍼)
# ============================================================
# | 구분            | 기본 | 최대(120%) | 역할                          |
# |-----------------|------|------------|-------------------------------|
# | Gemini OFFICIAL | 30개 | 36개       | 국회, 정부, 지방정부, 공공기관 |
# | Gemini PUBLIC   | 20개 | 24개       | 모든 PUBLIC (뉴스, 블로그 등)  |
# | Naver OFFICIAL  | 10개 | 12개       | 정부/공공기관 (.go.kr)         |
# | Naver PUBLIC    | 40개 | 48개       | 뉴스, 블로그, 카페, 커뮤니티   |
# | 총계            | 100개| 120개      |                               |
# ============================================================
#
# 검증 후 처리:
#   - 100개 이상 → 패스 ✅
#   - 100개 미만 → 추가 수집 🔄 (버퍼 범위 내 최대 120개)
#
# 역할 분담:
#   - Gemini: OFFICIAL (정부/공공) + PUBLIC (모든 소스, 소스 제한 없음)
#   - Naver: OFFICIAL (.go.kr 도메인) + PUBLIC (뉴스, 블로그, 카페 등)
#
# V40 핵심 변경:
#   - Perplexity → Naver Search API로 교체
#   - Gemini PUBLIC 뉴스 차단 완전 제거 (소스 제한 없음)
#   - OFFICIAL 10-10-80 / PUBLIC 20-20-60
#
# Usage:
#     # Full Collection (Gemini + Naver)
#     python collect_v40.py --politician_id=d0a5d6e1 --politician_name="조은희"
#
#     # Run specific AI only
#     python collect_v40.py --politician_id=d0a5d6e1 --politician_name="조은희" --ai=Gemini
#     python collect_v40.py --politician_id=d0a5d6e1 --politician_name="조은희" --ai=Naver
#
#     # Specific Category only
#     python collect_v40.py --politician_id=d0a5d6e1 --politician_name="조은희" --category=1
#
#     # Mini Test (20 items per category)
#     python collect_v40.py --politician_id=d0a5d6e1 --politician_name="조은희" --test
#

import os
import sys
import json
import re
from duplicate_check_utils import normalize_url, normalize_title, is_duplicate_by_url, is_duplicate_by_title
import argparse
import time
import random
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client
from dotenv import load_dotenv
import uuid
from html.parser import HTMLParser
from urllib.parse import urlparse, urlencode

# UTF-8 Output Setting
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        pass

# ============================================================
# HTML Tag Stripper
# ============================================================
class HTMLStripper(HTMLParser):
    """HTML 태그 제거"""
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.text = []

    def handle_data(self, d):
        self.text.append(d)

    def get_data(self):
        return ''.join(self.text)

def strip_html_tags(html_text):
    """HTML 태그 제거 후 순수 텍스트 반환"""
    if not html_text:
        return ""
    s = HTMLStripper()
    s.feed(html_text)
    return s.get_data()

# ============================================================
# URL 검증 함수 (V30 동일)
# ============================================================

def validate_url(url: str, timeout: float = 5.0) -> bool:
    """URL 검증 (GET stream=True + User-Agent) - 90%+ 성공률"""
    if not url or 'dummy' in url.lower():
        return False

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    try:
        response = requests.get(url, timeout=timeout, allow_redirects=True,
                               headers=headers, stream=True)
        response.close()
        return response.status_code < 400
    except:
        return False


def resolve_redirect_url(redirect_url: str, timeout: float = 10.0) -> str:
    """Gemini redirect URL을 실제 URL로 변환"""
    if not redirect_url or 'grounding-api-redirect' not in redirect_url:
        return redirect_url

    try:
        response = requests.head(redirect_url, timeout=timeout, allow_redirects=False)
        if response.status_code in [301, 302, 303, 307, 308] and 'Location' in response.headers:
            return response.headers['Location']
    except:
        pass

    return redirect_url


def extract_json_from_text(text: str) -> str:
    """텍스트에서 JSON 배열을 추출 (robust)"""
    if not text:
        return "[]"

    # 방법 1: ```json 블록 추출
    if '```json' in text:
        match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
        if match:
            return match.group(1).strip()

    # 방법 2: ``` 블록 추출
    if '```' in text:
        match = re.search(r'```\s*([\s\S]*?)\s*```', text)
        if match:
            content = match.group(1).strip()
            if content.startswith('['):
                return content

    # 방법 3: [ ... ] 배열 직접 추출
    match = re.search(r'\[\s*\{[\s\S]*\}\s*\]', text)
    if match:
        return match.group(0)

    # 방법 4: 텍스트 자체가 JSON일 경우
    stripped = text.strip()
    if stripped.startswith('[') and stripped.endswith(']'):
        return stripped

    # 방법 5: 개별 {} 객체 수집하여 배열로 만들기
    objects = re.findall(r'\{[^{}]+\}', text)
    if objects:
        valid_objects = []
        for obj in objects:
            try:
                parsed = json.loads(obj)
                if isinstance(parsed, dict) and ('data_title' in parsed or 'title' in parsed or 'source_url' in parsed or 'url' in parsed):
                    valid_objects.append(obj)
            except:
                pass
        if valid_objects:
            return '[' + ','.join(valid_objects) + ']'

    return "[]"


# ============================================================
# topic_mode -> DB sentiment mapping
# ============================================================
def topic_mode_to_sentiment(topic_mode):
    """Converts topic_mode to DB sentiment value
    ⚠️ sentiment 값: instructions/2_collect/cat01~10 Section 12 참조
    유효값: negative / positive / free
    """
    mapping = {
        'negative': 'negative',
        'positive': 'positive',
        'free': 'free'
    }
    return mapping.get(topic_mode, 'free')


# Load environment variables
load_dotenv(override=True)

# Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V40 Table Name
TABLE_COLLECTED_DATA = "collected_data_v40"

# AI Client Cache
ai_clients = {}

# Category Definitions (V40)
CATEGORIES = [
    ("expertise", "Expertise"),
    ("leadership", "Leadership"),
    ("vision", "Vision"),
    ("integrity", "Integrity"),
    ("ethics", "Ethics"),
    ("accountability", "Accountability"),
    ("transparency", "Transparency"),
    ("communication", "Communication"),
    ("responsiveness", "Responsiveness"),
    ("publicinterest", "PublicInterest")
]

# ============================================================
# 🚨 V40 절대 규칙 - 수집 배분 (50-50, 20% 버퍼)
# ============================================================
# | 구분            | 기본 | 최대(120%) | 역할                          |
# |-----------------|------|------------|-------------------------------|
# | Gemini OFFICIAL | 30   | 36개       | 국회, 정부, 지방정부, 공공기관 |
# | Gemini PUBLIC   | 20   | 24개       | 모든 PUBLIC (소스 제한 없음)   |
# | Naver OFFICIAL  | 10   | 12개       | 정부/공공기관 (.go.kr)         |
# | Naver PUBLIC    | 40   | 48개       | 뉴스, 블로그, 카페, 커뮤니티   |
# | 총계            | 100  | 120개      |                               |
# ============================================================
COLLECT_DISTRIBUTION = {
    "Gemini": {
        "official": 36,  # OFFICIAL - 국회, 정부, 지방정부 (최소 목표, 초과 허용)
        "public": 24,    # PUBLIC - 모든 소스 허용
        "total": 60      # 60개 (최소 목표 + 버퍼 20%)
    },
    "Naver": {
        "official": 12,  # OFFICIAL - .go.kr 도메인
        "public": 48,    # PUBLIC - 뉴스, 블로그, 카페 등
        "total": 60      # 60개 (최소 목표 + 버퍼 20%)
    }
    # 총 수집: 최소 120개 → 검증 → 100개 확보 (초과 수집 허용)
}

# 추가 버퍼 없음 (120% 버퍼가 COLLECT_DISTRIBUTION에 이미 포함)
EXTRA_BUFFER = 0

# Mini Test Allocation (1/5 scale) - 절대 규칙 비율 유지
TEST_DISTRIBUTION = {
    "Gemini": {
        "official": 6,   # OFFICIAL (6개)
        "public": 4,     # PUBLIC (4개)
        "total": 10      # 10개
    },
    "Naver": {
        "official": 2,   # OFFICIAL (2개)
        "public": 8,     # PUBLIC (8개)
        "total": 10      # 10개
    }
    # 테스트 총: 20개
}

# ============================================================
# Sentiment별 MIN/MAX 규칙
# - MIN: 기본 목표 (버퍼 없음). 이 이하면 반드시 추가 수집
# - MAX: 버퍼 포함 최대량. 이 이상이면 추가 수집 금지
# - MIN~MAX 사이: 충분. 추가 수집 불필요
# OFFICIAL: neg/pos 각 10% 이상
# PUBLIC:   neg/pos 각 20% 이상
# ============================================================
# ⚠️ sentiment 키: instructions/2_collect/cat01~10 Section 12 참조
# 유효값: negative / positive / free
SENTIMENT_MIN = {
    "Gemini": {
        "official": {"negative": 3, "positive": 3, "free": 24},    # 기본 30개
        "public": {"negative": 4, "positive": 4, "free": 12}       # 기본 20개
    },
    "Naver": {
        "official": {"negative": 1, "positive": 1, "free": 8},     # 기본 10개
        "public": {"negative": 8, "positive": 8, "free": 24}       # 기본 40개
    }
}
SENTIMENT_MAX = {
    "Gemini": {
        "official": {"negative": 4, "positive": 4, "free": 28},    # 버퍼 포함 36개 (MAX)
        "public": {"negative": 5, "positive": 5, "free": 14}       # 버퍼 포함 24개 (MAX)
    },
    "Naver": {
        "official": {"negative": 2, "positive": 2, "free": 8},     # 버퍼 포함 12개 (MAX)
        "public": {"negative": 10, "positive": 10, "free": 28}     # 버퍼 포함 48개 (MAX)
    }
}
# 하위 호환: 기존 코드에서 SENTIMENT_DISTRIBUTION 참조하는 곳 대응
SENTIMENT_DISTRIBUTION = SENTIMENT_MAX

# Test Mode 20-20-60 Allocation (1/5 scale)
TEST_SENTIMENT_DISTRIBUTION = {
    "Gemini": {
        "official": {"negative": 1, "positive": 1, "free": 4},     # 6개
        "public": {"negative": 1, "positive": 1, "free": 2}        # 4개
    },
    "Naver": {
        "official": {"negative": 0, "positive": 0, "free": 2},     # 2개
        "public": {"negative": 2, "positive": 2, "free": 4}        # 8개
    }
}

# AI Model Configuration
AI_CONFIGS = {
    "Gemini": {
        "model": "gemini-2.0-flash",
        "env_key": "GEMINI_API_KEY"
    },
    "Naver": {
        "env_key_id": "NAVER_CLIENT_ID",
        "env_key_secret": "NAVER_CLIENT_SECRET"
    }
}

# Naver Search API Endpoints
NAVER_SEARCH_ENDPOINTS = {
    'news': 'https://openapi.naver.com/v1/search/news.json',
    'blog': 'https://openapi.naver.com/v1/search/blog.json',
    'cafearticle': 'https://openapi.naver.com/v1/search/cafearticle.json',
    'kin': 'https://openapi.naver.com/v1/search/kin.json',
    'webkr': 'https://openapi.naver.com/v1/search/webkr.json',
    'doc': 'https://openapi.naver.com/v1/search/doc.json',
    'encyc': 'https://openapi.naver.com/v1/search/encyc.json',
}

# Official Data Domains (Gemini OFFICIAL Source)
OFFICIAL_DOMAINS = [
    "assembly.go.kr",
    "likms.assembly.go.kr",
    "mois.go.kr",
    "korea.kr",
    "nec.go.kr",
    "bai.go.kr",
    "pec.go.kr",
    "scourt.go.kr",
    "nesdc.go.kr",
    "manifesto.or.kr",
    "peoplepower21.org",
    "theminjoo.kr",
    "seoul.go.kr",
    "gg.go.kr",
    "busan.go.kr",
    "incheon.go.kr",
    "daegu.go.kr",
    "daejeon.go.kr",
    "gwangju.go.kr",
    "ulsan.go.kr",
    "sejong.go.kr",
    "open.go.kr",
    "acrc.go.kr",
    "humanrights.go.kr"
]

# ============================================================
# Gemini 도메인 순환 리스트 (URL 다양성 확보)
# ============================================================
GEMINI_OFFICIAL_DOMAIN_HINTS = [
    "site:assembly.go.kr",          # 0: 국회
    "site:likms.assembly.go.kr",    # 1: 의안정보시스템
    "site:korea.kr",                # 2: 정부 대표
    "site:open.go.kr",              # 3: 정보공개
    "site:seoul.go.kr",             # 4: 서울시
    "site:manifesto.or.kr OR site:nec.go.kr",  # 5: 선거/공약
    "site:mois.go.kr OR site:acrc.go.kr",      # 6: 행안부/권익위
    "site:bai.go.kr OR site:peoplepower21.org", # 7: 감사원/참여연대
    "",                             # 8: 자유 검색
    "",                             # 9: 자유 검색
]

# V40: Gemini PUBLIC - 소스 제한 없음! (뉴스 차단 완전 제거)
GEMINI_PUBLIC_PLATFORM_HINTS = [
    "",  # 제한 없음 - 모든 소스에서 자유롭게 수집
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
]

# Politician Details Cache
_politician_info_cache = {}

def get_politician_info(politician_id):
    """Retrieve detailed politician information (for distinguishing identical names)"""
    if politician_id in _politician_info_cache:
        return _politician_info_cache[politician_id]

    try:
        # politicians 테이블 우선 (모든 필드 보유: previous_position, birth_date 등)
        result = supabase.table('politicians').select('*').eq('id', politician_id).execute()
        if not result.data:
            result = supabase.table('politicians_v40').select('*').eq('id', politician_id).execute()

        if result.data:
            p = result.data[0]
            name = p.get('name', '')
            party = p.get('party', '')
            position = p.get('position', 'National Assembly Member')
            district = p.get('district', '')
            previous_position = p.get('previous_position', '')
            gender = p.get('gender', '')
            birth_year = ""
            if p.get('birth_date'):
                birth_year = str(p.get('birth_date'))[:4] + "년생"

            # search_string 구성: 핵심정보 + 구분정보
            search_string = f"{party} {name} {position}"
            if district:
                search_string += f" {district}"
            if previous_position:
                search_string += f" (전직: {previous_position})"
            if gender:
                search_string += f" {gender}"
            if birth_year:
                search_string += f" {birth_year}"

            info = {
                'name': name,
                'party': party,
                'position': position,
                'district': district,
                'birth_year': birth_year,
                'search_string': search_string
            }
            _politician_info_cache[politician_id] = info
            return info
    except Exception as e:
        print(f"  [WARN] Failed to retrieve politician info: {e}")

    return {'name': '', 'party': '', 'position': 'National Assembly Member', 'district': '', 'birth_year': '', 'search_string': ''}

# Category Items (V40)
def load_category_items_from_instructions():
    """instructions 파일에서 카테고리별 10개 항목을 동적으로 로드.

    파일 위치: 설계문서_V7.0/V40/instructions/2_collect/cat{01~10}_{category}.md
    테이블 형식: | # | **항목명** | 설명 |

    Returns:
        dict: { "expertise": [("항목명", "설명"), ...], ... }
    """
    import glob

    base_dir = os.path.join(os.path.dirname(__file__), "설계문서_V7.0", "V40", "instructions", "2_collect")
    category_file_map = {
        "expertise": "cat01_expertise.md",
        "leadership": "cat02_leadership.md",
        "vision": "cat03_vision.md",
        "integrity": "cat04_integrity.md",
        "ethics": "cat05_ethics.md",
        "accountability": "cat06_accountability.md",
        "transparency": "cat07_transparency.md",
        "communication": "cat08_communication.md",
        "responsiveness": "cat09_responsiveness.md",
        "publicinterest": "cat10_publicinterest.md",
    }

    result = {}
    for category_name, filename in category_file_map.items():
        filepath = os.path.join(base_dir, filename)
        items = []
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # 테이블에서 항목 추출: | N-N | **항목명** | 설명 |
            import re as _re
            pattern = r'\|\s*\d+-\d+\s*\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|'
            matches = _re.findall(pattern, content)

            for item_name, description in matches:
                # (항목명, 설명) - 설명을 검색 키워드로 활용
                items.append((item_name.strip(), description.strip()))

            if len(items) != 10:
                print(f"  [WARN] {category_name}: {len(items)}개 항목 로드 (10개 예상)")

        except FileNotFoundError:
            print(f"  [ERROR] 파일 없음: {filepath}")
        except Exception as e:
            print(f"  [ERROR] {category_name} 파일 로드 실패: {e}")

        # 실패 시 빈 리스트 대신 기본값
        if not items:
            items = [("", "")]

        result[category_name] = items

    return result

# instructions 파일에서 동적 로드 (하드코딩 제거)
CATEGORY_ITEMS = load_category_items_from_instructions()

# Translate CATEGORIES to a dictionary for easier lookup
CATEGORIES_DICT = {item[0]: item[1] for item in CATEGORIES}

# ============================================================
# SafeFormatDict: .format_map()에서 누락 키를 원본 유지
# ============================================================
class SafeFormatDict(dict):
    """str.format_map()에서 누락 키를 {key} 형태로 유지"""
    def __missing__(self, key):
        return '{' + key + '}'

# ============================================================
# 프롬프트 템플릿 로더 (Single Source of Truth)
# ============================================================
_prompt_cache = {}

def load_prompt_template(ai_name, data_type):
    """프롬프트 템플릿 파일에서 search_instruction + prompt_body 로드

    파일 위치: 설계문서_V7.0/V40/instructions/2_collect/prompts/
    구분자: ---SEARCH_INSTRUCTION_START/END---, ---PROMPT_BODY_START/END---

    Returns:
        (search_instruction_template, prompt_body_template) 튜플
        실패 시 (None, None)
    """
    cache_key = f"{ai_name}_{data_type}"
    if cache_key in _prompt_cache:
        return _prompt_cache[cache_key]

    file_map = {
        ("Gemini", "official"): "gemini_official.md",
        ("Gemini", "public"): "gemini_public.md",
        ("Naver", "public"): "naver_public.md",  # ⚠️ instructions/2_collect/prompts/naver_public.md 참조
        ("Naver", "official"): None,  # Naver OFFICIAL uses direct API, no prompt needed
    }
    filename = file_map.get((ai_name, data_type))
    if not filename:
        # For Naver OFFICIAL, return empty templates (direct API call)
        if ai_name == "Naver" and data_type == "official":
            return "", ""
        print(f"  [ERROR] No prompt template for {ai_name}/{data_type}")
        return None, None

    filepath = os.path.join(
        os.path.dirname(__file__),
        "설계문서_V7.0", "V40", "instructions", "2_collect", "prompts", filename
    )

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # search_instruction 추출
        si_match = re.search(
            r'---SEARCH_INSTRUCTION_START---\s*([\s\S]*?)\s*---SEARCH_INSTRUCTION_END---',
            content
        )
        search_instruction = si_match.group(1).strip() if si_match else ""

        # prompt_body 추출
        pb_match = re.search(
            r'---PROMPT_BODY_START---\s*([\s\S]*?)\s*---PROMPT_BODY_END---',
            content
        )
        prompt_body = pb_match.group(1).strip() if pb_match else ""

        if not search_instruction and not prompt_body:
            print(f"  [ERROR] Empty template: {filepath}")
            return None, None

        _prompt_cache[cache_key] = (search_instruction, prompt_body)
        return search_instruction, prompt_body

    except FileNotFoundError:
        print(f"  [ERROR] Template file not found: {filepath}")
        return None, None
    except Exception as e:
        print(f"  [ERROR] Failed to load template {filepath}: {e}")
        return None, None

def get_exact_count(table_name, filters=None):
    """Retrieve exact count"""
    try:
        query = supabase.table(table_name).select('*', count='exact')
        if filters:
            for key, value in filters.items():
                if value is not None:
                    query = query.eq(key, value)
        response = query.limit(1).execute()
        return response.count if response.count else 0
    except Exception as e:
        print(f"  [WARN] Failed to retrieve count: {e}")
        return 0


def normalize_date(date_str):
    """Normalize date string to YYYY-MM-DD format, return None on failure"""
    if not date_str or not isinstance(date_str, str):
        return None

    date_str = date_str.strip()

    # Clearly invalid values
    if date_str.upper() in ['N/A', 'NA', 'UNKNOWN', 'UNCLEAR', 'NONE', '-', '']:
        return None
    if 'Unknown' in date_str or 'Unclear' in date_str or 'None' in date_str:
        return None

    import re

    # Check YYYY-MM-DD format
    match = re.match(r'^(\d{4})-(\d{2})-(\d{2})$', date_str)
    if match:
        year, month, day = match.groups()
        # Correct invalid month/day (00 -> 01)
        month = int(month) if int(month) > 0 else 1
        day = int(day) if int(day) > 0 else 1
        # Validate month/day range
        month = min(month, 12)
        day = min(day, 28)  # Safely limit to 28 days
        return f"{year}-{month:02d}-{day:02d}"

    # YYYY-MM (only month available) -> Convert to YYYY-MM-01
    match = re.match(r'^(\d{4})-(\d{1,2})$', date_str)
    if match:
        year, month = match.groups()
        month = int(month) if int(month) > 0 else 1
        month = min(month, 12)
        return f"{year}-{month:02d}-01"

    # YYYY (only year) -> Convert to YYYY-01-01
    if re.match(r'^\d{4}$', date_str):
        return f"{date_str}-01-01"

    # yyyyMMdd format (Naver postdate)
    if re.match(r'^\d{8}$', date_str):
        year = date_str[:4]
        month = date_str[4:6]
        day = date_str[6:8]
        month = int(month) if int(month) > 0 else 1
        day = int(day) if int(day) > 0 else 1
        month = min(month, 12)
        day = min(day, 28)
        return f"{year}-{month:02d}-{day:02d}"

    # Ignore other formats
    return None


def check_politician_exists(politician_id):
    """Check politician ID"""
    try:
        # politicians 테이블 우선, V40 테이블은 fallback
        result = supabase.table('politicians').select('*').eq('id', politician_id).execute()
        if not result.data:
            result = supabase.table('politicians_v40').select('*').eq('id', politician_id).execute()

        if result.data and len(result.data) > 0:
            return True, result.data[0].get('name', '')
        return False, None
    except Exception as e:
        print(f"  [FAIL] Politician check error: {e}")
        return False, None


def sync_politician_to_v40(politician_id):
    """politicians 테이블 → politicians_v40 테이블 자동 동기화

    politicians 테이블의 최신 데이터를 politicians_v40에 반영한다.
    컬럼 매핑: birth_date→birth_year, website_url→website, profile_image_url→image_url
    """
    try:
        src = supabase.table('politicians').select('*').eq('id', politician_id).execute()
        if not src.data:
            return  # politicians 테이블에 없으면 스킵

        p = src.data[0]

        # birth_date(TEXT, '1965-01-01') → birth_year(INTEGER)
        birth_year = None
        if p.get('birth_date'):
            try:
                birth_year = int(str(p['birth_date'])[:4])
            except (ValueError, TypeError):
                pass

        v40_data = {
            'id': p['id'],
            'name': p.get('name'),
            'party': p.get('party'),
            'position': p.get('position'),
            'identity': p.get('identity'),
            'title': p.get('title'),
            'region': p.get('region'),
            'district': p.get('district'),
            'gender': p.get('gender'),
            'birth_year': birth_year,
            'age': p.get('age'),
            'email': p.get('email'),
            'website': p.get('website_url'),
            'image_url': p.get('profile_image_url'),
        }

        # upsert: 있으면 업데이트, 없으면 삽입
        supabase.table('politicians_v40').upsert(v40_data, on_conflict='id').execute()
        print(f"  ✅ politicians → politicians_v40 동기화 완료 ({p.get('name')})")

    except Exception as e:
        print(f"  ⚠️ politicians_v40 동기화 실패 (계속 진행): {e}")


def init_ai_client(ai_name):
    """Initialize AI client"""
    global ai_clients

    if ai_name in ai_clients:
        return ai_clients[ai_name]

    config = AI_CONFIGS.get(ai_name)
    if not config:
        raise ValueError(f"Unknown AI: {ai_name}")

    if ai_name == "Naver":
        # Naver는 별도 client 객체 불필요 (HTTP GET만 사용)
        # 환경변수만 확인
        client_id = os.getenv(config['env_key_id'])
        client_secret = os.getenv(config['env_key_secret'])
        if not client_id or not client_secret:
            raise ValueError(f"{config['env_key_id']}, {config['env_key_secret']} environment variables are not set.")
        ai_clients[ai_name] = {'client_id': client_id, 'client_secret': client_secret}
    elif ai_name == "Gemini":
        # Gemini: API 모드 또는 CLI 모드
        # CLI 모드는 gemini_collect_helper.py + Gemini CLI 직접 사용
        api_key = os.getenv(config['env_key'])
        if not api_key:
            print(f"  ⚠️ {config['env_key']} 미설정 → Gemini CLI 직접 수집 모드 사용")
            print(f"  💡 Gemini CLI에서: python gemini_collect_helper.py fetch → 웹검색 → save")
            ai_clients[ai_name] = None
            return None
        from google import genai
        client = genai.Client(api_key=api_key)
        ai_clients[ai_name] = client

    return ai_clients[ai_name]


# ============================================================
# Naver Search API 호출
# ============================================================
def call_naver_search(client_config, politician_name, keywords, data_type, topic_mode, count, exclude_urls=None):
    """Naver Search API 호출

    Args:
        client_config: {'client_id': ..., 'client_secret': ...}
        politician_name: 정치인 이름 (또는 search_string 전체)
        keywords: 검색 키워드 (카테고리 항목 설명)
        data_type: 'official' or 'public'
        topic_mode: 'negative', 'positive', 'free'
        count: 요청할 결과 개수
        exclude_urls: 제외할 URL set (endpoint 간 중복 방지)

    Returns:
        JSON string of collected data or None on failure
    """
    print(f"  [Naver] API 호출 중... (data_type: {data_type}, topic_mode: {topic_mode})")

    client_id = client_config['client_id']
    client_secret = client_config['client_secret']

    headers = {
        'X-Naver-Client-Id': client_id,
        'X-Naver-Client-Secret': client_secret
    }

    # [Fix 4] politician_name에서 실제 이름 + 식별 키워드 추출
    # search_string 형식: "{당} {이름} {직책} {지역} ..."
    name_tokens = politician_name.split()
    actual_name = name_tokens[1] if len(name_tokens) >= 2 else politician_name
    # 동명이인 구분을 위한 식별 키워드 (당명, 직책 등)
    party_name = name_tokens[0] if len(name_tokens) >= 2 else ""
    id_keywords = []
    if party_name:
        id_keywords.append(party_name)
    for token in name_tokens[2:]:
        if token.startswith('(') and token.endswith(')'):
            continue  # 괄호 안 전직 정보 제외
        if token in ['국회의원', '의원', '구청장', '시장']:
            id_keywords.append(token)
            break

    # Build query - 다양한 검색어 조합으로 결과 극대화
    # 라운드별로 다른 검색어 사용 (호출 시마다 다른 결과)
    import random
    query_variants = [
        f'"{actual_name}" {keywords}',                              # 정확한 이름 매칭
        f'{actual_name} {" ".join(id_keywords)} {keywords}',       # 이름+당명+직책+키워드
        f'"{actual_name} 의원" {keywords}',                         # "조은희 의원" + 키워드
        f'{actual_name} {keywords} 국회',                           # 이름+키워드+국회
        f'{actual_name} {keywords} 정책',                           # 이름+키워드+정책
    ]
    query = random.choice(query_variants)

    # Add sentiment keywords to query
    if topic_mode == 'negative':
        neg_variants = [" 논란", " 의혹", " 비판", " 문제", " 지적"]
        query += random.choice(neg_variants)
    elif topic_mode == 'positive':
        pos_variants = [" 성과", " 업적", " 추진", " 발의", " 통과"]
        query += random.choice(pos_variants)
    # 'free' - no extra keywords

    # For OFFICIAL, add site:.go.kr filter
    if data_type == 'official':
        query += " site:go.kr"

    print(f"    검색어: {query[:60]}...")

    # Select API endpoints based on data_type (우선순위 순서)
    if data_type == 'official':
        # OFFICIAL: webkr 우선 (가장 결과 많음), 부족하면 doc, encyc
        endpoints = ['webkr', 'doc', 'encyc']
    else:
        # PUBLIC: news 우선 (가장 결과 많음), 부족하면 blog, cafearticle, kin
        endpoints = ['news', 'blog', 'cafearticle', 'kin']

    all_items = []
    # [Fix 3] endpoint 간 중복 방지용 local seen URLs
    local_seen = set(exclude_urls) if exclude_urls else set()

    for endpoint_key in endpoints:
        if len(all_items) >= count:
            break

        endpoint_url = NAVER_SEARCH_ENDPOINTS[endpoint_key]

        try:
            # 1페이지만 호출 (display=100이면 충분, API 호출 절약)
            params = {
                'query': query,
                'display': min(100, max(10, count - len(all_items))),
                'start': 1,
                'sort': 'date'  # 최신순
            }

            response = requests.get(endpoint_url, headers=headers, params=params, timeout=10)

            if response.status_code != 200:
                print(f"  [Naver] {endpoint_key} API 에러: {response.status_code}")
                continue  # 다음 엔드포인트 시도

            data = response.json()
            items = data.get('items', [])

            if not items:
                continue  # 결과 없으면 다음 엔드포인트

            for item in items:
                if len(all_items) >= count:
                    break

                # Extract fields
                title = strip_html_tags(item.get('title', ''))
                link = item.get('link', '')
                description = strip_html_tags(item.get('description', ''))
                postdate = item.get('postdate', '')  # yyyyMMdd format

                # Skip if no URL
                if not link or 'dummy' in link.lower():
                    continue

                # [Fix 3] endpoint 간 URL 중복 체크
                url_norm = normalize_url(link)
                if url_norm and url_norm in local_seen:
                    continue
                if url_norm:
                    local_seen.add(url_norm)

                # [Fix 4] 관련성 필터: 이름 OR 당명+직책이 title/description에 있으면 통과
                name_in_text = actual_name in title or actual_name in description
                if not name_in_text:
                    continue

                # [Fix 5] 무의미 문서 필터: 엑셀/PDF 다운로드 페이지 제외
                skip_extensions = ['.xlsx', '.xls', '.csv', '.hwp', '.pdf', '.zip']
                if any(link.lower().endswith(ext) for ext in skip_extensions):
                    continue

                # Normalize date
                date_normalized = normalize_date(postdate) if postdate else None

                collected_item = {
                    'title': title,
                    'content': description,  # Naver returns description (summary)
                    'source': endpoint_key.upper(),  # NEWS, BLOG, CAFEARTICLE, KIN, WEBKR, DOC, ENCYC
                    'source_url': link,
                    'date': date_normalized or ''
                }

                all_items.append(collected_item)

            # Rate limiting: 100ms between requests
            time.sleep(0.1)

        except Exception as e:
            print(f"  [Naver] {endpoint_key} 에러: {e}")
            continue

    if all_items:
        print(f"  [Naver] 최종 수집: {len(all_items)}개")
        return json.dumps(all_items, ensure_ascii=False, indent=2)
    else:
        return None


# --- Gemini API 호출 (V40) ---
def call_gemini_with_search(client, prompt, data_type="public"):
    """Gemini API 호출 (Google Search Grounding + URL 검증)

    API 키가 없으면 Gemini CLI 직접 수집 모드 사용:
    → gemini_collect_helper.py fetch/save + Gemini CLI 터미널에서 직접 실행
    """
    if client is None:
        print(f"  [Gemini] API 클라이언트 없음 → Gemini CLI 직접 수집 모드 사용")
        return None

    from google.genai import types

    print(f"  [Gemini] API 호출 중...")

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )

        response_text = response.text if response.text else ""
        json_text = extract_json_from_text(response_text)

        try:
            raw_data = json.loads(json_text)
        except json.JSONDecodeError as e:
            print(f"  [Gemini] JSON 파싱 오류: {e}")
            items = re.findall(r'\{[^{}]*\}', json_text)
            raw_data = []
            for item in items[:10]:
                try:
                    raw_data.append(json.loads(item))
                except:
                    pass
            if not raw_data:
                return None

        print(f"  [Gemini] 원본 데이터: {len(raw_data)}개")

        # URL 검증 및 필터링
        verified_data = []
        invalid_count = 0

        for item in raw_data:
            url = item.get('source_url') or item.get('url') or ''

            if 'dummy' in url.lower() or not url:
                invalid_count += 1
                continue

            if 'grounding-api-redirect' in url:
                real_url = resolve_redirect_url(url)
                if real_url != url:
                    item['source_url'] = real_url
                    url = real_url
                else:
                    invalid_count += 1
                    continue

            if not validate_url(url):
                invalid_count += 1
                continue

            verified_item = {
                'title': item.get('title') or item.get('data_title') or '',
                'content': item.get('content') or item.get('data_content') or '',
                'source': item.get('source') or item.get('data_source') or '',
                'source_url': url,
                'date': item.get('date') or item.get('data_date') or ''
            }
            verified_data.append(verified_item)

        if invalid_count > 0:
            print(f"  [Gemini] 무효 URL 제외: {invalid_count}개")
        print(f"  [Gemini] 최종 통과: {len(verified_data)}개")

        return json.dumps(verified_data, ensure_ascii=False, indent=2) if verified_data else None

    except Exception as e:
        print(f"  ❌ Gemini API 에러: {e}")
        return None


def build_search_prompt(ai_name, data_type, topic_mode, politician_full, item_keywords, count, year_hint, item_name, exclude_urls=None, domain_hint=""):
    """Build search prompt from template"""

    # Load template
    search_instruction, prompt_body = load_prompt_template(ai_name, data_type)
    if not search_instruction and not prompt_body:
        # For Naver OFFICIAL, no prompt needed (direct API)
        if ai_name == "Naver" and data_type == "official":
            return None
        print(f"  [ERROR] Failed to load prompt template for {ai_name}/{data_type}")
        return None

    # Build topic_instruction
    if topic_mode == 'negative':
        topic_instruction = "부정적 주제 우선 수집: 논란, 의혹, 비판, 반대, 실패, 문제점"
    elif topic_mode == 'positive':
        topic_instruction = "긍정적 주제 우선 수집: 성과, 업적, 칭찬, 지지, 성공, 긍정평가"
    else:
        topic_instruction = "자유 수집 (긍정/부정 제한 없음)"

    # Build exclude_instruction
    exclude_instruction = ""
    if exclude_urls and len(exclude_urls) > 0:
        exclude_list = list(exclude_urls)[:20]  # 최대 20개만 표시
        exclude_urls_str = "\n".join([f"  - {url}" for url in exclude_list])
        exclude_instruction = f"다음 URL은 이미 수집되었으므로 제외:\n{exclude_urls_str}"

    # Format template
    format_dict = SafeFormatDict({
        'politician_full': politician_full,
        'extra_keyword': item_keywords,
        'domain_hint': domain_hint,
        'topic_instruction': topic_instruction,
        'exclude_instruction': exclude_instruction,
        'year_hint': year_hint,
        'remaining': count
    })

    prompt = prompt_body.format_map(format_dict)
    return prompt


def call_ai(ai_name, client, prompt, data_type):
    """Call AI API"""
    if ai_name == "Gemini":
        return call_gemini_with_search(client, prompt, data_type)
    elif ai_name == "Naver":
        # Naver uses direct API call, not prompt-based
        # This function should not be called for Naver
        print(f"  [ERROR] call_ai should not be called for Naver")
        return None
    else:
        print(f"  [ERROR] Unknown AI: {ai_name}")
        return None


def extract_url(item):
    """Extract URL from item"""
    return item.get('source_url') or item.get('url') or ''


def validate_collected_data(data, data_type, ai_name):
    """Validate collected data items"""
    if not isinstance(data, list):
        return [], ["Data is not a list"]

    valid_items = []
    errors = []

    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            errors.append(f"Item {idx} is not a dict")
            continue

        # Required fields
        title = item.get('title') or item.get('data_title') or ''
        content = item.get('content') or item.get('data_content') or ''
        source = item.get('source') or item.get('data_source') or ''
        url = extract_url(item)
        date = item.get('date') or item.get('data_date') or ''

        # Validate
        if not title:
            errors.append(f"Item {idx}: Missing title")
            continue
        if not url:
            errors.append(f"Item {idx}: Missing URL")
            continue
        if 'dummy' in url.lower():
            errors.append(f"Item {idx}: Dummy URL")
            continue

        # Normalize fields
        normalized_item = {
            'title': title,
            'content': content,
            'source': source,
            'source_url': url,
            'date': normalize_date(date) if date else None
        }

        valid_items.append(normalized_item)

    return valid_items, errors


def collect_with_ai(ai_name, politician_id, politician_name, category_name, test_mode=False):
    """Collect data with specific AI for a category

    V40: Naver 통합, OFFICIAL 10-10-80 / PUBLIC 20-20-60
    """
    print(f"\n{'='*60}")
    print(f"[{ai_name}] Collecting {category_name}...")
    print(f"{'='*60}")

    client = init_ai_client(ai_name)
    politician_info = get_politician_info(politician_id)
    politician_full = politician_info['search_string']

    distribution = TEST_DISTRIBUTION if test_mode else COLLECT_DISTRIBUTION
    sentiment_max = TEST_SENTIMENT_DISTRIBUTION if test_mode else SENTIMENT_MAX

    ai_distribution = distribution.get(ai_name, {})
    ai_max = sentiment_max.get(ai_name, {})

    # [MIN/MAX] DB에서 기존 수량 조회 → MAX 도달 시 수집 건너뛰기
    existing_counts = {}  # (data_type, sentiment) → count
    try:
        existing = supabase.table(TABLE_COLLECTED_DATA).select('data_type, sentiment', count='exact')\
            .eq('politician_id', politician_id)\
            .eq('category', category_name)\
            .eq('collector_ai', ai_name).execute()
        from collections import Counter
        for item in existing.data:
            key = (item['data_type'], item['sentiment'])
            existing_counts[key] = existing_counts.get(key, 0) + 1
        print(f"  [DB] 기존 데이터 {len(existing.data)}개 로드 (MAX 체크용)")
    except Exception as e:
        print(f"  [DB] 기존 데이터 조회 실패: {e}")

    # [Fix 2] data_type 단위로 shared_seen_urls 유지 → sentiment 간 중복 방지
    # Process OFFICIAL, then PUBLIC
    for data_type in ['official', 'public']:
        type_count = ai_distribution.get(data_type, 0)
        if type_count == 0:
            continue

        print(f"\n  [{data_type.upper()}] Target: {type_count}개")

        type_max = ai_max.get(data_type, {})
        shared_seen_urls = set()  # sentiment 간 공유되는 seen_urls

        # Process sentiments: negative, positive, free
        for topic_mode in ['negative', 'positive', 'free']:
            max_target = type_max.get(topic_mode, 0)
            if max_target == 0:
                continue

            # [MIN/MAX] DB 기존 수량 확인 → MAX 도달 시 건너뛰기
            db_sentiment = topic_mode_to_sentiment(topic_mode)
            existing = existing_counts.get((data_type, db_sentiment), 0)
            remaining = max_target - existing
            if remaining <= 0:
                print(f"    {topic_mode.upper()}: MAX 도달 ({existing}/{max_target}), 건너뛰기")
                continue

            print(f"    {topic_mode.upper()}: DB {existing}개 / MAX {max_target}개 → {remaining}개 추가 수집")

            # Call collect_data_type with shared seen_urls (remaining만큼만 수집)
            collected_items = collect_data_type(
                ai_name, client, politician_id, politician_full,
                category_name, data_type, topic_mode, remaining,
                pre_seen_urls=shared_seen_urls
            )

            if not collected_items:
                print(f"    ⚠️ {topic_mode.upper()}: No data collected")
                continue

            # [Fix 2] 수집된 URL을 shared_seen_urls에 추가 → 다음 sentiment에서 중복 방지
            for ci in collected_items:
                ci_url = normalize_url(ci.get('source_url', ''))
                if ci_url:
                    shared_seen_urls.add(ci_url)

            # Save to DB
            save_count = 0
            skipped_date = 0
            # 기간 제한 기준일 계산
            date_limit_official = (datetime.now() - timedelta(days=365*4)).strftime('%Y-%m-%d')
            date_limit_public = (datetime.now() - timedelta(days=365*2)).strftime('%Y-%m-%d')

            for item in collected_items:
                try:
                    # Map sentiment
                    db_sentiment = topic_mode_to_sentiment(item.get('sentiment', 'free'))

                    # content → summary (30% 요약)
                    content_str = str(item.get('content', ''))[:2000]
                    summary_len = max(30, int(len(content_str) * 0.3))
                    summary = content_str[:summary_len]

                    # published_date 정규화
                    raw_date = item.get('date') or item.get('published_date') or ''
                    pub_date = normalize_date(raw_date)

                    # 기간 초과 사전 필터링 (DB 저장 전 차단)
                    if pub_date:
                        item_data_type = item.get('data_type', data_type)
                        date_limit = date_limit_official if item_data_type == 'official' else date_limit_public
                        if pub_date < date_limit:
                            skipped_date += 1
                            continue

                    db_item = {
                        'politician_id': politician_id,
                        'politician_name': politician_name,
                        'category': category_name,
                        'data_type': item.get('data_type', data_type),
                        'sentiment': db_sentiment,
                        'collector_ai': ai_name,
                        'title': str(item.get('title', ''))[:200],
                        'content': content_str,
                        'summary': summary,
                        'source_url': item.get('source_url', ''),
                        'source_name': str(item.get('source', '')),
                        'published_date': pub_date,
                        'is_verified': False
                    }

                    supabase.table(TABLE_COLLECTED_DATA).insert(db_item).execute()
                    save_count += 1

                except Exception as e:
                    print(f"    [ERROR] DB 저장 실패: {e}")

            date_msg = f" (기간초과 {skipped_date}개 제외)" if skipped_date > 0 else ""
            print(f"    ✅ {topic_mode.upper()}: {save_count}개 저장 완료{date_msg}")

    print(f"\n✅ [{ai_name}] {category_name} 수집 완료\n")


def collect_data_type(ai_name, client, politician_id, politician_full, category_name, data_type, topic_mode, count, pre_seen_urls=None):
    """Collects data for a specific AI, category, data type, and sentiment.

    V40: Naver 직접 API 호출 vs Gemini 프롬프트 기반 호출 분기
    """
    # AI별 파라미터 차등 적용
    if ai_name == "Naver":
        MAX_ROUNDS = 10      # Naver 라운드 증가 (다양한 검색어 조합 활용)
        MAX_PER_CALL = 30    # 한번에 30개 요청 (5페이지 활용)
        MAX_EMPTY_KW = 15    # 빈 키워드 허용 증가 (검색어 다양화로 결과 변동)
        MAX_EMPTY_ROUNDS = 3
    else:  # Gemini
        MAX_ROUNDS = 7
        MAX_PER_CALL = 5
        MAX_EMPTY_KW = 7
        MAX_EMPTY_ROUNDS = 2
    MAX_429_RETRIES = 3

    print(f"    -> {topic_mode.upper()} ({count}개) 수집 시작...")
    all_items = []
    # [Fix 2] 참조 공유: pre_seen_urls가 있으면 같은 set 객체를 사용 → 호출자와 공유
    if pre_seen_urls is None:
        pre_seen_urls = set()
    seen_urls = pre_seen_urls  # 참조 유지 (복사 금지)
    seen_titles = set()  # title 기반 중복 감지용

    # [Fix 1] DB에서 같은 카테고리 내 기존 URL만 로드 → 카테고리 간 중복은 허용
    try:
        all_db_data = []
        db_offset = 0
        while True:
            page = supabase.table(TABLE_COLLECTED_DATA).select('source_url,title')\
                .eq('politician_id', politician_id)\
                .eq('category', category_name)\
                .range(db_offset, db_offset + 999).execute()
            if page.data:
                all_db_data.extend(page.data)
            if not page.data or len(page.data) < 1000:
                break
            db_offset += 1000
        existing_data = type('obj', (object,), {'data': all_db_data})()
        db_url_count = 0
        for item in existing_data.data:
            if item.get('source_url'):
                seen_urls.add(normalize_url(item['source_url']))
                db_url_count += 1
            if item.get('title'):
                seen_titles.add(normalize_title(item['title']))
        if db_url_count > 0:
            print(f"    [DB] 기존 URL {db_url_count}개 로드 (같은 카테고리 내 중복 방지)")
    except Exception as e:
        print(f"    [DB] 기존 URL 로드 실패 (무시): {e}")

    category_items = CATEGORY_ITEMS.get(category_name, [("", "")])
    current_year = datetime.now().year
    year_hint = f"({current_year}, {current_year - 1})"

    consecutive_empty_rounds = 0

    for round_num in range(MAX_ROUNDS):
        unique_count = len(all_items)
        remaining = count - unique_count
        if remaining <= 0:
            break

        if round_num > 0:
            print(f"    [라운드 {round_num+1}] 현재 {unique_count}개 / 목표 {count}개")

        round_added_total = 0

        consecutive_empty_keywords = 0
        for kw_idx, (item_name, item_keywords) in enumerate(category_items):
            unique_count = len(all_items)
            remaining = count - unique_count
            if remaining <= 0:
                break

            if consecutive_empty_keywords >= MAX_EMPTY_KW:
                print(f"    ⚠️ 연속 {consecutive_empty_keywords}개 키워드 결과 없음 → 라운드 조기 종료")
                break

            request_count = min(remaining, MAX_PER_CALL)

            # 429 에러 재시도 루프
            for retry in range(MAX_429_RETRIES):
                try:
                    # AI 분기: Naver vs Gemini
                    if ai_name == "Naver":
                        # Naver: Direct API call (Fix 3: exclude_urls 전달)
                        response_text = call_naver_search(
                            client, politician_full, item_keywords,
                            data_type, topic_mode, request_count,
                            exclude_urls=seen_urls
                        )
                    else:
                        # Gemini: Prompt-based
                        domain_hint = ""
                        if data_type == "official":
                            hints = GEMINI_OFFICIAL_DOMAIN_HINTS
                        else:
                            hints = GEMINI_PUBLIC_PLATFORM_HINTS
                        domain_hint = hints[kw_idx % len(hints)]

                        prompt = build_search_prompt(
                            ai_name, data_type, topic_mode, politician_full,
                            item_keywords, request_count, year_hint, item_name,
                            exclude_urls=seen_urls,
                            domain_hint=domain_hint
                        )

                        if not prompt:
                            break

                        response_text = call_ai(ai_name, client, prompt, data_type)

                    if not response_text:
                        break

                    # JSON Parsing
                    json_match = re.search(r'```json\s*([\s\S]+?)\s*```', response_text)
                    if json_match:
                        response_json_str = json_match.group(1)
                    else:
                        response_json_str = response_text

                    data = json.loads(response_json_str)

                    # Data validation
                    valid_data, errors = validate_collected_data(data, data_type, ai_name)

                    if not valid_data:
                        break

                    # 메모리 내 중복 제거 + 메타데이터 추가
                    added = 0
                    for item in valid_data:
                        if len(all_items) >= count:
                            break

                        # URL 정규화로 중복 체크
                        url = extract_url(item)
                        url_normalized = normalize_url(url) if url else ''

                        if url_normalized and url_normalized in seen_urls:
                            continue

                        # [Fix 5] title 기반 중복 감지 (URL이 달라도 같은 기사인 경우)
                        title_norm = normalize_title(item.get('title', ''))
                        if title_norm and title_norm in seen_titles:
                            continue
                        if title_norm:
                            seen_titles.add(title_norm)

                        # 유니크 아이템 추가
                        item['sentiment'] = topic_mode
                        item['data_type'] = data_type
                        item['collector_ai'] = ai_name
                        all_items.append(item)
                        if url_normalized:
                            seen_urls.add(url_normalized)
                        added += 1

                    if added > 0:
                        short_name = item_name[:5] if len(item_name) > 5 else item_name
                        print(f"      [{short_name}] +{added}개 → 누적 {len(all_items)}개")
                        consecutive_empty_keywords = 0
                        round_added_total += added
                    else:
                        consecutive_empty_keywords += 1

                    break

                except json.JSONDecodeError as e:
                    print(f"    [{ai_name}] JSON 파싱 오류: {e}")
                    break

                except Exception as e:
                    error_str = str(e)
                    if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
                        wait_time = 2 ** (retry + 1)
                        print(f"  ❌ {ai_name} API 에러: 429 RESOURCE_EXHAUSTED. {error_str[:100]}")
                        time.sleep(wait_time)
                        continue
                    else:
                        print(f"  ❌ {ai_name} API 에러: {e}")
                        break

        # 라운드 종료 체크
        if round_added_total == 0:
            consecutive_empty_rounds += 1
            if consecutive_empty_rounds >= MAX_EMPTY_ROUNDS:
                print(f"    ⚠️ 연속 {consecutive_empty_rounds}개 라운드 결과 없음 → 조기 종료")
                break
        else:
            consecutive_empty_rounds = 0

    print(f"    -> {topic_mode.upper()} 최종: {len(all_items)}개")
    return all_items


def verify_test_results(politician_id, test_mode=True, category_list=None):
    """Verify test collection results

    Returns:
        dict: {category_name: total_count} - 카테고리별 실제 수집량
    """
    print(f"\n{'='*60}")
    print("결과 검증")
    print(f"{'='*60}\n")

    distribution = TEST_DISTRIBUTION if test_mode else COLLECT_DISTRIBUTION
    check_categories = category_list if category_list else CATEGORIES
    category_totals = {}

    for category_name, category_label in check_categories:
        print(f"[{category_label}]")
        cat_total = 0

        for ai_name in ["Gemini", "Naver"]:
            ai_dist = distribution.get(ai_name, {})

            for data_type in ['official', 'public']:
                type_count = ai_dist.get(data_type, 0)
                if type_count == 0:
                    continue

                actual_count = get_exact_count(
                    TABLE_COLLECTED_DATA,
                    {
                        'politician_id': politician_id,
                        'category': category_name,
                        'data_type': data_type,
                        'collector_ai': ai_name
                    }
                )
                cat_total += actual_count

                status = "✅" if actual_count >= type_count else "⚠️"
                print(f"  {status} {ai_name} {data_type.upper()}: {actual_count}/{type_count}개")

        category_totals[category_name] = cat_total
        target = 20 if test_mode else 100
        status = "✅" if cat_total >= target else "⚠️"
        print(f"  {status} 카테고리 합계: {cat_total}개 (최소 목표: {target})")

    print(f"\n{'='*60}\n")
    return category_totals


# ============================================================
# 최소 목표 미달 카테고리 재수집 상수
# ============================================================
MIN_TARGET_FULL = 100    # 풀 모드 최소 목표
MIN_TARGET_TEST = 20     # 테스트 모드 최소 목표
MAX_RETRY_ROUNDS = 3     # 재수집 최대 반복 횟수


def main():
    parser = argparse.ArgumentParser(description='V40 Data Collection Script')
    parser.add_argument('--politician_id', type=str, required=True, help='Politician ID (8-char hex)')
    parser.add_argument('--politician_name', type=str, required=True, help='Politician Name')
    parser.add_argument('--ai', type=str, choices=['Gemini', 'Naver'], help='Specific AI to run')
    parser.add_argument('--category', type=int, choices=range(1, 11), help='Specific category (1-10)')
    parser.add_argument('--test', action='store_true', help='Mini test mode (20 items per category)')
    args = parser.parse_args()

    # Validate politician
    exists, db_name = check_politician_exists(args.politician_id)
    if not exists:
        print(f"❌ Politician ID not found: {args.politician_id}")
        return

    print(f"\n{'='*60}")
    print(f"V40 Data Collection - {args.politician_name}")
    print(f"{'='*60}")
    print(f"Politician ID: {args.politician_id}")
    print(f"DB Name: {db_name}")
    print(f"Test Mode: {args.test}")
    print(f"{'='*60}\n")

    # politicians → politicians_v40 동기화
    sync_politician_to_v40(args.politician_id)

    # Select AIs to run
    ai_list = [args.ai] if args.ai else ['Gemini', 'Naver']

    # Select categories to run
    if args.category:
        category_list = [CATEGORIES[args.category - 1]]
    else:
        category_list = CATEGORIES

    # Run collection
    for category_name, category_label in category_list:
        for ai_name in ai_list:
            collect_with_ai(
                ai_name,
                args.politician_id,
                args.politician_name,
                category_name,
                test_mode=args.test
            )

    # Verify results + 재수집 루프
    min_target = MIN_TARGET_TEST if args.test else MIN_TARGET_FULL

    for retry_round in range(MAX_RETRY_ROUNDS + 1):
        # 검증
        category_totals = verify_test_results(
            args.politician_id, test_mode=args.test, category_list=category_list
        )

        # 미달 카테고리 확인
        deficit_categories = [
            (cat_name, cat_label)
            for cat_name, cat_label in category_list
            if category_totals.get(cat_name, 0) < min_target
        ]

        if not deficit_categories:
            print(f"✅ 모든 카테고리 최소 목표 {min_target}개 달성!")
            break

        if retry_round >= MAX_RETRY_ROUNDS:
            print(f"\n⚠️ 재수집 {MAX_RETRY_ROUNDS}회 완료. 아직 미달 카테고리 존재:")
            for cat_name, cat_label in deficit_categories:
                total = category_totals.get(cat_name, 0)
                print(f"  ⚠️ {cat_label}: {total}/{min_target}개")
            break

        # 재수집 실행
        print(f"\n{'='*60}")
        print(f"🔄 재수집 라운드 {retry_round + 1}/{MAX_RETRY_ROUNDS}")
        print(f"미달 카테고리: {len(deficit_categories)}개")
        for cat_name, cat_label in deficit_categories:
            total = category_totals.get(cat_name, 0)
            print(f"  ⚠️ {cat_label}: {total}/{min_target}개 (부족: {min_target - total}개)")
        print(f"{'='*60}\n")

        for cat_name, cat_label in deficit_categories:
            for ai_name in ai_list:
                collect_with_ai(
                    ai_name,
                    args.politician_id,
                    args.politician_name,
                    cat_name,
                    test_mode=args.test
                )

    print("\n✅ V40 수집 완료!\n")


if __name__ == "__main__":
    main()
