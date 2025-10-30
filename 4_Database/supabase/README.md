# Database Area (D) - Supabase

Supabase 데이터베이스 스키마, 마이그레이션, 타입 정의가 위치합니다.

## 디렉토리 구조

```
supabase/
├── migrations/         # SQL 마이그레이션 파일
│   ├── 001_create_users.sql
│   ├── 002_create_politicians.sql
│   ├── 003_create_posts.sql
│   └── ...
├── types/              # TypeScript 타입 정의
│   └── database.types.ts
└── seed/               # 초기 데이터
    └── seed-data.sql
```

## Task ID 헤더 (SQL)

```sql
-- Project Grid Task ID: P1D1
-- 작업명: Users 테이블 생성
-- 생성시간: 2025-10-30 14:30
-- 생성자: Claude-3.5-Sonnet

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  ...
);
```

## Task ID 헤더 (TypeScript)

```typescript
/**
 * Project Grid Task ID: P1D2
 * 작업명: Database 타입 정의
 * 생성시간: 2025-10-30 14:30
 * 생성자: Claude-3.5-Sonnet
 */

export interface Database {
  public: {
    Tables: {
      ...
    }
  }
}
```

## 마이그레이션 명명 규칙

- 형식: `{번호}_{설명}.sql`
- 예: `001_create_users.sql`, `002_add_rls_policies.sql`

## RLS (Row Level Security)

모든 테이블에는 **RLS 정책**을 반드시 적용해야 합니다.
