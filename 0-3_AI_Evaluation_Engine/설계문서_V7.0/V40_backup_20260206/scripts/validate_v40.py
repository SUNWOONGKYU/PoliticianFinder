# -*- coding: utf-8 -*-
"""
V40 검증 스크립트 (수정 버전)

핵심 변경사항:
1. validate_event_date 제거 (과거 연도 언급 오판 문제)
2. URL 검증 개선 (timeout 30초, 3회 재시도, 에러 세분화)
3. published_date만으로 기간 검증 (간단, 95% 정확)
4. 가짜 URL 패턴 체크
5. 중복 데이터 제거 (같은 AI + 같은 URL)

검증 원칙:
- 최소 검증 (명백한 불량만 제거)
- AI 평가 단계에서 최종 품질 판단
- 오판 최소화

프로세스:
[1] 검증 (validate): 수집된 데이터 유효성 검사
    - 중복 발견 시 자동 삭제 (evaluations 포함)
[2] 재수집 (recollect): 검증 실패분 해당 AI로 재수집
[3] 재검증: 재수집 데이터 다시 검증

사용법:
    # 전체 검증 + 재수집
    python validate_v40.py --politician_id=62e7b453 --politician_name="오세훈" --mode=all

    # 검증만
    python validate_v40.py --politician_id=62e7b453 --politician_name="오세훈" --mode=validate

    # 재수집만
    python validate_v40.py --politician_id=62e7b453 --politician_name="오세훈" --mode=recollect

    # 특정 AI만
    python validate_v40.py --politician_id=62e7b453 --politician_name="오세훈" --ai=Gemini
"""

import os
import sys
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
from duplicate_check_utils import normalize_url, normalize_title, is_duplicate_by_url, is_duplicate_by_title
# validate_event_date 제거 (과거 연도 언급 오판 문제)

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        # 이미 설정되어 있거나 buffer가 없는 경우 무시
        pass

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V40 테이블명
TABLE_COLLECTED_DATA = "collected_data_v40"
TABLE_EVALUATIONS = "evaluations_v40"

# 공식 데이터 도메인 (OFFICIAL로 인정되는 도메인)
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

# SNS 도메인 (URL 검증 제외)
SNS_DOMAINS = [
    "twitter.com",
    "x.com",
    "facebook.com",
    "instagram.com",
    "youtube.com",
    "youtu.be",
    "tiktok.com"
]

# 카테고리 정의
CATEGORIES = [
    ("expertise", "전문성"),
    ("leadership", "리더십"),
    ("vision", "비전"),
    ("integrity", "청렴성"),
    ("ethics", "윤리성"),
    ("accountability", "책임감"),
    ("transparency", "투명성"),
    ("communication", "소통능력"),
    ("responsiveness", "대응성"),
    ("publicinterest", "공익성")
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


def get_date_range():
    """V40 기간 제한 계산"""
    evaluation_date = datetime.now()
    official_start = evaluation_date - timedelta(days=365*4)  # 4년
    public_start = evaluation_date - timedelta(days=365*2)    # 2년

    return {
        'official_start': official_start,
        'official_end': evaluation_date,
        'public_start': public_start,
        'public_end': evaluation_date,
    }


def is_sns_url(url):
    """SNS URL 여부 확인"""
    if not url:
        return False
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower().replace('www.', '')
        return any(sns in domain for sns in SNS_DOMAINS)
    except:
        return False


def is_official_domain(url):
    """공식 도메인 여부 확인"""
    if not url:
        return False
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower().replace('www.', '')
        return any(official in domain for official in OFFICIAL_DOMAINS)
    except:
        return False


def is_fake_url_pattern(url):
    """가짜 URL 패턴 감지"""
    if not url:
        return True

    fake_patterns = [
        r'example\.com',
        r'test\.com',
        r'localhost',
        r'^https?://\d+\.\d+\.\d+\.\d+',  # IP 주소 URL
        r'dummy',              # dummy URL
    ]

    for pattern in fake_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            return True

    return False


def check_url_exists(url, timeout=30, max_retries=3):
    """
    URL 실제 존재 여부 확인 (개선 버전)

    변경사항:
    - timeout: 10초 → 30초 (정부 사이트 대응)
    - 재시도: 3회 (네트워크 불안정 대응)
    - 에러 세분화: 403/401은 접근 제한이지 불량 아님
    """
    if not url or url.strip() == '':
        return False, "EMPTY_URL"

    # SNS는 검증 제외 (접근 제한 있음)
    if is_sns_url(url):
        return True, "VALID"

    # 가짜 URL 패턴 체크
    if is_fake_url_pattern(url):
        return False, "FAKE_URL"

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    # 재시도 로직
    for attempt in range(max_retries):
        try:
            # HEAD 요청 먼저 시도
            try:
                response = requests.head(url, headers=headers, timeout=timeout, allow_redirects=True)

                # 403/401은 접근 제한이지 URL 불량 아님
                if response.status_code in [401, 403]:
                    return True, "VALID"

                if response.status_code < 400:
                    return True, "VALID"
            except:
                pass

            # GET 시도
            response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)

            # 403/401은 접근 제한
            if response.status_code in [401, 403]:
                return True, "VALID"

            if response.status_code < 400:
                return True, "VALID"

            # 404는 재시도 불필요
            if response.status_code == 404:
                return False, "NOT_FOUND"

            # 5xx는 재시도
            if 500 <= response.status_code < 600:
                if attempt < max_retries - 1:
                    time.sleep(2)  # 2초 대기 후 재시도
                    continue
                return False, "SERVER_ERROR"

            return False, "INVALID_URL"

        except requests.exceptions.Timeout:
            # timeout은 재시도
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            return False, "TIMEOUT"

        except requests.exceptions.ConnectionError:
            # 연결 에러도 재시도
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            return False, "CONNECTION_ERROR"

        except Exception as e:
            # 기타 에러
            if attempt < max_retries - 1:
                time.sleep(1)
                continue
            return False, "INVALID_URL"

    return False, "MAX_RETRIES"


def validate_source_type(item):
    """source_type 규칙 검증

    V40 변경: 도메인 기반 검증 제거
    - V40에서 OFFICIAL/PUBLIC은 '데이터 성격'이지 '도메인'이 아님
    - OFFICIAL = 공식 활동 관련 데이터 (뉴스에서 보도해도 OFFICIAL)
    - PUBLIC = 여론/평판 관련 데이터
    - 수집 프롬프트가 소스 유형을 제어하므로 도메인 검증 불필요
    """
    return True, "VALID"


def validate_required_fields(item):
    """필수 필드 검증"""
    required = ['title', 'content', 'source_url']

    for field in required:
        value = item.get(field, '')
        if not value or str(value).strip() == '':
            # source_url이 비어있어도 예외 허용
            return False, "MISSING_FIELD"

    return True, "VALID"


def validate_date_range(item):
    """기간 제한 검증"""
    date_range = get_date_range()
    data_type = item.get('data_type', 'public').lower()
    pub_date_str = item.get('published_date')

    if not pub_date_str:
        return True, "VALID"  # 날짜 없으면 패스

    try:
        if isinstance(pub_date_str, str):
            pub_date = datetime.strptime(pub_date_str[:10], '%Y-%m-%d')
        else:
            pub_date = pub_date_str

        if data_type == 'official':
            if pub_date < date_range['official_start']:
                return False, "DATE_OUT_OF_RANGE"
        else:
            if pub_date < date_range['public_start']:
                return False, "DATE_OUT_OF_RANGE"

        return True, "VALID"

    except:
        return True, "VALID"  # 파싱 실패면 패스


def check_duplicate(item):
    """중복 데이터 검증 (URL + 제목 기반)

    규칙: 같은 AI가 같은 URL 또는 유사한 제목을 이미 수집했는지 확인
    - 같은 politician_id + 같은 collector_ai + (같은 URL OR 유사한 제목) = 중복
    - 다른 AI가 같은 URL/제목 수집 = 중복 아님 (자연 가중치)
    """
    politician_id = item.get('politician_id')
    collector_ai = item.get('collector_ai')
    source_url = item.get('source_url', '')
    title = item.get('title', '')
    item_id = item.get('id')  # 자기 자신 제외용

    # URL 정규화 (파라미터, 앵커 제거)
    source_url_normalized = normalize_url(source_url) if source_url else ''

    # 제목 정규화
    title_normalized = normalize_title(title) if title else ''

    if not source_url_normalized and not title_normalized:
        # URL도 제목도 없으면 중복 체크 불가능
        return True, "VALID"

    try:
        # 같은 정치인, 같은 AI가 수집한 데이터 조회
        query = supabase.table(TABLE_COLLECTED_DATA)\
            .select('id, source_url, title')\
            .eq('politician_id', politician_id)\
            .eq('collector_ai', collector_ai)

        # 자기 자신 제외
        if item_id:
            query = query.neq('id', item_id)

        existing = query.execute()

        if existing.data:
            for existing_item in existing.data:
                # URL 중복 체크
                if source_url_normalized:
                    if is_duplicate_by_url(source_url, existing_item.get('source_url', '')):
                        return False, "DUPLICATE"

                # 제목 중복 체크 (95% 유사도)
                if title_normalized:
                    if is_duplicate_by_title(title, existing_item.get('title', ''), threshold=0.95):
                        return False, "DUPLICATE"

        return True, "VALID"
    except Exception as e:
        print(f"  중복 체크 오류: {e}")
        return True, "VALID"  # 오류 시 패스


def validate_item(item):
    """단일 항목 종합 검증"""
    results = []

    # 1. 필수 필드 검증
    valid, code = validate_required_fields(item)
    if not valid:
        return False, code

    # 2. URL 존재 검증
    url = item.get('source_url', '')
    collector_ai = item.get('collector_ai', '').lower()

    # V40 규정: Grok의 X/트위터 데이터는 URL 필요 없음
    if collector_ai == 'grok':
        # X/트위터는 URL 없음 또는 "X/@계정명" 형식 허용
        if not url or url.startswith('X/@') or url.startswith('x.com') or url.startswith('twitter.com'):
            pass  # 유효 - URL 검증 건너뛰기
        elif url and not is_sns_url(url):
            valid, code = check_url_exists(url)
            if not valid:
                return False, code
    else:
        # Gemini는 정상 URL 검증 (Perplexity는 별도 처리)
        if url and not is_sns_url(url):
            valid, code = check_url_exists(url)
            if not valid:
                return False, code

    # 3. source_type 검증
    valid, code = validate_source_type(item)
    if not valid:
        return False, code

    # 4. 기간 검증 (published_date 기준)
    valid, code = validate_date_range(item)
    if not valid:
        return False, code

    # 5. validate_event_date 제거!
    # 이유: 과거 연도 언급을 사건 발생으로 오판 (정확도 30%)
    # 대안: published_date만 사용 (정확도 95%)
    #       + AI 평가 단계에서 맥락 이해 및 점수 부여

    # 6. 중복 검증
    valid, code = check_duplicate(item)
    if not valid:
        return False, code

    return True, "VALID"


def get_collected_data(politician_id, ai_name=None, category=None):
    """수집된 데이터 조회 (페이지네이션 적용, 1000개 limit 회피)"""
    try:
        all_data = []
        offset = 0
        page_size = 1000

        while True:
            query = supabase.table(TABLE_COLLECTED_DATA)\
                .select('*')\
                .eq('politician_id', politician_id)

            if ai_name:
                query = query.eq('collector_ai', ai_name.lower())

            if category:
                query = query.eq('category', category.lower())

            result = query.range(offset, offset + page_size - 1).execute()
            if result.data:
                all_data.extend(result.data)
            if not result.data or len(result.data) < page_size:
                break
            offset += page_size

        return all_data

    except Exception as e:
        print(f"  ⚠️ 데이터 조회 실패: {e}")
        return []


def validate_collected_data(politician_id, politician_name, ai_name=None, category=None):
    """수집된 데이터 검증"""
    print(f"\n{'='*60}")
    print(f"[검증] {politician_name} ({politician_id})")
    print(f"{'='*60}")

    items = get_collected_data(politician_id, ai_name, category)
    print(f"총 {len(items)}개 항목 검증 시작...")

    valid_count = 0
    invalid_items = []
    duplicate_removed = 0  # 중복 제거 카운트

    for i, item in enumerate(items):
        item_id = item.get('id')
        title = item.get('title', '')[:30]

        valid, code = validate_item(item)

        if valid:
            valid_count += 1
            # is_verified = True로 업데이트
            try:
                supabase.table(TABLE_COLLECTED_DATA)\
                    .update({'is_verified': True})\
                    .eq('id', item_id)\
                    .execute()
            except:
                pass
        else:
            # ✅ V40 중복 자동 제거: DUPLICATE인 경우 즉시 삭제
            if code == "DUPLICATE":
                try:
                    # collected_data 삭제 (evaluations_v40에 collected_data_id 없음)
                    supabase.table(TABLE_COLLECTED_DATA)\
                        .delete()\
                        .eq('id', item_id)\
                        .execute()

                    duplicate_removed += 1

                    # 로그 (10개마다 또는 마지막)
                    if duplicate_removed % 10 == 0 or (i + 1) == len(items):
                        print(f"  중복 제거 진행: {duplicate_removed}개")
                except Exception as e:
                    print(f"  ⚠️ 중복 제거 실패 ({item_id[:8]}...): {e}")
            else:
                # 다른 오류는 재수집 대상으로 추가
                invalid_items.append({
                    'id': item_id,
                    'title': title,
                    'code': code,
                    'reason': VALIDATION_CODES.get(code, code),
                    'collector_ai': item.get('collector_ai'),
                    'category': item.get('category'),
                    'data_type': item.get('data_type'),
                    'source_url': item.get('source_url', '')[:50]
                })

        # 진행률 표시
        if (i + 1) % 100 == 0:
            print(f"  진행: {i+1}/{len(items)} ({valid_count}개 유효)")

    invalid_count = len(invalid_items)
    print(f"\n검증 완료:")
    print(f"  ✅ 유효: {valid_count}개")
    print(f"  🗑️ 중복 제거: {duplicate_removed}개")
    print(f"  ❌ 무효 (재수집 필요): {invalid_count}개")

    # 무효 항목 상세
    if invalid_items:
        print(f"\n무효 항목 상세:")
        # 코드별 집계
        code_counts = {}
        for item in invalid_items:
            code = item['code']
            code_counts[code] = code_counts.get(code, 0) + 1

        for code, count in sorted(code_counts.items(), key=lambda x: -x[1]):
            print(f"  - {VALIDATION_CODES.get(code, code)}: {count}개")

        # AI별 집계
        print(f"\nAI별 무효 항목:")
        ai_counts = {}
        for item in invalid_items:
            ai = item.get('collector_ai', 'unknown')
            ai_counts[ai] = ai_counts.get(ai, 0) + 1

        for ai, count in sorted(ai_counts.items(), key=lambda x: -x[1]):
            print(f"  - {ai}: {count}개")

    return {
        'total': len(items),
        'valid': valid_count,
        'invalid': invalid_count,
        'invalid_items': invalid_items
    }


def delete_invalid_items(invalid_items):
    """무효 항목 삭제"""
    if not invalid_items:
        return 0

    deleted = 0
    for item in invalid_items:
        try:
            supabase.table(TABLE_COLLECTED_DATA)\
                .delete()\
                .eq('id', item['id'])\
                .execute()
            deleted += 1
        except Exception as e:
            print(f"  ⚠️ 삭제 실패 ({item['id']}): {e}")

    print(f"  🗑️ {deleted}개 무효 항목 삭제")
    return deleted


def recollect_for_ai(ai_name, politician_id, politician_name, category, count, data_type):
    """특정 AI로 재수집"""
    print(f"  [{ai_name}] {category} {data_type} {count}개 재수집 중...")

    # collect_v40의 함수 임포트
    try:
        from collect_v40 import (
            init_ai_client, build_prompt_v40,
            call_naver, call_claude_with_websearch,
            call_gemini_with_search, call_grok,
            parse_json_response, AI_CONFIGS
        )
    except ImportError:
        print(f"  ❌ collect_v40.py를 찾을 수 없습니다.")
        return 0

    client = init_ai_client(ai_name)

    # 20-20-60 분배
    neg = int(count * 0.2)
    pos = int(count * 0.2)
    neu = count - neg - pos
    sentiment_dist = {"negative": neg, "positive": pos, "neutral": neu}

    # 카테고리 한글명 찾기
    cat_korean = next((k for c, k in CATEGORIES if c == category), category)

    prompt = build_prompt_v40(
        politician_name, category, cat_korean,
        data_type, count, sentiment_dist, ai_name
    )

    # AI별 호출
    if ai_name == "Naver":
        # Naver Search API (V40에서 Perplexity 대체)
        result = call_naver(client, prompt, data_type)
    elif ai_name == "Claude":
        result = call_claude_with_websearch(client, prompt)
    elif ai_name == "Gemini":
        result = call_gemini_with_search(client, prompt)
    elif ai_name == "Grok":
        result = call_grok(client, prompt)
    else:
        result = None

    if not result:
        print(f"    ❌ 재수집 실패")
        return 0

    items = parse_json_response(result)

    # DB 저장
    saved = 0
    for item in items:
        try:
            record = {
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category,
                'data_type': data_type,
                'collector_ai': ai_name.lower(),
                'title': item.get('data_title', '')[:200],
                'content': item.get('data_content', '')[:2000],
                'source_url': item.get('source_url', ''),
                'source_name': item.get('data_source', ''),
                'published_date': item.get('data_date'),
                'sentiment': item.get('sentiment', 'neutral'),
                'is_verified': False
            }
            supabase.table(TABLE_COLLECTED_DATA).insert(record).execute()
            saved += 1
        except Exception as e:
            pass

    print(f"    ✅ {saved}개 재수집 완료")
    return saved


def recollect_invalid(politician_id, politician_name, invalid_items):
    """무효 항목 재수집"""
    if not invalid_items:
        print("재수집할 항목 없음")
        return 0

    print(f"\n{'='*60}")
    print(f"[재수집] {len(invalid_items)}개 항목")
    print(f"{'='*60}")

    # AI/카테고리/data_type별 그룹핑
    groups = {}
    for item in invalid_items:
        key = (item['collector_ai'], item['category'], item['data_type'])
        if key not in groups:
            groups[key] = 0
        groups[key] += 1

    total_recollected = 0

    for (ai_name, category, data_type), count in groups.items():
        if ai_name and category and data_type:
            recollected = recollect_for_ai(
                ai_name.capitalize(),
                politician_id,
                politician_name,
                category,
                count,
                data_type
            )
            total_recollected += recollected
            time.sleep(1)

    print(f"\n재수집 완료: {total_recollected}개")
    return total_recollected


def run_validation_pipeline(politician_id, politician_name, mode='all', ai_name=None, max_iterations=3):
    """검증 + 재수집 파이프라인"""
    print(f"\n{'#'*60}")
    print(f"# V40 검증 파이프라인: {politician_name}")
    print(f"# 모드: {mode}")
    print(f"{'#'*60}")

    if mode == 'validate':
        # 검증만
        result = validate_collected_data(politician_id, politician_name, ai_name)
        return result

    elif mode == 'recollect':
        # 재수집만 (is_verified=False인 항목)
        items = get_collected_data(politician_id, ai_name)
        invalid_items = [
            {
                'id': item['id'],
                'collector_ai': item.get('collector_ai'),
                'category': item.get('category'),
                'data_type': item.get('data_type')
            }
            for item in items if not item.get('is_verified', False)
        ]

        if invalid_items:
            delete_invalid_items(invalid_items)
            recollect_invalid(politician_id, politician_name, invalid_items)

    else:  # mode == 'all'
        # 검증 → 삭제 → 재수집 → 재검증 (반복)
        for iteration in range(1, max_iterations + 1):
            print(f"\n{'='*60}")
            print(f"[반복 {iteration}/{max_iterations}]")
            print(f"{'='*60}")

            # 1. 검증
            result = validate_collected_data(politician_id, politician_name, ai_name)

            if result['invalid'] == 0:
                print(f"\n✅ 모든 데이터 유효! 검증 완료.")
                break

            # 2. 무효 항목 삭제
            delete_invalid_items(result['invalid_items'])

            # 3. 재수집
            recollect_invalid(politician_id, politician_name, result['invalid_items'])

            # 잠시 대기
            time.sleep(2)

        # 최종 검증
        print(f"\n{'='*60}")
        print(f"[최종 검증]")
        print(f"{'='*60}")
        final_result = validate_collected_data(politician_id, politician_name, ai_name)

        return final_result


def main():
    parser = argparse.ArgumentParser(description='V40 검증 및 재수집')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--mode', choices=['all', 'validate', 'recollect'], default='all',
                       help='실행 모드 (all=검증+재수집, validate=검증만, recollect=재수집만)')
    parser.add_argument('--ai', choices=['Claude', 'Gemini', 'Grok', 'Naver'],
                       help='특정 AI만 검증')
    parser.add_argument('--max_iterations', type=int, default=3,
                       help='최대 반복 횟수 (기본: 3)')

    args = parser.parse_args()

    run_validation_pipeline(
        args.politician_id,
        args.politician_name,
        mode=args.mode,
        ai_name=args.ai,
        max_iterations=args.max_iterations
    )


if __name__ == "__main__":
    main()
