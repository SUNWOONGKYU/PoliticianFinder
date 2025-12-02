"""
김동연 AI 간 일관성 낮은 이유 상세 분석
"""
import json
import numpy as np

# 김동연 데이터 로드
with open('pooling_batch_summary_김동연.json', 'r', encoding='utf-8') as f:
    kim = json.load(f)

print("=" * 80)
print("김동연 AI 간 점수 차이 상세 분석")
print("=" * 80)
print()

print("카테고리별 AI 점수 차이:")
print("-" * 80)
print(f"{'카테고리':<15} {'ChatGPT':>8} {'Grok':>8} {'Claude':>8} {'최대차이':>8} {'패턴':>15}")
print("-" * 80)

max_diffs = []
patterns = []

for result in kim['results']:
    cat = result['category_kor']
    cgpt = result['scores']['ChatGPT']['category_score']
    grok = result['scores']['Grok']['category_score']
    claude = result['scores']['Claude']['category_score']
    
    scores = [cgpt, grok, claude]
    max_diff = max(scores) - min(scores)
    max_diffs.append(max_diff)
    
    # 패턴 분석
    if claude < min(cgpt, grok):
        pattern = "Claude 최저"
    elif claude > max(cgpt, grok):
        pattern = "Claude 최고"
    else:
        pattern = "Claude 중간"
    
    patterns.append(pattern)
    
    print(f"{cat:<15} {cgpt:>8.2f} {grok:>8.2f} {claude:>8.2f} {max_diff:>8.2f} {pattern:>15}")

print("-" * 80)
print(f"{'평균':<15} {kim['overall_scores']['chatgpt_average']:>8.2f} "
      f"{kim['overall_scores']['grok_average']:>8.2f} "
      f"{kim['overall_scores']['claude_average']:>8.2f} {np.mean(max_diffs):>8.2f}")
print()

# 패턴 카운트
print("=" * 80)
print("패턴 분석:")
print("=" * 80)
from collections import Counter
pattern_counts = Counter(patterns)
for pattern, count in pattern_counts.items():
    print(f"  {pattern}: {count}회 ({count/10*100:.0f}%)")

print()
print("=" * 80)
print("핵심 문제:")
print("=" * 80)
print(f"Claude가 10개 카테고리 모두에서 가장 낮은 점수를 줬나? {sum(1 for p in patterns if p == 'Claude 최저')}개")
print()
print("Claude의 평균 점수: {:.2f}".format(kim['overall_scores']['claude_average']))
print("ChatGPT의 평균 점수: {:.2f}".format(kim['overall_scores']['chatgpt_average']))
print("Grok의 평균 점수: {:.2f}".format(kim['overall_scores']['grok_average']))
print()
print("Claude vs ChatGPT 차이: {:.2f}점".format(
    kim['overall_scores']['chatgpt_average'] - kim['overall_scores']['claude_average']))
print("Claude vs Grok 차이: {:.2f}점".format(
    kim['overall_scores']['grok_average'] - kim['overall_scores']['claude_average']))
print()

# 가장 차이 큰 카테고리
print("=" * 80)
print("AI 간 차이가 가장 큰 카테고리 TOP 3:")
print("=" * 80)
diffs_with_cat = [(result['category_kor'], max(
    result['scores']['ChatGPT']['category_score'],
    result['scores']['Grok']['category_score'],
    result['scores']['Claude']['category_score']
) - min(
    result['scores']['ChatGPT']['category_score'],
    result['scores']['Grok']['category_score'],
    result['scores']['Claude']['category_score']
)) for result in kim['results']]

diffs_with_cat.sort(key=lambda x: x[1], reverse=True)
for i, (cat, diff) in enumerate(diffs_with_cat[:3], 1):
    print(f"{i}. {cat}: {diff:.2f}점 차이")

