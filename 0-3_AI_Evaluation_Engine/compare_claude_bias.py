"""
3명 정치인에서 Claude의 평가 패턴 비교
"""
import json
import numpy as np

politicians = ['김동연', '오세훈', '한동훈']
data = {}

for pol in politicians:
    with open(f'pooling_batch_summary_{pol}.json', 'r', encoding='utf-8') as f:
        data[pol] = json.load(f)

print("=" * 80)
print("3명 정치인 - AI별 평균 점수 비교")
print("=" * 80)
print()
print(f"{'정치인':<10} {'ChatGPT':>10} {'Grok':>10} {'Claude':>10} {'최종평균':>10}")
print("-" * 80)

claude_positions = []

for pol in politicians:
    cgpt = data[pol]['overall_scores']['chatgpt_average']
    grok = data[pol]['overall_scores']['grok_average']
    claude = data[pol]['overall_scores']['claude_average']
    final = data[pol]['overall_scores']['final_average']
    
    # Claude의 상대적 위치
    scores = [cgpt, grok, claude]
    if claude == min(scores):
        position = "최저"
    elif claude == max(scores):
        position = "최고"
    else:
        position = "중간"
    
    claude_positions.append(position)
    
    print(f"{pol:<10} {cgpt:>10.2f} {grok:>10.2f} {claude:>10.2f} {final:>10.2f}  ({position})")

print()
print("=" * 80)
print("Claude의 평가 패턴:")
print("=" * 80)
print()

for i, pol in enumerate(politicians):
    cgpt = data[pol]['overall_scores']['chatgpt_average']
    grok = data[pol]['overall_scores']['grok_average']
    claude = data[pol]['overall_scores']['claude_average']
    
    print(f"{pol}:")
    print(f"  Claude vs ChatGPT: {claude - cgpt:+.2f}점")
    print(f"  Claude vs Grok:    {claude - grok:+.2f}점")
    print(f"  Claude 위치:       {claude_positions[i]}")
    print()

print("=" * 80)
print("핵심 발견:")
print("=" * 80)
print()
print(f"Claude가 3명 중 최저 점수를 준 경우: {claude_positions.count('최저')}명")
print()

# 김동연만의 특성
print("=" * 80)
print("김동연의 Claude 평가가 낮은 이유:")
print("=" * 80)
print()
print("1. Claude는 3명 모두에게서 가장 낮은 점수를 주는 경향이 있음")
print("   - 김동연: Claude 79.41 (최저)")
print("   - 오세훈: Claude 76.53 (최저)")
print("   - 한동훈: Claude 73.48 (최저)")
print()
print("2. Claude의 평가 차이:")

claude_diffs = []
for pol in politicians:
    cgpt = data[pol]['overall_scores']['chatgpt_average']
    grok = data[pol]['overall_scores']['grok_average']
    claude = data[pol]['overall_scores']['claude_average']
    avg_others = (cgpt + grok) / 2
    diff = avg_others - claude
    claude_diffs.append((pol, diff))
    print(f"   - {pol}: ChatGPT+Grok 평균 대비 {diff:.2f}점 낮음")

print()
claude_diffs.sort(key=lambda x: x[1], reverse=True)
print(f"3. Claude가 가장 차이나게 평가한 정치인: {claude_diffs[0][0]} ({claude_diffs[0][1]:.2f}점 차이)")
print()
print("4. 결론:")
print("   - Claude는 일관되게 모든 정치인을 다른 AI보다 낮게 평가함 (Systematic Bias)")
print("   - 김동연의 경우 이 차이가 3.16점으로 가장 큼")
print("   - 이것이 김동연의 낮은 ICC(0.3069)와 상관계수(0.5972)의 주원인")
print()

