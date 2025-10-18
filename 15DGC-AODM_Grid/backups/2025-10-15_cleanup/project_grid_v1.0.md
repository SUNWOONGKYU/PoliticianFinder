# PoliticianFinder 프로젝트 그리드 (6D-GCDM) v1.0

**프로젝트**: Politician Finder 커뮤니티 플랫폼
**개발 방식**: 1인 + AI 멀티 에이전트 시스템
**목표 기간**: 8주 (2개월)
**생성일**: 2025-01-14

---

## 📊 프로젝트 전체 진행률

| 영역 | 총 작업 | 완료 | 진행률 |
|------|---------|------|--------|
| Frontend | 29개 | 0개 | 0% |
| Backend | 30개 | 0개 | 0% |
| Database | 16개 | 0개 | 0% |
| Test | 11개 | 0개 | 0% |
| DevOps | 11개 | 0개 | 0% |
| AI/ML | 7개 | 0개 | 0% |
| **전체** | **104개** | **0개** | **0%** |

---

## 📋 Phase 1: 프로젝트 초기 설정 (1주차)

### 🎨 Frontend (Phase 1)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| Next.js 14 프로젝트 초기화 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_frontend_init.md) |
| TypeScript 및 Tailwind CSS 설정 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_frontend_config.md) |
| shadcn/ui 컴포넌트 설치 및 설정 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_shadcn_setup.md) |
| 폴더 구조 생성 (src/app, components, lib) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_frontend_structure.md) |
| 회원가입 페이지 개발 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_signup_page.md) |
| 로그인 페이지 개발 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_login_page.md) |
| 인증 상태 관리 (Zustand) 구현 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_auth_store.md) |

### ⚙️ Backend (Phase 1)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| FastAPI 프로젝트 초기화 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_backend_init.md) |
| requirements.txt 작성 및 패키지 설치 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_requirements.md) |
| 환경 변수 설정 (.env) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_env_setup.md) |
| FastAPI 기본 구조 생성 (main.py) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_fastapi_structure.md) |
| JWT 인증 시스템 구현 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_jwt_auth.md) |
| 회원가입 API 개발 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_register_api.md) |
| 로그인 API 개발 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_login_api.md) |
| 현재 사용자 조회 API | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_current_user_api.md) |

### 🗄️ Database (Phase 1)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| SQLAlchemy 모델 정의 (User) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_model_user.md) |
| SQLAlchemy 모델 정의 (Politician) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_model_politician.md) |
| SQLAlchemy 모델 정의 (Post) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_model_post.md) |
| SQLAlchemy 모델 정의 (Comment) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_model_comment.md) |
| SQLAlchemy 모델 정의 (Vote) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_model_vote.md) |
| SQLAlchemy 모델 정의 (Rating) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_model_rating.md) |
| SQLAlchemy 모델 정의 (AIScore) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_model_aiscore.md) |
| SQLAlchemy 모델 정의 (Notification) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_model_notification.md) |
| SQLAlchemy 모델 정의 (Bookmark) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_model_bookmark.md) |
| SQLAlchemy 모델 정의 (Report) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_model_report.md) |
| Alembic 초기화 및 마이그레이션 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_alembic_init.md) |
| 초기 마이그레이션 생성 및 실행 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_initial_migration.md) |
| 테스트 데이터 시딩 스크립트 | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase1_seed_data.md) |

### 🚀 DevOps (Phase 1)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| Supabase PostgreSQL DB 프로비저닝 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_supabase_setup.md) |
| Vercel 프로젝트 생성 및 연결 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_vercel_setup.md) |
| Railway/Render 백엔드 배포 설정 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_railway_setup.md) |
| 환경 변수 설정 (각 플랫폼) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_env_deployment.md) |

### 🤖 AI/ML (Phase 1)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| Claude API 연동 준비 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase1_claude_api_setup.md) |

---

## 📋 Phase 2: 핵심 기능 개발 (2-4주차)

### 🎨 Frontend (Phase 2)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| 정치인 카드 컴포넌트 개발 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_politician_card.md) |
| AI 평가 점수 표시 컴포넌트 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_ai_score_display.md) |
| AI 평가 차트 컴포넌트 (Recharts) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_ai_score_chart.md) |
| 정치인 목록 페이지 개발 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_politician_list.md) |
| 정치인 상세 페이지 개발 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_politician_detail.md) |
| 메인 페이지 AI 랭킹 섹션 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_main_ranking.md) |
| 커뮤니티 게시판 목록 페이지 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_community_list.md) |
| 게시글 상세 페이지 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_post_detail.md) |
| 게시글 작성 페이지 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_post_write.md) |
| PostCard 컴포넌트 (배지 포함) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_post_card.md) |
| 댓글 트리 컴포넌트 (계층 구조) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_comment_tree.md) |
| 투표 버튼 컴포넌트 (⬆️⬇️) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_vote_buttons.md) |

### ⚙️ Backend (Phase 2)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| 정치인 목록 API 개발 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_politicians_list_api.md) |
| 정치인 상세 API 개발 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_politician_detail_api.md) |
| AI 평가 점수 API 개발 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_ai_score_api.md) |
| 정치인 랭킹 API 개발 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_politician_ranking_api.md) |
| 게시글 작성 API | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_post_create_api.md) |
| 게시글 목록 API (필터링/정렬) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_post_list_api.md) |
| 게시글 상세 API | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_post_detail_api.md) |
| 게시글 수정/삭제 API | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_post_update_api.md) |
| 댓글 작성 API | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_comment_create_api.md) |
| 댓글 목록 API (계층 구조) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_comment_list_api.md) |
| 투표 API (upvote/downvote) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_vote_api.md) |
| 베스트글/개념글 자동 마킹 로직 | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase2_best_post_logic.md) |

### 🤖 AI/ML (Phase 2)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| AI 평가 점수 계산 로직 (더미 데이터) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_ai_score_logic.md) |
| 정치인 랭킹 알고리즘 구현 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase2_ranking_algorithm.md) |

### 🧪 Test (Phase 2)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| 인증 API 테스트 (pytest) | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase2_test_auth.md) |
| 게시글 API 테스트 | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase2_test_posts.md) |
| 댓글 API 테스트 | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase2_test_comments.md) |
| 투표 API 테스트 | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase2_test_votes.md) |

---

## 📋 Phase 3: 커뮤니티 기능 강화 (5-6주차)

### 🎨 Frontend (Phase 3)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| 알림 벨 컴포넌트 (헤더) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase3_notification_bell.md) |
| 북마크 버튼 컴포넌트 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase3_bookmark_button.md) |
| 신고 다이얼로그 컴포넌트 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase3_report_dialog.md) |
| 마이페이지 개발 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase3_mypage.md) |
| 정치인 인증 요청 페이지 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase3_politician_auth.md) |
| 관리자 대시보드 페이지 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase3_admin_dashboard.md) |

### ⚙️ Backend (Phase 3)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| 알림 생성 및 조회 API | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase3_notification_api.md) |
| 북마크 추가/제거 API | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase3_bookmark_api.md) |
| 신고 접수 API | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase3_report_api.md) |
| 정치인 인증 요청 API | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase3_politician_auth_api.md) |
| 관리자 게시글 관리 API | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase3_admin_posts_api.md) |
| 관리자 회원 차단 API | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase3_admin_ban_api.md) |
| 관리자 신고 처리 API | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase3_admin_reports_api.md) |

### 🧪 Test (Phase 3)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| 알림 API 테스트 | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase3_test_notifications.md) |
| 북마크 API 테스트 | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase3_test_bookmarks.md) |
| 관리자 API 권한 테스트 | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase3_test_admin_permissions.md) |

---

## 📋 Phase 4: 테스트 & 최적화 (7주차)

### 🎨 Frontend (Phase 4)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| 이미지 최적화 (Next.js Image) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase4_image_optimization.md) |
| 번들 크기 최적화 및 코드 스플리팅 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase4_bundle_optimization.md) |
| Lighthouse 성능 테스트 및 개선 | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase4_lighthouse_test.md) |
| 반응형 디자인 최종 점검 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase4_responsive_check.md) |

### ⚙️ Backend (Phase 4)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| 데이터베이스 쿼리 최적화 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase4_query_optimization.md) |
| N+1 쿼리 문제 해결 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase4_n_plus_one.md) |
| Redis 캐싱 구현 (선택) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase4_redis_caching.md) |
| Rate Limiting 구현 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase4_rate_limiting.md) |
| API 응답 속도 테스트 | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase4_api_speed_test.md) |

### 🗄️ Database (Phase 4)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| 데이터베이스 인덱스 추가 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase4_db_indexes.md) |
| 관계형 쿼리 최적화 (joinedload) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase4_relationship_optimization.md) |

### 🧪 Test (Phase 4)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| 프론트엔드 컴포넌트 단위 테스트 (Vitest) | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase4_test_components.md) |
| E2E 테스트 시나리오 (Playwright) | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase4_e2e_tests.md) |
| 성능 테스트 (부하 테스트) | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase4_load_test.md) |
| 테스트 커버리지 70%+ 달성 | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase4_coverage_check.md) |

### 🤖 AI/ML (Phase 4)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| ChatGPT API 통합 (코드 리뷰) | ChatGPT API | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase4_chatgpt_integration.md) |
| Gemini API 통합 (이미지 분석) | Gemini API | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase4_gemini_integration.md) |
| Perplexity API 통합 (최신 정보) | Perplexity API | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase4_perplexity_integration.md) |
| 외부 AI 의견 종합 서비스 | Claude Code | 0% | ❌ | ❌ | API자동 | [지시서](tasks/phase4_ai_aggregation.md) |

---

## 📋 Phase 5: 베타 런칭 (8주차)

### 🚀 DevOps (Phase 5)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| 프로덕션 배포 (Frontend - Vercel) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase5_deploy_frontend.md) |
| 프로덕션 배포 (Backend - Railway) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase5_deploy_backend.md) |
| 도메인 연결 및 SSL 설정 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase5_domain_ssl.md) |
| Sentry 에러 트래킹 설정 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase5_sentry_setup.md) |
| Uptime 모니터링 설정 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase5_uptime_monitor.md) |
| 로그 수집 도구 설정 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase5_logging_setup.md) |
| CI/CD 파이프라인 구축 (GitHub Actions) | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase5_cicd_pipeline.md) |

### 🗄️ Database (Phase 5)

| 업무 | 담당 AI | 진도 | 완료 | 검증OK | 자동화 | 작업지시서 |
|------|---------|------|------|--------|--------|-----------|
| 데이터베이스 백업 설정 | Claude Code | 0% | ❌ | ❌ | 수동 | [지시서](tasks/phase5_db_backup.md) |

---

## 📊 영역별 통계

| 영역 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | 전체 |
|------|---------|---------|---------|---------|---------|------|
| 🎨 Frontend | 7개 | 12개 | 6개 | 4개 | 0개 | **29개** |
| ⚙️ Backend | 8개 | 12개 | 7개 | 5개 | 0개 | **32개** |
| 🗄️ Database | 13개 | 0개 | 0개 | 2개 | 1개 | **16개** |
| 🧪 Test | 0개 | 4개 | 3개 | 4개 | 0개 | **11개** |
| 🚀 DevOps | 4개 | 0개 | 0개 | 0개 | 7개 | **11개** |
| 🤖 AI/ML | 1개 | 2개 | 0개 | 4개 | 0개 | **7개** |
| **합계** | **33개** | **30개** | **16개** | **19개** | **8개** | **106개** |

---

## 🎯 사용 방법

### 1. 작업 시작하기
```bash
"Claude, Phase 1 Frontend 초기화 작업 시작해줘"
→ 해당 작업 지시서 읽고 실행
→ 진도 자동 업데이트
```

### 2. 진도 체크하기
```bash
"Claude, 전체 프로젝트 진도 체크해줘"
→ 모든 파일 확인
→ 그리드 업데이트
→ 요약 보고
```

### 3. 자동화 테스트 실행
```bash
python automation/automation_manager.py --task backend_integration_test
→ API 자동 호출
→ 테스트 자동 실행
→ 결과 그리드 반영
```

### 4. 버전 업데이트
```bash
"Claude, Frontend에 새 작업 3개 추가해줘"
→ v1.0 → v1.1 생성
→ CHANGELOG 자동 기록
```

---

## 📝 범례

| 기호 | 의미 |
|------|------|
| ✅ | 완료 |
| ⏳ | 진행 중 |
| ❌ | 미착수 |
| 🔴 | 차단됨 |
| 수동 | 수동 작업 |
| API자동 | API 자동화 가능 |

---

**생성일**: 2025-01-14
**버전**: v1.0
**다음 업데이트**: 작업 진행에 따라 수시 업데이트
**변경 이력**: [CHANGELOG.md](CHANGELOG.md) 참조
