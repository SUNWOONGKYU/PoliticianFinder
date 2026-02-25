#!/usr/bin/env python3
"""
journalist_contacts 테이블에 기자 데이터 직접 insert
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
print("기자 데이터 입력")
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

# 데이터 정제
print("\n[*] 데이터 정제 중...")
cleaned_data = []
for record in all_data:
    cleaned = {
        "region_type": record.get("region_type", ""),
        "region": record.get("region", ""),
        "parent_region": record.get("parent_region") or None,
        "media_outlet": record.get("media_outlet", ""),
        "journalist_name": record.get("journalist_name", ""),
        "email": record.get("email") if record.get("email") and record.get("email") != "확인불가" else None,
    }

    if cleaned["region_type"] and cleaned["region"] and cleaned["media_outlet"] and cleaned["journalist_name"]:
        cleaned_data.append(cleaned)

print(f"[OK] 유효한 데이터: {len(cleaned_data)}개")

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
        print(f"  [NG] 배치 입력 실패: {str(e)[:100]}")

print(f"\n[OK] 완료! 총 {total_inserted}개 기자 데이터 저장됨")
print("=" * 70)
