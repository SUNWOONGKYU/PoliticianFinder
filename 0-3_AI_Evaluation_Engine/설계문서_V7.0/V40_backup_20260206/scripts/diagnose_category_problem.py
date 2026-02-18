#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V40 카테고리 분포 문제 진단 스크립트

문제: 일부 카테고리는 과다, 일부는 부족으로 불균형
원인: 카테고리별로 독립적으로 수집
"""

import os
import sys
from pathlib import Path
from supabase import create_client
from collections import Counter, defaultdict
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# .env 파일 로드
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(env_path)

# Supabase 초기화
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# V40 목표 설정
V40_TARGETS = {
    "Gemini": {
        "official": {"negative": 6, "positive": 6, "free": 18},  # 30개
        "public": {"negative": 4, "positive": 4, "free": 12}     # 20개
    },
    "Naver": {
        "official": {"negative": 2, "positive": 2, "free": 6},   # 10개
        "public": {"negative": 8, "positive": 8, "free": 24}     # 40개
    }
}

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

def diagnose_problem():
    """문제 진단"""

    politician_name = "조은희"

    # 조은희 ID 조회
    response = supabase.table('politicians') \
        .select('id') \
        .eq('name', politician_name) \
        .execute()

    if not response.data:
        print(f"❌ {politician_name} 정치인을 찾을 수 없습니다.")
        return

    politician_id = response.data[0]['id']

    print(f"{'='*80}")
    print(f"V40 카테고리 분포 문제 진단: {politician_name} ({politician_id})")
    print(f"{'='*80}\n")

    # 전체 데이터 조회
    response = supabase.table('collected_data_v40') \
        .select('*') \
        .eq('politician_id', politician_id) \
        .execute()

    data_items = response.data
    total = len(data_items)

    print(f"📊 총 데이터: {total}개\n")

    # 카테고리별 상세 분석
    print(f"{'='*80}")
    print(f"카테고리별 상세 분석")
    print(f"{'='*80}\n")

    category_analysis = {}

    for cat_name, cat_korean in CATEGORIES:
        cat_items = [item for item in data_items if item['category'] == cat_name]
        cat_total = len(cat_items)

        # AI별 분포
        ai_dist = Counter([item['collector_ai'] for item in cat_items])

        # data_type별 분포
        type_dist = Counter([item['data_type'] for item in cat_items])

        # sentiment별 분포
        sentiment_dist = Counter([item['sentiment'] for item in cat_items])

        # AI + data_type + sentiment별 상세 분포
        detailed = defaultdict(int)
        for item in cat_items:
            key = f"{item['collector_ai']}_{item['data_type']}_{item['sentiment']}"
            detailed[key] += 1

        # V40 목표 계산
        expected_gemini = 50  # 30 official + 20 public
        expected_naver = 50   # 10 official + 40 public
        expected_total = 100

        # 상태 판단
        if cat_total == 0:
            status = "❌ 미수집"
            status_icon = "❌"
        elif cat_total < 80:
            status = "⚠️ 부족"
            status_icon = "⚠️"
        elif 80 <= cat_total <= 110:
            status = "✅ 정상"
            status_icon = "✅"
        else:
            status = f"🚨 초과 (+{cat_total - 100})"
            status_icon = "🚨"

        print(f"{status_icon} [{cat_korean} ({cat_name})]")
        print(f"   현재: {cat_total}개 / 목표: 100개 ({status})")
        print(f"   AI 분포: Gemini {ai_dist.get('Gemini', 0)}개 (목표 50), Naver {ai_dist.get('Naver', 0)}개 (목표 50)")
        print(f"   타입 분포: OFFICIAL {type_dist.get('official', 0)}개 (목표 40), PUBLIC {type_dist.get('public', 0)}개 (목표 60)")
        print(f"   감성 분포: 부정 {sentiment_dist.get('negative', 0)}개 (목표 20), 긍정 {sentiment_dist.get('positive', 0)}개 (목표 20), 자유 {sentiment_dist.get('free', 0)}개 (목표 60)")

        # 상세 분포 (V40 목표와 비교)
        print(f"   상세 분포:")
        for ai_name in ["Gemini", "Naver"]:
            for data_type in ["official", "public"]:
                for sentiment in ["negative", "positive", "free"]:
                    key = f"{ai_name}_{data_type}_{sentiment}"
                    actual = detailed.get(key, 0)

                    # V40 목표
                    target = V40_TARGETS.get(ai_name, {}).get(data_type, {}).get(sentiment, 0)

                    if target > 0 or actual > 0:  # 목표가 있거나 실제 데이터가 있으면 출력
                        diff = actual - target
                        if diff == 0:
                            icon = "✅"
                        elif diff > 0:
                            icon = f"🚨+{diff}"
                        else:
                            icon = f"⚠️{diff}"
                        print(f"     • {ai_name} {data_type} {sentiment}: {actual}개 / 목표 {target}개 {icon}")

        print()

        category_analysis[cat_name] = {
            'total': cat_total,
            'expected': expected_total,
            'diff': cat_total - expected_total,
            'status': status_icon
        }

    # 요약
    print(f"{'='*80}")
    print(f"문제 요약")
    print(f"{'='*80}\n")

    over_collected = [cat for cat, data in category_analysis.items() if data['diff'] > 10]
    under_collected = [cat for cat, data in category_analysis.items() if data['diff'] < -10]
    missing = [cat for cat, data in category_analysis.items() if data['total'] == 0]

    print(f"🚨 초과 수집 ({len(over_collected)}개):")
    for cat_name in over_collected:
        cat_korean = next(c[1] for c in CATEGORIES if c[0] == cat_name)
        data = category_analysis[cat_name]
        print(f"   • {cat_korean}: {data['total']}개 (목표 100, +{data['diff']}개 초과)")
    print()

    print(f"⚠️ 부족 수집 ({len(under_collected)}개):")
    for cat_name in under_collected:
        cat_korean = next(c[1] for c in CATEGORIES if c[0] == cat_name)
        data = category_analysis[cat_name]
        print(f"   • {cat_korean}: {data['total']}개 (목표 100, {data['diff']}개 부족)")
    print()

    print(f"❌ 미수집 ({len(missing)}개):")
    for cat_name in missing:
        cat_korean = next(c[1] for c in CATEGORIES if c[0] == cat_name)
        print(f"   • {cat_korean}: 0개")
    print()

    # 근본 원인 분석
    print(f"{'='*80}")
    print(f"근본 원인 분석")
    print(f"{'='*80}\n")

    print("🔍 문제:")
    print("   collect_v40.py 스크립트는 카테고리별로 독립적으로 수집합니다.")
    print("   일부 카테고리가 과도하게 수집되거나 부족할 수 있습니다.")
    print()

    print("🔍 왜 이런 일이 발생했나:")
    print("   1. 스크립트가 여러 번 실행되었거나")
    print("   2. 수집 중 중단 후 재시작했거나")
    print("   3. 재시도 로직에서 중복 카운트가 발생했거나")
    print("   4. 카테고리별 타겟만 확인하고 전체 합계를 확인하지 않음")
    print()

    print("🔧 해결 방법:")
    print("   1. 초과 수집된 카테고리에서 랜덤하게 데이터 삭제 (100개로 맞추기)")
    print("   2. 미수집 카테고리 수집")
    print("   3. 부족한 카테고리 추가 수집")
    print("   4. collect_v40.py에 전역 1000개 제한 추가")
    print()

    # 수정 계획
    print(f"{'='*80}")
    print(f"수정 계획")
    print(f"{'='*80}\n")

    print("단계 1: 초과 데이터 정리")
    for cat_name in over_collected:
        cat_korean = next(c[1] for c in CATEGORIES if c[0] == cat_name)
        data = category_analysis[cat_name]
        to_delete = data['diff']
        print(f"   • {cat_korean}: {to_delete}개 삭제 (랜덤)")
    print()

    print("단계 2: 부족/미수집 카테고리 수집")
    for cat_name in under_collected + missing:
        cat_korean = next(c[1] for c in CATEGORIES if c[0] == cat_name)
        data = category_analysis[cat_name]
        to_collect = 100 - data['total']
        print(f"   • {cat_korean}: {to_collect}개 추가 수집")
    print()

    print("단계 3: 최종 검증")
    print("   • 전체 1000개 확인")
    print("   • 각 카테고리 100개 확인")
    print("   • Gemini 500개, Naver 500개 확인")
    print()

if __name__ == "__main__":
    diagnose_problem()
