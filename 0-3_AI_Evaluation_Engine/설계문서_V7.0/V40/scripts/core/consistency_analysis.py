#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 평가 일관성 분석
평균 점수 vs 개별 점수 비교
"""

import statistics

# 카테고리별 AI 점수 (위에서 추출한 데이터)
category_scores = {
    '전문성': {'Claude': 75, 'ChatGPT': 80, 'Gemini': 82, 'Grok': 79},
    '리더십': {'Claude': 78, 'ChatGPT': 78, 'Gemini': 84, 'Grok': 79},
    '비전': {'Claude': 78, 'ChatGPT': 79, 'Gemini': 82, 'Grok': 79},
    '청렴성': {'Claude': 67, 'ChatGPT': 73, 'Gemini': 73, 'Grok': 70},
    '윤리성': {'Claude': 61, 'ChatGPT': 65, 'Gemini': 66, 'Grok': 57},
    '책임감': {'Claude': 79, 'ChatGPT': 79, 'Gemini': 83, 'Grok': 80},
    '투명성': {'Claude': 74, 'ChatGPT': 78, 'Gemini': 81, 'Grok': 78},
    '소통능력': {'Claude': 75, 'ChatGPT': 79, 'Gemini': 85, 'Grok': 82},
    '대응성': {'Claude': 75, 'ChatGPT': 80, 'Gemini': 83, 'Grok': 80},
    '공익성': {'Claude': 74, 'ChatGPT': 82, 'Gemini': 89, 'Grok': 81},
}

ai_names = ['Claude', 'ChatGPT', 'Gemini', 'Grok']
categories = list(category_scores.keys())

print("=" * 120)
print("【 AI별 평균 점수 분석 】")
print("=" * 120)

# 1. AI별 평균 점수 계산
ai_averages = {}
ai_std_devs = {}
ai_ranges = {}

for ai in ai_names:
    scores = [category_scores[cat][ai] for cat in categories]
    avg = statistics.mean(scores)
    std = statistics.stdev(scores)
    min_score = min(scores)
    max_score = max(scores)

    ai_averages[ai] = avg
    ai_std_devs[ai] = std
    ai_ranges[ai] = (min_score, max_score)

    print(f"\n[{ai}]")
    print(f"  평균 점수: {avg:.2f}점")
    print(f"  표준편차: {std:.2f} (점수 변동성)")
    print(f"  점수 범위: {min_score}점 ~ {max_score}점 (편차: {max_score - min_score}점)")

print("\n" + "=" * 120)
print("【 카테고리별 일관성 분석 】")
print("=" * 120)

# 2. 카테고리별 AI 간 일관성
cat_consistency = {}
for cat in categories:
    scores = [category_scores[cat][ai] for ai in ai_names]
    avg = statistics.mean(scores)
    std = statistics.stdev(scores)
    min_score = min(scores)
    max_score = max(scores)

    cat_consistency[cat] = {
        'avg': avg,
        'std': std,
        'range': max_score - min_score
    }

    # 일관성 평가 (표준편차 3 이하: 높음, 5 이상: 낮음)
    if std <= 3:
        consistency = "매우 높음"
    elif std <= 5:
        consistency = "보통"
    else:
        consistency = "낮음"

    print(f"\n[{cat}]")
    print(f"  4AI 평균: {avg:.1f}점")
    print(f"  점수 범위: {min_score}점 ~ {max_score}점 (편차: {max_score - min_score}점)")
    print(f"  표준편차: {std:.2f} → 일관성: {consistency}")

print("\n" + "=" * 120)
print("【 상위 3 일관성 분석 】")
print("=" * 120)

sorted_by_consistency = sorted(cat_consistency.items(), key=lambda x: x[1]['std'])

print("\n[가장 일관성 높은 카테고리 - TOP 3]")
for i, (cat, data) in enumerate(sorted_by_consistency[:3], 1):
    print(f"  {i}. {cat}: 표준편차 {data['std']:.2f} (범위 {data['range']}점) - 모든 AI가 유사한 평가")

print("\n[가장 일관성 낮은 카테고리 - BOTTOM 3]")
for i, (cat, data) in enumerate(sorted_by_consistency[-3:], 1):
    print(f"  {i}. {cat}: 표준편차 {data['std']:.2f} (범위 {data['range']}점) - AI별 평가 차이 큼")

print("\n" + "=" * 120)
print("【 AI별 점수 패턴 분석 】")
print("=" * 120)

# 3. AI별 패턴 분석
print("\n[Gemini vs 다른 AI]")
gemini_scores = [category_scores[cat]['Gemini'] for cat in categories]
for ai in ['Claude', 'ChatGPT', 'Grok']:
    ai_scores = [category_scores[cat][ai] for cat in categories]
    diffs = [gemini_scores[i] - ai_scores[i] for i in range(len(categories))]
    avg_diff = statistics.mean(diffs)
    print(f"  Gemini - {ai}: 평균 +{avg_diff:.1f}점 (Gemini가 {abs(avg_diff):.1f}점 {'높음' if avg_diff > 0 else '낮음'})")

print("\n[Claude vs ChatGPT]")
claude_scores = [category_scores[cat]['Claude'] for cat in categories]
chatgpt_scores = [category_scores[cat]['ChatGPT'] for cat in categories]
diffs = [chatgpt_scores[i] - claude_scores[i] for i in range(len(categories))]
avg_diff = statistics.mean(diffs)
print(f"  ChatGPT - Claude: 평균 +{avg_diff:.1f}점 (ChatGPT가 {abs(avg_diff):.1f}점 {'높음' if avg_diff > 0 else '낮음'})")

print("\n" + "=" * 120)
print("【 최종 일관성 결론 】")
print("=" * 120)

# 전체 평균
overall_avg = statistics.mean([avg for avg in ai_averages.values()])
overall_std = statistics.stdev([avg for avg in ai_averages.values()])

print(f"\n[전체 통계]")
print(f"  4AI 점수 평균: {overall_avg:.2f}점")
print(f"  AI 간 점수 표준편차: {overall_std:.2f}")
print(f"  → AI별 평가 일관성: {'높음' if overall_std <= 10 else '낮음'}")

print(f"\n[특징 분석]")
print(f"  1. Gemini: 가장 높은 평가 (평균 {ai_averages['Gemini']:.1f}점)")
print(f"  2. Claude: 가장 낮은 평가 (평균 {ai_averages['Claude']:.1f}점)")
print(f"  3. 평가 차이: {ai_averages['Gemini'] - ai_averages['Claude']:.1f}점")

# 카테고리별 일관성
high_consistency_cats = [cat for cat, data in cat_consistency.items() if data['std'] <= 3]
low_consistency_cats = [cat for cat, data in cat_consistency.items() if data['std'] > 5]

print(f"\n  4. 높은 일관성 카테고리 ({len(high_consistency_cats)}개): {', '.join(high_consistency_cats)}")
print(f"  5. 낮은 일관성 카테고리 ({len(low_consistency_cats)}개): {', '.join(low_consistency_cats)}")

print("\n" + "=" * 120)
