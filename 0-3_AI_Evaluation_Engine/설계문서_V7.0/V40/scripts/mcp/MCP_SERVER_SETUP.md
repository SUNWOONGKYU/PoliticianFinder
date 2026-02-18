# Gemini API MCP Server 설정 가이드

## 🚀 빠른 시작

### 1. 필수 조건

```bash
# Python 패키지 설치
pip install fastmcp google-generativeai

# Gemini API Key 설정
export GEMINI_API_KEY="your-api-key-here"
```

### 2. 서버 실행

```bash
# 개발 모드 (STDIO)
python gemini_api_mcp_server.py

# 프로덕션 모드 (HTTP)
python gemini_api_mcp_server.py --http --port 8000
```

---

## 📱 Claude Code 설정

**파일 위치:** `.claude/config.json`

```json
{
  "mcpServers": {
    "gemini-api": {
      "command": "python",
      "args": [
        "C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/scripts/mcp/gemini_api_mcp_server.py"
      ],
      "env": {
        "GEMINI_API_KEY": "${GEMINI_API_KEY}"
      }
    }
  }
}
```

**환경변수 설정:**

```bash
# Windows (PowerShell)
$env:GEMINI_API_KEY="your-api-key"

# Windows (CMD)
set GEMINI_API_KEY=your-api-key

# Linux/Mac
export GEMINI_API_KEY="your-api-key"
```

**사용 예제:**

```python
# Claude Code에서 Gemini API MCP 서버 호출
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

server_params = StdioServerParameters(
    command="python",
    args=["scripts/mcp/gemini_api_mcp_server.py"]
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()

        result = await session.call_tool(
            "gemini_generate",
            arguments={"prompt": "Hello World!"}
        )
```

---

## 🔮 Gemini CLI 설정

**파일 위치:** `~/.gemini/settings.json`

```json
{
  "mcpServers": {
    "gemini-api": {
      "command": "python",
      "args": [
        "C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/scripts/mcp/gemini_api_mcp_server.py"
      ],
      "env": {
        "GEMINI_API_KEY": "$GEMINI_API_KEY"
      },
      "trust": true,
      "timeout": 60000
    }
  }
}
```

**주요 차이점:**

| 항목 | Claude Code | Gemini CLI |
|------|-------------|------------|
| 환경변수 형식 | `${VAR}` | `$VAR` 또는 `${VAR}` |
| trust 필드 | 없음 | `true` (자동 승인) |
| timeout | 밀리초 | 밀리초 |

**Gemini CLI에서 사용:**

```bash
# Gemini CLI가 MCP 서버 도구 호출
gemini -p "Use the gemini_generate tool to say hello"
```

---

## 🌐 HTTP 모드 설정 (프로덕션)

### Claude Code (HTTP)

```json
{
  "mcpServers": {
    "gemini-api": {
      "url": "http://localhost:8000/sse"
    }
  }
}
```

### Gemini CLI (HTTP)

```json
{
  "mcpServers": {
    "gemini-api": {
      "httpUrl": "http://localhost:8000/mcp",
      "headers": {
        "Authorization": "Bearer optional-token"
      },
      "trust": true
    }
  }
}
```

### 서버 실행 (프로덕션)

```bash
# Gunicorn으로 실행 (권장)
gunicorn -k uvicorn.workers.UvicornWorker \
  --workers 9 \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --env GEMINI_API_KEY="your-key" \
  gemini_api_mcp_server:app
```

---

## 🔧 도구 (Tools) 목록

### 1. `gemini_generate`

**설명:** 텍스트 생성

**파라미터:**
- `prompt` (str, 필수): 프롬프트
- `timeout` (int, 선택, 기본값: 60): 타임아웃 (초)
- `temperature` (float, 선택, 기본값: 1.0): 온도 (0.0-2.0)
- `max_output_tokens` (int, 선택, 기본값: 8192): 최대 출력 토큰

**반환:**
```json
{
  "success": true,
  "output": "생성된 텍스트...",
  "error": null
}
```

### 2. `gemini_generate_json`

**설명:** JSON 생성 및 자동 파싱

**파라미터:**
- `prompt` (str, 필수): JSON 요청 프롬프트
- `timeout` (int, 선택): 타임아웃
- `temperature` (float, 선택): 온도
- `max_output_tokens` (int, 선택): 최대 출력 토큰

**반환:**
```json
{
  "success": true,
  "data": { ... },  // 파싱된 JSON
  "raw_output": "...",
  "error": null
}
```

### 3. `gemini_health_check`

**설명:** API 상태 확인

**파라미터:** 없음

**반환:**
```json
{
  "healthy": true,
  "model": "gemini-2.0-flash-exp",
  "api_key_configured": true,
  "error": null
}
```

---

## 📊 성능 비교

| 방식 | 속도 | 비용 | 안정성 |
|------|------|------|--------|
| **Gemini CLI** | 25초/호출 | 무료/저렴 | 보통 |
| **Gemini API** | 2-3초/호출 | $0.0003/호출 | 높음 |

**100명 정치인 (6,000호출) 기준:**
- Gemini CLI: 41시간, 무료
- **Gemini API: 5시간, $2** ← 권장!

---

## 🔐 보안 주의사항

1. **API Key 보호**
   - 절대 코드에 하드코딩하지 마세요
   - 환경변수 사용 권장

2. **Trust 설정**
   - Gemini CLI의 `"trust": true`는 자동 승인
   - 신뢰하는 서버에만 사용

3. **HTTP 모드**
   - 프로덕션에서는 HTTPS 사용
   - 인증 헤더 추가 권장

---

## 🧪 테스트

```bash
# 서버 시작
python gemini_api_mcp_server.py

# 다른 터미널에서 테스트
python test_gemini_api_mcp.py
```

---

## ❓ 문제 해결

### "GEMINI_API_KEY not set" 오류

**해결:**
```bash
export GEMINI_API_KEY="your-key"
```

### "Module not found: google.generativeai"

**해결:**
```bash
pip install google-generativeai
```

### Claude Code에서 서버가 안 보임

**해결:**
1. `.claude/config.json` 경로 확인
2. Claude Code 재시작
3. `command` 경로가 절대 경로인지 확인

### Gemini CLI에서 서버가 안 보임

**해결:**
1. `~/.gemini/settings.json` 경로 확인
2. Gemini CLI 재시작
3. `trust: true` 설정 확인

---

## 📚 참고 문서

- [Gemini CLI MCP 설정](https://geminicli.com/docs/tools/mcp-server/)
- [FastMCP 공식 문서](https://gofastmcp.com/)
- [Gemini API 문서](https://ai.google.dev/gemini-api/docs)

---

## 🎉 완료!

이제 **Claude Code와 Gemini CLI 모두**에서 같은 MCP 서버를 사용할 수 있습니다!

**진정한 "튼튼한 다리"** 🌉
