// 전체 기능 테스트 및 오류 리포트 생성
const https = require('https');

const BASE_URL = 'https://politician-finder-futug94oy-finder-world.vercel.app';
const CREDENTIALS = {
  email: 'wksun999@naver.com',
  password: 'na5215900'
};

let sessionCookie = '';
let testResults = [];
let currentUser = null;
let createdPostId = null;

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'FullTestScript/1.0',
      }
    };

    if (sessionCookie) {
      options.headers['Cookie'] = sessionCookie;
    }

    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      if (res.headers['set-cookie']) {
        sessionCookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
      }

      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function addResult(category, testName, status, details, response = null) {
  testResults.push({
    category,
    testName,
    status, // 'PASS', 'FAIL', 'ERROR'
    details,
    response: response ? JSON.stringify(response).substring(0, 500) : null,
    timestamp: new Date().toISOString()
  });

  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${category}] ${testName}: ${details}`);
}

async function runAllTests() {
  console.log('='.repeat(70));
  console.log('전체 기능 테스트 시작');
  console.log('테스트 계정:', CREDENTIALS.email);
  console.log('테스트 시간:', new Date().toISOString());
  console.log('='.repeat(70));
  console.log('');

  // ========== 1. 인증 테스트 ==========
  console.log('\n[1] 인증 기능 테스트');
  console.log('-'.repeat(50));

  // 1-1. 로그인
  try {
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      email: CREDENTIALS.email,
      password: CREDENTIALS.password
    });

    if (loginResult.status === 200 && loginResult.data.success) {
      currentUser = loginResult.data.user;
      addResult('인증', '로그인', 'PASS', `사용자 ID: ${currentUser?.id?.substring(0, 8)}...`);
    } else {
      addResult('인증', '로그인', 'FAIL', loginResult.data.error?.message || '로그인 실패', loginResult.data);
      console.log('\n❌ 로그인 실패로 테스트 중단');
      return generateReport();
    }
  } catch (error) {
    addResult('인증', '로그인', 'ERROR', error.message);
    return generateReport();
  }

  // 1-2. 내 정보 조회
  try {
    const meResult = await makeRequest('GET', '/api/auth/me');
    if (meResult.status === 200 && meResult.data.success) {
      addResult('인증', '내 정보 조회', 'PASS', `닉네임: ${meResult.data.profile?.nickname || meResult.data.user?.email}`);
    } else {
      addResult('인증', '내 정보 조회', 'FAIL', meResult.data.error || '조회 실패', meResult.data);
    }
  } catch (error) {
    addResult('인증', '내 정보 조회', 'ERROR', error.message);
  }

  // ========== 2. 정치인 검색 테스트 ==========
  console.log('\n[2] 정치인 검색 테스트');
  console.log('-'.repeat(50));

  let searchedPoliticianId = null;

  // 2-1. 정치인 검색 (이름)
  try {
    const searchResult = await makeRequest('GET', '/api/politicians/search?q=오세훈');
    if (searchResult.status === 200 && searchResult.data.success) {
      const count = searchResult.data.data?.length || 0;
      if (count > 0 && searchResult.data.data[0].id) {
        searchedPoliticianId = searchResult.data.data[0].id;
        addResult('정치인', '정치인 검색 (이름)', 'PASS', `검색 결과: ${count}개, ID: ${searchedPoliticianId}`);
      } else {
        addResult('정치인', '정치인 검색 (이름)', 'FAIL', 'ID가 반환되지 않음', searchResult.data);
      }
    } else {
      addResult('정치인', '정치인 검색 (이름)', 'FAIL', searchResult.data.error || '검색 실패', searchResult.data);
    }
  } catch (error) {
    addResult('정치인', '정치인 검색 (이름)', 'ERROR', error.message);
  }

  // 2-2. 정치인 검색 (정당)
  try {
    const searchResult = await makeRequest('GET', '/api/politicians/search?q=국민의힘');
    if (searchResult.status === 200 && searchResult.data.success) {
      addResult('정치인', '정치인 검색 (정당)', 'PASS', `검색 결과: ${searchResult.data.data?.length || 0}개`);
    } else {
      addResult('정치인', '정치인 검색 (정당)', 'FAIL', searchResult.data.error || '검색 실패', searchResult.data);
    }
  } catch (error) {
    addResult('정치인', '정치인 검색 (정당)', 'ERROR', error.message);
  }

  // 2-3. 정치인 상세 조회
  if (searchedPoliticianId) {
    try {
      const detailResult = await makeRequest('GET', `/api/politicians/${searchedPoliticianId}`);
      if (detailResult.status === 200 && detailResult.data.success) {
        addResult('정치인', '정치인 상세 조회', 'PASS', `이름: ${detailResult.data.data?.name}`);
      } else {
        addResult('정치인', '정치인 상세 조회', 'FAIL', detailResult.data.error || '조회 실패', detailResult.data);
      }
    } catch (error) {
      addResult('정치인', '정치인 상세 조회', 'ERROR', error.message);
    }
  }

  // ========== 3. 게시글 테스트 ==========
  console.log('\n[3] 게시글 기능 테스트');
  console.log('-'.repeat(50));

  // 3-1. 게시글 목록 조회
  try {
    const postsResult = await makeRequest('GET', '/api/posts?limit=5');
    if (postsResult.status === 200 && postsResult.data.success) {
      addResult('게시글', '게시글 목록 조회', 'PASS', `게시글 수: ${postsResult.data.data?.length || 0}개`);
    } else {
      addResult('게시글', '게시글 목록 조회', 'FAIL', postsResult.data.error || '조회 실패', postsResult.data);
    }
  } catch (error) {
    addResult('게시글', '게시글 목록 조회', 'ERROR', error.message);
  }

  // 3-2. 게시글 작성 (정치인 태깅 없이)
  try {
    const createResult = await makeRequest('POST', '/api/posts', {
      subject: '테스트 게시글 - 태깅 없음 ' + Date.now(),
      content: '이것은 정치인 태깅 없는 일반 테스트 게시글입니다. 자동화 테스트에서 생성되었습니다.',
      category: 'general',
      politician_id: null,
      tags: ['테스트', '자동화']
    });

    if (createResult.status === 201 && createResult.data.success) {
      addResult('게시글', '게시글 작성 (태깅 없음)', 'PASS', `게시글 ID: ${createResult.data.data?.id}`);
    } else {
      addResult('게시글', '게시글 작성 (태깅 없음)', 'FAIL', createResult.data.error?.message || '작성 실패', createResult.data);
    }
  } catch (error) {
    addResult('게시글', '게시글 작성 (태깅 없음)', 'ERROR', error.message);
  }

  // 3-3. 게시글 작성 (정치인 태깅)
  if (searchedPoliticianId) {
    try {
      const createResult = await makeRequest('POST', '/api/posts', {
        subject: '테스트 게시글 - 정치인 태깅 ' + Date.now(),
        content: '이것은 정치인 태깅이 있는 테스트 게시글입니다. 오세훈 정치인이 태깅되어야 합니다.',
        category: 'general',
        politician_id: searchedPoliticianId,
        tags: ['테스트', '정치인태깅']
      });

      if (createResult.status === 201 && createResult.data.success) {
        createdPostId = createResult.data.data?.id;
        const hasPoliticianId = createResult.data.data?.politician_id === searchedPoliticianId;
        if (hasPoliticianId) {
          addResult('게시글', '게시글 작성 (정치인 태깅)', 'PASS', `게시글 ID: ${createdPostId}, politician_id: ${createResult.data.data?.politician_id}`);
        } else {
          addResult('게시글', '게시글 작성 (정치인 태깅)', 'FAIL', `politician_id 불일치: expected ${searchedPoliticianId}, got ${createResult.data.data?.politician_id}`, createResult.data);
        }
      } else {
        addResult('게시글', '게시글 작성 (정치인 태깅)', 'FAIL', createResult.data.error?.message || '작성 실패', createResult.data);
      }
    } catch (error) {
      addResult('게시글', '게시글 작성 (정치인 태깅)', 'ERROR', error.message);
    }
  }

  // 3-4. 게시글 상세 조회 (정치인 정보 포함 확인)
  if (createdPostId) {
    try {
      const detailResult = await makeRequest('GET', `/api/posts/${createdPostId}`);
      if (detailResult.status === 200 && detailResult.data.success) {
        const postData = detailResult.data.data;
        const hasPoliticians = !!postData.politicians;
        const hasUsers = !!postData.users;

        let details = `제목: ${postData.title?.substring(0, 20)}...`;
        if (hasPoliticians) {
          details += `, 태깅된 정치인: ${postData.politicians?.name}`;
        }
        if (hasUsers) {
          details += `, 작성자: ${postData.users?.nickname || postData.users?.name}`;
        }

        if (hasPoliticians) {
          addResult('게시글', '게시글 상세 조회 (정치인 정보)', 'PASS', details);
        } else {
          addResult('게시글', '게시글 상세 조회 (정치인 정보)', 'FAIL', 'politicians 정보 없음', detailResult.data);
        }

        if (hasUsers) {
          addResult('게시글', '게시글 상세 조회 (작성자 정보)', 'PASS', `작성자: ${postData.users?.nickname || postData.users?.name}`);
        } else {
          addResult('게시글', '게시글 상세 조회 (작성자 정보)', 'FAIL', 'users 정보 없음', detailResult.data);
        }
      } else {
        addResult('게시글', '게시글 상세 조회', 'FAIL', detailResult.data.error || '조회 실패', detailResult.data);
      }
    } catch (error) {
      addResult('게시글', '게시글 상세 조회', 'ERROR', error.message);
    }
  }

  // ========== 4. 투표/공감 테스트 ==========
  console.log('\n[4] 투표/공감 기능 테스트');
  console.log('-'.repeat(50));

  if (createdPostId) {
    // 4-1. 공감 (like)
    try {
      const voteResult = await makeRequest('POST', '/api/votes', {
        post_id: createdPostId,
        vote_type: 'like'
      });

      if (voteResult.status === 201 && voteResult.data.success) {
        addResult('투표', '공감 (like)', 'PASS', '투표 성공');
      } else if (voteResult.status === 409) {
        addResult('투표', '공감 (like)', 'PASS', '이미 투표됨 (정상 동작)');
      } else {
        addResult('투표', '공감 (like)', 'FAIL', voteResult.data.error?.message || voteResult.data.error || '투표 실패', voteResult.data);
      }
    } catch (error) {
      addResult('투표', '공감 (like)', 'ERROR', error.message);
    }

    // 4-2. 투표 조회
    try {
      const votesResult = await makeRequest('GET', `/api/votes?post_id=${createdPostId}`);
      if (votesResult.status === 200 && votesResult.data.success) {
        const summary = votesResult.data.summary;
        addResult('투표', '투표 조회', 'PASS', `좋아요: ${summary?.likes || 0}, 싫어요: ${summary?.dislikes || 0}`);
      } else {
        addResult('투표', '투표 조회', 'FAIL', votesResult.data.error || '조회 실패', votesResult.data);
      }
    } catch (error) {
      addResult('투표', '투표 조회', 'ERROR', error.message);
    }
  }

  // ========== 5. 댓글 테스트 ==========
  console.log('\n[5] 댓글 기능 테스트');
  console.log('-'.repeat(50));

  if (createdPostId) {
    // 5-1. 댓글 작성
    try {
      const commentResult = await makeRequest('POST', '/api/comments', {
        post_id: createdPostId,
        content: '테스트 댓글입니다. 자동화 테스트에서 생성되었습니다. ' + Date.now()
      });

      if (commentResult.status === 201 && commentResult.data.success) {
        addResult('댓글', '댓글 작성', 'PASS', `댓글 ID: ${commentResult.data.data?.id}`);
      } else {
        addResult('댓글', '댓글 작성', 'FAIL', commentResult.data.error?.message || '작성 실패', commentResult.data);
      }
    } catch (error) {
      addResult('댓글', '댓글 작성', 'ERROR', error.message);
    }

    // 5-2. 댓글 목록 조회
    try {
      const commentsResult = await makeRequest('GET', `/api/comments?post_id=${createdPostId}`);
      if (commentsResult.status === 200 && commentsResult.data.success) {
        addResult('댓글', '댓글 목록 조회', 'PASS', `댓글 수: ${commentsResult.data.data?.length || 0}개`);
      } else {
        addResult('댓글', '댓글 목록 조회', 'FAIL', commentsResult.data.error || '조회 실패', commentsResult.data);
      }
    } catch (error) {
      addResult('댓글', '댓글 목록 조회', 'ERROR', error.message);
    }
  }

  // ========== 6. 즐겨찾기 테스트 ==========
  console.log('\n[6] 즐겨찾기 기능 테스트');
  console.log('-'.repeat(50));

  // 6-1. 즐겨찾기 목록 조회
  try {
    const favResult = await makeRequest('GET', '/api/favorites');
    if (favResult.status === 200 && favResult.data.success) {
      addResult('즐겨찾기', '즐겨찾기 목록 조회', 'PASS', `즐겨찾기 수: ${favResult.data.data?.length || 0}개`);
    } else {
      addResult('즐겨찾기', '즐겨찾기 목록 조회', 'FAIL', favResult.data.error || '조회 실패', favResult.data);
    }
  } catch (error) {
    addResult('즐겨찾기', '즐겨찾기 목록 조회', 'ERROR', error.message);
  }

  // 6-2. 정치인 즐겨찾기 추가
  if (searchedPoliticianId) {
    try {
      const addFavResult = await makeRequest('POST', '/api/favorites', {
        politician_id: searchedPoliticianId
      });

      if (addFavResult.status === 201 && addFavResult.data.success) {
        addResult('즐겨찾기', '정치인 즐겨찾기 추가', 'PASS', '추가 성공');
      } else if (addFavResult.status === 409) {
        addResult('즐겨찾기', '정치인 즐겨찾기 추가', 'PASS', '이미 즐겨찾기됨 (정상 동작)');
      } else {
        addResult('즐겨찾기', '정치인 즐겨찾기 추가', 'FAIL', addFavResult.data.error?.message || '추가 실패', addFavResult.data);
      }
    } catch (error) {
      addResult('즐겨찾기', '정치인 즐겨찾기 추가', 'ERROR', error.message);
    }
  }

  // ========== 7. 팔로우 테스트 ==========
  console.log('\n[7] 팔로우 기능 테스트');
  console.log('-'.repeat(50));

  // 7-1. 팔로워/팔로잉 목록
  if (currentUser?.id) {
    try {
      const followersResult = await makeRequest('GET', `/api/users/${currentUser.id}/followers`);
      if (followersResult.status === 200 && followersResult.data.success) {
        addResult('팔로우', '팔로워 목록 조회', 'PASS', `팔로워 수: ${followersResult.data.data?.length || 0}명`);
      } else {
        addResult('팔로우', '팔로워 목록 조회', 'FAIL', followersResult.data.error || '조회 실패', followersResult.data);
      }
    } catch (error) {
      addResult('팔로우', '팔로워 목록 조회', 'ERROR', error.message);
    }

    try {
      const followingResult = await makeRequest('GET', `/api/users/${currentUser.id}/following`);
      if (followingResult.status === 200 && followingResult.data.success) {
        addResult('팔로우', '팔로잉 목록 조회', 'PASS', `팔로잉 수: ${followingResult.data.data?.length || 0}명`);
      } else {
        addResult('팔로우', '팔로잉 목록 조회', 'FAIL', followingResult.data.error || '조회 실패', followingResult.data);
      }
    } catch (error) {
      addResult('팔로우', '팔로잉 목록 조회', 'ERROR', error.message);
    }
  }

  // ========== 8. 커뮤니티 테스트 ==========
  console.log('\n[8] 커뮤니티 기능 테스트');
  console.log('-'.repeat(50));

  // 8-1. 커뮤니티 게시글 목록
  try {
    const communityResult = await makeRequest('GET', '/api/community/posts?limit=5');
    if (communityResult.status === 200 && communityResult.data.success) {
      const posts = communityResult.data.data || [];
      const hasUsers = posts.length > 0 && posts.some(p => p.users);
      addResult('커뮤니티', '커뮤니티 게시글 목록', 'PASS', `게시글 수: ${posts.length}개, 작성자 정보: ${hasUsers ? '있음' : '없음'}`);
    } else {
      addResult('커뮤니티', '커뮤니티 게시글 목록', 'FAIL', communityResult.data.error?.message || '조회 실패', communityResult.data);
    }
  } catch (error) {
    addResult('커뮤니티', '커뮤니티 게시글 목록', 'ERROR', error.message);
  }

  // ========== 9. 정치인 평가 테스트 ==========
  console.log('\n[9] 정치인 평가 기능 테스트');
  console.log('-'.repeat(50));

  if (searchedPoliticianId) {
    try {
      const ratingResult = await makeRequest('POST', `/api/politicians/${searchedPoliticianId}/ratings`, {
        rating: 4
      });

      if (ratingResult.status === 201 || ratingResult.status === 200) {
        addResult('평가', '정치인 평가 (별점)', 'PASS', '평가 완료');
      } else if (ratingResult.status === 409) {
        addResult('평가', '정치인 평가 (별점)', 'PASS', '이미 평가됨 (정상 동작)');
      } else {
        addResult('평가', '정치인 평가 (별점)', 'FAIL', ratingResult.data.error?.message || '평가 실패', ratingResult.data);
      }
    } catch (error) {
      addResult('평가', '정치인 평가 (별점)', 'ERROR', error.message);
    }
  }

  // ========== 10. 로그아웃 테스트 ==========
  console.log('\n[10] 로그아웃 테스트');
  console.log('-'.repeat(50));

  try {
    const logoutResult = await makeRequest('POST', '/api/auth/logout');
    if (logoutResult.status === 200 && logoutResult.data.success) {
      addResult('인증', '로그아웃', 'PASS', '로그아웃 성공');
    } else {
      addResult('인증', '로그아웃', 'FAIL', logoutResult.data.error || '로그아웃 실패', logoutResult.data);
    }
  } catch (error) {
    addResult('인증', '로그아웃', 'ERROR', error.message);
  }

  // 리포트 생성
  generateReport();
}

function generateReport() {
  console.log('\n');
  console.log('='.repeat(70));
  console.log('테스트 결과 리포트');
  console.log('='.repeat(70));

  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const errors = testResults.filter(r => r.status === 'ERROR').length;
  const total = testResults.length;

  console.log(`\n📊 요약`);
  console.log(`   총 테스트: ${total}개`);
  console.log(`   ✅ 성공: ${passed}개 (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`   ❌ 실패: ${failed}개 (${((failed/total)*100).toFixed(1)}%)`);
  console.log(`   ⚠️ 오류: ${errors}개 (${((errors/total)*100).toFixed(1)}%)`);

  if (failed > 0 || errors > 0) {
    console.log('\n📋 실패/오류 상세');
    console.log('-'.repeat(70));

    testResults.filter(r => r.status !== 'PASS').forEach((r, i) => {
      console.log(`\n${i + 1}. [${r.category}] ${r.testName}`);
      console.log(`   상태: ${r.status}`);
      console.log(`   상세: ${r.details}`);
      if (r.response) {
        console.log(`   응답: ${r.response.substring(0, 200)}...`);
      }
    });
  }

  console.log('\n');
  console.log('='.repeat(70));
  console.log('카테고리별 결과');
  console.log('='.repeat(70));

  const categories = [...new Set(testResults.map(r => r.category))];
  categories.forEach(cat => {
    const catResults = testResults.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.status === 'PASS').length;
    const catTotal = catResults.length;
    const icon = catPassed === catTotal ? '✅' : '❌';
    console.log(`${icon} ${cat}: ${catPassed}/${catTotal} 성공`);
  });

  console.log('\n');
  console.log('='.repeat(70));
  console.log('테스트 완료:', new Date().toISOString());
  console.log('='.repeat(70));

  // JSON 리포트 파일 생성
  const report = {
    summary: {
      total,
      passed,
      failed,
      errors,
      successRate: ((passed/total)*100).toFixed(1) + '%',
      testAccount: CREDENTIALS.email,
      timestamp: new Date().toISOString()
    },
    results: testResults,
    failedTests: testResults.filter(r => r.status !== 'PASS')
  };

  const fs = require('fs');
  const reportPath = './test_report_' + new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19) + '.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 JSON 리포트 저장됨: ${reportPath}`);
}

runAllTests().catch(console.error);
