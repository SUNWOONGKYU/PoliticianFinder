# 작업지시서: P4BA9

## 📋 기본 정보

- **작업 ID**: P4BA9
- **업무명**: 광고 관리 API
- **Phase**: Phase 4
- **Area**: Backend APIs (BA)
- **서브 에이전트**: api-designer
- **작업 방식**: AI-Only

---

## 🎯 작업 목표

광고 등록, 수정, 삭제 및 노출 관리 API를 구축합니다.

---

## 🔧 사용 도구

```
[Claude 도구]
Read, Edit, Write, Grep, Glob, Bash

[기술 스택]
TypeScript, Next.js API Routes, Supabase, Zod

[전문 스킬]
api-builder, fullstack-dev
```

**도구 설명**:
- **Claude 도구**: Claude Code의 기본 기능 (Read, Write, Edit, Bash, Glob, Grep 등)
- **기술 스택**: 프로젝트에 사용되는 프레임워크 및 라이브러리
- **전문 스킬**: Anthropic 빌트인 스킬 (.claude/skills/*.md 참조)

## 🔗 의존성 정보

**의존성 체인**: P2D1

이 작업을 시작하기 전에 다음 작업이 완료되어야 합니다: P2D1 (Database 스키마)

---

## 📦 기대 결과물

- app/api/admin/ads/route.ts
- app/api/admin/ads/[id]/route.ts
- lib/ads/placement-manager.ts

**구현해야 할 세부 항목**:

1. **광고 등록**: 이미지, 링크, 노출 기간 설정
2. **광고 수정**: 정보 변경
3. **광고 삭제**: 소프트 삭제
4. **광고 통계**: 클릭수, 노출수 조회
5. **노출 위치 관리**: 메인, 사이드바, 게시글 상단 등

각 항목을 체계적으로 구현하고 테스트하세요.

---

## 💾 구현 파일 저장 위치

**루트 폴더**: `3_Backend_APIs/`

**파일 경로**:
```
3_Backend_APIs/
├── app/
│   └── api/
│       └── admin/
│           └── ads/
│               ├── route.ts
│               └── [id]/
│                   └── route.ts
└── lib/
    └── ads/
        └── placement-manager.ts
```

**절대 경로 별칭**: `@/` (예: `import ... from '@/lib/ads/placement-manager'`)

---

## 📝 작업 지시사항

### 1. 준비 단계

- 프로젝트 루트 디렉토리에서 작업 시작
- 필요한 도구 확인: TypeScript/Next.js API Routes/Supabase/Zod
- 의존성 작업 완료 확인 (P2D1)

### 2. 구현 단계

**Database 스키마** (P2D1에 추가 필요):
```sql
CREATE TABLE advertisements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  placement VARCHAR(50) NOT NULL, -- main, sidebar, post_top
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ads_placement ON advertisements(placement);
CREATE INDEX idx_ads_active ON advertisements(is_active);
CREATE INDEX idx_ads_dates ON advertisements(start_date, end_date);
```

**API Endpoints**:
```typescript
GET /api/admin/ads - 광고 목록
POST /api/admin/ads - 광고 등록
GET /api/admin/ads/[id] - 광고 상세
PATCH /api/admin/ads/[id] - 광고 수정
DELETE /api/admin/ads/[id] - 광고 삭제
GET /api/admin/ads/stats - 광고 통계
```

**광고 노출 위치**:
- main: 메인 페이지 상단
- sidebar: 사이드바
- post_top: 게시글 상단
- post_bottom: 게시글 하단

### 3. 검증 단계

- CRUD 기능 모두 동작
- 이미지 업로드 확인
- 통계 집계 확인
- 노출 기간 자동 관리
- API 테스트 통과

### 4. 완료 단계

- 생성된 파일 목록 확인
- PROJECT GRID 상태 업데이트
- 다음 의존 작업에 영향 확인

---

## ✅ 완료 기준

- [ ] CRUD 기능 모두 동작
- [ ] 이미지 업로드 확인
- [ ] 통계 집계 확인
- [ ] 노출 기간 자동 관리
- [ ] API 테스트 통과
- [ ] 단위 테스트 작성

---

**작업지시서 생성일**: 2025-11-06
**PROJECT GRID Version**: v4.0
