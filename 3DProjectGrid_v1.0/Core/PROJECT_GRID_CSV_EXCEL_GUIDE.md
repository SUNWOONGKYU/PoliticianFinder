# 프로젝트 그리드 CSV/Excel 작성 및 운영 가이드

**작성일**: 2025-10-21
**버전**: v2.0 (특허출원서 v0.4 반영)
**대상**: PoliticianFinder 프로젝트 및 유사 프로젝트
**기반**: 특허 명칭: "3차원 다중 작업 속성의 복수 그리드 기반 프로젝트 자동 실행 및 관리 시스템 및 방법"

---

## 📌 특허 기반 소개

본 가이드는 특허 청구항 1-12에 정의된 **3차원 복수 그리드 구조**를 실제로 구현하고 운영하기 위한 상세 가이드입니다.

### 핵심 개념 (특허 v0.4 청구항 1-2)

**발명의 핵심**:
> "본 발명의 시스템은 X축에 프로젝트 단계(Phase)를 배치하고, Y축에 작업 영역(Area)을 배치한 2차원 그리드 구조를 생성한 후,
> 각 (Phase, Area) 좌표에서 Z축 방향으로 복수의 작업(Task)을 적층하되, 각 작업은 15개의 속성을 가지는 3차원 복수 그리드 구조를 형성한다."

**기본 효과** (특허 청구항 1-2 근거):
- ✅ **3차원 복수 그리드 구조** - 복잡한 프로젝트를 직관적으로 표현
- ✅ **15개 작업 속성** - 모든 정보를 한 곳에서 관리
- ✅ **AI-Only 원칙** - 인간 개입 배제 (특허 청구항 8)
- ✅ **CSV ↔ Excel 양방향 동기화** - 실시간 동기화 (특허 청구항 7)
- ✅ **의존성 자동 관리** - 선행 작업 변경 시 후속 작업 자동 전파 (특허 청구항 9)
- ✅ **자동화 검증** - 검증 방법 자동 실행 (특허 청구항 12)

---

## 1️⃣ CSV 파일 상세 구조 및 작성 가이드 (특허 청구항 6 기반)

**특허 청구항 6**: "상기 3차원 복수 그리드는 CSV 파일 형식으로 저장되되..."

CSV 파일은 3차원 복수 그리드를 2D 형식으로 저장하는 핵심 포맷입니다.
이 섹션에서는 특허에서 정의한 **CSV 파서 알고리즘**을 구현하기 위한 파일 구조를 설명합니다.

### 1.1 CSV 파일 기본 구조

#### 파일 이름 규칙
```
project_grid_v{버전}_{설명}.csv

예시:
- project_grid_v1.0_initial.csv
- project_grid_v2.0_supabase.csv
- project_grid_v5.0_phase2d_complete.csv
```

#### 파일 생성 및 저장
```
저장 위치: /PoliticianFinder/15DGC-AODM_Grid/
인코딩: UTF-8 BOM (Excel 한글 호환성)
줄바꿈: CRLF (Windows) 또는 LF (Linux/Mac)
구분자: 쉼표 (,)
인용: 큰따옴표 (")
```

### 1.2 헤더 행 (첫 번째 행)

#### 구조
```
영역,속성,Phase 1: {Phase명},Phase 2: {Phase명},...,Phase N: {Phase명}
```

#### 예시
```csv
영역,속성,Phase 1: Supabase 기반 인증 시스템,Phase 2: 정치인 목록/상세,Phase 3: 커뮤니티 기능,Phase 4: 테스트 & 최적화,Phase 5: 베타 런칭,Phase 6: 다중 AI 평가,Phase 7: 연결 서비스 플랫폼,Phase 8: AI 아바타 소통
```

#### 작성 가이드
- 첫 번째 열: "영역" (고정)
- 두 번째 열: "속성" (고정)
- 세 번째 열부터: Phase 이름
- Phase명 앞에 "Phase N:" 접두사 붙이기 (명확성)
- Phase 개수: 일반적으로 3-10개

### 1.3 Area별 그룹 구조

#### 구조 (특허 청구항 6 기반)
```
{Area명},,,,...
,{속성명1},{값1-1},{값1-2},...
,{속성명2},{값2-1},{값2-2},...
...
,{속성명15},{값15-1},{값15-2},...
```

**특허 청구항 6 CSV 파서 알고리즘**:
1. 첫 번째 행에서 Phase 목록 추출
2. 첫 번째 열이 공백이 아닌 행을 Area 헤더 행으로 식별
3. 각 Area 내에서 15개 속성 행(작업ID, 업무, ..., 수정이력)을 순차적으로 식별
4. 각 (Area, 속성, Phase) 좌표의 값 추출
5. 동일한 (Area, Phase) 좌표에서 복수의 작업ID 식별 → **Z축 방향 적층 감지**

#### Area 그룹 예시 (Frontend)
```csv
Frontend,,,,...
,작업ID,P1F1,P2F1,P3F1,...
,업무,AuthContext 생성,정치인 카드 컴포넌트,알림 벨 컴포넌트,...
,작업지시서,tasks/P1F1.md,tasks/P2F1.md,tasks/P3F1.md,...
,담당AI,fullstack-developer,fullstack-developer,fullstack-developer,...
,진도,100%,0%,100%,...
,상태,완료 (2025-10-16 14:30),완료 (2025-10-20 03:00),완료 (2025-10-17 18:31),...
,검증 방법,Build Test,Build Test,Build Test,...
,테스트/검토,통과,미통과,통과,...
,자동화방식,AI-only,AI-only,AI-only,...
,의존작업,P1A4,P2B1,P3B1,...
,블로커,없음,없음,없음,...
,참고사항,-,-,-,...
,수정 이력,Supabase Auth 통합 완료,-,-,...
```

#### 전체 Area 구성 (특허 청구항 4 기반)
```
Frontend
Backend (또는 Backend/Supabase)
Database (또는 Database/Supabase)
Authentication
DevOps & Infra (또는 DevOps/Infrastructure)
Test & QA (또는 Test & QA/Validation)
Design (또는 Design/UX)
```

**가이드**:
- 각 Area는 독립적인 블록으로 구성
- **Area 내에는 정확히 15개의 속성 행** (특허 청구항 4)
- Area 간에는 한 행의 공백 없음 (바로 연속)
- 마지막 Area 다음 행부터 다음 Area 시작

### 1.4 15개 속성 상세 작성 가이드 (특허 청구항 4 기반)

**특허 청구항 4**: "상기 작업 속성의 기본 구성은 다음 15개로 구성되는 것을 특징으로 하는..."

#### 속성 1: 영역 (Area)

**위치**: 첫 번째 열, Area 그룹의 첫 행
**형식**: 영역명 (영문+한글 선택)
**예시**:
```
Frontend
Backend
Database
Authentication
DevOps & Infra
Test & QA
Design
```

**작성 규칙**:
- Area는 Area 그룹의 첫 번째 행에만 기재
- 같은 Area 내 다른 속성 행들은 첫 번째 열을 공백으로 처리
- 프로젝트에 맞게 커스텀 가능

#### 속성 2: 속성 (Attribute)

**위치**: 두 번째 열, 모든 속성 행
**형식**: 속성 레이블
**내용** (15가지):
```
1. 작업ID
2. 업무
3. 작업지시서
4. 담당AI
5. 진도
6. 상태
7. 검증 방법
8. 테스트/검토
9. 자동화방식
10. 의존작업
11. 블로커
12. 참고사항
13. 수정 이력
```

**작성 규칙**:
- 순서 변경 금지 (자동화 도구 호환성)
- 필수 13개는 반드시 포함
- 선택 속성은 프로젝트별로 추가/제거 가능

#### 속성 3: 작업ID

**위치**: 세 번째 열부터, "작업ID" 행
**형식**: `P{Phase번호}{Area코드}{순번}`
**예시**:
```
P1F1  (Phase 1, Frontend, 1번째)
P2B3  (Phase 2, Backend, 3번째)
P3D2  (Phase 3, Database, 2번째)
```

**Area 코드**:
| Area | 코드 |
|------|------|
| Frontend | F |
| Backend | B |
| Database | D |
| Authentication | A |
| DevOps | V |
| Test & QA | Q |
| Design | C |

**작성 규칙**:
- 대문자 사용
- Phase 번호 1부터 시작
- 각 (Phase, Area)별 순번은 1부터 증가
- 고유성 필수 (중복 불가)
- 한 번 생성 후 절대 변경 금지

#### 속성 4: 업무

**위치**: 세 번째 열부터, "업무" 행
**형식**: 구체적 작업명 (한글)
**예시**:
```
AuthContext 생성
정치인 카드 컴포넌트
회원가입 페이지
로그인 페이지
데이터베이스 마이그레이션
API 엔드포인트 구현
```

**작성 규칙**:
- 명확하고 구체적인 동사+목적어 형식
- 4-15자 권장 (너무 짧거나 길면 안 됨)
- 특수문자 사용 지양 (쉼표, 따옴표 제외)
- Phase 내에서 고유해야 함 (같은 이름 불가)

#### 속성 5: 작업지시서

**위치**: 세 번째 열부터, "작업지시서" 행
**형식**: `tasks/{작업ID}.md`
**예시**:
```
tasks/P1F1.md
tasks/P2B1.md
tasks/P3D1.md
```

**작성 규칙**:
- 반드시 markdown 파일 형식
- 파일명은 작업ID와 동일하게
- 파일 실제 존재 필수 (또는 작성 계획 필수)
- 상대 경로 사용
- 파일이 없으면 작업 진행 불가

**작업지시서 파일 내용 예시**:
```markdown
# P1F1: AuthContext 생성

## 요구사항
- React Context API를 사용한 인증 상태 관리
- 사용자 정보 저장
- 로그인/로그아웃 함수 제공

## 구현 세부사항
1. AuthContext 생성
2. AuthProvider 컴포넌트 작성
3. useAuth() 커스텀 훅 생성
4. 테스트 작성

## 결과물
- src/contexts/AuthContext.js (200줄 이상)
- src/hooks/useAuth.js (50줄 이상)

## 검증
- npm run build 성공
- 유닛 테스트 통과율 100%
```

#### 속성 6: 담당AI

**위치**: 세 번째 열부터, "담당AI" 행
**형식**: AI 에이전트 이름
**예시**:
```
fullstack-developer
backend-expert
database-architect
devops-troubleshooter
security-auditor
frontend-designer
qa-specialist
```

**내장 AI 에이전트** (권장):
```
fullstack-developer: 전체 스택 개발
backend-expert: 백엔드 전문가
database-architect: 데이터베이스 설계
devops-troubleshooter: DevOps/인프라
security-auditor: 보안 감시
frontend-designer: 프론트엔드 디자인
qa-specialist: QA/테스트
ai-researcher: AI 연구
```

**작성 규칙** (특허 청구항 1c 기반):
- 하이픈(-) 사용하여 이름 구성
- 공백 사용 금지
- 프로젝트별로 추가 AI 정의 가능
- 같은 작업의 여러 AI 할당 불가 (메인 AI만)

#### 속성 7: 진도

**위치**: 세 번째 열부터, "진도" 행
**형식**: `{0|25|50|75|100}%`
**예시**:
```
0%      (미시작)
25%     (초기 단계)
50%     (중간 단계)
75%     (마무리 단계)
100%    (완료)
```

**작성 규칙**:
- 5개 값만 허용 (0, 25, 50, 75, 100)
- 초기값: 0% (작업 미시작)
- 진행 중 수정 가능
- 완료 기준: 테스트 검토 통과

#### 속성 8: 상태 (특허 청구항 1a, 9 기반)

**위치**: 세 번째 열부터, "상태" 행
**형식**: `{상태} ({YYYY-MM-DD HH:mm})`
**예시**:
```
대기 (2025-10-21 10:00)
진행 (2025-10-21 14:30)
완료 (2025-10-16 14:30)
보류 (2025-10-18 09:00)
재작업필요 (2025-10-20 18:00)
```

**상태값**:
| 상태 | 의미 | 조건 |
|------|------|------|
| 대기 | 시작 대기 | 의존작업 모두 완료, 담당AI 할당됨 |
| 진행 | 진행 중 | 담당AI가 작업 수행 중 |
| 완료 | 완료됨 | 테스트/검토 = 통과 |
| 보류 | 일시 중단 | 리소스 부족, 기술 난제 |
| 재작업필요 | 재작업 필요 | 테스트 실패, 버그 발견 |

**작성 규칙** (특허 청구항 9 "의존성 체인 자동 관리"):
- 타임스탬프 포함 (상태 변경 시각)
- 상태 변경 시 타임스탬프 업데이트
- 초기값: `대기 (작업 시작 예정 시각)`
- 완료일: 실제 완료 시각으로 기재
- **선행 작업 변경 시 자동으로 "재작업필요"로 전환됨** (특허 자동 기능)

#### 속성 9: 검증 방법 (특허 청구항 12 기반)

**위치**: 세 번째 열부터, "검증 방법" 행
**형식**: 검증 방법
**예시**:
```
Build Test
Unit Test
Integration Test
Manual Test
Performance Test
Security Test
E2E Test
```

**검증 방법 설명** (특허 청구항 12):
| 방법 | 설명 | 명령어 예시 | 자동 검증 |
|------|------|-----------|---------|
| Build Test | 빌드 성공 여부 | `npm run build` | exit code 확인 |
| Unit Test | 단위 테스트 | `npm run test:unit` | 통과율 확인 |
| Integration Test | 통합 테스트 | `npm run test:integration` | API 응답 확인 |
| Manual Test | 수동 테스트 | 개발자 수동 검증 | 수동 |
| Performance Test | 성능 테스트 | `npm run test:performance` | 성능 지표 비교 |
| Security Test | 보안 테스트 | OWASP 감시 도구 | 취약점 검출 |
| E2E Test | 엔드투엔드 테스트 | `npm run test:e2e` | 모든 시나리오 통과 |

**작성 규칙**:
- 작업에 맞는 검증 방법 선택
- 여러 개 필요하면 쉼표로 구분: `Build Test, Unit Test`
- 자동화 가능한 방법 권장
- 검증 방법 없으면: `-` 입력

#### 속성 10: 테스트/검토

**위치**: 세 번째 열부터, "테스트/검토" 행
**형식**: `{통과|미통과|대기}`
**예시**:
```
통과
미통과
대기
```

**상태 설명** (특허 청구항 12 자동 검증 기반):
| 상태 | 의미 | 다음 액션 | 특허 자동 기능 |
|------|------|----------|-------------|
| 통과 | 검증 성공 | 작업 완료 | 상태 자동 → "완료" |
| 미통과 | 검증 실패 | 상태를 "재작업필요"로 변경 | 상태 자동 → "재작업필요" |
| 대기 | 검증 미실시 | 담당AI 작업 완료 후 검증 | 검증 대기 중 |

**작성 규칙** (특허 청구항 12 자동 실행):
- 초기값: 대기
- 검증 실시 후 자동 업데이트
- **테스트 통과 시만 상태를 "완료"로 변경** (자동)
- 자동화 가능한 검증은 도구로 자동 실행

#### 속성 11: 자동화방식 (특허 청구항 1f, 8 기반)

**위치**: 세 번째 열부터, "자동화방식" 행
**형식**: 자동화 방식
**예시**:
```
AI-only
외부협력 (ChatGPT)
외부협력 (Gemini)
외부협력 (GitHub Copilot)
수동 작업
```

**자동화 방식 설명** (특허 청구항 8 "AI-Only 원칙"):
| 방식 | 설명 | 상황 | 특허 원칙 |
|------|------|------|----------|
| **AI-only** | **AI만 수행** | **일반 개발 작업** | **인간 개입 배제** ✅ |
| 외부협력 (ChatGPT) | ChatGPT 활용 | 복잡한 로직 설계 필요 | 보조 역할 |
| 외부협력 (Gemini) | Gemini 활용 | 이미지 분석, 다중모달 필요 | 보조 역할 |
| 수동 작업 | 인간 수행 | 기술 검토, 승인 | 예외 경우 |

**작성 규칙** (특허 청구항 8):
- **"AI-only"가 기본값** (인간 개입 배제)
- 특수한 경우만 외부협력 명시
- 자동화 불가한 작업은 수동 명시
- 여러 방식 조합 가능: `AI-only, 외부협력 (검토)`

#### 속성 12: 의존작업 (특허 청구항 1d, 9 기반)

**위치**: 세 번째 열부터, "의존작업" 행
**형식**: Task ID (선행 작업)
**예시**:
```
P1A4
P1A4, P1C2
P2B1
-
```

**작성 규칙** (특허 청구항 9 "의존성 체인"):
- Task ID 형식: `P{Phase}{Area}{순번}`
- 여러 개 필요하면 쉼표+공백으로 구분: `P1A4, P2B1`
- 의존성 없으면: `-` 입력
- 순환 의존성 금지 (A→B→A) ✅ 자동 검증
- Phase 순서 준수 (Phase N+1은 Phase N에만 의존)

**의존성 설정 규칙** (특허 청구항 9):
```
같은 Phase 내:
P1F1 → P1F2 (순차 진행)
P1F1, P1B1 → P1C1 (병렬 후 통합)

다른 Phase:
P1F1 → P2F1 (이전 Phase 완료 후)
P1F1, P2B1 → P3F1 (여러 Phase에서)

피해야 할 패턴:
❌ P1F1 → P1F2 → P1F1 (순환) - 자동 감지
❌ P3F1 → P1F1 (역순)
❌ 의존성 없는 작업들은 병렬 처리
```

#### 속성 13: 블로커 (특허 청구항 10 기반)

**위치**: 세 번째 열부터, "블로커" 행
**형식**: 블로커 상태
**예시**:
```
없음
기술 이슈: API 명세 미정
의존성 대기: P1A4 완료 대기
리소스 부족: 개발자 할당 필요
외부 의존성: 외부 API 승인 대기
```

**블로커 상태** (특허 청구항 10 "블로커 자동 감지"):
| 상태 | 설명 | 해결 방법 | 특허 자동 기능 |
|------|------|----------|-------------|
| 없음 | 진행 중 문제 없음 | - | 정상 진행 |
| 기술 이슈 | 기술적 난제 | 기술 검토, 리팩토링 | 감지 자동 알림 |
| 의존성 대기 | 선행 작업 미완료 | 선행 작업 완료 대기 | 선행 완료 시 자동 해제 |
| 리소스 부족 | 개발자/리소스 부족 | 리소스 할당 | 감지 자동 알림 |
| 외부 의존성 | 외부 요인 | 협력 기관에 요청 | 감지 자동 알림 |

**작성 규칙** (특허 청구항 10):
- 문제 없으면: `없음`
- 문제 있으면: `{블로커명}: {세부사항}` 형식
- 블로커 발견 즉시 기재
- 블로커 해결 시 "없음"으로 변경 + 수정 이력 기록
- **7일 이상 대기 시 자동으로 "정체 의심" 감지** (특허 청구항 10)

#### 속성 14: 참고사항

**위치**: 세 번째 열부터, "참고사항" 행
**형식**: 추가 정보 (자유 형식)
**예시**:
```
-
공휴일 고려하여 일정 조정
버그 수정 (이슈 #245)
고객 요청 변경사항 반영됨
라이브러리 버전 업그레이드 필요
```

**작성 규칙**:
- 추가 정보 없으면: `-`
- **작업 수행 시 참고할 특수 상황, 주의사항 기재**
- 자유로운 형식 (100자 이내 권장)
- 중요한 정보는 상태나 블로커에 기재하는 것이 낫지만, 참고할 정보는 참고사항에 기재

#### 속성 15: 수정 이력 (특허 청구항 11 기반)

**위치**: 세 번째 열부터, "수정 이력" 행
**형식**: `{수정 내용} ({YYYY-MM-DD HH:mm})`
**예시**:
```
-
AuthContext Hook 분리 (2025-10-16 15:30)
Supabase Auth 통합 완료 (2025-10-15 18:00)
버그 수정: 타입스크립트 에러 (2025-10-17 09:15)
기능 추가: 소셜 로그인 (2025-10-18 14:20)
```

**작성 규칙** (특허 청구항 11 "수정 이력 자동 기록"):
- 수정 사항 없으면: `-`
- **수정 시마다 자동 기록 추가** (누적)
- 최신 수정사항을 첫 번째에 기재
- 세미콜론(;)으로 여러 수정사항 구분: `수정1 (시간); 수정2 (시간)`
- 수정 이력 행은 누적되므로 매우 길어질 수 있음
- **누가(AI 또는 인간), 언제, 무엇을 변경했는지 추적 가능** (특허 자동 기능)

---

## 2️⃣ Excel 파일 작성 및 포매팅 가이드 (특허 청구항 7 기반)

**특허 청구항 7**: "CSV 파일과 Excel 파일 간 양방향 동기화"

### 2.1 CSV → Excel 변환 단계 (특허 청구항 7 정방향)

#### 단계 1: CSV 파일 열기
```
1. Excel 열기 (빈 시트)
2. 메뉴: 파일 → 열기
3. project_grid_v5.0.csv 파일 선택
4. 구분 기호 탭 선택 → "쉼표" 선택 → 마침
```

#### 단계 2: 셀 색상 적용 (조건부 서식) - 특허 청구항 7 기반

**상태 속성에 따른 색상** (특허 청구항 7):
| 상태 | 색상 | RGB | 의미 |
|------|------|-----|------|
| 완료 | 초록색 | #90EE90 | 작업 완료 |
| 진행 | 노란색 | #FFFF99 | 진행 중 |
| 대기 | 흰색 | #FFFFFF | 대기 중 |
| 보류 | 주황색 | #FFD700 | 일시 보류 |
| 재작업필요 | 빨간색 | #FFB6C1 | 재작업 필요 |

**적용 방법**:
```
1. "상태" 행 선택 (전체 Phase 열)
2. 조건부 서식 → 새 규칙
3. 수식 사용:
   - 완료: =FIND("완료", C8)
   - 진행: =FIND("진행", C8)
   - 대기: =FIND("대기", C8)
   - 보류: =FIND("보류", C8)
   - 재작업필요: =FIND("재작업필요", C8)
4. 각 규칙에 해당하는 색상 적용
```

#### 단계 3: Phase별 열 그룹화

**방법** (특허 청구항 7):
```
1. Phase 관련 열 선택 (예: C부터 J 열)
2. 데이터 → 그룹화
3. "열" 선택
4. 그룹 축소/확대 버튼으로 Phase별 보기 조절
```

#### 단계 4: 열 너비 자동 조정

```
1. 전체 선택 (Ctrl+A)
2. 홈 → 서식 → 열 → 너비 자동 조정
3. 또는 열 구분선 더블클릭 (각 열별)
```

### 2.2 Excel 포매팅 상세 가이드

#### 헤더 행 포매팅

```excel
스타일:
- 폰트: 굵음, 12pt
- 배경색: 진한 파란색 (#003366)
- 텍스트 색상: 흰색 (#FFFFFF)
- 텍스트 정렬: 중앙 정렬
- 줄 바꿈: 활성화
- 높이: 자동 (보통 30-40pt)
```

#### Area별 헤더 포매팅

```excel
Area 그룹의 첫 행:
- 폰트: 굵음, 11pt
- 배경색: 연한 파란색 (#E7F0FF)
- 테두리: 상단/하단 굵은 선
- 높이: 25pt
```

#### 데이터 행 포매팅

```excel
전체 데이터 행:
- 폰트: 일반, 10pt
- 텍스트 정렬: 좌측 정렬 (텍스트), 중앙 정렬 (상태)
- 줄 바꿈: 활성화
- 높이: 자동 또는 20pt
- 테두리: 가는 선
```

#### 열 너비 설정 권장값

```excel
열 | 너비 (문자 수)
---|---------------
A (영역) | 12
B (속성) | 15
C-J (Phase) | 25-30 (각 Phase별 너비 다름)
```

### 2.3 대시보드 시트 생성 (특허 청구항 7 기반)

**특허 청구항 7**: "각 Phase의 진행률을 자동 계산하여 대시보드 시트 생성"

#### 시트 이름: Dashboard

#### 대시보드 구성

**1. 전체 진행률**
```excel
제목: 전체 프로젝트 진행률
공식: =COUNTIF(Sheet1!C8:J1000,"완료")/COUNTA(Sheet1!C8:J1000)*100
표시: 프로그레스 바 + 백분율

예시:
전체 진행률: [████████░░] 56%
```

**2. Phase별 진행률**
```excel
| Phase | 완료 | 진행 중 | 대기 | 진행률 |
|-------|------|--------|------|--------|
| Phase 1 | 10 | 2 | 3 | 71% |
| Phase 2 | 8 | 5 | 10 | 44% |
| ... | ... | ... | ... | ... |

공식 (각 Phase별):
완료: =COUNTIF(Sheet1!C8:C500,"완료")
진행: =COUNTIF(Sheet1!C8:C500,"진행")
대기: =COUNTIF(Sheet1!C8:C500,"대기")
진행률: =C2/(C2+D2+E2)*100
```

**3. Area별 진행률**
```excel
| Area | 완료 | 진행 중 | 대기 | 진행률 |
|------|------|--------|------|--------|
| Frontend | 15 | 3 | 5 | 71% |
| Backend | 12 | 2 | 8 | 57% |
| Database | 8 | 1 | 4 | 62% |
| ... | ... | ... | ... | ... |

공식 (각 Area별):
조건부 COUNTIF를 사용하여 Area 필터링
```

**4. 블로커가 있는 작업 목록**
```excel
| Task ID | 업무 | 블로커 | 담당AI | 상태 |
|---------|------|--------|--------|------|
| P1F2 | 정치인 카드 | API 명세 미정 | fullstack-developer | 진행 |
| P2B1 | 인증 API | 라이브러리 버전 | backend-expert | 보류 |
| ... | ... | ... | ... | ... |

공식:
=FILTER(Sheet1!A:E, Sheet1!D:D<>"없음")
또는 VLOOKUP/INDEX-MATCH 조합
```

**5. 위험 작업 (대기 + 의존성 완료됨)** - 특허 청구항 10 기반

```excel
7일 이상 대기 중인 작업 목록 (특허 청구항 10 자동 감지):

| Task ID | 업무 | 상태 변경일 | 경과일수 | 담당AI |
|---------|------|-----------|---------|--------|
| P2F7 | 정치인 목록 페이지 | 2025-10-14 | 7일 | fullstack-developer |
| P6B1 | 다중 평가 API | 2025-10-16 | 5일 | backend-expert |

공식:
=FILTER(Sheet1!A:E, (Sheet1!D:D="대기")*(TODAY()-Sheet1!E:E>=7))
```

### 2.4 Excel 파일 저장 및 관리

#### 파일명 규칙
```
project_grid_v{버전}_{설명}.xlsx

예시:
- project_grid_v1.0_initial.xlsx
- project_grid_v2.0_supabase.xlsx
- project_grid_v5.0_phase2d_complete.xlsx
```

#### 저장 위치
```
경로: /PoliticianFinder/15DGC-AODM_Grid/

디렉터리 구조:
15DGC-AODM_Grid/
  ├── project_grid_v5.0_phase2d_complete.csv (마스터)
  ├── project_grid_v5.0_phase2d_complete.xlsx (참고용)
  ├── backups/
  │   ├── project_grid_v5.0_phase2d_complete_backup_20251021_064508.csv
  │   └── project_grid_v5.0_phase2d_complete_backup_20251021_064508.xlsx
  └── ...
```

#### 버전 관리

**버전 업데이트 시기**:
1. 주요 기능 추가/변경: 부 버전 증가 (v1.0 → v1.1)
2. Phase 완료: 버전 증가 (v1.0 → v2.0)
3. 구조 변경: 메이저 버전 증가 (v1.0 → v2.0)

**버전 표기**:
```
v{메이저}.{마이너}_{설명}

예시:
v1.0_initial
v1.1_phase1_complete
v2.0_supabase_migration
v5.0_phase2d_complete
```

#### 백업 전략

**자동 백업**:
```
- 매일 자동 백업 (날짜+시간 포함)
- 주간 백업 (매주 월요일 정리)
- 월간 백업 (매월 1일 정리)
- Phase 완료 시 별도 백업

파일명 형식:
project_grid_v{버전}_{설명}_backup_{YYYYMMDD_HHMMSS}.csv
```

**백업 저장 위치**:
```
15DGC-AODM_Grid/backups/
```

---

## 3️⃣ CSV↔Excel 양방향 동기화 구현 (특허 청구항 7 기반)

**특허 청구항 7**: "CSV 파일과 Excel 파일 간 양방향 동기화"

### 3.1 현재 상태 (v5.0 기준)

**현재**: CSV → Excel 단방향 변환 완료 ✅
**구현**: Excel → CSV 역동기화 기능 포함 ✅

### 3.2 양방향 동기화 구현 가이드

#### 3.2.1 CSV → Excel (순방향) - 특허 청구항 7

**구현 방법**:
```python
import csv
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment
from datetime import datetime

def csv_to_excel(csv_file, xlsx_file):
    # 1. CSV 읽기
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        csv_data = list(csv.reader(f))

    # 2. Excel 워크북 생성
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Project Grid"

    # 3. 데이터 입력
    for row_idx, row in enumerate(csv_data, 1):
        for col_idx, cell in enumerate(row, 1):
            ws.cell(row=row_idx, column=col_idx, value=cell)

    # 4. 색상 적용 (상태에 따른 조건부 서식)
    colors = {
        "완료": "90EE90",      # 초록색
        "진행": "FFFF99",      # 노란색
        "대기": "FFFFFF",      # 흰색
        "보류": "FFD700",      # 주황색
        "재작업필요": "FFB6C1" # 빨간색
    }

    # 5. 워크북 저장
    wb.save(xlsx_file)
    print(f"Excel 파일 생성: {xlsx_file}")
```

#### 3.2.2 Excel → CSV (역방향) - 특허 청구항 7

**구현 방법**:
```python
import openpyxl
import csv
from datetime import datetime

def excel_to_csv(xlsx_file, csv_file):
    # 1. Excel 읽기
    wb = openpyxl.load_workbook(xlsx_file)
    ws = wb.active

    # 2. 변경된 셀 추출
    changed_cells = []
    for row in ws.iter_rows():
        for cell in row:
            if cell.value is not None:
                changed_cells.append({
                    'cell': cell.coordinate,
                    'value': cell.value,
                    'fill': cell.fill.start_color.rgb if cell.fill else None
                })

    # 3. CSV 파일에 역동기화
    with open(csv_file, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        for row in ws.iter_rows(values_only=True):
            writer.writerow(row)

    # 4. 수정 이력 추가 (특허 청구항 11)
    with open(csv_file, 'a', encoding='utf-8-sig') as f:
        f.write(f"\n# Excel 동기화 완료: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    print(f"CSV 파일 업데이트: {csv_file}")
```

### 3.3 자동 동기화 설정

#### 파이썬 스크립트 (자동 동기화) - 특허 청구항 7 기반

```python
# sync_grid.py
import os
import csv
import openpyxl
from datetime import datetime
from pathlib import Path

class ProjectGridSync:
    def __init__(self, csv_path, xlsx_path):
        self.csv_path = csv_path
        self.xlsx_path = xlsx_path
        self.last_csv_mtime = os.path.getmtime(csv_path)
        self.last_xlsx_mtime = os.path.getmtime(xlsx_path) if os.path.exists(xlsx_path) else 0

    def sync_csv_to_xlsx(self):
        """CSV 파일을 Excel로 변환 (특허 청구항 7 정방향)"""
        print("CSV → Excel 동기화 시작...")

        # CSV 읽기
        with open(self.csv_path, 'r', encoding='utf-8-sig') as f:
            csv_data = list(csv.reader(f))

        # Excel 생성
        wb = openpyxl.Workbook()
        ws = wb.active

        # 데이터 입력 및 포매팅
        for row_idx, row in enumerate(csv_data, 1):
            for col_idx, cell_value in enumerate(row, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=cell_value)

                # 헤더 행 포매팅
                if row_idx == 1:
                    cell.font = openpyxl.styles.Font(bold=True, color="FFFFFF")
                    cell.fill = openpyxl.styles.PatternFill(start_color="003366", fill_type="solid")

                # 상태 행 색상 적용 (특허 청구항 7)
                if row_idx > 1 and col_idx > 2:
                    if "완료" in str(cell_value):
                        cell.fill = openpyxl.styles.PatternFill(start_color="90EE90", fill_type="solid")
                    elif "진행" in str(cell_value):
                        cell.fill = openpyxl.styles.PatternFill(start_color="FFFF99", fill_type="solid")

        wb.save(self.xlsx_path)
        print(f"✓ Excel 파일 생성: {self.xlsx_path}")

    def sync_xlsx_to_csv(self):
        """Excel 파일을 CSV로 역변환 (특허 청구항 7 역방향)"""
        print("Excel → CSV 동기화 시작...")

        # Excel 읽기
        wb = openpyxl.load_workbook(self.xlsx_path)
        ws = wb.active

        # CSV 저장
        with open(self.csv_path, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.writer(f)
            for row in ws.iter_rows(values_only=True):
                writer.writerow(row)

        print(f"✓ CSV 파일 업데이트: {self.csv_path}")

    def auto_sync(self):
        """파일 변경 감지 후 자동 동기화 (특허 청구항 7)"""
        while True:
            csv_mtime = os.path.getmtime(self.csv_path)
            xlsx_mtime = os.path.getmtime(self.xlsx_path) if os.path.exists(self.xlsx_path) else 0

            # CSV 변경 감지
            if csv_mtime > self.last_csv_mtime:
                print(f"CSV 파일 변경 감지: {datetime.now()}")
                self.sync_csv_to_xlsx()
                self.last_csv_mtime = csv_mtime

            # Excel 변경 감지
            if xlsx_mtime > self.last_xlsx_mtime:
                print(f"Excel 파일 변경 감지: {datetime.now()}")
                self.sync_xlsx_to_csv()
                self.last_xlsx_mtime = xlsx_mtime

            time.sleep(5)  # 5초마다 확인

# 사용 예시
if __name__ == "__main__":
    sync = ProjectGridSync(
        csv_path="project_grid_v5.0.csv",
        xlsx_path="project_grid_v5.0.xlsx"
    )
    sync.auto_sync()
```

---

## 4️⃣ 상세한 예시 및 실전 팁

### 4.1 실전 예시: Phase 1 Frontend 작성

```csv
Frontend,,,,,,,,,
,작업ID,P1F1,P1F2,P1F3,P1F4,P1F5,P1F6,P1F7
,업무,AuthContext 생성,회원가입 페이지,로그인 페이지,Navbar 컴포넌트,프로필 페이지,ProtectedRoute,메인 페이지 UI
,작업지시서,tasks/P1F1.md,tasks/P1F2.md,tasks/P1F3.md,tasks/P1F4.md,tasks/P1F5.md,tasks/P1F6.md,tasks/P1F7.md
,담당AI,fullstack-developer,fullstack-developer,fullstack-developer,fullstack-developer,fullstack-developer,fullstack-developer,fullstack-developer
,진도,100%,100%,100%,100%,100%,100%,100%
,상태,완료 (2025-10-16 14:30),완료 (2025-10-16 14:30),완료 (2025-10-16 14:30),완료 (2025-10-16 14:30),완료 (2025-10-16 14:30),완료 (2025-10-16 14:30),완료 (2025-10-18 18:58)
,검증 방법,Build Test,Build Test,Build Test,Build Test,Build Test,Build Test,Build Test
,테스트/검토,통과,통과,통과,통과,통과,통과,통과
,자동화방식,AI-only,AI-only,AI-only,AI-only,AI-only,AI-only,AI-only
,의존작업,P1A4,P1C2,P1C3,P1C1,P1C5,P1C5,P1F6
,블로커,없음,없음,없음,없음,없음,없음,없음
,참고사항,-,-,-,-,-,-,-
,수정 이력,Supabase Auth 통합 완료,-,-,-,-,-,"메인 색상 파란색→보라색 변경, 커뮤니티 섹션 추가"
```

### 4.2 CSV 작성 중 자주 하는 실수

```
❌ 실수 1: 작업ID 중복
P1F1, P1F1 (같은 ID 두 번)
→ ✅ 수정: P1F1, P1F2 (고유 ID 부여)

❌ 실수 2: 순환 의존성 (특허 청구항 9 자동 감지)
P1F1 → P1F2 → P1F1
→ ✅ 수정: P1A4 → P1F1 → P1F2 (선형 구조)

❌ 실수 3: Phase 역순 의존성
P3F1 의존작업 = P1F1 (역순)
→ ✅ 수정: P3F1 의존작업 = P2F1 (순차)

❌ 실수 4: 타임스탬프 형식 불일치
상태: "완료 (10월 16일)"
→ ✅ 수정: 상태: "완료 (2025-10-16 14:30)"

❌ 실수 5: 특수문자 미처리
업무: "API 분석, 설계 및 구현"
→ ✅ 수정: 특수문자는 큰따옴표로 감싸기
"API 분석, 설계 및 구현"
```

### 4.3 성능 최적화 팁

```
1. CSV 파일 크기 관리
   - 현재: 617줄 (약 80KB)
   - 너무 큰 파일(1000줄+)은 응답 속도 저하
   - 필요시 여러 파일로 분할 권장

2. Excel 파일 성능
   - 대량 조건부 서식은 성능 저하
   - Phase별로 시트 분리 고려
   - 불필요한 행/열 삭제

3. 의존성 최적화 (특허 청구항 9)
   - 불필요한 의존성 제거 (병렬 처리 가능하면)
   - 의존성 체인 최소화
   - 순환 의존성 정기 검사 (자동 감지)

4. 속성 최적화
   - 불필요한 속성 제거
   - 필수 속성만 포함 (기본 15개)
   - 커스텀 속성은 프로젝트별로 제한
```

---

## 5️⃣ 트러블슈팅

### 5.1 CSV 파일 문제

| 문제 | 원인 | 해결 방법 |
|------|------|----------|
| 한글 깨짐 | 인코딩 오류 | UTF-8 BOM으로 저장 |
| 쉼표 포함 셀 | 쉼표 구분 오류 | 큰따옴표로 감싸기 |
| 줄바꿈 문제 | CRLF/LF 불일치 | 시스템 기본값 사용 |
| 셀 이동 | 구분 기호 오류 | CSV 파서 설정 확인 |

### 5.2 Excel 파일 문제

| 문제 | 원인 | 해결 방법 |
|------|------|----------|
| 색상 미적용 | 조건부 서식 오류 | 수식 재확인 및 재설정 |
| 셀 병합 오류 | 병합 셀 포함 | 병합 해제 후 재적용 |
| 수식 오류 | 셀 참조 오류 | 절대/상대 참조 확인 |
| 파일 손상 | 동시 편집 | 항상 백업 유지 |

### 5.3 동기화 문제

| 문제 | 원인 | 해결 방법 |
|------|------|----------|
| 동기화 안 됨 | 파일 권한 오류 | 파일 권한 확인 |
| 데이터 손실 | 덮어쓰기 | 백업에서 복구 |
| 충돌 발생 | 동시 편집 | 순차 편집 또는 락 메커니즘 |

---

## 6️⃣ 결론

### 6.1 CSV/Excel 운영 체크리스트

```
일일 관리
[ ] CSV 파일 저장 (작업 완료 시)
[ ] 상태/진도 업데이트
[ ] 블로커 확인 및 기재
[ ] 수정 이력 기록

주간 관리
[ ] Excel 동기화 검증
[ ] Phase 진행률 확인
[ ] 백업 생성
[ ] 의존성 체인 검증 (특허 청구항 9)

월간 관리
[ ] 버전 업데이트
[ ] 파일 정리 (오래된 버전 정리)
[ ] 성과 분석
[ ] 다음 월간 계획 수립
```

### 6.2 권장 도구

```
CSV 편집
- VS Code (CSV Rainbow 확장)
- Google Sheets
- Numbers (Mac)

Excel 관련
- Microsoft Excel 365
- LibreOffice Calc
- Google Sheets

동기화 자동화
- Python (openpyxl, csv 모듈)
- Node.js (xlsx 라이브러리)
- PowerShell (스크립트)
```

### 6.3 특허 청구항 매핑

**본 가이드와 특허의 매핑**:

| 가이드 섹션 | 특허 청구항 | 내용 |
|-----------|-----------|------|
| 1. CSV 구조 | 청구항 6 | CSV 파서 알고리즘 및 3D 그리드 구조 |
| 2. Excel 포매팅 | 청구항 7 | CSV↔Excel 양방향 동기화 및 자동 색상 적용 |
| 3. 동기화 | 청구항 7 | 실시간 양방향 동기화 구현 |
| 4. 15개 속성 | 청구항 4 | 기본 속성 정의 및 작성 규칙 |
| 4.1 의존성 | 청구항 9 | 의존성 체인 자동 관리 |
| 4.8 검증 | 청구항 12 | 검증 방법 자동 실행 |
| 4.10 블로커 | 청구항 10 | 블로커 자동 감지 |
| 4.15 수정 이력 | 청구항 11 | 수정 이력 자동 기록 |

---

**문서 끝**

작성일: 2025-10-21
버전: v2.0 (특허출원서 v0.4 반영)
마지막 업데이트: 2025-10-21 참고사항 속성명 변경 완료
