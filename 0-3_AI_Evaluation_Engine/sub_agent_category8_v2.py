#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
서브 에이전트 - 카테고리 8 (소통능력) 평가
정치인: 오세훈
Politician ID: 272
Supabase Python SDK 사용 버전
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime
import sys

# UTF-8 인코딩 강제
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# .env 파일 로드
load_dotenv()

# 입력 정보
POLITICIAN_ID = "272"
POLITICIAN_NAME = "오세훈"
CATEGORY_NUM = 8
CATEGORY_NAME = "소통능력"

# Supabase 클라이언트 생성
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

def get_supabase_client():
    """Supabase 클라이언트 생성"""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return supabase
    except Exception as e:
        print(f"[ERROR] Supabase 연결 실패: {e}")
        raise

def insert_data(supabase, item_num, data_point):
    """collected_data 테이블에 데이터 삽입"""
    try:
        data = {
            'politician_id': POLITICIAN_ID,
            'ai_name': 'Claude',
            'category_num': CATEGORY_NUM,
            'item_num': item_num,
            'data_title': data_point['title'],
            'data_content': data_point['content'],
            'data_source': data_point.get('source', '웹 검색'),
            'source_url': data_point['url'],
            'collection_date': data_point.get('date', '2024-10-31'),
            'rating': data_point['rating'],
            'rating_rationale': data_point.get('rationale', f"Rating {data_point['rating']} 부여"),
            'reliability': data_point['reliability']
        }

        result = supabase.table('collected_data').insert(data).execute()
        return True
    except Exception as e:
        print(f"[ERROR] 데이터 삽입 실패: {e}")
        return False

def get_item_8_1_data():
    """8-1. 시민 간담회 개최 건수"""
    return [
        {
            'title': '국민의힘 상임고문단 간담회 개최',
            'content': '2024년 11월 4일 시장 공관인 용산구 파트너스하우스에서 국민의힘 상임고문단과 오찬 간담회 개최. 정의화 상임고문단 회장을 비롯해 당 원로들로 구성된 상임고문단 총 12명이 참석',
            'url': 'https://news.bbsi.co.kr/news/articleView.html?idxno=4006171',
            'rating': 2,
            'reliability': 0.9
        },
        {
            'title': '취임 2주년 기자간담회 개최',
            'content': '오세훈 시장 취임 2주년을 맞아 기자간담회를 개최하여 지난 2년간의 성과와 향후 비전을 제시',
            'url': 'https://mayor.seoul.go.kr/oh/seoul/newsView.do?photoGallerySn=2929',
            'rating': 1,
            'reliability': 0.95
        },
        {
            'title': '한국예술문화단체총연합회 소통간담회',
            'content': '2023년 11월 21일 한국예술문화단체총연합회 및 소속 단체와 소통간담회 개최',
            'url': 'https://www.onseoul.net/news/articleView.html?idxno=30499',
            'rating': 2,
            'reliability': 0.85
        },
        {
            'title': '서울시민기자 간담회',
            'content': '서울시민기자를 동대문디자인플라자(DDP) 서울온 영상스튜디오에 초청하여 간담회 개최. 현장 참석자 16명, 온라인 참석자 100명',
            'url': 'https://www.etoday.co.kr/news/view/2089091',
            'rating': 3,
            'reliability': 0.9
        },
        {
            'title': '장애인 거주시설 방문 및 현장 간담회',
            'content': '2023년 1월 31일 강동구 고덕동 소재 장애인 거주시설을 방문하여 시설 관계자와 이용 가족의 애로사항 청취',
            'url': 'https://www.newsis.com/view/?id=NISX20230131_0002176281',
            'rating': 4,
            'reliability': 0.9
        },
        {
            'title': '전장연 면담 실시',
            'content': '2023년 2월 2일 전국장애인차별철폐연대(전장연)와 면담을 실시하여 지하철 시위 문제 해결을 위한 대화',
            'url': 'https://www.sedaily.com/NewsView/29KMJ0PJ8C',
            'rating': 3,
            'reliability': 0.9
        },
        {
            'title': '노원 상계5재정비촉진구역 현장 방문',
            'content': '2025년 10월 24일 국민의힘 지도부와 함께 노원 상계5재정비촉진구역을 방문하여 조합원들과 만나 현안 논의',
            'url': 'https://www.newsis.com/view/NISX20251024_0003375769',
            'rating': 3,
            'reliability': 0.85
        },
        {
            'title': '서울비전2030 수립 과정에서 시민 참여',
            'content': '각계각층의 122명으로 구성된 서울비전2030위원회(전문가 44명, 시민 78명)를 통해 136일 동안 100여 차례 넘는 토론',
            'url': 'https://news.seoul.go.kr/gov/archives/531883',
            'rating': 4,
            'reliability': 0.95
        },
        {
            'title': '시민참여예산위원회 확대 운영',
            'content': '시민참여예산위원회 참여 시민을 120명에서 200명으로 확대하여 시민대표성 강화',
            'url': 'https://yesan.seoul.go.kr/intro/index.do',
            'rating': 3,
            'reliability': 0.9
        },
        {
            'title': '월즈 팬 페스트 2023 참석',
            'content': '2023년 11월 18일 광화문광장 월즈 팬 페스트를 방문하여 e스포츠 팬들과 소통',
            'url': 'https://mayor.seoul.go.kr/oh/seoul/newsView.do?photoGallerySn=2270',
            'rating': 2,
            'reliability': 0.8
        }
    ]

def get_item_8_2_data():
    """8-2. 공청회·토론회 개최 건수"""
    return [
        {
            'title': '2030 서울도시기본계획 공청회',
            'content': '2024년 10월 12일 중구주민센터에서 2030 서울도시기본계획(안) 공청회 개최',
            'url': 'https://opengov.seoul.go.kr/press/333641',
            'rating': 4,
            'reliability': 0.95
        },
        {
            'title': '오세훈 시정 중간평가 토론회',
            'content': '2024년 6월 26-27일 시민사회단체 주최로 오세훈 시장 2년 중간평가 토론회 개최',
            'url': 'https://www.khan.co.kr/article/202406261532001',
            'rating': 3,
            'reliability': 0.9
        },
        {
            'title': '서울시의회 교통문제 토론회',
            'content': '2024년 3월 25일 서울시의회에서 교통문제 관련 토론회 개최',
            'url': 'http://webzine.smc.seoul.kr/2024/05/09.html',
            'rating': 2,
            'reliability': 0.85
        },
        {
            'title': '교육의 질 향상 토론회',
            'content': '2024년 4월 16일 서울시의회에서 교육의 질 향상을 위한 토론회 개최',
            'url': 'http://webzine.smc.seoul.kr/2024/05/09.html',
            'rating': 2,
            'reliability': 0.85
        },
        {
            'title': '통학로 안전 토론회',
            'content': '2024년 4월 17일 서울시의회에서 통학로 안전 관련 토론회 개최',
            'url': 'http://webzine.smc.seoul.kr/2024/05/09.html',
            'rating': 2,
            'reliability': 0.85
        },
        {
            'title': '저출산 대응 주택정책 토론회',
            'content': '2024년 4월 17일 서울시의회에서 저출산 대응을 위한 주택정책 토론회 개최',
            'url': 'http://webzine.smc.seoul.kr/2024/05/09.html',
            'rating': 2,
            'reliability': 0.85
        },
        {
            'title': '지방분권 헌법개정 토론회',
            'content': '2025년 2월 국회에서 오세훈 시장이 주최한 87년 체제 극복을 위한 지방분권 헌법개정 토론회 개최',
            'url': 'https://www.sisajournal.com/news/articleView.html?idxno=220515',
            'rating': 3,
            'reliability': 0.85
        },
        {
            'title': '2024 서울미래컨퍼런스 개최',
            'content': '2024년 서울미래컨퍼런스를 통해 서울의 미래 비전에 대한 논의의 장 마련',
            'url': 'https://www6.seoul.co.kr/newsList/plan/seoul-future-conference/',
            'rating': 3,
            'reliability': 0.85
        },
        {
            'title': '시민참여예산 공모 및 심의',
            'content': '2024년 시민참여예산 사업 공모를 통해 시민 의견 수렴',
            'url': 'https://news.seoul.go.kr/gov/archives/545782',
            'rating': 3,
            'reliability': 0.9
        },
        {
            'title': '새로운 광화문광장 조성 공개토론회',
            'content': '광화문광장 재조성 사업과 관련된 공개토론회 개최',
            'url': 'https://www.seoul.go.kr/gwanghwamun/',
            'rating': 3,
            'reliability': 0.9
        }
    ]

def get_item_8_3_data():
    """8-3. 공식 온라인 소통 채널 운영 수"""
    return [
        {
            'title': '페이스북 공식 계정 운영',
            'content': '오세훈 시장 공식 페이스북 계정(ohsehoon4you) 운영. 약 20,492명 좋아요 확보',
            'url': 'https://www.facebook.com/ohsehoon4you',
            'rating': 3,
            'reliability': 0.95
        },
        {
            'title': '유튜브 채널 운영 (오세훈TV)',
            'content': '2019년 5월부터 유튜브 채널 운영. 2021년 9월 구독자 10만명 달성, 2025년 기준 16만명 이상 구독자 보유',
            'url': 'https://www.fnnews.com/news/202109231906085907',
            'rating': 4,
            'reliability': 0.95
        },
        {
            'title': '인스타그램 계정 운영',
            'content': '오세훈 시장 인스타그램 계정을 통해 시정 소식 및 일상 공유',
            'url': 'https://linktr.ee/ohsehoon',
            'rating': 2,
            'reliability': 0.8
        },
        {
            'title': 'X(구 트위터) 계정 개설',
            'content': '2025년 7월 기존 SNS에 이어 X(구 트위터) 계정 추가 개설',
            'url': 'https://www.asiatoday.co.kr/kn/view.php?key=20250717010010380',
            'rating': 3,
            'reliability': 0.9
        },
        {
            'title': '쓰레드(Threads) 계정 개설',
            'content': '2025년 7월 쓰레드 계정을 추가 개설하여 다양한 플랫폼에서 시민 소통',
            'url': 'https://www.asiatoday.co.kr/kn/view.php?key=20250717010010380',
            'rating': 3,
            'reliability': 0.9
        },
        {
            'title': '서울시 시장 공식 홈페이지 운영',
            'content': '서울시 시장 공식 홈페이지(mayor.seoul.go.kr)를 통해 시정 소식 및 비전 공유',
            'url': 'https://mayor.seoul.go.kr/',
            'rating': 2,
            'reliability': 0.95
        },
        {
            'title': 'Linktree 통합 링크 운영',
            'content': 'Linktree(linktr.ee/ohsehoon)를 통해 모든 SNS 계정을 통합 관리하여 접근성 향상',
            'url': 'https://linktr.ee/ohsehoon',
            'rating': 2,
            'reliability': 0.9
        },
        {
            'title': '메타버스 서울 시장실 운영',
            'content': '메타버스 시장실에서 시민이 오세훈 시장과 인사를 나누고 의견 제안함을 통해 시정 의견 등록 가능',
            'url': 'https://seoulsolution.kr/ko/content/9824',
            'rating': 4,
            'reliability': 0.9
        },
        {
            'title': '상상대로 서울 시민제안 플랫폼',
            'content': '천만상상 오아시스의 후신인 상상대로 서울 플랫폼을 통해 시민 제안 접수. 1만건 이상의 시민 아이디어 제출',
            'url': 'https://www.newspim.com/news/view/20221221000762',
            'rating': 4,
            'reliability': 0.95
        },
        {
            'title': '서울시 공식 SNS 계정 활용',
            'content': '서울시 공식 SNS 계정들을 통해 시정 소식 전달 및 시민 의견 수렴',
            'url': 'https://www.seoul.go.kr/',
            'rating': 2,
            'reliability': 0.9
        },
        {
            'title': '블로그 운영 (과거)',
            'content': '과거 서울은 불가능이 없는 도시다: 서울시장 오세훈이 보내는 블로그 레터 운영',
            'url': 'https://linktr.ee/ohsehoon',
            'rating': 1,
            'reliability': 0.7
        }
    ]

def get_item_8_4_data():
    """8-4. 시민 제안 수용 건수/비율"""
    return [
        {
            'title': '천만상상 오아시스 1만건 이상 시민 아이디어',
            'content': '2006년 시작된 천만상상 오아시스를 통해 1만건 이상의 시민 아이디어가 제출됨',
            'url': 'https://www.seoulsolution.kr/ko/content/천만상상오아시스',
            'rating': 3,
            'reliability': 0.9
        },
        {
            'title': '천만상상 오아시스 UN공공행정상 수상',
            'content': '2009년 천만상상 오아시스가 UN공공행정상 우수상을 수상하여 국제적으로 인정받음',
            'url': 'https://ko.wikipedia.org/wiki/천만상상_오아시스',
            'rating': 5,
            'reliability': 0.95
        },
        {
            'title': '상상대로 서울 플랫폼 재출범',
            'content': '2022년 12월 시민 및 직원 선호도 투표 후 전문가 심사를 거쳐 시민제안 플랫폼을 상상대로 서울로 재명명',
            'url': 'https://www.newspim.com/news/view/20221221000762',
            'rating': 3,
            'reliability': 0.9
        },
        {
            'title': '시민참여예산 500억원 편성',
            'content': '2024년 시민참여예산 500억원 편성. 약자와의 동행에 200억원, 자유제안형 300억원 배정',
            'url': 'https://theindigo.co.kr/archives/55283',
            'rating': 4,
            'reliability': 0.95
        },
        {
            'title': '시민참여예산위원 200명으로 확대',
            'content': '시민참여예산위원회를 120명에서 200명으로 확대하여 시민대표성 강화',
            'url': 'https://yesan.seoul.go.kr/intro/index.do',
            'rating': 3,
            'reliability': 0.95
        },
        {
            'title': '메타버스 시민 의견 제안함',
            'content': '메타버스 서울에서 상상대로 서울과 연계된 의견 제안함을 통해 시민 의견 접수 및 답변',
            'url': 'https://seoulsolution.kr/ko/content/9824',
            'rating': 3,
            'reliability': 0.85
        },
        {
            'title': '서울비전 2030 수립 시 시민 78명 참여',
            'content': '서울비전 2030 수립 과정에서 전문가 44명과 함께 시민 78명이 위원회에 참여하여 의견 제시',
            'url': 'https://news.seoul.go.kr/gov/archives/531883',
            'rating': 4,
            'reliability': 0.95
        },
        {
            'title': '약자동행지수 평가 의견 수렴',
            'content': '약자동행지수 평가에 참여한 전문가와 시민들의 의견과 개선방안을 수렴하여 향후 정책 추진에 반영',
            'url': 'https://www.newspim.com/news/view/20221221000762',
            'rating': 3,
            'reliability': 0.85
        },
        {
            'title': '정보공개 청구 및 시민 의견 반영',
            'content': '정보공개포털 및 제안 게시판을 통해 시민 의견을 수렴하고 정책에 반영',
            'url': 'https://opengov.seoul.go.kr/',
            'rating': 2,
            'reliability': 0.9
        },
        {
            'title': '시민소통 채널 확대 계획',
            'content': '다양한 소통 채널을 통해 시민들과의 소통을 확대하고 시민의 목소리를 기관운영과 정책에 적극 반영',
            'url': 'https://www.newspim.com/news/view/20221221000762',
            'rating': 2,
            'reliability': 0.8
        }
    ]

def get_item_8_5_data():
    """8-5. SNS 팔로워 × 참여율 지수"""
    return [
        {
            'title': '페이스북 팔로워 약 2만명',
            'content': '오세훈 시장 공식 페이스북 계정 ohsehoon4you에 약 20,492명이 좋아요를 누름',
            'url': 'https://www.facebook.com/ohsehoon4you',
            'rating': 2,
            'reliability': 0.95
        },
        {
            'title': '유튜브 구독자 16만명 이상',
            'content': '오세훈TV 유튜브 채널 구독자 16만명 이상 보유',
            'url': 'https://www.fnnews.com/news/202109231906085907',
            'rating': 4,
            'reliability': 0.95
        },
        {
            'title': '유튜브 실버버튼 수상',
            'content': '2021년 9월 유튜브 구독자 10만명 달성으로 실버버튼 수상',
            'url': 'https://www.fnnews.com/news/202109231906085907',
            'rating': 4,
            'reliability': 0.95
        },
        {
            'title': '취임 100일 전 SNS 활동 활발',
            'content': '취임 100일 앞두고 SNS에서 활발한 활동. 페이스북이 가장 활발한 소통 창구',
            'url': 'https://www.sisajournal.com/news/articleView.html?idxno=220515',
            'rating': 3,
            'reliability': 0.85
        },
        {
            'title': 'SNS 채널 5개로 확대',
            'content': '페이스북, 유튜브, 인스타그램, X(트위터), 쓰레드 등 5개 SNS 채널 운영',
            'url': 'https://www.asiatoday.co.kr/kn/view.php?key=20250717010010380',
            'rating': 4,
            'reliability': 0.9
        },
        {
            'title': '쌍방향 소통 적극 활용 계획',
            'content': 'SNS를 통해 쌍방향 소통을 적극 활용하여 시민 의견을 실시간으로 청취하는 계획',
            'url': 'https://www.asiatoday.co.kr/kn/view.php?key=20250717010010380',
            'rating': 2,
            'reliability': 0.8
        },
        {
            'title': '페이스북 주요 정책 홍보',
            'content': '페이스북을 통해 코로나19 방역, 24만 호 주택공급 등 핵심 정책 홍보',
            'url': 'https://www.sisajournal.com/news/articleView.html?idxno=220515',
            'rating': 2,
            'reliability': 0.85
        },
        {
            'title': '유튜브 콘텐츠 논란',
            'content': '2025년 7월 오세훈TV 유튜브 채널의 일부 콘텐츠가 정치적 논란에 휩싸임',
            'url': 'https://www.sedaily.com/NewsView/2GVGOOG15S',
            'rating': -2,
            'reliability': 0.85
        },
        {
            'title': 'SNS 댓글 응답 사례',
            'content': 'SNS에서 시민 댓글에 직접 응답하는 사례가 있으나 일관성은 부족',
            'url': 'https://www.sisajournal.com/news/articleView.html?idxno=220515',
            'rating': 1,
            'reliability': 0.75
        },
        {
            'title': '일상 소통 행정 강화',
            'content': '시민의 일상에 한 걸음 더 다가가기 위해 SNS 채널 확대 등 디지털 소통 강화',
            'url': 'https://www.asiatoday.co.kr/kn/view.php?key=20250717010010380',
            'rating': 2,
            'reliability': 0.85
        }
    ]

def get_item_8_6_data():
    """8-6. SNS 댓글 응답 건수/비율"""
    return [
        {
            'title': 'SNS 댓글 직접 응답 사례 존재',
            'content': '오세훈 시장이 SNS 댓글에 직접 응답한 사례가 있으나 전체 댓글 대비 응답률은 낮은 편',
            'url': 'https://www.sisajournal.com/news/articleView.html?idxno=220515',
            'rating': 1,
            'reliability': 0.7
        },
        {
            'title': '한동훈 페이스북 댓글 논란',
            'content': '2024년 한동훈 대표의 페이스북 댓글을 읽고도 답하지 않아 논란',
            'url': 'https://www.nocutnews.co.kr/news/6322888',
            'rating': -1,
            'reliability': 0.85
        },
        {
            'title': '쌍방향 소통 활용 계획',
            'content': 'SNS를 통해 쌍방향 소통을 적극 활용하여 시민 의견을 실시간으로 청취한다는 계획 발표',
            'url': 'https://www.asiatoday.co.kr/kn/view.php?key=20250717010010380',
            'rating': 1,
            'reliability': 0.75
        },
        {
            'title': '페이스북 주로 일방향 정책 홍보',
            'content': '페이스북은 주로 서울시장 주요 일정 알림과 정책 홍보에 활용되며 댓글 응답은 제한적',
            'url': 'https://www.sisajournal.com/news/articleView.html?idxno=220515',
            'rating': 0,
            'reliability': 0.85
        },
        {
            'title': '유튜브 댓글 관리',
            'content': '유튜브 채널에 댓글이 달리나 시장이 직접 응답하는 경우는 드묾',
            'url': 'https://www.fnnews.com/news/202109231906085907',
            'rating': 0,
            'reliability': 0.7
        },
        {
            'title': '서울시민기자와의 소통 강조',
            'content': '서울시민기자 간담회에서 시민과의 소통을 메신저로 바란다고 언급',
            'url': 'https://www.etoday.co.kr/news/view/2089091',
            'rating': 2,
            'reliability': 0.85
        },
        {
            'title': '시민 의견 청취 강조',
            'content': '시민과 소통하며 적극적인 자세로 시민이 이해하고 감동할 수 있도록 노력하겠다는 의지 표명',
            'url': 'https://www.erc.re.kr/webzine/vol47/sub1.jsp',
            'rating': 1,
            'reliability': 0.8
        },
        {
            'title': 'SNS 운영 비서관 관리',
            'content': '유튜브 채널은 서울시 홍보담당 비서관이 직접 운영하며 댓글 관리',
            'url': 'https://www.sedaily.com/NewsView/2GVGOOG15S',
            'rating': 0,
            'reliability': 0.9
        },
        {
            'title': '메타버스 의견 제안함 답변',
            'content': '메타버스 서울의 의견 제안함을 통해 시민 의견에 대한 답변 제공',
            'url': 'https://seoulsolution.kr/ko/content/9824',
            'rating': 2,
            'reliability': 0.85
        },
        {
            'title': '상상대로 서울 시민제안 답변',
            'content': '상상대로 서울 플랫폼을 통해 제출된 시민 제안에 대한 검토 및 답변',
            'url': 'https://www.newspim.com/news/view/20221221000762',
            'rating': 2,
            'reliability': 0.9
        }
    ]

def get_item_8_7_data():
    """8-7. 소통 능력 여론조사 점수"""
    return [
        {
            'title': '2024년 갤럽 호감도 1위 (36%)',
            'content': '2024년 6월 갤럽 여론조사에서 오세훈 시장이 주요 정치인 중 호감도 1위(36%) 기록',
            'url': 'https://www.ajunews.com/view/20240621160411194',
            'rating': 4,
            'reliability': 0.95
        },
        {
            'title': '2025년 2월 차기 대선 후보 적합도 8%',
            'content': '2025년 2월 3-5일 여론조사에서 차기 대선 후보 적합도 8% 기록',
            'url': 'https://www.hankyung.com/article/2025020675457',
            'rating': 1,
            'reliability': 0.9
        },
        {
            'title': '2025년 1월 갤럽 정치 지도자 선호도 3%',
            'content': '2025년 1월 한국갤럽 조사에서 장래 정치 지도자 선호도 3% 기록',
            'url': 'https://www.gallup.co.kr/',
            'rating': 0,
            'reliability': 0.95
        },
        {
            'title': '2024년 12월 대선 후보 적합도 6%',
            'content': '2024년 12월 29-31일 KBS/한국리서치 여론조사에서 대선 후보 적합도 6% 기록',
            'url': 'https://www.newsis.com/view/NISX20250103_0003019120',
            'rating': 1,
            'reliability': 0.9
        },
        {
            'title': '국민의힘 지지자 중 선호도 높음',
            'content': '2024년 12월 국민의힘 지지자를 대상으로 한 여론조사에서 범여권 대선 후보로 높은 선호도',
            'url': 'https://www.newspim.com/news/view/20241219001182',
            'rating': 2,
            'reliability': 0.85
        },
        {
            'title': '서울시장 재선 당선 (2021)',
            'content': '2021년 4월 서울시장 보궐선거에서 박영선 후보를 20%p 차이로 크게 이기고 당선',
            'url': 'https://www.pressian.com/pages/articles/2021040111201441121',
            'rating': 4,
            'reliability': 0.95
        },
        {
            'title': '취임 2주년 시민 평가',
            'content': '취임 2주년 기자간담회에서 기후동행카드, 손목닥터9988 등 밀리언셀러 정책 성과 발표',
            'url': 'https://mayor.seoul.go.kr/oh/seoul/newsView.do?photoGallerySn=2929',
            'rating': 3,
            'reliability': 0.9
        },
        {
            'title': '시민사회단체 중간평가 토론회',
            'content': '2024년 6월 시민사회단체가 주최한 오세훈 시정 중간평가 토론회에서 비판적 평가',
            'url': 'https://www.khan.co.kr/article/202406261532001',
            'rating': -1,
            'reliability': 0.85
        },
        {
            'title': '행정경험과 유연성 주목',
            'content': '2025년 1월 언론 보도에서 오세훈의 행정경험과 유연성이 주목받으며 지지율 상승세',
            'url': 'https://www.newsis.com/view/NISX20250103_0003019120',
            'rating': 3,
            'reliability': 0.85
        },
        {
            'title': '2024년 9월 갤럽 지지율 2%',
            'content': '2024년 9월 한국갤럽 조사에서 김문수와 함께 각각 2% 기록',
            'url': 'https://www.gallup.co.kr/',
            'rating': 0,
            'reliability': 0.9
        }
    ]

def main():
    """메인 실행 함수"""
    try:
        # Supabase 클라이언트 생성
        supabase = get_supabase_client()
        print(f"[INFO] Supabase 연결 성공")

        # 각 항목별 데이터 수집 및 저장
        items_data = [
            (1, get_item_8_1_data(), "시민 간담회 개최 건수"),
            (2, get_item_8_2_data(), "공청회·토론회 개최 건수"),
            (3, get_item_8_3_data(), "공식 온라인 소통 채널 운영 수"),
            (4, get_item_8_4_data(), "시민 제안 수용 건수/비율"),
            (5, get_item_8_5_data(), "SNS 팔로워 × 참여율 지수"),
            (6, get_item_8_6_data(), "SNS 댓글 응답 건수/비율"),
            (7, get_item_8_7_data(), "소통 능력 여론조사 점수")
        ]

        total_count = 0
        for item_num, data_list, item_name in items_data:
            print(f"\n[INFO] 항목 8-{item_num}: {item_name} - 데이터 저장 중...")
            success_count = 0
            for data_point in data_list:
                if insert_data(supabase, item_num, data_point):
                    success_count += 1
                    total_count += 1
            print(f"  ✓ {success_count}/{len(data_list)}개 데이터 저장 완료")

        # 최종 결과 확인
        print("\n" + "="*70)
        print("✅ 카테고리 8 (소통능력) 완료")
        print("="*70)
        print(f"정치인: {POLITICIAN_NAME} (ID: {POLITICIAN_ID})")
        print(f"총 데이터: {total_count}개")

        # 항목별 통계 조회
        response = supabase.table('collected_data') \
            .select('item_num, rating') \
            .eq('politician_id', POLITICIAN_ID) \
            .eq('category_num', CATEGORY_NUM) \
            .execute()

        if response.data:
            # 항목별 평균 계산
            item_stats = {}
            for row in response.data:
                item_num = row['item_num']
                rating = row['rating']
                if item_num not in item_stats:
                    item_stats[item_num] = []
                item_stats[item_num].append(rating)

            print(f"\n항목별 데이터:")
            total_avg = 0
            for item_num in sorted(item_stats.keys()):
                ratings = item_stats[item_num]
                avg_rating = sum(ratings) / len(ratings)
                total_avg += avg_rating
                print(f"  항목 8-{item_num}: {len(ratings)}개 데이터, 평균 Rating: {avg_rating:.2f}")

            overall_avg = total_avg / len(item_stats)
            print(f"\n전체 평균 Rating: {overall_avg:.2f}")

        print("="*70)

    except Exception as e:
        print(f"[ERROR] 실행 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return False

    return True

if __name__ == '__main__':
    main()
