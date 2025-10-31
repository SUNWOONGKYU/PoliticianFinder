#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
144개 작업에 3요소 통합 도구 적용
Claude Tools + Tech Stack + Skills
"""

import json
import re
from pathlib import Path
from agent_mapper import get_mapper

def update_json_with_tools():
    """JSON 파일에 3요소 통합 도구 적용"""

    base_dir = Path(__file__).parent
    json_file = base_dir / "generated_grid_full_v4_10agents.json"

    print("="*80)
    print("3요소 통합 도구 업데이트")
    print("="*80)

    # JSON 로드
    with open(json_file, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    print(f"\n[LOAD] {len(tasks)} tasks")

    mapper = get_mapper()
    updated_count = 0

    for task in tasks:
        task_id = task['task_id']
        task_name = task['task_name']
        area = task['area']

        # 3요소 통합 도구 생성
        new_tools = mapper.format_tools_string(area, task_id, task_name)

        old_tools = task.get('tools', '')
        if old_tools != new_tools:
            task['tools'] = new_tools
            updated_count += 1
            print(f"  [UPDATE] {task_id}")
            print(f"    Old: {old_tools}")
            print(f"    New: {new_tools}")

    # JSON 저장
    output_file = base_dir / "generated_grid_full_v4_10agents_with_skills.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*80}")
    print(f"업데이트 완료!")
    print(f"{'='*80}")
    print(f"총 작업: {len(tasks)}개")
    print(f"업데이트: {updated_count}개")
    print(f"출력 파일: {output_file.name}")
    print(f"{'='*80}")

    return output_file


def update_instruction_files_with_tools():
    """작업지시서 파일 144개에 3요소 통합 도구 적용"""

    base_dir = Path(__file__).parent
    tasks_dir = base_dir / "tasks"
    json_file = base_dir / "generated_grid_full_v4_10agents_with_skills.json"

    print("\n" + "="*80)
    print("작업지시서 144개 도구 섹션 업데이트")
    print("="*80)

    # JSON 로드
    with open(json_file, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    print(f"\n[LOAD] {len(tasks)} tasks from JSON")

    updated_count = 0

    for task in tasks:
        task_id = task['task_id']
        new_tools = task['tools']

        # 작업지시서 파일
        instruction_file = tasks_dir / f"{task_id}.md"

        if not instruction_file.exists():
            print(f"  [SKIP] {task_id}: 파일 없음")
            continue

        # 파일 읽기
        with open(instruction_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # 도구 섹션 찾기 및 교체
        # 패턴: ## 🔧 사용 도구 다음의 ```...``` 블록
        pattern = r'(## 🔧 사용 도구\s*```\s*)([^`]+)(```)'

        match = re.search(pattern, content, re.MULTILINE | re.DOTALL)

        if match:
            old_tools = match.group(2).strip()

            # 새 도구 문자열
            # 형식: Claude Tools / Tech Stack / Skills
            parts = new_tools.split(' / ')
            if len(parts) == 3:
                claude_tools = parts[0]
                tech_stack = parts[1]
                skills = parts[2]

                new_tools_section = f"""[Claude 도구]
{claude_tools}

[기술 스택]
{tech_stack}

[전문 스킬]
{skills}
"""
            else:
                new_tools_section = new_tools

            # 교체
            new_content = re.sub(
                pattern,
                f'\\g<1>{new_tools_section}\\g<3>',
                content,
                flags=re.MULTILINE | re.DOTALL
            )

            # 도구 설명 업데이트
            desc_pattern = r'(\*\*도구 설명\*\*:\s*)(.+?)(\n\n##)'
            desc_text = """- **Claude 도구**: Claude Code의 기본 기능 (Read, Write, Edit, Bash, Glob, Grep 등)
- **기술 스택**: 프로젝트에 사용되는 프레임워크 및 라이브러리
- **전문 스킬**: Anthropic 빌트인 스킬 (.claude/skills/*.md 참조)"""

            new_content = re.sub(
                desc_pattern,
                f'\\g<1>{desc_text}\\g<3>',
                new_content,
                flags=re.MULTILINE | re.DOTALL
            )

            # 파일 저장
            with open(instruction_file, 'w', encoding='utf-8') as f:
                f.write(new_content)

            print(f"  [UPDATE] {task_id}")
            updated_count += 1
        else:
            print(f"  [ERROR] {task_id}: 도구 섹션 없음")

    print(f"\n{'='*80}")
    print(f"업데이트 완료!")
    print(f"{'='*80}")
    print(f"총 파일: {len(tasks)}개")
    print(f"업데이트: {updated_count}개")
    print(f"{'='*80}")


def main():
    """메인 실행"""

    # 1단계: JSON 업데이트
    json_output = update_json_with_tools()

    # 2단계: 작업지시서 업데이트
    update_instruction_files_with_tools()

    print("\n\n" + "="*80)
    print("전체 작업 완료!")
    print("="*80)
    print(f"1. JSON 파일: {json_output.name}")
    print(f"2. 작업지시서: tasks/*.md 144개 파일")
    print(f"\n다음 단계:")
    print(f"1. {json_output.name} 확인")
    print(f"2. 작업지시서 샘플 확인 (P1O1.md, P2BA1.md 등)")
    print(f"3. Phase 배치 파일 재생성 (phase_batch_executor.py)")
    print("="*80)


if __name__ == "__main__":
    main()
