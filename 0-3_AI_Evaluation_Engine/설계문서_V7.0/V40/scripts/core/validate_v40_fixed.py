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
- AI 평가 단계에서 최종 품질 판단 (4개 AI: Claude Haiku 4.5, ChatGPT gpt-5.1-codex-mini, Gemini 2.0 Flash, Grok 2)

사용법:
    python validate_v40_fixed.py --politician_id=62e7b453 --politician_name="오세훈" --no-dry-run
"""

import sys
import io

# UTF-8 출력 설정 (최우선 - 모든 import 전에 실행)
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
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
    "DUPLICATE": "중복 데이터"
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

    # ⚠️ URL 검증 방식: collect_v40.py validate_url()과 동일 (GET stream=True)
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

    # 데이터 조회
    result = supabase.table(TABLE_COLLECTED_DATA)\
        .select('*')\
        .eq('politician_id', politician_id)\
        .execute()

    items = result.data
    print(f"총 {len(items)}개 항목 검증 시작...")

    valid_count = 0
    invalid_items = []

    for i, item in enumerate(items):
        valid, code = validate_item_fixed(item)

        if valid:
            valid_count += 1
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

    return {
        'total': len(items),
        'valid': valid_count,
        'invalid': invalid_count,
        'invalid_rate': invalid_count / len(items) * 100 if len(items) > 0 else 0
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
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
