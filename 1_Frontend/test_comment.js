async function createComment() {
  // 먼저 다른 게시글에 댓글 달기 (정치인 게시글 목록에서 찾기)
  const postsRes = await fetch('https://www.politicianfinder.ai.kr/api/community/posts?limit=5');
  const postsData = await postsRes.json();
  
  // 방금 작성한 게시글 제외하고 다른 게시글 찾기
  const otherPost = postsData.data.find(p => p.id !== '1c531064-dd10-4a6f-b7c2-24ef5219843e');
  
  if (!otherPost) {
    console.log('댓글 달 게시글이 없습니다. 본인 게시글에 댓글 테스트합니다.');
  }
  
  const targetPostId = otherPost ? otherPost.id : '1c531064-dd10-4a6f-b7c2-24ef5219843e';
  console.log('댓글 대상 게시글:', targetPostId);
  
  const response = await fetch('https://www.politicianfinder.ai.kr/api/comments/politician', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      post_id: targetPostId,
      content: '주민 여러분의 의견 감사합니다. 더 나은 미추홀구를 위해 노력하겠습니다. - 안태준 드림',
      politician_id: '9dc9f3b4',
      session_token: 'c8ace5ced1b9eddc2fd0838315ee38b0d84008c8cae1b72f74025c0896e2a5ad'
    })
  });
  
  const result = await response.json();
  console.log('=== 댓글 작성 결과 ===');
  console.log('Status:', response.status);
  console.log(JSON.stringify(result, null, 2));
}

createComment().catch(console.error);
