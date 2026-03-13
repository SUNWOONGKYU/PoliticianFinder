#!/usr/bin/env python3
"""
박주민 candidate 카테고리 일괄 평가 스크립트
(총 113개, 25개씩 배치로 처리)
"""

import json
import subprocess
import sys
import os

# 설정
POLITICIAN_ID = "8c5dcc89"
POLITICIAN_NAME = "박주민"
CATEGORY = "candidate"
BATCH_SIZE = 25

# 평가 기준 정리
CANDIDATE_EVAL_CRITERIA = {
    "현직": {
        "+3~+4": "국회의원 현직 재선/다선 → 의정 경험 + 선거 경험 + 인지도",
        "+2": "현직 국회의원 or 높은 인지도 도전자",
        "+1": "1선 현직 or 인지도 있는 도전자",
        "-1": "도전자, 인지도 부족",
    },
    "공천": {
        "+1": "공천 확정 or 경선 우위",
        "0": "경선 중, 불확실성",
        "-1": "공천 불확실 or 경선 열세",
    },
    "조직": {
        "+1": "캠프 구성, 조직 기반 보유",
        "-1": "조직 부족",
    },
    "의정활동": {
        "+1": "법안 발의, 출석률, 위원회 활동",
        "-1": "의정활동 부족",
    },
}

def fetch_data():
    """fetch 명령으로 데이터 조회"""
    result = subprocess.run([
        'python', 'alpha_eval_helper.py', 'fetch',
        f'--politician_id={POLITICIAN_ID}',
        f'--politician_name={POLITICIAN_NAME}',
        f'--category={CATEGORY}'
    ], capture_output=True, text=True)

    if result.returncode != 0:
        print(f"❌ fetch 실패: {result.stderr}")
        sys.exit(1)

    try:
        data = json.loads(result.stdout)
        return data.get('items', [])
    except json.JSONDecodeError as e:
        print(f"❌ JSON 파싱 실패: {e}")
        sys.exit(1)

def evaluate_item(item):
    """개별 항목 평가"""
    title = item.get('title', '').lower()
    content = item.get('content', '').lower()
    full_text = f"{title} {content}"

    # 후보자경쟁력 관련 키워드 분석
    keywords = {
        "현직_강": ["국회의원", "현직", "3선", "재선", "다선"],
        "의정_강": ["의정활동", "법안", "위원장", "위원회", "국민연금"],
        "공천_강": ["공천", "경선", "후보", "캠프"],
        "인지도_강": ["박주민", "의원"],
        "지역_약": ["지역구", "은평", "서울"],
        "부정": ["논란", "비판", "논쟁"],
        "무관": ["세종시", "다른 후보", "이관실"],
    }

    score_factors = []

    # 키워드 매칭
    if any(kw in full_text for kw in keywords["현직_강"]):
        score_factors.append(("+현직", 2))

    if any(kw in full_text for kw in keywords["의정_강"]):
        score_factors.append(("+의정", 1))

    if any(kw in full_text for kw in keywords["공천_강"]):
        score_factors.append(("+공천", 2))

    if any(kw in full_text for kw in keywords["인지도_강"]):
        score_factors.append(("+인지도", 1))

    if any(kw in full_text for kw in keywords["부정"]):
        score_factors.append(("-부정", 2))

    if any(kw in full_text for kw in keywords["무관"]):
        return ("X", 0, "박주민의 후보자경쟁력과 직접 관련 없는 뉴스")

    # 등급 결정
    total_score = sum(s for _, s in score_factors)

    if total_score >= 4:
        rating = "+3"
    elif total_score >= 2:
        rating = "+2"
    elif total_score >= 1:
        rating = "+1"
    elif total_score <= -2:
        rating = "-1"
    else:
        rating = "+1"

    # rationale 작성
    if rating == "X":
        rationale = "박주민의 후보자경쟁력과 직접 관련 없는 자료"
    elif rating == "+3":
        rationale = "현직 국회의원 3선의 의정활동 경험, 공천 경선, 조직력을 모두 보여주는 강력한 후보자 경쟁력 요소"
    elif rating == "+2":
        rationale = "현직 국회의원의 의정활동 실적 또는 공천·캠프 관련 정보로 후보자경쟁력의 주요 요소를 나타냄"
    elif rating == "+1":
        rationale = "박주민의 정치 활동이나 인지도 관련 정보로 후보자경쟁력의 보조 요소를 보여줌"
    else:
        rationale = "박주민의 부정적 정보로 후보자경쟁력에 악영향"

    # 점수 계산
    score = int(rating.replace("+", "").replace("-", "-")) * 2

    return (rating, score, rationale)

def save_batch(batch_items, batch_num):
    """배치 저장"""
    evaluations = []

    for item in batch_items:
        item_id = item.get('id')
        if not item_id:
            print(f"⚠️ ID 없음: {item.get('title')}")
            continue

        rating, score, rationale = evaluate_item(item)

        evaluations.append({
            "id": item_id,
            "rating": rating,
            "score": score,
            "rationale": rationale
        })

    # 배치 파일 저장
    filename = f"bjm_candidate_b{batch_num}.json"
    batch_data = {"evaluations": evaluations}

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(batch_data, f, ensure_ascii=False, indent=2)

    print(f"[3] 배치 {batch_num}: {filename} 생성 ({len(evaluations)}개)")

    # save 명령 실행
    result = subprocess.run([
        'python', 'alpha_eval_helper.py', 'save',
        f'--politician_id={POLITICIAN_ID}',
        f'--politician_name={POLITICIAN_NAME}',
        f'--category={CATEGORY}',
        f'--input={filename}'
    ], capture_output=True, text=True)

    # 결과 출력
    print(result.stdout.strip())

    # 파일 삭제
    try:
        os.remove(filename)
    except:
        pass

def main():
    print("=" * 60)
    print(f"V60 CCI Alpha 평가: {POLITICIAN_NAME} - candidate")
    print("=" * 60)

    # 1. 데이터 조회
    print(f"\n[1] 데이터 조회 중...")
    items = fetch_data()
    total = len(items)
    print(f"OK: 총 {total}개 항목 조회됨")

    # 2. 배치별 처리
    num_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE

    for batch_num in range(1, num_batches + 1):
        start_idx = (batch_num - 1) * BATCH_SIZE
        end_idx = min(batch_num * BATCH_SIZE, total)
        batch_items = items[start_idx:end_idx]

        print(f"\n[2] 배치 {batch_num}/{num_batches} 처리...")
        save_batch(batch_items, batch_num)

    print("\n" + "=" * 60)
    print(f"OK: 완료 - candidate 평가 {total}개 모두 처리됨")
    print("=" * 60)

if __name__ == '__main__':
    main()
