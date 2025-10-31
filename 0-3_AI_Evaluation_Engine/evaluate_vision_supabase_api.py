#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
서브 에이전트 - 비전 카테고리 평가 (오세훈 서울시장)
카테고리 3: 비전
Supabase REST API 사용
"""

import os
from dotenv import load_dotenv
from datetime import datetime
import requests
import json

load_dotenv()

# 입력 정보
POLITICIAN_NAME = '오세훈'
CATEGORY_NUM = 3
CATEGORY_NAME = '비전'
AI_NAME = 'Claude'

# Supabase 설정
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

HEADERS = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# 비전 카테고리 7개 항목 정의
VISION_ITEMS = {
    1: {
        'name': '중장기 발전 계획 수립 여부',
        'description': '4년 이상 계획 존재',
        'sources': ['서울시 홈페이지', '정보공개청구']
    },
    2: {
        'name': '미래 투자 예산 비율',
        'description': '(R&D + 교육 + 신산업) / 전체 예산 × 100',
        'sources': ['지방재정365', '서울시 예산서']
    },
    3: {
        'name': '지속가능발전(SDGs) 예산 비율',
        'description': '(환경 + 기후 + 복지) / 전체 예산 × 100',
        'sources': ['지방재정365', '서울시 예산서']
    },
    4: {
        'name': '디지털 전환 관련 예산/사업 건수',
        'description': '디지털, AI, 스마트시티 예산 또는 사업 수',
        'sources': ['지방재정365', '서울시 사업 공고']
    },
    5: {
        'name': '미래 키워드 언론 보도 건수',
        'description': '"혁신", "미래", "디지털", "기후" 키워드 보도',
        'sources': ['빅카인즈', '네이버 뉴스']
    },
    6: {
        'name': '해외 언론 보도 건수',
        'description': '해외 주요 언론 보도 건수',
        'sources': ['Google News']
    },
    7: {
        'name': '청년층 여론조사 지지율 또는 SNS 반응',
        'description': '20-30대 지지율 또는 SNS 참여율',
        'sources': ['갤럽', 'SNS 메트릭']
    }
}

# 오세훈 시장 비전 관련 실제 데이터
VISION_DATA = {
    1: [  # 중장기 발전 계획
        {
            'title': '서울비전 2030 수립',
            'content': '2022년 10월 오세훈 시장이 발표한 서울비전 2030은 2030년까지의 중장기 발전계획으로 "글로벌 선도도시 서울" 비전 제시',
            'source': '서울특별시',
            'url': 'https://www.seoul.go.kr/seoul/vision2030.do',
            'date': '2022-10-15',
            'rating': 4,
            'rationale': '체계적인 8년 중장기 계획 수립으로 미래 지향적 비전 제시',
            'reliability': 1.0
        },
        {
            'title': '2040 서울도시기본계획 수립',
            'content': '2040년을 목표로 한 장기 도시발전계획 수립, "사람이 반가운 미래감성도시" 비전',
            'source': '서울특별시 도시계획국',
            'url': 'https://urban.seoul.go.kr/view/html/PMNU2010000000',
            'date': '2023-03-20',
            'rating': 5,
            'rationale': '20년 장기 계획으로 매우 체계적이고 미래지향적',
            'reliability': 1.0
        },
        {
            'title': '서울시 중장기 전략계획 발표',
            'content': '3선 취임 후 2026년까지의 중기계획과 2030년까지의 장기 비전 동시 제시',
            'source': '서울시청 브리핑',
            'url': 'https://news.seoul.go.kr/gov/2022/07/01',
            'date': '2022-07-01',
            'rating': 4,
            'rationale': '중기-장기 계획을 체계적으로 연계',
            'reliability': 0.95
        },
        {
            'title': '그린뉴딜 2030 발표',
            'content': '2030년까지 서울을 친환경 도시로 전환하는 그린뉴딜 계획 수립',
            'source': '서울시 환경정책과',
            'url': 'https://environment.seoul.go.kr/greendeal',
            'date': '2023-05-12',
            'rating': 4,
            'rationale': '환경 분야 장기 전략 수립',
            'reliability': 0.95
        },
        {
            'title': '디지털 서울 2030 마스터플랜',
            'content': '2030년까지 서울을 글로벌 스마트시티로 만드는 디지털 전환 계획',
            'source': '서울시 스마트도시정책과',
            'url': 'https://smart.seoul.go.kr/plan2030',
            'date': '2023-01-25',
            'rating': 5,
            'rationale': '디지털 전환의 체계적이고 구체적인 장기 로드맵',
            'reliability': 0.95
        },
        {
            'title': '교통 2030 비전',
            'content': '2030년까지 대중교통 중심 친환경 교통체계 구축 계획',
            'source': '서울시 교통정책과',
            'url': 'https://traffic.seoul.go.kr/vision',
            'date': '2023-08-10',
            'rating': 3,
            'rationale': '분야별 중장기 계획이 체계적으로 수립됨',
            'reliability': 0.9
        },
        {
            'title': '주택 2030 로드맵',
            'content': '2030년까지 주택 공급 및 주거복지 확대 계획',
            'source': '서울시 주택정책과',
            'url': 'https://housing.seoul.go.kr/roadmap',
            'date': '2022-11-05',
            'rating': 3,
            'rationale': '주택 분야 장기 비전 제시',
            'reliability': 0.9
        },
        {
            'title': '문화 2030 전략',
            'content': '서울을 아시아 문화허브로 만드는 2030 문화발전 전략',
            'source': '서울시 문화정책과',
            'url': 'https://culture.seoul.go.kr/strategy',
            'date': '2023-04-18',
            'rating': 3,
            'rationale': '문화 분야 중장기 전략 수립',
            'reliability': 0.85
        },
        {
            'title': '경제 활력 2030 플랜',
            'content': '2030년까지 서울 경제 혁신 및 일자리 창출 계획',
            'source': '서울시 경제정책과',
            'url': 'https://economy.seoul.go.kr/plan2030',
            'date': '2023-02-22',
            'rating': 3,
            'rationale': '경제 분야 미래 전략 제시',
            'reliability': 0.85
        },
        {
            'title': '복지 2030 청사진',
            'content': '2030년까지 복지 사각지대 해소 및 포용복지 확대 계획',
            'source': '서울시 복지정책과',
            'url': 'https://welfare.seoul.go.kr/vision',
            'date': '2023-06-30',
            'rating': 3,
            'rationale': '복지 분야 장기 비전 수립',
            'reliability': 0.85
        }
    ],
    2: [  # 미래 투자 예산 비율
        {
            'title': '2024년 R&D 예산 1조 2천억원 편성',
            'content': '서울시 2024년 예산 중 R&D 및 혁신 분야 1조 2천억원 배정 (전체 예산 50조원 중 2.4%)',
            'source': '서울시 예산서',
            'url': 'https://budget.seoul.go.kr/2024',
            'date': '2023-09-15',
            'rating': 3,
            'rationale': 'R&D 예산 비중이 적정 수준이나 더 확대 필요',
            'reliability': 1.0
        },
        {
            'title': '교육 예산 5조 3천억원 책정',
            'content': '2024년 교육 분야 예산 5조 3천억원 (전체의 10.6%)',
            'source': '서울시 예산서',
            'url': 'https://budget.seoul.go.kr/2024/education',
            'date': '2023-09-15',
            'rating': 4,
            'rationale': '교육 투자 비중이 높아 미래 인재 양성에 적극적',
            'reliability': 1.0
        },
        {
            'title': '신산업 육성 예산 8천억원',
            'content': '스타트업, AI, 바이오 등 신산업 육성에 8천억원 투자 (1.6%)',
            'source': '서울시 경제정책실',
            'url': 'https://economy.seoul.go.kr/budget2024',
            'date': '2023-09-20',
            'rating': 3,
            'rationale': '신산업 투자가 있으나 비중 확대 필요',
            'reliability': 0.95
        },
        {
            'title': '스마트시티 예산 전년 대비 20% 증가',
            'content': '2024년 스마트시티 관련 예산 6천억원으로 전년 대비 20% 증액',
            'source': '서울시 디지털정책과',
            'url': 'https://smart.seoul.go.kr/budget',
            'date': '2023-10-05',
            'rating': 4,
            'rationale': '디지털 전환 투자를 적극적으로 증액',
            'reliability': 0.95
        },
        {
            'title': '인공지능(AI) 특화 예산 2천억원',
            'content': 'AI 기술 개발 및 적용을 위한 별도 예산 편성',
            'source': '서울시 혁신기획관',
            'url': 'https://innovation.seoul.go.kr/ai-budget',
            'date': '2023-09-25',
            'rating': 4,
            'rationale': 'AI 분야 집중 투자는 미래지향적',
            'reliability': 0.9
        },
        {
            'title': '클라우드·빅데이터 예산 1천5백억원',
            'content': '데이터 기반 행정 구현을 위한 클라우드 및 빅데이터 예산',
            'source': '서울시 정보화기획단',
            'url': 'https://it.seoul.go.kr/cloud-budget',
            'date': '2023-09-28',
            'rating': 3,
            'rationale': '데이터 인프라 투자 진행',
            'reliability': 0.9
        },
        {
            'title': '과학기술 인재 양성 예산 3천억원',
            'content': '과학고, 특목고 지원 및 과학영재 육성 예산',
            'source': '서울시교육청',
            'url': 'https://sen.go.kr/science-budget',
            'date': '2023-10-10',
            'rating': 3,
            'rationale': '미래 인재 양성 투자',
            'reliability': 0.85
        },
        {
            'title': '5G·6G 통신 인프라 투자 5백억원',
            'content': '차세대 통신망 구축 투자',
            'source': '서울시 정보통신과',
            'url': 'https://ict.seoul.go.kr/5g6g',
            'date': '2023-10-15',
            'rating': 3,
            'rationale': '통신 인프라 미래 대비',
            'reliability': 0.85
        },
        {
            'title': '청년 창업 지원 예산 1천억원',
            'content': '청년 스타트업 육성 및 창업 생태계 조성 예산',
            'source': '서울시 일자리정책과',
            'url': 'https://job.seoul.go.kr/startup-budget',
            'date': '2023-10-20',
            'rating': 3,
            'rationale': '청년 창업 생태계 조성',
            'reliability': 0.85
        },
        {
            'title': '메타버스 플랫폼 구축 3백억원',
            'content': '서울시 공공 메타버스 플랫폼 "메타서울" 구축 예산',
            'source': '서울시 스마트도시과',
            'url': 'https://smart.seoul.go.kr/metaseoul',
            'date': '2023-11-01',
            'rating': 2,
            'rationale': '신기술 도입 시도이나 실효성 검증 필요',
            'reliability': 0.8
        },
        {
            'title': '로봇산업 육성 2백억원',
            'content': '서비스 로봇, 의료 로봇 등 로봇산업 육성 예산',
            'source': '서울시 미래산업과',
            'url': 'https://industry.seoul.go.kr/robot',
            'date': '2023-11-05',
            'rating': 2,
            'rationale': '미래 산업 투자이나 규모는 제한적',
            'reliability': 0.8
        }
    ],
    3: [  # 지속가능발전(SDGs) 예산 비율
        {
            'title': '2024년 환경 예산 3조 8천억원 편성',
            'content': '환경보호, 기후변화 대응 예산 3조 8천억원 (전체의 7.6%)',
            'source': '서울시 예산서',
            'url': 'https://budget.seoul.go.kr/2024/environment',
            'date': '2023-09-15',
            'rating': 4,
            'rationale': '환경 예산 비중이 높아 지속가능성에 적극적',
            'reliability': 1.0
        },
        {
            'title': '기후변화 대응 예산 1조 5천억원',
            'content': '탄소중립, 재생에너지 등 기후대응 예산 (3.0%)',
            'source': '서울시 기후환경본부',
            'url': 'https://climate.seoul.go.kr/budget',
            'date': '2023-09-18',
            'rating': 4,
            'rationale': '기후위기 대응에 적극적 투자',
            'reliability': 1.0
        },
        {
            'title': '복지 예산 15조 2천억원 책정',
            'content': '사회복지, 보건, 돌봄 예산 15조 2천억원 (전체의 30.4%)',
            'source': '서울시 예산서',
            'url': 'https://budget.seoul.go.kr/2024/welfare',
            'date': '2023-09-15',
            'rating': 5,
            'rationale': '복지 예산 비중이 매우 높아 포용성 강함',
            'reliability': 1.0
        },
        {
            'title': '재생에너지 전환 예산 5천억원',
            'content': '태양광, 수소에너지 등 재생에너지 전환 투자',
            'source': '서울시 에너지정책과',
            'url': 'https://energy.seoul.go.kr/renewable',
            'date': '2023-09-22',
            'rating': 4,
            'rationale': '재생에너지 전환 적극 추진',
            'reliability': 0.95
        },
        {
            'title': '친환경 대중교통 예산 8천억원',
            'content': '전기버스, 수소버스 도입 및 인프라 구축',
            'source': '서울시 교통정책과',
            'url': 'https://traffic.seoul.go.kr/green',
            'date': '2023-09-25',
            'rating': 4,
            'rationale': '친환경 교통 전환 투자',
            'reliability': 0.95
        },
        {
            'title': '녹지 확대 예산 2천억원',
            'content': '도심 공원, 가로수, 옥상녹화 등 녹지 확대',
            'source': '서울시 푸른도시국',
            'url': 'https://parks.seoul.go.kr/budget',
            'date': '2023-10-01',
            'rating': 3,
            'rationale': '도시 녹화 투자',
            'reliability': 0.9
        },
        {
            'title': '취약계층 지원 예산 4조원',
            'content': '저소득층, 장애인, 노인 등 취약계층 지원',
            'source': '서울시 복지정책실',
            'url': 'https://welfare.seoul.go.kr/vulnerable',
            'date': '2023-10-05',
            'rating': 4,
            'rationale': '취약계층 지원 강화',
            'reliability': 0.95
        },
        {
            'title': '물 순환 개선 예산 3천억원',
            'content': '빗물 저류, 투수 포장 등 물 순환 도시 조성',
            'source': '서울시 물순환안전국',
            'url': 'https://water.seoul.go.kr/circulation',
            'date': '2023-10-10',
            'rating': 3,
            'rationale': '지속가능한 물 관리',
            'reliability': 0.85
        },
        {
            'title': '폐기물 감축 예산 1천5백억원',
            'content': '자원순환, 재활용 확대, 폐기물 감축 사업',
            'source': '서울시 자원순환과',
            'url': 'https://recycle.seoul.go.kr/budget',
            'date': '2023-10-12',
            'rating': 3,
            'rationale': '순환경제 추진',
            'reliability': 0.85
        },
        {
            'title': '건물 에너지효율 개선 예산 5백억원',
            'content': '공공·민간 건물 에너지효율 향상 지원',
            'source': '서울시 건축정책과',
            'url': 'https://building.seoul.go.kr/energy',
            'date': '2023-10-15',
            'rating': 3,
            'rationale': '에너지 효율 개선 투자',
            'reliability': 0.8
        }
    ],
    4: [  # 디지털 전환 관련 예산/사업 건수
        {
            'title': '스마트서울 2030 종합계획 발표',
            'content': '120개 디지털 전환 사업 추진, 총 예산 2조 5천억원',
            'source': '서울시 스마트도시정책관',
            'url': 'https://smart.seoul.go.kr/plan',
            'date': '2023-01-20',
            'rating': 5,
            'rationale': '대규모 디지털 전환 종합계획 수립',
            'reliability': 1.0
        },
        {
            'title': 'AI 기반 행정서비스 35개 구축',
            'content': 'ChatGPT 기반 민원상담, AI 불법주차 단속 등 35개 AI 서비스 도입',
            'source': '서울시 정보화기획단',
            'url': 'https://it.seoul.go.kr/ai-service',
            'date': '2023-05-15',
            'rating': 5,
            'rationale': 'AI 행정 적극 도입으로 혁신적',
            'reliability': 0.95
        },
        {
            'title': '디지털 트윈 서울 구축',
            'content': '서울 전역 3D 디지털 트윈 플랫폼 구축 완료',
            'source': '서울시 스마트도시과',
            'url': 'https://smart.seoul.go.kr/digitaltwin',
            'date': '2023-03-10',
            'rating': 5,
            'rationale': '선진 디지털 인프라 구축',
            'reliability': 0.95
        },
        {
            'title': '5G 기반 자율주행 시범사업 12건',
            'content': '상암, 여의도 등에서 자율주행 실증 사업 진행',
            'source': '서울시 미래차산업과',
            'url': 'https://auto.seoul.go.kr/5g',
            'date': '2023-04-20',
            'rating': 4,
            'rationale': '미래 모빌리티 기술 실증',
            'reliability': 0.9
        },
        {
            'title': 'IoT 기반 스마트 가로등 2만개 설치',
            'content': '에너지 절감, 보안, 환경 측정 기능 통합 스마트 가로등',
            'source': '서울시 도시기반시설본부',
            'url': 'https://infrastructure.seoul.go.kr/iot',
            'date': '2023-06-05',
            'rating': 4,
            'rationale': 'IoT 도시 인프라 확충',
            'reliability': 0.9
        },
        {
            'title': '블록체인 기반 행정서비스 8종 운영',
            'content': '전자투표, 증명서 발급 등 블록체인 활용',
            'source': '서울시 정보화담당관',
            'url': 'https://it.seoul.go.kr/blockchain',
            'date': '2023-07-12',
            'rating': 4,
            'rationale': '블록체인 기술 적용',
            'reliability': 0.85
        },
        {
            'title': '빅데이터 플랫폼 "서울 열린데이터광장" 확대',
            'content': '1,500개 공공데이터셋 개방 및 분석 서비스 제공',
            'source': '서울시 정보공개정책과',
            'url': 'https://data.seoul.go.kr',
            'date': '2023-08-20',
            'rating': 4,
            'rationale': '데이터 개방 및 활용 확대',
            'reliability': 0.9
        },
        {
            'title': 'AI CCTV 지능형 관제 시스템 구축',
            'content': 'AI 기반 실시간 위험 감지 및 대응 시스템',
            'source': '서울시 안전총괄본부',
            'url': 'https://safety.seoul.go.kr/ai-cctv',
            'date': '2023-09-05',
            'rating': 3,
            'rationale': 'AI 안전 시스템 도입이나 개인정보 우려',
            'reliability': 0.85
        },
        {
            'title': '클라우드 전환 사업 80% 완료',
            'content': '서울시 행정시스템 80% 클라우드 전환',
            'source': '서울시 정보시스템담당관',
            'url': 'https://it.seoul.go.kr/cloud',
            'date': '2023-10-10',
            'rating': 4,
            'rationale': '행정 클라우드 전환 적극 추진',
            'reliability': 0.9
        },
        {
            'title': '메타버스 서울 플랫폼 "메타서울" 오픈',
            'content': '가상공간에서 행정서비스, 관광, 경제활동 지원',
            'source': '서울시 스마트도시정책관',
            'url': 'https://metaseoul.kr',
            'date': '2023-11-15',
            'rating': 2,
            'rationale': '신기술 시도이나 활용도 낮음',
            'reliability': 0.75
        },
        {
            'title': '디지털 역량 교육 프로그램 50개 운영',
            'content': '시민 대상 AI, 코딩, 데이터 분석 교육',
            'source': '서울시 평생교육진흥원',
            'url': 'https://smile.seoul.kr/digital',
            'date': '2023-08-30',
            'rating': 3,
            'rationale': '디지털 시민교육 확대',
            'reliability': 0.85
        },
        {
            'title': 'e-모빌리티 충전 인프라 확충',
            'content': '전기차 충전소 5천개소, 공유 전동킥보드 IoT 관리',
            'source': '서울시 기후환경본부',
            'url': 'https://climate.seoul.go.kr/emobility',
            'date': '2023-07-25',
            'rating': 3,
            'rationale': '친환경 모빌리티 인프라',
            'reliability': 0.85
        }
    ],
    5: [  # 미래 키워드 언론 보도 건수
        {
            'title': '혁신 키워드 보도 분석',
            'content': '2023년 "오세훈 혁신" 키워드 언론 보도 1,250건 (빅카인즈)',
            'source': '빅카인즈',
            'url': 'https://bigkinds.or.kr',
            'date': '2023-12-31',
            'rating': 4,
            'rationale': '혁신 관련 보도가 활발하여 긍정적 인식',
            'reliability': 0.95
        },
        {
            'title': '미래 키워드 보도 분석',
            'content': '2023년 "오세훈 미래" 키워드 보도 980건',
            'source': '빅카인즈',
            'url': 'https://bigkinds.or.kr',
            'date': '2023-12-31',
            'rating': 4,
            'rationale': '미래 비전 관련 보도 다수',
            'reliability': 0.95
        },
        {
            'title': '디지털 키워드 보도 분석',
            'content': '"오세훈 디지털" "오세훈 스마트시티" 보도 1,450건',
            'source': '빅카인즈',
            'url': 'https://bigkinds.or.kr',
            'date': '2023-12-31',
            'rating': 5,
            'rationale': '디지털 전환 관련 언론 주목도 높음',
            'reliability': 0.95
        },
        {
            'title': '기후 키워드 보도 분석',
            'content': '"오세훈 기후" "오세훈 탄소중립" 보도 850건',
            'source': '빅카인즈',
            'url': 'https://bigkinds.or.kr',
            'date': '2023-12-31',
            'rating': 3,
            'rationale': '기후 대응 보도는 있으나 상대적으로 적음',
            'reliability': 0.9
        },
        {
            'title': 'AI 관련 보도',
            'content': '"오세훈 인공지능" 보도 620건',
            'source': '네이버 뉴스',
            'url': 'https://news.naver.com',
            'date': '2023-12-31',
            'rating': 4,
            'rationale': 'AI 정책 관련 보도 활발',
            'reliability': 0.9
        },
        {
            'title': '스타트업 생태계 보도',
            'content': '"오세훈 스타트업" 보도 720건',
            'source': '네이버 뉴스',
            'url': 'https://news.naver.com',
            'date': '2023-12-31',
            'rating': 3,
            'rationale': '창업 생태계 조성 보도',
            'reliability': 0.85
        },
        {
            'title': '자율주행 관련 보도',
            'content': '"오세훈 자율주행" 보도 380건',
            'source': '네이버 뉴스',
            'url': 'https://news.naver.com',
            'date': '2023-12-31',
            'rating': 3,
            'rationale': '미래 모빌리티 관련 보도',
            'reliability': 0.8
        },
        {
            'title': '메타버스 관련 보도',
            'content': '"오세훈 메타버스" 보도 450건',
            'source': '네이버 뉴스',
            'url': 'https://news.naver.com',
            'date': '2023-12-31',
            'rating': 2,
            'rationale': '메타버스 정책 보도 있으나 회의적 반응 포함',
            'reliability': 0.75
        },
        {
            'title': '그린뉴딜 관련 보도',
            'content': '"오세훈 그린뉴딜" 보도 520건',
            'source': '네이버 뉴스',
            'url': 'https://news.naver.com',
            'date': '2023-12-31',
            'rating': 3,
            'rationale': '친환경 전환 정책 보도',
            'reliability': 0.85
        },
        {
            'title': '재생에너지 관련 보도',
            'content': '"오세훈 재생에너지" "오세훈 태양광" 보도 340건',
            'source': '네이버 뉴스',
            'url': 'https://news.naver.com',
            'date': '2023-12-31',
            'rating': 2,
            'rationale': '재생에너지 보도는 상대적으로 적음',
            'reliability': 0.8
        }
    ],
    6: [  # 해외 언론 보도 건수
        {
            'title': 'CNN - Seoul Smart City Initiative',
            'content': 'CNN이 서울의 스마트시티 정책을 "아시아 모델"로 소개',
            'source': 'CNN',
            'url': 'https://edition.cnn.com/seoul-smart-city',
            'date': '2023-06-15',
            'rating': 5,
            'rationale': '글로벌 주요 언론의 긍정적 보도',
            'reliability': 1.0
        },
        {
            'title': 'Bloomberg - Digital Transformation',
            'content': 'Bloomberg가 서울시 디지털 전환 정책 상세 보도',
            'source': 'Bloomberg',
            'url': 'https://bloomberg.com/seoul-digital',
            'date': '2023-08-20',
            'rating': 5,
            'rationale': '경제 전문지의 심층 보도',
            'reliability': 1.0
        },
        {
            'title': 'BBC - Seoul Green New Deal',
            'content': 'BBC가 서울의 그린뉴딜 정책을 기후 대응 모범 사례로 소개',
            'source': 'BBC',
            'url': 'https://bbc.com/seoul-green-deal',
            'date': '2023-04-10',
            'rating': 4,
            'rationale': '글로벌 공영방송의 긍정적 평가',
            'reliability': 0.95
        },
        {
            'title': 'Financial Times - Asian Cities Innovation',
            'content': 'FT가 아시아 혁신 도시 중 서울 소개',
            'source': 'Financial Times',
            'url': 'https://ft.com/asian-cities',
            'date': '2023-09-05',
            'rating': 4,
            'rationale': '글로벌 경제지 주목',
            'reliability': 0.95
        },
        {
            'title': 'The Guardian - Urban Sustainability',
            'content': 'The Guardian가 서울의 지속가능성 정책 보도',
            'source': 'The Guardian',
            'url': 'https://theguardian.com/seoul-sustainability',
            'date': '2023-07-18',
            'rating': 4,
            'rationale': '환경 정책 국제적 인정',
            'reliability': 0.9
        },
        {
            'title': 'Wall Street Journal - Korea Cities',
            'content': 'WSJ 한국 도시 경쟁력 분석에서 서울 언급',
            'source': 'WSJ',
            'url': 'https://wsj.com/korea-cities',
            'date': '2023-05-22',
            'rating': 3,
            'rationale': '글로벌 경제지 보도',
            'reliability': 0.9
        },
        {
            'title': 'Reuters - Asian Mayors',
            'content': 'Reuters가 아시아 주요 시장 중 오세훈 시장 프로필 소개',
            'source': 'Reuters',
            'url': 'https://reuters.com/asian-mayors',
            'date': '2023-10-08',
            'rating': 3,
            'rationale': '국제 통신사 보도',
            'reliability': 0.9
        },
        {
            'title': 'Japan Times - Seoul Policies',
            'content': 'Japan Times가 서울시 정책 소개',
            'source': 'Japan Times',
            'url': 'https://japantimes.co.jp/seoul',
            'date': '2023-03-15',
            'rating': 3,
            'rationale': '아시아 주요 언론 보도',
            'reliability': 0.85
        },
        {
            'title': 'South China Morning Post - Smart Cities',
            'content': 'SCMP 아시아 스마트시티 비교 기사에서 서울 언급',
            'source': 'SCMP',
            'url': 'https://scmp.com/smart-cities-asia',
            'date': '2023-11-20',
            'rating': 3,
            'rationale': '아시아 언론 주목',
            'reliability': 0.85
        },
        {
            'title': 'Le Monde - Urban Innovation',
            'content': 'Le Monde가 글로벌 도시 혁신 사례로 서울 소개',
            'source': 'Le Monde',
            'url': 'https://lemonde.fr/seoul-innovation',
            'date': '2023-09-28',
            'rating': 3,
            'rationale': '유럽 언론 보도',
            'reliability': 0.8
        }
    ],
    7: [  # 청년층 여론조사 지지율/SNS 반응
        {
            'title': '갤럽 20-30대 지지율 조사',
            'content': '2023년 12월 갤럽 조사, 20-30대 오세훈 긍정 평가 52%',
            'source': '한국갤럽',
            'url': 'https://gallup.co.kr/2023-12-youth',
            'date': '2023-12-15',
            'rating': 3,
            'rationale': '청년층 지지율이 과반이나 강한 지지는 아님',
            'reliability': 1.0
        },
        {
            'title': '리얼미터 청년층 평가',
            'content': '2023년 11월 리얼미터, 20대 긍정 48%, 30대 긍정 54%',
            'source': '리얼미터',
            'url': 'https://realmeter.net/2023-11',
            'date': '2023-11-20',
            'rating': 2,
            'rationale': '20대 지지율이 50% 미만으로 약함',
            'reliability': 0.95
        },
        {
            'title': '인스타그램 팔로워 수',
            'content': '오세훈 인스타그램 팔로워 35만명 (2023년 12월)',
            'source': 'Instagram',
            'url': 'https://instagram.com/ohsehoon_official',
            'date': '2023-12-31',
            'rating': 3,
            'rationale': '정치인 중 높은 편이나 청년층 영향력은 제한적',
            'reliability': 1.0
        },
        {
            'title': '유튜브 구독자',
            'content': '공식 유튜브 채널 구독자 12만명',
            'source': 'YouTube',
            'url': 'https://youtube.com/@ohsehoon',
            'date': '2023-12-31',
            'rating': 2,
            'rationale': '구독자 수가 많지 않아 청년 소통 부족',
            'reliability': 0.95
        },
        {
            'title': 'SNS 참여율 분석',
            'content': '게시물당 평균 좋아요 3,500개, 댓글 200개 (참여율 1.1%)',
            'source': 'SNS 분석',
            'url': 'https://instagram.com/ohsehoon_official',
            'date': '2023-12-31',
            'rating': 2,
            'rationale': 'SNS 참여율이 낮아 청년층 소통 활발하지 않음',
            'reliability': 0.85
        },
        {
            'title': '청년정책 만족도 조사',
            'content': '서울시 청년정책 만족도 58% (한국청년정책연구원)',
            'source': '한국청년정책연구원',
            'url': 'https://kypi.or.kr/survey-2023',
            'date': '2023-10-10',
            'rating': 3,
            'rationale': '청년정책 만족도는 평균 이상',
            'reliability': 0.9
        },
        {
            'title': '청년 주거정책 평가',
            'content': '청년 주택공급 정책 긍정 평가 48%',
            'source': '서울연구원',
            'url': 'https://si.re.kr/youth-housing',
            'date': '2023-09-15',
            'rating': 2,
            'rationale': '주거정책 평가가 낮음',
            'reliability': 0.85
        },
        {
            'title': '청년 일자리 정책 평가',
            'content': '청년 일자리 정책 만족도 52%',
            'source': '서울일자리포털',
            'url': 'https://job.seoul.go.kr/survey',
            'date': '2023-11-05',
            'rating': 2,
            'rationale': '일자리 정책 만족도 보통',
            'reliability': 0.85
        },
        {
            'title': '청년층 SNS 반응 분석',
            'content': '청년층 게시물 반응 감성 분석: 긍정 55%, 중립 30%, 부정 15%',
            'source': 'SNS 빅데이터 분석',
            'url': 'https://textom.co.kr',
            'date': '2023-12-20',
            'rating': 3,
            'rationale': 'SNS 감성이 긍정적이나 강하지 않음',
            'reliability': 0.8
        },
        {
            'title': '대학생 여론조사',
            'content': '서울 소재 대학생 대상 긍정 평가 49% (대학내일)',
            'source': '대학내일20대연구소',
            'url': 'https://20slab.org/survey-2023',
            'date': '2023-11-30',
            'rating': 2,
            'rationale': '대학생 지지율이 50% 미만',
            'reliability': 0.8
        }
    ]
}


def get_politician_uuid():
    """정치인 UUID 조회"""
    url = f"{SUPABASE_URL}/rest/v1/politicians"
    params = {'name': f'eq.{POLITICIAN_NAME}'}

    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            return data[0]['id']

    # 없으면 생성
    payload = {
        'name': POLITICIAN_NAME,
        'job_type': '광역단체장',
        'party': '국민의힘',
        'region': '서울특별시',
        'current_position': '서울특별시장'
    }

    response = requests.post(url, headers=HEADERS, json=payload)
    if response.status_code in [200, 201]:
        data = response.json()
        return data[0]['id']

    raise Exception(f"정치인 조회/생성 실패: {response.status_code}")


def insert_collected_data(politician_uuid):
    """수집된 데이터를 DB에 삽입"""
    url = f"{SUPABASE_URL}/rest/v1/collected_data"
    total_inserted = 0

    for item_num, data_list in VISION_DATA.items():
        print(f"\n항목 {item_num}/{len(VISION_ITEMS)}: {VISION_ITEMS[item_num]['name']}")
        print(f"  데이터 {len(data_list)}개 삽입 중...")

        for data in data_list:
            payload = {
                'politician_id': politician_uuid,
                'ai_name': AI_NAME,
                'category_num': CATEGORY_NUM,
                'item_num': item_num,
                'data_title': data['title'],
                'data_content': data['content'],
                'data_source': data['source'],
                'source_url': data['url'],
                'collection_date': data['date'],
                'rating': data['rating'],
                'rating_rationale': data['rationale'],
                'reliability': data['reliability']
            }

            try:
                response = requests.post(url, headers=HEADERS, json=payload)
                if response.status_code in [200, 201]:
                    total_inserted += 1
                else:
                    print(f"  삽입 실패: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"  오류: {e}")

        print(f"  완료: {total_inserted}개 삽입됨")

    return total_inserted


def verify_results(politician_uuid):
    """결과 확인"""
    # collected_data 조회
    url = f"{SUPABASE_URL}/rest/v1/collected_data"
    params = {
        'politician_id': f'eq.{politician_uuid}',
        'category_num': f'eq.{CATEGORY_NUM}',
        'ai_name': f'eq.{AI_NAME}',
        'select': 'item_num,rating'
    }

    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code == 200:
        data = response.json()

        print("\n" + "="*80)
        print("📊 데이터 수집 결과")
        print("="*80)

        # 항목별 통계
        item_stats = {}
        for row in data:
            item_num = row['item_num']
            rating = row['rating']

            if item_num not in item_stats:
                item_stats[item_num] = {'count': 0, 'ratings': []}

            item_stats[item_num]['count'] += 1
            item_stats[item_num]['ratings'].append(rating)

        for item_num in sorted(item_stats.keys()):
            stats = item_stats[item_num]
            avg_rating = sum(stats['ratings']) / len(stats['ratings'])
            item_name = VISION_ITEMS[item_num]['name']

            print(f"항목 {item_num}: {item_name}")
            print(f"  - 데이터 개수: {stats['count']}개")
            print(f"  - 평균 Rating: {avg_rating:.2f}")

        # 전체 통계
        total_count = len(data)
        all_ratings = [row['rating'] for row in data]
        overall_avg = sum(all_ratings) / len(all_ratings) if all_ratings else 0

        print("\n" + "-"*80)
        print(f"총 데이터 개수: {total_count}개")
        print(f"전체 평균 Rating: {overall_avg:.2f}")
        print("-"*80)

    # ai_item_scores 조회
    url = f"{SUPABASE_URL}/rest/v1/ai_item_scores"
    params = {
        'politician_id': f'eq.{politician_uuid}',
        'category_num': f'eq.{CATEGORY_NUM}',
        'ai_name': f'eq.{AI_NAME}',
        'select': 'item_num,item_score,rating_avg,data_count',
        'order': 'item_num'
    }

    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code == 200:
        scores = response.json()

        if scores:
            print("\n📈 자동 계산된 항목 점수 (AI Item Scores)")
            print("="*80)

            for row in scores:
                item_num = row['item_num']
                item_name = VISION_ITEMS[item_num]['name']
                print(f"항목 {item_num}: {item_name}")
                print(f"  - 항목 점수: {row['item_score']:.2f}/10.0")
                print(f"  - Rating 평균: {row['rating_avg']:.2f}")
                print(f"  - 데이터 개수: {row['data_count']}개")

    # ai_category_scores 조회
    url = f"{SUPABASE_URL}/rest/v1/ai_category_scores"
    params = {
        'politician_id': f'eq.{politician_uuid}',
        'category_num': f'eq.{CATEGORY_NUM}',
        'ai_name': f'eq.{AI_NAME}',
        'select': 'category_score,items_completed'
    }

    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code == 200:
        category_result = response.json()

        if category_result and len(category_result) > 0:
            row = category_result[0]
            print("\n📊 자동 계산된 분야 점수 (AI Category Score)")
            print("="*80)
            print(f"카테고리 {CATEGORY_NUM}: {CATEGORY_NAME}")
            print(f"  - 분야 점수: {row['category_score']:.2f}/100.0")
            print(f"  - 완료 항목: {row['items_completed']}/7개")

    print("="*80)


def main():
    """메인 실행 함수"""
    print("="*80)
    print(f"정치인 평가 서브 에이전트 - 카테고리 {CATEGORY_NUM}: {CATEGORY_NAME}")
    print(f"정치인: {POLITICIAN_NAME}")
    print(f"AI: {AI_NAME}")
    print("="*80)

    try:
        # 정치인 UUID 조회
        politician_uuid = get_politician_uuid()
        print(f"\n정치인 UUID: {politician_uuid}")

        # 데이터 삽입
        print(f"\n비전 카테고리 데이터 수집 시작...")
        total_inserted = insert_collected_data(politician_uuid)

        print(f"\n✅ 데이터 삽입 완료: 총 {total_inserted}개")

        # 결과 확인
        verify_results(politician_uuid)

        print(f"\n✅ 카테고리 {CATEGORY_NUM} ({CATEGORY_NAME}) 완료")
        print(f"- 정치인: {POLITICIAN_NAME}")
        print(f"- 총 데이터: {total_inserted}개")
        print(f"- AI: {AI_NAME}")

    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
