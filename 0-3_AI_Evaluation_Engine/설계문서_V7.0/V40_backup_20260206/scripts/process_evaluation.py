#!/usr/bin/env python3
"""
조은희 평가 자동화 스크립트
"""
import json
import subprocess
import os
import sys

def fetch_category_data(politician_id, politician_name, category):
    """카테고리 데이터 가져오기"""
    cmd = [
        sys.executable, 'claude_eval_helper.py', 'fetch',
        f'--politician_id={politician_id}',
        f'--politician_name={politician_name}',
        f'--category={category}'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    if result.returncode != 0:
        print(f"❌ Error fetching {category}: {result.stderr}")
        return None

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error for {category}: {e}")
        return None

def evaluate_item_ethics(item):
    """윤리성 평가"""
    title = item.get('title', '')
    content = item.get('content', '')
    collector = item.get('collector_ai', '')

    # 동명이인 체크
    if '검찰청' in content or '질병관리' in content or '보건' in content:
        return 'X', 0, "동명이인(공무원)"

    if '통일연구원' in content and '청소년' in title:
        return 'X', 0, "동명이인(연구원)"

    # 의미없는 명단
    if '국회본회의' in title and len(content) < 200:
        return 'X', 0, "단순 참석 명단"

    if '문서등록대장' in title or '예산' in title and len(content) < 150:
        return 'X', 0, "행정문서, 평가무관"

    # 성폭력법 개정안 발의
    if '성폭력범죄' in title and '개정법률안' in title and '조은희의원' in title:
        return '+3', 6, "성범죄 대응 법률 발의"

    # 부정적 - KT 관련 의혹
    if 'KT' in content and '의혹' in content:
        return '-2', -4, "KT 계약 의혹 관련"

    # 정당법 개정
    if '정당법' in title and '개정법률안' in title:
        return '+2', 4, "정당 투명성 법안 발의"

    # 기타 공식 문서 - 중립
    if collector == 'Naver' and item.get('data_type') == 'official':
        return 'X', 0, "평가무관 공식문서"

    return 'X', 0, "윤리성 판단 근거 부족"

def evaluate_item_accountability(item):
    """책임감 평가"""
    title = item.get('title', '')
    content = item.get('content', '')
    collector = item.get('collector_ai', '')

    # 동명이인 체크
    if '봉사활동' in title and '헌혈' in content and '인솔자' in content:
        return 'X', 0, "동명이인(일반인)"

    # 의미없는 문서
    if '문서등록' in title or '예산' in title and len(content) < 150:
        return 'X', 0, "행정문서, 평가무관"

    # 정당법 개정 - 책임있는 정당 운영
    if '정당법' in title and '개정' in title and '사무소' in content:
        return '+2', 4, "정당 책임 운영 제도화"

    # 국회 활동
    if '국회의원SNS' in title or '금주의 국회' in title:
        if '의혹' in content or '규탄' in content:
            return '-1', -2, "문제 대응 미흡 비판"
        return '+1', 2, "의정활동 소통"

    # 기타 공식 문서
    if collector == 'Naver' and item.get('data_type') == 'official':
        return 'X', 0, "평가무관 공식문서"

    return 'X', 0, "책임감 판단 근거 부족"

def evaluate_items(items, category):
    """아이템 평가"""
    evaluations = []

    for item in items:
        item_id = item['id']

        if category == 'ethics':
            rating, score, rationale = evaluate_item_ethics(item)
        elif category == 'accountability':
            rating, score, rationale = evaluate_item_accountability(item)
        else:
            rating, score, rationale = 'X', 0, "알 수 없는 카테고리"

        evaluations.append({
            "id": item_id,
            "rating": rating,
            "score": score,
            "rationale": rationale
        })

    return evaluations

def save_evaluations(politician_id, politician_name, category, batch_num, evaluations):
    """평가 결과 저장"""
    filename = f"eval_result_{category}_batch_{batch_num:02d}.json"

    # JSON 파일 저장
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump({"evaluations": evaluations}, f, ensure_ascii=False, indent=2)

    print(f"Saved {filename} ({len(evaluations)} items)")

    # DB 저장
    cmd = [
        sys.executable, 'claude_eval_helper.py', 'save',
        f'--politician_id={politician_id}',
        f'--politician_name={politician_name}',
        f'--category={category}',
        f'--input={filename}'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    if result.returncode == 0:
        print(f"Saved to DB: {category} batch {batch_num}")
        # 임시 파일 삭제
        os.remove(filename)
        print(f"Deleted {filename}")
    else:
        print(f"DB save failed: {result.stderr}")
        print(f"Keeping {filename} for review")

def process_category(politician_id, politician_name, category):
    """카테고리 처리"""
    print(f"\n{'='*60}")
    print(f"처리 중: {category}")
    print(f"{'='*60}\n")

    # 데이터 가져오기
    data = fetch_category_data(politician_id, politician_name, category)
    if not data:
        print(f"❌ Failed to fetch {category} data")
        return

    items = data.get('items', [])
    total_items = len(items)
    print(f"Total items: {total_items}")

    # 30개씩 배치 처리
    batch_size = 30
    batch_num = 1

    for i in range(0, total_items, batch_size):
        batch_items = items[i:i+batch_size]
        print(f"\n--- Batch {batch_num} ({len(batch_items)} items) ---")

        # 평가
        evaluations = evaluate_items(batch_items, category)

        # 통계
        ratings_count = {}
        for ev in evaluations:
            r = ev['rating']
            ratings_count[r] = ratings_count.get(r, 0) + 1

        print(f"Rating distribution: {ratings_count}")

        # 저장
        save_evaluations(politician_id, politician_name, category, batch_num, evaluations)

        batch_num += 1

    print(f"\nCompleted: {category}")

def main():
    politician_id = 'd0a5d6e1'
    politician_name = '조은희'
    categories = ['ethics', 'accountability']

    print("=" * 60)
    print(f"조은희 ({politician_id}) 평가 시작")
    print("=" * 60)

    for category in categories:
        process_category(politician_id, politician_name, category)

    print("\n" + "=" * 60)
    print("All evaluations completed!")
    print("=" * 60)

if __name__ == '__main__':
    main()
