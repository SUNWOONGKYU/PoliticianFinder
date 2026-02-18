# [ARCHIVED] MCP 방식 (미래 사용 예정)

## ⚠️ 현재 상태: 보관됨

**이 폴더의 파일들은 현재 사용하지 않습니다.**

### 사용하지 않는 이유

**성능 문제:**
- Direct subprocess: **27초**
- MCP 방식: **60-120초**
- **2-4배 차이**로 인해 현재는 사용 불가

**오버헤드 분석:**
- MCP 프로토콜: ~5초
- subprocess spawn: ~5초
- stdout 버퍼링: ~20초+
- 총 오버헤드: 30초+ (너무 큼)

### 현재 사용 중인 방식

**Direct Subprocess 방식:**
- `scripts/workflow/collect_gemini_subprocess.py`
- `scripts/workflow/collect_gemini_subprocess_parallel.py`
- `scripts/workflow/evaluate_gemini_subprocess.py`

**패턴:**
```python
import subprocess

result = subprocess.run(
    ['gemini.cmd', '-p', prompt, '--yolo'],
    capture_output=True,
    text=True,
    timeout=600,
    shell=True
)
```

### 이 폴더에 보관된 파일들

1. **gemini_mcp_server_production.py**
   - FastMCP 기반 Gemini CLI 래퍼
   - Windows subprocess 처리
   - 실시간 stdout 읽기
   - 완전한 에러 처리

2. **MCP_SERVER_SETUP.md**
   - MCP 서버 설정 가이드
   - Claude Code 연동 방법
   - STDIO/HTTP 모드 설정

3. **MCP_연구결과.md**
   - Perplexity 연구 결과
   - 성능 분석
   - 비용 구조

### 미래 사용 계획

**전환 조건:**
Gemini CLI가 **공식 MCP 서버 모드**를 지원하고 다음 조건 충족 시:

1. ✅ 응답 시간 < 35초
2. ✅ 안정성 99%+
3. ✅ 공식 지원 (베타 아님)

**전환 시 이점:**
- ✅ 표준화된 인터페이스
- ✅ Claude Code 네이티브 연동
- ✅ 재사용 가능한 구조
- ✅ "고속도로" 인프라

### 고속도로 vs 임시 다리 비유

**현재 (임시 다리)**:
- Direct subprocess 방식
- 매번 프로세스 생성
- 빠르지만 임시 방편

**미래 (고속도로)**:
- MCP 서버 상시 실행
- 한 번 설정하면 영구 사용
- 표준화된 인터페이스

**결론:**
> "고속도로를 지금 건설하면 너무 느리다. 임시 다리가 더 빠르다. 고속도로는 Gemini CLI 공식 지원 시 건설한다."

### 참조 문서

- `../../MCP_TO_SUBPROCESS_MIGRATION_PLAN.md` - 마이그레이션 전체 계획
- `../../README.md` - V40 시스템 개요

---

**보관일**: 2026-02-10
**결정**: Direct Subprocess (임시 다리) 우선
**미래 계획**: MCP (고속도로, CLI 공식 지원 대기)
