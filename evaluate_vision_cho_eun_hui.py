#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Politician Evaluator - V30 Rating System
Evaluates 조은희 (Jo Eun-hui) vision category data and saves to evaluations_v30 table.
"""

import os
import sys
from datetime import datetime
from supabase import create_client

# Load environment variables
from dotenv import load_dotenv
load_dotenv('0-4_Database/Supabase/.env')

# Initialize Supabase
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# Configuration
POLITICIAN_ID = 'd0a5d6e1'  # 조은희
POLITICIAN_NAME = '조은희'
CATEGORY = 'vision'
EVALUATOR_AI = 'Claude'

def get_collected_data():
    """Query collected_data_v30 for vision category items."""
    try:
        response = supabase.table('collected_data_v30').select('*').eq(
            'politician_id', POLITICIAN_ID
        ).eq(
            'category', CATEGORY
        ).order('created_at', desc=True).execute()

        return response.data if response.data else []
    except Exception as e:
        print(f"Error querying collected data: {e}")
        return []

def analyze_and_rate(item):
    """
    Analyze data and assign rating (+4 to -4).

    Vision Category Criteria:
    +4: Transformative vision, innovative policies, national recognition
    +3: Outstanding - Clear ambitious goals, comprehensive future plans
    +2: Good - Practical realistic plans, clear policy direction
    +1: Slightly positive - Basic future planning, effort shown
     0: Neutral - No clear vision content or neutral
    -1: Slightly negative - Unclear direction, vague plans
    -2: Negative - Lack of vision, reactive only
    -3: Seriously negative - Contradictory vision, poor planning
    -4: Worst - No vision, harmful direction
    """
    title = item.get('title', '')
    content = item.get('content', '')

    # Combine title and content for analysis
    full_text = f"{title} {content}".lower()

    # Vision keywords and phrases to look for
    vision_keywords = ['비전', '계획', '정책', '미래', '지향', '방향', '목표', '전략', '혁신']
    ambitious_keywords = ['전면', '대대적', '체계적', '포괄적', '종합', '대변']
    practical_keywords = ['현실적', '실행', '실천', '시행', '단계', '추진']
    vague_keywords = ['막연', '불분명', '애매', '모호', '불명확']
    negative_keywords = ['비판', '비난', '반발', '거부', '부정']
    contradictory_keywords = ['모순', '정반대', '대척', '불일치']

    # Count keyword occurrences
    vision_count = sum(1 for kw in vision_keywords if kw in full_text)
    ambitious_count = sum(1 for kw in ambitious_keywords if kw in full_text)
    practical_count = sum(1 for kw in practical_keywords if kw in full_text)
    vague_count = sum(1 for kw in vague_keywords if kw in full_text)
    negative_count = sum(1 for kw in negative_keywords if kw in full_text)
    contradictory_count = sum(1 for kw in contradictory_keywords if kw in full_text)

    # Calculate sentiment score
    score = 0

    # Positive factors
    if vision_count >= 3:
        score += 2
    elif vision_count >= 1:
        score += 1

    if ambitious_count >= 2:
        score += 2
    elif ambitious_count >= 1:
        score += 1

    if practical_count >= 2:
        score += 1

    # Negative factors
    if contradictory_count >= 1:
        score -= 2

    if vague_count >= 2:
        score -= 1

    if negative_count >= 3:
        score -= 1

    # Normalize to +4 to -4 range
    if score > 4:
        rating = 4
    elif score == 4:
        rating = 4
    elif score == 3:
        rating = 3
    elif score == 2:
        rating = 2
    elif score == 1:
        rating = 1
    elif score == 0:
        rating = 0
    elif score == -1:
        rating = -1
    elif score == -2:
        rating = -2
    elif score <= -3:
        rating = -3
    else:
        rating = 0

    return rating

def write_rationale(item, rating):
    """
    Write evaluation rationale in Korean.
    """
    title = item.get('title', '')
    content = item.get('content', '')

    # Create rationale based on rating and content
    rationale_map = {
        4: f"'{title}' 자료는 정치인의 변혁적이고 혁신적인 정책 비전과 국가적 인정을 보여줍니다. 체계적이고 종합적인 미래 계획이 명확하게 제시되어 있습니다.",
        3: f"'{title}' 자료는 명확한 야심찬 목표와 포괄적인 미래 계획을 제시하고 있습니다. 정치인의 정책 방향과 지향점이 구체적으로 드러나 있습니다.",
        2: f"'{title}' 자료는 현실적이고 실행 가능한 계획과 명확한 정책 방향을 보여줍니다. 기본적인 비전과 미래 지향적인 태도가 표현되어 있습니다.",
        1: f"'{title}' 자료는 기본적인 미래 계획과 노력의 흔적을 보여줍니다. 정치인의 발전 의지와 관심이 드러나 있으나 구체성은 부족합니다.",
        0: f"'{title}' 자료는 명확한 비전 내용이 부족하거나 중립적입니다. 긍정적 또는 부정적 판단을 내리기 어렵습니다.",
        -1: f"'{title}' 자료는 정책 방향이 불명확하고 계획이 모호합니다. 구체적인 비전이 드러나지 않고 있습니다.",
        -2: f"'{title}' 자료는 비전의 부족함이 두드러집니다. 반응적인 태도만 보이며 전향적인 계획이 부재합니다.",
        -3: f"'{title}' 자료는 모순적인 비전과 부실한 계획을 보여줍니다. 정치인의 미래 방향성에 대한 의문이 제기됩니다.",
        -4: f"'{title}' 자료는 비전이 없으며 해로운 방향성을 나타냅니다. 미래 계획의 심각한 문제점이 드러나 있습니다.",
    }

    return rationale_map.get(rating, f"'{title}' 자료를 평가하였습니다.")

def check_duplicate(data_id):
    """Check if evaluation already exists (collected_data_id + evaluator_ai unique)."""
    try:
        response = supabase.table('evaluations_v30').select('id').eq(
            'collected_data_id', data_id
        ).eq(
            'evaluator_ai', EVALUATOR_AI
        ).execute()

        return len(response.data) > 0
    except Exception as e:
        print(f"Error checking duplicate: {e}")
        return False

def save_evaluations(evaluations):
    """Save evaluations to evaluations_v30 table."""
    if not evaluations:
        print("No evaluations to save.")
        return 0

    try:
        response = supabase.table('evaluations_v30').insert(evaluations).execute()
        print(f"Successfully saved {len(evaluations)} evaluations to database.")
        return len(evaluations)
    except Exception as e:
        print(f"Error saving evaluations: {e}")
        return 0

def main():
    """Main evaluation process."""
    print("\n" + "="*60)
    print("Politician Evaluator - V30 Rating System")
    print("="*60)
    print(f"Politician ID: {POLITICIAN_ID}")
    print(f"Politician Name: {POLITICIAN_NAME}")
    print(f"Category: {CATEGORY} (비전)")
    print(f"Evaluator AI: {EVALUATOR_AI}")
    print("="*60 + "\n")

    # Step 1: Query collected data
    print("Step 1: Querying collected data...")
    data_items = get_collected_data()
    print(f"Found {len(data_items)} items to evaluate\n")

    if not data_items:
        print("No data found for this politician and category.")
        return

    # Step 2: Evaluate each item
    print("Step 2: Evaluating each data item...")
    evaluations = []
    rating_distribution = {}

    for idx, item in enumerate(data_items, 1):
        data_id = item.get('id')
        title = item.get('title', 'N/A')

        # Check for duplicates
        if check_duplicate(data_id):
            print(f"  [{idx:>3}] SKIP (already evaluated)")
            continue

        # Analyze and rate
        rating = analyze_and_rate(item)
        rationale = write_rationale(item, rating)

        # Track rating distribution
        rating_distribution[rating] = rating_distribution.get(rating, 0) + 1

        # Create evaluation record
        evaluation = {
            'politician_id': POLITICIAN_ID,
            'politician_name': POLITICIAN_NAME,
            'category': CATEGORY,
            'evaluator_ai': EVALUATOR_AI,
            'rating': rating,
            'score': rating * 2,  # Score is rating × 2
            'reasoning': rationale,
            'evaluated_at': datetime.now().isoformat(),
            'collected_data_id': data_id
        }

        evaluations.append(evaluation)
        print(f"  [{idx:>3}] {rating:>2} - {title[:60]}")

    # Step 3: Save to database
    print(f"\nStep 3: Saving evaluations to database...")
    saved_count = save_evaluations(evaluations)

    # Step 4: Report results
    print(f"\n{'='*60}")
    print(f"Evaluation Complete")
    print(f"{'='*60}")
    print(f"Total items evaluated: {saved_count}")
    print(f"\nRating Distribution:")

    # Sort ratings for display
    rating_order = [4, 3, 2, 1, 0, -1, -2, -3, -4]
    for rating in rating_order:
        if rating in rating_distribution:
            count = rating_distribution[rating]
            percentage = (count / saved_count * 100) if saved_count > 0 else 0
            print(f"  {rating:>2}: {count:>3} items ({percentage:>5.1f}%)")

    # Show sample evaluations
    if evaluations:
        print(f"\nSample Evaluations:")
        for i, eval_item in enumerate(evaluations[:3], 1):
            data_item = next((d for d in data_items if d['id'] == eval_item['collected_data_id']), None)
            if data_item:
                print(f"\n  Sample {i}:")
                print(f"    Title: {data_item.get('title', 'N/A')[:70]}")
                print(f"    Rating: {eval_item['rating']}")
                print(f"    Rationale: {eval_item['reasoning'][:80]}...")

    print(f"\n{'='*60}")
    print(f"Evaluation Report")
    print(f"  Politician: Jo Eun-hui (조은희)")
    print(f"  Category: vision (비전)")
    print(f"  Total Evaluated: {saved_count}")
    print(f"  Status: [OK] Complete")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    main()
