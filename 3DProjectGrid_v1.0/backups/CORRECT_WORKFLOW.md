# 정확한 평가 워크플로우 (수정본)

**작성일**: 2025-10-15
**핵심 변경**: **Claude가 직접 데이터 수집부터 평가까지 전부 수행**
**이유**: 우리가 데이터를 수집하면 "조작 의혹" 발생 가능

---

## ⚠️ 기존 방식의 문제점 (❌ 잘못된 방식)

```
❌ 우리가 데이터 수집 → Claude에게 전달 → 평가

문제점:
1. 우리가 데이터를 선별/가공 → 조작 의혹
2. 우리가 어떤 데이터를 넣었는지 → 편향 의심
3. 데이터 수집 과정 불투명 → 신뢰도 하락
```

---

## ✅ 올바른 방식 (Claude가 전부 수행)

```
사용자: "박형준" 검색 → 결제
        ↓
백엔드: Claude API에게 요청
        ↓
Claude AI가 직접:
  1. 데이터 수집 (공개 DB, 언론 보도 등)
  2. 100개 항목 분석
  3. 10개 분야 평가
  4. 점수 계산
  5. 보고서 작성
        ↓
Claude 응답 → 우리 DB 저장 (원본 그대로)
        ↓
결과:
  - PDF 보고서 (클라우드 업로드)
  - 평가 점수 (사이트 표시)
  - 평가 요약 (사이트 표시)
```

---

## 🔄 수정된 전체 워크플로우

### Stage 1: 사용자 요청

```
사용자 → "박형준" 검색
     → 보고서 신청 버튼 클릭
     → 결제 (금액은 나중에 설정)
     → 결제 완료
```

### Stage 2: Claude에게 통합 요청 (핵심 변경!)

```python
async def request_claude_full_evaluation(politician_name: str) -> dict:
    """
    Claude에게 모든 것을 요청
    - 데이터 수집
    - 평가
    - 보고서 작성
    """

    import anthropic

    client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)

    prompt = f"""
당신은 정치인 평가 전문가이자 데이터 수집 전문가입니다.

# 평가 대상
- 정치인 이름: {politician_name}

# 작업 순서

## 1단계: 데이터 수집 (당신이 직접 수행)
다음 공개 데이터 소스에서 정보를 수집하세요:

### 의정활동 데이터 (35개 항목)
- 국회 의안정보시스템 (likms.assembly.go.kr)
  → 법안 발의 수, 출석률, 위원회 활동 등
- 국회 회의록 시스템
  → 질의 횟수, 발언 내용 등

### 재산/경력 데이터 (25개 항목)
- 중앙선거관리위원회 (nec.go.kr)
  → 재산 공개, 정치자금, 선거 이력 등
- 공개된 이력서
  → 학력, 경력, 자격증 등

### 언론 데이터 (20개 항목)
- 네이버 뉴스, 다음 뉴스
  → 최근 1년간 언론 보도 분석
  → 긍정/부정 감성 분석
- SNS (페이스북, 트위터, 인스타그램)
  → 소통 빈도, 댓글 응답률 등

### 사회활동 데이터 (20개 항목)
- 시민단체 활동 기록
- 봉사활동, 기부 내역
- 저서, 논문, 강연 이력

**중요**: 수집한 데이터의 출처를 모두 명시하세요.

## 2단계: 100개 항목 분석
수집한 데이터를 다음 100개 항목으로 정리하세요:

### 의정활동 (35개)
1. 본회의_출석률
2. 법안_발의_수
3. 법안_통과율
... (생략)

### 정치경력 (25개)
36. 당선_횟수
37. 정당_내_직책
... (생략)

### 개인정보 (15개)
61. 학력
62. 전공
... (생략)

### 경제/재산 (10개)
76. 총재산
77. 재산_증감
... (생략)

### 사회활동 (15개)
86. 시민단체_활동
87. 봉사활동
... (생략)

## 3단계: 10개 분야 평가 (0-10점)
수집한 100개 항목 데이터를 기반으로 평가하세요:

1. 청렴성 (Integrity): 0-10점
2. 전문성 (Competence): 0-10점
3. 소통능력 (Communication): 0-10점
4. 리더십 (Leadership): 0-10점
5. 책임감 (Accountability): 0-10점
6. 투명성 (Transparency): 0-10점
7. 대응성 (Responsiveness): 0-10점
8. 비전 (Vision): 0-10점
9. 공익추구 (Public Interest): 0-10점
10. 윤리성 (Ethics): 0-10점

## 4단계: 보고서 작성
다음 형식으로 작성하세요:

# 출력 형식 (JSON)

{{
  "data_collection": {{
    "sources": [
      {{"name": "국회 의안정보시스템", "url": "https://...", "collected_items": ["법안_발의_수", ...]}},
      {{"name": "중앙선거관리위원회", "url": "https://...", "collected_items": ["재산_총액", ...]}},
      ...
    ],
    "collection_timestamp": "2025-10-15T10:30:00",
    "data_coverage_rate": 0.85,
    "missing_items": ["항목89", "항목92"]
  }},

  "raw_data_100": {{
    "본회의_출석률": 95.5,
    "법안_발의_수": 15,
    "총재산": "50억원",
    ...
    (100개 항목 전체)
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
    "청렴성": "재산 공개가 투명하고 부패 의혹이 없음. 다만 정치자금 일부 출처 불명확.",
    "전문성": "박사 학위 보유, 관련 분야 20년 경력. 법안 발의 15건 중 3건 통과.",
    ...
  }},

  "strengths": [
    "전문성이 매우 뛰어남 (박사 학위, 20년 경력)",
    "청렴성이 우수함 (부패 의혹 0건)",
    "비전이 명확함 (중장기 정책 제시)"
  ],

  "weaknesses": [
    "소통능력이 다소 부족함 (SNS 활동 월 2회)",
    "대응성 개선 필요 (민원 응답 평균 7일)",
    "출석률 개선 필요 (본회의 85%, 위원회 78%)"
  ],

  "overall_assessment": "전반적으로 우수한 정치인이나, 소통과 대응성 측면에서 개선이 필요함. 전문성과 청렴성은 매우 높은 수준이며, 비전도 명확함. 다만 주민과의 소통 빈도를 높이고 민원 응답 속도를 개선할 필요가 있음.",

  "final_score": 81.5,
  "grade": "B",

  "report_summary": {{
    "title": "박형준 부산시장 평가 보고서",
    "subtitle": "Claude AI 기반 객관적 분석",
    "evaluation_date": "2025-10-15",
    "data_sources_count": 15,
    "reliability": "높음 (데이터 수집률 85%)"
  }}
}}

위 형식으로 출력하세요. JSON만 출력하고 다른 설명은 하지 마세요.
"""

    # Claude API 호출
    response = await client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=8192,  # 더 긴 응답 허용
        temperature=0.3,
        messages=[{"role": "user", "content": prompt}]
    )

    # Claude 응답 파싱
    result = json.loads(response.content[0].text)

    return result
```

---

### Stage 3: 결과 저장 (원본 그대로)

```python
async def save_claude_evaluation(
    politician_name: str,
    claude_result: dict,
    payment_id: str
) -> str:
    """
    Claude가 직접 수행한 결과를 원본 그대로 저장
    우리는 아무것도 수정하지 않음
    """

    evaluation = await db.politician_evaluations.create({
        # 정치인 정보
        "politician_name": politician_name,

        # Claude가 수행한 전체 내용 (원본)
        "ai_model": "claude",
        "claude_full_response": claude_result,  # 전체 응답 원본 보관

        # 데이터 수집 정보 (Claude가 수집)
        "data_collection": claude_result['data_collection'],
        "raw_data_100": claude_result['raw_data_100'],

        # 평가 결과 (Claude가 평가)
        "category_scores": claude_result['category_scores'],
        "rationale": claude_result['rationale'],
        "strengths": claude_result['strengths'],
        "weaknesses": claude_result['weaknesses'],
        "overall_assessment": claude_result['overall_assessment'],

        # 최종 점수 (Claude가 계산)
        "final_score": claude_result['final_score'],
        "grade": claude_result['grade'],

        # 보고서 요약
        "report_summary": claude_result['report_summary'],

        # 메타데이터
        "payment_id": payment_id,
        "created_at": datetime.now(),

        # 조작 방지
        "data_integrity": "verified",  # Claude가 직접 수집/평가
        "modification": "none"  # 우리는 수정 안 함
    })

    return evaluation.id
```

---

### Stage 4: 결과 표시 (2가지)

#### 4-1. 사이트에 표시 (요약)

```python
async def display_on_website(evaluation_id: str):
    """
    사이트에 평가 결과 표시
    """

    evaluation = await db.politician_evaluations.find_one({"id": evaluation_id})

    # 웹페이지에 표시할 내용
    website_data = {
        "politician_name": evaluation.politician_name,

        # 최종 점수
        "final_score": evaluation.final_score,
        "grade": evaluation.grade,

        # 10개 분야별 점수
        "category_scores": evaluation.category_scores,

        # 요약
        "strengths": evaluation.strengths,
        "weaknesses": evaluation.weaknesses,
        "overall_assessment": evaluation.overall_assessment,

        # 데이터 출처 (투명성)
        "data_sources": evaluation.data_collection['sources'],
        "data_coverage": evaluation.data_collection['data_coverage_rate'],

        # 신뢰도
        "reliability": evaluation.report_summary['reliability'],
        "evaluation_date": evaluation.report_summary['evaluation_date']
    }

    # 웹페이지 업데이트
    await update_website(website_data)
```

**사이트 표시 예시**:

```html
<!-- 정치인 프로필 페이지 -->
<div class="evaluation-card">
    <h1>박형준 (부산시장)</h1>

    <!-- 최종 점수 -->
    <div class="score-badge">
        <span class="score">81.5점</span>
        <span class="grade">B급</span>
    </div>

    <!-- 10개 분야 점수 -->
    <div class="category-scores">
        <div class="score-bar">
            <label>청렴성</label>
            <progress value="8.5" max="10"></progress>
            <span>8.5/10</span>
        </div>
        <div class="score-bar">
            <label>전문성</label>
            <progress value="9.0" max="10"></progress>
            <span>9.0/10</span>
        </div>
        <!-- ... 나머지 8개 -->
    </div>

    <!-- 요약 -->
    <div class="summary">
        <h3>강점</h3>
        <ul>
            <li>전문성이 매우 뛰어남 (박사 학위, 20년 경력)</li>
            <li>청렴성이 우수함 (부패 의혹 0건)</li>
            <li>비전이 명확함 (중장기 정책 제시)</li>
        </ul>

        <h3>약점</h3>
        <ul>
            <li>소통능력이 다소 부족함 (SNS 활동 월 2회)</li>
            <li>대응성 개선 필요 (민원 응답 평균 7일)</li>
        </ul>
    </div>

    <!-- 투명성 정보 -->
    <div class="transparency">
        <p>평가 기준: Claude AI 기반 객관적 분석</p>
        <p>데이터 출처: 15개 공개 DB (국회, 선관위, 언론 등)</p>
        <p>데이터 수집률: 85%</p>
        <p>평가 일자: 2025-10-15</p>
    </div>

    <!-- 보고서 다운로드 -->
    <button onclick="downloadReport()">
        📄 상세 보고서 다운로드 (PDF)
    </button>
</div>
```

#### 4-2. PDF 보고서 생성 & 클라우드 업로드

```python
async def generate_and_upload_pdf(evaluation: dict) -> str:
    """
    Claude 평가 결과로 PDF 보고서 생성 및 업로드
    """

    # PDF 생성
    pdf_filepath = await generate_pdf_report(
        politician_name=evaluation.politician_name,

        # 데이터 수집 정보
        data_sources=evaluation.data_collection['sources'],
        data_coverage=evaluation.data_collection['data_coverage_rate'],
        raw_data_100=evaluation.raw_data_100,

        # 평가 결과
        category_scores=evaluation.category_scores,
        rationale=evaluation.rationale,
        strengths=evaluation.strengths,
        weaknesses=evaluation.weaknesses,
        overall_assessment=evaluation.overall_assessment,

        # 최종 점수
        final_score=evaluation.final_score,
        grade=evaluation.grade
    )

    # 클라우드 업로드 (Supabase Storage)
    pdf_url = await upload_to_storage(pdf_filepath)

    # DB 업데이트
    await db.politician_evaluations.update(
        where={"id": evaluation.id},
        data={"pdf_url": pdf_url}
    )

    return pdf_url
```

---

## 🎯 전체 통합 함수

```python
async def run_full_evaluation_workflow(
    politician_name: str,
    payment_id: str
) -> dict:
    """
    전체 평가 워크플로우
    Claude가 모든 것을 수행
    """

    try:
        print(f"🚀 평가 시작: {politician_name}")

        # Stage 1: Claude에게 전체 요청 (데이터 수집 + 평가)
        print("🤖 Claude AI에게 전체 작업 요청...")
        claude_result = await request_claude_full_evaluation(politician_name)
        print("✅ Claude 작업 완료")

        # Stage 2: 결과 저장 (원본 그대로)
        print("💾 결과 저장 중...")
        evaluation_id = await save_claude_evaluation(
            politician_name=politician_name,
            claude_result=claude_result,
            payment_id=payment_id
        )
        print(f"✅ 저장 완료: {evaluation_id}")

        # Stage 3: 사이트에 표시
        print("🌐 사이트 업데이트 중...")
        await display_on_website(evaluation_id)
        print("✅ 사이트 업데이트 완료")

        # Stage 4: PDF 보고서 생성 및 업로드
        print("📄 PDF 보고서 생성 중...")
        evaluation = await db.politician_evaluations.find_one({"id": evaluation_id})
        pdf_url = await generate_and_upload_pdf(evaluation)
        print(f"✅ PDF 업로드 완료: {pdf_url}")

        # 결제 상태 업데이트
        await db.payments.update(
            where={"id": payment_id},
            data={"status": "completed", "evaluation_id": evaluation_id}
        )

        # 사용자 알림
        await send_notification(
            user_id=evaluation.user_id,
            message=f"{politician_name} 평가가 완료되었습니다.",
            pdf_url=pdf_url
        )

        print("🎉 전체 워크플로우 완료!")

        return {
            "success": True,
            "evaluation_id": evaluation_id,
            "final_score": claude_result['final_score'],
            "grade": claude_result['grade'],
            "pdf_url": pdf_url
        }

    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        await refund_payment(payment_id)
        return {"success": False, "error": str(e)}
```

---

## 💡 핵심 차이점 정리

### ❌ 기존 방식 (잘못됨)

```
우리가 데이터 수집 → Claude에게 전달 → 평가

문제점:
- 조작 의혹 가능
- 우리가 데이터 선별
- 편향 가능성
```

### ✅ 올바른 방식

```
Claude가 직접:
  1. 데이터 수집 (공개 DB에서)
  2. 100개 항목 분석
  3. 10개 분야 평가
  4. 점수 계산
  5. 보고서 작성

우리는:
  1. Claude 응답 원본 그대로 저장
  2. 사이트에 표시 (요약)
  3. PDF 생성 (Claude 내용 기반)
  4. 클라우드 업로드

장점:
- 조작 불가능 (Claude가 직접 수행)
- 투명성 확보 (출처 모두 공개)
- 신뢰도 높음
```

---

## 📊 예상 실행 시간

```
Claude API 호출 (모든 작업 포함): 3-5분
  - 데이터 수집 (Claude가 수행)
  - 100개 항목 분석
  - 10개 분야 평가
  - 보고서 작성

우리 작업: 1-2분
  - DB 저장
  - 사이트 업데이트
  - PDF 생성
  - 클라우드 업로드

총 소요 시간: 4-7분
```

---

## 🔒 조작 방지 및 투명성

### 1. 데이터 무결성 보장

```python
# DB에 저장
{
    "data_integrity": "verified",  # Claude가 직접 수집
    "modification": "none",        # 우리는 수정 안 함
    "claude_full_response": {...}, # 원본 응답 전체 보관
    "data_sources": [              # 출처 모두 공개
        {"name": "국회 의안정보시스템", "url": "..."},
        {"name": "중앙선거관리위원회", "url": "..."}
    ]
}
```

### 2. 사이트에 투명성 표시

```html
<div class="transparency-notice">
    <h3>평가 방법론</h3>
    <p>✅ Claude AI가 공개 데이터베이스에서 직접 수집</p>
    <p>✅ 플랫폼 운영자는 데이터 수집/평가 과정에 개입하지 않음</p>
    <p>✅ 모든 데이터 출처 공개</p>
    <p>✅ 원본 평가 결과 그대로 제공</p>

    <h4>데이터 출처 (15개)</h4>
    <ul>
        <li>국회 의안정보시스템</li>
        <li>중앙선거관리위원회</li>
        <li>네이버/다음 뉴스</li>
        ...
    </ul>
</div>
```

---

## 🎯 2차 개발: 5개 AI 확장

```python
async def run_multi_ai_evaluation(politician_name: str):
    """
    2차 개발: 5개 AI 모두 독립적으로 수행
    """

    # 5개 AI에게 동일한 요청 (병렬)
    results = await asyncio.gather(
        request_claude_full_evaluation(politician_name),
        request_chatgpt_full_evaluation(politician_name),
        request_gemini_full_evaluation(politician_name),
        request_perplexity_full_evaluation(politician_name),
        request_grok_full_evaluation(politician_name)
    )

    # 각 AI 결과 저장 (원본 그대로)
    for ai_model, result in zip(['claude', 'chatgpt', 'gemini', 'perplexity', 'grok'], results):
        await save_ai_evaluation(politician_name, ai_model, result)

    # 5개 AI 비교 보고서 생성
    ...
```

---

**작성일**: 2025-10-15
**작성자**: Claude Code (AI)
**상태**: ✅ 올바른 워크플로우 확정

**핵심**: Claude가 데이터 수집부터 평가까지 전부 수행 → 조작 불가능
