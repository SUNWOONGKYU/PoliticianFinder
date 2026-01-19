# -*- coding: utf-8 -*-
"""
V30 2개 AI 분담 웹검색 수집 스크립트 (비용 최적화 버전)

핵심 변경 (V30):
1. 2개 AI 분담 수집 (90-10) - 비용 최적화
   - Gemini 90%: 공식 50개 + 공개 40개 (Google Search 무료)
   - Grok 10%: 공개 10개 (X/트위터 전담)

   ⚠️ Perplexity = 제거 (401 에러 + 비용 폭탄 $1,050+/100명)
   ⚠️ Claude/ChatGPT = 수집 제외 (웹검색 비용 문제)
   - Claude web_search: 검색당 $0.01 추가 과금
   - ChatGPT Bing: 별도 과금

2. 웹검색 필수 (수집 AI만)
   - Gemini: google_search grounding (무료) - 뉴스, SNS, 위키, 블로그, 커뮤니티 전체
   - Grok: X/Twitter 실시간 접근

   ⚠️ Claude/ChatGPT는 수집 제외 (평가에만 사용)

3. 카테고리당 100개 수집 (총 1,000개/정치인)

4. 20-20-60 균형
   - 부정 20개 + 긍정 20개 + 자유 60개

사용법:
    # 전체 수집 (Gemini + Grok)
    python collect_v30.py --politician_id=62e7b453 --politician_name="오세훈"

    # 특정 AI만 실행
    python collect_v30.py --politician_id=62e7b453 --politician_name="오세훈" --ai=Gemini

    # 특정 카테고리만
    python collect_v30.py --politician_id=62e7b453 --politician_name="오세훈" --category=1

    # 병렬 실행 (빠름, 권장)
    python collect_v30.py --politician_id=62e7b453 --politician_name="오세훈" --parallel

    # 미니 테스트 (카테고리당 10개)
    python collect_v30.py --politician_id=62e7b453 --politician_name="오세훈" --parallel --test
"""

import os
import sys
import json
import re
import argparse
import time
import random
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        # 이미 설정되어 있거나 buffer가 없는 경우 무시
        pass

# ============================================================
# topic_mode → DB sentiment 매핑
# ============================================================
def topic_mode_to_sentiment(topic_mode):
    """topic_mode를 DB sentiment 값으로 변환

    Args:
        topic_mode: 'negative', 'positive', 'free'

    Returns:
        sentiment: 'negative', 'positive', 'free'

    Notes:
        - DB sentiment CHECK 제약: ('positive', 'negative', 'neutral', 'free')
        - topic_mode 'free'는 DB에서 그대로 'free'로 저장
        - 'free' = 자유롭게 수집 (긍정/부정/중립 모두 포함)
    """
    mapping = {
        'negative': 'negative',
        'positive': 'positive',
        'free': 'free'  # ✅ 수정: 'free' 그대로 저장
    }
    return mapping.get(topic_mode, 'free')


# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V30 테이블명
TABLE_COLLECTED_DATA = "collected_data_v30"

# AI 클라이언트 캐시
ai_clients = {}

# 카테고리 정의 (V30 - V28.3 기준)
CATEGORIES = [
    ("expertise", "전문성"),
    ("leadership", "리더십"),
    ("vision", "비전"),
    ("integrity", "청렴성"),
    ("ethics", "윤리성"),
    ("accountability", "책임감"),
    ("transparency", "투명성"),
    ("communication", "소통능력"),
    ("responsiveness", "대응성"),
    ("publicinterest", "공익성")
]

# V30 수집 비율 (카테고리당 100개) - 비용 최적화 버전
# ⚠️ Claude/ChatGPT = 수집 제외 (웹검색 비용 문제)
# - Claude web_search: 검색당 $0.01 추가 과금
# - ChatGPT Bing: 별도 과금
# → 수집: Gemini 60% + Perplexity 30% + Grok 10%
# → 평가만: Claude, ChatGPT
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔴 AI별 담당 소스 (V30 역할 분리)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# | AI         | OFFICIAL | PUBLIC                    | 금지 소스              |
# |------------|----------|---------------------------|------------------------|
# | Gemini     | 50개     | 40개(전체 담당)           | ❌ (없음)              |
# | Grok       | 0개      | 10개(X/트위터만)          | ❌ 뉴스, ❌ 기타        |
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Gemini PUBLIC 담당 (전체):
#   - 뉴스/언론: 조선, 중앙, 동아, 한겨레, 경향, KBS, MBC, SBS, 로이터, AP, AFP, BBC, CNN 등
#   - SNS: YouTube, Instagram, Facebook
#   - 위키피디아 (한글/영문)
#   - 블로그/칼럼: 네이버 블로그, 브런치, 전문가 칼럼
#   - 커뮤니티: 나무위키, 카페
# Grok PUBLIC 담당 (X/트위터 전담):
#   - X(Twitter) 실시간 게시글, 댓글, 트렌드
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLLECT_DISTRIBUTION = {
    "Gemini": {
        "official": 50,  # OFFICIAL 100% (Google Search 무료)
        "public": 40,    # PUBLIC 전체 담당: 뉴스, SNS, 위키, 블로그, 커뮤니티 (Google Search 무료)
        "total": 90      # 90%
    },
    "Grok": {
        "official": 0,
        "public": 10,    # PUBLIC: X/트위터만!
        "total": 10      # 10%
    }
    # ⚠️ Perplexity: 제거 (401 에러 + 비용 폭탄 $1,050+/100명)
    # ⚠️ Claude: 수집 제외 (평가만) - web_search 비용 문제
    # ⚠️ ChatGPT: 수집 제외 (평가만) - Bing 검색 비용 문제
}

# 미니 테스트용 배분 (카테고리당 10개) - 빠른 검증용
# 90-10 비율 유지하면서 1/10 규모
TEST_DISTRIBUTION = {
    "Gemini": {
        "official": 5,   # OFFICIAL 테스트
        "public": 4,     # PUBLIC 테스트 (전체 담당)
        "total": 9       # 90%
    },
    "Grok": {
        "official": 0,
        "public": 1,     # PUBLIC 테스트 (X/트위터)
        "total": 1       # 10%
    }
}

# 20-20-60 균형 배분 (부정 20% + 긍정 20% + 자유 60%)
# 각 AI별로 부정/긍정/자유 개수 설정
SENTIMENT_DISTRIBUTION = {
    "Gemini": {
        "official": {"negative": 10, "positive": 10, "free": 30},  # 50개
        "public": {"negative": 8, "positive": 8, "free": 24}       # 40개 (뉴스 포함 전체)
    },
    "Grok": {
        "official": {"negative": 0, "positive": 0, "free": 0},     # 0개
        "public": {"negative": 2, "positive": 2, "free": 6}        # 10개
    }
}

# 테스트 모드용 20-20-60 배분 (1/10 규모)
TEST_SENTIMENT_DISTRIBUTION = {
    "Gemini": {
        "official": {"negative": 1, "positive": 1, "free": 3},     # 5개
        "public": {"negative": 1, "positive": 1, "free": 2}        # 4개 (전체 담당)
    },
    "Grok": {
        "official": {"negative": 0, "positive": 0, "free": 0},     # 0개
        "public": {"negative": 0, "positive": 0, "free": 1}        # 1개
    }
}

# AI 모델 설정
AI_CONFIGS = {
    "Claude": {
        "model": "claude-3-5-haiku-20241022",
        "env_key": "ANTHROPIC_API_KEY"
    },
    "ChatGPT": {
        "model": "gpt-4o-mini",
        "env_key": "OPENAI_API_KEY"
    },
    "Grok": {
        "model": "grok-2",
        "env_key": "XAI_API_KEY",
        "base_url": "https://api.x.ai/v1"
    },
    "Gemini": {
        "model": "gemini-2.0-flash",
        "env_key": "GEMINI_API_KEY"
    }
    # Perplexity: 제거 (401 에러 + 비용 폭탄)
}

# 공식 데이터 도메인 (Gemini OFFICIAL 소스)
OFFICIAL_DOMAINS = [
    "assembly.go.kr",
    "likms.assembly.go.kr",
    "mois.go.kr",
    "korea.kr",
    "nec.go.kr",
    "bai.go.kr",
    "pec.go.kr",
    "scourt.go.kr",
    "nesdc.go.kr",
    "manifesto.or.kr",
    "peoplepower21.org",
    "theminjoo.kr",
    "seoul.go.kr",
    "gg.go.kr",
    "busan.go.kr",
    "incheon.go.kr",
    "daegu.go.kr",
    "daejeon.go.kr",
    "gwangju.go.kr",
    "ulsan.go.kr",
    "sejong.go.kr",
    "open.go.kr",
    "acrc.go.kr",
    "humanrights.go.kr"
]

# 정치인 상세 정보 캐시
_politician_info_cache = {}

def get_politician_info(politician_id):
    """정치인 상세 정보 조회 (동명이인 구분용)"""
    if politician_id in _politician_info_cache:
        return _politician_info_cache[politician_id]

    try:
        result = supabase.table('politicians').select('*').eq('id', politician_id).execute()
        if result.data:
            p = result.data[0]
            birth_year = ""
            if p.get('birth_date'):
                birth_year = str(p.get('birth_date'))[:4] + "년생"

            info = {
                'name': p.get('name', ''),
                'party': p.get('party', ''),
                'position': p.get('position', '국회의원'),
                'district': p.get('district', ''),
                'birth_year': birth_year,
                'search_string': f"{p.get('party', '')} {p.get('name', '')} {p.get('position', '국회의원')}" + (f" ({birth_year})" if birth_year else "")
            }
            _politician_info_cache[politician_id] = info
            return info
    except Exception as e:
        print(f"  ⚠️ 정치인 정보 조회 실패: {e}")

    return {'name': '', 'party': '', 'position': '국회의원', 'district': '', 'birth_year': '', 'search_string': ''}

# 카테고리별 10개 항목 (V28.3 기준 중립화)
CATEGORY_ITEMS = {
    "expertise": [
        ("최종 학력 수준", "학력 박사 석사 학사 학위"),
        ("직무 관련 자격증", "자격증 변호사 CPA 공인"),
        ("관련 분야 경력 연수", "경력 근무 재직 연수"),
        ("직무 교육 이수", "교육 연수 이수 참여"),
        ("전문 분야 기고/저서", "저서 기고 출판 저술"),
        ("학술 연구 실적", "논문 연구 학술 발표"),
        ("위키피디아 전문성 기술", "위키 프로필 이력"),
        ("전문 분야 평가 기록", "전문성 평가 외부"),
        ("위원회 활동 기록", "위원회 자문위원 심의위원"),
        ("전문성 관련 언론 평가", "전문가 실력파 역량")
    ],
    "leadership": [
        ("법안 발의 건수", "법안 발의 의원입법"),
        ("법안 통과율", "법안 통과 가결 성립"),
        ("위원회 위원장 경험", "상임위 소위 위원장"),
        ("당직 경력", "당대표 원내대표 최고위원"),
        ("조직 확대 실적", "조직 확대 당원 지지율"),
        ("위기 대응 사례", "위기관리 대응 수습"),
        ("정책 추진력", "정책 추진 관철 성과"),
        ("리더십 관련 언론 평가", "리더십 지도력 평가"),
        ("의회 협력 활동 기록", "의회 협력 연대 협상"),
        ("리더십 관련 평가 기록", "리더십 외부 평가")
    ],
    "vision": [
        ("중장기 발전 계획", "비전 장기계획 청사진"),
        ("미래 투자 예산", "R&D 교육 신산업 예산"),
        ("사회 발전 관련 예산", "환경 기후 복지 예산"),
        ("기술 발전 관련 정책", "기술 AI 스마트시티 정책"),
        ("미래 정책 제안", "혁신 미래 정책 제안"),
        ("청년층 정책", "청년 정책 미래세대"),
        ("해외 사례 벤치마킹", "해외 정책 벤치마킹"),
        ("미래 키워드 보도", "혁신 미래 디지털 보도"),
        ("장기 공약 제시", "장기 공약 지속 정책"),
        ("비전 관련 연설/기고", "비전 연설 기고문")
    ],
    "integrity": [
        ("금전 관련 형사 판결 내용", "형사 판결 뇌물 횡령 배임"),
        ("재산 신고 변동 현황", "재산 신고 변동 증감"),
        ("공직자윤리법 관련 기록", "공직자윤리 심의 기록"),
        ("정치자금법 관련 기록", "정치자금 선관위 처분"),
        ("선거법 관련 기록", "선거법 위반 기록"),
        ("금전 관련 언론 보도", "금전 재산 관련 보도"),
        ("한국투명성기구 평가", "TI Korea 청렴도 평가"),
        ("시민단체 청렴 평가", "참여연대 청렴 평가"),
        ("정치자금 관련 보도", "정치자금 관련 보도"),
        ("청렴 관련 평가 기록", "청렴 외부 평가")
    ],
    "ethics": [
        ("형사 판결 기록", "형사 판결 비부패 범죄"),
        ("성문제 관련 판결 내용", "성범죄 판결 기록"),
        ("윤리위원회 심의 내용", "윤리위 심의 징계"),
        ("국가인권위 시정권고", "인권위 권고 결정"),
        ("저작 관련 검증 기록", "저작 표절 검증 기록"),
        ("공개 발언 태도 관련 보도", "발언 태도 관련 보도"),
        ("사회 배려 문제 발언 관련 보도", "차별 발언 관련 보도"),
        ("품위유지 관련 보도", "품위 관련 보도"),
        ("시민단체 윤리 평가", "윤리성 외부 평가"),
        ("가족문제 관련 보도", "가족 관련 보도")
    ],
    "accountability": [
        ("공약 이행률", "공약 이행 실천 달성"),
        ("회의 출석률", "출석 본회의 위원회"),
        ("예산 집행률", "예산 집행 집행률"),
        ("감사 지적 개선", "감사 지적 개선 완료"),
        ("매니페스토 평가 등급", "매니페스토 평가 등급"),
        ("의정 활동 보고 빈도", "의정활동 보고 활동"),
        ("시민단체 의정 감시 평가", "의정감시 평가 점수"),
        ("직무 수행 관련 보도", "직무 수행 관련 보도"),
        ("책임 이행 관련 보도", "책임 이행 관련 보도"),
        ("사후 책임 이행", "실패 인정 개선 이행")
    ],
    "transparency": [
        ("정보공개 청구 응답률", "정보공개 응답률 처리"),
        ("회의록 공개율", "회의록 공개 비율"),
        ("재산 공개 성실도", "재산 공개 성실 기재"),
        ("예산 집행 상세 공개", "예산 집행 세목 공개"),
        ("자료 제출 성실성 관련 보도", "자료 제출 관련 보도"),
        ("정보공개센터 평가", "정보공개 우수 사례"),
        ("투명성 관련 보도", "투명 공개 관련 보도"),
        ("정보공개 관련 보도", "비공개 정보공개 보도"),
        ("언론 대응 투명성", "기자회견 질의응답 참여"),
        ("일정 공개 수준", "일정 공개 사전 공개")
    ],
    "communication": [
        ("시민 간담회 개최", "간담회 개최 건수"),
        ("공청회 토론회 개최", "공청회 토론회 개최"),
        ("공식 소통 채널 운영", "홈페이지 SNS 채널"),
        ("시민 제안 수용", "제안 수용 건수 비율"),
        ("SNS 소통 활동", "SNS 소통 팔로워 참여"),
        ("SNS 댓글 응답", "댓글 응답 건수 비율"),
        ("토론 참여 평가", "토론 능력 평가"),
        ("소통 적극성 관련 보도", "소통 관련 보도"),
        ("경청 자세 평가", "경청 공감 평가"),
        ("소통 관련 평가 기록", "소통 외부 평가")
    ],
    "responsiveness": [
        ("주민참여예산 규모", "참여예산 금액 규모"),
        ("정보공개 처리 기간", "정보공개 처리 일수"),
        ("주민 제안 반영", "제안 반영 건수 비율"),
        ("지역 현안 대응", "현장 점검 대책 발표"),
        ("재난 대응 실적", "재난 대응 현장 평가"),
        ("위기 대응 보도", "위기 재난 대응 보도"),
        ("현장 방문 보도", "현장 방문 관련 보도"),
        ("민원 처리 만족도", "민원 처리 만족도"),
        ("대응 속도 관련 보도", "대응 속도 관련 보도"),
        ("현장 대응 관련 보도", "현장 대응 관련 보도")
    ],
    "publicinterest": [
        ("사회복지 예산 비율", "복지 예산 비율"),
        ("취약계층 지원 프로그램", "취약계층 장애 노인 아동"),
        ("환경 기후 예산", "환경 예산 기후 녹색"),
        ("지역 균형 발전 예산", "균형발전 지역 투자"),
        ("공익 활동 보도", "봉사 취약계층 보도"),
        ("사회공헌 SNS 게시", "공익 게시물 사회공헌"),
        ("공익 법안 발의", "공익 법안 발의 실적"),
        ("이익 상충 관련 보도", "이익 상충 관련 보도"),
        ("지역 균형 관련 보도", "지역 균형 관련 보도"),
        ("공익 관련 평가 기록", "공익 외부 평가")
    ]
}


def get_exact_count(table_name, filters=None):
    """정확한 개수 조회"""
    try:
        query = supabase.table(table_name).select('*', count='exact')
        if filters:
            for key, value in filters.items():
                if value is not None:
                    query = query.eq(key, value)
        response = query.limit(1).execute()
        return response.count if response.count else 0
    except Exception as e:
        print(f"  ⚠️ count 조회 실패: {e}")
        return 0


def normalize_date(date_str):
    """날짜 문자열을 YYYY-MM-DD 형식으로 정규화, 실패시 None 반환"""
    if not date_str or not isinstance(date_str, str):
        return None

    date_str = date_str.strip()

    # 명확히 잘못된 값
    if '미상' in date_str or '불명' in date_str or '없음' in date_str:
        return None

    import re

    # YYYY-MM-DD 형식 체크
    match = re.match(r'^(\d{4})-(\d{2})-(\d{2})$', date_str)
    if match:
        year, month, day = match.groups()
        # 잘못된 월/일 보정 (00 → 01)
        month = int(month) if int(month) > 0 else 1
        day = int(day) if int(day) > 0 else 1
        # 월/일 범위 검증
        month = min(month, 12)
        day = min(day, 28)  # 안전하게 28일로 제한
        return f"{year}-{month:02d}-{day:02d}"

    # YYYY-MM (월까지만 있음) -> YYYY-MM-01로 변환
    match = re.match(r'^(\d{4})-(\d{1,2})$', date_str)
    if match:
        year, month = match.groups()
        month = int(month) if int(month) > 0 else 1
        month = min(month, 12)
        return f"{year}-{month:02d}-01"

    # YYYY (년도만) -> YYYY-01-01로 변환
    if re.match(r'^\d{4}$', date_str):
        return f"{date_str}-01-01"

    # 기타 형식은 무시
    return None


def check_politician_exists(politician_id):
    """정치인 ID 확인"""
    try:
        result = supabase.table('politicians').select('id, name').eq('id', politician_id).execute()
        if result.data and len(result.data) > 0:
            return True, result.data[0].get('name', '')
        return False, None
    except Exception as e:
        print(f"❌ 정치인 확인 에러: {e}")
        return False, None


def init_ai_client(ai_name):
    """AI 클라이언트 초기화"""
    global ai_clients

    if ai_name in ai_clients:
        return ai_clients[ai_name]

    config = AI_CONFIGS.get(ai_name)
    if not config:
        raise ValueError(f"알 수 없는 AI: {ai_name}")

    api_key = os.getenv(config['env_key'])
    if not api_key:
        raise ValueError(f"{config['env_key']} 환경변수가 설정되지 않았습니다.")

    if ai_name == "Perplexity":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(
            api_key=api_key,
            base_url=config['base_url']
        )
    elif ai_name == "Claude":
        import anthropic
        ai_clients[ai_name] = anthropic.Anthropic(api_key=api_key)
    elif ai_name == "ChatGPT":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(api_key=api_key)
    elif ai_name == "Grok":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(
            api_key=api_key,
            base_url=config['base_url']
        )
    elif ai_name == "Gemini":
        from google import genai
        client = genai.Client(api_key=api_key)
        ai_clients[ai_name] = client

    return ai_clients[ai_name]


def get_date_range():
    """V30 기간 제한 계산"""
    evaluation_date = datetime.now()
    official_start = evaluation_date - timedelta(days=365*4)  # 4년
    public_start = evaluation_date - timedelta(days=365*2)    # 2년

    return {
        'evaluation_date': evaluation_date.strftime('%Y-%m-%d'),
        'official_start': official_start.strftime('%Y-%m-%d'),
        'official_end': evaluation_date.strftime('%Y-%m-%d'),
        'public_start': public_start.strftime('%Y-%m-%d'),
        'public_end': evaluation_date.strftime('%Y-%m-%d'),
    }


def build_prompt_v30(politician_name, category_name, category_korean, data_type, count, sentiment_dist, ai_name):
    """V30 수집 프롬프트 생성"""
    date_range = get_date_range()

    if data_type == "official":
        date_start = date_range['official_start']
        date_end = date_range['official_end']
        period_desc = "최근 4년"
    else:
        date_start = date_range['public_start']
        date_end = date_range['public_end']
        period_desc = "최근 2년"

    # 감성 분포 설명
    negative_count = sentiment_dist.get('negative', 0)
    positive_count = sentiment_dist.get('positive', 0)
    neutral_count = sentiment_dist.get('neutral', 0)

    # AI별 역할 설명
    if ai_name == "Perplexity":
        role_desc = "검색 전문 AI로서 공식 데이터와 뉴스를 전담 수집합니다."
        if data_type == "official":
            search_instruction = f"""
공식 활동 데이터 수집 지침:
✅ 수집 대상 (우선순위):
1. 국회 의정활동: 법안 발의, 국정감사, 위원회 활동, 대정부질문
2. 공식 발표: 기자회견, 성명서, 공약, 정책 발표
3. 공적 기록: 경력, 학력, 수상, 임명
4. 언론 보도: 위 공식 활동에 대한 언론 기사도 포함!

⚠️ 핵심: 공식 '도메인'이 아니라 공식 '활동'이 중요합니다!
- 국회의원의 법안 발의를 보도한 뉴스 기사 → ✅ 공식 데이터로 인정
- 정치인의 공식 경력을 정리한 나무위키 → ✅ 공식 데이터로 인정
- 정당 공식 발표를 보도한 기사 → ✅ 공식 데이터로 인정

실제 검색 결과에서 찾은 데이터를 모두 수집하세요!
빈 배열([])을 반환하지 마세요!
"""
        else:
            search_instruction = """
뉴스 전담 수집 지침:
- 주요 언론사: 조선일보, 중앙일보, 동아일보, 한겨레, 경향신문
- 방송사: KBS, MBC, SBS, JTBC, TV조선, MBN
- 통신사: 연합뉴스, 뉴시스, 뉴스1
- 경제지: 매일경제, 한국경제
- 반드시 실제 뉴스 URL 포함
"""
    elif ai_name == "Claude":
        role_desc = "블로그, 커뮤니티, 시사매거진 전문으로 여론과 심층 분석을 수집합니다."
        search_instruction = """
수집 대상 (뉴스 제외):
1. 블로그/칼럼: 네이버 블로그, 브런치, 다음 블로그, 전문가 칼럼
2. 커뮤니티: 네이버 카페, 디시인사이드, 클리앙, 에펨코리아, 나무위키
3. 시사매거진: 시사IN, 한겨레21, 주간경향, 미디어오늘, 프레시안

web_search 도구를 사용하여 실제 게시물/기사를 찾으세요.
커뮤니티 여론, 블로거 분석, 심층 기획 기사 중심으로 수집합니다.
"""
    elif ai_name == "Gemini":
        role_desc = "영상매체, 글로벌/외신, 위키피디아 전문으로 수집합니다."
        search_instruction = """
수집 대상 (국내 뉴스 제외):
1. 영상매체: 유튜브 (정치인 채널, 인터뷰, 토론회 영상), 팟캐스트
2. 글로벌/외신: 로이터, AP, AFP, BBC, CNN (한국 정치 관련)
3. 백과사전: 위키피디아 (영문/한글)

Google Search를 사용하여 실제 영상/기사/문서를 찾으세요.
유튜브 영상 URL, 외신 기사 URL, 위키피디아 URL을 포함하세요.
"""
    elif ai_name == "Grok":
        role_desc = "X(트위터) 전담으로 정치인 관련 트윗과 반응을 수집합니다."
        search_instruction = """
X(트위터) 전담 수집 - 딱 2가지:
1. 정치인 관련 트윗: X 이용자들이 해당 정치인에 대해 쓴 트윗
2. 정치인 트윗에 대한 반응: 해당 정치인이 올린 트윗에 대한 이용자 반응 (댓글, 인용)

출처 형식: "X/@계정명" 또는 트윗 URL
"""
    else:
        role_desc = "데이터를 수집합니다."
        search_instruction = ""

    # Perplexity용 프롬프트는 더 자연스럽게
    if ai_name == "Perplexity":
        prompt = f"""
{politician_full}의 {category_korean}({category_name}) 관련 활동을 검색해주세요.

검색 조건:
- 기간: {date_start} ~ {date_end}
- 개수: 최대 {count}개
- 내용: {"의정활동, 법안발의, 공식경력, 공적활동" if data_type == "official" else "뉴스기사, 언론보도, 인터뷰"}

결과를 JSON 배열로 정리해주세요:
```json
[
  {{
    "title": "제목",
    "content": "내용 요약 (100-200자)",
    "source": "출처명",
    "source_url": "URL",
    "date": "YYYY-MM-DD"
  }}
]
```

검색 결과를 바탕으로 실제 URL과 함께 JSON으로 반환해주세요.
"""
    else:
        prompt = f"""
## 검색 요청
{politician_name}({category_korean}) 관련 정보를 검색합니다.

{role_desc}

## 검색 조건
- 카테고리: {category_name} ({category_korean})
- 유형: {data_type.upper()}
- 개수: {count}개
- 기간: {date_start} ~ {date_end}

{search_instruction}

## 핵심 규칙
1. 웹검색으로 실제 기사/게시물을 찾으세요
2. 실제 URL 필수 포함
3. 검색 결과에 없는 정보 생성 금지

## JSON 출력 형식
```json
[
  {{
    "title": "제목 (20자 이내)",
    "content": "내용 (100-300자)",
    "source": "출처명",
    "source_url": "https://...",
    "date": "YYYY-MM-DD",
    "sentiment": "positive/negative/neutral"
  }}
]
```

{count}개의 {category_korean} 관련 데이터를 JSON으로 반환하세요.
"""
    return prompt


def call_perplexity(client, prompt, data_type):
    """Perplexity API 호출 (Sonar - 검색 내장)"""
    config = AI_CONFIGS["Perplexity"]

    # 공식 데이터는 프롬프트에서 도메인 필터 지시
    # Perplexity API는 search_domain_filter 대신 프롬프트로 제어
    messages = [{"role": "user", "content": prompt}]

    try:
        response = client.chat.completions.create(
            model=config['model'],
            messages=messages,
            max_tokens=8000
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"  ❌ Perplexity API 에러: {e}")
        return None


def call_claude_with_websearch(client, prompt):
    """Claude API 호출 (web_search tool 사용)"""
    config = AI_CONFIGS["Claude"]

    try:
        # beta 기능은 client.beta.messages.create() 사용
        response = client.beta.messages.create(
            model=config['model'],
            max_tokens=8000,
            betas=["web-search-2025-03-05"],
            tools=[
                {
                    "type": "web_search_20250305",
                    "name": "web_search",
                    "max_uses": 15
                }
            ],
            messages=[{"role": "user", "content": prompt}]
        )

        # 응답에서 텍스트 추출 (BetaTextBlock만)
        result_text = ""
        for block in response.content:
            block_type = type(block).__name__
            # BetaTextBlock에서만 텍스트 추출 (BetaWebSearchResultBlock 등 제외)
            if block_type == 'BetaTextBlock' and hasattr(block, 'text'):
                result_text += block.text

        if not result_text:
            print(f"    [DEBUG] 응답 블록: {[type(b).__name__ for b in response.content]}")

        return result_text if result_text else None
    except Exception as e:
        print(f"  ❌ Claude API 에러: {e}")
        return None


def call_gemini_with_search(client, prompt):
    """Gemini API 호출 (Google Search grounding) - 신규 SDK + URL 검증"""
    try:
        from google import genai
        from google.genai import types

        # Gemini 2.0+ google_search 도구 사용
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )

        if not response.text:
            return None

        # ✅ grounding_metadata 확인: 실제 검색한 URL 추출
        actual_urls = []
        if hasattr(response, 'grounding_metadata') and response.grounding_metadata:
            grounding = response.grounding_metadata
            if hasattr(grounding, 'grounding_chunks') and grounding.grounding_chunks:
                for chunk in grounding.grounding_chunks:
                    if hasattr(chunk, 'web') and hasattr(chunk.web, 'uri'):
                        actual_urls.append(chunk.web.uri)

            if actual_urls:
                print(f"    [Gemini] 실제 검색 URL: {len(actual_urls)}개")
            else:
                print(f"    [Gemini] ⚠️ grounding_chunks 없음 - 검색 미수행")

        # JSON 파싱 및 가짜 URL 필터링
        if actual_urls:
            try:
                items = json.loads(response.text)
                if isinstance(items, list):
                    verified_items = []
                    fake_count = 0
                    for item in items:
                        url = item.get('source_url', '')
                        # URL이 실제 검색 결과에 있는지 확인
                        if url and url in actual_urls:
                            verified_items.append(item)
                        else:
                            fake_count += 1
                            # 실제 URL로 교체 시도 (첫 번째 URL 사용)
                            if actual_urls:
                                item['source_url'] = actual_urls[0]
                                verified_items.append(item)

                    if fake_count > 0:
                        print(f"    [Gemini] 가짜 URL {fake_count}개 발견 → 실제 URL로 교체")

                    return json.dumps(verified_items, ensure_ascii=False)
            except json.JSONDecodeError:
                pass  # JSON 파싱 실패 시 원본 반환

        return response.text
    except Exception as e:
        print(f"  ❌ Gemini API 에러: {e}")
        # fallback 없이 에러 반환 (환각 방지)
        return None


def call_grok(client, prompt):
    """Grok API 호출 (X/Twitter 접근)"""
    config = AI_CONFIGS["Grok"]

    try:
        response = client.chat.completions.create(
            model=config['model'],
            messages=[{"role": "user", "content": prompt}],
            max_tokens=8000
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"  ❌ Grok API 에러: {e}")
        return None


def call_ai(ai_name, client, prompt, data_type="public"):
    """AI별 호출 통합 함수"""
    if ai_name == "Claude":
        return call_claude_with_websearch(client, prompt)
    elif ai_name == "Gemini":
        return call_gemini_with_search(client, prompt)
    elif ai_name == "Perplexity":
        return call_perplexity(client, prompt, data_type)
    elif ai_name == "Grok":
        return call_grok(client, prompt)
    return None


def build_search_prompt(ai_name, data_type, topic_mode, politician_full, item_keywords, remaining, year_hint="", extra_keyword=""):
    """AI별, 데이터타입별, 주제별 프롬프트 생성

    Args:
        topic_mode: 'negative' (부정), 'positive' (긍정), 'free' (자유)
    """

    # topic_mode별 지시문
    if topic_mode == 'negative':
        topic_instruction = """
🚨 **부정적 주제만 수집** 🚨
반드시 다음과 같은 부정적인 내용만 검색하세요:
- 논란, 비판, 의혹, 스캔들
- 실패, 실정, 무능
- 위법 행위, 윤리 위반
- 공약 불이행, 정책 실패
- 언론/시민 비판

긍정적 내용은 절대 포함하지 마세요!
"""
    elif topic_mode == 'positive':
        topic_instruction = """
✨ **긍정적 주제만 수집** ✨
반드시 다음과 같은 긍정적인 내용만 검색하세요:
- 성과, 업적, 수상
- 공약 이행, 정책 성공
- 법안 통과, 개혁 성과
- 표창, 긍정 평가
- 시민 만족도 상승

부정적 내용은 절대 포함하지 마세요!
"""
    else:  # free
        topic_instruction = """
🎲 **자유 주제 (긍정/부정 무관)** 🎲
긍정도 부정도 아닌 중립적 활동 포함:
- 의정 활동, 회의 참석
- 일반적인 발언, 공식 행사
- 긍정/부정 상관없이 검색 결과를 무작위로 수집

⚠️ 검색 결과를 랜덤하게 선택하세요!
"""

    if data_type == "official":
        if ai_name == "Claude":
            return f"""Search the web for: {politician_full} {item_keywords} {extra_keyword} {year_hint} 공식

웹 검색을 사용하여 {politician_full} 관련 공식 활동 정보를 찾아주세요.

검색 대상 (공식 활동):
- 국회 의정활동: 법안 발의, 국정감사, 위원회 활동
- 공식 발표: 기자회견, 성명서, 공약, 정책 발표
- 공적 기록: 경력, 학력, 수상, 임명

검색 조건:
- 기간: 2022년 1월 ~ 2026년 1월 (특히 {year_hint} 중심)
- 개수: {min(remaining, 5)}개
- 반드시 web_search 도구 사용

JSON 형식으로 응답:
[{{"title": "제목", "content": "내용 요약", "source": "출처", "source_url": "URL", "date": "2024-01-15"}}]

중요: 반드시 웹 검색을 실행하고 실제 검색 결과를 기반으로 응답하세요."""
        elif ai_name == "Gemini":
            return f"""{politician_full} {item_keywords} {extra_keyword} {year_hint}

위 키워드로 {politician_full} 관련 공식 활동 정보를 찾아주세요.

{topic_instruction}

검색 대상 (공식 활동):
- 국회 의정활동: 법안 발의, 국정감사, 위원회 활동
- 공식 발표: 기자회견, 성명서, 공약
- 공적 기록: 경력, 학력, 수상

검색 조건:
- 기간: 2022년 1월 ~ 2026년 1월 (특히 {year_hint} 중심)
- 개수: {min(remaining, 5)}개

JSON 형식으로 응답:
[{{"title": "제목", "content": "내용 요약", "source": "출처", "source_url": "URL", "date": "2024-01-15"}}]"""
    else:  # public
        if ai_name == "Claude":
            return f"""Search the web for: {politician_full} {item_keywords}

웹 검색을 사용하여 {politician_full} 관련 뉴스/언론 보도를 찾아주세요.

검색 필수 조건:
- 반드시 web_search 도구를 사용하여 실제 뉴스를 검색하세요
- 기간: 2024년 1월 ~ 2026년 1월 (최근 2년)
- 개수: {min(remaining, 5)}개
- 실제 존재하는 뉴스 URL만 포함

JSON 형식으로 응답:
[{{"title": "기사 제목", "content": "내용 요약 (100자 이내)", "source": "언론사명", "source_url": "실제 기사 URL", "date": "2024-06-15"}}]

중요: 반드시 웹 검색을 실행하고 실제 검색 결과를 기반으로 응답하세요."""
        elif ai_name == "Perplexity":
            # Perplexity: 국내외 뉴스/언론 전담! (SNS, X 금지)
            return f"""{politician_full} {item_keywords} 뉴스 검색

【Perplexity 담당: 국내외 뉴스/언론 전담!】

위 키워드로 {politician_full} 관련 뉴스/언론 보도를 찾아주세요.

{topic_instruction}

✅ 수집 대상 (국내외 뉴스/언론):
- 국내 신문: 조선일보, 중앙일보, 동아일보, 한겨레, 경향신문
- 방송사: KBS, MBC, SBS, JTBC, TV조선, MBN
- 통신사: 연합뉴스, 뉴시스, 뉴스1
- 경제지: 매일경제, 한국경제
- 외신: 로이터, AP, AFP, BBC, CNN, NHK 등 글로벌 매체

🚫 수집 금지:
- ❌ SNS (Facebook, Instagram, YouTube)
- ❌ X(트위터)
- ❌ 블로그, 카페, 위키

기간: 2024년 1월 ~ 2026년 1월
개수: {min(remaining, 5)}개

JSON 형식:
[{{"title": "제목", "content": "내용 요약", "source": "출처", "source_url": "URL", "date": "2024-06-15"}}]"""
        elif ai_name == "Gemini":
            # Gemini PUBLIC: 뉴스/X 제외 전부 (SNS, 위키, 블로그, 커뮤니티)
            return f"""{politician_full} {item_keywords} 검색

【Gemini 담당: 뉴스/X 제외 전부】

위 키워드로 {politician_full} 관련 콘텐츠를 찾아주세요.

{topic_instruction}

✅ 수집 대상:
- SNS: 유튜브(영상, 인터뷰), 인스타그램, 페이스북
- 위키피디아: 한글/영문 위키피디아
- 블로그/칼럼: 네이버 블로그, 브런치, 전문가 칼럼
- 커뮤니티: 나무위키, 네이버 카페, 클리앙

🚫 수집 금지:
- ❌ 뉴스/언론 (국내외 모두 → Perplexity 담당!)
- ❌ X(트위터) → Grok 담당!
- ❌ example.com 같은 가짜 URL 생성 금지!

기간: 2024년 1월 ~ 2026년 1월
개수: {min(remaining, 5)}개

JSON 형식:
[{{"title": "제목", "content": "내용 요약", "source": "출처명", "source_url": "실제 URL", "date": "2024-06-15"}}]

중요: 반드시 실제 검색 결과의 URL만 사용하세요!"""
        elif ai_name == "Grok":
            # Grok: X/트위터만! (뉴스, SNS 금지)
            return f"""다음 정치인에 대한 X(트위터) 게시물 {min(remaining, 5)}개를 JSON 배열로만 반환하세요.
설명 없이 JSON만 출력하세요.

{topic_instruction}

정치인: {politician_full}
키워드: {item_keywords}

JSON 형식:
```json
[
  {{"title": "트윗 요약", "content": "트윗 내용", "source": "X", "source_url": "X/@계정명", "date": "2024-06-15"}}
]
```

지금 바로 JSON 배열을 출력하세요:"""
    return None


def extract_url(item):
    """아이템에서 URL 추출 (타입 안전)"""
    url = item.get('source_url') or item.get('url') or ''
    if isinstance(url, list):
        return url[0] if url else ''
    elif not isinstance(url, str):
        return str(url) if url else ''
    return url


def collect_data_type(ai_name, client, politician_id, politician_full, category_name, data_type, topic_mode, target_count):
    """공식/공개 데이터 통합 수집 함수 (최대 5회 재시도)

    Args:
        politician_id: 정치인 ID (DB 중복 확인용)
        topic_mode: 'negative' (부정), 'positive' (긍정), 'free' (자유)
    """
    # ✅ V30 목표 수량 초과 방지: DB 확인 후 부족한 만큼만 수집
    try:
        # topic_mode를 DB sentiment로 변환
        db_sentiment = topic_mode_to_sentiment(topic_mode)

        existing = supabase.table(TABLE_COLLECTED_DATA)\
            .select('*', count='exact')\
            .eq('politician_id', politician_id)\
            .eq('category', category_name.lower())\
            .eq('data_type', data_type)\
            .eq('collector_ai', ai_name)\
            .eq('sentiment', db_sentiment)\
            .execute()

        existing_count = existing.count or 0

        if existing_count >= target_count:
            print(f"    ℹ️ 이미 {existing_count}개 수집 완료 (목표: {target_count}개) - 건너뜀")
            return []

        # 부족한 만큼만 수집
        actual_target = target_count - existing_count
        print(f"    📊 기존 {existing_count}개 / 목표 {target_count}개 → {actual_target}개 추가 수집")
    except Exception as e:
        print(f"    ⚠️ DB 체크 실패, 전체 수집 진행: {e}")
        actual_target = target_count

    MAX_RETRIES = 5
    collected = []
    collected_urls = set()

    category_items = CATEGORY_ITEMS.get(category_name, [])
    if not category_items:
        category_items = [(f"항목{i}", f"키워드{i}") for i in range(1, 11)]

    # 라운드 설정
    if data_type == "official":
        round_configs = [
            ("2024-2025년", "최신 활동"),
            ("2023년", "법안 발의"),
            ("2022-2023년", "공식 활동"),
            ("의정활동", "국회"),
            ("성과 실적", "발표"),
        ]
    else:
        round_configs = [("", ""), ("추가검색", "")]  # 공개는 2라운드

    retry_count = 0

    while len(collected) < actual_target and retry_count < MAX_RETRIES:
        if retry_count > 0:
            print(f"    🔄 재시도 {retry_count}/{MAX_RETRIES} (현재 {len(collected)}개 / 목표 {actual_target}개)")

        for round_num, (year_hint, extra_keyword) in enumerate(round_configs, 1):
            if len(collected) >= actual_target:
                break

            if retry_count == 0:
                print(f"    [라운드 {round_num}] 현재 {len(collected)}개 / 목표 {actual_target}개")

            for item_name, item_keywords in category_items:
                if len(collected) >= actual_target:
                    break

                remaining = actual_target - len(collected)

                # 프롬프트 생성
                prompt = build_search_prompt(ai_name, data_type, topic_mode, politician_full, item_keywords, remaining, year_hint, extra_keyword)
                if not prompt:
                    continue

                # AI 호출
                result = call_ai(ai_name, client, prompt, data_type)

                added = 0
                if result:
                    items = parse_json_response(result)
                    for item in items:
                        if len(collected) >= actual_target:
                            break  # 목표 도달 즉시 중단!
                        if isinstance(item, dict):
                            url = extract_url(item)
                            if url and url not in collected_urls:
                                item['data_type'] = data_type
                                item['collector_ai'] = ai_name
                                item['sentiment'] = topic_mode_to_sentiment(topic_mode)  # DB 저장용 변환
                                collected.append(item)
                                collected_urls.add(url)
                                added += 1

                if added > 0 and retry_count == 0:
                    print(f"      [{item_name[:8]}] +{added}개 → 누적 {len(collected)}개")
                time.sleep(0.3)

        # 목표 미달 시 재시도
        if len(collected) < actual_target:
            retry_count += 1
        else:
            break

    # 랜덤 샘플링 (통계적 무작위성 확보)
    if len(collected) > actual_target:
        return random.sample(collected, actual_target)
    else:
        return collected


def collect_with_ai(ai_name, politician_id, politician_name, category_idx, category_name, category_korean, test_mode=False):
    """특정 AI로 카테고리 데이터 수집 (리팩토링 버전)

    Args:
        test_mode: True이면 미니 테스트 (10개만 수집)
    """
    mode_label = "[TEST]" if test_mode else ""
    print(f"\n{'='*60}")
    print(f"{mode_label}[{ai_name}] {category_korean} ({category_name}) 수집 시작")
    print(f"{'='*60}")

    # 정치인 상세 정보 조회 (동명이인 구분용)
    pol_info = get_politician_info(politician_id)
    politician_full = pol_info['search_string'] if pol_info['search_string'] else politician_name

    # 테스트 모드면 TEST_SENTIMENT_DISTRIBUTION 사용
    sentiment_dist = TEST_SENTIMENT_DISTRIBUTION[ai_name] if test_mode else SENTIMENT_DISTRIBUTION[ai_name]
    client = init_ai_client(ai_name)

    all_items = []

    # 공식 데이터 수집 (20-20-60 균형)
    if sentiment_dist["official"]["negative"] + sentiment_dist["official"]["positive"] + sentiment_dist["official"]["free"] > 0:
        print(f"  📋 공식 데이터 수집 중...")

        # 부정 OFFICIAL
        if sentiment_dist["official"]["negative"] > 0:
            neg_count = sentiment_dist["official"]["negative"]
            print(f"    🚨 부정 {neg_count}개...")
            collected = collect_data_type(
                ai_name, client, politician_id, politician_full, category_name, "official", "negative", neg_count
            )
            all_items.extend(collected)
            print(f"    ✅ 부정 {len(collected)}개 수집 완료")

        # 긍정 OFFICIAL
        if sentiment_dist["official"]["positive"] > 0:
            pos_count = sentiment_dist["official"]["positive"]
            print(f"    ✨ 긍정 {pos_count}개...")
            collected = collect_data_type(
                ai_name, client, politician_id, politician_full, category_name, "official", "positive", pos_count
            )
            all_items.extend(collected)
            print(f"    ✅ 긍정 {len(collected)}개 수집 완료")

        # 자유 OFFICIAL
        if sentiment_dist["official"]["free"] > 0:
            free_count = sentiment_dist["official"]["free"]
            print(f"    🎲 자유 {free_count}개...")
            collected = collect_data_type(
                ai_name, client, politician_id, politician_full, category_name, "official", "free", free_count
            )
            all_items.extend(collected)
            print(f"    ✅ 자유 {len(collected)}개 수집 완료")

    # 공개 데이터 수집 (20-20-60 균형)
    if sentiment_dist["public"]["negative"] + sentiment_dist["public"]["positive"] + sentiment_dist["public"]["free"] > 0:
        print(f"  📰 공개 데이터 수집 중...")

        # 부정 PUBLIC
        if sentiment_dist["public"]["negative"] > 0:
            neg_count = sentiment_dist["public"]["negative"]
            print(f"    🚨 부정 {neg_count}개...")
            collected = collect_data_type(
                ai_name, client, politician_id, politician_full, category_name, "public", "negative", neg_count
            )
            all_items.extend(collected)
            print(f"    ✅ 부정 {len(collected)}개 수집 완료")

        # 긍정 PUBLIC
        if sentiment_dist["public"]["positive"] > 0:
            pos_count = sentiment_dist["public"]["positive"]
            print(f"    ✨ 긍정 {pos_count}개...")
            collected = collect_data_type(
                ai_name, client, politician_id, politician_full, category_name, "public", "positive", pos_count
            )
            all_items.extend(collected)
            print(f"    ✅ 긍정 {len(collected)}개 수집 완료")

        # 자유 PUBLIC
        if sentiment_dist["public"]["free"] > 0:
            free_count = sentiment_dist["public"]["free"]
            print(f"    🎲 자유 {free_count}개...")
            collected = collect_data_type(
                ai_name, client, politician_id, politician_full, category_name, "public", "free", free_count
            )
            all_items.extend(collected)
            print(f"    ✅ 자유 {len(collected)}개 수집 완료")

    # DB 저장
    saved_count = 0
    skipped_count = 0  # 중복 스킵 카운트

    for item in all_items:
        try:
            # 다양한 필드명 지원 (AI마다 응답 형식이 다를 수 있음)
            title = item.get('data_title') or item.get('title') or item.get('item') or ''
            content = item.get('data_content') or item.get('description') or item.get('content') or item.get('item') or ''
            source_url = item.get('source_url') or item.get('url') or item.get('link') or ''
            # URL 타입 체크 (리스트인 경우 첫 번째 요소 사용)
            if isinstance(source_url, list):
                source_url = source_url[0] if source_url else ''
            elif not isinstance(source_url, str):
                source_url = str(source_url) if source_url else ''
            source_name = item.get('data_source') or item.get('source') or item.get('source_type') or ''
            raw_date = item.get('data_date') or item.get('date') or item.get('published_date')
            pub_date = normalize_date(raw_date)  # 날짜 형식 정규화
            sentiment = item.get('sentiment') or 'free'  # sentiment added by collect_data_type()
            # ✅ 'free' 값 그대로 유지 (DB에서 허용됨)

            # title이 없으면 content 앞부분 사용
            if not title and content:
                title = content[:50]

            collector = item.get('collector_ai', ai_name)

            # URL 정규화 (공백 제거)
            source_url_normalized = str(source_url).strip() if source_url else ''

            # ✅ V30 중복 제거: 같은 AI가 같은 URL을 이미 수집했는지 확인
            if source_url_normalized:  # URL이 있을 때만 체크
                try:
                    existing = supabase.table(TABLE_COLLECTED_DATA)\
                        .select('id', count='exact')\
                        .eq('politician_id', politician_id)\
                        .eq('collector_ai', collector)\
                        .eq('source_url', source_url_normalized)\
                        .execute()

                    if existing.count and existing.count > 0:
                        # 중복 발견 - skip
                        skipped_count += 1
                        continue
                except Exception as e:
                    # 중복 체크 실패해도 계속 진행 (저장 시도)
                    print(f"  ⚠️ 중복 체크 오류 ({source_url_normalized[:50]}...): {e}")
                    pass

            record = {
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category_name.lower(),
                'data_type': item.get('data_type', 'public'),
                'collector_ai': collector,
                'title': str(title)[:200],
                'content': str(content)[:2000],
                'source_url': source_url_normalized,  # 정규화된 URL 사용
                'source_name': str(source_name),
                'published_date': pub_date,
                'sentiment': sentiment,
                'is_verified': False
            }

            supabase.table(TABLE_COLLECTED_DATA).insert(record).execute()
            saved_count += 1
        except Exception as e:
            print(f"  ⚠️ 저장 실패: {e}")

    print(f"  💾 [{ai_name}] {category_korean}: {saved_count}개 저장, {skipped_count}개 중복 스킵")
    return saved_count


def parse_json_response(response_text):
    """JSON 응답 파싱"""
    if not response_text:
        return []

    try:
        # JSON 블록 추출
        json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # JSON 직접 찾기 - 객체({}) 또는 배열([])
            obj_start = response_text.find('{')
            arr_start = response_text.find('[')

            if arr_start >= 0 and (obj_start < 0 or arr_start < obj_start):
                # 배열이 먼저 나옴
                start = arr_start
                end = response_text.rfind(']') + 1
            elif obj_start >= 0:
                # 객체가 먼저 나옴
                start = obj_start
                end = response_text.rfind('}') + 1
            else:
                return []

            if start >= 0 and end > start:
                json_str = response_text[start:end]
            else:
                return []

        # JSON 파싱
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError:
            # json_repair 시도
            from json_repair import repair_json
            repaired = repair_json(json_str)
            data = json.loads(repaired)

        if isinstance(data, dict) and 'items' in data:
            return data['items']
        elif isinstance(data, list):
            return data
        else:
            return []

    except Exception as e:
        print(f"  ⚠️ JSON 파싱 에러: {e}")
        return []


def collect_all_for_politician(politician_id, politician_name, target_ai=None, target_category=None, parallel=False, test_mode=False):
    """정치인 전체 데이터 수집

    Args:
        test_mode: True이면 미니 테스트 모드 (카테고리당 10개, 3개 AI 병렬)
    """
    mode_str = "[미니 테스트]" if test_mode else ""
    target_per_cat = 10 if test_mode else 100

    print(f"\n{'#'*60}")
    print(f"# V30 {mode_str}수집 시작: {politician_name} ({politician_id})")
    print(f"# 배분: Gemini 90%, Grok 10% (Perplexity 제거, Claude/ChatGPT 수집 제외)")
    print(f"# 실행: Grok 우선 → Gemini 나중 (Grok 중복 스킵 방지)")
    print(f"# 목표: 카테고리당 {target_per_cat}개")
    print(f"{'#'*60}")

    # 수집 AI 목록 (비용 최적화: Claude/ChatGPT 제외, Perplexity 제거)
    # Grok 우선 실행 (양이 적어 먼저 수집 완료 후 Gemini 실행)
    collect_ais = ["Grok", "Gemini"]  # Perplexity 제거 (401 에러 + 비용 폭탄)
    if target_ai:
        collect_ais = [target_ai]

    # 카테고리 목록
    categories = CATEGORIES
    if target_category:
        categories = [CATEGORIES[target_category - 1]]

    total_saved = 0
    start_time = time.time()

    # 테스트 모드 또는 parallel 플래그면 하이브리드 실행
    if parallel or test_mode:
        # ===== V30 하이브리드 실행: Grok 우선 → Gemini 나중 =====
        # 이유: Grok이 "이미 수집 완료" 판단으로 건너뛰는 문제 방지
        print(f"\n[순차 실행] Grok 우선 → Gemini 나중 (총 {len(collect_ais)} AIs × {len(categories)} 카테고리)")

        failed_tasks = []

        # ===== 1단계: Grok 먼저 실행 (모든 카테고리) =====
        for ai_name in collect_ais:
            print(f"\n{'='*60}")
            print(f"[{ai_name}] 수집 시작")
            print(f"{'='*60}")

            for cat_idx, (cat_name, cat_korean) in enumerate(categories):
                try:
                    count = collect_with_ai(
                        ai_name, politician_id, politician_name,
                        cat_idx, cat_name, cat_korean, test_mode
                    )
                    total_saved += count
                except Exception as e:
                    print(f"  ❌ [{ai_name}] {cat_korean} 1차 실패: {e}")
                    failed_tasks.append({
                        'ai_name': ai_name,
                        'cat_idx': cat_idx,
                        'cat_name': cat_name,
                        'cat_korean': cat_korean
                    })

            print(f"\n✅ [{ai_name}] 수집 완료")

            # AI 간 간격
            if ai_name != collect_ais[-1]:
                time.sleep(2)

        # ===== 2차: 실패한 작업만 순차 재시도 (안전) =====
        if failed_tasks:
            print(f"\n{'='*60}")
            print(f"🔄 실패한 작업 재시도 시작: {len(failed_tasks)}개")
            print(f"{'='*60}")

            for attempt in range(1, 4):  # 최대 3회 재시도
                if not failed_tasks:
                    break

                print(f"\n[재시도 {attempt}/3] {len(failed_tasks)}개 작업")
                retry_success = []

                for task in failed_tasks:
                    try:
                        # Exponential backoff
                        backoff_time = 2 ** (attempt - 1)
                        if backoff_time > 1:
                            time.sleep(backoff_time)

                        count = collect_with_ai(
                            task['ai_name'], politician_id, politician_name,
                            task['cat_idx'], task['cat_name'], task['cat_korean'], test_mode
                        )
                        total_saved += count
                        retry_success.append(task)
                        print(f"  ✅ [{task['ai_name']}] {task['cat_korean']} 재시도 성공 (+{count}개)")
                    except Exception as e:
                        print(f"  ⚠️ [{task['ai_name']}] {task['cat_korean']} 재시도 {attempt} 실패: {e}")

                # 성공한 작업 제거
                failed_tasks = [t for t in failed_tasks if t not in retry_success]

            # ===== 3차: 최종 실패 로깅 =====
            if failed_tasks:
                print(f"\n{'='*60}")
                print(f"❌ 최종 실패 작업: {len(failed_tasks)}개")
                print(f"{'='*60}")
                for task in failed_tasks:
                    print(f"  - [{task['ai_name']}] {task['cat_korean']} ({task['cat_name']})")
                print(f"\n⚠️ 일부 카테고리 수집 실패. 재수집이 필요할 수 있습니다.")
    else:
        # 순차 수집
        for cat_idx, (cat_name, cat_korean) in enumerate(categories):
            for ai_name in collect_ais:
                count = collect_with_ai(
                    ai_name, politician_id, politician_name,
                    cat_idx, cat_name, cat_korean, test_mode
                )
                total_saved += count
                time.sleep(1)  # API 레이트 리밋 방지

    elapsed = time.time() - start_time

    print(f"\n{'='*60}")
    print(f"✅ V30 {mode_str}수집 완료: {politician_name}")
    print(f"   총 저장: {total_saved}개")
    print(f"   소요 시간: {elapsed:.1f}초 ({elapsed/60:.1f}분)")
    print(f"{'='*60}")

    # 테스트 모드면 검증 결과 출력
    if test_mode:
        verify_test_results(politician_id, politician_name, categories)

    return total_saved


def verify_test_results(politician_id, politician_name, categories):
    """테스트 결과 검증"""
    print(f"\n{'='*60}")
    print(f"📊 테스트 결과 검증: {politician_name}")
    print(f"{'='*60}")

    total_by_ai = {"Gemini": 0, "Grok": 0}
    total_by_type = {"official": 0, "public": 0}

    for cat_name, cat_korean in categories:
        # AI별 수집 개수 조회
        for ai_name in ["Gemini", "Grok"]:
            count = get_exact_count(TABLE_COLLECTED_DATA, {
                'politician_id': politician_id,
                'category': cat_name,
                'collector_ai': ai_name
            })
            total_by_ai[ai_name] += count

        # 데이터 타입별 조회
        for dtype in ["official", "public"]:
            count = get_exact_count(TABLE_COLLECTED_DATA, {
                'politician_id': politician_id,
                'category': cat_name,
                'data_type': dtype
            })
            total_by_type[dtype] += count

    # 결과 출력
    print(f"\n📈 AI별 수집 결과:")
    total = sum(total_by_ai.values())
    for ai_name, count in total_by_ai.items():
        pct = (count / total * 100) if total > 0 else 0
        expected = TEST_DISTRIBUTION[ai_name]['total'] * len(categories)
        status = "✅" if count >= expected * 0.8 else "⚠️"
        print(f"   {status} {ai_name}: {count}개 ({pct:.1f}%) - 목표 {expected}개")

    print(f"\n📈 데이터 타입별:")
    for dtype, count in total_by_type.items():
        print(f"   • {dtype.upper()}: {count}개")

    print(f"\n📈 총합: {total}개")

    # 비율 검증
    if total > 0:
        gemini_pct = total_by_ai["Gemini"] / total * 100
        perplexity_pct = total_by_ai["Perplexity"] / total * 100
        grok_pct = total_by_ai["Grok"] / total * 100

        print(f"\n🎯 비율 검증 (목표: 60-30-10):")
        print(f"   Gemini: {gemini_pct:.1f}% {'✅' if 50 <= gemini_pct <= 70 else '⚠️'}")
        print(f"   Perplexity: {perplexity_pct:.1f}% {'✅' if 20 <= perplexity_pct <= 40 else '⚠️'}")
        print(f"   Grok: {grok_pct:.1f}% {'✅' if 5 <= grok_pct <= 20 else '⚠️'}")

    print(f"{'='*60}")


def get_all_politicians():
    """DB에서 전체 정치인 목록 가져오기"""
    try:
        result = supabase.table('politicians').select('id, name').execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"❌ 정치인 목록 조회 실패: {e}")
        return []


def collect_all_politicians(target_ai=None, target_category=None, parallel=False, test_mode=False):
    """전체 정치인 일괄 수집"""
    politicians = get_all_politicians()

    if not politicians:
        print("❌ 수집할 정치인이 없습니다.")
        return

    mode_str = "[미니 테스트]" if test_mode else ""
    print(f"\n{'#'*60}")
    print(f"# V30 {mode_str}전체 정치인 일괄 수집")
    print(f"# 총 {len(politicians)}명")
    print(f"{'#'*60}\n")

    success_count = 0
    fail_count = 0

    for i, p in enumerate(politicians, 1):
        pid = p['id']
        pname = p['name']

        print(f"\n[{i}/{len(politicians)}] {pname} ({pid}) 수집 시작...")

        try:
            saved = collect_all_for_politician(
                pid, pname,
                target_ai=target_ai,
                target_category=target_category,
                parallel=parallel,
                test_mode=test_mode
            )
            success_count += 1
            print(f"✅ {pname}: {saved}개 수집 완료")
        except Exception as e:
            fail_count += 1
            print(f"❌ {pname}: 수집 실패 - {e}")

        # 정치인 간 간격 (API 레이트 리밋 방지)
        if i < len(politicians):
            time.sleep(2 if not test_mode else 1)

    print(f"\n{'#'*60}")
    print(f"# {mode_str}전체 수집 완료")
    print(f"# 성공: {success_count}명, 실패: {fail_count}명")
    print(f"{'#'*60}")


def main():
    parser = argparse.ArgumentParser(description='V30 3개 AI 분담 웹검색 수집 (비용 최적화)')
    parser.add_argument('--politician_id', help='정치인 ID (--all과 함께 사용 불가)')
    parser.add_argument('--politician_name', help='정치인 이름 (--all과 함께 사용 불가)')
    parser.add_argument('--all', action='store_true', help='전체 정치인 일괄 수집')
    parser.add_argument('--ai', choices=['Gemini', 'Perplexity', 'Grok'], help='특정 AI만 실행 (Claude/ChatGPT 제외)')
    parser.add_argument('--category', type=int, choices=range(1, 11), help='특정 카테고리만 (1-10)')
    parser.add_argument('--parallel', action='store_true', help='병렬 실행')
    parser.add_argument('--test', action='store_true', help='미니 테스트 모드 (카테고리당 10개, 3개 AI 병렬, 자동 검증)')
    parser.add_argument('--skip-validation', action='store_true', help='수집 후 자동 검증 건너뛰기')

    args = parser.parse_args()

    # 테스트 모드 안내
    if args.test:
        print(f"\n{'='*60}")
        print(f"🧪 미니 테스트 모드 활성화")
        print(f"   • 카테고리당 10개 (전체 100개 대신)")
        print(f"   • 3개 AI 병렬 실행 (Gemini 6 + Perplexity 3 + Grok 1)")
        print(f"   • 예상 소요 시간: 3-5분 (1개 카테고리)")
        print(f"   • 완료 후 자동 검증")
        print(f"{'='*60}\n")

    # 전체 정치인 일괄 수집
    if args.all:
        collect_all_politicians(
            target_ai=args.ai,
            target_category=args.category,
            parallel=args.parallel or args.test,
            test_mode=args.test
        )
        return

    # 개별 정치인 수집 (기존 방식)
    if not args.politician_id or not args.politician_name:
        print("❌ --politician_id와 --politician_name을 지정하거나, --all을 사용하세요.")
        print("")
        print("📋 사용 예시:")
        print("   # 미니 테스트 (카테고리 1개, 3-5분)")
        print("   python collect_v30.py --politician_id=xxx --politician_name=\"홍길동\" --test --category=1")
        print("")
        print("   # 전체 수집 (병렬)")
        print("   python collect_v30.py --politician_id=xxx --politician_name=\"홍길동\" --parallel")
        print("")
        print("   # 전체 정치인 일괄")
        print("   python collect_v30.py --all --parallel")
        return

    # 정치인 확인
    exists, db_name = check_politician_exists(args.politician_id)
    if not exists:
        print(f"❌ 정치인 ID '{args.politician_id}'가 politicians 테이블에 없습니다.")
        print("   먼저 정치인을 등록하세요.")
        return

    # 수집 실행
    collect_all_for_politician(
        args.politician_id,
        args.politician_name,
        target_ai=args.ai,
        target_category=args.category,
        parallel=args.parallel or args.test,
        test_mode=args.test
    )

    # 자동 검증 트리거 (옵션 1: 메인 에이전트 방식)
    if not args.skip_validation:
        print(f"\n{'='*60}")
        print("🔍 자동 검증 시작...")
        print("수집된 데이터의 유효성을 검사합니다.")
        print(f"{'='*60}\n")

        try:
            # validate_v30.py의 run_validation_pipeline 함수 임포트
            import sys
            import os
            script_dir = os.path.dirname(os.path.abspath(__file__))
            sys.path.insert(0, script_dir)

            from validate_v30 import run_validation_pipeline

            # 검증 실행
            result = run_validation_pipeline(
                politician_id=args.politician_id,
                politician_name=args.politician_name,
                mode='all',
                ai_name=args.ai
            )

            print(f"\n{'='*60}")
            print("✅ 자동 검증 완료")
            print(f"   • 유효: {result.get('valid', 0)}개")
            print(f"   • 무효: {result.get('invalid', 0)}개")
            print(f"{'='*60}\n")

        except Exception as e:
            print(f"\n⚠️ 자동 검증 실패: {e}")
            print("수동으로 검증 스크립트를 실행하세요:")
            print(f"python validate_v30.py --politician_id={args.politician_id} --politician_name=\"{args.politician_name}\"")


if __name__ == "__main__":
    main()
