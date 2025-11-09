#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase 테이블에서 assigned_agent의 2차 표현 제거
"""
import json

# 로컬 JSON 파일에서 정리된 데이터 읽기
with open('generated_grid_full_v4_10agents_with_skills.json', 'r', encoding='utf-8') as f:
    tasks = json.load(f)

print("=" * 60)
print("Supabase 업데이트 필요 정보")
print("=" * 60)

# Phase 1 작업만 필터링
phase1_tasks = [t for t in tasks if t.get('phase') == 1]

print(f"\n총 {len(phase1_tasks)}개 Phase 1 작업:\n")
for task in phase1_tasks:
    task_id = task['task_id']
    agent = task['assigned_agent']
    print(f"UPDATE project_grid SET assigned_agent = '{agent}' WHERE task_id = '{task_id}';")

print("\n" + "=" * 60)
print("위 SQL 쿼리를 Supabase에서 실행하거나")
print("Supabase UI에서 각 행의 assigned_agent 필드를 수동으로 업데이트하세요")
print("=" * 60)

