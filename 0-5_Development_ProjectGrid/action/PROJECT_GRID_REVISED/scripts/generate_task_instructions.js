// Generate all 63 task instruction files for PROJECT_GRID_REVISED
const fs = require('fs');
const path = require('path');

// Task data from CSV
const tasks = [
  { phase: 1, area: 'F', id: 'P1F1', name: 'React 전체 페이지 변환', desc: '프로토타입 28개 + 개선 5개 페이지를 React로 변환' },
  { phase: 1, area: 'BI', id: 'P1BI1', name: 'Supabase 클라이언트 설정', desc: 'Supabase 클라이언트 초기화 (서버/클라이언트 분리)' },
  { phase: 1, area: 'BI', id: 'P1BI2', name: 'API 미들웨어', desc: '인증 미들웨어 + 에러 핸들링 미들웨어' },
  { phase: 1, area: 'BI', id: 'P1BI3', name: 'Database Types 생성', desc: 'Supabase Schema → TypeScript Types 자동 생성' },
  { phase: 1, area: 'BA', id: 'P1BA1', name: '회원가입 API (Mock)', desc: 'Mock 데이터로 회원가입 처리' },
  { phase: 1, area: 'BA', id: 'P1BA2', name: 'Google OAuth API (Mock)', desc: 'Mock Google OAuth 콜백 처리' },
  { phase: 1, area: 'BA', id: 'P1BA3', name: '로그인 API (Mock)', desc: 'Mock 데이터로 로그인 처리' },
  { phase: 1, area: 'BA', id: 'P1BA4', name: '비밀번호 재설정 API (Mock)', desc: 'Mock 이메일 전송 처리' },
  { phase: 1, area: 'BA', id: 'P1BA5', name: '토큰 갱신 API (Mock)', desc: 'Mock 토큰 갱신 처리' },
  { phase: 1, area: 'BA', id: 'P1BA6', name: '로그아웃 API (Mock)', desc: 'Mock 로그아웃 처리' },
  { phase: 1, area: 'BA', id: 'P1BA7', name: '정치인 목록 API (Mock)', desc: 'Mock 정치인 목록 반환' },
  { phase: 1, area: 'BA', id: 'P1BA8', name: '정치인 상세 API (Mock)', desc: 'Mock 정치인 상세 정보 반환' },
  { phase: 1, area: 'BA', id: 'P1BA9', name: '정치인 관심 등록 API (Mock)', desc: 'Mock 관심 등록/해제' },
  { phase: 1, area: 'BA', id: 'P1BA10', name: '정치인 본인 인증 API (Mock)', desc: 'Mock 정치인 본인 인증 처리' },
  { phase: 1, area: 'BA', id: 'P1BA11', name: 'AI 평가 조회 API (Mock)', desc: 'Mock AI 평가 데이터 반환' },
  { phase: 1, area: 'BA', id: 'P1BA12', name: 'AI 평가 생성 API (Mock)', desc: 'Mock AI 평가 생성 시뮬레이션' },
  { phase: 1, area: 'BA', id: 'P1BA13', name: '게시글 목록 API (Mock)', desc: 'Mock 게시글 목록 반환' },
  { phase: 1, area: 'BA', id: 'P1BA14', name: '게시글 상세 API (Mock)', desc: 'Mock 게시글 상세 정보 반환' },
  { phase: 1, area: 'BA', id: 'P1BA15', name: '게시글 작성 API (Mock)', desc: 'Mock 게시글 작성 처리' },
  { phase: 1, area: 'BA', id: 'P1BA16', name: '댓글 작성 API (Mock)', desc: 'Mock 댓글 작성 처리' },
  { phase: 1, area: 'BA', id: 'P1BA17', name: '좋아요 API (Mock)', desc: 'Mock 좋아요/좋아요 취소 처리' },
  { phase: 1, area: 'BA', id: 'P1BA18', name: '공유 API (Mock)', desc: 'Mock 게시글 공유 처리' },
  { phase: 1, area: 'BA', id: 'P1BA19', name: '팔로우 API (Mock)', desc: 'Mock 팔로우/언팔로우 처리' },
  { phase: 1, area: 'BA', id: 'P1BA20', name: '알림 조회 API (Mock)', desc: 'Mock 알림 목록 반환' },
  { phase: 1, area: 'BA', id: 'P1BA21', name: '관리자 통계 API (Mock)', desc: 'Mock 관리자 대시보드 통계' },
  { phase: 1, area: 'BA', id: 'P1BA22', name: '사용자 관리 API (Mock)', desc: 'Mock 사용자 관리 (차단/활성화)' },
  { phase: 1, area: 'BA', id: 'P1BA23', name: '콘텐츠 신고 API (Mock)', desc: 'Mock 콘텐츠 신고 처리' },
  { phase: 2, area: 'D', id: 'P2D1', name: '전체 Database 스키마 (통합)', desc: '모든 테이블 + 트리거 + 타입 + Storage + 최적화' },
  { phase: 3, area: 'BA', id: 'P3BA1', name: '회원가입 API (Real)', desc: 'Supabase Auth + users 테이블 실제 처리' },
  { phase: 3, area: 'BA', id: 'P3BA2', name: 'Google OAuth API (Real)', desc: 'Google OAuth → Supabase Auth 실제 연동' },
  { phase: 3, area: 'BA', id: 'P3BA3', name: '로그인 API (Real)', desc: 'Supabase Auth 실제 로그인' },
  { phase: 3, area: 'BA', id: 'P3BA4', name: '비밀번호 재설정 API (Real)', desc: 'Supabase Auth 실제 비밀번호 재설정' },
  { phase: 3, area: 'BA', id: 'P3BA5', name: '토큰 갱신 API (Real)', desc: 'Supabase Auth 실제 토큰 갱신' },
  { phase: 3, area: 'BA', id: 'P3BA6', name: '로그아웃 API (Real)', desc: 'Supabase Auth 실제 로그아웃' },
  { phase: 3, area: 'BA', id: 'P3BA7', name: '정치인 목록 API (Real)', desc: 'politicians 테이블 실제 조회 (필터링/정렬)' },
  { phase: 3, area: 'BA', id: 'P3BA8', name: '정치인 상세 API (Real)', desc: 'politicians + careers + pledges JOIN 조회' },
  { phase: 3, area: 'BA', id: 'P3BA9', name: '정치인 관심 등록 API (Real)', desc: 'user_favorites 테이블 INSERT/DELETE' },
  { phase: 3, area: 'BA', id: 'P3BA10', name: '정치인 본인 인증 API (Real)', desc: 'politician_verification 실제 처리' },
  { phase: 3, area: 'BA', id: 'P3BA11', name: 'AI 평가 조회 API (Real)', desc: 'ai_evaluations 테이블 실제 조회' },
  { phase: 3, area: 'BA', id: 'P3BA12', name: 'AI 평가 생성 API (Real)', desc: 'OpenAI API 호출 + ai_evaluations 저장' },
  { phase: 3, area: 'BA', id: 'P3BA13', name: '게시글 목록 API (Real)', desc: 'posts 테이블 실제 조회 (페이지네이션)' },
  { phase: 3, area: 'BA', id: 'P3BA14', name: '게시글 상세 API (Real)', desc: 'posts 상세 실제 조회' },
  { phase: 3, area: 'BA', id: 'P3BA15', name: '게시글 작성 API (Real)', desc: 'posts 테이블 실제 INSERT' },
  { phase: 3, area: 'BA', id: 'P3BA16', name: '댓글 작성 API (Real)', desc: 'comments 테이블 실제 INSERT' },
  { phase: 3, area: 'BA', id: 'P3BA17', name: '좋아요 API (Real)', desc: 'post_likes + comment_likes 실제 처리' },
  { phase: 3, area: 'BA', id: 'P3BA18', name: '공유 API (Real)', desc: 'shares 테이블 실제 처리' },
  { phase: 3, area: 'BA', id: 'P3BA19', name: '팔로우 API (Real)', desc: 'follows 테이블 실제 처리' },
  { phase: 3, area: 'BA', id: 'P3BA20', name: '알림 조회 API (Real)', desc: 'notifications 테이블 실제 조회' },
  { phase: 3, area: 'BA', id: 'P3BA21', name: '관리자 통계 API (Real)', desc: '실제 집계 쿼리 (사용자/게시글 통계)' },
  { phase: 3, area: 'BA', id: 'P3BA22', name: '사용자 관리 API (Real)', desc: 'users 관리 실제 처리 (차단/활성화)' },
  { phase: 3, area: 'BA', id: 'P3BA23', name: '콘텐츠 신고 API (Real)', desc: 'reports 테이블 실제 처리' },
  { phase: 4, area: 'BA', id: 'P4BA1', name: '선관위 크롤링 스크립트', desc: '선관위 사이트에서 정치인 데이터 크롤링' },
  { phase: 4, area: 'BA', id: 'P4BA2', name: '정치인 데이터 시딩', desc: '초기 정치인 데이터 DB 삽입' },
  { phase: 4, area: 'BA', id: 'P4BA3', name: '이미지 업로드 헬퍼', desc: 'Supabase Storage 이미지 업로드 유틸' },
  { phase: 4, area: 'BA', id: 'P4BA4', name: '파일 업로드 헬퍼', desc: '게시글 첨부파일 업로드 처리' },
  { phase: 4, area: 'BA', id: 'P4BA5', name: '욕설 필터', desc: '욕설 감지 및 필터링 유틸' },
  { phase: 4, area: 'BA', id: 'P4BA6', name: '알림 생성 헬퍼', desc: '알림 자동 생성 유틸' },
  { phase: 4, area: 'O', id: 'P4O1', name: '크롤링 스케줄러', desc: '정치인 데이터 자동 업데이트 (Cron)' },
  { phase: 4, area: 'O', id: 'P4O2', name: '인기 게시글 집계 스케줄러', desc: '인기 게시글 순위 자동 계산 (Cron)' },
  { phase: 4, area: 'O', id: 'P4O3', name: '등급 재계산 스케줄러', desc: '사용자 등급 자동 재계산 (Cron)' },
  { phase: 5, area: 'T', id: 'P5T1', name: 'Unit Tests', desc: '컴포넌트 + API 유틸 + 함수 유닛 테스트 (Jest)' },
  { phase: 5, area: 'T', id: 'P5T2', name: 'E2E Tests', desc: '사용자 시나리오 E2E 테스트 (Playwright)' },
  { phase: 5, area: 'T', id: 'P5T3', name: 'Integration Tests', desc: 'API + DB 통합 테스트' },
  { phase: 6, area: 'O', id: 'P6O1', name: 'CI/CD 파이프라인', desc: 'GitHub Actions 자동 빌드/배포' },
  { phase: 6, area: 'O', id: 'P6O2', name: 'Vercel 배포 설정', desc: 'Vercel 프로덕션 배포 설정' },
  { phase: 6, area: 'O', id: 'P6O3', name: '모니터링 설정', desc: 'Sentry 에러 추적 + Google Analytics' },
  { phase: 6, area: 'O', id: 'P6O4', name: '보안 설정', desc: 'Rate Limiting + CORS + CSP 설정' }
];

// Dependency mapping
const dependencies = {
  'P1F1': [],
  'P1BI1': [],
  'P1BI2': ['P1BI1'],
  'P1BI3': ['P1BI1', 'P2D1'],
  'P1BA1': ['P1BI1', 'P1BI2'],
  'P1BA2': ['P1BI1', 'P1BI2'],
  'P1BA3': ['P1BI1', 'P1BI2'],
  'P1BA4': ['P1BI1', 'P1BI2'],
  'P1BA5': ['P1BI1', 'P1BI2'],
  'P1BA6': ['P1BI1', 'P1BI2'],
  'P1BA7': ['P1BI1', 'P1BI2'],
  'P1BA8': ['P1BI1', 'P1BI2'],
  'P1BA9': ['P1BI1', 'P1BI2'],
  'P1BA10': ['P1BI1', 'P1BI2'],
  'P1BA11': ['P1BI1', 'P1BI2'],
  'P1BA12': ['P1BI1', 'P1BI2'],
  'P1BA13': ['P1BI1', 'P1BI2'],
  'P1BA14': ['P1BI1', 'P1BI2'],
  'P1BA15': ['P1BI1', 'P1BI2'],
  'P1BA16': ['P1BI1', 'P1BI2'],
  'P1BA17': ['P1BI1', 'P1BI2'],
  'P1BA18': ['P1BI1', 'P1BI2'],
  'P1BA19': ['P1BI1', 'P1BI2'],
  'P1BA20': ['P1BI1', 'P1BI2'],
  'P1BA21': ['P1BI1', 'P1BI2'],
  'P1BA22': ['P1BI1', 'P1BI2'],
  'P1BA23': ['P1BI1', 'P1BI2'],
  'P2D1': [],
  'P3BA1': ['P2D1', 'P1BA1'],
  'P3BA2': ['P2D1', 'P1BA2'],
  'P3BA3': ['P2D1', 'P1BA3'],
  'P3BA4': ['P2D1', 'P1BA4'],
  'P3BA5': ['P2D1', 'P1BA5'],
  'P3BA6': ['P2D1', 'P1BA6'],
  'P3BA7': ['P2D1', 'P1BA7'],
  'P3BA8': ['P2D1', 'P1BA8'],
  'P3BA9': ['P2D1', 'P1BA9'],
  'P3BA10': ['P2D1', 'P1BA10'],
  'P3BA11': ['P2D1', 'P1BA11'],
  'P3BA12': ['P2D1', 'P1BA12'],
  'P3BA13': ['P2D1', 'P1BA13'],
  'P3BA14': ['P2D1', 'P1BA14'],
  'P3BA15': ['P2D1', 'P1BA15'],
  'P3BA16': ['P2D1', 'P1BA16'],
  'P3BA17': ['P2D1', 'P1BA17'],
  'P3BA18': ['P2D1', 'P1BA18'],
  'P3BA19': ['P2D1', 'P1BA19'],
  'P3BA20': ['P2D1', 'P1BA20'],
  'P3BA21': ['P2D1', 'P1BA21'],
  'P3BA22': ['P2D1', 'P1BA22'],
  'P3BA23': ['P2D1', 'P1BA23'],
  'P4BA1': ['P2D1'],
  'P4BA2': ['P4BA1'],
  'P4BA3': ['P2D1'],
  'P4BA4': ['P2D1'],
  'P4BA5': [],
  'P4BA6': ['P2D1'],
  'P4O1': ['P4BA1'],
  'P4O2': ['P2D1'],
  'P4O3': ['P2D1'],
  'P5T1': ['P1F1', 'P3BA1', 'P3BA2', 'P3BA3'],
  'P5T2': ['P1F1', 'P3BA1', 'P3BA2', 'P3BA3'],
  'P5T3': ['P3BA1', 'P3BA2', 'P3BA3', 'P2D1'],
  'P6O1': ['P5T1', 'P5T2', 'P5T3'],
  'P6O2': ['P5T1', 'P5T2', 'P5T3'],
  'P6O3': ['P6O2'],
  'P6O4': ['P6O2']
};

// Area full names
const areaNames = {
  'F': 'Frontend',
  'BI': 'Backend Infrastructure',
  'BA': 'Backend APIs',
  'D': 'Database',
  'T': 'Testing',
  'O': 'Operations'
};

// Agent mapping
const agentMapping = {
  'F': 'frontend-developer',
  'BI': 'backend-developer',
  'BA': 'api-designer',
  'D': 'database-developer',
  'T': 'test-engineer',
  'O': 'devops-engineer'
};

// Tech stack mapping
const techStackMapping = {
  'F': 'TypeScript, React, Next.js, Tailwind CSS',
  'BI': 'TypeScript, Next.js, Supabase',
  'BA': 'TypeScript, Next.js API Routes, Supabase, Zod',
  'D': 'PostgreSQL, Supabase',
  'T': 'Jest, Playwright, Testing Library',
  'O': 'GitHub Actions, Vercel, Sentry'
};

// Skills mapping
const skillsMapping = {
  'F': 'react-builder, ui-design',
  'BI': 'api-builder, database-connector',
  'BA': 'api-builder, api-test',
  'D': 'database-schema, database-migration',
  'T': 'test-runner, test-coverage',
  'O': 'ci-cd, deployment'
};

// Expected deliverables mapping
function getDeliverables(task) {
  const { id, area, name } = task;

  if (id === 'P1F1') {
    return [
      'app/page.tsx (홈페이지)',
      'app/auth/signin/page.tsx',
      'app/auth/signup/page.tsx',
      'app/auth/reset-password/page.tsx',
      'app/politicians/page.tsx',
      'app/politicians/[id]/page.tsx',
      'app/posts/page.tsx',
      'app/posts/[id]/page.tsx',
      'app/profile/[id]/page.tsx',
      'app/settings/page.tsx',
      'app/admin/page.tsx',
      '... (총 33개 페이지 파일)'
    ];
  }

  if (area === 'BI') {
    if (id === 'P1BI1') {
      return [
        'lib/supabase/client.ts',
        'lib/supabase/server.ts'
      ];
    }
    if (id === 'P1BI2') {
      return [
        'lib/middleware/auth.ts',
        'lib/middleware/error-handler.ts'
      ];
    }
    if (id === 'P1BI3') {
      return [
        'types/database.ts (Supabase CLI 자동 생성)'
      ];
    }
  }

  if (area === 'BA' && id.startsWith('P1BA')) {
    const apiPaths = {
      'P1BA1': 'app/api/auth/signup/route.ts',
      'P1BA2': 'app/api/auth/google/route.ts',
      'P1BA3': 'app/api/auth/signin/route.ts',
      'P1BA4': 'app/api/auth/reset-password/route.ts',
      'P1BA5': 'app/api/auth/refresh/route.ts',
      'P1BA6': 'app/api/auth/signout/route.ts',
      'P1BA7': 'app/api/politicians/route.ts',
      'P1BA8': 'app/api/politicians/[id]/route.ts',
      'P1BA9': 'app/api/politicians/[id]/favorite/route.ts',
      'P1BA10': 'app/api/politicians/verify/route.ts',
      'P1BA11': 'app/api/politicians/[id]/ai-evaluation/route.ts',
      'P1BA12': 'app/api/ai/evaluate/route.ts',
      'P1BA13': 'app/api/posts/route.ts',
      'P1BA14': 'app/api/posts/[id]/route.ts',
      'P1BA15': 'app/api/posts/create/route.ts',
      'P1BA16': 'app/api/posts/[id]/comments/route.ts',
      'P1BA17': 'app/api/posts/[id]/like/route.ts',
      'P1BA18': 'app/api/posts/[id]/share/route.ts',
      'P1BA19': 'app/api/users/[id]/follow/route.ts',
      'P1BA20': 'app/api/notifications/route.ts',
      'P1BA21': 'app/api/admin/stats/route.ts',
      'P1BA22': 'app/api/admin/users/route.ts',
      'P1BA23': 'app/api/reports/route.ts'
    };
    return [apiPaths[id]];
  }

  if (area === 'BA' && id.startsWith('P3BA')) {
    const apiPaths = {
      'P3BA1': 'app/api/auth/signup/route.ts (Mock → Real 교체)',
      'P3BA2': 'app/api/auth/google/route.ts (Mock → Real 교체)',
      'P3BA3': 'app/api/auth/signin/route.ts (Mock → Real 교체)',
      'P3BA4': 'app/api/auth/reset-password/route.ts (Mock → Real 교체)',
      'P3BA5': 'app/api/auth/refresh/route.ts (Mock → Real 교체)',
      'P3BA6': 'app/api/auth/signout/route.ts (Mock → Real 교체)',
      'P3BA7': 'app/api/politicians/route.ts (Mock → Real 교체)',
      'P3BA8': 'app/api/politicians/[id]/route.ts (Mock → Real 교체)',
      'P3BA9': 'app/api/politicians/[id]/favorite/route.ts (Mock → Real 교체)',
      'P3BA10': 'app/api/politicians/verify/route.ts (Mock → Real 교체)',
      'P3BA11': 'app/api/politicians/[id]/ai-evaluation/route.ts (Mock → Real 교체)',
      'P3BA12': 'app/api/ai/evaluate/route.ts (Mock → Real 교체)',
      'P3BA13': 'app/api/posts/route.ts (Mock → Real 교체)',
      'P3BA14': 'app/api/posts/[id]/route.ts (Mock → Real 교체)',
      'P3BA15': 'app/api/posts/create/route.ts (Mock → Real 교체)',
      'P3BA16': 'app/api/posts/[id]/comments/route.ts (Mock → Real 교체)',
      'P3BA17': 'app/api/posts/[id]/like/route.ts (Mock → Real 교체)',
      'P3BA18': 'app/api/posts/[id]/share/route.ts (Mock → Real 교체)',
      'P3BA19': 'app/api/users/[id]/follow/route.ts (Mock → Real 교체)',
      'P3BA20': 'app/api/notifications/route.ts (Mock → Real 교체)',
      'P3BA21': 'app/api/admin/stats/route.ts (Mock → Real 교체)',
      'P3BA22': 'app/api/admin/users/route.ts (Mock → Real 교체)',
      'P3BA23': 'app/api/reports/route.ts (Mock → Real 교체)'
    };
    return [apiPaths[id]];
  }

  if (id === 'P2D1') {
    return [
      'supabase/migrations/001_create_users_table.sql',
      'supabase/migrations/002_create_politicians_table.sql',
      'supabase/migrations/003_create_posts_table.sql',
      'supabase/migrations/004_create_comments_table.sql',
      'supabase/migrations/005_create_notifications_table.sql',
      'supabase/migrations/006_create_triggers.sql',
      'supabase/migrations/007_create_storage_buckets.sql',
      '... (전체 데이터베이스 스키마)'
    ];
  }

  if (area === 'BA' && id.startsWith('P4BA')) {
    const utilPaths = {
      'P4BA1': 'scripts/crawlers/nec-crawler.ts',
      'P4BA2': 'scripts/seed/seed-politicians.ts',
      'P4BA3': 'lib/utils/image-upload.ts',
      'P4BA4': 'lib/utils/file-upload.ts',
      'P4BA5': 'lib/utils/profanity-filter.ts',
      'P4BA6': 'lib/utils/notification-helper.ts'
    };
    return [utilPaths[id]];
  }

  if (area === 'O' && id.startsWith('P4O')) {
    const schedulerPaths = {
      'P4O1': 'app/api/cron/update-politicians/route.ts',
      'P4O2': 'app/api/cron/aggregate-trending/route.ts',
      'P4O3': 'app/api/cron/recalculate-ranks/route.ts'
    };
    return [schedulerPaths[id]];
  }

  if (area === 'T') {
    if (id === 'P5T1') {
      return [
        '__tests__/components/**/*.test.tsx',
        '__tests__/utils/**/*.test.ts',
        '__tests__/api/**/*.test.ts'
      ];
    }
    if (id === 'P5T2') {
      return [
        'e2e/auth.spec.ts',
        'e2e/politicians.spec.ts',
        'e2e/posts.spec.ts',
        'e2e/admin.spec.ts'
      ];
    }
    if (id === 'P5T3') {
      return [
        '__tests__/integration/api-db.test.ts',
        '__tests__/integration/auth-flow.test.ts'
      ];
    }
  }

  if (area === 'O' && id.startsWith('P6O')) {
    const deployPaths = {
      'P6O1': '.github/workflows/ci-cd.yml',
      'P6O2': 'vercel.json',
      'P6O3': 'lib/monitoring/sentry.ts + Google Analytics 설정',
      'P6O4': 'middleware.ts (Rate Limiting, CORS, CSP)'
    };
    return [deployPaths[id]];
  }

  return ['(구체적인 파일 경로는 작업 시 결정)'];
}

// Implementation items mapping
function getImplementationItems(task) {
  const { id, area, name } = task;

  if (id === 'P1F1') {
    return [
      'HTML → React 컴포넌트 변환 (33개 페이지)',
      'CSS → Tailwind CSS 변환',
      'TypeScript 타입 정의',
      '레이아웃 컴포넌트 추출 (Header, Footer, Sidebar)',
      '재사용 가능한 UI 컴포넌트 생성',
      '라우팅 설정 (Next.js App Router)',
      '반응형 디자인 적용',
      '접근성(A11y) 기준 준수'
    ];
  }

  if (id === 'P1BI1') {
    return [
      'Supabase 클라이언트 초기화 (클라이언트용)',
      'Supabase 서버 클라이언트 초기화 (서버용)',
      '환경 변수 설정 (.env.local)',
      'TypeScript 타입 정의'
    ];
  }

  if (id === 'P1BI2') {
    return [
      '인증 미들웨어 구현 (JWT 검증)',
      '에러 핸들링 미들웨어',
      'API 응답 표준화',
      '로깅 설정'
    ];
  }

  if (id === 'P1BI3') {
    return [
      'Supabase CLI로 타입 생성 명령 실행',
      'types/database.ts 파일 생성',
      'TypeScript 설정 업데이트',
      '타입 안전성 검증'
    ];
  }

  if (area === 'BA' && id.startsWith('P1BA')) {
    return [
      'API 라우트 파일 생성',
      '요청 스키마 정의 (Zod)',
      'Mock 데이터 생성',
      'Mock 응답 로직 구현',
      '에러 처리',
      'API 문서 주석 작성'
    ];
  }

  if (id === 'P2D1') {
    return [
      'users 테이블 (사용자 정보)',
      'politicians 테이블 (정치인 정보)',
      'careers 테이블 (경력)',
      'pledges 테이블 (공약)',
      'posts 테이블 (게시글)',
      'comments 테이블 (댓글)',
      'post_likes, comment_likes 테이블',
      'follows 테이블 (팔로우 관계)',
      'notifications 테이블 (알림)',
      'user_favorites 테이블 (관심 정치인)',
      'ai_evaluations 테이블 (AI 평가)',
      'reports 테이블 (신고)',
      'shares 테이블 (공유)',
      'politician_verification 테이블 (본인 인증)',
      'Storage Buckets (avatars, attachments, politician-images)',
      '인덱스 최적화',
      '트리거 설정 (자동 타임스탬프, 알림 생성)',
      'RLS (Row Level Security) 정책',
      'Database Functions (집계, 순위 계산)'
    ];
  }

  if (area === 'BA' && id.startsWith('P3BA')) {
    return [
      'Mock 코드 제거',
      'Supabase 클라이언트 연결',
      '실제 데이터베이스 쿼리 구현',
      '트랜잭션 처리',
      '에러 처리 강화',
      'RLS 정책 적용 확인',
      '성능 최적화 (인덱스 활용)',
      'API 테스트'
    ];
  }

  if (id === 'P4BA1') {
    return [
      '선관위 사이트 분석',
      'Puppeteer/Playwright 크롤러 구현',
      '데이터 파싱 로직',
      '에러 처리 및 재시도 로직',
      '크롤링 결과 저장 (JSON)'
    ];
  }

  if (id === 'P4BA2') {
    return [
      '크롤링 데이터 로드',
      'politicians 테이블 INSERT',
      'careers, pledges 테이블 INSERT',
      '중복 체크 로직',
      '시딩 스크립트 실행 명령'
    ];
  }

  if (id === 'P4BA3') {
    return [
      'Supabase Storage 연결',
      '이미지 업로드 함수',
      '이미지 리사이징 (Sharp)',
      '업로드 URL 반환',
      '에러 처리'
    ];
  }

  if (id === 'P4BA4') {
    return [
      'Supabase Storage 연결',
      '파일 업로드 함수',
      '파일 타입 검증',
      '용량 제한 체크',
      '업로드 URL 반환'
    ];
  }

  if (id === 'P4BA5') {
    return [
      '욕설 단어 목록 정의',
      '욕설 감지 함수',
      '텍스트 필터링 함수',
      '정규식 패턴 매칭',
      '대체 문자 처리'
    ];
  }

  if (id === 'P4BA6') {
    return [
      '알림 생성 함수',
      'notifications 테이블 INSERT',
      '알림 타입별 로직',
      '배치 알림 생성',
      '중복 알림 방지'
    ];
  }

  if (id === 'P4O1') {
    return [
      'Vercel Cron Job 설정',
      'API Route 생성',
      '크롤러 스크립트 호출',
      '업데이트 로직 (UPSERT)',
      '실행 로그 기록'
    ];
  }

  if (id === 'P4O2') {
    return [
      'Vercel Cron Job 설정',
      'API Route 생성',
      '좋아요/댓글/조회수 집계',
      '인기 순위 계산',
      '결과 저장 (캐시 테이블)'
    ];
  }

  if (id === 'P4O3') {
    return [
      'Vercel Cron Job 설정',
      'API Route 생성',
      '사용자 활동 점수 계산',
      '등급 재할당 로직',
      'users 테이블 업데이트'
    ];
  }

  if (id === 'P5T1') {
    return [
      'Jest 설정',
      '컴포넌트 단위 테스트 (React Testing Library)',
      'API 유틸 함수 테스트',
      'Helper 함수 테스트',
      'Mock 데이터 설정',
      '테스트 커버리지 80% 이상'
    ];
  }

  if (id === 'P5T2') {
    return [
      'Playwright 설정',
      '회원가입/로그인 시나리오',
      '정치인 검색/상세 조회 시나리오',
      '게시글 작성/댓글 시나리오',
      '관리자 대시보드 시나리오',
      'CI/CD 통합'
    ];
  }

  if (id === 'P5T3') {
    return [
      'API + DB 통합 테스트 환경 구축',
      '인증 플로우 테스트',
      'CRUD 작업 테스트',
      '트랜잭션 테스트',
      'RLS 정책 테스트'
    ];
  }

  if (id === 'P6O1') {
    return [
      'GitHub Actions 워크플로우 작성',
      'Build 단계 (npm run build)',
      'Test 단계 (npm run test)',
      'Deploy 단계 (Vercel)',
      '환경 변수 설정',
      '브랜치별 배포 전략 (main → production)'
    ];
  }

  if (id === 'P6O2') {
    return [
      'vercel.json 설정',
      '환경 변수 설정 (Vercel Dashboard)',
      '도메인 연결',
      'Build 설정 최적화',
      'Preview 배포 설정'
    ];
  }

  if (id === 'P6O3') {
    return [
      'Sentry 프로젝트 생성',
      'Sentry SDK 설정 (Next.js)',
      '에러 추적 설정',
      'Google Analytics 설정',
      '사용자 이벤트 추적',
      '성능 모니터링'
    ];
  }

  if (id === 'P6O4') {
    return [
      'Rate Limiting 미들웨어 (Upstash Redis)',
      'CORS 설정',
      'CSP (Content Security Policy) 설정',
      '환경 변수 보안 점검',
      'API Key 관리'
    ];
  }

  return ['(작업 특성에 맞는 구현 항목 추가 필요)'];
}

// Completion criteria mapping
function getCompletionCriteria(task) {
  const { id, area, name } = task;

  const baseCriteria = [
    `${name} 기능이 정상적으로 구현됨`,
    '기대 결과물이 모두 생성됨',
    '코드가 정상적으로 빌드/실행됨',
    '타입 체크 및 린트 통과',
    'PROJECT GRID 상태 업데이트 완료'
  ];

  if (id === 'P1F1') {
    return [
      '33개 페이지가 모두 React로 변환됨',
      '모든 페이지가 정상적으로 렌더링됨',
      'Tailwind CSS 스타일이 올바르게 적용됨',
      '반응형 디자인이 정상 작동함',
      '라우팅이 정상 작동함',
      'TypeScript 타입 에러 없음',
      'ESLint 경고 없음'
    ];
  }

  if (area === 'BI') {
    baseCriteria.push('Supabase 연결이 정상적으로 작동함');
    baseCriteria.push('타입 정의가 올바름');
  }

  if (area === 'BA') {
    baseCriteria.push('API 엔드포인트가 정상적으로 응답함');
    baseCriteria.push('요청/응답 스키마 검증 통과');
    if (id.startsWith('P1BA')) {
      baseCriteria.push('Mock 데이터가 올바르게 반환됨');
    } else if (id.startsWith('P3BA')) {
      baseCriteria.push('실제 데이터베이스 연동 확인');
      baseCriteria.push('RLS 정책 적용 확인');
    }
  }

  if (id === 'P2D1') {
    return [
      '모든 테이블이 정상적으로 생성됨',
      '외래 키 제약 조건이 올바르게 설정됨',
      '인덱스가 올바르게 생성됨',
      '트리거가 정상 작동함',
      'RLS 정책이 올바르게 설정됨',
      'Storage Buckets 생성 확인',
      '마이그레이션 스크립트 실행 성공',
      'DATABASE TYPES 생성 확인'
    ];
  }

  if (area === 'T') {
    baseCriteria.push('모든 테스트가 통과함');
    if (id === 'P5T1') {
      baseCriteria.push('테스트 커버리지 80% 이상');
    }
    if (id === 'P5T2') {
      baseCriteria.push('모든 사용자 시나리오 테스트 통과');
    }
  }

  if (area === 'O') {
    if (id === 'P6O1') {
      baseCriteria.push('CI/CD 파이프라인이 정상 작동함');
      baseCriteria.push('자동 배포 확인');
    }
    if (id === 'P6O2') {
      baseCriteria.push('프로덕션 배포 성공');
      baseCriteria.push('도메인 연결 확인');
    }
    if (id === 'P6O3') {
      baseCriteria.push('에러 추적 확인');
      baseCriteria.push('Analytics 데이터 수집 확인');
    }
    if (id === 'P6O4') {
      baseCriteria.push('Rate Limiting 작동 확인');
      baseCriteria.push('보안 헤더 설정 확인');
    }
  }

  return baseCriteria;
}

// Generate markdown content
function generateMarkdown(task) {
  const deps = dependencies[task.id] || [];
  const depsText = deps.length > 0 ? deps.join(', ') : '없음';
  const agent = agentMapping[task.area];
  const areaFull = areaNames[task.area];
  const techStack = techStackMapping[task.area];
  const skills = skillsMapping[task.area];
  const deliverables = getDeliverables(task);
  const implItems = getImplementationItems(task);
  const completionCriteria = getCompletionCriteria(task);

  let content = `# 작업지시서: ${task.id}

## 📋 기본 정보

- **작업 ID**: ${task.id}
- **업무명**: ${task.name}
- **Phase**: Phase ${task.phase}
- **Area**: ${areaFull} (${task.area})
- **서브 에이전트**: ${agent}
- **작업 방식**: AI-Only

---

## 🎯 작업 목표

${task.desc}

---

## 🔧 사용 도구

\`\`\`
[Claude 도구]
Read, Edit, Write, Grep, Glob, Bash

[기술 스택]
${techStack}

[전문 스킬]
${skills}
\`\`\`

**도구 설명**:
- **Claude 도구**: Claude Code의 기본 기능 (Read, Write, Edit, Bash, Glob, Grep 등)
- **기술 스택**: 프로젝트에 사용되는 프레임워크 및 라이브러리
- **전문 스킬**: Anthropic 빌트인 스킬 (.claude/skills/*.md 참조)

## 🔗 의존성 정보

**의존성 체인**: ${depsText}

${deps.length > 0 ? `이 작업을 시작하기 전에 다음 작업이 완료되어야 합니다: ${depsText}` : '이 작업은 독립적으로 시작할 수 있습니다.'}

---

## 📦 기대 결과물

${deliverables.map(d => `- ${d}`).join('\n')}

**구현해야 할 세부 항목**:

${implItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

각 항목을 체계적으로 구현하고 테스트하세요.

---

## 📝 작업 지시사항

### 1. 준비 단계

- 프로젝트 루트 디렉토리에서 작업 시작
- 필요한 도구 확인: ${techStack.split(', ').join('/')}
${deps.length > 0 ? `- 의존성 작업 완료 확인 (${deps.map(d => d).join(') (')})` : '- 의존성 없음, 바로 시작 가능'}

### 2. 구현 단계

**구현해야 할 세부 항목**:

${implItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

각 항목을 체계적으로 구현하고 테스트하세요.

### 3. 검증 단계

- 작성한 코드의 정상 동작 확인
- 타입 체크 및 린트 통과
- 필요한 경우 단위 테스트 작성
- 코드 리뷰 준비

### 4. 완료 단계

- 생성된 파일 목록 확인
- PROJECT GRID 상태 업데이트
- 다음 의존 작업에 영향 확인

---

## ✅ 완료 기준

${completionCriteria.map(c => `- [ ] ${c}`).join('\n')}

---

**작업지시서 생성일**: ${new Date().toISOString().split('T')[0]}
**PROJECT GRID Version**: v4.0
`;

  return content;
}

// Main execution
const tasksDir = path.join(__dirname, '..', 'tasks');

if (!fs.existsSync(tasksDir)) {
  fs.mkdirSync(tasksDir, { recursive: true });
}

let successCount = 0;
let errorCount = 0;

tasks.forEach(task => {
  try {
    const content = generateMarkdown(task);
    const filename = `${task.id}.md`;
    const filepath = path.join(tasksDir, filename);

    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`✅ Generated: ${filename}`);
    successCount++;
  } catch (error) {
    console.error(`❌ Error generating ${task.id}:`, error.message);
    errorCount++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`총 ${tasks.length}개 작업지시서 생성 완료`);
console.log(`성공: ${successCount}개`);
console.log(`실패: ${errorCount}개`);
console.log('='.repeat(50));
