#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gemini 수집 URL 유효성 검사
"""

import os
import sys
import requests
from supabase import create_client, Client

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_url_exists(url, timeout=5):
    """URL 유효성 검사"""
    try:
        response = requests.head(url, timeout=timeout, allow_redirects=True)
        return response.status_code < 400
    except:
        try:
            response = requests.get(url, timeout=timeout, allow_redirects=True)
            return response.status_code < 400
        except:
            return False

def main():
    print("=" * 80)
    print("Gemini 수집 URL 유효성 검사")
    print("=" * 80)

    politician_id = "d0a5d6e1"  # 조은희

    # Gemini 수집 데이터 가져오기
    response = supabase.table("collected_data_v30")\
        .select("id, category, source_url, title")\
        .eq("politician_id", politician_id)\
        .eq("collector_ai", "Gemini")\
        .execute()

    gemini_data = response.data
    if not gemini_data:
        print("\nGemini 데이터가 없습니다.")
        return

    total = len(gemini_data)
    print(f"\n총 {total}개 Gemini 데이터 검사 중...")
    print("-" * 80)

    valid_count = 0
    invalid_count = 0
    invalid_urls = []

    for idx, item in enumerate(gemini_data, 1):
        url = item['source_url']
        category = item['category']
        title = item['title'][:50]

        # Gemini grounding URL 패턴 (유효)
        if 'vertexaisearch.cloud.google.com/grounding-api-redirect' in url:
            valid_count += 1
            print(f"  [{idx}/{total}] ✅ VALID (Grounding): {category} - {title}")
        elif url.startswith('http://') or url.startswith('https://'):
            # 실제 URL 검증
            is_valid = check_url_exists(url)
            if is_valid:
                valid_count += 1
                print(f"  [{idx}/{total}] ✅ VALID: {category} - {title}")
            else:
                invalid_count += 1
                invalid_urls.append({'category': category, 'url': url, 'title': title})
                print(f"  [{idx}/{total}] ❌ INVALID: {category} - {url}")
        else:
            invalid_count += 1
            invalid_urls.append({'category': category, 'url': url, 'title': title})
            print(f"  [{idx}/{total}] ❌ INVALID (형식): {url}")

    # 결과 요약
    print("\n" + "=" * 80)
    print("검사 결과 요약")
    print("=" * 80)
    print(f"  총 데이터: {total}개")
    print(f"  ✅ 유효: {valid_count}개 ({valid_count/total*100:.1f}%)")
    print(f"  ❌ 무효: {invalid_count}개 ({invalid_count/total*100:.1f}%)")

    if invalid_urls:
        print(f"\n무효 URL 목록:")
        for item in invalid_urls:
            print(f"  - [{item['category']}] {item['url']}")
            print(f"    제목: {item['title']}")

    # 결론
    print("\n" + "=" * 80)
    if invalid_count == 0:
        print("🎉 모든 URL이 유효합니다! Gemini SDK 업그레이드 성공!")
    elif invalid_count / total < 0.1:
        print(f"✅ {invalid_count/total*100:.1f}% 무효율 - 허용 범위 (10% 미만)")
    else:
        print(f"⚠️ {invalid_count/total*100:.1f}% 무효율 - 개선 필요")
    print("=" * 80)

if __name__ == "__main__":
    main()
