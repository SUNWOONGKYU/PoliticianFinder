-- V40 evaluations_v40 외래 키 수정: CASCADE 설정
-- ===================================================
--
-- 목적: 고아 평가 방지
--   - 현재: ON DELETE SET NULL (수집 데이터 삭제 시 평가는 남고 collected_data_id만 NULL)
--   - 변경: ON DELETE CASCADE (수집 데이터 삭제 시 평가도 함께 삭제)
--
-- 작성일: 2026-02-12
-- 작성자: Claude Code

-- ===================================
-- 1. 기존 외래 키 제약 삭제
-- ===================================

-- 먼저 기존 외래 키 제약 이름 확인
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- evaluations_v40 테이블의 collected_data_id 외래 키 제약 이름 찾기
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = 'evaluations_v40'
        AND kcu.column_name = 'collected_data_id';

    -- 제약이 존재하면 삭제
    IF constraint_name IS NOT NULL THEN
        RAISE NOTICE '기존 외래 키 제약 삭제: %', constraint_name;
        EXECUTE format('ALTER TABLE public.evaluations_v40 DROP CONSTRAINT %I', constraint_name);
    ELSE
        RAISE NOTICE '외래 키 제약이 존재하지 않습니다.';
    END IF;
END $$;


-- ===================================
-- 2. 새로운 외래 키 제약 추가 (CASCADE)
-- ===================================

ALTER TABLE public.evaluations_v40
    ADD CONSTRAINT fk_evaluations_v40_collected_data
    FOREIGN KEY (collected_data_id)
    REFERENCES public.collected_data_v40(id)
    ON DELETE CASCADE;  -- 수집 데이터 삭제 시 평가도 함께 삭제

-- 확인 메시지
DO $$
BEGIN
    RAISE NOTICE '===================================';
    RAISE NOTICE 'evaluations_v40 외래 키 수정 완료!';
    RAISE NOTICE '===================================';
    RAISE NOTICE '';
    RAISE NOTICE '변경 내용:';
    RAISE NOTICE '  - 기존: ON DELETE SET NULL';
    RAISE NOTICE '  - 변경: ON DELETE CASCADE';
    RAISE NOTICE '';
    RAISE NOTICE '효과:';
    RAISE NOTICE '  ✅ collected_data_v40에서 데이터 삭제 시';
    RAISE NOTICE '  ✅ evaluations_v40의 해당 평가도 자동 삭제';
    RAISE NOTICE '  ✅ 고아 평가 방지';
    RAISE NOTICE '';
END $$;
