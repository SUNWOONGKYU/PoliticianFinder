-- PHASE GATES 테이블
-- Phase별 통과 조건을 별도로 관리
-- 생성일: 2025-11-06

-- 1. Phase Gates 테이블 생성
CREATE TABLE IF NOT EXISTS phase_gates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 기본 정보
    phase INTEGER UNIQUE NOT NULL,
    gate_name TEXT NOT NULL,

    -- 통과 조건
    criteria TEXT NOT NULL,

    -- 상태 관리
    status VARCHAR(20) DEFAULT '대기',  -- 대기, 검증중, 통과

    -- 검증 정보
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    verification_notes TEXT,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_phase_gates_phase ON phase_gates(phase);
CREATE INDEX IF NOT EXISTS idx_phase_gates_status ON phase_gates(status);

-- 3. RLS 정책
ALTER TABLE phase_gates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON phase_gates;
CREATE POLICY "Allow public read access"
    ON phase_gates
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Allow public write access" ON phase_gates;
CREATE POLICY "Allow public write access"
    ON phase_gates
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 4. updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_phase_gates_modtime ON phase_gates;
CREATE TRIGGER update_phase_gates_modtime
    BEFORE UPDATE ON phase_gates
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 완료!
