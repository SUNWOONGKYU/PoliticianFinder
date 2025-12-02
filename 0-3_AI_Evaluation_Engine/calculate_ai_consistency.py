"""
AI 간 일관성 계수 계산
- Pearson 상관계수
- Spearman 순위 상관계수
- 급내상관계수 (ICC - Intraclass Correlation Coefficient)
- 변동계수 (CV - Coefficient of Variation)
"""

import json
import numpy as np
from scipy import stats
from scipy.stats import pearsonr, spearmanr
import pandas as pd

# 데이터 로드
politicians = ['김동연', '오세훈', '한동훈']
categories = [
    'Expertise', 'Leadership', 'Vision', 'Integrity', 'Ethics',
    'Accountability', 'Transparency', 'Communication', 'Responsiveness', 'PublicInterest'
]

# 각 정치인의 데이터 로드
data = {}
for politician in politicians:
    with open(f'pooling_batch_summary_{politician}.json', 'r', encoding='utf-8') as f:
        data[politician] = json.load(f)

print("=" * 80)
print("AI 간 일관성 계수 분석")
print("=" * 80)
print()

# 1. 각 정치인별 AI 간 상관관계 분석
print("=" * 80)
print("1. 정치인별 AI 간 Pearson 상관계수")
print("=" * 80)
print()

for politician in politicians:
    print(f"\n[{politician}]")
    print("-" * 60)

    # 카테고리별 점수 추출
    chatgpt_scores = []
    grok_scores = []
    claude_scores = []

    for result in data[politician]['results']:
        chatgpt_scores.append(result['scores']['ChatGPT']['category_score'])
        grok_scores.append(result['scores']['Grok']['category_score'])
        claude_scores.append(result['scores']['Claude']['category_score'])

    # Pearson 상관계수 계산
    corr_cg_gr, p_cg_gr = pearsonr(chatgpt_scores, grok_scores)
    corr_cg_cl, p_cg_cl = pearsonr(chatgpt_scores, claude_scores)
    corr_gr_cl, p_gr_cl = pearsonr(grok_scores, claude_scores)

    print(f"ChatGPT vs Grok:   r = {corr_cg_gr:.4f} (p = {p_cg_gr:.4f})")
    print(f"ChatGPT vs Claude: r = {corr_cg_cl:.4f} (p = {p_cg_cl:.4f})")
    print(f"Grok vs Claude:    r = {corr_gr_cl:.4f} (p = {p_gr_cl:.4f})")
    print(f"평균 상관계수:     r = {np.mean([corr_cg_gr, corr_cg_cl, corr_gr_cl]):.4f}")

# 2. Spearman 순위 상관계수
print("\n" + "=" * 80)
print("2. 정치인별 AI 간 Spearman 순위 상관계수")
print("=" * 80)
print()

for politician in politicians:
    print(f"\n[{politician}]")
    print("-" * 60)

    chatgpt_scores = []
    grok_scores = []
    claude_scores = []

    for result in data[politician]['results']:
        chatgpt_scores.append(result['scores']['ChatGPT']['category_score'])
        grok_scores.append(result['scores']['Grok']['category_score'])
        claude_scores.append(result['scores']['Claude']['category_score'])

    # Spearman 순위 상관계수
    rho_cg_gr, p_cg_gr = spearmanr(chatgpt_scores, grok_scores)
    rho_cg_cl, p_cg_cl = spearmanr(chatgpt_scores, claude_scores)
    rho_gr_cl, p_gr_cl = spearmanr(grok_scores, claude_scores)

    print(f"ChatGPT vs Grok:   ρ = {rho_cg_gr:.4f} (p = {p_cg_gr:.4f})")
    print(f"ChatGPT vs Claude: ρ = {rho_cg_cl:.4f} (p = {p_cg_cl:.4f})")
    print(f"Grok vs Claude:    ρ = {rho_gr_cl:.4f} (p = {p_gr_cl:.4f})")
    print(f"평균 순위 상관:    ρ = {np.mean([rho_cg_gr, rho_cg_cl, rho_gr_cl]):.4f}")

# 3. 급내상관계수 (ICC) 계산
print("\n" + "=" * 80)
print("3. 급내상관계수 (ICC - Intraclass Correlation Coefficient)")
print("=" * 80)
print()

def calculate_icc(scores_matrix):
    """
    ICC(2,1) 계산 - Two-way random effects, single rater
    """
    n_subjects = scores_matrix.shape[0]  # 카테고리 수
    n_raters = scores_matrix.shape[1]    # AI 수 (3)

    # 전체 평균
    grand_mean = np.mean(scores_matrix)

    # Between subjects variance (카테고리 간 분산)
    subject_means = np.mean(scores_matrix, axis=1)
    BSS = n_raters * np.sum((subject_means - grand_mean) ** 2)
    BMS = BSS / (n_subjects - 1)

    # Between raters variance (AI 간 분산)
    rater_means = np.mean(scores_matrix, axis=0)
    RSS = n_subjects * np.sum((rater_means - grand_mean) ** 2)
    RMS = RSS / (n_raters - 1)

    # Error variance (잔차 분산)
    ESS = np.sum((scores_matrix - subject_means[:, np.newaxis] - rater_means + grand_mean) ** 2)
    EMS = ESS / ((n_subjects - 1) * (n_raters - 1))

    # ICC(2,1) 계산
    icc = (BMS - EMS) / (BMS + (n_raters - 1) * EMS + n_raters * (RMS - EMS) / n_subjects)

    return icc, BMS, RMS, EMS

for politician in politicians:
    print(f"\n[{politician}]")
    print("-" * 60)

    # 카테고리별 점수를 행렬로 구성
    scores_matrix = []
    for result in data[politician]['results']:
        row = [
            result['scores']['ChatGPT']['category_score'],
            result['scores']['Grok']['category_score'],
            result['scores']['Claude']['category_score']
        ]
        scores_matrix.append(row)

    scores_matrix = np.array(scores_matrix)
    icc, bms, rms, ems = calculate_icc(scores_matrix)

    print(f"ICC(2,1) = {icc:.4f}")
    print(f"  - Between Categories (BMS): {bms:.2f}")
    print(f"  - Between AIs (RMS): {rms:.2f}")
    print(f"  - Error (EMS): {ems:.2f}")

    # ICC 해석
    if icc < 0.5:
        interpretation = "Poor (낮은 일관성)"
    elif icc < 0.75:
        interpretation = "Moderate (중간 일관성)"
    elif icc < 0.9:
        interpretation = "Good (좋은 일관성)"
    else:
        interpretation = "Excellent (뛰어난 일관성)"

    print(f"  - 해석: {interpretation}")

# 4. 변동계수 (CV) 계산
print("\n" + "=" * 80)
print("4. AI 간 변동계수 (CV - Coefficient of Variation)")
print("=" * 80)
print()

for politician in politicians:
    print(f"\n[{politician}]")
    print("-" * 60)

    cv_by_category = []

    for result in data[politician]['results']:
        category = result['category_kor']
        scores = [
            result['scores']['ChatGPT']['category_score'],
            result['scores']['Grok']['category_score'],
            result['scores']['Claude']['category_score']
        ]

        mean_score = np.mean(scores)
        std_score = np.std(scores, ddof=1)
        cv = (std_score / mean_score) * 100

        cv_by_category.append({
            'category': category,
            'mean': mean_score,
            'std': std_score,
            'cv': cv
        })

    # CV 평균
    avg_cv = np.mean([x['cv'] for x in cv_by_category])

    print(f"카테고리별 변동계수 (CV%):")
    for item in cv_by_category:
        print(f"  {item['category']:12s}: {item['cv']:5.2f}% (평균={item['mean']:.2f}, SD={item['std']:.2f})")

    print(f"\n평균 변동계수: {avg_cv:.2f}%")

    # CV 해석
    if avg_cv < 5:
        interpretation = "Excellent (매우 낮은 변동)"
    elif avg_cv < 10:
        interpretation = "Good (낮은 변동)"
    elif avg_cv < 15:
        interpretation = "Moderate (중간 변동)"
    else:
        interpretation = "Poor (높은 변동)"

    print(f"해석: {interpretation}")

# 5. 전체 정치인에 대한 통합 일관성 분석
print("\n" + "=" * 80)
print("5. 전체 정치인 통합 일관성 분석")
print("=" * 80)
print()

# 모든 정치인의 모든 카테고리 점수를 하나의 데이터셋으로
all_chatgpt = []
all_grok = []
all_claude = []

for politician in politicians:
    for result in data[politician]['results']:
        all_chatgpt.append(result['scores']['ChatGPT']['category_score'])
        all_grok.append(result['scores']['Grok']['category_score'])
        all_claude.append(result['scores']['Claude']['category_score'])

# Pearson 상관계수
corr_cg_gr, _ = pearsonr(all_chatgpt, all_grok)
corr_cg_cl, _ = pearsonr(all_chatgpt, all_claude)
corr_gr_cl, _ = pearsonr(all_grok, all_claude)

print("Pearson 상관계수 (전체):")
print(f"  ChatGPT vs Grok:   r = {corr_cg_gr:.4f}")
print(f"  ChatGPT vs Claude: r = {corr_cg_cl:.4f}")
print(f"  Grok vs Claude:    r = {corr_gr_cl:.4f}")
print(f"  평균:             r = {np.mean([corr_cg_gr, corr_cg_cl, corr_gr_cl]):.4f}")

# Spearman 순위 상관계수
rho_cg_gr, _ = spearmanr(all_chatgpt, all_grok)
rho_cg_cl, _ = spearmanr(all_chatgpt, all_claude)
rho_gr_cl, _ = spearmanr(all_grok, all_claude)

print("\nSpearman 순위 상관계수 (전체):")
print(f"  ChatGPT vs Grok:   ρ = {rho_cg_gr:.4f}")
print(f"  ChatGPT vs Claude: ρ = {rho_cg_cl:.4f}")
print(f"  Grok vs Claude:    ρ = {rho_gr_cl:.4f}")
print(f"  평균:             ρ = {np.mean([rho_cg_gr, rho_cg_cl, rho_gr_cl]):.4f}")

# 전체 ICC 계산
all_scores_matrix = np.array([all_chatgpt, all_grok, all_claude]).T
icc_total, _, _, _ = calculate_icc(all_scores_matrix)

print(f"\n전체 ICC(2,1) = {icc_total:.4f}")

# 전체 CV 계산
all_means = []
all_stds = []
all_cvs = []

for i in range(len(all_chatgpt)):
    scores = [all_chatgpt[i], all_grok[i], all_claude[i]]
    mean_score = np.mean(scores)
    std_score = np.std(scores, ddof=1)
    cv = (std_score / mean_score) * 100

    all_means.append(mean_score)
    all_stds.append(std_score)
    all_cvs.append(cv)

avg_cv_total = np.mean(all_cvs)
print(f"전체 평균 변동계수: {avg_cv_total:.2f}%")

# 6. 요약 및 해석
print("\n" + "=" * 80)
print("6. 요약 및 해석")
print("=" * 80)
print()

print("풀링 시스템 AI 간 일관성 평가:")
print()

# Pearson 상관계수 해석
avg_pearson = np.mean([corr_cg_gr, corr_cg_cl, corr_gr_cl])
if avg_pearson >= 0.9:
    pearson_eval = "매우 강한 양의 상관관계 - AI 평가가 매우 일관됨"
elif avg_pearson >= 0.7:
    pearson_eval = "강한 양의 상관관계 - AI 평가가 일관됨"
elif avg_pearson >= 0.5:
    pearson_eval = "중간 수준의 양의 상관관계 - 일부 일관성 있음"
else:
    pearson_eval = "약한 상관관계 - 일관성 부족"

print(f"1. Pearson 상관계수: r = {avg_pearson:.4f}")
print(f"   → {pearson_eval}")
print()

# ICC 해석
if icc_total >= 0.9:
    icc_eval = "Excellent - AI 간 매우 높은 신뢰도"
elif icc_total >= 0.75:
    icc_eval = "Good - AI 간 높은 신뢰도"
elif icc_total >= 0.5:
    icc_eval = "Moderate - AI 간 중간 수준 신뢰도"
else:
    icc_eval = "Poor - AI 간 낮은 신뢰도"

print(f"2. 급내상관계수 (ICC): {icc_total:.4f}")
print(f"   → {icc_eval}")
print()

# CV 해석
if avg_cv_total < 5:
    cv_eval = "Excellent - 매우 낮은 변동성, 높은 일관성"
elif avg_cv_total < 10:
    cv_eval = "Good - 낮은 변동성, 일관성 있음"
elif avg_cv_total < 15:
    cv_eval = "Moderate - 중간 변동성"
else:
    cv_eval = "Poor - 높은 변동성, 일관성 부족"

print(f"3. 변동계수 (CV): {avg_cv_total:.2f}%")
print(f"   → {cv_eval}")
print()

print("=" * 80)
print("최종 결론:")
print("=" * 80)
print()

# 종합 평가
if avg_pearson >= 0.9 and icc_total >= 0.75 and avg_cv_total < 10:
    final_eval = "⭐⭐⭐⭐⭐ 매우 우수 - 풀링 시스템이 AI 간 일관성을 크게 향상시킴"
elif avg_pearson >= 0.7 and icc_total >= 0.5 and avg_cv_total < 15:
    final_eval = "⭐⭐⭐⭐ 우수 - AI 간 일관성이 높은 수준"
elif avg_pearson >= 0.5:
    final_eval = "⭐⭐⭐ 보통 - AI 간 일관성이 중간 수준"
else:
    final_eval = "⭐⭐ 개선 필요 - AI 간 일관성이 낮음"

print(final_eval)
print()
print("풀링 시스템의 효과:")
print(f"  - 3개 AI가 동일한 데이터를 평가하여 일관성 확보")
print(f"  - AI 간 평균 상관계수: {avg_pearson:.4f}")
print(f"  - AI 간 신뢰도(ICC): {icc_total:.4f}")
print(f"  - AI 간 변동계수: {avg_cv_total:.2f}%")
print()

print("=" * 80)
