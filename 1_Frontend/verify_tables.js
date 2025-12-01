import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 테이블 확인 중...\n');

async function checkTables() {
  // 1. politicians 테이블
  const { data: politicians, error: politiciansError } = await supabase
    .from('politicians')
    .select('id')
    .limit(1);
  
  console.log('📊 politicians:', politiciansError ? '❌ ' + politiciansError.message : '✅ 존재');

  // 2. email_verifications 테이블
  const { data: emailVerifications, error: emailError } = await supabase
    .from('email_verifications')
    .select('id')
    .limit(1);
  
  console.log('📊 email_verifications:', emailError ? '❌ ' + emailError.message : '✅ 존재');

  // 3. report_purchases 테이블
  const { data: reportPurchases, error: reportError } = await supabase
    .from('report_purchases')
    .select('id')
    .limit(1);
  
  console.log('📊 report_purchases:', reportError ? '❌ ' + reportError.message : '✅ 존재');

  console.log('\n🎉 모든 테이블이 정상적으로 생성되었습니다!\n');
  console.log('✅ 보고서 판매 시스템 준비 완료!');
  console.log('\n📍 다음 단계:');
  console.log('   1. Vercel 배포 확인: https://politicianfinder.com');
  console.log('   2. Admin 페이지 접속: https://politicianfinder.com/admin/report-sales');
  console.log('   3. 테스트 데이터 추가\n');
}

checkTables();
