# -*- coding: utf-8 -*-
"""
수집 데이터 날짜 분포 분석
"""

import os
import sys
from collections import Counter
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

TABLE_COLLECTED = "collected_data_v40"

def analyze_dates(politician_id, category_name, category_korean):
    """날짜 분포 분석"""
    print(f"\n{'='*80}")
    print(f"📅 {category_korean} ({category_name}) 수집 데이터 날짜 분석")
    print(f"{'='*80}\n")

    # 데이터 조회
    result = supabase.table(TABLE_COLLECTED).select('*').eq(
        'politician_id', politician_id
    ).eq('category', category_name.lower()).execute()

    if not result.data:
        print("수집 데이터가 없습니다.")
        return

    data = result.data
    print(f"총 수집 데이터: {len(data)}개\n")

    # 날짜 파싱 및 분석
    dates = []
    no_date = 0

    for item in data:
        pub_date = item.get('published_date')
        if pub_date and pub_date != 'N/A':
            try:
                # 다양한 날짜 형식 처리
                if 'T' in pub_date:
                    date_obj = datetime.fromisoformat(pub_date.replace('Z', '+00:00'))
                else:
                    date_obj = datetime.strptime(pub_date, '%Y-%m-%d')
                dates.append(date_obj)
            except:
                no_date += 1
        else:
            no_date += 1

    if no_date > 0:
        print(f"⚠️ 날짜 없음: {no_date}개\n")

    if not dates:
        print("분석 가능한 날짜 데이터가 없습니다.")
        return

    # 연도별 분포
    print(f"{'─'*80}")
    print(f"📊 연도별 분포")
    print(f"{'─'*80}\n")

    years = Counter([d.year for d in dates])
    for year in sorted(years.keys(), reverse=True):
        count = years[year]
        pct = (count / len(dates) * 100) if dates else 0
        print(f"  {year}년: {count:3d}개 ({pct:5.1f}%)")

    # 연도-월별 상세 분포
    print(f"\n{'─'*80}")
    print(f"📊 최근 2년 월별 분포")
    print(f"{'─'*80}\n")

    recent_dates = [d for d in dates if d.year >= 2024]
    if recent_dates:
        year_months = Counter([f"{d.year}-{d.month:02d}" for d in recent_dates])
        for ym in sorted(year_months.keys(), reverse=True):
            count = year_months[ym]
            pct = (count / len(recent_dates) * 100) if recent_dates else 0
            print(f"  {ym}: {count:3d}개 ({pct:5.1f}%)")

    # 최신/최구 날짜
    print(f"\n{'─'*80}")
    print(f"📊 날짜 범위")
    print(f"{'─'*80}\n")

    oldest = min(dates)
    newest = max(dates)
    print(f"  가장 오래된 데이터: {oldest.strftime('%Y-%m-%d')}")
    print(f"  가장 최신 데이터: {newest.strftime('%Y-%m-%d')}")
    print(f"  수집 기간: {(newest - oldest).days}일")

    # sentiment별 날짜 분포
    print(f"\n{'─'*80}")
    print(f"📊 sentiment별 평균 날짜")
    print(f"{'─'*80}\n")

    sentiment_dates = {}
    for item in data:
        sentiment = item.get('sentiment', 'unknown')
        pub_date = item.get('published_date')
        if pub_date and pub_date != 'N/A':
            try:
                if 'T' in pub_date:
                    date_obj = datetime.fromisoformat(pub_date.replace('Z', '+00:00'))
                else:
                    date_obj = datetime.strptime(pub_date, '%Y-%m-%d')
                if sentiment not in sentiment_dates:
                    sentiment_dates[sentiment] = []
                sentiment_dates[sentiment].append(date_obj)
            except:
                pass

    for sentiment in ['positive', 'negative', 'free']:
        if sentiment in sentiment_dates:
            avg_date = sum([d.timestamp() for d in sentiment_dates[sentiment]]) / len(sentiment_dates[sentiment])
            avg_date_obj = datetime.fromtimestamp(avg_date)
            count = len(sentiment_dates[sentiment])
            print(f"  {sentiment:10s}: {avg_date_obj.strftime('%Y-%m-%d')} (평균, {count}개)")

    # 최근 논란 관련 키워드 검색
    print(f"\n{'─'*80}")
    print(f"🔍 최근 논란 관련 데이터 (2024-2025)")
    print(f"{'─'*80}\n")

    keywords = ['명태균', '뇌물', '횡령', '경선', '불법', '여론조사', '소환', '의혹']
    recent_controversy = []

    for item in data:
        pub_date = item.get('published_date')
        title = item.get('title', '')
        content = item.get('content', '')

        if pub_date:
            try:
                if 'T' in pub_date:
                    date_obj = datetime.fromisoformat(pub_date.replace('Z', '+00:00'))
                else:
                    date_obj = datetime.strptime(pub_date, '%Y-%m-%d')

                if date_obj.year >= 2024:
                    for keyword in keywords:
                        if keyword in title or keyword in content:
                            recent_controversy.append({
                                'date': date_obj,
                                'keyword': keyword,
                                'title': title,
                                'sentiment': item.get('sentiment', 'unknown')
                            })
                            break
            except:
                pass

    if recent_controversy:
        print(f"논란 관련 데이터: {len(recent_controversy)}개\n")

        # 최신 순으로 정렬하여 상위 10개만 출력
        recent_controversy.sort(key=lambda x: x['date'], reverse=True)
        for item in recent_controversy[:10]:
            date_str = item['date'].strftime('%Y-%m-%d')
            keyword = item['keyword']
            sentiment = item['sentiment']
            title = item['title'][:80]
            print(f"  [{date_str}] [{sentiment:8s}] {keyword}: {title}...")
    else:
        print("논란 관련 키워드가 포함된 데이터가 없습니다.")

def main():
    import argparse

    parser = argparse.ArgumentParser(description='수집 데이터 날짜 분포 분석')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--categories', nargs='+', required=True, help='카테고리 목록')
    args = parser.parse_args()

    category_map = {
        'integrity': '청렴성',
        'ethics': '윤리성',
        'expertise': '전문성',
        'leadership': '리더십',
        'vision': '비전',
        'accountability': '책임감',
        'transparency': '투명성',
        'communication': '소통능력',
        'responsiveness': '대응성',
        'publicinterest': '공익성'
    }

    for category in args.categories:
        korean_name = category_map.get(category, category)
        analyze_dates(args.politician_id, category, korean_name)

if __name__ == "__main__":
    main()
