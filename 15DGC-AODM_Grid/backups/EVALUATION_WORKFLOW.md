# 정치인 평가 워크플로우 (Evaluation Workflow)

**작성일**: 2025-10-15
**목적**: 사용자 요청부터 보고서 다운로드까지 전체 자동화 프로세스 정의
**핵심**: 하나의 통합 워크플로우로 자동 실행

---

## 🔄 전체 워크플로우 (One-Click Process)

```
사용자 입력 (정치인 이름)
    ↓
보고서 신청 & 결제
    ↓
[자동 실행 시작] ← 하나의 워크플로우
    ↓
1단계: 100개 항목 데이터 수집 (자동)
    ↓
2단계: Claude API 평가 요청 (자동)
    ↓
3단계: 점수 계산 & DB 저장 (자동)
    ↓
4단계: PDF 보고서 생성 (자동)
    ↓
5단계: 사이트에 업로드 (자동)
    ↓
[자동 실행 완료]
    ↓
사용자 보고서 다운로드
```

---

## 📋 상세 워크플로우

### Stage 0: 사용자 요청

#### 0-1. 정치인 검색
```
사용자 → 검색창에 "박형준" 입력
        ↓
시스템 → DB에서 검색
        ↓
결과 → "박형준 (부산시장, 국민의힘)"
```

#### 0-2. 보고서 신청
```
사용자 → "평가 보고서 신청" 버튼 클릭
        ↓
시스템 → 결제 페이지 이동
        ↓
사용자 → 결제 (금액은 나중에 설정)
        ↓
시스템 → 결제 완료 확인
        ↓
시스템 → ✅ 워크플로우 자동 시작
```

---

### Stage 1: 데이터 수집 (자동)

#### 1-1. 공개 데이터 수집
```python
async def collect_public_data(politician_id: str) -> dict:
    """
    공개 데이터 소스에서 자동 수집
    """

    data = {}

    # 국회 의안정보시스템
    data['legislative'] = await fetch_from_assembly_api(politician_id)
    # - 법안 발의 수
    # - 출석률
    # - 위원회 활동

    # 선관위 재산공개
    data['assets'] = await fetch_from_nec_api(politician_id)
    # - 재산 총액
    # - 재산 공개 투명성

    # 언론 보도 수집
    data['media'] = await fetch_from_news_api(politician_id)
    # - 뉴스 기사 수집
    # - 감성 분석 (긍정/부정)

    # SNS 데이터
    data['social'] = await fetch_from_social_media(politician_id)
    # - 페이스북, 트위터, 인스타그램
    # - 소통 빈도

    return data
```

#### 1-2. 100개 항목 매핑
```python
async def map_to_100_items(raw_data: dict) -> dict:
    """
    수집된 데이터를 100개 항목으로 매핑
    """

    items_100 = {}

    # 의정활동 35개 항목
    items_100['본회의_출석률'] = raw_data['legislative']['attendance_rate']
    items_100['법안_발의_수'] = raw_data['legislative']['bills_proposed']
    # ... 나머지 33개

    # 정치 경력 25개 항목
    items_100['당선_횟수'] = raw_data['career']['election_wins']
    # ... 나머지 24개

    # 개인 정보 15개 항목
    items_100['학력'] = raw_data['profile']['education']
    # ... 나머지 14개

    # 경제/재산 10개 항목
    items_100['총재산'] = raw_data['assets']['total_assets']
    # ... 나머지 9개

    # 사회활동 15개 항목
    items_100['시민단체_활동'] = raw_data['social']['ngo_activities']
    # ... 나머지 14개

    return items_100
```

#### 1-3. 데이터 검증
```python
def validate_data(items_100: dict) -> dict:
    """
    데이터 완성도 확인
    """

    total_items = 100
    collected_items = sum(1 for v in items_100.values() if v is not None)

    coverage_rate = collected_items / total_items

    return {
        "total": total_items,
        "collected": collected_items,
        "coverage_rate": coverage_rate,
        "missing_items": [k for k, v in items_100.items() if v is None]
    }
```

---

### Stage 2: AI 평가 (자동)

#### 2-1. Claude API 호출 (1차 개발)

```python
import anthropic
import json

async def evaluate_with_claude(items_100: dict, politician_info: dict) -> dict:
    """
    Claude AI에게 평가 요청
    """

    client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)

    # 평가 프롬프트 생성
    prompt = generate_evaluation_prompt(items_100, politician_info)

    # Claude API 호출
    response = await client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4096,
        temperature=0.3,  # 일관성을 위해 낮은 temperature
        messages=[{
            "role": "user",
            "content": prompt
        }]
    )

    # 응답 파싱
    evaluation = json.loads(response.content[0].text)

    return evaluation
```

#### 2-2. 평가 프롬프트 생성

```python
def generate_evaluation_prompt(items_100: dict, politician_info: dict) -> str:
    """
    Claude에게 보낼 평가 프롬프트
    """

    prompt = f"""
당신은 정치인 평가 전문가입니다.

# 평가 대상 정치인
- 이름: {politician_info['name']}
- 직책: {politician_info['position']}
- 소속: {politician_info['party']}
- 출마 상태: {politician_info['status']}  # 출마 전/출마 후

# 평가 데이터 (100개 항목)
{json.dumps(items_100, ensure_ascii=False, indent=2)}

# 평가 기준
다음 10개 분야별로 0-10점으로 평가해주세요:

1. 청렴성 (Integrity)
   - 재산 공개 투명성, 부패 의혹, 윤리 위반 등

2. 전문성 (Competence)
   - 학력, 경력, 전문 자격, 입법 활동 실적 등

3. 소통능력 (Communication)
   - 질의 건수, 간담회, SNS 활동, 언론 출연 등

4. 리더십 (Leadership)
   - 정당 내 직책, 위원회 의장 경험, 법안 통과율 등

5. 책임감 (Accountability)
   - 출석률, 공약 이행률, 책임 회피 빈도 등

6. 투명성 (Transparency)
   - 의정비 공개, 정치자금 투명성, 일정 공개 등

7. 대응성 (Responsiveness)
   - 민원 응답 시간, 현안 대응 속도, SNS 응답률 등

8. 비전 (Vision)
   - 중장기 정책 비전, 미래 산업 이해도, 혁신성 등

9. 공익추구 (Public Interest)
   - 공익 법안 발의, 기부 활동, 사회적 약자 지원 등

10. 윤리성 (Ethics)
    - 형사 처벌 전력, 거짓말 논란, 혐오 발언 등

# 출력 형식 (JSON)
{{
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
    "청렴성": "재산 공개가 투명하고 부패 의혹이 없음. 다만...",
    "전문성": "박사 학위 보유, 관련 분야 20년 경력...",
    ...
  }},
  "strengths": [
    "전문성이 매우 뛰어남",
    "청렴성이 우수함",
    "비전이 명확함"
  ],
  "weaknesses": [
    "소통능력이 다소 부족함",
    "대응성 개선 필요"
  ],
  "overall_assessment": "전반적으로 우수한 정치인이나, 소통과 대응성 측면에서 개선이 필요함."
}}

위 형식으로 평가해주세요. JSON만 출력하세요.
"""

    return prompt
```

#### 2-3. 평가 결과 검증

```python
def validate_evaluation(evaluation: dict) -> bool:
    """
    Claude 평가 결과 검증
    """

    required_fields = ['category_scores', 'rationale', 'strengths', 'weaknesses', 'overall_assessment']

    # 필수 필드 확인
    if not all(field in evaluation for field in required_fields):
        return False

    # 10개 분야 점수 확인
    category_scores = evaluation['category_scores']
    required_categories = [
        '청렴성', '전문성', '소통능력', '리더십', '책임감',
        '투명성', '대응성', '비전', '공익추구', '윤리성'
    ]

    if not all(cat in category_scores for cat in required_categories):
        return False

    # 점수 범위 확인 (0-10)
    for score in category_scores.values():
        if not (0 <= score <= 10):
            return False

    return True
```

---

### Stage 3: 점수 계산 & DB 저장 (자동)

#### 3-1. PPS/PCS 점수 계산

```python
def calculate_final_score(
    category_scores: dict,
    politician_type: str,  # 'incumbent' or 'challenger'
    status: str,           # '출마전' or '출마후'
    position: str,         # '국회의원', '시장', '군수' 등
    region_type: str,      # '수도권', '광역시', '도지역'
    party: str             # '여당', '야당', '무소속'
) -> dict:
    """
    Claude가 준 10개 분야 점수를 최종 점수로 변환
    """

    # 직책별 가중치 적용
    weights = get_position_weights(position)
    weighted_scores = apply_weights(category_scores, weights)

    # 지역별 가중치 적용
    regional_weights = get_regional_weights(region_type)
    regional_scores = apply_weights(weighted_scores, regional_weights)

    # 정당별 조정
    party_adjustments = get_party_adjustments(party)
    adjusted_scores = apply_adjustments(regional_scores, party_adjustments)

    # 최종 점수 (0-100)
    final_score = sum(adjusted_scores.values()) * 10

    # 등급 (S/A/B/C/D)
    grade = calculate_grade(final_score)

    return {
        "pps_or_pcs": "pps" if status == "출마전" else "pcs",
        "category_scores": category_scores,  # Claude 원본 점수
        "weighted_scores": weighted_scores,  # 가중치 적용 후
        "final_score": round(final_score, 1),
        "grade": grade,
        "metadata": {
            "politician_type": politician_type,
            "status": status,
            "position": position,
            "region_type": region_type,
            "party": party
        }
    }
```

#### 3-2. DB 저장

```python
async def save_evaluation_to_db(
    politician_id: str,
    raw_data_100: dict,
    claude_evaluation: dict,
    final_scores: dict
) -> str:
    """
    평가 결과 DB 저장
    """

    # politician_evaluations 테이블에 저장
    evaluation = await db.politician_evaluations.create({
        "politician_id": politician_id,
        "ai_model": "claude",
        "raw_data_100": raw_data_100,
        "claude_evaluation": claude_evaluation,  # Claude 원본 응답
        "category_scores": final_scores['category_scores'],
        "final_score": final_scores['final_score'],
        "grade": final_scores['grade'],
        "pps_or_pcs": final_scores['pps_or_pcs'],
        "metadata": final_scores['metadata'],
        "created_at": datetime.now()
    })

    return evaluation.id
```

---

### Stage 4: PDF 보고서 생성 (자동)

#### 4-1. 보고서 템플릿

```python
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet

async def generate_pdf_report(
    politician_info: dict,
    evaluation: dict,
    final_scores: dict
) -> str:
    """
    PDF 보고서 생성
    """

    # 파일명 생성
    filename = f"report_{politician_info['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = f"reports/{filename}"

    # PDF 문서 생성
    doc = SimpleDocTemplate(filepath, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    # 1. 표지
    story.append(Paragraph("정치인 평가 보고서", styles['Title']))
    story.append(Spacer(1, 20))

    # 2. 기본 정보
    story.append(Paragraph(f"이름: {politician_info['name']}", styles['Normal']))
    story.append(Paragraph(f"직책: {politician_info['position']}", styles['Normal']))
    story.append(Paragraph(f"소속: {politician_info['party']}", styles['Normal']))
    story.append(Spacer(1, 20))

    # 3. 종합 평가
    story.append(Paragraph("종합 평가", styles['Heading1']))
    story.append(Paragraph(f"최종 점수: {final_scores['final_score']}점", styles['Normal']))
    story.append(Paragraph(f"등급: {final_scores['grade']}급", styles['Normal']))
    story.append(Spacer(1, 20))

    # 4. 10개 분야별 점수 (테이블)
    story.append(Paragraph("분야별 평가", styles['Heading1']))

    data = [['분야', '점수 (0-10)', '평가 근거']]
    for category, score in evaluation['category_scores'].items():
        rationale = evaluation['rationale'][category][:50] + "..."  # 요약
        data.append([category, f"{score}점", rationale])

    table = Table(data)
    table.setStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ])
    story.append(table)
    story.append(Spacer(1, 20))

    # 5. 강점 & 약점
    story.append(Paragraph("강점", styles['Heading2']))
    for strength in evaluation['strengths']:
        story.append(Paragraph(f"• {strength}", styles['Normal']))
    story.append(Spacer(1, 10))

    story.append(Paragraph("약점", styles['Heading2']))
    for weakness in evaluation['weaknesses']:
        story.append(Paragraph(f"• {weakness}", styles['Normal']))
    story.append(Spacer(1, 20))

    # 6. 종합 의견
    story.append(Paragraph("종합 의견", styles['Heading1']))
    story.append(Paragraph(evaluation['overall_assessment'], styles['Normal']))

    # PDF 생성
    doc.build(story)

    return filepath
```

---

### Stage 5: 사이트 업로드 (자동)

#### 5-1. 파일 업로드

```python
async def upload_report_to_storage(filepath: str) -> str:
    """
    생성된 PDF를 클라우드 스토리지에 업로드
    """

    # Supabase Storage 또는 AWS S3
    from supabase import create_client

    supabase = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY
    )

    # 파일 업로드
    with open(filepath, 'rb') as f:
        response = supabase.storage.from_('reports').upload(
            path=filepath,
            file=f
        )

    # 공개 URL 생성
    public_url = supabase.storage.from_('reports').get_public_url(filepath)

    return public_url
```

#### 5-2. DB 업데이트

```python
async def update_report_status(evaluation_id: str, pdf_url: str):
    """
    보고서 생성 완료 상태 업데이트
    """

    await db.politician_evaluations.update(
        where={"id": evaluation_id},
        data={
            "pdf_url": pdf_url,
            "status": "completed",
            "completed_at": datetime.now()
        }
    )
```

---

## 🚀 전체 워크플로우 통합 함수

### 메인 워크플로우

```python
async def run_evaluation_workflow(
    politician_id: str,
    payment_id: str
) -> dict:
    """
    전체 평가 워크플로우 실행
    하나의 함수로 모든 단계 자동 실행
    """

    try:
        # Stage 0: 정치인 정보 조회
        politician_info = await db.politicians.find_one({"id": politician_id})

        # Stage 1: 데이터 수집
        print("📊 Stage 1: 데이터 수집 시작...")
        raw_data = await collect_public_data(politician_id)
        items_100 = await map_to_100_items(raw_data)
        data_validation = validate_data(items_100)
        print(f"✅ 데이터 수집 완료: {data_validation['coverage_rate']*100}%")

        # Stage 2: AI 평가 (Claude)
        print("🤖 Stage 2: Claude AI 평가 요청...")
        claude_evaluation = await evaluate_with_claude(items_100, politician_info)

        if not validate_evaluation(claude_evaluation):
            raise ValueError("Claude 평가 결과 검증 실패")

        print("✅ Claude 평가 완료")

        # Stage 3: 점수 계산 & DB 저장
        print("💾 Stage 3: 점수 계산 및 저장...")
        final_scores = calculate_final_score(
            category_scores=claude_evaluation['category_scores'],
            politician_type=politician_info['type'],
            status=politician_info['status'],
            position=politician_info['position'],
            region_type=politician_info['region_type'],
            party=politician_info['party']
        )

        evaluation_id = await save_evaluation_to_db(
            politician_id=politician_id,
            raw_data_100=items_100,
            claude_evaluation=claude_evaluation,
            final_scores=final_scores
        )
        print(f"✅ DB 저장 완료: {evaluation_id}")

        # Stage 4: PDF 보고서 생성
        print("📄 Stage 4: PDF 보고서 생성...")
        pdf_filepath = await generate_pdf_report(
            politician_info=politician_info,
            evaluation=claude_evaluation,
            final_scores=final_scores
        )
        print(f"✅ PDF 생성 완료: {pdf_filepath}")

        # Stage 5: 업로드 및 완료
        print("☁️ Stage 5: 클라우드 업로드...")
        pdf_url = await upload_report_to_storage(pdf_filepath)
        await update_report_status(evaluation_id, pdf_url)
        print(f"✅ 업로드 완료: {pdf_url}")

        # 결제 상태 업데이트
        await db.payments.update(
            where={"id": payment_id},
            data={
                "status": "completed",
                "evaluation_id": evaluation_id
            }
        )

        # 사용자에게 알림
        await send_notification(
            user_id=politician_info['user_id'],
            message=f"{politician_info['name']} 평가 보고서가 생성되었습니다.",
            pdf_url=pdf_url
        )

        print("🎉 전체 워크플로우 완료!")

        return {
            "success": True,
            "evaluation_id": evaluation_id,
            "pdf_url": pdf_url,
            "final_score": final_scores['final_score'],
            "grade": final_scores['grade']
        }

    except Exception as e:
        print(f"❌ 워크플로우 실패: {str(e)}")

        # 결제 환불 처리
        await refund_payment(payment_id)

        return {
            "success": False,
            "error": str(e)
        }
```

---

## 🎯 API 엔드포인트

### 보고서 신청 API

```python
@router.post("/reports/request")
async def request_evaluation_report(
    request: ReportRequest,
    current_user: User = Depends(get_current_user)
):
    """
    보고서 신청 및 결제

    Request Body:
    {
        "politician_id": "uuid",
        "payment_method": "card"
    }
    """

    # 1. 결제 처리
    payment = await process_payment(
        user_id=current_user.id,
        politician_id=request.politician_id,
        amount=settings.REPORT_PRICE,  # 가격은 설정 파일에서
        payment_method=request.payment_method
    )

    if not payment.success:
        raise HTTPException(status_code=400, detail="결제 실패")

    # 2. 백그라운드에서 워크플로우 실행
    background_tasks.add_task(
        run_evaluation_workflow,
        politician_id=request.politician_id,
        payment_id=payment.id
    )

    return {
        "message": "보고서 생성이 시작되었습니다. 완료되면 알림을 보내드립니다.",
        "payment_id": payment.id,
        "estimated_time": "5-10분"
    }
```

### 보고서 조회 API

```python
@router.get("/reports/{evaluation_id}")
async def get_evaluation_report(
    evaluation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    생성된 보고서 조회 및 다운로드
    """

    evaluation = await db.politician_evaluations.find_one({"id": evaluation_id})

    if not evaluation:
        raise HTTPException(status_code=404, detail="보고서를 찾을 수 없습니다")

    # 결제 확인
    payment = await db.payments.find_one({
        "user_id": current_user.id,
        "evaluation_id": evaluation_id,
        "status": "completed"
    })

    if not payment:
        raise HTTPException(status_code=403, detail="결제가 필요합니다")

    return {
        "evaluation_id": evaluation.id,
        "politician_name": evaluation.politician_info['name'],
        "final_score": evaluation.final_score,
        "grade": evaluation.grade,
        "pdf_url": evaluation.pdf_url,
        "created_at": evaluation.created_at
    }
```

---

## ⏱️ 예상 실행 시간

```
Stage 1: 데이터 수집 (1-3분)
  - 공개 API 호출 (30초)
  - 언론 크롤링 (1분)
  - 데이터 매핑 (30초)

Stage 2: Claude AI 평가 (1-2분)
  - Claude API 호출 (30초~1분)
  - 응답 파싱 (5초)

Stage 3: 점수 계산 & 저장 (10초)
  - 가중치 계산 (1초)
  - DB 저장 (5초)

Stage 4: PDF 생성 (30초~1분)
  - 템플릿 렌더링 (10초)
  - PDF 변환 (20초)

Stage 5: 업로드 (10초)
  - 클라우드 업로드 (5초)
  - DB 업데이트 (5초)

총 예상 시간: 3-7분
```

---

## 🔄 2차 개발: 5개 AI 확장

### 수정된 워크플로우

```python
async def run_evaluation_workflow_multi_ai(
    politician_id: str,
    payment_id: str
):
    """
    2차 개발: 5개 AI 동시 평가
    """

    # Stage 1: 데이터 수집 (동일)
    items_100 = await collect_and_map_data(politician_id)

    # Stage 2: 5개 AI 병렬 평가
    evaluations = await asyncio.gather(
        evaluate_with_claude(items_100, politician_info),
        evaluate_with_chatgpt(items_100, politician_info),
        evaluate_with_gemini(items_100, politician_info),
        evaluate_with_perplexity(items_100, politician_info),
        evaluate_with_grok(items_100, politician_info)
    )

    # Stage 3: 각 AI별 점수 계산 및 저장
    for ai_model, evaluation in zip(['claude', 'chatgpt', 'gemini', 'perplexity', 'grok'], evaluations):
        await save_evaluation_to_db(politician_id, ai_model, evaluation)

    # Stage 4: 5개 AI 비교 보고서 생성
    pdf_filepath = await generate_pdf_report_multi_ai(evaluations)

    # Stage 5: 업로드 및 완료 (동일)
    ...
```

---

## 📋 다음 단계

### 1차 개발 우선순위

1. **Database 스키마 구현**
   - politicians 테이블
   - politician_evaluations 테이블
   - payments 테이블

2. **데이터 수집 시스템**
   - 국회 API 연동
   - 선관위 API 연동
   - 뉴스 크롤링

3. **Claude API 연동**
   - 평가 프롬프트 최적화
   - 응답 파싱 로직

4. **보고서 생성 엔진**
   - PDF 템플릿 디자인
   - 차트/그래프 생성

5. **결제 시스템**
   - Stripe 또는 토스페이먼츠
   - 가격 설정은 환경변수로

---

**작성일**: 2025-10-15
**작성자**: Claude Code (AI)
**상태**: ✅ 워크플로우 정의 완료

**핵심**: 사용자가 정치인 이름만 입력하면, 전체 프로세스가 자동으로 실행되어 보고서가 생성됨
