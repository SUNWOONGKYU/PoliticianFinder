#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
박주민 의원 비전 평가 (Category 3)
- 7개 평가 항목
- 항목당 10-30개 데이터 수집
- AI 평가 등급: -5 ~ +5
"""

import anthropic
import os
import sys
import json
from datetime import datetime

# Windows 인코딩 문제 해결
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Anthropic API 클라이언트
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# 비전 평가 7개 항목
VISION_ITEMS = {
    1: "장기 정책 비전 문서 존재",
    2: "비전 구체성 (정량 목표)",
    3: "비전의 혁신성",
    4: "미래 트렌드 반영도",
    5: "비전 대중 인지도",
    6: "비전 달성 로드맵",
    7: "국제 벤치마킹 사례"
}


def load_vision_data():
    """박주민_미래비전_데이터.json 파일 로드"""
    try:
        with open('C:\\Users\\home\\박주민_미래비전_데이터.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️  데이터 파일 로드 실패: {e}")
        return None


def collect_and_evaluate_item(politician_name, item_num, item_name, vision_data, target_count=15, max_count=30, max_retries=3):
    """
    특정 비전 항목에 대해 데이터 수집 및 평가

    Returns:
        dict: {
            "item_name": str,
            "data_count": int,
            "evaluations": list of dict,
            "average_score": float
        }
    """
    import re
    import time

    # 관련 데이터 필터링
    all_vision_items = []
    if vision_data and "분야10_미래비전" in vision_data:
        for category_key, category_data in vision_data["분야10_미래비전"].items():
            if isinstance(category_data, list):
                all_vision_items.extend(category_data)

    # 데이터를 JSON 문자열로 변환
    vision_context = json.dumps(all_vision_items, ensure_ascii=False, indent=2)

    for attempt in range(1, max_retries + 1):
        prompt = f"""당신은 정치인의 미래 비전을 평가하는 전문가입니다.

평가 대상: {politician_name}
평가 항목: {item_name}

다음 데이터를 참고하여 평가하세요:

{vision_context}

작업:
1. 위 데이터에서 "{item_name}"과 관련된 구체적인 증거를 {target_count}~{max_count}개 추출하세요.
2. 각 증거마다 -5 ~ +5 점수를 부여하세요.

평가 기준 (-5 ~ +5):
- +5: 매우 우수 (구체적이고 실현가능한 비전)
- +4: 우수 (명확한 비전과 계획)
- +3: 양호 (비전은 있으나 구체성 부족)
- +2: 보통 이상 (일반적인 수준)
- +1: 보통 (기본적인 언급만)
- 0: 중립 (불분명)
- -1: 미흡 (비전 부족)
- -2: 부족 (비전 결여)
- -3: 상당히 부족
- -4: 매우 부족
- -5: 전혀 없음

출력 형식 (반드시 준수):

[DATA_1]
제목: 구체적인 비전/정책/활동 제목
내용: 객관적 사실과 증거
점수: 0
출처: 구체적 출처 (카테고리, 연도)
[/DATA_1]

[DATA_2]
제목: ...
내용: ...
점수: 0
출처: ...
[/DATA_2]

(최소 {target_count}개 ~ 최대 {max_count}개)

**중요**:
- 반드시 {target_count}개 이상 작성
- 점수는 정수로만 (-5~+5)
- 객관적 증거 기반 평가"""

        try:
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text

            # 데이터 파싱
            evaluations = []
            data_blocks = re.findall(r'\[DATA_\d+\](.*?)\[/DATA_\d+\]', response_text, re.DOTALL)

            for block in data_blocks:
                # 제목 추출
                title_match = re.search(r'제목:\s*(.+?)(?:\n|$)', block)
                # 내용 추출
                content_match = re.search(r'내용:\s*(.+?)(?=\n점수:|$)', block, re.DOTALL)
                # 점수 추출
                score_match = re.search(r'점수:\s*([+-]?\d+)', block)
                # 출처 추출
                source_match = re.search(r'출처:\s*(.+?)(?:\n|$)', block)

                if title_match and score_match:
                    score = int(score_match.group(1))
                    score = max(-5, min(5, score))  # 범위 제한

                    evaluations.append({
                        "title": title_match.group(1).strip(),
                        "content": content_match.group(1).strip() if content_match else "",
                        "score": score,
                        "source": source_match.group(1).strip() if source_match else "unknown"
                    })

            # 결과 확인
            if len(evaluations) >= target_count:
                avg_score = round(sum(e["score"] for e in evaluations) / len(evaluations), 2)
                print(f"      ✓ {len(evaluations)}개 데이터 수집 성공 (평균 점수: {avg_score})")

                return {
                    "item_name": item_name,
                    "data_count": len(evaluations),
                    "evaluations": evaluations,
                    "average_score": avg_score
                }
            elif len(evaluations) > 0:
                if attempt < max_retries:
                    print(f"      ⚠️  목표({target_count}개) 미달: {len(evaluations)}개 수집 → 재시도 {attempt}/{max_retries}")
                    time.sleep(2)
                    continue
                else:
                    avg_score = round(sum(e["score"] for e in evaluations) / len(evaluations), 2)
                    print(f"      ⚠️  최종 {len(evaluations)}개 수집 (목표 미달, 평균: {avg_score})")

                    return {
                        "item_name": item_name,
                        "data_count": len(evaluations),
                        "evaluations": evaluations,
                        "average_score": avg_score
                    }
            else:
                if attempt < max_retries:
                    print(f"      ❌ 데이터 수집 실패 → 재시도 {attempt}/{max_retries}")
                    time.sleep(2)
                    continue
                else:
                    print(f"      ❌ 데이터 수집 실패 ({max_retries}회 시도 완료)")
                    return {
                        "item_name": item_name,
                        "data_count": 0,
                        "evaluations": [],
                        "average_score": 0.0
                    }

        except Exception as e:
            if attempt < max_retries:
                print(f"      ❌ 오류: {e} → 재시도 {attempt}/{max_retries}")
                time.sleep(3)
                continue
            else:
                print(f"      ❌ 오류: {e} ({max_retries}회 시도 완료)")
                return {
                    "item_name": item_name,
                    "data_count": 0,
                    "evaluations": [],
                    "average_score": 0.0
                }

    return {
        "item_name": item_name,
        "data_count": 0,
        "evaluations": [],
        "average_score": 0.0
    }


def calculate_final_rating(average_score):
    """
    평균 점수를 최종 등급으로 변환
    -5 ~ +5 스케일 유지
    """
    return round(average_score, 1)


def main():
    """메인 실행 함수"""

    politician_name = "박주민"

    print("=" * 70)
    print(f"🎯 {politician_name} 의원 비전 평가 (Category 3)")
    print("=" * 70)
    print(f"평가 항목: 7개")
    print(f"항목당 데이터: 10-30개 목표")
    print(f"AI 평가 등급: -5 ~ +5")
    print("=" * 70)
    print()

    # 미래비전 데이터 로드
    vision_data = load_vision_data()

    if not vision_data:
        print("❌ 데이터 파일을 로드할 수 없습니다.")
        return

    # 결과 저장용
    results = {
        "politician": politician_name,
        "category": "비전 (Vision)",
        "evaluation_date": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "items": [],
        "summary": {}
    }

    # 7개 항목 평가
    for item_num, item_name in VISION_ITEMS.items():
        print(f"📌 항목 {item_num}: {item_name}")

        item_result = collect_and_evaluate_item(
            politician_name,
            item_num,
            item_name,
            vision_data,
            target_count=15,
            max_count=30
        )

        final_rating = calculate_final_rating(item_result["average_score"])
        item_result["final_rating"] = final_rating

        results["items"].append(item_result)

        print(f"      → 최종 등급: {final_rating}/5")
        print()

    # 전체 평균 계산
    all_ratings = [item["final_rating"] for item in results["items"] if item["data_count"] > 0]

    if all_ratings:
        overall_average = round(sum(all_ratings) / len(all_ratings), 2)
    else:
        overall_average = 0.0

    results["summary"] = {
        "total_items": len(VISION_ITEMS),
        "evaluated_items": len([item for item in results["items"] if item["data_count"] > 0]),
        "total_data_points": sum(item["data_count"] for item in results["items"]),
        "overall_average_rating": overall_average
    }

    # 결과 출력
    print()
    print("=" * 70)
    print("🏆 비전 평가 결과 요약")
    print("=" * 70)
    print(f"평가 의원: {politician_name}")
    print(f"평가 일시: {results['evaluation_date']}")
    print(f"총 평가 항목: {results['summary']['total_items']}개")
    print(f"수집된 데이터: {results['summary']['total_data_points']}개")
    print()
    print("항목별 최종 등급:")
    for item in results["items"]:
        print(f"  {item['item_name']:25s}: {item['final_rating']:+5.1f}/5 ({item['data_count']}개 데이터)")
    print()
    print(f"📊 전체 평균 등급: {overall_average:+.2f}/5")
    print("=" * 70)

    # JSON 파일로 저장
    output_dir = "C:\\Development_PoliticianFinder\\Developement_Real_PoliticianFinder\\0-3_AI_Evaluation_Engine\\results_박주민_V6.2"
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, "category_3_비전.json")

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n💾 결과 저장: {output_path}")


if __name__ == "__main__":
    main()
