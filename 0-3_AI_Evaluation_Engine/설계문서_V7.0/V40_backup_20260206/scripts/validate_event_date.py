# -*- coding: utf-8 -*-
"""
V40 사건 발생 시점 검증 모듈

핵심: 기사 작성일이 아닌 "사건 발생 시점" 기준 검증
- 기사 내용에서 연도 추출
- 과거 사건 키워드 탐지
- 기간 외 사건이면 검증 실패

예시:
  published_date: 2025-01-15 (기사 작성일)
  content: "2018년 불법 정치자금..." (사건 발생 시점)
  → 검증 실패! (2018년은 4년 이전)
"""

import re
from datetime import datetime, timedelta

# 과거 사건을 나타내는 키워드
PAST_EVENT_KEYWORDS = [
    '당시', '과거', '재조명', '재점화', '논란 재부상',
    '년 전', '년간', '당시', '그때', '그 당시',
    '이미', '이전', '예전', '오래 전', '과거에',
    '확정', '판결', '유죄', '집행유예'
]

# 현재 연도
CURRENT_YEAR = datetime.now().year

def extract_years_from_content(content):
    """기사 내용에서 연도 추출

    Returns:
        list: 추출된 연도 리스트 (예: [2018, 2019])
    """
    if not content:
        return []

    # YYYY년 형식 (2018년, 2019년 등)
    pattern1 = r'(\d{4})년'
    # YYYY.MM.DD 형식
    pattern2 = r'(\d{4})\.\d{1,2}\.\d{1,2}'
    # YYYY-MM-DD 형식
    pattern3 = r'(\d{4})-\d{1,2}-\d{1,2}'

    years = []

    for pattern in [pattern1, pattern2, pattern3]:
        matches = re.findall(pattern, content)
        for match in matches:
            year = int(match)
            # 1990~2030 범위만 (오탐 방지)
            if 1990 <= year <= 2030:
                years.append(year)

    return list(set(years))  # 중복 제거


def has_past_event_keywords(content):
    """과거 사건 키워드 포함 여부 확인

    Returns:
        bool: True if 과거 키워드 발견
    """
    if not content:
        return False

    content_lower = content.lower()

    for keyword in PAST_EVENT_KEYWORDS:
        if keyword in content_lower:
            return True

    return False


def get_event_year(item):
    """사건 발생 연도 추론

    Returns:
        int or None: 사건 발생 연도, 추론 불가 시 None
    """
    content = item.get('content', '')
    title = item.get('title', '')
    published_date_str = item.get('published_date', '')

    # 1. 제목에서 연도 추출 (우선순위 높음)
    title_years = extract_years_from_content(title)

    # 2. 내용에서 연도 추출
    content_years = extract_years_from_content(content)

    # 3. published_date에서 연도 추출
    published_year = None
    if published_date_str:
        try:
            if isinstance(published_date_str, str):
                published_year = int(published_date_str[:4])
            else:
                published_year = published_date_str.year
        except:
            pass

    # 4. 과거 키워드 확인
    has_past_keyword = has_past_event_keywords(content) or has_past_event_keywords(title)

    # 5. 사건 연도 추론
    all_years = title_years + content_years

    if not all_years:
        # 연도 언급 없음
        if has_past_keyword:
            # 과거 키워드만 있으면 의심스러움 (보수적으로 None 반환)
            return None
        else:
            # 최근 사건으로 간주 (published_year 사용)
            return published_year

    # 연도가 1개만 있고, published_year와 같으면 최근 사건
    if len(all_years) == 1 and all_years[0] == published_year:
        return published_year

    # 연도가 여러 개 있거나, published_year와 다르면
    # 가장 오래된 연도를 사건 발생 시점으로 간주
    oldest_year = min(all_years)

    # 과거 키워드가 있으면 오래된 연도 우선
    if has_past_keyword:
        return oldest_year

    # 과거 키워드 없으면
    # published_year와 2년 이상 차이나면 과거 사건으로 간주
    if published_year and abs(published_year - oldest_year) >= 2:
        return oldest_year

    # 그 외는 최근 사건으로 간주
    return published_year


def validate_event_date(item, verbose=False):
    """사건 발생 시점 기준 검증

    Args:
        item: 검증할 데이터
        verbose: 상세 로그 출력 여부

    Returns:
        tuple: (is_valid, reason, details)
    """
    data_type = item.get('data_type', 'public').lower()

    # 기간 계산 (현재 기준)
    evaluation_date = datetime.now()

    if data_type == 'official':
        # OFFICIAL: 최근 4년
        cutoff_date = evaluation_date - timedelta(days=365*4)
        cutoff_year = cutoff_date.year
    else:
        # PUBLIC: 최근 2년
        cutoff_date = evaluation_date - timedelta(days=365*2)
        cutoff_year = cutoff_date.year

    # 사건 발생 연도 추론
    event_year = get_event_year(item)

    if event_year is None:
        # 추론 불가 (보수적으로 통과)
        if verbose:
            print(f"    ⚠️ 사건 연도 추론 불가 (통과)")
        return True, "VALID", {"event_year": None}

    # 기간 외 사건인지 확인
    if event_year < cutoff_year:
        reason = f"EVENT_OUT_OF_RANGE"
        details = {
            "event_year": event_year,
            "cutoff_year": cutoff_year,
            "data_type": data_type,
            "years_ago": CURRENT_YEAR - event_year
        }

        if verbose:
            print(f"    ❌ 기간 외 사건: {event_year}년 ({details['years_ago']}년 전)")
            print(f"       data_type: {data_type}")
            print(f"       cutoff: {cutoff_year}년 이후만 허용")

        return False, reason, details

    # 검증 통과
    if verbose:
        print(f"    ✅ 기간 내 사건: {event_year}년")

    return True, "VALID", {"event_year": event_year}


def analyze_event_dates(items, verbose=False):
    """여러 데이터의 사건 발생 시점 분석

    Args:
        items: 분석할 데이터 리스트
        verbose: 상세 로그 출력 여부

    Returns:
        dict: 분석 결과
    """
    results = {
        'total': len(items),
        'valid': 0,
        'invalid': 0,
        'unknown': 0,
        'invalid_items': []
    }

    for item in items:
        is_valid, reason, details = validate_event_date(item, verbose=verbose)

        if is_valid:
            if details.get('event_year') is None:
                results['unknown'] += 1
            else:
                results['valid'] += 1
        else:
            results['invalid'] += 1
            results['invalid_items'].append({
                'id': item.get('id'),
                'title': item.get('title', '')[:50],
                'event_year': details.get('event_year'),
                'years_ago': details.get('years_ago')
            })

    return results


# 테스트 코드
if __name__ == '__main__':
    # UTF-8 출력 설정
    import sys
    import io
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    # 테스트 케이스
    test_cases = [
        {
            'title': '김민석 총리 임명',
            'content': '김민석 국무총리가 2025년 7월 임명되었다.',
            'published_date': '2025-07-10',
            'data_type': 'official'
        },
        {
            'title': '[시사쇼] 2억 후원 몰랐다던 김민석',
            'content': '김민석 총리는 과거 SK그룹으로부터 불법 정치자금을 받아 대법원에서 유죄가 확정되었다.',
            'published_date': '2025-01-15',
            'data_type': 'public'
        },
        {
            'title': '김민석 비판 및 논란 - 나무위키',
            'content': '2002년 서울시장 선거 출마 당시 불법 자금 수수 혐의로 징역형의 집행유예 판결을 받았다.',
            'published_date': '2025-01-20',
            'data_type': 'public'
        }
    ]

    print('=' * 60)
    print('사건 발생 시점 검증 테스트')
    print('=' * 60)
    print()

    for i, test_item in enumerate(test_cases, 1):
        print(f'[테스트 {i}]')
        print(f"  제목: {test_item['title']}")
        print(f"  published_date: {test_item['published_date']}")
        print(f"  data_type: {test_item['data_type']}")

        is_valid, reason, details = validate_event_date(test_item, verbose=True)

        print(f"  결과: {'✅ 통과' if is_valid else '❌ 실패'}")
        print()
