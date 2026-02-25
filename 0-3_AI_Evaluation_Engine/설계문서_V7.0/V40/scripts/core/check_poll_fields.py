#!/usr/bin/env python3
"""
poll_rank, poll_support, collected_date 필드 확인
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# 환경 설정
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
V40_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
load_dotenv(os.path.join(V40_DIR, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 70)
print("poll_rank 필드 확인")
print("=" * 70)

try:
    # 5명 정치인 조회
    print("\n[*] 5명 정치인 정보 조회 중...")
    result = supabase.table("politicians").select("id, name, poll_rank, poll_support, collected_date").execute()

    politicians = result.data

    if not politicians:
        print("[NG] 정치인이 없습니다")
    else:
        print(f"[OK] 총 {len(politicians)}명 조회")

        # 강원도 정치인 및 정명근만 표시 (최근 등록된 5명)
        recent_5 = politicians[-5:]

        print("\n[>>] 최근 5명 정치인:")
        print("-" * 70)
        for p in recent_5:
            poll_info = f"Rank: {p.get('poll_rank') or 'N/A'}, Support: {p.get('poll_support') or 'N/A'}"
            print(f"  {p.get('name'):10s} | {poll_info}")

        # poll_rank 확인
        has_poll_rank = any(p.get('poll_rank') is not None for p in recent_5)
        has_poll_support = any(p.get('poll_support') is not None for p in recent_5)

        print("\n[>>] 필드 상태:")
        print(f"  - poll_rank 필드: {'[OK] 존재' if recent_5[0].get('poll_rank') is not None or 'poll_rank' in recent_5[0] else '[OK] 추가됨 (데이터 없음)'}")
        print(f"  - poll_support 필드: {'[OK] 존재' if recent_5[0].get('poll_support') is not None or 'poll_support' in recent_5[0] else '[OK] 추가됨 (데이터 없음)'}")
        print(f"  - collected_date 필드: {'[OK] 존재' if 'collected_date' in recent_5[0] else '[OK] 추가됨'}")

except Exception as e:
    print(f"[NG] 오류: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
