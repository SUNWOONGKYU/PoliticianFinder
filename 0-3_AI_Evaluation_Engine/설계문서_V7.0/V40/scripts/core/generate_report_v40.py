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


def ascii_bar(score, max_score=100, width=10):
    """ASCII 막대 차트: 1칸 = max_score/width 점, 최대 width칸"""
    filled = max(0, min(int(score / max_score * width), width))
    return '█' * filled + '░' * (width - filled)


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


# ============================================================
# 경쟁자 비교 섹션 (Type A/B 공통)
# ============================================================

def build_big4_section(target_name, final_score, grade, cat_scores, big4_data, section_num=None):
    """경쟁자 비교 마크다운 섹션 생성"""
    others = {n: d for n, d in big4_data.items() if n != target_name}
    sorted_others = sorted(others.items(), key=lambda x: x[1]['total'], reverse=True)
    other_names = [n for n, _ in sorted_others]

    if section_num is not None:
        heading = f"## {section_num}. 경쟁자 비교"
    else:
        heading = "## 2026 서울시장 경쟁자 비교"

    section = f"""{heading}

> ℹ️ {BIG4_SELECTION_NOTE}
> ⚠️ 평가 대상 정치인은 경쟁자 목록에서 자동 제외 후 별도 ★ 표시
> ℹ️ 점수 차이 10점 이내는 AI 평가 편차 범위 내일 수 있습니다.

### 종합 점수 순위

| 순위 | 경쟁자 | 점수 | 등급 |
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
    grade_code, grade_name, grade_rank = get_grade_context(final_score)
    sorted_cats = sorted(cat_scores.items(), key=lambda x: x[1]['avg'], reverse=True)

    # 자연어 요약 블록
    top3 = sorted_cats[:3]
    top3_str = '·'.join(f"{info['kr']}({info['avg']:.0f}점)" for _, info in top3)
    bot1 = sorted_cats[-1]
    summary_block = f"""> **{target_name}**는 AI 4개 분석에서 **{final_score}점({grade_code}등급)**을 기록했습니다.
> 가장 두드러진 강점은 {top3_str}이며, {bot1[1]['kr']}({bot1[1]['avg']:.0f}점)이 상대적으로 낮게 나타났습니다.

"""

    # ─── A-1: 종합 스코어카드 ───
    report = f"""# {target_name} 정치인 평가 요약

**평가 일자**: {date_str}  |  **평가 AI**: Claude · ChatGPT · Gemini · Grok

---

{summary_block}## 종합 점수

| 항목 | 내용 |
|------|------|
| **최종 점수** | **{final_score}점** / 1,000점 |
| **등급** | **{grade}** |

> ※ {grade_code}등급 = {final_score}점 — 10단계 등급 중 {grade_rank}번째 (M·D·E·P·G·S·B·I·Tn·L 순)

### 10개 카테고리 점수 (높은 순)

```
"""
    for cat_en, info in sorted_cats:
        bar = ascii_bar(info['avg'], 100, 10)
        report += f"{info['kr']:<8} {bar} {info['avg']:.0f}점\n"
    report += "```\n*(막대 10칸 = 100점 만점 기준, ██=획득 점수, ░=잔여)*\n\n---\n\n"

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

    report += """## 데이터로 보는 특징

### 주목할 점
"""
    report += f"- {top_cat_info['kr']}이 {top_cat_info['avg']:.0f}점으로 가장 높고, {bot_cat_info['kr']}({bot_cat_info['avg']:.0f}점)이 상대적으로 낮습니다.\n"
    report += f"- 4개 AI 간 평가 편차: 평균 표준편차 {avg_stdev:.1f}점 수준.\n"

    report += "\n### 경쟁자 대비 강·약점\n"
    report += f"- 경쟁자 {group_size - 1}인 대비 {CATEGORIES[best_rank_cat]} 항목에서 {best_rank_n}위.\n"
    if worst_rank_cat != best_rank_cat and worst_rank_n == group_size:
        report += f"- {CATEGORIES[worst_rank_cat]} 항목은 경쟁자 {group_size}인 중 최하위({worst_rank_n}위).\n"
    elif worst_rank_cat != best_rank_cat:
        report += f"- {CATEGORIES[worst_rank_cat]} 항목에서 {worst_rank_n}위.\n"

    if max_stdev_cat:
        report += "\n### AI 간 의견 차이\n"
        report += f"- {CATEGORIES[max_stdev_cat]} 항목에서 AI 간 의견 차이가 가장 큽니다 (표준편차 {max_stdev_val:.1f}점).\n"

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
                    ai_stats, evaluations, collected_data, date_str):
    """Type B 상세본 생성 (V41 가이드 8섹션)"""

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
        if career:
            for item in career[:5]:
                report += f"- {item}\n"
        else:
            report += "*(경력 정보 미등록)*\n"
    else:
        report += f"| 항목 | 내용 |\n|------|------|\n| **이름** | {target_name} |\n"

    # ─── B-2: 평가 요약 ───
    # avg_rating 설명 문구
    if avg_rating >= 1.5:
        avg_rating_desc = "+2(양호)에 가까운 긍정"
    elif avg_rating >= 0.5:
        avg_rating_desc = "+1(보통) 수준의 긍정"
    else:
        avg_rating_desc = "중립에 가까운 수준"

    report += f"""
---

## 2. 평가 요약

### 최종 점수 및 등급

| 항목 | 내용 |
|------|------|
| **최종 점수** | **{final_score}점** / 1,000점 |
| **등급** | **{grade}** |
| **4 AI 평균 rating** | {avg_rating:+.2f} |

> ℹ️ 평가 등급은 -4(최악) ~ +4(탁월) 사이입니다. {avg_rating:+.2f}는 "{avg_rating_desc}" 수준입니다.

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

    # Gemini 편향 주의
    gemini_score = ai_final_scores.get('Gemini', 0)
    other_scores = [v for k, v in ai_final_scores.items() if k != 'Gemini']
    if other_scores and gemini_score > max(other_scores) + 20:
        avg_others = sum(other_scores) / len(other_scores)
        report += f"\n> ⚠️ Gemini가 다른 AI 평균 대비 {gemini_score - avg_others:.0f}점 높게 평가했습니다. 참고용으로만 활용하세요.\n"

    # AI 합의 분석 (방향 합의 기준)
    sorted_by_stdev = sorted(cat_scores.items(), key=lambda x: x[1]['stdev'])
    # 방향 합의: 표준편차 < 3점인 카테고리
    consensus_cats = [CATEGORIES[c] for c, _ in sorted_by_stdev[:3] if cat_scores[c]['stdev'] < 3]
    max_discord    = sorted_by_stdev[-1]

    report += f"""
### AI 합의 신뢰도

> **합의 기준**: 강한 합의(표준편차 < 3점) · 중간 합의(3~5점) · 이견(5점 초과)

- **강한 합의 카테고리**: {', '.join(consensus_cats) if consensus_cats else 'N/A'}
- **이견이 가장 큰 카테고리**: {CATEGORIES[max_discord[0]]} (표준편차 {max_discord[1]['stdev']:.1f}점)
- **유효 데이터**: {total_all - total_x:,}개 / 전체 {total_all:,}개 ({(total_all - total_x) / total_all * 100 if total_all else 0:.1f}%)
  ※ 유효 데이터 = X(평가 제외) 제거 후 실제 평가에 사용된 데이터

---

"""
    # Big 4 비교 (section_num=3 전달)
    report += build_big4_section(target_name, final_score, grade, cat_scores, big4_data, section_num=3)

    # ─── B-4: 강점 분석 ───
    report += "## 4. 강점 분석\n\n"
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

    # ─── B-5: 약점 분석 ───
    report += "## 5. 약점 분석\n\n"
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

    # ─── B-6: 카테고리별 상세 (등급 분포 스펙트럼 포함) ───
    report += "## 6. 카테고리별 상세\n\n"
    for idx, (cat_en, cat_kr) in enumerate(CATEGORIES.items(), 1):
        info = cat_scores[cat_en]
        scores, ai_names = info['scores'], info['ai_names']
        t = info['total']

        report += f"### 6.{idx} {cat_kr} ({info['avg']:.0f}점)\n\n"

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

        x_warning = ""
        if xp_cat >= 50:
            x_warning = f"\n> ⚠️ 이 카테고리는 유효 평가 비율이 {100-xp_cat:.0f}%입니다. 관련 공개 자료가 적어 X(제외) 비율이 높습니다.\n"
        report += f"전체 {t}개: 긍정 {info['pos']}건({pp_cat:.0f}%) · 부정 {info['neg']}건({np_cat:.0f}%) · X {info['x']}건({xp_cat:.0f}%)\n{x_warning}\n"

    report += "---\n\n"

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
"""
    total_o = go + no
    total_p = gp + np_
    report += f"| **합계**   | **{total_collected}개** | {total_o}개 ({total_o/total_collected*100 if total_collected else 0:.0f}%) | {total_p}개 ({total_p/total_collected*100 if total_collected else 0:.0f}%) |\n"

    report += f"""
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
| 경쟁자 선정 | {BIG4_SELECTION_NOTE} |

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
  python generate_report_v40.py --politician_id=d0a5d6e1 --politician_name=조은희 --type=AB
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
        print("  → Type A 요약본 생성...")
        report_a = generate_type_a(pname, final_scores_raw['final_score'], cat_scores, big4_data, date_str)
        path_a = save_report(report_a, pname, 'A')
        print(f"  ✅ Type A 저장: {path_a}")

    if rtype in ('B', 'AB'):
        print("  → Type B 상세본 생성...")
        report_b = generate_type_b(
            pname, final_scores_raw, cat_scores, big4_data, profile,
            ai_stats, evaluations, collected_data, date_str,
        )
        path_b = save_report(report_b, pname, 'B')
        print(f"  ✅ Type B 저장: {path_b}")

    print("\n[완료] 보고서 생성 완료")


if __name__ == '__main__':
    main()
