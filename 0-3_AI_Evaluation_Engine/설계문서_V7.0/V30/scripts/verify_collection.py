#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V30 수집 데이터 자동 검증 스크립트
수집 완료 후 즉시 실행하여 data_type 분포 확인

사용법:
    python verify_collection.py <politician_id>
    python verify_collection.py d0a5d6e1  # 조은희
"""

import os
import sys
from collections import Counter
from dotenv import load_dotenv
from supabase import create_client

# UTF-8 출력 설정 (Windows)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

load_dotenv()


def verify_politician_collection(politician_id):
    """정치인별 수집 데이터 검증"""

    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    )

    # 전체 데이터 조회
    try:
        response = supabase.table('collected_data_v30') \
            .select('collector_ai, data_type, category') \
            .eq('politician_id', politician_id) \
            .execute()
    except Exception as e:
        print(f"❌ DB 조회 실패: {e}")
        return False

    if not response.data:
        print(f"❌ 데이터 없음: politician_id={politician_id}")
        return False

    total = len(response.data)

    # AI별 data_type 분포
    print(f"\n{'=' * 70}")
    print(f"📊 수집 데이터 검증 (politician_id: {politician_id})")
    print(f"{'=' * 70}\n")
    print(f"전체 데이터: {total}개\n")

    ai_counter = Counter([item['collector_ai'] for item in response.data])
    all_passed = True

    # V30 500개: Gemini 30 + Perplexity 20 per category (Grok 수집 안 함)
    for ai_name in ['Gemini', 'Perplexity']:
        ai_items = [item for item in response.data if item['collector_ai'] == ai_name]
        if not ai_items:
            print(f"{ai_name}: 데이터 없음\n")
            continue

        type_counter = Counter([item['data_type'] for item in ai_items])
        official_count = type_counter.get('official', 0)
        public_count = type_counter.get('public', 0)

        official_ratio = official_count / len(ai_items) * 100 if ai_items else 0
        public_ratio = public_count / len(ai_items) * 100 if ai_items else 0

        print(f"🤖 {ai_name}: {len(ai_items)}개")
        print(f"   ├─ OFFICIAL: {official_count}개 ({official_ratio:.1f}%)")
        print(f"   └─ PUBLIC:   {public_count}개 ({public_ratio:.1f}%)")

        # Gemini 검증 (60% = OFFICIAL 20 + PUBLIC 10)
        if ai_name == "Gemini":
            # V30 비율: OFFICIAL 20개, PUBLIC 10개 = 2:1 비율
            # 카테고리당 30개 × 10개 = 300개 기대
            expected_official_ratio = 66.7  # ~2/3
            expected_public_ratio = 33.3    # ~1/3

            # 오차 범위 ±5%
            if not (61 <= official_ratio <= 72):
                print(f"   ⚠️ OFFICIAL 비율 이상: {official_ratio:.1f}% (기대: 66.7% ± 5%)")
                all_passed = False
            elif not (28 <= public_ratio <= 39):
                print(f"   ⚠️ PUBLIC 비율 이상: {public_ratio:.1f}% (기대: 33.3% ± 5%)")
                all_passed = False
            else:
                print(f"   ✅ 비율 정상 (OFFICIAL:PUBLIC ≈ 2:1)")

        # Perplexity 검증 (40% = PUBLIC 20만)
        elif ai_name == "Perplexity":
            if official_count > 0:
                print(f"   ❌ OFFICIAL 데이터 발견: {official_count}개 (기대: 0개)")
                all_passed = False
            else:
                print(f"   ✅ PUBLIC만 수집 (OFFICIAL 없음)")

        print()

    # 카테고리별 분포
    print(f"\n{'=' * 70}")
    print("📁 카테고리별 분포\n")

    category_counter = Counter([item['category'] for item in response.data])
    for category, count in sorted(category_counter.items()):
        print(f"   {category}: {count}개")

    print(f"\n{'=' * 70}")

    if all_passed:
        print("✅ 모든 검증 통과")
        return True
    else:
        print("❌ 검증 실패 - 데이터 재수집 권장")
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python verify_collection.py <politician_id>")
        print("\n예시:")
        print("  python verify_collection.py d0a5d6e1  # 조은희")
        print("  python verify_collection.py 17270f25  # 정원오")
        sys.exit(1)

    politician_id = sys.argv[1]
    success = verify_politician_collection(politician_id)
    sys.exit(0 if success else 1)
