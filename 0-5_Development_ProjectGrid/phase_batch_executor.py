#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase별 배치 실행기
144개 작업을 Phase별로 배치 실행 (총 7번)
"""

import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict

class PhaseBatchExecutor:
    """Phase별 배치 실행 시스템"""

    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.tasks_file = self.base_dir / "generated_grid_full_v4_10agents_with_skills.json"  # Skills 포함 버전
        self.agents_dir = Path("C:/Development_PoliticianFinder/.claude/agents")
        self.tasks_dir = self.base_dir / "tasks"
        self.output_dir = self.base_dir / "phase_batches"
        self.output_dir.mkdir(exist_ok=True)

        # Agent Mapper 사용
        from agent_mapper import get_mapper
        self.mapper = get_mapper()

    def load_tasks(self) -> List[Dict]:
        """144개 작업 로드"""
        with open(self.tasks_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def group_by_phase(self, tasks: List[Dict]) -> Dict[int, List[Dict]]:
        """Phase별 그룹화"""
        phases = {}
        for task in tasks:
            phase = task['phase']
            if phase not in phases:
                phases[phase] = []
            phases[phase].append(task)
        return phases

    def sort_by_dependency(self, tasks: List[Dict]) -> List[Dict]:
        """의존성 순서로 정렬"""
        sorted_tasks = []
        completed = set()
        remaining = tasks.copy()

        max_rounds = 100
        round_num = 0

        while remaining and round_num < max_rounds:
            round_num += 1
            ready = []

            for task in remaining:
                deps = task.get('dependency_chain', '없음')
                if deps == '없음':
                    ready.append(task)
                else:
                    dep_list = [d.strip() for d in deps.split(',')]
                    if all(d in completed for d in dep_list):
                        ready.append(task)

            if not ready:
                # 의존성 문제
                print(f"  [WARNING] Dependency issue, adding remaining {len(remaining)} tasks")
                sorted_tasks.extend(remaining)
                break

            # 정렬된 목록에 추가
            sorted_tasks.extend(ready)

            # 완료 처리
            for task in ready:
                completed.add(task['task_id'])
                remaining.remove(task)

        return sorted_tasks

    def get_custom_agent(self, task: Dict) -> str:
        """Task → Custom Agent (이미 JSON에 저장되어 있음)"""
        return task.get('assigned_agent', 'fullstack-developer')

    def load_agent_prompt(self, agent_name: str) -> str:
        """Agent 역할 읽기"""
        agent_file = self.agents_dir / f"{agent_name}.md"

        if not agent_file.exists():
            return f"# {agent_name}\n\n전문 개발자 역할을 수행합니다."

        with open(agent_file, 'r', encoding='utf-8') as f:
            return f.read()

    def load_task_instruction(self, task_id: str) -> str:
        """작업 지시서 읽기"""
        instruction_file = self.tasks_dir / f"{task_id}.md"

        if not instruction_file.exists():
            return f"# {task_id}\n\n작업 지시서를 찾을 수 없습니다."

        with open(instruction_file, 'r', encoding='utf-8') as f:
            return f.read()

    def generate_phase_batch_prompt(self, phase: int, tasks: List[Dict]) -> str:
        """Phase별 배치 프롬프트 생성"""

        # Phase 소개
        intro = f"""# Phase {phase} 배치 실행

총 {len(tasks)}개 작업을 순차적으로 수행합니다.

## 실행 규칙

1. **순서 준수**: 아래 작업을 순서대로 실행 (의존성 고려됨)
2. **Agent 역할**: 각 작업마다 지정된 Custom Agent 역할 수행
3. **결과 보고**: 각 작업 완료 후 간단히 보고
4. **계속 진행**: 오류 발생 시에도 가능한 다음 작업 계속

---

"""

        # 각 작업 추가
        task_prompts = []

        for idx, task in enumerate(tasks, 1):
            task_id = task['task_id']
            custom_agent = self.get_custom_agent(task)

            # Agent 역할
            agent_prompt = self.load_agent_prompt(custom_agent)

            # 작업 지시서
            task_instruction = self.load_task_instruction(task_id)

            # 단일 작업 프롬프트
            single_task = f"""
{'='*80}
작업 {idx}/{len(tasks)}: {task_id} - {task['task_name']}
{'='*80}

## Custom Agent 역할

{agent_prompt}

---

## 작업 지시

{task_instruction}

---

## 수행 지침

위 Agent 역할로 작업을 수행하고, 완료 후 다음 형식으로 간단히 보고:

```
✅ {task_id} 완료
- 생성 파일: [파일 목록]
- 주요 내용: [1-2문장]
```

다음 작업으로 진행하세요.

"""
            task_prompts.append(single_task)

        # 전체 결합
        full_prompt = intro + "\n".join(task_prompts)

        # 마무리
        full_prompt += f"""
{'='*80}
Phase {phase} 배치 실행 완료
{'='*80}

## 최종 보고

Phase {phase}의 {len(tasks)}개 작업을 완료했습니다.

완료된 작업 목록:
{chr(10).join([f"- {t['task_id']}: {t['task_name']}" for t in tasks])}

다음 단계: Phase {phase + 1} 실행 준비
"""

        return full_prompt

    def generate_all_phase_batches(self):
        """전체 Phase 배치 생성"""

        print(f"\n{'='*80}")
        print(f"Phase별 배치 프롬프트 생성기")
        print(f"{'='*80}")

        # 작업 로드
        tasks = self.load_tasks()
        print(f"\n[LOAD] {len(tasks)} tasks")

        # Phase별 그룹화
        phases = self.group_by_phase(tasks)
        print(f"[GROUP] {len(phases)} phases")

        # Phase별 배치 생성
        batch_files = []

        for phase in sorted(phases.keys()):
            phase_tasks = phases[phase]

            print(f"\n{'#'*80}")
            print(f"# Phase {phase}: {len(phase_tasks)} tasks")
            print(f"{'#'*80}")

            # 의존성 순서로 정렬
            sorted_tasks = self.sort_by_dependency(phase_tasks)
            print(f"  [SORT] Dependency order applied")

            # 배치 프롬프트 생성
            batch_prompt = self.generate_phase_batch_prompt(phase, sorted_tasks)
            print(f"  [GEN] Prompt length: {len(batch_prompt):,} chars")

            # 파일 저장
            batch_file = self.output_dir / f"Phase_{phase}_batch.txt"
            with open(batch_file, 'w', encoding='utf-8') as f:
                f.write(batch_prompt)

            print(f"  [SAVE] {batch_file.name}")

            # 메타데이터 저장
            meta_file = self.output_dir / f"Phase_{phase}_meta.json"
            meta_data = {
                'phase': phase,
                'task_count': len(sorted_tasks),
                'task_ids': [t['task_id'] for t in sorted_tasks],
                'prompt_length': len(batch_prompt),
                'generated_at': datetime.now().isoformat()
            }

            with open(meta_file, 'w', encoding='utf-8') as f:
                json.dump(meta_data, f, ensure_ascii=False, indent=2)

            batch_files.append({
                'phase': phase,
                'tasks': len(sorted_tasks),
                'file': str(batch_file),
                'size': len(batch_prompt)
            })

        # 실행 가이드 생성
        self.generate_execution_guide(batch_files)

        print(f"\n\n{'='*80}")
        print(f"배치 생성 완료!")
        print(f"{'='*80}")
        print(f"출력 디렉토리: {self.output_dir}")
        print(f"\n다음 단계:")
        print(f"1. phase_batches/EXECUTION_GUIDE.md 읽기")
        print(f"2. Phase 1 배치 실행")
        print(f"3. Phase 2~7 순차 실행")
        print(f"{'='*80}")

    def generate_execution_guide(self, batch_files: List[Dict]):
        """실행 가이드 생성"""

        guide = f"""# Phase별 배치 실행 가이드

**생성일**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**총 Phase**: {len(batch_files)}개
**총 작업**: {sum(b['tasks'] for b in batch_files)}개

---

## 📚 실행 개요

144개 작업을 7개 Phase로 나누어 배치 실행합니다.
각 Phase는 하나의 큰 프롬프트로 통합되었습니다.

---

## 🚀 실행 방법

### 1단계: Phase 1 실행

```
1. Phase_1_batch.txt 파일 열기
2. 전체 내용 복사
3. Claude에게 붙여넣기
4. 완료 대기 (약 20~30분 예상)
```

### 2단계: Phase 2 실행

Phase 1 완료 후:
```
1. Phase_2_batch.txt 파일 열기
2. 전체 내용 복사
3. Claude에게 붙여넣기
4. 완료 대기
```

### 3~7단계: 나머지 Phase 실행

동일한 방법으로 Phase 3~7 순차 실행

---

## 📊 Phase별 정보

"""

        for batch in batch_files:
            guide += f"""
### Phase {batch['phase']}
- **작업 수**: {batch['tasks']}개
- **프롬프트 크기**: {batch['size']:,} 문자
- **파일**: `{Path(batch['file']).name}`
- **예상 시간**: {batch['tasks'] * 2}~{batch['tasks'] * 3}분

"""

        guide += """
---

## ⚠️ 주의사항

1. **순서 준수**: Phase 1 → 2 → ... → 7 순서대로 실행
2. **완료 확인**: 각 Phase 완료 후 다음 Phase 시작
3. **오류 처리**: 오류 발생 시 해당 작업 건너뛰고 계속 진행
4. **중단/재개**: 중단 시 해당 Phase부터 다시 시작

---

## 💡 팁

- **복사 방법**: Ctrl+A (전체 선택) → Ctrl+C (복사)
- **붙여넣기**: Claude 입력창에 Ctrl+V
- **진행 확인**: 각 작업마다 "✅ 완료" 메시지 확인
- **휴식**: Phase 사이에 잠시 휴식 권장

---

## 📝 실행 로그

실행하면서 아래에 기록하세요:

- [ ] Phase 1: 실행 시작 __________ / 완료 __________
- [ ] Phase 2: 실행 시작 __________ / 완료 __________
- [ ] Phase 3: 실행 시작 __________ / 완료 __________
- [ ] Phase 4: 실행 시작 __________ / 완료 __________
- [ ] Phase 5: 실행 시작 __________ / 완료 __________
- [ ] Phase 6: 실행 시작 __________ / 완료 __________
- [ ] Phase 7: 실행 시작 __________ / 완료 __________

---

**생성 도구**: phase_batch_executor.py
**버전**: 1.0
"""

        guide_file = self.output_dir / "EXECUTION_GUIDE.md"
        with open(guide_file, 'w', encoding='utf-8') as f:
            f.write(guide)

        print(f"\n[GUIDE] {guide_file.name} 생성 완료")


def main():
    executor = PhaseBatchExecutor()
    executor.generate_all_phase_batches()


if __name__ == "__main__":
    main()
