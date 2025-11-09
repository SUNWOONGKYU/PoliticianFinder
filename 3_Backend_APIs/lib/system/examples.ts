/**
 * Project Grid Task ID: P4BA12
 * 작업명: 시스템 설정 API - 사용 예제
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: 시스템 설정 API 사용 예제 코드
 */

import { SettingsManager } from './settings-manager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Example 1: 단일 설정 조회
 */
export async function example1_getSingleSetting() {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  // 특정 설정 조회
  const postPoints = await settingsManager.getSetting('points.post');
  console.log('게시글 작성 포인트:', postPoints); // 10

  // 캐시를 사용하지 않고 조회
  const freshValue = await settingsManager.getSetting('points.post', false);
  console.log('DB에서 직접 조회:', freshValue);
}

/**
 * Example 2: 카테고리별 설정 조회
 */
export async function example2_getCategorySettings() {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  // 포인트 설정 전체 조회
  const pointSettings = await settingsManager.getPointSettings();
  console.log('포인트 설정:', pointSettings);
  // {
  //   post: 10,
  //   comment: 5,
  //   like: 1,
  //   follow: 20,
  //   share: 3,
  //   report: 5,
  //   verification: 100
  // }

  // 등급 설정 조회
  const rankSettings = await settingsManager.getRankSettings();
  console.log('등급 설정:', rankSettings);

  // 기능 토글 설정 조회
  const featureSettings = await settingsManager.getFeatureSettings();
  console.log('기능 설정:', featureSettings);
}

/**
 * Example 3: 전체 설정 조회
 */
export async function example3_getAllSettings() {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const allSettings = await settingsManager.getAllSettings();
  console.log('전체 설정 개수:', allSettings.length);

  allSettings.forEach(setting => {
    console.log(`${setting.key}: ${setting.value}`);
  });
}

/**
 * Example 4: 단일 설정 업데이트
 */
export async function example4_updateSingleSetting() {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  // 게시글 작성 포인트를 10 → 15로 변경
  const result = await settingsManager.updateSetting('points.post', 15);

  if (result.success) {
    console.log('설정 업데이트 성공:', result.data);
  } else {
    console.error('설정 업데이트 실패:', result.error);
  }
}

/**
 * Example 5: 여러 설정 일괄 업데이트
 */
export async function example5_bulkUpdateSettings() {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const updates = [
    { key: 'points.post', value: 15 },
    { key: 'points.comment', value: 7 },
    { key: 'points.like', value: 2 },
  ];

  const result = await settingsManager.updateSettings(updates);

  console.log(`${result.updated}개의 설정이 업데이트되었습니다`);
}

/**
 * Example 6: 유지보수 모드 설정
 */
export async function example6_setMaintenanceMode() {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  // 유지보수 모드 활성화
  await settingsManager.updateSettings([
    { key: 'maintenance.enabled', value: true },
    { key: 'maintenance.message', value: '서비스 업데이트 중입니다. 잠시 후 재개됩니다.' },
    { key: 'maintenance.start_time', value: new Date().toISOString() },
    { key: 'maintenance.end_time', value: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() }, // 2시간 후
  ]);

  console.log('유지보수 모드가 활성화되었습니다');

  // 유지보수 모드 확인
  const isMaintenanceMode = await settingsManager.isMaintenanceMode();
  console.log('유지보수 모드:', isMaintenanceMode); // true
}

/**
 * Example 7: 기능 토글
 */
export async function example7_toggleFeature() {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  // 커뮤니티 기능 비활성화
  await settingsManager.updateSetting('features.community', false);

  // 기능 활성화 상태 확인
  const isCommunityEnabled = await settingsManager.isFeatureEnabled('community');
  console.log('커뮤니티 활성화:', isCommunityEnabled); // false

  // 다시 활성화
  await settingsManager.updateSetting('features.community', true);
}

/**
 * Example 8: 포인트 규칙 조정
 */
export async function example8_adjustPointRules() {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  // 이벤트 기간 동안 포인트 2배
  const currentPoints = await settingsManager.getPointSettings();

  const doubledPoints = Object.entries(currentPoints).map(([key, value]) => ({
    key: `points.${key}`,
    value: (value as number) * 2,
  }));

  await settingsManager.updateSettings(doubledPoints);
  console.log('모든 포인트가 2배로 변경되었습니다');

  // 이벤트 종료 후 원래대로 복구
  const originalPoints = Object.entries(currentPoints).map(([key, value]) => ({
    key: `points.${key}`,
    value,
  }));

  await settingsManager.updateSettings(originalPoints);
  console.log('포인트가 원래대로 복구되었습니다');
}

/**
 * Example 9: 캐시 관리
 */
export async function example9_cacheManagement() {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  // 캐시를 사용한 조회 (빠름)
  console.time('캐시 조회');
  await settingsManager.getSetting('points.post', true);
  console.timeEnd('캐시 조회');

  // 캐시를 사용하지 않은 조회 (느림)
  console.time('DB 조회');
  await settingsManager.getSetting('points.post', false);
  console.timeEnd('DB 조회');

  // 특정 캐시 무효화
  settingsManager.clearCache('points.post');

  // 전체 캐시 무효화
  settingsManager.clearCache();
}

/**
 * Example 10: 사용자 등급 계산
 */
export async function example10_calculateUserRank(userPoints: number) {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const rankSettings = await settingsManager.getRankSettings();

  let userRank = 'bronze';

  if (userPoints >= rankSettings.diamond) {
    userRank = 'diamond';
  } else if (userPoints >= rankSettings.platinum) {
    userRank = 'platinum';
  } else if (userPoints >= rankSettings.gold) {
    userRank = 'gold';
  } else if (userPoints >= rankSettings.silver) {
    userRank = 'silver';
  }

  console.log(`사용자 포인트: ${userPoints} → 등급: ${userRank}`);
  return userRank;
}

/**
 * Example 11: 업로드 크기 검증
 */
export async function example11_validateUploadSize(fileSizeMB: number) {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const limits = await settingsManager.getLimitSettings();
  const maxSize = limits.max_upload_size_mb;

  if (fileSizeMB > maxSize) {
    throw new Error(`파일 크기는 ${maxSize}MB를 초과할 수 없습니다 (현재: ${fileSizeMB}MB)`);
  }

  console.log(`파일 크기 검증 통과: ${fileSizeMB}MB (최대: ${maxSize}MB)`);
  return true;
}

/**
 * Example 12: 일일 게시글 제한 확인
 */
export async function example12_checkDailyPostLimit(userPostsToday: number) {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const limits = await settingsManager.getLimitSettings();
  const maxPosts = limits.max_daily_posts;

  if (userPostsToday >= maxPosts) {
    throw new Error(`일일 게시글 제한에 도달했습니다 (최대: ${maxPosts}개)`);
  }

  const remaining = maxPosts - userPostsToday;
  console.log(`오늘 남은 게시글 작성 횟수: ${remaining}/${maxPosts}`);

  return {
    allowed: true,
    remaining,
    max: maxPosts,
  };
}

/**
 * Example 13: API 엔드포인트 사용 (클라이언트)
 */
export async function example13_clientApiUsage() {
  // 관리자: 전체 설정 조회
  const adminResponse = await fetch('/api/admin/system-settings');
  const adminData = await adminResponse.json();
  console.log('전체 설정:', adminData);

  // 관리자: 포인트 설정만 조회
  const pointsResponse = await fetch('/api/admin/system-settings?category=points');
  const pointsData = await pointsResponse.json();
  console.log('포인트 설정:', pointsData);

  // 관리자: 설정 업데이트
  const updateResponse = await fetch('/api/admin/system-settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: 'points.post',
      value: 15,
    }),
  });
  const updateData = await updateResponse.json();
  console.log('업데이트 결과:', updateData);

  // 일반 사용자: 공개 설정 조회
  const publicResponse = await fetch('/api/system-settings/public');
  const publicData = await publicResponse.json();
  console.log('공개 설정:', publicData);

  // 일반 사용자: 유지보수 모드만 확인
  const maintenanceResponse = await fetch('/api/system-settings/public?check=maintenance');
  const maintenanceData = await maintenanceResponse.json();

  if (maintenanceData.data.maintenance.enabled) {
    alert(maintenanceData.data.maintenance.message);
  }
}

/**
 * Example 14: 미들웨어에서 유지보수 모드 확인
 */
export async function example14_maintenanceMiddleware(req: Request) {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const maintenance = await settingsManager.getMaintenanceSettings();

  if (maintenance.enabled) {
    // 관리자는 접근 허용
    const isAdmin = false; // 실제로는 인증 정보에서 확인

    if (!isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: maintenance.message,
          maintenance: true,
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // 정상 처리
  return null;
}

/**
 * Example 15: 포인트 지급 헬퍼
 */
export async function example15_awardPoints(
  userId: string,
  action: 'post' | 'comment' | 'like' | 'follow'
) {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const pointSettings = await settingsManager.getPointSettings();
  const points = pointSettings[action];

  console.log(`${action} 액션에 대해 ${points} 포인트를 지급합니다 (사용자: ${userId})`);

  // 실제 DB 업데이트 로직
  // await updateUserPoints(userId, points);

  return points;
}

// 모든 예제 실행
export async function runAllExamples() {
  console.log('=== Example 1: 단일 설정 조회 ===');
  await example1_getSingleSetting();

  console.log('\n=== Example 2: 카테고리별 설정 조회 ===');
  await example2_getCategorySettings();

  console.log('\n=== Example 3: 전체 설정 조회 ===');
  await example3_getAllSettings();

  console.log('\n=== Example 10: 사용자 등급 계산 ===');
  await example10_calculateUserRank(1500);

  console.log('\n=== Example 11: 업로드 크기 검증 ===');
  await example11_validateUploadSize(5);

  console.log('\n=== Example 12: 일일 게시글 제한 확인 ===');
  await example12_checkDailyPostLimit(10);
}
