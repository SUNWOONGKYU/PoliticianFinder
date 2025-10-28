# PoliticianFinder 통합 프로젝트 기획서 V1.0

**AI 기반 정치인 평가 커뮤니티 플랫폼 - 완전 통합 기획서**

---

## 📋 문서 정보

| 항목 | 내용 |
|------|------|
| **프로젝트명** | PoliticianFinder (폴리티션 파인더) |
| **문서 버전** | V1.0 (통합 기획서) |
| **작성일** | 2025-10-24 |
| **작성자** | PoliticianFinder Team |
| **문서 유형** | 통합 프로젝트 기획서 (7개 Part) |
| **개발 방식** | AI-only (100% 자동화) + 프로젝트 그리드 방법론 V2.0 |
| **총 페이지** | 약 150 페이지 |

---

## 📚 목차

### Part 1: 프로젝트 개요 (~15-20p)
1.1 프로젝트 비전 및 미션
1.2 핵심 가치 (Core Values)
1.3 핵심 차별화 요소
1.4 목표 시장 (Target Market)
1.5 시장 분석
1.6 수익 모델 (Business Model)
1.7 개발 로드맵 (Roadmap)
1.8 성공 지표 (KPI)
1.9 핵심 성공 요인 (CSF)

### Part 2: 요구사항 정의 (~25-30p)
2.1 기능 요구사항
2.2 비기능 요구사항
2.3 사용자 유형 및 권한
2.4 제약사항
2.5 우선순위

### Part 3: 시스템 설계 (~30-35p)
3.1 시스템 아키텍처
3.2 데이터베이스 설계
3.3 API 설계
3.4 보안 설계
3.5 인프라 설계

### Part 4: UI/UX 기획 (~20-25p)
4.1 디자인 원칙
4.2 화면 구성
4.3 사용자 플로우
4.4 와이어프레임
4.5 반응형 디자인

### Part 5: 개발 계획 (~30-35p) ⭐ 프로젝트 그리드 방법론 V2.0 적용
5.1 프로젝트 그리드 방법론 개요
5.2 3차원 그리드 시스템
5.3 작업 ID 체계
5.4 21개 속성 시스템
5.5 Phase별 개발 계획 (Phase 0-6)
5.6 의존성 관리 및 병렬/순차 작업
5.7 Phase Gate 시스템
5.8 AI-Only 개발 원칙

### Part 6: 품질 관리 (~15-20p)
6.1 테스트 전략
6.2 품질 기준
6.3 CI/CD 파이프라인
6.4 모니터링 및 성능 관리
6.5 보안 검증

### Part 7: 부록 (~10-15p)
7.1 용어집
7.2 참고 자료
7.3 코드 템플릿
7.4 FAQ
7.5 변경 이력

---

# Part 1: 프로젝트 개요

## 1.1 프로젝트 비전 및 미션

### 슬로건
**"훌륭한 정치인을 찾아드립니다"**

### 미션
대한민국 국민이 정치인을 **객관적으로 평가**하고, **자유롭게 소통**하며, **정치인과 직접 대화**할 수 있는 **신뢰할 수 있는 플랫폼**을 제공합니다.

### 비전
- **2025년**: MVP 출시 (Claude AI 평가 중심)
- **2026년**: 지방선거 대비 대한민국 최고의 정치인 평가 플랫폼
- **2027년**: 5개 AI 통합 평가 시스템 완성
- **2028년**: 아바타 소통 기능으로 24시간 정치인-시민 소통 실현

---

## 1.2 핵심 가치 (Core Values)

### 1. 객관성 (Objectivity)
- **다중 AI 평가**: 단일 AI가 아닌 5개 AI(Claude, GPT, Gemini, Perplexity, Grok)의 종합 평가
- **100개 평가 항목**: 의정활동, 공약이행, 투명성, 소통 등 세부 항목 평가
- **편향 최소화**: AI 간 평가 차이를 통해 편향성 제거

### 2. 투명성 (Transparency)
- **평가 기준 공개**: 모든 AI 평가 기준과 알고리즘 공개
- **데이터 출처 명시**: 평가에 사용된 데이터의 출처 투명하게 공개
- **오픈 소스**: 핵심 평가 알고리즘 오픈 소스화 검토

### 3. 참여성 (Participation)
- **시민 평가**: AI 평가와 함께 시민 평가(별점, 댓글) 병행
- **커뮤니티 소통**: 자유로운 의견 교환 및 토론
- **정치인 직접 참여**: 정치인 본인이 직접 플랫폼 참여 가능

### 4. 접근성 (Accessibility)
- **비회원 접속**: 평가 및 게시글 조회는 비회원도 가능
- **모바일 최적화**: 스마트폰에서 완벽하게 작동
- **무료 이용**: 기본 기능은 완전 무료

### 5. 신뢰성 (Reliability)
- **정치인 본인 인증**: 정치인 본인 확인 시스템으로 가짜 계정 방지
- **검증된 데이터**: 공식 기관 데이터 기반 평가
- **지속적 업데이트**: 실시간 의정활동 반영

---

## 1.3 핵심 차별화 요소

### 1. 단계적 AI 평가 시스템
```
Phase 1 (MVP)
└─ Claude AI 평가만 제공
   ↓
Phase 2+
└─ 5개 AI 종합 평가
   ├─ Claude (Anthropic)
   ├─ GPT (OpenAI)
   ├─ Gemini (Google)
   ├─ Perplexity
   └─ Grok (xAI)

결과: 편향성 최소화 + 신뢰도 극대화
```

**장점**:
- 빠른 MVP 출시 (Claude만으로 시작)
- 점진적 확장으로 리스크 관리
- AI 간 비교를 통한 객관성 확보

### 2. 정치인 직접 참여 시스템
```
일반 플랫폼:
정치인 → 외부 SNS → 시민
   (간접 소통, 통제 어려움)

PoliticianFinder:
정치인 → 본인 인증 → 플랫폼 직접 글 작성 → 시민
   (직접 소통, 투명성 높음)
```

**특징**:
- 🏛️ **본인 인증 뱃지**: 정치인 계정 명확히 구분
- **[정치인 글]** 전용 카테고리
- **투표 불가**: 정치인은 추천/비추천 불가 (공정성 확보)
- **댓글 참여 가능**: 시민과 직접 소통

### 3. 디시인사이드 + 클리앙 하이브리드 커뮤니티
```
디시인사이드 스타일:
✅ 실시간 베스트글 (🔥 HOT)
✅ 개념글 시스템 (⭐)
✅ 추천/비추천 (⬆️⬇️)
✅ 조회수/댓글수 강조

클리앙 스타일:
✅ 깔끔한 UI/UX
✅ 알림 시스템 (🔔)
✅ 북마크/스크랩 (⭐)
✅ 신고 기능 (🚨)
✅ 회원 등급

= 두 사이트의 장점 결합
```

### 4. 연결 서비스 플랫폼 (Phase 3 이후)
정치인에게 필요한 서비스를 연결하는 **B2B 플랫폼**

**서비스 카테고리**:
1. 📋 **컨설팅**: 선거 전략, 정책 자문
2. 📢 **홍보**: 포스터, 전단지, 영상 제작
3. 🎓 **교육**: 리더십, 소통, 정책 교육
4. ⚖️ **법무**: 선거법 자문, 법률 서비스
5. 📊 **여론조사**: 지지율, 정책 만족도

**수익 모델**:
- 서비스 연결 수수료 (10-20%)
- 정치인 프리미엄 멤버십
- AI 리포트 판매

### 5. AI 아바타 소통 기능 (Phase 4 이후)
**24시간 정치인과 대화 가능**

```
시민의 질문 → AI 아바타가 답변
   ↑
정치인의 과거 발언, 공약, 정책 학습

예시:
시민: "○○○ 의원님, 청년 일자리 공약은 어떻게 진행 중이신가요?"
아바타: "현재 청년 일자리 창출을 위해 ××× 법안을 발의했고..."
```

**기능**:
- 정치인별 전용 AI 아바타
- 과거 발언/공약 데이터 학습
- 실시간 질의응답
- 음성 대화 옵션
- 정치인 본인 승인 시스템

---

## 1.4 목표 시장 (Target Market)

### Primary Target (핵심 사용자)
**20-40대 정치 관심층**

- **연령**: 20-49세
- **관심사**: 정치, 사회, 시사
- **특징**:
  - 온라인 커뮤니티 활발히 사용
  - 정치인에 대한 객관적 정보 갈증
  - SNS 활동 활발
  - 투표 참여율 높음

**예상 사용자 수**:
- Phase 1 (1개월): 100명
- Phase 4 (3개월): 1,000명
- 지방선거 전(1년): 100,000명

### Secondary Target (부가 사용자)
1. **정치인 본인**
   - 자신의 평가 확인
   - 시민과 직접 소통
   - 연결 서비스 이용

2. **정치 전문가/언론인**
   - AI 평가 데이터 활용
   - 여론 분석
   - 리포트 구매

3. **50대 이상**
   - 자녀 세대의 추천으로 유입
   - 모바일 앱 사용

---

## 1.5 시장 분석

### 기존 경쟁 서비스 분석

| 서비스 | 특징 | 장점 | 단점 | 차별화 전략 |
|--------|------|------|------|-------------|
| **공약 이행 모니터링 사이트** | 공약 이행률 추적 | 객관적 데이터 | AI 평가 없음, 커뮤니티 약함 | **AI 평가 + 커뮤니티** |
| **디시인사이드** | 대형 커뮤니티 | 활발한 참여 | 정치인 평가 체계 없음 | **AI 평가 시스템** |
| **클리앙** | 깔끔한 커뮤니티 | 우수한 UX | 정치 전문성 부족 | **정치 특화** |
| **SNS (트위터/페북)** | 정치인 직접 소통 | 실시간 소통 | 객관적 평가 없음, 가짜뉴스 | **검증된 AI 평가** |

### 시장 기회 (Market Opportunity)

**기회 요인**:
1. ✅ **정치 불신 증가**: 객관적 평가 플랫폼 필요성 증가
2. ✅ **AI 기술 발전**: AI 평가의 신뢰도 향상
3. ✅ **모바일 사용 증가**: 언제 어디서나 접근 가능
4. ✅ **선거 주기**: 2026년 지방선거, 2027년 대선
5. ✅ **커뮤니티 수요**: 자유로운 정치 토론 공간 부족

**위험 요인**:
1. ⚠️ **AI 평가 신뢰성**: 초기 AI 평가에 대한 불신
2. ⚠️ **정치적 중립성**: 특정 정당 편향 의심
3. ⚠️ **법적 이슈**: 정치인 평가 관련 명예훼손
4. ⚠️ **악성 댓글**: 커뮤니티 관리 부담

**대응 전략**:
- AI 평가 기준 투명 공개
- 다중 AI 평가로 편향성 최소화
- 명확한 커뮤니티 가이드라인
- 신고 시스템 강화

---

## 1.6 수익 모델 (Business Model)

### Phase 1-2: 무료 서비스 (사용자 확보)
```
모든 기능 무료
   ↓
사용자 100,000명 확보
   ↓
Phase 3부터 수익화
```

### Phase 3+: 수익화 전략

#### 1. AI 리포트 판매 💵
**대상**: 정치인, 정치 전문가, 언론인

**상품 구성**:
| 리포트 종류 | 가격 | 내용 |
|-------------|------|------|
| **베이직 리포트** | 10,000원 | Claude AI 평가 상세 (30페이지) |
| **프리미엄 리포트** | 50,000원 | 5개 AI 종합 평가 + 항목별 분석 (100페이지) |
| **커스텀 리포트** | 200,000원 | 맞춤 평가 + 개선 제안 (200페이지) |

**예상 매출** (월간):
- 베이직: 50건 × 10,000원 = 500,000원
- 프리미엄: 20건 × 50,000원 = 1,000,000원
- 커스텀: 5건 × 200,000원 = 1,000,000원
- **총계**: 2,500,000원/월

#### 2. 연결 서비스 수수료 💵
**대상**: 정치인 ↔ 서비스 업체 연결

**수수료 구조**:
- 컨설팅: 계약 금액의 15%
- 홍보 제작: 계약 금액의 10%
- 교육: 계약 금액의 10%

**예상 매출** (월간):
- 월 10건 매칭
- 평균 계약금액: 5,000,000원
- 수수료율: 15%
- **총계**: 7,500,000원/월

#### 3. 프리미엄 멤버십 💵
**대상**: 정치인

**멤버십 혜택**:
| 플랜 | 가격 | 혜택 |
|------|------|------|
| **베이직** | 무료 | 기본 프로필, 게시글 작성 |
| **프리미엄** | 100,000원/월 | AI 평가 무제한, 통계 대시보드, 아바타 활성화 |
| **엔터프라이즈** | 500,000원/월 | 전용 담당자, 맞춤 분석, 광고 제거 |

**예상 매출** (월간):
- 프리미엄: 50명 × 100,000원 = 5,000,000원
- 엔터프라이즈: 5명 × 500,000원 = 2,500,000원
- **총계**: 7,500,000원/월

#### 4. 광고 수익 💵
**광고 유형**:
- 배너 광고 (정치 관련 상품/서비스)
- 스폰서 게시글
- 네이티브 광고

**예상 매출** (월간): 3,000,000원

---

### 예상 총 매출 (Phase 3 이후)

| 수익원 | 월 매출 |
|--------|---------|
| AI 리포트 | 2,500,000원 |
| 연결 서비스 | 7,500,000원 |
| 프리미엄 멤버십 | 7,500,000원 |
| 광고 | 3,000,000원 |
| **총계** | **20,500,000원/월** |
| **연매출** | **약 2억 5천만원** |

---

## 1.7 개발 로드맵 (Roadmap)

### Phase 0: 기획 및 설계 ✅ (완료)
- ✅ 프로젝트 기획서 작성
- ✅ 기술 스택 결정 (Supabase)
- ✅ DB 스키마 설계
- ✅ Skills + Agents 시스템 구축
- ✅ 프로젝트 그리드 방법론 V2.0 적용

### Phase 1: MVP
**목표**: Claude AI 평가 + 기본 커뮤니티

**핵심 기능**:
- 회원가입/로그인
- 정치인 50명 데이터
- Claude AI 평가 표시
- 게시글 CRUD
- 댓글 기능

**완료 기준**:
- 회원 100명
- 게시글 50개
- Claude AI 평가 작동

### Phase 2: 커뮤니티 강화
**목표**: 디시인사이드 + 클리앙 기능

**핵심 기능**:
- 추천/비추천
- 베스트글 시스템
- 개념글 시스템
- 알림 기능
- 북마크/스크랩
- 신고 기능

**완료 기준**:
- 회원 1,000명
- 일 방문자 500명

### Phase 3: 수익화
**목표**: 연결 서비스 + 리포트 판매

**핵심 기능**:
- 연결 서비스 페이지
- AI 리포트 생성
- 결제 시스템
- 정치인 프리미엄 멤버십

**완료 기준**:
- 월 매출 5백만원 달성

### Phase 4: 다중 AI 확장
**목표**: 5개 AI 종합 평가

**핵심 기능**:
- GPT, Gemini, Perplexity, Grok 추가
- AI 비교 차트
- 종합 점수 알고리즘

**완료 기준**:
- 5개 AI 평가 작동
- 편향성 최소화 검증

### Phase 5: 아바타 소통
**목표**: 24시간 정치인 소통

**핵심 기능**:
- AI 아바타 시스템
- 실시간 채팅
- 음성 대화
- 대화 히스토리

**완료 기준**:
- 정치인 100명 아바타 활성화
- 일 대화 1,000건

---

## 1.8 성공 지표 (KPI)

### Phase 1 목표 (1개월)
| 지표 | 목표 |
|------|------|
| 회원 가입 | 100명 |
| 정치인 등록 | 10명 |
| 게시글 | 50개 |
| 댓글 | 200개 |
| 일 방문자 | 50명 |

### Phase 2 목표 (3개월)
| 지표 | 목표 |
|------|------|
| 회원 가입 | 1,000명 |
| 정치인 등록 | 50명 |
| 게시글 | 500개 |
| 일 방문자 | 500명 |
| 월간 활성 사용자(MAU) | 300명 |

### 최종 목표 (2026년 지방선거)
| 지표 | 목표 |
|------|------|
| 회원 가입 | 100,000명 |
| 정치인 등록 | 500명 |
| 게시글 | 50,000개 |
| 일 방문자 | 50,000명 |
| 월 매출 | 2,000만원 |

---

## 1.9 핵심 성공 요인 (CSF)

### 1. AI 평가의 신뢰성
- 투명한 평가 기준 공개
- 다중 AI로 편향성 최소화
- 정기적인 평가 업데이트

### 2. 커뮤니티 활성화
- 양질의 콘텐츠 생성
- 악성 댓글 관리
- 정치인 직접 참여 유도

### 3. 정치적 중립성
- 모든 정당 공평한 대우
- 편향된 알고리즘 방지
- 투명한 운영 정책

### 4. 사용자 경험
- 직관적인 UI/UX
- 빠른 로딩 속도
- 모바일 최적화

### 5. 지속적인 혁신
- AI 기술 발전 반영
- 사용자 피드백 수용
- 새로운 기능 개발

---

# Part 2: 요구사항 정의

## 2.1 기능 요구사항

### 2.1.1 사용자 인증 및 권한 관리

#### FR-001: 회원가입
- **설명**: 이메일, 닉네임, 비밀번호로 회원가입
- **우선순위**: 필수 (P0)
- **입력**: 이메일, 닉네임, 비밀번호 (8자 이상)
- **출력**: 회원가입 성공/실패, 이메일 인증 링크 발송
- **검증**:
  - 이메일 형식 검증
  - 닉네임 중복 확인
  - 비밀번호 강도 체크

#### FR-002: 로그인
- **설명**: 이메일/비밀번호로 로그인
- **우선순위**: 필수 (P0)
- **입력**: 이메일, 비밀번호
- **출력**: JWT 토큰 발급, 사용자 프로필 정보
- **검증**:
  - 이메일 존재 여부
  - 비밀번호 일치 여부
  - 이메일 인증 완료 여부

#### FR-003: 정치인 본인 인증
- **설명**: 정치인 계정 본인 인증
- **우선순위**: 높음 (P1)
- **입력**: 신분증, 공문서
- **출력**: 🏛️ 인증 뱃지 부여
- **검증**:
  - 관리자 승인 필요
  - 정치인 데이터베이스 대조

### 2.1.2 정치인 평가 시스템

#### FR-010: Claude AI 평가 조회
- **설명**: 정치인별 Claude AI 평가 점수 조회
- **우선순위**: 필수 (P0)
- **입력**: 정치인 ID
- **출력**:
  - 종합 점수 (0-100점)
  - 100개 항목별 점수
  - 평가 상세 내역
- **조건**: 비회원도 조회 가능

#### FR-011: 다중 AI 평가 조회 (Phase 2+)
- **설명**: 5개 AI의 평가 점수 비교
- **우선순위**: 중간 (P2)
- **입력**: 정치인 ID
- **출력**:
  - AI별 개별 점수
  - 종합 점수 (가중 평균)
  - AI 간 점수 차이 분석
- **AI 목록**: Claude, GPT, Gemini, Perplexity, Grok

#### FR-012: 시민 평가 (별점)
- **설명**: 일반 회원이 정치인에게 별점 부여
- **우선순위**: 필수 (P0)
- **입력**: 정치인 ID, 별점 (1-5)
- **출력**: 평균 별점 업데이트
- **제약**:
  - 회원당 정치인 1명당 1회만 평가 가능
  - 수정 가능

### 2.1.3 커뮤니티 게시판

#### FR-020: 게시글 작성
- **설명**: 게시글 작성 기능
- **우선순위**: 필수 (P0)
- **입력**:
  - 제목 (2-200자)
  - 내용 (10자 이상)
  - 카테고리
  - 정치인 태그 (선택)
- **출력**: 게시글 ID, 작성 완료
- **제약**:
  - 로그인 필수
  - 정치인은 [정치인 글] 카테고리에만 작성 가능

#### FR-021: 게시글 조회
- **설명**: 게시글 목록 및 상세 조회
- **우선순위**: 필수 (P0)
- **입력**:
  - 카테고리 (선택)
  - 정렬 기준 (최신순, 추천순, 조회순)
  - 페이지네이션
- **출력**:
  - 게시글 목록
  - 작성자, 제목, 조회수, 추천수, 댓글수
  - 🔥 HOT 배지 (실시간 베스트)
  - ⭐ 개념글 배지

#### FR-022: 댓글 작성
- **설명**: 게시글에 댓글 및 대댓글 작성
- **우선순위**: 필수 (P0)
- **입력**:
  - 게시글 ID
  - 댓글 내용 (1자 이상)
  - 부모 댓글 ID (대댓글인 경우)
- **출력**: 댓글 ID, 작성 완료
- **제약**: 로그인 필수

#### FR-023: 추천/비추천 (투표)
- **설명**: 게시글/댓글에 추천(⬆️) 또는 비추천(⬇️)
- **우선순위**: 필수 (P0)
- **입력**:
  - 대상 타입 (post/comment)
  - 대상 ID
  - 투표 타입 (up/down)
- **출력**: 투표 카운트 업데이트
- **제약**:
  - 로그인 필수
  - 1인당 1회만 투표 가능
  - 투표 변경 가능
  - 정치인 계정은 투표 불가

### 2.1.4 커뮤니티 고급 기능

#### FR-030: 실시간 베스트글
- **설명**: 추천수 기준 실시간 베스트글 표시
- **우선순위**: 높음 (P1)
- **조건**:
  - 1시간 내 추천 10개 이상
  - 🔥 HOT 배지 표시
- **출력**: 베스트글 리스트 (메인 페이지 상단)

#### FR-031: 개념글
- **설명**: 추천 임계값 초과 시 개념글 지정
- **우선순위**: 높음 (P1)
- **조건**:
  - 24시간 내 추천 50개 이상
  - ⭐ 개념글 배지 표시
- **출력**: 개념글 모아보기 탭

#### FR-032: 북마크/스크랩
- **설명**: 게시글 북마크/스크랩 기능
- **우선순위**: 중간 (P2)
- **입력**: 게시글 ID
- **출력**: 내 스크랩 목록에 추가
- **제약**: 로그인 필수

#### FR-033: 알림 시스템
- **설명**: 실시간 알림 기능
- **우선순위**: 중간 (P2)
- **알림 유형**:
  - 내 글에 댓글
  - 내 댓글에 답글
  - 멘션 (@닉네임)
- **출력**:
  - 알림 아이콘 🔔 배지
  - 알림 리스트
  - 읽음/안읽음 상태

#### FR-034: 신고 기능
- **설명**: 게시글/댓글/사용자 신고
- **우선순위**: 높음 (P1)
- **입력**:
  - 신고 대상 (post/comment/user)
  - 신고 사유 (선택)
  - 상세 설명
- **출력**: 신고 접수, 관리자에게 전달
- **제약**: 로그인 필수

### 2.1.5 관리자 기능

#### FR-040: 게시글/댓글 삭제
- **설명**: 관리자가 부적절한 게시글/댓글 삭제
- **우선순위**: 필수 (P0)
- **입력**: 대상 ID, 삭제 사유
- **출력**: 삭제 완료, 사유 기록
- **제약**: 관리자 권한 필요

#### FR-041: 회원 차단
- **설명**: 악성 사용자 차단
- **우선순위**: 필수 (P0)
- **입력**: 사용자 ID, 차단 사유, 기간
- **출력**: 차단 완료, IP 차단 (선택)
- **제약**: 관리자 권한 필요

#### FR-042: 정치인 관리
- **설명**: 정치인 데이터 추가/수정/삭제
- **우선순위**: 필수 (P0)
- **입력**:
  - 이름, 소속 정당, 지역, 직급
  - 프로필 사진
  - 약력
- **출력**: 정치인 데이터 업데이트
- **제약**: 관리자 권한 필요

#### FR-043: AI 평가 점수 입력
- **설명**: AI 평가 점수 수동 입력/수정
- **우선순위**: 필수 (P0)
- **입력**:
  - 정치인 ID
  - AI 종류 (claude/gpt/gemini/...)
  - 종합 점수
  - 100개 항목별 점수 (JSON)
- **출력**: 평가 데이터 저장
- **제약**: 관리자 권한 필요

---

## 2.2 비기능 요구사항

### 2.2.1 성능 요구사항

#### NFR-001: 응답 시간
- **메인 페이지 로딩**: 2초 이내
- **게시글 목록 로딩**: 1초 이내
- **게시글 상세 조회**: 1초 이내
- **검색 결과 조회**: 2초 이내

#### NFR-002: 동시 사용자
- **Phase 1**: 100명 동시 접속
- **Phase 2**: 1,000명 동시 접속
- **목표**: 10,000명 동시 접속 (지방선거 시기)

#### NFR-003: 데이터베이스 성능
- **쿼리 응답 시간**: 100ms 이내
- **인덱스 적용**: 모든 검색 컬럼
- **캐싱**: 정치인 평가 점수 (Redis)

### 2.2.2 보안 요구사항

#### NFR-010: 인증 보안
- **비밀번호**: BCrypt 해싱 (Salt 10 rounds)
- **JWT 토큰**:
  - Access Token 만료: 1시간
  - Refresh Token 만료: 7일
- **HTTPS**: 모든 통신 암호화

#### NFR-011: SQL Injection 방지
- **Prepared Statement** 사용
- **Supabase RLS** (Row Level Security) 적용
- **입력 검증**: 모든 사용자 입력 검증

#### NFR-012: XSS 방지
- **HTML Escape**: 모든 사용자 입력 출력 시
- **CSP** (Content Security Policy) 적용
- **DOMPurify** 라이브러리 사용

#### NFR-013: CSRF 방지
- **CSRF Token** 사용
- **SameSite Cookie** 설정

### 2.2.3 확장성 요구사항

#### NFR-020: 수평 확장
- **Supabase**: 자동 스케일링
- **Vercel**: Edge Functions 자동 확장
- **CDN**: Supabase Storage + Vercel CDN

#### NFR-021: 데이터베이스 확장
- **Read Replica**: 조회 성능 최적화
- **Connection Pooling**: Supabase Pooler
- **파티셔닝**: 대용량 테이블 (posts, comments)

### 2.2.4 가용성 요구사항

#### NFR-030: Uptime
- **목표**: 99.9% (월 약 43분 다운타임 허용)
- **Supabase SLA**: 99.9% 보장
- **Vercel SLA**: 99.99% 보장

#### NFR-031: 백업
- **자동 백업**: 일 1회 (Supabase)
- **백업 보관**: 30일
- **복구 시간 목표 (RTO)**: 1시간 이내

### 2.2.5 모니터링 및 로깅

#### NFR-040: 로깅
- **에러 로그**: Sentry
- **접근 로그**: Vercel Analytics
- **감사 로그**: Supabase Database Logs

#### NFR-041: 모니터링
- **성능 모니터링**: Vercel Analytics
- **데이터베이스 모니터링**: Supabase Dashboard
- **알림**: 에러 발생 시 이메일/Slack 알림

---

## 2.3 사용자 유형 및 권한

### 2.3.1 비회원 (Guest)
**권한**:
- ✅ 정치인 평가 조회
- ✅ 게시글 목록 조회
- ✅ 게시글 상세 조회
- ✅ 댓글 조회
- ❌ 글 작성 불가
- ❌ 댓글 작성 불가
- ❌ 투표 불가
- ✅ AI 리포트 구매 가능

### 2.3.2 일반회원 (Normal User)
**권한**:
- ✅ 비회원 모든 권한
- ✅ 게시글 작성
- ✅ 댓글 작성
- ✅ 추천/비추천
- ✅ 정치인 평가 (별점)
- ✅ 북마크/스크랩
- ✅ 알림 받기
- ✅ 신고하기

### 2.3.3 등록정치인 (Verified Politician)
**권한**:
- ✅ 일반회원 권한 중:
  - ✅ [정치인 글] 카테고리에만 글 작성 가능
  - ✅ 모든 글에 댓글 가능
  - ❌ 추천/비추천 불가 (공정성 확보)
  - ❌ 정치인 평가 불가
- ✅ 🏛️ 본인 인증 뱃지 표시
- ✅ AI 리포트 구매
- ✅ 연결 서비스 이용
- ✅ 프리미엄 멤버십 구독

### 2.3.4 관리자 (Admin)
**권한**:
- ✅ 모든 권한
- ✅ 게시글/댓글 삭제
- ✅ 회원 차단/해제
- ✅ 정치인 데이터 관리
- ✅ AI 평가 점수 입력
- ✅ 신고 내역 처리
- ✅ 통계 조회

---

## 2.4 제약사항

### 2.4.1 기술적 제약사항
- **프론트엔드**: Next.js 14 App Router 필수
- **백엔드**: Supabase 전용 (타 DB 사용 불가)
- **배포**: Vercel (프론트엔드), Supabase (백엔드)
- **AI-only 개발**: 모든 작업 자동화 가능해야 함

### 2.4.2 법적 제약사항
- **개인정보보호법**: 이메일, 닉네임 보호
- **선거법**: 선거 기간 중 제한사항 준수
- **명예훼손**: 악의적 평가/댓글 신고 시스템
- **저작권**: 사용자 생성 콘텐츠 저작권 명시

### 2.4.3 비즈니스 제약사항
- **Phase 1 예산**: 월 20만원 이내 (Supabase + Vercel 무료 플랜)
- **Phase 3 수익화**: 수익 발생 전까지 비용 최소화
- **정치적 중립성**: 모든 정당 공평 대우

---

## 2.5 우선순위

### P0 (필수 - MVP)
- 회원가입/로그인
- 정치인 목록 조회
- Claude AI 평가 조회
- 게시글 CRUD
- 댓글 CRUD
- 추천/비추천
- 관리자 기능 (기본)

### P1 (높음 - Phase 2)
- 실시간 베스트글
- 개념글 시스템
- 알림 시스템
- 신고 기능
- 정치인 본인 인증

### P2 (중간 - Phase 3+)
- 다중 AI 평가
- 연결 서비스
- AI 리포트 생성
- 결제 시스템
- 프리미엄 멤버십
- 북마크/스크랩

### P3 (낮음 - Phase 4+)
- AI 아바타 소통
- 음성 대화
- 모바일 앱

---

# Part 3: 시스템 설계

## 3.1 시스템 아키텍처

### 3.1.1 전체 아키텍처 (Supabase 기반)

```
┌──────────────────────────────────────────────────────────────┐
│                         사용자                               │
│                  (브라우저/모바일)                           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    Vercel CDN                                │
│              (Next.js 14 App Router)                         │
├──────────────────────────────────────────────────────────────┤
│  📱 프론트엔드                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │  Pages (App Router)                             │        │
│  │  ├── / (메인)                                   │        │
│  │  ├── /politician/[id] (정치인 상세)            │        │
│  │  ├── /community (커뮤니티)                     │        │
│  │  ├── /post/[id] (게시글 상세)                  │        │
│  │  └── /admin (관리자)                           │        │
│  │                                                 │        │
│  │  Components (shadcn/ui)                         │        │
│  │  State Management (Zustand)                    │        │
│  │  Supabase Client (@supabase/supabase-js)       │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          │ Supabase Client SDK
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│               (All-in-One Backend)                           │
├──────────────────────────────────────────────────────────────┤
│  🗄️ PostgreSQL Database                                     │
│  ├── auth.users (Supabase 관리)                             │
│  ├── public.profiles                                         │
│  ├── public.politicians                                      │
│  ├── public.posts                                            │
│  ├── public.comments                                         │
│  ├── public.votes                                            │
│  └── ... (총 12개 테이블)                                   │
│                                                              │
│  🔐 Supabase Auth                                            │
│  ├── 이메일/비밀번호 인증                                   │
│  ├── 소셜 로그인 (Google, Kakao)                            │
│  ├── JWT 토큰 자동 관리                                     │
│  └── 세션 관리                                              │
│                                                              │
│  📦 Supabase Storage                                         │
│  ├── avatars/ (프로필 사진)                                 │
│  ├── post-attachments/ (첨부파일)                           │
│  └── reports/ (AI 리포트)                                   │
│                                                              │
│  🔴 Realtime (실시간 구독)                                   │
│  ├── 새 댓글 실시간 업데이트                                │
│  ├── 알림 실시간 푸시                                       │
│  └── 온라인 사용자 표시                                     │
│                                                              │
│  ⚡ Edge Functions (Serverless)                             │
│  ├── AI 평가 계산                                           │
│  ├── 스팸 필터링                                            │
│  └── 외부 API 호출                                          │
└──────────────────────────────────────────────────────────────┘
```

### 3.1.2 기술 스택 상세

#### 프론트엔드
| 기술 | 버전 | 역할 |
|------|------|------|
| **Next.js** | 14.x | 프론트엔드 프레임워크 (App Router) |
| **TypeScript** | 5.x | 타입 안전성 |
| **Tailwind CSS** | 3.x | 스타일링 |
| **shadcn/ui** | Latest | UI 컴포넌트 |
| **Zustand** | 4.x | UI 상태 관리 |
| **React Hook Form** | 7.x | 폼 관리 |
| **Zod** | 3.x | 스키마 검증 |
| **TanStack Query** | 5.x | 데이터 캐싱 (선택) |
| **Recharts** | 2.x | 차트 시각화 |
| **Lucide React** | Latest | 아이콘 |

#### 백엔드 (Supabase)
| 기술 | 역할 |
|------|------|
| **PostgreSQL** | 15+ 데이터베이스 |
| **PostgREST** | 자동 RESTful API |
| **GoTrue** | 인증 시스템 |
| **Storage** | S3 호환 파일 저장소 |
| **Realtime** | WebSocket 실시간 통신 |
| **Edge Functions** | Deno 런타임 서버리스 함수 |

#### 배포 & 인프라
| 서비스 | 용도 |
|--------|------|
| **Vercel** | 프론트엔드 배포 |
| **Supabase Cloud** | 백엔드 호스팅 |
| **Vercel Analytics** | 성능 모니터링 |
| **Sentry** | 에러 트래킹 (선택) |

---

## 3.2 데이터베이스 설계

### 3.2.1 ERD (Entity Relationship Diagram)

```
┌─────────────────┐         ┌─────────────────┐
│   auth.users    │─────────│    profiles     │
│  (Supabase)     │  1   1  │                 │
└─────────────────┘         └────────┬────────┘
                                     │ 1
                                     │
                                     │ *
                            ┌────────┴────────┐
                            │      posts      │
                            └────────┬────────┘
                                     │ 1
                                     │
                                     │ *
                            ┌────────┴────────┐
                            │    comments     │
                            └─────────────────┘

┌─────────────────┐         ┌─────────────────┐
│   politicians   │─────────│   ai_scores     │
│                 │  1   *  │                 │
└────────┬────────┘         └─────────────────┘
         │ 1
         │
         │ *
┌────────┴────────┐
│     posts       │
│  (politician_id)│
└─────────────────┘

┌─────────────────┐
│      votes      │
│  (post/comment) │
└─────────────────┘

┌─────────────────┐
│    bookmarks    │
└─────────────────┘

┌─────────────────┐
│  notifications  │
└─────────────────┘

┌─────────────────┐
│     reports     │
└─────────────────┘
```

### 3.2.2 테이블 상세 설계

#### 1. profiles (사용자 프로필)
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  user_type TEXT DEFAULT 'normal', -- 'normal', 'politician'
  user_level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_user_type ON public.profiles(user_type);

-- RLS 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "프로필 읽기 공개"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "본인 프로필만 수정"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### 2. politicians (정치인)
```sql
CREATE TABLE public.politicians (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  party TEXT NOT NULL,
  region TEXT NOT NULL,
  position TEXT NOT NULL, -- '국회의원', '시장', '도지사' 등
  profile_image_url TEXT,
  biography TEXT,
  official_website TEXT,
  user_id UUID REFERENCES auth.users(id), -- 본인 인증 시
  avatar_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_politicians_party ON public.politicians(party);
CREATE INDEX idx_politicians_region ON public.politicians(region);
CREATE INDEX idx_politicians_name ON public.politicians(name);

-- RLS 정책
ALTER TABLE public.politicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "정치인 목록 공개"
  ON public.politicians FOR SELECT
  USING (true);

CREATE POLICY "관리자만 정치인 수정"
  ON public.politicians FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
```

#### 3. ai_scores (AI 평가 점수)
```sql
CREATE TABLE public.ai_scores (
  id SERIAL PRIMARY KEY,
  politician_id INTEGER REFERENCES public.politicians(id) ON DELETE CASCADE NOT NULL,
  ai_name TEXT NOT NULL, -- 'claude', 'gpt', 'gemini', 'perplexity', 'grok'
  score REAL NOT NULL CHECK (score >= 0 AND score <= 100),
  details JSONB, -- 100개 항목별 점수
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(politician_id, ai_name)
);

-- 인덱스
CREATE INDEX idx_ai_scores_politician ON public.ai_scores(politician_id);
CREATE INDEX idx_ai_scores_ai_name ON public.ai_scores(ai_name);

-- RLS 정책
ALTER TABLE public.ai_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI 점수 공개"
  ON public.ai_scores FOR SELECT
  USING (true);

CREATE POLICY "관리자만 AI 점수 관리"
  ON public.ai_scores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
```

#### 4. posts (게시글)
```sql
CREATE TABLE public.posts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  politician_id INTEGER REFERENCES public.politicians(id) ON DELETE SET NULL,
  category TEXT NOT NULL, -- 'general', 'politician_post' (2개 카테고리로 단순화)
  title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
  content TEXT NOT NULL CHECK (char_length(content) >= 10),
  view_count INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_best BOOLEAN DEFAULT false,
  is_concept BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_politician_id ON public.posts(politician_id);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_upvotes ON public.posts(upvotes DESC);
CREATE INDEX idx_posts_is_best ON public.posts(is_best) WHERE is_best = true;
CREATE INDEX idx_posts_is_concept ON public.posts(is_concept) WHERE is_concept = true;

-- RLS 정책
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "게시글 읽기 공개"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "로그인 사용자만 작성"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 게시글만 수정/삭제"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));
```

#### 5. comments (댓글)
```sql
CREATE TABLE public.comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 1),
  parent_id INTEGER REFERENCES public.comments(id) ON DELETE CASCADE,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);

-- RLS 정책
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "댓글 읽기 공개"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "로그인 사용자만 댓글 작성"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 댓글만 수정/삭제"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));
```

#### 6. votes (추천/비추천)
```sql
CREATE TABLE public.votes (
  id SERIAL PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_type, target_id, user_id)
);

-- 인덱스
CREATE INDEX idx_votes_user_target ON public.votes(user_id, target_type, target_id);
CREATE INDEX idx_votes_target ON public.votes(target_type, target_id);

-- RLS 정책
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "투표 읽기 공개"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "로그인 사용자만 투표"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 투표만 변경"
  ON public.votes FOR UPDATE
  USING (auth.uid() = user_id);
```

#### 7. ratings (정치인 별점 평가)
```sql
CREATE TABLE public.ratings (
  id SERIAL PRIMARY KEY,
  politician_id INTEGER REFERENCES public.politicians(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(politician_id, user_id)
);

-- 인덱스
CREATE INDEX idx_ratings_politician ON public.ratings(politician_id);
CREATE INDEX idx_ratings_user ON public.ratings(user_id);

-- RLS 정책
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "평가 읽기 공개"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "로그인 사용자만 평가"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 평가만 수정"
  ON public.ratings FOR UPDATE
  USING (auth.uid() = user_id);
```

#### 8. bookmarks (북마크)
```sql
CREATE TABLE public.bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id INTEGER REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 인덱스
CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id);

-- RLS 정책
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 북마크만 조회"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 북마크만 추가/삭제"
  ON public.bookmarks FOR ALL
  USING (auth.uid() = user_id);
```

#### 9. notifications (알림)
```sql
CREATE TABLE public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('comment', 'reply', 'mention')),
  content TEXT NOT NULL,
  target_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- RLS 정책
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 알림만 조회"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 알림만 수정"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

#### 10. reports (신고)
```sql
CREATE TABLE public.reports (
  id SERIAL PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  target_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);

-- RLS 정책
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "관리자만 신고 조회"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "로그인 사용자만 신고"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
```

#### 11. user_follows (팔로우)
```sql
CREATE TABLE public.user_follows (
  id SERIAL PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 인덱스
CREATE INDEX idx_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_follows_following ON public.user_follows(following_id);

-- RLS 정책
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "팔로우 목록 공개"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "본인만 팔로우 추가/삭제"
  ON public.user_follows FOR ALL
  USING (auth.uid() = follower_id);
```

#### 12. services (연결 서비스 - Phase 3+)
```sql
CREATE TABLE public.services (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('consulting', 'promotion', 'education', 'legal', 'survey')),
  company_name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_services_active ON public.services(is_active);

-- RLS 정책
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "서비스 목록 공개"
  ON public.services FOR SELECT
  USING (is_active = true);

CREATE POLICY "관리자만 서비스 관리"
  ON public.services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
```

---

## 3.3 API 설계

### 3.3.1 Supabase 자동 생성 API

Supabase는 모든 테이블에 대해 RESTful API를 자동으로 생성합니다.

**기본 패턴**:
```
GET    /rest/v1/{table}              # 목록 조회
GET    /rest/v1/{table}?id=eq.{id}   # 단일 조회
POST   /rest/v1/{table}              # 생성
PATCH  /rest/v1/{table}?id=eq.{id}   # 수정
DELETE /rest/v1/{table}?id=eq.{id}   # 삭제
```

### 3.3.2 API 엔드포인트 목록

#### 인증 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/auth/v1/signup` | 회원가입 |
| POST | `/auth/v1/token?grant_type=password` | 로그인 |
| POST | `/auth/v1/logout` | 로그아웃 |
| POST | `/auth/v1/token?grant_type=refresh_token` | 토큰 갱신 |
| GET | `/auth/v1/user` | 현재 사용자 정보 |
| PUT | `/auth/v1/user` | 사용자 정보 수정 |

#### 정치인 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/rest/v1/politicians` | 정치인 목록 |
| GET | `/rest/v1/politicians?id=eq.{id}` | 정치인 상세 |
| POST | `/rest/v1/politicians` | 정치인 추가 (관리자) |
| PATCH | `/rest/v1/politicians?id=eq.{id}` | 정치인 수정 (관리자) |
| DELETE | `/rest/v1/politicians?id=eq.{id}` | 정치인 삭제 (관리자) |

#### AI 평가 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/rest/v1/ai_scores?politician_id=eq.{id}` | 정치인 AI 평가 조회 |
| GET | `/rest/v1/ai_scores?politician_id=eq.{id}&ai_name=eq.claude` | 특정 AI 평가 조회 |
| POST | `/rest/v1/ai_scores` | AI 평가 추가 (관리자) |
| PATCH | `/rest/v1/ai_scores?id=eq.{id}` | AI 평가 수정 (관리자) |

#### 게시글 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/rest/v1/posts?order=created_at.desc&limit=20` | 게시글 목록 |
| GET | `/rest/v1/posts?id=eq.{id}` | 게시글 상세 |
| POST | `/rest/v1/posts` | 게시글 작성 |
| PATCH | `/rest/v1/posts?id=eq.{id}` | 게시글 수정 |
| DELETE | `/rest/v1/posts?id=eq.{id}` | 게시글 삭제 |
| GET | `/rest/v1/posts?is_best=eq.true` | 베스트글 조회 |
| GET | `/rest/v1/posts?is_concept=eq.true` | 개념글 조회 |

#### 댓글 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/rest/v1/comments?post_id=eq.{id}` | 게시글 댓글 목록 |
| POST | `/rest/v1/comments` | 댓글 작성 |
| PATCH | `/rest/v1/comments?id=eq.{id}` | 댓글 수정 |
| DELETE | `/rest/v1/comments?id=eq.{id}` | 댓글 삭제 |

#### 투표 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/rest/v1/votes` | 추천/비추천 |
| DELETE | `/rest/v1/votes?user_id=eq.{uid}&target_type=eq.{type}&target_id=eq.{id}` | 투표 취소 |
| PATCH | `/rest/v1/votes?user_id=eq.{uid}&target_type=eq.{type}&target_id=eq.{id}` | 투표 변경 |

### 3.3.3 API 호출 예시 (TypeScript)

```typescript
import { supabase } from '@/lib/supabase'

// 정치인 목록 조회
const { data: politicians, error } = await supabase
  .from('politicians')
  .select('*')
  .order('name', { ascending: true })

// 정치인 상세 + AI 평가
const { data: politician } = await supabase
  .from('politicians')
  .select(`
    *,
    ai_scores (
      ai_name,
      score,
      details
    )
  `)
  .eq('id', politicianId)
  .single()

// 게시글 목록 (페이지네이션)
const { data: posts } = await supabase
  .from('posts')
  .select(`
    *,
    profiles (username, avatar_url),
    comments (count)
  `)
  .order('created_at', { ascending: false })
  .range(0, 19) // 0-19번째 (20개)

// 게시글 작성
const { data: post, error } = await supabase
  .from('posts')
  .insert({
    user_id: user.id,
    category: 'general',
    title: '제목',
    content: '내용'
  })
  .select()
  .single()

// 추천/비추천
const { error } = await supabase
  .from('votes')
  .upsert({
    user_id: user.id,
    target_type: 'post',
    target_id: postId,
    vote_type: 'up'
  }, {
    onConflict: 'user_id,target_type,target_id'
  })

// 실시간 구독 (새 댓글)
const subscription = supabase
  .channel('comments')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'comments',
    filter: `post_id=eq.${postId}`
  }, (payload) => {
    console.log('새 댓글:', payload.new)
  })
  .subscribe()
```

---

## 3.4 보안 설계

### 3.4.1 인증 보안

#### JWT 토큰 관리
```typescript
// Supabase가 자동으로 관리
// Access Token: 1시간 만료
// Refresh Token: 7일 만료

// 자동 토큰 갱신
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('토큰 갱신됨')
  }
})
```

#### 비밀번호 보안
- **해싱**: BCrypt (Salt 10 rounds)
- **최소 길이**: 8자
- **복잡도**: 영문 + 숫자 조합 권장

#### 세션 관리
- **세션 저장**: 쿠키 (HttpOnly, Secure, SameSite=Lax)
- **세션 만료**: 7일 (Refresh Token)
- **다중 기기**: 지원

### 3.4.2 Row Level Security (RLS)

모든 테이블에 RLS 정책 적용으로 데이터 접근 제어:

```sql
-- 예시: 게시글 RLS 정책

-- 1. 읽기: 모두 가능
CREATE POLICY "게시글 읽기 공개"
  ON public.posts FOR SELECT
  USING (true);

-- 2. 작성: 본인만
CREATE POLICY "로그인 사용자만 작성"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. 수정: 본인 또는 관리자
CREATE POLICY "본인 게시글만 수정"
  ON public.posts FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 4. 삭제: 본인 또는 관리자
CREATE POLICY "본인 게시글만 삭제"
  ON public.posts FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
```

### 3.4.3 입력 검증

#### 프론트엔드 검증 (Zod)
```typescript
import { z } from 'zod'

// 게시글 작성 스키마
const postSchema = z.object({
  title: z.string()
    .min(2, '제목은 2자 이상')
    .max(200, '제목은 200자 이하'),
  content: z.string()
    .min(10, '내용은 10자 이상'),
  category: z.enum(['general', 'politician_post']), // 2개 카테고리로 단순화
})

// 사용
const result = postSchema.safeParse(formData)
if (!result.success) {
  console.error(result.error)
}
```

#### 백엔드 검증 (PostgreSQL Constraints)
```sql
-- 데이터베이스 레벨 제약
CREATE TABLE public.posts (
  title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
  content TEXT NOT NULL CHECK (char_length(content) >= 10),
  -- ...
);
```

### 3.4.4 XSS 방어

#### HTML Escape
```typescript
import DOMPurify from 'isomorphic-dompurify'

// 사용자 입력 Sanitize
const cleanContent = DOMPurify.sanitize(userInput)
```

#### Content Security Policy
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
]
```

### 3.4.5 CSRF 방어

- **SameSite Cookie**: Lax 설정
- **CSRF Token**: Supabase가 자동 처리

### 3.4.6 Rate Limiting

```typescript
// Supabase Edge Function에서 Rate Limiting
import { createClient } from '@supabase/supabase-js'

export async function handler(req: Request) {
  const ip = req.headers.get('x-forwarded-for')

  // IP별 요청 횟수 제한 (1분당 60회)
  const { data: rateLimit } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('ip', ip)
    .eq('minute', getCurrentMinute())
    .single()

  if (rateLimit && rateLimit.count >= 60) {
    return new Response('Too Many Requests', { status: 429 })
  }

  // 요청 처리...
}
```

---

## 3.5 인프라 설계

### 3.5.1 배포 아키텍처

```
┌─────────────────────────────────────────────────┐
│                   사용자                        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   Cloudflare CDN     │ (선택)
          │   (DDoS 방어)        │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │    Vercel Edge       │
          │  (Global CDN + SSR)  │
          └──────────┬───────────┘
                     │
      ┌──────────────┴──────────────┐
      │                             │
      ▼                             ▼
┌────────────┐            ┌────────────────┐
│  Frontend  │            │   Supabase     │
│  (Static)  │            │  (Backend)     │
│            │            │                │
│ Next.js    │◄───────────┤ PostgreSQL     │
│ App Router │            │ Auth           │
│            │            │ Storage        │
│            │            │ Realtime       │
└────────────┘            └────────────────┘
```

### 3.5.2 환경 구성

#### 개발 환경 (Local)
```
프론트엔드: http://localhost:3000
Supabase Local:
  - API: http://localhost:54321
  - Studio: http://localhost:54323
  - Database: postgresql://localhost:54322
```

#### 스테이징 환경
```
프론트엔드: https://staging.politicianfinder.com
백엔드: Supabase Staging 프로젝트
```

#### 프로덕션 환경
```
프론트엔드: https://politicianfinder.com
백엔드: Supabase Production 프로젝트
```

### 3.5.3 환경 변수

```env
# .env.local (개발)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# .env.production (프로덕션)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (서버 전용)
```

### 3.5.4 CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Dependencies
        run: npm install

      - name: Run Tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

      - name: Run DB Migrations
        run: npx supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### 3.5.5 모니터링 및 로깅

#### 성능 모니터링
- **Vercel Analytics**: 페이지 로딩 속도, Core Web Vitals
- **Supabase Dashboard**: DB 성능, API 응답 시간

#### 에러 트래킹
```typescript
// Sentry 설정 (선택)
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

#### 로그 수집
- **Vercel Logs**: 서버 로그
- **Supabase Logs**: 데이터베이스 쿼리 로그
- **Browser Console**: 클라이언트 에러

---

# Part 4: UI/UX 기획

## 4.1 디자인 원칙

### 4.1.1 핵심 디자인 원칙

#### 1. 단순성 (Simplicity)
- **최소한의 클릭**: 원하는 정보까지 3클릭 이내
- **명확한 레이아웃**: 혼란스럽지 않은 구조
- **일관된 디자인**: 모든 페이지 동일한 패턴

#### 2. 가독성 (Readability)
- **충분한 여백**: 클리앙 스타일의 넉넉한 여백
- **큰 폰트**: 본문 16px, 제목 20-24px
- **명확한 계층**: 제목-부제-본문 구분

#### 3. 반응성 (Responsiveness)
- **모바일 우선**: 모바일에서 완벽한 UX
- **적응형 레이아웃**: 화면 크기별 최적화
- **터치 친화적**: 버튼 크기 44px 이상

#### 4. 접근성 (Accessibility)
- **키보드 탐색**: Tab 키로 모든 기능 접근
- **스크린 리더**: ARIA 라벨 적용
- **색상 대비**: WCAG AA 기준 (4.5:1)

#### 5. 신뢰성 (Trustworthiness)
- **깔끔한 UI**: 과도한 장식 없음
- **명확한 정보**: 불필요한 팝업 없음
- **일관된 톤**: 공정하고 중립적인 디자인

### 4.1.2 컬러 시스템

#### Primary Colors (주 색상)
```
파란색 (신뢰): #1E40AF (Blue-800)
회색 (중립): #64748B (Slate-500)
흰색 (배경): #FFFFFF
검은색 (텍스트): #1E293B (Slate-900)
```

#### Semantic Colors (의미 색상)
```
성공: #10B981 (Green-500)
경고: #F59E0B (Amber-500)
위험: #EF4444 (Red-500)
정보: #3B82F6 (Blue-500)
```

#### Political Colors (정당 색상)
```
더불어민주당: #004EA2
국민의힘: #E61E2B
정의당: #FFCC00
기본소득당: #6A1B9A
(기타 정당은 회색)
```

### 4.1.3 타이포그래피

```css
/* 폰트 패밀리 */
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, sans-serif;

/* 폰트 크기 */
--text-xs: 12px;    /* 보조 텍스트 */
--text-sm: 14px;    /* 부가 정보 */
--text-base: 16px;  /* 본문 */
--text-lg: 18px;    /* 강조 */
--text-xl: 20px;    /* 소제목 */
--text-2xl: 24px;   /* 제목 */
--text-3xl: 30px;   /* 대제목 */

/* 폰트 굵기 */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 4.1.4 간격 시스템 (Spacing)

```css
/* Tailwind 기본 간격 사용 */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
```

---

## 4.2 화면 구성

### 4.2.1 레이아웃 구조

```
┌─────────────────────────────────────────────────┐
│              Header (고정)                      │
│  [로고] [정치인] [커뮤니티] [검색] [로그인]    │
├─────────────────────────────────────────────────┤
│                                                 │
│              Main Content                       │
│         (페이지별로 다름)                       │
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│              Footer                             │
│  [회사소개] [이용약관] [개인정보] [문의]       │
└─────────────────────────────────────────────────┘
```

### 4.2.2 주요 화면 목록

#### 1. 메인 페이지 (/)
**구성 요소**:
- Hero 섹션 (슬로건 + CTA)
- 🔥 실시간 베스트글 (5개)
- ⭐ 개념글 (5개)
- 🏛️ 정치인 최신 글 (3개)
- TOP 10 정치인 (AI 평가 순)
- 최신 게시글 (20개)

**목적**: 사용자 유입 + 주요 콘텐츠 노출

#### 2. 정치인 목록 (/politician)
**구성 요소**:
- 필터 (정당, 지역, 직급)
- 정렬 (AI 점수순, 이름순)
- 정치인 카드 (사진, 이름, 당, 점수)
- 페이지네이션

**목적**: 정치인 탐색 및 선택

#### 3. 정치인 상세 (/politician/[id])
**구성 요소**:
- 프로필 (사진, 이름, 당, 지역, 약력)
- Claude AI 평가 점수 (Phase 1)
  - 종합 점수 (큰 숫자)
  - 100개 항목별 점수 (차트)
- 시민 평가 (별점)
- 정치인 게시판 (본인 글 + 일반 글)
- 댓글

**목적**: 정치인 상세 정보 + 평가 확인

#### 4. 커뮤니티 메인 (/community)
**구성 요소**:
- 카테고리 탭 (전체, 🏛️ 정치인 글, 💬 자유게시판) - 2개 카테고리로 단순화
- 정렬 옵션 (최신순, 공감순, 조회순)
- 게시글 리스트
  - 제목, 작성자, 조회수, 공감수, 댓글수
  - 🔥 HOT 배지, ⭐ 개념글 배지
- 글쓰기 버튼 (우측 하단 고정)

**목적**: 커뮤니티 활동 허브

#### 5. 게시글 상세 (/post/[id])
**구성 요소**:
- 게시글 헤더 (제목, 작성자, 날짜, 조회수)
- 본문
- 추천/비추천 버튼
- 북마크 버튼
- 신고 버튼
- 댓글 작성
- 댓글 리스트 (대댓글 지원)

**목적**: 게시글 읽기 + 댓글 소통

#### 6. 게시글 작성 (/post/write)
**구성 요소**:
- 카테고리 선택
- 제목 입력
- 에디터 (마크다운 지원)
- 정치인 태그 (선택)
- 작성 버튼

**목적**: 게시글 작성

#### 7. 로그인 (/login)
**구성 요소**:
- 이메일 입력
- 비밀번호 입력
- 로그인 버튼
- 회원가입 링크
- 소셜 로그인 (Google, Kakao)

**목적**: 사용자 인증

#### 8. 회원가입 (/signup)
**구성 요소**:
- 이메일 입력 + 중복 확인
- 닉네임 입력 + 중복 확인
- 비밀번호 입력 + 확인
- 이용약관 동의
- 회원가입 버튼

**목적**: 신규 회원 등록

#### 9. 마이페이지 (/mypage)
**구성 요소**:
- 프로필 정보 (닉네임, 이메일, 가입일)
- 내 글 목록
- 내 댓글 목록
- 북마크 목록
- 알림 설정

**목적**: 개인 정보 및 활동 관리

#### 10. 관리자 대시보드 (/admin)
**구성 요소**:
- 통계 (회원수, 게시글수, 댓글수)
- 신고 내역 처리
- 회원 관리 (차단)
- 정치인 관리
- AI 점수 입력

**목적**: 플랫폼 관리

---

## 4.3 사용자 플로우

### 4.3.1 비회원 플로우

```
[메인 페이지 진입]
    ↓
[정치인 목록 조회] ← 필터/정렬
    ↓
[정치인 상세 보기]
    ├─ Claude AI 평가 확인
    ├─ 시민 평가 확인
    └─ 게시글 읽기
        ↓
[게시글 상세 보기]
    ├─ 본문 읽기
    └─ 댓글 읽기
        ↓
[회원가입 유도]
    "댓글 작성하려면 로그인하세요"
```

### 4.3.2 일반 회원 플로우

```
[로그인]
    ↓
[메인 페이지]
    ↓
[커뮤니티]
    ├─ [게시글 작성]
    │      ├─ 제목/내용 입력
    │      ├─ 카테고리 선택
    │      └─ 게시 완료
    │
    ├─ [게시글 읽기]
    │      ├─ 추천/비추천
    │      ├─ 북마크
    │      └─ 댓글 작성
    │
    └─ [정치인 평가]
           ├─ 별점 부여
           └─ 평가 완료
```

### 4.3.3 정치인 회원 플로우

```
[정치인 본인 인증 신청]
    ├─ 신분증 업로드
    ├─ 공문서 제출
    └─ 관리자 승인 대기
        ↓
[승인 완료 - 🏛️ 뱃지 부여]
    ↓
[정치인 전용 기능]
    ├─ [정치인 글] 카테고리에 글 작성
    ├─ 시민 댓글에 답글
    ├─ AI 평가 확인
    └─ 통계 대시보드 조회
        ↓
[프리미엄 멤버십 가입] (Phase 3+)
    ├─ AI 리포트 구매
    ├─ 연결 서비스 이용
    └─ 아바타 활성화 (Phase 4+)
```

### 4.3.4 관리자 플로우

```
[관리자 로그인]
    ↓
[관리자 대시보드]
    ├─ [통계 확인]
    ├─ [신고 처리]
    │      ├─ 신고 내역 조회
    │      ├─ 게시글/댓글 삭제
    │      └─ 회원 차단
    │
    ├─ [정치인 관리]
    │      ├─ 정치인 추가
    │      ├─ 정보 수정
    │      └─ 본인 인증 승인
    │
    └─ [AI 점수 입력]
           ├─ 정치인 선택
           ├─ AI 종류 선택
           ├─ 점수 입력
           └─ 저장
```

---

## 4.4 와이어프레임

### 4.4.1 메인 페이지 (데스크탑)

```
┌──────────────────────────────────────────────────────────┐
│  [로고] PoliticianFinder    [정치인] [커뮤니티] [검색] [로그인] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│       🎯 훌륭한 정치인을 찾아드립니다                     │
│       AI 기반 객관적 평가 + 시민 평가                    │
│                                                          │
│       [정치인 보기]  [커뮤니티 가기]                     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🔥 실시간 베스트글                                      │
│  ┌────────────────────────────────────────────────┐    │
│  │ [제목 1] 👤작성자 👁️123 👍45 💬12              │    │
│  │ [제목 2] 👤작성자 👁️98 👍38 💬8                │    │
│  │ [제목 3] 👤작성자 👁️201 👍102 💬34             │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ⭐ 개념글                                               │
│  ┌────────────────────────────────────────────────┐    │
│  │ [제목 1] 👤작성자 👁️456 👍234 💬67            │    │
│  │ [제목 2] 👤작성자 👁️789 👍456 💬123           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🏛️ 정치인 최신 글                                       │
│  ┌────────────────────────────────────────────────┐    │
│  │ [제목 1] 🏛️홍길동 (더불어민주당)               │    │
│  │ [제목 2] 🏛️이순신 (국민의힘)                   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📊 TOP 10 정치인 (AI 평가 순)                          │
│  ┌──────┬──────┬──────┬──────┬──────┐              │
│  │ [1위]│ [2위]│ [3위]│ [4위]│ [5위]│              │
│  │ 사진 │ 사진 │ 사진 │ 사진 │ 사진 │              │
│  │ 이름 │ 이름 │ 이름 │ 이름 │ 이름 │              │
│  │ 점수 │ 점수 │ 점수 │ 점수 │ 점수 │              │
│  └──────┴──────┴──────┴──────┴──────┘              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.4.2 정치인 상세 페이지 (데스크탑)

```
┌──────────────────────────────────────────────────────────┐
│  헤더 (동일)                                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────┐  홍길동 (더불어민주당)                       │
│  │        │  서울 강남구                                │
│  │  사진  │  국회의원 (21대)                            │
│  │        │                                              │
│  └────────┘  [별점 평가] ⭐⭐⭐⭐☆ (4.2)              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Claude AI 평가                                       │
│  ┌────────────────────────────────────────────────┐    │
│  │         종합 점수: 85점                          │    │
│  │                                                  │    │
│  │  [차트] 의정활동: 90점                           │    │
│  │  [차트] 공약이행: 80점                           │    │
│  │  [차트] 투명성: 85점                             │    │
│  │  [차트] 소통: 82점                               │    │
│  │  ... (100개 항목 더보기)                         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  💬 게시판                                               │
│  [전체] [🏛️ 정치인 글] [💬 자유게시판]                 │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ [제목 1] 👤작성자 👁️45 👍12 💬5                │    │
│  │ [제목 2] 👤작성자 👁️23 👍8 💬3                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [글쓰기]                                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.4.3 게시글 상세 페이지

```
┌──────────────────────────────────────────────────────────┐
│  헤더 (동일)                                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [제목: 정치인 평가 시스템에 대한 의견]                  │
│  👤 작성자: 홍길동 | 📅 2025-10-24 14:30                │
│  👁️ 조회: 123 | 👍 45 | 👎 3 | 💬 12                   │
│                                                          │
│  [⬆️ 추천] [⬇️ 비추천] [⭐ 북마크] [🚨 신고]           │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  본문 내용...                                            │
│  본문 내용...                                            │
│  본문 내용...                                            │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  💬 댓글 (12)                                            │
│                                                          │
│  [댓글 작성 입력창]                                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 👤 댓글작성자1 | 2025-10-24 15:00               │    │
│  │ 댓글 내용...                                     │    │
│  │ [답글] [👍 5] [👎 0]                             │    │
│  │                                                  │    │
│  │   └─ 👤 대댓글작성자 | 2025-10-24 15:10        │    │
│  │       대댓글 내용...                             │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.4.4 모바일 메인 페이지

```
┌────────────────────┐
│  [☰] PoliticianFinder [🔍]│
├────────────────────┤
│                    │
│  🎯 훌륭한 정치인을│
│     찾아드립니다   │
│                    │
│  [정치인 보기]     │
│  [커뮤니티 가기]   │
│                    │
├────────────────────┤
│                    │
│  🔥 베스트글       │
│  ┌──────────────┐ │
│  │ [제목 1]     │ │
│  │ 👁️123 👍45  │ │
│  └──────────────┘ │
│  ┌──────────────┐ │
│  │ [제목 2]     │ │
│  │ 👁️98 👍38   │ │
│  └──────────────┘ │
│                    │
├────────────────────┤
│                    │
│  ⭐ 개념글         │
│  ...               │
│                    │
├────────────────────┤
│                    │
│  [+ 글쓰기]        │
│  (우측 하단 고정)  │
│                    │
└────────────────────┘
```

---

## 4.5 반응형 디자인

### 4.5.1 브레이크포인트

```css
/* Tailwind 기본 브레이크포인트 */
sm: 640px   /* 스마트폰 (가로) */
md: 768px   /* 태블릿 (세로) */
lg: 1024px  /* 태블릿 (가로) / 노트북 */
xl: 1280px  /* 데스크탑 */
2xl: 1536px /* 대형 모니터 */
```

### 4.5.2 반응형 레이아웃 전략

#### 모바일 (< 768px)
- **단일 컬럼**: 모든 콘텐츠 세로 배치
- **햄버거 메뉴**: 네비게이션 숨김
- **전체 너비**: 최대한 화면 활용
- **큰 터치 영역**: 버튼 최소 44px

#### 태블릿 (768px ~ 1024px)
- **2컬럼**: 사이드바 + 메인
- **축소 네비게이션**: 아이콘 + 텍스트
- **적절한 여백**: 가독성 향상

#### 데스크탑 (> 1024px)
- **3컬럼**: 사이드바 + 메인 + 위젯
- **전체 네비게이션**: 모든 메뉴 표시
- **넓은 여백**: 클리앙 스타일

### 4.5.3 반응형 컴포넌트 예시

```tsx
// 정치인 카드 컴포넌트 (반응형)
<div className="
  grid
  grid-cols-1      /* 모바일: 1열 */
  sm:grid-cols-2   /* 스마트폰(가로): 2열 */
  md:grid-cols-3   /* 태블릿: 3열 */
  lg:grid-cols-4   /* 데스크탑: 4열 */
  gap-4            /* 간격 16px */
">
  {politicians.map(p => (
    <PoliticianCard key={p.id} {...p} />
  ))}
</div>
```

---

# Part 5: 개발 계획 (프로젝트 그리드 방법론 V2.0) ⭐

## 5.1 프로젝트 그리드 방법론 개요

### 5.1.1 방법론 소개

**프로젝트 그리드 방법론 V2.0**은 AI 전자동 개발을 위한 체계적인 작업 관리 시스템입니다.

**핵심 특징**:
- ✅ **3차원 그리드 시스템**: Phase(X축) × Area(Y축) × Task(Z축)
- ✅ **21개 속성 관리**: 작업의 모든 정보를 추적
- ✅ **AI-Only 개발**: 95% 이상 AI 자동화
- ✅ **의존성 기반 진행**: 시간이 아닌 의존성 체인으로 관리
- ✅ **완전한 추적성**: 모든 작업과 코드의 연결 관계 명확화

### 5.1.2 왜 이 방법론인가?

#### ❌ 기존 문제점
```
전통적 개발 방법론:
- 시간 기반 계획 (Week 1-13, Day 1-91)
- 작업-코드 연결 불명확 (72% 파일 미연결)
- 의존성 관리 수동
- AI 작업 추적 불가능
→ 프로젝트 혼돈 상태
```

#### ✅ 프로젝트 그리드 해결책
```
그리드 방법론:
- Phase 기반 계획 (의존성 순서만)
- 작업 ID로 파일 명명 (100% 연결)
- 의존성 자동 추적
- AI 작업 완전 추적
→ 프로젝트 완벽 통제
```

### 5.1.3 핵심 원칙

#### 1. AI-Only 우선 원칙 🤖
**모든 작업은 AI가 수행하는 것이 기본입니다.**

- ✅ **AI-Only**: 95% 이상 작업 (기본값)
- ❌ **인간 협력**: 명확한 사유가 있을 때만
  - 유료 서비스 가입/결제
  - 외부 API 키 발급 (이메일 인증 필요)
  - 법적 서명/승인
  - 최종 디자인 승인

#### 2. 절대 시간 금지 원칙 📅
**미래 계획에 절대 시간 개념을 사용하지 않습니다.**

❌ **금지**:
```
"1시간 내에 완료"
"2주 안에 개발"
"10월 25일까지 배포"
"Week 1-13, Day 1-91"
```

✅ **허용**:
```
의존성 체인: "P2F1 완료 후 P2F2 시작"
완료 기록: "완료 (2025-10-23 14:30)" ← 이미 발생한 이력
진행 상태: "대기 → 진행 중 → 완료"
```

**철학**: "언제 끝날지는 중요하지 않습니다. 올바른 순서로 완료되는 것이 중요합니다."

#### 3. 완전한 추적성 원칙 🔍
**모든 파일은 작업 ID를 포함해야 합니다.**

```
파일명 규칙: {TaskID}_{설명}.{확장자}

예시:
✅ P2F5_auth_context.tsx
✅ P2F5_auth_test.spec.ts
✅ P2F5_REPORT.md

❌ AuthContext.tsx (Task ID 없음)
❌ auth_test.ts (Task ID 없음)
```

---

## 5.2 3차원 그리드 시스템

### 5.2.1 좌표 체계

```
┌─────────────────────────────────────────┐
│           3차원 그리드                  │
├─────────────────────────────────────────┤
│                                         │
│  X축: Phase (개발 단계)                 │
│  ├─ Phase 0: 기획                       │
│  ├─ Phase 1: MVP                        │
│  ├─ Phase 2: 커뮤니티 강화              │
│  ├─ Phase 3: 수익화                     │
│  ├─ Phase 4: 다중 AI                    │
│  ├─ Phase 5: 아바타 소통                │
│  └─ Phase 6: 최적화                     │
│                                         │
│  Y축: Area (개발 영역)                  │
│  ├─ F: Frontend                         │
│  ├─ B: Backend                          │
│  ├─ D: Database                         │
│  ├─ T: Testing                          │
│  ├─ S: Security                         │
│  └─ O: DevOps                           │
│                                         │
│  Z축: Task (작업 순서)                  │
│  ├─ 1, 2, 3... (순차 번호)              │
│  └─ a, b, c... (병렬 기호)              │
│                                         │
└─────────────────────────────────────────┘
```

### 5.2.2 작업 ID 생성 규칙

**형식**: `P[Phase][Area][작업번호][병렬기호]`

**예시**:
```
P1F1   → Phase 1, Frontend, 작업 1번 (단독)
P2F3a  → Phase 2, Frontend, 작업 3번 병렬 a
P2F3b  → Phase 2, Frontend, 작업 3번 병렬 b
P3B5   → Phase 3, Backend, 작업 5번 (단독)
```

**병렬 작업 규칙**:
```
같은 번호 + 다른 알파벳 = 병렬 실행 가능

예시: P2F3a, P2F3b, P2F3c는 동시 진행 가능
의미: Frontend 작업 3번을 3개 병렬 스레드로 분할
```

### 5.2.3 Area (영역) 코드

| 코드 | 영역 | 설명 |
|------|------|------|
| **F** | Frontend | Next.js, React, UI/UX |
| **B** | Backend | Supabase Edge Functions, API |
| **D** | Database | PostgreSQL, Schema, Migration |
| **T** | Testing | Unit, Integration, E2E 테스트 |
| **S** | Security | 인증, 권한, 보안 검증 |
| **O** | DevOps | 배포, CI/CD, 모니터링 |

---

## 5.3 21개 속성 시스템

모든 작업(Task)은 21개 속성으로 완전히 정의됩니다.

### 5.3.1 그리드 좌표 (2개)

#### 1. Phase (개발 단계)
- **정의**: 프로젝트의 순차적 개발 단계
- **값**: Phase 0, Phase 1, Phase 2, ...
- **예시**: "Phase 1"

#### 2. Area (개발 영역)
- **정의**: 작업이 속한 개발 영역
- **값**: F, B, D, T, S, O
- **예시**: "Frontend"

### 5.3.2 작업 기본 정보 (9개)

#### 3. 작업ID (Task ID)
- **형식**: P[Phase][Area][번호][병렬]
- **예시**: "P2F3a"

#### 4. 업무 (Task Description)
- **정의**: 구체적인 작업 내용
- **예시**: "AuthContext 생성 및 Supabase 연동"

#### 5. 작업지시서 (Task Instruction)
- **정의**: 상세 지시사항 파일 경로
- **예시**: "tasks/P2F3a.md"

#### 6. 담당AI (Assigned AI)
- **정의**: 작업 수행 AI 에이전트 (개발자만)
- **값**: fullstack-developer, devops-troubleshooter, database-specialist
- **예시**: "fullstack-developer"

#### 7. 사용도구 (Tools)
- **정의**: 사용할 기술/라이브러리
- **예시**: "React/TypeScript/Supabase"

#### 8. 작업 방식 (Work Mode)
- **값**:
  - "AI-Only" (기본값, 95%)
  - "AI + 사용자 수동 작업" (예외)
  - "협력 AI API 연결"
  - "협력 AI 수동 연결"

#### 9. 의존성 체인 (Dependency Chain)
- **정의**: 선행 완료 필수 작업 ID
- **예시**: "P2B1, P2F2"
- **중요**: import 문 자동 분석으로 검증

#### 10. 진도 (Progress)
- **값**: 0%, 25%, 50%, 75%, 100%

#### 11. 상태 (Status)
- **값**:
  - "대기" (시작 전)
  - "진행 중" (현재 수행)
  - "완료 (YYYY-MM-DD HH:MM)"

### 5.3.3 작업 실행 기록 (4개)

#### 12. 생성 소스코드 파일
- **형식**: 파일1;파일2 [YYYY-MM-DD HH:MM]
- **예시**:
  ```
  P2F3a_auth_context.tsx;P2F3a_auth_provider.tsx [2025-10-23 09:15]
  ```

#### 13. 생성자 (Code Generator)
- **값**: Claude-3.5-Sonnet, GPT-4, Gemini
- **예시**: "Claude-3.5-Sonnet"

#### 14. 소요시간 (Duration)
- **값**: 분 단위 (양의 정수)
- **예시**: "45" (45분 소요)

#### 15. 수정이력 (Modification History)
- **형식**:
  ```
  [v버전] 내용 [시간]
  [ERROR] 오류 → [FIX] 수정 → [PASS/FAIL] 결과
  ```
- **예시**:
  ```
  [v2.5.0] 초기구현 [2025-10-23 14:30]
  [ERROR] Task ID 누락 → [FIX] 자동추가 → [PASS] 검증통과
  [v2.5.1] 버그수정 [2025-10-23 15:45]
  ```

### 5.3.4 검증 (5개)

#### 16. 테스트내역 (Test History)
- **형식**: `CR(진행)@검증자 → Test(진행)@검증자 → Build(상태)@시스템`
- **예시**:
  ```
  CR(15/15)@QA-Agent-03 → Test(24/24)@Test-Agent-01 → Build(성공)@CI
  CR(진행:12/15)@QA-03 → Test(대기) → Build(대기)
  ```

#### 17. 빌드결과 (Build Result)
- **값**: ✅ 성공, ❌ 실패, ⏳ 대기, ⚠️ 경고

#### 18. 의존성 전파 (Dependency Propagation)
- **값**:
  - "✅ 이행" (모든 선행작업 완료)
  - "❌ 불이행 - [작업ID]" (특정 작업 미완료)
  - "⏳ 대기"

#### 19. 블로커 (Blocker)
- **값**: "없음" 또는 구체적 블로커 내용
- **예시**: "의존성 문제: P3B1b"

#### 20. 종합 검증 결과
- **값**:
  - "⏳ 대기"
  - "🔄 진행중"
  - "✅ 통과 | 보고서: 경로 (시간)"
  - "❌ 실패"

### 5.3.5 기타 정보 (1개)

#### 21. 참고사항 (Remarks)
- **정의**: 추가 정보/메모
- **예시**: "성능 최적화 적용됨", "-"

---

## 5.4 Phase별 개발 계획

### 5.4.1 Phase 0: 기획 및 설계 ✅ (완료)

**목표**: 프로젝트 기반 완성

**완료된 작업**:
- ✅ 프로젝트 기획서 작성
- ✅ 기술 스택 결정 (Supabase)
- ✅ DB 스키마 설계 (12개 테이블)
- ✅ Skills + Agents 시스템 구축
- ✅ 프로젝트 그리드 방법론 V2.0 도입

**완료 기준**:
- [x] 통합 기획서 150페이지 완성
- [x] 기술 스택 확정
- [x] 개발 환경 준비

**Phase Gate 조건**: 모든 기획 문서 승인 완료

---

### 5.4.2 Phase 1: MVP (Claude AI + 기본 커뮤니티)

**목표**: Claude AI 평가 + 기본 커뮤니티 작동

**의존성**: Phase 0 완료

#### Frontend 작업 (F)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P1F1 | Next.js 프로젝트 초기화 + 폴더 구조 | - | [순차] | fullstack-developer |
| P1F2 | Supabase Client 설정 + 환경변수 | P1F1 | [순차] | fullstack-developer |
| P1F3a | AuthContext 생성 | P1F2 | [병렬] | fullstack-developer |
| P1F3b | 로그인 페이지 | P1F2 | [병렬] | fullstack-developer |
| P1F3c | 회원가입 페이지 | P1F2 | [병렬] | fullstack-developer |
| P1F4 | shadcn/ui 컴포넌트 설치 | P1F1 | [순차] | fullstack-developer |
| P1F5a | 메인 페이지 레이아웃 | P1F4 | [병렬] | fullstack-developer |
| P1F5b | 정치인 카드 컴포넌트 | P1F4 | [병렬] | fullstack-developer |
| P1F6 | 정치인 목록 페이지 | P1F5a, P1F5b, P1D2 | [순차] | fullstack-developer |
| P1F7 | 정치인 상세 페이지 + AI 평가 표시 | P1F6, P1D3 | [순차] | fullstack-developer |
| P1F8a | 게시글 목록 컴포넌트 | P1F4 | [병렬] | fullstack-developer |
| P1F8b | 게시글 상세 페이지 | P1F4 | [병렬] | fullstack-developer |
| P1F8c | 게시글 작성 페이지 | P1F4 | [병렬] | fullstack-developer |
| P1F9 | 댓글 컴포넌트 | P1F8b | [순차] | fullstack-developer |

#### Database 작업 (D)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P1D1 | Supabase 프로젝트 생성 + 설정 | - | [순차] | database-specialist |
| P1D2 | 12개 테이블 생성 (Migration) | P1D1 | [순차] | database-specialist |
| P1D3 | RLS 정책 설정 (전체 테이블) | P1D2 | [순차] | database-specialist |
| P1D4 | 인덱스 생성 (성능 최적화) | P1D3 | [순차] | database-specialist |
| P1D5 | 초기 데이터 Seeding (정치인 50명) | P1D4 | [순차] | database-specialist |

#### Backend 작업 (B)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P1B1 | Supabase Storage 설정 (avatars, post-attachments) | P1D1 | [순차] | fullstack-developer |
| P1B2 | Edge Function: 추천/비추천 카운트 업데이트 | P1D3 | [순차] | fullstack-developer |
| P1B3 | Edge Function: 베스트글 선정 로직 | P1D3 | [순차] | fullstack-developer |

#### Testing 작업 (T)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P1T1 | 인증 플로우 테스트 | P1F3a, P1F3b, P1F3c | [순차] | test-specialist |
| P1T2 | 게시글 CRUD 테스트 | P1F8a, P1F8b, P1F8c | [순차] | test-specialist |
| P1T3 | 정치인 조회 테스트 | P1F6, P1F7 | [순차] | test-specialist |

#### DevOps 작업 (O)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P1O1 | Vercel 프로젝트 연결 + 배포 설정 | P1F1 | [순차] | devops-troubleshooter |
| P1O2 | 환경변수 설정 (Production) | P1O1 | [순차] | devops-troubleshooter |
| P1O3 | CI/CD 파이프라인 구축 (GitHub Actions) | P1O1 | [순차] | devops-troubleshooter |

**Phase 1 완료 기준**:
- [ ] 회원가입/로그인 작동
- [ ] 정치인 50명 데이터 조회 가능
- [ ] Claude AI 평가 점수 표시
- [ ] 게시글 작성/조회/수정/삭제 작동
- [ ] 댓글 작성 가능
- [ ] 추천/비추천 작동
- [ ] Vercel 배포 성공

**Phase Gate**: 모든 P1 작업 완료 + 통합 테스트 통과

---

### 5.4.3 Phase 2: 커뮤니티 강화

**목표**: 디시인사이드 + 클리앙 기능 구현

**의존성**: Phase 1 완료

#### Frontend 작업 (F)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P2F1a | 실시간 베스트글 컴포넌트 (🔥 HOT) | P1F8a | [병렬] | fullstack-developer |
| P2F1b | 개념글 컴포넌트 (⭐) | P1F8a | [병렬] | fullstack-developer |
| P2F2 | 알림 시스템 UI (🔔 아이콘) | P1F5a | [순차] | fullstack-developer |
| P2F3 | 알림 목록 페이지 | P2F2, P2D1 | [순차] | fullstack-developer |
| P2F4 | 북마크 버튼 + 내 스크랩 페이지 | P1F8b | [순차] | fullstack-developer |
| P2F5 | 신고 모달 + 신고 기능 | P1F8b | [순차] | fullstack-developer |
| P2F6 | 회원 등급 표시 컴포넌트 | P1F5a | [순차] | fullstack-developer |
| P2F7 | 정치인 전용 [정치인 글] 카테고리 | P1F8a | [순차] | fullstack-developer |
| P2F8 | 정치인 본인 인증 신청 페이지 | P1F7 | [순차] | fullstack-developer |

#### Database 작업 (D)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P2D1 | Realtime 구독 설정 (알림, 댓글) | P1D3 | [순차] | database-specialist |
| P2D2 | 베스트글/개념글 자동 업데이트 Trigger | P1D3 | [순차] | database-specialist |

#### Backend 작업 (B)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P2B1 | Edge Function: 알림 생성 로직 | P2D1 | [순차] | fullstack-developer |
| P2B2 | Edge Function: 신고 처리 로직 | P1D3 | [순차] | fullstack-developer |
| P2B3 | Edge Function: 회원 등급 계산 | P1D3 | [순차] | fullstack-developer |

#### Testing 작업 (T)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P2T1 | 베스트글/개념글 로직 테스트 | P2F1a, P2F1b, P2D2 | [순차] | test-specialist |
| P2T2 | 알림 시스템 통합 테스트 | P2F2, P2F3, P2B1 | [순차] | test-specialist |
| P2T3 | Realtime 구독 테스트 | P2D1 | [순차] | test-specialist |

**Phase 2 완료 기준**:
- [ ] 베스트글 자동 선정 작동
- [ ] 개념글 배지 표시
- [ ] 알림 시스템 실시간 작동
- [ ] 북마크/스크랩 기능 작동
- [ ] 신고 기능 작동
- [ ] 회원 등급 표시
- [ ] 정치인 인증 신청 가능

**Phase Gate**: 모든 P2 작업 완료 + 커뮤니티 기능 검증

---

### 5.4.4 Phase 3: 수익화

**목표**: 연결 서비스 + AI 리포트 판매

**의존성**: Phase 2 완료

#### Frontend 작업 (F)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P3F1 | 연결 서비스 메인 페이지 (/services) | P1F5a | [순차] | fullstack-developer |
| P3F2 | 서비스 카테고리별 목록 | P3F1, P3D1 | [순차] | fullstack-developer |
| P3F3 | 서비스 상세 페이지 | P3F2 | [순차] | fullstack-developer |
| P3F4 | AI 리포트 구매 페이지 | P1F7 | [순차] | fullstack-developer |
| P3F5 | 결제 모듈 통합 (Toss Payments) | - | [순차] | fullstack-developer |
| P3F6 | 정치인 프리미엄 멤버십 페이지 | P1F7 | [순차] | fullstack-developer |
| P3F7 | 정치인 통계 대시보드 | P1F7 | [순차] | fullstack-developer |

#### Database 작업 (D)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P3D1 | services 테이블 (연결 서비스) | P1D3 | [순차] | database-specialist |
| P3D2 | payments 테이블 (결제 내역) | P1D3 | [순차] | database-specialist |
| P3D3 | memberships 테이블 (멤버십 구독) | P1D3 | [순차] | database-specialist |

#### Backend 작업 (B)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P3B1 | Edge Function: AI 리포트 생성 (Claude API 연동) | P3D2 | [순차] | fullstack-developer |
| P3B2 | Edge Function: 결제 처리 (Toss Payments Webhook) | P3D2 | [순차] | fullstack-developer |
| P3B3 | Edge Function: 멤버십 만료 체크 | P3D3 | [순차] | fullstack-developer |

#### Testing 작업 (T)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P3T1 | 연결 서비스 통합 테스트 | P3F1, P3F2, P3F3 | [순차] | test-specialist |
| P3T2 | 결제 플로우 테스트 (테스트 환경) | P3F5, P3B2 | [순차] | test-specialist |
| P3T3 | AI 리포트 생성 테스트 | P3B1 | [순차] | test-specialist |

**Phase 3 완료 기준**:
- [ ] 연결 서비스 목록 조회
- [ ] AI 리포트 구매 가능
- [ ] 결제 시스템 작동
- [ ] 정치인 프리미엄 멤버십 구독 가능
- [ ] 정치인 통계 대시보드 작동

**Phase Gate**: 수익화 기능 검증 + 첫 매출 발생

---

### 5.4.5 Phase 4: 다중 AI 확장

**목표**: 5개 AI 종합 평가 시스템

**의존성**: Phase 3 완료

#### Frontend 작업 (F)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P4F1 | AI 비교 차트 컴포넌트 (5개 AI) | P1F7 | [순차] | fullstack-developer |
| P4F2 | AI별 상세 평가 페이지 | P4F1 | [순차] | fullstack-developer |
| P4F3 | 종합 점수 계산 알고리즘 표시 | P4F1 | [순차] | fullstack-developer |

#### Database 작업 (D)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P4D1 | ai_scores 테이블 확장 (gpt, gemini, perplexity, grok 추가) | P1D3 | [순차] | database-specialist |

#### Backend 작업 (B)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P4B1a | Edge Function: GPT API 연동 | P4D1 | [병렬] | fullstack-developer |
| P4B1b | Edge Function: Gemini API 연동 | P4D1 | [병렬] | fullstack-developer |
| P4B1c | Edge Function: Perplexity API 연동 | P4D1 | [병렬] | fullstack-developer |
| P4B1d | Edge Function: Grok API 연동 | P4D1 | [병렬] | fullstack-developer |
| P4B2 | Edge Function: 종합 점수 계산 알고리즘 | P4B1a, P4B1b, P4B1c, P4B1d | [순차] | fullstack-developer |

#### Testing 작업 (T)

| 작업ID | 업무 | 의존성 | 병렬/순차 | 담당AI |
|--------|------|--------|-----------|--------|
| P4T1 | 다중 AI 평가 통합 테스트 | P4F1, P4B2 | [순차] | test-specialist |
| P4T2 | 편향성 검증 테스트 (AI 간 점수 비교) | P4T1 | [순차] | test-specialist |

**Phase 4 완료 기준**:
- [ ] 5개 AI 평가 점수 모두 표시
- [ ] AI 비교 차트 작동
- [ ] 종합 점수 계산 알고리즘 검증
- [ ] 편향성 최소화 확인

**Phase Gate**: 다중 AI 평가 시스템 검증

---

### 5.4.6 Phase 5: AI 아바타 소통 (향후)

**목표**: 24시간 정치인 소통

**의존성**: Phase 4 완료

*(상세 작업은 Phase 4 완료 후 정의)*

---

### 5.4.7 Phase 6: 최적화 및 확장 (향후)

**목표**: 성능 최적화 + 모바일 앱

**의존성**: Phase 5 완료

*(상세 작업은 Phase 5 완료 후 정의)*

---

## 5.5 의존성 관리 및 병렬/순차 작업

### 5.5.1 의존성 다이어그램 (Phase 1 예시)

```
Phase 1 의존성 체인:

[P1F1] Next.js 초기화
   ↓
   ├→ [P1F2] Supabase Client 설정
   │     ↓
   │     ├→ [P1F3a] AuthContext (병렬)
   │     ├→ [P1F3b] 로그인 (병렬)
   │     └→ [P1F3c] 회원가입 (병렬)
   │
   └→ [P1F4] shadcn/ui 설치
         ↓
         ├→ [P1F5a] 메인 레이아웃 (병렬)
         ├→ [P1F5b] 정치인 카드 (병렬)
         ├→ [P1F8a] 게시글 목록 (병렬)
         ├→ [P1F8b] 게시글 상세 (병렬)
         └→ [P1F8c] 게시글 작성 (병렬)

[P1D1] Supabase 프로젝트 생성
   ↓
[P1D2] 테이블 생성
   ↓
[P1D3] RLS 정책
   ↓
[P1F6] 정치인 목록 페이지 (P1F5a, P1F5b, P1D2 의존)
   ↓
[P1F7] 정치인 상세 페이지 (P1F6, P1D3 의존)
```

### 5.5.2 병렬 작업 최적화

#### 병렬 실행 가능 그룹

**Phase 1**:
```
그룹 1 (Frontend 인증):
  P1F3a, P1F3b, P1F3c → 동시 실행 가능

그룹 2 (Frontend UI):
  P1F5a, P1F5b, P1F8a, P1F8b, P1F8c → 동시 실행 가능
  (P1F4 완료 후)

그룹 3 (Backend + Database 독립):
  P1B1, P1B2, P1B3 → Database 완료 후 동시 실행
```

**Phase 4**:
```
AI API 연동 병렬:
  P4B1a (GPT), P4B1b (Gemini), P4B1c (Perplexity), P4B1d (Grok)
  → 4개 동시 진행 가능 (독립적)
```

### 5.5.3 순차 실행 필수 작업

```
순차적 진행 필요:
1. P1D1 → P1D2 → P1D3 → P1D4 (Database 순서 중요)
2. P1F1 → P1F2 (프로젝트 생성 후 설정)
3. P1F6 → P1F7 (목록 후 상세)
4. P4B1* → P4B2 (개별 AI 완료 후 종합 계산)
```

---

## 5.6 Phase Gate 시스템

### 5.6.1 Phase Gate 개념

**정의**: 다음 Phase로 진입하기 전 반드시 통과해야 할 검증 단계

**목적**:
- 품질 보증
- 완성도 확인
- 다음 Phase 진행 가능 여부 판단

### 5.6.2 Phase Gate 통과 조건

```python
def can_enter_next_phase(current_phase):
    """Phase Gate 통과 조건 검증"""

    tasks = grid.get_tasks_by_phase(current_phase)

    # 1. 모든 Task 완료 확인
    for task in tasks:
        if task['상태'] != '완료':
            return False, f"{task['작업ID']} 미완료"

        # 2. Code Review 완료 확인
        test_history = task['테스트내역']
        if "CR(" not in test_history or "@" not in test_history:
            return False, f"{task['작업ID']} Code Review 미완료"

        # 3. Test 완료 확인
        if "Test(" not in test_history:
            return False, f"{task['작업ID']} 테스트 미완료"

        # 4. 빌드 성공 확인
        if task['빌드결과'] != '✅ 성공':
            return False, f"{task['작업ID']} 빌드 실패"

    return True, "Phase Gate 통과"
```

### 5.6.3 Phase Gate 체크리스트

#### Phase 1 → Phase 2 진입 조건
- [ ] 모든 P1 작업 완료 (P1F*, P1D*, P1B*, P1T*, P1O*)
- [ ] 회원가입/로그인 E2E 테스트 통과
- [ ] 게시글 CRUD E2E 테스트 통과
- [ ] Vercel 배포 성공
- [ ] 성능 테스트 통과 (메인 페이지 2초 이내)
- [ ] 보안 검증 (RLS 정책 검증)

#### Phase 2 → Phase 3 진입 조건
- [ ] 모든 P2 작업 완료
- [ ] 커뮤니티 기능 통합 테스트 통과
- [ ] Realtime 구독 동작 확인
- [ ] 알림 시스템 E2E 테스트 통과
- [ ] 회원 1,000명 이상 (마케팅 목표)

---

## 5.7 AI-Only 개발 원칙 적용

### 5.7.1 작업 방식 분포

```
전체 작업의 작업 방식 분포 (예상):

AI-Only: 95%
├─ Frontend 개발: 100% AI
├─ Backend 개발: 100% AI
├─ Database 마이그레이션: 100% AI
├─ Testing: 100% AI
└─ DevOps: 90% AI

AI + 사용자 수동: 5%
├─ Toss Payments API 키 발급: 수동 (이메일 인증)
├─ Supabase 프로젝트 결제: 수동 (카드 등록)
└─ 도메인 구매: 수동 (결제)
```

### 5.7.2 AI 에이전트 역할 분담

| 에이전트 | 역할 | 담당 작업 |
|----------|------|-----------|
| **fullstack-developer** | 풀스택 개발 | Frontend + Backend + API 통합 |
| **database-specialist** | 데이터베이스 전문가 | Schema, Migration, RLS, Indexing |
| **test-specialist** | 테스트 전문가 | Unit, Integration, E2E 테스트 |
| **devops-troubleshooter** | DevOps 전문가 | 배포, CI/CD, 모니터링, 트러블슈팅 |
| **QA-Agent** | 품질 검증 | Code Review, 정적 분석 |

### 5.7.3 자동화 스크립트 예시

```bash
#!/bin/bash
# AI가 실행하는 자동화 스크립트 예시

# 1. 프로젝트 초기화 (P1F1)
npx create-next-app@latest politician-finder \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir

cd politician-finder

# 2. 의존성 설치
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zustand react-hook-form zod
npm install recharts lucide-react

# 3. shadcn/ui 초기화 (P1F4)
npx shadcn-ui@latest init

# 4. Supabase 로컬 시작 (P1D1)
supabase init
supabase start

# 5. 마이그레이션 실행 (P1D2)
supabase db push

# 6. 타입 생성
supabase gen types typescript --local > src/types/database.types.ts

# 7. 개발 서버 시작
npm run dev
```

---

## 5.8 파일 명명 규칙 및 폴더 구조

### 5.8.1 파일 명명 규칙 (강제)

**모든 파일은 Task ID를 포함해야 합니다.**

```
형식: {TaskID}_{설명}.{확장자}

예시:
✅ P1F3a_auth_context.tsx
✅ P1F3b_login_page.tsx
✅ P2F1a_best_posts_component.tsx
✅ P1D2_create_tables.sql
✅ P1T1_auth_flow.test.ts
✅ P3B1_generate_ai_report.ts

❌ AuthContext.tsx (Task ID 없음)
❌ login.tsx (Task ID 없음)
```

### 5.8.2 폴더 구조

```
politician-finder/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    (P1F5a)
│   │   ├── politician/
│   │   │   └── [id]/
│   │   │       └── page.tsx            (P1F7)
│   │   ├── community/
│   │   │   └── page.tsx
│   │   └── post/
│   │       ├── [id]/page.tsx           (P1F8b)
│   │       └── write/page.tsx          (P1F8c)
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── P1F3a_auth_context.tsx
│   │   │   └── P1F3b_login_form.tsx
│   │   ├── politician/
│   │   │   └── P1F5b_politician_card.tsx
│   │   ├── community/
│   │   │   ├── P1F8a_post_list.tsx
│   │   │   └── P2F1a_best_posts.tsx
│   │   └── ui/                         (shadcn/ui)
│   │
│   ├── lib/
│   │   ├── P1F2_supabase_client.ts
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── P1F3a_use_auth.ts
│   │   └── P1F6_use_politicians.ts
│   │
│   └── types/
│       └── database.types.ts           (자동 생성)
│
├── supabase/
│   ├── migrations/
│   │   ├── P1D2_20250116_create_tables.sql
│   │   └── P1D3_20250117_add_rls_policies.sql
│   └── functions/
│       ├── P1B2_update_vote_count/
│       ├── P1B3_select_best_posts/
│       └── P3B1_generate_ai_report/
│
├── tests/
│   ├── P1T1_auth_flow.test.ts
│   ├── P1T2_post_crud.test.ts
│   └── P2T1_best_posts.test.ts
│
├── docs/
│   ├── P1F1_REPORT.md                  (자동 생성)
│   ├── P1F2_REPORT.md
│   └── ...
│
└── tasks/
    ├── P1F1.md                         (작업지시서)
    ├── P1F2.md
    └── ...
```

### 5.8.3 소스코드 헤더 주석 (의무)

모든 소스코드 파일 최상단에 작업 ID 포함:

```typescript
/**
 * Project Grid Task ID: P1F3a
 * Task Name: AuthContext 생성 및 Supabase 연동
 * Created: 2025-10-24
 * Author: Claude (AI Agent)
 * Description: 사용자 인증 상태 관리를 위한 Context
 * Dependencies: P1F2 (Supabase Client 설정)
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
// ...
```

---

## 5.9 프로젝트 그리드 CSV 파일 구조

### 5.9.1 Grid 데이터 저장

**파일명**: `ProjectGrid.csv`

**위치**: 프로젝트 루트 또는 `docs/` 폴더

**구조**: 21개 속성을 컬럼으로 가진 CSV 파일

```csv
작업ID,Phase,Area,업무,작업지시서,담당AI,사용도구,작업방식,의존성체인,진도,상태,생성소스코드파일,생성자,소요시간,수정이력,테스트내역,빌드결과,의존성전파,블로커,종합검증결과,참고사항
P1F1,Phase 1,Frontend,Next.js 프로젝트 초기화,tasks/P1F1.md,fullstack-developer,Next.js/TypeScript,AI-Only,-,100%,완료 (2025-10-24 10:00),P1F1_next_config.js [2025-10-24 10:00],Claude-3.5-Sonnet,30,[v1.0.0] 초기구현,CR(10/10)@QA-01→Test(5/5)@Test-01→Build(성공)@CI,✅ 성공,✅ 이행,없음,✅ 통과 | 보고서: docs/P1F1_REPORT.md (10:30),-
P1F2,Phase 1,Frontend,Supabase Client 설정,tasks/P1F2.md,fullstack-developer,Supabase,AI-Only,P1F1,50%,진행 중,-,-,-,-,-,⏳ 대기,⏳ 대기,없음,⏳ 대기,-
```

### 5.9.2 Grid 업데이트 규칙

**작업 시작 시**:
```csv
상태: "대기" → "진행 중"
진도: 0% → (진행 중)
```

**코드 생성 완료 시**:
```csv
생성소스코드파일: "파일1;파일2 [시간]"
생성자: "Claude-3.5-Sonnet"
소요시간: "45" (분)
```

**테스트 완료 시**:
```csv
테스트내역: "CR(15/15)@QA-01→Test(24/24)@Test-01→Build(성공)@CI"
빌드결과: "✅ 성공"
```

**작업 완료 시**:
```csv
상태: "진행 중" → "완료 (2025-10-24 14:30)"
진도: 100%
종합검증결과: "✅ 통과 | 보고서: docs/P1F2_REPORT.md (14:30)"
```

---

## 5.10 개발 계획 요약

### 5.10.1 전체 Phase 개요

| Phase | 목표 | 핵심 작업 수 | 의존성 | 예상 복잡도 |
|-------|------|-------------|--------|-------------|
| **Phase 0** | 기획 및 설계 | 5개 | - | 낮음 (완료) |
| **Phase 1** | MVP | 30개 | Phase 0 | 높음 |
| **Phase 2** | 커뮤니티 강화 | 18개 | Phase 1 | 중간 |
| **Phase 3** | 수익화 | 16개 | Phase 2 | 중간 |
| **Phase 4** | 다중 AI | 12개 | Phase 3 | 높음 |
| **Phase 5** | 아바타 소통 | TBD | Phase 4 | 매우 높음 |
| **Phase 6** | 최적화 | TBD | Phase 5 | 중간 |

### 5.10.2 핵심 마일스톤

```
M1: Phase 1 완료 (MVP 출시)
  - 회원가입/로그인 작동
  - Claude AI 평가 표시
  - 기본 커뮤니티 작동
  - 회원 100명 목표

M2: Phase 2 완료 (커뮤니티 고도화)
  - 베스트글/개념글 시스템
  - 알림 시스템 실시간
  - 회원 1,000명 목표

M3: Phase 3 완료 (수익화)
  - 연결 서비스 론칭
  - 첫 매출 발생
  - 월 매출 500만원 목표

M4: Phase 4 완료 (다중 AI)
  - 5개 AI 평가 통합
  - 편향성 검증 완료

M5: Phase 5 완료 (아바타)
  - 정치인 100명 아바타 활성화
  - 일 대화 1,000건
```

### 5.10.3 위험 관리

| 위험 | 발생 확률 | 영향도 | 대응 전략 |
|------|-----------|--------|-----------|
| **AI API 비용 초과** | 높음 | 높음 | 캐싱 강화, 무료 플랜 최대 활용 |
| **Supabase 용량 초과** | 중간 | 중간 | 데이터 정리, Pro 플랜 업그레이드 |
| **법적 이슈 (명예훼손)** | 중간 | 높음 | 신고 시스템 강화, 법률 자문 |
| **정치적 편향 의심** | 높음 | 매우 높음 | 다중 AI 평가, 투명성 강화 |
| **사용자 유입 부족** | 중간 | 높음 | 마케팅 강화, 인플루언서 협력 |

---

*Part 5 완료. 다음: Part 6 (품질 관리)*

---

# Part 6: 품질 관리

## 6.1 테스트 전략

### 6.1.1 테스트 체인 (CR → Test → Build)

프로젝트 그리드 방법론 V2.0에 따라 모든 작업은 3단계 검증 체인을 통과해야 합니다.

```
CR (Code Review) → Test (Testing) → Build (Integration)
      ↓                  ↓                ↓
  QA Agent        Test Agent         CI System
  (15 checks)     (24 test cases)    (Build Pass)
```

**CR (Code Review) 단계**:
- **담당**: QA Agent (QA-01, QA-02)
- **검증 항목**: 15개 체크리스트
- **기준**: 15/15 통과 필수
- **기록 형식**: `CR(15/15)@QA-01`

**Test 단계**:
- **담당**: Test Agent (Test-01, Test-02)
- **검증 항목**: 단위/통합 테스트
- **기준**: 모든 테스트 통과
- **기록 형식**: `Test(24/24)@Test-01`

**Build 단계**:
- **담당**: CI System (GitHub Actions)
- **검증 항목**: 빌드 성공, 타입 오류 없음
- **기준**: Build Success
- **기록 형식**: `Build(성공)@CI`

### 6.1.2 Code Review 체크리스트 (15개 항목)

모든 코드는 다음 15개 항목을 검증받아야 합니다:

**1. 파일 명명 규칙**
```
✓ 파일명에 TaskID 포함: P1F3a_auth_context.tsx
✓ 헤더 주석에 TaskID 명시
```

**2. TypeScript 타입 안전성**
```
✓ any 타입 사용 금지 (unknown 또는 구체적 타입 사용)
✓ 모든 함수 파라미터/리턴값 타입 명시
✓ 인터페이스/타입 정의 완료
```

**3. 에러 핸들링**
```
✓ try-catch 블록 적절히 사용
✓ 에러 메시지 명확 (사용자 친화적)
✓ 에러 로깅 구현
```

**4. 보안**
```
✓ 환경변수로 민감 정보 관리
✓ RLS (Row Level Security) 적용 확인
✓ XSS/CSRF 방어 코드 포함
```

**5. 성능**
```
✓ 불필요한 리렌더링 방지 (useMemo/useCallback)
✓ 이미지 최적화 (Next.js Image 사용)
✓ 무한 스크롤/페이지네이션 구현
```

**6. 코드 스타일**
```
✓ ESLint 규칙 준수
✓ Prettier 포맷팅 적용
✓ 일관된 명명 규칙 (camelCase/PascalCase)
```

**7. 주석 및 문서화**
```
✓ 복잡한 로직에 주석 추가
✓ JSDoc 형식 함수 설명
✓ README 업데이트 (필요시)
```

**8. 접근성 (a11y)**
```
✓ 시맨틱 HTML 사용
✓ ARIA 속성 추가
✓ 키보드 네비게이션 지원
```

**9. 반응형 디자인**
```
✓ 모바일/태블릿/데스크톱 대응
✓ Tailwind breakpoints 사용
✓ 가로/세로 모드 대응
```

**10. 의존성 관리**
```
✓ 의존성 체인 명시 (ProjectGrid.csv)
✓ 순환 의존성 없음
✓ 필요한 imports만 포함
```

**11. 테스트 가능성**
```
✓ 순수 함수 우선 사용
✓ 의존성 주입 가능
✓ Mock 가능한 구조
```

**12. 데이터 검증**
```
✓ Input validation 구현
✓ Zod/Yup 스키마 검증
✓ Sanitization 적용
```

**13. 재사용성**
```
✓ 공통 로직 유틸 함수화
✓ 컴포넌트 Props 인터페이스 명확
✓ 커스텀 훅 분리
```

**14. Git 관리**
```
✓ Commit message 규칙 준수
✓ PR description 작성
✓ 브랜치 네이밍 규칙 (P1F3a-auth-context)
```

**15. 종합 검증**
```
✓ 작업 지시서(tasks/{TaskID}.md) 요구사항 충족
✓ 관련 문서 업데이트
✓ 테스트 코드 포함
```

### 6.1.3 테스트 유형 및 도구

#### Unit Testing (단위 테스트)
**도구**: Vitest + React Testing Library

**대상**:
- 유틸리티 함수
- 커스텀 훅
- 개별 컴포넌트

**예시**:
```typescript
// P1F5b_politician_card.test.tsx
import { render, screen } from '@testing-library/react'
import { PoliticianCard } from './P1F5b_politician_card'

describe('P1F5b: PoliticianCard Component', () => {
  test('정치인 이름 표시', () => {
    const politician = { id: '1', name: '홍길동', party: '민주당' }
    render(<PoliticianCard politician={politician} />)
    expect(screen.getByText('홍길동')).toBeInTheDocument()
  })

  test('평가 점수 표시 (0-100)', () => {
    const politician = { id: '1', name: '홍길동', score: 85 }
    render(<PoliticianCard politician={politician} />)
    expect(screen.getByText('85점')).toBeInTheDocument()
  })
})
```

#### Integration Testing (통합 테스트)
**도구**: Playwright

**대상**:
- API 엔드포인트
- 페이지 플로우
- Supabase 연동

**예시**:
```typescript
// P1F3_auth_integration.test.ts
import { test, expect } from '@playwright/test'

test('P1F3: 회원가입 → 로그인 플로우', async ({ page }) => {
  // 1. 회원가입 페이지 이동
  await page.goto('/signup')

  // 2. 폼 작성
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'TestPass123!')
  await page.click('button[type="submit"]')

  // 3. 로그인 성공 확인
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('h1')).toContainText('대시보드')
})
```

#### E2E Testing (End-to-End)
**도구**: Playwright

**대상**:
- 핵심 사용자 시나리오
- 전체 기능 플로우

**예시**:
```typescript
// P1_mvp_e2e.test.ts
test('MVP 핵심 시나리오: 로그인 → 평가 조회 → 댓글 작성', async ({ page }) => {
  // 1. 로그인
  await page.goto('/login')
  await page.fill('input[name="email"]', 'user@example.com')
  await page.fill('input[name="password"]', 'Pass123!')
  await page.click('button[type="submit"]')

  // 2. 정치인 검색
  await page.goto('/politicians')
  await page.fill('input[type="search"]', '홍길동')
  await page.click('button:has-text("검색")')

  // 3. 상세 페이지 이동
  await page.click('text=홍길동')

  // 4. AI 평가 확인
  await expect(page.locator('.ai-evaluation')).toBeVisible()

  // 5. 댓글 작성
  await page.fill('textarea[name="comment"]', '좋은 평가입니다!')
  await page.click('button:has-text("댓글 작성")')

  // 6. 댓글 표시 확인
  await expect(page.locator('text=좋은 평가입니다!')).toBeVisible()
})
```

#### Performance Testing (성능 테스트)
**도구**: Lighthouse CI

**측정 항목**:
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- TTI (Time to Interactive): < 3.8s

**예시 설정**:
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/politicians'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
  },
}
```

### 6.1.4 테스트 커버리지 목표

| 영역 | 목표 커버리지 | 필수 커버리지 |
|------|--------------|--------------|
| **유틸리티 함수** | 100% | 90% |
| **커스텀 훅** | 95% | 85% |
| **컴포넌트** | 80% | 70% |
| **API 라우트** | 90% | 80% |
| **전체 평균** | 85% | 75% |

**측정 도구**: c8 (Vitest 내장)

**커버리지 보고서 생성**:
```bash
npm run test:coverage
```

---

## 6.2 품질 기준

### 6.2.1 코드 품질 메트릭

#### 1. 순환 복잡도 (Cyclomatic Complexity)
- **목표**: 함수당 10 이하
- **허용**: 함수당 15 이하
- **도구**: ESLint (complexity rule)

```javascript
// .eslintrc.json
{
  "rules": {
    "complexity": ["error", 15]
  }
}
```

#### 2. 함수 길이
- **목표**: 50줄 이하
- **허용**: 100줄 이하
- **예외**: 설정 파일, 스키마 정의

#### 3. 파일 길이
- **목표**: 300줄 이하
- **허용**: 500줄 이하
- **예외**: 타입 정의, 상수 모음

#### 4. 중복 코드
- **목표**: 3% 이하
- **허용**: 5% 이하
- **도구**: jscpd

### 6.2.2 성능 기준

#### Frontend 성능
| 메트릭 | 목표 | 허용 |
|--------|------|------|
| **FCP** (First Contentful Paint) | < 1.8s | < 3.0s |
| **LCP** (Largest Contentful Paint) | < 2.5s | < 4.0s |
| **TBT** (Total Blocking Time) | < 200ms | < 600ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.25 |
| **SI** (Speed Index) | < 3.4s | < 5.8s |

#### Backend 성능
| 메트릭 | 목표 | 허용 |
|--------|------|------|
| **API 응답 시간** | < 200ms | < 500ms |
| **Database 쿼리** | < 50ms | < 100ms |
| **Edge Function 실행** | < 100ms | < 300ms |

#### 리소스 사용
| 리소스 | 목표 | 허용 |
|--------|------|------|
| **번들 크기 (JS)** | < 200KB | < 300KB |
| **번들 크기 (CSS)** | < 50KB | < 100KB |
| **이미지 크기** | < 100KB | < 200KB |
| **폰트 크기** | < 50KB | < 100KB |

### 6.2.3 보안 기준

#### 1. OWASP Top 10 대응

**A01: Broken Access Control**
- RLS (Row Level Security) 모든 테이블 적용
- 서버 사이드 권한 검증
- JWT 토큰 검증

**A02: Cryptographic Failures**
- HTTPS 강제 (Vercel 자동)
- 비밀번호 bcrypt 해싱 (Supabase 자동)
- 환경변수 암호화

**A03: Injection**
- Parameterized Queries (Supabase 자동)
- Input Sanitization (DOMPurify)
- SQL Injection 방어

**A04: Insecure Design**
- 보안 설계 리뷰
- Threat Modeling
- 최소 권한 원칙

**A05: Security Misconfiguration**
- CSP (Content Security Policy) 설정
- CORS 정책 엄격 설정
- 기본 자격증명 변경

**A06: Vulnerable Components**
- npm audit 정기 실행
- Dependabot 활성화
- 패키지 업데이트 정책

**A07: Authentication Failures**
- 다단계 인증 (Phase 3)
- 세션 타임아웃 설정
- 비밀번호 정책 강제

**A08: Software and Data Integrity**
- 코드 서명
- Subresource Integrity
- Git commit 서명

**A09: Logging Failures**
- 모든 인증 시도 로깅
- 에러 로깅 (Sentry)
- 감사 로그 보존

**A10: Server-Side Request Forgery**
- URL 화이트리스트
- 내부 IP 차단
- 요청 검증

#### 2. 보안 스캔 도구

**SAST (Static Application Security Testing)**:
- ESLint Security Plugin
- npm audit
- Snyk

**DAST (Dynamic Application Security Testing)**:
- OWASP ZAP (수동)
- Burp Suite (수동)

**SCA (Software Composition Analysis)**:
- Dependabot
- Snyk Open Source

### 6.2.4 접근성 기준 (WCAG 2.1 Level AA)

#### 필수 준수 항목

**1. Perceivable (인지 가능)**
- 모든 이미지에 alt 텍스트
- 색상 대비 4.5:1 이상
- 텍스트 크기 조절 가능

**2. Operable (작동 가능)**
- 키보드만으로 모든 기능 사용 가능
- 포커스 표시 명확
- 충분한 시간 제공

**3. Understandable (이해 가능)**
- 명확한 레이블
- 에러 메시지 구체적
- 일관된 네비게이션

**4. Robust (견고함)**
- 시맨틱 HTML 사용
- ARIA 속성 적절히 사용
- 다양한 보조 기술 지원

**검증 도구**:
- axe DevTools
- WAVE
- Lighthouse Accessibility

---

## 6.3 CI/CD 파이프라인

### 6.3.1 GitHub Actions 워크플로우

#### Workflow 1: PR Validation (PR 검증)

**파일**: `.github/workflows/pr-validation.yml`

```yaml
name: PR Validation

on:
  pull_request:
    branches: [main, develop]

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Format check
        run: npm run format:check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Check bundle size
        run: npx bundlesize

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

#### Workflow 2: Deploy to Production (프로덕션 배포)

**파일**: `.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Run smoke tests
        run: |
          npm ci
          npx playwright test tests/smoke/
        env:
          BASE_URL: https://politician-finder.vercel.app

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 6.3.2 브랜치 전략

```
main (프로덕션)
  ↑
  └─ develop (개발)
       ↑
       ├─ feature/P1F3a-auth-context
       ├─ feature/P1F5b-politician-card
       └─ feature/P2F1a-best-posts
```

**브랜치 네이밍**:
- `feature/{TaskID}-{description}` (예: `feature/P1F3a-auth-context`)
- `bugfix/{TaskID}-{description}` (예: `bugfix/P1F3a-login-error`)
- `hotfix/{TaskID}-{description}` (긴급 수정)

**머지 전략**:
- Feature → Develop: Squash and Merge
- Develop → Main: Merge Commit (릴리스 히스토리 보존)

### 6.3.3 배포 전략

#### Preview Deployments (Vercel)
- 모든 PR에 자동 Preview URL 생성
- 팀원 리뷰 및 테스트 용도
- 자동 삭제 (PR 머지 후 7일)

#### Staging Environment
- Branch: `develop`
- URL: `https://politician-finder-staging.vercel.app`
- 실제 데이터와 유사한 테스트 데이터 사용

#### Production Environment
- Branch: `main`
- URL: `https://politician-finder.vercel.app`
- 자동 배포 (main 브랜치 푸시 시)

---

## 6.4 모니터링 및 성능 관리

### 6.4.1 모니터링 도구

#### 1. Vercel Analytics
**목적**: 프론트엔드 성능 모니터링

**측정 항목**:
- Web Vitals (LCP, FID, CLS, TTFB, FCP)
- 페이지뷰 수
- 사용자 세션
- 지역별 성능

**대시보드**: Vercel 프로젝트 > Analytics 탭

#### 2. Supabase Dashboard
**목적**: 백엔드 및 데이터베이스 모니터링

**측정 항목**:
- API 요청 수
- Database 연결 수
- Storage 사용량
- Edge Function 실행 시간

**알림 설정**:
- Database 용량 80% 도달 시
- API Rate Limit 80% 도달 시

#### 3. Sentry
**목적**: 에러 추적 및 로깅

**설정**:
```typescript
// P0D5_sentry_config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

**알림 조건**:
- Error rate > 5%
- Critical error 발생
- Performance degradation > 20%

#### 4. Custom Logging
**도구**: Winston + CloudWatch (선택적)

**로그 레벨**:
- ERROR: 즉시 대응 필요
- WARN: 주의 필요
- INFO: 일반 정보
- DEBUG: 디버깅 정보

**로그 형식**:
```typescript
// P0D5_logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'politician-finder' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})
```

### 6.4.2 성능 최적화 체크리스트

#### Frontend 최적화
- [x] **이미지 최적화**: Next.js Image 컴포넌트 사용
- [x] **코드 스플리팅**: Dynamic imports 활용
- [x] **번들 크기 축소**: Tree-shaking, unused code 제거
- [x] **캐싱 전략**: SWR/React Query 사용
- [x] **폰트 최적화**: next/font 사용
- [x] **CSS 최적화**: Tailwind purge 설정

#### Backend 최적화
- [x] **Database 인덱싱**: 자주 조회되는 컬럼 인덱스
- [x] **쿼리 최적화**: N+1 문제 해결
- [x] **캐싱**: Redis (Phase 3+)
- [x] **Connection Pooling**: Supabase Pooler 사용
- [x] **Rate Limiting**: API 호출 제한

#### API 최적화
- [x] **응답 압축**: Gzip/Brotli
- [x] **Pagination**: 대용량 데이터 페이징
- [x] **필드 선택**: GraphQL 스타일 선택적 조회
- [x] **Batch 요청**: 여러 요청 묶기

### 6.4.3 알림 및 대응 절차

#### 알림 채널
1. **Slack**: 일반 알림, 배포 알림
2. **Email**: Critical 에러, 장애 알림
3. **SMS**: 서비스 다운 (Phase 3+)

#### 장애 대응 절차

**Level 1 (Minor)**: 성능 저하
- 대응 시간: 4시간 이내
- 예시: 응답 시간 500ms → 800ms
- 조치: 로그 확인, 원인 파악

**Level 2 (Moderate)**: 기능 오류
- 대응 시간: 1시간 이내
- 예시: 특정 페이지 에러
- 조치: Hotfix 배포

**Level 3 (Critical)**: 서비스 다운
- 대응 시간: 즉시
- 예시: 로그인 불가, 사이트 다운
- 조치: Rollback 또는 긴급 수정

---

## 6.5 보안 검증

### 6.5.1 정기 보안 점검

#### 주간 점검
- [ ] npm audit 실행 및 취약점 패치
- [ ] 액세스 로그 리뷰
- [ ] 비정상 트래픽 확인

#### 월간 점검
- [ ] Dependency 업데이트
- [ ] 보안 패치 적용
- [ ] 백업 복구 테스트

#### 분기별 점검
- [ ] 침투 테스트 (Penetration Testing)
- [ ] 보안 감사 (Security Audit)
- [ ] 정책 및 절차 업데이트

### 6.5.2 보안 체크리스트

#### 인증 및 권한
- [x] Supabase Auth 사용 (bcrypt 자동 해싱)
- [x] JWT 토큰 검증
- [x] 세션 타임아웃 설정 (24시간)
- [x] RLS (Row Level Security) 전체 테이블 적용
- [ ] 다단계 인증 (Phase 3)

#### 데이터 보호
- [x] HTTPS 강제 (Vercel 자동)
- [x] 환경변수 암호화
- [x] 민감 정보 마스킹 (로그)
- [x] 개인정보 암호화 (필요시)
- [x] 데이터 백업 (Supabase 자동)

#### 네트워크 보안
- [x] CORS 정책 설정
- [x] CSP (Content Security Policy)
- [x] Rate Limiting
- [ ] DDoS 방어 (Vercel Pro)
- [ ] WAF (Phase 3+)

#### 코드 보안
- [x] Input Validation
- [x] Output Sanitization (DOMPurify)
- [x] SQL Injection 방어 (Parameterized Queries)
- [x] XSS 방어
- [x] CSRF 방어

### 6.5.3 보안 사고 대응 계획

#### 1단계: 탐지
- 모니터링 도구 알림 확인
- 로그 분석
- 영향 범위 파악

#### 2단계: 격리
- 공격 소스 차단
- 영향받은 시스템 격리
- 추가 피해 방지

#### 3단계: 복구
- 취약점 패치
- 시스템 복구
- 데이터 복구 (백업)

#### 4단계: 분석
- 사고 원인 분석
- 재발 방지 대책 수립
- 문서화

#### 5단계: 개선
- 보안 정책 업데이트
- 팀원 교육
- 모니터링 강화

---

*Part 6 완료. 다음: Part 7 (부록)*

---

# Part 7: 부록

## 7.1 용어집

### 프로젝트 관련 용어

| 용어 | 영문 | 설명 |
|------|------|------|
| **프로젝트 그리드** | Project Grid | 3차원 작업 추적 시스템 (Phase × Area × Task) |
| **작업ID** | TaskID | 작업 식별자 (예: P1F3a) |
| **단계** | Phase | 개발 단계 (Phase 0~6) |
| **영역** | Area | 작업 영역 (F/B/D/T/S/O) |
| **의존성 체인** | Dependency Chain | 작업 간 의존 관계 |
| **Phase Gate** | Phase Gate | 단계 간 검증 포인트 |
| **병렬 작업** | Parallel Task | 동시 수행 가능한 작업 (예: P1F3a/b/c) |
| **순차 작업** | Sequential Task | 순서대로 수행해야 하는 작업 |

### 기술 용어

| 용어 | 영문 | 설명 |
|------|------|------|
| **MVP** | Minimum Viable Product | 최소 기능 제품 |
| **SSR** | Server-Side Rendering | 서버 사이드 렌더링 |
| **CSR** | Client-Side Rendering | 클라이언트 사이드 렌더링 |
| **RLS** | Row Level Security | 행 단위 보안 (Supabase) |
| **Edge Function** | Edge Function | 엣지 서버 함수 (Supabase) |
| **SWR** | Stale-While-Revalidate | 데이터 페칭 라이브러리 |
| **Zustand** | Zustand | 경량 상태 관리 라이브러리 |
| **Tailwind CSS** | Tailwind CSS | 유틸리티 우선 CSS 프레임워크 |
| **shadcn/ui** | shadcn/ui | 재사용 가능한 UI 컴포넌트 라이브러리 |

### 테스트 용어

| 용어 | 영문 | 설명 |
|------|------|------|
| **CR** | Code Review | 코드 리뷰 (15개 체크리스트) |
| **단위 테스트** | Unit Test | 개별 함수/컴포넌트 테스트 |
| **통합 테스트** | Integration Test | 여러 모듈 통합 테스트 |
| **E2E 테스트** | End-to-End Test | 전체 시나리오 테스트 |
| **회귀 테스트** | Regression Test | 기존 기능 정상 작동 확인 |
| **스모크 테스트** | Smoke Test | 핵심 기능 간단 테스트 |

### AI 관련 용어

| 용어 | 영문 | 설명 |
|------|------|------|
| **Claude AI** | Claude AI | Anthropic사의 AI 모델 |
| **GPT** | GPT | OpenAI사의 AI 모델 |
| **Gemini** | Gemini | Google사의 AI 모델 |
| **Perplexity** | Perplexity | Perplexity사의 AI 검색 모델 |
| **Grok** | Grok | xAI사의 AI 모델 |
| **프롬프트** | Prompt | AI에게 전달하는 질문/지시 |
| **토큰** | Token | AI 처리 단위 (~4글자) |
| **편향성** | Bias | AI 평가의 편향 |

---

## 7.2 참고 자료

### 공식 문서

#### Next.js
- **공식 사이트**: https://nextjs.org
- **문서**: https://nextjs.org/docs
- **Learn**: https://nextjs.org/learn
- **Examples**: https://github.com/vercel/next.js/tree/canary/examples

#### Supabase
- **공식 사이트**: https://supabase.com
- **문서**: https://supabase.com/docs
- **JS Client**: https://supabase.com/docs/reference/javascript
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

#### Vercel
- **공식 사이트**: https://vercel.com
- **문서**: https://vercel.com/docs
- **Analytics**: https://vercel.com/docs/analytics
- **Deployment**: https://vercel.com/docs/deployments/overview

#### React
- **공식 사이트**: https://react.dev
- **문서**: https://react.dev/learn
- **Hooks**: https://react.dev/reference/react

#### TypeScript
- **공식 사이트**: https://www.typescriptlang.org
- **핸드북**: https://www.typescriptlang.org/docs/handbook/intro.html
- **치트시트**: https://www.typescriptlang.org/cheatsheets

#### Tailwind CSS
- **공식 사이트**: https://tailwindcss.com
- **문서**: https://tailwindcss.com/docs
- **Playground**: https://play.tailwindcss.com

### 커뮤니티 및 리소스

#### 한국어 자료
- **Next.js 한국 사용자 모임**: https://nextjs.kr
- **React Korea**: https://react-korea.vercel.app
- **TypeScript Korea**: https://typescript-kr.github.io

#### 튜토리얼 및 강의
- **Vercel Ship**: https://vercel.com/ship (Next.js Conf)
- **Supabase Launch Week**: https://supabase.com/launch-week
- **shadcn/ui Examples**: https://ui.shadcn.com/examples

#### 블로그 및 뉴스레터
- **Vercel Blog**: https://vercel.com/blog
- **Supabase Blog**: https://supabase.com/blog
- **React Newsletter**: https://react.statuscode.com

### 도구 및 라이브러리

#### 개발 도구
- **VS Code**: https://code.visualstudio.com
- **GitHub Desktop**: https://desktop.github.com
- **Postman**: https://www.postman.com

#### 테스트 도구
- **Vitest**: https://vitest.dev
- **Playwright**: https://playwright.dev
- **React Testing Library**: https://testing-library.com/react

#### 모니터링 도구
- **Sentry**: https://sentry.io
- **Vercel Analytics**: https://vercel.com/analytics
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse

---

## 7.3 코드 템플릿

### 7.3.1 컴포넌트 템플릿

#### React Component (TypeScript)
```typescript
// P{Phase}{Area}{Number}_component_name.tsx
/**
 * TaskID: P{Phase}{Area}{Number}
 * 작업: [작업 설명]
 * 담당AI: [AI 이름]
 * 생성일: YYYY-MM-DD
 */

import React from 'react'

interface ComponentNameProps {
  // Props 정의
}

export const ComponentName: React.FC<ComponentNameProps> = ({ ...props }) => {
  // 로직

  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

#### Custom Hook
```typescript
// P{Phase}{Area}{Number}_use_hook_name.ts
/**
 * TaskID: P{Phase}{Area}{Number}
 * 작업: [훅 설명]
 * 담당AI: [AI 이름]
 * 생성일: YYYY-MM-DD
 */

import { useState, useEffect } from 'react'

export const useHookName = () => {
  // 훅 로직

  return {
    // 리턴 값
  }
}
```

### 7.3.2 API 템플릿

#### Next.js API Route
```typescript
// app/api/route/P{Phase}{Area}{Number}_route.ts
/**
 * TaskID: P{Phase}{Area}{Number}
 * 작업: [API 설명]
 * 담당AI: [AI 이름]
 * 생성일: YYYY-MM-DD
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // 로직

    return NextResponse.json({ data: result })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

#### Supabase Edge Function
```typescript
// supabase/functions/P{Phase}{Area}{Number}_function_name/index.ts
/**
 * TaskID: P{Phase}{Area}{Number}
 * 작업: [함수 설명]
 * 담당AI: [AI 이름]
 * 생성일: YYYY-MM-DD
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // 로직

    return new Response(JSON.stringify({ data: result }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### 7.3.3 테스트 템플릿

#### Unit Test (Vitest)
```typescript
// P{Phase}{Area}{Number}_component.test.tsx
/**
 * TaskID: P{Phase}{Area}{Number}
 * 작업: [테스트 설명]
 * 담당AI: [AI 이름]
 * 생성일: YYYY-MM-DD
 */

import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComponentName } from './P{Phase}{Area}{Number}_component'

describe('P{Phase}{Area}{Number}: ComponentName', () => {
  test('기본 렌더링', () => {
    render(<ComponentName />)
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  test('Props 전달', () => {
    render(<ComponentName prop="value" />)
    // 검증
  })
})
```

#### E2E Test (Playwright)
```typescript
// tests/e2e/P{Phase}_scenario.test.ts
/**
 * TaskID: P{Phase}{Area}{Number}
 * 작업: [E2E 시나리오 설명]
 * 담당AI: [AI 이름]
 * 생성일: YYYY-MM-DD
 */

import { test, expect } from '@playwright/test'

test('P{Phase}: [시나리오 이름]', async ({ page }) => {
  // 1. 페이지 이동
  await page.goto('/')

  // 2. 액션
  await page.click('button')

  // 3. 검증
  await expect(page.locator('h1')).toContainText('...')
})
```

### 7.3.4 Database 템플릿

#### Migration SQL
```sql
-- P{Phase}{Area}{Number}_migration_name.sql
-- TaskID: P{Phase}{Area}{Number}
-- 작업: [마이그레이션 설명]
-- 담당AI: [AI 이름]
-- 생성일: YYYY-MM-DD

-- Create table
CREATE TABLE IF NOT EXISTS table_name (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_table_name_column ON table_name(column);

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);
```

### 7.3.5 작업 지시서 템플릿

```markdown
# P{Phase}{Area}{Number}: [작업 제목]

## 작업 정보
- **TaskID**: P{Phase}{Area}{Number}
- **Phase**: Phase {N}
- **Area**: {Frontend/Backend/Database/Testing/Security/DevOps}
- **담당AI**: {AI 이름}
- **작업 방식**: AI-Only
- **의존성**: {의존 작업 ID}
- **병렬/순차**: [병렬] 또는 [순차]

## 작업 목표
[명확한 작업 목표 1-2문장]

## 세부 요구사항
1. [요구사항 1]
2. [요구사항 2]
3. [요구사항 3]

## 생성할 파일
- `P{Phase}{Area}{Number}_file1.tsx`
- `P{Phase}{Area}{Number}_file2.ts`

## 참고 자료
- [관련 문서 링크]

## 검증 기준
- [ ] CR 체크리스트 15개 항목 통과
- [ ] 단위 테스트 작성 및 통과
- [ ] 빌드 성공

## 완료 조건
- [ ] 모든 요구사항 충족
- [ ] 테스트 체인 통과 (CR → Test → Build)
- [ ] 종합 검증 보고서 작성 (`docs/P{TaskID}_REPORT.md`)
```

---

## 7.4 FAQ (자주 묻는 질문)

### 프로젝트 그리드 관련

**Q1: TaskID는 어떻게 생성하나요?**
A: `P{Phase}{Area}{Number}{Parallel}` 형식을 따릅니다.
- Phase: 0~6
- Area: F(Frontend), B(Backend), D(Database), T(Testing), S(Security), O(DevOps)
- Number: 순차 번호 (1, 2, 3...)
- Parallel: 병렬 작업인 경우 a, b, c... (선택적)
- 예시: P1F3a (Phase 1, Frontend, 3번 작업, 병렬 a)

**Q2: 의존성 체인은 어떻게 표시하나요?**
A: `→` 기호로 의존 관계를 표시합니다.
- 예시: `P1F1 → P1F2 → P1F3a` (P1F3a는 P1F2에 의존, P1F2는 P1F1에 의존)

**Q3: 병렬 작업과 순차 작업의 차이는?**
A:
- **병렬 작업**: 동시에 수행 가능 (예: P1F3a, P1F3b, P1F3c)
- **순차 작업**: 이전 작업 완료 후 시작 (예: P1D1 → P1D2 → P1D3)

**Q4: Phase Gate는 언제 실행하나요?**
A: 각 Phase의 모든 작업이 완료된 후, 다음 Phase로 넘어가기 전에 실행합니다.

**Q5: 파일 이름에 TaskID를 꼭 포함해야 하나요?**
A: 네, 필수입니다. `{TaskID}_{설명}.{확장자}` 형식을 따라야 추적이 가능합니다.

### 기술 스택 관련

**Q6: Next.js App Router와 Pages Router의 차이는?**
A: App Router는 Next.js 13+의 새로운 라우팅 방식으로, Server Components와 향상된 성능을 제공합니다. 본 프로젝트는 App Router를 사용합니다.

**Q7: Supabase와 Firebase의 차이는?**
A: Supabase는 PostgreSQL 기반의 오픈소스 BaaS이고, Firebase는 NoSQL 기반의 Google BaaS입니다. Supabase는 SQL 쿼리와 RLS를 지원합니다.

**Q8: Zustand를 선택한 이유는?**
A: 경량(~1KB)이고 간단하며, Redux보다 보일러플레이트가 적습니다. UI 상태 관리만 필요하므로 Zustand가 적합합니다.

**Q9: shadcn/ui는 라이브러리인가요?**
A: 엄밀히는 "라이브러리"가 아니라 "컴포넌트 컬렉션"입니다. npm 설치가 아닌 파일 복사 방식으로 사용합니다.

### 개발 프로세스 관련

**Q10: PR을 언제 생성해야 하나요?**
A: 작업 지시서의 모든 요구사항을 충족하고 테스트 체인(CR → Test → Build)을 통과한 후에 생성합니다.

**Q11: 테스트 커버리지가 목표에 미달하면?**
A: 필수 커버리지(75%)는 반드시 충족해야 하며, 목표 커버리지(85%)에 도달하도록 테스트를 추가합니다.

**Q12: 긴급 수정이 필요한 경우 프로세스는?**
A: `hotfix/{TaskID}-{description}` 브랜치를 생성하고, 최소한의 수정 후 빠르게 배포합니다. 이후 정식 작업으로 리팩토링합니다.

**Q13: AI가 작업을 실패한 경우 어떻게 하나요?**
A: ProjectGrid.csv에 블로커(Blocker)를 기록하고, 다른 AI에게 재할당하거나 작업을 세분화합니다.

### 배포 및 운영 관련

**Q14: Vercel 무료 플랜의 제한은?**
A:
- 대역폭: 100GB/월
- Edge Functions: 100GB-Hrs
- Serverless Functions: 1000시간/월
- 초과 시 Pro 플랜($20/월) 업그레이드 필요

**Q15: Supabase 무료 플랜의 제한은?**
A:
- Database: 500MB
- Storage: 1GB
- Edge Functions: 500K 실행/월
- 초과 시 Pro 플랜($25/월) 업그레이드 필요

**Q16: 배포 실패 시 롤백 방법은?**
A: Vercel 대시보드에서 이전 배포로 즉시 롤백 가능하며, GitHub에서도 Revert PR을 통해 롤백할 수 있습니다.

### 보안 관련

**Q17: 환경변수는 어떻게 관리하나요?**
A:
- 로컬: `.env.local` (Git ignore)
- Vercel: 프로젝트 설정 > Environment Variables
- Supabase: API Keys는 Supabase 대시보드에서 복사

**Q18: RLS (Row Level Security)는 필수인가요?**
A: 네, 모든 테이블에 필수입니다. RLS 없이는 데이터 유출 위험이 있습니다.

**Q19: HTTPS는 자동으로 적용되나요?**
A: Vercel은 자동으로 HTTPS를 적용하며, 커스텀 도메인에도 무료 SSL 인증서를 제공합니다.

---

## 7.5 변경 이력

### V1.0 (2025-10-24)
- **작성자**: AI (Claude 3.5 Sonnet)
- **변경 내용**: 초기 버전 작성
- **포함 내용**:
  - Part 1: 프로젝트 개요
  - Part 2: 요구사항 정의
  - Part 3: 시스템 설계
  - Part 4: UI/UX 기획
  - Part 5: 개발 계획 (프로젝트 그리드 방법론 V2.0)
  - Part 6: 품질 관리
  - Part 7: 부록
- **총 페이지 수**: 약 150 페이지
- **총 라인 수**: 약 4,400 라인

### 향후 업데이트 예정
- **V1.1**: Phase 1 완료 후 실제 구현 결과 반영
- **V1.2**: Phase 2 계획 상세화
- **V2.0**: Phase 3 수익화 모델 구체화
- **V2.1**: Phase 4 다중 AI 통합 전략 업데이트
- **V3.0**: Phase 5 아바타 기능 설계 추가

---

## 7.6 문서 끝

### 문서 정보
- **문서명**: PoliticianFinder 통합 프로젝트 기획서
- **버전**: V1.0
- **작성일**: 2025-10-24
- **작성자**: AI (Claude 3.5 Sonnet)
- **승인자**: [프로젝트 오너]
- **다음 리뷰**: Phase 1 완료 후

### 연락처
- **프로젝트 리포지토리**: [GitHub URL]
- **이슈 트래킹**: [GitHub Issues URL]
- **문서 위치**: `G:\내 드라이브\Developement\PoliticianFinder\Developement_Rea_PoliticianFinder\PoliticianFinder_통합_프로젝트_기획서_V1.0.md`

### 라이센스
본 문서는 PoliticianFinder 프로젝트의 내부 문서로, 외부 공개를 금지합니다.

---

**🎉 PoliticianFinder 통합 프로젝트 기획서 V1.0 완성!**

**전체 구성**:
- Part 1: 프로젝트 개요 (15-20 페이지)
- Part 2: 요구사항 정의 (25-30 페이지)
- Part 3: 시스템 설계 (30-35 페이지)
- Part 4: UI/UX 기획 (20-25 페이지)
- Part 5: 개발 계획 - 프로젝트 그리드 방법론 V2.0 (30-35 페이지)
- Part 6: 품질 관리 (20-25 페이지)
- Part 7: 부록 (10-15 페이지)

**총 페이지 수**: 약 150-180 페이지
**총 라인 수**: 4,400+ 라인

---

*문서 작성 완료. Phase 1 개발을 시작하세요!* 🚀
