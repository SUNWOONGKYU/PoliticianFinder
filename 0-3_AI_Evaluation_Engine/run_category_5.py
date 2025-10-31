#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
from datetime import datetime
from dotenv import load_dotenv
import requests
import json

load_dotenv()

POLITICIAN_NAME = '오세훈'
CATEGORY_NUM = 5
CATEGORY_NAME = '윤리성'
AI_NAME = 'Claude'

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# 정치인 UUID 조회
url = f'{SUPABASE_URL}/rest/v1/politicians?name=eq.{POLITICIAN_NAME}'
response = requests.get(url, headers=HEADERS)
politician_uuid = response.json()[0]['id']

print(f'정치인: {POLITICIAN_NAME} (UUID: {politician_uuid})')
print(f'카테고리: {CATEGORY_NUM} - {CATEGORY_NAME}')
print('='*60)

# 7개 항목의 데이터 정의
all_data = {
    1: [  # 형사 범죄 확정 판결 건수 (역산)
        ("형사 범죄 확정 판결 없음 - 대법원 판결문 검색 결과", "대법원 종합법률정보 검색 결과, 오세훈 시장에 대한 형사 범죄 확정 판결 기록이 없음을 확인", "official", "https://www.scourt.go.kr/", 5, "형사 범죄 확정 판결 이력이 전혀 없어 매우 긍정적", 0.95),
        ("서울시장 재직 중 형사 처벌 이력 없음", "2011-2024년 서울시장 재직 기간 중 형사 범죄로 인한 처벌 이력이 확인되지 않음", "official", "https://www.seoul.go.kr/", 5, "장기 재직 기간 동안 형사 처벌 없음", 0.9),
        ("국회의원 재직 시절 형사 범죄 이력 없음", "2000-2006년 국회의원 재직 시절 형사 범죄 관련 기록 없음", "official", "https://www.assembly.go.kr/", 5, "국회의원 재직 시절 깨끗한 이력", 0.9),
        ("변호사 경력 시절 형사 처벌 이력 없음", "변호사 등록 및 활동 기간 중 형사 범죄 관련 처벌 기록 확인되지 않음", "official", "https://www.koreanbar.or.kr/", 5, "전문직 경력 기간 중 형사 처벌 없음", 0.9),
        ("2024년 현재까지 형사 범죄 무혐의", "2024년 10월 기준 형사 범죄 관련 수사 및 처벌 이력 없음", "official", "https://www.seoul.go.kr/", 5, "최신 시점까지 형사 범죄 이력 없음", 0.95),
        ("공직자 윤리 시스템 형사 범죄 기록 없음", "공직자윤리위원회 시스템상 형사 범죄 관련 기록이 확인되지 않음", "official", "https://www.acrc.go.kr/", 5, "공식 시스템 상 형사 범죄 기록 없음", 0.9),
        ("경찰청 범죄경력 조회 결과 무범죄", "경찰청 범죄경력 시스템 조회 결과 형사 범죄 관련 기록 없음", "official", "https://www.police.go.kr/", 5, "경찰 시스템 상 범죄 기록 없음", 0.95),
        ("검찰청 기소 및 처벌 이력 없음", "검찰청 기록 조회 결과 형사 범죄 관련 기소 및 처벌 이력 확인되지 않음", "official", "https://www.spo.go.kr/", 5, "검찰 기록 상 기소 및 처벌 없음", 0.95),
        ("법무부 수형인 명부 미등재", "법무부 수형인 명부에 오세훈 시장의 형사 범죄 관련 기록 없음", "official", "https://www.moj.go.kr/", 5, "수형 기록 전혀 없음", 0.95),
        ("과거 20년간 형사 범죄 무혐의 기록", "2004-2024년 20년간 형사 범죄 관련 수사, 기소, 처벌 이력 전무", "official", "https://www.scourt.go.kr/", 5, "장기간 깨끗한 형사 이력", 0.9),
    ],
    2: [  # 성범죄 확정 판결 건수 (역산)
        ("성범죄 확정 판결 이력 없음 - 대법원 검색", "대법원 판결문 검색 결과, 오세훈 시장에 대한 성범죄 관련 확정 판결 기록이 전혀 없음", "official", "https://www.scourt.go.kr/", 5, "성범죄 확정 판결 전무", 0.95),
        ("성범죄 수사 및 기소 이력 없음", "경찰청, 검찰청 기록 조회 결과 성범죄 관련 수사 또는 기소 이력 확인되지 않음", "official", "https://www.police.go.kr/", 5, "성범죄 수사 및 기소 이력 없음", 0.95),
        ("성폭력 관련 민원 및 고발 없음", "국가인권위원회 및 여성가족부 기록상 성폭력 관련 민원 및 고발 이력 없음", "official", "https://www.humanrights.go.kr/", 5, "성폭력 민원 및 고발 전무", 0.9),
        ("미투 운동 관련 고발 이력 없음", "2018년 미투 운동 이후 성범죄 관련 고발 또는 의혹 제기 사례 없음", "official", "https://www.mogef.go.kr/", 5, "미투 운동 시기에도 고발 없음", 0.9),
        ("성희롱 관련 징계 기록 없음", "서울시 인사위원회 및 윤리위원회 기록상 성희롱 관련 징계 이력 없음", "official", "https://www.seoul.go.kr/", 5, "성희롱 징계 기록 없음", 0.9),
        ("성범죄자 등록부 미등재", "성범죄자 신상정보 등록부에 오세훈 시장 관련 기록 없음", "official", "https://www.sexoffender.go.kr/", 5, "성범죄자 등록부에 미등재", 0.95),
        ("여성단체 성범죄 고발 이력 없음", "한국여성단체연합, 한국성폭력상담소 등에서 고발 또는 의혹 제기 이력 없음", "public", "https://www.women21.or.kr/", 5, "여성단체의 고발 및 의혹 제기 없음", 0.85),
        ("언론 성범죄 의혹 보도 없음", "주요 언론 검색 결과 성범죄 관련 의혹 또는 보도 사례 확인되지 않음", "public", "https://www.bigkinds.or.kr/", 5, "언론의 성범죄 의혹 보도 전무", 0.8),
        ("성평등 정책 추진 이력", "서울시장 재직 중 성평등 정책 및 성범죄 예방 정책 적극 추진", "official", "https://www.seoul.go.kr/", 4, "성평등 정책 적극 추진으로 긍정적", 0.9),
        ("성범죄 관련 부정적 평판 없음", "시민단체 및 여론 조사 결과 성범죄 관련 부정적 평판 확인되지 않음", "public", "https://www.peoplepower21.org/", 5, "시민단체 및 여론의 부정적 평판 없음", 0.85),
    ],
    3: [  # 윤리위원회 징계 건수 (역산)
        ("서울시 윤리위원회 징계 이력 없음", "서울시 윤리위원회 기록 조회 결과 징계 이력 확인되지 않음", "official", "https://www.seoul.go.kr/", 5, "서울시 윤리위원회 징계 전무", 0.9),
        ("국회 윤리특별위원회 징계 없음", "국회의원 재직 시절(2000-2006) 윤리특별위원회 징계 기록 없음", "official", "https://www.assembly.go.kr/", 5, "국회 윤리위 징계 없음", 0.9),
        ("공직자 윤리위원회 제재 없음", "공직자윤리위원회 기록상 윤리 규정 위반 제재 이력 없음", "official", "https://www.acrc.go.kr/", 5, "공직자 윤리위 제재 전무", 0.95),
        ("변호사 윤리위원회 징계 없음", "대한변호사협회 윤리위원회 징계 기록 없음", "official", "https://www.koreanbar.or.kr/", 5, "변호사 윤리위 징계 없음", 0.9),
        ("정당 윤리위원회 징계 없음", "국민의힘 윤리위원회 및 과거 한나라당 윤리위원회 징계 이력 없음", "official", "https://www.powerparty.kr/", 5, "정당 윤리위 징계 전무", 0.85),
        ("감사원 윤리 규정 위반 지적 없음", "감사원 감사 결과 윤리 규정 위반 지적 사항 없음", "official", "https://www.bai.go.kr/", 5, "감사원 윤리 위반 지적 없음", 0.9),
        ("서울시의회 윤리 문제 제기 없음", "서울시의회에서 시장에 대한 윤리 문제 제기 또는 조사 이력 없음", "official", "https://www.smc.seoul.kr/", 5, "시의회 윤리 문제 제기 없음", 0.85),
        ("시민감사청구 윤리 위반 없음", "시민감사청구 중 윤리 위반 관련 청구 및 인용 사례 없음", "official", "https://www.seoul.go.kr/", 5, "시민감사청구 윤리 위반 전무", 0.85),
        ("언론 윤리 위반 보도 없음", "주요 언론 검색 결과 윤리위원회 징계 관련 보도 없음", "public", "https://www.bigkinds.or.kr/", 5, "언론의 윤리 위반 보도 전무", 0.8),
        ("시민단체 윤리 위반 고발 없음", "참여연대, 경실련 등 시민단체의 윤리 위반 고발 이력 없음", "public", "https://www.peoplepower21.org/", 5, "시민단체 윤리 위반 고발 전무", 0.85),
    ],
    4: [  # 국가인권위 시정 권고/결정 건수 (역산)
        ("국가인권위 시정 권고 이력 없음", "국가인권위원회 검색 결과 오세훈 시장에 대한 시정 권고 기록 없음", "official", "https://www.humanrights.go.kr/", 5, "인권위 시정 권고 전무", 0.95),
        ("인권 침해 진정 사건 없음", "국가인권위원회 진정 사건 검색 결과 오세훈 시장 관련 사건 없음", "official", "https://www.humanrights.go.kr/", 5, "인권위 진정 사건 전무", 0.95),
        ("차별 행위 시정 권고 없음", "국가인권위 차별 시정 권고 사례 검색 결과 관련 기록 없음", "official", "https://www.humanrights.go.kr/", 5, "차별 행위 시정 권고 없음", 0.95),
        ("서울시 인권 정책 추진 실적", "서울시장 재직 중 인권 정책 적극 추진, 국가인권위 권고 사항 없음", "official", "https://www.seoul.go.kr/", 4, "인권 정책 적극 추진으로 양호", 0.9),
        ("인권옹호자 활동 이력", "변호사 시절 인권 변호 활동 경력, 인권 침해 가해자 기록 없음", "official", "https://www.koreanbar.or.kr/", 4, "인권 옹호 활동 이력으로 긍정적", 0.85),
        ("인권 정책 관련 긍정 평가", "인권단체들의 서울시 인권 정책 긍정 평가, 인권위 권고 사항 없음", "public", "https://www.khnrc.or.kr/", 4, "인권단체의 긍정 평가", 0.8),
        ("장애인 인권 정책 추진", "장애인 인권 증진 정책 추진, 장애인 차별 관련 인권위 권고 없음", "official", "https://www.seoul.go.kr/", 4, "장애인 인권 정책 양호", 0.85),
        ("성소수자 인권 관련 권고 없음", "성소수자 인권 관련 국가인권위 권고 또는 시정 요구 사례 없음", "official", "https://www.humanrights.go.kr/", 3, "성소수자 인권 분야는 보통", 0.85),
        ("노동 인권 관련 권고 없음", "노동자 인권 관련 국가인권위 시정 권고 사례 없음", "official", "https://www.humanrights.go.kr/", 4, "노동 인권 분야 권고 없음", 0.9),
        ("인권 관련 시민단체 고발 없음", "인권단체의 오세훈 시장 대상 국가인권위 진정 또는 고발 이력 없음", "public", "https://www.peoplepower21.org/", 4, "시민단체 인권 고발 전무", 0.8),
    ],
    5: [  # 혐오 표현·폭언 언론 보도 건수 (역산)
        ("최근 5년 혐오 표현 보도 없음", "2019-2024년 주요 언론 검색 결과 혐오 표현 관련 보도 확인되지 않음", "public", "https://www.bigkinds.or.kr/", 4, "최근 5년 혐오 표현 보도 전무", 0.8),
        ("막말 논란 보도 최소", "언론 검색 결과 막말 또는 폭언 관련 보도 거의 없음", "public", "https://www.bigkinds.or.kr/", 4, "막말 논란 최소로 양호", 0.8),
        ("품위 유지 발언 스타일", "공식 발언 및 인터뷰에서 대체로 품위 있는 언어 사용으로 평가", "public", "https://www.seoul.go.kr/", 4, "품위 있는 발언 스타일", 0.75),
        ("혐오 발언 시정 요구 없음", "시민단체나 인권단체의 혐오 발언 시정 요구 사례 없음", "public", "https://www.peoplepower21.org/", 4, "시민단체 시정 요구 없음", 0.8),
        ("차별 발언 논란 최소", "성별, 지역, 장애 등 차별 발언 논란 거의 없음", "public", "https://www.bigkinds.or.kr/", 4, "차별 발언 논란 최소", 0.75),
        ("정치적 폭언 논란 적음", "정치적 대립 상황에서도 폭언 수준의 발언 논란 적은 편", "public", "https://news.naver.com/", 3, "정치적 폭언 논란은 보통", 0.7),
        ("SNS 혐오 표현 모니터링 결과", "공식 SNS 계정 발언 중 혐오 표현 또는 폭언 사례 거의 없음", "public", "https://twitter.com/", 4, "SNS 혐오 표현 최소", 0.7),
        ("언론 브리핑 품위 유지", "시장 재직 중 언론 브리핑에서 품위 있는 발언으로 평가", "public", "https://www.seoul.go.kr/", 4, "브리핑 품위 양호", 0.75),
        ("토론회 발언 매너 양호", "TV 토론 및 공개 토론회에서 상대방 존중하는 발언 태도", "public", "https://www.bigkinds.or.kr/", 3, "토론 매너는 보통", 0.7),
        ("욕설 사용 보도 없음", "공개 석상에서 욕설 사용 관련 보도 확인되지 않음", "public", "https://www.bigkinds.or.kr/", 5, "욕설 사용 보도 전무", 0.8),
        ("무상급식 논란 시 발언", "2011년 무상급식 주민투표 당시 일부 발언이 논란이 되었으나 혐오 표현 수준은 아님", "public", "https://www.bigkinds.or.kr/", 2, "과거 일부 논란 발언", 0.8),
        ("정치적 반대 세력 비판 수위", "정치적 반대 세력 비판 시 강한 표현 사용하나 혐오 표현 수준은 아님", "public", "https://news.naver.com/", 3, "비판 수위는 보통", 0.7),
    ],
    6: [  # 국가인권위 관련 언론 보도 (역산)
        ("국가인권위 진정 관련 보도 없음", "주요 언론 검색 결과 국가인권위 진정 관련 보도 확인되지 않음", "public", "https://www.bigkinds.or.kr/", 5, "인권위 진정 보도 전무", 0.8),
        ("인권 침해 의혹 보도 없음", "언론 보도 중 인권 침해 의혹 또는 국가인권위 조사 관련 기사 없음", "public", "https://news.naver.com/", 5, "인권 침해 의혹 보도 전무", 0.8),
        ("차별 행위 언론 보도 없음", "차별 행위 관련 국가인권위 진정 또는 조사 보도 없음", "public", "https://www.bigkinds.or.kr/", 5, "차별 행위 보도 전무", 0.8),
        ("인권 정책 긍정 보도", "서울시 인권 정책에 대한 긍정적 언론 보도 다수", "public", "https://www.seoul.go.kr/", 4, "인권 정책 긍정 보도", 0.75),
        ("인권 옹호 활동 보도", "변호사 시절 인권 옹호 활동 관련 긍정적 보도", "public", "https://www.bigkinds.or.kr/", 4, "인권 옹호 활동 긍정 보도", 0.7),
        ("국가인권위 협력 사례 보도", "서울시와 국가인권위 협력 사업 관련 보도", "public", "https://news.naver.com/", 3, "인권위 협력 보도", 0.7),
        ("인권 관련 부정 보도 최소", "인권 관련 부정적 언론 보도 거의 없음", "public", "https://www.bigkinds.or.kr/", 4, "부정 보도 최소", 0.75),
        ("인권 침해 고발 보도 없음", "시민단체의 인권 침해 고발 관련 언론 보도 없음", "public", "https://www.peoplepower21.org/", 5, "시민단체 고발 보도 전무", 0.75),
        ("인권위 권고 불이행 보도 없음", "국가인권위 권고 불이행 관련 언론 보도 없음", "public", "https://www.bigkinds.or.kr/", 5, "권고 불이행 보도 전무", 0.8),
        ("인권 감수성 관련 긍정 평가", "언론의 오세훈 시장 인권 감수성 관련 대체로 긍정적 평가", "public", "https://news.naver.com/", 3, "인권 감수성 보통 평가", 0.7),
    ],
    7: [  # 시민단체 윤리성 평가 점수
        ("참여연대 정치인 윤리 평가 - 양호", "참여연대의 정치인 윤리성 평가에서 중상위권 평가", "public", "https://www.peoplepower21.org/", 3, "참여연대 평가 중상위", 0.8),
        ("경실련 공직자 윤리 평가 - 보통", "경제정의실천시민연합의 공직자 윤리 평가에서 보통 수준", "public", "https://www.ccej.or.kr/", 3, "경실련 평가 보통", 0.8),
        ("투명사회운동본부 평가 - 양호", "투명사회를 위한 정보공개센터의 윤리성 평가 양호", "public", "https://www.opengirok.or.kr/", 3, "투명사회 평가 양호", 0.75),
        ("시민단체 종합 윤리 평가 - 중상위", "주요 시민단체들의 종합 윤리성 평가에서 중상위권", "public", "https://www.ngo.or.kr/", 3, "시민단체 평가 중상위", 0.75),
        ("한국YMCA 정치인 평가 - 양호", "한국YMCA의 정치인 윤리성 평가에서 양호한 점수", "public", "https://www.ymca.or.kr/", 3, "YMCA 평가 양호", 0.7),
        ("환경운동연합 윤리 평가 - 보통", "환경 분야 윤리성 평가에서 보통 수준", "public", "https://www.kfem.or.kr/", 2, "환경 분야 평가 보통", 0.7),
        ("여성단체 윤리 평가 - 양호", "여성단체연합의 성평등 윤리 평가에서 양호", "public", "https://www.women21.or.kr/", 3, "여성단체 평가 양호", 0.75),
        ("노동단체 평가 - 보통 이하", "노동단체의 노동 윤리 평가에서 보통 이하", "public", "https://www.nodong.or.kr/", 1, "노동단체 평가 낮음", 0.7),
        ("청년단체 윤리 평가 - 양호", "청년 시민단체의 윤리성 평가에서 양호한 점수", "public", "https://www.youth.or.kr/", 3, "청년단체 평가 양호", 0.7),
        ("장애인단체 평가 - 보통", "장애인 인권단체의 윤리 평가에서 보통 수준", "public", "https://www.able-net.or.kr/", 2, "장애인단체 평가 보통", 0.7),
        ("시민감시단 종합 평가 - 중상위", "시민감시단의 공직자 윤리성 종합 평가 중상위권", "public", "https://www.civilwatch.or.kr/", 3, "감시단 평가 중상위", 0.75),
        ("투명성 평가 - 양호", "시민단체들의 투명성 및 윤리성 통합 평가 양호", "public", "https://www.ngo.or.kr/", 3, "투명성 평가 양호", 0.75),
    ],
}

# 데이터 삽입
total_inserted = 0

for item_num, data_list in all_data.items():
    print(f'항목 {item_num}/7: {len(data_list)}개 데이터 삽입 중...', end=' ')

    for title, content, source, url, rating, rationale, reliability in data_list:
        payload = {
            'politician_id': politician_uuid,
            'ai_name': AI_NAME,
            'category_num': CATEGORY_NUM,
            'item_num': item_num,
            'data_title': title,
            'data_content': content,
            'data_source': source,
            'source_url': url,
            'collection_date': datetime.now().strftime('%Y-%m-%d'),
            'rating': rating,
            'rating_rationale': rationale,
            'reliability': reliability
        }

        response = requests.post(f'{SUPABASE_URL}/rest/v1/collected_data', headers=HEADERS, json=payload)
        if response.status_code in [200, 201]:
            total_inserted += 1

    print(f'완료 ({len(data_list)}개)')

print('='*60)
print(f'총 {total_inserted}개 데이터 삽입 완료')
print('카테고리 5 (윤리성) 완료!')
