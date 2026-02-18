# MCP는 우리 프로젝트에 불필요하다

**작성일**: 2026-01-20
**결론**: MCP 없이 Python 직접 API 호출만 사용

---

## 🎯 사용자 지적 (정확함)

```
"MCP 장점이 없지 않냐, 코딩이 뭐가 어렵다고"

→ 완전히 맞는 말!
```

---

## ❌ MCP의 "장점"들을 재검토

### "장점" 1: 프롬프트만으로 사용 가능

```
MCP:
User: "Use Perplexity MCP to search for 조은희 의원 뉴스"
Claude: [검색] → 결과 제공

→ 하지만 우리는 자동화가 필요함!
→ 수동 프롬프트는 쓸모 없음!
```

### "장점" 2: 코딩 불필요

```
하지만 Python API 호출이 얼마나 간단한가?

# Perplexity API 호출 (5줄)
from openai import OpenAI

client = OpenAI(
    api_key=PERPLEXITY_API_KEY,
    base_url="https://api.perplexity.ai"
)

response = client.chat.completions.create(
    model="sonar",
    messages=[{"role": "user", "content": "조은희 의원 뉴스"}]
)

print(response.choices[0].message.content)

→ 이게 어려운가? 전혀 안 어렵다!
→ MCP 설치/설정이 오히려 더 복잡함!
```

### "장점" 3: 빠른 테스트

```
MCP로 테스트:
1. Claude Code 열기
2. 프롬프트 입력
3. 결과 확인

Python으로 테스트:
1. test.py 작성 (위 코드 5줄)
2. python test.py 실행
3. 결과 확인

→ 속도 차이? 거의 없음!
→ Python이 오히려 더 유연함!
```

### "장점" 4: 대화형

```
MCP:
User: "조은희 의원 뉴스 검색해줘"
Claude: [결과]
User: "좀 더 최근 것만"
Claude: [재검색]

하지만:
→ 우리는 자동화된 대량 수집이 목표!
→ 대화형 필요 없음!
→ 정해진 프로세스만 실행하면 됨!
```

---

## ✅ 실제 필요한 것

### 우리가 해야 할 것

```
1. 100명 정치인
2. 각 정치인당 250개 데이터 수집 (Perplexity)
3. 총 25,000개 자동 수집
4. DB 자동 저장
5. 에러 처리
6. 병렬 처리

→ 이 모든 것이 Python 자동화 스크립트로만 가능!
→ MCP로는 절대 불가능!
```

### Python 직접 API 호출의 장점

```
✅ 완전 자동화 (MCP: 불가능)
✅ 대량 처리 (MCP: 불가능)
✅ 병렬 처리 (MCP: 불가능)
✅ DB 자동 저장 (MCP: 불가능)
✅ 에러 처리 및 재시도 (MCP: 불가능)
✅ 커스터마이징 자유 (MCP: 제한적)
✅ 코드가 간단함 (5줄!)
✅ 디버깅 쉬움
✅ 로깅/모니터링 가능
✅ CI/CD 통합 가능

→ MCP의 모든 "장점"을 압도함!
```

---

## 📊 비교표 (현실적)

| 항목 | MCP | Python 직접 API | 승자 |
|------|-----|----------------|------|
| **자동화** | ❌ 불가능 | ✅ 가능 | 🏆 Python |
| **대량 처리** | ❌ 불가능 | ✅ 가능 | 🏆 Python |
| **병렬 처리** | ❌ 불가능 | ✅ 가능 | 🏆 Python |
| **코드 복잡도** | 설치/설정 복잡 | 5줄 코드 | 🏆 Python |
| **비용** | API 요금 | API 요금 | ⚖️ 동일 |
| **유연성** | 제한적 | 무한대 | 🏆 Python |
| **디버깅** | 어려움 | 쉬움 | 🏆 Python |
| **CI/CD 통합** | 불가능 | 가능 | 🏆 Python |
| **프로덕션 적합성** | ❌ 부적합 | ✅ 적합 | 🏆 Python |

**결과**: Python 완승!

---

## 💡 MCP는 언제 유용한가? (솔직히)

### MCP가 진짜 유용한 경우

```
1. 비개발자가 사용할 때
   - 코딩 못 하는 사람
   - 프롬프트만 입력하고 싶은 사람

   → 우리는 개발자! 코딩 가능!

2. 일회성 수동 검색
   - "이 정치인 한 명만 빠르게 검색해줘"
   - 1-2개 정도

   → 우리는 25,000개 자동 수집!

3. 탐색적 분석 (Exploratory Analysis)
   - 데이터 구조 파악
   - 프롬프트 실험

   → 이것도 Python으로 빠르게 가능!

4. API 키 관리가 복잡할 때
   - 여러 팀원이 사용
   - API 키 중앙 관리 필요

   → 우리는 단독 프로젝트!
```

**결론**: 우리 경우에는 하나도 해당 안 됨!

---

## 🎯 최종 결론

### MCP는 우리 프로젝트에 불필요

```
이유:
1. 비용 절감 효과 전혀 없음 (API 요금 동일)
2. 자동화 불가능 (수동 프롬프트만)
3. 대량 처리 불가능 (1개씩만)
4. Python API 호출이 전혀 어렵지 않음 (5줄 코드)
5. Python이 훨씬 더 강력하고 유연함

사용자 지적: "코딩이 뭐가 어렵다고"
→ 완전히 맞는 말!
```

### 채택: Python 직접 API 호출만 사용

```python
# collect_v30.py

from openai import OpenAI

def call_perplexity(politician_name, category, sentiment, count):
    """Perplexity API 직접 호출 (MCP 없음)"""

    client = OpenAI(
        api_key=PERPLEXITY_API_KEY,
        base_url="https://api.perplexity.ai"
    )

    prompt = build_prompt(politician_name, category, sentiment, count)

    response = client.chat.completions.create(
        model="sonar",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000
    )

    return response.choices[0].message.content

# 자동화 루프
for politician in politicians:
    for category in CATEGORIES:
        result = call_perplexity(...)
        save_to_db(result)

→ 간단하고 강력함! MCP 불필요!
```

---

## 📝 MCP 관련 정리

### MCP 서버 설치는 어떻게 하나?

```
이미 설치됨:
$ claude mcp list
perplexity: npx -y @perplexity-ai/mcp-server - ✓ Connected

하지만:
→ 사용하지 않을 것임!
→ 삭제하지는 않겠음 (혹시 나중에 수동 테스트 필요하면)
```

### 왜 MCP를 조사했나?

```
원래 목표: "MCP로 비용 절감할 수 있나?"
결과: "비용 절감 효과 없음"

부가적 발견:
- MCP = 편의성 도구 (자동화 도구 아님)
- Python 직접 API가 훨씬 강력함
- 우리 프로젝트에는 불필요함

→ 조사는 유익했음! (불필요하다는 것을 알게 됨)
```

---

## ✅ 다음 단계 (MCP 제외)

### 즉시 실행

```
1. ❌ MCP 추가 작업 없음 (불필요)
2. ✅ Perplexity API 키 갱신
3. ✅ collect_v30.py 수정 (Python 직접 API 호출)
4. ✅ 10명 테스트
5. ✅ 100명 본격 수집
```

### collect_v30.py 구조

```python
# V30 최종 구조 (MCP 없음)

AI_CONFIGS = {
    "Gemini": {
        "model": "gemini-2.0-flash",
        "env_key": "GEMINI_API_KEY"
    },
    "Perplexity": {
        "model": "sonar",
        "env_key": "PERPLEXITY_API_KEY",
        "base_url": "https://api.perplexity.ai"
    }
}

COLLECT_DISTRIBUTION = {
    "Gemini": {
        "official": 50,  # OFFICIAL 100%
        "public": 25,    # PUBLIC 50%
        "total": 75
    },
    "Perplexity": {
        "official": 0,   # OFFICIAL 0%
        "public": 25,    # PUBLIC 50%
        "total": 25
    }
}

# 수집 함수 (Python 직접 API)
def call_gemini_with_search(...):
    # Google Search grounding
    ...

def call_perplexity(...):
    # Perplexity API 직접 호출 (MCP 없음!)
    client = OpenAI(
        api_key=PERPLEXITY_API_KEY,
        base_url="https://api.perplexity.ai"
    )
    response = client.chat.completions.create(...)
    return response.choices[0].message.content

# 자동화
for politician in politicians:
    for category in CATEGORIES:
        # Gemini 75개
        gemini_result = call_gemini_with_search(...)

        # Perplexity 25개
        perplexity_result = call_perplexity(...)

        # DB 저장
        save_to_db(...)
```

---

## 🏁 최종 정리

### 핵심 메시지

> **"MCP는 비용 절감 도구가 아니라 편의성 도구이고, 우리는 편의성이 아니라 자동화가 필요하므로, MCP는 불필요하다."**

### 사용자가 옳았다

```
사용자: "MCP 장점이 없지 않냐, 코딩이 뭐가 어렵다고"

→ 완전히 맞는 지적!
→ Python API 호출은 전혀 어렵지 않음 (5줄)
→ MCP보다 Python이 훨씬 강력함
→ MCP는 우리 프로젝트에 불필요함
```

### 다음 작업

```
❌ MCP 관련 추가 작업 없음
✅ Python 직접 API 호출로 collect_v30.py 구현
✅ 75-25 비율 적용
✅ 비용 최적화 전략 적용 ($105/100명)
✅ 테스트 및 배포
```

---

**최종 업데이트**: 2026-01-20
**결론**: MCP 불필요, Python 직접 API 호출만 사용
**이유**: 간단한 코드 (5줄) + 완전 자동화 + 훨씬 강력함
