#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
3개 지역 후보자 정보 종합 요약
"""

import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json

def load_json(filename):
    """JSON 파일 로드"""
    file_path = os.path.join(os.path.dirname(__file__), '..', filename)
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ {filename} 로드 실패: {e}")
        return []

def main():
    print("="*100)
    print("3개 지역 후보자 기본 정보 종합 요약")
    print("="*100)
    print()

    # 데이터 로드
    seoul = load_json('seoul_mayor_candidates_basic_info.json')
    gyeonggi = load_json('gyeonggi_governor_candidates_basic_info.json')
    busan = load_json('busan_mayor_candidates_basic_info.json')

    # 통계
    total = len(seoul) + len(gyeonggi) + len(busan)

    print(f"📊 수집 현황")
    print(f"   서울시장: {len(seoul)}명")
    print(f"   경기도지사: {len(gyeonggi)}명")
    print(f"   부산시장: {len(busan)}명")
    print(f"   총계: {total}명")
    print()

    # 서울시장
    print("="*100)
    print("📍 서울시장 후보자 (12명)")
    print("="*100)
    for i, c in enumerate(seoul, 1):
        print(f"{i:2d}. {c['name']:6s} ({c['party']:6s}) - {c['position']:15s} | {c['status']:7s}")
    print()

    # 경기도지사
    print("="*100)
    print("📍 경기도지사 후보자 (10명)")
    print("="*100)
    for i, c in enumerate(gyeonggi, 1):
        region_info = f" ({c['region_local']})" if c.get('region_local') else ""
        print(f"{i:2d}. {c['name']:6s} ({c['party']:6s}) - {c['position']:15s}{region_info} | {c['status']:7s}")
    print()

    # 부산시장
    print("="*100)
    print("📍 부산시장 후보자 (10명)")
    print("="*100)
    for i, c in enumerate(busan, 1):
        region_info = f" ({c['region_local']})" if c.get('region_local') else ""
        print(f"{i:2d}. {c['name']:6s} ({c['party']:6s}) - {c['position']:15s}{region_info} | {c['status']:7s}")
    print()

    # 정당별 분포
    print("="*100)
    print("📊 정당별 분포")
    print("="*100)

    party_count = {}
    for c in seoul + gyeonggi + busan:
        party = c['party']
        party_count[party] = party_count.get(party, 0) + 1

    for party in sorted(party_count.keys(), key=lambda x: party_count[x], reverse=True):
        print(f"   {party:10s}: {party_count[party]:2d}명")
    print()

    # 성별 분포
    print("="*100)
    print("📊 성별 분포")
    print("="*100)

    gender_count = {'남': 0, '여': 0}
    for c in seoul + gyeonggi + busan:
        gender = c['gender']
        gender_count[gender] = gender_count.get(gender, 0) + 1

    print(f"   남성: {gender_count['남']}명 ({gender_count['남']/total*100:.1f}%)")
    print(f"   여성: {gender_count['여']}명 ({gender_count['여']/total*100:.1f}%)")
    print()

    # 신분별 분포
    print("="*100)
    print("📊 신분별 분포")
    print("="*100)

    status_count = {}
    for c in seoul + gyeonggi + busan:
        status = c['status']
        status_count[status] = status_count.get(status, 0) + 1

    for status in ['현직', '후보자', '예비후보자', '출마자']:
        count = status_count.get(status, 0)
        if count > 0:
            print(f"   {status:10s}: {count:2d}명")
    print()

    print("="*100)
    print("✅ 다음 단계: 32명 후보자 DB 등록 및 평가 데이터 수집")
    print("="*100)

if __name__ == "__main__":
    main()
