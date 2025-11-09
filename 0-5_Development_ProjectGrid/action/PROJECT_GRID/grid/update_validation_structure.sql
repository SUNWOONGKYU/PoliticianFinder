-- =====================================================
-- 종합검증결과 구조 변경 (2025-11-04)
-- =====================================================
-- 1차, 2차, 3차, 4차 검증 결과를 구분하여 저장
-- 형식: 
--   1차: [검증자]@[에이전트] | Test(결과) | Build(결과) | 보고서: [경로]
--   2차: [검증자]@[에이전트] | Test(결과) | Build(결과) | 보고서: [경로]
--   3차: [검증자]@[에이전트] | Test(결과) | Build(결과) | 보고서: [경로]
--   4차: 최종 | 보고서: [경로]

-- ⚠️ 주의: 
-- - 기존 필드는 모두 유지 (테스트내역, 빌드결과, 의존성전파, 블로커)
-- - 종합검증결과만 새로운 형식으로 변경
-- - 이 스크립트는 마이그레이션용이며, 필요시 역변환 가능

-- 예시 UPDATE (1차 검증 추가)
-- UPDATE public.project_grid_tasks
-- SET validation_result = '1차: Main Agent@Session1 | Test(20/20) | Build ✅ | 보고서: docs/P1BA1_1st.md'
-- WHERE task_id = 'P1BA1';

-- 예시 UPDATE (2차 검증 추가)
-- UPDATE public.project_grid_tasks
-- SET validation_result = '1차: Main Agent@Session1 | Test(20/20) | Build ✅ | 보고서: docs/P1BA1_1st.md
-- 2차: Gemini@検証 | Test(24/24) | Build ✅ | 보고서: docs/P1BA1_2nd.md'
-- WHERE task_id = 'P1BA1';

-- 데이터 마이그레이션 예시
-- Phase 1 일부 작업의 검증 결과 업데이트 (예시)

-- P1BA1 - 회원가입 API
UPDATE public.project_grid_tasks
SET validation_result = '1차: Main Agent | Test(20/20) | Build ✅ | 보고서: validation/results/P1BA1_1st_verification.txt'
WHERE task_id = 'P1BA1' AND phase = 1;

-- P1BA2 - 로그인 API  
UPDATE public.project_grid_tasks
SET validation_result = '1차: Main Agent | Test(20/20) | Build ✅ | 보고서: validation/results/P1BA2_1st_verification.txt'
WHERE task_id = 'P1BA2' AND phase = 1;

-- P1BA4 - 비밀번호 재설정 API
UPDATE public.project_grid_tasks
SET validation_result = '1차: Main Agent | Test(20/20) | Build ✅ | 보고서: validation/results/P1BA4_1st_verification.txt'
WHERE task_id = 'P1BA4' AND phase = 1;

-- P1BI1 - Supabase 클라이언트
UPDATE public.project_grid_tasks
SET validation_result = '1차: Main Agent | Test(20/20) | Build ✅ | 보고서: validation/results/P1BI1_1st_verification.txt'
WHERE task_id = 'P1BI1' AND phase = 1;

-- P1BI2 - API 미들웨어
UPDATE public.project_grid_tasks
SET validation_result = '1차: Main Agent | Test(20/20) | Build ✅ | 보고서: validation/results/P1BI2_1st_verification.txt'
WHERE task_id = 'P1BI2' AND phase = 1;

-- P1F2 - 로그인 페이지
UPDATE public.project_grid_tasks
SET validation_result = '1차: Main Agent | Test(20/20) | Build ✅ | 보고서: validation/results/P1F2_1st_verification.txt'
WHERE task_id = 'P1F2' AND phase = 1;

-- P1F3 - 회원가입 페이지
UPDATE public.project_grid_tasks
SET validation_result = '1차: Main Agent | Test(20/20) | Build ✅ | 보고서: validation/results/P1F3_1st_verification.txt'
WHERE task_id = 'P1F3' AND phase = 1;

-- P1F4 - 비밀번호 찾기 페이지
UPDATE public.project_grid_tasks
SET validation_result = '1차: Main Agent | Test(20/20) | Build ✅ | 보고서: validation/results/P1F4_1st_verification.txt'
WHERE task_id = 'P1F4' AND phase = 1;

-- P1F5 - 비밀번호 재설정 페이지
UPDATE public.project_grid_tasks
SET validation_result = '1차: Main Agent | Test(20/20) | Build ✅ | 보고서: validation/results/P1F5_1st_verification.txt'
WHERE task_id = 'P1F5' AND phase = 1;

-- P1F6 - 마이페이지
UPDATE public.project_grid_tasks
SET validation_result = '1차: Main Agent | Test(20/20) | Build ✅ | 보고서: validation/results/P1F6_1st_verification.txt'
WHERE task_id = 'P1F6' AND phase = 1;

-- P1F10 - 의원 프로필 페이지
UPDATE public.project_grid_tasks
SET validation_result = '1차: Main Agent | Test(20/20) | Build ✅ | 보고서: validation/results/P1F10_1st_verification.txt'
WHERE task_id = 'P1F10' AND phase = 1;

-- P1F11 - 유저 프로필 페이지
UPDATE public.project_grid_tasks
SET validation_result = '1차: Main Agent | Test(20/20) | Build ✅ | 보고서: validation/results/P1F11_1st_verification.txt'
WHERE task_id = 'P1F11' AND phase = 1;

-- 완료 확인
SELECT task_id, validation_result 
FROM public.project_grid_tasks 
WHERE phase = 1 AND area IN ('BA', 'BI', 'F')
ORDER BY task_id;
