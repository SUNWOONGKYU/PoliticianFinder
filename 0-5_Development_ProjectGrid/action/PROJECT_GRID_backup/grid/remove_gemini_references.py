#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gemini 관련 표현 제거 스크립트
Project Grid JSON에서 "2차: Gemini", "Gemini (AI)" 등의 표현을 정리합니다.
"""

import json
import re
import sys
from pathlib import Path

# Windows 콘솔 UTF-8 지원
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def clean_assigned_agent(text):
    """assigned_agent에서 2차 부분 완전 삭제"""
    if not text:
        return text

    # "| 2차: ..." 형태 완전 삭제 (모든 2차 항목)
    text = re.sub(r'\s*\|\s*2차:\s*[^|]*', '', text)
    # "2차: ..." 형태 완전 삭제
    text = re.sub(r'\s*2차:\s*[^\s]*', '', text)

    return text.strip()

def clean_generator(text):
    """generator에서 Gemini 제거하고 Claude로 통일"""
    if not text:
        return text

    if 'Gemini' in text:
        return 'Claude (AI)'
    return text

def clean_status(text):
    """status에서 "2차 검증 중" 등 제거"""
    if not text:
        return text

    # "→ 2차 검증 중" 제거
    text = re.sub(r'\s*→\s*2차\s*검증\s*중', '', text)
    # "1차 완료 → 2차 검증 중" -> "완료"
    text = re.sub(r'1차\s*완료\s*→\s*2차.*', '완료', text)

    return text.strip()

def clean_test_history(text):
    """test_history에서 2차 부분 제거"""
    if not text:
        return text

    # "| 2차: 검증 중" 제거
    text = re.sub(r'\s*\|\s*2차:.*', '', text)

    return text.strip()

def clean_build_result(text):
    """build_result에서 2차 부분 제거"""
    if not text:
        return text

    # "| 2차: 검증 중" 제거
    text = re.sub(r'\s*\|\s*2차:.*', '', text)

    return text.strip()

def clean_modification_history(text):
    """modification_history에서 Gemini 검증 부분 정리"""
    if not text:
        return text

    # 리스트인 경우 처리
    if isinstance(text, list):
        return '\n'.join([clean_modification_history(item) for item in text])

    # "(Gemini 검증)" 제거
    text = re.sub(r'\s*\(Gemini\s*검증\)', '', text)
    # "Gemini" 참고 표현 제거
    text = re.sub(r'Gemini\s*[-:].*?\n', '', text)

    return text.strip()

def remove_gemini_references(input_file, output_file):
    """JSON 파일에서 Gemini 참고 제거"""

    print(f"📖 파일 읽는 중: {input_file}")
    with open(input_file, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    print(f"✏️  총 {len(tasks)}개 작업 처리 중...")

    cleaned_count = 0
    for i, task in enumerate(tasks):
        original = json.dumps(task)

        # 각 필드 정리
        if 'assigned_agent' in task:
            task['assigned_agent'] = clean_assigned_agent(task['assigned_agent'])

        if 'generator' in task:
            task['generator'] = clean_generator(task['generator'])

        if 'status' in task:
            task['status'] = clean_status(task['status'])

        if 'test_history' in task:
            task['test_history'] = clean_test_history(task['test_history'])

        if 'build_result' in task:
            task['build_result'] = clean_build_result(task['build_result'])

        if 'modification_history' in task:
            task['modification_history'] = clean_modification_history(task['modification_history'])

        # 변경 여부 확인
        modified = json.dumps(task)
        if original != modified:
            cleaned_count += 1
            task_id = task.get('task_id', f'Task{i}')
            print(f"  ✓ {task_id} 정리됨")

    print(f"\n✅ {cleaned_count}개 작업 정리 완료")

    print(f"💾 파일 저장 중: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)

    print("✅ 완료!")

if __name__ == '__main__':
    grid_dir = Path(__file__).parent
    input_file = grid_dir / 'generated_grid_full_v4_10agents_with_skills.json'
    output_file = grid_dir / 'generated_grid_full_v4_10agents_with_skills_cleaned.json'

    if not input_file.exists():
        print(f"❌ 파일 없음: {input_file}")
        exit(1)

    remove_gemini_references(input_file, output_file)

    # 원본 백업
    backup_file = grid_dir / f'{input_file.stem}_gemini_backup.json'
    import shutil
    shutil.copy(input_file, backup_file)
    print(f"\n📦 원본 백업: {backup_file}")

    # 정리된 파일로 원본 교체
    import shutil
    shutil.move(output_file, input_file)
    print(f"✅ 원본 파일 교체 완료")
