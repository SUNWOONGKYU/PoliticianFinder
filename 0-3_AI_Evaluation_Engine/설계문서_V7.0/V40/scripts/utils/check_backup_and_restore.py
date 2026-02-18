#!/usr/bin/env python3
"""
Supabase 백업 확인 및 복원 가이드
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, timedelta

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
ENV_PATH = SCRIPT_DIR.parent.parent / '.env'

# .env 파일 로드
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)

SUPABASE_URL = os.getenv('SUPABASE_URL')
project_ref = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')

print("\n" + "="*60)
print("Supabase PITR 백업 복원 가이드")
print("="*60 + "\n")

print("프로젝트:", project_ref)
print()

# 복원 가능한 시점 추정
now = datetime.now()
suggested_times = [
    now - timedelta(hours=1),   # 1시간 전
    now - timedelta(hours=2),   # 2시간 전
    now - timedelta(hours=6),   # 6시간 전
    now - timedelta(days=1),    # 1일 전
]

print("="*60)
print("1. 백업 확인")
print("="*60)
print("\nSupabase Dashboard 접속:")
print(f"https://supabase.com/dashboard/project/{project_ref}/settings/database")
print()
print("→ 'Backups' 탭 클릭")
print("→ 'Point-in-Time Recovery' 섹션 확인")
print()
print("복원 가능 기간:")
print("  - Pro 플랜: 최근 7일")
print("  - Team 플랜: 최근 14일")
print("  - Enterprise: 커스텀")
print()

print("="*60)
print("2. 복원 시점 선택")
print("="*60)
print("\n권장 복원 시점 (테이블 삭제 직전):\n")
for i, time in enumerate(suggested_times, 1):
    print(f"  {i}. {time.strftime('%Y-%m-%d %H:%M:%S')} ({time.strftime('%Y-%m-%dT%H:%M:%SZ')} UTC)")
print()
print("※ 테이블이 정확히 언제 삭제되었는지 확인하고,")
print("  그 직전 시점을 선택하세요.")
print()

print("="*60)
print("3. 복원 방법")
print("="*60)
print()

print("방법 A: Dashboard에서 복원 (권장)")
print("-" * 60)
print(f"1. https://supabase.com/dashboard/project/{project_ref}/settings/database")
print("2. 'Backups' 탭 → 'Point-in-Time Recovery'")
print("3. 복원 시점 선택 (위 권장 시점 참고)")
print("4. 'Restore' 버튼 클릭")
print("5. 확인 후 실행")
print()

print("방법 B: CLI로 복원")
print("-" * 60)
print("# Supabase CLI 설치 (없는 경우)")
print("npm install -g supabase")
print()
print("# 프로젝트 링크")
print(f"supabase link --project-ref {project_ref}")
print()
print("# 복원 실행 (예시: 1시간 전)")
restore_time = suggested_times[0].strftime('%Y-%m-%dT%H:%M:%SZ')
print(f"supabase db restore --timestamp \"{restore_time}\"")
print()

print("="*60)
print("4. 복원 후 확인")
print("="*60)
print()
print("복원이 완료되면 테이블 확인:")
print()
print("python check_v40_tables.py")
print()
print("예상 결과:")
print("  [OK] collected_data_v40: 존재 (조은희 데이터 포함)")
print("  [OK] evaluations_v40: 존재")
print("  [OK] scores_v40: 존재")
print()

print("="*60)
print("5. 주의사항")
print("="*60)
print()
print("⚠️  PITR 복원은 전체 데이터베이스를 복원합니다.")
print("    복원 시점 이후의 다른 테이블 변경사항도 되돌려집니다.")
print()
print("⚠️  복원 전에 현재 상태를 백업하는 것을 권장합니다.")
print()
print("⚠️  복원 소요 시간: 데이터베이스 크기에 따라 수분~수십분")
print()

print("="*60)
print("지금 복원을 시작하시겠습니까?")
print("="*60)
print()
print("Dashboard 열기:")
print(f"  https://supabase.com/dashboard/project/{project_ref}/settings/database")
print()
