"""
김동연 - AI 간 순위 상관관계 분석
점수는 달라도 순위는 일치하는가?
"""
import json
import numpy as np
from scipy.stats import spearmanr

# 김동연 데이터 로드
with open('pooling_batch_summary_김동연.json', 'r', encoding='utf-8') as f:
    kim = json.load(f)

print("=" * 80)
print("김동연 - 카테고리별 AI 점수와 순위")
print("=" * 80)
print()

categories = []
chatgpt_scores = []
grok_scores = []
claude_scores = []

for result in kim['results']:
    categories.append(result['category_kor'])
    chatgpt_scores.append(result['scores']['ChatGPT']['category_score'])
    grok_scores.append(result['scores']['Grok']['category_score'])
    claude_scores.append(result['scores']['Claude']['category_score'])

# 각 AI별 순위 계산 (높은 점수 = 낮은 순위 번호, 즉 1등)
def get_ranks(scores):
    """점수를 순위로 변환 (높은 점수 = 1위)"""
    # argsort는 작은 값부터 정렬하므로, 역순으로
    sorted_indices = np.argsort(scores)[::-1]
    ranks = np.empty_like(sorted_indices)
    ranks[sorted_indices] = np.arange(1, len(scores) + 1)
    return ranks

chatgpt_ranks = get_ranks(chatgpt_scores)
grok_ranks = get_ranks(grok_scores)
claude_ranks = get_ranks(claude_scores)

# 출력
print(f"{'카테고리':<12} {'ChatGPT':>18} {'Grok':>18} {'Claude':>18}")
print(f"{'':12} {'점수':>8} {'순위':>8} {'점수':>8} {'순위':>8} {'점수':>8} {'순위':>8}")
print("-" * 80)

for i, cat in enumerate(categories):
    print(f"{cat:<12} "
          f"{chatgpt_scores[i]:>8.2f} {int(chatgpt_ranks[i]):>8} "
          f"{grok_scores[i]:>8.2f} {int(grok_ranks[i]):>8} "
          f"{claude_scores[i]:>8.2f} {int(claude_ranks[i]):>8}")

print()
print("=" * 80)
print("순위 상관계수 (Spearman Rank Correlation)")
print("=" * 80)
print()

# Spearman 상관계수 계산
rho_cg_gr, p_cg_gr = spearmanr(chatgpt_ranks, grok_ranks)
rho_cg_cl, p_cg_cl = spearmanr(chatgpt_ranks, claude_ranks)
rho_gr_cl, p_gr_cl = spearmanr(grok_ranks, claude_ranks)

print(f"ChatGPT vs Grok:   ρ = {rho_cg_gr:.4f} (p = {p_cg_gr:.4f})")
print(f"ChatGPT vs Claude: ρ = {rho_cg_cl:.4f} (p = {p_cg_cl:.4f})")
print(f"Grok vs Claude:    ρ = {rho_gr_cl:.4f} (p = {p_gr_cl:.4f})")
print()

# 점수 상관계수와 비교
from scipy.stats import pearsonr
r_cg_gr, _ = pearsonr(chatgpt_scores, grok_scores)
r_cg_cl, _ = pearsonr(chatgpt_scores, claude_scores)
r_gr_cl, _ = pearsonr(grok_scores, claude_scores)

print("=" * 80)
print("점수 상관계수 vs 순위 상관계수 비교")
print("=" * 80)
print()
print(f"{'AI 쌍':<20} {'점수 상관(r)':>15} {'순위 상관(ρ)':>15} {'차이':>10}")
print("-" * 80)
print(f"{'ChatGPT vs Grok':<20} {r_cg_gr:>15.4f} {rho_cg_gr:>15.4f} {rho_cg_gr - r_cg_gr:>10.4f}")
print(f"{'ChatGPT vs Claude':<20} {r_cg_cl:>15.4f} {rho_cg_cl:>15.4f} {rho_cg_cl - r_cg_cl:>10.4f}")
print(f"{'Grok vs Claude':<20} {r_gr_cl:>15.4f} {rho_gr_cl:>15.4f} {rho_gr_cl - r_gr_cl:>10.4f}")
print()

print("=" * 80)
print("순위 불일치 분석")
print("=" * 80)
print()

# 순위 차이 계산
print("ChatGPT vs Claude 순위 차이가 큰 카테고리:")
rank_diffs_cl = []
for i, cat in enumerate(categories):
    diff = abs(chatgpt_ranks[i] - claude_ranks[i])
    rank_diffs_cl.append((cat, diff, chatgpt_ranks[i], claude_ranks[i]))

rank_diffs_cl.sort(key=lambda x: x[1], reverse=True)
for cat, diff, cgpt_rank, cl_rank in rank_diffs_cl[:5]:
    if diff > 0:
        print(f"  {cat:<12}: ChatGPT {int(cgpt_rank)}위, Claude {int(cl_rank)}위 (차이 {int(diff)})")

print()
print("Grok vs Claude 순위 차이가 큰 카테고리:")
rank_diffs_gr = []
for i, cat in enumerate(categories):
    diff = abs(grok_ranks[i] - claude_ranks[i])
    rank_diffs_gr.append((cat, diff, grok_ranks[i], claude_ranks[i]))

rank_diffs_gr.sort(key=lambda x: x[1], reverse=True)
for cat, diff, gr_rank, cl_rank in rank_diffs_gr[:5]:
    if diff > 0:
        print(f"  {cat:<12}: Grok {int(gr_rank)}위, Claude {int(cl_rank)}위 (차이 {int(diff)})")

print()
print("=" * 80)
print("결론")
print("=" * 80)
print()

avg_rank_corr = np.mean([rho_cg_gr, rho_cg_cl, rho_gr_cl])
avg_score_corr = np.mean([r_cg_gr, r_cg_cl, r_gr_cl])

print(f"평균 점수 상관계수 (Pearson r): {avg_score_corr:.4f}")
print(f"평균 순위 상관계수 (Spearman ρ): {avg_rank_corr:.4f}")
print()

if avg_rank_corr > avg_score_corr + 0.1:
    print("✅ 순위 상관계수가 점수 상관계수보다 높음!")
    print("   → Claude는 점수는 다르게 주지만 순위는 비슷하게 매김")
    print("   → 절대적 기준은 다르지만 상대적 평가는 일치")
elif avg_rank_corr < avg_score_corr - 0.1:
    print("⚠️ 순위 상관계수가 점수 상관계수보다 낮음!")
    print("   → 순위 자체가 달라짐")
else:
    print("➡️ 순위 상관계수와 점수 상관계수가 비슷함")
    print("   → 점수 차이가 순위 차이로 이어짐")

