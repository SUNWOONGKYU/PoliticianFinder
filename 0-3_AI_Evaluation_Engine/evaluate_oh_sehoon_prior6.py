#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
오세훈 서울시장 평가 스크립트 (Prior 7.0 + NBCF)

작성일: 2025-10-30
버전: Prior 7.0 with NBCF
알고리즘: Negativity Bias Correction Factor (부정 편향 보정 계수)
총 항목: 70개 (10개 분야 × 7개 항목)
NBCF: λ = 3/7 ≈ 0.4286
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

# NBCF (Negativity Bias Correction Factor)
NBCF = 3.0 / 6.0  # λ = 0.5 (6-4 symmetric structure)

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


def collect_and_evaluate_data(politician_name, category_num, category_name, item_num, item_name, target_count=10, max_count=30):
    """
    Claude AI를 사용하여 데이터 수집 및 평가

    목표: 항목당 최소 10개 ~ 최대 30개 데이터 수집
    불가피하게 10개 미만인 경우도 허용

    Returns:
        list: 데이터 점수 리스트 (-10 ~ +10)
    """

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

2. **등급 분류** (점수 아님! 등급만 판단):

   **중요**: 당신은 점수를 매기는 것이 아니라 **등급만 분류**합니다.

   수집한 데이터를 보고 어느 등급에 해당하는지만 판단하세요:

   【긍정 데이터라면】→ 좋음 1~6등급 중 선택
   - 좋음 6등급 (탁월, 최고 수준의 성과/수상)
   - 좋음 5등급 (매우 우수, 전문가 극찬)
   - 좋음 4등급 (우수, 뛰어난 성과)
   - 좋음 3등급 (양호, 좋은 평가)
   - 좋음 2등급 (평균 이상, 긍정적)
   - 좋음 1등급 (약간 긍정적)

   【중립 데이터라면】→ 중립
   - 중립 (보통, 특별한 평가 없음)

   【부정 데이터라면】→ 나쁨 1~4등급 중 선택
   - 나쁨 1등급 (약간 부정적, 경미한 비판)
   - 나쁨 2등급 (미흡, 부정적 평가)
   - 나쁨 3등급 (부족, 문제 지적)
   - 나쁨 4등급 (심각, 감사 지적/징계/처벌)

   **분류 방법**:
   1. 데이터가 긍정적 → 얼마나 좋은지 1~6등급 중 선택
   2. 데이터가 중립적 → "중립"
   3. 데이터가 부정적 → 얼마나 나쁜지 1~4등급 중 선택

   **분류 예시**:
   - "대통령 표창 수상" → 등급: 좋음 6등급
   - "예산 20% 증액" → 등급: 좋음 4등급
   - "예산 5% 증액" → 등급: 좋음 2등급
   - "회의 참석 (특별한 의미 없음)" → 등급: 중립
   - "언론 비판 기사 1건" → 등급: 나쁨 1등급
   - "감사 지적, 시정 요구" → 등급: 나쁨 3등급
   - "검찰 수사, 징계" → 등급: 나쁨 4등급

3. **데이터 형식** (반드시 준수):

[DATA_1]
제목: 구체적 통계/사건/기록 제목
내용: 객관적 사실과 수치 중심 서술
등급: 좋음 5등급
출처: 구체적 출처명 (기관/언론사/날짜)
[/DATA_1]

**절대 중요**:
- "등급:" 필드에는 등급만 작성 (예: "좋음 5등급", "나쁨 2등급", "중립")
- 점수 숫자 (예: +5, -2)를 쓰지 마세요! 등급 텍스트만!
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
        import re

        # 등급 → 점수 변환 맵 (6-4 대칭 구조)
        grade_to_score_map = {
            "좋음 6등급": 6, "좋음 5등급": 5, "좋음 4등급": 4,
            "좋음 3등급": 3, "좋음 2등급": 2, "좋음 1등급": 1,
            "중립": 0,
            "나쁨 1등급": -1, "나쁨 2등급": -2, "나쁨 3등급": -3, "나쁨 4등급": -4
        }

        # [DATA_X] 블록 추출
        data_blocks = re.findall(r'\[DATA_\d+\](.*?)\[/DATA_\d+\]', response_text, re.DOTALL)

        for block in data_blocks:
            # 등급 추출
            grade_match = re.search(r'등급:\s*([^\n]+)', block)
            if grade_match:
                grade_text = grade_match.group(1).strip()
                # 등급 → 점수 변환
                score = grade_to_score_map.get(grade_text, 0)
                scores.append(score)
            else:
                # 하위 호환: 기존 "점수:" 필드도 지원
                score_match = re.search(r'점수:\s*([+-]?\d+\.?\d*)', block)
                if score_match:
                    score = float(score_match.group(1))
                    score = max(-4, min(6, score))
                    scores.append(score)

        # 최소 1개 이상 확보
        if len(scores) == 0:
            print(f"      ⚠️  데이터 수집 실패, Prior 사용")
            return []

        # 데이터 개수 경고
        if len(scores) < target_count:
            print(f"      ⚠️  목표({target_count}개) 미달: {len(scores)}개 수집")
        else:
            print(f"      ✓ {len(scores)}개 데이터 수집 성공")

        return scores

    except Exception as e:
        print(f"      ❌ 오류: {e}")
        return []


def calculate_item_score(scores, prior=PRIOR):
    """
    NBCF (Negativity Bias Correction Factor) 기반 항목 점수 계산

    Args:
        scores: 데이터 점수 리스트 (-3 ~ +7)
        prior: Prior 값 (기본 7.0)

    Returns:
        float: 항목 점수 (5.71 ~ 10.0)

    공식: Item_Score = 7.0 + (평균 × 3/7)
    """
    if len(scores) == 0:
        return prior

    # 평균 계산
    average = sum(scores) / len(scores)

    # NBCF 적용: deviation = average × (3/6)
    deviation = average * NBCF

    # Prior에 deviation 더하기
    item_score = prior + deviation

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

    politician_name = "오세훈 서울시장"

    print("=" * 60)
    print(f"🎯 {politician_name} 평가 시작 (Version 8.0 - NBCF)")
    print("=" * 60)
    print(f"평가 방식: Negativity Bias Correction Factor (NBCF)")
    print(f"Prior: {PRIOR}")
    print(f"NBCF: λ = {NBCF:.4f} (3/6)")
    print(f"데이터 점수 범위: -4 ~ +6")
    print(f"항목 점수 범위: 5.0 ~ 10.0")
    print(f"최종 점수 범위: 400 ~ 1000")
    print(f"총 항목: 70개 (10개 분야 × 7개 항목)")
    print(f"항목당 데이터: 최소 10개 ~ 최대 30개")
    print(f"공식: Item_Score = 7.0 + (평균 × 3/6)")
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
    print(f"평가 방식: Version 8.0 - NBCF (λ = {NBCF:.4f})")
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
