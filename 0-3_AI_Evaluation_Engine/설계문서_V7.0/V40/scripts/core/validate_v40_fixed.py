# -*- coding: utf-8 -*-
"""
V40 검증 스크립트 (수정 버전)

수집된 데이터를 검증하고 문제가 있는 항목을 식별합니다.

수정 사항:
1. URL timeout: 10초 → 30초
2. validate_event_date: 완전히 제거 (과도한 오판)
3. 기간 검증: published_date만 사용 (event_year 무시)
4. URL 검증: 3회 재시도 (네트워크 불안정 대응)
5. 검증 모드: 삭제하지 않고 로그만 기록

핵심 원칙:
- 검증은 "참고용"
- 삭제는 신중하게
- AI 평가 단계에서 최종 품질 판단 (4개 AI: Claude Haiku 4.5, ChatGPT gpt-5.1-codex-mini, Gemini 2.0 Flash, Grok 3)

사용법:
    python validate_v40_fixed.py --politician_id=62e7b453 --politician_name="오세훈" --no-dry-run
"""

import sys
import io

# UTF-8 출력 설정 (최우선 - 모든 import 전에 실행)
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', line_buffering=True)
    except AttributeError:
        pass

import os
import json
import re
import argparse
import time
import requests
from datetime import datetime, timedelta
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# Add helpers directory to path
SCRIPT_DIR = Path(__file__).resolve().parent
HELPERS_DIR = SCRIPT_DIR.parent / 'helpers'
sys.path.insert(0, str(HELPERS_DIR))

from duplicate_check_utils import normalize_url, normalize_title, is_duplicate_by_url, is_duplicate_by_title

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V40 테이블명
TABLE_COLLECTED_DATA = "collected_data_v40"

# SNS 도메인 (URL 검증 제외)
SNS_DOMAINS = [
    "twitter.com", "x.com", "facebook.com", "instagram.com",
    "youtube.com", "youtu.be", "tiktok.com"
]

# 검증 결과 코드
VALIDATION_CODES = {
    "VALID": "유효",
    "INVALID_URL": "URL 접속 불가",
    "EMPTY_URL": "URL 비어있음",
    "FAKE_URL": "가짜 URL 패턴",
    "WRONG_SOURCE_TYPE": "source_type 불일치",
    "MISSING_FIELD": "필수 필드 누락",
    "DATE_OUT_OF_RANGE": "기간 초과",
    "DUPLICATE": "중복 데이터",
    "NAMESAKE": "동명이인 데이터",
    "IRRELEVANT_CONTENT": "무관 데이터 (정치인 언급 없음)"
}

# Sentiment 비율 최소 기준 (V40_기본방침.md 섹션 6)
# OFFICIAL 10-10-80: negative 10%, positive 10%, free 80%
# PUBLIC 20-20-60: negative 20%, positive 20%, free 60%
MIN_NEGATIVE_PCT_OFFICIAL = 10  # OFFICIAL negative 최소 10%
MIN_POSITIVE_PCT_OFFICIAL = 10  # OFFICIAL positive 최소 10%
MIN_NEGATIVE_PCT_PUBLIC = 20    # PUBLIC negative 최소 20%
MIN_POSITIVE_PCT_PUBLIC = 20    # PUBLIC positive 최소 20%

CATEGORIES_ALL = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication',
    'responsiveness', 'publicinterest'
]

CATEGORY_KOREAN = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력',
    'responsiveness': '대응성', 'publicinterest': '공익성'
}


def is_sns_url(url):
    """SNS URL 여부 확인"""
    if not url:
        return False
    domain = urlparse(url).netloc.lower()
    return any(sns in domain for sns in SNS_DOMAINS)


def is_fake_url_pattern(url):
    """가짜 URL 패턴 체크"""
    if not url:
        return False

    fake_patterns = [
        r'example\.com',
        r'test\.com',
        r'placeholder',
        r'\[URL\]',
        r'http://www\.example',
    ]

    for pattern in fake_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            return True

    return False


def check_url_exists(url, timeout=30, max_retries=3):
    """
    URL 실제 존재 여부 확인

    수정 사항:
    - timeout: 10초 → 30초
    - 재시도: 3회
    """
    if not url or url.strip() == '':
        return False, "EMPTY_URL"

    # SNS는 검증 제외
    if is_sns_url(url):
        return True, "VALID"

    # 가짜 URL 패턴
    if is_fake_url_pattern(url):
        return False, "FAKE_URL"

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    # ⚠️ URL 검증 방식: collect_naver_v40_final.py validate_url()과 동일 (GET stream=True)
    # instructions/2_collect/중복방지전략_공통섹션.md Section 4 참조
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=timeout,
                                    allow_redirects=True, stream=True)
            response.close()
            if response.status_code < 400:
                return True, "VALID"
            else:
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                return False, "INVALID_URL"

        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            return False, "INVALID_URL"
        except requests.exceptions.ConnectionError:
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            return False, "INVALID_URL"
        except Exception:
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            return False, "INVALID_URL"

    return False, "INVALID_URL"


def validate_required_fields(item):
    """필수 필드 검증"""
    required = ['title', 'content', 'source_url']

    for field in required:
        if not item.get(field):
            return False, "MISSING_FIELD"

    return True, "VALID"


def validate_date_range(item):
    """
    기간 제한 검증 (수집일 기준)

    수정 사항:
    - created_at (수집일) 기준으로 계산
    - OFFICIAL: 수집일 - 4년
    - PUBLIC: 수집일 - 2년
    """
    data_type = item.get('data_type', 'public').lower()
    pub_date_str = item.get('published_date')
    created_at_str = item.get('created_at')

    if not pub_date_str or not created_at_str:
        return True, "VALID"  # 날짜 없으면 패스

    try:
        # published_date 파싱
        if isinstance(pub_date_str, str):
            pub_date = datetime.strptime(pub_date_str[:10], '%Y-%m-%d')
        else:
            pub_date = pub_date_str

        # created_at 파싱 (수집일)
        if isinstance(created_at_str, str):
            created_at = datetime.strptime(created_at_str[:10], '%Y-%m-%d')
        else:
            created_at = created_at_str

        # 수집일 기준으로 cutoff 계산
        if data_type == 'official':
            cutoff = created_at - timedelta(days=365*4)  # 4년
        else:
            cutoff = created_at - timedelta(days=365*2)  # 2년

        # published_date가 cutoff보다 이전이면 위반
        if pub_date < cutoff:
            return False, "DATE_OUT_OF_RANGE"

        return True, "VALID"

    except:
        return True, "VALID"  # 파싱 실패면 패스


def check_duplicate(item):
    """중복 검증 (간소화)"""
    politician_id = item.get('politician_id')
    collector_ai = item.get('collector_ai')
    url = item.get('source_url', '')

    if not url:
        return True, "VALID"

    # 같은 AI가 같은 URL 수집했는지만 체크
    try:
        result = supabase.table(TABLE_COLLECTED_DATA)\
            .select('id')\
            .eq('politician_id', politician_id)\
            .eq('collector_ai', collector_ai)\
            .eq('source_url', url)\
            .limit(2)\
            .execute()

        if len(result.data) > 1:
            return False, "DUPLICATE"
    except:
        pass

    return True, "VALID"


# ===== 동명이인 필터링 =====

# Gemini X-rating 분석 기반 동명이인 제외/확인 키워드
NAMESAKE_CONFIG = {
    '정원오': {
        'positive': ['성동구', '구청장', '성수동', '젠트리피케이션', '필수노동자', '마용성',
                      '목민관', '도시재생', '왕십리', '삼표', 'GTX', '임종석', '양천구',
                      '서울시장 후보', '서울시장 출마', '민선 6기', '민선 7기', '민선 8기',
                      '더불어민주당'],
        'negative': ['기재부', '기획재정부', '차관', '예산실장', '성공회대', '직업훈련',
                      '한국기술교육대', '코리아텍', '경기도교육청', '고용노동부',
                      '예산정책처', '조세정책관'],
    },
    '조은희': {
        'positive': ['국회의원', '서초구', '국민의힘', '정무부시장', '서초구청장',
                      '재선', '총선', '기자 출신', '문화관광비서관', '서울시장 후보',
                      '서울시장 출마'],
        'negative': ['셰프', '요리사', '요리', '정신과', '정신건강의학', '인삼카빙',
                      '인삼', '카빙', '명장', '농업기술원', '충북농업', '약사', '약국',
                      '서울디지털대', '동두천', '화가', '캘리그라피', '한의사', '한의원',
                      '미술', '전시회', '충북', '충청북도'],
    },
    '오준환': {
        'positive': ['고양9', '고양 9', '고양시 제9선거구', '국민의힘, 고양',
                      'Cal Poly', '로열 아이멕스', '대통령직인수위원회 자문위원',
                      '고양시관광협의회', 'K-컬처밸리', 'K-아레나',
                      '도심항공교통', 'UAM', '경기도의회 도시환경위원회',
                      '경기도의회 건설교통위원회', '고양갑', '고양시장'],
        'negative': ['하남1', '하남 1', '울산', '남구의회', '대구광역시의회', '대구시의회',
                      '경북대', '한양대 행정', '중앙대 행정', '경기대 행정', '경희대',
                      '국제사이버대', '올클린한데이', '이사청소', '미화원', '기술사',
                      '축구학과', '호남대', '충남향교재단', '국민생활체육회',
                      '국민의당 창당', '용인정', '용인신문', '용인 반도체',
                      '구리시', '송파', '동작구의회', '오세훈과', '단짝', '비서실장',
                      '고양시장 비서', '故 오준환 소령', '경북대학교 대학원',
                      '대구경북연구원', '대구대학교 겸임', '대구문화예술',
                      '대구행정 심포지엄', '대구형 스마트시티',
                      '경기대학교 행정대학원', 'WowColl', '인바이트',
                      '채용정보', '미화원 모집', '감사인의 산업전문성', '학술논문'],
    },
}


def load_namesake_config(politician_name):
    """
    정치인 MD 파일 + NAMESAKE_CONFIG에서 동명이인 필터링 설정 로드

    Returns:
        tuple: (positive_keywords, negative_keywords)
    """
    V40_DIR = SCRIPT_DIR.parent.parent  # scripts/core → V40
    pol_file = V40_DIR / 'instructions' / '1_politicians' / f'{politician_name}.md'

    positive = set()
    negative = set()

    # 1. Hardcoded config 로드
    if politician_name in NAMESAKE_CONFIG:
        positive.update(NAMESAKE_CONFIG[politician_name]['positive'])
        negative.update(NAMESAKE_CONFIG[politician_name]['negative'])

    # 2. MD 파일에서 추가 키워드 추출
    if pol_file.exists():
        with open(pol_file, 'r', encoding='utf-8') as f:
            content = f.read()

        for line in content.split('\n'):
            # 현 직책에서 positive 키워드 추출
            if '현 직책' in line and '|' in line:
                parts = line.split('|')
                if len(parts) >= 3:
                    pos_text = parts[-2].strip().replace('**', '')
                    for term in re.findall(r'[가-힣]+(?:구|시|장|원)', pos_text):
                        if len(term) >= 2:
                            positive.add(term)

            # 소속 정당에서 positive 키워드 추출
            if '소속 정당' in line and '|' in line:
                parts = line.split('|')
                if len(parts) >= 3:
                    party = parts[-2].strip().replace('**', '')
                    if party and len(party) >= 2:
                        positive.add(party)

    return list(positive), list(negative)


def check_namesake(item, positive_kw, negative_kw):
    """
    동명이인 데이터 검증

    Logic:
    - negative 키워드 발견 AND positive 키워드 미발견 → NAMESAKE
    - negative 키워드 발견 AND positive 키워드 발견 → VALID (올바른 정치인)
    - negative 키워드 미발견 → VALID

    Args:
        item: collected data item
        positive_kw: 올바른 정치인 식별 키워드
        negative_kw: 동명이인 식별 키워드

    Returns:
        tuple: (is_valid, code)
    """
    if not negative_kw:
        return True, "VALID"

    title = (item.get('title') or '')
    content = (item.get('content') or '')
    text = f"{title} {content}"

    # negative 키워드 검색
    found_negative = [kw for kw in negative_kw if kw in text]
    if not found_negative:
        return True, "VALID"

    # negative 발견 → positive 확인
    found_positive = [kw for kw in positive_kw if kw in text]
    if found_positive:
        return True, "VALID"  # 올바른 정치인 확인됨

    # negative만 발견, positive 없음 → 동명이인
    return False, "NAMESAKE"


def check_content_relevance(item, politician_name, positive_kw):
    """
    콘텐츠 기반 관련성 필터 (NEW)

    제목/내용에 정치인 이름이나 관련 키워드가 포함되어 있는지 확인
    - 포함되면 유효
    - 포함되지 않으면 무관 데이터로 제외

    Args:
        item: collected data item
        politician_name: 정치인 이름
        positive_kw: 관련 키워드 목록

    Returns:
        tuple: (is_valid, code)
    """
    title = (item.get('title') or '').lower()
    content = (item.get('content') or '').lower()
    text = f"{title} {content}"

    # 정치인 이름 포함 여부
    if politician_name.lower() in text:
        return True, "VALID"

    # 관련 키워드 포함 여부
    for kw in positive_kw:
        if kw.lower() in text:
            return True, "VALID"

    # 어느 것도 포함되지 않음 → 무관 데이터
    return False, "IRRELEVANT_CONTENT"


def validate_item_fixed(item):
    """
    단일 항목 검증 (수정 버전)

    수정 사항:
    1. validate_event_date 제거
    2. URL 검증 완화 (timeout 30초, 3회 재시도)
    3. 기간 검증만 (event_year 무시)
    """
    # 1. 필수 필드
    valid, code = validate_required_fields(item)
    if not valid:
        return False, code

    # 2. URL 존재 (SNS는 제외)
    url = item.get('source_url', '')
    if url and not is_sns_url(url):
        valid, code = check_url_exists(url, timeout=30, max_retries=3)
        if not valid:
            return False, code

    # 3. 기간 검증 (published_date만)
    valid, code = validate_date_range(item)
    if not valid:
        return False, code

    # 4. 중복 검증
    valid, code = check_duplicate(item)
    if not valid:
        return False, code

    return True, "VALID"


def check_sentiment_ratios(valid_items):
    """
    유효 데이터의 sentiment/data_type 비율 검증

    V40 기본방침 섹션 6 규칙:
    - OFFICIAL: negative 10%, positive 10%, free 80%
    - PUBLIC: negative 20%, positive 20%, free 60%

    Returns:
        list: 위반 항목 리스트
    """
    from collections import defaultdict

    # 카테고리 × data_type × sentiment 집계
    dist = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    for item in valid_items:
        cat = (item.get('category') or '').lower()
        dtype = (item.get('data_type') or '').lower()
        sent = (item.get('sentiment') or 'free').lower()
        if cat and dtype:
            dist[cat][dtype][sent] += 1

    violations = []

    print(f"\n{'='*60}")
    print(f"[Sentiment 비율 검증] OFFICIAL 10-10-80 / PUBLIC 20-20-60")
    print(f"{'='*60}")

    for cat in CATEGORIES_ALL:
        cat_kr = CATEGORY_KOREAN.get(cat, cat)
        cat_violations = []

        for dtype, min_neg, min_pos in [
            ('official', MIN_NEGATIVE_PCT_OFFICIAL, MIN_POSITIVE_PCT_OFFICIAL),
            ('public', MIN_NEGATIVE_PCT_PUBLIC, MIN_POSITIVE_PCT_PUBLIC),
        ]:
            counts = dist[cat][dtype]
            total = sum(counts.values())
            if total == 0:
                continue

            neg_count = counts.get('negative', 0)
            pos_count = counts.get('positive', 0)
            neg_pct = neg_count / total * 100
            pos_pct = pos_count / total * 100

            dtype_upper = dtype.upper()

            if neg_pct < min_neg:
                msg = (f"  {cat_kr} {dtype_upper}: negative {neg_count}/{total} "
                       f"({neg_pct:.0f}%) < 최소 {min_neg}%")
                cat_violations.append(msg)
                violations.append(msg.strip())

            if pos_pct < min_pos:
                msg = (f"  {cat_kr} {dtype_upper}: positive {pos_count}/{total} "
                       f"({pos_pct:.0f}%) < 최소 {min_pos}%")
                cat_violations.append(msg)
                violations.append(msg.strip())

        if cat_violations:
            for v in cat_violations:
                print(f"  ⚠️{v}")
        else:
            # 간략 출력
            off_total = sum(dist[cat]['official'].values())
            pub_total = sum(dist[cat]['public'].values())
            if off_total > 0 or pub_total > 0:
                print(f"  ✅ {cat_kr}: OK (OFF {off_total}개, PUB {pub_total}개)")

    if violations:
        print(f"\n  ⚠️ Sentiment 비율 위반: {len(violations)}건")
        print(f"  ⚠️ 재수집으로 부족한 sentiment 보충 필요")
    else:
        print(f"\n  ✅ 모든 카테고리 Sentiment 비율 충족")

    return violations


def validate_collected_data_fixed(politician_id, politician_name, dry_run=True):
    """
    수집 데이터 검증 (수정 버전)

    dry_run=True: 로그만 기록, 삭제 안 함 (기본값)
    dry_run=False: 실제 삭제
    """
    print(f"\n{'='*60}")
    print(f"[검증] {politician_name} ({politician_id})")
    if dry_run:
        print(f"[모드] DRY RUN - 삭제하지 않음, 로그만 기록")
    else:
        print(f"[모드] 실제 삭제 수행")
    print(f"{'='*60}")

    # 데이터 조회 (페이지네이션 - Supabase 1,000행 제한 대응)
    items = []
    offset = 0
    page_size = 1000
    while True:
        result = supabase.table(TABLE_COLLECTED_DATA)\
            .select('*')\
            .eq('politician_id', politician_id)\
            .range(offset, offset + page_size - 1)\
            .execute()
        batch = result.data or []
        items.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    print(f"총 {len(items)}개 항목 검증 시작...")

    # 동명이인 필터링 설정 로드
    positive_kw, negative_kw = load_namesake_config(politician_name)
    namesake_enabled = len(negative_kw) > 0
    if namesake_enabled:
        print(f"  동명이인 필터링 활성화: 제외 키워드 {len(negative_kw)}개, 확인 키워드 {len(positive_kw)}개")

    valid_count = 0
    valid_items = []
    invalid_items = []

    for i, item in enumerate(items):
        valid, code = validate_item_fixed(item)

        # 동명이인 검증 (기본 검증 통과 후)
        if valid and namesake_enabled:
            valid, code = check_namesake(item, positive_kw, negative_kw)

        # 콘텐츠 기반 필터: 정치인 이름/관련 키워드 포함 여부 (NEW)
        if valid:
            valid, code = check_content_relevance(item, politician_name, positive_kw)

        if valid:
            valid_count += 1
            valid_items.append(item)
        else:
            invalid_items.append({
                'id': item.get('id'),
                'title': item.get('title', '')[:50],
                'code': code,
                'collector_ai': item.get('collector_ai'),
                'url': item.get('source_url', '')[:80]
            })

        if (i + 1) % 100 == 0:
            print(f"  진행: {i+1}/{len(items)} ({valid_count}개 유효)")

    invalid_count = len(invalid_items)

    print(f"\n검증 완료:")
    print(f"  [OK] 유효: {valid_count}개 ({valid_count/len(items)*100:.1f}%)")
    print(f"  [INVALID] 무효: {invalid_count}개 ({invalid_count/len(items)*100:.1f}%)")

    # 무효 항목 상세
    if invalid_items:
        print(f"\n무효 항목 상세:")
        code_counts = {}
        for item in invalid_items:
            code = item['code']
            code_counts[code] = code_counts.get(code, 0) + 1

        for code, count in sorted(code_counts.items(), key=lambda x: -x[1]):
            print(f"  - {VALIDATION_CODES.get(code, code)}: {count}개")

    # DRY RUN 모드
    if dry_run:
        print(f"\n💡 DRY RUN 모드: 삭제하지 않음")
        print(f"   실제 삭제하려면 --no-dry-run 옵션 사용")
    else:
        # 실제 삭제
        deleted = 0
        for item in invalid_items:
            try:
                supabase.table(TABLE_COLLECTED_DATA)\
                    .delete()\
                    .eq('id', item['id'])\
                    .execute()
                deleted += 1
            except:
                pass
        print(f"\n🗑️ {deleted}개 무효 항목 삭제")

    # ===== Sentiment/DataType 비율 검증 =====
    sentiment_violations = check_sentiment_ratios(valid_items)

    return {
        'total': len(items),
        'valid': valid_count,
        'invalid': invalid_count,
        'invalid_rate': invalid_count / len(items) * 100 if len(items) > 0 else 0,
        'sentiment_violations': sentiment_violations
    }


def main():
    parser = argparse.ArgumentParser(description='V40 검증 (수정 버전)')
    parser.add_argument('--politician_id', required=True)
    parser.add_argument('--politician_name', required=True)
    parser.add_argument('--no-dry-run', action='store_true', help='실제 삭제 수행 (기본: DRY RUN)')

    args = parser.parse_args()

    dry_run = not args.no_dry_run

    result = validate_collected_data_fixed(
        args.politician_id,
        args.politician_name,
        dry_run=dry_run
    )

    print(f"\n{'='*60}")
    print(f"검증 결과 요약:")
    print(f"  전체: {result['total']}개")
    print(f"  유효: {result['valid']}개")
    print(f"  무효: {result['invalid']}개")
    print(f"  무효율: {result['invalid_rate']:.1f}%")
    sv = result.get('sentiment_violations', [])
    if sv:
        print(f"  Sentiment 비율 위반: {len(sv)}건")
    else:
        print(f"  Sentiment 비율: 모두 충족")
    print(f"{'='*60}")

    # Phase 2 완료 기록 (실제 삭제 모드일 때만)
    if not dry_run:
        try:
            from phase_tracker import mark_phase_done
            details = f"유효 {result['valid']}개, 무효 {result['invalid']}개 삭제"
            if sv:
                details += f", sentiment 위반 {len(sv)}건"
            mark_phase_done(args.politician_id, '2', details, args.politician_name)
            print(f"\n  Phase 2 완료 기록됨")
        except ImportError:
            pass  # phase_tracker 없어도 기존 동작 유지


if __name__ == "__main__":
    main()
