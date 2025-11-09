#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
프로젝트 그리드 파일 매핑 생성 스크립트
Task ID 기반으로 모든 생성된 파일을 매핑하여 JSON 파일 생성

사용법:
    python build_file_mapping.py
"""

import os
import json
from pathlib import Path
from collections import defaultdict
import re

def extract_task_id(filename):
    """파일명에서 Task ID 추출
    P1F2_LoginPage.tsx → P1F2
    """
    match = re.match(r'(P\d+[A-Z]+\d+)', filename)
    if match:
        return match.group(1)
    return None

def build_file_mapping(root_path):
    """프로젝트 폴더 전체를 스캔하여 파일 매핑 생성"""

    file_mapping = defaultdict(list)
    root = Path(root_path)

    # 제외할 폴더
    exclude_dirs = {'.git', '.vscode', 'node_modules', 'dist', 'build', '__pycache__'}

    print("File scanning started...")
    print(f"  Root: {root_path}")
    print("-" * 60)

    file_count = 0
    task_count = defaultdict(int)

    for file_path in root.rglob('*'):
        # Skip directories
        if file_path.is_dir():
            # Check exclude folders
            if any(exclude in file_path.parts for exclude in exclude_dirs):
                continue
            continue

        filename = file_path.name
        task_id = extract_task_id(filename)

        if task_id:
            rel_path = str(file_path.relative_to(root)).replace('\\', '/')  # Convert Windows path
            file_mapping[task_id].append({
                "filename": filename,
                "path": rel_path,
                "ext": file_path.suffix
            })
            task_count[task_id] += 1
            file_count += 1

    print(f"[OK] Found {file_count} files")
    print(f"[OK] Indexed {len(file_mapping)} Task IDs")
    print("-" * 60)

    # Display files by Task ID
    for task_id in sorted(file_mapping.keys()):
        count = task_count[task_id]
        files = file_mapping[task_id]
        print(f"  {task_id}: {count} files")
        for f in files[:3]:  # Show first 3
            print(f"    - {f['filename']}")
        if count > 3:
            print(f"    ... +{count - 3} more")

    return dict(file_mapping)

def save_mapping_json(mapping, output_path):
    """매핑을 JSON 파일로 저장"""
    output = {
        "generated_at": "2025-11-04",
        "version": "1.0",
        "file_mapping": mapping,
        "summary": {
            "total_tasks": len(mapping),
            "total_files": sum(len(v) for v in mapping.values()),
            "tasks": {task_id: len(files) for task_id, files in mapping.items()}
        }
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] Mapping saved: {output_path}")
    return output_path

if __name__ == "__main__":
    # Project root
    project_root = "C:\\Development_PoliticianFinder_copy\\Developement_Real_PoliticianFinder"

    # Build mapping
    mapping = build_file_mapping(project_root)

    # Save JSON
    output_file = "C:\\Development_PoliticianFinder_copy\\Developement_Real_PoliticianFinder\\0-5_Development_ProjectGrid\\action\\PROJECT_GRID\\grid\\file_mapping.json"
    save_mapping_json(mapping, output_file)

    print("\n[COMPLETE] File mapping completed!")
    print(f"[OUTPUT] Saved to: {output_file}")
