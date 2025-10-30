#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
박주민 국회의원 평가 스크립트 (Prior 7.0 + Bayesian Weighted Average)

작성일: 2025-10-30
버전: Prior 7.0
알고리즘: Bayesian Weighted Average
총 항목: 70개 (10개 분야 × 7개 항목)
"""

import anthropic
import os
import sys
from datetime import datetime

# Windows 인코딩 문제 해결
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Prior 7.0 설정
PRIOR = 7.0
PRIOR_WEIGHT = 10

# Anthropic API 클라이언트
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# 10개 분야 정의
CATEGORIES = {
    1: {"name": "청렴성", "english": "Integrity"},
    2: {"name": "전문성", "english": "Professional Competence"},
    3: {"name": "소통능력", "english": "Communication"},
    4: {"name": "정책능력", "english": "Policy Making"},
    5: {"name": "리더십", "english": "Leadership"},
    6: {"name": "책임성", "english": "Accountability"},
    7: {"name": "투명성", "english": "Transparency"},
    8: {"name": "혁신성", "english": "Innovation"},
    9: {"name": "포용성", "english": "Inclusiveness"},
    10: {"name": "효율성", "english": "Efficiency"}
}

# 각 분야당 7개 항목 (간소화)
ITEMS_PER_CATEGORY = {
    1: [  # 청렴성
        "부패 신고 건수",
        "뇌물 및 향응 의혹",
        "청렴도 평가 점수",
        "윤리 위반 사례",
        "이해충돌 방지 노력",
        "재산 변동 투명성",
        "공금 사용 적정성"
    ],
    2: [  # 전문성
        "학력 및 전공 관련성",
        "관련 분야 경력 연수",
        "전문 자격증 보유",
        "정책 전문성",
        "행정 경험",
        "법률 지식 수준",
        "경제 정책 이해도"
    ],
    3: [  # 소통능력
        "주민 간담회 개최 횟수",
        "SNS 소통 활성도",
        "민원 처리 신속성",
        "언론 대응 능력",
        "공청회 개최",
        "시민 제안 수용률",
        "정보 공개 적극성"
    ],
    4: [  # 정책능력
        "공약 이행률",
        "법안 발의 건수",
        "정책 제안 건수",
        "예산 확보 실적",
        "조례 제정 건수",
        "정책 성과 평가",
        "장기 비전 제시"
    ],
    5: [  # 리더십
        "조직 관리 능력",
        "팀워크 구축",
        "갈등 해결 능력",
        "비전 제시 능력",
        "추진력",
        "결단력",
        "인재 등용"
    ],
    6: [  # 책임성
        "업무 보고 성실성",
        "실정 인정 및 사과",
        "공약 준수",
        "결과 책임 수용",
        "투명한 의사결정",
        "시민 피드백 반영",
        "감사 대응 적절성"
    ],
    7: [  # 투명성
        "정보 공개 범위",
        "회의록 공개",
        "예산 집행 공개",
        "인사 절차 투명성",
        "계약 과정 공개",
        "이해관계 공개",
        "민원 처리 공개"
    ],
    8: [  # 혁신성
        "신규 정책 개발",
        "디지털 전환 추진",
        "시민 참여 혁신",
        "행정 프로세스 개선",
        "기술 도입 적극성",
        "창의적 문제 해결",
        "벤치마킹 및 학습"
    ],
    9: [  # 포용성
        "소수자 배려 정책",
        "계층 간 형평성",
        "지역 균형 발전",
        "세대 통합 노력",
        "장애인 정책",
        "다문화 수용",
        "사회적 약자 보호"
    ],
    10: [  # 효율성
        "예산 집행률",
        "사업 완료율",
        "행정 처리 속도",
        "인력 운용 효율성",
        "중복 사업 제거",
        "성과 대비 비용",
        "디지털화 수준"
    ]
}


def collect_and_evaluate_data(politician_name, category_num, category_name, item_num, item_name, target_count=10, max_count=30, max_retries=3):
    """
    Claude AI를 사용하여 데이터 수집 및 평가 (최대 3회 재시도)

    목표: 항목당 최소 10개 ~ 최대 30개 데이터 수집
    10개 미만 수집 시 최대 3회까지 재시도

    Args:
        max_retries: 최대 재시도 횟수 (기본 3회)

    Returns:
        list: 데이터 점수 리스트 (-10 ~ +10)
    """
    import re
    import time

    for attempt in range(1, max_retries + 1):
        prompt = f"""당신은 정치인 평가 전문가입니다.

평가 대상: {politician_name}
분야: {category_name}
항목: {item_name}

다음 작업을 수행하세요:

1. **데이터 수집 원칙** - **반드시 {target_count}개 이상 ~ 최대 {max_count}개** 수집:

   **우선순위 1: 정량적 객관 데이터 (가능한 많이)**
   - 공식 통계 수치 (건수, 비율, 금액 등)
   - 정부/의회/공공기관 공식 발표 자료
   - 예산 집행률, 법안 발의 건수, 출석률 등 측정 가능한 수치
   - 수상 이력, 자격증, 경력 연수 등 검증 가능한 사실

   **우선순위 2: 사실 기반 기록 (정량 데이터가 부족할 때)**
   - 회의 참석, 발언 내용, 정책 발표 등 공식 기록
   - 주요 언론사의 팩트 체크 결과
   - 전문 연구기관/싱크탱크 분석 보고서

   **주의사항**:
   - 주관적 평가/분석 기사는 최소화
   - 검증되지 않은 루머나 의혹은 제외
   - 출처가 명확한 데이터만 수집
   - 다양한 출처 활용 (정부, 언론, 연구기관 등)

2. **평가 기준** (-10 ~ +10점):

   **정량 데이터 평가 (우선)**:
   - 수치를 동일 직급/지역 평균과 비교
   - 평균보다 현저히 높음: +8~+10
   - 평균보다 높음: +4~+7
   - 평균 수준: 0~+3
   - 평균보다 낮음: -3~-6
   - 평균보다 현저히 낮음: -7~-10

   **정성 데이터 평가 (보조)**:
   - 명백히 긍정적 사실 (수상, 성과): +6~+10
   - 긍정적 기록: +2~+5
   - 중립적 사실 기록: -1~+1
   - 비판적 기록: -5~-2
   - 명백히 부정적 사실 (징계, 처벌): -10~-6

3. **데이터 형식** (반드시 준수):

[DATA_1]
제목: 구체적 통계/사건/기록 제목
내용: 객관적 사실과 수치 중심 서술
점수: 0.0
출처: 구체적 출처명 (기관/언론사/날짜)
[/DATA_1]

**절대 중요**:
- 총 {target_count}~{max_count}개 데이터 필수
- 정량 데이터 우선, 정성 데이터는 보조
- 객관적 사실만 수집 (주관적 해석 배제)
- {target_count}개 미만은 절대 불가!"""

        try:
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text

            # 데이터 파싱
            scores = []

            # [DATA_X] 블록 추출
            data_blocks = re.findall(r'\[DATA_\d+\](.*?)\[/DATA_\d+\]', response_text, re.DOTALL)

            for block in data_blocks:
                # 점수 추출
                score_match = re.search(r'점수:\s*([+-]?\d+\.?\d*)', block)
                if score_match:
                    score = float(score_match.group(1))
                    # 범위 제한 (-10 ~ +10)
                    score = max(-10, min(10, score))
                    scores.append(score)

            # 데이터 수집 성공 여부 판단
            if len(scores) >= target_count:
                print(f"      ✓ {len(scores)}개 데이터 수집 성공 (시도 {attempt}/{max_retries})")
                return scores
            elif len(scores) > 0:
                # 10개 미만이지만 데이터가 있는 경우
                if attempt < max_retries:
                    print(f"      ⚠️  목표({target_count}개) 미달: {len(scores)}개 수집 → 재시도 {attempt}/{max_retries}")
                    time.sleep(2)  # API 과부하 방지를 위한 대기
                    continue
                else:
                    print(f"      ⚠️  최종 {len(scores)}개 수집 (목표 미달, {max_retries}회 시도 완료)")
                    return scores
            else:
                # 데이터가 하나도 없는 경우
                if attempt < max_retries:
                    print(f"      ❌ 데이터 수집 실패 → 재시도 {attempt}/{max_retries}")
                    time.sleep(2)
                    continue
                else:
                    print(f"      ❌ 데이터 수집 실패 ({max_retries}회 시도 완료), Prior 사용")
                    return []

        except Exception as e:
            if attempt < max_retries:
                print(f"      ❌ 오류: {e} → 재시도 {attempt}/{max_retries}")
                time.sleep(3)  # 오류 발생 시 더 긴 대기
                continue
            else:
                print(f"      ❌ 오류: {e} ({max_retries}회 시도 완료), Prior 사용")
                return []

    # 여기까지 오면 안 되지만 안전장치
    return []


def calculate_item_score(scores, prior=PRIOR, prior_weight=PRIOR_WEIGHT):
    """
    Bayesian Weighted Average로 항목 점수 계산

    Args:
        scores: 데이터 점수 리스트 (-10 ~ +10)
        prior: Prior 값 (기본 7.0)
        prior_weight: Prior 가중치 (기본 10)

    Returns:
        float: 항목 점수 (4.0 ~ 10.0)
    """
    if len(scores) == 0:
        return prior

    N = len(scores)
    ai_average = sum(scores) / N

    # Bayesian Weighted Average
    item_score = (ai_average * N + prior * prior_weight) / (N + prior_weight)

    # 범위 제한 (4.0 ~ 10.0)
    item_score = max(4.0, min(10.0, item_score))

    return round(item_score, 2)


def calculate_category_score(item_scores):
    """분야 점수 계산 (산술 평균)"""
    if len(item_scores) == 0:
        return PRIOR
    return round(sum(item_scores) / len(item_scores), 2)


def calculate_final_score(category_scores):
    """최종 점수 계산 (합계 × 10, 정수)"""
    total = sum(category_scores) * 10
    return int(total)


def get_grade(final_score):
    """
    10단계 등급 변환 (Prior 7.0 버전, 400-1000 스케일)
    """
    if final_score >= 940:
        return {'code': 'M', 'name': 'Mugunghwa', 'emoji': '🌺', 'description': '최우수'}
    elif final_score >= 880:
        return {'code': 'D', 'name': 'Diamond', 'emoji': '💎', 'description': '우수'}
    elif final_score >= 820:
        return {'code': 'E', 'name': 'Emerald', 'emoji': '💚', 'description': '양호'}
    elif final_score >= 760:
        return {'code': 'P', 'name': 'Platinum', 'emoji': '🥇', 'description': '보통+'}
    elif final_score >= 700:
        return {'code': 'G', 'name': 'Gold', 'emoji': '🥇', 'description': '보통'}
    elif final_score >= 640:
        return {'code': 'S', 'name': 'Silver', 'emoji': '🥈', 'description': '보통-'}
    elif final_score >= 580:
        return {'code': 'B', 'name': 'Bronze', 'emoji': '🥉', 'description': '미흡'}
    elif final_score >= 520:
        return {'code': 'I', 'name': 'Iron', 'emoji': '⚫', 'description': '부족'}
    elif final_score >= 460:
        return {'code': 'Tn', 'name': 'Tin', 'emoji': '🪨', 'description': '상당히 부족'}
    else:
        return {'code': 'L', 'name': 'Lead', 'emoji': '⬛', 'description': '매우 부족'}


def main():
    """메인 실행 함수"""

    politician_name = "박주민 국회의원"

    print("=" * 60)
    print(f"🎯 {politician_name} 평가 시작 (Prior 7.0)")
    print("=" * 60)
    print(f"평가 방식: Bayesian Weighted Average")
    print(f"Prior: {PRIOR}")
    print(f"Prior Weight: {PRIOR_WEIGHT}")
    print(f"데이터 점수 범위: -10 ~ +10")
    print(f"항목 점수 범위: 4.0 ~ 10.0")
    print(f"최종 점수 범위: 400 ~ 1000")
    print(f"총 항목: 70개 (10개 분야 × 7개 항목)")
    print(f"항목당 데이터: 최소 10개 ~ 최대 30개")
    print("=" * 60)
    print()

    all_category_scores = {}

    # 10개 분야 평가
    for cat_num in range(1, 11):
        category = CATEGORIES[cat_num]
        items = ITEMS_PER_CATEGORY[cat_num]

        print("=" * 60)
        print(f"📂 분야 {cat_num}: {category['name']} ({category['english']})")
        print("=" * 60)
        print()

        item_scores = []

        # 7개 항목 평가
        for item_num, item_name in enumerate(items, 1):
            print(f"  📌 항목 {cat_num}-{item_num}: {item_name}")

            # 데이터 수집 및 평가 (10~30개)
            scores = collect_and_evaluate_data(
                politician_name,
                cat_num,
                category['name'],
                item_num,
                item_name,
                target_count=10,
                max_count=30
            )

            # 항목 점수 계산
            item_score = calculate_item_score(scores)
            item_scores.append(item_score)

            print(f"      → 항목 점수: {item_score}점")
            print()

        # 분야 점수 계산
        category_score = calculate_category_score(item_scores)
        all_category_scores[cat_num] = category_score

        print(f"  📊 분야 {cat_num} 점수: {category_score}점")
        print()

    # 최종 점수 계산
    final_score = calculate_final_score(list(all_category_scores.values()))
    grade_info = get_grade(final_score)

    # 결과 출력
    print()
    print("=" * 60)
    print("🏆 최종 평가 결과")
    print("=" * 60)
    print(f"평가 대상: {politician_name}")
    print(f"평가 일시: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"평가 방식: Bayesian Weighted Average (Prior {PRIOR})")
    print()
    print("분야별 점수:")
    for cat_num, score in all_category_scores.items():
        category = CATEGORIES[cat_num]
        print(f"  {cat_num}. {category['name']:8s}: {score:5.2f}점")
    print()
    print(f"최종 점수: {final_score}점")
    print(f"등급: {grade_info['emoji']} {grade_info['code']} ({grade_info['name']})")
    print(f"의미: {grade_info['description']}")
    print("=" * 60)


if __name__ == "__main__":
    main()
