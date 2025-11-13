// Node.js 18+ has built-in fetch
const API_BASE = 'http://localhost:3000/api';

const commentTemplates = [
  '좋은 의견입니다. 저도 동의합니다.',
  '이 부분에 대해서는 좀 더 논의가 필요할 것 같습니다.',
  '구체적인 근거가 있으신가요?',
  '제 생각에는 다른 방안도 고려해봐야 할 것 같습니다.',
  '정말 중요한 이슈네요. 관심 가져주셔서 감사합니다.',
  '반대 의견입니다. 이런 문제가 있을 수 있습니다.',
  '실현 가능성을 좀 더 따져봐야 할 것 같아요.',
  '전적으로 동의합니다. 빨리 실행되었으면 좋겠습니다.',
  '이전 정책과 비교해서 어떤 차이가 있나요?',
  '다른 지역의 사례는 어떤지 궁금합니다.',
  '예산 확보는 어떻게 할 계획이신가요?',
  '장기적인 효과를 고려하면 좋을 것 같습니다.',
  '현실적으로 가능한 방안인가요?',
  '이 정책의 수혜 대상은 누구인가요?',
  '부작용은 없을까요?',
  '좋은 시작이라고 생각합니다.',
  '더 나은 대안이 있을 것 같습니다.',
  '시민들의 의견도 듣고 진행하면 좋겠습니다.',
  '전문가의 검토가 필요할 것 같습니다.',
  '법적인 문제는 없나요?',
];

const replyTemplates = [
  '맞는 말씀입니다.',
  '그 부분은 생각 못했네요. 좋은 지적입니다.',
  '저는 다르게 생각합니다.',
  '추가로 이런 점도 고려해야 할 것 같습니다.',
  '동의합니다.',
  '그렇게 단순한 문제가 아닙니다.',
  '좋은 의견 감사합니다.',
  '구체적으로 어떤 방법을 제안하시나요?',
  '정확한 지적입니다.',
  '다른 관점에서 보면 이렇게도 볼 수 있습니다.',
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    // 1. 게시글 목록 가져오기
    console.log('=== 게시글 조회 중... ===');
    const postsResponse = await fetch(`${API_BASE}/posts?limit=30`);
    const postsData = await postsResponse.json();

    if (!postsData.success) {
      console.error('게시글 조회 실패:', postsData.error);
      return;
    }

    const posts = postsData.data;
    console.log(`총 ${posts.length}개의 게시글 발견\n`);

    let createdComments = 0;
    let createdReplies = 0;

    // 2. 각 게시글에 댓글 생성
    for (let idx = 0; idx < posts.length; idx++) {
      const post = posts[idx];
      const postTitle = post.title.length > 30
        ? post.title.substring(0, 30) + '...'
        : post.title;

      console.log(`\n[${idx + 1}/${posts.length}] 게시글: ${postTitle}`);

      // 각 게시글에 2-4개 댓글 생성
      const numComments = 2 + Math.floor(Math.random() * 3);
      console.log(`  생성할 댓글 수: ${numComments}개`);

      const postComments = [];

      for (let i = 0; i < numComments; i++) {
        const commentContent = randomChoice(commentTemplates);

        try {
          const response = await fetch(`${API_BASE}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              post_id: post.id,
              content: commentContent,
            }),
          });

          const result = await response.json();

          if (result.success) {
            createdComments++;
            postComments.push(result.data);
            console.log(`    ✅ 댓글 ${i + 1} 생성: ${commentContent.substring(0, 30)}...`);
          } else {
            console.log(`    ❌ 댓글 생성 실패: ${JSON.stringify(result.error)}`);
          }

          await sleep(100);
        } catch (error) {
          console.log(`    ❌ 오류: ${error.message}`);
        }
      }

      // 3. 일부 댓글에 대댓글 추가 (30% 확률)
      if (postComments.length > 0 && Math.random() < 0.3) {
        const parentComment = randomChoice(postComments);
        const replyContent = randomChoice(replyTemplates);

        try {
          const response = await fetch(`${API_BASE}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              post_id: post.id,
              content: replyContent,
              parent_id: parentComment.id,
            }),
          });

          const result = await response.json();

          if (result.success) {
            createdReplies++;
            console.log(`      ↳ 대댓글 생성: ${replyContent.substring(0, 30)}...`);
          } else {
            console.log(`      ❌ 대댓글 생성 실패: ${JSON.stringify(result.error)}`);
          }

          await sleep(100);
        } catch (error) {
          console.log(`      ❌ 오류: ${error.message}`);
        }
      }
    }

    // 4. 최종 결과
    console.log('\n=== 생성 완료 ===');
    console.log(`총 생성된 댓글: ${createdComments}개`);
    console.log(`총 생성된 대댓글: ${createdReplies}개`);
    console.log(`총 생성: ${createdComments + createdReplies}개`);

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

main();
