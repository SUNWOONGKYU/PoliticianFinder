# -*- coding: utf-8 -*-
"""
V40 평가보고서 생성 스크립트 (V41 통합판)

V41 가이드 기준:
- Type A: 요약본 (공개용, 3섹션, ~100줄)
- Type B: 상세본 (당사자 전용, 8섹션, ~790줄)
- 핵심 철학: "조언하지 않는다. 증명할 뿐이다."
- 금지: 전략 제언, 개선 방향, 권고 문구 일체

사용법:
    # Type A 요약본 생성
    python generate_report_v40.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=A

    # Type B 상세본 생성
    python generate_report_v40.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=B

    # A+B 동시 생성
    python generate_report_v40.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=AB
"""

import os
import sys
import io
import re
import json
import argparse
import statistics
from pathlib import Path
from datetime import datetime
from collections import defaultdict, Counter
import math

# UTF-8 출력 설정 (Windows)
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env 로드
V40_DIR = Path(__file__).resolve().parent.parent.parent
try:
    from dotenv import load_dotenv
    for env_path in [V40_DIR.parent.parent / '.env', V40_DIR.parent / '.env', V40_DIR / '.env']:
        if env_path.exists():
            load_dotenv(env_path, override=True)
            break
except ImportError:
    pass

from supabase import create_client
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# ============================================================
# 상수 정의
# ============================================================

CATEGORIES = {
    'expertise':      '전문성',
    'leadership':     '리더십',
    'vision':         '비전',
    'integrity':      '청렴성',
    'ethics':         '윤리성',
    'accountability': '책임감',
    'transparency':   '투명성',
    'communication':  '소통능력',
    'responsiveness': '대응성',
    'publicinterest': '공익성',
}

GRADE_BOUNDARIES = [
    (920, 1000, 'M',  '최우수'),
    (840,  919, 'D',  '우수'),
    (760,  839, 'E',  '양호'),
    (680,  759, 'P',  '보통+'),
    (600,  679, 'G',  '보통'),
    (520,  599, 'S',  '보통-'),
    (440,  519, 'B',  '미흡'),
    (360,  439, 'I',  '부족'),
    (280,  359, 'Tn', '상당히 부족'),
    (200,  279, 'L',  '매우 부족'),
]

RATING_TO_VALUE = {
    '+4': 4, '+3': 3, '+2': 2, '+1': 1,
    '-1': -1, '-2': -2, '-3': -3, '-4': -4,
    'X': None,
}

# Big 4 (서울시장 유력 후보군 - 2026 서울시장 여론조사 지지율 상위 4인)
BIG4_IDS = {
    '박주민': '8c5dcc89',
    '정원오': '17270f25',
    '오세훈': '62e7b453',
    '조은희': 'd0a5d6e1',
}
BIG4_SELECTION_NOTE = "2026 서울시장 여론조사 지지율 상위 4인 (언론 보도 기준)"

EVAL_AIS = ['Claude', 'ChatGPT', 'Grok', 'Gemini']

# 한국어 불용어 (키워드 추출 시 제외) — 모든 정치인 기사에 공통으로 나오는 일반어
KR_STOPWORDS = {
    # 조사/접속사/어미류
    '있습니다', '없습니다', '합니다', '했습니다', '됩니다', '됐습니다',
    '있는', '없는', '하는', '하여', '으로', '이를', '위해', '있어',
    '하고', '하며', '라고', '이라고', '에서', '에게', '로서', '에도',
    '했다', '했고', '했으며', '하여서', '해서', '이고', '이며', '으며',
    '것으로', '것은', '것을', '것이', '있다', '없다', '한다', '된다', '이다',
    '하였다', '되었다', '하였고', '되었고', '관련해', '대하여',
    # 시간/정도 부사
    '이번', '지난', '올해', '작년', '최근', '현재', '앞으로', '이미',
    '이날', '당시', '이상', '이하', '같은', '다음', '이후', '이에',
    # 지나치게 일반적인 정치/행정 단어
    '관련', '대한', '통해', '따른', '대해', '등에', '관하', '해당', '내용',
    '결과', '활동', '제안', '참여', '추진', '진행', '실시', '운영',
    '지원', '강화', '개선', '확대', '마련', '위한', '관련된',
    '예산', '사업비', '사업', '행사', '회의', '참석', '발언', '언급',
    # 직함/기관
    '평가', '정치인', '의원', '후보', '시장', '국회', '위원회', '위원',
    '국민', '시민', '서울시', '서울', '구청', '구의회', '기자',
    '보도', '뉴스', '기사', '자료', '발표', '공식', '공개',
    # AI reasoning 템플릿 표현 (반복되는 틀)
    '긍정적', '부정적', '직접적', '전반적', '구체적', '기사는', '내용으로',
    '평가됨', '관련된', '관련하여', '의지를', '노력을', '기여를', '역할을',
    '수행하는', '보여주는', '나타내는', '증명하는', '확인되는',
    # 평가 카테고리명 (reasoning에 반복적으로 나옴 → 따로 분석 의미 없음)
    '전문성', '리더십', '투명성', '청렴성', '윤리성', '책임감', '공익성',
    '대응성', '소통능력', '소통', '비전을', '비전이', '비전과',
    # 직함 변형 (조사 붙은 버전)
    '구청장', '시의원', '구의원', '서울시장',
}

# 한국어 조사 제거 패턴 (긴 것부터 순서 중요)
# "전문성을" → "전문성", "정원오와" → "정원오" 등
KR_PARTICLE_ENDINGS = [
    '이라는', '라는', '으로서', '에서의', '이라고', '라고', '이지만',
    '이므로', '이라며', '라며', '으로는', '에서는', '에게는', '에서도',
    '에게도', '에서만', '으로도', '이라도', '라도', '이면서', '이기도',
    '과의', '와의', '과는', '와는', '과도', '와도',
    '에서', '에게', '으로', '에도', '에만', '에는', '에게',
    '이고', '이며', '이나', '이라', '이어',
    '이다', '이죠', '이니', '이면',
    '의를', '의가', '의는', '의도', '의에',
    '를', '을', '이', '가', '은', '는', '와', '과', '의', '도', '만', '에',
]


def strip_korean_particle(word):
    """한국어 단어 끝 조사 제거. 최소 2글자 이상 남겨야 함."""
    for p in KR_PARTICLE_ENDINGS:  # 이미 긴 것부터 정렬됨
        if word.endswith(p) and len(word) - len(p) >= 2:
            return word[:-len(p)]
    return word


# ============================================================
# 유틸리티 함수
# ============================================================

def get_grade(score):
    """점수 → (등급 코드, 등급명) 반환"""
    for lo, hi, code, name in GRADE_BOUNDARIES:
        if lo <= score <= hi:
            return code, name
    return 'L', '매우 부족'


def get_grade_str(score):
    """점수 → '등급코드 (등급명)' 문자열 반환"""
    code, name = get_grade(score)
    return f"{code} ({name})"


def ascii_bar(score, max_score=100, width=10):
    """ASCII 막대 차트: 1칸 = max_score/width 점, 최대 width칸"""
    filled = max(0, min(int(score / max_score * width), width))
    return '█' * filled + '░' * (width - filled)


def extract_keywords(texts, top_n=30, min_len=2, extra_stopwords=None):
    """한국어 키워드 빈도 추출 — 의미있는 단어 위주

    전략:
    1. 조사 제거 후 정규화 ("전문성을" → "전문성")
    2. 3글자 이상 결과만 집계
    3. 불용어 + extra_stopwords 제거 (정치인 이름, 동적 불용어)
    4. 인접 2단어 합성어 추출 ("도시 재생" → "도시재생")

    Args:
        extra_stopwords: set — 정치인 이름 등 동적으로 추가할 불용어

    Returns: [(keyword, count), ...] (빈도 순 정렬)
    """
    stopwords = KR_STOPWORDS | (extra_stopwords or set())
    word_pattern   = re.compile(r'[가-힣]{2,}')
    bigram_pattern = re.compile(r'([가-힣]{2,})\s+([가-힣]{2,})')

    word_counter = Counter()

    for text in texts:
        if not text:
            continue
        t = str(text)

        # ① 단일 단어: 조사 제거 후 3글자 이상만
        for raw in word_pattern.findall(t):
            w = strip_korean_particle(raw)
            if len(w) >= 3 and w not in stopwords:
                word_counter[w] += 1

        # ② 인접 2단어 합성 ("청년 창업" → "청년창업")
        for m in bigram_pattern.finditer(t):
            w1 = strip_korean_particle(m.group(1))
            w2 = strip_korean_particle(m.group(2))
            if (w1 not in stopwords and w2 not in stopwords
                    and len(w1) >= 2 and len(w2) >= 2):
                bigram = w1 + w2
                if len(bigram) >= 4:
                    word_counter[bigram] += 1

    return word_counter.most_common(top_n)


def generate_keyword_svg(overall_kw, pos_kw_set, neg_kw_set,
                         politician_name, max_keywords=50,
                         width=1000, height=680):
    """키워드 버블 차트 SVG 생성

    - 버블 크기 = 빈도 (클수록 많이 나온 키워드)
    - 파란색 = 긍정(+3/+4) 평가에서 주로 나온 키워드
    - 빨간색 = 부정(-3/-4) 평가에서 주로 나온 키워드
    - 보라색 = 긍정+부정 모두 등장
    - 회색   = 중립

    Returns: SVG 문자열 또는 None
    """
    if not overall_kw:
        return None

    keywords = overall_kw[:max_keywords]
    if not keywords:
        return None

    max_count = keywords[0][1]
    min_count = keywords[-1][1]

    def scale_radius(count):
        if max_count == min_count:
            return 40
        ratio = (count - min_count) / (max_count - min_count)
        return int(18 + ratio * 62)  # 18~80px

    def get_color(kw):
        in_pos = kw in pos_kw_set
        in_neg = kw in neg_kw_set
        if in_pos and in_neg:
            return '#8b5cf6', 'rgba(139,92,246,0.15)'   # purple
        elif in_pos:
            return '#3b82f6', 'rgba(59,130,246,0.15)'   # blue
        elif in_neg:
            return '#ef4444', 'rgba(239,68,68,0.15)'    # red
        else:
            return '#6b7280', 'rgba(107,114,128,0.15)'  # gray

    circles = []
    for kw, cnt in keywords:
        fill, glow = get_color(kw)
        circles.append({
            'kw': kw, 'cnt': cnt,
            'r': scale_radius(cnt),
            'fill': fill, 'glow': glow,
        })

    # 나선형 배치 알고리즘 (크기 순서대로 중앙→외곽)
    placed = []  # list of (cx, cy, r)
    cx_center = width // 2
    cy_center = (height - 80) // 2 + 60  # 타이틀 공간 확보

    for circle in circles:
        r = circle['r']
        placed_ok = False

        # 나선형으로 위치 탐색
        for step in range(800):
            angle = step * 0.45
            dist = step * 2.2

            cx = int(cx_center + dist * math.cos(angle))
            cy = int(cy_center + dist * math.sin(angle))

            # 경계 체크
            margin = 15
            if cx - r < margin or cx + r > width - margin:
                continue
            if cy - r < 55 or cy + r > height - margin:
                continue

            # 충돌 체크
            collision = False
            for px, py, pr in placed:
                if math.sqrt((cx - px)**2 + (cy - py)**2) < r + pr + 4:
                    collision = True
                    break

            if not collision:
                circle['cx'] = cx
                circle['cy'] = cy
                placed.append((cx, cy, r))
                placed_ok = True
                break

        if not placed_ok:
            # 배치 실패 → 오른쪽 하단
            circle['cx'] = width - r - 30
            circle['cy'] = height - r - 90
            placed.append((circle['cx'], circle['cy'], r))

    # SVG 생성
    svg_height = height + 60  # 범례 공간
    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{svg_height}" viewBox="0 0 {width} {svg_height}">')
    svg.append(f'<rect width="{width}" height="{svg_height}" fill="#0f172a" rx="12"/>')

    # 배경 그리드 (장식)
    for gx in range(0, width, 80):
        svg.append(f'<line x1="{gx}" y1="0" x2="{gx}" y2="{svg_height}" stroke="#1e293b" stroke-width="1"/>')
    for gy in range(0, svg_height, 80):
        svg.append(f'<line x1="0" y1="{gy}" x2="{width}" y2="{gy}" stroke="#1e293b" stroke-width="1"/>')

    # 타이틀
    svg.append(f'<text x="{width//2}" y="38" text-anchor="middle" font-family="\'Apple SD Gothic Neo\', \'Malgun Gothic\', sans-serif" font-size="20" font-weight="bold" fill="#f1f5f9">{politician_name} 키워드 지도</text>')
    svg.append(f'<text x="{width//2}" y="56" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748b">전체 {sum(c[1] for c in keywords):,}회 / 상위 {len(keywords)}개 키워드 · 버블 크기 = 빈도</text>')

    # 버블 그리기
    for circle in circles:
        if 'cx' not in circle:
            continue
        cx, cy, r = circle['cx'], circle['cy'], circle['r']
        fill = circle['fill']
        kw = circle['kw']
        cnt = circle['cnt']
        font_size = max(9, min(20, int(r * 0.38)))
        cnt_font = max(7, font_size - 4)

        # 그림자 효과 (큰 버블만)
        if r > 35:
            svg.append(f'<circle cx="{cx+2}" cy="{cy+2}" r="{r}" fill="rgba(0,0,0,0.4)"/>')

        # 메인 버블
        opacity = min(1.0, 0.6 + 0.4 * (r - 18) / 62)
        svg.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" opacity="{opacity:.2f}"/>')

        # 하이라이트 (광택 효과)
        svg.append(f'<circle cx="{cx - int(r*0.3)}" cy="{cy - int(r*0.3)}" r="{int(r*0.35)}" fill="rgba(255,255,255,0.15)"/>')

        # 키워드 텍스트
        svg.append(
            f'<text x="{cx}" y="{cy}" text-anchor="middle" dominant-baseline="middle" '
            f'font-family="\'Apple SD Gothic Neo\', \'Malgun Gothic\', sans-serif" '
            f'font-size="{font_size}" font-weight="bold" fill="white">{kw}</text>'
        )

        # 빈도 숫자 (버블이 충분히 클 때만)
        if r >= 28:
            svg.append(
                f'<text x="{cx}" y="{cy + font_size + 1}" text-anchor="middle" '
                f'font-family="sans-serif" font-size="{cnt_font}" fill="rgba(255,255,255,0.65)">{cnt}</text>'
            )

    # 범례
    legend_y = svg_height - 28
    legend_items = [
        ('#3b82f6', '긍정 연관'),
        ('#ef4444', '부정 연관'),
        ('#8b5cf6', '긍정+부정'),
        ('#6b7280', '중립'),
    ]
    lx = 30
    for color, label in legend_items:
        svg.append(f'<circle cx="{lx+10}" cy="{legend_y}" r="9" fill="{color}"/>')
        svg.append(f'<text x="{lx+26}" y="{legend_y+4}" font-family="sans-serif" font-size="13" fill="#94a3b8">{label}</text>')
        lx += 120

    svg.append('</svg>')
    return '\n'.join(svg)


# ============================================================
# DB 조회 함수
# ============================================================

def get_final_scores(politician_id):
    """ai_final_scores_v40 테이블에서 최종 점수 조회"""
    result = supabase.table('ai_final_scores_v40') \
        .select('*') \
        .eq('politician_id', politician_id) \
        .execute()
    if not result.data:
        raise ValueError(f"최종 점수 없음: politician_id={politician_id}")
    return result.data[0]


def get_all_evaluations(politician_id, include_reasoning=False):
    """evaluations_v40 테이블 전체 조회 (pagination)"""
    fields = 'evaluator_ai, category, rating'
    if include_reasoning:
        fields += ', reasoning'
    all_data, offset = [], 0
    while True:
        result = supabase.table('evaluations_v40') \
            .select(fields) \
            .eq('politician_id', politician_id) \
            .range(offset, offset + 999) \
            .execute()
        if not result.data:
            break
        all_data.extend(result.data)
        if len(result.data) < 1000:
            break
        offset += 1000
    return all_data


def get_collected_data(politician_id, include_text=False):
    """collected_data_v40 테이블 전체 조회 (pagination)"""
    fields = 'id, category, data_type, collector_ai'
    if include_text:
        fields += ', title, content'
    all_data, offset = [], 0
    while True:
        result = supabase.table('collected_data_v40') \
            .select(fields) \
            .eq('politician_id', politician_id) \
            .range(offset, offset + 999) \
            .execute()
        if not result.data:
            break
        all_data.extend(result.data)
        if len(result.data) < 1000:
            break
        offset += 1000
    return all_data


def get_politician_profile(politician_id):
    """politicians 테이블에서 프로필 조회"""
    result = supabase.table('politicians') \
        .select('*') \
        .eq('id', politician_id) \
        .execute()
    return result.data[0] if result.data else None


def get_big4_scores():
    """Big 4 정치인 카테고리별/총점 조회"""
    big4 = {}
    for name, pid in BIG4_IDS.items():
        try:
            data = get_final_scores(pid)
            raw = data.get('ai_category_scores', {})
            if isinstance(raw, str):
                raw = json.loads(raw)
            cats = {}
            for cat_en in CATEGORIES:
                vals = [raw.get(ai, {}).get(cat_en, 0) for ai in EVAL_AIS]
                vals = [v for v in vals if v > 0]
                cats[cat_en] = sum(vals) / len(vals) if vals else 0
            big4[name] = {
                'total': data['final_score'],
                'grade': get_grade_str(data['final_score']),
                'categories': cats,
            }
        except Exception:
            pass
    return big4


# ============================================================
# 통계 계산
# ============================================================

def calculate_ai_statistics(evaluations):
    """AI별 집계 통계 계산"""
    stats = defaultdict(lambda: {
        'total': 0, 'positive_count': 0, 'negative_count': 0,
        'x_count': 0, 'ratings': defaultdict(int), 'avg_rating': 0,
    })
    for ev in evaluations:
        ai, rating = ev['evaluator_ai'], ev['rating']
        stats[ai]['total'] += 1
        stats[ai]['ratings'][rating] += 1
        if rating == 'X':
            stats[ai]['x_count'] += 1
        elif rating in ('+4', '+3', '+2', '+1'):
            stats[ai]['positive_count'] += 1
        elif rating in ('-1', '-2', '-3', '-4'):
            stats[ai]['negative_count'] += 1

    for ai, s in stats.items():
        total_val = count = 0
        for r, cnt in s['ratings'].items():
            v = RATING_TO_VALUE.get(r)
            if v is not None:
                total_val += v * cnt
                count += cnt
        s['avg_rating'] = total_val / count if count else 0

    return dict(stats)


def build_category_scores(ai_cat_raw, ai_stats, evaluations):
    """카테고리별 집계 데이터 구성"""
    available_ais = [ai for ai in EVAL_AIS if ai in ai_stats]

    cat_scores = {}
    for cat_en, cat_kr in CATEGORIES.items():
        scores, ai_names = [], []
        for ai in available_ais:
            s = ai_cat_raw.get(ai, {}).get(cat_en)
            if s is not None and s > 0:
                scores.append(s)
                ai_names.append(ai)

        cat_evals = [e for e in evaluations if e['category'] == cat_en]
        pos = sum(1 for e in cat_evals if e['rating'] in ('+4', '+3', '+2', '+1'))
        neg = sum(1 for e in cat_evals if e['rating'] in ('-1', '-2', '-3', '-4'))
        x   = sum(1 for e in cat_evals if e['rating'] == 'X')
        total = len(cat_evals)

        # 등급 분포 스펙트럼 (+4~-4)
        rating_dist = defaultdict(int)
        for e in cat_evals:
            if e['rating'] != 'X':
                rating_dist[e['rating']] += 1

        ai_detail = {}
        for ai in available_ais:
            ai_ev = [e for e in cat_evals if e['evaluator_ai'] == ai]
            ai_rating_dist = defaultdict(int)
            for e in ai_ev:
                if e['rating'] != 'X':
                    ai_rating_dist[e['rating']] += 1
            ai_detail[ai] = {
                'total': len(ai_ev),
                'pos': sum(1 for e in ai_ev if e['rating'] in ('+4', '+3', '+2', '+1')),
                'neg': sum(1 for e in ai_ev if e['rating'] in ('-1', '-2', '-3', '-4')),
                'x':   sum(1 for e in ai_ev if e['rating'] == 'X'),
                'rating_dist': dict(ai_rating_dist),
            }

        cat_scores[cat_en] = {
            'kr':          cat_kr,
            'avg':         sum(scores) / len(scores) if scores else 0,
            'scores':      scores,
            'ai_names':    ai_names,
            'stdev':       statistics.stdev(scores) if len(scores) > 1 else 0,
            'pos': pos, 'neg': neg, 'x': x, 'total': total,
            'ai_detail':   ai_detail,
            'rating_dist': dict(rating_dist),
        }
    return cat_scores


def build_keyword_map(evaluations_with_reasoning, collected_with_text, cat_scores,
                      politician_name=''):
    """키워드 지도 데이터 빌드 — 의미있는 키워드 위주

    핵심 전략:
    - reasoning 텍스트를 5배 가중치로 사용 (AI가 이미 중요한 것만 선별함)
    - 기사 제목만 사용 (본문은 노이즈 많음)
    - 본문은 제외 (일반적인 단어가 너무 많아 희석됨)
    - 3글자 이상 단어 + 2단어 복합어로 구체적 표현 추출

    Returns:
        overall_top:  [(keyword, count), ...] 전체 TOP50 (버블 차트용)
        cat_keywords: {cat_en: [(keyword, count), ...]} 카테고리별 TOP5
        pos_keywords: [(keyword, count), ...] 긍정(+3/+4) 키워드 TOP15
        neg_keywords: [(keyword, count), ...] 부정(-3/-4) 키워드 TOP15
        pos_kw_set:   set[str] 긍정 키워드 집합 (SVG 색상 결정용)
        neg_kw_set:   set[str] 부정 키워드 집합 (SVG 색상 결정용)
    """
    # ── 동적 불용어: 정치인 이름 + 조사 변형 + 빅4 이름 ─────────────
    extra_stop = set()
    if politician_name:
        # 이름 자체 및 일반 조사 변형
        name = politician_name
        extra_stop.update([
            name, name+'이', name+'가', name+'은', name+'는',
            name+'의', name+'을', name+'를', name+'와', name+'과',
            name+'에', name+'도', name+'만', name+'이라', name+'이고',
        ])
    # Big4 이름도 제외 (서로 비교 언급이 많아서 키워드로는 의미 없음)
    for n in BIG4_IDS:
        extra_stop.add(n)

    # ── 전체 텍스트 구성 ────────────────────────────────────────────
    # X 판정 reasoning 제외: "동명이인", "무관한" 등 노이즈 원천 차단
    all_texts = []
    for e in evaluations_with_reasoning:
        if e.get('rating') == 'X':
            continue  # X 판정 reasoning은 키워드 분석에서 완전 제외
        r = e.get('reasoning', '') or ''
        if r:
            all_texts.extend([r] * 5)   # reasoning 5배 가중

    # 기사 제목 (본문 제외 — 제목에 핵심 키워드 집약됨)
    for d in collected_with_text:
        title = d.get('title', '') or ''
        if title:
            all_texts.append(title)

    overall_top = extract_keywords(all_texts, top_n=50, extra_stopwords=extra_stop)

    # ── 카테고리별 키워드 ──────────────────────────────────────────
    cat_keywords = {}
    for cat_en in CATEGORIES:
        cat_texts = []
        # 해당 카테고리 reasoning (3배 가중)
        for e in evaluations_with_reasoning:
            if e.get('category') == cat_en:
                r = e.get('reasoning', '') or ''
                if r:
                    cat_texts.extend([r] * 3)
        # 해당 카테고리 제목
        for d in collected_with_text:
            if d.get('category') == cat_en:
                title = d.get('title', '') or ''
                if title:
                    cat_texts.append(title)
        cat_keywords[cat_en] = extract_keywords(cat_texts, top_n=5, extra_stopwords=extra_stop)

    # ── 긍정/부정 평가 키워드 ──────────────────────────────────────
    # +3/+4 / -3/-4 평가의 reasoning에서 추출 (가장 명확한 신호)
    pos_texts, neg_texts = [], []

    for e in evaluations_with_reasoning:
        r = e.get('reasoning', '') or ''
        rating = e.get('rating', '')
        if r:
            if rating in ('+3', '+4'):
                pos_texts.extend([r] * 3)
            elif rating in ('-3', '-4'):
                neg_texts.extend([r] * 3)

    # 제목에서도 보조
    pos_eval_ids = {e.get('collected_data_id') or ''
                    for e in evaluations_with_reasoning
                    if e.get('rating') in ('+3', '+4')}
    neg_eval_ids = {e.get('collected_data_id') or ''
                    for e in evaluations_with_reasoning
                    if e.get('rating') in ('-3', '-4')}

    for d in collected_with_text:
        did = d.get('id', '')
        title = d.get('title', '') or ''
        if title:
            if did in pos_eval_ids:
                pos_texts.append(title)
            if did in neg_eval_ids:
                neg_texts.append(title)

    pos_keywords = extract_keywords(pos_texts, top_n=15, extra_stopwords=extra_stop)
    neg_keywords = extract_keywords(neg_texts, top_n=15, extra_stopwords=extra_stop)

    # SVG 색상 결정용 set
    pos_kw_set = {kw for kw, _ in pos_keywords}
    neg_kw_set = {kw for kw, _ in neg_keywords}

    return overall_top, cat_keywords, pos_keywords, neg_keywords, pos_kw_set, neg_kw_set


# ============================================================
# Big 4 비교 섹션 (Type A/B 공통)
# ============================================================

def build_big4_section(target_name, final_score, grade, cat_scores, big4_data):
    """Big 4 비교 마크다운 섹션 생성"""
    others = {n: d for n, d in big4_data.items() if n != target_name}
    sorted_others = sorted(others.items(), key=lambda x: x[1]['total'], reverse=True)
    other_names = [n for n, _ in sorted_others]

    section = f"""## 2026 서울시장 유력 후보군 비교

> ℹ️ 비교군 선정 기준: {BIG4_SELECTION_NOTE}
> ⚠️ 평가 대상 정치인은 비교군 목록에서 자동 제외 후 별도 ★ 표시

### 종합 점수 순위

| 순위 | 후보 | 점수 | 등급 |
|:----:|------|:----:|:----:|
"""
    # 타겟 포함 전체 4명 점수 → 순위 결정
    all_cands_for_rank = dict(big4_data)
    if target_name not in all_cands_for_rank:
        all_cands_for_rank[target_name] = {'total': final_score, 'grade': grade}
    else:
        all_cands_for_rank[target_name]['total'] = final_score
        all_cands_for_rank[target_name]['grade'] = grade

    sorted_all = sorted(all_cands_for_rank.items(), key=lambda x: x[1]['total'], reverse=True)
    for i, (name, d) in enumerate(sorted_all, 1):
        if name == target_name:
            section += f"| **★{i}** | **{name}** | **{d['total']}점** | **{d.get('grade', grade)}** |\n"
        else:
            section += f"| {i} | {name} | {d['total']}점 | {d.get('grade', '')} |\n"

    # 카테고리별 비교표
    header_names = [target_name] + other_names
    section += "\n### 카테고리별 비교 (10개)\n\n"
    section += "| 카테고리 | " + " | ".join(header_names) + " |\n"
    section += "|---------|" + ":------:|" * len(header_names) + "\n"

    for cat_en, cat_kr in CATEGORIES.items():
        target_s = cat_scores[cat_en]['avg']
        row = [f"{target_s:.0f}"]
        for name in other_names:
            s = big4_data.get(name, {}).get('categories', {}).get(cat_en, 0)
            row.append(f"{s:.0f}")
        section += f"| {cat_kr} | " + " | ".join(row) + " |\n"

    section += "\n---\n\n"
    return section


# ============================================================
# Type A — 요약본 생성
# ============================================================

def generate_type_a(target_name, final_score, cat_scores, big4_data, date_str):
    """Type A 요약본 생성 (V41 가이드 A-1/A-2/A-3)"""
    grade = get_grade_str(final_score)
    sorted_cats = sorted(cat_scores.items(), key=lambda x: x[1]['avg'], reverse=True)

    # ─── A-1: 종합 스코어카드 ───
    report = f"""# {target_name} 정치인 평가 요약

**평가 일자**: {date_str}  |  **평가 AI**: Claude · ChatGPT · Gemini · Grok

---

## 종합 점수

| 항목 | 내용 |
|------|------|
| **최종 점수** | **{final_score}점** / 1,000점 |
| **등급** | **{grade}** |

### 10개 카테고리 점수 (높은 순)

```
"""
    for cat_en, info in sorted_cats:
        bar = ascii_bar(info['avg'], 100, 10)
        report += f"{info['kr']:<8} {bar} {info['avg']:.0f}점\n"
    report += "```\n*(막대 1칸 = 10점, ██=유효 점수, ░=미달)*\n\n---\n\n"

    # ─── A-2: Big 4 비교 ───
    report += build_big4_section(target_name, final_score, grade, cat_scores, big4_data)

    # ─── A-3: 핵심 관찰 ───
    top_cat_en, top_cat_info = sorted_cats[0]
    bot_cat_en, bot_cat_info = sorted_cats[-1]

    stdev_pairs = [(cat_en, info['stdev']) for cat_en, info in cat_scores.items() if info['stdev'] > 0]
    avg_stdev = sum(s for _, s in stdev_pairs) / len(stdev_pairs) if stdev_pairs else 0
    max_stdev_cat, max_stdev_val = max(stdev_pairs, key=lambda x: x[1]) if stdev_pairs else (None, 0)

    # Big 4 + 타겟 기준 순위 계산
    all_cands = dict(big4_data)
    if target_name not in all_cands:
        all_cands[target_name] = {'categories': {cat_en: info['avg'] for cat_en, info in cat_scores.items()}}

    def rank_in_group(cat_en, target_name):
        scores_group = [(n, d.get('categories', {}).get(cat_en, 0)) for n, d in all_cands.items()]
        scores_group.sort(key=lambda x: x[1], reverse=True)
        for i, (n, _) in enumerate(scores_group):
            if n == target_name:
                return i + 1
        return len(scores_group)

    best_rank_cat  = min(CATEGORIES.keys(), key=lambda c: rank_in_group(c, target_name))
    worst_rank_cat = max(CATEGORIES.keys(), key=lambda c: rank_in_group(c, target_name))
    best_rank_n    = rank_in_group(best_rank_cat, target_name)
    worst_rank_n   = rank_in_group(worst_rank_cat, target_name)
    group_size     = len(all_cands)

    report += """## [데이터 관찰]

### [현상 관찰]
"""
    report += f"- {top_cat_info['kr']} 섹터가 {top_cat_info['avg']:.0f}점으로 가장 높게 관찰되며, {bot_cat_info['kr']} 섹터는 {bot_cat_info['avg']:.0f}점으로 상대적으로 낮게 관찰됨.\n"
    report += f"- 4개 AI 간 평가 편차: 평균 표준편차 {avg_stdev:.1f}점 수준.\n"

    report += "\n### [격차 분석]\n"
    report += f"- Big {group_size - 1}+1 비교군 대비 {CATEGORIES[best_rank_cat]} 항목에서 {best_rank_n}위 관찰됨.\n"
    if worst_rank_cat != best_rank_cat:
        report += f"- {CATEGORIES[worst_rank_cat]} 항목에서 상대적으로 낮은 순위({worst_rank_n}위)가 관찰됨.\n"

    if max_stdev_cat:
        report += "\n### [부조화 포착]\n"
        report += f"- {CATEGORIES[max_stdev_cat]} 카테고리에서 AI 간 최대 편차(표준편차 {max_stdev_val:.1f}점)가 관찰됨.\n"

    # 푸터
    report += f"""
---

> ⚠️ **유의사항**: 이 요약본은 AI 4개가 공개 자료를 분석한 결과입니다.
> 여론조사·법적 판단·인물 평가가 아닙니다.
> 평가 일자 이후 활동은 반영되지 않습니다.

**평가 엔진**: PoliticianFinder AI V40  |  **생성일**: {date_str}
"""
    return report


# ============================================================
# Type B — 상세본 생성
# ============================================================

def generate_type_b(target_name, final_scores_raw, cat_scores, big4_data, profile,
                    ai_stats, evaluations, collected_data, date_str,
                    evaluations_with_reasoning=None, collected_with_text=None,
                    svg_filename=None):
    """Type B 상세본 생성 (V41 가이드 8섹션 + 키워드 지도)"""

    final_score = final_scores_raw['final_score']
    grade = get_grade_str(final_score)

    ai_final_scores = final_scores_raw.get('ai_final_scores', {})
    if isinstance(ai_final_scores, str):
        ai_final_scores = json.loads(ai_final_scores)

    available_ais = [ai for ai in EVAL_AIS if ai in ai_stats]
    total_all      = sum(ai_stats[ai]['total'] for ai in ai_stats)
    total_positive = sum(ai_stats[ai]['positive_count'] for ai in ai_stats)
    total_negative = sum(ai_stats[ai]['negative_count'] for ai in ai_stats)
    total_x        = sum(ai_stats[ai]['x_count'] for ai in ai_stats)
    pos_pct = total_positive / total_all * 100 if total_all else 0
    neg_pct = total_negative / total_all * 100 if total_all else 0
    x_pct   = total_x        / total_all * 100 if total_all else 0
    avg_rating = sum(ai_stats[ai]['avg_rating'] for ai in available_ais) / len(available_ais) if available_ais else 0
    avg_score = avg_rating * 2  # avg_rating → avg_score 변환

    total_collected = len(collected_data)
    sorted_cats = sorted(cat_scores.items(), key=lambda x: x[1]['avg'], reverse=True)
    top_cats = sorted_cats[:5]
    bot_cats = sorted_cats[-3:]

    # ─── B-1: 정치인 프로필 ───
    report = f"""# {target_name} AI 기반 정치인 상세평가보고서 (당사자 전용)

> 🔒 이 보고서는 당사자 전용 비공개 문서입니다.

**평가 버전**: V40  |  **평가 일자**: {date_str}
**총 평가 수**: {total_all:,}개 (4 AI × 약 {total_all // max(len(available_ais), 1):,}개)
**평가 AI**: Claude · ChatGPT · Grok · Gemini

---

## 1. 정치인 프로필

"""
    if profile:
        report += f"""| 항목 | 내용 |
|------|------|
| **이름** | {profile.get('name', target_name)} |
| **소속 정당** | {profile.get('party', '-')} |
| **현직** | {profile.get('position', '-')} |
| **지역구** | {profile.get('district', '-')} |
| **이전 직책** | {profile.get('previous_position', '-')} |

### 주요 경력
"""
        career = profile.get('career', [])
        if isinstance(career, str):
            try:
                career = json.loads(career)
            except Exception:
                career = []
        for item in (career[:5] if career else []):
            report += f"- {item}\n"
    else:
        report += f"| 항목 | 내용 |\n|------|------|\n| **이름** | {target_name} |\n"

    # ─── B-2: 평가 요약 ───
    report += f"""
---

## 2. 평가 요약

### 최종 점수 및 등급

| 항목 | 내용 |
|------|------|
| **최종 점수** | **{final_score}점** / 1,000점 |
| **등급** | **{grade}** |
| **4 AI 평균 rating** | {avg_rating:+.2f} → avg_score {avg_score:+.2f} |

> **점수 공식**: avg_rating × 2 = avg_score → (6.0 + avg_score × 0.5) × 10 = 카테고리 점수

### 10개 카테고리 점수 (높은 순)

```
"""
    for cat_en, info in sorted_cats:
        report += f"{info['kr']:<8} {ascii_bar(info['avg'], 100, 10)} {info['avg']:.0f}점\n"
    report += "```\n*(막대 1칸 = 10점)*\n"

    report += "\n### AI별 점수 상세\n\n"
    report += "| AI | 점수 | avg_rating | avg_score |\n|---|:---:|:----------:|:---------:|\n"
    for ai, score in sorted(ai_final_scores.items(), key=lambda x: x[1], reverse=True):
        if ai in ai_stats:
            ar = ai_stats[ai]['avg_rating']
            as_ = ar * 2
            report += f"| {ai} | {score}점 | {ar:+.2f} | {as_:+.2f} |\n"
    report += f"| **4 AI 평균** | **{final_score}점** | **{avg_rating:+.2f}** | **{avg_score:+.2f}** |\n"

    # AI 합의 분석 (방향 합의 기준)
    sorted_by_stdev = sorted(cat_scores.items(), key=lambda x: x[1]['stdev'])
    # 방향 합의: 표준편차 < 3점인 카테고리
    consensus_cats = [CATEGORIES[c] for c, _ in sorted_by_stdev[:3] if cat_scores[c]['stdev'] < 3]
    max_discord    = sorted_by_stdev[-1]

    report += f"""
### AI 합의 신뢰도

> **방향 합의** 기준: 4개 AI 모두 같은 방향(긍정/부정)으로 평가한 카테고리

- **AI 방향 합의 카테고리**: {', '.join(consensus_cats) if consensus_cats else 'N/A'} (표준편차 < 3점)
- **AI 이견 카테고리**: {CATEGORIES[max_discord[0]]} (표준편차 {max_discord[1]['stdev']:.1f}점)
- **유효 데이터**: {total_all - total_x:,}개 / 전체 {total_all:,}개 ({(total_all - total_x) / total_all * 100 if total_all else 0:.1f}%)

---

"""
    # Big 4 비교 (Type A 내용과 동일)
    report += build_big4_section(target_name, final_score, grade, cat_scores, big4_data)

    # ─── B-3: 강점 분석 ───
    report += "## 3. 강점 분석\n\n"
    for rank, (cat_en, info) in enumerate(top_cats, 1):
        scores, ai_names = info['scores'], info['ai_names']
        max_idx = scores.index(max(scores)) if scores else 0
        min_idx = scores.index(min(scores)) if scores else 0
        consistency = "강한 합의" if info['stdev'] < 3 else ("중간 합의" if info['stdev'] < 5 else "평가 분산")
        ai_str = ' · '.join(f"{ai_names[i]} {scores[i]:.0f}점" for i in range(min(len(ai_names), len(scores))))
        t = info['total']
        pos_p = info['pos'] / t * 100 if t else 0
        neg_p = info['neg'] / t * 100 if t else 0
        x_p   = info['x']   / t * 100 if t else 0

        # 등급 분포 스펙트럼
        dist = info.get('rating_dist', {})
        spectrum = " | ".join(
            f"{r}: {dist.get(r, 0)}건"
            for r in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']
            if dist.get(r, 0) > 0
        )

        # 극단성 지수 (+4/-4 건수)
        extreme_pos = dist.get('+4', 0)
        extreme_neg = dist.get('-4', 0)

        report += f"""### 강점 {rank}: {info['kr']} ({info['avg']:.0f}점)

#### 점수 현황
- 4개 AI 평균 **{info['avg']:.0f}점** — 10개 카테고리 중 **{rank}위**
- AI별 점수: {ai_str}

#### AI 평가 일치도 ({consistency})
- 표준편차 **{info['stdev']:.1f}점**
- 최고 AI: {ai_names[max_idx] if max_idx < len(ai_names) else 'N/A'} ({scores[max_idx]:.0f}점) / 최저 AI: {ai_names[min_idx] if min_idx < len(ai_names) else 'N/A'} ({scores[min_idx]:.0f}점) — 격차 {scores[max_idx] - scores[min_idx]:.0f}점

#### 등급 분포 스펙트럼
```
{spectrum if spectrum else '데이터 없음'}
```
- 긍정({info['pos']}건 / {pos_p:.0f}%) · 부정({info['neg']}건 / {neg_p:.0f}%) · 제외 X({info['x']}건)
- 극단성 지수 — 탁월(+4): {extreme_pos}건 / 최악(-4): {extreme_neg}건

"""
    report += "---\n\n"

    # ─── B-4: 약점 분석 ───
    report += "## 4. 약점 분석\n\n"
    for rank, (cat_en, info) in enumerate(bot_cats, 1):
        scores, ai_names = info['scores'], info['ai_names']
        max_idx = scores.index(max(scores)) if scores else 0
        min_idx = scores.index(min(scores)) if scores else 0
        consistency = "강한 합의" if info['stdev'] < 3 else ("중간 합의" if info['stdev'] < 5 else "평가 분산")
        ai_str = ' · '.join(f"{ai_names[i]} {scores[i]:.0f}점" for i in range(min(len(ai_names), len(scores))))
        cat_rank = next((i + 1 for i, (c, _) in enumerate(sorted_cats) if c == cat_en), 0)
        t = info['total']
        pos_p = info['pos'] / t * 100 if t else 0
        neg_p = info['neg'] / t * 100 if t else 0
        x_p   = info['x']   / t * 100 if t else 0

        dist = info.get('rating_dist', {})
        spectrum = " | ".join(
            f"{r}: {dist.get(r, 0)}건"
            for r in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']
            if dist.get(r, 0) > 0
        )
        extreme_pos = dist.get('+4', 0)
        extreme_neg = dist.get('-4', 0)

        report += f"""### 약점 {rank}: {info['kr']} ({info['avg']:.0f}점)

#### 점수 현황
- 4개 AI 평균 **{info['avg']:.0f}점** — 10개 카테고리 중 하위 **{cat_rank}위**
- AI별 점수: {ai_str}

#### AI 평가 편차 ({consistency})
- 표준편차 **{info['stdev']:.1f}점** — AI 간 최대 격차: {scores[max_idx] - scores[min_idx]:.0f}점

#### 등급 분포 스펙트럼
```
{spectrum if spectrum else '데이터 없음'}
```
- 긍정({info['pos']}건 / {pos_p:.0f}%) · 부정({info['neg']}건 / {neg_p:.0f}%) · 제외 X({info['x']}건)
- 극단성 지수 — 탁월(+4): {extreme_pos}건 / 최악(-4): {extreme_neg}건

"""
    report += "---\n\n"

    # ─── B-5: 카테고리별 상세 (등급 분포 스펙트럼 포함) ───
    report += "## 5. 카테고리별 상세\n\n"
    for idx, (cat_en, cat_kr) in enumerate(CATEGORIES.items(), 1):
        info = cat_scores[cat_en]
        scores, ai_names = info['scores'], info['ai_names']
        t = info['total']

        report += f"### 5.{idx} {cat_kr} ({info['avg']:.0f}점)\n\n"

        # AI별 등급 분포 스펙트럼
        report += "#### AI별 등급 분포 스펙트럼\n\n"
        report += "| AI | +4 | +3 | +2 | +1 | -1 | -2 | -3 | -4 | 점수 |\n"
        report += "|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:----:|\n"
        for i, ai in enumerate(ai_names):
            if i >= len(scores):
                continue
            d = info['ai_detail'].get(ai, {})
            rd = d.get('rating_dist', {})
            row = " | ".join(str(rd.get(r, 0)) for r in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4'])
            report += f"| {ai} | {row} | {scores[i]:.0f}점 |\n"
        report += f"| **합계** | - | - | - | - | - | - | - | - | **{info['avg']:.0f}점** |\n\n"

        pp_cat = info['pos'] / t * 100 if t else 0
        np_cat = info['neg'] / t * 100 if t else 0
        xp_cat = info['x']   / t * 100 if t else 0
        report += f"전체 {t}개: 긍정 {info['pos']}건({pp_cat:.0f}%) · 부정 {info['neg']}건({np_cat:.0f}%) · X {info['x']}건({xp_cat:.0f}%)\n\n"

    report += "---\n\n"

    # ─── B-6: 키워드 지도 ───
    if evaluations_with_reasoning is not None and collected_with_text is not None:
        print("  → 키워드 지도 분석 중 (전체 데이터)...")
        overall_kw, cat_kw, pos_kw, neg_kw, pos_kw_set, neg_kw_set = build_keyword_map(
            evaluations_with_reasoning, collected_with_text, cat_scores,
            politician_name=target_name,
        )
        total_collected_cnt = len(collected_with_text)

        report += "## 6. 키워드 지도\n\n"
        report += f"> 수집 데이터 {total_collected_cnt:,}개 + AI 평가 reasoning 전체에서 추출 · 버블 크기 = 빈도\n\n"

        # SVG 버블 차트 참조
        if svg_filename:
            report += f"![{target_name} 키워드 지도]({svg_filename})\n\n"
            report += "> 🔵 파란색 = 긍정(+3/+4) 연관 · 🔴 빨간색 = 부정(-3/-4) 연관 · 🟣 보라색 = 긍정+부정 공존 · ⚫ 회색 = 중립\n\n"

        # 전체 TOP 20 테이블 (SVG 보완)
        if overall_kw:
            report += "### 6.1 빈출 키워드 TOP 20\n\n"
            report += "| 순위 | 키워드 | 빈도 | 빈도 바 |\n|:----:|--------|:----:|--------|\n"
            max_cnt = overall_kw[0][1]
            for i, (kw, cnt) in enumerate(overall_kw[:20], 1):
                bar = '▓' * max(1, int(cnt / max_cnt * 12))
                kw_label = f"**{kw}**" if kw in pos_kw_set else (f"*{kw}*" if kw in neg_kw_set else kw)
                report += f"| {i} | {kw_label} | {cnt}회 | {bar} |\n"
            report += "\n"

        # 카테고리별 TOP 5
        report += "### 6.2 카테고리별 핵심 키워드 (TOP 5)\n\n"
        report += "| 카테고리 | 1위 | 2위 | 3위 | 4위 | 5위 |\n"
        report += "|---------|-----|-----|-----|-----|-----|\n"
        for cat_en, cat_kr in CATEGORIES.items():
            kws = cat_kw.get(cat_en, [])
            padded = (kws + [('—', 0)] * 5)[:5]
            kw_cells = [f"{kw}({cnt})" if cnt > 0 else "—" for kw, cnt in padded]
            report += f"| {cat_kr} | " + " | ".join(kw_cells) + " |\n"
        report += "\n"

        # 긍정/부정 키워드 대비
        report += "### 6.3 긍정(+3/+4) vs 부정(-3/-4) 키워드\n\n"
        report += "| 순위 | 🔵 긍정 키워드 | 빈도 | 🔴 부정 키워드 | 빈도 |\n"
        report += "|:----:|--------------|:----:|--------------|:----:|\n"
        for i in range(min(10, max(len(pos_kw), len(neg_kw)))):
            pk = f"**{pos_kw[i][0]}**" if i < len(pos_kw) else "—"
            nk = f"**{neg_kw[i][0]}**" if i < len(neg_kw) else "—"
            pc = pos_kw[i][1] if i < len(pos_kw) else 0
            nc = neg_kw[i][1] if i < len(neg_kw) else 0
            report += f"| {i+1} | {pk} | {pc if pc else '—'} | {nk} | {nc if nc else '—'} |\n"
        report += "\n---\n\n"
    else:
        report += "## 6. 키워드 지도\n\n*(키워드 데이터 없음 — --with-keywords 옵션 사용)*\n\n---\n\n"

    # ─── B-7: 데이터 분석 ───
    gc = len([d for d in collected_data if d.get('collector_ai') == 'Gemini'])
    nc = len([d for d in collected_data if d.get('collector_ai') == 'Naver'])
    go = len([d for d in collected_data if d.get('collector_ai') == 'Gemini' and d.get('data_type', '').upper() == 'OFFICIAL'])
    gp = len([d for d in collected_data if d.get('collector_ai') == 'Gemini' and d.get('data_type', '').upper() == 'PUBLIC'])
    no = len([d for d in collected_data if d.get('collector_ai') == 'Naver'  and d.get('data_type', '').upper() == 'OFFICIAL'])
    np_ = len([d for d in collected_data if d.get('collector_ai') == 'Naver' and d.get('data_type', '').upper() == 'PUBLIC'])

    report += f"""## 7. 데이터 분석

### 7.1 전체 등급 분포

| 구분 | 개수 | 비율 |
|------|:----:|:----:|
| 긍정 (+1~+4) | {total_positive:,}개 | {pos_pct:.1f}% |
| 부정 (-1~-4) | {total_negative:,}개 | {neg_pct:.1f}% |
| 제외 (X) | {total_x:,}개 | {x_pct:.1f}% |
| **총합** | **{total_all:,}개** | **100%** |

### 7.2 카테고리별 분포

| 카테고리 | 긍정 | 부정 | 제외(X) |
|---------|:----:|:----:|:-------:|
"""
    for cat_en, info in cat_scores.items():
        t = info['total']
        pp = info['pos'] / t * 100 if t else 0
        np_c = info['neg'] / t * 100 if t else 0
        xp = info['x'] / t * 100 if t else 0
        report += f"| {info['kr']} | {pp:.0f}% | {np_c:.0f}% | {xp:.0f}% |\n"

    report += f"""
### 7.3 데이터 출처

| 채널 | 총 수집 | OFFICIAL | PUBLIC |
|------|:------:|:--------:|:------:|
| Gemini CLI | {gc}개 | {go}개 ({go/gc*100 if gc else 0:.0f}%) | {gp}개 ({gp/gc*100 if gc else 0:.0f}%) |
| Naver API  | {nc}개 | {no}개 ({no/nc*100 if nc else 0:.0f}%) | {np_}개 ({np_/nc*100 if nc else 0:.0f}%) |
| **합계**   | **{total_collected}개** | - | - |

### 7.4 데이터 품질

- **총 평가 수**: {total_all:,}개 (4 AI 합산)
- **유효 평가 (X 제외)**: {total_all - total_x:,}개 ({(total_all - total_x)/total_all*100 if total_all else 0:.1f}%)
- **평가 제외 (X)**: {total_x:,}개 ({x_pct:.1f}%)
- **4 AI 평균 avg_rating**: {avg_rating:+.2f} → avg_score {avg_score:+.2f}

---

"""

    # ─── B-8: 평가의 한계 및 유의사항 ───
    report += f"""## 8. 평가의 한계 및 유의사항

### 데이터 수집 한계
1. **수집 기간 제한**: OFFICIAL 최근 4년, PUBLIC 최근 2년 이내 자료만 반영
2. **검색 편향**: Gemini CLI / Naver API 알고리즘에 따른 데이터 편향 가능성
3. **미수집 자료**: 비공개 문서, 오프라인 활동, 구두 발언 등 미반영

### AI 평가 한계
1. **AI 특성 편향**: 각 AI는 학습 데이터에 따른 편향 존재 (4개 평균으로 완화)
2. **맥락 이해**: 정치적 배경, 지역 특성, 역사적 맥락의 완전한 이해 불가

### 이용 시 유의사항
1. 이 보고서는 **참고 자료**입니다. 최종 판단은 이용자 본인에게 있습니다.
2. **여론조사가 아닙니다.** 등급 분포는 시민 여론과 다를 수 있습니다.
3. **법적 판단이 아닙니다.** 논란·의혹 관련 평가는 법적 유무죄와 무관합니다.
4. **실시간 업데이트 안 됩니다.** 평가 일자 이후 활동은 반영되지 않습니다.
5. **당사자 전용 문서**입니다. 무단 배포 시 법적 책임이 따를 수 있습니다.

---

"""

    # ─── B-9: 참고자료 및 마무리 ───
    report += f"""## 9. 참고자료 및 마무리

### 평가 시스템 개요

| 항목 | 내용 |
|------|------|
| 수집 채널 | Gemini CLI 50% + Naver API 50% |
| 수집 기간 | OFFICIAL 4년 이내 / PUBLIC 2년 이내 |
| 평가 AI | Claude · ChatGPT · Grok · Gemini (4개) |
| 등급 체계 | +4(탁월) ~ -4(최악), X(제외) |
| 점수 공식 | `avg_rating × 2 = avg_score → (6.0 + avg_score × 0.5) × 10 = 카테고리 점수` |
| 최종 점수 | 10개 카테고리 합산, 범위 200~1,000점 |
| 비교군 선정 | {BIG4_SELECTION_NOTE} |

### 등급 기준표

| 등급 | 점수 범위 | 의미 |
|:----:|:--------:|------|
| M  | 920~1,000점 | 최우수 |
| D  | 840~919점   | 우수 |
| E  | 760~839점   | 양호 |
| P  | 680~759점   | 보통+ |
| G  | 600~679점   | 보통 |
| S  | 520~599점   | 보통- |
| B  | 440~519점   | 미흡 |
| I  | 360~439점   | 부족 |
| Tn | 280~359점   | 상당히 부족 |
| L  | 200~279점   | 매우 부족 |

---

**생성 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**생성 시스템**: PoliticianFinder AI 평가 엔진 V40
**보고서 유형**: Type B — 상세본 (당사자 전용 비공개)

> 🔒 이 문서는 {target_name} 당사자 전용입니다. 무단 공개·배포 금지.
"""
    return report


# ============================================================
# 저장 함수
# ============================================================

def save_report(content, politician_name, report_type):
    """보고서 저장 — 파일명: {이름}_{YYYYMMDD}_{type}.md"""
    date_str = datetime.now().strftime('%Y%m%d')
    filename = f"{politician_name}_{date_str}_{report_type}.md"

    script_dir = Path(__file__).resolve().parent   # scripts/core/
    v40_dir    = script_dir.parent.parent          # V40/
    report_dir = v40_dir / '보고서'
    report_dir.mkdir(exist_ok=True)

    filepath = report_dir / filename
    filepath.write_text(content, encoding='utf-8')
    return str(filepath)


# ============================================================
# 메인
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description='V40 보고서 생성 (V41 가이드 기준)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  python generate_report_v40.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=A
  python generate_report_v40.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=B
  python generate_report_v40.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=B --with-keywords
  python generate_report_v40.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=AB --with-keywords
""")
    parser.add_argument('--politician_id',   required=True, help='정치인 ID (8자리 hex)')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--type', default='B', choices=['A', 'B', 'AB'],
                        help='보고서 타입 (A=요약본, B=상세본, AB=둘 다)')
    parser.add_argument('--with-keywords', action='store_true',
                        help='Type B에 키워드 지도 포함 (reasoning + title/content 텍스트 조회 필요)')
    args = parser.parse_args()

    pid, pname, rtype = args.politician_id, args.politician_name, args.type
    with_keywords = args.with_keywords
    date_str = datetime.now().strftime('%Y-%m-%d')

    print(f"[보고서 생성] {pname} ({pid}) — Type {rtype}")

    # 데이터 수집
    print("  1. 최종 점수 조회...")
    final_scores_raw = get_final_scores(pid)
    ai_cat_raw = final_scores_raw.get('ai_category_scores', {})
    if isinstance(ai_cat_raw, str):
        ai_cat_raw = json.loads(ai_cat_raw)

    print("  2. 평가 데이터 조회...")
    evaluations = get_all_evaluations(pid, include_reasoning=False)

    print("  3. 수집 데이터 조회...")
    collected_data = get_collected_data(pid, include_text=False)

    print("  4. Big 4 점수 조회...")
    big4_data = get_big4_scores()

    print("  5. 통계 계산...")
    ai_stats   = calculate_ai_statistics(evaluations)
    cat_scores = build_category_scores(ai_cat_raw, ai_stats, evaluations)

    # 키워드 지도 데이터 (옵션)
    evaluations_with_reasoning = None
    collected_with_text = None
    svg_filename = None

    if rtype in ('B', 'AB') and with_keywords:
        print("  5-1. 키워드 지도용 reasoning 데이터 조회...")
        evaluations_with_reasoning = get_all_evaluations(pid, include_reasoning=True)
        print("  5-2. 키워드 지도용 title/content 데이터 조회...")
        collected_with_text = get_collected_data(pid, include_text=True)

        # SVG 버블 차트 생성 & 저장
        print(f"  5-3. 키워드 지도 SVG 생성 ({len(collected_with_text):,}개 데이터)...")
        overall_kw_temp, _, _, _, pos_kw_set_temp, neg_kw_set_temp = build_keyword_map(
            evaluations_with_reasoning, collected_with_text, {},
            politician_name=pname,
        )
        svg_content = generate_keyword_svg(
            overall_kw_temp, pos_kw_set_temp, neg_kw_set_temp,
            politician_name=pname,
            max_keywords=50,
        )
        if svg_content:
            date_str_file = datetime.now().strftime('%Y%m%d')
            svg_fname = f"{pname}_{date_str_file}_keywords.svg"
            script_dir = Path(__file__).resolve().parent
            v40_dir    = script_dir.parent.parent
            report_dir = v40_dir / '보고서'
            report_dir.mkdir(exist_ok=True)
            svg_path = report_dir / svg_fname
            svg_path.write_text(svg_content, encoding='utf-8')
            print(f"  ✅ 키워드 SVG 저장: {svg_path}")
            svg_filename = svg_fname  # 마크다운에서 상대 참조용

    profile = None
    if rtype in ('B', 'AB'):
        print("  6. 정치인 프로필 조회...")
        profile = get_politician_profile(pid)

    # 보고서 생성 및 저장
    if rtype in ('A', 'AB'):
        print("  → Type A 요약본 생성...")
        report_a = generate_type_a(pname, final_scores_raw['final_score'], cat_scores, big4_data, date_str)
        path_a = save_report(report_a, pname, 'A')
        print(f"  ✅ Type A 저장: {path_a}")

    if rtype in ('B', 'AB'):
        print("  → Type B 상세본 생성...")
        report_b = generate_type_b(
            pname, final_scores_raw, cat_scores, big4_data, profile,
            ai_stats, evaluations, collected_data, date_str,
            evaluations_with_reasoning=evaluations_with_reasoning,
            collected_with_text=collected_with_text,
            svg_filename=svg_filename,
        )
        path_b = save_report(report_b, pname, 'B')
        print(f"  ✅ Type B 저장: {path_b}")

    print("\n[완료] 보고서 생성 완료")


if __name__ == '__main__':
    main()
