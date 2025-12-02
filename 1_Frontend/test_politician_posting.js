/**
 * 정치인 글쓰기/댓글쓰기 End-to-End 테스트
 * 오세훈 (서울특별시장) 계정으로 테스트
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
    subject: '[테스트] 서울시 청년 정책 추진 현황',
    content: '안녕하십니까, 서울특별시장 오세훈입니다.\n\n서울시는 청년들을 위한 다양한 정책을 추진하고 있습니다.\n\n1. 청년 주거 지원\n2. 청년 일자리 창출\n3. 청년 창업 지원\n\n앞으로도 청년들이 희망을 가질 수 있는 서울을 만들겠습니다.',
    category: '정책발표',
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
  log('정치인 글쓰기/댓글쓰기 E2E 테스트', 'cyan');
  log('========================================\n', 'cyan');

  let verificationCode = '';
  let sessionToken = '';
  let postId = '';
  let commentId = '';

  try {
    // Step 1: 이메일 인증 코드 생성
    log('Step 1: 이메일 인증 코드 생성', 'blue');
    verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 후

    const { data: verification, error: verificationError } = await supabase
      .from('email_verifications')
      .insert({
        politician_id: TEST_DATA.politician.id,
        email: TEST_DATA.politician.email,
        verification_code: verificationCode,
        purpose: 'posting',
        verified: false,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (verificationError) {
      log(`❌ 인증 코드 생성 실패: ${verificationError.message}`, 'red');
      throw verificationError;
    }

    log(`✅ 인증 코드 생성 성공: ${verificationCode}`, 'green');

    // Step 2: 인증 코드 확인 및 세션 생성
    log('\nStep 2: 인증 코드 확인 및 영구 세션 생성', 'blue');

    // 인증 코드 확인
    const { data: verificationData, error: checkError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('politician_id', TEST_DATA.politician.id)
      .eq('email', TEST_DATA.politician.email)
      .eq('verification_code', verificationCode)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (checkError || !verificationData) {
      log(`❌ 인증 코드 확인 실패`, 'red');
      throw new Error('Invalid verification code');
    }

    // 인증 코드 verified로 표시
    await supabase
      .from('email_verifications')
      .update({ verified: true })
      .eq('id', verificationData.id);

    // 영구 세션 생성
    const crypto = require('crypto');
    sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiresAt = new Date('2099-12-31T23:59:59Z');

    const { data: session, error: sessionError } = await supabase
      .from('politician_sessions')
      .insert({
        politician_id: TEST_DATA.politician.id,
        session_token: sessionToken,
        expires_at: sessionExpiresAt.toISOString(),
        last_used_at: new Date().toISOString(),
        ip_address: '127.0.0.1',
        user_agent: 'Node.js Test Script',
      })
      .select()
      .single();

    if (sessionError) {
      log(`❌ 세션 생성 실패: ${sessionError.message}`, 'red');
      throw sessionError;
    }

    log(`✅ 세션 생성 성공`, 'green');
    log(`   세션 토큰: ${sessionToken.substring(0, 16)}...`, 'yellow');
    log(`   만료일: ${sessionExpiresAt.toISOString()}`, 'yellow');

    // Step 3: 게시글 작성
    log('\nStep 3: 게시글 작성', 'blue');

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: null,
        politician_id: TEST_DATA.politician.id,
        subject: TEST_DATA.post.subject,
        content: TEST_DATA.post.content,
        category: TEST_DATA.post.category,
        tags: TEST_DATA.post.tags,
        author_type: 'politician',
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
    log(`   제목: ${post.subject}`, 'yellow');

    // Step 4: 댓글 작성
    log('\nStep 4: 댓글 작성', 'blue');

    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: null,
        politician_id: TEST_DATA.politician.id,
        content: TEST_DATA.comment.content,
        parent_id: null,
        author_type: 'politician',
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

    // Step 5: 검증 - 게시글 조회 (정치인 정보 포함)
    log('\nStep 5: 검증 - 게시글 조회', 'blue');

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
    log(`   author_type: ${postWithPolitician.author_type}`, 'yellow');

    // Step 6: 검증 - 댓글 조회 (정치인 정보 포함)
    log('\nStep 6: 검증 - 댓글 조회', 'blue');

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
    log(`   author_type: ${commentWithPolitician.author_type}`, 'yellow');

    // 최종 결과
    log('\n========================================', 'cyan');
    log('✅ 모든 테스트 통과!', 'green');
    log('========================================\n', 'cyan');

    log('생성된 데이터:', 'blue');
    log(`  - 인증 코드: ${verificationCode}`, 'yellow');
    log(`  - 세션 토큰: ${sessionToken.substring(0, 16)}...`, 'yellow');
    log(`  - 게시글 ID: ${postId}`, 'yellow');
    log(`  - 댓글 ID: ${commentId}`, 'yellow');

    log('\n정치인 정보:', 'blue');
    log(`  - 이름: ${TEST_DATA.politician.name}`, 'yellow');
    log(`  - ID: ${TEST_DATA.politician.id}`, 'yellow');
    log(`  - 이메일: ${TEST_DATA.politician.email}`, 'yellow');

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
