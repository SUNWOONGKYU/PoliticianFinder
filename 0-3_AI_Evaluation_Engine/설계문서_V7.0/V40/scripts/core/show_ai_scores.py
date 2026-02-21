#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Get category scores
response = supabase.table('ai_category_scores_v40').select('*').eq('politician_id', '37e39502').execute()
data = response.data

# Category names
category_order = ['expertise', 'leadership', 'vision', 'integrity', 'ethics', 'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest']
category_names = ['전문성', '리더십', '비전', '청렴성', '윤리성', '책임감', '투명성', '소통능력', '대응성', '공익성']

# Create dict from response
categories_dict = {row['category']: row for row in data}

# Print header
print('=' * 130)
print(f"{'카테고리':<12} | {'Claude 점수':<12} | {'ChatGPT 점수':<12} | {'Gemini 점수':<12} | {'Grok 점수':<12} | {'최종점수':<10}")
print('-' * 130)

for cat, name in zip(category_order, category_names):
    if cat in categories_dict:
        row = categories_dict[cat]
        ai_details = row['ai_details']
        final_score = row['score']

        claude_avg = ai_details.get('Claude', 0)
        chatgpt_avg = ai_details.get('ChatGPT', 0)
        gemini_avg = ai_details.get('Gemini', 0)
        grok_avg = ai_details.get('Grok', 0)

        # Convert avg rating to score
        claude_score = int((6.0 + claude_avg * 0.5) * 10)
        chatgpt_score = int((6.0 + chatgpt_avg * 0.5) * 10)
        gemini_score = int((6.0 + gemini_avg * 0.5) * 10)
        grok_score = int((6.0 + grok_avg * 0.5) * 10)

        print(f"{name:<12} | {claude_score:<5} ({claude_avg:>5.2f}) | {chatgpt_score:<5} ({chatgpt_avg:>5.2f}) | {gemini_score:<5} ({gemini_avg:>5.2f}) | {grok_score:<5} ({grok_avg:>5.2f}) | {final_score:<10}")

print('-' * 130)

# Get final scores from db
final_response = supabase.table('ai_final_scores_v40').select('*').eq('politician_id', '37e39502').execute()
if final_response.data:
    for row in final_response.data:
        print(f"{'[최종점수]':<12} | {row['claude_score']:<12} | {row['chatgpt_score']:<12} | {row['gemini_score']:<12} | {row['grok_score']:<12} | {row['final_score']:<10}")

print('=' * 130)
