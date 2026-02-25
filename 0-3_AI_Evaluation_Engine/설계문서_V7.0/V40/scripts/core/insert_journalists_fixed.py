#!/usr/bin/env python3
"""
journalist_contacts 테이블에 기자 데이터 insert (데이터 구조 수정)
"""

import os
import json
from dotenv import load_dotenv
from supabase import create_client

# 환경 설정
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
V40_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
REPORTS_DIR = os.path.join(V40_DIR, "reports")

load_dotenv(os.path.join(V40_DIR, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 70)
print("기자 데이터 입력 (데이터 구조 수정)")
print("=" * 70)

# 데이터 로드
print("\n[*] 기자 데이터 로드 중...")

data_files = [
    os.path.join(REPORTS_DIR, "기자연락처_광역_20260222_013713.json"),
    os.path.join(REPORTS_DIR, "기자연락처_기초_20260222_023849.json"),
]

all_data = []
for filepath in data_files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            all_data.extend(data)
            print(f"[OK] {os.path.basename(filepath)}: {len(data)}개 로드")

print(f"[OK] 총 {len(all_data)}개 로드 완료")

# 데이터 정제 및 변환
print("\n[*] 데이터 정제 및 개별 기자로 변환 중...")
cleaned_data = []

for record in all_data:
    media_outlet = record.get("언론사", "")
    region = record.get("지역", "")
    region_type = record.get("구분", "")

    # 기자 1
    journalist1_name = record.get("기자1_이름", "")
    journalist1_email = record.get("기자1_이메일", "")

    # 기자 2
    journalist2_name = record.get("기자2_이름", "")
    journalist2_email = record.get("기자2_이메일", "")

    # 기자 1 추가
    if journalist1_name and media_outlet and region:
        cleaned_data.append({
            "region_type": region_type,
            "region": region,
            "parent_region": None,
            "media_outlet": media_outlet,
            "journalist_name": journalist1_name,
            "email": journalist1_email if journalist1_email and journalist1_email != "확인불가" else None,
        })

    # 기자 2 추가
    if journalist2_name and media_outlet and region:
        cleaned_data.append({
            "region_type": region_type,
            "region": region,
            "parent_region": None,
            "media_outlet": media_outlet,
            "journalist_name": journalist2_name,
            "email": journalist2_email if journalist2_email and journalist2_email != "확인불가" else None,
        })

print(f"[OK] 변환 완료: {len(cleaned_data)}개 기자 레코드")

# Batch insert
print("\n[*] 데이터 입력 중...")
batch_size = 500
total_inserted = 0

for i in range(0, len(cleaned_data), batch_size):
    batch = cleaned_data[i:i+batch_size]
    try:
        result = supabase.table("journalist_contacts").insert(batch).execute()
        inserted = len(batch)
        total_inserted += inserted
        progress = min(i + batch_size, len(cleaned_data))
        print(f"  [{progress}/{len(cleaned_data)}] {inserted}개 입력 (누적: {total_inserted}개)")
    except Exception as e:
        print(f"  [NG] 배치 입력 실패: {str(e)[:150]}")

print(f"\n[OK] 완료! 총 {total_inserted}개 기자 데이터 저장됨")

# 확인
print("\n[*] 저장 현황 확인...")
try:
    result = supabase.table("journalist_contacts").select("COUNT(*)", count="exact").execute()
    print(f"  - 전체: {result.count}개")

    metro = supabase.table("journalist_contacts").select("COUNT(*)", count="exact").eq("region_type", "광역").execute()
    basic = supabase.table("journalist_contacts").select("COUNT(*)", count="exact").eq("region_type", "기초").execute()

    print(f"  - 광역: {metro.count}개")
    print(f"  - 기초: {basic.count}개")
except Exception as e:
    print(f"  [NG] 확인 실패: {e}")

print("=" * 70)
