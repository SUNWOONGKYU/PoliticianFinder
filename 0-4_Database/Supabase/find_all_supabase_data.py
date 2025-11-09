#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase의 모든 테이블과 데이터 탐색
"""
import os
import sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("=" * 100)
    print("Supabase 데이터베이스 전체 탐색")
    print("=" * 100)
    print()

    # 1. politicians 테이블 확인
    print("[1] Politicians 테이블")
    print("-" * 100)
    try:
        response = supabase.table("politicians").select("*").execute()
        print(f"총 {len(response.data)}명의 정치인 데이터")
        print()
        for politician in response.data:
            print(f"  ID: {politician.get('id')} | 이름: {politician.get('name')} | 점수: {politician.get('composite_score')} | 평가: {politician.get('avg_rating')}")
        print()
    except Exception as e:
        print(f"오류: {e}")
        print()

    # 2. politician_posts 테이블 확인
    print("[2] Politician Posts 테이블")
    print("-" * 100)
    try:
        response = supabase.table("politician_posts").select("*").limit(10).execute()
        print(f"샘플 {len(response.data)}개 포스트:")
        for post in response.data:
            print(f"  정치인 ID: {post.get('politician_id')} | 제목: {post.get('title')[:50]}... | 플랫폼: {post.get('platform')}")
        print()
    except Exception as e:
        print(f"오류: {e}")
        print()

    # 3. 다른 가능한 평가 관련 테이블들
    print("[3] 다른 모든 테이블 탐색")
    print("-" * 100)

    possible_tables = [
        "evaluations",
        "politician_evaluations",
        "politician_evaluation",
        "ratings",
        "politician_ratings",
        "scores",
        "politician_scores",
        "assessments",
        "politician_assessments",
        "performance",
        "politician_performance",
        "analysis",
        "politician_analysis",
        "data",
        "evaluation_data",
        "ai_evaluations",
        "ai_scores",
        "agent_evaluations"
    ]

    found_tables = []
    for table_name in possible_tables:
        try:
            response = supabase.table(table_name).select("*").limit(1).execute()
            found_tables.append((table_name, len(response.data) if response.data else 0))
            print(f"  ✓ {table_name}: 존재 (샘플 데이터 있음)")
        except:
            pass

    if not found_tables:
        print("  평가 관련 테이블을 찾지 못했습니다.")
    print()

    # 4. politicians 테이블 상세 정보
    print("[4] Politicians 테이블 상세 정보")
    print("-" * 100)
    try:
        response = supabase.table("politicians").select("*").limit(1).execute()
        if response.data:
            sample = response.data[0]
            print(f"컬럼 목록:")
            for key, value in sample.items():
                print(f"  - {key}: {type(value).__name__} = {str(value)[:50]}")
        print()
    except Exception as e:
        print(f"오류: {e}")

    # 5. 특정 정치인(조국) 데이터 확인
    print("[5] 조국(ID: 280) 정치인 데이터")
    print("-" * 100)
    try:
        response = supabase.table("politicians").select("*").eq("id", 280).execute()
        if response.data:
            politician = response.data[0]
            print(f"이름: {politician.get('name')}")
            print(f"당: {politician.get('party')}")
            print(f"지역: {politician.get('region')}")
            print(f"직책: {politician.get('position')}")
            print(f"복합 점수: {politician.get('composite_score')}")
            print(f"평균 평점: {politician.get('avg_rating')}")
            print(f"생성일: {politician.get('created_at')}")
        else:
            print("조국 데이터 없음")
        print()
    except Exception as e:
        print(f"오류: {e}")
        print()

except Exception as e:
    print(f"연결 오류: {e}")
