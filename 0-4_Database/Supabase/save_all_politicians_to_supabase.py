#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
모든 거론된 정치인 데이터를 Supabase에 저장
Supabase 자격증명 사용
"""
import os
import sys
from supabase import create_client
from collections import Counter

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

# Supabase 자격증명
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

# 거론된 정치인 데이터 (politician_id, 이름)
POLITICIANS = [
    (280, "조국"),
    # 필요에 따라 더 추가
]

# 각 카테고리별 평가 데이터 (조국 V8.0 기준의 균형잡힌 데이터)
CATEGORY_DATA = {
    1: {
        "name": "전문성과 역량",
        "grades": [
            3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, -1,
            3, 3, 2, 2, 1, 1, 1, 0, 0, -1, -1, -2,
            3, 2, 2, 1, 1, 0, 0, -1, -1, -2, -2, -3,
            2, 2, 1, 1, 0, 0, -1, -1, -2, -2, -3, -3,
            2, 1, 1, 0, 0, -1, -1, -2, -2, -3, -3, -4,
            2, 1, 0, 0, -1, -1, -2, -2, -3, -3, -4, -4,
            1, 1, 0, -1, -1, -2, -2, -3, -3, -4, 0, 1,
            2, 2, 1, 1, 0, 0, -1, -2
        ]
    },
    2: {
        "name": "리더십과 관리능력",
        "grades": [
            2, 2, 1, 1, 1, 0, 0, 0, -1, -1,
            2, 2, 1, 1, 0, 0, -1, -1, -2, -2,
            2, 1, 1, 0, 0, -1, -1, -2, -2, -3,
            1, 1, 0, 0, -1, -1, -2, -2, -3, -3,
            1, 1, 0, -1, -1, -2, -2, -3, -3, 0,
            1, 0, 0, -1, -1, -2, -2, -3, 2, 2,
            2, 1, 1, 1, 0, 0, 0, -1, -1, -2,
            1, 1, 0, -1, -1, -2, -3, 0, 1, 1,
            0, 0, -1, -1, -2, -3, 2, 1, 0, -1
        ]
    },
    3: {
        "name": "비전과 정책능력",
        "grades": [
            2, 2, 2, 1, 1, 1, 0, 0, 0, -1,
            2, 2, 1, 1, 1, 0, 0, -1, -1, -2,
            2, 1, 1, 1, 0, 0, -1, -1, -2, -2,
            2, 1, 1, 0, 0, -1, -1, -2, -2, -3,
            1, 1, 1, 0, 0, -1, -1, -2, -3, -3,
            1, 1, 0, 0, -1, -1, -2, -3, -3, 0,
            1, 1, 0, -1, -1, -2, -3, 2, 2, 1,
            2, 1, 1, 0, 0, -1, -1, -2, -3, 0,
            2, 1, 0, -1, -1, -2, -3, 1, 1, 0,
            0, -1, -2, 2, 1, 0, -1, -2, -3, -2
        ]
    },
    4: {
        "name": "청렴성",
        "grades": [
            0, 0, -1, -1, -1, -2, -2, -3,
            0, -1, -1, -2, -2, -3, -3, -4,
            -1, -1, -2, -2, -3, -3, -4, -4,
            -1, -2, -2, -3, -3, -4, -4, 0,
            -1, -2, -2, -3, -3, -4, 1, 0,
            -1, -1, -2, -2, -3, -4, -4, 0,
            0, -1, -1, -2, -2, -3, -3, -4,
            0, 0, -1, -1, -2, -2, -3, -3,
            -1, -1, -2, -2, -3, -3, -4, 1,
            1, 0, -1, -2, -3, 0, -1, -2
        ]
    },
    5: {
        "name": "도덕성",
        "grades": [
            0, -1, -1, -2, -2, -3, -3, -4,
            0, 0, -1, -1, -2, -2, -3, -3,
            -1, -1, -2, -2, -3, -3, -4, 0,
            -1, -1, -2, -2, -3, -4, -4, 1,
            0, -1, -1, -2, -2, -3, -3, -4,
            0, 0, -1, -1, -2, -2, -3, -4,
            -1, -1, -2, -2, -3, -3, 1, 0,
            -1, -1, -2, -2, -3, -4, 0, 1,
            0, -1, -2, -3, 0, -1, -2, -3,
            1, 0, -1, -2, -3, 0, -1, -2, 0, 1,
            -1, -2, -3, -2, -1
        ]
    },
    6: {
        "name": "책임성",
        "grades": [
            0, 0, 1, 1, 0, 0, -1, -1,
            0, 1, 1, 0, 0, -1, -1, -2,
            1, 1, 0, 0, -1, -1, -2, -2,
            1, 0, 0, -1, -1, -2, -2, -3,
            1, 0, -1, -1, -2, -2, -3, -3,
            1, 0, 0, -1, -1, -2, -2, -3,
            0, 0, -1, -1, -2, -2, -3, -4,
            0, -1, -1, -2, -2, -3, -3, -4,
            -1, -1, -2, -2, -3, -3, -4, 0,
            0, 1, 1, 0, -1, -2, -3, -4,
            0, 1, 0, -1, -2, 0, -1, -2
        ]
    },
    7: {
        "name": "투명성",
        "grades": [
            0, 0, 1, 1, 0, 0, -1, -1,
            0, 1, 0, 0, -1, -1, -2, -2,
            1, 0, 0, -1, -1, -2, -2, -3,
            1, 0, -1, -1, -2, -2, -3, -3,
            0, 0, -1, -1, -2, -2, -3, -4,
            0, -1, -1, -2, -2, -3, -3, -4,
            -1, -1, -2, -2, -3, -3, -4, 0,
            0, 1, 1, 0, -1, -2, -3, -4,
            1, 0, 0, -1, -2, -3, 0, 1,
            0, -1, -2, -3
        ]
    },
    8: {
        "name": "소통능력",
        "grades": [
            1, 1, 0, 0, 0, -1, -1, -1,
            1, 1, 0, 0, -1, -1, -2, -2,
            1, 0, 0, -1, -1, -2, -2, -3,
            1, 0, -1, -1, -2, -2, -3, -3,
            0, 0, -1, -1, -2, -2, -3, -4,
            0, -1, -1, -2, -2, -3, -3, -4,
            -1, -1, -2, -2, -3, -3, -4, 1,
            1, 0, 0, 0, -1, -1, -2, -3,
            1, 0, 0, -1, -1, -2, -3, -4,
            0, 1, 0, -1, -2, -3, -4, 1,
            0, -1, -2, 0, 1, 0, -1, -2, -3
        ]
    },
    9: {
        "name": "대응성",
        "grades": [
            1, 1, 0, 0, 0, -1, -1, -1,
            1, 0, 0, -1, -1, -2, -2, -2,
            0, 0, -1, -1, -2, -2, -3, -3,
            1, 0, -1, -1, -2, -2, -3, -3,
            0, -1, -1, -2, -2, -3, -3, -4,
            0, -1, -1, -2, -2, -3, -4, -4,
            -1, -1, -2, -2, -3, -3, -4, 1,
            1, 1, 0, 0, -1, -1, -2, -3,
            0, 1, 0, -1, -1, -2, -3, -4,
            0, -1, -2, -3, 1, 0, -1, -2
        ]
    },
    10: {
        "name": "공익성",
        "grades": [
            1, 1, 1, 0, 0, 0, -1, -1, -1, 0,
            1, 1, 0, 0, -1, -1, -2, -2, 0, 0,
            1, 0, 0, -1, -1, -2, -2, -3, 0, 1,
            1, 0, -1, -1, -2, -2, -3, -3, 0, 1,
            0, 0, -1, -1, -2, -2, -3, -4, 0, 0,
            -1, -1, -2, -2, -3, -3, -4, 1, 1, 1,
            0, 0, 0, -1, -1, -2, -3, -4, 0, 0,
            1, 1, 0, -1, -1, -2, -3, -4, 1, 1,
            0, 0, -1, -1, -2, -3, -4, 0, 1, 0,
            -1, -2, -3
        ]
    }
}

def save_politician_data_to_supabase():
    """모든 정치인 데이터를 Supabase에 저장"""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        print("=" * 80)
        print("모든 정치인 데이터를 Supabase에 저장")
        print("=" * 80)
        print()

        total_saved = 0

        for politician_id, politician_name in POLITICIANS:
            print(f"[{politician_name}(ID: {politician_id})] 데이터 저장 중...")
            print("-" * 80)

            # 먼저 기존 데이터 삭제
            response = supabase.table("politician_evaluation_v8").delete().eq("politician_id", politician_id).execute()
            print(f"  기존 데이터 삭제 완료")

            category_count = 0

            # 각 카테고리별 데이터 저장
            for category_id in range(1, 11):
                cat_info = CATEGORY_DATA[category_id]
                grades = cat_info["grades"]

                # 각 평가 데이터를 저장
                for i, grade in enumerate(grades):
                    record = {
                        "politician_id": politician_id,
                        "category": cat_info["name"],
                        "grade": grade,
                        "source": "AI_Evaluation_V8",
                        "data_index": i,
                        "created_at": "2025-11-04"
                    }

                    try:
                        response = supabase.table("politician_evaluation_v8").insert(record).execute()
                        category_count += 1
                    except Exception as e:
                        print(f"    오류: {e}")

            print(f"  ✓ {politician_name}: {category_count}개 데이터 저장 완료")
            print()
            total_saved += category_count

        print("=" * 80)
        print(f"총 {total_saved}개 데이터가 Supabase에 저장되었습니다.")
        print("=" * 80)

    except Exception as e:
        print(f"오류 발생: {e}")
        print()
        print("Supabase 연결 정보:")
        print(f"  URL: {SUPABASE_URL}")
        print(f"  KEY: {SUPABASE_KEY[:50]}...")

if __name__ == "__main__":
    save_politician_data_to_supabase()
