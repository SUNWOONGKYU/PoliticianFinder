-- Phase Gate 달성 조건 업데이트

-- Phase 1 Gate
UPDATE phase_gates
SET criteria = 'Build✅ | Lint✅ | Dev서버 정상 구동 | 33페이지 렌더링 성공 | Mock API 23개 응답200 | 작업지시서 검증완료'
WHERE phase = 1;

-- Phase 2 Gate
UPDATE phase_gates
SET criteria = '30+테이블 생성완료 | RLS정책 적용완료 | Storage Buckets 생성완료 | Types 생성완료 파일 | 작업지시서 검증완료'
WHERE phase = 2;

-- Phase 3 Gate
UPDATE phase_gates
SET criteria = 'Build✅ | Real API 23개 응답200 | DB연동 정상 파일 | Auth 로그인 | E2E Smoke Test | 작업지시서 검증완료'
WHERE phase = 3;

-- Phase 4 Gate
UPDATE phase_gates
SET criteria = 'Build✅ | 크롤링 성공 데이터 시딩 | 헬퍼16개 정상 동작 | Admin API 7개 응답200 | Cron 3개 정상 구동 | 작업지시서 검증완료'
WHERE phase = 4;

-- Phase 5 Gate
UPDATE phase_gates
SET criteria = 'Unit Test 80%+ | E2E Test 100% | Integration Test 90%+ | 정상 동작 확인 0개 | 작업지시서 검증완료'
WHERE phase = 5;

-- Phase 6 Gate (최종)
UPDATE phase_gates
SET criteria = 'CI/CD 파이프라인 구축완료 | Vercel 배포성공 | Sentry 통합완료 | Security 설정완료 | Smoke Test | 작업지시서 검증완료 최종'
WHERE phase = 6;
