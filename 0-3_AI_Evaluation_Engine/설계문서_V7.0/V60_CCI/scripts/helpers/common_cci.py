# -*- coding: utf-8 -*-
"""
V60 CCI 공통 모듈

DB 연결, 상수, 유틸리티 함수를 중앙 관리한다.
모든 V60 스크립트는 이 모듈을 import하여 사용한다.
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정 (Windows)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
V60_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = V60_DIR / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH, override=True)
else:
    load_dotenv(override=True)

# ═══════════════════════════════════════════
# Supabase 클라이언트
# ═══════════════════════════════════════════
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# ═══════════════════════════════════════════
# 상수
# ═══════════════════════════════════════════

# GPI 카테고리 (V40과 동일, 10개)
GPI_CATEGORIES = [
    'expertise', 'leadership', 'vision',
    'integrity', 'ethics', 'accountability', 'transparency',
    'communication', 'responsiveness', 'publicinterest'
]

# Alpha 카테고리 (6개)
ALPHA1_CATEGORIES = ['opinion', 'media', 'risk']
ALPHA2_CATEGORIES = ['party', 'candidate', 'regional']
ALPHA_CATEGORIES = ALPHA1_CATEGORIES + ALPHA2_CATEGORIES

# Alpha 카테고리 한글 매핑
ALPHA_CATEGORY_NAMES = {
    'opinion': '여론동향',
    'media': '이미지·내러티브',
    'risk': '리스크',
    'party': '정당경쟁력',
    'candidate': '후보자경쟁력',
    'regional': '지역기반',
}

# Alpha 타입 매핑
ALPHA_TYPE_MAP = {
    'opinion': 'alpha1', 'media': 'alpha1', 'risk': 'alpha1',
    'party': 'alpha2', 'candidate': 'alpha2', 'regional': 'alpha2',
}

# 등급 체계
VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4', 'X']

RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8,
    'X': 0,
}

# 점수 계산 상수
PRIOR = 6.0
COEFFICIENT = 0.5

# 수집 기준 (V40과 동일: 100개 기본 + 20개 버퍼 = 120개)
MIN_PER_CATEGORY = 100
MAX_PER_CATEGORY = 120
BUFFER_TARGET = 120     # 버퍼 포함 수집 목표

# 기간 제한
OFFICIAL_YEARS = 4
PUBLIC_YEARS = 2

# CCI 가중치
CCI_WEIGHT_GPI = 0.4
CCI_WEIGHT_ALPHA1 = 0.3
CCI_WEIGHT_ALPHA2 = 0.3

# 재수집 포기 규칙
MAX_ADJUSTMENT_ROUNDS = 4
GIVE_UP_THRESHOLD = 25   # 50% of MIN_PER_CATEGORY

# 테이블명
TABLE_POLITICIANS = 'politicians'
TABLE_COMPETITOR_GROUPS = 'competitor_groups_v60'
TABLE_COLLECTED_GPI = 'collected_data_v60'
TABLE_EVALUATIONS_GPI = 'evaluations_v60'
TABLE_FINAL_SCORES_GPI = 'ai_final_scores_v60'
TABLE_COLLECTED_ALPHA = 'collected_alpha_v60'
TABLE_EVALUATIONS_ALPHA = 'evaluations_alpha_v60'
TABLE_ALPHA_SCORES = 'alpha_scores_v60'
TABLE_CCI_SCORES = 'cci_scores_v60'

# 등급 기준 (10단계, GPI)
GRADE_THRESHOLDS = [
    (920, 'M', 'Mugunghwa'),
    (840, 'D', 'Diamond'),
    (760, 'E', 'Emerald'),
    (680, 'P', 'Platinum'),
    (600, 'G', 'Gold'),
    (520, 'S', 'Silver'),
    (440, 'B', 'Bronze'),
    (360, 'I', 'Iron'),
    (280, 'Tn', 'Tin'),
    (200, 'L', 'Lead'),
]


# ═══════════════════════════════════════════
# 유틸리티 함수
# ═══════════════════════════════════════════

def get_grade(score: int) -> tuple:
    """점수 → (등급코드, 등급명) 반환"""
    for threshold, code, name in GRADE_THRESHOLDS:
        if score >= threshold:
            return code, name
    return 'L', 'Lead'


def calculate_category_score(avg_score: float) -> float:
    """카테고리 점수 계산: (PRIOR + avg_score × COEFFICIENT) × 100 → 200~1000점"""
    raw = (PRIOR + avg_score * COEFFICIENT) * 100
    return max(200.0, min(1000.0, raw))


def get_period_limit(source_type: str) -> datetime:
    """소스 타입에 따른 기간 제한 시작일 반환"""
    now = datetime.now()
    if source_type == 'OFFICIAL':
        return now - timedelta(days=365 * OFFICIAL_YEARS)
    else:  # PUBLIC
        return now - timedelta(days=365 * PUBLIC_YEARS)


def fetch_all_rows(table: str, filters: dict, select: str = '*') -> list:
    """Supabase 1000행 제한 우회 — pagination으로 전체 데이터 조회

    Args:
        table: 테이블명
        filters: {column: value} 필터 조건
        select: SELECT 컬럼

    Returns:
        전체 행 리스트
    """
    all_rows = []
    offset = 0
    page_size = 1000

    while True:
        query = supabase.table(table).select(select)
        for col, val in filters.items():
            query = query.eq(col, val)
        result = query.range(offset, offset + page_size - 1).execute()

        if not result.data:
            break

        all_rows.extend(result.data)

        if len(result.data) < page_size:
            break

        offset += page_size

    return all_rows


def get_politician_info(politician_id: str) -> dict:
    """정치인 기본 정보 조회"""
    result = supabase.table(TABLE_POLITICIANS).select('*').eq('id', politician_id).execute()
    if result.data:
        return result.data[0]
    return {}


def get_competitor_group(group_id: str = None, politician_id: str = None) -> list:
    """경쟁자 그룹 조회

    Args:
        group_id: 그룹 UUID (직접 지정)
        politician_id: 정치인 ID (해당 정치인이 속한 그룹 조회)

    Returns:
        그룹 정보 리스트
    """
    if group_id:
        result = supabase.table(TABLE_COMPETITOR_GROUPS).select('*').eq('id', group_id).execute()
        return result.data

    if politician_id:
        # politician_ids 배열에 해당 ID가 포함된 그룹 조회
        result = supabase.table(TABLE_COMPETITOR_GROUPS).select('*').contains(
            'politician_ids', [politician_id]
        ).execute()
        return result.data

    return []


def load_instruction(category: str) -> str:
    """Alpha 평가 인스트럭션 파일 로드

    Args:
        category: Alpha 카테고리명 (opinion, media, risk, party, candidate, regional)

    Returns:
        인스트럭션 내용 문자열
    """
    alpha_type = ALPHA_TYPE_MAP.get(category, 'alpha1')
    prefix = 'a1' if alpha_type == 'alpha1' else 'a2'

    inst_path = V60_DIR / 'instructions' / f'{prefix}_{category}_eval.md'
    if inst_path.exists():
        return inst_path.read_text(encoding='utf-8')
    return ''


def print_status(msg: str, level: str = 'info'):
    """상태 메시지 출력"""
    icons = {'info': 'ℹ️', 'ok': '✅', 'warn': '⚠️', 'error': '🚨', 'progress': '🔄'}
    icon = icons.get(level, 'ℹ️')
    print(f"{icon} {msg}")
