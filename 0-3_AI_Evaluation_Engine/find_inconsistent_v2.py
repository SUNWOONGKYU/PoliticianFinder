#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 간 일관성이 낮은 정치인 찾기 (v2)
- ai_evaluations 테이블에서 직접 계산
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# ai_evaluations 테이블에서 전체 데이터 조회
response = supabase.table('ai_evaluations').select('*').execute()

if not response.data:
    print("데이터가 없습니다!")
    sys.exit(1)

# politicians 테이블에서 이름 조회
politicians_response = supabase.table('politicians').select('id, name').execute()
name_map = {p['id']: p['name'] for p in politicians_response.data}

# 정치인별, AI별로 카테고리 점수 집계
from collections import defaultdict

politician_scores = defaultdict(lambda: {'ChatGPT': [], 'Grok': [], 'claude-3-5-haiku-20241022': []})

for eval_data in response.data:
    politician_id = eval_data['politician_id']
    ai_name = eval_data['ai_name']
    category_score = eval_data.get('category_score', 0)

    if category_score:
        politician_scores[politician_id][ai_name].append(category_score)

# 각 정치인의 AI별 평균 점수 계산
inconsistencies = []

for politician_id, ai_scores in politician_scores.items():
    chatgpt_avg = sum(ai_scores['ChatGPT']) / len(ai_scores['ChatGPT']) if ai_scores['ChatGPT'] else 0
    grok_avg = sum(ai_scores['Grok']) / len(ai_scores['Grok']) if ai_scores['Grok'] else 0
    claude_avg = sum(ai_scores['claude-3-5-haiku-20241022']) / len(ai_scores['claude-3-5-haiku-20241022']) if ai_scores['claude-3-5-haiku-20241022'] else 0

    # 모든 AI가 평가한 경우만
    if chatgpt_avg > 0 and grok_avg > 0 and claude_avg > 0:
        scores = [chatgpt_avg, grok_avg, claude_avg]
        max_diff = max(scores) - min(scores)

        inconsistencies.append({
            'politician_id': politician_id,
            'name': name_map.get(politician_id, '이름없음'),
            'chatgpt': chatgpt_avg,
            'grok': grok_avg,
            'claude': claude_avg,
            'max_diff': max_diff,
            'avg': sum(scores) / 3,
            'chatgpt_count': len(ai_scores['ChatGPT']),
            'grok_count': len(ai_scores['Grok']),
            'claude_count': len(ai_scores['claude-3-5-haiku-20241022'])
        })

# 차이가 큰 순으로 정렬
inconsistencies.sort(key=lambda x: x['max_diff'], reverse=True)

print('='*80)
print('AI 간 점수 차이가 큰 정치인 Top 10')
print('='*80)

for i, p in enumerate(inconsistencies[:10], 1):
    print(f"\n{i}. {p['name']} (ID: {p['politician_id']})")
    print(f"   ChatGPT: {p['chatgpt']:.1f}점 ({p['chatgpt_count']}개 카테고리)")
    print(f"   Grok:    {p['grok']:.1f}점 ({p['grok_count']}개 카테고리)")
    print(f"   Claude:  {p['claude']:.1f}점 ({p['claude_count']}개 카테고리)")
    print(f"   평균:    {p['avg']:.1f}점")
    print(f"   최대 차이: {p['max_diff']:.1f}점 ⚠️")

print('\n' + '='*80)
print('일관성 테스트용 정치인 2명 선정:')
print('='*80)
print(f"1번: {inconsistencies[0]['name']} (ID: {inconsistencies[0]['politician_id']})")
print(f"   차이: {inconsistencies[0]['max_diff']:.1f}점")
print(f"\n2번: {inconsistencies[1]['name']} (ID: {inconsistencies[1]['politician_id']})")
print(f"   차이: {inconsistencies[1]['max_diff']:.1f}점")
print('='*80)

# 결과를 JSON으로 저장
import json
with open('inconsistent_politicians.json', 'w', encoding='utf-8') as f:
    json.dump({
        'top_2': [inconsistencies[0], inconsistencies[1]],
        'all_results': inconsistencies
    }, f, ensure_ascii=False, indent=2)

print(f"\n결과 저장: inconsistent_politicians.json")
