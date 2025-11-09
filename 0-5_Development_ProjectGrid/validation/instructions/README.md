# Validation Instructions (검증 지시서)

**폴더**: `validation/instructions/`
**목적**: 검증 작업을 위한 모든 지시 및 템플릿 문서
**상태**: ✅ Ready to Use
**작성일**: 2025-11-04

---

## 📚 포함된 문서 (4개)

### 1️⃣ B_AGENT_VERIFICATION_REQUEST.md ⭐ 먼저 읽기
- **내용**: B 에이전트에게 전달하는 최종 작업 요청서
- **읽는 시간**: ~5분
- **포함**: 12개 Task, 작업 지침, 예상 일정, 완료 기준

### 2️⃣ VERIFICATION_INSTRUCTIONS.md 두 번째 읽기
- **내용**: 검증 작업 상세 지시서
- **읽는 시간**: ~15분
- **포함**: 준비사항, 프로세스, 체크리스트, 우선순위 순서

### 3️⃣ VERIFICATION_REPORT_TEMPLATE.md 작업 중 참조
- **내용**: 검증 리포트 표준 양식 (9개 섹션)
- **참조 시간**: Task별 10-15분
- **포함**: 표준 양식, 실제 예제, 각 섹션 가이드

### 4️⃣ VERIFICATION_DOCUMENTS_README.md 전체 가이드
- **내용**: 3개 문서의 통합 가이드
- **읽는 시간**: ~5분
- **포함**: 읽기 순서, 체크리스트, FAQ, 빠른 시작

---

## 🚀 빠른 시작

**B 에이전트는 이렇게 하세요:**

```
Step 1: B_AGENT_VERIFICATION_REQUEST.md 읽기 (5분)
        ↓
Step 2: VERIFICATION_INSTRUCTIONS.md 읽기 (15분)
        ↓
Step 3: 각 Task 검증 시작
        - Project Grid 확인
        - VERIFICATION_REPORT_TEMPLATE.md 참조
        - 리포트 작성
        - ../results/ 폴더에 저장
        ↓
Step 4: 12개 Task 모두 완료 (2-3시간)
```

---

## 📂 폴더 구조

```
validation/
├── instructions/              ← 이 폴더
│   ├── README.md             (이 파일)
│   ├── B_AGENT_VERIFICATION_REQUEST.md
│   ├── VERIFICATION_INSTRUCTIONS.md
│   ├── VERIFICATION_REPORT_TEMPLATE.md
│   └── VERIFICATION_DOCUMENTS_README.md
│
└── results/                   ← 리포트 저장 폴더
    ├── P1BI1_2nd_verification.txt
    ├── P1BI2_2nd_verification.txt
    ├── P1BA1_2nd_verification.txt
    ├── P1BA2_2nd_verification.txt
    ├── P1BA4_2nd_verification.txt
    ├── P1F2_2nd_verification.txt
    ├── P1F3_2nd_verification.txt
    ├── P1F4_2nd_verification.txt
    ├── P1F5_2nd_verification.txt
    ├── P1F6_2nd_verification.txt
    ├── P1F10_2nd_verification.txt
    └── P1F11_2nd_verification.txt
```

---

## ✅ 체크리스트

**B 에이전트가 확인할 것:**

```
준비:
☐ 4개 문서 모두 확인
☐ 읽기 순서 확인 (B_AGENT_VERIFICATION_REQUEST.md 먼저)
☐ Project Grid 파일 액세스 가능
☐ ../results/ 폴더 확인

작업:
☐ 12개 Task 모두 검증
☐ 각 Task마다 리포트 작성
☐ VERIFICATION_REPORT_TEMPLATE.md 양식 준수

완료:
☐ 12개 리포트 모두 생성
☐ 파일명: P1XX_2nd_verification.txt
☐ 저장 위치: ../results/
☐ 인코딩: UTF-8
```

---

## 📍 주요 파일 위치

**지시 문서**:
```
C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\
  0-5_Development_ProjectGrid\
    validation\
      instructions\
        ├── B_AGENT_VERIFICATION_REQUEST.md
        ├── VERIFICATION_INSTRUCTIONS.md
        ├── VERIFICATION_REPORT_TEMPLATE.md
        ├── VERIFICATION_DOCUMENTS_README.md
        └── README.md (이 파일)
```

**검증 리포트 저장 위치**:
```
C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\
  0-5_Development_ProjectGrid\
    validation\
      results\  ← 리포트를 여기에 저장!
```

**Project Grid**:
```
C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\
  0-5_Development_ProjectGrid\
    action\PROJECT_GRID\grid\
      generated_grid_full_v4_10agents_with_skills.json
```

---

## 🎯 핵심 정보

### 검증 대상 (12개 Task)

**백엔드 인프라 (2개)**:
- P1BI1 - Supabase 클라이언트
- P1BI2 - API 미들웨어

**백엔드 API (3개)**:
- P1BA1 - 회원가입 API
- P1BA2 - 로그인 API
- P1BA4 - 비밀번호 재설정 API

**프론트엔드 페이지 (7개)**:
- P1F2 - 로그인 페이지
- P1F3 - 회원가입 페이지
- P1F4 - 비밀번호 찾기 페이지
- P1F5 - 비밀번호 재설정 페이지
- P1F6 - 마이페이지
- P1F10 - 의원 프로필 페이지
- P1F11 - 유저 프로필 페이지

### 리포트 요구사항

**파일명 형식**:
```
P1XX_2nd_verification.txt
```

**포함 내용 (9개 섹션)**:
1. 헤더 정보
2. 태스크 개요
3. 생성된 파일 검증
4. 코드 품질 검증
5. 빌드 및 테스트 검증
6. 보안 및 성능 검증
7. 의존성 검증
8. 문제 및 권장사항
9. 최종 평가

**저장 위치**:
```
validation/results/
```

---

## 📞 시작하기

**1단계**: B_AGENT_VERIFICATION_REQUEST.md 열기
**2단계**: VERIFICATION_INSTRUCTIONS.md 읽기
**3단계**: 첫 Task (P1BI1) 검증 시작
**4단계**: 리포트 작성 및 저장

**예상 완료**: 2025-11-04 또는 2025-11-05 (2-3시간)

---

**폴더 버전**: 1.0
**작성일**: 2025-11-04
**상태**: ✅ Ready
