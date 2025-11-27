#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
서울시장 후보 12명 점수 조회 및 순위표 생성
"""

import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json
from supabase import create_client
from dotenv import load_dotenv

# 환경 변수 로드
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# 등급 매핑
GRADE_MAPPING = {
    1000: 'L (Legendary)',
    900: 'Tn (Titanium)',
    800: 'I (Iridium)',
    700: 'B (Brilliant)',
    600: 'S (Sapphire)',
    500: 'G (Gold)',
    400: 'P (Platinum)',
    300: 'E (Emerald)',
    200: 'D (Diamond)',
    0: 'M (Mithril)'
}

def get_grade(score):
    """점수에 따른 등급 반환"""
    for threshold in sorted(GRADE_MAPPING.keys(), reverse=True):
        if score >= threshold:
            return GRADE_MAPPING[threshold]
    return 'M (Mithril)'

def get_seoul_candidates():
    """서울시장 후보 12명 정보 로드"""
    json_path = os.path.join(os.path.dirname(__file__), '..', 'seoul_mayor_candidates_basic_info.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_final_scores(politician_ids):
    """DB에서 최종 점수 조회"""
    result = supabase.table('ai_final_scores').select('politician_id, total_score').in_('politician_id', politician_ids).execute()

    scores = {}
    for row in result.data:
        scores[row['politician_id']] = row['total_score']

    return scores

def main():
    print("="*100)
    print("서울시장 후보 12명 점수 및 순위 조회")
    print("="*100)
    print()

    # 후보자 정보 로드
    candidates = get_seoul_candidates()

    # politicians 테이블에서 ID 조회
    names = [c['name'] for c in candidates]
    politicians_result = supabase.table('politicians').select('id, name, party').in_('name', names).eq('region', '서울특별시').execute()

    # ID 매핑
    id_map = {p['name']: {'id': p['id'], 'party': p['party']} for p in politicians_result.data}

    # 점수 조회
    politician_ids = [p['id'] for p in politicians_result.data]
    scores = get_final_scores(politician_ids)

    # 결과 정리
    results = []
    for candidate in candidates:
        name = candidate['name']
        if name in id_map:
            pid = id_map[name]['id']
            party = id_map[name]['party']
            score = scores.get(pid, 0)
            grade = get_grade(score)

            results.append({
                'name': name,
                'party': party,
                'score': score,
                'grade': grade,
                'politician_id': pid
            })

    # 점수 순으로 정렬
    results.sort(key=lambda x: x['score'], reverse=True)

    # 순위 출력
    print(f"{'순위':<4} {'이름':<8} {'정당':<12} {'점수':<6} {'등급':<20}")
    print("-" * 100)

    for i, r in enumerate(results, 1):
        print(f"{i:2d}위  {r['name']:<8} {r['party']:<12} {int(r['score']):4d}점  {r['grade']:<20}")

    print()
    print("="*100)

    # JSON 저장
    output_file = os.path.join(os.path.dirname(__file__), '..', 'seoul_mayor_ranking.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"✅ 결과 저장: {output_file}")
    print("="*100)

if __name__ == "__main__":
    main()
