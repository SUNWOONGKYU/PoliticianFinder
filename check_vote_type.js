const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8'
);

async function checkVoteTypes() {
  console.log('=== 기존 투표 데이터에서 vote_type 확인 ===\n');

  const { data: votes, error } = await supabase
    .from('votes')
    .select('vote_type')
    .limit(10);

  if (error) {
    console.log('❌ 조회 실패:', error.message);
    return;
  }

  if (votes.length === 0) {
    console.log('투표 데이터가 없습니다. 다양한 값으로 테스트해봅니다.\n');

    // 다양한 vote_type 테스트
    const testTypes = ['up', 'down', 'upvote', 'downvote', '1', '-1', 'like', 'dislike'];

    for (const type of testTypes) {
      const { error: testError } = await supabase
        .from('votes')
        .insert({
          user_id: '85b6b16a-588b-426c-91ab-9cb3eb2dbf5b',
          post_id: '5f66c4e7-4412-46f4-99ad-55ff83f94795',
          vote_type: type
        });

      if (testError) {
        console.log(`${type}: ❌ ${testError.message.includes('check constraint') ? '불허' : testError.message.substring(0,30)}`);
      } else {
        console.log(`${type}: ✅ 허용됨!`);
        // 성공한 것은 삭제
        await supabase.from('votes').delete()
          .eq('user_id', '85b6b16a-588b-426c-91ab-9cb3eb2dbf5b')
          .eq('post_id', '5f66c4e7-4412-46f4-99ad-55ff83f94795');
      }
    }
  } else {
    const types = [...new Set(votes.map(v => v.vote_type))];
    console.log('사용 중인 vote_type:', types.join(', '));
  }
}

checkVoteTypes();
