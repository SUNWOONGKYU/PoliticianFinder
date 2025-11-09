# System Settings Module

**Task ID**: P4BA12
**Version**: 1.0.0
**Last Updated**: 2025-11-09

전역 시스템 설정을 관리하는 모듈입니다. 포인트 규칙, 등급 기준, 기능 토글, 유지보수 모드 등을 제어할 수 있습니다.

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Core Components](#core-components)
4. [API Reference](#api-reference)
5. [Usage Examples](#usage-examples)
6. [Testing](#testing)
7. [Best Practices](#best-practices)

---

## Installation

이 모듈은 프로젝트에 이미 포함되어 있습니다. 추가 설치가 필요하지 않습니다.

### Dependencies

```json
{
  "@supabase/supabase-js": "^2.x",
  "zod": "^3.x",
  "next": "^14.x"
}
```

---

## Quick Start

### 1. 기본 사용법

```typescript
import { SettingsManager } from '@/lib/system/settings-manager';

const settingsManager = new SettingsManager(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 포인트 설정 조회
const points = await settingsManager.getPointSettings();
console.log(points); // { post: 10, comment: 5, ... }

// 설정 업데이트
await settingsManager.updateSetting('points.post', 15);
```

### 2. API 사용법

```typescript
// 관리자: 전체 설정 조회
const response = await fetch('/api/admin/system-settings');
const data = await response.json();

// 일반 사용자: 공개 설정 조회
const publicResponse = await fetch('/api/system-settings/public');
const publicData = await publicResponse.json();
```

---

## Core Components

### 1. SettingsManager

설정 관리의 핵심 클래스

**Features**:
- 설정 CRUD 기능
- 자동 캐싱
- 카테고리별 조회
- 타입 안전성

**Location**: `lib/system/settings-manager.ts`

### 2. CacheManager

인메모리 캐시 관리

**Features**:
- TTL 기반 만료
- 패턴 기반 삭제
- 자동 정리
- 통계 조회

**Location**: `lib/system/cache-manager.ts`

### 3. Middleware Helper

Next.js 미들웨어 유틸리티

**Features**:
- 유지보수 모드 체크
- 기능 활성화 체크
- 제한 검증
- 포인트 계산

**Location**: `lib/system/middleware-helper.ts`

### 4. Types

TypeScript 타입 정의

**Features**:
- 완전한 타입 지원
- 타입 가드
- 기본값 상수

**Location**: `lib/system/types.ts`

---

## API Reference

### SettingsManager

#### 조회 메서드

```typescript
// 단일 설정 조회
getSetting(key: string, useCache?: boolean): Promise<any | null>

// 여러 설정 조회
getSettings(keys: string[]): Promise<Record<string, any>>

// 카테고리별 조회
getSettingsByCategory(category: string): Promise<Record<string, any>>

// 전체 설정 조회
getAllSettings(): Promise<SystemSetting[]>

// 포인트 설정 조회
getPointSettings(): Promise<PointSettings>

// 등급 설정 조회
getRankSettings(): Promise<RankSettings>

// 기능 설정 조회
getFeatureSettings(): Promise<FeatureSettings>

// 유지보수 설정 조회
getMaintenanceSettings(): Promise<MaintenanceSettings>

// 제한 설정 조회
getLimitSettings(): Promise<LimitSettings>
```

#### 업데이트 메서드

```typescript
// 단일 설정 업데이트
updateSetting(key: string, value: any): Promise<{
  success: boolean;
  error?: string;
  data?: SystemSetting;
}>

// 일괄 업데이트
updateSettings(updates: UpdateSettingRequest[]): Promise<{
  success: boolean;
  error?: string;
  updated: number;
}>
```

#### 확인 메서드

```typescript
// 유지보수 모드 확인
isMaintenanceMode(): Promise<boolean>

// 기능 활성화 확인
isFeatureEnabled(feature: string): Promise<boolean>
```

#### 캐시 메서드

```typescript
// 캐시 무효화
clearCache(key?: string): void
```

### CacheManager

```typescript
// 캐시 저장
set<T>(key: string, value: T, ttl?: number): void

// 캐시 조회
get<T>(key: string): T | null

// 캐시 존재 확인
has(key: string): boolean

// 캐시 삭제
delete(key: string): boolean

// 전체 캐시 초기화
clear(): void

// 만료 항목 정리
cleanup(): number

// 패턴 기반 삭제
deletePattern(pattern: string): number

// 캐시 통계
getStats(): { size: number; keys: string[]; ... }

// TTL 조회
getTTL(key: string): number | null

// TTL 연장
extend(key: string, additionalTTL: number): boolean
```

---

## Usage Examples

### Example 1: 포인트 시스템

```typescript
import { getPointsForAction, calculateUserRank } from '@/lib/system/middleware-helper';

// 포인트 지급
const points = await getPointsForAction('post');
await updateUserPoints(userId, points);

// 등급 계산
const rankInfo = await calculateUserRank(userTotalPoints);
console.log(`등급: ${rankInfo.rank}`);
console.log(`다음 등급까지: ${rankInfo.pointsToNextRank}점`);
```

### Example 2: 유지보수 모드

```typescript
// middleware.ts
import { checkMaintenanceMode } from '@/lib/system/middleware-helper';

export async function middleware(request: NextRequest) {
  const maintenanceCheck = await checkMaintenanceMode(request, {
    adminPaths: ['/admin'],
    excludePaths: ['/api/health']
  });

  if (maintenanceCheck) return maintenanceCheck;

  // 정상 처리
}
```

### Example 3: 기능 토글

```typescript
import { checkFeatureEnabled } from '@/lib/system/middleware-helper';

export async function POST(request: NextRequest) {
  // 커뮤니티 기능이 활성화되어 있는지 확인
  const featureCheck = await checkFeatureEnabled(request, 'community');
  if (featureCheck) return featureCheck;

  // 정상 처리
}
```

### Example 4: 업로드 검증

```typescript
import { validateUploadSize } from '@/lib/system/middleware-helper';

const validation = await validateUploadSize(fileSizeMB);
if (!validation.valid) {
  throw new Error(validation.error);
}
```

### Example 5: 제한 검증

```typescript
import { validateLimits } from '@/lib/system/middleware-helper';

const validation = await validateLimits({
  postContent: postText,
  userPostsToday: 10,
  fileSizeMB: 5
});

if (!validation.valid) {
  return NextResponse.json({
    success: false,
    errors: validation.errors
  }, { status: 400 });
}
```

---

## Testing

### Running Tests

```bash
npm test lib/system
```

### Test Coverage

- Unit tests for SettingsManager
- Unit tests for CacheManager
- Integration tests for API endpoints
- Validation tests

### Example Test

```typescript
import { CacheManager } from '@/lib/system/cache-manager';

test('should store and retrieve value', () => {
  const cache = new CacheManager();
  cache.set('test', 'value');
  expect(cache.get('test')).toBe('value');
});
```

---

## Best Practices

### 1. 캐시 사용

```typescript
// ✅ Good: 캐시 사용 (기본)
const value = await settingsManager.getSetting('points.post');

// ⚠️ Use sparingly: 캐시 우회 (필요한 경우에만)
const freshValue = await settingsManager.getSetting('points.post', false);
```

### 2. 일괄 업데이트

```typescript
// ✅ Good: 일괄 업데이트
await settingsManager.updateSettings([
  { key: 'points.post', value: 15 },
  { key: 'points.comment', value: 7 }
]);

// ❌ Bad: 개별 업데이트 반복
await settingsManager.updateSetting('points.post', 15);
await settingsManager.updateSetting('points.comment', 7);
```

### 3. 타입 안전성

```typescript
// ✅ Good: 타입 사용
import { PointSettings } from '@/lib/system/types';

const points: PointSettings = await settingsManager.getPointSettings();

// ❌ Bad: any 타입
const points: any = await settingsManager.getPointSettings();
```

### 4. 에러 처리

```typescript
// ✅ Good: 에러 처리
const result = await settingsManager.updateSetting('points.post', 15);
if (!result.success) {
  console.error('설정 업데이트 실패:', result.error);
}

// ❌ Bad: 에러 무시
await settingsManager.updateSetting('points.post', 15);
```

### 5. 캐시 무효화

```typescript
// ✅ Good: 설정 변경 후 관련 캐시 무효화
await settingsManager.updateSetting('points.post', 15);
// 캐시는 자동으로 무효화됨

// 필요한 경우 수동 무효화
settingsManager.clearCache('points.post');

// ❌ Bad: 전체 캐시 무분별하게 삭제
settingsManager.clearCache(); // 필요한 경우에만
```

---

## File Structure

```
lib/system/
├── settings-manager.ts       # 설정 관리자
├── cache-manager.ts          # 캐시 관리자
├── middleware-helper.ts      # 미들웨어 헬퍼
├── types.ts                  # TypeScript 타입
├── examples.ts               # 사용 예제
├── QUICK_REFERENCE.md        # 빠른 참조
├── README.md                 # 이 문서
└── __tests__/
    └── settings-manager.test.ts  # 테스트
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Related Documentation

- [API Documentation](../../app/api/admin/system-settings/API_DOCUMENTATION.md)
- [Quick Reference](./QUICK_REFERENCE.md)
- [Examples](./examples.ts)
- [Implementation Summary](../../P4BA12_IMPLEMENTATION_SUMMARY.md)

---

## Support

For issues or questions:
1. Check the [Quick Reference](./QUICK_REFERENCE.md)
2. Review [Examples](./examples.ts)
3. Read [API Documentation](../../app/api/admin/system-settings/API_DOCUMENTATION.md)

---

## Changelog

### v1.0.0 (2025-11-09)
- Initial release
- SettingsManager implementation
- CacheManager implementation
- Middleware helpers
- Full TypeScript support
- Comprehensive documentation
