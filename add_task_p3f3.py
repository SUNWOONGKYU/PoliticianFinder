#!/usr/bin/env python3
import os, sys
from supabase import create_client
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

new_task = {
    "phase": 3,
    "area": "F",
    "task_id": "P3F3",
    "task_name": "status 필드 제거 및 identity/title 분리",
    "instruction_file": "tasks/P3F3.md",
    "assigned_agent": "fullstack-developer",
    "tools": ["Read", "Write", "Edit", "Grep", "Bash"],
    "work_mode": "systematic",
    "dependency_chain": ["P3F2"],
    "progress": 10,
    "status": "진행중",
    "generated_files": [
        "0-5_Development_ProjectGrid/tasks/P3F3.md (작업지시서)",
        "1_Frontend/src/app/politicians/[id]/page.tsx (부분 수정)",
        "향후 추가 예정: API 5개, Frontend 6개"
    ],
    "generator": "Claude Code",
    "duration": "예상 8시간 (5 Phase)",
    "modification_history": None,
    "test_history": "아직 미실행",
    "build_result": "진행중",
    "dependency_propagation": None,
    "blocker": None,
    "validation_result": "진행중",
    "phase_gate_criteria": None,
    "remarks": f"""[{datetime.now().strftime('%Y-%m-%d')}] status 필드 제거 및 identity/title 분리 작업 시작

## 작업 배경
- 현재 status 필드에 '현직 국회의원 (21대)' 처럼 신분과 직책을 결합 저장
- 문제: 신분 변경 시 직책도 변경, 직책 변경 시 신분도 변경됨
- 해결: identity(신분), title(직책)을 독립적인 필드로 분리

## 작업 계획 (5 Phase)
Phase 1: 데이터 마이그레이션 (2h)
- status 값 파싱하여 identity/title 분리
- 마이그레이션 스크립트 작성 및 실행

Phase 2: Backend API 수정 (1.5h)
- GET /api/politicians - 목록 조회
- GET /api/politicians/[id] - 상세 조회
- GET /api/admin/content - 관리자

Phase 3: Frontend 수정 (2.5h)
- 정치인 상세/목록 페이지
- 홈/검색/즐겨찾기 페이지
- 공통 타입 정의

Phase 4: 테스트 및 검증 (1.5h)
- API 테스트, UI 테스트, 통합 테스트

Phase 5: 배포 및 정리 (0.5h)
- Vercel 배포, status 컬럼 삭제

## 현재 진행 상황
- [x] 작업 계획서 작성
- [x] DB 컬럼 추가 (identity, title, gender)
- [x] 관리자 정치인 추가 API 수정
- [ ] 데이터 마이그레이션 스크립트
- [ ] Backend API 수정 (5개)
- [ ] Frontend 수정 (6개)""",
    "created_at": datetime.now().isoformat(),
    "updated_at": datetime.now().isoformat()
}

try:
    result = supabase.table('project_grid_tasks_revised').insert(new_task).execute()
    
    print(f"[OK] Task P3F3 created successfully")
    print(f"  Task name: {new_task['task_name']}")
    print(f"  Phase: {new_task['phase']}")
    print(f"  Status: {new_task['status']}")
    print(f"  Progress: {new_task['progress']}%")
    print(f"  Instruction file: {new_task['instruction_file']}")
    print(f"  Estimated duration: {new_task['duration']}")
except Exception as e:
    print(f"[ERROR] Failed to create task: {str(e)}")
