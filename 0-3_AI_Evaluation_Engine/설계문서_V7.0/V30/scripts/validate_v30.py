# -*- coding: utf-8 -*-
"""
V30 검증, 중복 제거 및 재수집 스크립트

핵심 (V30 검증):
1. URL 실제 존재 여부 확인 (HEAD/GET 요청)
2. source_type 규칙 검증 (OFFICIAL/PUBLIC 도메인 매칭)
3. 필수 필드 검증 (title, content, source_url)
4. 기간 제한 검증 (OFFICIAL 4년, PUBLIC 2년)
5. 중복 데이터 자동 제거 (같은 AI + 같은 URL) ✅ 통합
6. 검증 실패 항목 자동 재수집

프로세스:
[1] 검증 (validate): 수집된 데이터 유효성 검사
    - 중복 발견 시 자동 삭제 (evaluations 포함)
[2] 재수집 (recollect): 검증 실패분 해당 AI로 재수집
[3] 재검증: 재수집 데이터 다시 검증

사용법:
    # 전체 검증 + 재수집
    python validate_v30.py --politician_id=62e7b453 --politician_name="오세훈" --mode=all

    # 검증만
    python validate_v30.py --politician_id=62e7b453 --politician_name="오세훈" --mode=validate

    # 재수집만
    python validate_v30.py --politician_id=62e7b453 --politician_name="오세훈" --mode=recollect

    # 특정 AI만
    python validate_v30.py --politician_id=62e7b453 --politician_name="오세훈" --ai=Perplexity
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

# V30 테이블명
TABLE_COLLECTED_DATA = "collected_data_v30"
TABLE_EVALUATIONS = "evaluations_v30"

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
    ("consistency", "일관성"),
    ("crisis", "위기대응"),
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
    """V30 기간 제한 계산"""
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
        r'/\d{10,}',           # 숫자만 있는 긴 ID
        r'ncd=\d{7}$',         # KBS 가짜 패턴
        r'/article/\d{4}/\d{2}/\d{2}/[a-z\-]+$',  # 날짜+slug 가짜 패턴
        r'example\.com',
        r'test\.com',
        r'localhost',
        r'0{5,}',              # 00000 패턴
    ]

    for pattern in fake_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            return True

    return False


def check_url_exists(url, timeout=10):
    """URL 실제 존재 여부 확인"""
    if not url or url.strip() == '':
        return False, "EMPTY_URL"

    # SNS는 검증 제외 (접근 제한 있음)
    if is_sns_url(url):
        return True, "VALID"

    # 가짜 URL 패턴 체크
    if is_fake_url_pattern(url):
        return False, "FAKE_URL"

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        # HEAD 요청 먼저 시도
        try:
            response = requests.head(url, headers=headers, timeout=timeout, allow_redirects=True)
            if response.status_code < 400:
                return True, "VALID"
        except:
            pass

        # HEAD 실패 시 GET 시도
        response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        if response.status_code < 400:
            return True, "VALID"
        else:
            return False, "INVALID_URL"

    except requests.exceptions.Timeout:
        return False, "INVALID_URL"
    except requests.exceptions.ConnectionError:
        return False, "INVALID_URL"
    except Exception as e:
        return False, "INVALID_URL"


def validate_source_type(item):
    """source_type 규칙 검증"""
    url = item.get('source_url', '')
    declared_type = item.get('data_type', '').upper()

    if not url:
        return True, "VALID"  # URL 없으면 이 검증은 패스

    is_official = is_official_domain(url)

    if declared_type == 'OFFICIAL' and not is_official:
        return False, "WRONG_SOURCE_TYPE"

    if declared_type == 'PUBLIC' and is_official:
        # PUBLIC인데 공식 도메인이면 경고 (에러는 아님)
        return True, "VALID"

    return True, "VALID"


def validate_required_fields(item):
    """필수 필드 검증"""
    required = ['title', 'content', 'source_url']

    for field in required:
        value = item.get(field, '')
        if not value or str(value).strip() == '':
            # source_url이 비어있어도 예외 허용
            if field == 'source_url':
                source_name = item.get('source_name', '')
                collector_ai = item.get('collector_ai', '')
                data_type = item.get('data_type', '')

                # Grok: X/트위터는 "X/@계정명" 허용
                if 'X/' in source_name or 'twitter' in source_name.lower():
                    continue

                # Gemini PUBLIC: 임시 콘텐츠는 "Platform/@계정명" 허용
                # (Instagram Stories, Facebook Live, YouTube Live 등)
                if collector_ai == 'Gemini' and data_type == 'public':
                    ephemeral_platforms = ['Instagram/', 'Facebook/', 'Live/', 'Story/']
                    if any(platform in source_name for platform in ephemeral_platforms):
                        continue

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
    """중복 데이터 검증

    규칙: 같은 AI가 같은 URL을 이미 수집했는지 확인
    - 같은 politician_id + 같은 collector_ai + 같은 source_url = 중복
    - 다른 AI가 같은 URL 수집 = 중복 아님 (자연 가중치)
    """
    politician_id = item.get('politician_id')
    collector_ai = item.get('collector_ai')
    source_url = item.get('source_url', '')
    item_id = item.get('id')  # 자기 자신 제외용

    # URL 정규화 (공백 제거)
    source_url_normalized = str(source_url).strip() if source_url else ''

    if not source_url_normalized:  # URL 없으면 중복 체크 불가능
        return True, "VALID"

    try:
        # 같은 정치인, 같은 AI, 같은 URL이 이미 있는지 확인
        query = supabase.table(TABLE_COLLECTED_DATA)\
            .select('id', count='exact')\
            .eq('politician_id', politician_id)\
            .eq('collector_ai', collector_ai)\
            .eq('source_url', source_url_normalized)

        # 자기 자신 제외
        if item_id:
            query = query.neq('id', item_id)

        existing = query.execute()

        if existing.count and existing.count > 0:
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

    # V30 규정: Grok의 X/트위터 데이터는 URL 필요 없음
    if collector_ai == 'grok':
        # X/트위터는 URL 없음 또는 "X/@계정명" 형식 허용
        if not url or url.startswith('X/@') or url.startswith('x.com') or url.startswith('twitter.com'):
            pass  # 유효 - URL 검증 건너뛰기
        elif url and not is_sns_url(url):
            valid, code = check_url_exists(url)
            if not valid:
                return False, code
    else:
        # Gemini, Perplexity는 정상 URL 검증
        if url and not is_sns_url(url):
            valid, code = check_url_exists(url)
            if not valid:
                return False, code

    # 3. source_type 검증
    valid, code = validate_source_type(item)
    if not valid:
        return False, code

    # 4. 기간 검증
    valid, code = validate_date_range(item)
    if not valid:
        return False, code

    # 5. 중복 검증
    valid, code = check_duplicate(item)
    if not valid:
        return False, code

    return True, "VALID"


def get_collected_data(politician_id, ai_name=None, category=None):
    """수집된 데이터 조회"""
    try:
        query = supabase.table(TABLE_COLLECTED_DATA)\
            .select('*')\
            .eq('politician_id', politician_id)

        if ai_name:
            query = query.eq('collector_ai', ai_name.lower())

        if category:
            query = query.eq('category', category.lower())

        result = query.execute()
        return result.data if result.data else []

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
            # ✅ V30 중복 자동 제거: DUPLICATE인 경우 즉시 삭제
            if code == "DUPLICATE":
                try:
                    # 1. evaluations 먼저 삭제 (있으면)
                    eval_result = supabase.table(TABLE_EVALUATIONS)\
                        .delete()\
                        .eq('collected_data_id', item_id)\
                        .execute()
                    eval_deleted = len(eval_result.data) if eval_result.data else 0

                    # 2. collected_data 삭제
                    supabase.table(TABLE_COLLECTED_DATA)\
                        .delete()\
                        .eq('id', item_id)\
                        .execute()

                    duplicate_removed += 1

                    # 로그 (10개마다 또는 마지막)
                    if duplicate_removed % 10 == 0 or (i + 1) == len(items):
                        print(f"  중복 제거 진행: {duplicate_removed}개 (evaluations {eval_deleted}개 포함)")
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

    # collect_v30의 함수 임포트
    try:
        from collect_v30 import (
            init_ai_client, build_prompt_v30,
            call_perplexity, call_claude_with_websearch,
            call_gemini_with_search, call_grok,
            parse_json_response, AI_CONFIGS
        )
    except ImportError:
        print(f"  ❌ collect_v30.py를 찾을 수 없습니다.")
        return 0

    client = init_ai_client(ai_name)

    # 20-20-60 분배
    neg = int(count * 0.2)
    pos = int(count * 0.2)
    neu = count - neg - pos
    sentiment_dist = {"negative": neg, "positive": pos, "neutral": neu}

    # 카테고리 한글명 찾기
    cat_korean = next((k for c, k in CATEGORIES if c == category), category)

    prompt = build_prompt_v30(
        politician_name, category, cat_korean,
        data_type, count, sentiment_dist, ai_name
    )

    # AI별 호출
    if ai_name == "Perplexity":
        result = call_perplexity(client, prompt, data_type)
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
    print(f"# V30 검증 파이프라인: {politician_name}")
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
    parser = argparse.ArgumentParser(description='V30 검증 및 재수집')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--mode', choices=['all', 'validate', 'recollect'], default='all',
                       help='실행 모드 (all=검증+재수집, validate=검증만, recollect=재수집만)')
    parser.add_argument('--ai', choices=['Perplexity', 'Claude', 'Gemini', 'Grok'],
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
