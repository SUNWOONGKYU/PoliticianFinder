# Perplexity MCP 조사 결과 최종 보고서

**작성일**: 2026-01-20
**작성자**: Claude Code
**목적**: MCP를 통한 Perplexity 저렴한 활용 가능성 조사

---

## 📋 Executive Summary

### 핵심 발견사항

| 항목 | 결과 | 비고 |
|------|------|------|
| **Perplexity MCP 서버 존재 여부** | ✅ 있음 | 공식 + 커뮤니티 2가지 |
| **MCP 서버 설치 완료** | ✅ 완료 | `claude mcp add perplexity` 성공 |
| **비용 절감 효과** | ❌ 없음 | API 요금 동일 ($7-10/1,000개) |
| **무료 대안 (브라우저 자동화)** | ⚠️ 존재 | 불안정, 프로덕션 비추천 |
| **현재 API 키 상태** | ❌ 무효 | 401 에러 (갱신 필요) |

### 결론

> **Perplexity MCP는 "비용 절감" 방법이 아니라 "통합 편의성" 도구입니다.**
>
> - MCP 사용 ≠ 비용 절감
> - MCP 사용 = Claude Code와 원활한 통합
> - 비용은 직접 API 호출과 동일

---

## 1. Perplexity MCP 서버 조사

### 1.1 공식 Perplexity MCP 서버 (추천)

#### 제공

- **제공사**: Perplexity AI (공식)
- **저장소**: https://github.com/perplexityai/modelcontextprotocol
- **문서**: https://docs.perplexity.ai/guides/mcp-server

#### 특징

```
✅ 공식 지원 (안정적)
✅ 4가지 도구 제공 (web_search, conversational_ai, deep_research, advanced_reasoning)
✅ Claude Desktop/Code 완벽 통합
✅ 실시간 웹 검색 (자체 검색엔진, 독립 크롤링)

❌ API 요금 발생 (직접 API와 동일)
❌ API 키 필수
```

#### 설치 (완료됨)

```bash
# 설치 명령어 (이미 실행됨)
claude mcp add perplexity --env PERPLEXITY_API_KEY="your_key" -- npx -y @perplexity-ai/mcp-server

# 설치 확인
$ claude mcp list
perplexity: npx -y @perplexity-ai/mcp-server - ✓ Connected
```

✅ **현재 상태**: 설치 완료

#### 비용 구조

```
모델별 가격 (2026년 기준):
┌──────────────────┬─────────────┬──────────────┬────────────────┐
│ 모델             │ Input       │ Output       │ Request Fee    │
├──────────────────┼─────────────┼──────────────┼────────────────┤
│ Sonar (권장)     │ $1/1M       │ $1/1M        │ $5/1K requests │
│ Sonar Pro        │ $3/1M       │ $15/1M       │ $5/1K requests │
│ Sonar Reasoning  │ $5/1M       │ $15/1M       │ $14/1K requests│
└──────────────────┴─────────────┴──────────────┴────────────────┘

구독자 혜택:
- Pro/Max/Enterprise 가입 시: 월 $5 API 크레딧 제공
```

#### 1,000개 수집 시 예상 비용 (Sonar 모델)

```
가정:
- 평균 input: 500 tokens/request
- 평균 output: 2,000 tokens/response
- 총 1,000 requests

계산:
Input  = 1,000 × 500 tokens  = 500K tokens  × $1/1M   = $0.50
Output = 1,000 × 2,000 tokens = 2M tokens   × $1/1M   = $2.00
Request= 1,000 requests       × $5/1K requests        = $5.00

총 비용 = $7.50

✅ Pro 가입 시: $7.50 - $5 크레딧 = $2.50/1,000개
```

### 1.2 브라우저 자동화 MCP 서버 (무료, 비추천)

#### 제공

- **제공사**: wysh3 (커뮤니티)
- **저장소**: https://github.com/wysh3/perplexity-mcp-zerver
- **방식**: Playwright로 Perplexity 웹사이트 자동화

#### 특징

```
✅ 완전 무료 (API 키 불필요)
✅ 로컬에서 완전 제어
✅ SQLite 히스토리 저장

❌ 비공식 (안정성 낮음)
❌ 웹사이트 구조 변경 시 작동 중단
❌ 브라우저 자동화로 느림
❌ Perplexity 이용약관 위반 가능성
❌ 프로덕션 사용 비추천
```

#### 평가

```
테스트/개발 환경: ⚠️ 가능 (프로토타입용)
프로덕션 환경: ❌ 비추천 (불안정)
V30 통합: ❌ 비추천 (신뢰성 문제)
```

---

## 2. MCP vs 직접 API 비교

### 2.1 비용 비교

| 방식 | 1,000개 수집 비용 | API 키 | 안정성 | 통합 편의성 |
|------|------------------|--------|--------|------------|
| **직접 API** | $7.50 | 필요 | ✅ 높음 | ⚠️ 보통 |
| **MCP (공식)** | $7.50 | 필요 | ✅ 높음 | ✅ 매우 높음 |
| **MCP (브라우저)** | $0 | 불필요 | ❌ 낮음 | ⚠️ 보통 |

### 2.2 핵심 인사이트

> **MCP는 비용 절감 도구가 아니라 통합 도구입니다.**

```
MCP 장점 (비용 외):
1. Claude Code/Desktop에서 직접 사용 가능
2. 프롬프트만으로 검색 실행 ("Use Perplexity to search...")
3. 코드 수정 없이 통합
4. 결과 자동 파싱

MCP 단점:
1. 비용 절감 효과 전혀 없음 (API 래퍼일 뿐)
2. API 키 여전히 필요
3. 직접 API보다 느릴 수 있음 (중간 레이어 추가)
```

---

## 3. 현재 API 키 상태

### 3.1 문제 발견

```bash
$ grep PERPLEXITY_API_KEY .env
PERPLEXITY_API_KEY=REDACTED

# 테스트 결과
❌ 401 Authorization Required

원인:
- API 키가 만료되었거나
- API 키가 무효화되었거나
- Perplexity 계정이 비활성화됨
```

### 3.2 해결 방법

```
1. Perplexity 계정 로그인: https://www.perplexity.ai
2. API 키 재발급:
   - Settings → API
   - Generate New API Key
   - 새 키를 .env에 업데이트

3. Pro 가입 권장:
   - 월 $5 API 크레딧 제공
   - 더 나은 모델 접근
   - 비용 절감 효과
```

---

## 4. V30 통합 시나리오

### 4.1 현재 V30 구조 (Perplexity 제외)

```python
# collect_v30.py (현재)
V30 2개 AI 분담:
├── Gemini 95% (950개)
│   ├── 공식 데이터 50개 (Google Search 무료)
│   └── 공개 데이터 45개
└── Grok 5% (50개)
    └── 공개 데이터 5개 (X/트위터 전담)

⚠️ Perplexity = 제거됨 (401 에러 + 비용 $1,050+/100명)
```

### 4.2 Perplexity MCP 통합 시나리오 (제안)

#### 옵션 A: Perplexity를 수집 AI로 추가 (멀티 소스)

```python
# 새로운 V30 구조
V30 3개 AI 분담:
├── Gemini 80% (800개) - Google Search
├── Grok 10% (100개) - X/트위터
└── Perplexity 10% (100개) - 자체 검색엔진 (독립 크롤링)

장점:
✅ 검색 소스 다양화 (Google + X + Perplexity)
✅ 편향 감소
✅ 수집 품질 향상

단점:
❌ 비용 증가 ($7.50/1,000개 추가)
❌ 시간 증가 (3개 AI 수집)
```

#### 옵션 B: Perplexity를 평가 AI로만 사용 (현상 유지)

```python
# V30 구조 변경 없음
수집: Gemini + Grok
평가: Claude + ChatGPT + Grok + Gemini + Perplexity (5개 AI)

장점:
✅ 수집 비용 증가 없음
✅ 평가 다양성 증가 (5개 AI)
✅ MCP 활용 (Claude Code에서 평가)

단점:
⚠️ 수집 다양성 여전히 제한적 (Google Search 의존)
```

#### 옵션 C: Gemini 대체 (비추천)

```python
# Gemini 대신 Perplexity 사용
V30 2개 AI:
├── Perplexity 95% (950개) - 자체 검색엔진 (독립 크롤링)
└── Grok 5% (50개) - X/트위터

장점:
✅ Google Search 편향 제거
✅ 독립 검색 인프라로 다양성 확보

단점:
❌ 비용 폭발 ($7,125/100명 vs 현재 $0)
❌ Gemini 무료 혜택 상실
❌ 비현실적
```

### 4.3 권장 시나리오

> **옵션 B: Perplexity를 평가 AI로만 사용**

**이유:**
1. 수집 비용 증가 없음 (Gemini 무료 활용)
2. 평가 다양성 증가 (4개 → 5개 AI)
3. MCP 활용으로 Claude Code 통합 편리
4. 현실적인 비용 수준

**구현:**
```python
# evaluate_v30.py에 추가
def call_perplexity_mcp(evaluation_data):
    """Perplexity MCP를 통한 평가 (Claude Code 환경에서만)"""
    # MCP tool 호출은 Claude Code/Desktop에서만 가능
    # Python 스크립트에서는 직접 API 호출 사용

    client = OpenAI(
        api_key=PERPLEXITY_API_KEY,
        base_url="https://api.perplexity.ai"
    )

    # 기존 평가 로직과 동일
    ...
```

---

## 5. 비용 분석 (100명 기준)

### 5.1 현재 V30 (Gemini + Grok)

```
Gemini: $0 (무료)
Grok:   미확인 (X API 무료 또는 저렴)

총 수집 비용: ~$0/100명
```

### 5.2 Perplexity 추가 시나리오별 비용

#### 시나리오 1: 수집 AI로 추가 (10%)

```
정치인당:
- Perplexity 100개 × $0.0075/개 = $0.75/명

100명 기준:
- 수집 비용: $75
- 평가 비용: 기존과 동일

총 비용 증가: $75/100명
```

#### 시나리오 2: 평가 AI로만 사용 (권장)

```
정치인당:
- 1,000개 평가 × $0.0075/개 = $7.50/명

100명 기준:
- 평가 비용: $750

총 비용 증가: $750/100명
```

#### 시나리오 3: Gemini 대체 (비추천)

```
정치인당:
- 950개 수집 × $0.0075/개 = $7.125/명

100명 기준:
- 수집 비용: $7,125

총 비용 증가: $7,125/100명 ← ❌ 비현실적
```

### 5.3 Pro 가입 시 비용 절감

```
Pro 월 구독: $20/월
월 API 크레딧: $5

시나리오 2 (평가 AI) 기준:
- 원래 비용: $750/100명
- Pro 크레딧: -$5
- 실제 비용: $745/100명

월 크레딧은 미미한 수준 (0.67% 절감)
```

---

## 6. 최종 권장사항

### 6.1 즉시 조치 사항

```
1. ✅ Perplexity MCP 서버 설치 완료
   - 추가 조치 불필요

2. ❌ API 키 갱신 필요
   - 현재 키: 401 에러
   - 조치: Perplexity 계정에서 새 API 키 발급
   - 업데이트: .env 파일 수정

3. ⚠️ Pro 가입 검토
   - 월 $20 (API 크레딧 $5 포함)
   - 더 나은 모델 접근
   - 비용 절감 효과는 미미
```

### 6.2 V30 통합 방향

```
권장: 옵션 B (평가 AI로만 사용)

이유:
✅ 수집 비용 증가 없음
✅ 평가 다양성 증가 (4→5 AI)
✅ MCP 활용 편리
✅ 현실적 비용 ($750/100명)

비추천:
❌ 옵션 A (수집 AI 추가): 수집 시간 증가
❌ 옵션 C (Gemini 대체): 비용 폭발

다음 단계:
1. API 키 갱신
2. evaluate_v30.py에 Perplexity 통합
3. 소규모 테스트 (10명)
4. 비용 모니터링
5. 본격 적용 여부 결정
```

---

## 7. 부록: MCP 사용법

### 7.1 Claude Code에서 사용

```
프롬프트 예시:
"Use Perplexity MCP to search for recent news about 조은희 의원 (2024-2026)"

Claude Code가 자동으로:
1. Perplexity MCP 서버 호출
2. 검색 실행
3. 결과 파싱
4. 응답 제공
```

### 7.2 Python에서 사용 (직접 API)

```python
from openai import OpenAI

client = OpenAI(
    api_key="pplx-xxxxx",
    base_url="https://api.perplexity.ai"
)

response = client.chat.completions.create(
    model="sonar",
    messages=[
        {"role": "user", "content": "조은희 의원 최근 뉴스"}
    ]
)

print(response.choices[0].message.content)
```

### 7.3 Config 파일 위치

```
Windows: %APPDATA%\Claude\claude_desktop_config.json
macOS: ~/Library/Application Support/Claude/claude_desktop_config.json

내용:
{
  "mcpServers": {
    "perplexity": {
      "command": "npx",
      "args": ["-y", "@perplexity-ai/mcp-server"],
      "env": {
        "PERPLEXITY_API_KEY": "pplx-xxxxx"
      }
    }
  }
}
```

---

## 8. 참고 자료

### 공식 문서
- [Perplexity MCP Server 공식 문서](https://docs.perplexity.ai/guides/mcp-server)
- [Perplexity API 가격](https://docs.perplexity.ai/getting-started/pricing)
- [Model Context Protocol 공식 사이트](https://modelcontextprotocol.io/)

### GitHub 저장소
- [공식 Perplexity MCP](https://github.com/perplexityai/modelcontextprotocol)
- [브라우저 자동화 MCP (wysh3)](https://github.com/wysh3/perplexity-mcp-zerver)

### 가격 분석
- [Finout - Perplexity Pricing 2026](https://www.finout.io/blog/perplexity-pricing-in-2026)
- [Price Per Token - Perplexity](https://pricepertoken.com/pricing-page/provider/perplexity)

### MCP 통합 가이드
- [Claude Code MCP Setup Guide](https://mcpcat.io/guides/adding-an-mcp-server-to-claude-code/)
- [Ultimate Engineer's Guide to Perplexity MCP](https://skywork.ai/skypage/en/ultimate-engineers-guide-perplexity-mcp-server/1977930691699478528)

---

## 9. 결론

### 핵심 메시지

> **Perplexity MCP는 "비용 절감" 도구가 아니라 "통합 편의성" 도구입니다.**

### 요약

1. **MCP 서버 존재**: ✅ 공식 MCP 서버 있음, 설치 완료
2. **비용 절감 효과**: ❌ 없음 (API 요금 동일)
3. **통합 편의성**: ✅ Claude Code와 원활한 통합
4. **무료 대안**: ⚠️ 브라우저 자동화 있으나 불안정
5. **현재 API 키**: ❌ 무효 (갱신 필요)

### 권장 방향

```
단기 (즉시):
1. API 키 갱신
2. 소규모 테스트

중기 (1-2주):
1. 평가 AI로 Perplexity 추가
2. 비용 모니터링
3. 효과 분석

장기 (1개월+):
1. 본격 적용 여부 결정
2. Pro 가입 검토
3. V30 최적화
```

### 마지막 조언

```
Perplexity를 V30에 통합할지 여부는:

고려 사항:
- 예산: $750/100명 감당 가능한가?
- 효과: 평가 다양성이 실제로 가치 있는가?
- 대안: 현재 4개 AI로도 충분한가?

권장:
- 소규모 테스트 (10-20명) 먼저 실행
- 비용 vs 효과 측정
- 데이터 기반 의사결정
```

---

**최종 업데이트**: 2026-01-20
**문서 작성자**: Claude Code
**문의사항**: 추가 질문 있으시면 말씀해주세요.
