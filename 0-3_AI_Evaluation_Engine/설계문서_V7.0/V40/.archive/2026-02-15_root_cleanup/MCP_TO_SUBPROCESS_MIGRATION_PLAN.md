# V40 MCP → Direct Subprocess Migration Plan

## 결정 배경

**MCP 방식의 문제:**
- Gemini CLI 직접 실행: 27초
- MCP 경유 실행: 60-120+ 초
- 오버헤드 분석: MCP 프로토콜(5초) + subprocess spawn(5초) + stdout 버퍼링(20초+)

**결정:**
- **현재 (임시 다리)**: Direct subprocess 방식 사용
- **미래 (고속도로)**: Gemini CLI가 공식 MCP 서버 모드 지원 시 전환

## Performance 비교

| 방식 | 소요 시간 | 장점 | 단점 |
|------|----------|------|------|
| Direct subprocess | 27초 | 빠름, 간단 | 매번 프로세스 생성 |
| MCP (현재) | 60-120+초 | 표준화, 재사용 | 너무 느림, 불안정 |
| MCP (미래) | 27초 (예상) | 빠름 + 표준화 | CLI 공식 지원 대기 중 |

## 마이그레이션 전략

### Phase 1: Core Scripts (우선순위 높음)
**수정 대상:**
1. `scripts/workflow/collect_gemini_mcp.py` → `collect_gemini_subprocess.py`
2. `scripts/workflow/collect_gemini_mcp_parallel.py` → `collect_gemini_subprocess_parallel.py`
3. `scripts/workflow/evaluate_gemini_mcp.py` → `evaluate_gemini_subprocess.py`
4. `scripts/helpers/gemini_collect_helper.py` (MCP imports 제거)
5. `scripts/helpers/gemini_eval_helper.py` (MCP imports 제거)

**변경 내용:**
```python
# 기존 (MCP)
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        result = await session.call_tool("gemini_generate", ...)

# 신규 (Direct subprocess)
import subprocess

result = subprocess.run(
    ['gemini.cmd', '-p', prompt, '--yolo'],
    capture_output=True,
    text=True,
    timeout=600,
    shell=True,
    encoding='utf-8',
    errors='replace'
)
```

### Phase 2: Documentation (우선순위 높음)
**수정 대상:**
1. `README.md` - V40 시스템 개요
2. `instructions/2_collect/GEMINI_CLI_수집_가이드.md`
3. `instructions/3_evaluate/Gemini_CLI_평가_작업방법.md`
4. `instructions/2_collect/중복방지전략_공통섹션.md`

**추가 내용:**
```markdown
## Gemini CLI 연동 방식

### 현재: Direct Subprocess 방식
- Gemini CLI를 직접 subprocess로 호출
- 평균 응답 시간: 27초
- 구현 방법: `subprocess.run(['gemini.cmd', '-p', prompt, '--yolo'])`

### 미래 계획: MCP 방식
- Gemini CLI가 공식 MCP 서버 모드 지원 시 전환 예정
- 예상 효과: 표준화된 인터페이스 + 현재와 동일한 성능
- 현재는 MCP 오버헤드가 너무 커서 보류 (60-120초 vs 27초)
```

### Phase 3: MCP 관련 파일 처리
**보관 (삭제 X, 미래 참조용):**
- `scripts/mcp/` 폴더 전체
  - `gemini_mcp_server_production.py`
  - `MCP_SERVER_SETUP.md`
  - `MCP_연구결과.md`

**표시 추가:**
```markdown
# [ARCHIVED] MCP 방식 (미래 사용 예정)

현재는 성능 문제로 사용하지 않음.
Gemini CLI 공식 MCP 지원 시 재사용 예정.

성능 비교:
- Direct: 27초
- MCP (현재): 60-120초

보관 이유: 미래 고속도로 건설 시 참조
```

### Phase 4: Orchestration Scripts
**수정 대상:**
1. `scripts/workflow/complete_auto_v40.py`
2. `scripts/workflow/workflow_orchestrator.py` (있다면)

**변경 사항:**
- MCP 서버 시작/종료 코드 제거
- Direct subprocess 호출로 변경
- 에러 처리 단순화

### Phase 5: Test Scripts
**수정/보관:**
1. `test_simple_mcp.py` → ARCHIVED
2. `test_http_mcp.py` → ARCHIVED
3. 새로 작성: `test_gemini_subprocess.py`

## 구현 패턴

### Windows 호환 Subprocess 패턴
```python
import subprocess
import platform

def execute_gemini_cli(prompt: str, timeout: int = 600) -> dict:
    """
    Gemini CLI를 direct subprocess로 실행

    Args:
        prompt: 프롬프트
        timeout: 타임아웃 (초)

    Returns:
        {"success": bool, "output": str, "error": str}
    """
    # Windows에서는 gemini.cmd 사용
    gemini_cmd = 'gemini.cmd' if platform.system() == 'Windows' else 'gemini'

    try:
        result = subprocess.run(
            [gemini_cmd, '-p', prompt, '--yolo'],
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=True,
            encoding='utf-8',
            errors='replace'  # emoji 등 인코딩 에러 방지
        )

        if result.returncode == 0:
            return {
                "success": True,
                "output": result.stdout,
                "error": None
            }
        else:
            return {
                "success": False,
                "output": result.stdout,
                "error": result.stderr
            }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "output": None,
            "error": f"Timeout after {timeout} seconds"
        }

    except Exception as e:
        return {
            "success": False,
            "output": None,
            "error": str(e)
        }
```

### 병렬 수집 패턴 (10개 카테고리)
```python
from concurrent.futures import ProcessPoolExecutor, as_completed

def collect_category(politician_name: str, category: str) -> dict:
    """단일 카테고리 수집"""
    prompt = f"정치인 {politician_name}의 {category} 관련 자료 수집..."
    return execute_gemini_cli(prompt)

def collect_all_categories_parallel(politician_name: str) -> dict:
    """10개 카테고리 병렬 수집"""
    categories = [
        'expertise', 'leadership', 'vision', 'integrity', 'ethics',
        'accountability', 'transparency', 'communication',
        'responsiveness', 'publicinterest'
    ]

    results = {}
    with ProcessPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(collect_category, politician_name, cat): cat
            for cat in categories
        }

        for future in as_completed(futures):
            category = futures[future]
            results[category] = future.result()

    return results
```

## 마이그레이션 체크리스트

### Phase 1: Core Scripts ✅
- [ ] collect_gemini_subprocess.py 작성
- [ ] collect_gemini_subprocess_parallel.py 작성
- [ ] evaluate_gemini_subprocess.py 작성
- [ ] gemini_collect_helper.py 업데이트
- [ ] gemini_eval_helper.py 업데이트

### Phase 2: Documentation ✅
- [ ] README.md 업데이트
- [ ] GEMINI_CLI_수집_가이드.md 업데이트
- [ ] Gemini_CLI_평가_작업방법.md 업데이트
- [ ] 중복방지전략_공통섹션.md 업데이트

### Phase 3: MCP Files ✅
- [ ] scripts/mcp/ 폴더에 [ARCHIVED] 표시
- [ ] 미래 참조용 README 작성

### Phase 4: Orchestration ✅
- [ ] complete_auto_v40.py 업데이트
- [ ] MCP 서버 시작/종료 코드 제거

### Phase 5: Testing ✅
- [ ] test_gemini_subprocess.py 작성
- [ ] 전체 V40 워크플로우 테스트
- [ ] 성능 검증 (평균 27초 유지 확인)

## 성능 목표

| 지표 | 목표 |
|------|------|
| 단일 카테고리 수집 | 25-30초 |
| 10개 카테고리 병렬 수집 | 30-35초 |
| 전체 정치인 평가 (1명) | 5-7분 |
| 25명 배치 처리 | 120-150분 |

## 롤백 계획

만약 subprocess 방식에 문제가 생기면:
1. `scripts/mcp/` 폴더의 코드 복원
2. MCP 서버 재시작
3. 성능은 느려도 안정성 확보

하지만 27초 vs 60-120초 차이는 너무 크므로, subprocess 방식을 우선으로 함.

## 미래 전환 시점

**Gemini CLI가 공식 MCP 서버 모드를 지원하는 경우:**
1. 성능 테스트 (27초 달성 여부)
2. 안정성 확인
3. `scripts/mcp/` 코드 활성화
4. Subprocess 방식 ARCHIVED 처리
5. 문서 업데이트

**조건:**
- MCP 방식 응답 시간 < 35초
- 안정성 99%+ 유지
- 공식 지원 (베타 아님)

---

**작성일**: 2026-02-10
**결정**: Direct Subprocess (임시 다리)
**미래 계획**: MCP (고속도로, CLI 공식 지원 대기)
