# -*- coding: utf-8 -*-
"""redirect URL 추적 테스트"""

import sys
import requests

sys.stdout.reconfigure(encoding='utf-8')

# Gemini가 반환한 redirect URL 예시
redirect_urls = [
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEQEWAJTELsbib5PB3JgcbZb4KrURqipk69RO7khPIjsdEfvDgc-I94AsnQWjTUzO5-hBYDj8PWXynTszjAh7NwWCHiV_uaWzXLVDd4oCMJPn8udHhM3g3_Yq-7Mw2mPf6R8nfBb7AppmEVHdKktxL7hquVgavBYXKAjix6d7d9mI2Sey0ZulkSq4oFAeio7OL6kg==",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGEJ0aivJCNGG5TpC7lODUBuE22RtsBoLBLjP5W1rqZ6yFLGrbQ0FeHYV4lSLMjcccGOYEYkCYPMOlXwjfT3hhW-g5CjxrauMVBrjaAuJOYoE-kDV709opgDjiA6dXXSBwF75mFzFAVLPy_gVOAQ0S9pZ5715g17oLo"
]

print("redirect URL 추적 테스트")
print("="*60)

for i, url in enumerate(redirect_urls, 1):
    print(f"\n{i}. redirect URL:")
    print(f"   {url[:80]}...")

    try:
        # allow_redirects=False로 첫 번째 리다이렉트만 확인
        response = requests.head(url, timeout=10, allow_redirects=False)
        print(f"   Status: {response.status_code}")

        if 'Location' in response.headers:
            final_url = response.headers['Location']
            print(f"   -> Location: {final_url}")
        else:
            print(f"   -> Location 헤더 없음")
            print(f"   -> 헤더: {dict(response.headers)}")

        # allow_redirects=True로 최종 URL 확인
        response2 = requests.head(url, timeout=10, allow_redirects=True)
        print(f"   최종 URL: {response2.url}")
        print(f"   최종 Status: {response2.status_code}")

    except Exception as e:
        print(f"   에러: {e}")

print("\n완료")
