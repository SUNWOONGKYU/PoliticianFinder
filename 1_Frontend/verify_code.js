async function verifyCode() {
  const response = await fetch('https://www.politicianfinder.ai.kr/api/politicians/verify/check-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      verification_id: '6682f226-0ab6-4bad-bdaa-2d342d8c3a63',
      code: '888000'
    })
  });
  
  const result = await response.json();
  console.log('=== 인증코드 확인 결과 ===');
  console.log(JSON.stringify(result, null, 2));
}

verifyCode().catch(console.error);
