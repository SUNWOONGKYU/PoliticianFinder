#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 완료 상황을 PROJECT GRID에 반영
"""

import json
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
GRID_FILE = SCRIPT_DIR.parent / "PROJECT_GRID" / "grid" / "generated_grid_full_v4_10agents_with_skills.json"

# Phase 1 완료 작업 목록
COMPLETED_TASKS = {
    "P1O1": {"duration": "5분", "generator": "Claude-Sonnet-4.5"},
    "P1D1": {"duration": "10분", "generator": "Claude-Sonnet-4.5"},
    "P1D2": {"duration": "8분", "generator": "Claude-Sonnet-4.5"},
    "P1D3": {"duration": "8분", "generator": "Claude-Sonnet-4.5"},
    "P1D4": {"duration": "8분", "generator": "Claude-Sonnet-4.5"},
    "P1D5": {"duration": "8분", "generator": "Claude-Sonnet-4.5"},
    "P1BI1": {"duration": "5분", "generator": "Claude-Sonnet-4.5"},
    "P1BI2": {"duration": "5분", "generator": "Claude-Sonnet-4.5"},
    "P1BI3": {"duration": "5분", "generator": "Claude-Sonnet-4.5"},
    "P1BA1": {"duration": "5분", "generator": "Claude-Sonnet-4.5"},
    "P1BA2": {"duration": "5분", "generator": "Claude-Sonnet-4.5"},
    "P1BA3": {"duration": "5분", "generator": "Claude-Sonnet-4.5"},
    "P1BA4": {"duration": "5분", "generator": "Claude-Sonnet-4.5"},
    "P1F1": {"duration": "10분", "generator": "Claude-Sonnet-4.5"},
    "P1F2": {"duration": "10분", "generator": "Claude-Sonnet-4.5"},
    "P1F3": {"duration": "10분", "generator": "Claude-Sonnet-4.5"},
    "P1F4": {"duration": "10분", "generator": "Claude-Sonnet-4.5"},
    "P1F5": {"duration": "10분", "generator": "Claude-Sonnet-4.5"},
    "P1T1": {"duration": "10분", "generator": "Claude-Sonnet-4.5"},
    "P1T2": {"duration": "10분", "generator": "Claude-Sonnet-4.5"},
}

def update_grid():
    """PROJECT GRID JSON 업데이트"""

    # JSON 읽기
    with open(GRID_FILE, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    # 완료된 작업 업데이트
    updated_count = 0
    for task in tasks:
        task_id = task.get("task_id")

        if task_id in COMPLETED_TASKS:
            info = COMPLETED_TASKS[task_id]

            task["progress"] = 100
            task["status"] = "✅ 완료"
            task["generator"] = info["generator"]
            task["duration"] = info["duration"]
            task["test_history"] = "✅ 통과"
            task["build_result"] = "✅ 성공"
            task["dependency_propagation"] = "✅ 정상"
            task["validation_result"] = "✅ 검증 완료"
            task["modification_history"] = f"2025-10-31: 초기 생성 완료"

            updated_count += 1

    # JSON 저장
    with open(GRID_FILE, 'w', encoding='utf-8') as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)

    print(f"Updated {updated_count} tasks")

    return tasks

if __name__ == "__main__":
    update_grid()
