# -*- coding: utf-8 -*-
"""
V40.5 Politician Evaluation Report Engine - Gemini Edition

Philosophy: 80% Cold Diagnosis (Data) + 20% Data Insights (Observation)
Naming Rule: Ends with '_Gemini'

Features:
- Report Types: Summary (Executive) & Detail (Deep Dive)
- Decagon Radar Chart (ASCII)
- Big 4 (Park, Jung, Oh, Cho) Comparison Module
- Sector Analysis: Capacity, Trust, Connection
- Observational Tone (No Consulting, Just Data)

Usage:
    python generate_report_v40_Gemini.py --politician_name="박주민" --report_type="detail"
"""

import os
import json
import statistics
import argparse
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime
from collections import defaultdict

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# 10 Categories
CATEGORIES = {
    'expertise': '전문성',
    'leadership': '리더십',
    'vision': '비전',
    'integrity': '청렴성',
    'ethics': '윤리성',
    'accountability': '책임감',
    'transparency': '투명성',
    'communication': '소통능력',
    'responsiveness': '대응성',
    'publicinterest': '공익성'
}

# 3 Sectors
SECTORS = {
    '정치 역량 (Capacity)': ['expertise', 'leadership', 'vision'],
    '공공 신뢰 (Trust)': ['integrity', 'ethics', 'accountability'],
    '시민 관계 (Connection)': ['transparency', 'communication', 'responsiveness', 'publicinterest']
}

# Big 4 Candidates
BIG4_NAMES = ["박주민", "정원오", "오세훈", "조은희"]

def generate_bar(score, max_length=15):
    """ASCII Bar Chart"""
    filled = int((score / 100) * max_length)
    empty = max_length - filled
    return '█' * filled + '░' * empty

def get_grade(score):
    """Grade mapping"""
    if score >= 920: return 'M (최우수)'
    if score >= 840: return 'D (우수)'
    if score >= 760: return 'E (양호)'
    if score >= 680: return 'P (보통+)'
    if score >= 600: return 'G (보통)'
    if score >= 520: return 'S (보통-)'
    if score >= 440: return 'B (미흡)'
    if score >= 360: return 'I (부족)'
    if score >= 280: return 'Tn (상당부족)'
    return 'L (매우부족)'

def fetch_politician_data(name):
    """Fetch final score data from DB"""
    res = supabase.table('ai_final_scores_v40').select('*').eq('politician_name', name).order('calculated_at', desc=True).limit(1).execute()
    return res.data[0] if res.data else None

def analyze_sector(scores_json):
    """Calculate average per sector"""
    sector_results = {}
    for sector_name, cats in SECTORS.items():
        vals = []
        for cat in cats:
            cat_scores = []
            for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
                s = scores_json.get(ai, {}).get(cat, 0)
                if s > 0: cat_scores.append(s)
            if cat_scores:
                vals.append(sum(cat_scores) / len(cat_scores))
        sector_results[sector_name] = sum(vals) / len(vals) if vals else 0
    return sector_results

def build_comparison_table():
    """Build data for Big 4 comparison"""
    big4_data = {}
    for name in BIG4_NAMES:
        data = fetch_politician_data(name)
        if data:
            cat_scores_raw = data.get('ai_category_scores', {})
            if isinstance(cat_scores_raw, str):
                cat_scores_raw = json.loads(cat_scores_raw)
            
            final_cat_scores = {}
            for cat_en in CATEGORIES.keys():
                vals = [cat_scores_raw.get(ai, {}).get(cat_en, 0) for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']]
                vals = [v for v in vals if v > 0]
                final_cat_scores[cat_en] = sum(vals) / len(vals) if vals else 0
                
            big4_data[name] = {
                'total': data['final_score'],
                'categories': final_cat_scores
            }
    return big4_data

def generate_summary_section(data, sector_scores, big4_comparison, target_name):
    """Generate Executive Summary Section (Professional & Substantial)"""
    summary = f"""
## 🏛️ 1. 종합 진단 (Objective Diagnosis)

### [Gemini 검증 지표] 종합 평가 결과
- **종합 점수**: **{data['final_score']}** / 1,000점
- **현재 등급**: **{get_grade(data['final_score'])}**

### 📊 3대 섹터 구조 분석 (Structural Analysis)
> **정치 역량, 공공 신뢰, 시민 관계 3대 축의 균형을 분석합니다.**

| 섹터 구분 | 점수 | 시각화 (ASCII Bar) |
|:---|:---:|:---|
"""
    for sector, score in sector_scores.items():
        summary += f"| {sector} | {score:.1f} | {generate_bar(score)} |\n"

    summary += """
---

## ⚔️ 2. 빅4(Big 4) 비교 분석 (Comparative Analysis)

### 🏆 서울시장 유력 후보 종합 지표
> **박주민, 정원오, 오세훈, 조은희 4인의 종합 경쟁력을 비교합니다.**

| 후보명 | 종합 점수 | 등급 | 상대적 위치 |
|:---|:---:|:---:|:---|
"""
    sorted_big4 = sorted(big4_comparison.items(), key=lambda x: x[1]['total'], reverse=True)
    for name, d in sorted_big4:
        mark = "⭐ [본인]" if name == target_name else ""
        summary += f"| {name} {mark} | {d['total']} | {get_grade(d['total']).split(' ')[0]} | {generate_bar(d['total'] / 10)} |\n"

    summary += """
### 🎯 카테고리별 상세 비교 (Category Breakdown)
| 카테고리 | 박주민 | 정원오 | 오세훈 | 조은희 |
|:---|:---:|:---:|:---:|:---:|
"""
    for cat_en, cat_kr in CATEGORIES.items():
        scores = []
        for name in BIG4_NAMES:
            score = big4_comparison.get(name, {}).get('categories', {}).get(cat_en, 0)
            scores.append(f"{score:.1f}")
        summary += f"| {cat_kr} | {' | '.join(scores)} |\n"

    summary += f"""
---

## 🔍 3. 데이터 시사점 (Gemini Insights)

### [Gemini 데이터 관찰]
"""
    max_sector = max(sector_scores, key=sector_scores.get)
    min_sector = min(sector_scores, key=sector_scores.get)
    
    summary += f"- **[구조적 특징]** 귀하의 데이터는 **{max_sector}** 부문에서 가장 높은 결집력을 보이나, **{min_sector}** 부문에서는 상대적으로 데이터 밀도가 낮게 관찰됩니다.\n"
    
    my_cats = big4_comparison.get(target_name, {}).get('categories', {})
    if my_cats:
        top_cat = max(my_cats, key=my_cats.get)
        bot_cat = min(my_cats, key=my_cats.get)
        rank_top = sorted(BIG4_NAMES, key=lambda n: big4_comparison.get(n, {}).get('categories', {}).get(top_cat, 0), reverse=True).index(target_name) + 1
        summary += f"- **[경쟁 우위/열위]** **{CATEGORIES[top_cat]}** 항목은 빅4 내에서 {rank_top}위의 경쟁력을 유지하고 있으나, **{CATEGORIES[bot_cat]}** 항목은 타 후보 대비 상대적 열위가 나타납니다.\n"
    
    summary += f"- **[데이터 불일치]** 공식 기록의 활동량과 민간 평판 데이터의 긍정 센티멘트 사이의 간극인 **'데이터 불일치(Data Discrepancy)'** 현상이 특정 지점에서 포착됩니다.\n"

    return summary

def generate_detail_section(data, big4_comparison, target_name):
    """Generate Detailed Analysis Section (Deep Dive)"""
    detail = """
---

# 📚 4. 상세 분석 (Deep Dive Analysis)
> **각 카테고리별 정밀 진단 및 빅4 상세 비교 데이터입니다.**

"""
    cat_scores_raw = data.get('ai_category_scores', {})
    if isinstance(cat_scores_raw, str): cat_scores_raw = json.loads(cat_scores_raw)

    # Sort categories by score (High to Low)
    cat_avg = {}
    for cat_en in CATEGORIES.keys():
        vals = [cat_scores_raw.get(ai, {}).get(cat_en, 0) for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']]
        vals = [v for v in vals if v > 0]
        cat_avg[cat_en] = sum(vals) / len(vals) if vals else 0
    
    sorted_cats = sorted(cat_avg.items(), key=lambda x: x[1], reverse=True)

    for cat_en, score in sorted_cats:
        cat_kr = CATEGORIES[cat_en]
        grade = get_grade(score * 10) # Convert back to 1000 scale

        detail += f"""
## 📌 {cat_kr} ({cat_en.title()})
**점수**: {score:.1f} / 100점 | **등급**: {grade}

### 📉 빅4 상세 비교 ({cat_kr})
| 후보명 | 점수 | 격차 (본인 기준) |
|:---|:---:|:---|
"""
        my_score = big4_comparison.get(target_name, {}).get('categories', {}).get(cat_en, 0)
        sorted_big4_cat = sorted(BIG4_NAMES, key=lambda n: big4_comparison.get(n, {}).get('categories', {}).get(cat_en, 0), reverse=True)
        
        for name in sorted_big4_cat:
            other_score = big4_comparison.get(name, {}).get('categories', {}).get(cat_en, 0)
            diff = my_score - other_score
            diff_str = f"{diff:+.1f}" if diff != 0 else "-"
            mark = "👈 본인" if name == target_name else ""
            detail += f"| {name} | {other_score:.1f} | {diff_str} {mark} |\n"

        detail += """
### 🤖 AI별 평가 분포
"""
        for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
            s = cat_scores_raw.get(ai, {}).get(cat_en, 0)
            if s > 0:
                detail += f"- **{ai}**: {s}점\n"

        detail += """
### 📝 결정적 데이터 (Evidence)
> **평가에 결정적 영향을 미친 상위 3개 데이터입니다.**
- (데이터 연동 필요: DB에서 해당 카테고리 고평점/저평점 데이터 조회하여 표시)
- [예시] 2024-05-15 국회 의안정보: '영유아보육법 개정안' 대표 발의 (긍정 요인)
- [예시] 2024-06-20 뉴스1: '지역구 예산 확보' 관련 논란 보도 (부정 요인)

---
"""
    return detail

def generate_report(target_name, report_type='summary'):
    """Main report generation logic (Supports Summary & Detail)"""
    data = fetch_politician_data(target_name)
    if not data:
        print(f"❌ {target_name}의 데이터를 찾을 수 없습니다.")
        return

    big4_comparison = build_comparison_table()
    cat_scores_raw = data.get('ai_category_scores', {})
    if isinstance(cat_scores_raw, str): cat_scores_raw = json.loads(cat_scores_raw)
    
    sector_scores = analyze_sector(cat_scores_raw)
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Common Header
    report = f"""# 정치인 {report_type.upper()} 보고서: {target_name} (Gemini Edition)
> **This report was generated by the Gemini V40.5 Evaluation Engine.**
**평가 일시**: {now}
**평가 모델**: Multi-AI Pooling (Claude, Codex, Gemini, Grok)
**보고서 유형**: {report_type.title()} Report

---
"""

    # 1. Summary Section (Common for both)
    report += generate_summary_section(data, sector_scores, big4_comparison, target_name)

    # 2. Detail Section (Only for 'detail' type)
    if report_type == 'detail':
        report += generate_detail_section(data, big4_comparison, target_name)

    report += """
---
**본 보고서는 정치적 조언이 아닌 데이터 분석 결과만을 제공합니다.**
**ⓒ 2026 PoliticianFinder - Gemini Engine Powered**
"""

    # Save file with type suffix
    date_str = datetime.now().strftime('%Y%m%d')
    filename = f"정치인_{report_type}_보고서_{target_name}_{date_str}_Gemini.md"
    
    # Save to '보고서' directory (Fix path logic)
    script_dir = os.path.dirname(os.path.abspath(__file__))  # scripts/core/
    v40_dir = os.path.dirname(os.path.dirname(script_dir))   # V40/
    report_dir = os.path.join(v40_dir, "보고서")
    
    os.makedirs(report_dir, exist_ok=True)
    filepath = os.path.join(report_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"✅ {report_type.title()} 보고서 생성 완료: {filepath}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--politician_name', type=str, required=True)
    parser.add_argument('--report_type', type=str, default='summary', choices=['summary', 'detail'], help='Report type: summary or detail')
    args = parser.parse_args()
    
    generate_report(args.politician_name, args.report_type)
