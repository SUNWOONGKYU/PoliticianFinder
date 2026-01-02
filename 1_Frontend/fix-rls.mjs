import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwjmfewyshhwpgwdtrus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3am1mZXd5c2hod3Bnd2R0cnVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU3MTU1MSwiZXhwIjoyMDc5MTQ3NTUxfQ.ZMNl9_lCJQMG8lC0MEQjHrLEuYbCFJYsVsBIzvwnj1s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log('=== RLS 정책 확인 ===\n');

  // RLS가 활성화되어 있는지 확인하기 위해 SQL 실행
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'report_purchases'
    `
  });

  if (error) {
    console.log('RPC 실패, 대안 시도...');
    
    // 대안: 테이블 정보 확인
    const { data: tables } = await supabase
      .from('report_purchases')
      .select('*')
      .limit(0);
    
    console.log('테이블 접근 가능 (service role)');
  }

  // RLS 정책 비활성화 시도 (service role로)
  console.log('\n해결책: 관리자 페이지에서 서버 API 사용 필요');
  console.log('또는 RLS 정책에 관리자 접근 허용 추가 필요');
}

checkRLS().catch(console.error);
