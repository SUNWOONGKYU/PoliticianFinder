#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
작업지시서 자동 생성 스크립트 V2
원본 마크다운에서 직접 파싱하여 상세 내용 포함
"""

import re
from pathlib import Path
from collections import defaultdict

def parse_markdown_directly():
    """원본 마크다운에서 직접 파싱"""

    script_dir = Path(__file__).parent
    md_file = script_dir.parent / "0-4_Development_Plan" / "PoliticianFinder_개발업무_최종.md"

    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')

    tasks = []
    current_phase = 1
    current_area = 'O'
    area_counters = defaultdict(int)

    # Area 매핑
    area_map = {
        'DevOps': 'O',
        'Database': 'D',
        'Backend Infrastructure': 'BI',
        'Backend APIs': 'BA',
        'Backend': 'BA',
        'Frontend': 'F',
        'Test': 'T'
    }

    # Agent 매핑 (다양한 전문 에이전트 사용)
    agent_map = {
        'O': 'devops-troubleshooter',      # DevOps 전문가
        'D': 'database-developer',          # 데이터베이스 개발자
        'BI': 'backend-developer',          # 백엔드 인프라 개발자
        'BA': 'api-designer',               # API 설계 전문가
        'F': 'frontend-developer',          # 프론트엔드 개발자
        'T': 'test-engineer'                # 테스트 엔지니어
    }

    # Tools 매핑 (Claude 도구 포함)
    tools_map = {
        'O': 'Bash/GitHub Actions/Glob/Edit/Write',
        'D': 'Bash/Edit/Write/Supabase CLI',
        'BI': 'Read/Edit/Write/Glob/TypeScript',
        'BA': 'Read/Edit/Write/Grep/TypeScript/Zod',
        'F': 'Read/Edit/Write/Glob/React/TailwindCSS',
        'T': 'Bash/Read/Playwright/Vitest'
    }

    i = 0
    while i < len(lines):
        line = lines[i]

        # Phase 감지
        phase_match = re.match(r'## (\d+)단계\(Phase (\d+)\)', line)
        if phase_match:
            current_phase = int(phase_match.group(2))
            i += 1
            continue

        # Area 감지
        area_match = re.match(r'### (.+?) 영역.* \(([A-Z]+)\)', line)
        if area_match:
            area_name = area_match.group(1)
            for key, code in area_map.items():
                if key in area_name:
                    current_area = code
                    break
            i += 1
            continue

        # 작업 감지
        task_match = re.match(r'(\d+)\.\s+([⚡⬅️]+)\s+\*\*(.+?)\*\*\s+-\s+(.+?)(?:\s+\(←\s*([\d,\s]+)\))?$', line)
        if task_match:
            task_num = int(task_match.group(1))
            task_name = task_match.group(3)
            files = task_match.group(4)
            deps_str = task_match.group(5) if task_match.group(5) else None

            # Task ID 생성
            key = f"P{current_phase}{current_area}"
            area_counters[key] += 1
            task_id = f"{key}{area_counters[key]}"

            # 상세 내용 수집 (다음 줄부터)
            details = []
            i += 1
            while i < len(lines):
                detail_line = lines[i].strip()
                if detail_line and detail_line.startswith('-'):
                    details.append(detail_line[1:].strip())
                    i += 1
                elif detail_line and not detail_line.startswith('#') and not re.match(r'^\d+\.', detail_line):
                    i += 1
                else:
                    break

            # 의존성 변환
            deps = []
            if deps_str:
                dep_nums = [int(d.strip()) for d in deps_str.split(',')]
                # 이전 작업들에서 task_id 찾기
                for dn in dep_nums:
                    for t in tasks:
                        if t['_num'] == dn:
                            deps.append(t['task_id'])
                            break

            task = {
                '_num': task_num,
                'task_id': task_id,
                'task_name': task_name,
                'phase': current_phase,
                'area': current_area,
                'agent': agent_map.get(current_area, 'fullstack-developer'),
                'tools': tools_map.get(current_area, 'Read/Edit/Write/Bash'),
                'files': files,
                'details': details,
                'deps': deps
            }
            tasks.append(task)
            continue

        i += 1

    return tasks

def create_instruction_file_v2(task, output_dir):
    """상세 내용을 포함한 작업지시서 생성"""

    task_id = task['task_id']
    file_path = output_dir / f"{task_id}.md"

    area_names = {
        'O': 'DevOps',
        'D': 'Database',
        'BI': 'Backend Infrastructure',
        'BA': 'Backend APIs',
        'F': 'Frontend',
        'T': 'Test'
    }

    area_name = area_names.get(task['area'], task['area'])

    # 의존성 표시
    if task['deps']:
        dep_str = ', '.join(task['deps'])
        dep_desc = f"이 작업을 시작하기 전에 다음 작업이 완료되어야 합니다: {dep_str}"
    else:
        dep_str = '없음'
        dep_desc = "이 작업은 의존성이 없어 독립적으로 진행할 수 있습니다."

    # 상세 지시사항
    detail_sections = ""
    if task['details']:
        detail_sections = "\n\n**구현해야 할 세부 항목**:\n\n"
        for i, detail in enumerate(task['details'], 1):
            detail_sections += f"{i}. {detail}\n"
        detail_sections += "\n각 항목을 체계적으로 구현하고 테스트하세요."

    content = f"""# 작업지시서: {task_id}

## 📋 기본 정보

- **작업 ID**: {task_id}
- **업무명**: {task['task_name']}
- **Phase**: Phase {task['phase']}
- **Area**: {area_name} ({task['area']})
- **서브 에이전트**: {task['agent']}
- **작업 방식**: AI-Only

---

## 🎯 작업 목표

{task['task_name']} 작업을 완료하여 프로젝트의 {area_name} 영역 개발을 진행합니다.

---

## 🔧 사용 도구

```
{task['tools']}
```

**도구 설명**:
- **Claude 기능 도구**: Read(파일읽기), Edit(파일수정), Write(파일생성), Glob(파일검색), Grep(코드검색), Bash(명령실행)
- **기술 스택**: 프로젝트에 사용되는 프레임워크 및 라이브러리

---

## 🔗 의존성 정보

**의존성 체인**: {dep_str}

{dep_desc}

---

## 📦 기대 결과물

{task['files']}
{detail_sections}
---

## 📝 작업 지시사항

### 1. 준비 단계

- 프로젝트 루트 디렉토리에서 작업 시작
- 필요한 도구 확인: {task['tools']}
- 의존성 작업 완료 확인{''.join([f' ({d})' for d in task['deps']]) if task['deps'] else ''}

### 2. 구현 단계
{detail_sections if detail_sections else f'''
- {task['task_name']} 기능을 구현합니다
- 생성 파일: {task['files']}
- 프로젝트 코딩 컨벤션 준수
- 필요한 경우 추가 파일 생성
'''}

### 3. 검증 단계

- 작성한 코드의 정상 동작 확인
- 타입 체크 및 린트 통과
- 필요한 경우 단위 테스트 작성
- 코드 리뷰 준비

### 4. 완료 단계

- 생성된 파일 목록 확인
- PROJECT GRID 상태 업데이트
- 다음 의존 작업에 영향 확인

---

## ✅ 완료 기준

- [ ] {task['task_name']} 기능이 정상적으로 구현됨
- [ ] 기대 결과물이 모두 생성됨
- [ ] 코드가 정상적으로 빌드/실행됨
- [ ] 타입 체크 및 린트 통과
- [ ] PROJECT GRID 상태 업데이트 완료

---

**작업지시서 생성일**: 자동 생성됨
**PROJECT GRID Version**: v4.0
"""

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    return file_path

def main():
    """메인 실행 함수"""

    script_dir = Path(__file__).parent
    output_dir = script_dir / "tasks"

    print("=" * 80)
    print("Task Instruction File Generator V2")
    print("=" * 80)

    print("\nParsing markdown directly...")
    tasks = parse_markdown_directly()

    print(f"Parsed {len(tasks)} tasks")
    print(f"\nGenerating instruction files...")

    # 기존 파일 삭제
    for old_file in output_dir.glob("*.md"):
        old_file.unlink()

    created_count = 0
    for task in tasks:
        try:
            file_path = create_instruction_file_v2(task, output_dir)
            created_count += 1
            if created_count % 20 == 0:
                print(f"  Progress: {created_count}/{len(tasks)} ({created_count*100//len(tasks)}%)")
        except Exception as e:
            print(f"Error [{task.get('task_id', 'UNKNOWN')}]: {e}")

    print(f"\nGeneration complete!")
    print(f"  Created files: {created_count}")
    print(f"  Output directory: {output_dir}")

    # 샘플 확인
    print(f"\nSample files:")
    for i, task_file in enumerate(sorted(output_dir.glob("*.md"))[:3], 1):
        print(f"  {i}. {task_file.name}")

    print("\n" + "=" * 80)
    print("All tasks completed!")
    print("=" * 80)

if __name__ == "__main__":
    main()
