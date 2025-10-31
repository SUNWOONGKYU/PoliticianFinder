#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
오세훈 Category 2 (리더십) 평가
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client
import anthropic

load_dotenv()

# API 설정
client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

POLITICIAN_ID = 272
POLITICIAN_NAME = "오세훈"
AI_NAME = "Claude"
CATEGORY_NUM = 2
CATEGORY_NAME = "리더십 (Leadership)"

print(f"\n{'='*80}")
print(f"[START] {POLITICIAN_NAME} - Category {CATEGORY_NUM}: {CATEGORY_NAME}")
print(f"{'='*80}\n")

# 작업 지시서 읽기
with open('설계문서_V3.0/서브에이전트_작업지시서_V6.2_DB.md', 'r', encoding='utf-8') as f:
    instructions = f.read()

# 70개 항목 구성 읽기
with open('설계문서_V3.0/4_70개항목_구성내역_V6.2.md', 'r', encoding='utf-8') as f:
    items_doc = f.read()

prompt = f"""
{instructions}

=== 평가 대상 ===
정치인: {POLITICIAN_NAME}
Category: {CATEGORY_NUM} - {CATEGORY_NAME}

=== 70개 항목 문서 ===
{items_doc}

=== 중요 ===
1. Category {CATEGORY_NUM}의 7개 항목만 평가
2. 각 항목당 10~30개 데이터 수집 (10개 미만 시 3회 재시도)
3. Rating: -5 ~ +5 범위
4. Supabase에 직접 저장
5. politician_id = {POLITICIAN_ID}
6. ai_name = "{AI_NAME}"
7. category_num = {CATEGORY_NUM}

지금 시작하세요!
"""

print("[API] Claude API calling...")
print(f"   Category {CATEGORY_NUM}: {CATEGORY_NAME}\n")

try:
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=16000,
        temperature=0,
        messages=[{"role": "user", "content": prompt}]
    )

    result = response.content[0].text

    print("[DONE] Evaluation completed")
    print(f"\nResponse length: {len(result)} characters")
    print(f"\n{'='*80}")
    print("[RESULT] Summary")
    print(f"{'='*80}")
    print(result[:2000])
    if len(result) > 2000:
        print(f"\n... ({len(result) - 2000} more characters)")

    # DB 확인
    check = supabase.table('collected_data').select('*', count='exact').eq('politician_id', POLITICIAN_ID).eq('category_num', CATEGORY_NUM).execute()
    print(f"\n[DB] Data collected: {check.count} rows")

except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)

print(f"\n{'='*80}")
print(f"[COMPLETE] Category {CATEGORY_NUM} finished!")
print(f"{'='*80}\n")
