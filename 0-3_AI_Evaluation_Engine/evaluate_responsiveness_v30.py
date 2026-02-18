#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Responsiveness Category Evaluation for V30
민원과 사회 문제에 신속하게 대응하는 능력 평가
"""

import os
import sys
import io
from datetime import datetime
import json

# Fix encoding on Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Load environment variables manually
env_path = ".env"
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
            if '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

from supabase import create_client, Client
import anthropic

# Initialize clients
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Constants
POLITICIAN_ID = "f9e00370"
CATEGORY = "responsiveness"
EVALUATOR_AI = "Claude"

# Rating scale definition
RATING_SCALE = {
    4: "탁월",  # 법률 제정, 국가 인정
    3: "우수",  # 정책 성과 수치화
    2: "양호",  # 일반 긍정 활동
    1: "경미한 긍정",
    0: "중립",
    -1: "경미한 부정",
    -2: "미흡",  # 실책, 정책 실패
    -3: "불량",  # 중대 실책, 강한 비판
    -4: "매우 불량",  # 범죄, 기소, 사퇴
}

RESPONSIVENESS_GUIDANCE = """
민원과 사회 문제에 신속하게 대응하는 능력 평가:
- 민원 처리: 국민 민원에 얼마나 신속하고 적절하게 대응했는가
- 현장 방문: 문제가 발생한 현장을 직접 방문하여 파악했는가
- 신속 대응: 긴급한 상황에 얼마나 빠르게 대응했는가
- 사후 조치: 문제 해결 후 재발 방지를 위한 조치를 취했는가

평가 기준:
+4 탁월: 법률 제정, 국가/언론 인정을 받은 신속 대응 및 문제 해결
+3 우수: 정량적 성과 수치화 (민원 처리 수 증대, 응답 시간 단축 등)
+2 양호: 일반적인 긍정적 민원 처리, 현장 방문, 신속 대응 사례
+1 경미한 긍정: 작은 규모의 민원 대응
0 중립: 책임 불분명, 판단 어려움
-1 경미한 부정: 미흡한 응답, 늦은 대응
-2 미흡: 중요한 민원 미처리, 실책, 정책 실패
-3 불량: 중대한 미흡, 강한 비판, 수사 등
-4 매우 불량: 범죄, 기소, 사퇴 등
"""


def get_collected_items():
    """Fetch all responsiveness category items for the politician"""
    print(f"\n📥 Fetching collected data for {POLITICIAN_ID} in {CATEGORY} category...")

    try:
        response = supabase.table("collected_data_v30").select(
            "id, politician_id, category, title, content"
        ).eq("politician_id", POLITICIAN_ID).eq("category", CATEGORY).execute()

        items = response.data
        print(f"✓ Found {len(items)} items")
        return items
    except Exception as e:
        print(f"✗ Error fetching collected data: {e}")
        return []


def get_evaluated_items():
    """Get items already evaluated by Claude"""
    print(f"📊 Checking evaluated items for {POLITICIAN_ID} in {CATEGORY}...")

    try:
        response = supabase.table("evaluations_v30").select(
            "collected_data_id"
        ).eq("politician_id", POLITICIAN_ID).eq("category", CATEGORY).eq("evaluator_ai", EVALUATOR_AI).execute()

        evaluated_ids = set(row["collected_data_id"] for row in response.data)
        print(f"✓ Found {len(evaluated_ids)} already evaluated items")
        return evaluated_ids
    except Exception as e:
        print(f"✗ Error fetching evaluations: {e}")
        return set()


def evaluate_item_with_claude(item):
    """Use Claude to evaluate a single item"""
    title = item.get("title", "")
    content = item.get("content", "")

    prompt = f"""당신은 정치인 정책 평가 전문가입니다.

다음 내용을 \"민원과 사회 문제에 신속하게 대응하는 능력(responsiveness)\" 기준으로 평가해주세요.

[평가 기준]
{RESPONSIVENESS_GUIDANCE}

[평가 대상 항목]
제목: {title}
내용: {content}

다음 JSON 형식으로 평가 결과를 제공해주세요:
{{
  "rating": -4부터 4까지의 정수 (예: +2, 0, -1),
  "score": -4부터 4까지의 정수,
  "rating_text": "탁월/우수/양호/경미한 긍정/중립/경미한 부정/미흡/불량/매우 불량 중 하나",
  "reasoning": "평가 이유 (2-3문장, 한글)"
}}

JSON만 반환하세요."""

    try:
        message = client.messages.create(
            model="claude-opus-4-5-20251101",
            max_tokens=500,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        response_text = message.content[0].text

        # Parse JSON response
        import json
        result = json.loads(response_text)
        return result
    except Exception as e:
        print(f"  ✗ Claude evaluation error: {e}")
        return None


def save_evaluation(item_id, rating, score, reasoning):
    """Save evaluation to evaluations_v30 table"""
    try:
        evaluation_data = {
            "politician_id": POLITICIAN_ID,
            "category": CATEGORY,
            "collected_data_id": item_id,
            "evaluator_ai": EVALUATOR_AI,
            "rating": f"{rating:+d}",  # Format: "+2" or "-1"
            "score": score,
            "reasoning": reasoning,
            "evaluated_at": datetime.now().isoformat()
        }

        supabase.table("evaluations_v30").insert(evaluation_data).execute()
        return True
    except Exception as e:
        print(f"  ✗ Database save error: {e}")
        return False


def main():
    """Main evaluation workflow"""
    print("=" * 70)
    print("🚀 Responsiveness Category Evaluation (V30)")
    print(f"   Politician ID: {POLITICIAN_ID}")
    print(f"   Category: {CATEGORY}")
    print(f"   Evaluator AI: {EVALUATOR_AI}")
    print("=" * 70)

    # Step 1: Get all collected items
    collected_items = get_collected_items()
    if not collected_items:
        print("✗ No collected items found")
        return 0

    # Step 2: Get already evaluated items
    evaluated_ids = get_evaluated_items()

    # Step 3: Filter items to evaluate
    items_to_evaluate = [
        item for item in collected_items
        if item["id"] not in evaluated_ids
    ]

    print(f"\n📋 Items to evaluate: {len(items_to_evaluate)} / {len(collected_items)}")

    if not items_to_evaluate:
        print("✓ All items already evaluated!")
        return 0

    # Step 4: Evaluate each item
    successful_evaluations = 0
    failed_evaluations = 0

    for idx, item in enumerate(items_to_evaluate, 1):
        print(f"\n[{idx}/{len(items_to_evaluate)}] Evaluating: {item['title'][:60]}...")

        # Get Claude evaluation
        evaluation = evaluate_item_with_claude(item)

        if not evaluation:
            print(f"  ✗ Evaluation failed")
            failed_evaluations += 1
            continue

        rating = evaluation.get("rating")
        score = evaluation.get("score")
        reasoning = evaluation.get("reasoning", "")

        print(f"  Rating: {rating:+d} ({evaluation.get('rating_text', '')})")
        print(f"  Reasoning: {reasoning[:80]}...")

        # Save to database
        if save_evaluation(item["id"], rating, score, reasoning):
            print(f"  ✓ Saved successfully")
            successful_evaluations += 1
        else:
            print(f"  ✗ Failed to save")
            failed_evaluations += 1

    # Summary
    print("\n" + "=" * 70)
    print("📊 EVALUATION SUMMARY")
    print(f"   Total items: {len(collected_items)}")
    print(f"   Already evaluated: {len(evaluated_ids)}")
    print(f"   Successfully evaluated: {successful_evaluations}")
    print(f"   Failed: {failed_evaluations}")
    print(f"   Total evaluated now: {successful_evaluations + len(evaluated_ids)}")
    print("=" * 70)

    return successful_evaluations


if __name__ == "__main__":
    completed = main()
    sys.exit(0 if completed > 0 else 1)
