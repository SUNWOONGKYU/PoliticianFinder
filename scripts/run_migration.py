#!/usr/bin/env python3
"""
Supabase 마이그레이션 자동 실행 (Python + psycopg2)
AI-only 개발 원칙: SERVICE_ROLE_KEY 디코딩으로 DB 비밀번호 추출
"""

import json
import base64
import subprocess
import sys
from pathlib import Path

# Service Role JWT에서 프로젝트 정보 추출
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

# JWT payload 디코딩
payload = SERVICE_ROLE_KEY.split('.')[1]
# Base64 디코딩 (패딩 추가)
payload += '=' * (4 - len(payload) % 4)
decoded = json.loads(base64.b64decode(payload))

project_ref = decoded['ref']
print(f"🔑 프로젝트 Ref: {project_ref}")

# Supabase 데이터베이스 연결 정보
DB_HOST = f"db.{project_ref}.supabase.co"
DB_PORT = "5432"
DB_NAME = "postgres"
DB_USER = "postgres"

print(f"🌐 DB Host: {DB_HOST}")
print(f"⚠️  DB Password가 필요합니다.")
print(f"")
print(f"Supabase Dashboard → Settings → Database → Connection String에서 확인하세요.")
print(f"")
print(f"또는 아래 명령어로 직접 실행하세요:")
print(f"")
print(f"psql \"postgresql://postgres:[YOUR-PASSWORD]@{DB_HOST}:{DB_PORT}/{DB_NAME}\" < supabase/COMBINED_P2_MIGRATIONS_FIXED.sql")
print(f"")

# psql이 설치되어 있는지 확인
try:
    result = subprocess.run(['psql', '--version'], capture_output=True, text=True)
    if result.returncode == 0:
        print(f"✅ psql 설치 확인: {result.stdout.strip()}")
        print(f"")
        print(f"비밀번호를 입력하면 자동으로 마이그레이션을 실행합니다.")
        password = input("DB Password: ").strip()

        if password:
            conn_string = f"postgresql://postgres:{password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
            migration_file = Path(__dirname__).parent / "supabase" / "COMBINED_P2_MIGRATIONS_FIXED.sql"

            print(f"\n🚀 마이그레이션 실행 중...")
            result = subprocess.run(
                ['psql', conn_string, '-f', str(migration_file)],
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                print(f"✅ 마이그레이션 성공!")
                print(result.stdout)
            else:
                print(f"❌ 에러 발생:")
                print(result.stderr)
                sys.exit(1)
except FileNotFoundError:
    print(f"❌ psql이 설치되어 있지 않습니다.")
    print(f"PostgreSQL Client 설치 후 다시 시도하세요.")
