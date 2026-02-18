# -*- coding: utf-8 -*-
"""
V40 Phase Status Tracker - 규칙 준수 강제 시스템

3가지 보완 기능:
1. Phase 상태 추적 (파일 기반) - 각 Phase 완료를 기록
2. Gate Check - 다음 Phase 시작 전 선행 Phase 완료 여부 확인
3. Pre-flight Check - 전체 상태를 한눈에 확인

사용법:
    # Phase 완료 기록
    from phase_tracker import mark_phase_done
    mark_phase_done('37e39502', '2', '719개 유효, 49개 삭제')

    # Gate Check (다음 Phase 시작 전)
    from phase_tracker import require_phase_gate
    require_phase_gate('37e39502', '3')  # Phase 3 시작 전 2-2 완료 확인

    # 전체 상태 출력
    from phase_tracker import print_status
    print_status('37e39502')
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

# Phase 상태 파일 저장 디렉토리 (V40/.phase_status/)
V40_DIR = Path(__file__).resolve().parent.parent.parent
PHASE_STATUS_DIR = V40_DIR / '.phase_status'

# Phase 순서 정의
PHASE_ORDER = ['0', '1', '2', '2-2', '3', '4', '5']

# Phase 한글명
PHASE_NAMES = {
    '0': '정치인 등록',
    '1': '데이터 수집',
    '2': '데이터 검증 (validate)',
    '2-2': '검증 후 조정 (adjust)',
    '3': 'AI 평가',
    '4': '점수 계산',
    '5': '보고서 생성'
}

# Phase별 선행 조건 (이 Phase들이 모두 DONE이어야 시작 가능)
PHASE_PREREQUISITES = {
    '0': [],
    '1': ['0'],
    '2': ['0', '1'],
    '2-2': ['0', '1', '2'],
    '3': ['0', '1', '2', '2-2'],
    '4': ['0', '1', '2', '2-2', '3'],
    '5': ['0', '1', '2', '2-2', '3', '4'],
}


def _get_status_file(politician_id: str) -> Path:
    """정치인별 Phase 상태 파일 경로"""
    PHASE_STATUS_DIR.mkdir(parents=True, exist_ok=True)
    return PHASE_STATUS_DIR / f'{politician_id}.json'


def load_status(politician_id: str) -> dict:
    """Phase 상태 로드

    Returns:
        {
            "politician_id": "37e39502",
            "politician_name": "오준환",
            "phases": {
                "0": {"status": "DONE", "completed_at": "...", "details": "..."},
                "2": {"status": "DONE", ...},
                ...
            }
        }
    """
    path = _get_status_file(politician_id)
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'politician_id': politician_id, 'phases': {}}


def save_status(politician_id: str, data: dict):
    """Phase 상태 저장"""
    path = _get_status_file(politician_id)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def mark_phase_done(politician_id: str, phase: str, details: str = '', politician_name: str = ''):
    """Phase 완료 기록

    Args:
        politician_id: 정치인 ID (8자리 hex)
        phase: Phase 번호 ('0', '1', '2', '2-2', '3', '4', '5')
        details: 완료 상세 정보 (예: '719개 유효, 49개 삭제')
        politician_name: 정치인 이름 (최초 등록 시)
    """
    data = load_status(politician_id)
    if politician_name:
        data['politician_name'] = politician_name
    data['phases'][phase] = {
        'status': 'DONE',
        'completed_at': datetime.now().isoformat(),
        'details': details
    }
    save_status(politician_id, data)


def is_phase_done(politician_id: str, phase: str) -> bool:
    """특정 Phase가 완료되었는지 확인"""
    data = load_status(politician_id)
    phase_data = data.get('phases', {}).get(phase, {})
    return phase_data.get('status') == 'DONE'


def check_phase_gate(politician_id: str, target_phase: str) -> tuple:
    """Gate Check: 선행 Phase 완료 여부 확인

    Args:
        politician_id: 정치인 ID
        target_phase: 시작하려는 Phase 번호

    Returns:
        (ok: bool, message: str, missing_phases: list)
    """
    prereqs = PHASE_PREREQUISITES.get(target_phase, [])
    if not prereqs:
        return True, f'Phase {target_phase}: 선행 조건 없음', []

    data = load_status(politician_id)
    missing = []
    for p in prereqs:
        phase_data = data.get('phases', {}).get(p, {})
        if phase_data.get('status') != 'DONE':
            missing.append(p)

    if missing:
        missing_names = [f"Phase {p} ({PHASE_NAMES.get(p, '')})" for p in missing]
        msg = (
            f"Phase {target_phase} ({PHASE_NAMES.get(target_phase, '')}) 시작 불가!\n"
            f"  미완료 선행 Phase:\n"
        )
        for name in missing_names:
            msg += f"    - {name}\n"
        msg += f"  선행 Phase를 먼저 완료하세요."
        return False, msg, missing

    return True, f'Phase {target_phase}: 모든 선행 조건 충족', []


def require_phase_gate(politician_id: str, target_phase: str):
    """Gate Check 강제 - 미충족 시 프로세스 종료

    평가/점수/보고서 스크립트에서 호출하여
    선행 Phase가 완료되지 않으면 즉시 종료합니다.

    Args:
        politician_id: 정치인 ID
        target_phase: 시작하려는 Phase 번호
    """
    ok, msg, missing = check_phase_gate(politician_id, target_phase)
    if not ok:
        print(f"\n{'='*60}")
        print(f"  PHASE GATE CHECK FAILED")
        print(f"{'='*60}")
        print(msg)
        print(f"{'='*60}\n")
        sys.exit(1)


def print_status(politician_id: str):
    """전체 Phase 상태 출력 (Pre-flight Check)"""

    data = load_status(politician_id)
    name = data.get('politician_name', '(미등록)')

    print(f"\n{'='*60}")
    print(f"  V40 Phase Status: {name} ({politician_id})")
    print(f"{'='*60}")

    for phase in PHASE_ORDER:
        phase_data = data.get('phases', {}).get(phase, {})
        status = phase_data.get('status', 'PENDING')
        completed = phase_data.get('completed_at', '')
        details = phase_data.get('details', '')

        if status == 'DONE':
            marker = '[DONE]'
        else:
            marker = '[    ]'

        phase_name = PHASE_NAMES.get(phase, '')
        line = f"  {marker} Phase {phase:<4} {phase_name:<28}"
        if details:
            line += f" | {details}"
        if completed:
            # 날짜만 표시
            date_str = completed[:10] if len(completed) >= 10 else completed
            line += f" [{date_str}]"

        print(line)

    print(f"{'='*60}\n")


def get_next_phase(politician_id: str) -> str:
    """다음 실행해야 할 Phase 반환

    Returns:
        다음 Phase 번호 (모두 완료면 'ALL_DONE')
    """
    data = load_status(politician_id)
    for phase in PHASE_ORDER:
        phase_data = data.get('phases', {}).get(phase, {})
        if phase_data.get('status') != 'DONE':
            return phase
    return 'ALL_DONE'


def reset_phase(politician_id: str, phase: str):
    """특정 Phase 상태 초기화 (재실행 필요 시)

    해당 Phase 이후의 모든 Phase도 함께 초기화됩니다.

    Args:
        politician_id: 정치인 ID
        phase: 초기화할 Phase 번호
    """
    data = load_status(politician_id)
    phase_idx = PHASE_ORDER.index(phase)

    for p in PHASE_ORDER[phase_idx:]:
        if p in data.get('phases', {}):
            del data['phases'][p]

    save_status(politician_id, data)
