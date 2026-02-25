#!/usr/bin/env python3
"""
나무위키에서 제9회 지방선거(2026년) 여론조사 데이터 수집
"""

import os
import json
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
REPORTS_DIR = os.path.join(V40_DIR, "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

load_dotenv(os.path.join(V40_DIR, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

print("=" * 70)
print("나무위키에서 제9회 지방선거(2026년) 여론조사 정보 수집")
print("=" * 70)

# 광역단체 정보
METRO_REGIONS = {
    "서울특별시": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/서울특별시",
    "부산광역시": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/부산광역시",
    "대구광역시": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/대구광역시",
    "인천광역시": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/인천광역시",
    "광주광역시": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/광주광역시",
    "대전광역시": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/대전광역시",
    "울산광역시": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/울산광역시",
    "세종특별자치시": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/세종특별자치시",
    "경기도": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/경기도",
    "강원특별자치도": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/강원특별자치도",
    "충청북도": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/충청북도",
    "충청남도": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/충청남도",
    "전북특별자치도": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/전북특별자치도",
    "전라남도": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/전라남도",
    "경상북도": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/경상북도",
    "경상남도": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/경상남도",
    "제주특별자치도": "https://namu.wiki/w/제9회%20전국동시지방선거/여론조사/제주특별자치도",
}

def fetch_and_parse(url, region_name):
    """나무위키 페이지 접속 후 여론조사 데이터 추출"""
    try:
        print(f"\n[*] {region_name} 접속 중...")
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, "html.parser")

        # 문서 타이틀
        title = soup.find("h1")
        if title:
            print(f"[OK] {title.get_text(strip=True)}")

        # 모든 테이블 찾기 (여론조사 테이블)
        tables = soup.find_all("table")
        print(f"  테이블 개수: {len(tables)}")

        # 간단한 샘플 출력
        if tables:
            table = tables[0]
            rows = table.find_all("tr")[:5]  # 처음 5개 행
            for i, row in enumerate(rows):
                cells = row.find_all(["td", "th"])
                text = " | ".join([cell.get_text(strip=True)[:20] for cell in cells[:4]])
                print(f"  행 {i}: {text}")

        return soup

    except Exception as e:
        print(f"[NG] 오류: {e}")
        return None

# 테스트: 강원도 페이지
print("\n[TEST] 강원도 여론조사 페이지 테스트...")
soup = fetch_and_parse(METRO_REGIONS["강원특별자치도"], "강원특별자치도")

if soup:
    # 페이지 저장
    with open("/tmp/namu_gangwon.html", "w", encoding="utf-8") as f:
        f.write(soup.prettify())
    print("\n[OK] 페이지 저장: /tmp/namu_gangwon.html")

    # 텍스트 콘텐츠 출력 (처음 2000자)
    text = soup.get_text()
    print("\n[>>] 페이지 콘텐츠 (처음 2000자):")
    print(text[:2000])

print("\n" + "=" * 70)
print("\n분석 결과:")
print("- 나무위키에서 HTML 추출 성공")
print("- 다음 단계: 테이블 파싱 및 여론조사 데이터 추출")
print("=" * 70)
