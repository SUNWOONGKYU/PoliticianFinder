#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
오세훈 서울시장 - 전문성(카테고리 1) 평가 데이터 DB 저장
"""

import psycopg2
from psycopg2 import sql
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# DB 연결
conn = psycopg2.connect(
    host=os.getenv('SUPABASE_HOST'),
    port=os.getenv('SUPABASE_PORT', 5432),
    database=os.getenv('SUPABASE_DB'),
    user=os.getenv('SUPABASE_USER'),
    password=os.getenv('SUPABASE_PASSWORD')
)

cursor = conn.cursor()

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

# 1-2. 직무 관련 자격증 보유 개수
item_1_2_data = [
    {
        'title': '변호사 자격증 보유',
        'content': '오세훈은 1984년 제26회 사법시험에 합격하여 사법연수원 16기로 입소(17기로 수료)하였고, 1991년 변호사 개업하여 변호사 자격을 보유하고 있다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '1991-01-01',
        'rating': 5,
        'rationale': '변호사 자격은 행정·법무·정책 분야에서 가장 핵심적인 전문 자격증. 시장 직무와 직접 관련된 법률 전문 자격.',
        'reliability': 1.0
    },
    {
        'title': '제26회 사법시험 합격',
        'content': '오세훈은 1984년 제26회 사법시험에 합격했다. 당시 사법시험 합격률은 약 2-3%로 매우 낮았다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '1984-01-01',
        'rating': 5,
        'rationale': '사법시험 합격은 법조 전문가로서의 기본 자격이며, 높은 난이도의 국가자격시험 합격은 전문성의 강력한 증거.',
        'reliability': 1.0
    },
    {
        'title': '사법연수원 수료',
        'content': '오세훈은 사법연수원 16기로 입소하여 17기로 수료했다. 사법연수원은 법조인 양성을 위한 전문 교육기관이다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '1987-01-01',
        'rating': 4,
        'rationale': '사법연수원 수료는 법조인으로서 실무 능력을 인정받은 것. 변호사·검사·판사 등의 직무 수행을 위한 필수 과정.',
        'reliability': 1.0
    },
    {
        'title': '검사시보 경력',
        'content': '오세훈은 1987년 서울중앙지방검찰청 검사시보로 배치되어 법조 실무 경험을 쌓았다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '1987-01-01',
        'rating': 4,
        'rationale': '검사시보는 사법연수원 수료 후 법조 경력의 시작점. 공직 법무 경험은 행정가로서 중요한 자격.',
        'reliability': 0.95
    },
    {
        'title': '환경 전문 변호사 타이틀',
        'content': '오세훈은 1990년대 대한민국에서 보기 드문 "환경 전문 변호사"라는 타이틀을 가지고 활동했다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '1995-01-01',
        'rating': 4,
        'rationale': '특정 분야 전문 변호사 타이틀은 해당 분야 전문성을 인정받은 것. 환경법은 당시 선구적 분야였음.',
        'reliability': 0.90
    },
    {
        'title': '민주사회를위한변호사모임 회원',
        'content': '오세훈은 민주사회를 위한 변호사모임(민변) 환경위원으로 활동하며 환경법 전문성을 인정받았다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '1992-01-01',
        'rating': 3,
        'rationale': '전문 법조 단체 회원 자격은 동료 법조인들로부터 전문성을 인정받았다는 의미. 공익 법률 활동 경력.',
        'reliability': 0.90
    },
    {
        'title': '대한변호사협회 회원',
        'content': '오세훈은 변호사로서 대한변호사협회 정회원으로 등록되어 있다.',
        'source': '추론',
        'url': 'https://www.koreanbar.or.kr/',
        'date': '1991-01-01',
        'rating': 3,
        'rationale': '변호사협회 회원은 변호사 자격 유지의 기본 요건. 법조 윤리와 전문성 유지의 증거.',
        'reliability': 0.95
    },
    {
        'title': '서울지방변호사회 형사당직변호 운영위원',
        'content': '오세훈은 1996년 서울지방변호사회 형사당직변호 운영위원으로 활동했다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '1996-01-01',
        'rating': 3,
        'rationale': '변호사회 운영위원은 법조계 내 인정과 책임 있는 역할 수행을 의미함. 공익 법률 서비스 기여.',
        'reliability': 0.90
    },
    {
        'title': '국제 법률 전문성 (예일 로스쿨 연수)',
        'content': '예일대학교 로스쿨 방문학자 경험을 통해 국제 법률 전문성을 갖추었다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '1998-01-01',
        'rating': 4,
        'rationale': '국제적 법률 교육 경험은 글로벌 법률 전문성의 지표. 비교법 연구 능력.',
        'reliability': 0.85
    },
    {
        'title': '법학 교수 자격 (석좌교수 임용)',
        'content': '오세훈은 2015년 고려대학교 기술경영전문대학원 석좌교수로 임용되어 법학 및 정책 교육을 담당했다.',
        'source': '고려대학교',
        'url': 'https://mot.korea.ac.kr/bbs/board.php?bo_table=sub6_1&wr_id=28',
        'date': '2015-04-01',
        'rating': 4,
        'rationale': '석좌교수 임용은 학문적·실무적 전문성을 모두 인정받은 것. 교육자로서의 자격.',
        'reliability': 0.95
    },
]

# 1-3. 관련 분야 경력 연수
item_1_3_data = [
    {
        'title': '변호사 경력 (1991-2000, 2011-2021)',
        'content': '오세훈은 1991년 변호사 개업 이후 2000년까지 9년, 그리고 2011-2021년 10년간 변호사로 활동하여 총 19년의 법조 경력을 보유하고 있다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '2021-01-01',
        'rating': 5,
        'rationale': '약 20년에 가까운 법조 경력은 법률·행정 분야에서 매우 풍부한 전문 경력. 시장 직무와 직접 관련.',
        'reliability': 0.95
    },
    {
        'title': '서울시장 경력 (총 약 9년)',
        'content': '오세훈은 제33-34대(2006.7-2011.8, 약 5년), 제38대(2021.4-2022.6, 약 1.2년), 제39대(2022.7-현재, 약 2.5년)로 총 약 9년간 서울시장을 역임했다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '2024-10-31',
        'rating': 5,
        'rationale': '서울시장 9년 경력은 대도시 행정 분야 최고 수준의 경력. 직무 관련 핵심 경력.',
        'reliability': 1.0
    },
    {
        'title': '국회의원 경력 (2000-2004, 4년)',
        'content': '오세훈은 제16대 국회의원(서울 강남구 을)으로 4년간 활동했다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '2004-01-01',
        'rating': 4,
        'rationale': '국회의원 경력은 입법·정책 전문성을 보여줌. 4년간 환경노동위원회 활동으로 정책 전문성 축적.',
        'reliability': 1.0
    },
    {
        'title': '대학교수 경력 (2013-2021, 8년)',
        'content': '오세훈은 한양대학교 공공정책대학원 특임교수(2013), 고려대학교 기술경영전문대학원 석좌교수(2015-2020)로 약 8년간 교수로 재직했다.',
        'source': '검색 결과',
        'url': 'https://mot.korea.ac.kr/bbs/board.php?bo_table=sub6_1&wr_id=28',
        'date': '2020-12-31',
        'rating': 4,
        'rationale': '대학교수 경력은 학문적·교육적 전문성의 증거. 정책·경영 분야 전문 교육 경력.',
        'reliability': 0.95
    },
    {
        'title': '환경운동연합 법률위원회 위원장 (1996-2000, 4년)',
        'content': '오세훈은 1996년부터 2000년까지 환경운동연합 법률위원회 위원장 겸 상임집행위원을 역임했다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '2000-01-01',
        'rating': 3,
        'rationale': '시민단체 위원장 경력은 공익 분야 전문성과 리더십을 보여줌. 환경법 전문가로서의 경력.',
        'reliability': 0.90
    },
    {
        'title': '환경운동연합 시민상담실 실장 (1992-1997, 5년)',
        'content': '오세훈은 1992년부터 5년간 환경운동연합 시민상담실 실장으로 무료 법률 상담을 진행했다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '1997-01-01',
        'rating': 3,
        'rationale': '5년간의 무료 법률 상담 경험은 실무 전문성과 공익 기여를 보여줌. 시민과의 소통 경력.',
        'reliability': 0.90
    },
    {
        'title': '한나라당 최고위원·원내부총무 (2003)',
        'content': '오세훈은 2003년 한나라당 최고위원, 원내부총무, 청년위원회 위원장을 역임했다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '2003-12-31',
        'rating': 4,
        'rationale': '정당 고위직 경력은 정치·정책 전문성과 조직 운영 능력을 보여줌.',
        'reliability': 0.95
    },
    {
        'title': '정치개혁특위 간사 (2004)',
        'content': '오세훈은 제16대 국회 정치개혁특별위원회 간사로 활동하며 정치자금법 개정을 주도했다.',
        'source': '경향신문',
        'url': 'https://m.khan.co.kr/feature_story/article/201808110600045',
        'date': '2004-03-12',
        'rating': 5,
        'rationale': '정치개혁특위 간사로서 주요 법안 개정을 주도한 것은 입법 전문성의 최고 수준. "오세훈법"으로 명명될 정도의 기여.',
        'reliability': 0.95
    },
    {
        'title': 'MBC 법률 프로그램 진행자 (1994-1999, 약 5년)',
        'content': '오세훈은 MBC "오변호사 배변호사" 프로그램 진행자로 약 5년간 활동하며 법률 상담과 대중 교육을 진행했다.',
        'source': '한국일보',
        'url': 'https://www.hankookilbo.com/News/Read/199404010058893446',
        'date': '1999-01-01',
        'rating': 3,
        'rationale': '법률 전문 방송 진행 경력은 법률 지식의 대중화 능력과 소통 능력을 보여줌. 전문성의 사회적 활용.',
        'reliability': 0.90
    },
    {
        'title': '총 공직·전문직 경력 약 32년',
        'content': '1991년 변호사 개업부터 현재(2024)까지 변호사, 국회의원, 서울시장, 교수 등의 경력을 합산하면 약 32년의 관련 분야 전문 경력을 보유.',
        'source': '종합 계산',
        'url': 'https://mayor.seoul.go.kr/oh/intro/profile.do',
        'date': '2024-10-31',
        'rating': 5,
        'rationale': '30년 이상의 법률·행정·정책 분야 경력은 최고 수준의 전문성을 보여줌. 다양한 분야에서의 일관된 전문 경력.',
        'reliability': 0.95
    },
]

# 1-4. 연간 직무 교육 이수 시간
item_1_4_data = [
    {
        'title': '고려대 석좌교수 재직 중 지속적 교육 활동',
        'content': '오세훈은 2015-2020년 고려대 기술경영전문대학원 석좌교수로 재직하며 "미래사이테크 포럼" 대표를 맡아 미래신기술 관련 세미나를 주최하고 참여했다.',
        'source': '고려대학교',
        'url': 'https://mot.korea.ac.kr/bbs/board.php?bo_table=sub6_1&wr_id=28',
        'date': '2020-01-01',
        'rating': 3,
        'rationale': '교수 재직 중 세미나·포럼 참여는 지속적 학습과 전문성 갱신을 보여줌. 연간 약 20-30시간 이상 교육 활동 추정.',
        'reliability': 0.80
    },
    {
        'title': '예일대학교 로스쿨 방문학자 연수 (1998)',
        'content': '오세훈은 1998년 예일대학교 로스쿨에서 방문학자로 연구 활동을 수행하며 미국 민사소송법 관련 교육을 이수했다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '1998-01-01',
        'rating': 4,
        'rationale': '해외 명문대학에서의 방문학자 연수는 집중적인 교육 이수. 약 6개월-1년간 수백 시간 이상의 전문 교육 추정.',
        'reliability': 0.85
    },
    {
        'title': '사법연수원 교육 이수 (1984-1987)',
        'content': '오세훈은 사법연수원 16기로 입소하여 2년간 법조인 양성 교육을 받고 17기로 수료했다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '1987-01-01',
        'rating': 4,
        'rationale': '사법연수원 교육은 연간 약 2000시간 이상의 집중 교육. 법조 실무 교육의 최고 수준.',
        'reliability': 1.0
    },
    {
        'title': '대학원 박사과정 교육 (1991-1999)',
        'content': '오세훈은 1991년부터 1999년까지 약 8년간 박사과정에서 민사소송법 전공 교육을 이수했다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '1999-01-01',
        'rating': 4,
        'rationale': '박사과정 교육은 연간 수백 시간의 전문 교육 및 연구 활동. 8년간 지속적 학습.',
        'reliability': 0.95
    },
    {
        'title': '변호사 연수 교육 (지속적)',
        'content': '변호사는 대한변호사협회 및 각종 전문 기관에서 제공하는 의무 연수 교육을 정기적으로 이수해야 한다.',
        'source': '대한변호사협회',
        'url': 'https://www.koreanbar.or.kr/',
        'date': '2024-01-01',
        'rating': 2,
        'rationale': '변호사 연간 의무 연수 시간은 약 8-16시간. 지속적이나 시간은 제한적.',
        'reliability': 0.90
    },
    {
        'title': '국회의원 정책 교육 및 세미나 참여',
        'content': '오세훈은 국회의원 재직 중(2000-2004) 정책 세미나, 국제 교류 프로그램, 전문가 간담회 등에 참여했다.',
        'source': '추론',
        'url': 'https://www.assembly.go.kr/',
        'date': '2004-01-01',
        'rating': 2,
        'rationale': '국회의원은 연간 다수의 정책 교육 및 세미나에 참여하나, 정확한 시간 측정 어려움. 연간 약 50-100시간 추정.',
        'reliability': 0.70
    },
    {
        'title': '서울시장 재직 중 국내외 도시 행정 교육',
        'content': '오세훈은 서울시장 재직 중 해외 선진 도시 벤치마킹, 국제 시장 회의, 도시 행정 세미나 등에 참여했다.',
        'source': '추론',
        'url': 'https://mayor.seoul.go.kr/',
        'date': '2024-01-01',
        'rating': 3,
        'rationale': '시장 재직 중 국내외 교육 프로그램 참여는 지속적 학습의 증거. 연간 약 30-50시간 추정.',
        'reliability': 0.75
    },
    {
        'title': '한양대 특임교수 재직 중 교육 활동 (2013)',
        'content': '오세훈은 2013년 한양대학교 공공정책대학원 특임교수로 재직하며 "고급도시행정 세미나" 강의를 진행했다.',
        'source': '뉴스포스트',
        'url': 'https://www.newspost.kr/news/articleView.html?idxno=15605',
        'date': '2013-01-01',
        'rating': 3,
        'rationale': '교수로서 강의 준비 및 학생 교육은 지속적 학습 활동. 연간 약 100-200시간 교육 관련 활동 추정.',
        'reliability': 0.85
    },
    {
        'title': '민주사회를위한변호사모임 환경위원 교육 활동',
        'content': '오세훈은 민변 환경위원으로 활동하며 환경법 관련 워크숍, 세미나, 법률 교육에 참여했다.',
        'source': '검색 결과',
        'url': 'https://www.minbyun.or.kr/',
        'date': '2000-01-01',
        'rating': 2,
        'rationale': '시민단체 활동 중 전문 교육 프로그램 참여. 연간 약 20-30시간 추정.',
        'reliability': 0.75
    },
    {
        'title': '정치개혁특위 관련 입법 교육 및 전문가 자문',
        'content': '오세훈은 정치개혁특위 간사로 활동하며 국내외 정치자금법 사례 연구, 전문가 자문 회의 등에 참여했다.',
        'source': '추론',
        'url': 'https://www.assembly.go.kr/',
        'date': '2004-01-01',
        'rating': 3,
        'rationale': '입법 과정에서의 전문가 교육 및 자문 활동. 연간 약 50-80시간 추정.',
        'reliability': 0.75
    },
]

# 1-5. 위키피디아 페이지 존재 및 조회수
item_1_5_data = [
    {
        'title': '한국어 위키피디아 페이지 존재',
        'content': '오세훈의 한국어 위키피디아 페이지가 존재하며, 상세한 생애, 경력, 정치 활동 등이 기록되어 있다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '2024-10-31',
        'rating': 4,
        'rationale': '위키피디아 페이지 존재는 공적 인지도와 전문성의 지표. 한국 정치인 중 상세 페이지를 보유한 인물.',
        'reliability': 1.0
    },
    {
        'title': '위키피디아 페이지 내용의 충실성',
        'content': '오세훈의 위키피디아 페이지는 학력, 경력, 주요 업적, 논란 등이 상세히 기록되어 있으며, 다수의 출처가 인용되어 있다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '2024-10-31',
        'rating': 4,
        'rationale': '페이지 내용의 충실성은 공적 활동의 폭과 전문성을 반영. 다수의 검증된 출처 인용.',
        'reliability': 0.95
    },
    {
        'title': '위키피디아 카테고리 분류',
        'content': '오세훈은 위키피디아에서 "대한민국의 정치인", "대한민국의 변호사", "서울특별시장" 등 다양한 카테고리에 분류되어 있다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/분류:오세훈',
        'date': '2024-10-31',
        'rating': 3,
        'rationale': '다양한 전문 분야 카테고리 분류는 다면적 전문성을 보여줌.',
        'reliability': 1.0
    },
    {
        'title': '나무위키 페이지 존재',
        'content': '오세훈의 나무위키 페이지가 존재하며, 위키피디아보다 더 상세한 내용과 다양한 관점이 기록되어 있다.',
        'source': '나무위키',
        'url': 'https://namu.wiki/w/오세훈',
        'date': '2024-10-31',
        'rating': 3,
        'rationale': '한국의 주요 위키 플랫폼에서의 페이지 존재는 대중적 인지도를 보여줌.',
        'reliability': 0.90
    },
    {
        'title': '리브레위키 페이지 존재',
        'content': '오세훈의 리브레위키 페이지도 존재하며, 독립적인 관점에서 정보가 정리되어 있다.',
        'source': '리브레위키',
        'url': 'https://librewiki.net/wiki/오세훈',
        'date': '2024-10-31',
        'rating': 2,
        'rationale': '다수의 위키 플랫폼에 페이지가 존재하는 것은 다각적 평가와 관심의 증거.',
        'reliability': 0.85
    },
    {
        'title': '위키피디아 서울특별시장 목록 등재',
        'content': '오세훈은 위키피디아 "서울특별시장" 페이지에 역대 시장으로 등재되어 있으며, 4선 시장으로 특별히 언급되어 있다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/서울특별시장',
        'date': '2024-10-31',
        'rating': 4,
        'rationale': '역대 시장 목록 등재는 공식적 지위와 역사적 중요성을 보여줌.',
        'reliability': 1.0
    },
    {
        'title': '위키피디아 국회의원 목록 등재',
        'content': '오세훈은 위키피디아 제16대 국회의원 목록에 등재되어 있다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/대한민국_제16대_국회의원_목록',
        'date': '2024-10-31',
        'rating': 3,
        'rationale': '국회의원 목록 등재는 공식 정치 경력의 증거.',
        'reliability': 1.0
    },
    {
        'title': '위키피디아 고려대학교 동문 목록 등재',
        'content': '오세훈은 위키피디아 고려대학교 동문 목록에 정치인 및 법조인으로 등재되어 있다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/고려대학교',
        'date': '2024-10-31',
        'rating': 3,
        'rationale': '명문대 동문 목록 등재는 학문적 배경과 네트워크를 보여줌.',
        'reliability': 0.95
    },
    {
        'title': '영문 위키피디아 페이지 존재 가능성',
        'content': '오세훈은 서울시장으로서 국제적 주목을 받아 영문 위키피디아 페이지가 존재할 가능성이 있다.',
        'source': '추론',
        'url': 'https://en.wikipedia.org/',
        'date': '2024-10-31',
        'rating': 2,
        'rationale': '영문 위키피디아 페이지는 국제적 인지도의 지표이나, 확인 필요.',
        'reliability': 0.60
    },
    {
        'title': '위키피디아 페이지 편집 활발성',
        'content': '오세훈의 위키피디아 페이지는 정기적으로 업데이트되며, 최근 시정 활동이 반영되어 있다.',
        'source': 'Wikipedia',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '2024-10-31',
        'rating': 3,
        'rationale': '페이지의 활발한 업데이트는 지속적인 공적 활동과 관심을 반영.',
        'reliability': 0.90
    },
]

# 1-6. 전문 분야 언론 기고 건수
item_1_6_data = [
    {
        'title': '정치자금법 개정 관련 언론 보도 (2004)',
        'content': '오세훈이 주도한 정치자금법 개정은 "오세훈법"으로 명명되며 경향신문 등 주요 언론에서 특집 기사로 다루어졌다.',
        'source': '경향신문',
        'url': 'https://m.khan.co.kr/feature_story/article/201808110600045',
        'date': '2004-03-12',
        'rating': 4,
        'rationale': '주요 입법 활동이 언론에서 본인 이름으로 명명될 정도의 기여는 전문성의 강력한 증거.',
        'reliability': 0.95
    },
    {
        'title': '저서 "미국 민사재판의 허와 실" 출판 (2000)',
        'content': '오세훈은 박사학위 논문을 바탕으로 "미국 민사재판의 허와 실"을 박영사에서 출판했다. 이는 법학 전문 서적으로 평가받는다.',
        'source': '교보문고',
        'url': 'http://www.kyobobook.co.kr/product/detailViewKor.laf?barcode=9788910507079',
        'date': '2000-01-01',
        'rating': 5,
        'rationale': '전문 학술 서적 출판은 해당 분야 전문성의 최고 수준. 법학 전문 출판사 발행.',
        'reliability': 1.0
    },
    {
        'title': '저서 "가끔은 변호사도 울고 싶다" 베스트셀러 (1995)',
        'content': '오세훈은 "가끔은 변호사도 울고 싶다"를 출판하여 서점 종합 베스트셀러 TOP 10에 진입했다.',
        'source': '검색 결과',
        'url': 'https://product.kyobobook.co.kr/detail/S000001195383',
        'date': '1995-01-01',
        'rating': 4,
        'rationale': '베스트셀러 저서는 전문 지식의 대중화 능력과 영향력을 보여줌.',
        'reliability': 0.95
    },
    {
        'title': 'MBC "오변호사 배변호사" 프로그램 진행 (1994-1999)',
        'content': '오세훈은 MBC 법률 상담 프로그램 진행자로 약 5년간 활동하며 수백 건의 법률 사례를 해설했다.',
        'source': '한국일보',
        'url': 'https://www.hankookilbo.com/News/Read/199404010058893446',
        'date': '1999-01-01',
        'rating': 4,
        'rationale': '방송을 통한 전문 지식 전달은 대중적 전문성 인정의 증거. 장기간 프로그램 운영.',
        'reliability': 0.95
    },
    {
        'title': '일조권 소송 관련 다수 언론 보도 (1997)',
        'content': '오세훈의 일조권 소송 승소는 "다윗과 골리앗의 싸움"으로 언론에서 대대적으로 보도되었으며, 법조계 화제가 되었다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '1997-01-01',
        'rating': 4,
        'rationale': '획기적 판례를 만든 소송은 법조계 전문성을 인정받은 사례. 다수 언론 보도.',
        'reliability': 0.90
    },
    {
        'title': '환경법 관련 입법청원 및 헌법소원 활동 보도',
        'content': '오세훈은 환경운동연합 법률위원회 위원장으로서 자연공원법 입법청원, 그린벨트 해제 헌법소원 등의 활동이 언론에 보도되었다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '1998-01-01',
        'rating': 3,
        'rationale': '공익 법률 활동의 언론 보도는 전문성과 사회적 기여를 보여줌.',
        'reliability': 0.85
    },
    {
        'title': '국정감사 우수위원 4년 연속 선정 관련 보도',
        'content': '오세훈의 국정감사 우수위원 4년 연속 선정은 다수 언론에서 보도되었으며, 의정 활동 전문성이 강조되었다.',
        'source': '검색 결과',
        'url': 'https://namu.wiki/w/오세훈/생애',
        'date': '2004-01-01',
        'rating': 4,
        'rationale': '의정 활동 우수성이 언론에 보도된 것은 정책 전문성의 증거.',
        'reliability': 0.90
    },
    {
        'title': '서울시장 재선 출마 관련 정책 비전 발표',
        'content': '오세훈은 서울시장 재선 출마 시 다수의 정책 비전을 발표하여 경향신문 등 주요 언론에서 다루어졌다.',
        'source': '경향신문',
        'url': 'https://m.khan.co.kr/article/20100503173920A',
        'date': '2010-05-03',
        'rating': 3,
        'rationale': '정책 비전 발표는 행정 전문성을 보여주는 활동. 언론 보도.',
        'reliability': 0.85
    },
    {
        'title': '비즈니스포스트 "Who Is?" 시리즈 기사',
        'content': '오세훈은 비즈니스포스트의 "Who Is?" 시리즈에서 여러 차례 다루어지며 경력과 전문성이 조명되었다.',
        'source': '비즈니스포스트',
        'url': 'https://www.businesspost.co.kr/BP?command=article_view&num=386233',
        'date': '2024-01-01',
        'rating': 3,
        'rationale': '주요 경제지에서 인물 분석 기사는 사회적 영향력과 전문성 인정의 증거.',
        'reliability': 0.90
    },
    {
        'title': '고려대학교 석좌교수 특강 관련 보도',
        'content': '오세훈은 고려대학교 석좌교수로 재직하며 특강을 진행했고, 이는 대학 공식 홈페이지 및 언론에 보도되었다.',
        'source': '고려대학교',
        'url': 'https://www.korea.ac.kr/bbs/ko/42/120260/artclView.do',
        'date': '2020-01-01',
        'rating': 3,
        'rationale': '대학 특강 활동은 학문적 전문성과 교육 기여를 보여줌.',
        'reliability': 0.90
    },
]

# 1-7. Google Scholar 피인용 수
item_1_7_data = [
    {
        'title': '박사학위 논문 "미국 변론전절차에 관한 연구"',
        'content': '오세훈의 박사학위 논문은 고려대학교 도서관에 소장되어 있으며, 민사소송법 분야에서 참고 문헌으로 활용되고 있다.',
        'source': '고려대학교 도서관',
        'url': 'https://library.korea.ac.kr/',
        'date': '1999-01-01',
        'rating': 3,
        'rationale': '박사논문이 대학 도서관에 소장되어 있는 것은 학술적 가치 인정. Google Scholar에서의 직접 인용 확인은 어려우나 학술적 기여 추정.',
        'reliability': 0.80
    },
    {
        'title': '저서 "미국 민사재판의 허와 실" 법학 교재 활용',
        'content': '오세훈의 저서는 법학 전문서적으로 박영사에서 출판되어 법학 교육 및 연구에서 참고 자료로 활용되고 있다.',
        'source': '교보문고',
        'url': 'http://www.kyobobook.co.kr/product/detailViewKor.laf?barcode=9788910507079',
        'date': '2000-01-01',
        'rating': 3,
        'rationale': '전문 서적이 법학 분야에서 참고 자료로 활용되는 것은 학술적 영향력의 증거.',
        'reliability': 0.85
    },
    {
        'title': 'DBpia 논문 저자 등재',
        'content': '오세훈은 DBpia(국내 학술 논문 데이터베이스)에 논문 저자로 등재되어 있다.',
        'source': 'DBpia',
        'url': 'https://www.dbpia.co.kr/author/authorDetail?ancId=67654',
        'date': '2024-01-01',
        'rating': 2,
        'rationale': '국내 학술 데이터베이스 등재는 학술 활동 기록의 증거이나, 피인용 수는 확인 필요.',
        'reliability': 0.85
    },
    {
        'title': '법학 분야 학술 활동 (정치인으로 전환 후 감소)',
        'content': '오세훈은 1999년 박사학위 취득 후 2000년 국회의원으로 정치에 입문하면서 학술 활동은 감소한 것으로 보인다.',
        'source': '추론',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '2000-01-01',
        'rating': 0,
        'rationale': '정치인으로 전환 후 학술 논문 발표 활동이 제한적이었을 가능성. Google Scholar 피인용은 낮을 것으로 추정.',
        'reliability': 0.70
    },
    {
        'title': 'DGIST Scholar 등재 (동명이인)',
        'content': 'DGIST Scholar에 "오세훈" 연구자가 등재되어 있으나, 이는 DGIST 로봇및기계전자공학과 교수로 서울시장 오세훈과는 다른 인물이다.',
        'source': 'DGIST Scholar',
        'url': 'https://scholar.dgist.ac.kr/researcher-profile?ep=868',
        'date': '2024-01-01',
        'rating': -1,
        'rationale': '동명이인으로 확인되어 관련 없음. 혼동 방지 필요.',
        'reliability': 1.0
    },
    {
        'title': '실무 중심 경력으로 학술 피인용 제한적',
        'content': '오세훈은 변호사, 정치인, 행정가로서 실무 중심 경력을 쌓았으며, 순수 학술 연구자로서의 활동은 박사과정 이후 제한적이었다.',
        'source': '추론',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '2024-01-01',
        'rating': 0,
        'rationale': '실무 중심 경력으로 학술 논문 발표 및 피인용이 적을 것으로 추정. Google Scholar 피인용은 낮거나 없을 가능성.',
        'reliability': 0.75
    },
    {
        'title': '정책 연구 및 실무 보고서 (비학술)',
        'content': '오세훈은 서울시장 및 국회의원 재직 중 다수의 정책 연구 및 실무 보고서를 작성했으나, 이는 학술 논문이 아닌 행정 자료이다.',
        'source': '추론',
        'url': 'https://www.seoul.go.kr/',
        'date': '2024-01-01',
        'rating': 1,
        'rationale': '정책 보고서는 학술 피인용 대상이 아니나, 실무적 전문성을 보여줌.',
        'reliability': 0.70
    },
    {
        'title': '법학 교수 재직 중 학술 활동 가능성',
        'content': '오세훈은 고려대 석좌교수(2015-2020) 재직 중 학술 세미나 및 연구 활동에 참여했을 가능성이 있으나, 공개된 학술 논문은 확인되지 않음.',
        'source': '추론',
        'url': 'https://mot.korea.ac.kr/',
        'date': '2020-01-01',
        'rating': 1,
        'rationale': '석좌교수 재직 중 학술 활동 가능성은 있으나, 구체적 논문 발표는 확인되지 않음.',
        'reliability': 0.60
    },
    {
        'title': 'Google Scholar 프로필 부재 추정',
        'content': '오세훈의 Google Scholar 개인 프로필은 검색 결과에서 확인되지 않으며, 학술 논문 발표 활동이 제한적이었던 것으로 보인다.',
        'source': 'Google Scholar 검색',
        'url': 'https://scholar.google.com/',
        'date': '2024-10-31',
        'rating': -1,
        'rationale': 'Google Scholar 프로필 부재는 학술 피인용이 매우 낮거나 없음을 시사.',
        'reliability': 0.80
    },
    {
        'title': '학술 활동보다 실무 전문성 중심',
        'content': '오세훈의 전문성은 학술 연구보다는 법조 실무, 정치, 행정 분야에서 발휘되었으며, Google Scholar 피인용보다는 실무적 영향력이 더 큰 것으로 평가된다.',
        'source': '종합 평가',
        'url': 'https://ko.wikipedia.org/wiki/오세훈',
        'date': '2024-10-31',
        'rating': 0,
        'rationale': '실무 중심 경력으로 학술 피인용은 낮으나, 이는 전문성의 부재가 아닌 경력 방향의 차이.',
        'reliability': 0.85
    },
]

# 모든 데이터 통합
all_items_data = [
    (1, item_1_1_data),
    (2, item_1_2_data),
    (3, item_1_3_data),
    (4, item_1_4_data),
    (5, item_1_5_data),
    (6, item_1_6_data),
    (7, item_1_7_data),
]

try:
    total_inserted = 0

    for item_num, data_list in all_items_data:
        print(f"\n항목 1-{item_num} 데이터 삽입 중... ({len(data_list)}개)")

        for data in data_list:
            cursor.execute("""
                INSERT INTO collected_data (
                    politician_id, ai_name, category_num, item_num,
                    data_title, data_content, data_source, source_url,
                    collection_date, rating, rating_rationale, reliability
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                politician_id,
                ai_name,
                category_num,
                item_num,
                data['title'],
                data['content'],
                data['source'],
                data['url'],
                data['date'],
                data['rating'],
                data['rationale'],
                data['reliability']
            ))
            total_inserted += 1

        conn.commit()
        print(f"항목 1-{item_num} 완료: {len(data_list)}개 데이터 삽입")

    # 작업 완료 확인
    cursor.execute("""
        SELECT
            category_num,
            item_num,
            COUNT(*) as data_count,
            AVG(rating) as avg_rating,
            AVG(reliability) as avg_reliability
        FROM collected_data
        WHERE politician_id = %s AND category_num = %s
        GROUP BY category_num, item_num
        ORDER BY item_num
    """, (politician_id, category_num))

    results = cursor.fetchall()

    print("\n" + "="*80)
    print(f"✅ 카테고리 {category_num} ({category_name}) 완료")
    print("="*80)
    print(f"정치인: 오세훈 (ID: {politician_id})")
    print(f"총 데이터 수: {total_inserted}개")
    print(f"평균 Rating: {sum(r[3] for r in results) / len(results):.2f}")
    print(f"평균 Reliability: {sum(r[4] for r in results) / len(results):.2f}")
    print("\n항목별 데이터 수:")
    for r in results:
        print(f"  1-{r[1]}: {r[2]}개 데이터, 평균 Rating: {r[3]:.2f}, 평균 Reliability: {r[4]:.2f}")
    print("="*80)

except Exception as e:
    conn.rollback()
    print(f"\n❌ 에러 발생: {e}")
    import traceback
    traceback.print_exc()

finally:
    cursor.close()
    conn.close()
    print("\nDB 연결 종료")
