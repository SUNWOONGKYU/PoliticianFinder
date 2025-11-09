# 작업지시서: P4BA8

## 📋 기본 정보

- **작업 ID**: P4BA8
- **업무명**: 감사 로그 API
- **Phase**: Phase 4
- **Area**: Backend APIs (BA)
- **서브 에이전트**: api-designer
- **작업 방식**: AI-Only

---

## 🎯 작업 목표

모든 관리자 액션을 기록하고 조회하는 감사 로그 시스템을 구축합니다.

---

## 🔧 사용 도구

```
[Claude 도구]
Read, Edit, Write, Grep, Glob, Bash

[기술 스택]
TypeScript, Next.js API Routes, Supabase, Zod

[전문 스킬]
api-builder, db-schema
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

- app/api/admin/audit-logs/route.ts
- lib/audit/logger.ts
- lib/audit/query-builder.ts

**구현해야 할 세부 항목**:

1. **로그 기록**: 모든 관리자 액션 자동 기록
2. **로그 조회**: 필터링, 정렬, 페이지네이션
3. **로그 검색**: 관리자, 액션 타입, 날짜 범위
4. **로그 내보내기**: CSV 다운로드

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
│           └── audit-logs/
│               └── route.ts
└── lib/
    └── audit/
        ├── logger.ts
        └── query-builder.ts
```

**절대 경로 별칭**: `@/` (예: `import ... from '@/lib/audit/logger'`)

---

## 📝 작업 지시사항

### 1. 준비 단계

- 프로젝트 루트 디렉토리에서 작업 시작
- 필요한 도구 확인: TypeScript/Next.js API Routes/Supabase/Zod
- 의존성 작업 완료 확인 (P2D1)

### 2. 구현 단계

**Database 스키마** (P2D1에 추가 필요):
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id),
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_action ON audit_logs(action_type);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

**API Endpoints**:
```typescript
GET /api/admin/audit-logs
Query: {
  adminId?: string;
  actionType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

POST /api/admin/audit-logs
Body: {
  actionType: string;
  targetType?: string;
  targetId?: string;
  details?: object;
}
```

**기록할 액션 타입**:
- user_ban: 사용자 차단
- user_unban: 사용자 차단 해제
- post_delete: 게시글 삭제
- comment_delete: 댓글 삭제
- report_accept: 신고 승인
- report_reject: 신고 거부
- ad_create: 광고 등록
- policy_update: 정책 수정
- system_setting: 시스템 설정 변경

### 3. 검증 단계

- 로그 자동 기록 확인
- 로그 조회 API 동작
- 필터링/검색 기능 확인
- CSV 내보내기 기능
- 성능 테스트 (1만건 이상)

### 4. 완료 단계

- 생성된 파일 목록 확인
- PROJECT GRID 상태 업데이트
- 다음 의존 작업에 영향 확인

---

## ✅ 완료 기준

- [ ] 로그 자동 기록 확인
- [ ] 로그 조회 API 동작
- [ ] 필터링/검색 기능 확인
- [ ] CSV 내보내기 기능
- [ ] 성능 테스트 (1만건 이상)
- [ ] 단위 테스트 작성
- [ ] API 테스트 통과

---

**작업지시서 생성일**: 2025-11-06
**PROJECT GRID Version**: v4.0
