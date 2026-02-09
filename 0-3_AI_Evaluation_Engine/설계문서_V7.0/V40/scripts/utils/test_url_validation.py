# -*- coding: utf-8 -*-
"""URL 검증 방식 비교 테스트"""

import sys
import requests

sys.stdout.reconfigure(encoding='utf-8')

# 테스트 URL들 (이전 테스트에서 실패한 URL + 성공한 URL)
test_urls = [
    # 실패한 URL
    ("https://www.womennews.co.kr/news/articleView.html?idxno=247201", "Gemini 실패"),
    ("https://ko.wikipedia.org/wiki/%EC%A1%B0%EC%9D%80%ED%9D%AC_(%EC%A0%95%EC%B9%98%EC%9D%B8)", "Naver 실패"),
    # 성공한 URL
    ("https://www.hankookilbo.com/News/Read/A2022030918440002122", "Gemini 성공"),
    ("https://namu.wiki/w/%EC%A1%B0%EC%9D%80%ED%9D%AC", "Naver 성공"),
]

print("URL 검증 방식 비교")
print("="*80)

# 방법 1: HEAD 요청 (현재 방식)
print("\n[방법 1] HEAD 요청 (현재)")
for url, label in test_urls:
    try:
        r = requests.head(url, timeout=5, allow_redirects=True)
        status = "OK" if r.status_code < 400 else f"FAIL ({r.status_code})"
    except Exception as e:
        status = f"ERROR ({type(e).__name__})"
    print(f"  {status:20} | {label:20} | {url[:50]}...")

# 방법 2: HEAD + User-Agent
print("\n[방법 2] HEAD + User-Agent")
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
for url, label in test_urls:
    try:
        r = requests.head(url, timeout=5, allow_redirects=True, headers=headers)
        status = "OK" if r.status_code < 400 else f"FAIL ({r.status_code})"
    except Exception as e:
        status = f"ERROR ({type(e).__name__})"
    print(f"  {status:20} | {label:20} | {url[:50]}...")

# 방법 3: GET 요청 (일부 서버는 HEAD 차단)
print("\n[방법 3] GET 요청 (stream=True)")
for url, label in test_urls:
    try:
        r = requests.get(url, timeout=5, allow_redirects=True, headers=headers, stream=True)
        r.close()  # 바로 닫기 (전체 다운로드 방지)
        status = "OK" if r.status_code < 400 else f"FAIL ({r.status_code})"
    except Exception as e:
        status = f"ERROR ({type(e).__name__})"
    print(f"  {status:20} | {label:20} | {url[:50]}...")

# 방법 4: URL 패턴만 검사 (접속 검증 생략)
print("\n[방법 4] URL 패턴만 검사 (신뢰 도메인)")
trusted_domains = [
    'wikipedia.org', 'namu.wiki', 'youtube.com', 'naver.com', 'daum.net',
    'hankookilbo.com', 'chosun.com', 'joongang.co.kr', 'donga.com',
    'hani.co.kr', 'khan.co.kr', 'kbs.co.kr', 'mbc.co.kr', 'sbs.co.kr',
    'ytn.co.kr', 'yna.co.kr', 'newsis.com', 'news1.kr', 'womennews.co.kr',
    'assembly.go.kr', 'korea.kr', 'go.kr'
]

for url, label in test_urls:
    is_trusted = any(domain in url.lower() for domain in trusted_domains)
    status = "OK (신뢰)" if is_trusted else "UNKNOWN"
    print(f"  {status:20} | {label:20} | {url[:50]}...")

print("\n" + "="*80)
print("결론:")
print("- 방법 2 또는 3이 더 많은 URL을 통과시킬 수 있음")
print("- 방법 4는 신뢰 도메인 기반으로 접속 실패도 통과 (가장 관대)")
