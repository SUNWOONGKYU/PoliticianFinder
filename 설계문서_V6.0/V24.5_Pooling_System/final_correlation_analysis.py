"""
최종 상관계수 분석
1. 종합점수 기준 순위 상관계수 (Spearman rho)
2. 카테고리별 순위 상관계수
3. 전체 ICC 계산
"""
import json
import numpy as np
from scipy.stats import spearmanr, pearsonr

politicians = ['김동연', '오세훈', '한동훈']
data = {}

# 데이터 로드
for pol in politicians:
    with open(f'pooling_batch_summary_{pol}.json', 'r', encoding='utf-8') as f:
        data[pol] = json.load(f)

categories = [
    'Expertise', 'Leadership', 'Vision', 'Integrity', 'Ethics',
    'Accountability', 'Transparency', 'Communication', 'Responsiveness', 'PublicInterest'
]

category_kor = {
    'Expertise': '전문성', 'Leadership': '리더십', 'Vision': '비전',
    'Integrity': '청렴성', 'Ethics': '윤리성', 'Accountability': '책임성',
    'Transparency': '투명성', 'Communication': '소통능력',
    'Responsiveness': '대응성', 'PublicInterest': '공익성'
}

print("=" * 100)
print("1. 종합점수 기준 순위 상관계수 (Spearman rho)")
print("=" * 100)
print()

# 종합점수 순위
chatgpt_final_ranks = []
grok_final_ranks = []
claude_final_ranks = []

for ai_name, rank_list in [('chatgpt', chatgpt_final_ranks), ('grok', grok_final_ranks), ('claude', claude_final_ranks)]:
    scores = [(pol, data[pol]['overall_scores'][f'{ai_name}_average']) for pol in politicians]
    scores.sort(key=lambda x: x[1], reverse=True)
    pol_to_rank = {pol: rank for rank, (pol, _) in enumerate(scores, 1)}
    for pol in politicians:
        rank_list.append(pol_to_rank[pol])

# 순위 출력
print("3명 정치인 종합점수 순위:")
print("-" * 100)
print(f"{'정치인':12} {'ChatGPT':>10} {'Grok':>10} {'Claude':>10}")
print("-" * 100)
for i, pol in enumerate(politicians):
    print(f"{pol:12} {chatgpt_final_ranks[i]:>10} {grok_final_ranks[i]:>10} {claude_final_ranks[i]:>10}")

print()
print("종합점수 순위 상관계수 (Spearman rho):")
print("-" * 100)

# Spearman 상관계수
rho_cg_gr, p_cg_gr = spearmanr(chatgpt_final_ranks, grok_final_ranks)
rho_cg_cl, p_cg_cl = spearmanr(chatgpt_final_ranks, claude_final_ranks)
rho_gr_cl, p_gr_cl = spearmanr(grok_final_ranks, claude_final_ranks)

print(f"ChatGPT vs Grok:   rho = {rho_cg_gr:6.4f} (p = {p_cg_gr:.4f})")
print(f"ChatGPT vs Claude: rho = {rho_cg_cl:6.4f} (p = {p_cg_cl:.4f})")
print(f"Grok vs Claude:    rho = {rho_gr_cl:6.4f} (p = {p_gr_cl:.4f})")
print(f"평균 상관계수:     rho = {np.mean([rho_cg_gr, rho_cg_cl, rho_gr_cl]):.4f}")
print()

if rho_cg_gr == 1.0 and rho_cg_cl == 1.0 and rho_gr_cl == 1.0:
    print("결과: 3개 AI 모두 종합점수 순위 100% 일치!")
else:
    print(f"결과: 평균 {np.mean([rho_cg_gr, rho_cg_cl, rho_gr_cl])*100:.1f}% 일치")

print()
print("=" * 100)
print("2. 카테고리별 순위 상관계수")
print("=" * 100)
print()

category_rank_corrs = []

print(f"{'카테고리':12} {'CG-Grok':>10} {'CG-Claude':>12} {'Grok-Claude':>14} {'평균':>10}")
print("-" * 100)

for cat_eng in categories:
    cat_kor_name = category_kor[cat_eng]

    # 각 AI별 순위
    chatgpt_ranks = []
    grok_ranks = []
    claude_ranks = []

    for ai_name, rank_list in [('ChatGPT', chatgpt_ranks), ('Grok', grok_ranks), ('Claude', claude_ranks)]:
        scores = []
        for pol in politicians:
            for result in data[pol]['results']:
                if result['category_eng'] == cat_eng:
                    score = result['scores'][ai_name]['category_score']
                    scores.append((pol, score))
                    break

        scores.sort(key=lambda x: x[1], reverse=True)
        pol_to_rank = {pol: rank for rank, (pol, _) in enumerate(scores, 1)}
        for pol in politicians:
            rank_list.append(pol_to_rank[pol])

    # Spearman 순위 상관계수
    rho_cg_gr, _ = spearmanr(chatgpt_ranks, grok_ranks)
    rho_cg_cl, _ = spearmanr(chatgpt_ranks, claude_ranks)
    rho_gr_cl, _ = spearmanr(grok_ranks, claude_ranks)

    avg_rho = np.mean([rho_cg_gr, rho_cg_cl, rho_gr_cl])
    category_rank_corrs.append({
        'category': cat_kor_name,
        'cg_gr': rho_cg_gr,
        'cg_cl': rho_cg_cl,
        'gr_cl': rho_gr_cl,
        'avg': avg_rho
    })

    print(f"{cat_kor_name:12} {rho_cg_gr:>10.4f} {rho_cg_cl:>12.4f} {rho_gr_cl:>14.4f} {avg_rho:>10.4f}")

print("-" * 100)
avg_all = np.mean([c['avg'] for c in category_rank_corrs])
print(f"{'전체 평균':12} {np.mean([c['cg_gr'] for c in category_rank_corrs]):>10.4f} "
      f"{np.mean([c['cg_cl'] for c in category_rank_corrs]):>12.4f} "
      f"{np.mean([c['gr_cl'] for c in category_rank_corrs]):>14.4f} {avg_all:>10.4f}")

print()
print("=" * 100)
print("3. ICC (Intraclass Correlation Coefficient) - AI 간 신뢰도")
print("=" * 100)
print()

def calculate_icc(scores_matrix):
    """ICC(2,1) 계산"""
    n_subjects = scores_matrix.shape[0]
    n_raters = scores_matrix.shape[1]

    grand_mean = np.mean(scores_matrix)
    subject_means = np.mean(scores_matrix, axis=1)
    BSS = n_raters * np.sum((subject_means - grand_mean) ** 2)
    BMS = BSS / (n_subjects - 1)

    rater_means = np.mean(scores_matrix, axis=0)
    RSS = n_subjects * np.sum((rater_means - grand_mean) ** 2)
    RMS = RSS / (n_raters - 1)

    ESS = np.sum((scores_matrix - subject_means[:, np.newaxis] - rater_means + grand_mean) ** 2)
    EMS = ESS / ((n_subjects - 1) * (n_raters - 1))

    icc = (BMS - EMS) / (BMS + (n_raters - 1) * EMS + n_raters * (RMS - EMS) / n_subjects)
    return icc

# 전체 ICC (모든 정치인, 모든 카테고리)
all_chatgpt = []
all_grok = []
all_claude = []

for pol in politicians:
    for result in data[pol]['results']:
        all_chatgpt.append(result['scores']['ChatGPT']['category_score'])
        all_grok.append(result['scores']['Grok']['category_score'])
        all_claude.append(result['scores']['Claude']['category_score'])

all_scores_matrix = np.array([all_chatgpt, all_grok, all_claude]).T
icc_total = calculate_icc(all_scores_matrix)

print(f"전체 ICC(2,1): {icc_total:.4f}")

if icc_total >= 0.75:
    interpretation = "Good (높은 신뢰도)"
elif icc_total >= 0.5:
    interpretation = "Moderate (중간 신뢰도)"
else:
    interpretation = "Poor (낮은 신뢰도)"

print(f"해석: {interpretation}")
print()

# 정치인별 ICC
print("정치인별 ICC:")
print("-" * 100)
for pol in politicians:
    chatgpt_scores = []
    grok_scores = []
    claude_scores = []

    for result in data[pol]['results']:
        chatgpt_scores.append(result['scores']['ChatGPT']['category_score'])
        grok_scores.append(result['scores']['Grok']['category_score'])
        claude_scores.append(result['scores']['Claude']['category_score'])

    scores_matrix = np.array([chatgpt_scores, grok_scores, claude_scores]).T
    icc = calculate_icc(scores_matrix)

    if icc >= 0.75:
        interp = "Good"
    elif icc >= 0.5:
        interp = "Moderate"
    else:
        interp = "Poor"

    print(f"{pol:12} ICC = {icc:.4f} ({interp})")

print()
print("=" * 100)
print("4. 최종 요약")
print("=" * 100)
print()

print(f"1. 종합점수 순위 상관계수 (Spearman rho):")
print(f"   - ChatGPT vs Grok:   {rho_cg_gr:.4f}")
print(f"   - ChatGPT vs Claude: {rho_cg_cl:.4f}")
print(f"   - Grok vs Claude:    {rho_gr_cl:.4f}")
print(f"   - 평균:              {np.mean([rho_cg_gr, rho_cg_cl, rho_gr_cl]):.4f}")
print()

print(f"2. 카테고리별 평균 순위 상관계수:")
print(f"   - ChatGPT vs Grok:   {np.mean([c['cg_gr'] for c in category_rank_corrs]):.4f}")
print(f"   - ChatGPT vs Claude: {np.mean([c['cg_cl'] for c in category_rank_corrs]):.4f}")
print(f"   - Grok vs Claude:    {np.mean([c['gr_cl'] for c in category_rank_corrs]):.4f}")
print(f"   - 평균:              {avg_all:.4f}")
print()

print(f"3. 전체 ICC (AI 간 신뢰도): {icc_total:.4f}")
print()

if rho_cg_gr == 1.0 and rho_cg_cl == 1.0 and rho_gr_cl == 1.0:
    print("결론: 3개 AI가 종합점수 순위에서 100% 일치 - 매우 우수!")
    print("      카테고리별 평균 순위 상관계수도 {:.1f}%로 양호".format(avg_all * 100))
else:
    print(f"결론: 종합점수 순위 일치도 {np.mean([rho_cg_gr, rho_cg_cl, rho_gr_cl])*100:.1f}%")
    print(f"      카테고리별 평균 순위 일치도 {avg_all*100:.1f}%")
