#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase Gate를 위한 SQL INSERT 문 생성
"""

import json
from pathlib import Path

# 파일 경로
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
GRID_FILE = PROJECT_ROOT / "PROJECT_GRID" / "grid" / "generated_grid_full_v4_10agents_with_skills.json"
SQL_FILE = PROJECT_ROOT / "PROJECT_GRID" / "grid" / "generated_grid_full_v4_10agents_with_skills.sql"

def escape_sql_string(s: str) -> str:
    """SQL 문자열 이스케이프"""
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

def generate_sql():
    """Phase Gates를 포함한 전체 SQL 생성"""

    print("=" * 70)
    print("SQL 생성 스크립트 (Phase Gates 포함)")
    print("=" * 70)

    # JSON 파일 읽기
    with open(GRID_FILE, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    print(f"\n총 작업 수: {len(tasks)}")
    print(f"  - 일반 작업: {len([t for t in tasks if t.get('area') != 'GATE'])}개")
    print(f"  - Phase Gates: {len([t for t in tasks if t.get('area') == 'GATE'])}개")

    # SQL 생성
    sql_lines = []

    # 헤더
    sql_lines.append("-- PROJECT GRID V5.0 - Phase Gates 포함")
    sql_lines.append("-- 총 151개 작업 (144개 일반 작업 + 7개 Phase Gates)")
    sql_lines.append("-- 생성일: 2025-10-31")
    sql_lines.append("")
    sql_lines.append("-- 기존 데이터 삭제")
    sql_lines.append("DELETE FROM project_grid_tasks;")
    sql_lines.append("")
    sql_lines.append("-- INSERT 문")

    # 각 작업에 대한 INSERT 문 생성
    for i, task in enumerate(tasks, 1):
        values = [
            escape_sql_string(task.get("phase")),
            escape_sql_string(task.get("area")),
            escape_sql_string(task.get("task_id")),
            escape_sql_string(task.get("task_name")),
            escape_sql_string(task.get("instruction_file")),
            escape_sql_string(task.get("assigned_agent")),
            escape_sql_string(task.get("tools")),
            escape_sql_string(task.get("work_mode")),
            escape_sql_string(task.get("dependency_chain")),
            str(task.get("progress", 0)),
            escape_sql_string(task.get("status")),
            escape_sql_string(task.get("generated_files")),
            escape_sql_string(task.get("generator")),
            escape_sql_string(task.get("duration")),
            escape_sql_string(task.get("modification_history")),
            escape_sql_string(task.get("test_history")),
            escape_sql_string(task.get("build_result")),
            escape_sql_string(task.get("dependency_propagation")),
            escape_sql_string(task.get("blocker")),
            escape_sql_string(task.get("validation_result")),
            escape_sql_string(task.get("remarks"))
        ]

        insert_stmt = f"INSERT INTO project_grid_tasks (phase, area, task_id, task_name, instruction_file, assigned_agent, tools, work_mode, dependency_chain, progress, status, generated_files, generator, duration, modification_history, test_history, build_result, dependency_propagation, blocker, validation_result, remarks) VALUES ({', '.join(values)});"

        sql_lines.append(insert_stmt)

        # Phase Gate 뒤에 구분선 추가
        if task.get("area") == "GATE":
            sql_lines.append("")
            sql_lines.append(f"-- {task.get('task_id')} 완료")
            sql_lines.append("")

    # SQL 파일 저장
    with open(SQL_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"\n✓ SQL 파일 생성 완료: {SQL_FILE.name}")
    print(f"  - 총 {len(tasks)}개 INSERT 문 생성")

    print("\n" + "=" * 70)
    print("✅ 완료!")
    print("=" * 70)

if __name__ == "__main__":
    generate_sql()
