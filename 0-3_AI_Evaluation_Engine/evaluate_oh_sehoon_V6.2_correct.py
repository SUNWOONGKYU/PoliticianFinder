#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
오세훈 서울시장 평가 스크립트 V6.2 (정확한 계산식)

작성일: 2025-10-31
버전: V6.2 with Correct Formula
알고리즘: Item_Score = 7.0 + (평균 × 0.6)
NBCF: λ = 3/5 = 0.6 (5-5 완전 대칭 구조)
총 항목: 70개 (10개 분야 × 7개 항목)
평가 척도: -5 (매우 나쁨) ~ +5 (매우 좋음)
점수 범위: 4.0 (최저) ~ 10.0 (최고)
"""

import anthropic
import os
import sys
import json
from datetime import datetime
from pathlib import Path

# Windows 인코딩 문제 해결
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Prior 설정
PRIOR = 7.0

# NBCF (Negativity Bias Correction Factor)
NBCF = 3.0 / 5.0  # λ = 0.6 (5-5 perfect symmetric structure)

# Anthropic API 클라이언트
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# V6.2 프레임워크: 10개 분야 정의
CATEGORIES = {
    1: {"name": "전문성", "english": "Professional Competence"},
    2: {"name": "리더십", "english": "Leadership"},
    3: {"name": "비전", "english": "Vision"},
    4: {"name": "청렴성", "english": "Integrity"},
    5: {"name": "윤리성", "english": "Ethics"},
    6: {"name": "책임감", "english": "Accountability"},
    7: {"name": "투명성", "english": "Transparency"},
    8: {"name": "소통능력", "english": "Communication Skills"},
    9: {"name": "대응성", "english": "Responsiveness"},
    10: {"name": "공익추구", "english": "Public Interest Pursuit"}
}

# V6.2 프레임워크: 각 분야당 7개 항목 (공식 4개 + 공개 3개)
ITEMS_PER_CATEGORY = {
    1: [  # 전문성
        "최종 학력 수준",
        "직무 관련 자격증 보유 개수",
        "관련 분야 경력 연수",
        "연간 직무 교육 이수 시간",
        "위키피디아 페이지 존재 및 조회수",
        "전문 분야 언론 기고 건수",
        "Google Scholar 피인용 수"
    ],
    2: [  # 리더십
        "법안·조례 발의 건수",
        "법안·조례 통과율",
        "위원장·당직 경력 연수",
        "예산 확보 실적",
        "리더십 키워드 언론 긍정 보도 비율",
        "매니페스토 공약 이행 평가 등급",
        "당내 영향력 언론 보도 건수"
    ],
    3: [  # 비전
        "중장기 발전 계획 수립 여부",
        "미래 투자 예산 비율",
        "지속가능발전(SDGs) 예산 비율",
        "디지털 전환 관련 예산/사업 건수",
        "미래 키워드 언론 보도 건수",
        "해외 언론 보도 건수",
        "청년층 여론조사 지지율 또는 SNS 반응"
    ],
    4: [  # 청렴성
        "부패 범죄 확정 판결 건수 (역산)",
        "재산 공개 변동 이상 여부",
        "공직자윤리법 위반 확정 (역산)",
        "정치자금법 위반 확정 (역산)",
        "부정 키워드 언론 보도 건수 (역산)",
        "한국투명성기구 평가 등급",
        "시민단체 부패 리포트 언급 (역산)"
    ],
    5: [  # 윤리성
        "형사 범죄 확정 판결 건수 (역산)",
        "성범죄 확정 판결 건수 (역산)",
        "윤리위원회 징계 건수 (역산)",
        "국가인권위 시정 권고/결정 건수 (역산)",
        "혐오 표현·폭언 언론 보도 건수 (역산)",
        "국가인권위 관련 언론 보도 (역산)",
        "시민단체 윤리성 평가 점수"
    ],
    6: [  # 책임감
        "공약 이행률",
        "회의 출석률",
        "예산 집행률",
        "감사 지적 개선 완료율",
        "매니페스토 공약 이행 평가 등급",
        "의정/직무 활동 보고 빈도",
        "시민단체 의정 감시 평가 점수"
    ],
    7: [  # 투명성
        "정보공개 청구 응답률",
        "회의록 공개율",
        "재산 공개 성실도",
        "예산 집행 상세 공개 수준",
        "정보공개센터/오픈넷 평가 등급",
        "투명성 긍정 언론 보도 비율",
        "정보공개 우수 사례 등재 건수"
    ],
    8: [  # 소통능력
        "시민 간담회 개최 건수",
        "공청회·토론회 개최 건수",
        "공식 온라인 소통 채널 운영 수",
        "시민 제안 수용 건수/비율",
        "SNS 팔로워 × 참여율 지수",
        "SNS 댓글 응답 건수/비율",
        "소통 능력 여론조사 점수"
    ],
    9: [  # 대응성
        "주민참여예산 규모",
        "정보공개 처리 평균 기간 (역산)",
        "주민 제안 반영 건수/비율",
        "지역 현안 대응 건수",
        "위기 대응 언론 보도 건수",
        "현장 방문 언론 보도 건수",
        "대응성 여론조사 점수"
    ],
    10: [  # 공익추구
        "사회복지 예산 비율",
        "취약계층 지원 프로그램 건수",
        "환경·기후 예산 비율 또는 증가율",
        "지역 균형 발전 예산 비율",
        "공익 활동 언론 보도 건수",
        "사회공헌 SNS 게시물 비중",
        "공익 추구 여론조사 점수"
    ]
}


def print_header():
    """프로그램 헤더 출력"""
    print("=" * 60)
    print("🎯 오세훈 서울시장 평가 시작 (Version V6.2 - Correct Formula)")
    print("=" * 60)
    print(f"평가 방식: Item_Score = 7.0 + (평균 × 0.6)")
    print(f"Prior: {PRIOR}")
    print(f"NBCF: λ = {NBCF:.4f} (3/5)")
    print(f"데이터 점수 범위: -5 ~ +5 (5-5 완전 대칭)")
    print(f"항목 점수 범위: 4.0 ~ 10.0")
    print(f"최종 점수 범위: 400 ~ 1000")
    print(f"총 항목: 70개 (10개 분야 × 7개 항목)")
    print(f"공식: Item_Score = 7.0 + (평균 × {NBCF})")
    print("=" * 60)
    print()


def evaluate_single_item(category_name, item_name, politician_name="오세훈"):
    """
    단일 항목 평가 (AI 호출)

    Args:
        category_name: 분야명
        item_name: 항목명
        politician_name: 정치인 이름

    Returns:
        dict: {'score': float, 'rationale': str, 'evidence': list}
    """

    prompt = f"""
당신은 정치인 평가 전문가입니다. {politician_name} 서울시장의 "{category_name}" 분야 중 "{item_name}" 항목을 평가해주세요.

**평가 척도**: -5 (매우 나쁨) ~ +5 (매우 좋음)
- +5: 매우 우수함 (상위 5%)
- +4: 우수함 (상위 10%)
- +3: 좋음 (상위 25%)
- +2: 양호 (상위 40%)
- +1: 평균 이상 (상위 50-60%)
- 0: 보통/중립 (평균)
- -1: 평균 이하 (하위 50-60%)
- -2: 미흡 (하위 40%)
- -3: 나쁨 (하위 25%)
- -4: 매우 나쁨 (하위 10%)
- -5: 극히 나쁨 (하위 5%)

**반드시 JSON 형식으로 응답하세요**:
{{
    "score": -5에서 +5 사이의 정수,
    "rationale": "평가 근거 설명 (2-3문장)",
    "evidence": ["증거1", "증거2", "증거3"]
}}

**중요**:
1. 실제 데이터와 사실에 기반하여 평가하세요.
2. 긍정과 부정을 균형있게 평가하세요.
3. 역산 항목은 부정적 사실이 많을수록 낮은 점수를 부여하세요.
4. 증거는 구체적인 사실, 수치, 사례를 포함하세요.
"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = message.content[0].text.strip()

        # JSON 파싱
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        result = json.loads(response_text)

        # 점수 범위 검증
        score = result.get("score", 0)
        if score < -5:
            score = -5
        elif score > 5:
            score = 5

        return {
            "score": score,
            "rationale": result.get("rationale", ""),
            "evidence": result.get("evidence", [])
        }

    except Exception as e:
        print(f"    ⚠️  평가 오류: {e}")
        return {
            "score": 0,
            "rationale": f"평가 중 오류 발생: {str(e)}",
            "evidence": []
        }


def evaluate_category(category_id, category_name, category_english):
    """
    하나의 분야 평가 (7개 항목)

    Args:
        category_id: 분야 ID (1-10)
        category_name: 분야명 (한글)
        category_english: 분야명 (영어)

    Returns:
        dict: 분야 평가 결과
    """
    print("=" * 60)
    print(f"📂 분야 {category_id}: {category_name} ({category_english})")
    print("=" * 60)
    print()

    items = ITEMS_PER_CATEGORY[category_id]
    item_results = []
    item_scores = []

    for idx, item_name in enumerate(items, 1):
        print(f"  📌 항목 {category_id}-{idx}: {item_name}")

        # AI 평가 호출
        evaluation = evaluate_single_item(category_name, item_name)

        # 점수 계산: Item_Score = 7.0 + (score × 0.6)
        data_score = evaluation["score"]
        item_score = PRIOR + (data_score * NBCF)

        item_results.append({
            "item_id": f"{category_id}-{idx}",
            "item_name": item_name,
            "data_score": data_score,
            "item_score": round(item_score, 2),
            "rationale": evaluation["rationale"],
            "evidence": evaluation["evidence"]
        })

        item_scores.append(item_score)

        print(f"      → 데이터 점수: {data_score:+d}")
        print(f"      → 항목 점수: {item_score:.2f}점")
        print()

    # 분야 평균 계산
    category_score = sum(item_scores) / len(item_scores)

    print(f"  📊 분야 {category_id} 평균 점수: {category_score:.2f}점")
    print()

    return {
        "category_id": category_id,
        "category_name": category_name,
        "category_english": category_english,
        "item_results": item_results,
        "category_score": round(category_score, 2)
    }


def main():
    """메인 실행 함수"""
    print_header()

    # 결과 저장 디렉토리
    results_dir = Path("results_V6.2_correct")
    results_dir.mkdir(exist_ok=True)

    all_results = []
    category_scores = []

    # 10개 분야 평가
    for cat_id in range(1, 11):
        category_info = CATEGORIES[cat_id]

        result = evaluate_category(
            cat_id,
            category_info["name"],
            category_info["english"]
        )

        all_results.append(result)
        category_scores.append(result["category_score"])

        # 분야별 결과 저장
        output_file = results_dir / f"category_{cat_id}_{category_info['name']}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"✅ 분야 {cat_id} 결과 저장: {output_file}")
        print()

    # 최종 종합 점수
    final_score = sum(category_scores) / len(category_scores)

    print("=" * 60)
    print("🏁 최종 평가 결과")
    print("=" * 60)
    print(f"총 평가 항목: 70개")
    print(f"평가 분야: 10개")
    print()

    for idx, result in enumerate(all_results, 1):
        print(f"  분야 {idx}. {result['category_name']:8s}: {result['category_score']:.2f}점")

    print()
    print(f"📌 최종 종합 점수: {final_score:.2f}점 / 10.0")
    print(f"📌 환산 점수: {final_score * 100:.1f}점 / 1000")
    print()

    # 최종 결과 저장
    summary = {
        "politician_name": "오세훈",
        "evaluation_date": datetime.now().isoformat(),
        "version": "V6.2_correct",
        "algorithm": "Item_Score = 7.0 + (평균 × 0.6)",
        "prior": PRIOR,
        "nbcf": NBCF,
        "scale": "5-5 perfect symmetric",
        "category_results": all_results,
        "category_scores": {
            result["category_name"]: result["category_score"]
            for result in all_results
        },
        "final_score": round(final_score, 2),
        "final_score_1000": round(final_score * 100, 1)
    }

    summary_file = results_dir / "오세훈_종합평가_V6.2_correct.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"✅ 종합 결과 저장: {summary_file}")
    print("=" * 60)


if __name__ == "__main__":
    main()
