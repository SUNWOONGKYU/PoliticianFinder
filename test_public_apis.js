// 로그인 없이 테스트 가능한 Public API 테스트
const https = require('https');

const BASE_URL = 'https://politician-finder-futug94oy-finder-world.vercel.app';

let testResults = [];

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
      }
    };

    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
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
  testResults.push({ category, testName, status, details, response });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${category}] ${testName}: ${details}`);
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('Public API 테스트 (로그인 불필요)');
  console.log('='.repeat(70));
  console.log('');

  // 1. 정치인 검색 API
  console.log('\n[1] 정치인 검색 API');
  console.log('-'.repeat(50));

  const searchTests = [
    { q: '오세훈', desc: '이름 검색' },
    { q: '국민의힘', desc: '정당 검색' },
    { q: '더불어민주당', desc: '정당 검색2' },
    { q: '서울', desc: '지역 검색' },
  ];

  for (const test of searchTests) {
    try {
      const result = await makeRequest('GET', `/api/politicians/search?q=${encodeURIComponent(test.q)}`);
      if (result.status === 200 && result.data.success) {
        const count = result.data.data?.length || 0;
        const hasId = count > 0 && result.data.data[0].id;
        addResult('정치인검색', test.desc, hasId ? 'PASS' : 'FAIL',
          `"${test.q}" → ${count}개 결과${hasId ? ', ID 포함' : ', ID 없음'}`);
      } else {
        addResult('정치인검색', test.desc, 'FAIL', result.data.error || result.data.details || '실패');
      }
    } catch (error) {
      addResult('정치인검색', test.desc, 'ERROR', error.message);
    }
  }

  // 2. 정치인 목록/상세 API
  console.log('\n[2] 정치인 목록/상세 API');
  console.log('-'.repeat(50));

  let politicianId = null;
  try {
    const result = await makeRequest('GET', '/api/politicians?limit=5');
    if (result.status === 200 && result.data.success) {
      const count = result.data.data?.length || 0;
      if (count > 0) {
        politicianId = result.data.data[0].id;
      }
      addResult('정치인', '정치인 목록', 'PASS', `${count}개 정치인`);
    } else {
      addResult('정치인', '정치인 목록', 'FAIL', result.data.error || '실패');
    }
  } catch (error) {
    addResult('정치인', '정치인 목록', 'ERROR', error.message);
  }

  if (politicianId) {
    try {
      const result = await makeRequest('GET', `/api/politicians/${politicianId}`);
      if (result.status === 200 && result.data.success) {
        addResult('정치인', '정치인 상세', 'PASS', `ID: ${politicianId}, 이름: ${result.data.data?.name}`);
      } else {
        addResult('정치인', '정치인 상세', 'FAIL', result.data.error || '실패');
      }
    } catch (error) {
      addResult('정치인', '정치인 상세', 'ERROR', error.message);
    }
  }

  // 3. 게시글 목록 API
  console.log('\n[3] 게시글 API');
  console.log('-'.repeat(50));

  let postId = null;
  try {
    const result = await makeRequest('GET', '/api/posts?limit=5');
    if (result.status === 200 && result.data.success) {
      const posts = result.data.data || [];
      if (posts.length > 0) {
        postId = posts[0].id;
        const hasUsers = posts.some(p => p.users);
        addResult('게시글', '게시글 목록', 'PASS',
          `${posts.length}개, users 조인: ${hasUsers ? '있음' : '없음'}`);
      } else {
        addResult('게시글', '게시글 목록', 'PASS', '게시글 0개');
      }
    } else {
      addResult('게시글', '게시글 목록', 'FAIL', result.data.error || '실패');
    }
  } catch (error) {
    addResult('게시글', '게시글 목록', 'ERROR', error.message);
  }

  if (postId) {
    try {
      const result = await makeRequest('GET', `/api/posts/${postId}`);
      if (result.status === 200 && result.data.success) {
        const post = result.data.data;
        const checks = [];
        checks.push(`제목: ${post.title?.substring(0, 20)}...`);
        checks.push(`users: ${post.users ? (post.users.nickname || post.users.name || 'O') : 'X'}`);
        checks.push(`politicians: ${post.politicians ? post.politicians.name : 'X'}`);
        addResult('게시글', '게시글 상세', 'PASS', checks.join(', '));
      } else {
        addResult('게시글', '게시글 상세', 'FAIL', result.data.error || '실패');
      }
    } catch (error) {
      addResult('게시글', '게시글 상세', 'ERROR', error.message);
    }
  }

  // 4. 커뮤니티 게시글 API
  console.log('\n[4] 커뮤니티 API');
  console.log('-'.repeat(50));

  try {
    const result = await makeRequest('GET', '/api/community/posts?limit=5');
    if (result.status === 200 && result.data.success) {
      const posts = result.data.data || [];
      const hasUsers = posts.some(p => p.users);
      addResult('커뮤니티', '커뮤니티 게시글', 'PASS',
        `${posts.length}개, users 조인: ${hasUsers ? '있음' : '없음'}`);
    } else {
      addResult('커뮤니티', '커뮤니티 게시글', 'FAIL', result.data.error?.message || '실패');
    }
  } catch (error) {
    addResult('커뮤니티', '커뮤니티 게시글', 'ERROR', error.message);
  }

  // 5. 인증 필요 API (오류 응답 확인)
  console.log('\n[5] 인증 필요 API (401 응답 확인)');
  console.log('-'.repeat(50));

  const authRequiredApis = [
    { path: '/api/auth/me', desc: '내 정보' },
    { path: '/api/favorites', desc: '즐겨찾기' },
    { path: '/api/posts', method: 'POST', data: { subject: 'test', content: 'test' }, desc: '게시글 작성' },
  ];

  for (const api of authRequiredApis) {
    try {
      const result = await makeRequest(api.method || 'GET', api.path, api.data);
      if (result.status === 401) {
        addResult('인증필요', api.desc, 'PASS', '401 Unauthorized 반환 (정상)');
      } else {
        addResult('인증필요', api.desc, 'FAIL', `예상: 401, 실제: ${result.status}`);
      }
    } catch (error) {
      addResult('인증필요', api.desc, 'ERROR', error.message);
    }
  }

  // 리포트 출력
  console.log('\n');
  console.log('='.repeat(70));
  console.log('테스트 결과 요약');
  console.log('='.repeat(70));

  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const errors = testResults.filter(r => r.status === 'ERROR').length;
  const total = testResults.length;

  console.log(`\n총 ${total}개 테스트`);
  console.log(`✅ 성공: ${passed}개 (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`⚠️ 오류: ${errors}개`);

  if (failed > 0 || errors > 0) {
    console.log('\n실패/오류 항목:');
    testResults.filter(r => r.status !== 'PASS').forEach((r, i) => {
      console.log(`  ${i+1}. [${r.category}] ${r.testName}: ${r.details}`);
    });
  }

  console.log('\n' + '='.repeat(70));
}

runTests().catch(console.error);
