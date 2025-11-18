# Supabase 프로젝트 그리드 데이터베이스 접근 정보

**작성일**: 2025-11-10
**목적**: 다른 Claude Code 세션에서 Supabase Project Grid 데이터베이스에 접근하기 위한 정보

---

## 🔗 연결 정보

### Supabase 프로젝트
- **Supabase URL**: `https://ooddlafwdpzgxfefgsrx.supabase.co`
- **Service Role Key**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU
```

---

## 📊 테이블 정보

### 테이블명: `project_grid_tasks_revised`

### 주요 컬럼:
- `task_id` (VARCHAR): 작업 ID (예: P1FE1, P2D1, P3BA1 등)
- `task_name` (TEXT): 작업명
- `phase` (INTEGER): Phase 번호 (1~6)
- `area` (VARCHAR): 영역 (FE, BA, D, T, O, AI)
- `status` (VARCHAR): 상태 (대기, 진행중, 완료)
- `progress` (INTEGER): 진행률 (0~100)
- `assigned_agent` (VARCHAR): 담당 에이전트
- `generated_files` (TEXT): 생성된 파일 목록
- `build_result` (VARCHAR): 빌드 결과
- `test_history` (TEXT): 테스트 이력
- `dependency_chain` (TEXT): 의존성 체인
- `tools` (TEXT): 사용 도구/기술
- `duration` (VARCHAR): 작업 소요 시간
- `validation_result` (TEXT): 검증 결과

---

## 🐍 Python 접근 예시

### 설치
```bash
pip install supabase
```

### 기본 연결
```python
from supabase import create_client

url = "https://ooddlafwdpzgxfefgsrx.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(url, key)
```

### 전체 작업 조회
```python
# 모든 작업 가져오기
result = supabase.table('project_grid_tasks_revised').select('*').execute()
tasks = result.data

print(f"총 작업 수: {len(tasks)}")
```

### Phase별 조회
```python
# 특정 Phase 작업 조회
result = supabase.table('project_grid_tasks_revised')\
    .select('*')\
    .eq('phase', 6)\
    .execute()

phase6_tasks = result.data
print(f"Phase 6 작업 수: {len(phase6_tasks)}")
```

### 완료된 작업 조회
```python
# 완료 상태 작업만 조회
result = supabase.table('project_grid_tasks_revised')\
    .select('*')\
    .eq('status', '완료')\
    .execute()

completed_tasks = result.data
print(f"완료된 작업: {len(completed_tasks)}개")
```

### 진행률 통계
```python
# Phase별 진행률 통계
for phase_num in range(1, 7):
    result = supabase.table('project_grid_tasks_revised')\
        .select('task_id, task_name, status, progress')\
        .eq('phase', phase_num)\
        .execute()

    tasks = result.data
    completed = [t for t in tasks if t['status'] == '완료']

    print(f"Phase {phase_num}: {len(completed)}/{len(tasks)} 완료")
```

### 특정 Task 조회
```python
# Task ID로 조회
result = supabase.table('project_grid_tasks_revised')\
    .select('*')\
    .eq('task_id', 'P1FE1')\
    .execute()

task = result.data[0] if result.data else None
if task:
    print(f"Task: {task['task_name']}")
    print(f"Status: {task['status']}")
    print(f"Progress: {task['progress']}%")
```

### Task 업데이트
```python
# Task 상태 업데이트
result = supabase.table('project_grid_tasks_revised')\
    .update({
        'status': '완료',
        'progress': 100,
        'build_result': '✅ 성공'
    })\
    .eq('task_id', 'P1FE1')\
    .execute()
```

---

## 📁 환경 변수 파일 위치

### 로컬 환경 설정
- **파일 경로**: `1_Frontend/.env.local`
- **예시 파일**: `1_Frontend/.env.example` (153 lines)

### .env.local 구조 예시
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ooddlafwdpzgxfefgsrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Keys
OPENAI_API_KEY=your_openai_key_here

# Environment
NODE_ENV=production
```

---

## 🚀 현재 프로젝트 상태

### Phase 승인 현황
- ✅ Phase 1: 승인 완료
- ✅ Phase 2: 승인 완료
- ✅ Phase 3: 승인 완료
- ✅ Phase 4: 승인 완료
- ✅ Phase 5: 승인 완료
- ✅ Phase 6: 승인 완료

### 작업 완료 현황
- **총 작업 수**: 42개
- **완료율**: 100%
- **배포 상태**: ✅ Vercel 프로덕션 배포 완료

### 프로덕션 정보
- **배포 URL**: https://politician-finder.vercel.app/
- **배포 플랫폼**: Vercel
- **상태**: 운영 중

---

## 📋 빠른 접근 스크립트

### 작업 현황 조회 스크립트
```python
#!/usr/bin/env python3
"""
Supabase Project Grid 현황 조회 스크립트
"""

from supabase import create_client

def get_project_status():
    url = "https://ooddlafwdpzgxfefgsrx.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

    supabase = create_client(url, key)

    # 전체 작업 조회
    result = supabase.table('project_grid_tasks_revised').select('*').execute()
    tasks = result.data

    print("=" * 60)
    print("PROJECT GRID 현황")
    print("=" * 60)
    print(f"\n총 작업 수: {len(tasks)}개\n")

    # Phase별 통계
    for phase in range(1, 7):
        phase_tasks = [t for t in tasks if t['phase'] == phase]
        completed = [t for t in phase_tasks if t['status'] == '완료']
        in_progress = [t for t in phase_tasks if t['status'] == '진행중']
        pending = [t for t in phase_tasks if t['status'] == '대기']

        print(f"Phase {phase}: {len(completed)}/{len(phase_tasks)} 완료")
        print(f"  ✅ 완료: {len(completed)}")
        print(f"  🔄 진행중: {len(in_progress)}")
        print(f"  ⏳ 대기: {len(pending)}")
        print()

    # 전체 완료율
    total_completed = [t for t in tasks if t['status'] == '완료']
    completion_rate = (len(total_completed) / len(tasks)) * 100
    print(f"전체 완료율: {completion_rate:.1f}%")
    print("=" * 60)

if __name__ == "__main__":
    get_project_status()
```

---

## 🔍 데이터베이스 스키마 확인

### SQL 쿼리 (Supabase SQL Editor에서 실행)
```sql
-- 테이블 구조 확인
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'project_grid_tasks_revised'
ORDER BY ordinal_position;

-- 전체 작업 수 확인
SELECT COUNT(*) as total_tasks
FROM project_grid_tasks_revised;

-- Phase별 작업 수
SELECT phase, COUNT(*) as task_count
FROM project_grid_tasks_revised
GROUP BY phase
ORDER BY phase;

-- 완료된 작업 수
SELECT status, COUNT(*) as count
FROM project_grid_tasks_revised
GROUP BY status;

-- Area별 작업 분포
SELECT area, COUNT(*) as task_count
FROM project_grid_tasks_revised
GROUP BY area
ORDER BY task_count DESC;
```

---

## 📚 참고 문서

### 내부 문서
- `0-5_Development_ProjectGrid/action/PROJECT_GRID_REVISED/README_REVISED.md`
- `0-5_Development_ProjectGrid/action/PROJECT_GRID_REVISED/docs/manuals/PROJECT_GRID_매뉴얼_V4.0.md`
- `0-5_Development_ProjectGrid/action/PROJECT_GRID_REVISED/docs/manuals/SUPABASE_연동가이드_V4.0.md`

### 외부 링크
- Supabase Python 클라이언트: https://supabase.com/docs/reference/python/introduction
- Supabase Dashboard: https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx

---

## ⚠️ 보안 주의사항

1. **Service Role Key는 절대 공개하지 마세요**
   - 이 키는 모든 RLS(Row Level Security) 정책을 우회합니다
   - 서버 사이드에서만 사용하세요

2. **환경 변수 파일 관리**
   - `.env.local` 파일은 `.gitignore`에 포함되어야 합니다
   - 버전 관리에 절대 포함하지 마세요

3. **접근 제한**
   - 프로덕션 환경에서는 Anon Key 사용
   - Service Role Key는 관리 작업에만 제한적으로 사용

---

**작성일**: 2025-11-10
**작성자**: Claude Code
**용도**: 다른 Claude Code 세션에서 Supabase Project Grid 접근용
