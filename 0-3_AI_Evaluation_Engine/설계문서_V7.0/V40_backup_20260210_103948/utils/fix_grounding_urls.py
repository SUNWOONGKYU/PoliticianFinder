# -*- coding: utf-8 -*-
"""
Grounding Redirect URL 수정 스크립트

grounding-api-redirect URL을 최종 리다이렉트 URL로 변환하고
올바른 data_type (OFFICIAL/PUBLIC)을 설정합니다.

사용법:
    python fix_grounding_urls.py --politician_id=f9e00370 --politician_name="김민석"
"""

import os
import sys
import argparse
import requests
from urllib.parse import urlparse
from supabase import create_client
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

TABLE_COLLECTED_DATA = "collected_data_v40"

# 공식 도메인 목록
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


def is_grounding_redirect(url):
    """grounding-api-redirect URL 여부 확인"""
    return 'grounding-api-redirect' in url if url else False


def get_final_url(url, timeout=10):
    """리다이렉트 최종 URL 가져오기"""
    if not url or not is_grounding_redirect(url):
        return url

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.head(url, headers=headers, timeout=timeout, allow_redirects=True)
        final_url = response.url
        return final_url
    except Exception as e:
        # 리다이렉트 실패 시 원본 URL 유지
        return url


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


def determine_data_type(url):
    """URL로부터 data_type 결정"""
    if is_official_domain(url):
        return 'official'
    else:
        return 'public'


def fix_item(item):
    """단일 항목 수정"""
    item_id = item.get('id')
    original_url = item.get('source_url', '')
    original_type = item.get('data_type', '')

    if not is_grounding_redirect(original_url):
        return None  # 수정 불필요

    # 최종 URL 가져오기
    final_url = get_final_url(original_url)

    # data_type 결정
    correct_type = determine_data_type(final_url)

    # 변경 필요 여부 확인
    if final_url == original_url and correct_type == original_type:
        return None  # 변경 불필요

    return {
        'id': item_id,
        'original_url': original_url,
        'final_url': final_url,
        'original_type': original_type,
        'correct_type': correct_type
    }


def main():
    parser = argparse.ArgumentParser(description='Grounding Redirect URL 수정')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--max_workers', type=int, default=10, help='병렬 처리 스레드 수')

    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"Grounding Redirect URL 수정: {args.politician_name}")
    print(f"{'='*60}\n")

    # 1. grounding redirect URL 항목 조회
    print("1️⃣ grounding redirect URL 항목 조회 중...")
    result = supabase.table(TABLE_COLLECTED_DATA)\
        .select('*')\
        .eq('politician_id', args.politician_id)\
        .execute()

    all_items = result.data
    grounding_items = [item for item in all_items if is_grounding_redirect(item.get('source_url', ''))]

    print(f"   전체: {len(all_items)}개")
    print(f"   Grounding redirect: {len(grounding_items)}개")

    if not grounding_items:
        print("\n✅ 수정할 항목이 없습니다.")
        return

    # 2. 최종 URL 및 data_type 확인
    print(f"\n2️⃣ 최종 URL 확인 중 ({args.max_workers}개 병렬 처리)...")
    fixes = []

    with ThreadPoolExecutor(max_workers=args.max_workers) as executor:
        futures = {executor.submit(fix_item, item): item for item in grounding_items}

        completed = 0
        for future in as_completed(futures):
            completed += 1
            if completed % 50 == 0:
                print(f"   진행: {completed}/{len(grounding_items)}")

            result = future.result()
            if result:
                fixes.append(result)

    print(f"   완료: {len(grounding_items)}개 확인")
    print(f"   수정 필요: {len(fixes)}개")

    if not fixes:
        print("\n✅ 모든 항목이 이미 올바릅니다.")
        return

    # 3. 통계 출력
    print(f"\n3️⃣ 수정 내역:")
    url_changed = len([f for f in fixes if f['original_url'] != f['final_url']])
    type_changed = len([f for f in fixes if f['original_type'] != f['correct_type']])

    print(f"   URL 변경: {url_changed}개")
    print(f"   data_type 변경: {type_changed}개")

    # data_type 변경 통계
    type_changes = {}
    for fix in fixes:
        if fix['original_type'] != fix['correct_type']:
            change = f"{fix['original_type']} → {fix['correct_type']}"
            type_changes[change] = type_changes.get(change, 0) + 1

    if type_changes:
        print(f"\n   data_type 변경 상세:")
        for change, count in type_changes.items():
            print(f"     {change}: {count}개")

    # 4. DB 업데이트
    print(f"\n4️⃣ DB 업데이트 중...")
    updated = 0
    failed = 0

    for fix in fixes:
        try:
            supabase.table(TABLE_COLLECTED_DATA)\
                .update({
                    'source_url': fix['final_url'],
                    'data_type': fix['correct_type']
                })\
                .eq('id', fix['id'])\
                .execute()
            updated += 1

            if updated % 100 == 0:
                print(f"   진행: {updated}/{len(fixes)}")
        except Exception as e:
            failed += 1
            print(f"   ❌ 업데이트 실패 (ID: {fix['id']}): {e}")

    print(f"\n{'='*60}")
    print(f"✅ 수정 완료")
    print(f"   성공: {updated}개")
    print(f"   실패: {failed}개")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
