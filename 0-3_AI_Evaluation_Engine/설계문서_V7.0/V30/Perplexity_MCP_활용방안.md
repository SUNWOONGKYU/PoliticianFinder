# Perplexity MCP 서버 활용 방안

**작성일**: 2026-01-20
**목적**: V30에서 Perplexity를 저렴하게 활용하는 방법 조사

---

## 핵심 발견사항

✅ **Perplexity MCP 서버 존재함!**
✅ **2가지 옵션: API 기반 (유료) vs 브라우저 자동화 (무료)**
✅ **Claude Code에서 바로 사용 가능!**

---

## 옵션 1: 공식 Perplexity MCP 서버 (API 기반)

### 개요

- **제공**: Perplexity AI 공식
- **방식**: Perplexity API 호출
- **비용**: API 요금 발생 (직접 API 호출과 동일)

### 비용

```
모델별 가격:
- Sonar: $1.00/1M input tokens (가장 저렴)
- Sonar Pro: $3.00/1M input tokens
- Sonar Reasoning: $5-15/1M tokens

추가 비용:
- Request fee: $5-14/1,000 requests (모델에 따라)

구독자 혜택:
- Pro/Max/Enterprise: 월 $5 API 크레딧 제공
```

### 설치 방법

#### 1. Claude Code CLI 사용 (권장)

```bash
claude mcp add perplexity --env PERPLEXITY_API_KEY="your_key_here" -- npx -y @perplexity-ai/mcp-server
```

#### 2. 수동 설정

**Config 파일 위치:**
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Config 내용:**

```json
{
  "mcpServers": {
    "perplexity": {
      "command": "npx",
      "args": ["-y", "@perplexity-ai/mcp-server"],
      "env": {
        "PERPLEXITY_API_KEY": "pplx-xxxxxx"
      }
    }
  }
}
```

### 제공 기능

1. **웹 검색** (`web_search`)
   - Perplexity Search API 직접 호출
   - 결과: 제목, URL, 스니펫, 메타데이터

2. **대화형 AI** (`conversational_ai`)
   - sonar-pro 모델 사용
   - 실시간 웹 검색 기반 대화

3. **심층 연구** (`deep_research`)
   - sonar-deep-research 모델 사용
   - 인용과 함께 상세 분석

4. **고급 추론** (`advanced_reasoning`)
   - sonar-reasoning-pro 모델 사용
   - 문제 해결 및 추론

### 장단점

**장점:**
- ✅ 공식 지원, 안정적
- ✅ Claude Desktop/Code에서 바로 사용
- ✅ 4가지 도구 제공
- ✅ 고품질 검색 결과

**단점:**
- ❌ API 요금 발생 (직접 API와 동일)
- ❌ MCP 사용이 비용 절감 효과 없음

---

## 옵션 2: 브라우저 자동화 MCP 서버 (무료)

### 개요

- **제공**: wysh3 (커뮤니티)
- **방식**: Perplexity 웹사이트 브라우저 자동화
- **비용**: **무료** (API 키 불필요)

### 특징

```
✅ Keyless: API 키 불필요
✅ Cost-free: 완전 무료
✅ Local processing: 로컬에서 처리
✅ SQLite history: 검색 기록 저장
```

### 설치

#### GitHub 저장소

```bash
git clone https://github.com/wysh3/perplexity-mcp-zerver.git
cd perplexity-mcp-zerver
npm install
```

#### Config 설정

```json
{
  "mcpServers": {
    "perplexity-browser": {
      "command": "node",
      "args": ["/path/to/perplexity-mcp-zerver/index.js"]
    }
  }
}
```

### 동작 방식

1. Playwright로 Perplexity 웹사이트 접속
2. 브라우저에서 검색 실행
3. 결과를 파싱해서 반환
4. SQLite에 기록 저장

### 장단점

**장점:**
- ✅ **완전 무료** (API 비용 없음)
- ✅ Perplexity Pro 계정만 있으면 됨
- ✅ 로컬에서 완전 제어

**단점:**
- ❌ 비공식, 안정성 낮음
- ❌ 웹사이트 구조 변경 시 작동 중단 가능
- ❌ 브라우저 자동화로 느림
- ❌ Perplexity 이용약관 위반 가능성

---

## V30 통합 시나리오

### 시나리오 1: 공식 MCP (추천)

```python
# collect_v30.py에 추가

def call_perplexity_mcp(category_name, politician_name):
    """Perplexity MCP를 통한 수집"""

    # Claude Code에서 MCP tool 호출
    # (직접 API 호출 대신 MCP tool 사용)

    prompt = build_search_prompt(category_name, politician_name)

    # MCP tool: perplexity_web_search
    result = mcp_tool_call(
        tool="perplexity_web_search",
        query=prompt
    )

    return result
```

**비용 절감 효과:**
- ❌ 없음 (API 요금 동일)

**장점:**
- ✅ Claude Code에서 직접 사용 가능
- ✅ 코드 통합 간편

### 시나리오 2: 브라우저 자동화 (무료)

```python
# collect_v30.py에 추가

def call_perplexity_browser(category_name, politician_name):
    """브라우저 자동화 MCP를 통한 수집"""

    prompt = build_search_prompt(category_name, politician_name)

    # MCP tool: perplexity_browser_search
    result = mcp_tool_call(
        tool="perplexity_browser_search",
        query=prompt
    )

    return result
```

**비용 절감 효과:**
- ✅ **100% 무료**

**주의사항:**
- ⚠️ 안정성 낮음
- ⚠️ 이용약관 확인 필요

---

## 비용 비교

### 1,000개 데이터 수집 기준

#### 직접 API 호출

```
모델: Sonar ($1/1M tokens)
평균 input: 500 tokens/request
평균 output: 2,000 tokens/response

비용:
- Input: 1,000 × 500 = 500K tokens = $0.50
- Output: 1,000 × 2,000 = 2M tokens = $2.00
- Request fee: 1,000 requests × $5/1K = $5.00

총 비용: $7.50
```

#### MCP API (공식)

```
동일: $7.50
(MCP는 API 래퍼일 뿐, 비용 동일)
```

#### MCP 브라우저 자동화

```
총 비용: $0 (완전 무료)
```

---

## 권장사항

### 프로덕션 환경

**→ 공식 Perplexity MCP 서버 (API 기반)**

**이유:**
- 안정적
- 공식 지원
- Claude Code와 완벽 통합
- 품질 보장

**비용 최적화 방법:**
1. Perplexity Pro 가입 → 월 $5 크레딧 활용
2. Sonar 모델 사용 ($1/1M tokens)
3. 중복 제거로 요청 수 최소화

### 테스트/개발 환경

**→ 브라우저 자동화 MCP (무료)**

**이유:**
- 무료
- 프로토타입에 적합
- 소규모 테스트용

**주의:**
- 프로덕션 사용 비추천
- 안정성 문제 가능

---

## 다음 단계

### 1단계: MCP 서버 설치 테스트

```bash
# 공식 MCP 설치
claude mcp add perplexity --env PERPLEXITY_API_KEY="pplx-xxxxx"

# 또는 브라우저 자동화 MCP
git clone https://github.com/wysh3/perplexity-mcp-zerver.git
```

### 2단계: 테스트 스크립트 작성

```python
# test_perplexity_mcp.py
"""Perplexity MCP 연동 테스트"""

def test_mcp_search():
    query = "조은희 의원 최근 뉴스 2024-2026"

    # MCP tool 호출
    result = call_perplexity_mcp(query)

    print(result)

if __name__ == "__main__":
    test_mcp_search()
```

### 3단계: V30 통합

```python
# collect_v30.py 수정
# Perplexity를 제5의 AI로 추가

AIS = {
    'Claude': call_claude_with_websearch,
    'ChatGPT': call_chatgpt,
    'Grok': call_grok,
    'Gemini': call_gemini_with_search,
    'Perplexity': call_perplexity_mcp  # ← 추가
}
```

---

## 결론

### MCP는 비용 절감 방법이 아님 (API 기반)

- 공식 Perplexity MCP = API 래퍼
- 비용은 직접 API 호출과 동일
- 장점은 "통합 편의성"이지 "비용 절감" 아님

### 진짜 무료 옵션: 브라우저 자동화

- wysh3의 MCP 서버 = 완전 무료
- 하지만 안정성 낮음
- 프로덕션 비추천

### 최종 권장

**프로덕션: 공식 MCP + Sonar 모델 + Pro 크레딧**
- 안정적이고 저렴함 ($7.50/1,000개)
- Claude Code와 완벽 통합

**테스트: 브라우저 자동화 MCP**
- 완전 무료
- 프로토타입용

---

## Sources

- [Perplexity MCP Server - Official Documentation](https://docs.perplexity.ai/guides/mcp-server)
- [GitHub - Official Perplexity MCP Implementation](https://github.com/perplexityai/modelcontextprotocol)
- [Perplexity API Pricing 2026](https://docs.perplexity.ai/getting-started/pricing)
- [Finout - Perplexity Pricing Guide 2026](https://www.finout.io/blog/perplexity-pricing-in-2026)
- [Perplexity MCP Server by wysh3 - Browser Automation](https://glama.ai/mcp/servers/@wysh3/perplexity-mcp-zerver)
- [Claude MCP Server Setup Guide](https://mcpcat.io/guides/adding-an-mcp-server-to-claude-code/)
- [Ultimate Engineer's Guide to Perplexity MCP](https://skywork.ai/skypage/en/ultimate-engineers-guide-perplexity-mcp-server/1977930691699478528)

---

**최종 업데이트**: 2026-01-20
