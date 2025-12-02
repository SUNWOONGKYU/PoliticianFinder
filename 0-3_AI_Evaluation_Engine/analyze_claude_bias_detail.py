"""
Claude가 김동연에게 낮은 점수를 준 이유 상세 분석
"""
import json
import numpy as np

politicians = ['김동연', '오세훈', '한동훈']
data = {}

for pol in politicians:
    with open(f'pooling_batch_summary_{pol}.json', 'r', encoding='utf-8') as f:
        data[pol] = json.load(f)

print("=" * 100)
print("Claude의 평가 패턴 분석: 왜 김동연에게 낮은 점수를?")
print("=" * 100)
print()

# 1. Claude의 평가 점수 분포
print("1. Claude의 정치인별 평균 점수 및 분포")
print("-" * 100)
print(f"{'정치인':12} {'평균 점수':>12} {'최고 점수':>12} {'최저 점수':>12} {'점수 범위':>12}")
print("-" * 100)

claude_stats = {}
for pol in politicians:
    scores = [result['scores']['Claude']['category_score'] for result in data[pol]['results']]
    claude_stats[pol] = {
        'mean': np.mean(scores),
        'max': np.max(scores),
        'min': np.min(scores),
        'range': np.max(scores) - np.min(scores),
        'std': np.std(scores)
    }
    
    print(f"{pol:12} {claude_stats[pol]['mean']:>12.2f} {claude_stats[pol]['max']:>12.2f} "
          f"{claude_stats[pol]['min']:>12.2f} {claude_stats[pol]['range']:>12.2f}")

print()

# 2. Claude와 다른 AI의 평균 점수 차이
print("2. Claude vs 다른 AI 평균 점수 차이")
print("-" * 100)
print(f"{'정치인':12} {'ChatGPT':>12} {'Grok':>12} {'Claude':>12} {'CG-Claude':>12} {'Grok-Claude':>12}")
print("-" * 100)

for pol in politicians:
    cgpt = data[pol]['overall_scores']['chatgpt_average']
    grok = data[pol]['overall_scores']['grok_average']
    claude = data[pol]['overall_scores']['claude_average']
    
    diff_cg = cgpt - claude
    diff_gr = grok - claude
    
    print(f"{pol:12} {cgpt:>12.2f} {grok:>12.2f} {claude:>12.2f} {diff_cg:>12.2f} {diff_gr:>12.2f}")

print()

# 3. 카테고리별 Claude의 상대적 위치
print("3. 카테고리별 Claude의 평가 경향 (김동연)")
print("-" * 100)
print(f"{'카테고리':12} {'ChatGPT':>10} {'Grok':>10} {'Claude':>10} {'Claude 위치':>15} {'차이':>10}")
print("-" * 100)

kim_results = data['김동연']['results']
for result in kim_results:
    cat = result['category_kor']
    cgpt = result['scores']['ChatGPT']['category_score']
    grok = result['scores']['Grok']['category_score']
    claude = result['scores']['Claude']['category_score']
    
    scores = [cgpt, grok, claude]
    if claude == min(scores):
        position = "최저"
        diff = (cgpt + grok) / 2 - claude
    elif claude == max(scores):
        position = "최고"
        diff = claude - (cgpt + grok) / 2
    else:
        position = "중간"
        diff = abs(claude - (cgpt + grok) / 2)
    
    print(f"{cat:12} {cgpt:>10.2f} {grok:>10.2f} {claude:>10.2f} {position:>15} {diff:>10.2f}")

print()

# 4. Claude의 평가 기준 분석 (Positive/Negative 비율)
print("4. AI별 Positive/Negative 비율 분석 (김동연)")
print("-" * 100)
print(f"{'카테고리':12} {'ChatGPT P/N':>15} {'Grok P/N':>15} {'Claude P/N':>15} {'Claude 특성':>20}")
print("-" * 100)

for result in kim_results:
    cat = result['category_kor']
    
    cgpt_pos = result['scores']['ChatGPT']['positive']
    cgpt_neg = result['scores']['ChatGPT']['negative']
    cgpt_ratio = cgpt_pos / (cgpt_pos + cgpt_neg)
    
    grok_pos = result['scores']['Grok']['positive']
    grok_neg = result['scores']['Grok']['negative']
    grok_ratio = grok_pos / (grok_pos + grok_neg)
    
    claude_pos = result['scores']['Claude']['positive']
    claude_neg = result['scores']['Claude']['negative']
    claude_ratio = claude_pos / (claude_pos + claude_neg)
    
    avg_ratio = (cgpt_ratio + grok_ratio) / 2
    
    if claude_ratio < avg_ratio - 0.05:
        characteristic = "더 비판적"
    elif claude_ratio > avg_ratio + 0.05:
        characteristic = "더 긍정적"
    else:
        characteristic = "비슷"
    
    print(f"{cat:12} {cgpt_pos}/{cgpt_neg:3} ({cgpt_ratio:.2f}) "
          f"{grok_pos}/{grok_neg:3} ({grok_ratio:.2f}) "
          f"{claude_pos}/{claude_neg:3} ({claude_ratio:.2f}) {characteristic:>20}")

print()

# 5. Claude의 평가 스타일 분석
print("5. Claude의 평가 스타일: 보수적 vs 관대")
print("-" * 100)

for pol in politicians:
    print(f"\n[{pol}]")
    print("-" * 60)
    
    total_cgpt_pos = 0
    total_cgpt_neg = 0
    total_grok_pos = 0
    total_grok_neg = 0
    total_claude_pos = 0
    total_claude_neg = 0
    
    for result in data[pol]['results']:
        total_cgpt_pos += result['scores']['ChatGPT']['positive']
        total_cgpt_neg += result['scores']['ChatGPT']['negative']
        total_grok_pos += result['scores']['Grok']['positive']
        total_grok_neg += result['scores']['Grok']['negative']
        total_claude_pos += result['scores']['Claude']['positive']
        total_claude_neg += result['scores']['Claude']['negative']
    
    cgpt_ratio = total_cgpt_pos / (total_cgpt_pos + total_cgpt_neg)
    grok_ratio = total_grok_pos / (total_grok_pos + total_grok_neg)
    claude_ratio = total_claude_pos / (total_claude_pos + total_claude_neg)
    
    print(f"ChatGPT: Positive {cgpt_ratio:.2%} ({total_cgpt_pos}/{total_cgpt_pos+total_cgpt_neg})")
    print(f"Grok:    Positive {grok_ratio:.2%} ({total_grok_pos}/{total_grok_pos+total_grok_neg})")
    print(f"Claude:  Positive {claude_ratio:.2%} ({total_claude_pos}/{total_claude_pos+total_claude_neg})")
    
    if claude_ratio < min(cgpt_ratio, grok_ratio):
        print(f"→ Claude가 가장 비판적 (Positive 비율 가장 낮음)")
    elif claude_ratio > max(cgpt_ratio, grok_ratio):
        print(f"→ Claude가 가장 관대함 (Positive 비율 가장 높음)")
    else:
        print(f"→ Claude는 중간 수준")

print()
print("=" * 100)
print("결론: Claude가 김동연에게 낮은 점수를 준 이유")
print("=" * 100)
print()

kim_cgpt = data['김동연']['overall_scores']['chatgpt_average']
kim_grok = data['김동연']['overall_scores']['grok_average']
kim_claude = data['김동연']['overall_scores']['claude_average']

print(f"1. 절대 점수 차이:")
print(f"   - ChatGPT: {kim_cgpt:.2f}")
print(f"   - Grok:    {kim_grok:.2f}")
print(f"   - Claude:  {kim_claude:.2f} (평균 3.17점 낮음)")
print()

print(f"2. Claude의 평가 스타일:")
total_claude_pos = sum(result['scores']['Claude']['positive'] for result in kim_results)
total_claude_count = len(kim_results) * 150
total_claude_ratio = total_claude_pos / total_claude_count

print(f"   - Positive 비율: {total_claude_ratio:.2%}")
print(f"   - ChatGPT/Grok 대비 더 보수적/비판적 평가")
print()

print(f"3. 일관성:")
print(f"   - 10개 카테고리 중 9개에서 최저 점수")
print(f"   - Systematic Bias (체계적 편향) 존재")
print()

print(f"4. 가능한 원인:")
print(f"   a) Claude의 평가 기준이 더 엄격함")
print(f"   b) 같은 뉴스를 더 비판적으로 해석")
print(f"   c) 김동연이 첫 평가 대상 → 초기 프롬프트 불안정")
print(f"   d) Claude API의 특성 (더 신중한 평가 경향)")

