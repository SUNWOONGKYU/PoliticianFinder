import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('='.repeat(60));
console.log('데이터 정리 결과 확인');
console.log('='.repeat(60));

// 1. 정치인 확인
const { data: politicians } = await supabase
  .from('politicians')
  .select('id, name, party, position')
  .order('name');

console.log(`\n1. 전체 정치인: ${politicians.length}명`);

// 가상 정치인 3명
const fakeIds = ['cd8c0263', '9dc9f3b4', '01374f3b'];
const fakePols = politicians.filter(p => fakeIds.includes(p.id));
console.log(`\n가상 정치인 (글 작성용) ${fakePols.length}명:`);
fakePols.forEach((p, i) => {
  console.log(`  ${i+1}. ${p.name} (${p.id}) - ${p.position} - ${p.party}`);
});

// 2. 일반 회원 확인
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, username, email')
  .order('username');

console.log(`\n2. 전체 회원: ${profiles.length}명`);
profiles.forEach((u, i) => {
  console.log(`  ${i+1}. ${u.username || '익명'} (${u.id.substring(0, 8)}...) - ${u.email || 'N/A'}`);
});

// 3. 정치인 게시글 확인
const { data: polPosts } = await supabase
  .from('posts')
  .select('id, title, politician_id, politicians(name)')
  .not('politician_id', 'is', null)
  .order('created_at', { ascending: false })
  .limit(10);

console.log(`\n3. 정치인 게시글: ${polPosts.length}개 (최근 10개)`);
const polPostStats = {};
polPosts.forEach(p => {
  const name = p.politicians?.name || 'Unknown';
  polPostStats[name] = (polPostStats[name] || 0) + 1;
});
Object.entries(polPostStats).forEach(([name, count]) => {
  console.log(`  - ${name}: ${count}개`);
});

// 4. 일반 회원 게시글 확인
const { data: userPosts } = await supabase
  .from('posts')
  .select('id, title, user_id, profiles(username)')
  .is('politician_id', null)
  .order('created_at', { ascending: false })
  .limit(10);

console.log(`\n4. 일반 회원 게시글: ${userPosts.length}개 (최근 10개)`);
const userPostStats = {};
userPosts.forEach(p => {
  const name = p.profiles?.username || '익명';
  userPostStats[name] = (userPostStats[name] || 0) + 1;
});
Object.entries(userPostStats).forEach(([name, count]) => {
  console.log(`  - ${name}: ${count}개`);
});

// 5. 댓글 확인
const { data: comments } = await supabase
  .from('comments')
  .select('id, content, user_id, profiles(username)')
  .order('created_at', { ascending: false })
  .limit(10);

console.log(`\n5. 댓글: ${comments.length}개 (최근 10개)`);
const commentStats = {};
comments.forEach(c => {
  const name = c.profiles?.username || '익명';
  commentStats[name] = (commentStats[name] || 0) + 1;
});
Object.entries(commentStats).forEach(([name, count]) => {
  console.log(`  - ${name}: ${count}개`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ 데이터 정리 확인 완료');
console.log('='.repeat(60));
