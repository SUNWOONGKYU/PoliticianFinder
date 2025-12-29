async function createPost() {
  const response = await fetch('https://www.politicianfinder.ai.kr/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subject: '안녕하세요, 인천 미추홀구 광역의원 안태준입니다',
      content: '미추홀구 주민 여러분 안녕하세요. 정의당 소속 광역의원 안태준입니다. 주민 여러분의 목소리에 항상 귀 기울이겠습니다.',
      author_type: 'politician',
      politician_id: '9dc9f3b4',
      session_token: 'c8ace5ced1b9eddc2fd0838315ee38b0d84008c8cae1b72f74025c0896e2a5ad'
    })
  });
  
  const result = await response.json();
  console.log('=== 게시글 작성 결과 ===');
  console.log('Status:', response.status);
  console.log(JSON.stringify(result, null, 2));
}

createPost().catch(console.error);
