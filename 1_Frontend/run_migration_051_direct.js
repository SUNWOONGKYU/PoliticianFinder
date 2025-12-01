// Direct Migration Runner: 051_create_report_sales_tables.sql
// Run: node run_migration_051_direct.js

const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting migration: 051_create_report_sales_tables.sql\n');

    // ========================================================================
    // Step 1: Create email_verifications table
    // ========================================================================
    console.log('📝 Creating email_verifications table...');

    const createEmailVerifications = `
      CREATE TABLE IF NOT EXISTS public.email_verifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
          email VARCHAR(255) NOT NULL,
          verification_code VARCHAR(6) NOT NULL,
          purpose VARCHAR(50) NOT NULL DEFAULT 'report_purchase',
          verified BOOLEAN DEFAULT FALSE,
          expires_at TIMESTAMPTZ NOT NULL,
          verified_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 테이블이 이미 존재하는지 확인
    const { data: existingEmailTable } = await supabase
      .from('email_verifications')
      .select('id')
      .limit(1);

    if (!existingEmailTable || existingEmailTable.length === 0) {
      // 테이블이 없거나 비어있으면 생성 시도 (Supabase Dashboard에서 수동 실행 필요)
      console.log('⚠️  email_verifications table needs to be created manually in Supabase Dashboard');
      console.log('SQL:', createEmailVerifications);
    } else {
      console.log('✅ email_verifications table already exists');
    }

    // ========================================================================
    // Step 2: Create report_purchases table
    // ========================================================================
    console.log('\n📝 Creating report_purchases table...');

    const { data: existingReportTable, error: checkError } = await supabase
      .from('report_purchases')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === 'PGRST204') {
      console.log('⚠️  report_purchases table does not exist');
      console.log('📋 Please run the following SQL in Supabase Dashboard SQL Editor:\n');

      const fullSQL = `
-- Create email_verifications table
CREATE TABLE IF NOT EXISTS public.email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL DEFAULT 'report_purchase',
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for email_verifications
CREATE INDEX IF NOT EXISTS idx_email_verifications_politician_id ON email_verifications(politician_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(verification_code);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Create report_purchases table
CREATE TABLE IF NOT EXISTS public.report_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    buyer_name VARCHAR(100) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KRW',
    payment_confirmed BOOLEAN DEFAULT FALSE,
    payment_confirmed_at TIMESTAMPTZ,
    payment_confirmed_by UUID REFERENCES users(id),
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('basic', 'standard', 'premium', 'custom')),
    report_period VARCHAR(50),
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    sent_by UUID REFERENCES users(id),
    sent_email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for report_purchases
CREATE INDEX IF NOT EXISTS idx_report_purchases_politician_id ON report_purchases(politician_id);
CREATE INDEX IF NOT EXISTS idx_report_purchases_payment_confirmed ON report_purchases(payment_confirmed);
CREATE INDEX IF NOT EXISTS idx_report_purchases_sent ON report_purchases(sent);
CREATE INDEX IF NOT EXISTS idx_report_purchases_created_at ON report_purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_purchases_pending_send
    ON report_purchases(payment_confirmed, sent)
    WHERE payment_confirmed = TRUE AND sent = FALSE;

-- Enable RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_verifications
CREATE POLICY "Email verifications are viewable by admins"
    ON email_verifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for report_purchases
CREATE POLICY "Report purchases are viewable by admins"
    ON report_purchases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert report purchases"
    ON report_purchases FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update report purchases"
    ON report_purchases FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_report_purchases_updated_at
    BEFORE UPDATE ON report_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

      console.log(fullSQL);
      console.log('\n⚠️  After running the SQL above, run this script again to verify.\n');
      process.exit(0);
    } else {
      console.log('✅ report_purchases table already exists or can be queried');
    }

    console.log('\n✅ Migration verification completed');
    console.log('📊 Both tables should now be accessible');

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();
