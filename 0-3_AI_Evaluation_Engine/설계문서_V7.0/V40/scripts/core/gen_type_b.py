#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Type B 평가 보고서 생성"""

import os
from pathlib import Path
from supabase import create_client
from datetime import datetime

# 환경 변수 로드
env_vars = {}
env_path = Path(__file__).parent.parent.parent / '.env'
with open(env_path, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            env_vars[key.strip()] = value.strip()

supabase = create_client(env_vars.get('SUPABASE_URL'), env_vars.get('SUPABASE_SERVICE_ROLE_KEY'))

POLITICIAN_ID = '37e39502'
POLITICIAN_NAME = '오준환'

CATEGORIES = ['expertise', 'leadership', 'vision', 'integrity', 'ethics',
              'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest']

CATEGORY_KOR = {
    'expertise': '전문성',
    'leadership': '리더십',
    'vision': '비전',
    'integrity': '청렴성',
    'ethics': '윤리성',
    'accountability': '책임감',
    'transparency': '투명성',
    'communication': '소통능력',
    'responsiveness': '대응성',
    'publicinterest': '공익성',
}

def make_bar_chart(score):
    filled = int(score / 10)
    empty = 10 - filled
    return '█' * filled + '░' * empty

# 오준환 점수 조회
response = supabase.table('ai_final_scores_v40').select('*').eq('politician_id', POLITICIAN_ID).execute()
politician_data = response.data[0] if response.data else None

if not politician_data:
    print("ERROR: 데이터 없음")
    exit(1)

final_score = politician_data['final_score']
grade = politician_data['grade']
grade_name = politician_data['grade_name']
category_scores = politician_data['category_scores']
ai_final_scores = politician_data['ai_final_scores']
ai_category_scores = politician_data['ai_category_scores']

# Type B 보고서 생성
lines = []
sorted_categories = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
ai_avg = sum(ai_final_scores.values()) / len(ai_final_scores)

# 헤더
lines.append(f"# {POLITICIAN_NAME} AI 기반 정치인 상세평가보고서 (당사자 전용)")
lines.append("")
lines.append("> 이 보고서는 당사자 전용 비공개 문서입니다.")
lines.append("")
lines.append(f"**평가 버전**: V40  |  **평가 일자**: {datetime.now().strftime('%Y-%m-%d')}")
lines.append("**평가 AI**: Claude · ChatGPT · Grok · Gemini")
lines.append("")
lines.append("---")
lines.append("")

# Section 1: 정치인 프로필
lines.append("## 1. 정치인 프로필")
lines.append("")
lines.append("| 항목 | 내용 |")
lines.append("|------|------|")
lines.append(f"| **이름** | {POLITICIAN_NAME} |")
lines.append("| **소속 정당** | (DB politicians 테이블 참조) |")
lines.append("| **현직** | (DB politicians 테이블 참조) |")
lines.append("| **지역구** | (DB politicians 테이블 참조) |")
lines.append("| **이전 직책** | (DB politicians 테이블 참조) |")
lines.append("")
lines.append("---")
lines.append("")

# Section 2: 평가 요약
lines.append("## 2. 평가 요약")
lines.append("")
lines.append("### 종합 점수")
lines.append("")
lines.append("| 항목 | 내용 |")
lines.append("|------|------|")
lines.append(f"| **최종 점수** | **{final_score}점** / 1,000점 |")
lines.append(f"| **등급** | **{grade}** ({grade_name}) |")
lines.append("")

# 카테고리 점수
lines.append("### 10개 카테고리 점수 (높은 순)")
lines.append("")
lines.append("```")
for cat_name, score in sorted_categories:
    kor_name = CATEGORY_KOR.get(cat_name, cat_name)
    bar = make_bar_chart(score)
    lines.append(f"{kor_name:10} {bar} {score}점")
lines.append("```")
lines.append("")

# AI별 점수
lines.append("### AI별 점수 상세")
lines.append("")
lines.append("| AI | 점수 |")
lines.append("|---|:---:|")
for ai_name in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
    if ai_name in ai_final_scores:
        lines.append(f"| {ai_name} | {ai_final_scores[ai_name]}점 |")
lines.append(f"| **4 AI 평균** | **{int(ai_avg)}점** |")
lines.append("")

# AI별 카테고리 비교 요약
lines.append("### AI별 평가 일관성")
lines.append("")
ai_scores = list(ai_final_scores.values())
ai_std = (sum((x - ai_avg) ** 2 for x in ai_scores) / len(ai_scores)) ** 0.5
lines.append(f"- 4개 AI 간 표준편차: {ai_std:.2f}점 (범위: {min(ai_scores)}~{max(ai_scores)}점, 편차: {max(ai_scores) - min(ai_scores)}점)")
lines.append(f"- 최고 평가: {max(ai_final_scores.items(), key=lambda x: x[1])[0]} {max(ai_scores)}점")
lines.append(f"- 최저 평가: {min(ai_final_scores.items(), key=lambda x: x[1])[0]} {min(ai_scores)}점")
lines.append("")
lines.append("---")
lines.append("")

# Section 3: 카테고리별 상세 분석
lines.append("## 3. 카테고리별 상세 분석")
lines.append("")

for idx, cat_eng in enumerate(CATEGORIES, 1):
    cat_kor = CATEGORY_KOR.get(cat_eng, cat_eng)
    score = category_scores[cat_eng]
    lines.append(f"### {idx}. {cat_kor} ({score}점)")
    lines.append("")

    # AI별 점수 테이블
    lines.append("| AI | 점수 |")
    lines.append("|---|:---:|")
    ai_cat_scores = []
    for ai_name in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
        if ai_name in ai_category_scores:
            ai_score = ai_category_scores[ai_name].get(cat_eng, 'N/A')
            if ai_score != 'N/A':
                ai_cat_scores.append(ai_score)
            lines.append(f"| {ai_name} | {ai_score}점 |")

    if ai_cat_scores:
        cat_avg = sum(ai_cat_scores) / len(ai_cat_scores)
        cat_std = (sum((x - cat_avg) ** 2 for x in ai_cat_scores) / len(ai_cat_scores)) ** 0.5
        lines.append(f"| **평균** | **{int(cat_avg)}점** |")
        lines.append("")
        lines.append(f"**분석**: {CATEGORY_KOR[cat_eng]} 카테고리에서 4개 AI의 평가 표준편차는 {cat_std:.2f}점입니다.")

    lines.append("")

# Section: 평가의 한계 및 유의사항
lines.append("## 7. 평가의 한계 및 유의사항")
lines.append("")
lines.append("### 데이터 수집 한계")
lines.append("1. **수집 기간 제한**: OFFICIAL 최근 4년, PUBLIC 최근 2년 이내 자료만 반영")
lines.append("2. **검색 편향**: Gemini CLI / Naver API 알고리즘에 따른 데이터 편향 가능성")
lines.append("3. **미수집 자료**: 비공개 문서, 오프라인 활동, 구두 발언 등 미반영")
lines.append("")
lines.append("### AI 평가 한계")
lines.append("1. **AI 특성 편향**: 각 AI는 학습 데이터에 따른 편향 존재 (4개 평균으로 완화)")
lines.append("2. **맥락 이해**: 정치적 배경, 지역 특성, 역사적 맥락의 완전한 이해 불가")
lines.append("")
lines.append("### 이용 시 유의사항")
lines.append("1. 이 보고서는 **참고 자료**입니다. 최종 판단은 이용자 본인에게 있습니다.")
lines.append("2. **여론조사가 아닙니다.** 긍정/부정 비율은 시민 여론과 다를 수 있습니다.")
lines.append("3. **법적 판단이 아닙니다.** 논란·의혹 관련 평가는 법적 유무죄와 무관합니다.")
lines.append("4. **실시간 업데이트 안 됩니다.** 평가 일자 이후 활동은 반영되지 않습니다.")
lines.append("5. **당사자 전용 문서**입니다. 무단 배포 시 법적 책임이 따를 수 있습니다.")
lines.append("")
lines.append("---")
lines.append("")

# Section: 참고자료
lines.append("## 8. 참고자료 및 마무리")
lines.append("")
lines.append("### 평가 시스템 개요")
lines.append("")
lines.append("| 항목 | 내용 |")
lines.append("|------|------|")
lines.append("| 수집 채널 | Gemini CLI 50% + Naver API 50% |")
lines.append("| 수집 기간 | OFFICIAL 4년 이내 / PUBLIC 2년 이내 |")
lines.append("| 평가 AI | Claude · ChatGPT · Grok · Gemini (4개) |")
lines.append("| 등급 체계 | +4(탁월) ~ -4(최악), X(제외) |")
lines.append("| 점수 공식 | `카테고리 점수 = (6.0 + avg_score × 0.5) × 10` |")
lines.append("| 최종 점수 | 10개 카테고리 합산, 범위 200~1,000점 |")
lines.append("")
lines.append("### 등급 기준표")
lines.append("")
lines.append("| 등급 | 점수 범위 | 의미 |")
lines.append("|:----:|:--------:|------|")
lines.append("| M | 920~1,000점 | 최우수 |")
lines.append("| D | 840~919점 | 우수 |")
lines.append("| E | 760~839점 | 양호 |")
lines.append("| P | 680~759점 | 보통+ |")
lines.append("| G | 600~679점 | 보통 |")
lines.append("| S | 520~599점 | 보통- |")
lines.append("| B | 440~519점 | 미흡 |")
lines.append("| I | 360~439점 | 부족 |")
lines.append("| Tn | 280~359점 | 상당히 부족 |")
lines.append("| L | 200~279점 | 매우 부족 |")
lines.append("")
lines.append(f"**평가 엔진**: PoliticianFinder AI V40  |  **생성일**: {datetime.now().strftime('%Y-%m-%d')}")

# 파일 저장
reports_dir = Path(__file__).parent.parent.parent / '보고서'
reports_dir.mkdir(exist_ok=True)

today = datetime.now().strftime('%Y%m%d')
type_b_path = reports_dir / f"{POLITICIAN_NAME}_{today}_B.md"

with open(type_b_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print("Type B 보고서 생성 완료")
print(f"파일: {type_b_path}")
print(f"줄 수: {len(lines)}")
