# -*- coding: utf-8 -*-
"""
V60 Alpha 데이터 수집 통합 스크립트

6개 Alpha 카테고리의 데이터를 다양한 소스(뉴스/블로그/카페/공공API)로 수집한다.
카테고리별 목표: 100개 기본 + 20개 버퍼 = 120개

사용법:
    # 단일 카테고리
    python collect_alpha.py --politician-id 17270f25 --category opinion

    # 전체 카테고리
    python collect_alpha.py --politician-id 17270f25 --category all

    # 경쟁자 그룹 전체
    python collect_alpha.py --group-name "2026 서울시장" --category all
"""

import os
import sys
import json
import argparse
import requests
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'helpers'))
from common_cci import (
    supabase, ALPHA_CATEGORIES, ALPHA1_CATEGORIES, ALPHA2_CATEGORIES,
    ALPHA_TYPE_MAP, ALPHA_CATEGORY_NAMES,
    TABLE_COLLECTED_ALPHA, TABLE_COMPETITOR_GROUPS,
    BUFFER_TARGET,
    get_politician_info, get_competitor_group, print_status
)


# ═══════════════════════════════════════════
# 공통 유틸리티
# ═══════════════════════════════════════════

def _clean_html(text: str) -> str:
    """HTML 태그 제거"""
    import re
    import html
    text = html.unescape(text)
    return re.sub(r'<[^>]+>', '', text).strip()


def _parse_naver_date(date_str: str) -> str:
    """Naver 날짜 형식 → YYYY-MM-DD"""
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(date_str)
        return dt.strftime('%Y-%m-%d')
    except Exception:
        return datetime.now().strftime('%Y-%m-%d')


def _deduplicate(items: list) -> list:
    """제목+URL 기준 중복 제거"""
    seen = set()
    unique = []
    for item in items:
        key = (item.get('title', ''), item.get('source_url', ''))
        if key not in seen:
            seen.add(key)
            unique.append(item)
    return unique


def _get_naver_creds():
    """Naver API 인증 정보 반환"""
    cid = os.getenv('NAVER_CLIENT_ID')
    csc = os.getenv('NAVER_CLIENT_SECRET')
    if not cid or not csc:
        return None, None
    return cid, csc


def _search_naver(endpoint: str, query: str, display: int = 30,
                  client_id: str = None, client_secret: str = None) -> list:
    """Naver 통합 검색 (news/blog/cafearticle)

    Args:
        endpoint: 'news', 'blog', 'cafearticle'
        query: 검색 키워드
        display: 결과 수 (최대 100)
        client_id: Naver Client ID
        client_secret: Naver Client Secret

    Returns:
        [{title, content, source_url, source_name, data_date}, ...]
    """
    if not client_id:
        return []

    source_names = {
        'news': 'Naver News',
        'blog': 'Naver Blog',
        'cafearticle': 'Naver Cafe',
    }

    try:
        resp = requests.get(
            f'https://openapi.naver.com/v1/search/{endpoint}.json',
            params={'query': query, 'display': min(display, 100), 'sort': 'date'},
            headers={
                'X-Naver-Client-Id': client_id,
                'X-Naver-Client-Secret': client_secret,
            },
            timeout=10,
        )
        if resp.status_code == 200:
            results = []
            for item in resp.json().get('items', []):
                results.append({
                    'title': _clean_html(item.get('title', '')),
                    'content': _clean_html(item.get('description', '')),
                    'source_url': item.get('originallink') or item.get('link', ''),
                    'source_name': source_names.get(endpoint, f'Naver {endpoint}'),
                    'data_date': _parse_naver_date(item.get('pubDate', '')),
                })
            return results
        else:
            print_status(f"Naver {endpoint} API {resp.status_code}: {query}", 'warn')
    except Exception as e:
        print_status(f"Naver {endpoint} API 오류 ({query}): {e}", 'warn')

    return []


def _api_with_key(env_var: str, func, *args, **kwargs) -> list:
    """API 키 있을 때만 실행, 없으면 skip"""
    key = os.getenv(env_var)
    if not key:
        print_status(f"  {env_var} 미설정 — 해당 소스 건너뜀", 'warn')
        return []
    try:
        return func(key, *args, **kwargs)
    except Exception as e:
        print_status(f"  {env_var} API 오류: {e}", 'warn')
        return []


def _search_google_trends(keyword: str, timeframe: str = 'today 3-m') -> list:
    """Google Trends (pytrends, API 키 불필요)"""
    try:
        from pytrends.request import TrendReq
        pytrends = TrendReq(hl='ko', tz=540)
        pytrends.build_payload([keyword], timeframe=timeframe, geo='KR')
        df = pytrends.interest_over_time()
        if df is not None and not df.empty:
            trend_data = df[keyword].to_dict()
            # 날짜별 관심도를 문자열로 변환
            trend_summary = {k.strftime('%Y-%m-%d'): int(v) for k, v in trend_data.items()}
            return [{
                'title': f'{keyword} Google 검색 트렌드 (최근 3개월)',
                'content': json.dumps(trend_summary, ensure_ascii=False)[:500],
                'source_url': f'https://trends.google.com/trends/explore?q={keyword}&geo=KR',
                'source_name': 'Google Trends',
                'data_date': datetime.now().strftime('%Y-%m-%d'),
            }]
    except ImportError:
        print_status("  pytrends 미설치 — Google Trends 건너뜀", 'warn')
    except Exception as e:
        print_status(f"  Google Trends 오류: {e}", 'warn')
    return []


def _make_item(politician_id: str, alpha_type: str, category: str,
               raw: dict, source_type: str = 'PUBLIC', collector: str = 'api_naver',
               raw_data: dict = None) -> dict:
    """수집 아이템 생성 헬퍼"""
    item = {
        'politician_id': politician_id,
        'alpha_type': alpha_type,
        'category': category,
        'title': raw.get('title', ''),
        'content': raw.get('content', ''),
        'source_url': raw.get('source_url', ''),
        'source_name': raw.get('source_name', ''),
        'source_type': source_type,
        'data_date': raw.get('data_date', datetime.now().strftime('%Y-%m-%d')),
        'collector': collector,
    }
    if raw_data:
        item['raw_data'] = raw_data
    return item


# ═══════════════════════════════════════════
# 공공 API 수집 함수
# ═══════════════════════════════════════════

def _fetch_assembly_bills(api_key: str, politician_name: str) -> list:
    """열린국회정보 — 발의 법안 조회"""
    results = []
    try:
        resp = requests.get(
            'https://open.assembly.go.kr/portal/openapi/nwbpacrgavhjryiph',
            params={'KEY': api_key, 'PROPOSER': politician_name, 'Type': 'json', 'pSize': 30},
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            bills = data.get('nwbpacrgavhjryiph', [{}])
            if len(bills) > 1:
                rows = bills[1].get('row', [])
                for bill in rows[:30]:
                    results.append({
                        'title': bill.get('BILL_NAME', ''),
                        'content': f"대표발의: {bill.get('PROPOSER', '')} | 상태: {bill.get('PROC_RESULT', '')}",
                        'source_url': f"https://likms.assembly.go.kr/bill/billDetail.do?billId={bill.get('BILL_ID', '')}",
                        'source_name': '열린국회정보',
                        'data_date': bill.get('PROPOSE_DT', ''),
                    })
    except Exception as e:
        print_status(f"  열린국회정보 API 오류: {e}", 'warn')
    return results


def _fetch_data_go_kr_election(api_key: str, region: str) -> list:
    """공공데이터포털 — 투개표 정보"""
    results = []
    try:
        resp = requests.get(
            'https://apis.data.go.kr/9760000/VoteXmntckInfoInqireService/getXmntckSttusInfoInqire',
            params={
                'serviceKey': api_key,
                'numOfRows': 20,
                'pageNo': 1,
                'resultType': 'json',
                'sgId': '20240410',  # 최근 총선
                'sdName': region,
            },
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            body = data.get('response', {}).get('body', {})
            items = body.get('items', {}).get('item', [])
            if isinstance(items, dict):
                items = [items]
            for item in items[:20]:
                results.append({
                    'title': f"{item.get('sdName', '')} {item.get('wiwName', '')} 투개표 결과",
                    'content': f"투표수: {item.get('tooVoteCnt', '')} | 투표율: {item.get('tooVoteRate', '')}%",
                    'source_url': 'https://www.data.go.kr/data/15000900/openapi.do',
                    'source_name': '공공데이터포털',
                    'data_date': '2024-04-10',
                })
    except Exception as e:
        print_status(f"  공공데이터포털 API 오류: {e}", 'warn')
    return results


def _fetch_openwatch_funding(api_key: str, politician_name: str) -> list:
    """오픈와치 — 정치자금 조회"""
    results = []
    try:
        resp = requests.get(
            'https://api.openwatch.kr/v1/politicalfund/search',
            params={'name': politician_name, 'limit': 20},
            headers={'Authorization': f'Bearer {api_key}'},
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            for item in data.get('data', [])[:20]:
                results.append({
                    'title': f"{politician_name} 정치자금 — {item.get('year', '')}",
                    'content': f"수입: {item.get('income', '')} | 지출: {item.get('expense', '')}",
                    'source_url': 'https://openwatch.kr',
                    'source_name': '오픈와치',
                    'data_date': f"{item.get('year', datetime.now().year)}-01-01",
                })
    except Exception as e:
        print_status(f"  오픈와치 API 오류: {e}", 'warn')
    return results


def _fetch_asset_disclosure(api_key: str, politician_name: str) -> list:
    """관보 공직자 재산공개 API"""
    results = []
    try:
        resp = requests.get(
            'https://apis.data.go.kr/1741000/AssetDscloService/getAssetDscloList',
            params={
                'serviceKey': api_key,
                'numOfRows': 10,
                'pageNo': 1,
                'resultType': 'json',
                'name': politician_name,
            },
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            body = data.get('response', {}).get('body', {})
            items = body.get('items', {}).get('item', [])
            if isinstance(items, dict):
                items = [items]
            for item in items[:10]:
                results.append({
                    'title': f"{politician_name} 재산공개 — {item.get('pblntfYear', '')}",
                    'content': f"총재산: {item.get('totalAsset', '')} | 변동: {item.get('chgAmount', '')}",
                    'source_url': 'https://www.data.go.kr/data/15109164/openapi.do',
                    'source_name': '관보 재산공개',
                    'data_date': f"{item.get('pblntfYear', datetime.now().year)}-03-01",
                })
    except Exception as e:
        print_status(f"  관보 재산공개 API 오류: {e}", 'warn')
    return results


# ═══════════════════════════════════════════
# Alpha 1-1: Opinion (여론동향) 수집
# ═══════════════════════════════════════════

def collect_opinion(politician_id: str, politician_name: str) -> list:
    """여론동향 데이터 수집 — 뉴스 + 블로그 + 카페"""
    items = []
    cid, csc = _get_naver_creds()
    if not cid:
        print_status("NAVER_CLIENT_ID 환경변수 미설정", 'warn')
        return items

    # 뉴스 (display 30 × 4키워드 = 최대 120)
    news_keywords = [
        f'"{politician_name}" 여론조사',
        f'"{politician_name}" 지지율',
        f'"{politician_name}" 선호도',
        f'"{politician_name}" 바람',
    ]
    for kw in news_keywords:
        for raw in _search_naver('news', kw, display=30, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha1', 'opinion', raw,
                                    source_type='PUBLIC', collector='api_naver_news'))

    # 블로그 (display 20 × 2키워드 = 최대 40)
    blog_keywords = [
        f'"{politician_name}" 여론 분석',
        f'"{politician_name}" 선거 전망',
    ]
    for kw in blog_keywords:
        for raw in _search_naver('blog', kw, display=20, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha1', 'opinion', raw,
                                    source_type='PUBLIC', collector='api_naver_blog'))

    # 카페 (display 15 × 2키워드 = 최대 30)
    cafe_keywords = [
        f'"{politician_name}" 지지율 토론',
        f'"{politician_name}" 여론조사 결과',
    ]
    for kw in cafe_keywords:
        for raw in _search_naver('cafearticle', kw, display=15, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha1', 'opinion', raw,
                                    source_type='PUBLIC', collector='api_naver_cafe'))

    return _deduplicate(items)


# ═══════════════════════════════════════════
# Alpha 1-2: Media (이미지·내러티브) 수집
# ═══════════════════════════════════════════

def collect_media(politician_id: str, politician_name: str) -> list:
    """이미지·내러티브 데이터 수집 — 뉴스 + 블로그 + DataLab + Google Trends"""
    items = []
    cid, csc = _get_naver_creds()
    if not cid:
        print_status("NAVER_CLIENT_ID 환경변수 미설정", 'warn')
        return items

    # 뉴스 (display 25 × 4키워드 = 최대 100)
    news_keywords = [
        f'"{politician_name}" 이미지',
        f'"{politician_name}" 평가',
        f'"{politician_name}" 반응',
        f'"{politician_name}" SNS',
    ]
    for kw in news_keywords:
        for raw in _search_naver('news', kw, display=25, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha1', 'media', raw,
                                    source_type='PUBLIC', collector='api_naver_news'))

    # 블로그 (display 20 × 2키워드 = 최대 40)
    blog_keywords = [
        f'"{politician_name}" 이미지 분석',
        f'"{politician_name}" 평판',
    ]
    for kw in blog_keywords:
        for raw in _search_naver('blog', kw, display=20, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha1', 'media', raw,
                                    source_type='PUBLIC', collector='api_naver_blog'))

    # 네이버 데이터랩 검색 트렌드
    try:
        datalab_resp = requests.post(
            'https://openapi.naver.com/v1/datalab/search',
            json={
                'startDate': (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d'),
                'endDate': datetime.now().strftime('%Y-%m-%d'),
                'timeUnit': 'week',
                'keywordGroups': [{'groupName': politician_name, 'keywords': [politician_name]}],
            },
            headers={
                'X-Naver-Client-Id': cid,
                'X-Naver-Client-Secret': csc,
                'Content-Type': 'application/json',
            },
            timeout=10,
        )
        if datalab_resp.status_code == 200:
            trend_data = datalab_resp.json()
            items.append(_make_item(
                politician_id, 'alpha1', 'media',
                {
                    'title': f'{politician_name} 검색 트렌드 (최근 90일)',
                    'content': json.dumps(trend_data.get('results', []), ensure_ascii=False)[:500],
                    'source_url': 'https://datalab.naver.com/',
                    'source_name': 'Naver DataLab',
                    'data_date': datetime.now().strftime('%Y-%m-%d'),
                },
                source_type='API', collector='api_naver_datalab',
                raw_data=trend_data,
            ))
    except Exception as e:
        print_status(f"  DataLab API 오류: {e}", 'warn')

    # Google Trends (pytrends, API 키 불필요)
    for raw in _search_google_trends(politician_name):
        items.append(_make_item(politician_id, 'alpha1', 'media', raw,
                                source_type='API', collector='api_google_trends'))

    return _deduplicate(items)


# ═══════════════════════════════════════════
# Alpha 1-3: Risk (리스크) 수집
# ═══════════════════════════════════════════

def collect_risk(politician_id: str, politician_name: str) -> list:
    """리스크 데이터 수집 — 부정 키워드 뉴스 + 블로그 + 카페 + 재산공개"""
    items = []
    cid, csc = _get_naver_creds()
    if not cid:
        return items

    neg_keywords = [
        f'"{politician_name}" 논란',
        f'"{politician_name}" 의혹',
        f'"{politician_name}" 수사',
        f'"{politician_name}" 비리',
        f'"{politician_name}" 비판',
        f'"{politician_name}" 재산',
    ]

    # 뉴스 (display 15 × 6키워드 = 최대 90)
    for kw in neg_keywords:
        for raw in _search_naver('news', kw, display=15, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha1', 'risk', raw,
                                    source_type='PUBLIC', collector='api_naver_news'))

    # 블로그 (display 10 × 4키워드 = 최대 40)
    blog_neg_keywords = [
        f'"{politician_name}" 논란 정리',
        f'"{politician_name}" 의혹 분석',
        f'"{politician_name}" 비판',
        f'"{politician_name}" 재산 변동',
    ]
    for kw in blog_neg_keywords:
        for raw in _search_naver('blog', kw, display=10, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha1', 'risk', raw,
                                    source_type='PUBLIC', collector='api_naver_blog'))

    # 카페 (display 10 × 2키워드 = 최대 20)
    cafe_neg_keywords = [
        f'"{politician_name}" 논란',
        f'"{politician_name}" 비리 의혹',
    ]
    for kw in cafe_neg_keywords:
        for raw in _search_naver('cafearticle', kw, display=10, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha1', 'risk', raw,
                                    source_type='PUBLIC', collector='api_naver_cafe'))

    # 관보 재산공개 API (DATA_GO_KR_API_KEY 있을 때)
    for raw in _api_with_key('DATA_GO_KR_API_KEY', _fetch_asset_disclosure, politician_name):
        items.append(_make_item(politician_id, 'alpha1', 'risk', raw,
                                source_type='OFFICIAL', collector='api_data_go_kr'))

    return _deduplicate(items)


# ═══════════════════════════════════════════
# Alpha 2-1: Party (정당경쟁력) 수집
# ═══════════════════════════════════════════

def collect_party(politician_id: str, politician_name: str) -> list:
    """정당경쟁력 데이터 수집 — 정당 지지율 뉴스 + 블로그 + 투개표 API"""
    items = []
    info = get_politician_info(politician_id)
    party = info.get('party', '') if info else ''
    region = info.get('region', '') if info else ''

    cid, csc = _get_naver_creds()
    if not cid:
        return items

    # 뉴스 (display 25 × 4키워드 = 최대 100)
    keywords = [
        f'"{party}" 지지율',
        f'"{party}" 정당 지지',
        f'"{region}" 정당 선거',
        f'"{politician_name}" 공천',
    ]
    for kw in keywords:
        for raw in _search_naver('news', kw, display=25, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha2', 'party', raw,
                                    source_type='PUBLIC', collector='api_naver_news'))

    # 블로그 (display 15 × 2키워드 = 최대 30)
    blog_keywords = [
        f'"{party}" 정당 분석',
        f'"{party}" 선거 전망',
    ]
    for kw in blog_keywords:
        for raw in _search_naver('blog', kw, display=15, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha2', 'party', raw,
                                    source_type='PUBLIC', collector='api_naver_blog'))

    # 공공데이터포털 투개표 API (DATA_GO_KR_API_KEY 있을 때)
    if region:
        for raw in _api_with_key('DATA_GO_KR_API_KEY', _fetch_data_go_kr_election, region):
            items.append(_make_item(politician_id, 'alpha2', 'party', raw,
                                    source_type='OFFICIAL', collector='api_data_go_kr'))

    return _deduplicate(items)


# ═══════════════════════════════════════════
# Alpha 2-2: Candidate (후보자경쟁력) 수집
# ═══════════════════════════════════════════

def collect_candidate(politician_id: str, politician_name: str) -> list:
    """후보자경쟁력 데이터 수집 — 의정활동 뉴스 + 블로그 + 열린국회"""
    items = []
    cid, csc = _get_naver_creds()
    if not cid:
        return items

    # 뉴스 (display 20 × 5키워드 = 최대 100)
    keywords = [
        f'"{politician_name}" 의정활동',
        f'"{politician_name}" 법안',
        f'"{politician_name}" 현직',
        f'"{politician_name}" 인지도',
        f'"{politician_name}" 출마',
    ]
    for kw in keywords:
        for raw in _search_naver('news', kw, display=20, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha2', 'candidate', raw,
                                    source_type='PUBLIC', collector='api_naver_news'))

    # 블로그 (display 15 × 2키워드 = 최대 30)
    blog_keywords = [
        f'"{politician_name}" 의정활동 평가',
        f'"{politician_name}" 후보 분석',
    ]
    for kw in blog_keywords:
        for raw in _search_naver('blog', kw, display=15, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha2', 'candidate', raw,
                                    source_type='PUBLIC', collector='api_naver_blog'))

    # 열린국회정보 API (ASSEMBLY_API_KEY 있을 때)
    for raw in _api_with_key('ASSEMBLY_API_KEY', _fetch_assembly_bills, politician_name):
        items.append(_make_item(politician_id, 'alpha2', 'candidate', raw,
                                source_type='OFFICIAL', collector='api_assembly'))

    return _deduplicate(items)


# ═══════════════════════════════════════════
# Alpha 2-3: Regional (지역기반) 수집
# ═══════════════════════════════════════════

def collect_regional(politician_id: str, politician_name: str) -> list:
    """지역기반 데이터 수집 — 지역 활동 뉴스 + 블로그 + 오픈와치"""
    items = []
    info = get_politician_info(politician_id)
    region = info.get('region', '') if info else ''
    district = info.get('district', '') if info else ''

    cid, csc = _get_naver_creds()
    if not cid:
        return items

    area = district or region

    # 뉴스 (display 25 × 4키워드 = 최대 100)
    keywords = [
        f'"{politician_name}" "{area}"',
        f'"{politician_name}" 지역구',
        f'"{politician_name}" 후원금',
        f'"{politician_name}" 지지선언',
    ]
    for kw in keywords:
        for raw in _search_naver('news', kw, display=25, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha2', 'regional', raw,
                                    source_type='PUBLIC', collector='api_naver_news'))

    # 블로그 (display 15 × 2키워드 = 최대 30)
    blog_keywords = [
        f'"{politician_name}" 지역 활동',
        f'"{politician_name}" {area} 사업',
    ]
    for kw in blog_keywords:
        for raw in _search_naver('blog', kw, display=15, client_id=cid, client_secret=csc):
            items.append(_make_item(politician_id, 'alpha2', 'regional', raw,
                                    source_type='PUBLIC', collector='api_naver_blog'))

    # 오픈와치 API (OPENWATCH_API_KEY 있을 때)
    for raw in _api_with_key('OPENWATCH_API_KEY', _fetch_openwatch_funding, politician_name):
        items.append(_make_item(politician_id, 'alpha2', 'regional', raw,
                                source_type='OFFICIAL', collector='api_openwatch'))

    return _deduplicate(items)


# ═══════════════════════════════════════════
# 메인 로직
# ═══════════════════════════════════════════

COLLECTORS = {
    'opinion': collect_opinion,
    'media': collect_media,
    'risk': collect_risk,
    'party': collect_party,
    'candidate': collect_candidate,
    'regional': collect_regional,
}


def save_to_db(items: list) -> int:
    """수집 데이터를 Supabase에 저장"""
    if not items:
        return 0

    saved = 0
    batch_size = 50

    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        clean_batch = []
        for item in batch:
            row = {k: v for k, v in item.items() if k != 'raw_data'}
            if 'raw_data' in item and item['raw_data']:
                row['raw_data'] = json.dumps(item['raw_data'], ensure_ascii=False)
            clean_batch.append(row)

        try:
            result = supabase.table(TABLE_COLLECTED_ALPHA).insert(clean_batch).execute()
            saved += len(result.data) if result.data else 0
        except Exception as e:
            print_status(f"DB 저장 오류: {e}", 'error')

    return saved


def collect_for_politician(politician_id: str, categories: list):
    """특정 정치인의 Alpha 데이터 수집"""
    info = get_politician_info(politician_id)
    if not info:
        print_status(f"정치인 {politician_id}를 찾을 수 없습니다.", 'error')
        return

    name = info['name']
    print(f"\n{'═'*60}")
    print(f"🔮 Alpha 수집: {name} ({politician_id})")
    print(f"   목표: {BUFFER_TARGET}개/카테고리 (기본100 + 버퍼20)")
    print(f"{'═'*60}")

    total_saved = 0
    source_stats = {}

    for cat in categories:
        collector = COLLECTORS.get(cat)
        if not collector:
            print_status(f"알 수 없는 카테고리: {cat}", 'error')
            continue

        print_status(f"[{cat}] ({ALPHA_CATEGORY_NAMES[cat]}) 수집 중...", 'progress')
        items = collector(politician_id, name)

        if items:
            # 소스별 통계
            cat_sources = {}
            for item in items:
                src = item.get('collector', 'unknown')
                cat_sources[src] = cat_sources.get(src, 0) + 1
            source_stats[cat] = cat_sources

            saved = save_to_db(items)
            total_saved += saved

            # 소스별 내역 출력
            src_detail = ', '.join(f"{k}:{v}" for k, v in cat_sources.items())
            status = '✅' if len(items) >= BUFFER_TARGET else '⚠️' if len(items) >= 50 else '❌'
            print_status(f"[{cat}] {status} {len(items)}개 수집 → {saved}개 저장 ({src_detail})", 'ok')
        else:
            print_status(f"[{cat}] ❌ 수집 데이터 없음", 'warn')

    print(f"\n{'─'*60}")
    print(f"📊 수집 완료: 총 {total_saved}개 저장")
    print(f"{'─'*60}")

    # 소스 다양성 요약
    all_sources = set()
    for cat_src in source_stats.values():
        all_sources.update(cat_src.keys())
    print(f"   사용된 소스: {', '.join(sorted(all_sources))}")
    print(f"{'─'*60}")


def main():
    parser = argparse.ArgumentParser(description='V60 Alpha 데이터 수집')
    parser.add_argument('--politician-id', type=str, help='정치인 ID')
    parser.add_argument('--category', type=str, default='all',
                        help='카테고리 (opinion/media/risk/party/candidate/regional/all)')
    parser.add_argument('--group-name', type=str, help='그룹 전체 수집')
    args = parser.parse_args()

    categories = ALPHA_CATEGORIES if args.category == 'all' else [args.category]

    if args.group_name:
        result = supabase.table(TABLE_COMPETITOR_GROUPS).select('*').eq(
            'group_name', args.group_name
        ).execute()
        if not result.data:
            print_status(f"'{args.group_name}' 그룹을 찾을 수 없습니다.", 'error')
            return
        for pid in result.data[0].get('politician_ids', []):
            collect_for_politician(pid, categories)
    elif args.politician_id:
        collect_for_politician(args.politician_id, categories)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
