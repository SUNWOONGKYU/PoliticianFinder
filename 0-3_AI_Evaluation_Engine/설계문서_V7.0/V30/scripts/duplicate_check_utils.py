# -*- coding: utf-8 -*-
"""
V30 중복 검사 유틸리티
URL + 제목 기반 중복 검사 로직
"""
import re
from urllib.parse import urlparse, parse_qs


def normalize_url(url):
    """URL 정규화 (파라미터, 앵커 제거)

    예시:
    - https://namu.wiki/w/김민석?rev=456 → https://namu.wiki/w/김민석
    - https://namu.wiki/w/김민석#s-1 → https://namu.wiki/w/김민석
    - https://news.com/article?id=123&from=search → https://news.com/article?id=123

    Args:
        url: 원본 URL

    Returns:
        정규화된 URL (소문자, 파라미터/앵커 제거)
    """
    if not url or not isinstance(url, str):
        return ''

    url = url.strip().lower()

    if not url:
        return ''

    try:
        parsed = urlparse(url)

        # 기본 URL (scheme + netloc + path)
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

        # 특정 파라미터만 유지 (id, article_id 등 핵심 식별자)
        # 나머지는 제거 (rev, from, utm_source 등)
        if parsed.query:
            params = parse_qs(parsed.query)
            keep_params = {}

            # 유지할 파라미터 키
            preserve_keys = ['id', 'article_id', 'no', 'seq', 'aid']

            for key in preserve_keys:
                if key in params:
                    keep_params[key] = params[key][0]

            # 유지할 파라미터가 있으면 추가
            if keep_params:
                param_str = '&'.join([f"{k}={v}" for k, v in sorted(keep_params.items())])
                normalized = f"{normalized}?{param_str}"

        # 앵커 제거 (fragment는 무시)
        # normalized에는 이미 fragment가 없음

        # 끝의 슬래시 제거
        normalized = normalized.rstrip('/')

        return normalized

    except Exception as e:
        # 파싱 실패 시 원본 반환 (소문자만)
        return url


def normalize_title(title):
    """제목 정규화 (유사 제목 감지용)

    예시:
    - "김민석/비판 및 논란/국무총리 후보자 - 나무위키"
      → "김민석비판및논란국무총리후보자나무위키"
    - "김민석 후보자 의혹 논란..."누구든 불러도 좋다" / YTN"
      → "김민석후보자의혹논란누구든불러도좋다ytn"

    Args:
        title: 원본 제목

    Returns:
        정규화된 제목 (소문자, 공백/특수문자 제거)
    """
    if not title or not isinstance(title, str):
        return ''

    # 소문자 변환
    normalized = title.lower()

    # 공백, 하이픈, 언더스코어, 점, 슬래시, 따옴표 등 제거
    normalized = re.sub(r'[\s\-_\.\/\'\"\,\:\;\!\?\(\)\[\]\{\}]+', '', normalized)

    # 한글, 영문, 숫자만 남기기
    normalized = re.sub(r'[^가-힣a-z0-9]', '', normalized)

    return normalized


def calculate_title_similarity(title1, title2):
    """제목 유사도 계산 (0.0 ~ 1.0)

    간단한 Jaccard 유사도 사용

    Args:
        title1: 첫 번째 제목
        title2: 두 번째 제목

    Returns:
        유사도 (0.0 ~ 1.0)
    """
    if not title1 or not title2:
        return 0.0

    # 정규화
    norm1 = normalize_title(title1)
    norm2 = normalize_title(title2)

    if not norm1 or not norm2:
        return 0.0

    # 완전 일치
    if norm1 == norm2:
        return 1.0

    # 문자 단위 Jaccard 유사도
    set1 = set(norm1)
    set2 = set(norm2)

    intersection = len(set1 & set2)
    union = len(set1 | set2)

    if union == 0:
        return 0.0

    return intersection / union


def is_duplicate_by_url(url1, url2):
    """URL 기반 중복 검사

    Args:
        url1: 첫 번째 URL
        url2: 두 번째 URL

    Returns:
        True: 중복 (같은 페이지)
        False: 다른 페이지
    """
    if not url1 or not url2:
        return False

    norm1 = normalize_url(url1)
    norm2 = normalize_url(url2)

    if not norm1 or not norm2:
        return False

    return norm1 == norm2


def is_duplicate_by_title(title1, title2, threshold=0.95):
    """제목 기반 중복 검사

    Args:
        title1: 첫 번째 제목
        title2: 두 번째 제목
        threshold: 유사도 임계값 (기본 0.95)

    Returns:
        True: 중복 (유사한 제목)
        False: 다른 제목
    """
    similarity = calculate_title_similarity(title1, title2)
    return similarity >= threshold


def is_duplicate(item1, item2, url_weight=0.7, title_weight=0.3):
    """종합 중복 검사

    Args:
        item1: 첫 번째 항목 {'source_url': ..., 'title': ...}
        item2: 두 번째 항목 {'source_url': ..., 'title': ...}
        url_weight: URL 가중치
        title_weight: 제목 가중치

    Returns:
        True: 중복
        False: 다른 항목
    """
    url1 = item1.get('source_url', '')
    url2 = item2.get('source_url', '')
    title1 = item1.get('title', '')
    title2 = item2.get('title', '')

    # URL 중복 검사
    url_duplicate = is_duplicate_by_url(url1, url2)

    # 제목 중복 검사
    title_similarity = calculate_title_similarity(title1, title2)

    # 가중 평균
    # URL 완전 일치 또는 제목 95% 이상 유사 → 중복
    if url_duplicate:
        return True

    if title_similarity >= 0.95:
        return True

    return False


if __name__ == "__main__":
    # 테스트
    print("=" * 60)
    print("URL 정규화 테스트")
    print("=" * 60)

    test_urls = [
        "https://namu.wiki/w/김민석/비판%20및%20논란",
        "https://namu.wiki/w/김민석/비판%20및%20논란?rev=456",
        "https://namu.wiki/w/김민석/비판%20및%20논란#s-1",
        "https://namu.wiki/w/김민석/비판%20및%20논란?from=search",
        "https://news.naver.com/article/001/123456?sid=100&mode=read",
        "https://news.naver.com/article/001/123456",
    ]

    for url in test_urls:
        normalized = normalize_url(url)
        print(f"원본: {url}")
        print(f"정규: {normalized}")
        print()

    print("=" * 60)
    print("제목 정규화 테스트")
    print("=" * 60)

    test_titles = [
        "김민석/비판 및 논란/국무총리 후보자 - 나무위키",
        "김민석 / 비판 및 논란 / 국무총리 후보자 - 나무위키",
        "김민석 후보자 의혹 논란...\"누구든 불러도 좋다\" / YTN",
    ]

    for title in test_titles:
        normalized = normalize_title(title)
        print(f"원본: {title}")
        print(f"정규: {normalized}")
        print()

    print("=" * 60)
    print("중복 검사 테스트")
    print("=" * 60)

    # 같은 페이지, 다른 URL
    url1 = "https://namu.wiki/w/김민석/비판%20및%20논란"
    url2 = "https://namu.wiki/w/김민석/비판%20및%20논란?rev=456"
    print(f"URL1: {url1}")
    print(f"URL2: {url2}")
    print(f"중복 여부: {is_duplicate_by_url(url1, url2)}")
    print()

    # 유사한 제목
    title1 = "김민석/비판 및 논란/국무총리 후보자 - 나무위키"
    title2 = "김민석 / 비판 및 논란 / 국무총리 후보자 - 나무위키"
    print(f"제목1: {title1}")
    print(f"제목2: {title2}")
    print(f"유사도: {calculate_title_similarity(title1, title2):.2f}")
    print(f"중복 여부: {is_duplicate_by_title(title1, title2)}")
    print()
