# PoliticianFinder 프로젝트 현황 요약

**작성일**: 2025-10-15
**세션**: 야간 작업 + 평가 시스템 재설계
**상태**: Phase 1 작업지시서 완료 + 평가 시스템 설계 완료

---

## 📂 현재 폴더 구조

```
12D-GCDM_Grid/
├── README.md                                    ✅ 프로젝트 개요
├── PHASE1_NIGHT_WORK_REPORT.md                 ✅ Phase 1 야간 작업 보고서
├── PRICING_POLICY_FINAL.md                     ✅ 가격 정책
│
├── project_grid_v1.2_full_XY.csv              ✅ 프로젝트 그리드 (CSV)
├── project_grid_v1.2_full_XY.xlsx             ✅ 프로젝트 그리드 (Excel)
│
├── tasks/                                       ✅ 32개 작업지시서
│   ├── P1F1.md ~ P1F7.md                       (Frontend 7개)
│   ├── P1B1.md ~ P1B8.md                       (Backend 8개)
│   ├── P1D1.md ~ P1D13.md                      (Database 13개)
│   ├── P1V1.md ~ P1V4.md                       (DevOps 4개)
│   └── P1A1.md                                 (AI/ML 1개)
│
├── backups/                                     ✅ 백업 폴더
│   └── 2025-10-15_cleanup/                     (32개 구버전 파일)
│
└── [평가 시스템 설계 문서들] ⭐ NEW
    ├── POLITICIAN_EVALUATION_RESEARCH.md        ✅ 해외 사례 연구
    ├── EVALUATION_SYSTEM_REDESIGN.md            ✅ 초기 10개 분야 설계
    ├── REAL_CASE_ANALYSIS.md                    ✅ 서울/부산 사례 분석
    ├── FINAL_10_CATEGORIES_SYSTEM.md            ✅ 10개 분야 최종 확정
    ├── 100_ITEMS_COLLECTION_GUIDE.md            ✅ 100개 항목 수집 가이드
    ├── SCORING_SYSTEM_VARIATIONS.md             ✅ 출마 전/후 점수 계산 체계
    ├── MASTER_EVALUATION_SYSTEM.md              ✅ 마스터 문서 (최종 확정판)
    └── PROJECT_STATUS_SUMMARY.md                ✅ 이 문서
```

---

## ✅ 완료된 작업

### 1. Phase 1 작업지시서 (32개) - 야간 작업
**위치**: `tasks/` 폴더
**상태**: ✅ 100% 완료

| 영역 | 파일 수 | 상태 |
|------|---------|------|
| Frontend | 7개 (P1F1~P1F7) | ✅ 완료 |
| Backend | 8개 (P1B1~P1B8) | ✅ 완료 |
| Database | 13개 (P1D1~P1D13) | ✅ 완료 |
| DevOps | 4개 (P1V1~P1V4) | ✅ 완료 |
| AI/ML | 1개 (P1A1) | ✅ 완료 |

**특징**:
- 각 파일 평균 200-300줄, 실행 가능한 코드 예제 포함
- 의존성 체인 명확히 정의
- 한국어 문서화

---

### 2. 폴더 정리 (백업)
**백업 위치**: `backups/2025-10-15_cleanup/`
**상태**: ✅ 완료

**이동된 파일** (32개):
- 구버전 CSV/Excel (v1.0, v1.1)
- 중간 계획 문서들
- AI 배포 계획서들

**결과**: 메인 폴더가 40개 파일 → 5개 필수 파일로 정리됨

---

### 3. 정치인 평가 시스템 설계 (7개 문서) ⭐
**상태**: ✅ 100% 완료

#### 문서 1: POLITICIAN_EVALUATION_RESEARCH.md
**내용**:
- GovTrack.us 시스템 분석 (Ideology Score, Leadership Score)
- Center for Effective Lawmaking 분석 (15개 지표, 법안 가중치)
- Incumbent vs Challenger 평가 차이 연구

#### 문서 2: EVALUATION_SYSTEM_REDESIGN.md
**내용**:
- 10개 평가 분야 초기 설계
- 가중 평균 알고리즘
- 대체 지표 매핑
- AI 기반 보정 방법

#### 문서 3: REAL_CASE_ANALYSIS.md
**내용**:
- 서울시장 선거: 추미애 vs 조은희 분석
- 부산시장 선거: 6명 후보 분석
- 실제 데이터로 검증 (박형준 88.4점 vs 원본 89.4점 - 오차 1점)

#### 문서 4: FINAL_10_CATEGORIES_SYSTEM.md
**내용**:
- 10개 분야 최종 확정
- Python 구현 코드
- Database 스키마
- API 엔드포인트 설계

#### 문서 5: 100_ITEMS_COLLECTION_GUIDE.md ⭐
**내용**:
- **100개 평가 항목 전체 정의**
- 각 항목의 데이터 소스, 수집 방법, 평가 기준 명시
- 기성/신인 적용 대상 구분
- 대체 지표 명시

**10개 분야별 항목**:
1. 청렴성 (10개 항목)
2. 전문성 (10개 항목)
3. 소통능력 (10개 항목)
4. 리더십 (10개 항목)
5. 책임감 (10개 항목)
6. 투명성 (10개 항목)
7. 대응성 (10개 항목)
8. 비전 (10개 항목)
9. 공익추구 (10개 항목)
10. 윤리성 (10개 항목)

#### 문서 6: SCORING_SYSTEM_VARIATIONS.md ⭐
**내용**:
- **출마 전 vs 출마 후** 점수 계산 체계 차별화
- **직책별 가중치** (국회의원/시장/군수/의원)
- **지역별 가중치** (수도권/광역시/도지역)
- **정당별 조정** (여당/야당/무소속)

#### 문서 7: MASTER_EVALUATION_SYSTEM.md ⭐⭐⭐
**내용**: **모든 것을 통합한 최종 확정 문서**

**핵심 내용**:
1. **당선 관련 표현 제공 금지** (법적 안전성)
2. **PPS/PCS 2단계 평가 시스템**
3. **100개 항목 전체 정의** (의정활동 35 + 정치경력 25 + 개인정보 15 + 경제재산 10 + 사회활동 15)
4. **4가지 케이스별 알고리즘**:
   - 출마 전 기성 정치인 PPS (80개/100개 활용)
   - 출마 전 신인 정치인 PPS (40개/100개 활용)
   - 출마 후 기성 정치인 PCS (95개/100개 활용)
   - 출마 후 신인 정치인 PCS (70개/100개 활용)
5. **S~D 등급 체계**
6. **완전한 Python 구현 코드**
7. **데이터베이스 스키마**
8. **AI 자동 수집 시스템 설계**

---

## 🎯 핵심 원칙 (법적 안전성)

### ❌ 절대 금지
```
❌ 당선 관련 표현 제공
❌ "OO 후보 당선 가능성 85%"
❌ 선거 결과 관련 표현
❌ 특정 후보 지지 유도
```

### ✅ 안전한 접근
```
✅ 정치인 역량 평가 (PPS/PCS)
✅ 객관적 데이터 분석
✅ 투명한 알고리즘 공개
✅ "최종 판단은 시민의 몫"
```

---

## 📊 평가 시스템 요약

### 2×2 매트릭스

|                | **출마 전 (PPS)** | **출마 후 (PCS)** |
|----------------|-------------------|-------------------|
| **기성 정치인** | 80개 항목 활용<br>의정활동 40 + 공약이행 30 + 투명성 20 + 지역기여 10 | 95개 항목 활용<br>의정활동 40 + 공약평가 30 + 투명소통 20 + 정치역량 10 |
| **신인 정치인** | 40개 항목 활용<br>전문성 40 + 사회활동 30 + 투명성 20 + 지역연고 10 | 70개 항목 활용<br>공약구체성 40 + 전문준비 30 + 소통투명 20 + 정치적응 10 |

### 100개 항목 구성

```
📊 100개 항목 = 5개 대분류

1. 의정활동 관련 (35개)
   - 출석 및 참여 (10)
   - 입법 활동 (15)
   - 견제 및 감시 (10)

2. 정치 경력 관련 (25개)
   - 선거 및 당선 (8)
   - 정당 활동 (8)
   - 정치적 배경 (9)

3. 개인 정보 관련 (15개)
   - 기본 신상정보 (5)
   - 학력 정보 (5)
   - 자격 및 능력 (5)

4. 경제/재산 관련 (10개)
   - 재산 현황 (5)
   - 경제 활동 (5)

5. 사회활동 관련 (15개)
   - 시민사회 (3)
   - 학술/문화 (4)
   - 네트워크 (8)
```

---

## 🔧 기술 스택

### Backend
- FastAPI
- PostgreSQL (Supabase)
- SQLAlchemy
- Alembic (마이그레이션)
- JWT 인증
- Claude API (AI 평가)

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand (상태 관리)
- react-hook-form + zod (폼 검증)

### DevOps
- Vercel (Frontend 배포)
- Railway (Backend 배포)
- Supabase (Database)
- GitHub Actions (CI/CD)

### AI/ML
- Claude 3.5 Sonnet (데이터 분석)
- ChatGPT, Gemini, Perplexity, Grok (다중 AI 평가)

---

## 📋 다음 단계 (우선순위)

### Phase 1: 데이터베이스 구현 (우선순위 높음)
```
[ ] P1D1: User 모델 생성
[ ] P1D2: Politician 모델 생성
[ ] P1D3: Rating 모델 생성 (12차원 평가)
[ ] P1D11: Alembic 초기화
[ ] P1D12: 초기 마이그레이션 생성
[ ] 추가: politician_raw_data 테이블 (100개 항목)
[ ] 추가: politician_evaluations 테이블 (PPS/PCS)
```

### Phase 2: Backend API 구현
```
[ ] P1B5: JWT 인증 시스템
[ ] P1B6: 회원가입 API
[ ] P1B7: 로그인 API
[ ] P1B8: 현재 사용자 조회 API
[ ] 추가: POST /politicians/{id}/evaluate (평가 요청)
[ ] 추가: GET /politicians/{id}/pps (PPS 조회)
[ ] 추가: GET /politicians/{id}/pcs (PCS 조회)
[ ] 추가: GET /politicians/rankings (랭킹 조회)
```

### Phase 3: 평가 알고리즘 구현
```
[ ] calculate_pps_incumbent()
[ ] calculate_pps_challenger()
[ ] calculate_pcs_incumbent()
[ ] calculate_pcs_challenger()
[ ] calculate_grade()
[ ] apply_position_weights()
[ ] apply_regional_weights()
[ ] apply_party_adjustments()
```

### Phase 4: 데이터 수집 자동화
```
[ ] 국회 의안정보시스템 API 연동
[ ] 선관위 재산공개 시스템 크롤링
[ ] 네이버/다음 뉴스 API 연동
[ ] SNS 데이터 수집 (페이스북, 트위터, 인스타그램)
[ ] AI 기반 감성 분석 파이프라인
[ ] 주 1회 자동 수집 스케줄러
```

### Phase 5: Frontend UI 구현
```
[ ] P1F6: 회원가입 페이지
[ ] P1F7: 로그인 페이지
[ ] 추가: 정치인 검색 페이지
[ ] 추가: 평가 결과 대시보드
[ ] 추가: PPS vs PCS 비교 뷰
[ ] 추가: 상세 breakdown 차트
[ ] 추가: 등급별 필터링
[ ] 추가: 지역별/정당별/직책별 필터
```

---

## 📊 프로젝트 통계

### 문서화
```
작성된 문서: 39개 파일
- Phase 1 작업지시서: 32개
- 평가 시스템 설계: 7개

총 줄 수: 약 15,000줄
총 크기: 약 500KB
작성 시간: 약 8시간 (야간 작업 포함)
```

### 코드 예제
```
Python 코드: 약 200개 블록
TypeScript 코드: 약 100개 블록
SQL 코드: 약 40개 블록
Bash 명령어: 약 50개 블록
```

---

## 🎯 프로젝트 성공 기준

### 기술적 목표
- [x] 100개 평가 항목 정의 완료
- [x] PPS/PCS 알고리즘 설계 완료
- [ ] 데이터베이스 구현
- [ ] API 엔드포인트 구현
- [ ] 자동 데이터 수집 시스템 구축
- [ ] Frontend UI 구현

### 법적 안전성
- [x] 당선 관련 표현 제공 금지 명시
- [x] 객관적 역량 평가로 포지셀링
- [x] 알고리즘 투명성 확보 방안 수립
- [ ] 법률 검토 (선거법, 정보통신법)
- [ ] 이용약관 작성
- [ ] 개인정보처리방침 작성

### 사업적 목표
- [ ] MVP (Minimum Viable Product) 출시
- [ ] 베타 테스터 모집 (100명)
- [ ] 첫 정치인 평가 완료 (10명)
- [ ] 수익 모델 검증 (Freemium)

---

## 💬 핵심 인사이트

### 1. 당선 관련 표현 표현의 위험성
```
❌ 자기실현적 예언 효과
❌ 정치적 중립성 훼손
❌ 선거법 위반 가능성

✅ PPS/PCS 역량 평가로 대체
✅ "최종 판단은 시민의 몫" 명시
✅ 법적 안전성 확보
```

### 2. 기성 vs 신인 차별화
```
기성 정치인:
- 80-95% 데이터 수집 가능
- 의정활동 실적 중심 평가
- 공약 이행률 검증 가능

신인 정치인:
- 40-70% 데이터 수집 가능
- 잠재력 및 준비도 중심 평가
- 대체 지표 활용 필수
```

### 3. 출마 전 vs 출마 후
```
출마 전 (PPS):
- 제한적 데이터
- 가능성 평가
- 신뢰도 낮음

출마 후 (PCS):
- 풍부한 데이터
- 경쟁력 평가
- 신뢰도 높음
```

---

## 🚀 즉시 시작 가능한 작업

### 1. Database Models 구현 (최우선)
```bash
# 위치: api/models/
cd api/
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 모델 파일 생성
touch models/user.py
touch models/politician.py
touch models/rating.py
touch models/evaluation.py
```

### 2. Alembic 초기화
```bash
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### 3. Backend API 개발
```bash
# JWT 인증 구현
touch utils/security.py
touch api/v1/endpoints/auth.py

# 평가 API 구현
touch api/v1/endpoints/evaluation.py
```

---

## 📞 연락처 및 문의

**프로젝트명**: PoliticianFinder
**위치**: `G:\내 드라이브\Developement\PoliticianFinder\12D-GCDM_Grid\`
**상태**: 설계 완료, 구현 대기
**다음 세션**: 데이터베이스 모델 구현

---

**작성일**: 2025-10-15
**작성자**: Claude Code (AI)
**상태**: ✅ 완료

**다음 작업시 참고사항**:
1. `MASTER_EVALUATION_SYSTEM.md` - 모든 평가 알고리즘 정의
2. `100_ITEMS_COLLECTION_GUIDE.md` - 100개 항목 상세 정의
3. `SCORING_SYSTEM_VARIATIONS.md` - 출마 전/후 점수 계산
4. `tasks/P1D*.md` - Database 구현 가이드
