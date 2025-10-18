# 최종 확정 워크플로우

**작성일**: 2025-10-15
**핵심**: AI에게 기본 정보만 제공 → AI가 알아서 데이터 수집 + 평가 동시 수행
**알고리즘 기반**: 국내외 정치 평가 연구 종합 (GovTrack, CEL, TI 등)
**실질적 의미**: 훌륭한 정치인 판별 (가능성 & 경쟁력 평가)

---

## ✅ 최종 확정 프로세스

```
사용자: "박형준" 검색 → 결제
        ↓
백엔드: AI에게 기본 정보만 제공
        ↓
        {
          "politician_name": "박형준",
          "position": "부산시장",
          "party": "국민의힘"
        }
        ↓
AI가 알아서:
  ✅ 데이터 수집 (공개 DB에서)
  ✅ 100개 항목 분석
  ✅ 10개 분야 평가
  ✅ 점수 산출
  (전부 동시에 수행)
        ↓
AI 응답 받음 → DB 저장 → 사이트 표시 + PDF 생성
```

---

## 🤖 1차 개발: Claude만

### 우리가 제공하는 정보 (최소한)

```python
# 기본 정보만 제공
politician_info = {
    "name": "박형준",
    "position": "부산시장",
    "party": "국민의힘",
    "region": "부산광역시"
}
```

### Claude에게 요청

```python
async def evaluate_with_claude(politician_info: dict) -> dict:
    """
    Claude에게 기본 정보만 주고
    데이터 수집 + 평가를 동시에 요청
    """

    import anthropic

    client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)

    prompt = f"""
당신은 정치인 평가 전문가입니다.

# 평가 대상 정치인
- 이름: {politician_info['name']}
- 직책: {politician_info['position']}
- 소속 정당: {politician_info['party']}
- 지역: {politician_info['region']}

# 중요: 평가 알고리즘 기반
이 평가는 국내외 정치 평가 연구를 참고하여 개발되었습니다.


핵심 변수:
- 재직자 평가: 경제 성과, 지지율 (가장 중요)
- 청렴성: 부패 의혹 = 낙선 요인
- 전문성: 정책 실행력 = 역량 강화 요인
- 인구통계: 유권자 만족도, 지역 여론

**이 평가 점수는 정치인의 종합 역량을 객관적으로 평가합니다.**

---

# 요청 사항

## 1. 데이터 수집
다음 공개 데이터베이스 및 정보원에서 데이터를 수집하세요:

### 필수 공개 DB
- 국회 의안정보시스템 (https://likms.assembly.go.kr/)
- 중앙선거관리위원회 (https://www.nec.go.kr/)
- 국민권익위원회 (https://www.acrc.go.kr/)
- 대법원 종합법률정보 (https://glaw.scourt.go.kr/)
- 감사원 (https://www.bai.go.kr/)
- 지방자치단체 홈페이지

### 언론 및 미디어
- AI가 공개적으로 접속 가능한 모든 국내외 언론사, 방송사, 뉴스 포털

### SNS 및 온라인 플랫폼
- Facebook, X (Twitter), Instagram, YouTube 등
- AI가 공개적으로 접속 가능한 모든 SNS 및 온라인 플랫폼

### 시민단체 및 평가 기관
- AI가 공개적으로 접속 가능한 모든 시민단체 및 평가 기관

### 기타 온라인 정보원
- Wikipedia, 나무위키 등
- AI가 공개적으로 접속 가능한 모든 웹사이트, 데이터베이스, 정보원

---

## 2. 평가 요청

다음 10개 분야에 대해 평가하세요.
**각 분야별로 최소 10개 이상의 항목**을 당신(AI)이 정하여 평가하세요.

### 1. 청렴성 (Integrity) - 최소 10개 항목 이상
**역량 평가 핵심 지표**: 부패 의혹 = 역량 저해 요인

예시 항목: 부패 신고, 재산 공개 투명성, 정치자금 투명성, 윤리위 징계, 감사원 지적, 법원 판결, 공약 이행률, 언론 청렴도 평가 등
**당신(AI)이 추가 항목을 정하여 최소 10개 이상 평가하세요.**

### 2. 전문성 (Competence) - 최소 10개 항목 이상
**역량 평가 핵심 지표**: 정책 실행력 = 역량 강화 요인

예시 항목: 학력/경력, 법안 발의/통과율, 위원회 전문성, 정책 실행 성공률, 예산 집행 효율성, 전문가 평가 등
**당신(AI)이 추가 항목을 정하여 최소 10개 이상 평가하세요.**

### 3. 소통능력 (Communication) - 최소 10개 항목 이상
**역량 평가 핵심 지표**: 유권자 호감도 = 역량 강화 요인

예시 항목: SNS 활동/응답률, 주민 간담회, 민원 처리, 언론 인터뷰, 공개 토론, 주민 만족도 등
**당신(AI)이 추가 항목을 정하여 최소 10개 이상 평가하세요.**

### 4. 리더십 (Leadership) - 최소 10개 항목 이상
**역량 평가 핵심 지표**: 정치적 영향력 = 역량 강화 요인

예시 항목: 주요 정책 주도, 정당 내 직책, 당선 횟수, 법안 대표발의, 위원회 위원장 경험, 위기 대응 등
**당신(AI)이 추가 항목을 정하여 최소 10개 이상 평가하세요.**

### 5. 책임감 (Accountability) - 최소 10개 항목 이상
**역량 평가 핵심 지표**: 공약 이행 = 신뢰도 요인

예시 항목: 공약 이행률, 사과/해명, 의정 활동 보고, 정책 실패 책임 인정, 유권자 신뢰도 등
**당신(AI)이 추가 항목을 정하여 최소 10개 이상 평가하세요.**

### 6. 투명성 (Transparency) - 최소 10개 항목 이상
**역량 평가 핵심 지표**: 신뢰도 = 역량 강화 요인

예시 항목: 재산 공개, 정치자금 공개, 의정 활동 공개, 정보공개 청구 응답률, 예산 집행 공개 등
**당신(AI)이 추가 항목을 정하여 최소 10개 이상 평가하세요.**

### 7. 대응성 (Responsiveness) - 최소 10개 항목 이상
**역량 평가 핵심 지표**: 민원 처리 = 지지율 요인 (정치 분석 지표)

예시 항목: 민원 처리 속도/율, SNS 응답 속도, 긴급 사안 대응, 재난 대응, 여론 변화 대응 등
**당신(AI)이 추가 항목을 정하여 최소 10개 이상 평가하세요.**

### 8. 비전 (Vision) - 최소 10개 항목 이상
**역량 평가 핵심 지표**: 미래 가치 = 역량 강화 요인

예시 항목: 장기 정책 비전, 혁신 정책, 정책 창의성, 지역 발전 계획, 정책 일관성 등
**당신(AI)이 추가 항목을 정하여 최소 10개 이상 평가하세요.**

### 9. 공익추구 (Public Interest) - 최소 10개 항목 이상
**역량 평가 핵심 지표**: 사익 추구 = 낙선 요인

예시 항목: 공익 법안 발의, 사익 추구 의혹, 로비 의혹, 시민단체 평가, 약자 보호 정책 등
**당신(AI)이 추가 항목을 정하여 최소 10개 이상 평가하세요.**

### 10. 윤리성 (Ethics) - 최소 10개 항목 이상
**역량 평가 핵심 지표**: 스캔들 = 역량 저해 요인

예시 항목: 윤리위 징계, 성추행 의혹, 폭언/폭행, 위법 행위, 탈세 의혹, 학력 위조, 도덕적 해이 등
**당신(AI)이 추가 항목을 정하여 최소 10개 이상 평가하세요.**

---

**총 최소 100개 항목 이상**

평가 항목의 구체적 내용, 개수, 가중치는 당신(AI)이 결정하세요.
데이터 수집 및 평가를 동시에 수행하세요.

---

## 3. 10개 분야별 점수 산출

위에서 평가한 항목들을 종합하여 각 분야별로 **0-10점**으로 평가하세요.

**중요**: 이 점수는 객관적 데이터 분석을 통해 **정치 역량을 평가**합니다.

1. **청렴성** (Integrity) - 0-10점
2. **전문성** (Competence) - 0-10점
3. **소통능력** (Communication) - 0-10점
4. **리더십** (Leadership) - 0-10점
5. **책임감** (Accountability) - 0-10점
6. **투명성** (Transparency) - 0-10점
7. **대응성** (Responsiveness) - 0-10점
8. **비전** (Vision) - 0-10점
9. **공익추구** (Public Interest) - 0-10점
10. **윤리성** (Ethics) - 0-10점

# 출력 형식 (JSON)

{{
  "data_sources": [
    "국회 의안정보시스템",
    "중앙선거관리위원회",
    "네이버 뉴스",
    "다음 뉴스",
    "정치인 공식 SNS"
  ],

  "raw_data_100": {{
    "본회의_출석률": 95.5,
    "위원회_출석률": 88.3,
    "법안_발의_수": 15,
    "법안_통과율": 20.0,
    ... (100개 항목 전체)
  }},

  "category_scores": {{
    "청렴성": 8.5,
    "전문성": 9.0,
    "소통능력": 7.8,
    "리더십": 8.2,
    "책임감": 7.5,
    "투명성": 8.0,
    "대응성": 7.2,
    "비전": 8.5,
    "공익추구": 7.8,
    "윤리성": 9.0
  }},

  "rationale": {{
    "청렴성": "재산 공개가 투명하고 부패 의혹이 없음...",
    "전문성": "박사 학위 보유, 관련 분야 20년 경력...",
    ... (10개 분야 평가 근거)
  }},

  "strengths": [
    "전문성이 매우 뛰어남",
    "청렴성이 우수함",
    "비전이 명확함"
  ],

  "weaknesses": [
    "소통능력 개선 필요",
    "대응성 강화 필요"
  ],

  "overall_assessment": "전반적으로 우수한 정치인이나..."
}}

위 형식으로 JSON만 출력하세요.
"""

    # Claude API 호출
    response = await client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=8192,
        temperature=0.3,
        messages=[{"role": "user", "content": prompt}]
    )

    # 응답 파싱
    result = json.loads(response.content[0].text)

    return result
```

---

## 💡 왜 AI마다 점수가 다른가?

### 각 AI가 독립적으로 평가하기 때문입니다

#### 1. 선택하는 항목이 다를 수 있음
```
각 분야별로 "최소 10개 이상" 항목을 AI가 자율 선택

Claude:    청렴성 평가 시 재산공개, 부패신고, 정치자금... 선택
ChatGPT:   청렴성 평가 시 윤리위징계, 감사원지적, 법원판결... 선택
Gemini:    청렴성 평가 시 언론평가, 시민단체평가, 공약이행... 선택

→ 같은 "청렴성"이지만 다른 항목으로 평가
```

#### 2. 수집하는 데이터가 다를 수 있음
```
같은 데이터 소스에서도 수집 시점, 검색어, 우선순위가 다름

Claude:    2024년 10월 데이터 위주 수집
ChatGPT:   2023-2024년 전체 데이터 수집
Gemini:    최신 SNS 데이터 위주 수집

→ 같은 정치인도 다른 데이터 기반
```

#### 3. 평가 기준이 다를 수 있음
```
같은 항목도 AI마다 중요도를 다르게 판단

Claude:    출석률을 매우 중시
ChatGPT:   법안 통과율을 더 중시
Gemini:    소통 빈도를 더 중시

→ 같은 데이터도 다른 평가
```

### ✅ 이것은 장점입니다!

#### 편향 방지
- 한 AI만 사용하면 그 AI의 편향이 반영됨
- 5개 AI 사용으로 다양한 관점 확보

#### 신뢰성 향상
- 평균값이 더 안정적
- 극단적 평가 완화

#### 투명성
- 5개 점수를 모두 공개
- 유권자가 직접 판단 가능

### 예시

```
박형준 부산시장 평가:

Claude:      85.2점 (의정활동 실적 중시)
ChatGPT:     87.5점 (공약 이행률 중시)
Gemini:      83.8점 (SNS 소통 중시)
Perplexity:  86.1점 (언론 평가 중시)
Grok:        84.6점 (종합 균형)

평균:        85.4점 (B등급)
표준편차:    1.4점 (편차 작음 = 신뢰도 높음)
```

### 결론

```
AI마다 점수가 다른 것 = 정상적이고 바람직함

이유:
✅ 각 AI가 독립적으로 평가
✅ 다양한 관점 반영
✅ 편향 방지

최종 판단:
→ 5개 점수를 모두 보고 유권자가 판단
→ 또는 평균값 참고
```

---

## 🎯 2차 개발: 5개 AI 전체

### 동일한 방식으로 5개 AI에게 요청

```python
async def evaluate_with_all_ai(politician_info: dict) -> list:
    """
    5개 AI에게 동일한 방식으로 요청
    각 AI가 알아서 데이터 수집 + 평가
    """

    # 5개 AI에게 병렬로 요청
    results = await asyncio.gather(
        evaluate_with_claude(politician_info),
        evaluate_with_chatgpt(politician_info),
        evaluate_with_gemini(politician_info),
        evaluate_with_perplexity(politician_info),
        evaluate_with_grok(politician_info)
    )

    return results
```

### ChatGPT 요청 (2차 개발시)

```python
async def evaluate_with_chatgpt(politician_info: dict) -> dict:
    """
    ChatGPT에게 동일한 방식으로 요청
    """

    import openai

    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    prompt = f"""
당신은 정치인 평가 전문가입니다.

# 평가 대상 정치인
- 이름: {politician_info['name']}
- 직책: {politician_info['position']}
- 소속 정당: {politician_info['party']}
- 지역: {politician_info['region']}

# 요청 사항
위 정치인에 대해:
1. 공개 데이터 수집
2. 100개 항목 평가
3. 10개 분야별 점수 산출

(나머지 프롬프트는 Claude와 동일)
"""

    response = await client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)

    return result
```

### Gemini, Perplexity, Grok도 동일

```python
# 모두 동일한 방식:
# 1. 기본 정보만 제공
# 2. AI가 알아서 데이터 수집
# 3. AI가 알아서 평가
# 4. 결과 받아서 DB 저장
```

---

## 💾 DB 저장

```python
async def save_evaluation(
    politician_info: dict,
    ai_model: str,  # 'claude', 'chatgpt', 'gemini', 'perplexity', 'grok'
    ai_result: dict
) -> str:
    """
    AI 평가 결과 저장
    """

    evaluation = await db.politician_evaluations.create({
        "politician_name": politician_info['name'],
        "politician_position": politician_info['position'],
        "politician_party": politician_info['party'],

        # AI 정보
        "ai_model": ai_model,

        # AI가 수집한 데이터
        "data_sources": ai_result['data_sources'],
        "raw_data_100": ai_result['raw_data_100'],

        # AI가 평가한 점수
        "category_scores": ai_result['category_scores'],
        "rationale": ai_result['rationale'],
        "strengths": ai_result['strengths'],
        "weaknesses": ai_result['weaknesses'],
        "overall_assessment": ai_result['overall_assessment'],

        # 최종 점수 (우리가 계산)
        "final_score": calculate_final_score(ai_result['category_scores']),
        "grade": calculate_grade(final_score),

        "created_at": datetime.now()
    })

    return evaluation.id
```

---

## 🌐 사이트 표시 (2가지)

### 1. 웹페이지 표시 (요약)

```html
<!-- 1차 개발: Claude만 -->
<div class="evaluation-card">
    <h1>박형준 (부산시장)</h1>

    <!-- Claude 평가 -->
    <div class="ai-evaluation">
        <h2>Claude AI 평가</h2>
        <div class="score">81.5점 (B급)</div>

        <!-- 10개 분야 점수 -->
        <div class="category-scores">
            <div>청렴성: 8.5/10</div>
            <div>전문성: 9.0/10</div>
            <div>소통능력: 7.8/10</div>
            ...
        </div>

        <!-- 요약 -->
        <div class="summary">
            <h3>강점</h3>
            <ul>
                <li>전문성이 매우 뛰어남</li>
                <li>청렴성이 우수함</li>
            </ul>

            <h3>약점</h3>
            <ul>
                <li>소통능력 개선 필요</li>
            </ul>
        </div>
    </div>

    <button>📄 상세 보고서 다운로드</button>
</div>
```

```html
<!-- 2차 개발: 5개 AI -->
<div class="evaluation-card">
    <h1>박형준 (부산시장)</h1>

    <!-- 5개 AI 평가 비교 -->
    <div class="ai-comparison">
        <h2>AI별 평가</h2>

        <table>
            <tr>
                <th>AI</th>
                <th>점수</th>
                <th>등급</th>
            </tr>
            <tr>
                <td>Claude</td>
                <td>81.5</td>
                <td>B</td>
            </tr>
            <tr>
                <td>ChatGPT</td>
                <td>83.2</td>
                <td>B</td>
            </tr>
            <tr>
                <td>Gemini</td>
                <td>80.8</td>
                <td>B</td>
            </tr>
            <tr>
                <td>Perplexity</td>
                <td>82.5</td>
                <td>B</td>
            </tr>
            <tr>
                <td>Grok</td>
                <td>79.9</td>
                <td>B</td>
            </tr>
            <tr class="average">
                <td><strong>평균</strong></td>
                <td><strong>81.6</strong></td>
                <td><strong>B</strong></td>
            </tr>
        </table>
    </div>

    <button>📄 5개 AI 비교 보고서 다운로드</button>
</div>
```

### 2. PDF 보고서 (상세)

```python
async def generate_pdf_report(evaluation: dict) -> str:
    """
    PDF 보고서 생성
    """

    pdf = generate_pdf({
        "title": f"{evaluation.politician_name} 평가 보고서",
        "subtitle": f"{evaluation.ai_model} AI 기반 분석",

        # 데이터 출처 (투명성)
        "data_sources": evaluation.data_sources,

        # 100개 항목 데이터 (부록)
        "raw_data_100": evaluation.raw_data_100,

        # 10개 분야 점수 (메인)
        "category_scores": evaluation.category_scores,
        "rationale": evaluation.rationale,

        # 요약
        "strengths": evaluation.strengths,
        "weaknesses": evaluation.weaknesses,
        "overall_assessment": evaluation.overall_assessment,

        # 최종 점수
        "final_score": evaluation.final_score,
        "grade": evaluation.grade
    })

    return pdf
```

---

## 🔄 전체 워크플로우 통합

```python
async def run_evaluation_workflow(
    politician_info: dict,
    payment_id: str
) -> dict:
    """
    전체 평가 워크플로우
    """

    try:
        # 1. AI에게 평가 요청 (데이터 수집 + 평가 동시)
        print(f"🤖 {politician_info['name']} 평가 요청...")

        if settings.STAGE == "1":
            # 1차 개발: Claude만
            result = await evaluate_with_claude(politician_info)
            ai_model = "claude"
        else:
            # 2차 개발: 5개 AI
            results = await evaluate_with_all_ai(politician_info)
            # 평균 또는 개별 저장

        print("✅ AI 평가 완료")

        # 2. 결과 저장
        evaluation_id = await save_evaluation(
            politician_info=politician_info,
            ai_model=ai_model,
            ai_result=result
        )

        # 3. 사이트 표시
        await display_on_website(evaluation_id)

        # 4. PDF 생성 및 업로드
        evaluation = await db.politician_evaluations.find_one({"id": evaluation_id})
        pdf_url = await generate_and_upload_pdf(evaluation)

        # 5. 완료
        await db.payments.update(
            where={"id": payment_id},
            data={"status": "completed"}
        )

        return {
            "success": True,
            "evaluation_id": evaluation_id,
            "pdf_url": pdf_url
        }

    except Exception as e:
        await refund_payment(payment_id)
        return {"success": False, "error": str(e)}
```

---

## 📋 핵심 정리

### 우리가 하는 것 (최소한)

```python
# 기본 정보만 제공
{
    "name": "박형준",
    "position": "부산시장",
    "party": "국민의힘",
    "region": "부산광역시"
}
```

### AI가 하는 것 (전부)

```
✅ 데이터 수집 (공개 DB에서)
✅ 100개 항목 분석
✅ 10개 분야 평가
✅ 점수 산출
✅ 보고서 작성

→ 전부 동시에 수행
```

### 우리가 받는 것

```json
{
  "data_sources": [...],
  "raw_data_100": {...},
  "category_scores": {...},
  "rationale": {...},
  "strengths": [...],
  "weaknesses": [...],
  "overall_assessment": "..."
}
```

### 우리가 추가로 하는 것

```
✅ 최종 점수 계산 (0-100점)
✅ 등급 산출 (S/A/B/C/D)
✅ DB 저장
✅ 사이트 표시
✅ PDF 생성
✅ 클라우드 업로드
```

---

**작성일**: 2025-10-15
**작성자**: Claude Code (AI)
**상태**: ✅ 최종 확정

**핵심**: AI에게 기본 정보만 주고, AI가 알아서 데이터 수집 + 평가 동시 수행
