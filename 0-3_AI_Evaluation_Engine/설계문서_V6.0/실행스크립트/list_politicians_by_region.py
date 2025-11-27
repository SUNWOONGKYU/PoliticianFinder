#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
지역별 정치인 목록 조회
"""

import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from supabase import create_client
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# 전체 정치인 목록 조회
result = supabase.table('politicians').select('politician_id, name, position, party').execute()

print('='*100)
print('전체 정치인 목록 (지역별)')
print('='*100)
print()

# 지역별 분류
regions = {
    '서울시장': [],
    '경기도지사': [],
    '부산시장': [],
    '기타': []
}

for p in result.data:
    name = p.get('name', '')
    position = p.get('position', '')
    party = p.get('party', '')
    politician_id = p.get('politician_id', '')

    if '서울' in position:
        regions['서울시장'].append((name, party, politician_id))
    elif '경기' in position:
        regions['경기도지사'].append((name, party, politician_id))
    elif '부산' in position:
        regions['부산시장'].append((name, party, politician_id))
    else:
        regions['기타'].append((name, party, position, politician_id))

# 점수 조회
scores = {}
score_result = supabase.table('ai_final_scores').select('politician_id, final_score, final_grade').execute()
for s in score_result.data:
    scores[s['politician_id']] = (s.get('final_score', 0), s.get('final_grade', 'N/A'))

# 출력
for region, candidates in regions.items():
    if not candidates:
        continue

    print(f'📍 {region} ({len(candidates)}명)')
    print('-'*100)

    if region == '기타':
        for name, party, position, pid in candidates:
            score, grade = scores.get(pid, (0, 'N/A'))
            print(f'  • {name:6s} ({party:4s}) - {position:15s} | {score:4.0f}점 ({grade})')
    else:
        # 점수순 정렬
        candidates_with_score = []
        for name, party, pid in candidates:
            score, grade = scores.get(pid, (0, 'N/A'))
            candidates_with_score.append((name, party, pid, score, grade))

        candidates_with_score.sort(key=lambda x: x[3], reverse=True)

        for i, (name, party, pid, score, grade) in enumerate(candidates_with_score, 1):
            print(f'  {i}위: {name:6s} ({party:4s}) | {score:4.0f}점 ({grade})')
    print()

print('='*100)
print('주요 경쟁 지역 분석')
print('='*100)
print()

for region in ['서울시장', '경기도지사', '부산시장']:
    candidates = regions[region]
    if len(candidates) < 2:
        continue

    # 점수 계산
    candidates_with_score = []
    for name, party, pid in candidates:
        score, grade = scores.get(pid, (0, 'N/A'))
        candidates_with_score.append((name, party, score, grade))

    candidates_with_score.sort(key=lambda x: x[2], reverse=True)

    if len(candidates_with_score) >= 2:
        first = candidates_with_score[0]
        second = candidates_with_score[1]
        gap = first[2] - second[2]

        print(f'📊 {region}')
        print(f'  1위: {first[0]} ({first[1]}) - {first[2]:.0f}점 ({first[3]})')
        print(f'  2위: {second[0]} ({second[1]}) - {second[2]:.0f}점 ({second[3]})')
        print(f'  격차: {gap:.0f}점')

        if gap < 50:
            print('  🔥 초박빙 경쟁!')
        elif gap < 100:
            print('  ⚠️  치열한 경쟁')
        else:
            print('  ✅ 우세한 차이')
        print()
