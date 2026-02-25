#!/usr/bin/env python3
"""
Selenium을 사용한 NESDC 웹사이트 크롤링
JavaScript 렌더링 대기 후 데이터 추출
"""

import os
import json
import time
from datetime import datetime
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup

# 환경 설정
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
V40_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))

print("=" * 70)
print("Selenium을 사용한 NESDC 데이터 수집")
print("=" * 70)

try:
    print("\n[*] Chrome 드라이버 시작...")

    # Chrome 옵션 설정
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    # options.add_argument("--headless")  # 헤드리스 모드 비활성화 (테스트용)

    driver = webdriver.Chrome(options=options)

    print("[OK] 드라이버 시작 완료")

    # NESDC 사이트 접속
    print("\n[*] NESDC 사이트 접속 중...")
    url = "https://www.nesdc.go.kr/portal/bbs/B0000005/list.do?menuNo=200467"
    driver.get(url)

    print("[OK] 페이지 로드 완료")

    # 페이지 렌더링 대기 (최대 10초)
    print("[*] JavaScript 렌더링 대기 중...")
    time.sleep(5)

    # 현재 HTML 저장
    html = driver.page_source
    with open("/tmp/nesdc_page.html", "w", encoding="utf-8") as f:
        f.write(html)

    print("[OK] HTML 저장: /tmp/nesdc_page.html")

    # BeautifulSoup으로 파싱
    soup = BeautifulSoup(html, "html.parser")

    # 모든 테이블 찾기
    tables = soup.find_all("table")
    print(f"\n[>>] 찾은 테이블 개수: {len(tables)}")

    # 모든 div 클래스 출력 (구조 파악용)
    divs = soup.find_all("div", limit=50)
    print(f"\n[>>] div 요소 샘플 (처음 10개의 클래스):")
    for i, div in enumerate(divs[:10]):
        classes = div.get("class", [])
        if classes:
            print(f"  {i}: {' '.join(classes)}")

    # 텍스트 콘텐츠 출력
    print(f"\n[>>] 페이지 텍스트 (처음 1000자):")
    text = soup.get_text()
    print(text[:1000])

    driver.quit()
    print("\n[OK] 드라이버 종료")

except Exception as e:
    print(f"\n[NG] 오류: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
