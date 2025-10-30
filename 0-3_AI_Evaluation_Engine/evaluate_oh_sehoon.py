"""
Oh Se-hoon Seoul Mayor Evaluation (V4.0 - Claude API)
- 100 items full evaluation
- Bayesian Prior 6.0 with Dynamic Range Adjustment
- 8-level grading system
"""

import os
import sys
import json
import time
from datetime import datetime
from dotenv import load_dotenv
from anthropic import Anthropic

# UTF-8 인코딩 설정
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# 환경 변수 로드
load_dotenv()

# Anthropic 클라이언트
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ============================================================================
# 100개 평가 항목 정의
# ============================================================================

EVALUATION_ITEMS = {
    1: {
        'name': '청렴성 (Integrity)',
        'items': [
            '부패 신고 건수', '뇌물 및 향응 의혹', '청렴도 평가 점수',
            '공직자 윤리 위반 사례', '이해충돌 방지 노력', '재산 변동 투명성',
            '공금 사용 적정성', '정치 자금 투명성', '가족 비리 연루 여부', '청렴 서약 이행도'
        ]
    },
    2: {
        'name': '전문성 (Professional Competence)',
        'items': [
            '학력 및 전공 관련성', '관련 분야 경력 연수', '전문 자격증 보유',
            '정책 전문성', '행정 경험', '법률 지식 수준',
            '경제 정책 이해도', '국제 감각', '위기 관리 능력', '혁신 추진 역량'
        ]
    },
    3: {
        'name': '소통능력 (Communication)',
        'items': [
            '주민 간담회 개최 횟수', 'SNS 소통 활성도', '민원 처리 신속성',
            '언론 대응 능력', '공청회 개최', '시민 제안 수용률',
            '정보 공개 적극성', '대중 연설 능력', '갈등 조정 능력', '여론 수렴 노력'
        ]
    },
    4: {
        'name': '정책능력 (Policy Making)',
        'items': [
            '공약 이행률', '법안 발의 건수', '정책 제안 건수',
            '예산 확보 실적', '조례 제정 건수', '정책 성과 평가',
            '장기 비전 제시', '실행 계획 구체성', '정책 혁신성', '정책 일관성'
        ]
    },
    5: {
        'name': '리더십 (Leadership)',
        'items': [
            '조직 관리 능력', '팀워크 구축', '갈등 해결 능력',
            '비전 제시 능력', '추진력', '결단력',
            '위임 능력', '인재 등용', '동기 부여 능력', '책임 의식'
        ]
    },
    6: {
        'name': '책임성 (Accountability)',
        'items': [
            '업무 보고 성실성', '실정 인정 및 사과', '재선거 공약 준수',
            '결과 책임 수용', '투명한 의사결정', '시민 피드백 반영',
            '감사 대응 적절성', '행정 실수 시정', '공약 미이행 해명', '책임 회피 여부'
        ]
    },
    7: {
        'name': '투명성 (Transparency)',
        'items': [
            '정보 공개 범위', '회의록 공개', '예산 집행 공개',
            '인사 절차 투명성', '정책 결정 과정 공개', '이해관계 공개',
            '외부 감사 수용', '시민 참여 보장', '데이터 공개 적극성', '투명성 지수'
        ]
    },
    8: {
        'name': '혁신성 (Innovation)',
        'items': [
            '신규 정책 도입', '디지털 혁신 추진', '스마트 시티 구축',
            '행정 효율화', '신기술 도입', '창의적 문제 해결',
            '규제 개선', '시민 참여 혁신', '행정 서비스 개선', '미래 지향성'
        ]
    },
    9: {
        'name': '포용성 (Inclusiveness)',
        'items': [
            '소수자 권리 보호', '사회적 약자 배려', '다문화 정책',
            '젠더 평등 정책', '세대 통합 노력', '지역 균형 발전',
            '장애인 복지', '청년 정책', '노인 복지', '아동 권리 보호'
        ]
    },
    10: {
        'name': '효율성 (Efficiency)',
        'items': [
            '예산 절감 실적', '행정 처리 기간 단축', '인력 운영 효율성',
            '사업 추진 속도', '성과 대비 비용', '중복 사업 통폐합',
            '디지털 행정 활용', '업무 프로세스 개선', '자원 활용 최적화', '비용 효과성'
        ]
    }
}

# ============================================================================
# Claude API 호출
# ============================================================================

def call_claude_api(politician_name, category_name, item_name, attempt=1):
    """
    Claude API를 호출하여 항목 평가
    """

    prompt = f"""당신은 대한민국 정치인 평가 전문가입니다.

정치인: {politician_name} (서울특별시장)
평가 분야: {category_name}
평가 항목: {item_name}

다음 작업을 수행하세요:

1. 해당 정치인의 이 항목에 대한 실제 데이터를 1개 수집하세요.
2. 뉴스 기사, 공식 기록, 통계 등 신뢰할 수 있는 정보를 기반으로 하세요.
3. 수집한 정보를 바탕으로 -10~+10 사이의 점수를 매기세요.
   - +10 = 매우 우수 (긍정적)
   - 0 = 보통 (중립)
   - -10 = 매우 부족 (부정적)

4. 다음 JSON 형식으로만 응답하세요 (다른 설명 없이):
{{
    "title": "데이터 제목 (30자 이내)",
    "content": "데이터 내용 요약 (100자 이내)",
    "score": 8.5,
    "source": "출처"
}}

중요: 시도 {attempt}번째입니다. 이전과 다른 새로운 정보를 제공하세요.
중요: 정보가 없으면 {{"no_data": true}}만 반환하세요.
"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        response_text = message.content[0].text.strip()

        # JSON 추출
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            json_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            json_text = response_text[json_start:json_end].strip()
        else:
            json_text = response_text

        data = json.loads(json_text)

        # 데이터 없음 체크
        if data.get('no_data'):
            return None

        # 필수 필드 검증
        if 'title' in data and 'score' in data:
            return data
        else:
            return None

    except Exception as e:
        print(f"      ❌ API 오류: {e}")
        return None


# ============================================================================
# Bayesian Prior 6.0 점수 계산
# ============================================================================

def calculate_bayesian_score(scores, count):
    """
    V4.0 최종 공식 - 데이터 총합을 직접 ±4으로 매핑

    핵심:
    - 개별 데이터: -10 ~ +10 범위
    - 총합 범위: -10N ~ +10N
    - 직접 ±4으로 매핑 → Prior 6.0 ± 3 = 2.0 ~ 10.0

    공식:
    편차 = (총합 × 4) / (10 × N)
    최종 점수 = 7.0 + 편차
    """
    # 1단계: 데이터 없으면 Prior 6.0 반환
    if count == 0:
        return 6.0

    # 2단계: 총합 계산
    total_sum = sum(scores)

    # 3단계: 총합을 직접 ±4 범위로 매핑
    # 총합 범위: -10N ~ +10N
    # 목표 범위: -3 ~ +3
    # 공식: (총합 × 4) / (10 × N)
    deviation = (total_sum * 4) / (10 * count)

    # 4단계: 최종 점수 = Prior 6.0 + 편차
    final_score = 6.0 + deviation

    # 5단계: 절대 범위 보장 (2.0 ~ 10.0)
    final_score = max(2.0, min(10.0, final_score))

    return final_score


def get_grade(score):
    """8단계 등급"""
    if score >= 93:
        return 'M', 'Mugunghwa', '🌺'
    elif score >= 86:
        return 'D', 'Diamond', '💎'
    elif score >= 79:
        return 'E', 'Emerald', '💚'
    elif score >= 72:
        return 'P', 'Platinum', '🥇'
    elif score >= 65:
        return 'G', 'Gold', '🥇'
    elif score >= 58:
        return 'S', 'Silver', '🥈'
    elif score >= 51:
        return 'B', 'Bronze', '🥉'
    elif score >= 44:
        return 'I', 'Iron', '⚫'
    else:
        return 'F', 'Fail', '❌'


# ============================================================================
# 메인 평가 함수
# ============================================================================

def evaluate_politician(politician_name, target_data_per_item=10, max_attempts=15):
    """
    정치인 100개 항목 전체 평가
    """

    print("\n" + "="*60)
    print(f"🎯 {politician_name} 평가 시작")
    print("="*60)
    print(f"목표: 항목당 {target_data_per_item}개 데이터 수집")
    print(f"총 항목: 100개 (10개 분야 × 10개 항목)")
    print(f"평가 방식: Bayesian Prior 6.0")
    print("="*60)

    start_time = time.time()

    all_results = {}
    total_data_count = 0

    # 10개 분야 평가
    for category_num in range(1, 11):
        category_info = EVALUATION_ITEMS[category_num]
        category_name = category_info['name']

        print(f"\n{'='*60}")
        print(f"📂 분야 {category_num}: {category_name}")
        print(f"{'='*60}")

        category_results = []

        # 10개 항목 평가
        for item_num in range(1, 11):
            item_name = category_info['items'][item_num - 1]
            print(f"\n  📌 항목 {category_num}-{item_num}: {item_name}")

            collected_data = []
            attempt = 0

            # 목표 개수만큼 수집 시도
            while len(collected_data) < target_data_per_item and attempt < max_attempts:
                attempt += 1

                data = call_claude_api(politician_name, category_name, item_name, attempt)

                if data:
                    collected_data.append(data)
                    print(f"      ✓ [{len(collected_data)}/{target_data_per_item}] {data['title'][:40]}...")
                    time.sleep(0.5)  # API Rate limit 방지
                else:
                    if attempt >= 5:
                        print(f"      ⚠️  데이터 고갈 (시도 {attempt}회)")
                        break

            # 항목 점수 계산
            data_count = len(collected_data)
            if data_count > 0:
                scores = [d['score'] for d in collected_data]
                item_score = calculate_bayesian_score(scores, data_count)
            else:
                item_score = 7.0  # Prior 사용

            category_results.append({
                'item_num': item_num,
                'item_name': item_name,
                'data_count': data_count,
                'item_score': item_score,
                'data': collected_data
            })

            total_data_count += data_count

            print(f"      → 최종 점수: {item_score:.2f}점 (데이터 {data_count}개)")

        # 분야 점수 계산
        item_scores = [r['item_score'] for r in category_results]
        category_score = sum(item_scores) / len(item_scores)

        all_results[category_num] = {
            'category_name': category_name,
            'category_score': category_score,
            'items': category_results
        }

        print(f"\n  📊 분야 {category_num} 점수: {category_score:.2f}점")

    # 최종 점수 계산
    category_scores = [all_results[i]['category_score'] for i in range(1, 11)]
    total_score = sum(category_scores)  # 분야별 점수 합산 = 최종 점수 (100점 만점)

    grade_code, grade_name, grade_emoji = get_grade(total_score)

    elapsed_time = time.time() - start_time

    # 최종 결과 출력
    print("\n" + "="*60)
    print("🎉 평가 완료!")
    print("="*60)
    print(f"\n정치인: {politician_name}")
    print(f"총 데이터: {total_data_count}개")
    print(f"소요 시간: {elapsed_time/60:.1f}분")
    print(f"\n최종 점수: {total_score:.1f}점")
    print(f"등급: {grade_emoji} {grade_name} ({grade_code})")

    print("\n분야별 점수:")
    for i in range(1, 11):
        cat = all_results[i]
        print(f"  {i}. {cat['category_name']}: {cat['category_score']:.2f}점")

    # 결과 저장
    result_file = f"results_oh_sehoon_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(result_file, 'w', encoding='utf-8') as f:
        json.dump({
            'politician': politician_name,
            'total_score': total_score,
            'grade': {'code': grade_code, 'name': grade_name, 'emoji': grade_emoji},
            'total_data_count': total_data_count,
            'elapsed_time': elapsed_time,
            'categories': all_results
        }, f, ensure_ascii=False, indent=2)

    print(f"\n💾 결과 저장: {result_file}")
    print("="*60)

    return all_results, total_score


# ============================================================================
# 실행
# ============================================================================

if __name__ == "__main__":
    evaluate_politician("오세훈", target_data_per_item=10, max_attempts=15)
