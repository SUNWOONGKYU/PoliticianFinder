async function sendCode() {
  const response = await fetch('https://www.politicianfinder.ai.kr/api/politicians/verify/send-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      politician_id: '9dc9f3b4',
      email: 'wksun999@naver.com'
    })
  });
  
  const result = await response.json();
  console.log('=== 인증코드 발송 결과 ===');
  console.log(JSON.stringify(result, null, 2));
}

sendCode().catch(console.error);
