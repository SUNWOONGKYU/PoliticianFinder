#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gemini가 수집한 데이터의 URL이 실제인지 확인
"""

import sys
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env 파일 로드
load_dotenv(override=True)

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[오류] Supabase 환경 변수가 설정되지 않았습니다.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    politician_id = 'd0a5d6e1'  # 조은희

    print("=" * 70)
    print("Gemini 수집 데이터 URL 분석")
    print("=" * 70)
    print()

    # Gemini 데이터 조회
    result = supabase.table('collected_data_v40') \
        .select('id, title, source_url, created_at, category') \
        .eq('politician_id', politician_id) \
        .eq('collector_ai', 'Gemini') \
        .order('created_at') \
        .limit(20) \
        .execute()

    if not result.data:
        print("Gemini 데이터가 없습니다.")
        return

    print(f"총 샘플: {len(result.data)}개 (최근 20개)")
    print()

    # URL 패턴 분석
    url_patterns = {}
    for item in result.data:
        url = item.get('source_url', '')
        if not url:
            continue

        # 도메인 추출
        if url.startswith('http'):
            domain = url.split('/')[2]
        else:
            domain = url.split('/')[0]

        if domain not in url_patterns:
            url_patterns[domain] = []
        url_patterns[domain].append({
            'title': item['title'][:50],
            'url': url,
            'category': item['category'],
            'time': item['created_at']
        })

    print("=" * 70)
    print("도메인별 URL 패턴")
    print("=" * 70)
    print()

    for domain, items in url_patterns.items():
        print(f"[{domain}] - {len(items)}개")
        for i, item in enumerate(items[:3], 1):  # 각 도메인당 3개만 출력
            print(f"  {i}. {item['title']}")
            print(f"     URL: {item['url']}")
            print(f"     카테고리: {item['category']}, 시간: {item['time']}")
            print()

    print("=" * 70)
    print("의심스러운 패턴 확인")
    print("=" * 70)
    print()

    # 의심 패턴 확인
    suspicious = []

    for domain, items in url_patterns.items():
        # 1. example.com 같은 예시 도메인
        if 'example' in domain.lower():
            suspicious.append(f"예시 도메인 사용: {domain} ({len(items)}개)")

        # 2. 모든 URL이 동일한 패턴
        urls = [item['url'] for item in items]
        if len(set(urls)) == 1 and len(items) > 1:
            suspicious.append(f"동일 URL 반복: {domain} ({len(items)}개)")

        # 3. 모든 항목이 동일 시간
        times = [item['time'] for item in items]
        if len(set(times)) == 1 and len(items) > 1:
            suspicious.append(f"동일 시간 수집: {domain} ({len(items)}개)")

    if suspicious:
        print("🚨 발견된 의심 패턴:")
        for s in suspicious:
            print(f"  - {s}")
    else:
        print("✅ 의심스러운 패턴 없음")

    print()
    print("=" * 70)
    print("실제 한국 언론사 도메인 확인")
    print("=" * 70)
    print()

    korean_media = [
        'chosun.com', 'joongang.co.kr', 'donga.com', 'hankyung.com',
        'hani.co.kr', 'khan.co.kr', 'ytn.co.kr', 'sbs.co.kr',
        'kbs.co.kr', 'mbc.co.kr', 'yna.co.kr', 'newsis.com',
        'news1.kr', 'mt.co.kr', 'edaily.co.kr', 'mk.co.kr'
    ]

    found_media = []
    for domain in url_patterns.keys():
        for media in korean_media:
            if media in domain:
                found_media.append(domain)
                break

    if found_media:
        print(f"✅ 실제 언론사 도메인: {len(found_media)}개")
        for media in found_media:
            print(f"  - {media}: {len(url_patterns[media])}개")
    else:
        print("❌ 실제 한국 언론사 도메인 없음")

    print()

if __name__ == "__main__":
    main()
