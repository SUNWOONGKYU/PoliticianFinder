#!/usr/bin/env python3
"""
journalist_contacts 테이블 생성 및 데이터 insert
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
print("journalist_contacts 테이블 생성 및 데이터 입력")
print("=" * 70)

# Step 1: 테이블 생성 여부 확인
print("\n[*] journalist_contacts 테이블 확인 중...")
try:
    result = supabase.table("journalist_contacts").select("COUNT(*)", count="exact").execute()
    print("[OK] 테이블이 이미 존재합니다")
    existing_count = result.count
    print(f"  기존 데이터: {existing_count}개")
except Exception as e:
    print(f"[!] 테이블 없음, 생성이 필요합니다")
    print("  Supabase Dashboard > SQL Editor에서 다음 SQL을 실행하세요:")
    print("""
    CREATE TABLE IF NOT EXISTS journalist_contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      region_type TEXT NOT NULL,
      region TEXT NOT NULL,
      parent_region TEXT,
      media_outlet TEXT NOT NULL,
      journalist_name TEXT NOT NULL,
      email TEXT,
      verified BOOLEAN DEFAULT FALSE,
      last_contacted_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_journalist_contacts_region ON journalist_contacts(region);
    CREATE INDEX IF NOT EXISTS idx_journalist_contacts_region_type ON journalist_contacts(region_type);
    CREATE INDEX IF NOT EXISTS idx_journalist_contacts_email ON journalist_contacts(email);
    CREATE INDEX IF NOT EXISTS idx_journalist_contacts_media_outlet ON journalist_contacts(media_outlet);
    """)
    exit(1)

# Step 2: 데이터 로드
print("\n[*] 기자 데이터 파일 로드 중...")

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
    else:
        print(f"[NG] 파일 없음: {filepath}")

if not all_data:
    print("[NG] 데이터가 없습니다")
    exit(1)

print(f"\n[OK] 총 {len(all_data)}개 기자 데이터 로드 완료")

# Step 3: 데이터 정제
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
        "verified": False,
    }

    # 필수 필드 확인
    if cleaned["region_type"] and cleaned["region"] and cleaned["media_outlet"] and cleaned["journalist_name"]:
        cleaned_data.append(cleaned)

print(f"[OK] 유효한 데이터: {len(cleaned_data)}개 (원본: {len(all_data)}개)")

# Step 4: Batch insert (1000개씩)
print("\n[*] Supabase에 데이터 입력 중...")
batch_size = 1000
total_inserted = 0

for i in range(0, len(cleaned_data), batch_size):
    batch = cleaned_data[i:i+batch_size]
    try:
        result = supabase.table("journalist_contacts").insert(batch).execute()
        inserted = len(batch)
        total_inserted += inserted
        print(f"  [{i//batch_size + 1}] {inserted}개 입력 완료 (누적: {total_inserted}개)")
    except Exception as e:
        print(f"  [NG] 배치 입력 실패: {e}")
        continue

print(f"\n[OK] 총 {total_inserted}개 기자 정보 저장 완료")

# Step 5: 확인
print("\n[*] 저장된 데이터 확인 중...")
try:
    result = supabase.table("journalist_contacts").select("COUNT(*)", count="exact").execute()
    print(f"[OK] journalist_contacts 테이블: {result.count}개")

    # 광역/기초 분류
    metro = supabase.table("journalist_contacts").select("COUNT(*)", count="exact").eq("region_type", "광역").execute()
    basic = supabase.table("journalist_contacts").select("COUNT(*)", count="exact").eq("region_type", "기초").execute()

    print(f"\n[>>] 지역별 분류:")
    print(f"  - 광역: {metro.count}개")
    print(f"  - 기초: {basic.count}개")

    # 이메일 보유 현황
    with_email = supabase.table("journalist_contacts").select("COUNT(*)", count="exact").not_.is_("email", "null").execute()
    print(f"\n[>>] 이메일 보유:")
    print(f"  - 이메일 있음: {with_email.count}개")
    print(f"  - 이메일 없음: {result.count - with_email.count}개")

except Exception as e:
    print(f"[NG] 확인 중 오류: {e}")

print("\n" + "=" * 70)
print("완료!")
print("=" * 70)
