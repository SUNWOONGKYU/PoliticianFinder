async function editProfile() {
  const response = await fetch('https://www.politicianfinder.ai.kr/api/politicians/9dc9f3b4', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      session_token: 'c8ace5ced1b9eddc2fd0838315ee38b0d84008c8cae1b72f74025c0896e2a5ad',
      bio: '인천 미추홀구 주민을 위해 일하는 정의당 광역의원입니다. 주민의 목소리에 귀 기울이겠습니다.'
    })
  });
  
  const result = await response.json();
  console.log('=== 프로필 수정 결과 ===');
  console.log('Status:', response.status);
  console.log(JSON.stringify(result, null, 2));
}

editProfile().catch(console.error);
