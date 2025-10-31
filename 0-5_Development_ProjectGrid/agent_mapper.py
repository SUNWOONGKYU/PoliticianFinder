#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Agent Mapper 모듈
중앙 매핑 설정 파일을 읽어서 에이전트 매핑 제공
"""

import json
from pathlib import Path
from typing import Dict, List, Optional

class AgentMapper:
    """에이전트 매핑 관리 클래스"""

    def __init__(self, config_file: Optional[Path] = None):
        if config_file is None:
            config_file = Path(__file__).parent / "agent_mapping_config.json"

        with open(config_file, 'r', encoding='utf-8') as f:
            self.config = json.load(f)

        # 빠른 접근을 위한 캐시
        self._area_to_agent_cache = {}
        self._build_cache()

    def _build_cache(self):
        """매핑 캐시 구축"""
        for rule in self.config['stage1_mapping']['rules']:
            area = rule['area']
            self._area_to_agent_cache[area] = {
                'default': rule['custom_agent'],
                'exceptions': rule.get('exceptions', [])
            }

    def get_custom_agent(self, task_id: str, task_name: str, area: str) -> str:
        """1단계 매핑: Task → Custom Agent"""

        if area not in self._area_to_agent_cache:
            return 'fullstack-developer'  # fallback

        mapping = self._area_to_agent_cache[area]

        # 예외 처리 확인
        for exception in mapping['exceptions']:
            condition = exception['condition']

            # BA 영역: 보안 관련
            if area == 'BA' and ('보안' in task_name or 'security' in task_name.lower()):
                return exception['custom_agent']

            # F 영역: 레이아웃/디자인
            if area == 'F' and task_id in ['P1F1', 'P1F2']:
                return exception['custom_agent']

            # T 영역: Phase 6-7 코드 리뷰
            if area == 'T':
                phase = int(task_id[1])
                if phase >= 6:
                    return exception['custom_agent']

        # 기본 매핑
        return mapping['default']

    def get_builtin_agent(self, custom_agent: str) -> str:
        """2단계 매핑: Custom Agent → Built-in Agent"""
        stage2 = self.config['stage2_mapping']['rules']

        # 각 빌트인 에이전트의 커스텀 에이전트 리스트 확인
        for builtin, info in stage2.items():
            if custom_agent in info['custom_agents']:
                return builtin

        # 기본값
        return 'general-purpose'

    def get_agent_file_path(self, custom_agent: str) -> Path:
        """에이전트 파일 경로 반환"""
        agents_dir = Path(self.config['agent_locations']['project_agents_dir'])
        filename = self.config['agent_locations']['agent_files'].get(
            custom_agent,
            f"{custom_agent}.md"
        )
        return agents_dir / filename

    def get_all_custom_agents(self) -> List[str]:
        """사용 중인 모든 커스텀 에이전트 목록"""
        return self.config['custom_agents']['list']

    def get_all_builtin_agents(self) -> List[str]:
        """모든 빌트인 에이전트 목록"""
        return self.config['builtin_agents']['list']

    def get_statistics(self) -> Dict:
        """에이전트 사용 통계"""
        return self.config['statistics']

    def get_tools_for_area(self, area: str) -> Dict[str, List[str]]:
        """Area별 도구 (Claude Tools + Tech Stack + Skills) 반환"""
        tools_by_area = self.config.get('tools_structure', {}).get('by_area', {})
        return tools_by_area.get(area, {
            'claude_tools': [],
            'tech_stack': [],
            'skills': []
        })

    def get_skills_for_area(self, area: str, task_id: str = "", task_name: str = "") -> List[str]:
        """Area별 Skills 반환 (예외 처리 포함)"""
        skills_rules = self.config.get('skills_mapping', {}).get('rules', {})
        area_rules = skills_rules.get(area, {})

        # 기본 스킬
        skills = area_rules.get('primary_skills', [])

        # 예외 처리
        exceptions = area_rules.get('exceptions', [])
        for exception in exceptions:
            condition = exception.get('condition', '')

            # BA: 보안 관련
            if area == 'BA' and ('보안' in task_name or 'security' in task_name.lower()):
                return exception.get('skills', skills)

            # T: Phase 6-7
            if area == 'T' and task_id:
                phase = int(task_id[1]) if len(task_id) > 1 else 0
                if phase >= 6:
                    return exception.get('skills', skills)

        return skills

    def format_tools_string(self, area: str, task_id: str = "", task_name: str = "") -> str:
        """3요소 통합 도구 문자열 생성: [Claude Tools] / [Tech Stack] / [Skills]"""
        tools = self.get_tools_for_area(area)
        skills = self.get_skills_for_area(area, task_id, task_name)

        claude_tools_str = ", ".join(tools.get('claude_tools', []))
        tech_stack_str = ", ".join(tools.get('tech_stack', []))
        skills_str = ", ".join(skills)

        return f"{claude_tools_str} / {tech_stack_str} / {skills_str}"

    def print_summary(self):
        """매핑 요약 출력"""
        print("="*80)
        print("Agent Mapping Configuration")
        print("="*80)

        print(f"\nVersion: {self.config['version']}")
        print(f"Last Updated: {self.config['last_updated']}")

        print(f"\n[Custom Agents] {self.config['custom_agents']['total']}개")
        for i, agent in enumerate(self.config['custom_agents']['list'], 1):
            count = self.config['statistics']['agent_distribution'].get(agent, 0)
            print(f"  {i}. {agent:30s} ({count:3d} tasks)")

        print(f"\n[Built-in Agents] {self.config['builtin_agents']['total']}개")
        for i, agent in enumerate(self.config['builtin_agents']['list'], 1):
            print(f"  {i}. {agent}")

        print(f"\n[1단계 매핑] Area → Custom Agent")
        for rule in self.config['stage1_mapping']['rules']:
            print(f"  {rule['area']:3s} ({rule['area_name']:25s}) → {rule['custom_agent']}")
            if 'exceptions' in rule:
                for exc in rule['exceptions']:
                    print(f"      └─ 예외: {exc['custom_agent']}")

        print(f"\n[2단계 매핑] Custom Agent → Built-in Agent")
        for builtin, info in self.config['stage2_mapping']['rules'].items():
            if info['custom_agents']:
                print(f"  {builtin}:")
                for agent in info['custom_agents']:
                    print(f"    - {agent}")

        print("\n" + "="*80)


# 싱글톤 인스턴스
_mapper_instance = None

def get_mapper() -> AgentMapper:
    """AgentMapper 싱글톤 인스턴스 반환"""
    global _mapper_instance
    if _mapper_instance is None:
        _mapper_instance = AgentMapper()
    return _mapper_instance


# 편의 함수들
def get_custom_agent(task_id: str, task_name: str, area: str) -> str:
    """Task → Custom Agent"""
    return get_mapper().get_custom_agent(task_id, task_name, area)


def get_builtin_agent(custom_agent: str) -> str:
    """Custom Agent → Built-in Agent"""
    return get_mapper().get_builtin_agent(custom_agent)


def get_agent_file(custom_agent: str) -> Path:
    """에이전트 파일 경로"""
    return get_mapper().get_agent_file_path(custom_agent)


if __name__ == "__main__":
    # 테스트
    mapper = AgentMapper()
    mapper.print_summary()

    print("\n\n[테스트]")
    test_cases = [
        ("P1O1", "프로젝트 초기화", "O"),
        ("P1D1", "인증 스키마", "D"),
        ("P1F1", "전역 레이아웃", "F"),
        ("P2BA11", "정치인 데이터 보안", "BA"),
        ("P6T1", "코드 품질 검증", "T"),
    ]

    for task_id, task_name, area in test_cases:
        custom = get_custom_agent(task_id, task_name, area)
        builtin = get_builtin_agent(custom)
        print(f"\n{task_id} ({task_name})")
        print(f"  Area: {area}")
        print(f"  1단계: {area} → {custom}")
        print(f"  2단계: {custom} → {builtin}")
