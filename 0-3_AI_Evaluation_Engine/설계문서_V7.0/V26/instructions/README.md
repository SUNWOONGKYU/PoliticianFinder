# V26.0 AI 평가 시스템 운영 가이드

**버전**: V26.0 Final
**작성일**: 2026-01-07

---

## 1. 폴더 구조

```
instructions_v26/
├── README.md                 ← 본 문서 (운영 가이드)
├── 1_politicians/            ← 정치인별 특별 지시사항
├── 2_collect/                ← 카테고리별 수집 지침서 (10개)
└── 3_evaluate/               ← 카테고리별 평가 지침서 (10개)
```

---

## 2. 파일 목록

### 1_politicians/ (정치인별)
- `{politician_id}_{이름}.md` 형식
- 예: `62e7b453_오세훈.md`, `17270f25_정원오.md`

### 2_collect/ (수집 지침서 10개)
| 파일 | 카테고리 |
|------|---------|
| cat01_expertise.md | 전문성 |
| cat02_leadership.md | 리더십 |
| cat03_vision.md | 비전 |
| cat04_integrity.md | 청렴성 |
| cat05_ethics.md | 윤리성 |
| cat06_accountability.md | 책임성 |
| cat07_transparency.md | 투명성 |
| cat08_communication.md | 소통능력 |
| cat09_responsiveness.md | 대응성 |
| cat10_publicinterest.md | 공익성 |

### 3_evaluate/ (평가 지침서 10개)
- 위와 동일한 파일명

---

## 3. 수집 단계 - AI 5개씩 × 2배치

### 배치 1 (AI 5개 병렬)
| AI | 카테고리 | 지침서 |
|----|---------|--------|
| AI 1 | 전문성 | 2_collect/cat01_expertise.md |
| AI 2 | 리더십 | 2_collect/cat02_leadership.md |
| AI 3 | 비전 | 2_collect/cat03_vision.md |
| AI 4 | 청렴성 | 2_collect/cat04_integrity.md |
| AI 5 | 윤리성 | 2_collect/cat05_ethics.md |

### 배치 2 (AI 5개 병렬)
| AI | 카테고리 | 지침서 |
|----|---------|--------|
| AI 6 | 책임성 | 2_collect/cat06_accountability.md |
| AI 7 | 투명성 | 2_collect/cat07_transparency.md |
| AI 8 | 소통능력 | 2_collect/cat08_communication.md |
| AI 9 | 대응성 | 2_collect/cat09_responsiveness.md |
| AI 10 | 공익성 | 2_collect/cat10_publicinterest.md |

### 각 AI에게 전달하는 내용
```
[1] 정치인 파일 (1_politicians/xxx.md)
[2] 해당 카테고리 수집 지침서 (2_collect/catXX.md)
```

### 수집 결과
- 카테고리당 50개 × 10개 카테고리 = **500개/정치인**
- 4개 AI × 500개 = **2,000개/정치인** (풀링 전체)

---

## 4. 평가 단계 - AI 5개씩 × 8배치

### 전체: 4개 AI × 10개 카테고리 = 40개 → 5개씩 8배치

| 배치 | AI | 카테고리 |
|------|-----|---------|
| 1 | Claude | cat01~05 (전문성~윤리성) |
| 2 | Claude | cat06~10 (책임성~공익성) |
| 3 | ChatGPT | cat01~05 |
| 4 | ChatGPT | cat06~10 |
| 5 | Grok | cat01~05 |
| 6 | Grok | cat06~10 |
| 7 | Gemini | cat01~05 |
| 8 | Gemini | cat06~10 |

### 각 AI에게 전달하는 내용
```
[1] 정치인 파일 (1_politicians/xxx.md)
[2] 해당 카테고리 평가 지침서 (3_evaluate/catXX.md)
[3] 평가 대상 데이터 (해당 카테고리 풀 200개)
```

### 평가 결과
- 카테고리당 200개 풀 × 4개 AI 평가 = **800개 평가/카테고리**
- 10개 카테고리 × 800개 = **8,000개 평가/정치인**

---

## 5. V26.0 핵심 규칙

### 기간 제한
| 출처 | 기간 |
|------|------|
| OFFICIAL | 최근 4년 (2022-01-07 ~ 2026-01-07) |
| PUBLIC | 최근 1년 (2025-01-07 ~ 2026-01-07) |

### 출처 비율
- OFFICIAL 50% + PUBLIC 50%
- 부정 주제 최소 20%

### 등급 체계 (8단계)
| 긍정 등급 | 부정 등급 |
|----------|----------|
| A (탁월함) | E (미흡함) |
| B (우수함) | F (부족함) |
| C (양호함) | G (매우 부족) |
| D (보통) | H (극히 부족) |

**※ 점수 변환은 4_scoring/ 문서 참조**

---

## 6. 실행 순서

```
[1단계] 정치인 파일 준비
    └── 1_politicians/{id}_{name}.md 생성

[2단계] 수집 실행 (배치 1)
    └── AI 5개 병렬: cat01~05

[3단계] 수집 실행 (배치 2)
    └── AI 5개 병렬: cat06~10

[4단계] 풀링
    └── 4개 AI 수집 결과 합치기 (카테고리당 200개)

[5단계] 평가 실행 (배치 1~8)
    └── AI 5개씩 8배치

[6단계] 점수 계산
    └── 카테고리별 평균 → 최종 점수
```

---

## 7. 비용 추정 (정치인 1명당)

| 항목 | 비용 |
|------|------|
| 수집 | ~$0.50 |
| 평가 | ~$2.23 |
| **총계** | **~$2.73** |

---

**V26.0 운영 가이드 끝**
