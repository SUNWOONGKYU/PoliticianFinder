# Phase 3 Backend API Documentation

## Overview
Phase 3에서 구현된 커뮤니티 기능 API 엔드포인트 문서입니다.

## 구현 완료된 API 목록

### 1. 알림 API (P3B1, P3B4, P3B6)

#### POST /api/notifications
- **설명**: 새로운 알림 생성 (주로 내부 API에서 사용)
- **인증**: 불필요 (내부 호출용)
- **Request Body**:
```json
{
  "user_id": "uuid",
  "type": "comment|reply|like|rating|mention|system",
  "title": "알림 제목",
  "message": "알림 메시지",
  "link": "/politicians/123#comment-456",
  "metadata": {},
  "sender_id": "uuid"
}
```

#### GET /api/notifications
- **설명**: 사용자 알림 목록 조회
- **인증**: 필수
- **Query Parameters**:
  - `type`: 알림 타입 필터
  - `status`: unread|read|archived
  - `page`: 페이지 번호 (기본값: 1)
  - `limit`: 페이지당 항목 수 (기본값: 20, 최대: 100)
  - `startDate`: 시작 날짜 필터
  - `endDate`: 종료 날짜 필터

#### GET /api/notifications/unread
- **설명**: 읽지 않은 알림 목록 조회
- **인증**: 필수
- **Query Parameters**:
  - `page`: 페이지 번호
  - `limit`: 페이지당 항목 수

#### GET /api/notifications/count
- **설명**: 알림 개수 통계 조회
- **인증**: 필수
- **Response**:
```json
{
  "success": true,
  "data": {
    "total": 50,
    "unread": 12,
    "by_type": {
      "comment": 5,
      "reply": 3,
      "like": 4
    }
  }
}
```

#### PUT /api/notifications/[id]/read
- **설명**: 특정 알림을 읽음으로 표시
- **인증**: 필수
- **Parameters**: `id` - 알림 ID

#### PUT /api/notifications/read-all
- **설명**: 모든 알림 또는 선택한 알림들을 읽음으로 표시
- **인증**: 필수
- **Request Body**:
```json
{
  "notification_ids": [1, 2, 3],  // 특정 알림들만
  "all": true                      // 모든 알림
}
```

### 2. 댓글 API (P3B2)

#### POST /api/comments
- **설명**: 새로운 댓글 생성
- **인증**: 필수
- **Request Body**:
```json
{
  "politician_id": 123,
  "content": "댓글 내용",
  "parent_id": null  // 대댓글인 경우 부모 댓글 ID
}
```

#### GET /api/comments
- **설명**: 댓글 목록 조회
- **Query Parameters**:
  - `politician_id` (필수): 정치인 ID
  - `parent_id`: 부모 댓글 ID (null이면 원댓글만)
  - `page`: 페이지 번호
  - `limit`: 페이지당 항목 수
  - `sortBy`: created_at|like_count|reply_count
  - `sortOrder`: asc|desc

#### PUT /api/comments/[id]
- **설명**: 댓글 수정 (작성자만 가능)
- **인증**: 필수
- **Request Body**:
```json
{
  "content": "수정된 댓글 내용"
}
```

#### DELETE /api/comments/[id]
- **설명**: 댓글 삭제 (소프트 삭제, 작성자만 가능)
- **인증**: 필수

### 3. 대댓글 API (P3B3)

#### POST /api/comments/[id]/replies
- **설명**: 특정 댓글에 대댓글 생성
- **인증**: 필수
- **Parameters**: `id` - 부모 댓글 ID
- **Request Body**:
```json
{
  "content": "대댓글 내용",
  "politician_id": 123
}
```

#### GET /api/comments/[id]/replies
- **설명**: 특정 댓글의 모든 대댓글 조회
- **Parameters**: `id` - 부모 댓글 ID
- **Query Parameters**:
  - `page`: 페이지 번호
  - `limit`: 페이지당 항목 수
  - `sortOrder`: asc|desc

### 4. 좋아요 API (P3B5)

#### POST /api/likes
- **설명**: 좋아요 추가
- **인증**: 필수
- **Request Body**:
```json
{
  "target_id": 123,
  "target_type": "rating|comment"
}
```

#### DELETE /api/likes
- **설명**: 좋아요 취소
- **인증**: 필수
- **Query Parameters**:
  - `target_id`: 대상 ID
  - `target_type`: rating|comment

#### GET /api/likes/check
- **설명**: 특정 대상의 좋아요 상태 확인
- **Query Parameters**:
  - `target_id`: 대상 ID
  - `target_type`: rating|comment
- **Response**:
```json
{
  "success": true,
  "data": {
    "is_liked": true,
    "like_count": 42
  }
}
```

## TypeScript 타입 정의

### 주요 타입 위치
- `G:\내 드라이브\Developement\PoliticianFinder\frontend\src\types\community.ts`

### 주요 타입
- `Notification`: 알림 데이터
- `Comment`, `CommentWithProfile`: 댓글 데이터
- `Like`: 좋아요 데이터
- `NotificationType`: 알림 타입 enum
- `CommentStatus`: 댓글 상태 enum
- `LikeType`: 좋아요 타입 enum

## 기능 특징

### 알림 시스템
- 댓글, 대댓글, 좋아요 시 자동 알림 생성
- 읽음/읽지 않음 상태 관리
- 타입별 필터링 지원
- 일괄 읽음 처리 가능

### 댓글 시스템
- 2단계 계층 구조 (원댓글, 대댓글)
- 소프트 삭제로 대화 맥락 유지
- 좋아요 기능 연동
- 프로필 정보 포함 조회

### 좋아요 시스템
- 평가와 댓글에 대한 좋아요 지원
- 중복 좋아요 방지
- 자기 콘텐츠 좋아요 방지
- 실시간 카운트 업데이트

## 에러 처리
- 일관된 에러 응답 형식
- HTTP 상태 코드 준수
- 상세한 에러 메시지 제공

## 보안 고려사항
- 모든 수정/삭제 작업에 작성자 검증
- 인증된 사용자만 컨텐츠 생성 가능
- SQL 인젝션 방지 (Supabase 파라미터 바인딩)
- 입력 데이터 유효성 검증