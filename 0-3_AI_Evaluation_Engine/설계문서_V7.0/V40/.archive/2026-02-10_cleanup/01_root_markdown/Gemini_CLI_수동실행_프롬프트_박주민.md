# Gemini CLI 수동 실행 프롬프트 - 박주민

**작성일**: 2026-02-11
**목적**: 최소 목표 1,000개 달성을 위한 6개 카테고리 추가 수집
**대상**: 규칙 100% 준수 (각 카테고리 100개 달성)

---

## 📊 현재 상황 요약

### 전체 현황
- **현재**: 988/1,000 (98.8%)
- **목표**: 1,000개 (최소 목표)
- **부족**: 12개

### 카테고리별 현황

| 순번 | 카테고리 | 현재 | 목표 | 부족 | 우선순위 |
|------|----------|------|------|------|----------|
| 1 | vision (비전) | 88 | 100 | **-12** | 🔴 최우선 |
| 2 | transparency (투명성) | 88 | 100 | **-12** | 🔴 최우선 |
| 3 | integrity (청렴성) | 89 | 100 | **-11** | 🔴 높음 |
| 4 | leadership (리더십) | 92 | 100 | -8 | 🟡 중간 |
| 5 | communication (소통능력) | 92 | 100 | -8 | 🟡 중간 |
| 6 | accountability (책임감) | 98 | 100 | -2 | 🟢 낮음 |

### ✅ 이미 완료된 카테고리 (100개 이상)
- expertise (전문성): 103/100 ✅
- ethics (윤리성): 116/100 ✅
- responsiveness (대응성): 109/100 ✅
- publicinterest (공익성): 113/100 ✅

---

## 🎯 수집 전략

### V40 Gemini 수집 배분
- **OFFICIAL**: 30개 (75%)
- **PUBLIC**: 20개 (33%)
- **총 수집**: 50개/카테고리

### 현재 필요량 vs Gemini 수집량

각 카테고리당 필요한 개수는 **2-12개**이지만, Gemini CLI는 전체 50개를 수집합니다. 이 중에서 부족분을 채울 수 있습니다.

---

## 📝 카테고리별 실행 프롬프트

---

## 1️⃣ Vision (비전) - 최우선

### 현재 상황
- **현재**: 88/100
- **부족**: 12개
- **우선순위**: 🔴 최우선 (가장 많이 부족)

### Gemini CLI 실행 명령어

```bash
cd C:\Development_PoliticianFinder_com\Developement_Real_PoliticianFinder\0-3_AI_Evaluation_Engine\설계문서_V7.0\V40\scripts\workflow

python collect_gemini_v40_final.py --politician "박주민" --category vision
```

### 수집 목표
- **OFFICIAL**: 30개 (공식 자료, 4년 이내)
- **PUBLIC**: 20개 (뉴스/블로그/유튜브, 2년 이내)

### 검색 키워드 (참고)
- 박주민 비전
- 박주민 미래 방향
- 박주민 혁신
- 박주민 정책 비전
- 박주민 장기 계획

### 수집 후 확인
```bash
cd scripts/utils
python check_v40_data.py --politician-id 8c5dcc89
```

**예상 결과**: vision 88 → 100+ (목표 달성)

---

## 2️⃣ Transparency (투명성) - 최우선

### 현재 상황
- **현재**: 88/100
- **부족**: 12개
- **우선순위**: 🔴 최우선 (가장 많이 부족)

### Gemini CLI 실행 명령어

```bash
cd C:\Development_PoliticianFinder_com\Developement_Real_PoliticianFinder\0-3_AI_Evaluation_Engine\설계문서_V7.0\V40\scripts\workflow

python collect_gemini_v40_final.py --politician "박주민" --category transparency
```

### 수집 목표
- **OFFICIAL**: 30개 (공식 자료, 4년 이내)
- **PUBLIC**: 20개 (뉴스/블로그/유튜브, 2년 이내)

### 검색 키워드 (참고)
- 박주민 정보공개
- 박주민 투명성
- 박주민 재산공개
- 박주민 이해충돌
- 박주민 국정감사

### 수집 후 확인
```bash
python check_v40_data.py --politician-id 8c5dcc89
```

**예상 결과**: transparency 88 → 100+ (목표 달성)

---

## 3️⃣ Integrity (청렴성) - 높음

### 현재 상황
- **현재**: 89/100
- **부족**: 11개
- **우선순위**: 🔴 높음

### Gemini CLI 실행 명령어

```bash
python collect_gemini_v40_final.py --politician "박주민" --category integrity
```

### 수집 목표
- **OFFICIAL**: 30개 (공식 자료, 4년 이내)
- **PUBLIC**: 20개 (뉴스/블로그/유튜브, 2년 이내)

### 검색 키워드 (참고)
- 박주민 청렴성
- 박주민 부패
- 박주민 비리
- 박주민 논란
- 박주민 도덕성

### 수집 후 확인
```bash
python check_v40_data.py --politician-id 8c5dcc89
```

**예상 결과**: integrity 89 → 100+ (목표 달성)

---

## 4️⃣ Leadership (리더십) - 중간

### 현재 상황
- **현재**: 92/100
- **부족**: 8개
- **우선순위**: 🟡 중간

### Gemini CLI 실행 명령어

```bash
python collect_gemini_v40_final.py --politician "박주민" --category leadership
```

### 수집 목표
- **OFFICIAL**: 30개 (공식 자료, 4년 이내)
- **PUBLIC**: 20개 (뉴스/블로그/유튜브, 2년 이내)

### 검색 키워드 (참고)
- 박주민 리더십
- 박주민 조직 운영
- 박주민 위기 관리
- 박주민 의사결정
- 박주민 국회 활동

### 수집 후 확인
```bash
python check_v40_data.py --politician-id 8c5dcc89
```

**예상 결과**: leadership 92 → 100+ (목표 달성)

---

## 5️⃣ Communication (소통능력) - 중간

### 현재 상황
- **현재**: 92/100
- **부족**: 8개
- **우선순위**: 🟡 중간

### Gemini CLI 실행 명령어

```bash
python collect_gemini_v40_final.py --politician "박주민" --category communication
```

### 수집 목표
- **OFFICIAL**: 30개 (공식 자료, 4년 이내)
- **PUBLIC**: 20개 (뉴스/블로그/유튜브, 2년 이내)

### 검색 키워드 (참고)
- 박주민 소통
- 박주민 SNS
- 박주민 국민 소통
- 박주민 언론 인터뷰
- 박주민 토론회

### 수집 후 확인
```bash
python check_v40_data.py --politician-id 8c5dcc89
```

**예상 결과**: communication 92 → 100+ (목표 달성)

---

## 6️⃣ Accountability (책임감) - 낮음

### 현재 상황
- **현재**: 98/100
- **부족**: 2개
- **우선순위**: 🟢 낮음 (거의 달성)

### Gemini CLI 실행 명령어

```bash
python collect_gemini_v40_final.py --politician "박주민" --category accountability
```

### 수집 목표
- **OFFICIAL**: 30개 (공식 자료, 4년 이내)
- **PUBLIC**: 20개 (뉴스/블로그/유튜브, 2년 이내)

### 검색 키워드 (참고)
- 박주민 책임감
- 박주민 공약 이행
- 박주민 결과 책임
- 박주민 사과
- 박주민 해명

### 수집 후 확인
```bash
python check_v40_data.py --politician-id 8c5dcc89
```

**예상 결과**: accountability 98 → 100+ (목표 달성)

---

## 🚀 전체 실행 가이드

### 방법 1: 순차 실행 (권장)

우선순위대로 하나씩 실행:

```bash
# 작업 디렉토리 이동
cd C:\Development_PoliticianFinder_com\Developement_Real_PoliticianFinder\0-3_AI_Evaluation_Engine\설계문서_V7.0\V40\scripts\workflow

# 1. Vision (최우선)
python collect_gemini_v40_final.py --politician "박주민" --category vision

# 2. Transparency (최우선)
python collect_gemini_v40_final.py --politician "박주민" --category transparency

# 3. Integrity (높음)
python collect_gemini_v40_final.py --politician "박주민" --category integrity

# 4. Leadership (중간)
python collect_gemini_v40_final.py --politician "박주민" --category leadership

# 5. Communication (중간)
python collect_gemini_v40_final.py --politician "박주민" --category communication

# 6. Accountability (낮음)
python collect_gemini_v40_final.py --politician "박주민" --category accountability
```

### 방법 2: 배치 실행

모든 명령을 한 번에:

```bash
cd C:\Development_PoliticianFinder_com\Developement_Real_PoliticianFinder\0-3_AI_Evaluation_Engine\설계문서_V7.0\V40\scripts\workflow

python collect_gemini_v40_final.py --politician "박주민" --category vision && ^
python collect_gemini_v40_final.py --politician "박주민" --category transparency && ^
python collect_gemini_v40_final.py --politician "박주민" --category integrity && ^
python collect_gemini_v40_final.py --politician "박주민" --category leadership && ^
python collect_gemini_v40_final.py --politician "박주민" --category communication && ^
python collect_gemini_v40_final.py --politician "박주민" --category accountability
```

---

## ✅ 최종 확인

### 전체 데이터 확인

```bash
cd C:\Development_PoliticianFinder_com\Developement_Real_PoliticianFinder\0-3_AI_Evaluation_Engine\설계문서_V7.0\V40\scripts\utils

python check_v40_data.py --politician-id 8c5dcc89
```

### 예상 최종 결과

| 카테고리 | 수집 전 | 수집 후 | 목표 | 상태 |
|----------|---------|---------|------|------|
| vision | 88 | 100+ | 100 | ✅ 달성 |
| transparency | 88 | 100+ | 100 | ✅ 달성 |
| integrity | 89 | 100+ | 100 | ✅ 달성 |
| leadership | 92 | 100+ | 100 | ✅ 달성 |
| communication | 92 | 100+ | 100 | ✅ 달성 |
| accountability | 98 | 100+ | 100 | ✅ 달성 |

**전체 합계**: 988 → 1,000+ ✅ **최소 목표 달성**

---

## 📌 주의사항

### Gemini CLI 실행 시간
- **각 카테고리당**: 약 27초
- **6개 전체**: 약 3분 (순차 실행 시)

### 중복 방지
- V40 시스템이 자동으로 중복 체크
- URL 정규화 + 제목 유사도 검사
- 이미 수집된 데이터는 자동 스킵

### 검증
- 수집 후 자동으로 중복/유효성 검증
- 100개 미만이면 추가 수집 필요
- 보통 한 번 실행으로 충분

---

## 🎉 완료 후

### Stage 2 완료 확인

```bash
cd C:\Development_PoliticianFinder_com\Developement_Real_PoliticianFinder\0-3_AI_Evaluation_Engine\설계문서_V7.0\V40\scripts\core

python validate_and_recollect_v40.py --politician-id 8c5dcc89 --politician-name "박주민" --dry-run
```

**예상 결과**: 모든 카테고리 100/100 ✅

### Stage 3 진행

```bash
# Stage 3: 평가 시작
python evaluate_v40.py --politician-id 8c5dcc89 --politician-name "박주민" --parallel
```

---

**작성자**: Claude Code
**최종 업데이트**: 2026-02-11
**문서 버전**: 1.0
