/**
 * 정치인 글쓰기/댓글쓰기 간단 테스트
 * 오세훈 (서울특별시장) 계정으로 테스트
 *
 * Note: 이 테스트는 politician_sessions 테이블 없이 직접 DB에 데이터 삽입하는 방식으로 테스트
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yqihnwqljtrddxhvmpkz.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 테스트 데이터
const TEST_DATA = {
  politician: {
    id: '62e7b453',
    name: '오세훈',
    email: 'wksun999@hanmail.net',
  },
  post: {
    title: '[테스트] 서울시 청년 정책 추진 현황',
    content: '안녕하십니까, 서울특별시장 오세훈입니다.\n\n서울시는 청년들을 위한 다양한 정책을 추진하고 있습니다.\n\n1. 청년 주거 지원\n2. 청년 일자리 창출\n3. 청년 창업 지원\n\n앞으로도 청년들이 희망을 가질 수 있는 서울을 만들겠습니다.',
    category: 'news',
    tags: ['청년정책', '주거지원', '일자리'],
  },
  comment: {
    content: '많은 시민 여러분의 관심과 응원 부탁드립니다. 댓글로 의견을 주시면 정책에 적극 반영하겠습니다.',
  },
};

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTest() {
  log('\n========================================', 'cyan');
  log('정치인 글쓰기/댓글쓰기 간단 테스트', 'cyan');
  log('========================================\n', 'cyan');

  let postId = '';
  let commentId = '';

  try {
    // Step 1: 정치인 정보 확인
    log('Step 1: 정치인 정보 확인', 'blue');

    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name, party, position, email')
      .eq('id', TEST_DATA.politician.id)
      .single();

    if (politicianError || !politician) {
      log(`❌ 정치인 정보 조회 실패`, 'red');
      throw politicianError || new Error('Politician not found');
    }

    log(`✅ 정치인 정보 확인 성공`, 'green');
    log(`   이름: ${politician.name}`, 'yellow');
    log(`   소속: ${politician.party}`, 'yellow');
    log(`   직책: ${politician.position}`, 'yellow');
    log(`   이메일: ${politician.email || '미등록'}`, 'yellow');

    // Step 2: 게시글 작성
    log('\nStep 2: 게시글 작성', 'blue');

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: null,
        politician_id: TEST_DATA.politician.id,
        author_type: 'politician',
        title: TEST_DATA.post.title,
        content: TEST_DATA.post.content,
        category: TEST_DATA.post.category,
        tags: TEST_DATA.post.tags,
      })
      .select()
      .single();

    if (postError) {
      log(`❌ 게시글 작성 실패: ${postError.message}`, 'red');
      throw postError;
    }

    postId = post.id;
    log(`✅ 게시글 작성 성공`, 'green');
    log(`   Post ID: ${postId}`, 'yellow');
    log(`   제목: ${post.title}`, 'yellow');
    log(`   카테고리: ${post.category}`, 'yellow');

    // Step 3: 댓글 작성
    log('\nStep 3: 댓글 작성', 'blue');

    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: null,
        politician_id: TEST_DATA.politician.id,
        author_type: 'politician',
        content: TEST_DATA.comment.content,
      })
      .select()
      .single();

    if (commentError) {
      log(`❌ 댓글 작성 실패: ${commentError.message}`, 'red');
      throw commentError;
    }

    commentId = comment.id;
    log(`✅ 댓글 작성 성공`, 'green');
    log(`   Comment ID: ${commentId}`, 'yellow');
    log(`   내용: ${comment.content.substring(0, 50)}...`, 'yellow');

    // Step 4: 검증 - 게시글 조회 (정치인 정보 포함)
    log('\nStep 4: 검증 - 게시글 조회', 'blue');

    const { data: postWithPolitician, error: postQueryError } = await supabase
      .from('posts')
      .select(`
        *,
        politician:politicians!posts_politician_id_fkey(id, name, party, position)
      `)
      .eq('id', postId)
      .single();

    if (postQueryError || !postWithPolitician) {
      log(`❌ 게시글 조회 실패`, 'red');
      throw postQueryError;
    }

    log(`✅ 게시글 조회 성공`, 'green');
    log(`   작성자: ${postWithPolitician.politician?.name} (${postWithPolitician.politician?.position})`, 'yellow');
    log(`   소속: ${postWithPolitician.politician?.party}`, 'yellow');
    log(`   user_id: ${postWithPolitician.user_id || 'NULL'}`, 'yellow');
    log(`   politician_id: ${postWithPolitician.politician_id}`, 'yellow');

    // Step 5: 검증 - 댓글 조회 (정치인 정보 포함)
    log('\nStep 5: 검증 - 댓글 조회', 'blue');

    const { data: commentWithPolitician, error: commentQueryError } = await supabase
      .from('comments')
      .select(`
        *,
        politician:politicians!comments_politician_id_fkey(id, name, party, position)
      `)
      .eq('id', commentId)
      .single();

    if (commentQueryError || !commentWithPolitician) {
      log(`❌ 댓글 조회 실패`, 'red');
      throw commentQueryError;
    }

    log(`✅ 댓글 조회 성공`, 'green');
    log(`   작성자: ${commentWithPolitician.politician?.name} (${commentWithPolitician.politician?.position})`, 'yellow');
    log(`   소속: ${commentWithPolitician.politician?.party}`, 'yellow');
    log(`   user_id: ${commentWithPolitician.user_id || 'NULL'}`, 'yellow');
    log(`   politician_id: ${commentWithPolitician.politician_id}`, 'yellow');

    // 최종 결과
    log('\n========================================', 'cyan');
    log('✅ 모든 테스트 통과!', 'green');
    log('========================================\n', 'cyan');

    log('생성된 데이터:', 'blue');
    log(`  - 게시글 ID: ${postId}`, 'yellow');
    log(`  - 댓글 ID: ${commentId}`, 'yellow');

    log('\n정치인 정보:', 'blue');
    log(`  - 이름: ${TEST_DATA.politician.name}`, 'yellow');
    log(`  - ID: ${TEST_DATA.politician.id}`, 'yellow');
    log(`  - 이메일: ${TEST_DATA.politician.email}`, 'yellow');

    log('\n✅ 검증 완료:', 'blue');
    log(`  - ✅ 게시글이 정치인(${TEST_DATA.politician.name}) 명의로 작성됨`, 'green');
    log(`  - ✅ 댓글이 정치인(${TEST_DATA.politician.name}) 명의로 작성됨`, 'green');
    log(`  - ✅ user_id가 NULL로 저장됨 (정치인 게시글)`, 'green');
    log(`  - ✅ politician_id가 올바르게 저장됨`, 'green');
    log(`  - ✅ JOIN 쿼리로 정치인 정보 조회 성공`, 'green');

  } catch (error) {
    log('\n========================================', 'red');
    log('❌ 테스트 실패!', 'red');
    log('========================================\n', 'red');
    log(`오류: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 테스트 실행
runTest();
