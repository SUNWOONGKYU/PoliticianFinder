// P3BA37 완료 업데이트 스크립트
const https = require('https');

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const updateData = {
  status: '완료',
  progress: 100,
  generated_files: [
    '1_Frontend/src/components/GradeUpgradeModal.tsx',
    '1_Frontend/src/components/NotificationProvider.tsx',
    '1_Frontend/src/hooks/useGradeNotification.ts',
    '1_Frontend/src/app/mypage/page.tsx (수정)'
  ].join(', '),
  build_result: '✅ 성공',
  test_history: 'Build ✅ | Type Check ✅',
  validation_result: '✅ 통과',
  remarks: '등급 승급 모달(활동등급 ML1-10, 영향력등급 방랑자~군주), 토스트 알림, LocalStorage 기반 등급 변화 감지 구현 완료'
};

const url = new URL(`${SUPABASE_URL}/rest/v1/project_grid_tasks_revised?task_id=eq.P3BA37`);

const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=representation'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('✅ P3BA37 업데이트 성공!');
      const result = JSON.parse(data);
      if (result.length > 0) {
        console.log('Updated task:', result[0].task_id, '-', result[0].task_name);
        console.log('Status:', result[0].status);
        console.log('Progress:', result[0].progress);
      }
    } else {
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(JSON.stringify(updateData));
req.end();
