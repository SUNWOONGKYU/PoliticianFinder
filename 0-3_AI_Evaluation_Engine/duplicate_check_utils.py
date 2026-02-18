import re
from urllib.parse import urlparse, parse_qs, urlunparse
import difflib

def normalize_url(url):
    """
    URL에서 프로토콜, 쿼리 파라미터, 프래그먼트를 제거하고 정규화합니다.
    """
    if not isinstance(url, str):
        return url
    parsed = urlparse(url)
    # 스킴(http/https), 쿼리, 프래그먼트 제거
    normalized = urlunparse(parsed._replace(scheme="", query="", fragment=""))
    # www. 제거 (선택 사항, 필요에 따라 조정)
    normalized = normalized.replace("www.", "")
    # 마지막 슬래시 제거 (선택 사항, 필요에 따라 조정)
    if normalized.endswith('/'):
        normalized = normalized[:-1]
    return normalized.lower()

def normalize_title(title):
    """
    제목에서 특수문자, 공백을 제거하고 소문자로 변환하여 정규화합니다.
    """
    if not isinstance(title, str):
        return title
    # 숫자, 한글, 영문만 남기고 모두 제거
    title = re.sub(r'[^가-힣a-zA-Z0-9\s]', '', title)
    return title.strip().lower()

def is_duplicate_by_url(url1, url2):
    """
    두 URL이 정규화 후 동일한지 확인합니다.
    """
    return normalize_url(url1) == normalize_url(url2)

def is_duplicate_by_title(title1, title2, threshold=0.8):
    """
    두 제목의 유사도를 비교하여 중복 여부를 판단합니다.
    (간단한 유사도 비교, 필요시 더 정교한 알고리즘 사용 가능)
    """
    normalized_title1 = normalize_title(title1)
    normalized_title2 = normalize_title(title2)

    if not normalized_title1 or not normalized_title2:
        return False # 빈 제목은 비교하지 않음

    # SequenceMatcher를 이용한 유사도 비교
    s = difflib.SequenceMatcher(None, normalized_title1, normalized_title2)
    return s.ratio() >= threshold
