# Perplexity MCP 연결 시 작동 방식

**작성일**: 2026-01-20
**목적**: MCP 연결 시 실제로 어떻게 작동하는지 명확히 설명

---

## 🔌 MCP 연결이란?

### MCP (Model Context Protocol) 개념

```
MCP = AI가 외부 도구/서비스를 사용할 수 있게 하는 표준 프로토콜

예시:
- Claude가 GitHub를 사용할 수 있게 (GitHub MCP)
- Claude가 Slack을 사용할 수 있게 (Slack MCP)
- Claude가 Perplexity를 사용할 수 있게 (Perplexity MCP)
```

### 설치 완료된 상태

```bash
$ claude mcp list
perplexity: npx -y @perplexity-ai/mcp-server - ✓ Connected

→ MCP 서버 설치됨 ✅
→ Claude가 Perplexity를 도구로 사용 가능 ✅
```

---

## 🎯 MCP로 연결하면 어떻게 되나?

### 시나리오 1: Claude Code/Desktop에서 사용 (MCP 활용)

#### 사용 방법

```
Claude Code/Desktop에서 프롬프트:

"Use Perplexity MCP to search for recent news about 조은희 의원 (2024-2026)"
```

#### 내부 작동 흐름

```
1. 사용자 프롬프트 입력
   "Use Perplexity MCP to search..."

2. Claude가 MCP 서버 호출
   Claude → Perplexity MCP 서버 (npx @perplexity-ai/mcp-server)

3. MCP 서버가 Perplexity API 호출
   MCP 서버 → Perplexity API (https://api.perplexity.ai)
   - API 키 사용: .claude.json에 저장된 PERPLEXITY_API_KEY
   - Model: sonar
   - 검색 실행

4. Perplexity API 응답
   Perplexity API → MCP 서버
   - 검색 결과 반환

5. MCP 서버가 Claude에게 전달
   MCP 서버 → Claude
   - 결과 포맷팅

6. Claude가 사용자에게 응답
   Claude → 사용자
   - 자연어로 결과 요약 및 제시
```

#### 실제 예시

```
User: "Use Perplexity MCP to search for 조은희 의원 최근 뉴스"

Claude (내부 처리):
1. Perplexity MCP 도구 호출
2. 검색 실행
3. 결과 수신

Claude (사용자에게):
"조은희 의원 관련 최근 뉴스를 찾았습니다:

1. 조선일보 (2025-12-15)
   제목: 조은희 의원, 지방자치법 개정안 발의
   URL: https://...

2. 한겨레 (2025-11-20)
   제목: 조은희 의원, 서초구 주민 간담회
   URL: https://...

..."
```

#### 장점

```
✅ 프롬프트만으로 검색 실행 (코딩 불필요)
✅ Claude가 자동으로 결과 파싱 및 요약
✅ 대화형 인터페이스 (추가 질문 가능)
✅ 빠르고 편리
```

#### 단점

```
❌ 자동화 불가능 (수동 프롬프트 필요)
❌ 대량 수집 불가능 (1개씩 요청)
❌ Python 스크립트 통합 불가능
❌ 비용은 동일 (API 호출 그대로)
```

---

### 시나리오 2: Python 스크립트에서 사용 (MCP 미사용)

#### 우리의 Use Case (collect_v30.py)

```python
# collect_v30.py
def call_perplexity(politician_name, category, sentiment, count):
    """Perplexity API 직접 호출"""

    client = OpenAI(
        api_key=PERPLEXITY_API_KEY,
        base_url="https://api.perplexity.ai"
    )

    response = client.chat.completions.create(
        model="sonar",
        messages=[{
            "role": "user",
            "content": f"{politician_name} 의원 {category} 데이터 수집..."
        }]
    )

    return response.choices[0].message.content
```

#### 작동 흐름

```
1. Python 스크립트 실행
   python collect_v30.py

2. call_perplexity() 함수 호출
   - Perplexity API 직접 호출
   - MCP 서버 거치지 않음!

3. Perplexity API 응답
   - 검색 결과 반환

4. Python 스크립트가 결과 처리
   - JSON 파싱
   - DB 저장
   - 다음 요청 진행

5. 자동화 루프
   - 10개 카테고리 × 25개/카테고리 = 250개 자동 수집
```

#### 장점

```
✅ 완전 자동화 가능
✅ 대량 수집 가능 (250개/정치인)
✅ 병렬 처리 가능
✅ DB 자동 저장
✅ 에러 처리 및 재시도 가능
```

#### 단점

```
⚠️ 코딩 필요
⚠️ API 키 직접 관리
⚠️ 결과 파싱 직접 구현
```

---

## 🤔 그럼 MCP는 언제 사용하나?

### MCP가 유용한 경우

```
1. 수동 탐색/검증
   - "조은희 의원에 대해 Perplexity로 검색해줘"
   - 소수의 수동 검색
   - 결과 빠르게 확인

2. 프로토타입/테스트
   - 데이터 품질 확인
   - 검색 결과 샘플링
   - 프롬프트 튜닝

3. 대화형 작업
   - Claude와 대화하며 검색
   - 결과에 대한 추가 질문
   - 탐색적 분석
```

### MCP가 불필요한 경우 (우리 경우)

```
❌ 대량 자동 수집
   - 100명 × 250개 = 25,000개 수집
   - MCP로는 불가능
   - Python 스크립트 필수

❌ 정해진 프로세스
   - 카테고리별 수집
   - DB 자동 저장
   - 에러 처리
   - MCP 없이 직접 API 호출이 효율적

❌ 병렬 처리
   - 여러 정치인 동시 수집
   - MCP는 순차 처리만 가능
   - Python 병렬 처리 필요
```

---

## 💡 우리 프로젝트에서의 결론

### MCP를 사용할 곳

```
✅ 개발/테스트 단계
   - Claude Code에서 수동으로 Perplexity 검색
   - "Use Perplexity MCP to search..."
   - 결과 품질 확인
   - 프롬프트 실험

예시:
User: "Use Perplexity MCP to search for 조은희 의원 전문성 관련 데이터"
Claude: "검색 결과입니다... [자동 요약]"
User: "좀 더 최근 데이터만 찾아줘"
Claude: "2025-2026년 데이터만 재검색합니다..."

→ 대화형으로 빠르게 실험 ✅
```

### MCP를 사용하지 않을 곳

```
❌ 프로덕션 수집 (collect_v30.py)
   - Python 스크립트로 직접 API 호출
   - MCP 거치지 않음
   - 완전 자동화

이유:
1. 대량 수집 (25,000개)
2. 자동화 필수
3. 병렬 처리 필요
4. DB 자동 저장
5. 에러 처리 및 재시도

→ Python 직접 API 호출 ✅
```

---

## 📊 비교표

| 항목 | MCP 사용 (Claude Code) | 직접 API 호출 (Python) |
|------|----------------------|----------------------|
| **사용 장소** | Claude Code/Desktop | Python 스크립트 |
| **방식** | 프롬프트 입력 | 코드 작성 |
| **자동화** | ❌ 불가능 | ✅ 가능 |
| **대량 처리** | ❌ 불가능 (수동) | ✅ 가능 (자동) |
| **병렬 처리** | ❌ 불가능 | ✅ 가능 |
| **DB 저장** | ❌ 수동 | ✅ 자동 |
| **비용** | 동일 (API 요금) | 동일 (API 요금) |
| **장점** | 빠른 테스트, 대화형 | 자동화, 대량 처리 |
| **단점** | 수동, 소량만 | 코딩 필요 |
| **우리 사용** | ✅ 개발/테스트 | ✅ 프로덕션 수집 |

---

## 🔧 실제 작동 예시

### 예시 1: MCP 사용 (Claude Code)

```
User (Claude Code에서):
"Use Perplexity MCP to search for 조은희 의원 전문성 관련 최근 뉴스 5개"

Claude (내부):
1. Perplexity MCP 도구 호출
2. API 검색 실행
3. 결과 수신

Claude (응답):
"조은희 의원의 전문성 관련 최근 뉴스 5개를 찾았습니다:

1. [조선일보] 조은희 의원, 지방행정 전문가로 평가받아
   날짜: 2025-12-20
   URL: https://...

2. [중앙일보] 조은희 행안부 장관 출신, 실무 전문성 강점
   날짜: 2025-11-15
   URL: https://...

... (자동 요약 및 정리)"

소요 시간: 10초
수집 개수: 5개
방식: 수동 프롬프트
```

### 예시 2: 직접 API 호출 (Python)

```python
# collect_v30.py 실행
python collect_v30.py --politician_id=62e7b453 --politician_name="조은희"

# 내부 처리:
for category in CATEGORIES:  # 10개 카테고리
    for sentiment in ['negative', 'positive', 'free']:
        # Perplexity API 직접 호출 (MCP 없음)
        result = call_perplexity(
            politician_name="조은희",
            category=category,
            sentiment=sentiment,
            count=5
        )

        # 결과 파싱
        items = parse_json(result)

        # DB 저장
        save_to_db(items)

# 결과:
소요 시간: 10분
수집 개수: 250개
방식: 완전 자동화
```

---

## 💰 비용 차이는?

### MCP 사용 시

```
비용 = Perplexity API 요금

예시:
- 5개 검색 (MCP via Claude Code)
- 비용: $0.0105

→ API 직접 호출과 동일 (MCP는 무료 래퍼)
```

### 직접 API 호출 시

```
비용 = Perplexity API 요금

예시:
- 250개 수집 (Python 스크립트)
- 비용: $0.53

→ API 직접 호출과 동일
```

**결론**: **MCP는 비용 절감 효과 없음!** (API 래퍼일 뿐)

---

## 🎯 최종 결론

### MCP의 정체

```
MCP = API 래퍼 + Claude 통합 도구

역할:
- Claude가 Perplexity API를 호출할 수 있게 함
- 프롬프트를 API 요청으로 변환
- API 응답을 Claude에게 전달

비용:
- API 요금은 동일
- MCP 사용료는 무료
```

### 우리 프로젝트에 적용

```
개발/테스트: MCP 사용 ✅
├── Claude Code에서 수동 검색
├── 프롬프트 실험
├── 결과 품질 확인
└── 빠른 프로토타입

프로덕션 수집: 직접 API 호출 ✅
├── collect_v30.py
├── 25,000개 자동 수집
├── 병렬 처리
├── DB 자동 저장
└── 에러 처리
```

### 답변

> **"퍼플렉시티를 MCP로 연결하면 어떻게 되는 거야?"**
>
> **답변**:
> 1. Claude Code/Desktop에서 프롬프트만으로 Perplexity 검색 가능해짐
> 2. 하지만 Python 스크립트(collect_v30.py)에서는 여전히 직접 API 호출
> 3. MCP는 비용 절감 효과 없음 (API 요금 동일)
> 4. MCP는 "개발/테스트용 편의 도구"이지 "프로덕션 자동화 도구" 아님
>
> **우리 경우**:
> - MCP: 개발 단계에서 수동 테스트용으로 활용
> - Python 직접 API: 프로덕션 대량 수집에 사용
> - 둘 다 병행 사용 ✅

---

**최종 업데이트**: 2026-01-20
**요약**: MCP = 편의성, 직접 API = 자동화/대량 처리
