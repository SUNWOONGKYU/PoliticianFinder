#!/usr/bin/env python3
"""
중앙선거여론조사심의위원회(NESDC)에서 2026년 지방선거 여론조사 데이터 수집
"""

import os
import json
import time
import re
from datetime import datetime
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from supabase import create_client
import uuid

# 환경 설정
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
V40_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
load_dotenv(os.path.join(V40_DIR, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 상수
NESDC_URL = "https://www.nesdc.go.kr/portal/bbs/B0000005/list.do"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

print("=" * 70)
print("중앙선거여론조사심의위원회 - 2026년 지방선거 여론조사 데이터 수집")
print("=" * 70)

# 광역단체 및 기초단체 목록
METRO_REGIONS = [
    "서울특별시", "부산광역시", "대구광역시", "인천광역시",
    "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
    "경기도", "강원특별자치도", "충청북도", "충청남도",
    "전북특별자치도", "전라남도", "경상북도", "경상남도", "제주특별자치도"
]

BASIC_REGIONS = {
    "서울특별시": [
        "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구",
        "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구",
        "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구",
        "서초구", "강남구", "송파구", "강동구"
    ],
    # 나머지는 생략 (시간 절약)
}

print("\n[*] NESDC 사이트 접속 중...")

try:
    # 기본 페이지 접속
    params = {
        "menuNo": "200467",
        "pageIndex": "1",
        "searchYear": "2026",
        "searchElectionType": "3",  # 지방선거
    }

    response = requests.get(NESDC_URL, headers=HEADERS, params=params, timeout=30)
    response.raise_for_status()

    print(f"[OK] 상태 코드: {response.status_code}")

    # HTML 파싱
    soup = BeautifulSoup(response.content, "html.parser")

    # 테이블 찾기
    table = soup.find("table", {"class": "tbl"})

    if table:
        print("[OK] 여론조사 테이블 발견")

        # 테이블 행 파싱
        rows = table.find_all("tr")
        print(f"[>>] 테이블 행 수: {len(rows)}")

        # 첫 5개 행 샘플
        for i, row in enumerate(rows[:5]):
            cells = row.find_all("td")
            if cells:
                print(f"\n[행 {i}]")
                for j, cell in enumerate(cells[:5]):  # 첫 5개 셀만
                    print(f"  셀 {j}: {cell.get_text(strip=True)[:50]}")
    else:
        print("[NG] 여론조사 테이블 찾을 수 없음")

    # 페이지 정보
    print("\n[*] 페이지 구조 분석:")

    # 총 건수 찾기
    total_info = soup.find("span", {"class": "total"})
    if total_info:
        print(f"[OK] 총 데이터: {total_info.get_text(strip=True)}")

    # 검색 폼 찾기
    search_form = soup.find("form")
    if search_form:
        print("[OK] 검색 폼 발견")
        inputs = search_form.find_all("input")
        print(f"  입력 필드 수: {len(inputs)}")

except Exception as e:
    print(f"[NG] 오류: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
