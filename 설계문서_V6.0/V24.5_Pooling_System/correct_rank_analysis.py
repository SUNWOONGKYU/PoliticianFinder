"""
올바른 순위 분석: 3명 정치인 간의 순위
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
print("3명 정치인 카테고리별 점수 및 순위 (1위=최고, 3위=최저)")
print("=" * 100)
print()

# 각 카테고리별로 3명의 점수와 순위
for cat_eng in categories:
    cat_kor_name = category_kor[cat_eng]
    print(f"\n[{cat_kor_name}]")
    print("-" * 100)
    
    # 3개 AI별로 분석
    for ai in ['ChatGPT', 'Grok', 'Claude']:
        scores = []
        for pol in politicians:
            for result in data[pol]['results']:
                if result['category_eng'] == cat_eng:
                    score = result['scores'][ai]['category_score']
                    scores.append((pol, score))
                    break
        
        # 순위 계산 (높은 점수 = 1위)
        scores.sort(key=lambda x: x[1], reverse=True)
        
        print(f"{ai:12} ", end="")
        for rank, (pol, score) in enumerate(scores, 1):
            print(f"{rank}위:{pol}({score:.2f})  ", end="")
        print()

print("\n" + "=" * 100)
print("카테고리별 AI 간 순위 일치도 분석")
print("=" * 100)
print()

# 각 카테고리별로 순위 상관계수 계산
all_rank_corr_chatgpt_grok = []
all_rank_corr_chatgpt_claude = []
all_rank_corr_grok_claude = []

for cat_eng in categories:
    cat_kor_name = category_kor[cat_eng]
    
    # 각 AI별 순위 (1, 2, 3)
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
        
        # 순위 부여 (높은 점수 = 1위)
        scores.sort(key=lambda x: x[1], reverse=True)
        pol_to_rank = {pol: rank for rank, (pol, _) in enumerate(scores, 1)}
        
        # 정치인 순서대로 순위 저장
        for pol in politicians:
            rank_list.append(pol_to_rank[pol])
    
    # Spearman 순위 상관계수
    rho_cg_gr, _ = spearmanr(chatgpt_ranks, grok_ranks)
    rho_cg_cl, _ = spearmanr(chatgpt_ranks, claude_ranks)
    rho_gr_cl, _ = spearmanr(grok_ranks, claude_ranks)
    
    all_rank_corr_chatgpt_grok.append(rho_cg_gr)
    all_rank_corr_chatgpt_claude.append(rho_cg_cl)
    all_rank_corr_grok_claude.append(rho_gr_cl)
    
    print(f"{cat_kor_name:12} ChatGPT-Grok: {rho_cg_gr:>6.3f}  ChatGPT-Claude: {rho_cg_cl:>6.3f}  Grok-Claude: {rho_gr_cl:>6.3f}")

print("\n" + "=" * 100)
print("전체 평균 순위 상관계수")
print("=" * 100)
print()
print(f"ChatGPT vs Grok:   {np.mean(all_rank_corr_chatgpt_grok):.4f}")
print(f"ChatGPT vs Claude: {np.mean(all_rank_corr_chatgpt_claude):.4f}")
print(f"Grok vs Claude:    {np.mean(all_rank_corr_grok_claude):.4f}")
print()

# 전체 평균 점수로 최종 순위
print("=" * 100)
print("전체 평균 점수 기준 최종 순위")
print("=" * 100)
print()

for ai_name in ['ChatGPT', 'Grok', 'Claude']:
    scores = []
    for pol in politicians:
        avg = data[pol]['overall_scores'][f'{ai_name.lower()}_average']
        scores.append((pol, avg))
    
    scores.sort(key=lambda x: x[1], reverse=True)
    print(f"{ai_name:12} ", end="")
    for rank, (pol, score) in enumerate(scores, 1):
        print(f"{rank}위:{pol}({score:.2f})  ", end="")
    print()

print("\n최종 평균:   ", end="")
final_scores = []
for pol in politicians:
    avg = data[pol]['overall_scores']['final_average']
    final_scores.append((pol, avg))

final_scores.sort(key=lambda x: x[1], reverse=True)
for rank, (pol, score) in enumerate(final_scores, 1):
    print(f"{rank}위:{pol}({score:.2f})  ", end="")
print()

