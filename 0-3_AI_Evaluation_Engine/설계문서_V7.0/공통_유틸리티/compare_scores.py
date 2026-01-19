# -*- coding: utf-8 -*-
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 정치인 이름 조회
politicians = supabase.table('politicians').select('id, name').execute()
pol_dict = {p['id']: p['name'] for p in politicians.data}

# V28 점수
v28_eval = supabase.table('ai_evaluations_v28').select('politician_id, avg_score, grade_code').execute()
v28_dict = {r['politician_id']: {'score': r['avg_score'], 'grade': r['grade_code']} for r in v28_eval.data}

# V24 점수 - ai_final_scores에서 평균 계산
v24_scores = supabase.table('ai_final_scores').select('politician_id, ai_name, total_score, grade_code').execute()

# 정치인별 V24 평균 계산
v24_by_pol = {}
for r in v24_scores.data:
    pid = r['politician_id']
    if pid not in v24_by_pol:
        v24_by_pol[pid] = []
    v24_by_pol[pid].append(r['total_score'])

v24_dict = {}
for pid, scores in v24_by_pol.items():
    avg = round(sum(scores) / len(scores))
    v24_dict[pid] = avg

# V28이 있는 정치인 10명 비교
results = []
for pid, v28_data in v28_dict.items():
    name = pol_dict.get(pid, pid)
    v28_score = v28_data['score']
    v28_grade = v28_data['grade']
    v24_score = v24_dict.get(pid, None)
    
    if v24_score is not None:
        diff = v28_score - v24_score
        diff_str = '+' + str(diff) if diff > 0 else str(diff)
    else:
        diff = 0
        diff_str = 'N/A'
        v24_score = 'N/A'
    
    results.append({
        'name': name,
        'pid': pid,
        'v28': v28_score,
        'v28_grade': v28_grade,
        'v24': v24_score,
        'diff': diff,
        'diff_str': diff_str
    })

# V28 점수 기준 내림차순 정렬
results.sort(key=lambda x: x['v28'], reverse=True)

# 등급 변환 함수
def get_grade(score):
    if score >= 920: return 'M'
    elif score >= 840: return 'D'
    elif score >= 760: return 'E'
    elif score >= 680: return 'P'
    elif score >= 600: return 'G'
    elif score >= 520: return 'S'
    elif score >= 440: return 'B'
    elif score >= 360: return 'I'
    elif score >= 280: return 'Tn'
    else: return 'L'

print('=' * 75)
print('V28 vs V24 점수 비교표 (10명 정치인)')
print('=' * 75)
print(f"{'순위':^4} | {'정치인':^8} | {'V28점수':^8} | {'V28등급':^6} | {'V24점수':^8} | {'V24등급':^6} | {'차이':^6}")
print('-' * 75)

for i, r in enumerate(results, 1):
    v24_str = str(r['v24']) if r['v24'] != 'N/A' else 'N/A'
    v24_grade = get_grade(r['v24']) if r['v24'] != 'N/A' else 'N/A'
    print(f"{i:2}위   | {r['name']:^8} | {r['v28']:^8} | {r['v28_grade']:^6} | {v24_str:^8} | {v24_grade:^6} | {r['diff_str']:^6}")

print('=' * 75)
print()
print('등급 기준: M(920+) > D(840+) > E(760+) > P(680+) > G(600+) > S(520+) > B(440+) > I(360+) > Tn(280+) > L')
