# System Settings API - Quick Reference

**Task ID**: P4BA12

## Quick Start

```typescript
import { SettingsManager } from '@/lib/system/settings-manager';

const settingsManager = new SettingsManager(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 포인트 설정 조회
const points = await settingsManager.getPointSettings();
console.log(points.post); // 10

// 유지보수 모드 확인
const isDown = await settingsManager.isMaintenanceMode();
if (isDown) {
  // 유지보수 모드 처리
}
```

---

## API Endpoints

### Admin API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/system-settings` | 전체 설정 조회 |
| GET | `/api/admin/system-settings?category=points` | 카테고리별 조회 |
| GET | `/api/admin/system-settings?key=points.post` | 특정 키 조회 |
| PATCH | `/api/admin/system-settings` | 설정 업데이트 |
| DELETE | `/api/admin/system-settings/cache` | 캐시 무효화 |

### Public API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/system-settings/public` | 공개 설정 조회 |
| GET | `/api/system-settings/public?check=maintenance` | 유지보수 모드 확인 |

---

## Setting Keys

### Points
- `points.post` - 게시글 작성 (기본: 10)
- `points.comment` - 댓글 작성 (기본: 5)
- `points.like` - 좋아요 (기본: 1)
- `points.follow` - 팔로우 (기본: 20)
- `points.share` - 공유 (기본: 3)
- `points.report` - 신고 (기본: 5)
- `points.verification` - 본인인증 (기본: 100)

### Ranks
- `ranks.bronze` - 브론즈 (기본: 0)
- `ranks.silver` - 실버 (기본: 100)
- `ranks.gold` - 골드 (기본: 500)
- `ranks.platinum` - 플래티넘 (기본: 2000)
- `ranks.diamond` - 다이아몬드 (기본: 10000)

### Features
- `features.community` - 커뮤니티 (기본: true)
- `features.ai_evaluation` - AI 평가 (기본: true)
- `features.notifications` - 알림 (기본: true)
- `features.advertisements` - 광고 (기본: false)
- `features.politician_verification` - 정치인 본인인증 (기본: true)

### Maintenance
- `maintenance.enabled` - 유지보수 모드 (기본: false)
- `maintenance.message` - 점검 메시지 (기본: "서비스 점검 중입니다")
- `maintenance.start_time` - 점검 시작 시간
- `maintenance.end_time` - 점검 종료 시간

### Limits
- `limits.max_upload_size_mb` - 최대 업로드 크기 (기본: 10)
- `limits.max_post_length` - 최대 게시글 길이 (기본: 5000)
- `limits.max_comment_length` - 최대 댓글 길이 (기본: 1000)
- `limits.max_daily_posts` - 일일 최대 게시글 (기본: 50)
- `limits.max_daily_comments` - 일일 최대 댓글 (기본: 100)

---

## Common Tasks

### 1. 포인트 조회
```typescript
const points = await settingsManager.getPointSettings();
// { post: 10, comment: 5, like: 1, ... }
```

### 2. 포인트 변경
```typescript
await settingsManager.updateSetting('points.post', 15);
```

### 3. 유지보수 모드 활성화
```typescript
await settingsManager.updateSettings([
  { key: 'maintenance.enabled', value: true },
  { key: 'maintenance.message', value: '점검 중입니다' }
]);
```

### 4. 기능 비활성화
```typescript
await settingsManager.updateSetting('features.community', false);
```

### 5. 등급 계산
```typescript
const ranks = await settingsManager.getRankSettings();
let userRank = 'bronze';
if (userPoints >= ranks.diamond) userRank = 'diamond';
else if (userPoints >= ranks.platinum) userRank = 'platinum';
// ...
```

### 6. 업로드 크기 검증
```typescript
const limits = await settingsManager.getLimitSettings();
if (fileSizeMB > limits.max_upload_size_mb) {
  throw new Error('파일 크기 초과');
}
```

### 7. 캐시 무효화
```typescript
settingsManager.clearCache(); // 전체
settingsManager.clearCache('points.post'); // 특정 키
```

---

## HTTP Examples

### GET 요청
```bash
# 전체 설정
curl http://localhost:3000/api/admin/system-settings

# 포인트 설정만
curl http://localhost:3000/api/admin/system-settings?category=points

# 특정 키
curl http://localhost:3000/api/admin/system-settings?key=points.post
```

### PATCH 요청
```bash
# 단일 설정
curl -X PATCH http://localhost:3000/api/admin/system-settings \
  -H "Content-Type: application/json" \
  -d '{"key":"points.post","value":15}'

# 일괄 업데이트
curl -X PATCH http://localhost:3000/api/admin/system-settings \
  -H "Content-Type: application/json" \
  -d '{"settings":[{"key":"points.post","value":15},{"key":"points.comment","value":7}]}'
```

### DELETE 요청
```bash
# 전체 캐시 삭제
curl -X DELETE http://localhost:3000/api/admin/system-settings/cache

# 특정 키 캐시 삭제
curl -X DELETE "http://localhost:3000/api/admin/system-settings/cache?key=points.post"
```

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-11-09T10:30:00Z"
}
```

### Error
```json
{
  "success": false,
  "error": "에러 메시지",
  "timestamp": "2025-11-09T10:30:00Z"
}
```

---

## Status Codes

- `200 OK` - 성공
- `201 Created` - 생성 성공
- `400 Bad Request` - 잘못된 요청
- `404 Not Found` - 리소스 없음
- `500 Internal Server Error` - 서버 오류
- `503 Service Unavailable` - 유지보수 모드

---

## TypeScript Types

```typescript
import {
  PointSettings,
  RankSettings,
  FeatureSettings,
  MaintenanceSettings,
  LimitSettings,
  ApiResponse,
} from '@/lib/system/types';

const response: ApiResponse<PointSettings> = await fetch(...).then(r => r.json());
```

---

## Cache TTL

- Default: **5 minutes** (300 seconds)
- 설정 변경 시 자동 무효화
- 수동 무효화 가능

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Related Files

- `lib/system/settings-manager.ts` - 설정 관리자
- `lib/system/cache-manager.ts` - 캐시 관리자
- `lib/system/types.ts` - TypeScript 타입
- `lib/system/examples.ts` - 사용 예제
- `app/api/admin/system-settings/route.ts` - 관리자 API
- `app/api/system-settings/public/route.ts` - 공개 API
- `app/api/admin/system-settings/API_DOCUMENTATION.md` - 전체 문서
