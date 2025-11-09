// Task: P4BA1 - 선관위 크롤링 스크립트
// Example usage of NEC Crawler

/**
 * 이 파일은 NEC 크롤러 사용 예제입니다.
 * 실제 프로덕션에서는 API Route나 서버 사이드 스크립트로 실행하세요.
 */

import { crawlNEC, crawlAndSaveNEC, createNECCrawler, CrawlErrorCode } from './index';

/**
 * 예제 1: 기본 크롤링
 */
export async function example1_BasicCrawl() {
  console.log('=== Example 1: Basic Crawl ===');

  const result = await crawlNEC();

  if (result.success) {
    console.log(`✅ 크롤링 성공!`);
    console.log(`수집된 정치인: ${result.data.length}명`);
    console.log(`소요 시간: ${result.stats.duration}ms`);
    console.log(`재시도 횟수: ${result.stats.retryCount}`);

    // 처음 3명만 출력
    result.data.slice(0, 3).forEach((politician, index) => {
      console.log(`\n${index + 1}. ${politician.name}`);
      console.log(`   정당: ${politician.party}`);
      console.log(`   지역구: ${politician.district}`);
      console.log(`   연락처: ${politician.contact.phone || 'N/A'}`);
      console.log(`   신뢰도: ${(politician.metadata.confidence * 100).toFixed(1)}%`);
    });
  } else {
    console.error('❌ 크롤링 실패:', result.error?.message);
  }

  return result;
}

/**
 * 예제 2: 커스텀 옵션으로 크롤링
 */
export async function example2_CustomOptions() {
  console.log('=== Example 2: Custom Options ===');

  const crawler = createNECCrawler({
    headless: true,
    timeout: 60000,
    maxRetries: 5,
    retryDelay: 3000,
    waitTime: 2000,
  });

  const result = await crawler.crawl();

  if (result.success) {
    console.log(`✅ 수집 완료: ${result.stats.itemsCollected}개`);
    console.log(`실패: ${result.stats.itemsFailed}개`);
  }

  return result;
}

/**
 * 예제 3: JSON 파일로 저장
 */
export async function example3_SaveToJson() {
  console.log('=== Example 3: Save to JSON ===');

  const outputPath = './data/crawled/nec-politicians.json';

  const result = await crawlAndSaveNEC(outputPath, {
    headless: true,
    timeout: 30000,
  });

  if (result.success) {
    console.log(`✅ 파일 저장 완료: ${outputPath}`);
    console.log(`저장된 항목: ${result.data.length}개`);
  }

  return result;
}

/**
 * 예제 4: 에러 처리
 */
export async function example4_ErrorHandling() {
  console.log('=== Example 4: Error Handling ===');

  const result = await crawlNEC({
    timeout: 5000, // 짧은 타임아웃으로 에러 유도
  });

  if (!result.success && result.error) {
    console.error(`❌ 에러 발생: ${result.error.message}`);

    switch (result.error.code) {
      case CrawlErrorCode.NETWORK_ERROR:
        console.log('→ 네트워크 연결을 확인하세요');
        break;
      case CrawlErrorCode.TIMEOUT:
        console.log('→ 타임아웃 시간을 늘려보세요');
        break;
      case CrawlErrorCode.SELECTOR_NOT_FOUND:
        console.log('→ 사이트 구조가 변경되었을 수 있습니다');
        break;
      case CrawlErrorCode.PARSING_ERROR:
        console.log('→ 데이터 파싱 로직을 확인하세요');
        break;
      default:
        console.log('→ 알 수 없는 오류');
    }

    if (result.error.retryable) {
      console.log('💡 재시도 가능한 오류입니다');
    }
  }

  return result;
}

/**
 * 예제 5: 통계 정보 활용
 */
export async function example5_Statistics() {
  console.log('=== Example 5: Statistics ===');

  const result = await crawlNEC();

  if (result.success) {
    const { stats } = result;

    console.log('\n📊 크롤링 통계:');
    console.log(`시작: ${stats.startTime.toLocaleString()}`);
    console.log(`종료: ${stats.endTime.toLocaleString()}`);
    console.log(`소요 시간: ${(stats.duration / 1000).toFixed(2)}초`);
    console.log(`수집 성공: ${stats.itemsCollected}개`);
    console.log(`수집 실패: ${stats.itemsFailed}개`);
    console.log(`재시도: ${stats.retryCount}회`);
    console.log(`성공률: ${((stats.itemsCollected / (stats.itemsCollected + stats.itemsFailed)) * 100).toFixed(1)}%`);

    // 정당별 통계
    const partyStats = result.data.reduce((acc, p) => {
      acc[p.party] = (acc[p.party] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📈 정당별 통계:');
    Object.entries(partyStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([party, count]) => {
        console.log(`  ${party}: ${count}명`);
      });

    // 지역구별 통계
    const districtStats = result.data.reduce((acc, p) => {
      const region = p.district.split(' ')[0] || '기타';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🗺️ 지역별 통계:');
    Object.entries(districtStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([region, count]) => {
        console.log(`  ${region}: ${count}명`);
      });
  }

  return result;
}

/**
 * 모든 예제 실행
 */
export async function runAllExamples() {
  console.log('🚀 NEC Crawler Examples\n');

  try {
    await example1_BasicCrawl();
    console.log('\n' + '='.repeat(50) + '\n');

    await example2_CustomOptions();
    console.log('\n' + '='.repeat(50) + '\n');

    await example3_SaveToJson();
    console.log('\n' + '='.repeat(50) + '\n');

    await example4_ErrorHandling();
    console.log('\n' + '='.repeat(50) + '\n');

    await example5_Statistics();
  } catch (error) {
    console.error('예제 실행 중 오류:', error);
  }
}

// 메인 함수 실행 예제 (Node.js 스크립트로 실행 시)
// import { runAllExamples } from './example';
// runAllExamples().catch(console.error);
