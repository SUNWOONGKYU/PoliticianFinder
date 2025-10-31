#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
작업지시서 자동 생성 스크립트
generated_grid_full_v4.json에서 데이터를 읽어 각 작업마다 작업지시서(.md) 생성
"""

import json
import os
from pathlib import Path

def create_instruction_file(task, output_dir):
    """
    단일 작업에 대한 작업지시서 생성

    Args:
        task: 작업 데이터 dict
        output_dir: 출력 디렉토리
    """
    task_id = task['task_id']
    file_path = output_dir / f"{task_id}.md"

    # Area 이름 매핑
    area_names = {
        'O': 'DevOps',
        'D': 'Database',
        'BI': 'Backend Infrastructure',
        'BA': 'Backend APIs',
        'F': 'Frontend',
        'T': 'Test'
    }

    area_name = area_names.get(task['area'], task['area'])

    content = f"""# 작업지시서: {task_id}

## 📋 기본 정보

- **작업 ID**: {task_id}
- **업무명**: {task['task_name']}
- **Phase**: Phase {task['phase']}
- **Area**: {area_name} ({task['area']})
- **서브 에이전트**: {task['assigned_agent']}
- **작업 방식**: {task['work_mode']}

---

## 🎯 작업 목표

{task['task_name']} 작업을 완료하여 프로젝트의 {area_name} 영역 개발을 진행합니다.

---

## 🔧 사용 도구

```
{task['tools']}
```

---

## 🔗 의존성 정보

**의존성 체인**: {task['dependency_chain']}

{f"**블로커**: {task['blocker']}" if task.get('blocker') and task['blocker'] != '없음' else ''}

{f"이 작업을 시작하기 전에 다음 작업이 완료되어야 합니다: {task['dependency_chain']}" if task['dependency_chain'] != '없음' else "이 작업은 의존성이 없어 독립적으로 진행할 수 있습니다."}

---

## 📦 기대 결과물

{task['generated_files']}

---

## 📝 작업 지시사항

### 1. 준비 단계
- 프로젝트 루트 디렉토리에서 작업 시작
- 필요한 도구 및 라이브러리 확인: {task['tools']}
- 의존성이 있는 경우, 해당 작업 완료 확인

### 2. 구현 단계
- {task['task_name']} 기능 구현
- 코드 작성 시 프로젝트의 코딩 컨벤션 준수
- 필요한 파일 생성 및 수정

### 3. 검증 단계
- 작성한 코드의 정상 동작 확인
- 단위 테스트 작성 (해당하는 경우)
- 코드 리뷰 준비

### 4. 완료 단계
- 생성된 파일 목록 확인
- 작업 완료 보고
- 다음 작업으로 진행

---

## 💡 참고사항

{task['remarks']}

---

## ✅ 완료 기준

- [ ] {task['task_name']} 기능이 정상적으로 구현됨
- [ ] 기대 결과물이 모두 생성됨
- [ ] 코드가 정상적으로 빌드/실행됨
- [ ] 작업 완료 후 PROJECT GRID 상태 업데이트

---

**작업지시서 생성일**: 자동 생성됨
**PROJECT GRID Version**: v4.0
"""

    # 파일 작성
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    return file_path

def main():
    """메인 실행 함수"""
    # 경로 설정
    script_dir = Path(__file__).parent
    json_file = script_dir / "generated_grid_full_v4.json"
    output_dir = script_dir / "tasks"

    # 출력 디렉토리 생성
    output_dir.mkdir(exist_ok=True)

    print("=" * 60)
    print("Task Instruction File Generator")
    print("=" * 60)

    # JSON 파일 읽기
    if not json_file.exists():
        print(f"Error: {json_file} not found")
        return

    print(f"\nReading JSON file: {json_file}")
    with open(json_file, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    print(f"Loaded {len(tasks)} tasks")

    # 각 작업마다 작업지시서 생성
    print(f"\nGenerating instruction files...")
    created_count = 0

    for task in tasks:
        try:
            file_path = create_instruction_file(task, output_dir)
            created_count += 1
            if created_count % 10 == 0:
                print(f"   Progress: {created_count}/{len(tasks)} ({created_count*100//len(tasks)}%)")
        except Exception as e:
            print(f"Error [{task.get('task_id', 'UNKNOWN')}]: {e}")

    print(f"\nGeneration complete!")
    print(f"   Created files: {created_count}")
    print(f"   Output directory: {output_dir}")
    print(f"\nFirst 5 files:")

    # 생성된 파일 목록 출력 (처음 5개)
    for i, task_file in enumerate(sorted(output_dir.glob("*.md"))[:5]):
        print(f"   {i+1}. {task_file.name}")

    if created_count > 5:
        print(f"   ... and {created_count - 5} more")

    print("\n" + "=" * 60)
    print("All tasks completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()
