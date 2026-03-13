# -*- coding: utf-8 -*-
"""
V50 평가보고서 생성 스크립트 (V41 통합판)

V41 가이드 기준:
- Type A: 요약본 (공개용, 3섹션, ~100줄)
- Type B: 상세본 (당사자 전용, 8섹션, ~790줄)
- 핵심 철학: "조언하지 않는다. 증명할 뿐이다."
- 금지: 전략 제언, 개선 방향, 권고 문구 일체
- 출력 형식: HTML (CSS 스타일 + 카테고리별 점수 시각화 포함)

사용법:
    # Type A 요약본 생성
    python generate_report_v50.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=A

    # Type B 상세본 생성
    python generate_report_v50.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=B

    # A+B 동시 생성
    python generate_report_v50.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=AB
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

# UTF-8 출력 설정 (Windows)
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env 로드
V50_DIR = Path(__file__).resolve().parent.parent  # V50/scripts/ → V50/
try:
    from dotenv import load_dotenv
    for env_path in [V50_DIR.parent.parent / '.env', V50_DIR.parent / '.env', V50_DIR / '.env']:
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

# 경쟁자 (서울시장 유력 후보군 - 2026 서울시장 여론조사 지지율 상위 4인)
BIG4_IDS = {
    '박주민': '8c5dcc89',
    '정원오': '17270f25',
    '오세훈': '62e7b453',
    '조은희': 'd0a5d6e1',
}
BIG4_SELECTION_NOTE = "2026 서울시장 경쟁자 비교 (여론조사 지지율 상위 4인, 언론 보도 기준)"

EVAL_AIS = ['Claude', 'ChatGPT', 'Grok', 'Gemini']


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


def get_grade_context(score):
    """등급의 위치 컨텍스트 반환 (10단계 중 N위)"""
    for i, (lo, hi, code, name) in enumerate(GRADE_BOUNDARIES, 1):
        if lo <= score <= hi:
            return code, name, i  # 코드, 이름, 순위(1=최상위)
    return 'L', '매우 부족', 10


def score_to_pct(score, max_score=100):
    """점수 → 백분율 (0~100) 반환 (HTML 진행바 너비 계산용)"""
    return max(0, min(int(score / max_score * 100), 100))


def grade_to_color(grade_code):
    """등급 코드 → CSS 색상 반환"""
    color_map = {
        'M': '#1a237e',
        'D': '#283593',
        'E': '#1565c0',
        'P': '#0277bd',
        'G': '#00838f',
        'S': '#558b2f',
        'B': '#f57f17',
        'I': '#e65100',
        'Tn': '#b71c1c',
        'L': '#880e4f',
    }
    return color_map.get(grade_code, '#455a64')


def ascii_bar(score, max_score=100, width=10):
    """ASCII 막대 차트: 1칸 = max_score/width 점, 최대 width칸"""
    filled = max(0, min(int(score / max_score * width), width))
    return '█' * filled + '░' * (width - filled)


# ============================================================
# HTML 공통 CSS
# ============================================================

HTML_CSS = """
<style>
  :root {
    --primary: #1565c0;
    --primary-dark: #0d47a1;
    --accent: #ff6f00;
    --bg: #f5f7fa;
    --card-bg: #ffffff;
    --text: #212121;
    --text-muted: #616161;
    --border: #e0e0e0;
    --positive: #2e7d32;
    --negative: #c62828;
    --neutral: #455a64;
    --bar-bg: #e0e0e0;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    padding: 24px 16px;
  }

  .report-wrapper {
    max-width: 900px;
    margin: 0 auto;
  }

  /* 헤더 */
  .report-header {
    background: linear-gradient(135deg, var(--primary-dark), var(--primary));
    color: #fff;
    border-radius: 12px;
    padding: 32px 28px;
    margin-bottom: 24px;
  }
  .report-header h1 { font-size: 1.8rem; font-weight: 700; margin-bottom: 8px; }
  .report-header .meta { font-size: 0.875rem; opacity: 0.85; }

  /* 카드 */
  .card {
    background: var(--card-bg);
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    padding: 24px;
    margin-bottom: 20px;
  }
  .card h2 {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--primary);
    border-bottom: 2px solid var(--primary);
    padding-bottom: 8px;
    margin-bottom: 16px;
  }
  .card h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    margin: 16px 0 8px;
  }

  /* 점수 배지 */
  .score-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--primary);
    color: #fff;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 12px;
  }
  .score-badge .grade {
    background: rgba(255,255,255,0.2);
    border-radius: 6px;
    padding: 2px 10px;
    font-size: 1rem;
  }

  /* 진행 바 */
  .bar-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .bar-label {
    width: 72px;
    font-size: 0.85rem;
    color: var(--text-muted);
    flex-shrink: 0;
    text-align: right;
  }
  .bar-track {
    flex: 1;
    height: 18px;
    background: var(--bar-bg);
    border-radius: 9px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 9px;
    background: linear-gradient(90deg, var(--primary), #42a5f5);
    transition: width 0.4s ease;
  }
  .bar-score {
    width: 50px;
    font-size: 0.85rem;
    font-weight: 600;
    text-align: right;
    flex-shrink: 0;
  }

  /* 테이블 */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    margin-top: 8px;
  }
  th {
    background: var(--primary);
    color: #fff;
    padding: 8px 12px;
    text-align: center;
  }
  td {
    padding: 7px 12px;
    border-bottom: 1px solid var(--border);
    text-align: center;
  }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f9fafb; }
  td:first-child { text-align: left; }

  /* 타겟 행 강조 */
  .target-row td { font-weight: 700; background: #e3f2fd !important; }

  /* 등급 뱃지 */
  .grade-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 700;
    color: #fff;
  }

  /* 긍/부정 분포 */
  .dist-row {
    display: flex;
    height: 20px;
    border-radius: 10px;
    overflow: hidden;
    margin: 8px 0;
  }
  .dist-pos { background: var(--positive); }
  .dist-neg { background: var(--negative); }
  .dist-x   { background: #bdbdbd; }

  /* 정보 박스 */
  .info-box {
    background: #e8f4fd;
    border-left: 4px solid var(--primary);
    padding: 10px 14px;
    border-radius: 0 8px 8px 0;
    font-size: 0.875rem;
    color: #0d47a1;
    margin: 12px 0;
  }
  .warn-box {
    background: #fff3e0;
    border-left: 4px solid #ff6f00;
    padding: 10px 14px;
    border-radius: 0 8px 8px 0;
    font-size: 0.875rem;
    color: #e65100;
    margin: 12px 0;
  }

  /* 푸터 */
  .report-footer {
    text-align: center;
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }

  /* 등급표 */
  .grade-table td:first-child { font-weight: 700; font-family: monospace; }

  /* 스펙트럼 바 (등급별) */
  .spectrum-wrap { display: flex; gap: 4px; margin: 6px 0; flex-wrap: wrap; }
  .spectrum-chip {
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 600;
    color: #fff;
  }
  .chip-p4 { background: #1b5e20; }
  .chip-p3 { background: #2e7d32; }
  .chip-p2 { background: #43a047; }
  .chip-p1 { background: #66bb6a; color: #212121; }
  .chip-n1 { background: #ef9a9a; color: #212121; }
  .chip-n2 { background: #e53935; }
  .chip-n3 { background: #c62828; }
  .chip-n4 { background: #7f0000; }

  @media (max-width: 600px) {
    .report-header h1 { font-size: 1.4rem; }
    .score-badge { font-size: 1.2rem; }
    .bar-label { width: 60px; }
  }
</style>
"""


def html_grade_badge(grade_code, grade_name):
    color = grade_to_color(grade_code)
    return f'<span class="grade-badge" style="background:{color}">{grade_code} {grade_name}</span>'


def html_bar_row(label, score, max_score=100):
    pct = score_to_pct(score, max_score)
    return (
        f'<div class="bar-row">'
        f'<span class="bar-label">{label}</span>'
        f'<div class="bar-track"><div class="bar-fill" style="width:{pct}%"></div></div>'
        f'<span class="bar-score">{score:.0f}점</span>'
        f'</div>'
    )


def html_spectrum_chips(rating_dist):
    chip_map = {
        '+4': ('chip-p4', '+4'),
        '+3': ('chip-p3', '+3'),
        '+2': ('chip-p2', '+2'),
        '+1': ('chip-p1', '+1'),
        '-1': ('chip-n1', '-1'),
        '-2': ('chip-n2', '-2'),
        '-3': ('chip-n3', '-3'),
        '-4': ('chip-n4', '-4'),
    }
    chips = []
    for r, (cls, label) in chip_map.items():
        cnt = rating_dist.get(r, 0)
        if cnt > 0:
            chips.append(f'<span class="spectrum-chip {cls}">{label}: {cnt}건</span>')
    return '<div class="spectrum-wrap">' + ''.join(chips) + '</div>' if chips else '<span style="color:#9e9e9e">데이터 없음</span>'


# ============================================================
# DB 조회 함수
# ============================================================

def get_final_scores(politician_id):
    """ai_final_scores_v50 테이블에서 최종 점수 조회"""
    result = supabase.table('ai_final_scores_v50') \
        .select('*') \
        .eq('politician_id', politician_id) \
        .execute()
    if not result.data:
        raise ValueError(f"최종 점수 없음: politician_id={politician_id}")
    return result.data[0]


def get_all_evaluations(politician_id, include_reasoning=False):
    """evaluations_v50 테이블 전체 조회 (pagination)"""
    fields = 'evaluator_ai, category, rating'
    if include_reasoning:
        fields += ', reasoning'
    all_data, offset = [], 0
    while True:
        result = supabase.table('evaluations_v50') \
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
    """collected_data_v50 테이블 전체 조회 (pagination)"""
    fields = 'id, category, source_type, collector_ai'
    if include_text:
        fields += ', title, content'
    all_data, offset = [], 0
    while True:
        result = supabase.table('collected_data_v50') \
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


# ============================================================
# 경쟁자 비교 섹션 (Type A/B 공통)
# ============================================================

def build_big4_section_html(target_name, final_score, grade_code, grade_name,
                            cat_scores, big4_data, section_num=None):
    """경쟁자 비교 HTML 섹션 생성"""
    others = {n: d for n, d in big4_data.items() if n != target_name}
    sorted_others = sorted(others.items(), key=lambda x: x[1]['total'], reverse=True)
    other_names = [n for n, _ in sorted_others]

    if section_num is not None:
        heading = f"<h2>{section_num}. 경쟁자 비교</h2>"
    else:
        heading = "<h2>2026 서울시장 경쟁자 비교</h2>"

    # 타겟 포함 전체 4명 점수 → 순위 결정
    all_cands_for_rank = dict(big4_data)
    if target_name not in all_cands_for_rank:
        all_cands_for_rank[target_name] = {
            'total': final_score,
            'grade': get_grade_str(final_score),
        }
    else:
        all_cands_for_rank[target_name]['total'] = final_score
        all_cands_for_rank[target_name]['grade'] = get_grade_str(final_score)

    sorted_all = sorted(all_cands_for_rank.items(), key=lambda x: x[1]['total'], reverse=True)

    html = f'<div class="card">{heading}'
    html += f'<div class="info-box">{BIG4_SELECTION_NOTE}<br>평가 대상 정치인은 경쟁자 목록에서 자동 제외 후 ★ 표시. 점수 차이 10점 이내는 AI 평가 편차 범위 내일 수 있습니다.</div>'

    html += '<h3>종합 점수 순위</h3>'
    html += '<table><tr><th>순위</th><th>경쟁자</th><th>점수</th><th>등급</th></tr>'
    for i, (name, d) in enumerate(sorted_all, 1):
        gcode, gname = get_grade(d['total'])
        badge = html_grade_badge(gcode, gname)
        if name == target_name:
            html += f'<tr class="target-row"><td>★{i}</td><td><strong>{name}</strong></td><td><strong>{d["total"]}점</strong></td><td>{badge}</td></tr>'
        else:
            html += f'<tr><td>{i}</td><td>{name}</td><td>{d["total"]}점</td><td>{badge}</td></tr>'
    html += '</table>'

    # 카테고리별 비교표
    header_names = [target_name] + other_names
    html += '<h3>카테고리별 비교 (10개)</h3>'
    html += '<table><tr><th>카테고리</th>'
    for n in header_names:
        html += f'<th>{"★" if n == target_name else ""}{n}</th>'
    html += '</tr>'
    for cat_en, cat_kr in CATEGORIES.items():
        target_s = cat_scores[cat_en]['avg']
        html += f'<tr><td>{cat_kr}</td>'
        if target_name == header_names[0]:
            html += f'<td><strong>{target_s:.0f}</strong></td>'
        else:
            html += f'<td>{target_s:.0f}</td>'
        for name in other_names:
            s = big4_data.get(name, {}).get('categories', {}).get(cat_en, 0)
            html += f'<td>{s:.0f}</td>'
        html += '</tr>'
    html += '</table>'
    html += '</div>'
    return html


# ============================================================
# Type A — 요약본 생성 (HTML)
# ============================================================

def generate_type_a(target_name, final_score, cat_scores, big4_data, date_str):
    """Type A 요약본 HTML 생성 (V41 가이드 A-1/A-2/A-3)"""
    grade_code, grade_name, grade_rank = get_grade_context(final_score)
    sorted_cats = sorted(cat_scores.items(), key=lambda x: x[1]['avg'], reverse=True)

    top3 = sorted_cats[:3]
    top3_str = ' · '.join(f"{info['kr']}({info['avg']:.0f}점)" for _, info in top3)
    bot1 = sorted_cats[-1]

    stdev_pairs = [(cat_en, info['stdev']) for cat_en, info in cat_scores.items() if info['stdev'] > 0]
    avg_stdev = sum(s for _, s in stdev_pairs) / len(stdev_pairs) if stdev_pairs else 0
    max_stdev_cat, max_stdev_val = max(stdev_pairs, key=lambda x: x[1]) if stdev_pairs else (None, 0)

    all_cands = dict(big4_data)
    if target_name not in all_cands:
        all_cands[target_name] = {'categories': {cat_en: info['avg'] for cat_en, info in cat_scores.items()}}

    def rank_in_group(cat_en, tname):
        scores_group = [(n, d.get('categories', {}).get(cat_en, 0)) for n, d in all_cands.items()]
        scores_group.sort(key=lambda x: x[1], reverse=True)
        for i, (n, _) in enumerate(scores_group):
            if n == tname:
                return i + 1
        return len(scores_group)

    best_rank_cat  = min(CATEGORIES.keys(), key=lambda c: rank_in_group(c, target_name))
    worst_rank_cat = max(CATEGORIES.keys(), key=lambda c: rank_in_group(c, target_name))
    best_rank_n    = rank_in_group(best_rank_cat, target_name)
    worst_rank_n   = rank_in_group(worst_rank_cat, target_name)
    group_size     = len(all_cands)

    grade_color = grade_to_color(grade_code)

    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{target_name} 정치인 평가 요약 — V50</title>
  {HTML_CSS}
</head>
<body>
<div class="report-wrapper">

  <div class="report-header">
    <h1>{target_name} 정치인 평가 요약</h1>
    <div class="meta">
      평가 일자: {date_str} &nbsp;|&nbsp; 평가 AI: Claude · ChatGPT · Gemini · Grok &nbsp;|&nbsp; 평가 엔진: PoliticianFinder AI V50
    </div>
  </div>

  <!-- A-1: 종합 스코어카드 -->
  <div class="card">
    <h2>종합 점수</h2>
    <div class="info-box">
      <strong>{target_name}</strong>는 복수의 AI 분석에서 <strong>{final_score}점({grade_code}등급)</strong>을 기록했습니다.
      가장 두드러진 강점은 {top3_str}이며, {bot1[1]['kr']}({bot1[1]['avg']:.0f}점)이 상대적으로 낮게 나타났습니다.
    </div>

    <div class="score-badge" style="background:{grade_color}">
      {final_score}점 <span class="grade">{grade_code} {grade_name}</span>
    </div>
    <p style="font-size:0.85rem;color:#616161;margin-bottom:16px;">
      {grade_code}등급 = {final_score}점 — 10단계 등급 중 {grade_rank}번째 (M·D·E·P·G·S·B·I·Tn·L 순)
    </p>

    <h3>10개 카테고리 점수 (높은 순)</h3>
"""
    for cat_en, info in sorted_cats:
        html += html_bar_row(info['kr'], info['avg'], 100)

    html += '<p style="font-size:0.8rem;color:#9e9e9e;margin-top:8px;">※ 막대 너비: 100점 만점 기준</p>'
    html += '</div>'

    # A-2: Big 4 비교
    html += build_big4_section_html(target_name, final_score, grade_code, grade_name, cat_scores, big4_data)

    # A-3: 핵심 관찰
    html += '<div class="card"><h2>데이터로 보는 특징</h2>'
    html += '<h3>주목할 점</h3><ul style="padding-left:18px;font-size:0.9rem;">'
    html += f'<li>{top3[0][1]["kr"]}이 {top3[0][1]["avg"]:.0f}점으로 가장 높고, {bot1[1]["kr"]}({bot1[1]["avg"]:.0f}점)이 상대적으로 낮습니다.</li>'
    html += f'<li>복수의 AI 간 평가 편차: 평균 표준편차 {avg_stdev:.1f}점 수준.</li>'
    html += '</ul>'

    html += '<h3>경쟁자 대비 강·약점</h3><ul style="padding-left:18px;font-size:0.9rem;">'
    html += f'<li>경쟁자 {group_size - 1}인 대비 {CATEGORIES[best_rank_cat]} 항목에서 {best_rank_n}위.</li>'
    if worst_rank_cat != best_rank_cat and worst_rank_n == group_size:
        html += f'<li>{CATEGORIES[worst_rank_cat]} 항목은 경쟁자 {group_size}인 중 최하위({worst_rank_n}위).</li>'
    elif worst_rank_cat != best_rank_cat:
        html += f'<li>{CATEGORIES[worst_rank_cat]} 항목에서 {worst_rank_n}위.</li>'
    html += '</ul>'

    if max_stdev_cat:
        html += '<h3>AI 간 의견 차이</h3><ul style="padding-left:18px;font-size:0.9rem;">'
        html += f'<li>{CATEGORIES[max_stdev_cat]} 항목에서 AI 간 의견 차이가 가장 큽니다 (표준편차 {max_stdev_val:.1f}점).</li>'
        html += '</ul>'

    html += f'''<div class="warn-box">
      ⚠️ <strong>유의사항</strong>: 이 요약본은 복수의 AI가 공개 자료를 분석한 결과입니다.
      여론조사·법적 판단·인물 평가가 아닙니다. 평가 일자 이후 활동은 반영되지 않습니다.
    </div>
    </div>

  <div class="report-footer">
    평가 엔진: PoliticianFinder AI V50 &nbsp;|&nbsp; 생성일: {date_str}
  </div>
</div>
</body>
</html>'''
    return html


# ============================================================
# Type B — 상세본 생성 (HTML)
# ============================================================

def generate_type_b(target_name, final_scores_raw, cat_scores, big4_data, profile,
                    ai_stats, evaluations, collected_data, date_str):
    """Type B 상세본 HTML 생성 (V41 가이드 8섹션)"""

    final_score = final_scores_raw['final_score']
    grade_code, grade_name, grade_rank = get_grade_context(final_score)
    grade_color = grade_to_color(grade_code)

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
    avg_score = avg_rating * 2

    total_collected = len(collected_data)
    sorted_cats = sorted(cat_scores.items(), key=lambda x: x[1]['avg'], reverse=True)
    top_cats = sorted_cats[:5]
    bot_cats = sorted_cats[-3:]

    # avg_rating 설명 문구
    if avg_rating >= 1.5:
        avg_rating_desc = "+2(양호)에 가까운 긍정"
    elif avg_rating >= 0.5:
        avg_rating_desc = "+1(보통) 수준의 긍정"
    else:
        avg_rating_desc = "중립에 가까운 수준"

    # AI 합의 분석
    sorted_by_stdev = sorted(cat_scores.items(), key=lambda x: x[1]['stdev'])
    consensus_cats = [CATEGORIES[c] for c, _ in sorted_by_stdev[:3] if cat_scores[c]['stdev'] < 3]
    max_discord    = sorted_by_stdev[-1]

    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{target_name} AI 기반 정치인 상세평가보고서 — V50</title>
  {HTML_CSS}
</head>
<body>
<div class="report-wrapper">

  <div class="report-header">
    <h1>{target_name} AI 기반 정치인 상세평가보고서 (당사자 전용)</h1>
    <div class="meta">
      🔒 이 보고서는 당사자 전용 비공개 문서입니다.<br>
      평가 버전: V50 &nbsp;|&nbsp; 평가 일자: {date_str} &nbsp;|&nbsp;
      총 평가 수: {total_all:,}개 (복수의 AI × 약 {total_all // max(len(available_ais), 1):,}개) &nbsp;|&nbsp;
      평가 AI: Claude · ChatGPT · Grok · Gemini
    </div>
  </div>
"""

    # ─── B-1: 정치인 프로필 ───
    html += '<div class="card"><h2>1. 정치인 프로필</h2>'
    if profile:
        career = profile.get('career', [])
        if isinstance(career, str):
            try:
                career = json.loads(career)
            except Exception:
                career = []
        career_items = ''.join(f'<li>{item}</li>' for item in career[:5]) if career else '<li>경력 정보 미등록</li>'
        html += f"""<table>
<tr><td><strong>이름</strong></td><td>{profile.get('name', target_name)}</td></tr>
<tr><td><strong>소속 정당</strong></td><td>{profile.get('party', '-')}</td></tr>
<tr><td><strong>현직</strong></td><td>{profile.get('position', '-')}</td></tr>
<tr><td><strong>이전 직책</strong></td><td>{profile.get('previous_position', '-')}</td></tr>
</table>
<h3>주요 경력</h3><ul style="padding-left:18px;font-size:0.9rem;">{career_items}</ul>"""
    else:
        html += f'<table><tr><td><strong>이름</strong></td><td>{target_name}</td></tr></table>'
    html += '</div>'

    # ─── B-2: 평가 요약 ───
    html += f'<div class="card"><h2>2. 평가 요약</h2>'
    html += '<h3>최종 점수 및 등급</h3>'
    html += f'<div class="score-badge" style="background:{grade_color}">{final_score}점 <span class="grade">{grade_code} {grade_name}</span></div>'
    html += f'<div class="info-box">평가 등급은 -4(최악) ~ +4(탁월) 사이입니다. 4 AI 평균 rating {avg_rating:+.2f}는 "{avg_rating_desc}" 수준입니다.</div>'

    html += '<h3>10개 카테고리 점수 (높은 순)</h3>'
    for cat_en, info in sorted_cats:
        html += html_bar_row(info['kr'], info['avg'], 100)
    html += '<p style="font-size:0.8rem;color:#9e9e9e;margin-top:8px;">※ 막대 너비: 100점 만점 기준</p>'

    html += '<h3>AI별 점수 상세</h3>'
    html += '<table><tr><th>AI</th><th>점수</th><th>avg_rating</th><th>avg_score</th></tr>'
    for ai, score in sorted(ai_final_scores.items(), key=lambda x: x[1], reverse=True):
        if ai in ai_stats:
            ar = ai_stats[ai]['avg_rating']
            as_ = ar * 2
            html += f'<tr><td>{ai}</td><td>{score}점</td><td>{ar:+.2f}</td><td>{as_:+.2f}</td></tr>'
    html += f'<tr style="font-weight:700;background:#e3f2fd"><td>4 AI 평균</td><td>{final_score}점</td><td>{avg_rating:+.2f}</td><td>{avg_score:+.2f}</td></tr>'
    html += '</table>'

    gemini_score = ai_final_scores.get('Gemini', 0)
    other_scores = [v for k, v in ai_final_scores.items() if k != 'Gemini']
    if other_scores and gemini_score > max(other_scores) + 20:
        avg_others = sum(other_scores) / len(other_scores)
        html += f'<div class="warn-box">⚠️ Gemini가 다른 AI 평균 대비 {gemini_score - avg_others:.0f}점 높게 평가했습니다. 참고용으로만 활용하세요.</div>'

    html += f'''<h3>AI 합의 신뢰도</h3>
<div class="info-box">
  합의 기준: 강한 합의(표준편차 &lt; 3점) · 중간 합의(3~5점) · 이견(5점 초과)<br>
  <strong>강한 합의 카테고리</strong>: {', '.join(consensus_cats) if consensus_cats else 'N/A'}<br>
  <strong>이견이 가장 큰 카테고리</strong>: {CATEGORIES[max_discord[0]]} (표준편차 {max_discord[1]['stdev']:.1f}점)<br>
  <strong>유효 데이터</strong>: {total_all - total_x:,}개 / 전체 {total_all:,}개 ({(total_all - total_x) / total_all * 100 if total_all else 0:.1f}%)
  ※ 유효 데이터 = X(평가 제외) 제거 후 실제 평가에 사용된 데이터
</div>
</div>'''

    # ─── B-3: Big 4 비교 ───
    html += build_big4_section_html(target_name, final_score, grade_code, grade_name,
                                    cat_scores, big4_data, section_num=3)

    # ─── B-4: 강점 분석 ───
    html += '<div class="card"><h2>4. 강점 분석</h2>'
    for rank, (cat_en, info) in enumerate(top_cats, 1):
        scores, ai_names = info['scores'], info['ai_names']
        if scores:
            max_idx = scores.index(max(scores))
            min_idx = scores.index(min(scores))
            gap = scores[max_idx] - scores[min_idx]
        else:
            max_idx = min_idx = 0
            gap = 0
        consistency = "강한 합의" if info['stdev'] < 3 else ("중간 합의" if info['stdev'] < 5 else "평가 분산")
        ai_str = ' · '.join(f"{ai_names[i]} {scores[i]:.0f}점" for i in range(min(len(ai_names), len(scores))))
        t = info['total']
        pos_p = info['pos'] / t * 100 if t else 0
        neg_p = info['neg'] / t * 100 if t else 0
        dist = info.get('rating_dist', {})
        extreme_pos = dist.get('+4', 0)
        extreme_neg = dist.get('-4', 0)

        html += f'<h3>강점 {rank}: {info["kr"]} ({info["avg"]:.0f}점)</h3>'
        html += html_bar_row(info['kr'], info['avg'], 100)
        html += f'<p style="font-size:0.85rem;color:#616161;">AI별: {ai_str}</p>'
        html += f'<p style="font-size:0.85rem;">일치도: <strong>{consistency}</strong> (표준편차 {info["stdev"]:.1f}점 / 최고-최저 격차 {gap:.0f}점)</p>'
        html += '<p style="font-size:0.85rem;margin-top:6px;">등급 분포 스펙트럼</p>'
        html += html_spectrum_chips(dist)
        html += f'<p style="font-size:0.82rem;color:#616161;margin-top:4px;">긍정({info["pos"]}건 / {pos_p:.0f}%) · 부정({info["neg"]}건 / {neg_p:.0f}%) · 제외 X({info["x"]}건) / 극단성: +4 {extreme_pos}건, -4 {extreme_neg}건</p>'
        html += '<hr style="border:none;border-top:1px solid #eeeeee;margin:14px 0;">'
    html += '</div>'

    # ─── B-5: 약점 분석 ───
    html += '<div class="card"><h2>5. 약점 분석</h2>'
    for rank, (cat_en, info) in enumerate(bot_cats, 1):
        scores, ai_names = info['scores'], info['ai_names']
        if scores:
            max_idx = scores.index(max(scores))
            min_idx = scores.index(min(scores))
            gap = scores[max_idx] - scores[min_idx]
        else:
            max_idx = min_idx = 0
            gap = 0
        consistency = "강한 합의" if info['stdev'] < 3 else ("중간 합의" if info['stdev'] < 5 else "평가 분산")
        ai_str = ' · '.join(f"{ai_names[i]} {scores[i]:.0f}점" for i in range(min(len(ai_names), len(scores))))
        cat_rank = next((i + 1 for i, (c, _) in enumerate(sorted_cats) if c == cat_en), 0)
        t = info['total']
        pos_p = info['pos'] / t * 100 if t else 0
        neg_p = info['neg'] / t * 100 if t else 0
        dist = info.get('rating_dist', {})
        extreme_pos = dist.get('+4', 0)
        extreme_neg = dist.get('-4', 0)

        html += f'<h3>약점 {rank}: {info["kr"]} ({info["avg"]:.0f}점) — 10개 카테고리 중 하위 {cat_rank}위</h3>'
        html += html_bar_row(info['kr'], info['avg'], 100)
        html += f'<p style="font-size:0.85rem;color:#616161;">AI별: {ai_str}</p>'
        html += f'<p style="font-size:0.85rem;">평가 편차: <strong>{consistency}</strong> (표준편차 {info["stdev"]:.1f}점 / 최대 격차 {gap:.0f}점)</p>'
        html += '<p style="font-size:0.85rem;margin-top:6px;">등급 분포 스펙트럼</p>'
        html += html_spectrum_chips(dist)
        html += f'<p style="font-size:0.82rem;color:#616161;margin-top:4px;">긍정({info["pos"]}건 / {pos_p:.0f}%) · 부정({info["neg"]}건 / {neg_p:.0f}%) · 제외 X({info["x"]}건) / 극단성: +4 {extreme_pos}건, -4 {extreme_neg}건</p>'
        html += '<hr style="border:none;border-top:1px solid #eeeeee;margin:14px 0;">'
    html += '</div>'

    # ─── B-6: 카테고리별 상세 ───
    html += '<div class="card"><h2>6. 카테고리별 상세</h2>'
    for idx, (cat_en, cat_kr) in enumerate(CATEGORIES.items(), 1):
        info = cat_scores[cat_en]
        scores, ai_names = info['scores'], info['ai_names']
        t = info['total']
        xp_cat = info['x'] / t * 100 if t else 0
        pp_cat = info['pos'] / t * 100 if t else 0
        np_cat = info['neg'] / t * 100 if t else 0

        html += f'<h3>6.{idx} {cat_kr} ({info["avg"]:.0f}점)</h3>'
        html += html_bar_row(cat_kr, info['avg'], 100)

        html += '<h4 style="font-size:0.875rem;margin:10px 0 6px;">AI별 등급 분포 스펙트럼</h4>'
        html += '<table><tr><th>AI</th><th>+4</th><th>+3</th><th>+2</th><th>+1</th><th>-1</th><th>-2</th><th>-3</th><th>-4</th><th>점수</th></tr>'
        for i, ai in enumerate(ai_names):
            if i >= len(scores):
                continue
            d = info['ai_detail'].get(ai, {})
            rd = d.get('rating_dist', {})
            row = ''.join(f'<td>{rd.get(r, 0)}</td>' for r in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4'])
            html += f'<tr><td>{ai}</td>{row}<td>{scores[i]:.0f}점</td></tr>'
        html += f'<tr style="font-weight:700;background:#e3f2fd"><td>합계</td><td colspan="8">—</td><td>{info["avg"]:.0f}점</td></tr>'
        html += '</table>'

        if xp_cat >= 50:
            html += f'<div class="warn-box">⚠️ 이 카테고리는 유효 평가 비율이 {100 - xp_cat:.0f}%입니다. 관련 공개 자료가 적어 X(제외) 비율이 높습니다.</div>'
        html += f'<p style="font-size:0.82rem;color:#616161;margin-top:6px;">전체 {t}개: 긍정 {info["pos"]}건({pp_cat:.0f}%) · 부정 {info["neg"]}건({np_cat:.0f}%) · X {info["x"]}건({xp_cat:.0f}%)</p>'
        html += '<hr style="border:none;border-top:1px solid #eeeeee;margin:14px 0;">'
    html += '</div>'

    # ─── B-7: 데이터 분석 ───
    gc = len([d for d in collected_data if d.get('collector_ai') == 'Gemini'])
    nc = len([d for d in collected_data if d.get('collector_ai') == 'Naver'])
    xc = len([d for d in collected_data if d.get('collector_ai') == 'Grok-X'])
    go = len([d for d in collected_data if d.get('collector_ai') == 'Gemini' and d.get('source_type', '').upper() == 'OFFICIAL'])
    gp = len([d for d in collected_data if d.get('collector_ai') == 'Gemini' and d.get('source_type', '').upper() == 'PUBLIC'])
    no = len([d for d in collected_data if d.get('collector_ai') == 'Naver'  and d.get('source_type', '').upper() == 'OFFICIAL'])
    np_ = len([d for d in collected_data if d.get('collector_ai') == 'Naver' and d.get('source_type', '').upper() == 'PUBLIC'])
    total_o = go + no
    total_p = gp + np_ + xc  # Grok-X는 전부 PUBLIC

    html += f'''<div class="card"><h2>7. 데이터 분석</h2>
<h3>7.1 전체 등급 분포</h3>
<table>
  <tr><th>구분</th><th>개수</th><th>비율</th></tr>
  <tr><td>긍정 (+1~+4)</td><td>{total_positive:,}개</td><td>{pos_pct:.1f}%</td></tr>
  <tr><td>부정 (-1~-4)</td><td>{total_negative:,}개</td><td>{neg_pct:.1f}%</td></tr>
  <tr><td>제외 (X)</td><td>{total_x:,}개</td><td>{x_pct:.1f}%</td></tr>
  <tr style="font-weight:700;background:#e3f2fd"><td>총합</td><td>{total_all:,}개</td><td>100%</td></tr>
</table>
<h3>7.2 카테고리별 분포</h3>
<table>
  <tr><th>카테고리</th><th>긍정</th><th>부정</th><th>제외(X)</th></tr>'''
    for cat_en, info in cat_scores.items():
        t = info['total']
        pp = info['pos'] / t * 100 if t else 0
        np_c = info['neg'] / t * 100 if t else 0
        xp = info['x'] / t * 100 if t else 0
        html += f'<tr><td>{info["kr"]}</td><td>{pp:.0f}%</td><td>{np_c:.0f}%</td><td>{xp:.0f}%</td></tr>'
    html += f'''</table>
<h3>7.3 데이터 출처</h3>
<table>
  <tr><th>채널</th><th>총 수집</th><th>OFFICIAL</th><th>PUBLIC</th></tr>
  <tr><td>Gemini API (40%)</td><td>{gc}개</td><td>{go}개 ({go/gc*100 if gc else 0:.0f}%)</td><td>{gp}개 ({gp/gc*100 if gc else 0:.0f}%)</td></tr>
  <tr><td>Grok-X (10%)</td><td>{xc}개</td><td>0개 (0%)</td><td>{xc}개 (100%)</td></tr>
  <tr><td>Naver API (50%)</td><td>{nc}개</td><td>{no}개 ({no/nc*100 if nc else 0:.0f}%)</td><td>{np_}개 ({np_/nc*100 if nc else 0:.0f}%)</td></tr>
  <tr style="font-weight:700;background:#e3f2fd"><td>합계</td><td>{total_collected}개</td><td>{total_o}개 ({total_o/total_collected*100 if total_collected else 0:.0f}%)</td><td>{total_p}개 ({total_p/total_collected*100 if total_collected else 0:.0f}%)</td></tr>
</table>
<h3>7.4 데이터 품질</h3>
<ul style="padding-left:18px;font-size:0.9rem;">
  <li>총 평가 수: {total_all:,}개 (복수의 AI 합산)</li>
  <li>유효 평가 (X 제외): {total_all - total_x:,}개 ({(total_all - total_x)/total_all*100 if total_all else 0:.1f}%)</li>
  <li>평가 제외 (X): {total_x:,}개 ({x_pct:.1f}%)</li>
  <li>복수의 AI 평균 avg_rating: {avg_rating:+.2f} → avg_score {avg_score:+.2f}</li>
</ul>
</div>'''

    # ─── B-8: 평가의 한계 및 유의사항 ───
    html += '''<div class="card"><h2>8. 평가의 한계 및 유의사항</h2>
<h3>데이터 수집 한계</h3>
<ol style="padding-left:18px;font-size:0.9rem;">
  <li>수집 기간 제한: OFFICIAL 최근 4년, PUBLIC 최근 2년 이내 자료만 반영</li>
  <li>검색 편향: Gemini API / Grok-X / Naver API 알고리즘에 따른 데이터 편향 가능성</li>
  <li>미수집 자료: 비공개 문서, 오프라인 활동, 구두 발언 등 미반영</li>
</ol>
<h3>AI 평가 한계</h3>
<ol style="padding-left:18px;font-size:0.9rem;">
  <li>AI 특성 편향: 각 AI는 학습 데이터에 따른 편향 존재 (복수 AI 평균으로 완화)</li>
  <li>맥락 이해: 정치적 배경, 지역 특성, 역사적 맥락의 완전한 이해 불가</li>
</ol>
<h3>이용 시 유의사항</h3>
<ol style="padding-left:18px;font-size:0.9rem;">
  <li>이 보고서는 <strong>참고 자료</strong>입니다. 최종 판단은 이용자 본인에게 있습니다.</li>
  <li><strong>여론조사가 아닙니다.</strong> 등급 분포는 시민 여론과 다를 수 있습니다.</li>
  <li><strong>법적 판단이 아닙니다.</strong> 논란·의혹 관련 평가는 법적 유무죄와 무관합니다.</li>
  <li><strong>실시간 업데이트 안 됩니다.</strong> 평가 일자 이후 활동은 반영되지 않습니다.</li>
  <li><strong>당사자 전용 문서</strong>입니다. 무단 배포 시 법적 책임이 따를 수 있습니다.</li>
</ol>
</div>'''

    # ─── B-9: 참고자료 및 마무리 ───
    html += f'''<div class="card"><h2>9. 참고자료 및 마무리</h2>
<h3>평가 시스템 개요</h3>
<table>
  <tr><td>수집 채널</td><td>Gemini API 40% + Grok-X 10% + Naver API 50%</td></tr>
  <tr><td>수집 기간</td><td>OFFICIAL 4년 이내 / PUBLIC 2년 이내</td></tr>
  <tr><td>평가 AI</td><td>Claude · ChatGPT · Grok · Gemini (복수의 AI)</td></tr>
  <tr><td>등급 체계</td><td>+4(탁월) ~ -4(최악), X(제외)</td></tr>
  <tr><td>점수 공식</td><td>avg_rating × 2 = avg_score → (6.0 + avg_score × 0.5) × 10 = 카테고리 점수</td></tr>
  <tr><td>최종 점수</td><td>10개 카테고리 합산, 범위 200~1,000점</td></tr>
  <tr><td>경쟁자 선정</td><td>{BIG4_SELECTION_NOTE}</td></tr>
</table>
<h3>등급 기준표</h3>
<table class="grade-table">
  <tr><th>등급</th><th>점수 범위</th><th>의미</th></tr>
  <tr><td>M</td><td>920~1,000점</td><td>최우수</td></tr>
  <tr><td>D</td><td>840~919점</td><td>우수</td></tr>
  <tr><td>E</td><td>760~839점</td><td>양호</td></tr>
  <tr><td>P</td><td>680~759점</td><td>보통+</td></tr>
  <tr><td>G</td><td>600~679점</td><td>보통</td></tr>
  <tr><td>S</td><td>520~599점</td><td>보통-</td></tr>
  <tr><td>B</td><td>440~519점</td><td>미흡</td></tr>
  <tr><td>I</td><td>360~439점</td><td>부족</td></tr>
  <tr><td>Tn</td><td>280~359점</td><td>상당히 부족</td></tr>
  <tr><td>L</td><td>200~279점</td><td>매우 부족</td></tr>
</table>
</div>

<div class="report-footer">
  생성 일시: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} &nbsp;|&nbsp;
  생성 시스템: PoliticianFinder AI 평가 엔진 V50 &nbsp;|&nbsp;
  보고서 유형: Type B — 상세본 (당사자 전용 비공개)<br>
  🔒 이 문서는 {target_name} 당사자 전용입니다. 무단 공개·배포 금지.
</div>

</div>
</body>
</html>'''
    return html


# ============================================================
# 저장 함수
# ============================================================

def save_report(content, politician_name, report_type, grade_code):
    """보고서 저장 — 파일명: {이름}_{YYYYMMDD}_{등급}.html"""
    date_str = datetime.now().strftime('%Y%m%d')
    filename = f"{politician_name}_{date_str}_{grade_code}.html"

    script_dir = Path(__file__).resolve().parent   # V50/scripts/
    v50_dir    = script_dir.parent                 # V50/
    report_dir = v50_dir / '보고서'
    report_dir.mkdir(exist_ok=True)

    filepath = report_dir / filename
    filepath.write_text(content, encoding='utf-8')
    return str(filepath)


# ============================================================
# 메인
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description='V50 보고서 생성 (V41 가이드 기준, HTML 출력)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  python generate_report_v50.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=A
  python generate_report_v50.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=B
  python generate_report_v50.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=AB
""")
    parser.add_argument('--politician_id',   required=True, help='정치인 ID (8자리 hex)')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--type', default='B', choices=['A', 'B', 'AB'],
                        help='보고서 타입 (A=요약본, B=상세본, AB=둘 다)')
    args = parser.parse_args()

    pid, pname, rtype = args.politician_id, args.politician_name, args.type
    date_str = datetime.now().strftime('%Y-%m-%d')

    print(f"[보고서 생성] {pname} ({pid}) — Type {rtype}")

    # 데이터 수집
    print("  1. 최종 점수 조회...")
    final_scores_raw = get_final_scores(pid)
    ai_cat_raw = final_scores_raw.get('ai_category_scores', {})
    if isinstance(ai_cat_raw, str):
        ai_cat_raw = json.loads(ai_cat_raw)

    final_score = final_scores_raw['final_score']
    grade_code, grade_name = get_grade(final_score)

    print("  2. 평가 데이터 조회...")
    evaluations = get_all_evaluations(pid, include_reasoning=False)

    print("  3. 수집 데이터 조회...")
    collected_data = get_collected_data(pid, include_text=False)

    print("  4. Big 4 점수 조회...")
    big4_data = get_big4_scores()

    print("  5. 통계 계산...")
    ai_stats   = calculate_ai_statistics(evaluations)
    cat_scores = build_category_scores(ai_cat_raw, ai_stats, evaluations)

    profile = None
    if rtype in ('B', 'AB'):
        print("  6. 정치인 프로필 조회...")
        profile = get_politician_profile(pid)

    # 보고서 생성 및 저장
    if rtype in ('A', 'AB'):
        print("  → Type A 요약본 생성 (HTML)...")
        report_a = generate_type_a(pname, final_score, cat_scores, big4_data, date_str)
        path_a = save_report(report_a, pname, 'A', grade_code)
        print(f"  완료 Type A 저장: {path_a}")

    if rtype in ('B', 'AB'):
        print("  → Type B 상세본 생성 (HTML)...")
        report_b = generate_type_b(
            pname, final_scores_raw, cat_scores, big4_data, profile,
            ai_stats, evaluations, collected_data, date_str,
        )
        path_b = save_report(report_b, pname, 'B', grade_code)
        print(f"  완료 Type B 저장: {path_b}")

    print("\n[완료] 보고서 생성 완료")


if __name__ == '__main__':
    main()
