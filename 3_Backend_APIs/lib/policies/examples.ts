/**
 * Project Grid Task ID: P4BA10
 * 작업명: 정책 관리 API - 사용 예제
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: 정책 관리 API 사용 예제 코드
 */

import { PolicyVersionManager, POLICY_TYPES } from './version-manager';
import type {
  CreatePolicyRequest,
  UpdatePolicyRequest,
  Policy,
} from './types';

// ============================================================================
// 환경 설정
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// 예제 1: 정책 버전 관리자 초기화
// ============================================================================

export function initializePolicyManager() {
  const manager = new PolicyVersionManager(SUPABASE_URL, SUPABASE_KEY);
  return manager;
}

// ============================================================================
// 예제 2: 현재 정책 조회
// ============================================================================

export async function getCurrentTermsOfService(): Promise<Policy | null> {
  const manager = initializePolicyManager();
  const policy = await manager.getCurrentPolicy(POLICY_TYPES.TERMS);

  if (policy) {
    console.log(`현재 이용약관: v${policy.version} - ${policy.title}`);
    console.log(`효력 발생일: ${policy.effective_date}`);
  }

  return policy;
}

// ============================================================================
// 예제 3: 특정 버전 조회
// ============================================================================

export async function getPolicyVersion(
  type: string,
  version: number
): Promise<Policy | null> {
  const manager = initializePolicyManager();

  if (type === 'terms') {
    return await manager.getPolicyByVersion(POLICY_TYPES.TERMS, version);
  }

  return null;
}

// ============================================================================
// 예제 4: 정책 히스토리 조회
// ============================================================================

export async function getPrivacyPolicyHistory(): Promise<Policy[]> {
  const manager = initializePolicyManager();
  const history = await manager.getPolicyHistory(POLICY_TYPES.PRIVACY);

  console.log(`개인정보처리방침 버전 이력 (총 ${history.length}개):`);
  history.forEach((policy) => {
    console.log(
      `- v${policy.version}: ${policy.title} (${policy.is_current ? '현재' : '이전'})`
    );
  });

  return history;
}

// ============================================================================
// 예제 5: 새 정책 버전 생성
// ============================================================================

export async function createNewTermsVersion(
  title: string,
  content: string,
  effectiveDate: string,
  adminId?: string
): Promise<{ success: boolean; policy?: Policy; error?: string }> {
  const manager = initializePolicyManager();

  const request: CreatePolicyRequest = {
    type: POLICY_TYPES.TERMS,
    title,
    content,
    effective_date: effectiveDate,
    updated_by: adminId,
  };

  const result = await manager.createNewVersion(request);

  if (result.success && result.data) {
    console.log(`✅ 새 이용약관 버전 생성 성공: v${result.data.version}`);
  } else {
    console.error(`❌ 생성 실패: ${result.error}`);
  }

  return {
    success: result.success,
    policy: result.data,
    error: result.error,
  };
}

// ============================================================================
// 예제 6: 정책 업데이트
// ============================================================================

export async function updatePolicyContent(
  policyId: string,
  newContent: string
): Promise<{ success: boolean; policy?: Policy; error?: string }> {
  const manager = initializePolicyManager();

  const updates: UpdatePolicyRequest = {
    content: newContent,
  };

  const result = await manager.updatePolicy(policyId, updates);

  if (result.success && result.data) {
    console.log(`✅ 정책 업데이트 성공: ${result.data.title}`);
  } else {
    console.error(`❌ 업데이트 실패: ${result.error}`);
  }

  return {
    success: result.success,
    policy: result.data,
    error: result.error,
  };
}

// ============================================================================
// 예제 7: 특정 버전을 현재 버전으로 설정
// ============================================================================

export async function rollbackToPreviousVersion(
  policyId: string
): Promise<{ success: boolean; policy?: Policy; error?: string }> {
  const manager = initializePolicyManager();

  const result = await manager.setAsCurrent(policyId);

  if (result.success && result.data) {
    console.log(
      `✅ 버전 롤백 성공: v${result.data.version}이(가) 현재 버전으로 설정되었습니다`
    );
  } else {
    console.error(`❌ 롤백 실패: ${result.error}`);
  }

  return {
    success: result.success,
    policy: result.data,
    error: result.error,
  };
}

// ============================================================================
// 예제 8: 모든 현재 정책 조회
// ============================================================================

export async function getAllCurrentPolicies(): Promise<Policy[]> {
  const manager = initializePolicyManager();
  const policies = await manager.getAllCurrentPolicies();

  console.log(`현재 활성 정책 (${policies.length}개):`);
  policies.forEach((policy) => {
    console.log(`- [${policy.type}] v${policy.version}: ${policy.title}`);
  });

  return policies;
}

// ============================================================================
// 예제 9: 페이지네이션 정책 목록 조회
// ============================================================================

export async function getPaginatedPolicies(page: number = 1, limit: number = 10) {
  const manager = initializePolicyManager();
  const result = await manager.getAllPolicies(page, limit);

  console.log(`정책 목록 (페이지 ${result.page}/${result.totalPages}):`);
  console.log(`총 ${result.total}개 중 ${result.policies.length}개 표시`);

  result.policies.forEach((policy, index) => {
    console.log(
      `${index + 1}. [${policy.type}] v${policy.version}: ${policy.title}`
    );
  });

  return result;
}

// ============================================================================
// 예제 10: 정책 삭제 (비현재 버전만)
// ============================================================================

export async function deleteOldPolicyVersion(
  policyId: string
): Promise<{ success: boolean; error?: string }> {
  const manager = initializePolicyManager();

  const result = await manager.deletePolicy(policyId);

  if (result.success) {
    console.log(`✅ 정책 삭제 성공`);
  } else {
    console.error(`❌ 삭제 실패: ${result.error}`);
  }

  return result;
}

// ============================================================================
// 예제 11: API 엔드포인트 호출 (fetch)
// ============================================================================

export async function fetchCurrentTermsViaAPI(): Promise<Policy | null> {
  try {
    const response = await fetch('/api/policies/terms');
    const data = await response.json();

    if (data.success) {
      console.log(`API로 조회된 현재 이용약관: ${data.data.title}`);
      return data.data;
    } else {
      console.error(`API 오류: ${data.error}`);
      return null;
    }
  } catch (error) {
    console.error('API 호출 실패:', error);
    return null;
  }
}

// ============================================================================
// 예제 12: 관리자 API - 새 정책 생성
// ============================================================================

export async function createPolicyViaAPI(
  token: string,
  request: CreatePolicyRequest
): Promise<{ success: boolean; policy?: Policy; error?: string }> {
  try {
    const response = await fetch('/api/admin/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ API를 통한 정책 생성 성공: v${data.data.version}`);
      return { success: true, policy: data.data };
    } else {
      console.error(`❌ API 오류: ${data.error}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('API 호출 실패:', error);
    return { success: false, error: 'API 호출 실패' };
  }
}

// ============================================================================
// 예제 13: 정책 버전 비교
// ============================================================================

export async function comparePolicyVersions(
  type: string,
  version1: number,
  version2: number
) {
  const manager = initializePolicyManager();

  const policyType =
    type === 'terms'
      ? POLICY_TYPES.TERMS
      : type === 'privacy'
      ? POLICY_TYPES.PRIVACY
      : type === 'marketing'
      ? POLICY_TYPES.MARKETING
      : POLICY_TYPES.COMMUNITY;

  const [v1, v2] = await Promise.all([
    manager.getPolicyByVersion(policyType, version1),
    manager.getPolicyByVersion(policyType, version2),
  ]);

  if (!v1 || !v2) {
    console.error('버전을 찾을 수 없습니다');
    return;
  }

  console.log(`\n=== 정책 버전 비교 ===`);
  console.log(`타입: ${type}`);
  console.log(`\nv${version1}:`);
  console.log(`- 제목: ${v1.title}`);
  console.log(`- 효력 발생일: ${v1.effective_date}`);
  console.log(`- 생성일: ${v1.created_at}`);

  console.log(`\nv${version2}:`);
  console.log(`- 제목: ${v2.title}`);
  console.log(`- 효력 발생일: ${v2.effective_date}`);
  console.log(`- 생성일: ${v2.created_at}`);

  console.log(`\n변경 사항:`);
  console.log(`- 제목 변경: ${v1.title !== v2.title ? '예' : '아니오'}`);
  console.log(`- 내용 변경: ${v1.content !== v2.content ? '예' : '아니오'}`);
  console.log(
    `- 효력 발생일 변경: ${v1.effective_date !== v2.effective_date ? '예' : '아니오'}`
  );

  return { v1, v2 };
}

// ============================================================================
// 예제 14: 정책 통계 조회
// ============================================================================

export async function getPolicyStatistics() {
  const manager = initializePolicyManager();

  const [terms, privacy, marketing, community] = await Promise.all([
    manager.getPolicyHistory(POLICY_TYPES.TERMS),
    manager.getPolicyHistory(POLICY_TYPES.PRIVACY),
    manager.getPolicyHistory(POLICY_TYPES.MARKETING),
    manager.getPolicyHistory(POLICY_TYPES.COMMUNITY),
  ]);

  const stats = {
    terms: {
      total_versions: terms.length,
      current_version: terms.find((p) => p.is_current)?.version || 0,
    },
    privacy: {
      total_versions: privacy.length,
      current_version: privacy.find((p) => p.is_current)?.version || 0,
    },
    marketing: {
      total_versions: marketing.length,
      current_version: marketing.find((p) => p.is_current)?.version || 0,
    },
    community: {
      total_versions: community.length,
      current_version: community.find((p) => p.is_current)?.version || 0,
    },
  };

  console.log('\n=== 정책 통계 ===');
  console.log(`이용약관: v${stats.terms.current_version} (총 ${stats.terms.total_versions}개 버전)`);
  console.log(`개인정보처리방침: v${stats.privacy.current_version} (총 ${stats.privacy.total_versions}개 버전)`);
  console.log(`마케팅 수신 동의: v${stats.marketing.current_version} (총 ${stats.marketing.total_versions}개 버전)`);
  console.log(`커뮤니티 가이드라인: v${stats.community.current_version} (총 ${stats.community.total_versions}개 버전)`);

  return stats;
}

// ============================================================================
// 예제 15: 배치 작업 - 모든 정책 백업
// ============================================================================

export async function backupAllPolicies() {
  const manager = initializePolicyManager();

  const backup = {
    timestamp: new Date().toISOString(),
    policies: await manager.getAllCurrentPolicies(),
  };

  console.log(`\n정책 백업 생성: ${backup.timestamp}`);
  console.log(`백업된 정책 수: ${backup.policies.length}개`);

  // 실제 환경에서는 파일로 저장하거나 외부 저장소에 업로드
  return backup;
}

// ============================================================================
// 사용 예제 실행 함수
// ============================================================================

export async function runExamples() {
  console.log('=== 정책 관리 API 예제 실행 ===\n');

  // 예제 2: 현재 이용약관 조회
  await getCurrentTermsOfService();

  // 예제 4: 개인정보처리방침 히스토리
  await getPrivacyPolicyHistory();

  // 예제 8: 모든 현재 정책 조회
  await getAllCurrentPolicies();

  // 예제 14: 정책 통계
  await getPolicyStatistics();

  console.log('\n=== 예제 실행 완료 ===');
}
