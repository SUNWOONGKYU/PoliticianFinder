#!/usr/bin/env python3
"""
V40 Naver 재수집 스크립트
========================

목적:
  - 부족한 카테고리 자동 감지
  - 스마트 재수집 (100개 목표, 버퍼 제외)
  - OFFICIAL/PUBLIC 비율 유지

사용법:
  # 현재 상태 확인만
  python recollect_naver_v40.py --politician_id=ID --politician_name="이름"

  # 부족분 추가 수집
  python recollect_naver_v40.py --politician_id=ID --politician_name="이름" --mode=add

  # 특정 카테고리만
  python recollect_naver_v40.py --politician_id=ID --politician_name="이름" --category=expertise --mode=add

  # 전체 교체 (삭제 후 재수집)
  python recollect_naver_v40.py --politician_id=ID --politician_name="이름" --mode=replace
"""

import os
import sys
import argparse
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
from dotenv import load_dotenv

# UTF-8 Output for Windows
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        pass

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(V40_DIR))

# .env 로드
ENV_PATH = V40_DIR.parent / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

from supabase import create_client

# Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 카테고리 목록
CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

# Naver 목표 (V40 기본방침)
NAVER_TARGETS = {
    'official': 10,  # 버퍼 제외
    'public': 40     # 버퍼 제외
}

NAVER_TARGETS_WITH_BUFFER = {
    'official': 12,  # 10 * 1.2
    'public': 48     # 40 * 1.2
}


def analyze_current_status(politician_id: str, category: str = None) -> Dict:
    """현재 Naver 수집 상태 분석"""
    print(f"\n{'='*80}")
    print("Naver 수집 상태 분석")
    print(f"{'='*80}")
    print(f"정치인 ID: {politician_id}")
    if category:
        print(f"카테고리: {category}")
    print(f"{'='*80}\n")

    categories_to_check = [category] if category else CATEGORIES
    results = {}

    for cat in categories_to_check:
        # Naver 데이터 조회
        response = supabase.table('collected_data_v40')\
            .select('id, data_type, sentiment')\
            .eq('politician_id', politician_id)\
            .eq('collector_ai', 'Naver')\
            .eq('category', cat)\
            .execute()

        data = response.data
        total = len(data)

        official_count = len([d for d in data if d['data_type'] == 'official'])
        public_count = len([d for d in data if d['data_type'] == 'public'])

        # 센티멘트 분포
        sentiments = {'negative': 0, 'positive': 0, 'free': 0}
        for d in data:
            sent = d.get('sentiment', 'free')
            if sent in sentiments:
                sentiments[sent] += 1

        # 부족분 계산 (100개 목표 기준)
        official_shortage = max(0, NAVER_TARGETS['official'] - official_count)
        public_shortage = max(0, NAVER_TARGETS['public'] - public_count)
        total_shortage = official_shortage + public_shortage

        # 상태 판정
        status = '✅' if total >= 50 else '⚠️'  # 50개 (버퍼 제외 목표)

        results[cat] = {
            'total': total,
            'official': official_count,
            'public': public_count,
            'sentiments': sentiments,
            'shortage': {
                'official': official_shortage,
                'public': public_shortage,
                'total': total_shortage
            },
            'status': status,
            'needs_recollect': total_shortage > 0
        }

        # 출력
        print(f"[{cat}]")
        print(f"  총: {total:3d}개 (목표: 50개) {status}")
        print(f"  OFFICIAL: {official_count:3d}개 (목표: 10개, 부족: {official_shortage}개)")
        print(f"  PUBLIC:   {public_count:3d}개 (목표: 40개, 부족: {public_shortage}개)")
        print(f"  센티멘트: neg={sentiments['negative']:2d} pos={sentiments['positive']:2d} free={sentiments['free']:2d}")
        if total_shortage > 0:
            print(f"  🔄 재수집 필요: {total_shortage}개")
        print()

    return results


def delete_existing_data(politician_id: str, category: str):
    """기존 Naver 데이터 삭제 (replace 모드용)"""
    print(f"\n⚠️  [{category}] 기존 Naver 데이터 삭제 중...")

    response = supabase.table('collected_data_v40')\
        .delete()\
        .eq('politician_id', politician_id)\
        .eq('collector_ai', 'Naver')\
        .eq('category', category)\
        .execute()

    print(f"✅ 삭제 완료")


def recollect_category(politician_id: str, politician_name: str, category: str):
    """
    특정 카테고리 재수집 (카테고리 전체 재수집)

    부족분만 추가하는 대신, 카테고리 전체를 재수집하여 자동으로 채워집니다.
    중복 체크가 되어 있어서 이미 있는 데이터는 스킵됩니다.
    """
    print(f"\n{'='*80}")
    print(f"[{category}] Naver 재수집 시작")
    print(f"{'='*80}")
    print(f"카테고리 전체 재수집 (중복 자동 스킵)")
    print(f"{'='*80}\n")

    import subprocess

    collect_script = SCRIPT_DIR / "collect_naver_v40_final.py"

    if not collect_script.exists():
        print(f"❌ 수집 스크립트를 찾을 수 없습니다: {collect_script}")
        return False

    # 카테고리 전체 재수집 (OFFICIAL + PUBLIC)
    cmd = [
        sys.executable,
        str(collect_script),
        "--politician-id", politician_id,
        "--politician-name", politician_name,
        "--category", category
    ]

    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
        print(result.stdout)
        print(f"✅ 재수집 완료")
    except subprocess.CalledProcessError as e:
        print(f"❌ 재수집 실패: {e}")
        print(f"Output: {e.stdout if e.stdout else 'No output'}")
        print(f"Error: {e.stderr if e.stderr else 'No error'}")
        return False

    return True


def main():
    parser = argparse.ArgumentParser(description='V40 Naver 재수집 스크립트')
    parser.add_argument('--politician_id', type=str, required=True, help='정치인 ID')
    parser.add_argument('--politician_name', type=str, required=True, help='정치인 이름')
    parser.add_argument('--category', type=str, choices=CATEGORIES, help='특정 카테고리만')
    parser.add_argument('--mode', type=str, default='verify',
                       choices=['verify', 'add', 'replace'],
                       help='verify: 확인만, add: 추가 수집, replace: 삭제 후 재수집')

    args = parser.parse_args()

    # 1단계: 현재 상태 분석
    results = analyze_current_status(args.politician_id, args.category)

    # verify 모드면 여기서 종료
    if args.mode == 'verify':
        print(f"\n{'='*80}")
        print("현재 상태 확인 완료 (verify 모드)")
        print(f"{'='*80}\n")

        # 요약
        total_categories = len(results)
        need_recollect = sum(1 for r in results.values() if r['needs_recollect'])

        print(f"총 카테고리: {total_categories}개")
        print(f"재수집 필요: {need_recollect}개")
        print()

        if need_recollect > 0:
            print("💡 재수집하려면 --mode=add 옵션을 사용하세요:")
            print(f"   python recollect_naver_v40.py --politician_id={args.politician_id} \\")
            print(f"          --politician_name=\"{args.politician_name}\" --mode=add")

        return

    # 2단계: 재수집 실행
    print(f"\n{'='*80}")
    print(f"재수집 모드: {args.mode}")
    print(f"{'='*80}\n")

    for cat, result in results.items():
        if not result['needs_recollect'] and args.mode == 'add':
            print(f"[{cat}] ✅ 재수집 불필요 (이미 충분)")
            continue

        # replace 모드면 기존 데이터 삭제
        if args.mode == 'replace':
            delete_existing_data(args.politician_id, cat)

        # 재수집 실행 (카테고리 전체)
        success = recollect_category(
            args.politician_id,
            args.politician_name,
            cat
        )

        if not success:
            print(f"❌ [{cat}] 재수집 실패")
            continue

    # 3단계: 최종 상태 확인
    print(f"\n{'='*80}")
    print("재수집 후 최종 상태")
    print(f"{'='*80}\n")

    final_results = analyze_current_status(args.politician_id, args.category)

    # 최종 요약
    print(f"\n{'='*80}")
    print("재수집 완료")
    print(f"{'='*80}\n")

    total_categories = len(final_results)
    complete = sum(1 for r in final_results.values() if not r['needs_recollect'])

    print(f"총 카테고리: {total_categories}개")
    print(f"완료: {complete}개")
    print(f"미완료: {total_categories - complete}개")
    print()


if __name__ == '__main__':
    main()
