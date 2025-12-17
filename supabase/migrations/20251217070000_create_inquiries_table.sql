-- 문의하기 테이블 생성
-- 고객센터 문의 내용을 저장하고 관리자가 조회할 수 있도록 함

CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 문의자 정보
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,

  -- 문의 내용
  subject TEXT,  -- 문의 유형 (일반문의, 신고, 오류제보 등)
  message TEXT NOT NULL,

  -- 처리 상태
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),

  -- 관리자 메모
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),

  -- 회원인 경우 연결
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON public.inquiries(email);

-- RLS 활성화
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 누구나 문의 등록 가능
CREATE POLICY "Anyone can create inquiry"
  ON public.inquiries
  FOR INSERT
  WITH CHECK (true);

-- RLS 정책: 본인 문의만 조회 가능 (이메일 기준)
CREATE POLICY "Users can view own inquiries"
  ON public.inquiries
  FOR SELECT
  USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
    OR user_id = auth.uid()
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_inquiries_updated_at();

-- 테이블 코멘트
COMMENT ON TABLE public.inquiries IS '고객센터 문의 테이블';
COMMENT ON COLUMN public.inquiries.status IS 'pending=대기중, in_progress=처리중, resolved=해결됨, closed=종료';
