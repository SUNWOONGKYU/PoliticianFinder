# -*- coding: utf-8 -*-
#
# V30 Data Collection Script (40-20-40 배분 확정 - 2026-01-31)
#
# ============================================================
# 🚨 절대 규칙 (40-20-40 배분, 카테고리당 50개+20%버퍼)
# ============================================================
# | 구분              | 기본 | 최대(120%) | 역할                         |
# |-------------------|------|------------|------------------------------|
# | Gemini OFFICIAL   | 20개 | 24개       | 국회, 정부, 지방정부, 공공기관|
# | Gemini PUBLIC     | 10개 | 12개       | YouTube, 블로그, 위키 (비언론)|
# | Perplexity PUBLIC | 20개 | 24개       | 뉴스/언론만                   |
# | 총계              | 50개 | 60개       |                              |
# ============================================================
#
# 검증 후 처리:
#   - 50개 이상 → 패스 ✅
#   - 50개 미만 → 추가 수집 🔄 (버퍼 범위 내 최대 60개)
#
# 역할 분담:
#   - Gemini: OFFICIAL (정부/공공) + PUBLIC (비언론: YouTube, 블로그, 위키)
#   - Perplexity: PUBLIC만 (뉴스/언론 55개+ 언론사)
#
# [WARN] Claude/ChatGPT/Grok = 수집 제외 (평가만)
#
# Usage:
#     # Full Collection (Gemini + Perplexity)
#     python collect_v30.py --politician_id=62e7b453 --politician_name="오세훈"
#
#     # Run specific AI only
#     python collect_v30.py --politician_id=62e7b453 --politician_name="오세훈" --ai=Gemini
#     python collect_v30.py --politician_id=62e7b453 --politician_name="오세훈" --ai=Perplexity
#
#     # Specific Category only
#     python collect_v30.py --politician_id=62e7b453 --politician_name="오세훈" --category=1
#
#     # Parallel Execution (Faster, Recommended)
#     python collect_v30.py --politician_id=62e7b453 --politician_name="오세훈" --parallel
#
#     # Mini Test (10 items per category)
#     python collect_v30.py --politician_id=62e7b453 --politician_name="오세훈" --parallel --test
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
import uuid # Import uuid for unique ID generation

# UTF-8 Output Setting
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        # Ignore if already set or buffer is missing
        pass

# ============================================================
# URL 검증 함수 (듀얼 테스트 결과 반영 - 2026-01-29)
# ============================================================

def validate_url(url: str, timeout: float = 5.0) -> bool:
    """URL 검증 (GET stream=True + User-Agent) - 90%+ 성공률

    기존 HEAD 요청 방식의 문제점 해결:
    - 일부 서버가 HEAD 요청 차단
    - User-Agent 없으면 403/406 응답

    해결책:
    - GET + stream=True (전체 다운로드 방지)
    - User-Agent 헤더 추가
    """
    if not url or 'dummy' in url.lower():
        return False

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    try:
        response = requests.get(url, timeout=timeout, allow_redirects=True,
                               headers=headers, stream=True)
        response.close()  # 바로 닫기 (전체 다운로드 방지)
        return response.status_code < 400
    except:
        return False


def resolve_redirect_url(redirect_url: str, timeout: float = 10.0) -> str:
    """Gemini redirect URL을 실제 URL로 변환

    Gemini가 반환하는 URL 형태:
    https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQ...

    해결책:
    - allow_redirects=False로 요청
    - 302 응답의 Location 헤더에서 실제 URL 추출
    """
    if not redirect_url or 'grounding-api-redirect' not in redirect_url:
        return redirect_url

    try:
        response = requests.head(redirect_url, timeout=timeout, allow_redirects=False)
        if response.status_code in [301, 302, 303, 307, 308] and 'Location' in response.headers:
            return response.headers['Location']
    except:
        pass

    return redirect_url  # 실패 시 원본 반환


def extract_json_from_text(text: str) -> str:
    """텍스트에서 JSON 배열을 추출 (robust)

    AI 응답에서 JSON을 추출하는 여러 방법 시도:
    1. ```json 블록
    2. ``` 블록
    3. [ ... ] 배열 직접 추출 (greedy + lazy)
    4. 텍스트 자체가 JSON인 경우
    5. 개별 {} 객체 수집
    """
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
                if isinstance(parsed, dict) and ('title' in parsed or 'source_url' in parsed or 'url' in parsed):
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

    Args:
        topic_mode: 'negative', 'positive', 'free'

    Returns:
        sentiment: 'negative', 'positive', 'free'

    Notes:
        - DB sentiment CHECK constraint: ('positive', 'negative', 'neutral', 'free')
        - topic_mode 'free' is saved as 'free' in DB
        - 'free' = freely collected (includes positive/negative/neutral)
    """
    mapping = {
        'negative': 'negative',
        'positive': 'positive',
        'free': 'free'  # [OK] Modified: 'free' saved as is
    }
    return mapping.get(topic_mode, 'free')


# Load environment variables
load_dotenv(override=True)

# Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V30 Table Name
TABLE_COLLECTED_DATA = "collected_data_v30"

# AI Client Cache
ai_clients = {}

# Category Definitions (Based on V30 - V28.3)
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
# 🚨 V30 절대 규칙 - 수집 배분 (40-20-40, 20% 버퍼)
# ============================================================
# | 구분              | 기본 | 최대(120%) | 역할                         |
# |-------------------|------|------------|------------------------------|
# | Gemini OFFICIAL   | 20   | 24개       | 국회, 정부, 지방정부, 공공기관|
# | Gemini PUBLIC     | 10   | 12개       | YouTube, 블로그, 위키 (비언론)|
# | Perplexity PUBLIC | 20   | 24개       | 뉴스/언론만                   |
# | 총계              | 50   | 60개       |                              |
# ============================================================
COLLECT_DISTRIBUTION = {
    "Gemini": {
        "official": 24,  # OFFICIAL 100% (20 + 20%버퍼) - 국회, 정부, 지방정부
        "public": 12,    # PUBLIC 비언론 (10 + 20%버퍼) - YouTube, 블로그, 위키
        "total": 36      # 36개 (버퍼 포함)
    },
    "Perplexity": {
        "official": 0,   # OFFICIAL 0% - 수집 안 함!
        "public": 24,    # PUBLIC 언론만 (20 + 20%버퍼) - 뉴스/언론 55개+
        "total": 24      # 24개 (버퍼 포함)
    }
    # 총 수집: 최대 60개 → 검증 → 50개 확보
    #
    # [WARN] Claude: 수집 제외 (평가만) - web_search 비용 문제
    # [WARN] ChatGPT: 수집 제외 (평가만) - Bing 검색 비용 문제
    # [WARN] Grok: 수집 제외 (평가만) - X 데이터 수집 불안정
}

# 추가 버퍼 없음 (120% 버퍼가 COLLECT_DISTRIBUTION에 이미 포함)
EXTRA_BUFFER = 0

# Mini Test Allocation (1/5 scale) - 절대 규칙 비율 유지
TEST_DISTRIBUTION = {
    "Gemini": {
        "official": 4,   # OFFICIAL (4개)
        "public": 2,     # PUBLIC 비언론 (2개)
        "total": 6       # 6개
    },
    "Perplexity": {
        "official": 0,   # OFFICIAL 0% - 수집 안 함!
        "public": 4,     # PUBLIC 언론 (4개)
        "total": 4       # 4개
    }
    # 테스트 총: 10개
}

# 20-20-60 Balance Allocation (기본 50개 기준, 40-20-40 배분)
# Gemini OFFICIAL 20개: negative 4, positive 4, free 12
# Gemini PUBLIC 10개: negative 2, positive 2, free 6
# Perplexity PUBLIC 20개: negative 4, positive 4, free 12
SENTIMENT_DISTRIBUTION = {
    "Gemini": {
        "official": {"negative": 4, "positive": 4, "free": 12},    # 20개
        "public": {"negative": 2, "positive": 2, "free": 6}        # 10개
    },
    "Perplexity": {
        "official": {"negative": 0, "positive": 0, "free": 0},     # 0개 - 수집 안 함!
        "public": {"negative": 4, "positive": 4, "free": 12}       # 20개
    }
}
# 총계: Gemini 30 (OFFICIAL 20 + PUBLIC 10) + Perplexity 20 (PUBLIC) = 50개

# Test Mode 20-20-60 Allocation (1/5 scale)
TEST_SENTIMENT_DISTRIBUTION = {
    "Gemini": {
        "official": {"negative": 1, "positive": 1, "free": 2},     # 4개
        "public": {"negative": 1, "positive": 1, "free": 0}        # 2개
    },
    "Perplexity": {
        "official": {"negative": 0, "positive": 0, "free": 0},     # 0개
        "public": {"negative": 1, "positive": 1, "free": 1}        # 3개
    }
}

# AI Model Configuration
AI_CONFIGS = {
    "Claude": {
        "model": "claude-3-5-haiku-20241022",
        "env_key": "ANTHROPIC_API_KEY"
    },
    "ChatGPT": {
        "model": "gpt-4o-mini",
        "env_key": "OPENAI_API_KEY"
    },
    "Grok": {
        "model": "grok-3",
        "env_key": "XAI_API_KEY",
        "base_url": "https://api.x.ai/v1"
    },
    "Gemini": {
        "model": "gemini-2.0-flash",
        "env_key": "GEMINI_API_KEY"
    },
    "Perplexity": {
        "model": "sonar",
        "env_key": "PERPLEXITY_API_KEY",
        "base_url": "https://api.perplexity.ai"
    }
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

# Gemini PUBLIC 플랫폼 특화 프롬프트 지시문
# 테스트 결과: 플랫폼 전용 쿼리 시 YouTube 100%, 나무위키 100% 적중 확인
GEMINI_PUBLIC_PLATFORM_HINTS = [
    "유튜브\n반드시 youtube.com URL만 반환하세요. 인터뷰, 토론, 연설, 정책 설명 영상.",
    "유튜브\n반드시 youtube.com URL만 반환하세요. 시민/개인 채널의 분석 영상.",
    "유튜브\n반드시 youtube.com URL만 반환하세요. 토론/대담/팟캐스트 영상.",
    "나무위키\n반드시 namu.wiki URL만 반환하세요. 정치인 문서, 논란/비판, 평가 내용.",
    "나무위키\n반드시 namu.wiki URL만 반환하세요. 선거 이력, 공약 이행, 의정활동.",
    "블로그\n반드시 blog.naver.com 또는 tistory.com URL만 반환하세요. 시민 분석/평가 글.",
    "블로그\n반드시 brunch.co.kr 또는 medium.com URL만 반환하세요. 칼럼/분석 글.",
    "커뮤니티\n반드시 clien.net, theqoo.net, fmkorea.com, dcinside.com 중 하나의 URL만 반환하세요.",
    "커뮤니티\n반드시 ppomppu.co.kr, 82cook.com, ruliweb.com, todayhumor.co.kr 중 하나의 URL만 반환하세요.",
    "시민단체 학술\n참여연대(peoplepower21.org), 경실련(ccej.or.kr), Google Scholar, RISS에서 검색하세요.",
]

# ============================================================
# Gemini PUBLIC 뉴스 도메인 차단 리스트
# ============================================================
# Gemini PUBLIC은 비언론만 수집 (뉴스/언론은 Perplexity 담당)
GEMINI_PUBLIC_NEWS_BLOCKED = [
    # 종합일간지
    'chosun.com', 'joongang.co.kr', 'donga.com', 'hani.co.kr', 'khan.co.kr',
    'munhwa.com', 'kmib.co.kr', 'segye.com', 'naeil.com', 'hankookilbo.com',
    # 방송사
    'kbs.co.kr', 'mbc.co.kr', 'sbs.co.kr', 'jtbc.co.kr', 'tvchosun.com',
    'channela.com', 'mbn.co.kr', 'ytn.co.kr',
    # 통신사
    'yna.co.kr', 'yonhapnews.co.kr', 'newsis.com', 'news1.kr',
    # 경제지
    'hankyung.com', 'mk.co.kr', 'sedaily.com', 'edaily.co.kr', 'mt.co.kr',
    'fnnews.com', 'etnews.com', 'businesspost.co.kr', 'asiae.co.kr',
    # 인터넷매체
    'ohmynews.com', 'pressian.com', 'mediatoday.co.kr', 'newstapa.org',
    'sisajournal.com', 'sisain.co.kr', 'huffpost.kr',
    # 지역언론 패턴 (공통 suffix)
    'kyeongin.com', 'kyeonggi.com', 'joongboo.com', 'kgnews.co.kr',
    'idomin.com', 'jnilbo.com', 'kwangju.co.kr',
    # 해외언론
    'reuters.com', 'bbc.com', 'bbc.co.uk', 'cnn.com', 'nytimes.com',
    'washingtonpost.com', 'theguardian.com', 'apnews.com',
    # 뉴스 포털/집합
    'v.daum.net', 'news.naver.com', 'news.nate.com',
    # 기타 뉴스 패턴
    'newspim.com', 'newdaily.co.kr', 'nocutnews.co.kr', 'polinews.co.kr',
    'pennmike.com', 'thefact.co.kr', 'wikitree.co.kr',
    # 테스트에서 누출된 소규모 언론
    'joongang.tv', 'ntoday.co.kr', 'economytribune.co.kr',
    'labortoday.co.kr', 'ngonews.kr', 'snilbo.co.kr',
    'jeonmae.co.kr', 'ikbn.news', 'fieldnews.kr',
    'sigryang.com', 'koreasisailbo.com', 'senews.kr',
    'hyundaiilbo.com', 'jeongpil.com', 'seoulcity.co.kr',
    'k-health.com', 'fntoday.co.kr', 'asn24.com',
    'kspnews.com', 'snfocus.net', '5donews.co.kr',
    'kihoilbo.co.kr', 'newspak.co.kr', 'g-enews.com',
    'anseongnews.com', 'lghellovision.net', 'newsprime.co.kr',
]

# Politician Details Cache
_politician_info_cache = {}

def get_politician_info(politician_id):
    """Retrieve detailed politician information (for distinguishing identical names)"""
    if politician_id in _politician_info_cache:
        return _politician_info_cache[politician_id]

    try:
        result = supabase.table('politicians').select('*').eq('id', politician_id).execute()
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

# Category Items (V28.3 Neutralized)
def load_category_items_from_instructions():
    """instructions 파일에서 카테고리별 10개 항목을 동적으로 로드.

    파일 위치: 설계문서_V7.0/V30/instructions/2_collect/cat{01~10}_{category}.md
    테이블 형식: | # | **항목명** | 설명 |

    Returns:
        dict: { "expertise": [("항목명", "설명"), ...], ... }
    """
    import glob

    base_dir = os.path.join(os.path.dirname(__file__), "설계문서_V7.0", "V30", "instructions", "2_collect")
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

    파일 위치: 설계문서_V7.0/V30/instructions/2_collect/prompts/
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
        ("Perplexity", "public"): "perplexity_public.md",
    }
    filename = file_map.get((ai_name, data_type))
    if not filename:
        print(f"  [ERROR] No prompt template for {ai_name}/{data_type}")
        return None, None

    filepath = os.path.join(
        os.path.dirname(__file__),
        "설계문서_V7.0", "V30", "instructions", "2_collect", "prompts", filename
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

    # Ignore other formats
    return None


def check_politician_exists(politician_id):
    """Check politician ID"""
    try:
        result = supabase.table('politicians').select('*').eq('id', politician_id).execute()
        if result.data and len(result.data) > 0:
            return True, result.data[0].get('name', '')
        return False, None
    except Exception as e:
        print(f"  [FAIL] Politician check error: {e}")
        return False, None


def init_ai_client(ai_name):
    """Initialize AI client"""
    global ai_clients

    if ai_name in ai_clients:
        return ai_clients[ai_name]

    config = AI_CONFIGS.get(ai_name)
    if not config:
        raise ValueError(f"Unknown AI: {ai_name}")

    api_key = os.getenv(config['env_key'])
    if not api_key:
        raise ValueError(f"{config['env_key']} environment variable is not set.")

    if ai_name == "Perplexity":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(
            api_key=api_key,
            base_url=config['base_url']
        )
    elif ai_name == "Claude":
        import anthropic
        ai_clients[ai_name] = anthropic.Anthropic(api_key=api_key)
    elif ai_name == "ChatGPT":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(api_key=api_key)
    elif ai_name == "Grok":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(
            api_key=api_key,
            base_url=config['base_url']
        )
    elif ai_name == "Perplexity":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(
            api_key=api_key,
            base_url=config['base_url']
        )
    elif ai_name == "Gemini":
        from google import genai
        client = genai.Client(api_key=api_key)
        ai_clients[ai_name] = client

    return ai_clients[ai_name]


# --- Perplexity 실제 API 호출 (듀얼 테스트 결과 반영) ---
def call_perplexity(client, prompt, data_type):
    """Perplexity API 호출 (Sonar + URL 검증)

    듀얼 테스트 해결책 적용:
    1. sonar 모델 사용 (비용 최적화)
    2. GET stream=True로 URL 검증
    3. 금지 도메인 필터링 (뉴스/언론만)
    """
    print(f"  [Perplexity] API 호출 중... (data_type: {data_type})")

    # Perplexity 금지 도메인 (뉴스/언론만 수집)
    PERPLEXITY_BLOCKED_DOMAINS = [
        'youtube.com', 'youtu.be',
        'wikipedia.org', 'namu.wiki',
        'blog.naver.com', 'brunch.co.kr', 'tistory.com',
        'dcinside.com', 'clien.net', 'fmkorea.com',
        'peoplepowerparty.kr', 'theminjoo.kr',
        'assembly.go.kr', 'nanet.go.kr'
    ]

    try:
        # API 호출 (sonar 모델 - 비용 최적화)
        response = client.chat.completions.create(
            model="sonar",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        content = response.choices[0].message.content
        print(f"  [Perplexity] 응답 수신")

        # JSON 추출
        json_text = extract_json_from_text(content)

        try:
            raw_data = json.loads(json_text)
        except json.JSONDecodeError as e:
            print(f"  [Perplexity] JSON 파싱 오류: {e}")
            # 긴급 복구: 개별 객체 파싱 시도
            items = re.findall(r'\{[^{}]*\}', json_text)
            raw_data = []
            for item in items[:10]:
                try:
                    raw_data.append(json.loads(item))
                except:
                    pass
            if not raw_data:
                return None

        print(f"  [Perplexity] 원본 데이터: {len(raw_data)}개")

        # URL 검증 및 필터링
        verified_data = []
        blocked_count = 0
        invalid_count = 0

        for item in raw_data:
            url = item.get('source_url') or item.get('url') or ''

            # dummy URL 체크
            if 'dummy' in url.lower() or not url:
                invalid_count += 1
                continue

            # 금지 도메인 체크 (Perplexity는 뉴스/언론만)
            is_blocked = any(domain in url.lower() for domain in PERPLEXITY_BLOCKED_DOMAINS)
            if is_blocked:
                blocked_count += 1
                continue

            # URL 접속 검증
            if not validate_url(url):
                invalid_count += 1
                continue

            # 필드명 통일
            verified_item = {
                'title': item.get('title') or item.get('data_title') or '',
                'content': item.get('content') or item.get('data_content') or '',
                'source': item.get('source') or item.get('data_source') or '',
                'source_url': url,
                'date': item.get('date') or item.get('data_date') or ''
            }
            verified_data.append(verified_item)

        if blocked_count > 0:
            print(f"  [Perplexity] 금지 도메인 제외: {blocked_count}개")
        if invalid_count > 0:
            print(f"  [Perplexity] 무효 URL 제외: {invalid_count}개")
        print(f"  [Perplexity] 최종 통과: {len(verified_data)}개")

        return json.dumps(verified_data, ensure_ascii=False, indent=2) if verified_data else None

    except Exception as e:
        print(f"  ❌ Perplexity API 에러: {e}")
        return None
# --- End Perplexity ---

# --- Gemini 실제 API 호출 (듀얼 테스트 결과 반영) ---
def call_gemini_with_search(client, prompt, data_type="public"):
    """Gemini API 호출 (Google Search Grounding + URL 검증)

    듀얼 테스트 해결책 적용:
    1. grounding_metadata에서 실제 URL 추출
    2. redirect URL → 실제 URL 변환
    3. GET stream=True로 URL 검증
    """
    from google.genai import types

    print(f"  [Gemini] API 호출 중...")

    try:
        # Google Search Tool 사용
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )

        response_text = response.text if response.text else ""

        # JSON 추출
        json_text = extract_json_from_text(response_text)

        try:
            raw_data = json.loads(json_text)
        except json.JSONDecodeError as e:
            print(f"  [Gemini] JSON 파싱 오류: {e}")
            # 긴급 복구: 개별 객체 파싱 시도
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

        # grounding_metadata에서 실제 URL 추출
        grounding_urls = []
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                gm = candidate.grounding_metadata
                if hasattr(gm, 'grounding_chunks') and gm.grounding_chunks:
                    for chunk in gm.grounding_chunks:
                        if hasattr(chunk, 'web') and chunk.web:
                            grounding_urls.append(chunk.web.uri)
                    print(f"  [Gemini] grounding_metadata URL: {len(grounding_urls)}개")

        # URL 검증 및 필터링
        verified_data = []
        redirect_resolved = 0
        invalid_count = 0
        news_blocked_count = 0

        for item in raw_data:
            url = item.get('source_url') or item.get('url') or ''

            # dummy URL 체크
            if 'dummy' in url.lower() or not url:
                invalid_count += 1
                continue

            # redirect URL → 실제 URL 변환
            if 'grounding-api-redirect' in url:
                real_url = resolve_redirect_url(url)
                if real_url != url:
                    redirect_resolved += 1
                    print(f"  [Gemini] redirect URL 해결: {real_url[:60]}...")
                    item['source_url'] = real_url
                    url = real_url
                else:
                    invalid_count += 1
                    continue

            # PUBLIC일 때 뉴스 도메인 차단
            if data_type == "public":
                url_lower = url.lower()
                is_news = any(domain in url_lower for domain in GEMINI_PUBLIC_NEWS_BLOCKED)
                # 추가: ~일보, ~신문, ~뉴스 등 패턴 매칭 (지역언론 포괄 차단)
                if not is_news:
                    from urllib.parse import urlparse
                    try:
                        hostname = urlparse(url).hostname or ''
                        # 뉴스성 도메인 패턴: ilbo, sinmun, news, times, daily
                        news_patterns = ['ilbo', 'sinmun', 'news', 'times', 'daily', 'journal', 'herald', 'press']
                        is_news = any(p in hostname.lower() for p in news_patterns)
                    except:
                        pass
                if is_news:
                    news_blocked_count += 1
                    continue

            # URL 접속 검증
            if not validate_url(url):
                invalid_count += 1
                continue

            # 필드명 통일
            verified_item = {
                'title': item.get('title') or item.get('data_title') or '',
                'content': item.get('content') or item.get('data_content') or '',
                'source': item.get('source') or item.get('data_source') or '',
                'source_url': url,
                'date': item.get('date') or item.get('data_date') or ''
            }
            verified_data.append(verified_item)

        print(f"  [Gemini] redirect URL 해결: {redirect_resolved}개")
        if news_blocked_count > 0:
            print(f"  [Gemini] 뉴스 도메인 차단: {news_blocked_count}개")
        if invalid_count > 0:
            print(f"  [Gemini] 무효 URL 제외: {invalid_count}개")
        print(f"  [Gemini] 최종 통과: {len(verified_data)}개")

        return json.dumps(verified_data, ensure_ascii=False, indent=2) if verified_data else None

    except Exception as e:
        error_str = str(e)
        if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
            # 429 에러는 상위로 전파하여 retry 허용
            raise
        print(f"  ❌ Gemini API 에러: {e}")
        return None
# --- End Gemini ---

# --- Placeholder for call_claude_with_websearch ---
def call_claude_with_websearch(client, prompt):
    """Claude API Call (Placeholder) - Returns multiple unique items"""
    print(f"  [CALL] Claude API Call Attempt")
    count_match = re.search(r'Count: (\d+) items', prompt)
    count = int(count_match.group(1)) if count_match else 1 # Default 1

    items = []
    for i in range(count):
        item_id = random.randint(1000, 9999) # Generate unique ID
        title = f"Claude Dummy Title {item_id}"
        content = f"Claude Dummy Content {item_id} - {prompt[:50]}..."
        source = f"Claude_Dummy_Source_{item_id}"
        url = f"https://dummy.claude.com/article/{item_id}"
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d") # Unique date

        items.append({
            "title": title,
            "content": content,
            "source": source,
            "source_url": url,
            "date": date
        })

    return json.dumps(items, ensure_ascii=False, indent=2) # Return as JSON string
# --- End Placeholder ---

# --- Placeholder for call_grok ---
def call_grok(client, prompt):
    """Grok API Call (Placeholder) - Returns multiple unique items"""
    print(f"  [CALL] Grok API Call Attempt")
    count_match = re.search(r'Count: (\d+) items', prompt)
    count = int(count_match.group(1)) if count_match else 1 # Default 1

    items = []
    for i in range(count):
        item_id = random.randint(1000, 9999) # Generate unique ID
        title = f"Grok Dummy Title {item_id}"
        content = f"Grok Dummy Content {item_id} - {prompt[:50]}..."
        source = f"Grok_Dummy_Source_{item_id}"
        url = f"https://dummy.grok.com/article/{item_id}"
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d") # Unique date

        items.append({
            "title": title,
            "content": content,
            "source": source,
            "source_url": url,
            "date": date
        })

    return json.dumps(items, ensure_ascii=False, indent=2) # Return as JSON string
# --- End Placeholder ---


def call_ai(ai_name, client, prompt, data_type="public"):
    """Unified AI Call Function"""
    if ai_name == "Perplexity":
        return call_perplexity(client, prompt, data_type)
    elif ai_name == "Claude":
        print(f"  [WARN] Claude web_search is not yet implemented. Skipping call.")
        return None
    elif ai_name == "Gemini":
        return call_gemini_with_search(client, prompt, data_type)
    elif ai_name == "Grok":
        print(f"  [WARN] Grok X search is not yet implemented. Skipping call.")
        return None
    return None


def get_date_range():
    """Calculate V30 Time Limit"""
    evaluation_date = datetime.now()
    official_start = evaluation_date - timedelta(days=365*4)  # 4 years
    public_start = evaluation_date - timedelta(days=365*2)    # 2 years

    return {
        'evaluation_date': evaluation_date.strftime('%Y-%m-%d'),
        'official_start': official_start.strftime('%Y-%m-%d'),
        'official_end': evaluation_date.strftime('%Y-%m-%d'),
        'public_start': public_start.strftime('%Y-%m-%d'),
        'public_end': evaluation_date.strftime('%Y-%m-%d'),
    }


def build_search_prompt(ai_name, data_type, topic_mode, politician_full, item_keywords, remaining, year_hint, extra_keyword, exclude_urls=None, domain_hint=""):
    """Generate V30 Collection Prompt (리팩토링: 템플릿 파일 동적 로드)

    실제 수집 조합 3가지만:
    - Gemini OFFICIAL (24개) - 국회, 정부, 공공기관
    - Gemini PUBLIC (12개) - 비언론 (YouTube, 블로그, 위키)
    - Perplexity PUBLIC (24개) - 뉴스/언론만

    [WARN] Perplexity OFFICIAL = dead code 삭제됨 (official: 0)
    [WARN] Claude/ChatGPT/Grok = 수집 제외 (평가만 담당)
    """
    # 지원 조합 검증 (dead code 방지)
    valid_combos = {("Gemini", "official"), ("Gemini", "public"), ("Perplexity", "public")}
    if (ai_name, data_type) not in valid_combos:
        return None

    # 템플릿 로드
    search_instruction_tpl, prompt_body_tpl = load_prompt_template(ai_name, data_type)
    if not search_instruction_tpl and not prompt_body_tpl:
        print(f"  [ERROR] Failed to load prompt template for {ai_name}/{data_type}")
        return None

    # topic_instruction 구성 (AI별 차등)
    # Perplexity: "부정적 뉴스 찾아라" → 안전 필터 충돌. 검색 키워드 방식으로 우회
    # Gemini: Google Search Grounding이므로 기존 방식 유지
    if ai_name == "Perplexity":
        if topic_mode == "negative":
            topic_instruction = (
                f"검색어에 다음 키워드를 포함하여 {politician_full} 관련 기사를 찾으세요: "
                "논란 OR 의혹 OR 비판 OR 문제제기 OR 지적 OR 반발 OR 갈등 OR 고발 OR 수사 OR 사퇴 OR 탄핵 OR 파면"
            )
        elif topic_mode == "positive":
            topic_instruction = (
                f"검색어에 다음 키워드를 포함하여 {politician_full} 관련 기사를 찾으세요: "
                "성과 OR 업적 OR 칭찬 OR 호평 OR 수상 OR 선정 OR 공로 OR 기여 OR 혁신 OR 개선 OR 해결"
            )
        else:
            topic_instruction = f"{politician_full} 관련 뉴스 기사를 자유롭게 검색하세요. 긍정/부정/중립 무관."
    else:  # Gemini
        if topic_mode == "negative":
            topic_instruction = f"Verify if this content is negative for {politician_full}."
        elif topic_mode == "positive":
            topic_instruction = f"Verify if this content is positive for {politician_full}."
        else:
            topic_instruction = f"This content is related to {politician_full}, collect freely regardless of positive/negative/neutral."

    # exclude_instruction 구성 (이미 수집한 URL 제외)
    exclude_instruction = ""
    if exclude_urls and len(exclude_urls) > 0:
        max_urls = 30 if ai_name == "Gemini" else 20
        exclude_list = "\n".join([f"- {u}" for u in list(exclude_urls)[:max_urls]])
        if ai_name == "Gemini":
            exclude_instruction = f"""
⚠️ IMPORTANT: The following URLs have already been collected. Do NOT include them:
{exclude_list}

You MUST find DIFFERENT URLs not listed above!
"""
        else:
            exclude_instruction = f"""
⚠️ 아래 URL은 이미 수집했으므로 절대 포함하지 마세요:
{exclude_list}

반드시 위 URL과 다른 새로운 기사를 찾아주세요!
"""

    # 변수 치환
    fmt_vars = {
        'politician_full': politician_full,
        'item_keywords': item_keywords,
        'extra_keyword': extra_keyword,
        'year_hint': year_hint,
        'remaining': min(remaining, 10),
        'topic_instruction': topic_instruction,
        'exclude_instruction': exclude_instruction,
        'domain_hint': domain_hint,
    }

    search_instruction = search_instruction_tpl.format_map(SafeFormatDict(fmt_vars))
    prompt_body = prompt_body_tpl.format_map(SafeFormatDict(fmt_vars))

    return search_instruction + "\n" + prompt_body


def extract_url(item):
    """Extract URL from item (type safe)"""
    url = item.get('source_url') or item.get('url') or ''
    if isinstance(url, list):
        return url[0] if url else ''
    elif not isinstance(url, str):
        return str(url) if url else ''
    return url


def validate_collected_data(items, expected_data_type, ai_name):
    """Validate collected data (per-item filtering)

    Returns:
        tuple: (valid_items list, error_messages list)
        - valid_items: 검증 통과한 항목 리스트
        - errors: 경고/에러 메시지 리스트

    Note: 개별 항목별 필터링 (all-or-nothing이 아님!)
    """
    errors = []
    valid_items = []

    if not isinstance(items, list):
        errors.append("Response is not a list format.")
        return [], errors

    for i, item in enumerate(items):
        if not isinstance(item, dict):
            errors.append(f"Item {i} is not a dictionary format.")
            continue

        # 필수 필드 체크 (title, content, source_url만 필수, date/source는 선택)
        title = item.get('title') or item.get('data_title') or ''
        content = item.get('content') or item.get('data_content') or ''
        source_url = extract_url(item)

        if not title and not content:
            errors.append(f"Item {i}: title과 content 모두 비어있음")
            continue

        if not source_url or 'dummy' in source_url.lower():
            errors.append(f"Item {i}: source_url 없거나 dummy URL")
            continue

        # OFFICIAL 도메인 검증 (Gemini만 - 경고만, 거부 안 함)
        if expected_data_type == "official" and ai_name == "Gemini":
            is_official_domain = any(domain in source_url for domain in OFFICIAL_DOMAINS)
            if not is_official_domain:
                # 뉴스가 공식 활동을 보도하는 경우도 허용 (경고만)
                errors.append(f"Item {i}: OFFICIAL이지만 비공식 도메인 (허용): {source_url[:60]}")

        # Gemini prohibits X data collection
        if ai_name == "Gemini" and ("twitter.com" in source_url or "x.com" in source_url):
            errors.append(f"Item {i}: Gemini X/Twitter 금지 - 제외: {source_url[:60]}")
            continue

        # Date 정규화 (빈 날짜, N/A 허용 → None으로 처리)
        raw_date = item.get('date') or item.get('data_date') or ''
        if raw_date and raw_date.strip().upper() in ['N/A', 'NA', 'UNKNOWN', 'NONE', '']:
            item['date'] = ''  # 빈 문자열로 통일

        valid_items.append(item)

    return valid_items, errors


def collect_data_type(ai_name, client, politician_id, politician_full, category_name, data_type, topic_mode, count, pre_seen_urls=None):
    """Collects data for a specific AI, category, data type, and sentiment.

    이전 성공 패턴 복원:
    - 라운드마다 카테고리의 모든 10개 세부항목을 각각 개별 API 호출
    - 각 키워드가 다른 검색 결과 → URL 다양성 확보 → 중복 최소화
    - 429 에러 시 대기 후 재시도
    - 최대 MAX_ROUNDS 라운드 반복

    Args:
        pre_seen_urls: 이전 sentiment에서 수집된 URL set (교차 중복 방지)
    """
    # AI별 파라미터 차등 적용 (Perplexity는 URL 부족으로 더 많은 기회 부여)
    if ai_name == "Perplexity":
        MAX_ROUNDS = 9       # Perplexity는 라운드 더 많이
        MAX_PER_CALL = 10    # 한번에 10개 요청
        MAX_EMPTY_KW = 10    # 키워드 10개 전부 시도 (조기 종료 방지)
        MAX_EMPTY_ROUNDS = 3 # 3라운드 연속 빈 라운드 허용
    else:  # Gemini
        MAX_ROUNDS = 7
        MAX_PER_CALL = 5
        MAX_EMPTY_KW = 7
        MAX_EMPTY_ROUNDS = 2
    MAX_429_RETRIES = 3  # 429 에러 재시도 횟수

    print(f"    -> {topic_mode.upper()} ({count}개) 수집 시작...")
    all_items = []  # 유니크 아이템만 저장
    # DB 기존 URL만 포함 (sentiment 간 공유 안 함)
    seen_urls = set(pre_seen_urls) if pre_seen_urls else set()

    category_items = CATEGORY_ITEMS.get(category_name, [("", "")])
    year_hint = "(2025, 2024)"

    # 정체 감지: 라운드 전체에서 새 아이템 0개면 조기 종료
    consecutive_empty_rounds = 0

    for round_num in range(MAX_ROUNDS):
        unique_count = len(all_items)
        remaining = count - unique_count
        if remaining <= 0:
            break

        if round_num > 0:
            print(f"    [라운드 {round_num+1}] 현재 {unique_count}개 / 목표 {count}개")

        round_added_total = 0  # 이번 라운드에서 추가된 총 수

        # 각 라운드에서 모든 카테고리 아이템을 순회하며 개별 API 호출
        consecutive_empty_keywords = 0  # 연속 빈 키워드 수
        for kw_idx, (item_name, item_keywords) in enumerate(category_items):
            unique_count = len(all_items)
            remaining = count - unique_count
            if remaining <= 0:
                break

            # 정체 감지: 연속 N개 키워드에서 새 아이템 0개면 이번 라운드 종료
            if consecutive_empty_keywords >= MAX_EMPTY_KW:
                print(f"    ⚠️ 연속 {consecutive_empty_keywords}개 키워드 결과 없음 → 라운드 조기 종료")
                break

            request_count = min(remaining, MAX_PER_CALL)

            # 429 에러 재시도 루프
            for retry in range(MAX_429_RETRIES):
                try:
                    # Gemini 도메인 순환: 키워드 인덱스에 따라 다른 도메인 검색
                    domain_hint = ""
                    if ai_name == "Gemini":
                        if data_type == "official":
                            hints = GEMINI_OFFICIAL_DOMAIN_HINTS
                        else:
                            hints = GEMINI_PUBLIC_PLATFORM_HINTS
                        domain_hint = hints[kw_idx % len(hints)]

                    prompt = build_search_prompt(
                        ai_name, data_type, topic_mode, politician_full,
                        item_keywords, request_count, year_hint, item_name,
                        exclude_urls=seen_urls,  # 모든 AI에 exclude_urls 전달
                        domain_hint=domain_hint
                    )

                    if not prompt:
                        break

                    # AI Call
                    response_text = call_ai(ai_name, client, prompt, data_type)

                    if not response_text:
                        break  # 이 키워드 스킵, 다음 키워드로

                    # JSON Parsing
                    json_match = re.search(r'```json\s*([\s\S]+?)\s*```', response_text)
                    if json_match:
                        response_json_str = json_match.group(1)
                    else:
                        response_json_str = response_text

                    data = json.loads(response_json_str)

                    # Data validation (per-item filtering)
                    valid_data, errors = validate_collected_data(data, data_type, ai_name)

                    if not valid_data:
                        break  # 이 키워드 스킵

                    # 메모리 내 중복 제거 + 메타데이터 추가
                    added = 0
                    for item in valid_data:
                        if len(all_items) >= count:
                            break

                        # URL 정규화로 중복 체크
                        url = extract_url(item)
                        url_normalized = normalize_url(url) if url else ''

                        if url_normalized and url_normalized in seen_urls:
                            continue  # 이미 수집된 URL → 스킵

                        # 유니크 아이템 추가
                        item['sentiment'] = topic_mode
                        item['data_type'] = data_type
                        item['collector_ai'] = ai_name
                        all_items.append(item)
                        if url_normalized:
                            seen_urls.add(url_normalized)
                        added += 1

                    if added > 0:
                        # 키워드명 5글자까지만 표시
                        short_name = item_name[:5] if len(item_name) > 5 else item_name
                        print(f"      [{short_name}] +{added}개 → 누적 {len(all_items)}개")
                        consecutive_empty_keywords = 0  # 리셋
                        round_added_total += added
                    else:
                        consecutive_empty_keywords += 1

                    break  # 성공 시 retry 루프 탈출

                except json.JSONDecodeError as e:
                    print(f"    [{ai_name}] JSON 파싱 오류: {e}")
                    break  # JSON 에러는 재시도 의미 없음

                except Exception as e:
                    error_str = str(e)
                    if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
                        wait_time = 2 ** (retry + 1)  # 2, 4, 8초
                        print(f"  ❌ {ai_name} API 에러: 429 RESOURCE_EXHAUSTED. {error_str[:100]}")
                        time.sleep(wait_time)
                        continue  # 재시도
                    else:
                        print(f"  ❌ {ai_name} API 에러: {e}")
                        break  # 다른 에러는 재시도 안 함

            # 키워드 간 간격 (rate limit 방지)
            if len(all_items) < count:
                time.sleep(0.5)

        # 라운드 종료 후 정체 감지
        if round_added_total == 0:
            consecutive_empty_rounds += 1
            if consecutive_empty_rounds >= MAX_EMPTY_ROUNDS:
                print(f"    ⚠️ {consecutive_empty_rounds}라운드 연속 새 아이템 없음 → 수집 조기 종료")
                break
        else:
            consecutive_empty_rounds = 0

    print(f"    ✅ {topic_mode.upper()} {len(all_items)}개 수집 완료 (목표 {count}개)")
    return all_items[:count]


def collect_with_ai(ai_name, politician_id, politician_name, category_idx, category_name, category_korean, test_mode=False, data_type=None):
    """Collects category data with a specific AI (refactored version)

    Args:
        test_mode: True for mini test mode (collects 10 items)
        data_type: "official" or "public" (added)
    """
    mode_label = "[Mini Test]" if test_mode else ""
    print(f"\n{'='*60}")
    print(f"{mode_label}[{ai_name}] {category_korean} ({category_name}) Collection Start (Type: {data_type})")
    print(f"{ '='*60}")

    # [OK] V30 120% Limit Rule: AI별 독립 제한 (Gemini/Perplexity 각각 따로)
    # Gemini 목표 30 * 1.2 = 36, Perplexity 목표 20 * 1.2 = 24
    AI_MAX = {"Gemini": 36, "Perplexity": 24}
    AI_TARGET = {"Gemini": 30, "Perplexity": 20}
    max_for_ai = AI_MAX.get(ai_name, 50)
    target_for_ai = AI_TARGET.get(ai_name, 45)

    existing_ai_total = get_exact_count(TABLE_COLLECTED_DATA, {
        'politician_id': politician_id,
        'category': category_name,
        'collector_ai': ai_name
    })

    if existing_ai_total >= max_for_ai:
        print(f"  [STOP] {ai_name} 110% limit reached: {existing_ai_total} items (Max {max_for_ai} items)")
        print(f"  [INFO] Skipping collection")
        return 0

    if existing_ai_total >= target_for_ai:
        remaining_allowed = max_for_ai - existing_ai_total
        print(f"  [WARN] {ai_name} target reached: {existing_ai_total} items / {target_for_ai} items")
        print(f"  [INFO] Can collect up to {remaining_allowed} more items")

    # Retrieve detailed politician information (for distinguishing identical names)
    pol_info = get_politician_info(politician_id)
    politician_full = pol_info['search_string'] if pol_info['search_string'] else politician_name

    # Use TEST_SENTIMENT_DISTRIBUTION if in test mode
    sentiment_dist_for_ai = TEST_SENTIMENT_DISTRIBUTION[ai_name] if test_mode else SENTIMENT_DISTRIBUTION[ai_name]
    client = init_ai_client(ai_name)

    all_items = []

    # DB 기존 URL 미리 로드 → 메모리 중복 제거에 활용 (DB 저장 시 탈락 방지)
    cross_sentiment_urls = set()
    try:
        existing_result = (
            supabase.table(TABLE_COLLECTED_DATA)
            .select('source_url')
            .eq('politician_id', politician_id)
            .eq('collector_ai', ai_name)
            .eq('category', category_name)
            .eq('data_type', data_type)
            .execute()
        )
        if existing_result.data:
            for row in existing_result.data:
                url = row.get('source_url', '')
                if url:
                    normalized = normalize_url(url)
                    if normalized:
                        cross_sentiment_urls.add(normalized)
            if cross_sentiment_urls:
                print(f"    📌 DB 기존 URL {len(cross_sentiment_urls)}개 로드 → 중복 방지")
    except Exception as e:
        print(f"    [WARN] DB URL 로드 실패: {e}")

    # Get sentiment distribution corresponding to data_type
    sentiment_dist_for_type = sentiment_dist_for_ai.get(data_type, {}) # Return empty dictionary if data_type not found

    if sentiment_dist_for_type and (sentiment_dist_for_type.get("negative", 0) + sentiment_dist_for_type.get("positive", 0) + sentiment_dist_for_type.get("free", 0)) > 0:

        # 감정별 수집 (기존 데이터 확인 후 추가 수집분만 요청)
        for sentiment_key, emoji, label in [
            ("negative", "🚨", "부정"),
            ("positive", "✨", "긍정"),
            ("free", "🎲", "자유")
        ]:
            target_count = sentiment_dist_for_type.get(sentiment_key, 0)
            if target_count <= 0:
                continue

            # 기존 데이터 확인
            existing_count = get_exact_count(TABLE_COLLECTED_DATA, {
                'politician_id': politician_id,
                'category': category_name,
                'data_type': data_type,
                'collector_ai': ai_name,
                'sentiment': sentiment_key
            })

            actual_need = max(0, target_count - existing_count)

            print(f"    {emoji} {label} {target_count}개...")
            print(f"    📊 기존 {existing_count}개 / 목표 {target_count}개 → {actual_need}개 추가 수집")

            if actual_need <= 0:
                print(f"    ✅ {label} 이미 목표 달성")
                continue

            collected = collect_data_type(
                ai_name, client, politician_id, politician_full, category_name, data_type, sentiment_key, actual_need,
                pre_seen_urls=cross_sentiment_urls  # DB 기존 URL만 전달 (sentiment 간 공유 안 함)
            )
            # NOTE: sentiment 간 URL 누적 제거 (FREE 수량 보호)
            # DB 중복 체크에서 교차 중복 처리
            all_items.extend(collected)
            print(f"    ✅ {label} {len(collected)}개 수집 완료")
    else:
        print(f"  [INFO] Skipping {ai_name}'s {data_type.upper()} data collection as target is 0.")

    # Save to DB
    saved_count = 0
    skipped_count = 0  # Duplicate skip count

    for item in all_items:
        try:
            # Support various field names (AI responses may vary)
            title = item.get('data_title') or item.get('title') or item.get('item') or ''
            content = item.get('data_content') or item.get('description') or item.get('content') or item.get('item') or ''
            source_url = item.get('source_url') or item.get('url') or item.get('link') or ''
            # URL type check (use first element if list)
            if isinstance(source_url, list):
                source_url = source_url[0] if source_url else ''
            elif not isinstance(source_url, str):
                source_url = str(source_url) if source_url else ''
            source_name = item.get('data_source') or item.get('source') or item.get('source_type') or ''
            raw_date = item.get('data_date') or item.get('date') or item.get('published_date')
            pub_date = normalize_date(raw_date)  # Normalize date format
            sentiment = item.get('sentiment') or 'free'  # sentiment added by collect_data_type()
            # [OK] Keep 'free' value as is (allowed in DB)

            # Use content beginning if title is missing
            if not title and content:
                title = content[:50]

            collector = item.get('collector_ai', ai_name)

            # [OK] V30 Advanced Duplicate Removal: URL Normalization + Title Normalization
            # URL Normalization (remove parameters, anchors)
            source_url_normalized = normalize_url(source_url) if source_url else ''

            # Title Normalization (remove special characters, spaces)
            title_normalized = normalize_title(title) if title else ''

            # Duplicate check: Check by URL or Title
            is_dup = False

            if source_url_normalized or title_normalized:
                try:
                    # 같은 AI + 카테고리 내 전체에서 중복 체크 (sentiment 무관)
                    existing_result = (
                        supabase.table(TABLE_COLLECTED_DATA)
                        .select('source_url, title')
                        .eq('politician_id', politician_id)
                        .eq('collector_ai', collector)
                        .eq('category', category_name)
                        .execute()
                    )

                    if existing_result.data:
                        for existing_item in existing_result.data:
                            # URL Duplicate Check
                            if source_url_normalized:
                                existing_url = normalize_url(existing_item.get('source_url', ''))
                                if existing_url and is_duplicate_by_url(source_url, existing_item.get('source_url', '')):
                                    is_dup = True
                                    break

                            # Title Duplicate Check (80% 유사도)
                            if title_normalized and not is_dup:
                                existing_title = existing_item.get('title', '')
                                if is_duplicate_by_title(title, existing_title, threshold=0.80):
                                    is_dup = True
                                    break

                    if is_dup:
                        # Duplicate found - skip
                        skipped_count += 1
                        continue

                except Exception as e:
                    # If duplicate check fails, continue trying to save
                    print(f"  [WARN] Duplicate check error: {e}")
                    pass

            # summary: content의 30% 요약 (글자 수 기준)
            content_str = str(content)[:2000]
            summary_len = max(30, int(len(content_str) * 0.3))
            summary = content_str[:summary_len]

            record = {
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category_name.lower(),
                'data_type': item.get('data_type', 'public'),
                'collector_ai': collector,
                'title': str(title)[:200],
                'content': content_str,
                'summary': summary,
                'source_url': source_url,  # 원본 URL 저장 (정규화는 중복 비교용으로만)
                'source_name': str(source_name),
                'published_date': pub_date,
                'sentiment': sentiment,
                'is_verified': False
            }

            supabase.table(TABLE_COLLECTED_DATA).insert(record).execute()
            saved_count += 1
        except Exception as e:
            print(f"  [WARN] Save failed: {e}")

    print(f"  [SAVE] [{ai_name}] {category_korean}: {saved_count} items saved, {skipped_count} duplicates skipped")
    return saved_count


def collect_all_for_politician(politician_id, politician_name, target_ai=None, target_category=None, parallel=False, test_mode=False):
    """Collect all data for a politician

    Args:
        test_mode: True for mini test mode (collects 10 items)
    """
    mode_str = "[Mini Test]" if test_mode else ""
    
    # 절대 규칙: Gemini 30 (OFFICIAL 20 + PUBLIC 10) + Perplexity 20 (PUBLIC) = 50개
    if test_mode:
        target_per_cat_gemini = TEST_DISTRIBUTION["Gemini"]["total"]
        target_per_cat_perplexity = TEST_DISTRIBUTION["Perplexity"]["total"]
        total_target_per_cat = target_per_cat_gemini + target_per_cat_perplexity  # 6 + 2 = 8 (+ 추가버퍼 1 = 9)
    elif target_ai == "Gemini":
        total_target_per_cat = COLLECT_DISTRIBUTION["Gemini"]["total"]  # 54
    elif target_ai == "Perplexity":
        total_target_per_cat = COLLECT_DISTRIBUTION["Perplexity"]["total"]  # 18
    else:  # 전체 수집 (양쪽 AI)
        total_target_per_cat = COLLECT_DISTRIBUTION["Gemini"]["total"] + COLLECT_DISTRIBUTION["Perplexity"]["total"]  # 54 + 18 = 72 (+ 추가버퍼 6)


    print(f"\n{'#'*60}")
    print(f"# V30 {mode_str} Collection Start: {politician_name} ({politician_id})")
    print(f"# 기본 50개: Gemini 30 (OFFICIAL 20 + PUBLIC 10) + Perplexity 20 (PUBLIC) | 버퍼 포함 최대 60개")
    print(f"# 검증 후: 60개+ → 패스 | 60개 미만 → 추가 수집")
    print(f"{'#'*60}")

    # Collection AI List
    collect_ais = ["Gemini", "Perplexity"] # Include both Gemini, Perplexity
    if target_ai:
        collect_ais = [target_ai]

    # Category List
    categories = CATEGORIES
    if target_category:
        categories = [CATEGORIES[target_category - 1]]

    total_saved = 0
    start_time = time.time()

    # If parallel or test mode, run sequentially (ThreadPoolExecutor used in internal collect_data_type)
    if parallel or test_mode:
        print(f"\n[Sequential Run] (Total {len(collect_ais)} AIs x {len(categories)} Categories)")

        failed_tasks = []

        for ai_name in collect_ais:
            print(f"\n{'='*60}")
            print(f"[{ai_name}] Collection Start")
            print(f"{ '='*60}")

            # For each AI, iterate through official and public data types
            for cat_idx, (cat_name, cat_korean) in enumerate(categories):
                for data_type_key in ["official", "public"]:
                    # Check if the data_type is relevant for the current mode (test or normal)
                    if (test_mode and TEST_DISTRIBUTION[ai_name].get(data_type_key, 0) > 0) or \
                       (not test_mode and COLLECT_DISTRIBUTION[ai_name].get(data_type_key, 0) > 0): # Only try to collect if target > 0
                        print(f"  -> {data_type_key.upper()} Data Collection Start for {ai_name} - {cat_korean}")
                        try:
                            count = collect_with_ai(
                                ai_name, politician_id, politician_name,
                                cat_idx,
                                cat_name,
                                cat_korean,
                                test_mode,
                                data_type=data_type_key # Pass data_type explicitly
                            )
                            total_saved += count
                        except Exception as e:
                            print(f"  [FAIL] [{ai_name}] {cat_korean} ({data_type_key}) 1st attempt failed: {e}")
                            failed_tasks.append({
                                'ai_name': ai_name,
                                'cat_idx': cat_idx,
                                'cat_name': cat_name,
                                'cat_korean': cat_korean,
                                'data_type': data_type_key
                            })
            print(f"\n[OK] [{ai_name}] Collection Complete")

            # Interval between AIs
            if ai_name != collect_ais[-1]:
                time.sleep(2)

        # ============================================================ 
        # 2nd Attempt: Retry failed tasks sequentially (safe)
        # ============================================================ 
        if failed_tasks:
            print(f"\n{'='*60}")
            print(f"Retrying failed tasks: {len(failed_tasks)} items")
            print(f"{ '='*60}")

            for attempt in range(1, 4):  # Max 3 retries
                if not failed_tasks:
                    break

                print(f"\n[Retry {attempt}/3] {len(failed_tasks)} tasks")
                retry_success = []

                for task in failed_tasks:
                    try:
                        # Exponential backoff
                        backoff_time = 2 ** (attempt - 1)
                        if backoff_time > 1:
                            time.sleep(backoff_time)

                        count = collect_with_ai(
                            task['ai_name'], politician_id, politician_name,
                            task['cat_idx'],
                            task['cat_name'],
                            task['cat_korean'],
                            test_mode,
                            data_type=task['data_type']
                        )
                        total_saved += count
                        retry_success.append(task)
                        print(f"  [OK] [{task['ai_name']}] {task['cat_korean']} ({task['data_type']}) Retry successful (+{count} items)")
                    except Exception as e:
                        print(f"  [WARN] [{task['ai_name']}] {task['cat_korean']} ({task['data_type']}) Retry {attempt} failed: {e}")

                # Remove successful tasks
                failed_tasks = [t for t in failed_tasks if t not in retry_success]

            # ============================================================ 
            # 3rd Attempt: Final failed task logging
            # ============================================================ 
            if failed_tasks:
                print(f"\n{'='*60}")
                print(f"[FAIL] Final Failed Tasks: {len(failed_tasks)} items")
                print(f"{ '='*60}")
                for task in failed_tasks:
                    print(f"  - [{task['ai_name']}] {task['cat_korean']} ({task['cat_name']}) [{task['data_type']}]")
                print(f"\n[WARN] Some category collections failed. Recallection may be needed.")
    else:
        # Sequential Collection
        for cat_idx, (cat_name, cat_korean) in enumerate(categories):
            for ai_name in collect_ais:
                for data_type_key in ["official", "public"]:
                    if (test_mode and TEST_DISTRIBUTION[ai_name].get(data_type_key, 0) > 0) or \
                       (not test_mode and COLLECT_DISTRIBUTION[ai_name].get(data_type_key, 0) > 0):
                        count = collect_with_ai(
                            ai_name, politician_id, politician_name,
                            cat_idx, cat_name, cat_korean, test_mode,
                            data_type=data_type_key
                        )
                        total_saved += count
                        time.sleep(1)  # API Rate Limit prevention

    elapsed = time.time() - start_time

    print(f"\n{'='*60}")
    print(f"[OK] V30 {mode_str}Collection Complete: {politician_name}")
    print(f"   Total Saved: {total_saved} items")
    print(f"   Time Taken: {elapsed:.1f} seconds ({elapsed/60:.1f} minutes)")
    print(f"{ '='*60}")

    # Output verification results if in test mode
    if test_mode:
        verify_test_results(politician_id, politician_name, categories)

    # # Automatic validation trigger (Option 1: Main agent approach)
    # if not args.skip_validation:
    #     print(f"\n{'='*60}")
    #     print("[SEARCH] Starting automatic validation...")
    #     print("Validating collected data.")
    #     print(f"{ '='*60}\n")
    # 
    #     try:
    #         # Import run_validation_pipeline function from validate_v30.py
    #         import sys
    #         import os
    #         script_dir = os.path.dirname(os.path.abspath(__file__))
    #         sys.path.insert(0, script_dir)
    # 
    #         from validate_v30 import run_validation_pipeline
    # 
    #         # Run validation
    #         result = run_validation_pipeline(
    #             politician_id=args.politician_id,
    #             politician_name=args.politician_name,
    #             mode='all',
    #             ai_name=args.ai
    #         )
    # 
    #         print(f"\n{'='*60}")
    #         print("[OK] Automatic validation complete")
    #         print(f"   - Valid: {result.get('valid', 0)} items")
    #         print(f"   - Invalid: {result.get('invalid', 0)} items")
    #         print(f"{ '='*60}\n")
    # 
    #     except Exception as e:
    #         print(f"\n[WARN] Automatic validation failed: {e}")
    #         print("Please run the validation script manually:")
    #         print(f"python validate_v30.py --politician_id={args.politician_id} --politician_name=\"{args.politician_name}\"\n")
    # 
    return total_saved

def verify_test_results(politician_id, politician_name, categories):
    """Test result verification"""
    print(f"\n{'='*60}")
    print(f"[GRAPH] Test Result Verification: {politician_name}")
    print(f"{ '='*60}")

    total_by_ai = {"Gemini": 0, "Perplexity": 0} # Perplexity included now
    total_by_type = {"official": 0, "public": 0}

    for cat_name, cat_korean in categories:
        # Retrieve count per AI
        for ai_name in ["Gemini", "Perplexity"]: # Perplexity included now
            count = get_exact_count(TABLE_COLLECTED_DATA, {
                'politician_id': politician_id,
                'category': cat_name,
                'collector_ai': ai_name
            })
            total_by_ai[ai_name] += count
        
        # Retrieve count per data type
        for dtype in ["official", "public"]:
            count = get_exact_count(TABLE_COLLECTED_DATA, {
                'politician_id': politician_id,
                'category': cat_name,
                'data_type': dtype
            })
            total_by_type[dtype] += count

    # Output results
    print(f"\n[GRAPH] AI-specific Collection Results:")
    total = sum(total_by_ai.values())
    for ai_name, count in total_by_ai.items():
        pct = (count / total * 100) if total > 0 else 0
        expected_total_per_ai_category = TEST_DISTRIBUTION[ai_name]['total']
        expected = expected_total_per_ai_category * len(categories)
        status = "[OK]" if count >= expected * 0.8 else "[WARN]" # Success if >= 80%
        print(f"   {status} {ai_name}: {count} items ({pct:.1f}%) - Target {expected} items")

    print(f"\n[GRAPH] By Data Type:")
    for dtype, count in total_by_type.items():
        print(f"   - {dtype.upper()}: {count} items")

    print(f"\n[GRAPH] Total: {total} items")

    # Ratio verification
    if total > 0:
        gemini_pct = total_by_ai["Gemini"] / total * 100
        perplexity_pct = total_by_ai["Perplexity"] / total * 100 

        print(f"\n[TARGET] Ratio Verification (Target: Gemini ~60%, Perplexity ~40%):")
        print(f"   Gemini: {gemini_pct:.1f}% {'[OK]' if 50 <= gemini_pct <= 70 else '[WARN]'}") # 60% (30/50)
        print(f"   Perplexity: {perplexity_pct:.1f}% {'[OK]' if 30 <= perplexity_pct <= 50 else '[WARN]'}") # 40% (20/50)

    print(f"{ '='*60}")


def get_all_politicians():
    """Retrieve all politicians from DB"""
    try:
        result = supabase.table('politicians').select('id', 'name').execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"[FAIL] Failed to retrieve politician list: {e}")
        return []


def collect_all_politicians(target_ai=None, target_category=None, parallel=False, test_mode=False):
    """Collect all data for all politicians"""
    politicians = get_all_politicians()

    if not politicians:
        print("[FAIL] No politicians to collect.")
        return

    mode_str = "[Mini Test]" if test_mode else ""
    print(f"\n{'#'*60}")
    print(f"# V30 {mode_str}Bulk Collection Start for All Politicians")
    print(f"# Total {len(politicians)} politicians")
    print(f"{ '#'*60}\n")

    success_count = 0
    fail_count = 0

    for i, p in enumerate(politicians, 1):
        pid = p['id']
        pname = p['name']

        print(f"\n[{i}/{len(politicians)}] Collection Start for {pname} (ID: {pid})...")

        try:
            saved = collect_all_for_politician(
                pid, pname,
                target_ai=target_ai,
                target_category=target_category,
                parallel=parallel,
                test_mode=test_mode
            )
            success_count += 1
            print(f"[OK] {pname}: {saved} items collected")
        except Exception as e:
            fail_count += 1
            print(f"[FAIL] {pname}: Collection failed - {e}")

        # Interval between politicians (to prevent API rate limits)
        if i < len(politicians):
            time.sleep(2 if not test_mode else 1)

    print(f"\n{'#'*60}")
    print(f"# {mode_str}Bulk Collection Complete")
    print(f"# Success: {success_count} politicians, Failed: {fail_count} politicians")
    print(f"{ '#'*60}")


def clear_politician_category_data(politician_id, category_name):
    """Clears all collected data for a specific politician and category."""
    try:
        response = supabase.table(TABLE_COLLECTED_DATA).delete()\
            .eq('politician_id', politician_id)\
            .eq('category', category_name)\
            .execute()
        print(f"  [OK] Cleared {politician_id}'s '{category_name}' data. Count: {response.count}")
        return True
    except Exception as e:
        print(f"  [FAIL] Failed to clear data for {politician_id}, '{category_name}': {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='V30 Web Search Collection (Gemini 90 + Perplexity 30 + Buffer 10 = 130)')
    parser.add_argument('--politician_id', help='Politician ID (cannot be used with --all)')
    parser.add_argument('--politician_name', help='Politician Name (cannot be used with --all)')
    parser.add_argument('--all', action='store_true', help='Collect for all politicians')
    parser.add_argument('--ai', choices=['Gemini', 'Perplexity'], help='Run only a specific AI (Gemini or Perplexity)') # Perplexity added
    parser.add_argument('--category', type=int, choices=range(1, 11), help='Specific category only (1-10)')
    parser.add_argument('--parallel', action='store_true', help='Parallel execution')
    parser.add_argument('--test', action='store_true', help='Mini test mode (10 items per category, auto validation)')
    parser.add_argument('--skip-validation', action='store_true', help='Skip auto validation after collection')
    parser.add_argument('--clear-data', action='store_true', help='Clear existing collected data for the politician/category before collection')

    args = parser.parse_args()

    # Test Mode Guidance
    if args.test:
        print(f"\n{'='*60}")
        print(f"[TEST] Mini Test Mode Activated")
        print(f"   - Per category: Gemini 10 items + Perplexity 3 items (Total 13 items)")
        print(f"   - Gemini, Perplexity sequential/parallel execution")
        print(f"   - Expected duration: 1-2 minutes (1 category)")
        print(f"   - Auto validation after completion")
        print(f"{ '='*60}\n")

    # Collect for all politicians
    if args.all:
        collect_all_politicians(
            target_ai=args.ai,
            target_category=args.category,
            parallel=args.parallel or args.test,
            test_mode=args.test
        )
        return

    # Collect for individual politician (existing method)
    if not args.politician_id or not args.politician_name:
        print("[FAIL] Please specify --politician_id and --politician_name, or use --all.")
        print("")
        print("Usage Example:")
        print("   # Mini Test (1 category, 3-5 minutes)")
        print("   python collect_v30.py --politician_id=xxx --politician_name=\"Hong Gil-dong\" --test --category=1")
        print("")
        print("   # Full Collection (Parallel)")
        print("   python collect_v30.py --politician_id=xxx --politician_name=\"Hong Gil-dong\" --parallel")
        print("")
        print("   # Bulk Collection for All Politicians")
        print("   python collect_v30.py --all --parallel")
        return

    # Check politician
    exists, db_name = check_politician_exists(args.politician_id)
    if not exists:
        print(f"[FAIL] Politician ID '{args.politician_id}' not found in politicians table.")
        print("   Please register the politician first.")
        return

    # Clear data if requested
    if args.clear_data:
        print(f"\n{'='*60}")
        print(f"[CLEAN] Clearing existing data for {args.politician_name} ({args.politician_id}) - Category: {CATEGORIES[args.category - 1][0] if args.category else 'All'}")
        print(f"{ '='*60}")
        if args.category:
            clear_politician_category_data(args.politician_id, CATEGORIES[args.category - 1][0])
        else:
            for cat_name, _ in CATEGORIES:
                clear_politician_category_data(args.politician_id, cat_name)
        print(f"[CLEAN] Data clearing complete.")
        # Exit after clearing if only clearing is requested
        if not (args.ai or args.parallel or args.test):
            return

    # Run collection
    collect_all_for_politician(
        args.politician_id,
        args.politician_name,
        target_ai=args.ai,
        target_category=args.category,
        parallel=args.parallel or args.test,
        test_mode=args.test
    )

    # Automatic validation trigger (Option 1: Main agent approach)
    if not args.skip_validation:
        pass # Disabling auto-validation for now

if __name__ == "__main__":
    main()