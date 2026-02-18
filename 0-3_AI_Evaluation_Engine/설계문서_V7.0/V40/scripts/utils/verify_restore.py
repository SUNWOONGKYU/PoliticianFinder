#!/usr/bin/env python3
"""
복원 후 검증 스크립트
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
ENV_PATH = SCRIPT_DIR.parent.parent / '.env'

# .env 파일 로드
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)

# Supabase 클라이언트
from supabase import create_client, Client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*60)
print("복원 검증")
print("="*60 + "\n")

# 1. V40 테이블 확인
print("[1] V40 테이블 확인")
print("-"*60)

v40_tables = ['collected_data_v40', 'evaluations_v40', 'scores_v40']
tables_found = {}

for table_name in v40_tables:
    try:
        result = supabase.table(table_name).select('id').limit(1).execute()

        # 레코드 수 확인
        count_result = supabase.table(table_name).select('id', count='exact').execute()
        count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)

        tables_found[table_name] = count
        print(f"[OK] {table_name}: {count:,} 레코드")
    except Exception as e:
        tables_found[table_name] = None
        print(f"[ERROR] {table_name}: 없음 ({str(e)[:50]})")

print()

# 2. 조은희 데이터 확인
print("[2] 조은희 데이터 확인")
print("-"*60)

if tables_found.get('collected_data_v40'):
    try:
        # 조은희 데이터 검색
        joheunhee = supabase.table('collected_data_v40').select('*').ilike('politician_name', '%조은희%').limit(5).execute()

        if joheunhee.data:
            print(f"[OK] 조은희 데이터 발견: {len(joheunhee.data)}개 (샘플)")

            # 전체 개수
            count_result = supabase.table('collected_data_v40').select('id', count='exact').ilike('politician_name', '%조은희%').execute()
            total_count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)
            print(f"[OK] 조은희 전체 데이터: {total_count:,}개")

            # 샘플 출력
            print("\n샘플:")
            for event in joheunhee.data[:3]:
                print(f"  - {event.get('event_date')} | {event.get('category')} | {event.get('title', 'N/A')[:40]}")
        else:
            print("[WARNING] 조은희 데이터 없음")
    except Exception as e:
        print(f"[ERROR] 조회 실패: {e}")
else:
    print("[SKIP] collected_data_v40 테이블 없음")

print()

# 3. 네이버 데이터 확인
print("[3] 네이버 수집 데이터 확인")
print("-"*60)

if tables_found.get('collected_data_v40'):
    try:
        # 네이버 데이터 검색
        naver = supabase.table('collected_data_v40').select('*').eq('source', 'naver_api').limit(5).execute()

        if naver.data:
            print(f"[OK] 네이버 데이터 발견: {len(naver.data)}개 (샘플)")

            # 전체 개수
            count_result = supabase.table('collected_data_v40').select('id', count='exact').eq('source', 'naver_api').execute()
            total_count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)
            print(f"[OK] 네이버 전체 데이터: {total_count:,}개")

            # 샘플 출력
            print("\n샘플:")
            for event in naver.data[:3]:
                print(f"  - {event.get('event_date')} | {event.get('politician_name', 'N/A')} | {event.get('title', 'N/A')[:40]}")
        else:
            print("[WARNING] 네이버 데이터 없음")
    except Exception as e:
        print(f"[ERROR] 조회 실패: {e}")
else:
    print("[SKIP] collected_data_v40 테이블 없음")

print()

# 4. 평가 데이터 확인
print("[4] 평가 데이터 확인")
print("-"*60)

if tables_found.get('evaluations_v40'):
    try:
        # 조은희 평가 데이터
        joheunhee_eval = supabase.table('evaluations_v40').select('*').ilike('politician_name', '%조은희%').limit(5).execute()

        if joheunhee_eval.data:
            print(f"[OK] 조은희 평가 데이터 발견")

            # 전체 개수
            count_result = supabase.table('evaluations_v40').select('id', count='exact').ilike('politician_name', '%조은희%').execute()
            total_count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)
            print(f"[OK] 조은희 평가 전체: {total_count:,}개")

            # AI별 분포
            print("\nAI별 평가 분포:")
            for ai in ['claude', 'chatgpt', 'gemini', 'grok']:
                ai_result = supabase.table('evaluations_v40').select('id', count='exact').ilike('politician_name', '%조은희%').eq('evaluator_ai', ai).execute()
                ai_count = ai_result.count if hasattr(ai_result, 'count') else len(ai_result.data)
                print(f"  - {ai.capitalize()}: {ai_count:,}개")
        else:
            print("[WARNING] 조은희 평가 데이터 없음")
    except Exception as e:
        print(f"[ERROR] 조회 실패: {e}")
else:
    print("[SKIP] evaluations_v40 테이블 없음")

print()

# 5. 최종 점수 확인
print("[5] 최종 점수 확인")
print("-"*60)

if tables_found.get('scores_v40'):
    try:
        # 조은희 점수
        joheunhee_score = supabase.table('scores_v40').select('*').ilike('politician_name', '%조은희%').execute()

        if joheunhee_score.data:
            print(f"[OK] 조은희 점수 데이터 발견")

            score_data = joheunhee_score.data[0]
            print(f"\n최종 점수: {score_data.get('total_score', 'N/A')}")
            print(f"계산 일시: {score_data.get('calculated_at', 'N/A')}")

            # 카테고리별 점수
            print("\n카테고리별 점수:")
            categories = ['expertise', 'leadership', 'vision', 'integrity', 'ethics',
                         'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest']
            for cat in categories:
                score = score_data.get(f'{cat}_score')
                if score is not None:
                    print(f"  - {cat}: {score}")
        else:
            print("[WARNING] 조은희 점수 데이터 없음")
    except Exception as e:
        print(f"[ERROR] 조회 실패: {e}")
else:
    print("[SKIP] scores_v40 테이블 없음")

print()

# 6. 요약
print("="*60)
print("복원 검증 요약")
print("="*60)

all_ok = all(v is not None and v > 0 for v in tables_found.values())

if all_ok:
    print("\n[SUCCESS] 복원 성공!")
    print("  - V40 테이블 모두 존재")
    print("  - 데이터 정상 확인")
    print("\n다음 작업:")
    print("  1. 박주민 데이터 수집 시작 가능")
    print("  2. 또는 다른 정치인 평가 진행")
else:
    print("\n[WARNING] 복원 불완전")
    print("  - 일부 테이블 또는 데이터 누락")
    print("  - 추가 확인 필요")

print()
