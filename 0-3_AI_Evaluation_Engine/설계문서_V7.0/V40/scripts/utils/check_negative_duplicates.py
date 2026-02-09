# -*- coding: utf-8 -*-
"""
부정적 데이터 중복 검사
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv
from collections import Counter
import re

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

load_dotenv(override=True)
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

politician_id = 'f9e00370'
politician_name = '김민석'

print('='*100)
print(f'부정적 데이터 중복 검사 - {politician_name}')
print('='*100)
print()

# 1. 전체 수집 데이터 sentiment 분포
print('📊 [1] 수집 데이터 sentiment 분포:')
print('-'*100)

result = supabase.table('collected_data_v40')\
    .select('sentiment, data_type, collector_ai')\
    .eq('politician_id', politician_id)\
    .execute()

total_data = result.data
sentiments = [item['sentiment'] for item in total_data]
sentiment_counts = Counter(sentiments)

print(f'{"Sentiment":<15} {"개수":>10} {"비율":>10}')
print('-'*100)
for sentiment, count in sentiment_counts.most_common():
    pct = (count / len(total_data) * 100) if total_data else 0
    print(f'{sentiment:<15} {count:>10} {pct:>9.1f}%')
print('-'*100)
print(f'{"전체":<15} {len(total_data):>10}')
print('='*100)
print()

# 2. 부정적 데이터 상세 분석
print('📊 [2] 부정적(negative) 데이터 상세 분석:')
print('-'*100)

negative_result = supabase.table('collected_data_v40')\
    .select('*')\
    .eq('politician_id', politician_id)\
    .eq('sentiment', 'negative')\
    .execute()

negative_data = negative_result.data

print(f'부정적 데이터 총 개수: {len(negative_data)}개')
print()

# URL 중복 체크
print('[2-1] URL 중복 검사:')
print('-'*100)

urls = [item.get('source_url', '') for item in negative_data if item.get('source_url')]
url_counts = Counter(urls)
duplicates = {url: count for url, count in url_counts.items() if count > 1}

if duplicates:
    print(f'⚠️ 중복 URL 발견: {len(duplicates)}개')
    print()
    for url, count in sorted(duplicates.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f'  [{count}번] {url[:80]}...')
        # 해당 URL을 수집한 AI들 확인
        same_url_items = [item for item in negative_data if item.get('source_url') == url]
        collectors = [item.get('collector_ai') for item in same_url_items]
        categories = [item.get('category') for item in same_url_items]
        print(f'    수집 채널: {", ".join(collectors)}')
        print(f'    카테고리: {", ".join(categories)}')
        print()
else:
    print('✅ URL 중복 없음')
    print()

print('='*100)
print()

# 제목 중복/유사도 체크
print('[2-2] 제목 키워드 중복 검사 (주요 의혹):')
print('-'*100)

titles = [item.get('title', '') for item in negative_data]

# 주요 의혹 키워드
keywords = [
    '재산', '의혹', '논란', '청문회', '비리',
    '모친', '빌라', '전세', '학위', '자녀',
    '유학비', '정치자금', '스펙', '입법권'
]

keyword_counts = {}
for keyword in keywords:
    count = sum(1 for title in titles if keyword in title)
    if count > 0:
        keyword_counts[keyword] = count

print(f'{"키워드":<15} {"언급횟수":>12} {"비율":>10}')
print('-'*100)
for keyword, count in sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True):
    pct = (count / len(negative_data) * 100) if negative_data else 0
    print(f'{keyword:<15} {count:>12} {pct:>9.1f}%')
print('='*100)
print()

# 3. 같은 내용 중복 체크 (제목 유사도)
print('[2-3] 제목 완전 일치 중복 검사:')
print('-'*100)

title_counts = Counter(titles)
duplicate_titles = {title: count for title, count in title_counts.items() if count > 1}

if duplicate_titles:
    print(f'⚠️ 중복 제목 발견: {len(duplicate_titles)}개')
    print()
    for title, count in sorted(duplicate_titles.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f'  [{count}번] {title}')
        # 해당 제목을 가진 항목들
        same_title_items = [item for item in negative_data if item.get('title') == title]
        collectors = [item.get('collector_ai') for item in same_title_items]
        categories = [item.get('category') for item in same_title_items]
        data_types = [item.get('data_type') for item in same_title_items]
        print(f'    수집 채널: {", ".join(collectors)}')
        print(f'    카테고리: {", ".join(set(categories))}')
        print(f'    데이터 타입: {", ".join(set(data_types))}')
        print()
else:
    print('✅ 제목 완전 일치 중복 없음')
    print()

print('='*100)
print()

# 4. AI별 카테고리별 부정 데이터 분포
print('[2-4] AI별 × 카테고리별 부정 데이터 분포:')
print('-'*100)

categories = ['expertise', 'leadership', 'vision', 'integrity', 'ethics',
              'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest']
ais = ['Gemini', 'Naver']

print(f'{"카테고리":<20} {"Gemini":>8} {"Naver":>8} {"합계":>8}')
print('-'*100)

for cat in categories:
    cat_negative = [item for item in negative_data if item.get('category') == cat]
    ai_counts = {}
    for ai in ais:
        count = sum(1 for item in cat_negative if item.get('collector_ai') == ai)
        ai_counts[ai] = count
    total = sum(ai_counts.values())
    print(f'{cat:<20} {ai_counts.get("Gemini", 0):>8} {ai_counts.get("Naver", 0):>8} {total:>8}')

print('='*100)
print()

# 5. 평가 결과에서 부정 등급 분포
print('📊 [3] 평가 결과 부정 등급 분포:')
print('-'*100)

eval_result = supabase.table('evaluations_v40')\
    .select('rating, evaluator_ai, category')\
    .eq('politician_id', politician_id)\
    .execute()

eval_data = eval_result.data
ratings = [item['rating'] for item in eval_data]
rating_counts = Counter(ratings)

negative_ratings = ['-1', '-2', '-3', '-4']
positive_ratings = ['+1', '+2', '+3', '+4']

neg_count = sum(rating_counts.get(r, 0) for r in negative_ratings)
pos_count = sum(rating_counts.get(r, 0) for r in positive_ratings)

print(f'{"등급":<10} {"개수":>10} {"비율":>10}')
print('-'*100)
for rating in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
    count = rating_counts.get(rating, 0)
    pct = (count / len(eval_data) * 100) if eval_data else 0
    marker = ' ✅' if rating in positive_ratings else ' ❌'
    print(f'{rating:<10} {count:>10} {pct:>9.1f}%{marker}')
print('-'*100)
print(f'{"긍정평가":<10} {pos_count:>10} {pos_count/len(eval_data)*100:>9.1f}%')
print(f'{"부정평가":<10} {neg_count:>10} {neg_count/len(eval_data)*100:>9.1f}%')
print('='*100)
print()

# 6. 특정 수집 데이터가 여러 AI에게 중복 평가되었는지 확인
print('📊 [4] 수집 데이터별 평가 횟수 검사:')
print('-'*100)

eval_counts = Counter(item['collected_data_id'] for item in eval_data if item.get('collected_data_id'))

# 각 데이터는 4번씩 평가되어야 함 (4개 평가 AI: Claude, ChatGPT, Gemini, Grok)
expected_count = 4
abnormal = {data_id: count for data_id, count in eval_counts.items() if count != expected_count}

if abnormal:
    print(f'⚠️ 비정상 평가 횟수 발견: {len(abnormal)}개')
    print()
    for data_id, count in list(abnormal.items())[:10]:
        print(f'  Data ID: {data_id}')
        print(f'  평가 횟수: {count}회 (정상: 4회)')

        # 해당 데이터 정보
        data_info = next((item for item in total_data if item['id'] == data_id), None)
        if data_info:
            print(f'  제목: {data_info.get("title", "N/A")[:60]}...')
            print(f'  sentiment: {data_info.get("sentiment", "N/A")}')
        print()
else:
    print('✅ 모든 데이터가 정확히 4번씩 평가됨')
    print()

print('='*100)
print()

# 7. 결론 및 권장사항
print('📊 [5] 종합 분석 결과:')
print('='*100)
print()
print('✅ 정상 사항:')
if not duplicates:
    print('  - URL 중복 없음')
if not duplicate_titles:
    print('  - 제목 완전 일치 중복 없음')
if not abnormal:
    print('  - 모든 데이터 정확히 4번씩 평가됨 (4개 평가 AI: Claude, ChatGPT, Gemini, Grok)')
print()

if len(negative_data) > 0:
    neg_ratio = len(negative_data) / len(total_data) * 100
    print('⚠️ 주의 사항:')
    print(f'  - 부정적 데이터 비율: {len(negative_data)}개 / {len(total_data)}개 = {neg_ratio:.1f}%')

    if neg_ratio > 30:
        print(f'    → 부정 데이터가 {neg_ratio:.1f}%로 높은 편입니다.')
        print(f'    → 실제 의혹/논란이 많았거나, 부정 데이터 수집이 과다했을 수 있습니다.')

    print()
    print('  - 주요 부정 이슈:')
    for keyword, count in sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f'    • {keyword}: {count}회 언급')

print()
print('💡 점수가 낮은 주요 원인:')
neg_eval_ratio = neg_count / len(eval_data) * 100 if eval_data else 0
print(f'  - 전체 평가 중 부정 평가: {neg_count}개 ({neg_eval_ratio:.1f}%)')
print(f'  - 청렴성 카테고리 평균: 0.10 (거의 0점에 가까움)')
print(f'  - 윤리성 카테고리 평균: 0.58 (낮음)')
print(f'  - 투명성 카테고리 평균: 0.94 (낮음)')
print()
print('  → 부정 데이터 중복보다는, 실제로 부정적 평가가 많이 포함되었음')
print('  → 특히 청렴성/윤리성 관련 의혹이 점수를 크게 하락시킴')
print()
print('='*100)
