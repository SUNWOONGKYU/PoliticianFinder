/**
 * 종합 기능 테스트 스크립트
 *
 * 테스트 대상:
 * - 정치인: 오세훈 (politician_id: 62e7b453)
 * - 사용자: wksun99@gmail.com
 *
 * 실행 방법:
 * node comprehensive_feature_test.js
 */

const BASE_URL = 'https://politicianfinder.com';

// 테스트 결과 저장
const testResults = {
  timestamp: new Date().toISOString(),
  politician: {
    id: '62e7b453',
    name: '오세훈'
  },
  user: {
    email: 'wksun99@gmail.com'
  },
  tests: []
};

// 테스트 헬퍼
function addTest(category, name, status, details = {}) {
  testResults.tests.push({
    category,
    name,
    status, // 'pass', 'fail', 'skip'
    details,
    timestamp: new Date().toISOString()
  });
}

// API 호출 헬퍼
async function fetchAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n📡 API 호출: ${options.method || 'GET'} ${endpoint}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();
    console.log(`✅ 응답: ${response.status} ${response.statusText}`);

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

// 1. 홈 화면 - 별점 표시 테스트
async function testHomeRatings() {
  console.log('\n\n=== 1. 홈 화면 별점 표시 테스트 ===');

  const result = await fetchAPI('/api/politicians');

  if (result.ok && result.data.success) {
    const politicians = result.data.politicians;
    const ohSehoon = politicians.find(p => p.id === '62e7b453');

    if (ohSehoon) {
      console.log(`\n오세훈 정보:`);
      console.log(`- 이름: ${ohSehoon.name}`);
      console.log(`- 평균 평점: ${ohSehoon.userRating || 0}`);
      console.log(`- 평가 수: ${ohSehoon.ratingCount || 0}`);
      console.log(`- 별 표시: ${'★'.repeat(Math.round(ohSehoon.userRating || 0))}${'☆'.repeat(5 - Math.round(ohSehoon.userRating || 0))}`);

      addTest('홈 화면', '오세훈 별점 표시', 'pass', {
        rating: ohSehoon.userRating,
        count: ohSehoon.ratingCount,
        stars: '★'.repeat(Math.round(ohSehoon.userRating || 0)) + '☆'.repeat(5 - Math.round(ohSehoon.userRating || 0))
      });
    } else {
      console.log('❌ 오세훈 정보를 찾을 수 없습니다.');
      addTest('홈 화면', '오세훈 별점 표시', 'fail', { error: '정치인 정보 없음' });
    }
  } else {
    console.log('❌ API 호출 실패');
    addTest('홈 화면', '오세훈 별점 표시', 'fail', { error: result.error || 'API 호출 실패' });
  }
}

// 2. 정치인 상세 페이지
async function testPoliticianDetail() {
  console.log('\n\n=== 2. 정치인 상세 페이지 테스트 ===');

  const result = await fetchAPI('/api/politicians/62e7b453');

  if (result.ok && result.data.success) {
    const politician = result.data.politician;
    console.log(`\n오세훈 상세 정보:`);
    console.log(`- 이름: ${politician.name}`);
    console.log(`- 소속: ${politician.party}`);
    console.log(`- 직위: ${politician.position}`);
    console.log(`- 총점: ${politician.totalScore || 0}`);
    console.log(`- 등급: ${politician.grade || 'N/A'}`);
    console.log(`- 평균 평점: ${politician.userRating || 0}`);
    console.log(`- 평가 수: ${politician.ratingCount || 0}`);

    addTest('정치인 상세', '오세훈 정보 조회', 'pass', {
      name: politician.name,
      party: politician.party,
      rating: politician.userRating,
      count: politician.ratingCount
    });
  } else {
    console.log('❌ API 호출 실패');
    addTest('정치인 상세', '오세훈 정보 조회', 'fail', { error: result.error || 'API 호출 실패' });
  }
}

// 3. 평가 기능 테스트 (인증 필요 - 스킵)
async function testRating() {
  console.log('\n\n=== 3. 평가 기능 테스트 ===');
  console.log('⚠️ 인증이 필요한 기능입니다. 브라우저에서 수동 테스트 필요.');

  addTest('평가 기능', '평점 등록', 'skip', { reason: '인증 필요' });
}

// 4. 커뮤니티 - 게시글 목록
async function testCommunityPosts() {
  console.log('\n\n=== 4. 커뮤니티 게시글 목록 테스트 ===');

  const result = await fetchAPI('/api/posts?limit=20');

  if (result.ok && result.data.success) {
    const posts = result.data.posts;
    console.log(`\n게시글 목록:`);
    console.log(`- 총 게시글 수: ${posts.length}`);
    console.log(`- 페이지당 제한: 20개`);

    if (posts.length > 0) {
      const firstPost = posts[0];
      console.log(`\n첫 번째 게시글:`);
      console.log(`- 제목: ${firstPost.title}`);
      console.log(`- 작성자: ${firstPost.author}`);
      console.log(`- 작성자 타입: ${firstPost.author_type}`);
      console.log(`- 작성일: ${firstPost.created_at}`);

      addTest('커뮤니티', '게시글 목록 조회', 'pass', {
        totalCount: posts.length,
        limit: 20,
        firstPost: {
          title: firstPost.title,
          author: firstPost.author,
          authorType: firstPost.author_type
        }
      });
    } else {
      addTest('커뮤니티', '게시글 목록 조회', 'pass', { totalCount: 0 });
    }
  } else {
    console.log('❌ API 호출 실패');
    addTest('커뮤니티', '게시글 목록 조회', 'fail', { error: result.error || 'API 호출 실패' });
  }
}

// 5. 커뮤니티 - 게시글 상세 (첫 번째 게시글)
async function testPostDetail() {
  console.log('\n\n=== 5. 커뮤니티 게시글 상세 테스트 ===');

  // 먼저 게시글 목록에서 첫 번째 게시글 ID 가져오기
  const listResult = await fetchAPI('/api/posts?limit=1');

  if (listResult.ok && listResult.data.success && listResult.data.posts.length > 0) {
    const firstPostId = listResult.data.posts[0].id;

    const result = await fetchAPI(`/api/posts/${firstPostId}`);

    if (result.ok && result.data.success) {
      const post = result.data.post;
      console.log(`\n게시글 상세 정보:`);
      console.log(`- 제목: ${post.title}`);
      console.log(`- 작성자: ${post.author}`);
      console.log(`- 작성자 타입: ${post.author_type}`);
      console.log(`- 내용: ${post.content.substring(0, 100)}...`);
      console.log(`- 댓글 수: ${post.comments?.length || 0}`);

      // 작성자 메타데이터 확인
      if (post.author_type === 'user') {
        console.log(`- 회원 레벨: ${post.memberLevel || 'N/A'}`);
        console.log(`- 영주 등급: 표시 여부 확인 필요`);
      }

      addTest('커뮤니티', '게시글 상세 조회', 'pass', {
        postId: firstPostId,
        author: post.author,
        authorType: post.author_type,
        commentCount: post.comments?.length || 0
      });
    } else {
      console.log('❌ API 호출 실패');
      addTest('커뮤니티', '게시글 상세 조회', 'fail', { error: result.error || 'API 호출 실패' });
    }
  } else {
    console.log('⚠️ 게시글이 없어서 테스트를 건너뜁니다.');
    addTest('커뮤니티', '게시글 상세 조회', 'skip', { reason: '게시글 없음' });
  }
}

// 6. 댓글 기능 테스트 (인증 필요 - 스킵)
async function testComments() {
  console.log('\n\n=== 6. 댓글 기능 테스트 ===');
  console.log('⚠️ 인증이 필요한 기능입니다. 브라우저에서 수동 테스트 필요.');

  addTest('댓글 기능', '댓글 작성', 'skip', { reason: '인증 필요' });
}

// 7. 즐겨찾기 기능 테스트 (인증 필요 - 스킵)
async function testFavorites() {
  console.log('\n\n=== 7. 즐겨찾기 기능 테스트 ===');
  console.log('⚠️ 인증이 필요한 기능입니다. 브라우저에서 수동 테스트 필요.');

  addTest('즐겨찾기', '정치인 즐겨찾기', 'skip', { reason: '인증 필요' });
}

// 결과 요약 출력
function printSummary() {
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(60));

  const passed = testResults.tests.filter(t => t.status === 'pass').length;
  const failed = testResults.tests.filter(t => t.status === 'fail').length;
  const skipped = testResults.tests.filter(t => t.status === 'skip').length;

  console.log(`\n✅ 통과: ${passed}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`⏭️ 건너뜀: ${skipped}개`);
  console.log(`📝 총 테스트: ${testResults.tests.length}개`);

  console.log(`\n\n📋 상세 결과:`);
  testResults.tests.forEach((test, index) => {
    const icon = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⏭️';
    console.log(`${index + 1}. [${icon}] ${test.category} - ${test.name}`);
    if (test.details && Object.keys(test.details).length > 0) {
      console.log(`   상세: ${JSON.stringify(test.details, null, 2).split('\n').join('\n   ')}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('📄 전체 테스트 결과가 comprehensive_test_results.json에 저장되었습니다.');
  console.log('='.repeat(60) + '\n');
}

// 메인 테스트 실행
async function runAllTests() {
  console.log('🚀 종합 기능 테스트 시작');
  console.log(`📅 테스트 시작 시간: ${testResults.timestamp}`);
  console.log(`🏛️ 정치인: ${testResults.politician.name} (${testResults.politician.id})`);
  console.log(`👤 사용자: ${testResults.user.email}`);

  try {
    await testHomeRatings();
    await testPoliticianDetail();
    await testRating();
    await testCommunityPosts();
    await testPostDetail();
    await testComments();
    await testFavorites();

    printSummary();

    // 결과를 JSON 파일로 저장
    const fs = require('fs');
    fs.writeFileSync(
      'comprehensive_test_results.json',
      JSON.stringify(testResults, null, 2),
      'utf-8'
    );

    console.log('✅ 테스트 완료!');
  } catch (error) {
    console.error('\n❌ 테스트 실행 중 오류 발생:');
    console.error(error);
  }
}

// 실행
runAllTests();
