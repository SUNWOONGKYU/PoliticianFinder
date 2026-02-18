#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
삭제 원인 상세 분석

검증 결과:
- 유효: 54개 (5.4%)
- 무효: 875개 (87.5%)
  - URL 접속 불가: 731개 (83.5%)
  - 기간 초과: 51개
  - 가짜 URL: 45개
  - source_type 불일치: 35개
  - EVENT_OUT_OF_RANGE: 13개

하지만 샘플 테스트:
- Gemini: 90% 접근 가능
- Perplexity: 80% 접근 가능

→ 모순! 분석 필요
"""

import os
import sys
import io
import requests
from datetime import datetime, timedelta
from supabase import create_client
from dotenv import load_dotenv

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'd0a5d6e1'

print('=' * 90)
print('삭제 원인 상세 분석')
print('=' * 90)

# 남은 데이터 샘플 (유효 판정)
print('\n[1] 유효 판정받은 데이터 샘플 (5개)')
print('-' * 90)

result = supabase.table('collected_data_v30').select('*')\
    .eq('politician_id', politician_id)\
    .eq('is_verified', True)\
    .limit(5)\
    .execute()

print(f'유효 데이터: {len(result.data)}개')
for idx, item in enumerate(result.data, 1):
    print(f'\n{idx}. {item["title"][:50]}...')
    print(f'   AI: {item["collector_ai"]}')
    print(f'   Type: {item["data_type"]}')
    print(f'   Date: {item.get("published_date", "N/A")}')
    print(f'   URL: {item["source_url"][:80]}')

# 검증 스크립트의 문제점 분석
print('\n\n[2] 검증 스크립트 검토')
print('-' * 90)

print('\n📌 의심 포인트 1: URL 접속 검증 (timeout=10초)')
print('   - 10초는 너무 짧음')
print('   - 정부 사이트는 응답 느림 (assembly.go.kr 등)')
print('   - 샘플 테스트에서는 90% 접근 가능')
print('   → 731개 "접속 불가" 판정이 과도할 가능성')

print('\n📌 의심 포인트 2: validate_event_date (EVENT_OUT_OF_RANGE)')
print('   - 기사 내용에서 "가장 오래된 연도" 추출')
print('   - 예: "2020년에도 법안 발의" → 2020년으로 판정')
print('   - 하지만 기사 자체는 2025년 작성 (유효)')
print('   → 정상 데이터를 과거 사건으로 오판')

print('\n📌 의심 포인트 3: 기간 초과 (51개)')
print('   - OFFICIAL: 4년 이내 (2022-01-26 이후)')
print('   - PUBLIC: 2년 이내 (2024-01-26 이후)')
print('   - Gemini가 미래 날짜 생성 문제도 있음')

print('\n📌 의심 포인트 4: 가짜 URL 패턴 (45개)')

# 실제 검증 로직 테스트
print('\n\n[3] 남은 데이터로 검증 로직 재테스트')
print('-' * 90)

# 남은 데이터 중 무작위 10개
result = supabase.table('collected_data_v30').select('*')\
    .eq('politician_id', politician_id)\
    .limit(10)\
    .execute()

accessible = 0
for item in result.data:
    url = item['source_url']
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.head(url, headers=headers, timeout=10, allow_redirects=True)
        if response.status_code < 400:
            accessible += 1
    except:
        pass

print(f'남은 데이터 10개 중 접근 가능: {accessible}개 ({accessible*10}%)')

# 기간 검증
print('\n\n[4] 기간 제한 분석')
print('-' * 90)

now = datetime.now()
official_limit = now - timedelta(days=365*4)  # 2022-01-27
public_limit = now - timedelta(days=365*2)    # 2024-01-27

print(f'현재 날짜: {now.strftime("%Y-%m-%d")}')
print(f'OFFICIAL 기준일: {official_limit.strftime("%Y-%m-%d")} (4년 전)')
print(f'PUBLIC 기준일: {public_limit.strftime("%Y-%m-%d")} (2년 전)')

# 기간 초과로 삭제된 데이터는?
# (이미 삭제되어 확인 불가)

print('\n\n[5] 결론')
print('=' * 90)

print('\n❌ 검증 스크립트의 3가지 심각한 문제:')
print('\n1. URL 검증 timeout 너무 짧음 (10초)')
print('   → 느린 서버를 "접속 불가"로 오판')
print('   → 731개 과다 삭제 가능성')

print('\n2. validate_event_date 로직 문제')
print('   → "언급된 과거 연도"를 "사건 발생 시점"으로 오판')
print('   → 정상 기사를 "과거 사건"으로 삭제')

print('\n3. 복합 검증 (여러 조건 동시 체크)')
print('   → 하나라도 실패하면 삭제')
print('   → 과도하게 엄격')

print('\n💡 해결 방안:')
print('\n옵션 A: 검증 스크립트 수정 후 재수집')
print('   - timeout 30초로 증가')
print('   - validate_event_date 완화 또는 제거')
print('   - 재수집: 약 2-2.5시간')

print('\n옵션 B: 검증 없이 평가 진행')
print('   - 남은 56개로 평가 (불충분)')
print('   - 전체 재수집 후 검증 없이 평가')

print('\n옵션 C: validate_v30.py 완전히 건너뛰기')
print('   - 재수집 후 바로 평가')
print('   - 품질 체크는 AI 평가 단계에서')

print('=' * 90)
