# 평가 점수 계산 체계 변형 시스템

**작성일**: 2025-10-15
**목적**: 출마 전/후, 직책별, 지역별, 정당별 평가 체계 차별화
**핵심**: 동일한 100개 항목 → 상황에 따라 다른 계산 방식 적용

---

## 🎯 평가 시점에 따른 구분

### 1️⃣ 출마 전 평가: PPS (Political Possibility Score)
**대상**: 아직 공식 출마 선언 전인 잠재적 후보자

#### 특징
- 📊 **데이터 수집률**: 30-50% (매우 제한적)
- 🎯 **평가 목적**: 정치 입문 가능성 및 잠재력 평가
- ⚖️ **가중치**: 과거 경력 및 인물 검증 중심

#### 평가 가능 항목 (약 50개/100개)
```python
PPS_AVAILABLE_CATEGORIES = {
    "청렴성": 50%,      # 과거 재산, 범죄 전력, 윤리성 검증 가능
    "전문성": 80%,      # 학력, 경력, 자격증 확인 가능
    "소통능력": 40%,    # SNS, 언론 출연 정도만 확인 가능
    "리더십": 30%,      # 과거 조직 경험만 확인 가능
    "책임감": 20%,      # 데이터 거의 없음
    "투명성": 40%,      # 공개 의지만 확인 가능
    "대응성": 30%,      # 과거 경력 기반 추정
    "비전": 70%,        # 공약, 비전 제시 가능
    "공익추구": 60%,    # 과거 봉사, 기부 활동 확인 가능
    "윤리성": 70%       # 과거 전력 검증 가능
}
```

#### PPS 계산 공식
```python
def calculate_pps(politician_data):
    """출마 전 평가"""
    total_score = 0
    weight_sum = 0

    for category in CATEGORIES_10:
        items = extract_items(category, politician_data)
        available_items = [item for item in items if item is not None]

        if len(available_items) == 0:
            # 데이터가 하나도 없으면 해당 분야 제외
            continue

        # 수집 가능한 항목만으로 점수 계산
        category_score = sum(available_items) / len(available_items)

        # 데이터 부족 페널티 적용
        coverage_rate = len(available_items) / 10  # 10개 중 몇 개 수집했는지
        penalty = 0.7 + (coverage_rate * 0.3)  # 최소 0.7, 최대 1.0

        adjusted_score = category_score * penalty

        total_score += adjusted_score
        weight_sum += 1

    # 전체 평균
    pps = (total_score / weight_sum) * 10  # 0-100점으로 변환

    return {
        "pps_score": round(pps, 1),
        "grade": calculate_grade(pps),
        "reliability": f"{int((weight_sum/10)*100)}%",  # 신뢰도
        "note": "출마 전 평가 - 데이터 제한적"
    }
```

#### PPS 예시
```json
{
  "name": "김○○",
  "status": "출마 전 (잠재 후보)",
  "pps_score": 72.5,
  "grade": "B",
  "reliability": "60%",
  "category_scores": {
    "청렴성": 8.5,
    "전문성": 9.0,
    "소통능력": 6.5,
    "리더십": 7.0,
    "책임감": null,  // 데이터 없음
    "투명성": 7.5,
    "대응성": 6.0,
    "비전": 8.0,
    "공익추구": 7.5,
    "윤리성": 9.0
  },
  "note": "전문성 우수, 책임감 항목은 출마 후 평가 필요"
}
```

---

### 2️⃣ 출마 후 평가: PCS (Politician Competitiveness Score)
**대상**: 공식 출마 선언 후 ~ 선거일까지

#### 특징
- 📊 **데이터 수집률**: 60-75% (신인 후보자 기준)
- 🎯 **평가 목적**: 선거 경쟁력 및 당선 가능성 평가
- ⚖️ **가중치**: 공약, 소통능력, 선거 활동 중심

#### 평가 가능 항목 (약 70개/100개)
```python
PCS_AVAILABLE_CATEGORIES = {
    "청렴성": 70%,      # 출마 후 재산 공개, 정치자금 투명성 추가
    "전문성": 85%,      # 공약 전문성 평가 추가
    "소통능력": 85%,    # 토론회, 간담회, SNS 활동 대폭 증가
    "리더십": 60%,      # 선거 캠프 운영 능력 추가
    "책임감": 50%,      # 공약 이행 계획, 대응성 평가 가능
    "투명성": 70%,      # 일정 공개, 후원금 공개 확인 가능
    "대응성": 70%,      # 유권자 질의 응답, 현안 대응 평가
    "비전": 90%,        # 공약집, 정책 토론 풍부
    "공익추구": 75%,    # 공익 공약, 선거 활동 분석 가능
    "윤리성": 80%       # 선거 과정 윤리성 추가 검증
}
```

#### PCS 계산 공식
```python
def calculate_pcs(politician_data, politician_type):
    """출마 후 평가 (신인 vs 기성 구분)"""
    total_score = 0

    for category in CATEGORIES_10:
        items = extract_items(category, politician_data)
        available_items = [item for item in items if item is not None]

        if politician_type == "incumbent":
            # 기성 정치인: 직접 데이터만 사용
            if len(available_items) == 0:
                category_score = 0
            else:
                category_score = sum(available_items) / len(available_items)

        elif politician_type == "challenger":
            # 신인 후보자: 대체 지표 활용
            if len(available_items) == 0:
                # 대체 지표도 없으면 0점
                category_score = 0
            else:
                # 직접 수집 항목 점수
                direct_score = sum(available_items) / len(available_items)

                # 대체 지표 점수
                proxy_items = get_proxy_indicators(category, politician_data)
                if len(proxy_items) > 0:
                    proxy_score = sum(proxy_items) / len(proxy_items) * 0.8  # 페널티
                    # 가중 평균
                    category_score = direct_score * 0.7 + proxy_score * 0.3
                else:
                    category_score = direct_score

        total_score += category_score

    pcs = total_score * 10  # 0-100점 변환

    return {
        "pcs_score": round(pcs, 1),
        "grade": calculate_grade(pcs),
        "politician_type": politician_type,
        "note": "출마 후 평가 - 선거 경쟁력"
    }
```

#### PCS 예시 (신인 후보자)
```json
{
  "name": "이○○",
  "status": "출마 후 (신인 후보)",
  "pcs_score": 78.2,
  "grade": "B",
  "reliability": "75%",
  "category_scores": {
    "청렴성": 8.0,
    "전문성": 8.5,
    "소통능력": 7.8,
    "리더십": 7.2,
    "책임감": 7.5,
    "투명성": 8.2,
    "대응성": 7.6,
    "비전": 8.8,
    "공익추구": 7.8,
    "윤리성": 8.8
  },
  "note": "비전과 윤리성 우수, 선거 경쟁력 양호"
}
```

---

## 🏛️ 직책별 평가 가중치 차별화

### 1️⃣ 국회의원 평가 가중치
**특징**: 입법 활동, 국정 감사, 예산 심의 중심

```python
WEIGHTS_CONGRESSMAN = {
    "청렴성": 1.2,      # 높은 윤리 기준
    "전문성": 1.3,      # 입법 전문성 중요
    "소통능력": 1.0,
    "리더십": 1.1,
    "책임감": 1.2,      # 출석률, 공약 이행
    "투명성": 1.1,
    "대응성": 0.9,
    "비전": 1.1,        # 국가 비전
    "공익추구": 1.0,
    "윤리성": 1.2
}
```

#### 평가 항목 중점
- ✅ 법안 발의 건수 (항목 2.4)
- ✅ 위원회 활동 (항목 2.5)
- ✅ 본회의 출석률 (항목 5.1)
- ✅ 공약 이행률 (항목 5.3)
- ✅ 국회 질의 건수 (항목 3.1)

---

### 2️⃣ 시장/도지사 평가 가중치
**특징**: 행정 능력, 지역 발전, 예산 집행 중심

```python
WEIGHTS_MAYOR_GOVERNOR = {
    "청렴성": 1.3,      # 매우 중요 (예산 집행)
    "전문성": 1.2,      # 행정 전문성
    "소통능력": 1.2,    # 주민 소통
    "리더십": 1.4,      # 가장 중요 (조직 관리)
    "책임감": 1.3,      # 공약 이행
    "투명성": 1.2,
    "대응성": 1.3,      # 재난, 현안 대응
    "비전": 1.1,        # 지역 발전 비전
    "공익추구": 1.0,
    "윤리성": 1.3
}
```

#### 평가 항목 중점
- ✅ 예산 확보 실적 (항목 2.7)
- ✅ 지역 현안 대응 (항목 7.2)
- ✅ 재난 재해 대응 (항목 7.3)
- ✅ 지역 발전 비전 (항목 8.7)
- ✅ 팀 구축 능력 (항목 4.5)

---

### 3️⃣ 군수/구청장 평가 가중치
**특징**: 주민 밀착형 행정, 민원 처리, 소통 중심

```python
WEIGHTS_DISTRICT_HEAD = {
    "청렴성": 1.2,
    "전문성": 1.0,      # 전문성보다 실행력
    "소통능력": 1.4,    # 가장 중요 (주민 소통)
    "리더십": 1.1,
    "책임감": 1.3,
    "투명성": 1.1,
    "대응성": 1.4,      # 가장 중요 (민원 처리)
    "비전": 0.9,        # 상대적으로 덜 중요
    "공익추구": 1.2,
    "윤리성": 1.2
}
```

#### 평가 항목 중점
- ✅ 민원 응답 시간 (항목 7.1)
- ✅ 민원 처리 속도 (항목 3.5)
- ✅ 지역구 간담회 (항목 3.2)
- ✅ 주민 만족도 (항목 3.8)
- ✅ 지역 공동체 기여 (항목 9.6)

---

### 4️⃣ 지방의회 의원 평가 가중치
**특징**: 조례 제정, 예산 감시, 지역 대표성

```python
WEIGHTS_LOCAL_COUNCIL = {
    "청렴성": 1.1,
    "전문성": 1.1,
    "소통능력": 1.3,    # 주민 소통 중요
    "리더십": 0.9,      # 상대적으로 덜 중요
    "책임감": 1.2,
    "투명성": 1.1,
    "대응성": 1.3,
    "비전": 1.0,
    "공익추구": 1.2,
    "윤리성": 1.1
}
```

---

## 🗺️ 지역별 평가 체계

### 1️⃣ 수도권 (서울/경기/인천)
```python
REGIONAL_FOCUS_CAPITAL = {
    "주요 이슈": ["교통", "주택", "환경", "일자리"],
    "가중치_조정": {
        "전문성": +0.1,     # 복잡한 도시 문제
        "소통능력": +0.2,   # 다양한 계층
        "비전": +0.1        # 미래 산업
    }
}
```

### 2️⃣ 광역시 (부산/대구/광주/대전/울산)
```python
REGIONAL_FOCUS_METRO = {
    "주요 이슈": ["지역경제", "청년유출", "산업재편"],
    "가중치_조정": {
        "리더십": +0.2,     # 지역 경제 활성화
        "비전": +0.2,       # 지역 재생
        "공익추구": +0.1
    }
}
```

### 3️⃣ 도 지역 (경북/경남/전북/전남/충북/충남/강원/제주)
```python
REGIONAL_FOCUS_PROVINCE = {
    "주요 이슈": ["농업", "인구감소", "교육", "의료"],
    "가중치_조정": {
        "대응성": +0.2,     # 주민 밀착 행정
        "공익추구": +0.2,   # 농어촌 발전
        "책임감": +0.1
    }
}
```

---

## 🎭 정당별 평가 체계

### 1️⃣ 여당 정치인 평가
```python
PARTY_INCUMBENT_RULING = {
    "평가_중점": [
        "공약 이행률",       # 집권당이므로 실행 가능성 높음
        "정부 정책 실현",
        "책임감"
    ],
    "가중치_조정": {
        "책임감": +0.2,     # 집권 책임
        "공약이행": +0.3,   # 실행 능력 평가
        "투명성": +0.1
    },
    "페널티": {
        "공약_미이행": -2.0,  # 여당은 실행력 있으므로 미이행 시 큰 감점
        "부패_의혹": -3.0
    }
}
```

### 2️⃣ 야당 정치인 평가
```python
PARTY_INCUMBENT_OPPOSITION = {
    "평가_중점": [
        "감시 활동",         # 견제와 균형
        "대안 정책 제시",
        "비전"
    ],
    "가중치_조정": {
        "비전": +0.2,       # 대안 제시 능력
        "전문성": +0.1,     # 정책 분석 능력
        "소통능력": +0.1
    },
    "페널티": {
        "공약_미이행": -1.0,  # 집권 기회 없으므로 완화
        "비판만_하고_대안_없음": -2.0
    }
}
```

### 3️⃣ 무소속 정치인 평가
```python
PARTY_INDEPENDENT = {
    "평가_중점": [
        "지역 기여도",
        "독립성",
        "청렴성"
    ],
    "가중치_조정": {
        "청렴성": +0.2,     # 정당 배경 없으므로 개인 청렴성 중요
        "공익추구": +0.2,
        "지역기여": +0.2
    },
    "보너스": {
        "정당_압력_없는_독립_결정": +1.0
    }
}
```

---

## 🧮 종합 점수 계산 알고리즘

### 최종 점수 공식
```python
def calculate_final_score(
    politician_data,
    status,           # "출마전" or "출마후"
    politician_type,  # "incumbent" or "challenger"
    position,         # "국회의원" or "시장" or "군수" or "의원"
    region,           # "수도권" or "광역시" or "도지역"
    party             # "여당" or "야당" or "무소속"
):
    """종합 평가 점수 계산"""

    # 1단계: 기본 점수 계산
    if status == "출마전":
        base_scores = calculate_pps(politician_data)
    else:
        base_scores = calculate_pcs(politician_data, politician_type)

    # 2단계: 직책별 가중치 적용
    position_weights = get_position_weights(position)
    weighted_scores = apply_weights(base_scores, position_weights)

    # 3단계: 지역별 가중치 적용
    regional_weights = get_regional_weights(region)
    regional_scores = apply_weights(weighted_scores, regional_weights)

    # 4단계: 정당별 가중치 및 페널티 적용
    party_adjustments = get_party_adjustments(party, politician_data)
    final_scores = apply_adjustments(regional_scores, party_adjustments)

    # 5단계: 최종 점수 산출
    final_score = sum(final_scores.values()) * 10  # 0-100점
    grade = calculate_grade(final_score)

    return {
        "final_score": round(final_score, 1),
        "grade": grade,
        "category_scores": final_scores,
        "metadata": {
            "status": status,
            "politician_type": politician_type,
            "position": position,
            "region": region,
            "party": party
        }
    }
```

---

## 📋 실제 적용 예시

### 예시 1: 신인 후보 (출마 후, 국회의원, 수도권, 무소속)
```json
{
  "name": "박○○",
  "status": "출마 후",
  "politician_type": "challenger",
  "position": "국회의원",
  "region": "서울 강남구",
  "party": "무소속",

  "base_pcs_score": 76.5,

  "adjustments": {
    "position_weight": +2.3,    // 국회의원 가중치 (전문성, 책임감)
    "regional_weight": +1.2,    // 수도권 (비전, 소통능력)
    "party_bonus": +1.5,        // 무소속 (청렴성 보너스)
    "data_penalty": -3.0        // 신인이라 데이터 부족
  },

  "final_score": 78.5,
  "grade": "B",

  "category_scores": {
    "청렴성": 8.8,  // 무소속 보너스 적용
    "전문성": 8.2,  // 국회의원 가중치 적용
    "소통능력": 7.8,
    "리더십": 7.0,
    "책임감": 7.5,
    "투명성": 8.0,
    "대응성": 7.2,
    "비전": 8.5,  // 수도권 가중치 적용
    "공익추구": 8.0,
    "윤리성": 8.5
  }
}
```

### 예시 2: 기성 정치인 (출마 후, 시장, 광역시, 여당)
```json
{
  "name": "최○○",
  "status": "출마 후 (재선 도전)",
  "politician_type": "incumbent",
  "position": "시장",
  "region": "부산광역시",
  "party": "여당",

  "base_pcs_score": 85.0,

  "adjustments": {
    "position_weight": +3.5,    // 시장 가중치 (리더십, 대응성)
    "regional_weight": +1.8,    // 광역시 (지역경제, 비전)
    "party_weight": +2.0,       // 여당 (공약이행 실적)
    "incumbency_bonus": +2.0    // 재선 도전 (경험 보너스)
  },

  "final_score": 94.3,
  "grade": "A",

  "category_scores": {
    "청렴성": 9.0,
    "전문성": 9.5,
    "소통능력": 9.2,
    "리더십": 9.8,  // 시장 가중치 강하게 적용
    "책임감": 9.5,  // 공약 이행률 우수
    "투명성": 9.0,
    "대응성": 9.6,  // 시장 가중치 강하게 적용
    "비전": 9.2,    // 광역시 가중치 적용
    "공익추구": 9.0,
    "윤리성": 9.5
  }
}
```

---

## 🗂️ 데이터베이스 스키마 업데이트

### politician_evaluations 테이블 확장
```sql
CREATE TABLE politician_evaluations (
    id UUID PRIMARY KEY,
    politician_id UUID REFERENCES politicians(id),

    -- 평가 시점 구분
    evaluation_status VARCHAR(10) CHECK (evaluation_status IN ('출마전', '출마후')),
    politician_type VARCHAR(10) CHECK (politician_type IN ('incumbent', 'challenger')),

    -- 직책/지역/정당 정보
    position VARCHAR(20) CHECK (position IN ('국회의원', '시장', '도지사', '군수', '구청장', '지방의원')),
    region VARCHAR(50),
    region_type VARCHAR(10) CHECK (region_type IN ('수도권', '광역시', '도지역')),
    party VARCHAR(20) CHECK (party IN ('여당', '야당', '무소속')),

    -- 점수 데이터
    raw_data_100 JSONB NOT NULL,
    category_scores JSONB NOT NULL,
    base_score DECIMAL(5,2),

    -- 가중치 및 조정
    position_weights JSONB,
    regional_weights JSONB,
    party_adjustments JSONB,

    -- 최종 점수
    final_score DECIMAL(5,2) NOT NULL,
    grade VARCHAR(1) CHECK (grade IN ('S', 'A', 'B', 'C', 'D')),

    -- 메타데이터
    reliability_percentage INTEGER,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ai_model VARCHAR(20),

    UNIQUE(politician_id, evaluation_status, ai_model, evaluated_at)
);

-- 인덱스 생성
CREATE INDEX idx_evaluation_position ON politician_evaluations(position);
CREATE INDEX idx_evaluation_region ON politician_evaluations(region_type);
CREATE INDEX idx_evaluation_party ON politician_evaluations(party);
CREATE INDEX idx_evaluation_status ON politician_evaluations(evaluation_status);
CREATE INDEX idx_evaluation_score ON politician_evaluations(final_score DESC);
```

---

## 📊 API 엔드포인트 설계

### 1. 평가 요청 API
```python
@router.post("/politicians/{politician_id}/evaluate")
async def evaluate_politician(
    politician_id: str,
    evaluation_request: EvaluationRequest
):
    """
    정치인 평가 요청

    Request Body:
    {
        "status": "출마후",
        "politician_type": "challenger",
        "position": "국회의원",
        "region": "서울 강남구",
        "region_type": "수도권",
        "party": "무소속",
        "ai_model": "claude"
    }
    """

    # 1. 100개 항목 데이터 수집
    raw_data = await collect_100_items(politician_id)

    # 2. 점수 계산
    final_scores = calculate_final_score(
        politician_data=raw_data,
        status=evaluation_request.status,
        politician_type=evaluation_request.politician_type,
        position=evaluation_request.position,
        region=evaluation_request.region_type,
        party=evaluation_request.party
    )

    # 3. DB 저장
    await save_evaluation(politician_id, final_scores, evaluation_request)

    return final_scores
```

### 2. 평가 조회 API
```python
@router.get("/politicians/{politician_id}/scores")
async def get_politician_scores(
    politician_id: str,
    status: str = Query("출마후"),
    position: str = Query(None)
):
    """
    정치인 평가 결과 조회

    Query Parameters:
    - status: "출마전" or "출마후"
    - position: "국회의원", "시장" 등 (선택)
    """

    scores = await db.query(
        "SELECT * FROM politician_evaluations WHERE politician_id = $1 AND evaluation_status = $2",
        politician_id,
        status
    )

    return scores
```

### 3. 지역별 랭킹 API
```python
@router.get("/rankings/region/{region_type}")
async def get_regional_rankings(
    region_type: str,
    position: str = Query(None),
    limit: int = Query(10)
):
    """
    지역별 정치인 랭킹

    Path Parameters:
    - region_type: "수도권", "광역시", "도지역"

    Query Parameters:
    - position: "국회의원", "시장" 등 (선택)
    - limit: 상위 몇 명 (기본 10)
    """

    rankings = await db.query(
        """
        SELECT p.name, e.final_score, e.grade
        FROM politicians p
        JOIN politician_evaluations e ON p.id = e.politician_id
        WHERE e.region_type = $1
        ORDER BY e.final_score DESC
        LIMIT $2
        """,
        region_type,
        limit
    )

    return rankings
```

---

## 🎯 다음 단계

### 1. Python 구현
- [ ] PPS 계산 함수 구현
- [ ] PCS 계산 함수 구현
- [ ] 직책별 가중치 적용 함수
- [ ] 지역별/정당별 조정 함수
- [ ] 최종 점수 산출 함수

### 2. 데이터베이스 마이그레이션
- [ ] politician_evaluations 테이블 생성
- [ ] 인덱스 추가
- [ ] 테스트 데이터 생성

### 3. API 개발
- [ ] 평가 요청 엔드포인트
- [ ] 평가 조회 엔드포인트
- [ ] 랭킹 엔드포인트
- [ ] 필터링/정렬 기능

### 4. 프론트엔드 UI
- [ ] 평가 결과 대시보드
- [ ] 지역별/정당별/직책별 필터
- [ ] 상세 점수 breakdown 표시

---

**작성일**: 2025-10-15
**작성자**: Claude Code (AI)
**상태**: ✅ 완료

**핵심 포인트**:
- 출마 전(PPS) vs 출마 후(PCS) 계산 방식 완전 분리
- 직책별(국회의원/시장/군수/의원) 가중치 차별화
- 지역별(수도권/광역시/도지역) 이슈 반영
- 정당별(여당/야당/무소속) 평가 기준 조정
- 100개 항목은 동일, 계산 로직만 변형
