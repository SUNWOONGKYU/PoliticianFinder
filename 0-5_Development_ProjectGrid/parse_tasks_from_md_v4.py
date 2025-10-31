#!/usr/bin/env python3
"""
PROJECT GRID 작업 파싱 스크립트 V4.0
PoliticianFinder_개발업무_최종.md에서 144개 작업 추출 및 21개 속성 자동 생성
"""

import re
import json
from typing import List, Dict, Optional
from datetime import datetime


class TaskParser:
    """마크다운 개발 계획서에서 작업 추출"""

    def __init__(self):
        # V4.0: 6개 영역 매핑
        self.area_map = {
            'DevOps 영역': 'O',
            'DevOps Area': 'O',
            'Database 영역': 'D',
            'Database Area': 'D',
            'Backend Infrastructure 영역': 'BI',
            'Backend Infrastructure Area': 'BI',
            'Backend APIs 영역': 'BA',
            'Backend APIs Area': 'BA',
            'Backend 영역': 'BA',  # 호환성
            'Backend Area': 'BA',
            'Frontend 영역': 'F',
            'Frontend Area': 'F',
            'Test 영역': 'T',
            'Test Area': 'T',
            'Security 영역': 'S',
            'Security Area': 'S',
        }

        # V4.0: 영역별 담당 Agent (다양한 전문 에이전트)
        self.agent_map = {
            'O': 'devops-troubleshooter',      # DevOps 전문가
            'D': 'database-developer',          # 데이터베이스 개발자
            'BI': 'backend-developer',          # 백엔드 인프라 개발자
            'BA': 'api-designer',               # API 설계 전문가
            'F': 'frontend-developer',          # 프론트엔드 개발자
            'T': 'test-engineer',               # 테스트 엔지니어
            'S': 'security-auditor'             # 보안 감사 전문가
        }

        # 기술 스택 (영역별)
        self.tech_stack = {
            'O': 'Next.js/Vercel/GitHub Actions',
            'D': 'Supabase/PostgreSQL',
            'BI': 'Next.js API Routes/Supabase Client',
            'BA': 'Next.js API Routes/Zod',
            'F': 'React/TypeScript/Tailwind CSS',
            'T': 'Playwright/Vitest',
            'S': 'DOMPurify/Rate Limiting'
        }

        self.tasks = []
        self.current_phase = 1
        self.current_area = 'O'
        self.area_counters = {}  # Phase별 Area별 카운터

    def parse_file(self, file_path: str) -> List[Dict]:
        """마크다운 파일 파싱"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        lines = content.split('\n')

        for i, line in enumerate(lines):
            # Phase 감지
            phase_match = re.match(r'## (\d+)단계\(Phase (\d+)\)', line)
            if phase_match:
                self.current_phase = int(phase_match.group(2))
                print(f"[Phase {self.current_phase}] 시작")
                continue

            # Area 감지
            area_match = re.match(r'### (.+?) \(([A-Z]+)\)', line)
            if area_match:
                area_name = area_match.group(1)
                for key, code in self.area_map.items():
                    if key in area_name:
                        self.current_area = code
                        print(f"  [Area {self.current_area}] {area_name}")
                        break
                continue

            # 작업 감지
            task_match = re.match(r'(\d+)\.\s+([⚡⬅️]+)\s+\*\*(.+?)\*\*\s+-\s+(.+?)(?:\s+\(←\s*([\d,\s]+)\))?$', line)
            if task_match:
                task_num = int(task_match.group(1))
                icon = task_match.group(2)
                task_name = task_match.group(3)
                files = task_match.group(4)
                deps = task_match.group(5) if task_match.group(5) else None

                # 설명 수집 (다음 줄부터 공백이 아닌 줄까지)
                description = []
                j = i + 1
                while j < len(lines):
                    desc_line = lines[j].strip()
                    if desc_line and desc_line.startswith('-'):
                        description.append(desc_line[1:].strip())
                        j += 1
                    elif desc_line and not desc_line.startswith('#') and not re.match(r'^\d+\.', desc_line):
                        # 추가 설명
                        j += 1
                    else:
                        break

                task = self._create_task(
                    task_num,
                    task_name,
                    files,
                    deps,
                    description
                )
                self.tasks.append(task)

        return self.tasks

    def _create_task(self, task_num: int, task_name: str, files: str,
                     deps: Optional[str], description: List[str]) -> Dict:
        """작업 객체 생성 (21개 속성)"""

        # Task ID 생성: P{Phase}{Area}{AreaNumber}
        key = f"P{self.current_phase}{self.current_area}"
        if key not in self.area_counters:
            self.area_counters[key] = 0
        self.area_counters[key] += 1
        area_num = self.area_counters[key]

        task_id = f"P{self.current_phase}{self.current_area}{area_num}"

        # 의존성 변환 (숫자 → Task ID)
        dependency_chain = '없음'
        if deps:
            dep_nums = [int(d.strip()) for d in deps.split(',')]
            dependency_chain = ', '.join([self._task_num_to_id(n) for n in dep_nums])

        # Work Mode 결정 (Security는 병렬 가능)
        work_mode = 'AI-Only'
        if self.current_area == 'S':
            work_mode = 'AI-Only (병렬 가능)'

        # Instruction File
        instruction_file = f'tasks/{task_id}.md'

        # 작업 설명 조합
        remarks = ' / '.join(description) if description else ''

        # 21개 속성
        task = {
            # 【그리드 좌표】(2개)
            'phase': self.current_phase,
            'area': self.current_area,

            # 【작업 기본 정보】(9개)
            'task_id': task_id,
            'task_name': task_name,
            'instruction_file': instruction_file,
            'assigned_agent': self.agent_map.get(self.current_area, 'fullstack-developer'),
            'tools': self.tech_stack.get(self.current_area, 'TBD'),
            'work_mode': work_mode,
            'dependency_chain': dependency_chain,
            'progress': 0,
            'status': '대기',

            # 【작업 실행 기록】(4개)
            'generated_files': files,
            'generator': '-',
            'duration': '-',
            'modification_history': '-',

            # 【검증】(5개)
            'test_history': '대기',
            'build_result': '⏳ 대기',
            'dependency_propagation': '⏳ 대기',
            'blocker': '없음',
            'validation_result': '⏳ 대기',

            # 【기타 정보】(1개)
            'remarks': remarks,

            # 메타 정보 (SQL 생성 시 제외)
            '_original_task_num': task_num,
        }

        return task

    def _task_num_to_id(self, task_num: int) -> str:
        """작업 번호 → Task ID 변환"""
        # 이미 파싱된 작업에서 찾기
        for task in self.tasks:
            if task['_original_task_num'] == task_num:
                return task['task_id']

        # 아직 파싱 안 된 경우, 규칙 기반 추정 (Phase 1 작업들)
        # Phase 1: 1-20
        if 1 <= task_num <= 1:
            return f"P1O1"  # DevOps
        elif 2 <= task_num <= 6:
            return f"P1D{task_num - 1}"  # Database
        elif 7 <= task_num <= 8:
            return f"P1BI{task_num - 6}"  # Backend Infrastructure
        elif 9 <= task_num <= 12:
            return f"P1BA{task_num - 8}"  # Backend APIs
        elif 13 <= task_num <= 17:
            return f"P1F{task_num - 12}"  # Frontend
        elif 18 <= task_num <= 18:
            return f"P1S1"  # Security
        elif 19 <= task_num <= 20:
            return f"P1T{task_num - 18}"  # Test
        else:
            # 다른 Phase는 나중에 추가 (현재는 간단히 번호 반환)
            return f"Task{task_num}"

    def generate_sql(self, tasks: List[Dict], table_name: str = 'project_grid_tasks') -> str:
        """Supabase INSERT SQL 생성"""

        sql_lines = [
            f"-- PROJECT GRID 자동 생성 SQL V4.0",
            f"-- 생성 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"-- 작업 수: {len(tasks)}개",
            f"-- 소스: PoliticianFinder_개발업무_최종.md",
            f"",
            f"-- 기존 데이터 삭제 (테스트용)",
            f"-- DELETE FROM {table_name};",
            f"",
            f"INSERT INTO {table_name} (",
            "    phase, area, task_id, task_name, instruction_file,",
            "    assigned_agent, tools, work_mode, dependency_chain,",
            "    progress, status, generated_files, generator, duration,",
            "    modification_history, test_history, build_result,",
            "    dependency_propagation, blocker, validation_result, remarks",
            ") VALUES"
        ]

        for i, task in enumerate(tasks):
            # 값 이스케이프 (메타 정보 제외)
            values = (
                task['phase'],
                f"'{task['area']}'",
                f"'{task['task_id']}'",
                f"'{self._escape_sql(task['task_name'])}'",
                f"'{task['instruction_file']}'",
                f"'{task['assigned_agent']}'",
                f"'{self._escape_sql(task['tools'])}'",
                f"'{task['work_mode']}'",
                f"'{self._escape_sql(task['dependency_chain'])}'",
                task['progress'],
                f"'{task['status']}'",
                f"'{self._escape_sql(task['generated_files'])}'",
                f"'{task['generator']}'",
                f"'{task['duration']}'",
                f"'{task['modification_history']}'",
                f"'{task['test_history']}'",
                f"'{task['build_result']}'",
                f"'{task['dependency_propagation']}'",
                f"'{task['blocker']}'",
                f"'{task['validation_result']}'",
                f"'{self._escape_sql(task['remarks'])}'"
            )

            comma = "," if i < len(tasks) - 1 else ";"
            sql_lines.append(f"({', '.join(map(str, values))}){comma}")

        return '\n'.join(sql_lines)

    def _escape_sql(self, text: str) -> str:
        """SQL 문자열 이스케이프"""
        if not text:
            return ''
        return text.replace("'", "''").replace('\n', ' ')

    def generate_csv(self, tasks: List[Dict]) -> str:
        """CSV 형식 생성"""
        import csv
        from io import StringIO

        output = StringIO()

        # 21개 속성 (메타 정보 제외)
        fieldnames = [
            'phase', 'area', 'task_id', 'task_name', 'instruction_file',
            'assigned_agent', 'tools', 'work_mode', 'dependency_chain',
            'progress', 'status', 'generated_files', 'generator', 'duration',
            'modification_history', 'test_history', 'build_result',
            'dependency_propagation', 'blocker', 'validation_result', 'remarks'
        ]

        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(tasks)

        return output.getvalue()


def main():
    """메인 실행"""

    # 파일 경로
    input_file = "C:/Development_PoliticianFinder/Developement_Real_PoliticianFinder/0-4_Development_Plan/PoliticianFinder_개발업무_최종.md"
    output_dir = "C:/Development_PoliticianFinder/Developement_Real_PoliticianFinder/0-5_Development_ProjectGrid"

    print("=" * 60)
    print("PROJECT GRID V4.0 파싱 시작")
    print("=" * 60)

    # 파싱
    parser = TaskParser()
    tasks = parser.parse_file(input_file)

    print(f"\n[OK] {len(tasks)}개 작업 파싱 완료\n")

    # 통계
    phase_stats = {}
    area_stats = {}
    for task in tasks:
        phase = task['phase']
        area = task['area']

        phase_stats[phase] = phase_stats.get(phase, 0) + 1
        area_stats[area] = area_stats.get(area, 0) + 1

    print("--- Phase별 통계 ---")
    for phase in sorted(phase_stats.keys()):
        print(f"Phase {phase}: {phase_stats[phase]}개")

    print("\n--- Area별 통계 ---")
    area_names = {
        'O': 'DevOps',
        'D': 'Database',
        'BI': 'Backend Infrastructure',
        'BA': 'Backend APIs',
        'F': 'Frontend',
        'T': 'Test',
        'S': 'Security'
    }
    for area in ['O', 'D', 'BI', 'BA', 'F', 'T', 'S']:
        count = area_stats.get(area, 0)
        if count > 0:
            print(f"{area} ({area_names[area]}): {count}개")

    # SQL 생성
    sql = parser.generate_sql(tasks)
    sql_path = f"{output_dir}/generated_grid_full_v4.sql"

    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write(sql)

    print(f"\n[FILE] SQL: {sql_path}")

    # CSV 생성
    csv_output = parser.generate_csv(tasks)
    csv_path = f"{output_dir}/generated_grid_full_v4.csv"

    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        f.write(csv_output)

    print(f"[FILE] CSV: {csv_path}")

    # JSON 생성 (검토용)
    json_path = f"{output_dir}/generated_grid_full_v4.json"
    # 메타 정보 제거
    clean_tasks = []
    for task in tasks:
        clean_task = {k: v for k, v in task.items() if not k.startswith('_')}
        clean_tasks.append(clean_task)

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(clean_tasks, f, ensure_ascii=False, indent=2)

    print(f"[FILE] JSON: {json_path}")

    # 샘플 출력 (처음 5개)
    print(f"\n--- 샘플 작업 (처음 5개) ---")
    for task in tasks[:5]:
        deps = task['dependency_chain'] if task['dependency_chain'] != '없음' else '-'
        print(f"{task['task_id']}: {task['task_name']}")
        print(f"  Phase: {task['phase']}, Area: {task['area']}")
        print(f"  Files: {task['generated_files']}")
        print(f"  Deps: {deps}")
        print()

    # 의존성 검증
    print("--- 의존성 검증 ---")
    missing_deps = []
    task_ids = {task['task_id'] for task in tasks}

    for task in tasks:
        if task['dependency_chain'] != '없음':
            deps = [d.strip() for d in task['dependency_chain'].split(',')]
            for dep in deps:
                if dep.startswith('P') and dep not in task_ids and not dep.startswith('Task'):
                    missing_deps.append((task['task_id'], dep))

    if missing_deps:
        print(f"❌ 누락된 의존성 발견: {len(missing_deps)}개")
        for task_id, dep in missing_deps[:10]:
            print(f"  {task_id} → {dep}")
    else:
        print("✅ 모든 의존성 정상")

    print("\n" + "=" * 60)
    print(f"✅ PROJECT GRID V4.0 생성 완료!")
    print(f"   작업 수: {len(tasks)}개")
    print(f"   SQL: {sql_path}")
    print(f"   CSV: {csv_path}")
    print(f"   JSON: {json_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
