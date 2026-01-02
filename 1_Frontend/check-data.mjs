import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwjmfewyshhwpgwdtrus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3am1mZXd5c2hod3Bnd2R0cnVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU3MTU1MSwiZXhwIjoyMDc5MTQ3NTUxfQ.ZMNl9_lCJQMG8lC0MEQjHrLEuYbCFJYsVsBIzvwnj1s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('=== report_purchases 테이블 확인 ===\n');

  // 전체 데이터 조회
  const { data, error, count } = await supabase
    .from('report_purchases')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('조회 실패:', error.message);
    return;
  }

  console.log('총 레코드 수:', count || data?.length || 0);
  
  if (data && data.length > 0) {
    console.log('\n데이터 목록:');
    data.forEach((row, i) => {
      console.log(`\n[${i+1}]`);
      console.log('  ID:', row.id);
      console.log('  구매자:', row.buyer_name);
      console.log('  이메일:', row.buyer_email);
      console.log('  금액:', row.amount, row.currency);
      console.log('  입금확인:', row.payment_confirmed);
      console.log('  발송:', row.sent);
      console.log('  생성일:', row.created_at);
    });
  } else {
    console.log('데이터 없음!');
  }

  // RLS 정책 확인을 위해 anon 키로 다시 조회
  console.log('\n\n=== anon 키로 조회 (RLS 적용) ===');
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3am1mZXd5c2hod3Bnd2R0cnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NzE1NTEsImV4cCI6MjA3OTE0NzU1MX0.HVfCiPBGMpfdxwm5sYMZYSZMXvPd5McYwBNgSxvxlpQ';
  const anonClient = createClient(supabaseUrl, anonKey);
  
  const { data: anonData, error: anonError } = await anonClient
    .from('report_purchases')
    .select('*');

  if (anonError) {
    console.log('anon 조회 실패:', anonError.message);
    console.log('→ RLS 정책으로 인해 접근 차단됨');
  } else {
    console.log('anon 조회 결과:', anonData?.length || 0, '건');
  }
}

checkData().catch(console.error);
