#!/usr/bin/env python3
"""
Check politicians table schema and verify all required fields exist
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Initialize Supabase client
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("Error: Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key.strip())

# Get a sample politician record to see the schema
response = supabase.table('politicians').select('*').limit(1).execute()

if response.data and len(response.data) > 0:
    politician = response.data[0]
    print("=== Current Politicians Table Schema ===\n")
    print("Columns found in database:")
    for key in sorted(politician.keys()):
        value = politician[key]
        value_type = type(value).__name__
        print(f"  - {key}: {value_type}")

    print("\n=== Fields Required by Frontend (politicians/[id]/page.tsx) ===\n")

    required_fields = {
        # Basic Info
        "id": "string",
        "name": "string",
        "nameKanji": "string (한자 이름)",
        "identity": "string (신분: 현직, 후보자 등)",
        "title": "string (직책: 국회의원 (21대) 등)",
        "position": "string (출마직종: 국회의원 등)",
        "party": "string (소속 정당)",
        "region": "string (지역)",
        "birthDate": "string (생년월일)",
        "age": "number (나이)",
        "gender": "string (성별)",

        # AI Scores
        "claudeScore": "number (클로드 평점)",
        "totalScore": "number (종합평점)",
        "grade": "string (평가등급)",
        "lastUpdated": "string (최종 갱신일시)",

        # Community Activity (needed for display)
        "postCount": "number (작성한 게시글 수)",
        "likeCount": "number (받은 공감 수)",
        "taggedCount": "number (태깅된 게시글 수)",

        # Election Commission Info
        "education": "array (학력)",
        "career": "array (경력)",
        "electionHistory": "array (당선 이력)",
        "militaryService": "string (병역)",
        "assets": "object (재산 공개)",
        "taxArrears": "string (세금 체납)",
        "criminalRecord": "string (범죄 경력)",
        "militaryServiceIssue": "string (병역 의혹)",
        "residencyFraud": "string (위장전입)",
        "pledges": "array (주요 공약)",
        "legislativeActivity": "object (의정 활동: 출석률, 발의 법안 등)",
    }

    print("Frontend Required Fields:")
    for field, description in required_fields.items():
        exists = "[OK]" if field in politician else "[MISSING]"
        print(f"  {exists} {field}: {description}")

    print("\n=== Missing Fields Analysis ===\n")

    missing_fields = []
    for field in required_fields.keys():
        if field not in politician:
            missing_fields.append(field)

    if missing_fields:
        print(f"Missing {len(missing_fields)} fields:")
        for field in missing_fields:
            print(f"  [X] {field}: {required_fields[field]}")
    else:
        print("[OK] All required fields exist!")

    print("\n=== Extra Fields in Database ===\n")
    extra_fields = []
    for field in politician.keys():
        if field not in required_fields:
            extra_fields.append(field)

    if extra_fields:
        print(f"Found {len(extra_fields)} extra fields (not used in frontend):")
        for field in extra_fields:
            print(f"  - {field}")

    print("\n=== Recommendations ===\n")

    if missing_fields:
        print("Database Migration Required:")
        print("\nALTER TABLE politicians")
        for field in missing_fields:
            field_type = required_fields[field]
            if "array" in field_type:
                sql_type = "JSONB DEFAULT '[]'::jsonb"
            elif "object" in field_type:
                sql_type = "JSONB DEFAULT '{}'::jsonb"
            elif "number" in field_type:
                sql_type = "INTEGER DEFAULT 0"
            else:
                sql_type = "VARCHAR(500)"
            print(f"  ADD COLUMN IF NOT EXISTS {field} {sql_type},")
        print(";")
    else:
        print("[OK] No database migration needed - all fields exist!")

else:
    print("No politicians found in database. Cannot check schema.")
