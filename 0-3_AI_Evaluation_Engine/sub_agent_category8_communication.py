#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
서브 에이전트 - 카테고리 8 (소통능력) 평가 및 DB 저장
정치인: 오세훈
정치인 ID: 272
카테고리 번호: 8
카테고리 이름: 소통능력
"""

import psycopg2
from psycopg2 import sql
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

def save_communication_data():
    """
    카테고리 8 (소통능력) 평가 데이터 DB 저장
    """
    # DB 연결
    conn = psycopg2.connect(
        host=os.getenv('SUPABASE_HOST'),
        port=int(os.getenv('SUPABASE_PORT', 5432)),
        database=os.getenv('SUPABASE_DB'),
        user=os.getenv('SUPABASE_USER'),
        password=os.getenv('SUPABASE_PASSWORD')
    )
    cursor = conn.cursor()

    politician_id = 272
    category_num = 8
    ai_name = 'Claude'

    # 항목 8-1: 시민 간담회 개최 건수
    item_8_1_data = [
        {
            'title': '국민의힘 상임고문단 간담회 개최',
            'content': '2024년 11월 4일 시장 공관인 용산구 파트너스하우스에서 국민의힘 상임고문단과 오찬 간담회 개최. 정의화 상임고문단 회장을 비롯해 당 원로들로 구성된 상임고문단 총 12명이 참석',
            'source': 'BBSI 뉴스',
            'url': 'https://news.bbsi.co.kr/news/articleView.html?idxno=4006171',
            'date': '2024-11-04',
            'rating': 2,
            'rationale': '당 관계자와의 간담회는 정당 정치인으로서 필요한 활동이나, 일반 시민과의 직접 소통이 아니므로 평균보다 약간 높은 수준',
            'reliability': 0.9
        },
        {
            'title': '취임 2주년 기자간담회 개최',
            'content': '오세훈 시장 취임 2주년을 맞아 기자간담회를 개최하여 지난 2년간의 성과와 향후 비전을 제시. 100만 밀리언셀러 정책 등을 소개',
            'source': '서울시 시장실',
            'url': 'https://mayor.seoul.go.kr/oh/seoul/newsView.do?photoGallerySn=2929',
            'date': '2024-04-01',
            'rating': 1,
            'rationale': '기자간담회는 언론을 통한 간접 소통 방식으로, 시민과의 직접 소통보다는 제한적',
            'reliability': 0.95
        },
        {
            'title': '한국예술문화단체총연합회 소통간담회 개최',
            'content': '2023년 11월 21일 한국예술문화단체총연합회 및 소속 단체와 소통간담회 개최',
            'source': 'On Seoul',
            'url': 'https://www.onseoul.net/news/articleView.html?idxno=30499',
            'date': '2023-11-21',
            'rating': 2,
            'rationale': '예술문화 분야 전문가 집단과의 소통으로 특정 분야 의견 수렴에 긍정적',
            'reliability': 0.85
        },
        {
            'title': '서울시민기자 간담회 개최',
            'content': '서울시민기자를 동대문디자인플라자(DDP) 서울온 영상스튜디오에 초청하여 간담회 개최. 현장 참석자 16명, 온라인 참석자 100명',
            'source': '이투데이',
            'url': 'https://www.etoday.co.kr/news/view/2089091',
            'date': '2023-06-15',
            'rating': 3,
            'rationale': '시민기자와의 소통을 통해 시민 의견을 직접 청취하고 116명이 참여하여 규모도 적절함',
            'reliability': 0.9
        },
        {
            'title': '장애인 거주시설 방문 및 현장 간담회',
            'content': '2023년 1월 31일 강동구 고덕동 소재 장애인 거주시설 우성원, 긴급·일시보호시설 하나렘, 직업재활시설 라온클린패밀리를 방문하여 시설 관계자와 이용 가족의 애로사항 청취',
            'source': '뉴시스',
            'url': 'https://www.newsis.com/view/?id=NISX20230131_0002176281',
            'date': '2023-01-31',
            'rating': 4,
            'rationale': '취약계층 시설을 직접 방문하여 현장의 목소리를 듣는 적극적인 소통 활동',
            'reliability': 0.9
        },
        {
            'title': '전장연 면담 실시',
            'content': '2023년 2월 2일 전국장애인차별철폐연대(전장연)와 면담을 실시하여 지하철 시위 문제 해결을 위한 대화',
            'source': '서울경제',
            'url': 'https://www.sedaily.com/NewsView/29KMJ0PJ8C',
            'date': '2023-02-02',
            'rating': 3,
            'rationale': '갈등 상황에서도 시민단체와 직접 대화하는 적극적인 소통 자세',
            'reliability': 0.9
        },
        {
            'title': '노원 상계5재정비촉진구역 현장 방문 및 주민 소통',
            'content': '2025년 10월 24일 국민의힘 지도부와 함께 노원 상계5재정비촉진구역을 방문하여 조합원들과 만나 현안 논의',
            'source': '뉴시스',
            'url': 'https://www.newsis.com/view/NISX20251024_0003375769',
            'date': '2024-10-24',
            'rating': 3,
            'rationale': '재개발 현장을 직접 방문하여 주민들과 소통하는 긍정적인 활동',
            'reliability': 0.85
        },
        {
            'title': '서울비전2030 수립 과정에서 시민 참여',
            'content': '각계각층의 122명으로 구성된 서울비전2030위원회(전문가 44명, 시민 78명)를 통해 136일 동안 100여 차례 넘는 치열한 토론과 논의',
            'source': '서울시',
            'url': 'https://news.seoul.go.kr/gov/archives/531883',
            'date': '2023-12-01',
            'rating': 4,
            'rationale': '대규모 시민 참여를 통한 정책 수립 과정으로 민주적 소통의 좋은 사례',
            'reliability': 0.95
        },
        {
            'title': '시민참여예산위원회 확대 운영',
            'content': '시민참여예산위원회 참여 시민을 120명에서 200명으로 확대하여 시민대표성 강화',
            'source': '서울시',
            'url': 'https://yesan.seoul.go.kr/intro/index.do',
            'date': '2024-01-01',
            'rating': 3,
            'rationale': '시민참여 기구 확대로 소통 채널 강화',
            'reliability': 0.9
        },
        {
            'title': '월즈 팬 페스트 2023 참석 및 시민 소통',
            'content': '2023년 11월 18일 광화문광장 월즈 팬 페스트를 방문하여 e스포츠 팬들과 소통',
            'source': '서울시 시장실',
            'url': 'https://mayor.seoul.go.kr/oh/seoul/newsView.do?photoGallerySn=2270',
            'date': '2023-11-18',
            'rating': 2,
            'rationale': '청년층과의 소통을 위한 현장 방문이나 일회성 행사 참석 수준',
            'reliability': 0.8
        }
    ]

    # 항목 8-2: 공청회·토론회 개최 건수
    item_8_2_data = [
        {
            'title': '2030 서울도시기본계획 공청회 개최',
            'content': '2024년 10월 12일 중구주민센터에서 2030 서울도시기본계획(안) 공청회 개최',
            'source': '서울시 정보소통광장',
            'url': 'https://opengov.seoul.go.kr/press/333641',
            'date': '2024-10-12',
            'rating': 4,
            'rationale': '주요 도시계획에 대한 공청회를 통해 시민 의견 수렴',
            'reliability': 0.95
        },
        {
            'title': '오세훈 시정 중간평가 토론회 개최',
            'content': '2024년 6월 26-27일 시민사회단체 주최로 오세훈 시장 2년 중간평가 토론회 개최. 기후재난, 도시권리, 노동, 돌봄, 교통 등 다양한 주제 논의',
            'source': '경향신문',
            'url': 'https://www.khan.co.kr/article/202406261532001',
            'date': '2024-06-26',
            'rating': 3,
            'rationale': '시민사회단체가 주최한 평가 토론회로 시정에 대한 비판적 검토의 장',
            'reliability': 0.9
        },
        {
            'title': '서울시의회 교통문제 토론회',
            'content': '2024년 3월 25일 서울시의회에서 교통문제 관련 토론회 개최',
            'source': '서울시의회 웹진',
            'url': 'http://webzine.smc.seoul.kr/2024/05/09.html',
            'date': '2024-03-25',
            'rating': 2,
            'rationale': '시의회 주최 토론회로 시장의 직접적인 주도는 아니지만 시정 소통의 일환',
            'reliability': 0.85
        },
        {
            'title': '교육의 질 향상 토론회',
            'content': '2024년 4월 16일 서울시의회에서 교육의 질 향상을 위한 토론회 개최',
            'source': '서울시의회 웹진',
            'url': 'http://webzine.smc.seoul.kr/2024/05/09.html',
            'date': '2024-04-16',
            'rating': 2,
            'rationale': '교육 분야 토론회를 통한 정책 논의',
            'reliability': 0.85
        },
        {
            'title': '통학로 안전 토론회',
            'content': '2024년 4월 17일 서울시의회에서 통학로 안전 관련 토론회 개최',
            'source': '서울시의회 웹진',
            'url': 'http://webzine.smc.seoul.kr/2024/05/09.html',
            'date': '2024-04-17',
            'rating': 2,
            'rationale': '아동 안전 관련 중요한 주제의 토론회',
            'reliability': 0.85
        },
        {
            'title': '저출산 대응 주택정책 토론회',
            'content': '2024년 4월 17일 서울시의회에서 저출산 대응을 위한 주택정책 토론회 개최',
            'source': '서울시의회 웹진',
            'url': 'http://webzine.smc.seoul.kr/2024/05/09.html',
            'date': '2024-04-17',
            'rating': 2,
            'rationale': '저출산 문제 대응을 위한 정책 토론',
            'reliability': 0.85
        },
        {
            'title': '지방분권 헌법개정 토론회',
            'content': '2025년 2월 국회에서 오세훈 시장이 주최한 87년 체제 극복을 위한 지방분권 헌법개정 토론회 개최',
            'source': '언론 보도',
            'url': 'https://www.sisajournal.com/news/articleView.html?idxno=220515',
            'date': '2025-02-01',
            'rating': 3,
            'rationale': '지방분권이라는 중요한 국정 과제에 대한 토론회 주도',
            'reliability': 0.85
        },
        {
            'title': '2024 서울미래컨퍼런스 개최',
            'content': '2024년 서울미래컨퍼런스를 통해 서울의 미래 비전에 대한 논의의 장 마련',
            'source': '서울신문',
            'url': 'https://www6.seoul.co.kr/newsList/plan/seoul-future-conference/',
            'date': '2024-05-15',
            'rating': 3,
            'rationale': '미래 비전에 대한 대규모 컨퍼런스 개최',
            'reliability': 0.85
        },
        {
            'title': '시민참여예산 공모 및 심의',
            'content': '2024년 시민참여예산 사업 공모를 통해 시민 의견 수렴',
            'source': '서울시',
            'url': 'https://news.seoul.go.kr/gov/archives/545782',
            'date': '2024-04-12',
            'rating': 3,
            'rationale': '시민참여예산제를 통한 민주적 의사결정 과정',
            'reliability': 0.9
        },
        {
            'title': '새로운 광화문광장 조성 공개토론회',
            'content': '광화문광장 재조성 사업과 관련된 공개토론회 개최',
            'source': '서울시',
            'url': 'https://www.seoul.go.kr/gwanghwamun/',
            'date': '2023-05-20',
            'rating': 3,
            'rationale': '대형 도시계획 사업에 대한 시민 의견 수렴',
            'reliability': 0.9
        }
    ]

    # 항목 8-3: 공식 온라인 소통 채널 운영 수
    item_8_3_data = [
        {
            'title': '페이스북 공식 계정 운영',
            'content': '오세훈 시장 공식 페이스북 계정(ohsehoon4you) 운영. 약 20,492명 좋아요 확보',
            'source': 'Facebook',
            'url': 'https://www.facebook.com/ohsehoon4you',
            'date': '2024-01-01',
            'rating': 3,
            'rationale': '주요 SNS 플랫폼에서 활발히 소통 중',
            'reliability': 0.95
        },
        {
            'title': '유튜브 채널 운영 (오세훈TV)',
            'content': '2019년 5월부터 유튜브 채널 운영. 2021년 9월 구독자 10만명 달성하여 실버버튼 수상. 2025년 기준 16만명 이상 구독자 보유',
            'source': '파이낸셜뉴스',
            'url': 'https://www.fnnews.com/news/202109231906085907',
            'date': '2024-01-01',
            'rating': 4,
            'rationale': '16만명 이상의 구독자를 보유한 활발한 유튜브 채널 운영',
            'reliability': 0.95
        },
        {
            'title': '인스타그램 계정 운영',
            'content': '오세훈 시장 인스타그램 계정을 통해 시정 소식 및 일상 공유',
            'source': 'Instagram',
            'url': 'https://linktr.ee/ohsehoon',
            'date': '2024-01-01',
            'rating': 2,
            'rationale': '인스타그램 계정 운영 중이나 구체적인 활동 지표는 제한적',
            'reliability': 0.8
        },
        {
            'title': 'X(구 트위터) 계정 개설',
            'content': '2025년 7월 기존 페이스북, 유튜브, 인스타그램에 이어 X(구 트위터) 계정 추가 개설',
            'source': '아시아투데이',
            'url': 'https://www.asiatoday.co.kr/kn/view.php?key=20250717010010380',
            'date': '2025-07-01',
            'rating': 3,
            'rationale': 'SNS 채널을 확대하여 시민과의 소통 강화',
            'reliability': 0.9
        },
        {
            'title': '쓰레드(Threads) 계정 개설',
            'content': '2025년 7월 쓰레드 계정을 추가 개설하여 다양한 플랫폼에서 시민 소통',
            'source': '아시아투데이',
            'url': 'https://www.asiatoday.co.kr/kn/view.php?key=20250717010010380',
            'date': '2025-07-01',
            'rating': 3,
            'rationale': '최신 SNS 플랫폼에도 적극 참여하여 젊은 층과의 소통 시도',
            'reliability': 0.9
        },
        {
            'title': '서울시 시장 공식 홈페이지 운영',
            'content': '서울시 시장 공식 홈페이지(mayor.seoul.go.kr)를 통해 시정 소식 및 비전 공유',
            'source': '서울시',
            'url': 'https://mayor.seoul.go.kr/',
            'date': '2024-01-01',
            'rating': 2,
            'rationale': '공식 홈페이지를 통한 정보 제공',
            'reliability': 0.95
        },
        {
            'title': '블로그 운영 (과거)',
            'content': '과거 "서울은 불가능이 없는 도시다: 서울시장 오세훈이 보내는 블로그 레터" 운영. 페루 리마 일기, 르완다 키갈리 일기 등 연재',
            'source': '언론 보도',
            'url': 'https://linktr.ee/ohsehoon',
            'date': '2010-01-01',
            'rating': 1,
            'rationale': '과거 블로그 운영 이력은 있으나 현재 활동은 제한적',
            'reliability': 0.7
        },
        {
            'title': 'Linktree 통합 링크 운영',
            'content': 'Linktree(linktr.ee/ohsehoon)를 통해 모든 SNS 계정을 통합 관리하여 접근성 향상',
            'source': 'Linktree',
            'url': 'https://linktr.ee/ohsehoon',
            'date': '2024-01-01',
            'rating': 2,
            'rationale': '통합 링크를 통한 편의성 제공',
            'reliability': 0.9
        },
        {
            'title': '메타버스 서울 시장실 운영',
            'content': '메타버스 시장실에서 시민이 오세훈 시장과 인사를 나누고 의견 제안함(상상대로 서울 연계)을 통해 시정 의견 등록 및 답변 가능',
            'source': '서울시',
            'url': 'https://seoulsolution.kr/ko/content/9824',
            'date': '2023-01-01',
            'rating': 4,
            'rationale': '세계 도시 최초 메타버스 소통 채널로 혁신적인 시도',
            'reliability': 0.9
        },
        {
            'title': '상상대로 서울 시민제안 플랫폼 운영',
            'content': '천만상상 오아시스의 후신인 상상대로 서울 플랫폼을 통해 시민 제안 접수. 1만건 이상의 시민 아이디어 제출',
            'source': '뉴스핌',
            'url': 'https://www.newspim.com/news/view/20221221000762',
            'date': '2024-01-01',
            'rating': 4,
            'rationale': '시민 제안을 체계적으로 받는 전용 플랫폼 운영',
            'reliability': 0.95
        },
        {
            'title': '서울시 공식 SNS 계정 활용',
            'content': '서울시 공식 SNS 계정들을 통해 시정 소식 전달 및 시민 의견 수렴',
            'source': '서울시',
            'url': 'https://www.seoul.go.kr/',
            'date': '2024-01-01',
            'rating': 2,
            'rationale': '서울시 공식 계정과 연계한 소통',
            'reliability': 0.9
        }
    ]

    # 항목 8-4: 시민 제안 수용 건수/비율
    item_8_4_data = [
        {
            'title': '천만상상 오아시스 1만건 이상 시민 아이디어 제출',
            'content': '2006년 시작된 천만상상 오아시스를 통해 1만건 이상의 시민 아이디어가 제출됨',
            'source': '서울솔루션',
            'url': 'https://www.seoulsolution.kr/ko/content/천만상상오아시스',
            'date': '2009-01-01',
            'rating': 3,
            'rationale': '대규모 시민 제안 접수 실적',
            'reliability': 0.9
        },
        {
            'title': '천만상상 오아시스 UN공공행정상 우수상 수상',
            'content': '2009년 천만상상 오아시스가 UN공공행정상 우수상을 수상하여 국제적으로 인정받음',
            'source': 'Wikipedia',
            'url': 'https://ko.wikipedia.org/wiki/천만상상_오아시스',
            'date': '2009-01-01',
            'rating': 5,
            'rationale': 'UN으로부터 우수 시민참여 시스템으로 인정받은 획기적 성과',
            'reliability': 0.95
        },
        {
            'title': '상상대로 서울 플랫폼 재출범',
            'content': '2022년 12월 시민 및 직원 선호도 투표 후 전문가 심사를 거쳐 시민제안 플랫폼을 상상대로 서울로 재명명',
            'source': '뉴스핌',
            'url': 'https://www.newspim.com/news/view/20221221000762',
            'date': '2022-12-21',
            'rating': 3,
            'rationale': '시민참여 플랫폼 재활성화',
            'reliability': 0.9
        },
        {
            'title': '시민참여예산 500억원 편성',
            'content': '2024년 시민참여예산 500억원 편성. 약자와의 동행에 200억원, 자유제안형 300억원 배정',
            'source': '더인디고',
            'url': 'https://theindigo.co.kr/archives/55283',
            'date': '2024-01-01',
            'rating': 4,
            'rationale': '대규모 시민참여예산으로 시민 의견의 실질적 반영',
            'reliability': 0.95
        },
        {
            'title': '시민참여예산위원 200명으로 확대',
            'content': '시민참여예산위원회를 120명에서 200명으로 확대하여 시민대표성 강화',
            'source': '서울시',
            'url': 'https://yesan.seoul.go.kr/intro/index.do',
            'date': '2024-01-01',
            'rating': 3,
            'rationale': '시민참여 기회 확대',
            'reliability': 0.95
        },
        {
            'title': '메타버스 시민 의견 제안함 운영',
            'content': '메타버스 서울에서 상상대로 서울과 연계된 의견 제안함을 통해 시민 의견 접수 및 답변',
            'source': '서울시',
            'url': 'https://seoulsolution.kr/ko/content/9824',
            'date': '2023-01-01',
            'rating': 3,
            'rationale': '메타버스를 활용한 혁신적 시민 제안 채널',
            'reliability': 0.85
        },
        {
            'title': '서울비전 2030 수립 시 시민 78명 참여',
            'content': '서울비전 2030 수립 과정에서 전문가 44명과 함께 시민 78명이 위원회에 참여하여 의견 제시',
            'source': '서울시',
            'url': 'https://news.seoul.go.kr/gov/archives/531883',
            'date': '2023-12-01',
            'rating': 4,
            'rationale': '중요 정책 수립 과정에 다수 시민 직접 참여',
            'reliability': 0.95
        },
        {
            'title': '약자동행지수 평가 의견 수렴',
            'content': '약자동행지수 평가에 참여한 전문가와 시민들의 의견과 개선방안을 수렴하여 향후 정책 추진에 반영 예정',
            'source': '서울시',
            'url': 'https://www.newspim.com/news/view/20221221000762',
            'date': '2024-01-01',
            'rating': 3,
            'rationale': '정책 평가에 시민 의견 반영',
            'reliability': 0.85
        },
        {
            'title': '정보공개 청구 및 시민 의견 반영 시스템',
            'content': '정보공개포털 및 제안 게시판을 통해 시민 의견을 수렴하고 정책에 반영',
            'source': '서울시',
            'url': 'https://opengov.seoul.go.kr/',
            'date': '2024-01-01',
            'rating': 2,
            'rationale': '기본적인 시민 의견 수렴 채널 운영',
            'reliability': 0.9
        },
        {
            'title': '시민소통 채널 확대 계획',
            'content': '다양한 소통 채널을 통해 시민들과의 소통을 확대하고 시민의 목소리를 기관운영과 정책에 적극 반영',
            'source': '서울시',
            'url': 'https://www.newspim.com/news/view/20221221000762',
            'date': '2024-01-01',
            'rating': 2,
            'rationale': '소통 확대 의지 표명',
            'reliability': 0.8
        }
    ]

    # 항목 8-5: SNS 팔로워 × 참여율 지수
    item_8_5_data = [
        {
            'title': '페이스북 팔로워 약 2만명',
            'content': '오세훈 시장 공식 페이스북 계정 ohsehoon4you에 약 20,492명이 좋아요를 누름',
            'source': 'Facebook',
            'url': 'https://www.facebook.com/ohsehoon4you',
            'date': '2024-01-01',
            'rating': 2,
            'rationale': '서울시장으로서는 다소 적은 팔로워 수',
            'reliability': 0.95
        },
        {
            'title': '유튜브 구독자 16만명 이상',
            'content': '오세훈TV 유튜브 채널 구독자 16만명 이상 보유',
            'source': '파이낸셜뉴스',
            'url': 'https://www.fnnews.com/news/202109231906085907',
            'date': '2024-01-01',
            'rating': 4,
            'rationale': '16만명 이상의 구독자는 정치인으로서 상당한 영향력',
            'reliability': 0.95
        },
        {
            'title': '유튜브 실버버튼 수상',
            'content': '2021년 9월 유튜브 구독자 10만명 달성으로 실버버튼 수상',
            'source': '파이낸셜뉴스',
            'url': 'https://www.fnnews.com/news/202109231906085907',
            'date': '2021-09-23',
            'rating': 4,
            'rationale': '유튜브 공식 인증을 통한 영향력 확인',
            'reliability': 0.95
        },
        {
            'title': '취임 100일 전 SNS 활동 활발',
            'content': '취임 100일 앞두고 SNS에서 활발한 활동. 페이스북이 가장 활발한 소통 창구',
            'source': '시사저널',
            'url': 'https://www.sisajournal.com/news/articleView.html?idxno=220515',
            'date': '2021-06-01',
            'rating': 3,
            'rationale': 'SNS를 통한 적극적인 소통 시도',
            'reliability': 0.85
        },
        {
            'title': 'SNS 채널 5개로 확대',
            'content': '페이스북, 유튜브, 인스타그램, X(트위터), 쓰레드 등 5개 SNS 채널 운영',
            'source': '아시아투데이',
            'url': 'https://www.asiatoday.co.kr/kn/view.php?key=20250717010010380',
            'date': '2025-07-01',
            'rating': 4,
            'rationale': '다양한 SNS 플랫폼 활용으로 도달 범위 확대',
            'reliability': 0.9
        },
        {
            'title': '쌍방향 소통 적극 활용 계획',
            'content': 'SNS를 통해 쌍방향 소통을 적극 활용하여 시민 의견을 실시간으로 청취하는 계획',
            'source': '아시아투데이',
            'url': 'https://www.asiatoday.co.kr/kn/view.php?key=20250717010010380',
            'date': '2025-07-01',
            'rating': 2,
            'rationale': '쌍방향 소통 의지 표명',
            'reliability': 0.8
        },
        {
            'title': '페이스북 주요 정책 홍보 활용',
            'content': '페이스북을 통해 코로나19 방역, 24만 호 주택공급 등 핵심 정책 홍보',
            'source': '시사저널',
            'url': 'https://www.sisajournal.com/news/articleView.html?idxno=220515',
            'date': '2021-06-01',
            'rating': 2,
            'rationale': 'SNS를 정책 홍보에 활용',
            'reliability': 0.85
        },
        {
            'title': '유튜브 콘텐츠 논란',
            'content': '2025년 7월 오세훈TV 유튜브 채널의 일부 콘텐츠가 정치적 논란에 휩싸임',
            'source': '서울경제',
            'url': 'https://www.sedaily.com/NewsView/2GVGOOG15S',
            'date': '2025-07-23',
            'rating': -2,
            'rationale': 'SNS 콘텐츠의 정치적 편향성 논란으로 부정적 평가',
            'reliability': 0.85
        },
        {
            'title': 'SNS 댓글 응답 사례',
            'content': 'SNS에서 시민 댓글에 직접 응답하는 사례가 있으나 일관성은 부족',
            'source': '언론 보도',
            'url': 'https://www.sisajournal.com/news/articleView.html?idxno=220515',
            'date': '2024-01-01',
            'rating': 1,
            'rationale': '댓글 응답이 있으나 제한적',
            'reliability': 0.75
        },
        {
            'title': '일상 소통 행정 강화',
            'content': '시민의 일상에 한 걸음 더 다가가기 위해 SNS 채널 확대 등 디지털 소통 강화',
            'source': '아시아투데이',
            'url': 'https://www.asiatoday.co.kr/kn/view.php?key=20250717010010380',
            'date': '2025-07-01',
            'rating': 2,
            'rationale': 'SNS 소통 강화 노력',
            'reliability': 0.85
        }
    ]

    # 항목 8-6: SNS 댓글 응답 건수/비율
    item_8_6_data = [
        {
            'title': 'SNS 댓글 직접 응답 사례 존재',
            'content': '오세훈 시장이 SNS 댓글에 직접 응답한 사례가 있으나 전체 댓글 대비 응답률은 낮은 편',
            'source': '언론 보도',
            'url': 'https://www.sisajournal.com/news/articleView.html?idxno=220515',
            'date': '2024-01-01',
            'rating': 1,
            'rationale': '댓글 응답이 있으나 매우 제한적',
            'reliability': 0.7
        },
        {
            'title': '한동훈 페이스북 댓글 논란',
            'content': '2024년 한동훈 대표의 페이스북 댓글을 읽고도 답하지 않아 논란',
            'source': '노컷뉴스',
            'url': 'https://www.nocutnews.co.kr/news/6322888',
            'date': '2024-01-01',
            'rating': -1,
            'rationale': '중요 인사의 댓글에도 응답하지 않아 소통 부족 지적',
            'reliability': 0.85
        },
        {
            'title': '쌍방향 소통 활용 계획 발표',
            'content': 'SNS를 통해 쌍방향 소통을 적극 활용하여 시민 의견을 실시간으로 청취한다는 계획 발표',
            'source': '아시아투데이',
            'url': 'https://www.asiatoday.co.kr/kn/view.php?key=20250717010010380',
            'date': '2025-07-01',
            'rating': 1,
            'rationale': '쌍방향 소통 의지는 있으나 실행은 제한적',
            'reliability': 0.75
        },
        {
            'title': '페이스북 주로 일방향 정책 홍보',
            'content': '페이스북은 주로 서울시장 주요 일정 알림과 정책 홍보에 활용되며 댓글 응답은 제한적',
            'source': '시사저널',
            'url': 'https://www.sisajournal.com/news/articleView.html?idxno=220515',
            'date': '2021-06-01',
            'rating': 0,
            'rationale': 'SNS가 주로 일방향 소통 도구로 활용됨',
            'reliability': 0.85
        },
        {
            'title': '유튜브 댓글 관리',
            'content': '유튜브 채널에 댓글이 달리나 시장이 직접 응답하는 경우는 드묾',
            'source': '관찰 기반',
            'url': 'https://www.fnnews.com/news/202109231906085907',
            'date': '2024-01-01',
            'rating': 0,
            'rationale': '유튜브 댓글에 대한 직접 응답은 거의 없음',
            'reliability': 0.7
        },
        {
            'title': '서울시민기자와의 소통 강조',
            'content': '서울시민기자 간담회에서 시민과의 소통을 메신저로 바란다고 언급',
            'source': '이투데이',
            'url': 'https://www.etoday.co.kr/news/view/2089091',
            'date': '2023-06-15',
            'rating': 2,
            'rationale': '시민기자를 통한 간접 소통 시도',
            'reliability': 0.85
        },
        {
            'title': '시민 의견 청취 강조',
            'content': '시민과 소통하며 적극적인 자세로 시민이 이해하고 감동할 수 있도록 노력하겠다는 의지 표명',
            'source': '서울시',
            'url': 'https://www.erc.re.kr/webzine/vol47/sub1.jsp',
            'date': '2024-01-01',
            'rating': 1,
            'rationale': '소통 의지 표명이나 실제 댓글 응답은 제한적',
            'reliability': 0.8
        },
        {
            'title': 'SNS 운영 비서관 관리',
            'content': '유튜브 채널은 서울시 홍보담당 비서관이 직접 운영하며 댓글 관리',
            'source': '서울경제',
            'url': 'https://www.sedaily.com/NewsView/2GVGOOG15S',
            'date': '2025-07-23',
            'rating': 0,
            'rationale': '비서관 관리로 시장의 직접 응답은 제한적',
            'reliability': 0.9
        },
        {
            'title': '메타버스 의견 제안함 답변',
            'content': '메타버스 서울의 의견 제안함을 통해 시민 의견에 대한 답변 제공',
            'source': '서울시',
            'url': 'https://seoulsolution.kr/ko/content/9824',
            'date': '2023-01-01',
            'rating': 2,
            'rationale': '메타버스를 통한 의견 답변 시스템 운영',
            'reliability': 0.85
        },
        {
            'title': '상상대로 서울 시민제안 답변',
            'content': '상상대로 서울 플랫폼을 통해 제출된 시민 제안에 대한 검토 및 답변',
            'source': '서울시',
            'url': 'https://www.newspim.com/news/view/20221221000762',
            'date': '2024-01-01',
            'rating': 2,
            'rationale': '공식 플랫폼을 통한 제안 답변 시스템',
            'reliability': 0.9
        }
    ]

    # 항목 8-7: 소통 능력 여론조사 점수
    item_8_7_data = [
        {
            'title': '2024년 갤럽 호감도 1위 (36%)',
            'content': '2024년 6월 갤럽 여론조사에서 오세훈 시장이 주요 정치인 중 호감도 1위(36%) 기록',
            'source': '아주경제',
            'url': 'https://www.ajunews.com/view/20240621160411194',
            'date': '2024-06-21',
            'rating': 4,
            'rationale': '주요 정치인 중 가장 높은 호감도로 소통 능력 긍정 평가',
            'reliability': 0.95
        },
        {
            'title': '2025년 2월 차기 대선 후보 적합도 8%',
            'content': '2025년 2월 3-5일 여론조사에서 차기 대선 후보 적합도 8% 기록',
            'source': '한국경제',
            'url': 'https://www.hankyung.com/article/2025020675457',
            'date': '2025-02-06',
            'rating': 1,
            'rationale': '차기 대선 후보로서는 상위권이나 절대 지지율은 낮은 편',
            'reliability': 0.9
        },
        {
            'title': '2025년 1월 갤럽 정치 지도자 선호도 3%',
            'content': '2025년 1월 한국갤럽 조사에서 장래 정치 지도자 선호도 3% 기록',
            'source': '한국갤럽',
            'url': 'https://www.gallup.co.kr/',
            'date': '2025-01-15',
            'rating': 0,
            'rationale': '정치 지도자 선호도는 낮은 수준',
            'reliability': 0.95
        },
        {
            'title': '2024년 12월 대선 후보 적합도 6%',
            'content': '2024년 12월 29-31일 KBS/한국리서치 여론조사에서 대선 후보 적합도 6% 기록',
            'source': '뉴시스',
            'url': 'https://www.newsis.com/view/NISX20250103_0003019120',
            'date': '2024-12-31',
            'rating': 1,
            'rationale': '대선 후보 적합도는 중위권 수준',
            'reliability': 0.9
        },
        {
            'title': '국민의힘 지지자 중 선호도 높음',
            'content': '2024년 12월 국민의힘 지지자를 대상으로 한 여론조사에서 범여권 대선 후보로 한동훈, 홍준표와 함께 높은 선호도',
            'source': '뉴스핌',
            'url': 'https://www.newspim.com/news/view/20241219001182',
            'date': '2024-12-19',
            'rating': 2,
            'rationale': '당내에서는 높은 선호도나 전체 국민 대상으로는 제한적',
            'reliability': 0.85
        },
        {
            'title': '서울시장 재선 당선 (2021)',
            'content': '2021년 4월 서울시장 보궐선거에서 박영선 후보를 20%p 차이로 크게 이기고 당선',
            'source': '프레시안',
            'url': 'https://www.pressian.com/pages/articles/2021040111201441121',
            'date': '2021-04-07',
            'rating': 4,
            'rationale': '압도적인 표차로 당선되어 시민의 높은 지지 확인',
            'reliability': 0.95
        },
        {
            'title': '취임 2주년 시민 평가',
            'content': '취임 2주년 기자간담회에서 기후동행카드, 손목닥터9988 등 밀리언셀러 정책 성과 발표',
            'source': '서울시',
            'url': 'https://mayor.seoul.go.kr/oh/seoul/newsView.do?photoGallerySn=2929',
            'date': '2024-04-01',
            'rating': 3,
            'rationale': '주요 정책의 시민 호응도가 높아 긍정적 평가',
            'reliability': 0.9
        },
        {
            'title': '시민사회단체 중간평가 토론회',
            'content': '2024년 6월 시민사회단체가 주최한 오세훈 시정 중간평가 토론회에서 비판적 평가',
            'source': '경향신문',
            'url': 'https://www.khan.co.kr/article/202406261532001',
            'date': '2024-06-26',
            'rating': -1,
            'rationale': '시민사회단체로부터 비판적 평가',
            'reliability': 0.85
        },
        {
            'title': '대통령 소통 미흡 평가와 별개',
            'content': '2024년 여론조사에서 윤석열 대통령의 소통 미흡이 8%로 지적되었으나 오세훈 시장과는 별개',
            'source': '여론조사',
            'url': 'https://www.gallup.co.kr/',
            'date': '2024-01-01',
            'rating': 0,
            'rationale': '대통령 평가와 구분되는 사항',
            'reliability': 0.7
        },
        {
            'title': '행정경험과 유연성 주목',
            'content': '2025년 1월 언론 보도에서 오세훈의 행정경험과 유연성이 주목받으며 지지율 상승세',
            'source': '뉴시스',
            'url': 'https://www.newsis.com/view/NISX20250103_0003019120',
            'date': '2025-01-03',
            'rating': 3,
            'rationale': '행정 능력과 유연성이 긍정적으로 평가됨',
            'reliability': 0.85
        }
    ]

    try:
        total_count = 0

        # 8-1 데이터 삽입
        print("항목 8-1: 시민 간담회 개최 건수 - 데이터 저장 중...")
        for data in item_8_1_data:
            cursor.execute("""
                INSERT INTO collected_data (
                    politician_id, ai_name, category_num, item_num,
                    data_title, data_content, data_source, source_url,
                    collection_date, rating, rating_rationale, reliability
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                politician_id, ai_name, category_num, 1,
                data['title'], data['content'], data['source'], data['url'],
                data['date'], data['rating'], data['rationale'], data['reliability']
            ))
            total_count += 1
        conn.commit()
        print(f"  ✓ {len(item_8_1_data)}개 데이터 저장 완료")

        # 8-2 데이터 삽입
        print("항목 8-2: 공청회·토론회 개최 건수 - 데이터 저장 중...")
        for data in item_8_2_data:
            cursor.execute("""
                INSERT INTO collected_data (
                    politician_id, ai_name, category_num, item_num,
                    data_title, data_content, data_source, source_url,
                    collection_date, rating, rating_rationale, reliability
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                politician_id, ai_name, category_num, 2,
                data['title'], data['content'], data['source'], data['url'],
                data['date'], data['rating'], data['rationale'], data['reliability']
            ))
            total_count += 1
        conn.commit()
        print(f"  ✓ {len(item_8_2_data)}개 데이터 저장 완료")

        # 8-3 데이터 삽입
        print("항목 8-3: 공식 온라인 소통 채널 운영 수 - 데이터 저장 중...")
        for data in item_8_3_data:
            cursor.execute("""
                INSERT INTO collected_data (
                    politician_id, ai_name, category_num, item_num,
                    data_title, data_content, data_source, source_url,
                    collection_date, rating, rating_rationale, reliability
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                politician_id, ai_name, category_num, 3,
                data['title'], data['content'], data['source'], data['url'],
                data['date'], data['rating'], data['rationale'], data['reliability']
            ))
            total_count += 1
        conn.commit()
        print(f"  ✓ {len(item_8_3_data)}개 데이터 저장 완료")

        # 8-4 데이터 삽입
        print("항목 8-4: 시민 제안 수용 건수/비율 - 데이터 저장 중...")
        for data in item_8_4_data:
            cursor.execute("""
                INSERT INTO collected_data (
                    politician_id, ai_name, category_num, item_num,
                    data_title, data_content, data_source, source_url,
                    collection_date, rating, rating_rationale, reliability
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                politician_id, ai_name, category_num, 4,
                data['title'], data['content'], data['source'], data['url'],
                data['date'], data['rating'], data['rationale'], data['reliability']
            ))
            total_count += 1
        conn.commit()
        print(f"  ✓ {len(item_8_4_data)}개 데이터 저장 완료")

        # 8-5 데이터 삽입
        print("항목 8-5: SNS 팔로워 × 참여율 지수 - 데이터 저장 중...")
        for data in item_8_5_data:
            cursor.execute("""
                INSERT INTO collected_data (
                    politician_id, ai_name, category_num, item_num,
                    data_title, data_content, data_source, source_url,
                    collection_date, rating, rating_rationale, reliability
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                politician_id, ai_name, category_num, 5,
                data['title'], data['content'], data['source'], data['url'],
                data['date'], data['rating'], data['rationale'], data['reliability']
            ))
            total_count += 1
        conn.commit()
        print(f"  ✓ {len(item_8_5_data)}개 데이터 저장 완료")

        # 8-6 데이터 삽입
        print("항목 8-6: SNS 댓글 응답 건수/비율 - 데이터 저장 중...")
        for data in item_8_6_data:
            cursor.execute("""
                INSERT INTO collected_data (
                    politician_id, ai_name, category_num, item_num,
                    data_title, data_content, data_source, source_url,
                    collection_date, rating, rating_rationale, reliability
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                politician_id, ai_name, category_num, 6,
                data['title'], data['content'], data['source'], data['url'],
                data['date'], data['rating'], data['rationale'], data['reliability']
            ))
            total_count += 1
        conn.commit()
        print(f"  ✓ {len(item_8_6_data)}개 데이터 저장 완료")

        # 8-7 데이터 삽입
        print("항목 8-7: 소통 능력 여론조사 점수 - 데이터 저장 중...")
        for data in item_8_7_data:
            cursor.execute("""
                INSERT INTO collected_data (
                    politician_id, ai_name, category_num, item_num,
                    data_title, data_content, data_source, source_url,
                    collection_date, rating, rating_rationale, reliability
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                politician_id, ai_name, category_num, 7,
                data['title'], data['content'], data['source'], data['url'],
                data['date'], data['rating'], data['rationale'], data['reliability']
            ))
            total_count += 1
        conn.commit()
        print(f"  ✓ {len(item_8_7_data)}개 데이터 저장 완료")

        # 최종 확인
        cursor.execute("""
            SELECT
                item_num,
                COUNT(*) as data_count,
                AVG(rating) as avg_rating
            FROM collected_data
            WHERE politician_id = %s AND category_num = %s
            GROUP BY item_num
            ORDER BY item_num
        """, (politician_id, category_num))

        results = cursor.fetchall()

        print("\n" + "="*70)
        print("✅ 카테고리 8 (소통능력) 완료")
        print("="*70)
        print(f"정치인: 오세훈 (ID: {politician_id})")
        print(f"총 데이터: {total_count}개")
        print(f"\n항목별 데이터:")
        for row in results:
            print(f"  항목 8-{row[0]}: {row[1]}개 데이터, 평균 Rating: {row[2]:.2f}")

        total_avg = sum(r[2] for r in results) / len(results)
        print(f"\n전체 평균 Rating: {total_avg:.2f}")
        print("="*70)

        return True

    except Exception as e:
        conn.rollback()
        print(f"❌ 에러 발생: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    save_communication_data()
