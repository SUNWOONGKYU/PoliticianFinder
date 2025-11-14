#!/usr/bin/env python3
"""
Run P3F4 database migration: Add official information fields
Uses Supabase Admin API to execute SQL directly
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('1_Frontend/.env.local')

# Get Supabase credentials
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("Error: Supabase credentials not found in .env.local")
    print("\nPlease check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

print("=== P3F4: Adding Official Information Fields ===\n")

try:
    # Create Supabase client
    print("Connecting to Supabase...")
    supabase: Client = create_client(supabase_url, supabase_key.strip())
    print("[OK] Connected\n")

    # Step 1: Add columns using Supabase SQL
    print("Step 1: Adding new columns...")

    # Note: Supabase Python client doesn't support direct SQL execution
    # We need to execute SQL via Supabase SQL Editor or use PostgREST RPC
    # For now, we'll use the Supabase table operations

    print("[INFO] Adding columns via Supabase...")
    print("Note: Column additions need to be done via Supabase SQL Editor")
    print("\nPlease run the following SQL in Supabase Studio > SQL Editor:")
    print("-" * 70)
    alter_sql = """
ALTER TABLE politicians
  ADD COLUMN IF NOT EXISTS name_kanji VARCHAR(200),
  ADD COLUMN IF NOT EXISTS career JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS election_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS military_service VARCHAR(500),
  ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tax_arrears VARCHAR(500) DEFAULT '없음',
  ADD COLUMN IF NOT EXISTS criminal_record VARCHAR(500) DEFAULT '없음',
  ADD COLUMN IF NOT EXISTS military_service_issue VARCHAR(500) DEFAULT '없음',
  ADD COLUMN IF NOT EXISTS residency_fraud VARCHAR(500) DEFAULT '없음',
  ADD COLUMN IF NOT EXISTS pledges JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS legislative_activity JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN politicians.name_kanji IS '한자 이름 (예: 金民俊)';
COMMENT ON COLUMN politicians.career IS '경력 (배열)';
COMMENT ON COLUMN politicians.election_history IS '당선 이력 (배열)';
COMMENT ON COLUMN politicians.military_service IS '병역';
COMMENT ON COLUMN politicians.assets IS '재산 공개 (객체)';
COMMENT ON COLUMN politicians.tax_arrears IS '세금 체납';
COMMENT ON COLUMN politicians.criminal_record IS '범죄 경력';
COMMENT ON COLUMN politicians.military_service_issue IS '병역 의혹';
COMMENT ON COLUMN politicians.residency_fraud IS '위장전입';
COMMENT ON COLUMN politicians.pledges IS '주요 공약 (배열)';
COMMENT ON COLUMN politicians.legislative_activity IS '의정 활동 (객체)';
"""
    print(alter_sql)
    print("-" * 70)
    print("\nAfter running the SQL, press Enter to continue with sample data update...")
    input()

    # Step 2: Update sample data using Supabase client
    print("\nStep 2: Updating sample data for '김민준'...")
    print("[INFO] Using Supabase client to update data...")

    # Prepare sample data
    sample_data = {
        "name_kanji": "金民俊",
        "career": [
            "前 국회 법제사법위원회 위원 (2020~2024)",
            "前 더불어민주당 정책위원회 부의장 (2018~2020)",
            "前 법무법인 광장 변호사 (2008~2015)",
            "前 대통령비서실 행정관 (2006~2008)"
        ],
        "election_history": [
            "제21대 국회의원 (2020년 당선, 서울 강남구)",
            "제20대 국회의원 (2016년 당선, 서울 강남구)"
        ],
        "military_service": "육군 만기 제대 (1999~2001)",
        "assets": {
            "total": "약 15억원 (2024년 기준)",
            "real_estate": "약 12억원 (서울 강남구 아파트)",
            "financial": "약 3억원"
        },
        "tax_arrears": "없음",
        "criminal_record": "없음",
        "military_service_issue": "없음",
        "residency_fraud": "없음",
        "pledges": [
            "강남구 교통 혼잡 완화 (GTX-C 조기 개통)",
            "청년 주택 공급 확대 (연 1,000가구)",
            "노후 학교 시설 현대화 (10개교)"
        ],
        "legislative_activity": {
            "attendance_rate": "95% (21대 국회 평균 92%)",
            "bills_proposed": 42,
            "bills_representative": 28,
            "bills_co_proposed": 14,
            "bills_passed": 18
        }
    }

    # Update using Supabase client
    result = supabase.table('politicians') \
        .update(sample_data) \
        .eq('name', '김민준') \
        .execute()

    if result.data:
        print(f"[OK] Updated {len(result.data)} politician(s)\n")
    else:
        print("[WARNING] No politician named '김민준' found to update\n")

    # Step 3: Verify
    print("Step 3: Verifying changes...")
    verify_result = supabase.table('politicians') \
        .select('name, name_kanji, career, election_history, military_service, tax_arrears, criminal_record') \
        .eq('name', '김민준') \
        .execute()

    if verify_result.data and len(verify_result.data) > 0:
        pol = verify_result.data[0]
        print("[OK] Verification successful:")
        print(f"  - Name: {pol.get('name')}")
        print(f"  - Name Kanji: {pol.get('name_kanji')}")
        print(f"  - Career entries: {len(pol.get('career', []))}")
        print(f"  - Election history: {len(pol.get('election_history', []))}")
        print(f"  - Military service: {pol.get('military_service')}")
        print(f"  - Tax arrears: {pol.get('tax_arrears')}")
        print(f"  - Criminal record: {pol.get('criminal_record')}")
    else:
        print("[WARNING] No politician named '김민준' found")

    print("\n=== Migration Complete ===")
    print("[OK] Sample data updated for politician '김민준'")
    print("\nNext steps:")
    print("1. Verify the data in Supabase Studio")
    print("2. Test the API endpoints with new fields")
    print("3. Add more politician data with official information")

except Exception as e:
    print(f"\n[ERROR] Migration failed: {str(e)}")
    import traceback
    traceback.print_exc()
    exit(1)
