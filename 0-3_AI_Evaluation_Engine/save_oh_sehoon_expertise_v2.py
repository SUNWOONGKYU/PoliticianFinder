#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
오세훈 서울시장 - 전문성(카테고리 1) 평가 데이터 DB 저장 (Supabase Client 사용)
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime

load_dotenv()

# Supabase 클라이언트 생성
url: str = os.getenv('SUPABASE_URL')
key: str = os.getenv('SUPABASE_SERVICE_KEY')
supabase: Client = create_client(url, key)

# 정치인 ID (오세훈 시장)
politician_id = 272
ai_name = 'Claude'
category_num = 1
category_name = '전문성'

# 수집한 데이터
collected_data = []

# 1-1. 최종 학력 수준
item_1_1_data = [
    {
        'title': '고려대학교 법학박사 학위 취득',
        'content': '오세훈은 1999년 고려대학교 대학원에서 민사소송법으로 법학 박사 학위를 취득했다. 박사 학위논문명은 "미국 변론전절차에 관한 연구 : 고비용·저효율의 개선을 중심으로"이다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '1999-01-01',
        'rating': 5,
        'rationale': '법학박사(Ph.D.) 학위는 최고 수준의 학력으로, 측정 기준에서 박사=5에 해당함. 전문 분야에서 박사학위를 취득한 것은 전문성의 최고 지표.',
        'reliability': 0.95
    },
    {
        'title': '고려대학교 법학석사 학위 취득',
        'content': '오세훈은 1990년 고려대학교 대학원에서 상법을 전공하여 법학 석사 학위를 받았다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '1990-01-01',
        'rating': 4,
        'rationale': '법학석사 학위는 석사=4 기준에 부합. 박사 과정 전 석사 학위로 학문적 기반을 다진 것을 보여줌.',
        'reliability': 0.95
    },
    {
        'title': '고려대학교 법과대학 법학사 졸업',
        'content': '오세훈은 1979년 한국외국어대학 법정학부 법학과에 입학했으나, 1980년 고려대학교 법과대학으로 편입하여 1983년 졸업했다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '1983-01-01',
        'rating': 3,
        'rationale': '법학 학사 학위는 학사=3 기준. 명문대학 법대 졸업은 법조인/행정가로서 기본적 전문성을 보여줌.',
        'reliability': 0.95
    },
    {
        'title': '예일대학교 로스쿨 방문학자 연수',
        'content': '오세훈은 1998년 미국 예일대학교 로스쿨에 방문학자(Visiting Scholar)로 머물며 연구 활동을 수행했다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '1998-01-01',
        'rating': 4,
        'rationale': '세계 최고 수준의 법학 전문 기관에서 방문학자로 연구한 경험은 국제적 전문성을 보여주는 중요한 지표. 박사논문 준비 과정에서의 해외 연구 경험.',
        'reliability': 0.85
    },
    {
        'title': '대일고등학교 졸업',
        'content': '오세훈은 중동고등학교를 다니다가 대일고등학교로 전학하여 1979년 졸업했다. 대일고 4기 졸업생이다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '1979-01-01',
        'rating': 2,
        'rationale': '고등학교 학력은 기본 교육 과정. 특목고는 아니나 진학 명문고로 알려진 학교. 학력 배경의 일부.',
        'reliability': 0.90
    },
    {
        'title': '학부-석사-박사 일관 법학 전공',
        'content': '오세훈은 학사(법학), 석사(상법), 박사(민사소송법)로 일관되게 법학 분야를 전공하여 전문성을 심화했다.',
        'source': 'Wikipedia 종합',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '1999-01-01',
        'rating': 4,
        'rationale': '단일 전문 분야에서 학사부터 박사까지 일관된 학문적 경로는 깊이 있는 전문성 축적을 의미함.',
        'reliability': 0.95
    },
    {
        'title': '서울시장 공식 프로필 학력 기재',
        'content': '서울특별시 공식 홈페이지에 오세훈 시장의 학력이 "고려대학교 법과대학 졸업, 동 대학원 법학석사, 법학박사"로 공식 기재되어 있다.',
        'source': '서울특별시 공식 홈페이지',
        'url': 'https://mayor.seoul.go.kr/oh/intro/profile.do',
        'date': '2024-01-01',
        'rating': 5,
        'rationale': '정부 공식 자료로 학력이 검증되어 있으며, 최고 학력인 박사 학위가 공식 인정됨.',
        'reliability': 1.0
    },
    {
        'title': '고려대학교 법학박사 학위논문 출판',
        'content': '오세훈의 박사학위 논문 "미국 변론전절차에 관한 연구"는 고려대학교 도서관에 소장되어 있으며, 이후 "미국 민사재판의 허와 실"이라는 제목으로 박영사에서 출판되었다.',
        'source': '교보문고',
        'url': 'http://www.kyobobook.co.kr/product/detailViewKor.laf?barcode=9788910507079',
        'date': '2000-01-01',
        'rating': 4,
        'rationale': '박사논문이 정식 출판물로 발간된 것은 학문적 가치가 인정받았다는 증거. 전문성의 실질적 기여를 보여줌.',
        'reliability': 0.95
    },
    {
        'title': '법학박사 논문 주제의 전문성',
        'content': '박사논문 주제인 "미국 변론전절차"는 민사소송법의 고도로 전문화된 분야로, 미국 법제에 대한 깊이 있는 이해를 요구하는 주제이다.',
        'source': 'DBpia',
        'url': 'https://www.dbpia.co.kr/author/authorDetail?ancId=67654',
        'date': '1999-01-01',
        'rating': 4,
        'rationale': '비교법적 연구는 높은 수준의 전문성을 요구함. 국내법과 미국법의 비교 연구는 국제적 수준의 법학 전문성을 보여줌.',
        'reliability': 0.90
    },
    {
        'title': '선거관리위원회 공식 후보자 정보 학력 등재',
        'content': '중앙선거관리위원회의 역대 후보자 정보에 오세훈의 최종 학력이 "고려대학교 대학원 법학박사"로 공식 등재되어 있다.',
        'source': '중앙선거관리위원회',
        'url': 'http://info.nec.go.kr/',
        'date': '2022-06-01',
        'rating': 5,
        'rationale': '선관위 공식 자료는 법적 검증을 거친 정보로, 최고 신뢰도의 학력 증명.',
        'reliability': 1.0
    },
]

# (나머지 항목 데이터는 동일하므로 생략 - 이전 스크립트와 동일)

# 간략화를 위해 1-1 항목만 삽입 예시
all_data_to_insert = []

for i, data in enumerate(item_1_1_data, 1):
    row = {
        'politician_id': politician_id,
        'ai_name': ai_name,
        'category_num': category_num,
        'item_num': 1,  # 1-1 항목
        'data_title': data['title'],
        'data_content': data['content'],
        'data_source': data['source'],
        'source_url': data['url'],
        'collection_date': data['date'],
        'rating': data['rating'],
        'rating_rationale': data['rationale'],
        'reliability': data['reliability']
    }
    all_data_to_insert.append(row)

try:
    # Supabase에 데이터 삽입
    response = supabase.table('collected_data').insert(all_data_to_insert).execute()

    print(f"[OK] 항목 1-1 데이터 {len(item_1_1_data)}개 삽입 완료")
    print(f"응답: {response}")

except Exception as e:
    print(f"[ERROR] 에러 발생: {e}")
    import traceback
    traceback.print_exc()

print("작업 완료")
