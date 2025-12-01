#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 간 일관성이 낮은 정치인 찾기
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

# politicians 테이블에서 이름과 ID 먼저 조회
politicians_response = supabase.table('politicians').select('id, name').execute()

# politician_details에서 점수 조회
details_response = supabase.table('politician_details').select(
    'politician_id, chatgpt_total_score, grok_total_score, claude_total_score'
).execute()

if not details_response.data:
    print("데이터가 없습니다!")
    sys.exit(1)

# ID별 이름 매핑
name_map = {p['id']: p['name'] for p in politicians_response.data}

# AI 간 점수 차이 계산
inconsistencies = []

for politician in details_response.data:
    politician_id = politician['politician_id']
    chatgpt = politician.get('chatgpt_total_score') or 0
    grok = politician.get('grok_total_score') or 0
    claude = politician.get('claude_total_score') or 0

    # 점수가 모두 있는 경우만
    if chatgpt > 0 and grok > 0 and claude > 0:
        scores = [chatgpt, grok, claude]
        max_diff = max(scores) - min(scores)

        inconsistencies.append({
            'politician_id': politician_id,
            'name': name_map.get(politician_id, '이름없음'),
            'chatgpt': chatgpt,
            'grok': grok,
            'claude': claude,
            'max_diff': max_diff,
            'avg': sum(scores) / 3
        })

# 차이가 큰 순으로 정렬
inconsistencies.sort(key=lambda x: x['max_diff'], reverse=True)

print('='*80)
print('AI 간 점수 차이가 큰 정치인 Top 10')
print('='*80)

for i, p in enumerate(inconsistencies[:10], 1):
    print(f"\n{i}. {p['name']} (ID: {p['politician_id']})")
    print(f"   ChatGPT: {p['chatgpt']:.1f}점")
    print(f"   Grok:    {p['grok']:.1f}점")
    print(f"   Claude:  {p['claude']:.1f}점")
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
