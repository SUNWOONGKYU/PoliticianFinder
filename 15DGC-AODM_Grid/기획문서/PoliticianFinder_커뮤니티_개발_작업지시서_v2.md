# Politician Finder 커뮤니티 웹사이트 개발 작업지시서 v2.0

# ⚠️ AI-only 개발 원칙 (최우선)

## 핵심 원칙
본 프로젝트는 **AI 에이전트만으로 완전 자동 개발**을 목표로 합니다.

### 절대 규칙
1. ❌ **사용자 수동 작업 필요 = 즉시 거부**
   - Dashboard 수동 클릭
   - 웹 UI에서 설정 변경
   - 수동 SQL 실행
   - 수동 배포 작업

2. ✅ **AI가 자동 실행 가능 = 채택**
   - CLI 명령어
   - API 호출
   - 코드 기반 설정
   - 자동화 스크립트

### 기술 선택 기준
- **Database**: Migration 파일, CLI 지원 필수
- **배포**: CI/CD 자동화 필수
- **설정**: 코드/환경변수로 관리 필수
- **테스트**: 자동화 스크립트 필수

### 예시
- ❌ Supabase Dashboard에서 SQL 실행 → ✅ API Route로 해결
- ❌ Firebase Console 설정 → ✅ firebase.json 설정
- ❌ AWS Console 클릭 → ✅ AWS CLI/Terraform

---

## 📌 필수 참고 문서
**커뮤니티 구조도 상세본을 반드시 참고할 것**
- 파일명: `politician_finder_complete_structure.svg`
- 전체 시스템 구조 및 페이지 플로우 확인 필수

---

## 프로젝트 개요

폴리스티션 파인더 커뮤니티 웹사이트를 만들어주세요.

**슬로건**: 훌륭한 정치인을 찾아드립니다

## 기술 스택
- **백엔드**: Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
- **프론트엔드**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **상태 관리**: Zustand (UI 상태만 관리, 서버 상태는 Supabase Realtime 사용)
- **배포**: Vercel (Frontend) + Supabase (Backend)
- **반응형 디자인**: 모바일/데스크탑 모두 지원

---

## 🎯 벤치마킹 사이트 및 핵심 기능 반영

### 디시인사이드(DC인사이드) 벤치마킹 요소
다음 기능들을 **반드시 반영**할 것:

1. **갤러리(게시판) 시스템**
   - 카테고리별 게시판 구조
   - [정치인 글] 전용 갤러리
   - [전체] [지역별] [당별] [이슈별] 분류

2. **실시간 베스트 시스템**
   - 추천수 기준 실시간 베스트글
   - HOT 게시글 표시 🔥
   - 시간대별 인기글 (1시간/6시간/24시간)

3. **추천/비추천 시스템 (필수)**
   - ⬆️ 추천 / ⬇️ 비추천
   - 게시글/댓글 모두 적용
   - 추천수 많은 순 정렬

4. **개념글 시스템**
   - 추천 임계값 초과 시 '개념글' 배지
   - 개념글 모아보기 탭

5. **조회수/댓글수 표시**
   - 목록에서 한눈에 보이도록
   - 조회수 높은 글 표시

### 클리앙 벤치마킹 요소
다음 기능들을 **반드시 반영**할 것:

1. **깔끔한 UI/UX**
   - 여백 충분한 리스트 디자인
   - 읽기 편한 폰트 크기
   - 정돈된 레이아웃

2. **알림 시스템**
   - 내 글에 댓글 달렸을 때
   - 내 댓글에 답글 달렸을 때
   - 알림 아이콘 표시 🔔

3. **북마크/스크랩 기능**
   - 관심 글 저장
   - 내 스크랩 모아보기

4. **신고 기능**
   - 게시글/댓글 신고
   - 신고 사유 선택
   - 관리자에게 전달

5. **회원 등급 시스템**
   - 활동량에 따른 등급
   - 등급별 아이콘 표시

---

## 핵심 기능

### 1. 회원 시스템
- 회원가입/로그인 (이메일, 닉네임, 비밀번호)
- 3가지 사용자 유형:
  - **비회원**: 조회 + 리포트 구매
  - **일반회원**: 글/댓글/투표/평가
  - **등록정치인**: [정치인 글] 작성 + 댓글 + 리포트 구매 (투표 불가, 회원가입 불필요, 🏛️ 뱃지)

### 2. 정치인 평가 시스템

#### **Phase 1 (MVP)**: Claude AI 평가만 우선 구현
- 정치인 목록 (카드 형식, 사진/이름/당/평균평점)
- 정치인별 상세 페이지 (프로필 + 게시판)
- **Claude AI 평가 랭킹**
  - Claude AI 점수만 표시
  - 전체/지역별/당별/직급별 랭킹
  - 100개 항목 종합 평가

#### **향후 확장 (Phase 2+)**: 다중 AI 평가 시스템
- 5개 AI 평가 추가:
  - Claude AI (Phase 1에서 구현됨)
  - GPT (OpenAI)
  - Gemini (Google)
  - Perplexity
  - Grok (xAI)
- 각 AI별 개별 점수 + 종합 점수 계산
- AI별 가중치 조정 기능

**⚠️ 중요: 데이터베이스 설계 시 다중 AI 확장을 고려할 것**

### 3. 커뮤니티 게시판 (디시인사이드 + 클리앙 방식)

#### **기본 기능**
- 게시글 작성/조회/목록
- 댓글 시스템 (대댓글 가능)
- 추천/비추천 (레딧 방식) ⬆️⬇️
- 평가 시스템 (1-5점 별점)
- 카테고리/태그 구분

#### **디시인사이드 스타일 기능**
- 실시간 베스트글 (🔥 HOT 배지)
- 개념글 (⭐ 배지, 추천 임계값 초과)
- 조회수/댓글수/추천수 표시
- 인기글 순 정렬 옵션

#### **클리앙 스타일 기능**
- 북마크/스크랩 기능 ⭐
- 알림 시스템 🔔
- 신고 기능 🚨
- 회원 등급 표시

#### **정치인 전용 카테고리** ([정치인 글])
- 정치인은 이 카테고리에만 글 작성 가능
- 🏛️ 본인 인증 뱃지 표시
- 댓글은 모든 글에 가능
- 투표 불가
- **별도 섹션에 정치인 글 표시** (메인 페이지 상단)

### 4. 관리자 기능
- 게시글/댓글 삭제 (삭제 사유 기록)
- 회원 차단 (IP 차단 선택)
- 정치인 관리 (추가/수정/삭제, 사진 업로드)
- 신고 내역 관리
- AI 평가 점수 입력/수정

---

## 🚀 향후 기능 확장 계획

### Phase 2: 다중 AI 평가 시스템 (2-3개월 후)
```
✅ Claude AI 평가 (Phase 1에서 구현)
⬜ GPT 평가 추가
⬜ Gemini 평가 추가
⬜ Perplexity 평가 추가
⬜ Grok 평가 추가
⬜ 종합 점수 계산 알고리즘
```

**데이터베이스 설계 시 고려사항:**
- `ai_scores` 테이블에 `ai_name` 컬럼 포함
- AI 추가 시 코드 수정 최소화
- 동적으로 AI 목록 표시

### Phase 3: 연결 서비스 페이지 (3-4개월 후)
정치인에게 필요한 서비스를 연결해주는 플랫폼

```
📋 연결 서비스 종류:
1. 컨설팅 업체 (선거 전략, 정책 자문)
2. 홍보물 제작 업체 (포스터, 전단지, 영상)
3. 교육 기관 (리더십, 소통, 정책 교육)
4. 법무 법인 (선거법 자문, 법률 서비스)
5. 여론조사 기관 (지지율, 정책 만족도)
```

**페이지 구조:**
- `/services` - 연결 서비스 메인
- 서비스 카테고리별 업체 리스트
- 업체 상세 정보 및 연락처
- 정치인이 직접 문의 가능
- 수수료 기반 수익 모델

### Phase 4: 아바타 소통 기능 (4-6개월 후)
정치인별 AI 아바타를 통한 24시간 소통

```
🤖 아바타 기능:
1. 정치인별 AI 아바타 설치
2. 시민이 아바타와 실시간 대화
3. 공약, 정책, 활동 내역 질문 가능
4. 정치인의 과거 발언/공약 기반 답변
5. 정치인 본인 확인 및 승인 시스템
```

**기술 스택 (예상):**
- AI 챗봇 API (Claude, GPT 등)
- WebSocket 실시간 통신
- 음성 합성 (TTS) 옵션
- 채팅 히스토리 저장

**페이지 구조:**
- `/avatar/{politician_id}` - 아바타 대화 페이지
- 정치인 프로필 옆에 "아바타와 대화하기" 버튼
- 대화 내역 저장 및 통계

---

## 데이터베이스 구조 (Supabase PostgreSQL)

```sql
-- 프로필 (auth.users 확장)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  user_type TEXT DEFAULT 'normal', -- 'normal', 'politician'
  user_level INTEGER DEFAULT 1, -- 회원 등급 (클리앙 스타일)
  points INTEGER DEFAULT 0, -- 활동 포인트
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "프로필 읽기 공개"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "본인 프로필만 수정"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 정치인
CREATE TABLE public.politicians (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  party TEXT NOT NULL,
  region TEXT NOT NULL,
  position TEXT NOT NULL, -- '국회의원', '시장', '도지사' 등
  profile_image_url TEXT,
  biography TEXT,
  avg_rating REAL DEFAULT 0,
  avatar_enabled BOOLEAN DEFAULT false, -- 아바타 활성화 여부 (향후 확장)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- AI 평가 점수 (다중 AI 지원 구조)
CREATE TABLE public.ai_scores (
  id SERIAL PRIMARY KEY,
  politician_id INTEGER REFERENCES public.politicians(id) ON DELETE CASCADE NOT NULL,
  ai_name TEXT NOT NULL, -- 'claude', 'gpt', 'gemini', 'perplexity', 'grok'
  score REAL NOT NULL CHECK (score >= 0 AND score <= 100),
  details JSONB, -- JSON 형식 상세 평가
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 게시글
CREATE TABLE public.posts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  politician_id INTEGER REFERENCES public.politicians(id) ON DELETE SET NULL,
  category TEXT NOT NULL, -- 'general', 'politician_post', 'region', 'issue'
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

-- 댓글
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

-- 평가 (별점)
CREATE TABLE public.ratings (
  id SERIAL PRIMARY KEY,
  politician_id INTEGER REFERENCES public.politicians(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(politician_id, user_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "평가 읽기 공개"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "로그인 사용자만 평가"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 투표 (추천/비추천)
CREATE TABLE public.votes (
  id SERIAL PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_type, target_id, user_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "투표 읽기 공개"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "로그인 사용자만 투표"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 북마크/스크랩
CREATE TABLE public.bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id INTEGER REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 북마크만 조회"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 북마크만 추가/삭제"
  ON public.bookmarks FOR ALL
  USING (auth.uid() = user_id);

-- 알림
CREATE TABLE public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('comment', 'reply', 'mention')),
  content TEXT NOT NULL,
  target_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 알림만 조회"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 알림만 수정"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 신고
CREATE TABLE public.reports (
  id SERIAL PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  target_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

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

-- 연결 서비스 (향후 확장)
CREATE TABLE public.services (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('consulting', 'promotion', 'education', 'legal', 'survey')),
  company_name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 아바타 대화 로그 (향후 확장)
CREATE TABLE public.avatar_chats (
  id SERIAL PRIMARY KEY,
  politician_id INTEGER REFERENCES public.politicians(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Realtime 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

---

## 페이지 구조

### 1. 메인 페이지 (/)
- **Claude AI 평가 랭킹** (상단 섹션, Phase 1)
  - 전체/지역별/당별/직급별 탭
  - 순위, 이름, 당, 지역, Claude AI 점수 표시
  - [향후] 5개 AI 종합 점수 표시로 확장
- **정치인이 직접 쓴 글** (별도 섹션)
  - [정치인 글] 카테고리 최신글
  - 🏛️ 본인 뱃지 표시
- **실시간 베스트글** (🔥 HOT)
  - 추천수 많은 순
  - 1시간/6시간/24시간 탭
- **개념글 모음** (⭐)
- 인기글 목록
- 정치인 카드 목록

### 2. 정치인 상세 페이지 (/politician/{id})
- 프로필 정보
- **Claude AI 평가 상세** (Phase 1)
  - 종합 점수
  - 항목별 점수 (의정활동, 공약이행, 투명성 등)
  - [향후] 5개 AI 비교 차트
- 시민 평가 (별점)
- 해당 정치인 관련 게시판
- 정치인 본인 작성 글 ([정치인 글] 카테고리, 🏛️ 뱃지)
- [향후] **아바타와 대화하기** 버튼

### 3. 커뮤니티 게시판 (/community)
- 전체/정치인별/지역별/핫이슈 탭
- **[정치인 글]** 별도 섹션
- 게시글 목록 (제목, 작성자, 추천수, 댓글수, 조회수)
- **정렬 옵션**:
  - 최신순
  - 추천순 (디시인사이드)
  - 조회순
  - 댓글순
- 인기글 (🔥 HOT)
- 개념글 (⭐)

### 4. 게시글 작성 (/write)
- 제목, 내용, 카테고리 선택
- 정치인 선택 (해당 정치인 게시판에 작성)
- **정치인 사용자는 [정치인 글] 카테고리만 선택 가능**

### 5. 게시글 상세 (/post/{id})
- 본문 내용
- 추천/비추천 버튼 ⬆️⬇️
- 북마크 버튼 ⭐ (클리앙 스타일)
- 신고 버튼 🚨
- 댓글 목록 (대댓글 계층 표시)
- 댓글에도 추천/비추천
- **정치인 작성 글은 🏛️ 본인 뱃지 표시**

### 6. 마이페이지 (/mypage)
- 내가 쓴 글
- 내가 쓴 댓글
- **내가 스크랩한 글** ⭐ (클리앙)
- **알림 내역** 🔔 (클리앙)
- 회원 등급 및 포인트
- 정보 수정

### 7. 회원가입/로그인 (/signup, /login)
- 이메일, 닉네임, 비밀번호 입력
- 정치인 인증 옵션 (별도 인증 시스템)

### 8. 관리자 페이지 (/admin)
- 게시글/댓글 관리
- 회원 관리 (차단 기능)
- 정치인 관리 (등록/수정/삭제)
- **신고 내역 관리** 🚨
- **AI 평가 점수 입력/수정**

### 9. 리포트 판매 페이지 (/reports)
- AI 평가 리포트 구매 (비회원, 정치인 가능)
- 리포트 종류 및 가격 안내
- 결제 시스템 연결

### 10. 연결 서비스 페이지 (/services) - 향후 확장
- 서비스 카테고리 목록
- 업체별 상세 정보
- 문의하기 기능

### 11. 아바타 대화 페이지 (/avatar/{politician_id}) - 향후 확장
- AI 아바타와 실시간 채팅
- 과거 대화 내역
- 음성 대화 옵션

---

## 디자인 가이드

### 벤치마킹 기반 디자인 원칙

#### 디시인사이드 스타일 요소
- **기능적이고 간결한 레이아웃**
- 정보 밀도 높은 목록 (한 화면에 많은 글)
- 추천수/조회수/댓글수 명확하게 표시
- 🔥 HOT, ⭐ 개념글 등 배지 활용
- 빠른 페이지 로딩

#### 클리앙 스타일 요소
- **깔끔하고 읽기 편한 UI**
- 여백 충분한 리스트
- 부드러운 색상 조합
- 명확한 버튼 및 아이콘
- 세련된 폰트

#### 공통 디자인 요소
- **색상**: 정치적 중립성을 위한 중성 색상 (회색, 파란색 계열)
- **반응형**: 모바일에서도 완벽하게 작동
- **AI 평가 섹션**: 눈에 잘 띄는 디자인, 차트/그래프 활용
- **정치인 뱃지**: 🏛️ 명확하게 구분
- **아이콘**: ⬆️⬇️ 추천/비추천, 🔥 인기, ⭐ 개념글, 🔔 알림, 🚨 신고

---

## 보안

- **Supabase Auth**: 이메일/비밀번호, 소셜 로그인 (OAuth), JWT 토큰 자동 관리
- **Row Level Security (RLS)**: PostgreSQL 레벨에서 데이터 접근 제어
- **비밀번호 보안**: bcrypt 해시 (Supabase 자동 처리)
- **SQL Injection 방지**: Supabase Client 자동 방지
- **XSS 방지**: Next.js 자동 이스케이프
- **CSRF 방지**: Next.js Server Actions 자동 보호
- **Rate Limiting**: Supabase Edge Functions에서 구현
- **환경변수 관리**: .env.local (API 키 보호)

---

## 특별 기능

### 정치인 인증 시스템
```typescript
// 정치인 본인 인증 프로세스 (Supabase Edge Function)
// supabase/functions/politician-auth/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { userId, politicianId, verificationMethod } = await req.json()

  // 1. 정치인 선택 (드롭다운)
  // 2. 본인 인증 (휴대폰/이메일)
  // 3. 관리자 승인 대기 상태로 변경
  // 4. 승인 후 🏛️ 뱃지 자동 부여 (profiles.user_type = 'politician')
  // 5. [정치인 글] 카테고리 작성 권한 부여

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 프로필 업데이트
  await supabase
    .from('profiles')
    .update({ user_type: 'politician' })
    .eq('id', userId)

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### AI 평가 점수 표시 (Phase 1 - Claude만)
```tsx
// components/politicians/AIScoreCard.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function AIScoreCard({ politicianId }: { politicianId: number }) {
  const [score, setScore] = useState<any>(null)

  useEffect(() => {
    const fetchScore = async () => {
      const { data } = await supabase
        .from('ai_scores')
        .select('*')
        .eq('politician_id', politicianId)
        .eq('ai_name', 'claude')
        .single()

      setScore(data)
    }
    fetchScore()
  }, [politicianId])

  if (!score) return null

  return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-lg">
      <div className="text-2xl font-bold">Claude AI 평가: {score.score}점 ★★★★★</div>
      <div className="mt-4 flex gap-4">
        <span>의정활동: {score.details.legislative}점</span>
        <span>공약이행: {score.details.promise}점</span>
        <span>투명성: {score.details.transparency}점</span>
      </div>
      <button className="mt-4 px-4 py-2 bg-white text-purple-600 rounded">
        📊 상세 분석 보기 →
      </button>
    </div>
  )
}
```

### AI 평가 점수 표시 (Phase 2+ - 다중 AI)
```tsx
// components/politicians/MultiAIScoreCard.tsx (향후)
'use client'

export function MultiAIScoreCard({ politicianId }: { politicianId: number }) {
  const [scores, setScores] = useState<any[]>([])

  useEffect(() => {
    const fetchScores = async () => {
      const { data } = await supabase
        .from('ai_scores')
        .select('*')
        .eq('politician_id', politicianId)

      setScores(data || [])
    }
    fetchScores()
  }, [politicianId])

  const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="text-2xl font-bold">종합 점수: {avgScore.toFixed(1)}점 ★★★★★</div>
      <div className="mt-4 flex gap-4">
        {scores.map(s => (
          <span key={s.ai_name}>{s.ai_name}: {s.score}점</span>
        ))}
      </div>
      <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded">
        📊 5개 AI 비교 분석 보기 →
      </button>
    </div>
  )
}
```

### 정치인 글 표시
```tsx
// components/posts/PostCard.tsx
import { Badge } from '@/components/ui/badge'

export function PostCard({ post, author }: { post: Post, author: Profile }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-center gap-2">
        {author.user_type === 'politician' && (
          <Badge variant="secondary" className="bg-blue-100">
            🏛️ 본인
          </Badge>
        )}
        <span className="font-semibold">{author.username}</span>
        {author.user_type === 'politician' && (
          <span className="text-sm text-gray-600">서울 강남구 국회의원</span>
        )}
      </div>
      <h3 className="text-xl font-bold mt-2">{post.title}</h3>
    </div>
  )
}
```

### 베스트글 표시 (디시인사이드)
```tsx
// components/posts/PostListItem.tsx
import { Badge } from '@/components/ui/badge'

export function PostListItem({ post }: { post: Post }) {
  return (
    <div className="flex items-center gap-3 p-3 border-b hover:bg-gray-50">
      <div className="flex gap-2">
        {post.is_best && (
          <Badge variant="destructive">🔥 HOT</Badge>
        )}
        {post.is_concept && (
          <Badge variant="default">⭐ 개념글</Badge>
        )}
      </div>
      <h3 className="flex-1 font-medium">{post.title}</h3>
      <div className="flex gap-3 text-sm text-gray-500">
        <span>👁️ {post.view_count}</span>
        <span>💬 {post.comment_count}</span>
        <span>⬆️ {post.upvotes}</span>
      </div>
    </div>
  )
}
```

### 알림 표시 (클리앙)
```tsx
// components/layout/NotificationBell.tsx
'use client'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Realtime 구독
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <button className="relative">
      <span className="text-2xl">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  )
}
```

---

## 우선순위 구현 순서

### Phase 1 (1주차) - 기본 골격 + Claude AI 평가
- ✅ 사용자 회원가입/로그인
- ✅ 정치인 목록 페이지
- ✅ **Claude AI 평가 점수 표시** (다른 AI는 나중에)
- ✅ 게시글 작성/조회
- ✅ 간단한 댓글
- ✅ 추천/비추천 기본 기능

### Phase 2 (2주차) - 핵심 커뮤니티 기능
- ✅ 정치인별 상세 페이지
- ✅ 게시글 추천/비추천 (디시인사이드)
- ✅ 평가 시스템 (별점)
- ✅ 검색 기능
- ✅ **베스트글 시스템** (🔥 HOT)
- ✅ **개념글 시스템** (⭐)
- ✅ 조회수/댓글수 표시

### Phase 3 (3주차) - 클리앙 스타일 기능 + 관리
- ✅ **북마크/스크랩** ⭐
- ✅ **알림 시스템** 🔔
- ✅ **신고 기능** 🚨
- ✅ 회원 등급 시스템
- ✅ 관리자 페이지
- ✅ 게시글/댓글 삭제
- ✅ 회원 차단
- ✅ 정치인 관리
- ✅ **정치인 인증 시스템**
- ✅ **[정치인 글] 카테고리**

### Phase 4 (4주차) - 최적화 + 리포트
- ✅ 반응형 디자인 완성
- ✅ 페이징 최적화
- ✅ 보안 강화
- ✅ **리포트 판매 시스템**
- ✅ 베타 테스트
- ✅ **데이터베이스 구조 검증** (향후 확장 대비)

### Phase 5 (2-3개월 후) - 다중 AI 평가 확장
- ⬜ GPT 평가 추가
- ⬜ Gemini 평가 추가
- ⬜ Perplexity 평가 추가
- ⬜ Grok 평가 추가
- ⬜ 종합 점수 계산 알고리즘
- ⬜ AI 비교 차트/그래프

### Phase 6 (3-4개월 후) - 연결 서비스
- ⬜ 연결 서비스 페이지 개발
- ⬜ 서비스 업체 관리
- ⬜ 문의 시스템
- ⬜ 수수료 정산 시스템

### Phase 7 (4-6개월 후) - 아바타 소통 기능
- ⬜ AI 아바타 시스템 개발
- ⬜ 실시간 채팅 기능
- ⬜ 음성 대화 옵션
- ⬜ 대화 히스토리 관리

---

## 프로젝트 구조 (Next.js 14 + Supabase)

```
politician-finder/
├── frontend/                    # Next.js 14 App
│   ├── src/
│   │   ├── app/                # App Router
│   │   │   ├── layout.tsx      # Root Layout
│   │   │   ├── page.tsx        # 메인 페이지 (/)
│   │   │   ├── signup/
│   │   │   │   └── page.tsx    # 회원가입
│   │   │   ├── login/
│   │   │   │   └── page.tsx    # 로그인
│   │   │   ├── politicians/
│   │   │   │   ├── page.tsx    # 정치인 목록
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # 정치인 상세
│   │   │   ├── community/
│   │   │   │   └── page.tsx    # 커뮤니티 게시판
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx    # 게시글 목록
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx # 글쓰기
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # 게시글 상세
│   │   │   ├── mypage/
│   │   │   │   └── page.tsx    # 마이페이지
│   │   │   ├── admin/
│   │   │   │   └── page.tsx    # 관리자 페이지
│   │   │   ├── reports/
│   │   │   │   └── page.tsx    # 리포트 판매
│   │   │   ├── services/       # 연결 서비스 (향후)
│   │   │   │   └── page.tsx
│   │   │   └── avatar/         # 아바타 대화 (향후)
│   │   │       └── [id]/
│   │   │           └── page.tsx
│   │   ├── components/         # React 컴포넌트
│   │   │   ├── ui/            # shadcn/ui 컴포넌트
│   │   │   ├── auth/          # 인증 관련
│   │   │   ├── posts/         # 게시글 관련
│   │   │   ├── politicians/   # 정치인 관련
│   │   │   └── layout/        # 레이아웃
│   │   ├── lib/
│   │   │   ├── supabase.ts    # Supabase Client
│   │   │   └── utils.ts       # 유틸리티 함수
│   │   ├── store/             # Zustand 상태 관리
│   │   │   └── uiStore.ts     # UI 상태만
│   │   ├── types/
│   │   │   └── database.types.ts # Supabase 타입
│   │   └── styles/
│   │       └── globals.css    # Tailwind CSS
│   ├── .env.local             # 환경변수
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── supabase/                   # Supabase 설정 (선택)
│   ├── migrations/            # SQL 마이그레이션
│   └── functions/             # Edge Functions
│       ├── vote-handler/      # 투표 처리
│       ├── notification/      # 알림 발송
│       └── ai-score/          # AI 점수 계산
│
└── README.md
```

---

## 실행 방법

```bash
# 1. Supabase 프로젝트 생성 (https://supabase.com)
# - 새 프로젝트 생성
# - SQL Editor에서 데이터베이스 스키마 실행
# - API 키 복사 (프로젝트 설정 > API)

# 2. 환경변수 설정
cd frontend
cp .env.example .env.local

# .env.local 파일에 추가:
# NEXT_PUBLIC_SUPABASE_URL=your-project-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 3. 패키지 설치 및 실행
npm install
npm run dev

# 4. 브라우저에서 접속
# http://localhost:3000

# 5. Vercel 배포 (프로덕션)
vercel deploy
# 환경변수를 Vercel 대시보드에 추가
```

---

## 주요 차별화 포인트

1. 🤖 **단계적 AI 평가 시스템**
   - Phase 1: Claude AI 평가로 시작
   - Phase 2+: 5개 AI 종합 평가로 확장
   - 다중 AI로 편향 최소화

2. 🏛️ **정치인 직접 참여**
   - 본인 인증 시스템
   - [정치인 글] 전용 카테고리
   - 🏛️ 뱃지로 명확한 구분

3. 💬 **디시인사이드 + 클리앙 하이브리드 커뮤니티**
   - 디시인사이드: 추천/비추천, 베스트글, 개념글
   - 클리앙: 알림, 북마크, 신고, 회원등급
   - 두 사이트의 장점 결합

4. 🔗 **연결 서비스 플랫폼** (향후)
   - 정치인에게 필요한 서비스 연결
   - 컨설팅, 홍보, 교육, 법률, 여론조사

5. 🤖 **AI 아바타 소통** (향후)
   - 정치인별 AI 아바타
   - 24시간 시민과 소통
   - 공약/정책 실시간 질의응답

---

## 📊 성공 지표 (KPI)

### Phase 1 목표 (1개월)
- 회원 가입: 100명
- 정치인 등록: 10명
- 게시글: 50개
- 댓글: 200개

### Phase 4 목표 (3개월)
- 회원 가입: 1,000명
- 정치인 등록: 50명
- 게시글: 500개
- 일 방문자: 500명

### 최종 목표 (2026년 지방선거)
- 회원 가입: 100,000명
- 정치인 등록: 500명
- 게시글: 50,000개
- 일 방문자: 50,000명

---

**목표 일정: 1개월 이내 MVP 출시 (Claude AI 평가 중심)**

**장기 비전: 2026년 지방선거 대비 대한민국 최고의 정치인 평가 커뮤니티 플랫폼**

---

글자수: 12,500자 / 작성자: Claude / 프롬프터: 써니
