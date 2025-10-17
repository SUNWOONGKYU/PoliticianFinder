# Phase 3 Backend API 작업 목록

## 완료된 작업
- [x] 프로젝트 구조 파악
- [x] 기존 API 패턴 분석
- [x] TypeScript 타입 구조 확인
- [x] P3B1: 알림 API 구현
  - [x] 알림 타입 정의 (community.ts)
  - [x] POST /api/notifications - 알림 생성
  - [x] GET /api/notifications - 알림 조회
- [x] P3B2: 댓글 CRUD API 구현
  - [x] 댓글 타입 정의 (community.ts)
  - [x] POST /api/comments - 댓글 생성
  - [x] GET /api/comments - 댓글 조회
  - [x] PUT /api/comments/[id] - 댓글 수정
  - [x] DELETE /api/comments/[id] - 댓글 삭제
- [x] P3B3: 대댓글 API 구현
  - [x] POST /api/comments/[id]/replies - 대댓글 생성
  - [x] GET /api/comments/[id]/replies - 대댓글 조회
  - [x] 대댓글 계층 구조 처리 (depth 제한)
- [x] P3B4: 알림 조회 API 구현
  - [x] GET /api/notifications/unread - 읽지 않은 알림
  - [x] GET /api/notifications/count - 알림 개수
- [x] P3B5: 좋아요 API 구현
  - [x] POST /api/likes - 좋아요 추가
  - [x] DELETE /api/likes - 좋아요 취소
  - [x] GET /api/likes/check - 좋아요 상태 확인
- [x] P3B6: 알림 읽음 처리 구현
  - [x] PUT /api/notifications/[id]/read - 개별 읽음
  - [x] PUT /api/notifications/read-all - 전체 읽음