-- Create notices table for announcements
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read notices
CREATE POLICY "Anyone can view notices"
  ON public.notices FOR SELECT
  USING (true);

-- Policy: Only admins can insert/update/delete notices (using user_id)
CREATE POLICY "Admins can insert notices"
  ON public.notices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update notices"
  ON public.notices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete notices"
  ON public.notices FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create index
CREATE INDEX IF NOT EXISTS notices_created_at_idx ON public.notices(created_at DESC);
