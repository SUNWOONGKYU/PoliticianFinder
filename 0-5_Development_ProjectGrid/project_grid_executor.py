#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PROJECT GRID 통합 실행기
144개 작업을 자동으로 순차 실행하는 시스템
"""

import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Set, Optional

class ProjectGridExecutor:
    """PROJECT GRID 자동 실행 시스템"""

    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = base_dir or Path(__file__).parent
        self.tasks_file = self.base_dir / "generated_grid_full_v4.json"
        # 프로젝트 전용 Agent 디렉토리 (홈 디렉토리 아님!)
        self.agents_dir = Path("C:/Development_PoliticianFinder/.claude/agents")
        self.tasks_dir = self.base_dir / "tasks"

        # 1단계 매핑: Area → Custom Agent
        self.agent_mapping = {
            'O': 'devops-troubleshooter',
            'D': 'database-developer',
            'BI': 'backend-developer',
            'BA': 'api-designer',
            'F': 'frontend-developer',
            'T': 'test-engineer'
        }

        # 2단계 매핑: Custom Agent → Built-in Agent
        self.builtin_mapping = {
            'code-reviewer': 'Explore',  # 코드 탐색 필요
            'default': 'general-purpose'  # 나머지 모두
        }

        # 실행 상태
        self.completed_tasks: Set[str] = set()
        self.failed_tasks: List[Dict] = []
        self.execution_log: List[Dict] = []

    def load_tasks(self) -> List[Dict]:
        """144개 작업 로드"""
        print(f"[LOAD] {self.tasks_file}")

        with open(self.tasks_file, 'r', encoding='utf-8') as f:
            tasks = json.load(f)

        print(f"[OK] {len(tasks)} tasks loaded")
        return tasks

    def extract_area_code(self, task_id: str) -> str:
        """Task ID에서 Area 코드 추출

        예: P1BA1 → BA, P2F3 → F
        """
        # P{Phase}{Area}{Number} 형식
        # Area는 영문자로만 구성
        area_part = task_id[2:]  # P1BA1 → BA1
        area_code = ''.join([c for c in area_part if c.isalpha()])
        return area_code

    def get_custom_agent(self, task: Dict) -> str:
        """1단계 매핑: Task → Custom Agent"""
        task_id = task['task_id']
        area_code = self.extract_area_code(task_id)

        custom_agent = self.agent_mapping.get(area_code, 'fullstack-developer')

        print(f"  [1단계] {task_id} (Area: {area_code}) → {custom_agent}")
        return custom_agent

    def get_builtin_agent(self, custom_agent: str) -> str:
        """2단계 매핑: Custom Agent → Built-in Agent"""
        builtin = self.builtin_mapping.get(custom_agent, self.builtin_mapping['default'])

        print(f"  [2단계] {custom_agent} → {builtin}")
        return builtin

    def load_agent_prompt(self, agent_name: str) -> str:
        """Custom Agent .md 파일 읽기"""
        agent_file = self.agents_dir / f"{agent_name}.md"

        if not agent_file.exists():
            print(f"  [WARNING] Agent file not found: {agent_file}")
            return f"# {agent_name}\n\n전문 개발자 역할을 수행합니다."

        with open(agent_file, 'r', encoding='utf-8') as f:
            content = f.read()

        print(f"  [READ] Agent: {agent_file.name} ({len(content)} chars)")
        return content

    def load_task_instruction(self, task_id: str) -> str:
        """작업 지시서 읽기"""
        instruction_file = self.tasks_dir / f"{task_id}.md"

        if not instruction_file.exists():
            print(f"  [ERROR] Instruction file not found: {instruction_file}")
            return f"# {task_id}\n\n작업 지시서를 찾을 수 없습니다."

        with open(instruction_file, 'r', encoding='utf-8') as f:
            content = f.read()

        print(f"  [READ] Instruction: {instruction_file.name} ({len(content)} chars)")
        return content

    def check_dependency(self, task: Dict) -> bool:
        """의존성 체크"""
        deps = task.get('dependency_chain', '없음')

        if deps == '없음':
            return True

        # 의존 작업들이 모두 완료되었는지 확인
        dep_list = [d.strip() for d in deps.split(',')]
        missing_deps = [d for d in dep_list if d not in self.completed_tasks]

        if missing_deps:
            print(f"  [WAIT] Dependencies not ready: {', '.join(missing_deps)}")
            return False

        return True

    def generate_execution_prompt(self, task: Dict, agent_prompt: str, task_instruction: str) -> str:
        """실행 프롬프트 생성 (Agent 역할 + 작업 지시)"""
        return f"""{agent_prompt}

---

## 현재 작업

- **Task ID**: {task['task_id']}
- **Task Name**: {task['task_name']}
- **Area**: {task['area']}
- **Phase**: {task['phase']}
- **Expected Files**: {task.get('generated_files', 'TBD')}

---

## 작업 지시서

{task_instruction}

---

위 역할과 지시사항에 따라 작업을 수행하고, 완료 후 다음을 보고하세요:

1. **생성된 파일**: 실제로 생성한 파일 목록
2. **구현 내용**: 주요 구현 사항 요약
3. **테스트 결과**: 테스트 수행 결과 (통과/실패)
4. **다음 단계**: 후속 작업에 미치는 영향

작업을 시작합니다.
"""

    def prepare_execution(self, task: Dict) -> Dict:
        """작업 실행 준비 (실제 실행은 Claude가 함)"""
        task_id = task['task_id']

        print(f"\n{'='*80}")
        print(f"PREPARE: {task_id} - {task['task_name']}")
        print(f"{'='*80}")

        # 1. Custom Agent 결정
        custom_agent = self.get_custom_agent(task)

        # 2. Built-in Agent 결정
        builtin_agent = self.get_builtin_agent(custom_agent)

        # 3. Agent 역할 로드
        agent_prompt = self.load_agent_prompt(custom_agent)

        # 4. 작업 지시서 로드
        task_instruction = self.load_task_instruction(task_id)

        # 5. 실행 프롬프트 생성
        execution_prompt = self.generate_execution_prompt(
            task, agent_prompt, task_instruction
        )

        # 6. 실행 명령 생성
        execution_command = {
            'task_id': task_id,
            'task_name': task['task_name'],
            'custom_agent': custom_agent,
            'builtin_agent': builtin_agent,
            'execution_prompt': execution_prompt,
            'prompt_length': len(execution_prompt),
            'timestamp': datetime.now().isoformat()
        }

        print(f"  [READY] Prompt length: {len(execution_prompt)} chars")
        print(f"  [READY] Execution prepared")

        return execution_command

    def get_ready_tasks(self, tasks: List[Dict], exclude_completed: bool = True) -> List[Dict]:
        """실행 가능한 작업 목록 (의존성 충족)"""
        ready = []

        for task in tasks:
            task_id = task['task_id']

            # 이미 완료된 작업 제외
            if exclude_completed and task_id in self.completed_tasks:
                continue

            # 의존성 체크
            if self.check_dependency(task):
                ready.append(task)

        return ready

    def generate_batch_execution_script(self, tasks: List[Dict], output_file: str = "execute_tasks.json"):
        """배치 실행 스크립트 생성 (Claude가 읽을 수 있도록)"""

        batch_data = []

        for task in tasks:
            cmd = self.prepare_execution(task)
            batch_data.append({
                'task_id': cmd['task_id'],
                'task_name': cmd['task_name'],
                'custom_agent': cmd['custom_agent'],
                'builtin_agent': cmd['builtin_agent'],
                'prompt_file': f"prompts/{cmd['task_id']}_prompt.txt",
                'timestamp': cmd['timestamp']
            })

            # 프롬프트 파일 저장
            prompts_dir = self.base_dir / "prompts"
            prompts_dir.mkdir(exist_ok=True)

            prompt_file = prompts_dir / f"{cmd['task_id']}_prompt.txt"
            with open(prompt_file, 'w', encoding='utf-8') as f:
                f.write(cmd['execution_prompt'])

        # 배치 데이터 저장
        batch_file = self.base_dir / output_file
        with open(batch_file, 'w', encoding='utf-8') as f:
            json.dump(batch_data, f, ensure_ascii=False, indent=2)

        print(f"\n[BATCH] Generated: {batch_file}")
        print(f"[BATCH] Total tasks: {len(batch_data)}")

        return batch_file

    def run_phase(self, phase: int, tasks: List[Dict]) -> Dict:
        """Phase 단위 실행"""
        print(f"\n\n{'#'*80}")
        print(f"# PHASE {phase}: {len(tasks)} tasks")
        print(f"{'#'*80}")

        phase_tasks = [t for t in tasks if t['task_id'] not in self.completed_tasks]
        phase_completed = 0

        max_rounds = 100  # 무한 루프 방지
        round_num = 0

        while phase_tasks and round_num < max_rounds:
            round_num += 1
            print(f"\n--- Round {round_num} ---")

            # 실행 가능한 작업 찾기
            ready_tasks = self.get_ready_tasks(phase_tasks)

            if not ready_tasks:
                print(f"[BLOCKED] No ready tasks. Remaining: {len(phase_tasks)}")
                break

            print(f"[READY] {len(ready_tasks)} tasks ready to execute")

            # 실행 준비 (실제 실행은 Claude가 해야 함)
            for task in ready_tasks:
                cmd = self.prepare_execution(task)

                # 로그 기록
                self.execution_log.append({
                    'task_id': cmd['task_id'],
                    'phase': phase,
                    'round': round_num,
                    'custom_agent': cmd['custom_agent'],
                    'status': 'prepared',
                    'timestamp': cmd['timestamp']
                })

                # 완료 처리 (실제로는 Claude가 실행 후 완료해야 함)
                # 여기서는 준비만 하므로 completed에 추가하지 않음

                phase_completed += 1

            # 준비된 작업 제거
            phase_tasks = [t for t in phase_tasks if t not in ready_tasks]

        return {
            'phase': phase,
            'total': len(tasks),
            'prepared': phase_completed,
            'remaining': len(phase_tasks)
        }

    def run_all(self):
        """144개 작업 전체 실행 준비"""
        print(f"\n{'='*80}")
        print(f"PROJECT GRID 통합 실행기")
        print(f"{'='*80}")
        print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # 작업 로드
        tasks = self.load_tasks()

        # Phase별로 그룹화
        tasks_by_phase = {}
        for task in tasks:
            phase = task['phase']
            if phase not in tasks_by_phase:
                tasks_by_phase[phase] = []
            tasks_by_phase[phase].append(task)

        print(f"\n[PHASES] {len(tasks_by_phase)} phases detected")
        for phase in sorted(tasks_by_phase.keys()):
            print(f"  Phase {phase}: {len(tasks_by_phase[phase])} tasks")

        # Phase별 실행
        phase_results = []
        for phase in sorted(tasks_by_phase.keys()):
            result = self.run_phase(phase, tasks_by_phase[phase])
            phase_results.append(result)

        # 로그 저장
        log_file = self.base_dir / "execution_log.json"
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(self.execution_log, f, ensure_ascii=False, indent=2)

        # 결과 요약
        print(f"\n\n{'='*80}")
        print(f"실행 준비 완료")
        print(f"{'='*80}")
        print(f"총 작업: {len(tasks)}개")
        print(f"준비 완료: {len(self.execution_log)}개")
        print(f"로그 파일: {log_file}")
        print(f"완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*80}")

        # Phase별 결과
        print(f"\n[Phase Results]")
        for result in phase_results:
            print(f"  Phase {result['phase']}: {result['prepared']}/{result['total']} prepared")

        return {
            'total_tasks': len(tasks),
            'prepared_tasks': len(self.execution_log),
            'phase_results': phase_results,
            'log_file': str(log_file)
        }


def main():
    """메인 실행"""
    executor = ProjectGridExecutor()
    result = executor.run_all()

    print(f"\n\n")
    print(f"다음 단계:")
    print(f"1. execution_log.json에서 준비된 작업 확인")
    print(f"2. prompts/ 디렉토리에서 각 작업의 프롬프트 확인")
    print(f"3. Claude에게 Task tool로 실행 요청")


if __name__ == "__main__":
    main()
