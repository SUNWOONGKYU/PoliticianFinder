-- PHASE GATES 데이터
-- 6개 Phase별 통과 조건
-- 생성일: 2025-11-06

-- Phase 1 Gate
INSERT INTO phase_gates (phase, gate_name, criteria, status) VALUES (
    1,
    'Phase 1 Gate: Frontend + Mock APIs',
    'Build✅ | Lint✅ | Dev서버 실행 | 35페이지 렌더링 | Mock API 23개 응답200 | 사용자 승인',
    '대기'
);

-- Phase 2 Gate
INSERT INTO phase_gates (phase, gate_name, criteria, status) VALUES (
    2,
    'Phase 2 Gate: Database Schema',
    '30+테이블 생성 | RLS정책 적용 | Storage Buckets 생성 | Types 생성 확인 | 사용자 승인',
    '대기'
);

-- Phase 3 Gate
INSERT INTO phase_gates (phase, gate_name, criteria, status) VALUES (
    3,
    'Phase 3 Gate: Real APIs',
    'Build✅ | Real API 23개 응답 | DB연동 확인 | Auth 동작 | E2E Smoke Test | 사용자 승인',
    '대기'
);

-- Phase 4 Gate
INSERT INTO phase_gates (phase, gate_name, criteria, status) VALUES (
    4,
    'Phase 4 Gate: Backend Utilities + Admin',
    'Build✅ | 크롤링 성공 | 헬퍼6개 테스트 | Admin API 7개 응답 | Cron 3개 실행 | 사용자 승인',
    '대기'
);

-- Phase 5 Gate
INSERT INTO phase_gates (phase, gate_name, criteria, status) VALUES (
    5,
    'Phase 5 Gate: Testing',
    'Unit Test 80%+ | E2E Test 100% | Integration Test 90%+ | 실패 테스트 0개 | 사용자 승인',
    '대기'
);

-- Phase 6 Gate (최종)
INSERT INTO phase_gates (phase, gate_name, criteria, status) VALUES (
    6,
    'Phase 6 Gate: Deployment (최종)',
    'CI/CD 파이프라인 성공 | Vercel 배포 | Sentry 활성화 | Security 설정 | Smoke Test | 사용자 승인 ⭐',
    '대기'
);

-- 완료!
-- 6개 Phase Gate가 Supabase에 저장되었습니다.
