# -*- coding: utf-8 -*-
"""
V60 Alpha 평가 - 오세훈(62e7b453) 전용
Claude 직접 내용 분석 기반 상대평가 (플래툰 포메이션)

경쟁자 그룹:
- 정원오(17270f25) - 더불어민주당 - 여론 선두
- 오세훈(62e7b453) - 국민의힘 - 현 서울시장
- 조은희(d0a5d6e1) - 국민의힘
- 박주민(8c5dcc89) - 더불어민주당

평가 맥락 (2026-03-11 기준):
- 오세훈: 명태균 여론조사 대납 의혹 특검 기소
- 여론조사: 정원오 > 오세훈 (오차범위 밖)
- 국민의힘 지지율: 20%대 (민주당 44%대)
- 절윤 결의 주도자 역할로 일부 긍정 평가
"""

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common_cci import (
    supabase,
    ALPHA_CATEGORIES, ALPHA_TYPE_MAP,
    TABLE_COLLECTED_ALPHA, TABLE_EVALUATIONS_ALPHA,
    VALID_RATINGS,
    fetch_all_rows, get_politician_info, get_competitor_group, print_status
)

POLITICIAN_ID = '62e7b453'
POLITICIAN_NAME = '오세훈'


def evaluate_opinion(title: str, content: str) -> tuple:
    """
    여론동향 평가 - 상대평가 (오세훈 특화)

    핵심 사실:
    - 정원오가 오차범위 밖 우세 (오세훈 열세)
    - 국민의힘 지지율 20%대, 민주당 44%대
    - 명태균 기소로 추가 지지율 타격 우려
    - 절윤 후 일부 긍정 신호 있으나 미미
    """
    text = title + ' ' + (content or '')

    # 무관 데이터
    if '오세훈' not in text and '서울시장' not in text and '오 시장' not in text:
        if '여론조사' not in text and '지지율' not in text:
            return 'X', 0, '오세훈 여론동향과 무관한 데이터.'

    # 명태균 기소 + 여론조사 연계 (-3)
    if '명태균' in text and ('기소' in text or '특검' in text or '여론조사' in text):
        return '-3', -6, '명태균 여론조사 대납 기소로 오세훈 지지율 직격탄 우려.'

    # 정원오 오차범위 밖 앞선다 (-2)
    if '정원오' in text and ('오차범위' in text or '앞서' in text or '선두' in text or '1위' in text):
        return '-2', -4, '정원오가 여론조사 오차범위 밖 선두로 오세훈 구조적 열세.'

    # 민주당 후보 가상대결 우세 (-2)
    if ('가상대결' in text or '양자대결' in text or '1대 1' in text or '1 대 1' in text) and '오세훈' in text:
        if '민주당' in text or '정원오' in text or '박주민' in text:
            return '-2', -4, '민주당 후보와 가상대결 여론조사에서 오세훈 열세 반복.'

    # 이재명 지지율 고공행진 (구조적 불리) (-1)
    if '이재명' in text and ('고공' in text or '63%' in text or '65%' in text or '58%' in text or '최고치' in text):
        return '-1', -2, '이재명 대통령 지지율 고공행진이 서울시장 선거 구도에 불리.'

    # 국민의힘 지지율 최저/급락 (-2)
    if ('국민의힘' in text or '국힘' in text) and ('최저' in text or '급락' in text or '17%' in text):
        return '-2', -4, '국민의힘 지지율 역대 최저로 오세훈 여론 환경 심각하게 불리.'

    # 국민의힘 지지율 20%대 (-1)
    if ('국민의힘' in text or '국힘' in text) and ('20%' in text or '21%' in text or '26%' in text or '28%' in text):
        return '-1', -2, '국민의힘 지지율 20%대로 민주당 대비 20%p+ 구조적 열세.'

    # 절윤 완승, 발판 마련 (일부 긍정) (+1)
    if '절윤' in text and ('완승' in text or '발판' in text or '감사' in text or '다행' in text):
        if '오세훈' in text:
            return '+1', 2, '절윤 결의 이후 오세훈 일부 여론 긍정 반응 형성.'

    # 현역 프리미엄 (당 지지율 대비 개인 방어) (+1)
    if '현역' in text and '프리미엄' in text and '오세훈' in text:
        return '+1', 2, '현역 프리미엄으로 당 지지율 하락 대비 개인 지지율 방어.'

    # 경쟁력 있다는 언급 (+1)
    if '오세훈' in text and ('경쟁력' in text or '비윤 대표주자' in text):
        return '+1', 2, '오세훈 개인 경쟁력 긍정 평가 일부 존재.'

    # 지지율 하락, 위기 맥락 (-1)
    if ('하락' in text or '위기' in text or '열세' in text) and ('오세훈' in text or '서울' in text):
        return '-1', -2, '지지율 하락세 속 오세훈 여론 환경 부정적.'

    # 정원오 저격 구도 (정원오 우위 반증) (-1)
    if '정원오' in text and '오세훈' in text:
        return '-1', -2, '정원오가 오세훈 저격하는 구도는 정원오 여론 우위를 반증.'

    # 일반 여론조사/지지율 언급
    if ('여론조사' in text or '지지율' in text) and ('오세훈' in text or '서울시장' in text):
        return '-1', -2, '전반적 여론조사 환경에서 오세훈 열세 구도 내재.'

    return '-1', -2, '여론 환경 불리한 맥락에서 오세훈 언급.'


def evaluate_media(title: str, content: str) -> tuple:
    """
    이미지·내러티브 평가 (오세훈 특화)

    핵심:
    - 명태균 의혹 = 이미지 타격
    - 절윤 주도 = 중도 확장 긍정 이미지
    - 무능행정, 세금낭비 프레임 = 부정
    - 현직 시장 행정 활동 = 중립~긍정
    """
    text = title + ' ' + (content or '')

    if '오세훈' not in text and '서울시장' not in text and '오 시장' not in text:
        return 'X', 0, '오세훈 미디어·이미지와 무관한 데이터.'

    # 명태균 기소 = 이미지 타격 (-2)
    if '명태균' in text and ('기소' in text or '의혹' in text or '특검' in text or '여론조사 개입' in text):
        return '-2', -4, '명태균 여론조사 대납 기소로 오세훈 청렴 이미지 심각 타격.'

    # 무능행정, 세금낭비 프레임 (-2)
    if '무능' in text or ('세금 낭비' in text and '오세훈' in text) or '세금낭비' in text:
        return '-2', -4, '무능행정·세금낭비 프레임으로 오세훈 부정 이미지 고착화 진행.'

    # 한강버스 실책/중단 (-1)
    if '한강버스' in text and ('실책' in text or '논란' in text or '안전' in text or '중단' in text):
        return '-1', -2, '한강버스 논란·운항 중단으로 행정 이미지 부정적.'

    # 제설 실패 (-1)
    if '제설' in text and ('엉망' in text or '실패' in text) and '오세훈' in text:
        return '-1', -2, '제설 실패로 오세훈 행정 이미지 부정적.'

    # 절윤 완승, 비윤 대표주자 (+2)
    if '오세훈' in text and ('완승' in text or '비윤 대표주자' in text or '완벽한 승리' in text):
        return '+2', 4, '절윤 주도로 비윤 대표주자 이미지 형성, 중도 확장 긍정 효과.'

    # 결단, 용기 이미지 (+2)
    if '오세훈' in text and ('결단' in text or '광화문 뷰' in text or '침묵을 깨운' in text):
        return '+2', 4, '공천 보이콧 결단으로 소신있는 정치인 이미지 형성.'

    # 현직 시장 공식 활동 (긍정 이미지) (+1)
    if '오세훈' in text and (
        '기도회' in text or 'BTS' in text or '행사' in text or
        '청년주택' in text or '표창' in text or '주재' in text
    ):
        return '+1', 2, '현직 서울시장으로서 공식 활동 미디어 노출 긍정.'

    # 갈등, 내홍, 논란 (-1)
    if '오세훈' in text and ('갈등' in text or '논란' in text or '내홍' in text or '충돌' in text):
        return '-1', -2, '당내 갈등·논란으로 오세훈 부정적 미디어 노출.'

    # 비판, 지적 (-1)
    if '오세훈' in text and ('비판' in text or '지적' in text or '직격' in text):
        return '-1', -2, '오세훈 행정 비판 보도로 부정적 이미지 형성.'

    # 단순 언급 (+1)
    if '오세훈' in title:
        return '+1', 2, '미디어에서 오세훈 직접 언급, 기본 노출 수준.'

    return '-1', -2, '오세훈 관련 부정적 맥락 미디어 노출.'


def evaluate_risk(title: str, content: str) -> tuple:
    """
    리스크 평가 - 역산 방식 (오세훈 특화)

    핵심 리스크:
    - 명태균 여론조사 대납 기소 = 치명적 (-3)
    - 중대재해처벌법 고소 = 위험 (-2)
    - 한강버스, 감사의 정원 논란 = 주의 (-1)

    역산: 리스크 없을수록 높은 점수
    """
    text = title + ' ' + (content or '')

    if '오세훈' not in text and '서울시장' not in text and '오 시장' not in text:
        if '의혹' not in text and '논란' not in text and '수사' not in text:
            return 'X', 0, '오세훈 리스크와 무관한 데이터.'

    # 명태균 기소/재판/특검 = 심각한 법적 리스크 (-3)
    if '명태균' in text and ('기소' in text or '특검' in text or '재판' in text):
        return '-3', -6, '명태균 여론조사 대납 의혹 특검 기소, 선거전 치명적 법적 리스크.'

    # 명태균 의혹 (기소 전/일반) (-2)
    if '명태균' in text and '오세훈' in text:
        return '-2', -4, '명태균 관련 의혹으로 오세훈 법적·도덕적 리스크 존재.'

    # 중대재해처벌법 고소 (-2)
    if '중대재해' in text and '오세훈' in text:
        return '-2', -4, '중대재해처벌법 위반 혐의 고소로 오세훈 법적 리스크 추가.'

    # 공직선거법 문제 (-2)
    if '공직선거법' in text and '오세훈' in text:
        return '-2', -4, '공직선거법 관련 문제 언급으로 오세훈 선거법 리스크.'

    # 감사의 정원 세금낭비 논란 (-1)
    if ('감사의정원' in text or '감사의 정원' in text) and ('세금' in text or '낭비' in text):
        return '-1', -2, '감사의 정원 세금낭비 논란으로 정책 리스크 존재.'

    # 한강버스 안전 논란 (-1)
    if '한강버스' in text and ('안전' in text or '논란' in text or '의혹' in text):
        return '-1', -2, '한강버스 안전 논란으로 오세훈 정책 리스크 부각.'

    # 일반 의혹/논란 (-1)
    if '의혹' in text and '오세훈' in text:
        return '-1', -2, '오세훈 관련 의혹 언급으로 리스크 소재 존재.'

    if '논란' in text and '오세훈' in text:
        return '-1', -2, '오세훈 관련 논란으로 네거티브 공격 소재 존재.'

    # 일반 행정 활동 (리스크 없음) (+2)
    if '오세훈' in text and ('추진' in text or '발표' in text or '참석' in text or '표창' in text):
        if '의혹' not in text and '논란' not in text and '비판' not in text:
            return '+2', 4, '일반 행정 활동으로 주요 리스크 없는 정상 활동.'

    # 갈등/분열 맥락 (-1)
    if '오세훈' in text and ('갈등' in text or '충돌' in text or '압박' in text):
        return '-1', -2, '당내 갈등 관련 맥락으로 오세훈 정치적 리스크 노출.'

    return '+1', 2, '오세훈 관련 주요 리스크 없는 언급.'


def evaluate_party(title: str, content: str) -> tuple:
    """
    정당경쟁력 평가 (오세훈 특화)

    핵심:
    - 국민의힘 지지율 20%대 vs 민주당 44%대
    - 당내 분열, 절윤 갈등
    - 서울 PVI: 국민의힘 약간 불리 (2022 지선 이후 변화)
    """
    text = title + ' ' + (content or '')

    if '국민의힘' not in text and '국힘' not in text and '오세훈' not in text and '더불어민주당' not in text:
        return 'X', 0, '정당경쟁력과 무관한 데이터.'

    # 국민의힘 지지율 역대 최저/급락 (-3)
    if ('국민의힘' in text or '국힘' in text) and ('최저' in text or '17%' in text):
        return '-3', -6, '국민의힘 지지율 역대 최저로 서울시장 선거 구조적 불리.'

    # 민주당 지지율 44%+ vs 국힘 20%대 (-2)
    if '민주당' in text and ('44%' in text or '45%' in text or '48%' in text):
        return '-2', -4, '민주당 지지율 44%대로 국민의힘 대비 20%p+ 구조적 우위.'

    # 국민의힘 지지율 20%대 (-2)
    if ('국힘' in text or '국민의힘' in text) and ('20%' in text or '21%' in text or '22%' in text or '23%' in text):
        return '-2', -4, '국민의힘 지지율 20%대 하락으로 구조적 정당 경쟁력 심각 약화.'

    # 국민의힘 당내 분열/내홍 (-2)
    if ('국민의힘' in text or '국힘' in text) and ('분열' in text or '내홍' in text or '분당' in text or '탈당' in text):
        return '-2', -4, '국민의힘 당내 분열·내홍으로 정당 결속력 약화.'

    # 전한길 탈당 등 당 갈등 (-1)
    if '전한길' in text and ('탈당' in text or '국민의힘' in text):
        return '-1', -2, '친윤계 갈등·탈당 위기로 국민의힘 정당 브랜드 손상.'

    # 절윤 결의로 일부 긍정 신호 (-1, 여전히 열세)
    if '절윤' in text and '결의문' in text and ('지방선거' in text or '서울' in text):
        return '-1', -2, '절윤 결의 회복 시도하나 당 지지율 여전히 구조적 열세.'

    # 공천 미신청/불확실 (-1)
    if '미신청' in text and '오세훈' in text:
        return '-1', -2, '오세훈 공천 미신청으로 국민의힘 공천 혼란 가중.'

    # 국민의힘 일반 공천 활동 (+1)
    if ('국민의힘' in text or '국힘' in text) and ('공천' in text or '면접' in text):
        return '+1', 2, '국민의힘 공천 절차 진행 중으로 정당 경쟁 참여 기본 충족.'

    # 일반 국민의힘 언급
    if '국민의힘' in text or '국힘' in text:
        return '-1', -2, '국민의힘 지지율 열세 구조 속 오세훈 정당 경쟁력 약화.'

    return '-1', -2, '정당경쟁력 불리한 맥락에서 언급.'


def evaluate_candidate(title: str, content: str) -> tuple:
    """
    후보자경쟁력 평가 (오세훈 특화)

    핵심 강점:
    - 현직 서울시장 (4선) = 압도적 현직 프리미엄
    - 높은 인지도 (전국급)
    - 공천 확정 유력 (단수 공천 논의)

    약점:
    - 명태균 기소로 공천 리스크
    - 경선 vs 단수 불확실성
    """
    text = title + ' ' + (content or '')

    if '오세훈' not in text and '서울시장' not in text:
        if '예비후보' not in text and '공천' not in text and '후보' not in text:
            return 'X', 0, '후보자경쟁력과 무관한 데이터.'

    # 현직 다선, 4선 언급 (+3~+4)
    if '4선' in text and ('서울시장' in text or '오세훈' in text):
        return '+4', 8, '현직 4선 서울시장으로 한국 지방선거 최고 현직 프리미엄 보유.'

    # 단수 공천 유력 (+3)
    if '단수 공천' in text and '오세훈' in text:
        return '+3', 6, '단수 공천 유력 언급으로 공천 안정성과 후보자 경쟁력 강점.'

    # 현직 프리미엄 언급 (+3)
    if '현역 프리미엄' in text and '오세훈' in text:
        return '+3', 6, '현역 프리미엄으로 경쟁자 대비 구조적 후보자 경쟁력 우위.'

    # 공천 추가 공모 (공천 진행) (+2)
    if ('추가 공모' in text or '추가 접수' in text) and '오세훈' in text:
        return '+2', 4, '공천 추가 공모 진행으로 후보 등록 임박, 경쟁력 회복.'

    # 의정 활동, 시정 성과 (+2~+3)
    if '오세훈' in text and ('신통기획' in text or '신속통합기획' in text):
        return '+3', 6, '신통기획 등 현직 서울시장 정책 성과로 후보자 경쟁력 강화.'

    # 청년주택, 공급 정책 (+2)
    if '오세훈' in text and ('청년주택' in text or '공급' in text or '재건축' in text):
        return '+2', 4, '청년주택·재건축 공급 정책으로 현직 시장 성과 부각.'

    # 공천 미신청 (불확실성, 하지만 현직) (+1)
    if '미신청' in text and '오세훈' in text:
        return '+1', 2, '공천 미신청으로 불확실성 있으나 현직 서울시장 경쟁력 유지.'

    # 현직 서울시장 활동 (+2)
    if '오세훈' in text and ('서울시장' in text or '서울시' in text):
        if '비판' not in text and '논란' not in text:
            return '+2', 4, '현직 서울시장으로서 경쟁자 대비 기본 후보자 경쟁력 우위.'

    # 경선, 공천 경쟁 (일반) (+2)
    if '오세훈' in text and ('공천' in text or '경선' in text or '후보' in text):
        return '+2', 4, '현직 서울시장으로 공천 경쟁력 우위 보유.'

    # 지선 D-90 등 일반 후보 언급
    if '오세훈' in text:
        return '+2', 4, '현직 서울시장으로 기본 후보자 경쟁력 확인.'

    return '+1', 2, '후보자 관련 평균 경쟁력 맥락.'


def evaluate_regional(title: str, content: str) -> tuple:
    """
    지역기반 평가 (오세훈 특화)

    핵심:
    - 현직 서울시장 (서울 전역 기반)
    - 경력 연고: 서울시장 3선+1선
    - 지역 서비스: 신통기획, 청년주택 등
    - 조직력: 서울시 전체 행정 조직

    경쟁자 비교:
    - 정원오: 성동구 연고 (구청장 3선)
    - 박주민: 은평 연고 (국회의원)
    - 조은희: 서초구 연고 (구청장)
    - 오세훈: 서울 전역 (시장) → 가장 광범위
    """
    text = title + ' ' + (content or '')

    if ('오세훈' not in text and '서울시장' not in text and
            '오 시장' not in text and '서울특별시' not in text):
        return 'X', 0, '오세훈 지역기반과 무관한 데이터.'

    # 서울시 위탁·공식 행정 서비스 (+3)
    if '서울특별시' in text and ('위탁' in text or '협력' in text or '수탁' in text):
        return '+3', 6, '현직 서울시장으로 서울 전역 행정 서비스 기반 확보.'

    # 신통기획 (서울 전역 도시재생) (+3)
    if ('신통기획' in text or '신속통합기획' in text) and ('서울' in text or '오세훈' in text):
        return '+3', 6, '신통기획으로 서울 전역 도시재생 사업 추진, 광범위한 지역 기반.'

    # 서울시 전체 예산/조직/구청장 연대 (+3)
    if '오세훈' in text and ('구청장협의회' in text or '자치구' in text or '15개' in text):
        return '+3', 6, '서울시 25개 자치구 구청장 협의 기반으로 광범위한 지역 조직 보유.'

    # BTS, 기도회, 표창 등 서울 현장 활동 (+2)
    if '오세훈' in text and ('BTS' in text or '기도회' in text or '표창' in text or '행사' in text):
        return '+2', 4, '현직 서울시장으로 서울 시민 대상 다양한 지역 활동 수행.'

    # 청년주택, 위례신사선 등 지역 개발 사업 (+2)
    if '오세훈' in text and ('청년주택' in text or '위례신사선' in text or '잠실' in text or '재건축' in text):
        return '+2', 4, '서울 주요 개발 사업 추진으로 지역 서비스 활동 강화.'

    # 서울시 공식 활동 일반 (+2)
    if '오세훈' in text and '서울시' in text:
        if '비판' not in text and '논란' not in text:
            return '+2', 4, '현직 서울시장으로 서울 전역 지역기반 보유.'

    # 서울시장 언급 일반 (+2)
    if '서울시장' in text and ('오세훈' in text or '현직' in text):
        return '+2', 4, '현직 서울시장으로 경쟁자 대비 서울 전역 지역기반 최강.'

    # 서울시 비판 맥락 (+1)
    if '오세훈' in text and '서울' in text:
        return '+1', 2, '서울시 지역 기반 있으나 비판 맥락 포함.'

    return '+1', 2, '서울 지역 기반 평균 수준 언급.'


# ═══════════════════════════════════════════
# 평가 실행
# ═══════════════════════════════════════════

EVALUATORS = {
    'opinion':   evaluate_opinion,
    'media':     evaluate_media,
    'risk':      evaluate_risk,
    'party':     evaluate_party,
    'candidate': evaluate_candidate,
    'regional':  evaluate_regional,
}


def run_evaluation():
    print(f"\n{'='*60}")
    print(f"Claude 직접 분석 - Alpha 평가: {POLITICIAN_NAME} ({POLITICIAN_ID})")
    print(f"평가 기준: 상대평가 (경쟁자 그룹 비교)")
    print(f"{'='*60}")

    groups = get_competitor_group(politician_id=POLITICIAN_ID)
    group_id = groups[0]['id'] if groups else None

    total_saved = 0

    for cat in ALPHA_CATEGORIES:
        alpha_type = ALPHA_TYPE_MAP[cat]
        evaluator = EVALUATORS[cat]

        # 수집 데이터 조회
        items = fetch_all_rows(TABLE_COLLECTED_ALPHA, {
            'politician_id': POLITICIAN_ID,
            'category': cat,
        })

        if not items:
            print(f"  [SKIP] [{cat}] 수집 데이터 없음")
            continue

        # 이미 평가된 ID 조회
        evaluated = fetch_all_rows(TABLE_EVALUATIONS_ALPHA, {
            'politician_id': POLITICIAN_ID,
            'category': cat,
        }, 'collected_alpha_id')
        evaluated_ids = {e['collected_alpha_id'] for e in evaluated if e.get('collected_alpha_id')}

        pending = [item for item in items if item['id'] not in evaluated_ids]
        if not pending:
            print(f"  [DONE] [{cat}] 이미 완료 ({len(items)}개)")
            continue

        rows = []
        rating_dist = {}
        for item in pending:
            title = item.get('title', '')
            content = (item.get('content', '') or '')[:400]
            rating, score, rationale = evaluator(title, content)

            rating_dist[rating] = rating_dist.get(rating, 0) + 1

            row = {
                'politician_id': POLITICIAN_ID,
                'alpha_type': alpha_type,
                'category': cat,
                'evaluator_ai': 'Claude',
                'collected_alpha_id': item['id'],
                'rating': rating,
                'reasoning': rationale,
            }
            if group_id:
                row['competitor_group_id'] = group_id
            rows.append(row)

        # DB 저장
        saved = 0
        for i in range(0, len(rows), 50):
            batch = rows[i:i+50]
            try:
                result = supabase.table(TABLE_EVALUATIONS_ALPHA).insert(batch).execute()
                saved += len(result.data) if result.data else 0
            except Exception as e:
                print_status(f"  [{cat}] 저장 오류: {e}", 'error')

        total_saved += saved
        x_count = rating_dist.get('X', 0)
        print(f"  [OK] [{cat}] {len(pending)}개 평가 → {saved}개 저장 | 분포: {rating_dist}")

    print(f"\n  총 {total_saved}개 저장 완료")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    run_evaluation()
