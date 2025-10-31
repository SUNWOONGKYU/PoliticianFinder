#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
작업지시서 검증 스크립트
생성된 144개 작업지시서 파일의 내용 검증
"""

import json
from pathlib import Path

def verify_instruction_file(task_id, json_data, tasks_dir):
    """
    단일 작업지시서 검증

    Args:
        task_id: 작업 ID (예: P1O1)
        json_data: JSON에서 로드한 작업 데이터
        tasks_dir: tasks 디렉토리 경로

    Returns:
        tuple: (success: bool, message: str)
    """
    file_path = tasks_dir / f"{task_id}.md"

    # 1. 파일 존재 확인
    if not file_path.exists():
        return False, f"File not found: {file_path}"

    # 2. 파일 읽기
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return False, f"Failed to read file: {e}"

    # 3. 파일이 비어있지 않은지 확인
    if len(content.strip()) < 100:
        return False, f"File is too short (< 100 characters)"

    # 4. 필수 섹션 확인
    required_sections = [
        f"# 작업지시서: {task_id}",
        "## 📋 기본 정보",
        "## 🎯 작업 목표",
        "## 🔧 사용 도구",
        "## 🔗 의존성 정보",
        "## 📦 기대 결과물",
        "## 📝 작업 지시사항",
        "## 💡 참고사항",
        "## ✅ 완료 기준"
    ]

    for section in required_sections:
        if section not in content:
            return False, f"Missing section: {section}"

    # 5. 핵심 정보 확인
    task_name = json_data.get('task_name', '')
    area = json_data.get('area', '')
    phase = json_data.get('phase', '')

    if task_id not in content:
        return False, f"Task ID '{task_id}' not found in content"

    if task_name and task_name not in content:
        return False, f"Task name '{task_name}' not found in content"

    if f"Phase {phase}" not in content:
        return False, f"Phase {phase} not found in content"

    # 6. Area 확인
    area_names = {
        'O': 'DevOps',
        'D': 'Database',
        'BI': 'Backend Infrastructure',
        'BA': 'Backend APIs',
        'F': 'Frontend',
        'T': 'Test'
    }

    area_name = area_names.get(area, area)
    if area_name not in content:
        return False, f"Area '{area_name}' not found in content"

    return True, "OK"

def main():
    """메인 실행 함수"""
    script_dir = Path(__file__).parent
    json_file = script_dir / "generated_grid_full_v4.json"
    tasks_dir = script_dir / "tasks"

    print("=" * 70)
    print("Task Instruction File Verification")
    print("=" * 70)

    # JSON 파일 읽기
    if not json_file.exists():
        print(f"Error: {json_file} not found")
        return

    print(f"\nReading JSON: {json_file}")
    with open(json_file, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    print(f"Total tasks: {len(tasks)}")
    print(f"Tasks directory: {tasks_dir}")
    print("\nVerifying files...\n")

    # 검증 결과
    success_count = 0
    failed_tasks = []

    for i, task in enumerate(tasks, 1):
        task_id = task['task_id']
        success, message = verify_instruction_file(task_id, task, tasks_dir)

        if success:
            success_count += 1
            if i % 20 == 0:
                print(f"Progress: {i}/{len(tasks)} ({i*100//len(tasks)}%) - OK")
        else:
            failed_tasks.append((task_id, message))
            print(f"ERROR [{task_id}]: {message}")

    # 최종 결과
    print("\n" + "=" * 70)
    print("Verification Results")
    print("=" * 70)
    print(f"Total files: {len(tasks)}")
    print(f"Passed: {success_count}")
    print(f"Failed: {len(failed_tasks)}")

    if failed_tasks:
        print("\nFailed tasks:")
        for task_id, message in failed_tasks:
            print(f"  - {task_id}: {message}")
        print("\n" + "=" * 70)
        print("VERIFICATION FAILED")
        print("=" * 70)
        return False
    else:
        print("\n" + "=" * 70)
        print("ALL FILES VERIFIED SUCCESSFULLY!")
        print("=" * 70)

        # 샘플 파일 내용 출력
        print("\nSample file content (P1O1.md):")
        print("-" * 70)
        sample_file = tasks_dir / "P1O1.md"
        with open(sample_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for i, line in enumerate(lines[:30], 1):
                print(f"{i:3d}: {line.rstrip()}")
            if len(lines) > 30:
                print(f"... ({len(lines) - 30} more lines)")
        print("-" * 70)

        return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
