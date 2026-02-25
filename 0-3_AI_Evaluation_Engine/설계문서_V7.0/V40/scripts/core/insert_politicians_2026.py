#!/usr/bin/env python3
"""
2026년 1월-2월 최신 여론조사 정치인 정보 DB 저장
- 강원도지사 (4명)
- 충청남도지사 (4명)
- 인천시장 (4명)
"""

import os
import uuid
from datetime import datetime
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
print("2026년 최신 여론조사 정치인 정보 DB 저장")
print("=" * 70)

# 정치인 데이터 (여론조사 기준)
politicians = [
    # 강원도지사 (2026.02 MBC 여론조사)
    {
        "name": "우상호",
        "party": "더불어민주당",
        "position": "국민권익위원장 전)",
        "region": "강원특별자치도",
        "district": "",
        "birth_date": "1960-05-08",
        "gender": "male",
        "title": "광역단체장",
        "identity": "출마예정자",
        "career": ["국회의원", "청와대 정무수석", "권익위원장"],
        "previous_position": "국민권익위원장",
        "poll_rank": 1,
        "poll_support": "45.4%",
    },
    {
        "name": "김진태",
        "party": "국민의힘",
        "position": "강원도지사",
        "region": "강원특별자치도",
        "district": "",
        "birth_date": "1963-04-02",
        "gender": "male",
        "title": "광역단체장",
        "identity": "현직",
        "career": ["국회의원", "강원도의원", "강원도지사"],
        "previous_position": "국회의원",
        "poll_rank": 2,
        "poll_support": "31.4%",
    },
    {
        "name": "염동열",
        "party": "국민의힘",
        "position": "국회의원 (전)",
        "region": "강원특별자치도",
        "district": "",
        "birth_date": "1963-01-12",
        "gender": "male",
        "title": "광역단체장",
        "identity": "출마예정자",
        "career": ["국회의원"],
        "previous_position": "국회의원",
        "poll_rank": 3,
        "poll_support": "5.8%",
    },
    # 충청남도지사 (2026.01 여론조사)
    {
        "name": "강훈식",
        "party": "더불어민주당",
        "position": "대통령 비서실장",
        "region": "충청남도",
        "district": "",
        "birth_date": "1965-08-15",
        "gender": "male",
        "title": "광역단체장",
        "identity": "출마예정자",
        "career": ["국회의원", "청와대 비서실장"],
        "previous_position": "청와대 비서실장",
        "poll_rank": 1,
        "poll_support": "26.7%",
    },
    {
        "name": "김태흠",
        "party": "국민의힘",
        "position": "충청남도지사",
        "region": "충청남도",
        "district": "",
        "birth_date": "1960-01-20",
        "gender": "male",
        "title": "광역단체장",
        "identity": "현직",
        "career": ["국회의원", "충청남도지사"],
        "previous_position": "국회의원",
        "poll_rank": 2,
        "poll_support": "23%",
    },
    {
        "name": "이장우",
        "party": "국민의힘",
        "position": "대전시장",
        "region": "충청남도",
        "district": "",
        "birth_date": "1961-02-10",
        "gender": "male",
        "title": "광역단체장",
        "identity": "출마예정자",
        "career": ["국회의원", "대전시장"],
        "previous_position": "대전시장",
        "poll_rank": 3,
        "poll_support": "11.6%",
    },
    {
        "name": "양승조",
        "party": "더불어민주당",
        "position": "충청남도지사 (전)",
        "region": "충청남도",
        "district": "",
        "birth_date": "1959-03-18",
        "gender": "male",
        "title": "광역단체장",
        "identity": "출마예정자",
        "career": ["국회의원", "충청남도지사"],
        "previous_position": "충청남도지사",
        "poll_rank": 4,
        "poll_support": "9.3%",
    },
    # 인천시장 (2026.01 리얼미터 여론조사)
    {
        "name": "박찬대",
        "party": "더불어민주당",
        "position": "국회의원",
        "region": "인천광역시",
        "district": "인천광역시",
        "birth_date": "1965-11-29",
        "gender": "male",
        "title": "기초단체장",
        "identity": "출마예정자",
        "career": ["국회의원"],
        "previous_position": "국회의원",
        "poll_rank": 1,
        "poll_support": "40.5%",
    },
    {
        "name": "박남춘",
        "party": "더불어민주당",
        "position": "인천시장 (전)",
        "region": "인천광역시",
        "district": "인천광역시",
        "birth_date": "1956-08-24",
        "gender": "male",
        "title": "기초단체장",
        "identity": "출마예정자",
        "career": ["국회의원", "인천시장"],
        "previous_position": "인천시장",
        "poll_rank": 2,
        "poll_support": "9.8%",
    },
    {
        "name": "김교흥",
        "party": "더불어민주당",
        "position": "국회의원",
        "region": "인천광역시",
        "district": "인천광역시",
        "birth_date": "1962-07-12",
        "gender": "male",
        "title": "기초단체장",
        "identity": "출마예정자",
        "career": ["국회의원"],
        "previous_position": "국회의원",
        "poll_rank": 3,
        "poll_support": "5.4%",
    },
    {
        "name": "정일영",
        "party": "더불어민주당",
        "position": "국회의원",
        "region": "인천광역시",
        "district": "인천광역시",
        "birth_date": "1964-05-06",
        "gender": "male",
        "title": "기초단체장",
        "identity": "출마예정자",
        "career": ["국회의원"],
        "previous_position": "국회의원",
        "poll_rank": 4,
        "poll_support": "4.0%",
    },
]

print(f"\n[*] {len(politicians)}명의 정치인 정보를 DB에 저장 중...")

try:
    total_saved = 0
    for politician in politicians:
        # 고유 ID 생성
        politician_id = str(uuid.uuid4())[:8]

        # DB에 저장할 데이터
        data = {
            "id": politician_id,
            "name": politician["name"],
            "party": politician["party"],
            "position": politician["position"],
            "previous_position": politician["previous_position"],
            "region": politician["region"],
            "district": politician["district"],
            "birth_date": politician["birth_date"],
            "gender": politician["gender"],
            "identity": politician["identity"],
            "title": politician["title"],
            "career": politician["career"],
            "poll_rank": politician["poll_rank"],
            "poll_support": politician["poll_support"],
        }

        # DB 저장
        result = supabase.table("politicians").insert(data).execute()
        total_saved += 1

        print(f"  [{total_saved}/{len(politicians)}] {politician['name']} ({politician['party']}) - 순위: {politician['poll_rank']}위 ({politician['poll_support']})")

    print(f"\n[OK] 총 {total_saved}명 저장 완료!")

    # 저장 확인
    print("\n[*] 저장 현황 확인...")
    result = supabase.table("politicians").select("COUNT(*)", count="exact").execute()
    print(f"  총 정치인: {len(result.data)}명")

except Exception as e:
    print(f"\n[NG] 오류: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("완료!")
print("=" * 70)
