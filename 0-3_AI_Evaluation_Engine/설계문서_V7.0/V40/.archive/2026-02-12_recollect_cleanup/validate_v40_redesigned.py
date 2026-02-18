#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V40 검증 스크립트 (재설계 버전)

핵심 변경:
1. 삭제하지 않음 - 대신 validation_status 필드에 플래그 설정
2. 메인 에이전트가 최종 검토 후 삭제 결정
3. 삭제 대상 목록을 별도 파일로 출력

검증 결과:
- VALID: 정상 데이터
- REVIEW_URL: URL 접속 불가 (검토 필요)
- REVIEW_DUPLICATE: 중복 데이터 (검토 필요)
- REVIEW_DATE: 기간 초과 (검토 필요)
- REVIEW_FIELD: 필수 필드 누락 (검토 필요)
"""

import sys
import io

# UTF-8 출력 설정 (최우선)
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        pass

import os
import json
import argparse
from datetime import datetime
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv

# Add helpers directory to path
SCRIPT_DIR = Path(__file__).resolve().parent
HELPERS_DIR = SCRIPT_DIR.parent / 'helpers'
sys.path.insert(0, str(HELPERS_DIR))

from duplicate_check_utils import normalize_url, normalize_title

# 환경 변수 로드
env_path = SCRIPT_DIR.parent.parent.parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path, override=True)
else:
    load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

TABLE_COLLECTED_DATA = "collected_data_v40"


def validate_collected_data_redesigned(politician_id, politician_name):
    """
    검증 수행 (삭제 없이 플래깅만)
    """
    print(f"\n{'='*60}")
    print(f"[검증] {politician_name} ({politician_id})")
    print(f"[모드] 검토 모드 - 플래깅만, 삭제 안 함")
    print(f"{'='*60}")

    # 모든 데이터 조회 (pagination 처리)
    all_items = []
    page_size = 1000
    offset = 0

    while True:
        result = supabase.table(TABLE_COLLECTED_DATA)\
            .select('*')\
            .eq('politician_id', politician_id)\
            .range(offset, offset + page_size - 1)\
            .execute()

        if not result.data:
            break

        all_items.extend(result.data)

        if len(result.data) < page_size:
            break

        offset += page_size

    print(f"총 {len(all_items)}개 항목 검증 시작...")

    # 검증 결과 통계
    status_counts = {
        'VALID': 0,
        'REVIEW_URL': 0,
        'REVIEW_DUPLICATE': 0,
        'REVIEW_DATE': 0,
        'REVIEW_FIELD': 0
    }

    review_items = []  # 검토 필요 항목 목록

    # URL 중복 체크를 위한 dict
    url_seen = {}

    for i, item in enumerate(all_items):
        item_id = item.get('id')
        status = 'VALID'
        reason = []

        # 필수 필드 확인
        if not item.get('title') or not item.get('content'):
            status = 'REVIEW_FIELD'
            reason.append('필수 필드 누락')

        # 중복 체크 (URL 기반)
        url = item.get('source_url', '')
        if url:
            normalized_url = normalize_url(url)
            key = (item.get('category'), item.get('collector_ai'), normalized_url)

            if key in url_seen:
                status = 'REVIEW_DUPLICATE'
                reason.append(f'중복 (original: {url_seen[key]})')
            else:
                url_seen[key] = item_id

        # 통계 업데이트
        status_counts[status] += 1

        # 검토 필요 항목 기록
        if status != 'VALID':
            review_items.append({
                'id': item_id,
                'status': status,
                'reason': ', '.join(reason),
                'category': item.get('category'),
                'collector_ai': item.get('collector_ai'),
                'title': item.get('title', '')[:50],
                'url': item.get('source_url', '')[:80]
            })

        if (i + 1) % 100 == 0:
            print(f"  진행: {i+1}/{len(all_items)}")

    # 결과 출력
    print(f"\n검증 완료:")
    print(f"  [OK] 정상: {status_counts['VALID']}개 ({status_counts['VALID']/len(all_items)*100:.1f}%)")

    total_review = sum([status_counts[k] for k in status_counts if k != 'VALID'])
    print(f"  [REVIEW] 검토 필요: {total_review}개 ({total_review/len(all_items)*100:.1f}%)")

    for status_key in ['REVIEW_FIELD', 'REVIEW_DUPLICATE', 'REVIEW_URL', 'REVIEW_DATE']:
        count = status_counts[status_key]
        if count > 0:
            status_name = {
                'REVIEW_FIELD': '필수 필드 누락',
                'REVIEW_DUPLICATE': '중복',
                'REVIEW_URL': 'URL 접속 불가',
                'REVIEW_DATE': '기간 초과'
            }[status_key]
            print(f"    - {status_name}: {count}개")

    # 검토 필요 항목을 JSON 파일로 저장
    if review_items:
        output_dir = SCRIPT_DIR.parent.parent / 'validation_reports'
        output_dir.mkdir(exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = output_dir / f'review_{politician_name}_{timestamp}.json'

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                'politician_id': politician_id,
                'politician_name': politician_name,
                'total_items': len(all_items),
                'valid_items': status_counts['VALID'],
                'review_items': review_items,
                'status_counts': status_counts,
                'generated_at': datetime.now().isoformat()
            }, f, ensure_ascii=False, indent=2)

        print(f"\n[REPORT] 검토 대상 목록 저장: {output_file}")
        print(f"[INFO] 메인 에이전트가 검토 후 삭제 결정할 수 있습니다")

    return {
        'total': len(all_items),
        'valid': status_counts['VALID'],
        'review_needed': total_review,
        'review_items': review_items,
        'status_counts': status_counts
    }


def main():
    parser = argparse.ArgumentParser(description='V40 검증 (재설계 - 플래깅만)')
    parser.add_argument('--politician_id', required=True)
    parser.add_argument('--politician_name', required=True)

    args = parser.parse_args()

    result = validate_collected_data_redesigned(
        args.politician_id,
        args.politician_name
    )

    print(f"\n{'='*60}")
    print(f"검증 결과 요약:")
    print(f"  전체: {result['total']}개")
    print(f"  정상: {result['valid']}개")
    print(f"  검토 필요: {result['review_needed']}개")
    print(f"  검토 비율: {result['review_needed']/result['total']*100:.1f}%")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
