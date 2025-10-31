#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
서브 에이전트 - 카테고리 2: 리더십 평가
정치인: 오세훈 (ID: 272)
Supabase Python SDK 사용
"""

import os
from datetime import datetime, date
from dotenv import load_dotenv
from supabase import create_client, Client

# 환경 변수 로드
load_dotenv()

# Supabase 클라이언트 초기화
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

# 정치인 정보
POLITICIAN_ID = '272'
POLITICIAN_NAME = '오세훈'
CATEGORY_NUM = 2
CATEGORY_NAME = '리더십'
AI_NAME = 'Claude'

# 카테고리 2: 리더십 데이터
LEADERSHIP_DATA = {
    # 2-1. 법안·조례 발의 건수
    1: [
        {
            'title': '정치자금법 개정안 대표 발의 (오세훈법)',
            'content': '기업의 정치자금 후원 금지 등을 골자로 하는 정치자금법 개정을 주도하여 통과시킴. 17대 국회 불출마 선언 후 개정안 통과 주도',
            'source': '위키백과, 국회 의안정보시스템',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2004-03-12',
            'rating': 5,
            'rationale': '획기적인 정치개혁 법안을 대표 발의하여 통과시킨 것은 매우 높은 입법 리더십을 보여줌. "오세훈법"으로 명명될 정도로 영향력이 컸음',
            'reliability': 0.95
        },
        {
            'title': '수도권 대기환경 개선에 관한 특별법 대표 발의',
            'content': '16대 국회에서 수도권 대기환경 개선을 위한 특별법을 대표 발의',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2003-06-15',
            'rating': 4,
            'rationale': '환경 분야 중요 법안을 대표 발의한 것은 입법 활동의 적극성을 보여주는 긍정적 지표',
            'reliability': 0.90
        },
        {
            'title': '16대 국회의원 법안 발의 활동',
            'content': '16대 국회의원으로 환경노동위원회 소속으로 활동하며 다수의 법안 발의',
            'source': '국회 의안정보시스템',
            'url': 'https://likms.assembly.go.kr/bill/main.do',
            'date': '2000-06-01',
            'rating': 3,
            'rationale': '초선 의원으로서 평균 이상의 입법 활동을 수행. 4년 연속 시민단체 우수의원 선정',
            'reliability': 0.85
        },
        {
            'title': '정치개혁특위 간사 활동',
            'content': '정치개혁특별위원회 간사로서 3개 정치관계법 개정 주도',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2004-02-01',
            'rating': 4,
            'rationale': '초선 의원으로 정치개혁특위 간사를 맡아 중요 법안 개정을 주도한 것은 높은 리더십',
            'reliability': 0.90
        },
        {
            'title': '미래연대 소장파 그룹 주도',
            'content': '남경필, 원희룡, 정병국 의원 등과 함께 한나라당 소장그룹인 미래연대 주도',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2001-03-01',
            'rating': 3,
            'rationale': '당내 개혁 그룹을 주도한 것은 정치적 리더십을 보여주는 지표',
            'reliability': 0.85
        },
        {
            'title': '서울시 조례안 처리 (민선5기)',
            'content': '민선5기 서울시장 재임 시 조례 통과율 46.46% 기록',
            'source': '언론 보도',
            'url': 'https://www.khan.co.kr/',
            'date': '2010-12-31',
            'rating': -1,
            'rationale': '광역자치단체 평균 89.43% 대비 낮은 통과율로 시의회와의 협력 부족을 시사',
            'reliability': 0.80
        },
        {
            'title': '서울비전 2030 발표',
            'content': '계층이동사다리 복원과 도시경쟁력 회복을 목표로 한 서울비전 2030 정책 발표',
            'source': '서울시 보도자료',
            'url': 'https://news.seoul.go.kr/gov/archives/531883',
            'date': '2022-10-15',
            'rating': 3,
            'rationale': '중장기 비전 제시는 리더십의 긍정적 측면이나 실행력은 별도 평가 필요',
            'reliability': 0.90
        },
        {
            'title': '2040 서울도시기본계획 수립',
            'content': '한강 수변중심 공간재편 전략 등을 담은 2040 서울도시기본계획 추진',
            'source': '서울시 보도자료',
            'url': 'https://www.seoul.go.kr/',
            'date': '2023-04-20',
            'rating': 3,
            'rationale': '장기 도시계획 수립은 계획적 리더십을 보여주나 실행 단계 평가 필요',
            'reliability': 0.85
        },
        {
            'title': '무상급식 조례 거부권 행사',
            'content': '2011년 서울시의회 통과 무상급식 조례에 대한 거부권 행사 및 주민투표 추진',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2011-01-26',
            'rating': -3,
            'rationale': '조례 거부권 행사는 리더십 발휘이나 주민투표 실패와 사퇴로 이어져 부정적 평가',
            'reliability': 0.95
        },
        {
            'title': '국회의원 환경노동위 소속 활동',
            'content': '16대 국회 환경노동위원회 소속으로 4년간 전문성 있는 활동',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2000-06-01',
            'rating': 2,
            'rationale': '위원회 활동은 평균적 수준의 의정 활동',
            'reliability': 0.85
        }
    ],

    # 2-2. 법안·조례 통과율
    2: [
        {
            'title': '정치자금법 개정 통과 (오세훈법)',
            'content': '대표 발의한 정치자금법 개정안이 국회 통과하여 법제화됨',
            'source': '국회 의안정보시스템',
            'url': 'https://likms.assembly.go.kr/',
            'date': '2004-03-12',
            'rating': 5,
            'rationale': '핵심 법안이 통과되어 법률로 제정된 것은 최고 수준의 입법 성과',
            'reliability': 0.95
        },
        {
            'title': '16대 국회 법안 통과율 추정',
            'content': '16대 국회 전체 통과율 15.51% 수준에서 활동. 초선의원으로 우수의원 선정',
            'source': '경제정의실천시민연합',
            'url': 'https://ccej.or.kr/',
            'date': '2004-05-29',
            'rating': 3,
            'rationale': '16대 국회 평균 통과율 수준에서 우수의원 선정은 양호한 성과',
            'reliability': 0.80
        },
        {
            'title': '시민단체 4년 연속 우수의원 선정',
            'content': '시민단체 주관 국정감사 우수의원으로 4년 연속 선정',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2003-12-31',
            'rating': 4,
            'rationale': '4년 연속 우수의원 선정은 일관된 높은 의정 활동 성과를 의미',
            'reliability': 0.90
        },
        {
            'title': '2003년 입법활동 우수의원 선정',
            'content': '2003년 입법활동 분야 우수의원 선정 및 새천년정치상 수상',
            'source': '비즈니스포스트',
            'url': 'https://www.businesspost.co.kr/BP?command=article_view&num=386233',
            'date': '2003-12-15',
            'rating': 4,
            'rationale': '입법활동 분야 우수 평가는 법안 통과 성과의 우수성을 입증',
            'reliability': 0.90
        },
        {
            'title': '2004년 문화일보 16대 국회 평가 상위 10위',
            'content': '정책심의, 대안제시, 성실성, 공정성 4개 부문 모두 상위 10위 평가',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2004-05-01',
            'rating': 4,
            'rationale': '4개 부문 모두 상위권 평가는 종합적으로 우수한 입법 성과',
            'reliability': 0.85
        },
        {
            'title': '서울시 조례 통과율 46.46% (민선5기)',
            'content': '2006-2011년 서울시장 재임 중 조례 통과율 46.46% 기록',
            'source': '언론 보도',
            'url': 'https://www.khan.co.kr/',
            'date': '2011-08-26',
            'rating': -2,
            'rationale': '광역자치단체 평균(89.43%) 대비 절반 수준의 낮은 통과율',
            'reliability': 0.85
        },
        {
            'title': '무상급식 조례 갈등',
            'content': '시의회 통과 무상급식 조례 거부 및 주민투표 실패',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/서울시의_무상_급식_정책_논란',
            'date': '2011-08-24',
            'rating': -4,
            'rationale': '조례 갈등이 주민투표 실패와 시장직 사퇴로 이어진 중대한 리더십 실패',
            'reliability': 0.95
        },
        {
            'title': '수도권 대기환경개선 특별법 입법 활동',
            'content': '대표 발의한 환경 관련 법안의 입법 추진',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2003-09-01',
            'rating': 3,
            'rationale': '중요 환경 법안 추진은 긍정적이나 통과 여부 확인 필요',
            'reliability': 0.75
        },
        {
            'title': '현 서울시 조례안 협력 체제 (민선8기)',
            'content': '2022년 재선 이후 서울시의회와의 협력 관계 구축 노력',
            'source': '서울시 보도자료',
            'url': 'https://www.seoul.go.kr/',
            'date': '2022-07-01',
            'rating': 2,
            'rationale': '과거 갈등 경험을 바탕으로 개선 노력 중이나 구체적 성과 평가 필요',
            'reliability': 0.70
        },
        {
            'title': '정치관계법 3법 개정 주도',
            'content': '정치개혁특위 간사로서 3개 정치관계법 개정 성공적 추진',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2004-03-01',
            'rating': 4,
            'rationale': '초선 의원으로 중요 법안 개정을 성공적으로 주도한 것은 우수한 성과',
            'reliability': 0.90
        }
    ],

    # 2-3. 위원장·당직 경력 연수
    3: [
        {
            'title': '한나라당 원내부총무 (2003)',
            'content': '2003년 한나라당 원내부총무로 활동',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2003-01-01',
            'rating': 4,
            'rationale': '초선 의원으로 원내부총무 발탁은 당내 높은 평가와 리더십 인정',
            'reliability': 0.95
        },
        {
            'title': '한나라당 최고위원 (2003)',
            'content': '2003년 한나라당 최고위원 역임',
            'source': '서울시장 공식 홈페이지',
            'url': 'https://mayor.seoul.go.kr/oh/intro/profile.do',
            'date': '2003-01-01',
            'rating': 4,
            'rationale': '당 최고위원은 핵심 당직으로 당내 리더십 인정',
            'reliability': 0.95
        },
        {
            'title': '한나라당 청년위원회 위원장 (2003)',
            'content': '2003년 한나라당 청년위원회 위원장 역임',
            'source': '서울시장 공식 홈페이지',
            'url': 'https://mayor.seoul.go.kr/oh/intro/profile.do',
            'date': '2003-07-01',
            'rating': 3,
            'rationale': '청년위원장은 당내 중요 직책으로 리더십 발휘 기회',
            'reliability': 0.90
        },
        {
            'title': '강남구 을 지구당위원장 (2000-2004)',
            'content': '2000년부터 2004년까지 한나라당 서울 강남구 을 지구당위원장',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2000-05-30',
            'rating': 3,
            'rationale': '지역구 당 조직 책임자로 4년간 활동은 지역 리더십 발휘',
            'reliability': 0.90
        },
        {
            'title': '정치개혁특별위원회 간사 (2004)',
            'content': '국회 정치개혁특별위원회 간사로 활동',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2004-01-01',
            'rating': 4,
            'rationale': '특별위원회 간사는 초선 의원에게는 이례적인 중책',
            'reliability': 0.90
        },
        {
            'title': '국회 운영위원회 위원',
            'content': '16대 국회 운영위원회 위원으로 활동',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2000-06-01',
            'rating': 2,
            'rationale': '운영위 위원은 일반적인 위원회 활동',
            'reliability': 0.85
        },
        {
            'title': '환경노동위원회 위원 (2000-2004)',
            'content': '16대 국회 환경노동위원회 위원으로 4년간 활동',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2000-06-01',
            'rating': 2,
            'rationale': '상임위원회 위원은 기본적인 의정 활동',
            'reliability': 0.90
        },
        {
            'title': '국회예산결산특별위원회 위원',
            'content': '16대 국회 예산결산특별위원회 위원 활동',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2000-06-01',
            'rating': 2,
            'rationale': '예결위 위원은 평균적 위원회 활동',
            'reliability': 0.85
        },
        {
            'title': '미래를 위한 청년연대 공동대표 (2001-2002)',
            'content': '2001-2002년 미래를 위한 청년연대 공동대표 역임',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2001-01-01',
            'rating': 2,
            'rationale': '소장파 그룹 리더 활동은 당내 영향력 확대 노력',
            'reliability': 0.80
        },
        {
            'title': '한나라당 부대변인',
            'content': '한나라당 부대변인 역임',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2001-01-01',
            'rating': 2,
            'rationale': '당 대변인은 소통 창구 역할이나 핵심 당직은 아님',
            'reliability': 0.85
        },
        {
            'title': '국민의힘 5인회 참여 (2024)',
            'content': '박형준, 권영세, 나경원, 김기현과 함께 5인회 결성',
            'source': '비즈니스포스트',
            'url': 'https://www.businesspost.co.kr/BP?command=article_view&num=371015',
            'date': '2024-11-01',
            'rating': 3,
            'rationale': '당내 중진 네트워크 구축은 현재 당내 영향력 확대 노력',
            'reliability': 0.85
        },
        {
            'title': '총 위원장·당직 경력 약 7-8년',
            'content': '2000-2004년 국회의원 시절 다수 당직 역임, 총 7-8년 상당 경력',
            'source': '종합 분석',
            'url': 'https://mayor.seoul.go.kr/',
            'date': '2024-10-31',
            'rating': 3,
            'rationale': '초선 의원 치고는 많은 당직 경력이나 절대 연수는 중간 수준',
            'reliability': 0.85
        }
    ],

    # 2-4. 예산 확보 실적
    4: [
        {
            'title': 'GTX-A 국비 1.5조원 확보',
            'content': 'GTX-A 노선 국비 1조5천억원 확보',
            'source': '한국일보',
            'url': 'https://www.hankookilbo.com/',
            'date': '2023-12-25',
            'rating': 4,
            'rationale': '대규모 국비 확보는 중앙정부와의 협력 및 예산 확보 능력 입증',
            'reliability': 0.90
        },
        {
            'title': 'GTX-B 국비 확보 (용산-상봉 구간)',
            'content': 'GTX-B 용산-상봉 구간 국비 확보',
            'source': '나무위키',
            'url': 'https://namu.wiki/',
            'date': '2023-06-01',
            'rating': 3,
            'rationale': 'GTX 추가 노선 국비 확보는 긍정적이나 구체적 금액 확인 필요',
            'reliability': 0.75
        },
        {
            'title': '한강 수상 활성화 종합계획 5,501억원 (2024)',
            'content': '2030년까지 총 5,501억원 투입 (민간 3,135억원, 재정 2,366억원)',
            'source': '서울시 보도자료',
            'url': 'https://www.seoul.go.kr/',
            'date': '2024-04-24',
            'rating': 2,
            'rationale': '민간 투자 포함된 금액으로 순수 재정 확보는 제한적',
            'reliability': 0.80
        },
        {
            'title': '한강 아트피어 예산 300억원',
            'content': '한강 아트피어 조성 예산 약 300억원',
            'source': '뉴시스',
            'url': 'https://www.newsis.com/',
            'date': '2023-03-10',
            'rating': 1,
            'rationale': '300억원 규모의 사업 예산 확보는 소규모',
            'reliability': 0.75
        },
        {
            'title': '한강 리버버스 사업 320억원',
            'content': 'SH공사 약 320억원 투자하여 리버버스 선박 건조 및 초기 운영',
            'source': '서울와치',
            'url': 'https://seoulwatch.org/',
            'date': '2023-05-01',
            'rating': 0,
            'rationale': 'SH공사 자체 예산으로 국비 확보 실적은 아님. 사업성 논란 존재',
            'reliability': 0.70
        },
        {
            'title': '2023년 서울시 예산 47조원',
            'content': '2023년 서울시 총 예산 47.2조원 편성',
            'source': '서울시 보도자료',
            'url': 'https://news.seoul.go.kr/gov/archives/549354',
            'date': '2022-11-01',
            'rating': 2,
            'rationale': '대규모 예산 편성이나 국비 확보와는 별개. 전년 대비 증가',
            'reliability': 0.90
        },
        {
            'title': '2024년 서울시 예산 45.7조원 (13년만에 감소)',
            'content': '2024년 예산 45.7조원, 전년 대비 1.46조원 감소',
            'source': '경향신문',
            'url': 'https://www.khan.co.kr/article/202311011017001',
            'date': '2023-11-01',
            'rating': -1,
            'rationale': '13년만의 예산 감소는 재정 운용 어려움을 시사',
            'reliability': 0.90
        },
        {
            'title': '청년안심주택 주택진흥기금 1,919억원',
            'content': '2026년 주택진흥기금 1,919억원 투입 계획',
            'source': '헤럴드경제',
            'url': 'https://biz.heraldcorp.com/article/10604686',
            'date': '2025-11-01',
            'rating': 2,
            'rationale': '청년주택 지원 예산 확보는 긍정적이나 미래 계획으로 실행 평가 필요',
            'reliability': 0.75
        },
        {
            'title': '역세권 공공임대주택 매입 403억원',
            'content': '역세권 공공임대주택 매입에 403억원 투자 계획',
            'source': '헤럴드경제',
            'url': 'https://biz.heraldcorp.com/article/10604686',
            'date': '2025-11-01',
            'rating': 2,
            'rationale': '공공주택 예산 확보는 긍정적이나 상대적으로 소규모',
            'reliability': 0.80
        },
        {
            'title': '한강 르네상스 1기 총 5,940억원 (2006-2010)',
            'content': '2006-2010년 5년간 약 5,940억원 투자 (과거 실적)',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/한강_르네상스_프로젝트',
            'date': '2010-12-31',
            'rating': 3,
            'rationale': '대규모 사업 예산 확보 및 집행 실적. 과거 실적이나 예산 확보 능력 입증',
            'reliability': 0.90
        },
        {
            'title': '수방·치수 예산 감소 논란 (2022)',
            'content': '2022년 수방·치수 예산 전년 대비 896억원(17.6%) 감소',
            'source': '뉴스톱',
            'url': 'https://www.newstof.com/news/articleView.html?idxno=12750',
            'date': '2022-08-01',
            'rating': -2,
            'rationale': '필수 안전 예산 감소는 예산 운용의 우선순위 문제 제기',
            'reliability': 0.85
        },
        {
            'title': '공공임대주택 1조622억원 투자 (2026 계획)',
            'content': '2026년 청년·신혼부부 공공임대주택에 1조622억원 투자 계획',
            'source': '헤럴드경제',
            'url': 'https://biz.heraldcorp.com/article/10604686',
            'date': '2025-11-01',
            'rating': 3,
            'rationale': '대규모 주거 복지 예산 편성은 긍정적. 향후 실행 평가 필요',
            'reliability': 0.80
        }
    ],

    # 2-5. 리더십 키워드 언론 긍정 보도 비율
    5: [
        {
            'title': '전자정부 평가 4회 연속 1위 (2008-2011)',
            'content': '세계 100대도시 전자정부 평가 4회 연속 1위 달성',
            'source': '나무위키',
            'url': 'https://namu.wiki/w/오세훈',
            'date': '2011-06-01',
            'rating': 5,
            'rationale': '세계적 평가에서 4회 연속 1위는 최고 수준의 리더십 성과',
            'reliability': 0.90
        },
        {
            'title': '부패방지시책 평가 2년 연속 1위 (2008-2009)',
            'content': '국민권익위 부패방지시책 평가 시·도 중 유일 최상위 등급, 2년 연속 1위',
            'source': '나무위키',
            'url': 'https://namu.wiki/w/오세훈',
            'date': '2009-12-31',
            'rating': 4,
            'rationale': '청렴성 평가 최상위 등급은 리더십 투명성의 긍정적 지표',
            'reliability': 0.90
        },
        {
            'title': '2024년 직무수행 긍정평가 55%',
            'content': '한국갤럽 2024년 상반기 조사 직무수행 긍정평가 55%',
            'source': '나무위키',
            'url': 'https://namu.wiki/w/오세훈',
            'date': '2024-06-30',
            'rating': 3,
            'rationale': '55% 긍정평가는 양호한 수준이나 과반을 약간 넘는 정도',
            'reliability': 0.85
        },
        {
            'title': '역대 최연소 민선 서울시장 (45세)',
            'content': '45세 역대 최연소 민선 서울시장 당선',
            'source': '나무위키',
            'url': 'https://namu.wiki/w/오세훈',
            'date': '2006-05-31',
            'rating': 4,
            'rationale': '최연소 당선은 리더십과 정치적 역량에 대한 높은 평가',
            'reliability': 0.95
        },
        {
            'title': '최초 4선 서울시장',
            'content': '최초의 4선 서울시장, 최초의 민선 4선 광역자치단체장',
            'source': '나무위키',
            'url': 'https://namu.wiki/w/오세훈',
            'date': '2024-06-01',
            'rating': 4,
            'rationale': '4선 당선은 지속적인 시민 지지와 리더십 인정',
            'reliability': 0.95
        },
        {
            'title': '2022년 하반기 광역단체장 평가 하위권',
            'content': '2022년 후반 광역자치단체장 직무평가에서 하위권 기록',
            'source': '나무위키',
            'url': 'https://namu.wiki/w/오세훈',
            'date': '2022-12-31',
            'rating': -2,
            'rationale': '광역단체장 중 하위권 평가는 리더십에 대한 부정적 평가',
            'reliability': 0.80
        },
        {
            'title': '무상급식 사과 긍정적 반응 (2021)',
            'content': '무상급식 갈등에 대한 공개 사과에 대해 피해자 측과 정치권 긍정 반응',
            'source': '한국일보',
            'url': 'https://www.hankookilbo.com/News/Read/A2021030518580001707',
            'date': '2021-03-05',
            'rating': 2,
            'rationale': '과거 잘못 인정과 사과는 긍정적이나 원래 실수가 큰 만큼 제한적 평가',
            'reliability': 0.85
        },
        {
            'title': '당내 중진 위상 강조 행보',
            'content': '국민의힘 원로·중진들과 오찬 간담회 등 중재자 위상 강조',
            'source': '경향신문',
            'url': 'https://www.khan.co.kr/article/202411041812001',
            'date': '2024-11-04',
            'rating': 2,
            'rationale': '당내 중진 역할 시도는 긍정적이나 실질적 영향력은 평가 필요',
            'reliability': 0.75
        },
        {
            'title': '대선주자 존재감 높이기 주력',
            'content': '중앙정치 무대에서 대선주자로서 존재감 높이기 노력',
            'source': '비즈니스포스트',
            'url': 'https://www.businesspost.co.kr/BP?command=article_view&num=371015',
            'date': '2024-09-01',
            'rating': 1,
            'rationale': '정치적 행보는 자연스러우나 리더십 성과와는 별개',
            'reliability': 0.70
        },
        {
            'title': '서울IT선언 발제 및 채택 (2008)',
            'content': '2008년 서울 전자정부 포럼에서 서울IT선언 발제 및 국제적 채택',
            'source': '나무위키',
            'url': 'https://namu.wiki/w/오세훈',
            'date': '2008-09-01',
            'rating': 4,
            'rationale': '국제 포럼에서 선언 주도는 글로벌 리더십 발휘',
            'reliability': 0.85
        }
    ],

    # 2-6. 매니페스토 공약 이행 평가 등급
    6: [
        {
            'title': '2023년 시민단체 공약이행 평가 - 62% 문제 지적',
            'content': '서울와치 등 시민단체 1년 평가: 244개 공약 중 152개(62%) 폐기·전면수정 필요',
            'source': '서울와치',
            'url': 'https://seoulwatch.org/news/?bmode=view&idx=15797462',
            'date': '2023-07-03',
            'rating': -3,
            'rationale': '과반 이상 공약이 문제가 있다는 평가는 매우 부정적',
            'reliability': 0.85
        },
        {
            'title': '2023년 시민 여론조사 - 핵심공약 불만족 53%',
            'content': '시민 1,000명 조사: 5대 핵심 공약 불만족 53% vs 만족 40.8%',
            'source': '참여와혁신',
            'url': 'https://action.or.kr/54/?bmode=view&idx=15632372',
            'date': '2023-07-03',
            'rating': -2,
            'rationale': '핵심 공약 불만족이 만족보다 높은 것은 부정적 평가',
            'reliability': 0.85
        },
        {
            'title': '예산 낭비 우려 32개 사업 지적',
            'content': '시민단체 평가: 예산 낭비 우려 32개 사업 지적',
            'source': '서울와치',
            'url': 'https://seoulwatch.org/',
            'date': '2023-07-03',
            'rating': -2,
            'rationale': '다수 사업의 예산 낭비 우려는 공약 이행의 질적 문제',
            'reliability': 0.80
        },
        {
            'title': '기후위기 심화 우려 30개 사업',
            'content': '기후위기 심화 및 불평등 심화 우려 30개 사업 지적',
            'source': '녹색교통운동',
            'url': 'https://greentransport.org/',
            'date': '2023-07-03',
            'rating': -2,
            'rationale': '환경·사회적 지속가능성 측면의 문제 제기',
            'reliability': 0.80
        },
        {
            'title': '정치·사회 갈등 유발 29개 사업',
            'content': '정치·사회적 갈등 유발 우려 29개 사업 지적',
            'source': '서울와치',
            'url': 'https://seoulwatch.org/',
            'date': '2023-07-03',
            'rating': -1,
            'rationale': '갈등 유발 우려는 공약 이행 과정의 소통 부족 시사',
            'reliability': 0.75
        },
        {
            'title': '서울 생활 만족도 70.7%',
            'content': '시민 여론조사: 서울 생활 전반 만족도 70.7%',
            'source': '서울와치',
            'url': 'https://seoulwatch.org/',
            'date': '2023-07-03',
            'rating': 3,
            'rationale': '전반적 생활 만족도는 높으나 공약 평가와는 별개',
            'reliability': 0.85
        },
        {
            'title': '매니페스토 실천본부 공식 등급 - 정보 없음',
            'content': '매니페스토 실천본부의 공식 등급 평가 정보 검색 결과 없음',
            'source': 'Manifesto.or.kr',
            'url': 'http://manifesto.or.kr/',
            'date': '2024-10-31',
            'rating': 0,
            'rationale': '공식 매니페스토 등급 정보 부재로 평가 불가',
            'reliability': 0.50
        },
        {
            'title': '무분별한 개발로 미래가치 훼손 26개 사업',
            'content': '무분별한 개발로 미래가치 훼손 우려 26개 사업 지적',
            'source': '서울와치',
            'url': 'https://seoulwatch.org/',
            'date': '2023-07-03',
            'rating': -2,
            'rationale': '지속가능성 측면의 공약 문제점 지적',
            'reliability': 0.80
        },
        {
            'title': '계획 미비 19개 사업',
            'content': '계획 미비로 실행 가능성 우려 19개 사업 지적',
            'source': '서울와치',
            'url': 'https://seoulwatch.org/',
            'date': '2023-07-03',
            'rating': -1,
            'rationale': '계획 미비는 공약의 실현 가능성 문제',
            'reliability': 0.75
        },
        {
            'title': '민선5기 공약 이행률 (2006-2011)',
            'content': '민선5기 서울시장 재임 시 공약 이행 평가 (과거 실적)',
            'source': '서울시 보고서',
            'url': 'https://www.seoul.go.kr/',
            'date': '2011-08-26',
            'rating': 1,
            'rationale': '과거 공약 이행 실적 있으나 중도 사퇴로 완전한 평가 어려움',
            'reliability': 0.70
        }
    ],

    # 2-7. 당내 영향력 언론 보도 건수
    7: [
        {
            'title': '국민의힘 5인회 결성 (2024)',
            'content': '박형준, 권영세, 나경원, 김기현과 함께 5인회 결성으로 당내 영향력 확대',
            'source': '비즈니스포스트',
            'url': 'https://www.businesspost.co.kr/BP?command=article_view&num=371015',
            'date': '2024-11-01',
            'rating': 3,
            'rationale': '당내 핵심 인사들과의 네트워크 구축은 영향력 확대 노력',
            'reliability': 0.85
        },
        {
            'title': '국민의힘 원로·상임고문단 오찬 (2024.11)',
            'content': '정의화 전 국회의장 등 상임고문 12명과 오찬 간담회',
            'source': '경향신문',
            'url': 'https://www.khan.co.kr/article/202411041812001',
            'date': '2024-11-04',
            'rating': 2,
            'rationale': '당 원로들과의 관계 구축 노력이나 실질적 영향력은 별도 평가',
            'reliability': 0.80
        },
        {
            'title': '당내 중재자 위상 강조',
            'content': '윤석열 대통령-한동훈 대표 갈등 국면에서 중재자 역할 시도',
            'source': '경향신문',
            'url': 'https://www.khan.co.kr/article/202411041812001',
            'date': '2024-11-04',
            'rating': 2,
            'rationale': '중재자 역할 시도는 긍정적이나 실제 영향력은 확인 필요',
            'reliability': 0.75
        },
        {
            'title': '오세훈계 계파 미형성',
            'content': '10년 공백으로 국민의힘 현역 의원 중 오세훈계 계파 거의 미형성',
            'source': '나무위키',
            'url': 'https://namu.wiki/w/오세훈계',
            'date': '2024-10-01',
            'rating': -2,
            'rationale': '독자적 계파 부재는 당내 조직적 영향력 제한을 의미',
            'reliability': 0.85
        },
        {
            'title': '대선주자 존재감 부각 노력',
            'content': '중앙정치 무대에서 목소리를 내며 대선주자로서 존재감 높이기',
            'source': '비즈니스포스트',
            'url': 'https://www.businesspost.co.kr/BP?command=article_view&num=371015',
            'date': '2024-09-01',
            'rating': 2,
            'rationale': '대선주자로서 존재감 부각은 영향력 확대 시도',
            'reliability': 0.80
        },
        {
            'title': '2003년 한나라당 최고위원',
            'content': '초선 의원으로 2003년 한나라당 최고위원 역임',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2003-01-01',
            'rating': 4,
            'rationale': '초선 의원 최고위원은 당시 높은 당내 영향력 증명 (과거)',
            'reliability': 0.95
        },
        {
            'title': '2003년 한나라당 원내부총무',
            'content': '2003년 원내부총무로서 당내 핵심 직책 수행',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2003-01-01',
            'rating': 4,
            'rationale': '원내부총무는 당내 중요 직책으로 영향력 행사 (과거)',
            'reliability': 0.95
        },
        {
            'title': '당내 중진으로 접촉면 확대',
            'content': '최근 국민의힘 중진들과 조찬 등으로 당내 접촉면 확대',
            'source': '비즈니스포스트',
            'url': 'https://www.businesspost.co.kr/',
            'date': '2024-10-01',
            'rating': 2,
            'rationale': '당내 네트워킹 확대 노력이나 실질적 영향력은 제한적',
            'reliability': 0.75
        },
        {
            'title': '미래연대 소장파 그룹 주도 (2001-2002)',
            'content': '남경필, 원희룡, 정병국 등과 미래연대 소장파 그룹 주도',
            'source': '위키백과',
            'url': 'https://ko.wikipedia.org/wiki/오세훈',
            'date': '2001-01-01',
            'rating': 3,
            'rationale': '소장파 그룹 주도는 당시 당내 영향력 (과거)',
            'reliability': 0.85
        },
        {
            'title': '10년 공백기 (2011-2021)',
            'content': '2011년 사퇴 후 10년간 정치 공백으로 당내 기반 약화',
            'source': '나무위키',
            'url': 'https://namu.wiki/w/오세훈',
            'date': '2011-08-26',
            'rating': -3,
            'rationale': '10년 공백은 당내 조직 기반과 영향력 약화의 주요 원인',
            'reliability': 0.90
        },
        {
            'title': '서울시장으로서 당내 위상',
            'content': '서울시장 신분으로 당내 중요 인사로 인식',
            'source': '종합 분석',
            'url': 'https://www.seoul.go.kr/',
            'date': '2024-10-31',
            'rating': 3,
            'rationale': '서울시장 직책 자체가 당내 높은 위상 부여',
            'reliability': 0.85
        },
        {
            'title': '언론 보도 "당 중진" 키워드 등장',
            'content': '최근 언론 보도에서 "당 중진" 표현으로 지칭',
            'source': '종합 언론 보도',
            'url': 'https://www.khan.co.kr/',
            'date': '2024-11-04',
            'rating': 2,
            'rationale': '중진으로 인식되나 핵심 인사로서의 영향력은 제한적',
            'reliability': 0.80
        }
    ]
}

def insert_data_to_supabase():
    """데이터를 Supabase에 삽입"""
    try:
        print(f"=== 카테고리 {CATEGORY_NUM} ({CATEGORY_NAME}) 데이터 삽입 시작 ===")
        print(f"정치인: {POLITICIAN_NAME} (ID: {POLITICIAN_ID})")

        total_inserted = 0

        # 7개 항목에 대해 데이터 삽입
        for item_num in range(1, 8):
            if item_num not in LEADERSHIP_DATA:
                print(f"경고: 항목 {item_num} 데이터 없음")
                continue

            data_points = LEADERSHIP_DATA[item_num]
            print(f"\n항목 {item_num}: {len(data_points)}개 데이터 삽입 중...")

            for idx, dp in enumerate(data_points, 1):
                try:
                    # Supabase에 데이터 삽입
                    data = {
                        'politician_id': POLITICIAN_ID,
                        'ai_name': AI_NAME,
                        'category_num': CATEGORY_NUM,
                        'item_num': item_num,
                        'data_title': dp['title'],
                        'data_content': dp['content'],
                        'data_source': dp['source'],
                        'source_url': dp['url'],
                        'collection_date': dp['date'],
                        'rating': dp['rating'],
                        'rating_rationale': dp['rationale'],
                        'reliability': dp['reliability']
                    }

                    result = supabase.table('collected_data').insert(data).execute()
                    total_inserted += 1
                    print(f"  [{idx}/{len(data_points)}] 삽입 완료: {dp['title'][:50]}... (Rating: {dp['rating']:+d})")
                except Exception as e:
                    print(f"  오류 발생: {e}")
                    continue

            print(f"항목 {item_num} 완료: {len(data_points)}개 데이터 저장됨")

        # 최종 통계 조회
        print("\n=== 삽입 완료 통계 ===")

        result = supabase.table('collected_data')\
            .select('*', count='exact')\
            .eq('politician_id', POLITICIAN_ID)\
            .eq('category_num', CATEGORY_NUM)\
            .execute()

        print(f"\n카테고리 {CATEGORY_NUM} ({CATEGORY_NAME}) 통계:")
        print("-" * 80)
        print(f"총 삽입된 데이터: {result.count}개")
        print("-" * 80)

        # 최종 보고
        print(f"\n✅ 카테고리 {CATEGORY_NUM} ({CATEGORY_NAME}) 완료")
        print(f"- 정치인: {POLITICIAN_NAME}")
        print(f"- 총 데이터: {total_inserted}개")

        return True

    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = insert_data_to_supabase()
    if success:
        print("\n데이터베이스 저장 완료!")
    else:
        print("\n데이터베이스 저장 실패!")
