/**
 * Project Grid Task ID: P4BA9
 * 작업명: 광고 관리 API - Database Schema
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P2D1
 * 설명: 광고 관리를 위한 데이터베이스 스키마 및 함수
 */

-- ================================================
-- 1. advertisements 테이블 (광고)
-- ================================================

CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  placement VARCHAR(50) NOT NULL CHECK (placement IN ('main', 'sidebar', 'post_top', 'post_bottom')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  impressions INTEGER DEFAULT 0 CHECK (impressions >= 0),
  clicks INTEGER DEFAULT 0 CHECK (clicks >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

COMMENT ON TABLE public.advertisements IS '광고 관리 테이블';
COMMENT ON COLUMN public.advertisements.placement IS '노출 위치: main, sidebar, post_top, post_bottom';
COMMENT ON COLUMN public.advertisements.impressions IS '광고 노출 수';
COMMENT ON COLUMN public.advertisements.clicks IS '광고 클릭 수';
COMMENT ON COLUMN public.advertisements.is_active IS '광고 활성화 여부';

-- ================================================
-- 2. 인덱스 생성
-- ================================================

CREATE INDEX IF NOT EXISTS idx_ads_placement ON public.advertisements(placement);
CREATE INDEX IF NOT EXISTS idx_ads_active ON public.advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_ads_dates ON public.advertisements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON public.advertisements(created_at DESC);

-- ================================================
-- 3. RLS (Row Level Security) 정책
-- ================================================

-- RLS 활성화
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성 광고를 조회 가능 (노출 기간 내)
CREATE POLICY "Anyone can view active advertisements"
  ON public.advertisements FOR SELECT
  USING (
    is_active = TRUE AND
    NOW() >= start_date AND
    NOW() <= end_date
  );

-- 관리자만 광고 관리 가능
CREATE POLICY "Admins can manage advertisements"
  ON public.advertisements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ================================================
-- 4. 트리거 함수 (updated_at 자동 업데이트)
-- ================================================

-- updated_at 트리거 추가
CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================
-- 5. Database Functions (광고 통계 증가)
-- ================================================

-- 광고 노출 수 증가 함수
CREATE OR REPLACE FUNCTION public.increment_ad_impressions(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.advertisements
  SET impressions = impressions + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_ad_impressions IS '광고 노출 수 증가';

-- 광고 클릭 수 증가 함수
CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.advertisements
  SET clicks = clicks + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_ad_clicks IS '광고 클릭 수 증가';

-- ================================================
-- 6. 광고 통계 뷰 (선택적)
-- ================================================

CREATE OR REPLACE VIEW public.advertisement_stats AS
SELECT
  id,
  title,
  placement,
  impressions,
  clicks,
  CASE
    WHEN impressions > 0 THEN ROUND((clicks::NUMERIC / impressions::NUMERIC) * 100, 2)
    ELSE 0
  END AS ctr_percentage,
  is_active,
  start_date,
  end_date,
  created_at,
  updated_at
FROM public.advertisements
ORDER BY created_at DESC;

COMMENT ON VIEW public.advertisement_stats IS '광고 통계 뷰 (CTR 포함)';

-- ================================================
-- 완료
-- ================================================

COMMENT ON SCHEMA public IS 'PoliticianFinder 광고 관리 스키마 - P4BA9';
