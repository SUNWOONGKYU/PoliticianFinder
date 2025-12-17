const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8'
);

async function checkInquiriesTable() {
  console.log('=== inquiries 테이블 구조 확인 ===\n');

  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ 에러:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('컬럼 목록:');
    Object.keys(data[0]).forEach(col => {
      console.log('  -', col, ':', typeof data[0][col], '=', data[0][col]);
    });
  } else {
    console.log('테이블에 데이터가 없습니다. 빈 select로 컬럼 확인...');

    // Try to get column info by inserting a test record
    const { data: testData, error: testError } = await supabase
      .from('inquiries')
      .insert({
        email: 'test@test.com',
        title: 'test title',
        content: 'test content'
      })
      .select();

    if (testError) {
      console.log('테스트 삽입 에러:', testError.message);
      console.log('에러 상세:', testError);
    } else {
      console.log('\n테스트 데이터 삽입 성공:');
      console.log('컬럼 목록:');
      Object.keys(testData[0]).forEach(col => {
        console.log('  -', col);
      });

      // Delete test record
      await supabase.from('inquiries').delete().eq('id', testData[0].id);
      console.log('\n테스트 데이터 삭제됨');
    }
  }
}

checkInquiriesTable();
