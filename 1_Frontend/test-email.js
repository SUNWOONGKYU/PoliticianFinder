// Resend 이메일 발송 테스트 스크립트
// 사용법: node test-email.js

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('🚀 Resend 이메일 발송 테스트 시작...\n');

  // API 키 확인
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY가 설정되지 않았습니다!');
    console.log('💡 .env.local 파일에 RESEND_API_KEY를 추가해주세요.');
    process.exit(1);
  }

  console.log('✅ API 키 확인 완료');
  console.log(`📧 발신 이메일: ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}\n`);

  try {
    // 테스트 이메일 발송
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: ['wksun999@hanmail.net'], // 실제 테스트용 주소
      subject: '[테스트] PoliticianFinder 이메일 시스템',
      html: `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border: 1px solid #e0e0e0;
    }
    .success {
      background: #10b981;
      color: white;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏛️ PoliticianFinder</h1>
    <p>이메일 시스템 테스트</p>
  </div>

  <div class="content">
    <h2>✅ 테스트 성공!</h2>
    <p>Resend 이메일 시스템이 정상적으로 작동하고 있습니다.</p>

    <div class="success">
      <strong>이메일 발송 성공!</strong>
    </div>

    <h3>📋 테스트 정보:</h3>
    <ul>
      <li>발송 시간: ${new Date().toLocaleString('ko-KR')}</li>
      <li>시스템: PoliticianFinder Email Service</li>
      <li>상태: 정상 작동</li>
    </ul>

    <p>이제 실제 문의 답변 이메일을 발송할 수 있습니다!</p>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('❌ 이메일 발송 실패:', error);
      process.exit(1);
    }

    console.log('✅ 이메일 발송 성공!');
    console.log('📨 이메일 ID:', data.id);
    console.log('\n💡 wksun999@hanmail.net로 테스트 이메일이 발송되었습니다.');
    console.log('💡 받은편지함을 확인해주세요. (스팸함도 확인!)');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

testEmail();
