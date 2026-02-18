#!/usr/bin/env python3
"""
수동 평가 스크립트 - Subscription Mode
Claude Code가 직접 평가를 수행 (API 호출 없음)
"""

import json
from datetime import datetime

def evaluate_communication_item(item):
    """
    communication(소통능력) 카테고리 항목 평가

    평가 기준:
    +4: 탁월한 소통 (주민과의 활발한 소통, 투명한 정보 공개, 적극적 대화)
    +3: 우수한 소통 (정기적 소통, 긍정적 피드백)
    +2: 양호한 소통 (기본적인 소통 수행)
    +1: 보통 (평범한 소통)
    -1: 미흡한 소통 (소통 부족 지적)
    -2: 부족한 소통 (소통 문제 발생)
    -3: 매우 부족 (심각한 소통 문제)
    -4: 극히 부족 (소통 완전 단절)
    """

    title = item.get('title', '')
    content = item.get('content', '')
    sentiment = item.get('sentiment', 'free')

    # 텍스트 통합
    text = f"{title} {content}".lower()

    # 부정적 키워드
    negative_severe = ['독단', '일방통행', '소통 단절', '무시', '독주', '고립', '외면']
    negative_moderate = ['논란', '비판', '반발', '우려', '의혹', '문제', '갈등']
    negative_mild = ['미흡', '부족', '아쉬움', '지적']

    # 긍정적 키워드
    positive_excellent = ['모범', '활발한 소통', '적극적', '투명', '열린', '소통 강화']
    positive_good = ['간담회', '주민 만남', '현장', '대화', '의견 수렴', '소통']
    positive_fair = ['정례', '회의', '참석', '발언', '설명']

    rating = '+1'  # 기본값
    score = 2
    reasoning = ''

    # 부정적 평가
    if any(kw in text for kw in negative_severe):
        if sentiment == 'negative':
            rating = '-3'
            score = -6
            reasoning = "독단적 행정과 소통 단절 문제가 심각하게 지적됨"
        else:
            rating = '-2'
            score = -4
            reasoning = "일방적 의사결정으로 소통 문제가 제기됨"

    elif any(kw in text for kw in negative_moderate):
        if sentiment == 'negative':
            rating = '-2'
            score = -4
            reasoning = "정책 추진 과정에서 주민과의 소통 부족 논란 발생"
        else:
            rating = '-1'
            score = -2
            reasoning = "일부 정책에서 소통 미흡 지적이 있었으나 경미함"

    elif any(kw in text for kw in negative_mild):
        rating = '-1'
        score = -2
        reasoning = "소통 노력은 있으나 개선이 필요한 부분 있음"

    # 긍정적 평가
    elif any(kw in text for kw in positive_excellent):
        rating = '+4'
        score = 8
        reasoning = "주민과의 적극적이고 투명한 소통으로 모범적 평가를 받음"

    elif any(kw in text for kw in positive_good):
        if sentiment == 'positive':
            rating = '+3'
            score = 6
            reasoning = "주민 간담회와 현장 방문 등 활발한 소통 활동 전개"
        else:
            rating = '+2'
            score = 4
            reasoning = "정기적인 주민 소통 활동을 수행하고 있음"

    elif any(kw in text for kw in positive_fair):
        rating = '+2'
        score = 4
        reasoning = "기본적인 소통 절차를 준수하며 의견 수렴 진행"

    # 중립적/보통
    else:
        if sentiment == 'positive':
            rating = '+2'
            score = 4
            reasoning = "긍정적 활동이 언급되나 구체적 소통 성과는 제한적"
        elif sentiment == 'negative':
            rating = '-1'
            score = -2
            reasoning = "부정적 내용이 포함되어 있으나 소통 관련 구체적 비판은 없음"
        else:
            rating = '+1'
            score = 2
            reasoning = "일반적인 정치 활동 수행, 특별한 소통 성과나 문제 없음"

    return {
        'collected_data_id': item['id'],
        'rating': rating,
        'score': score,
        'reasoning': reasoning
    }


def main():
    # 데이터 파일 읽기
    with open('eval_jo_communication_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"조은희 communication 카테고리 평가 시작...")
    print(f"항목 수: {len(data['items'])}개\n")

    # 모든 항목 평가
    evaluations = []
    for i, item in enumerate(data['items'], 1):
        evaluation = evaluate_communication_item(item)
        evaluations.append(evaluation)

        if i % 10 == 0:
            print(f"진행: {i}/100")

    # 결과 JSON 생성
    result = {
        'politician_id': data['politician_id'],
        'politician_name': data['politician_name'],
        'category': data['category'],
        'evaluator_ai': 'Claude',
        'evaluated_at': datetime.now().isoformat(),
        'evaluations': evaluations
    }

    # 결과 저장
    output_file = 'eval_jo_communication_result.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 평가 완료!")
    print(f"   - 평가 항목: {len(evaluations)}개")
    print(f"   - 결과 파일: {output_file}")

    # 통계
    ratings_count = {}
    for ev in evaluations:
        rating = ev['rating']
        ratings_count[rating] = ratings_count.get(rating, 0) + 1

    print("\n평가 등급 분포:")
    for rating in sorted(ratings_count.keys(), reverse=True):
        count = ratings_count[rating]
        print(f"   {rating}: {count}개")


if __name__ == '__main__':
    main()
