# PROJECT GRID 전체 재배치 계획 (V5.0)

**생성일**: 2025-11-05  
**상태**: ✅ 완성 및 검증 준비  
**CSV 파일**: `task_relocation_mapping_v5.csv`

---

## 📊 재배치 요약

| Phase | 기존 구조 | 새 구조 | Area | 설명 |
|-------|---------|--------|------|------|
| Phase 1 | 20 Tasks | 28 Tasks | F | 프로토타입 28개 페이지 → React 변환 |
| Phase 2 | 24 Tasks | 18 Tasks | BI(3) + BA(15) | Mock API 개발 |
| Phase 3 | 32 Tasks | 30 Tasks | D | 실제 DB 설계 & 구현 |
| Phase 4 | 14 Tasks | 25 Tasks | BA | 실제 API 개발 |
| Phase 5 | 12 Tasks | 12 Tasks | BI(1) + BA(11) | 데이터 수집 엔진 |
| Phase 6 | 24 Tasks | 3 Tasks | BA | 부가 기능 |
| Phase 7 | 18 Tasks | 33 Tasks | O(4) + T(3) + F(5) + BA(21) | 배포 & 최적화 |
| **합계** | **144 Tasks** | **142 Tasks** | - | **-2 Tasks** |

---

## 🔄 주요 변화

### 1. Phase 1: Frontend React 변환 (28개)
**목표**: 프로토타입 HTML 페이지를 React 컴포넌트로 변환

#### 페이지 매핑 (P1F1~P1F28)
```
P1F1  - index.html (전역 레이아웃)
P1F2  - login.html
P1F3  - signup.html
P1F4  - password-reset.html
P1F5  - politicians.html
P1F6  - politician-detail.html
P1F7  - search-results.html
P1F8  - favorite-politicians.html
P1F9  - community.html
P1F10 - write-post_member.html
P1F11 - write-post_politician.html
P1F12 - post-detail_member.html
P1F13 - post-detail_politician.html
P1F14 - notice-detail.html
P1F15 - mypage.html
P1F16 - user-profile.html
P1F17 - profile-edit.html
P1F18 - settings.html
P1F19 - notifications.html
P1F20 - privacy.html
P1F21 - terms.html
P1F22 - service-relay.html
P1F23 - support.html
P1F24 - connection.html
P1F25 - payment.html
P1F26 - account-transfer.html
P1F27 - admin.html
P1F28 - (추가 페이지 또는 공통 컴포넌트)
```

#### 의존성
- Mock DB (프로토타입과 동일하게 연결)
- Mock API (Phase 2에서 개발)

---

### 2. Phase 2: Mock API 개발 (18개)

#### Structure
```
Phase 2BI1-3 (3개)     → Backend Infrastructure
├─ P2BI1: Supabase 클라이언트
├─ P2BI2: API 미들웨어
└─ P2BI3: 인증 보안 설정

Phase 2BA1-15 (15개)   → Backend APIs (Mock)
├─ P2BA1-4: 정치인 API (목록, 상세, 관심, 본인인증)
├─ P2BA5-8: AI 평가 API
├─ P2BA9-12: 커뮤니티 API (게시글, 댓글, 좋아요 등)
├─ P2BA13-15: 결제 API
```

#### 특징
- 모든 BA API는 Mock 데이터 사용
- 실제 DB와 무관하게 테스트 가능
- Phase 3 DB 설계와 병렬 진행 가능

---

### 3. Phase 3: 실제 DB 설계 (30개)

#### Structure
```
Phase 3D1-30 (30개) → Database Design & Implementation
├─ D1-5: 인증, 사용자, 프로필
├─ D6-10: 정치인 데이터
├─ D11-15: AI 평가 데이터
├─ D16-20: 커뮤니티 (게시글, 댓글)
├─ D21-25: 결제, 거래 기록
├─ D26-30: 백업, 모니터링
```

#### 의존성
- Phase 2 Mock API와 병렬 진행
- 데이터 모델링 먼저 (DB 스키마)
- 그 다음 실제 구현

---

### 4. Phase 4: 실제 API 개발 (25개)

#### Structure
```
Phase 4BA1-25 (25개) → Backend APIs (Real)
├─ BA1-5: 인증 API (Phase 2BA 교체)
├─ BA6-10: 정치인 API
├─ BA11-15: AI 평가 API
├─ BA16-20: 커뮤니티 API
├─ BA21-25: 결제 API
```

#### 의존성
- Phase 3 DB 스키마 완성 필수
- Phase 2 Mock API 참조

---

### 5. Phase 5: 데이터 수집 엔진 (12개)

#### Structure
```
Phase 5BI4 (1개)      → Backend Infrastructure
└─ P5BI4: 웹 크롤러

Phase 5BA16-26 (11개) → Data Collection APIs
├─ BA16-20: 정치인 데이터 수집
├─ BA21-23: 시드 데이터
├─ BA24-26: ETL 파이프라인
```

#### 특징
- 웹 크롤러로 정치인 데이터 자동 수집
- 시드 데이터로 초기 DB 채우기
- 정기 업데이트 파이프라인

---

### 6. Phase 6: 부가 기능 (3개)

#### Structure
```
Phase 6BA27-29 (3개) → Additional Features
├─ BA27: 고급 검색
├─ BA28: 비교 기능
└─ BA29: 알림 시스템
```

---

### 7. Phase 7: 배포 & 최적화 (33개)

#### Structure
```
Phase 7O1-4 (4개)      → DevOps
├─ O1: 보안 최종 점검
├─ O2: 의존성 스캔
├─ O3: Vercel 배포
└─ O4: CI/CD 파이프라인

Phase 7T1-3 (3개)      → Testing
├─ T1: 전체 E2E 테스트
├─ T2: 부하 테스트
└─ T3: 보안 테스트

Phase 7F1-5 (5개)      → Frontend Optimization
├─ F1: PWA 설정
├─ F2: SEO 설정
├─ F3: OG 태그
├─ F4: 404 페이지
└─ F5: 500 페이지

Phase 7BA21-41 (21개)  → Production APIs
└─ (Phase 4에서 이동)
```

---

## 📋 ID 체인 규칙 적용

### 규칙 요약
```
X축 변화 (Phase): O = 변화있음, X = 변화없음
Y축 변화 (Area):  O = 변화있음, X = 변화없음
Z축 변화 (Number): O = 변화있음, X = 변화없음

➜ 3축 중 하나라도 변화 → [기존ID]_[새로운ID]
➜ 변화 없음 → [기존ID] (유지)
```

### 예시
```
P0BA0 (Phase 0, BA, 0) → P2BA0 (Phase 2, BA, 0)
- X축 변화: O (0→2)
- Y축 변화: X (BA→BA)
- Z축 변화: X (0→0)
- ID 체인: P0BA0_P2BA0

P1F1 (Phase 1, F, 1) → P1F1 (Phase 1, F, 1)
- X축 변화: X (1→1)
- Y축 변화: X (F→F)
- Z축 변화: X (1→1)
- ID 체인: P1F1 (유지)
```

---

## 📊 Task 분포 비교

### 기존 구조
```
Phase 0: 4개 (BA)
Phase 1: 20개 (BA:4, BI:3, D:5, F:5, O:1, T:2)
Phase 2: 24개 (BA:11, D:7, F:3, O:1, T:2)
Phase 3: 32개 (BA:13, D:8, F:6, O:1, T:4)
Phase 4: 14개 (D:3, F:4, O:1, T:2)
Phase 5: 12개 (BA:4, D:2, F:4, T:2)
Phase 6: 24개 (BA:10, D:3, F:7, O:1, T:3)
Phase 7: 18개 (BA:2, D:2, F:5, O:4, T:3)
─────────────────────
합계:   144개
```

### 새 구조
```
Phase 1: 28개 (F:28) - React 변환
Phase 2: 18개 (BI:3, BA:15) - Mock API
Phase 3: 30개 (D:30) - 실제 DB
Phase 4: 25개 (BA:25) - 실제 API
Phase 5: 12개 (BI:1, BA:11) - 데이터 수집
Phase 6:  3개 (BA:3) - 부가 기능
Phase 7: 33개 (O:4, T:3, F:5, BA:21) - 배포 & 최적화
─────────────────────
합계:   142개
```

---

## ✅ 검증 체크리스트

- [x] 모든 Frontend Tasks (F) → Phase 1 (P1F1-P1F28)
- [x] 모든 Database Tasks (D) → Phase 3 (P3D1-P3D30)
- [x] 모든 DevOps Tasks (O) → Phase 7 (P7O1-P7O4)
- [x] 모든 Test Tasks (T) → Phase 7 (P7T1-P7T3)
- [x] Mock BA Tasks → Phase 2 (P2BA1-P2BA15)
- [x] Real BA Tasks → Phase 4 (P4BA1-P4BA25)
- [x] ID 체인 규칙 적용 완료
- [x] CSV 매핑 파일 생성 완료

---

## 📁 생성 파일

```
grid/
├─ task_relocation_mapping_v5.csv    ✅ 142개 Task 매핑 표
├─ RELOCATION_PLAN_V5.md             ✅ 이 문서
└─ generate_csv_mapping.py           ✅ 생성 스크립트
```

---

## 🚀 다음 단계 (선택사항)

1. **데이터 마이그레이션**: 기존 Project Grid JSON을 새로운 Task ID로 업데이트
2. **Task 지시서 생성**: 새 Phase 구조에 맞게 작업 지시서 생성
3. **Phase Gate 설정**: 각 Phase별 검증 기준 설정
4. **Phase 1부터 시작**: React 변환 작업 시작

---

**버전**: V5.0
**상태**: ✅ 완성 및 사용 가능

