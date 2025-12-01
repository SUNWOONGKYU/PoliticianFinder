#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OFFICIAL 데이터 시간대 분석
- 각 AI가 수집한 데이터의 시간대 패턴 분석
- 중복이 없는 이유 파악
- 수집 기간 제한 가이드라인 제안
"""
import os
import sys
import re
from supabase import create_client
from dotenv import load_dotenv
from collections import defaultdict

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

POLITICIAN_ID = "0756ec15"

def extract_years(text):
    """텍스트에서 연도 추출 (2017-2022, 2021 등)"""
    years = []

    # 4자리 연도 찾기
    year_pattern = r'\b(20\d{2})\b'
    matches = re.findall(year_pattern, text)

    # 연도 범위 찾기 (2018-2022)
    range_pattern = r'\b(20\d{2})\s*[-~]\s*(20\d{2})\b'
    ranges = re.findall(range_pattern, text)

    for start, end in ranges:
        years.extend(range(int(start), int(end) + 1))

    # 단일 연도
    for year in matches:
        if int(year) not in years:
            years.append(int(year))

    return sorted(set(years))

def analyze_official_data():
    """OFFICIAL 데이터 전체 분석"""

    # OFFICIAL 데이터 조회
    response = supabase.table('collected_data').select(
        'ai_name, data_title, source_url, data_source, data_content'
    ).eq(
        'politician_id', POLITICIAN_ID
    ).eq('category_name', 'Expertise').eq('source_type', 'OFFICIAL').execute()

    print(f'='*100)
    print(f'OFFICIAL 데이터 시간대 분석')
    print(f'='*100)
    print(f'총 {len(response.data)}개 항목\n')

    # AI별 분석
    ai_data = defaultdict(list)

    for item in response.data:
        ai_name = 'Claude' if item['ai_name'].startswith('claude') else item['ai_name']

        # 제목, 출처, 내용에서 연도 추출
        text = f"{item['data_title']} {item.get('data_source', '')} {item.get('data_content', '')[:200]}"
        years = extract_years(text)

        ai_data[ai_name].append({
            'title': item['data_title'],
            'source': item.get('data_source', 'N/A'),
            'years': years
        })

    # AI별 시간대 분석
    for ai_name in ['ChatGPT', 'Grok', 'Claude']:
        items = ai_data[ai_name]
        print(f'\n{"="*100}')
        print(f'[{ai_name}] {len(items)}개 항목')
        print(f'{"="*100}')

        # 연도가 있는 항목 수
        with_years = [item for item in items if item['years']]
        without_years = [item for item in items if not item['years']]

        print(f'\n📅 연도 정보:')
        print(f'   - 연도 명시: {len(with_years)}개 ({len(with_years)*100//len(items)}%)')
        print(f'   - 연도 없음: {len(without_years)}개 ({len(without_years)*100//len(items)}%)')

        if with_years:
            all_years = []
            for item in with_years:
                all_years.extend(item['years'])

            if all_years:
                year_min = min(all_years)
                year_max = max(all_years)
                year_count = defaultdict(int)
                for y in all_years:
                    year_count[y] += 1

                print(f'\n📊 연도 범위: {year_min} ~ {year_max}')
                print(f'   연도별 분포:')
                for year in sorted(year_count.keys()):
                    print(f'      {year}: {year_count[year]}개')

        # 샘플 출력
        print(f'\n📝 샘플 (상위 5개):')
        for i, item in enumerate(items[:5], 1):
            years_str = f"{min(item['years'])}-{max(item['years'])}" if len(item['years']) > 1 else str(item['years'][0]) if item['years'] else '연도 없음'
            print(f'\n   {i}. {item["title"][:60]}...')
            print(f'      출처: {item["source"][:70]}')
            print(f'      시기: {years_str}')

    # 중복 가능성 분석
    print(f'\n{"="*100}')
    print('중복 가능성 분석')
    print(f'{"="*100}')

    # 출처 유형 분석
    source_types = defaultdict(lambda: defaultdict(int))

    for item in response.data:
        ai_name = 'Claude' if item['ai_name'].startswith('claude') else item['ai_name']
        source = item.get('data_source', '').lower()

        # 출처 카테고리 분류
        if '국회' in source or '의회' in source or '의정' in source:
            category = '국회/의회'
        elif '정부' in source or '부처' in source or '기획재정부' in source or '환경부' in source:
            category = '정부부처'
        elif '공식' in source or '이력' in source or '프로필' in source:
            category = '공식이력'
        elif '보고서' in source or '통계' in source:
            category = '보고서'
        else:
            category = '기타'

        source_types[category][ai_name] += 1

    print('\n📂 출처 카테고리별 분포:')
    for category, ai_counts in sorted(source_types.items()):
        total = sum(ai_counts.values())
        print(f'\n   [{category}] {total}개')
        for ai in ['ChatGPT', 'Grok', 'Claude']:
            if ai in ai_counts:
                print(f'      {ai}: {ai_counts[ai]}개')

    # 제안사항
    print(f'\n{"="*100}')
    print('📋 제안사항')
    print(f'{"="*100}')

    print('\n🔍 발견된 문제점:')
    print('   1. ChatGPT/Claude: 대부분 연도 정보 없음 (일반적 이력서 수준)')
    print('   2. Grok: 구체적 연도 범위 명시 (2017-2022)')
    print('   3. 출처 카테고리 다름: 각 AI가 다른 유형의 "공식" 자료 수집')

    print('\n💡 해결 방안:')
    print('   1. 수집 기간 제한 명시:')
    print('      "최근 3년 이내 (2022-2025) 정부 공식 발표/보고서만 수집"')
    print('   2. 출처 명확화:')
    print('      "구체적 출처 URL 필수 (이력서/프로필 제외)"')
    print('   3. 연도 명시 의무화:')
    print('      "데이터 제목에 연도 포함 (예: 김동연 경제정책 평가 - 2023)"')

    print('\n📌 수정된 OFFICIAL 데이터 수집 지침:')
    print('''
    [OFFICIAL 데이터 수집 기준]

    ✅ 수집 대상:
    - 정부 공식 발표/보고서 (최근 3년: 2022-2025)
    - 국회 의정활동 기록 (최근 3년)
    - 정부부처 공개 통계/백서 (최근 3년)

    ❌ 제외 대상:
    - 개인 이력서/프로필
    - 연도 불명확한 자료
    - URL 없는 자료

    📝 필수 포함 정보:
    - 구체적 연도 (예: 2023, 2022-2024)
    - 출처 기관명 (예: 기획재정부, 국회)
    - 원문 URL
    ''')

    print(f'\n{"="*100}')

if __name__ == "__main__":
    analyze_official_data()
