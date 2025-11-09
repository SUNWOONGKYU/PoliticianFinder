/**
 * Project Grid Task ID: P4BA10
 * 작업명: 정책 관리 API - 버전 관리자
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: 정책 문서 버전 관리 유틸리티
 */

import { createClient } from '@supabase/supabase-js';

// 정책 타입 정의
export const POLICY_TYPES = {
  TERMS: 'terms',
  PRIVACY: 'privacy',
  MARKETING: 'marketing',
  COMMUNITY: 'community',
} as const;

export type PolicyType = typeof POLICY_TYPES[keyof typeof POLICY_TYPES];

// 정책 인터페이스
export interface Policy {
  id: string;
  type: PolicyType;
  version: number;
  title: string;
  content: string;
  is_current: boolean;
  effective_date: string;
  updated_by?: string;
  created_at: string;
}

// 정책 생성 요청 인터페이스
export interface CreatePolicyRequest {
  type: PolicyType;
  title: string;
  content: string;
  effective_date: string;
  updated_by?: string;
}

// 정책 업데이트 요청 인터페이스
export interface UpdatePolicyRequest {
  title?: string;
  content?: string;
  effective_date?: string;
}

/**
 * 정책 버전 관리자 클래스
 */
export class PolicyVersionManager {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * 현재 활성 정책 조회
   * @param type 정책 타입
   * @returns 현재 정책 또는 null
   */
  async getCurrentPolicy(type: PolicyType): Promise<Policy | null> {
    try {
      const { data, error } = await this.supabase
        .from('policies')
        .select('*')
        .eq('type', type)
        .eq('is_current', true)
        .single();

      if (error) {
        console.error('Error fetching current policy:', error);
        return null;
      }

      return data as Policy;
    } catch (error) {
      console.error('Exception in getCurrentPolicy:', error);
      return null;
    }
  }

  /**
   * 특정 버전의 정책 조회
   * @param type 정책 타입
   * @param version 버전 번호
   * @returns 정책 또는 null
   */
  async getPolicyByVersion(
    type: PolicyType,
    version: number
  ): Promise<Policy | null> {
    try {
      const { data, error } = await this.supabase
        .from('policies')
        .select('*')
        .eq('type', type)
        .eq('version', version)
        .single();

      if (error) {
        console.error('Error fetching policy by version:', error);
        return null;
      }

      return data as Policy;
    } catch (error) {
      console.error('Exception in getPolicyByVersion:', error);
      return null;
    }
  }

  /**
   * 정책의 모든 버전 조회
   * @param type 정책 타입
   * @returns 정책 배열
   */
  async getPolicyHistory(type: PolicyType): Promise<Policy[]> {
    try {
      const { data, error } = await this.supabase
        .from('policies')
        .select('*')
        .eq('type', type)
        .order('version', { ascending: false });

      if (error) {
        console.error('Error fetching policy history:', error);
        return [];
      }

      return (data as Policy[]) || [];
    } catch (error) {
      console.error('Exception in getPolicyHistory:', error);
      return [];
    }
  }

  /**
   * 다음 버전 번호 가져오기
   * @param type 정책 타입
   * @returns 다음 버전 번호
   */
  async getNextVersion(type: PolicyType): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('policies')
        .select('version')
        .eq('type', type)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // 첫 번째 버전
        return 1;
      }

      return data.version + 1;
    } catch (error) {
      // 버전이 없으면 1 반환
      return 1;
    }
  }

  /**
   * 새 정책 버전 생성
   * @param request 정책 생성 요청
   * @returns 생성된 정책
   */
  async createNewVersion(
    request: CreatePolicyRequest
  ): Promise<{ success: boolean; data?: Policy; error?: string }> {
    try {
      // 다음 버전 번호 가져오기
      const nextVersion = await this.getNextVersion(request.type);

      // 기존 현재 버전을 비활성화
      const { error: updateError } = await this.supabase
        .from('policies')
        .update({ is_current: false })
        .eq('type', request.type)
        .eq('is_current', true);

      if (updateError) {
        console.error('Error deactivating current policy:', updateError);
      }

      // 새 버전 생성
      const { data, error } = await this.supabase
        .from('policies')
        .insert({
          type: request.type,
          version: nextVersion,
          title: request.title,
          content: request.content,
          is_current: true,
          effective_date: request.effective_date,
          updated_by: request.updated_by,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new policy version:', error);
        return {
          success: false,
          error: '정책 생성 중 오류가 발생했습니다',
        };
      }

      return {
        success: true,
        data: data as Policy,
      };
    } catch (error) {
      console.error('Exception in createNewVersion:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * 정책 업데이트 (동일 버전 내에서)
   * @param id 정책 ID
   * @param request 업데이트 요청
   * @returns 업데이트된 정책
   */
  async updatePolicy(
    id: string,
    request: UpdatePolicyRequest
  ): Promise<{ success: boolean; data?: Policy; error?: string }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (request.title) updateData.title = request.title;
      if (request.content) updateData.content = request.content;
      if (request.effective_date)
        updateData.effective_date = request.effective_date;

      const { data, error } = await this.supabase
        .from('policies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating policy:', error);
        return {
          success: false,
          error: '정책 업데이트 중 오류가 발생했습니다',
        };
      }

      return {
        success: true,
        data: data as Policy,
      };
    } catch (error) {
      console.error('Exception in updatePolicy:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * 정책 삭제
   * @param id 정책 ID
   * @returns 삭제 결과
   */
  async deletePolicy(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 현재 활성 정책인지 확인
      const { data: policy, error: fetchError } = await this.supabase
        .from('policies')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !policy) {
        return {
          success: false,
          error: '정책을 찾을 수 없습니다',
        };
      }

      // 현재 활성 정책은 삭제 불가
      if (policy.is_current) {
        return {
          success: false,
          error: '현재 활성 정책은 삭제할 수 없습니다',
        };
      }

      const { error: deleteError } = await this.supabase
        .from('policies')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting policy:', deleteError);
        return {
          success: false,
          error: '정책 삭제 중 오류가 발생했습니다',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Exception in deletePolicy:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * 특정 정책을 현재 버전으로 설정
   * @param id 정책 ID
   * @returns 결과
   */
  async setAsCurrent(
    id: string
  ): Promise<{ success: boolean; data?: Policy; error?: string }> {
    try {
      // 정책 조회
      const { data: policy, error: fetchError } = await this.supabase
        .from('policies')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !policy) {
        return {
          success: false,
          error: '정책을 찾을 수 없습니다',
        };
      }

      // 기존 현재 버전을 비활성화
      const { error: updateError } = await this.supabase
        .from('policies')
        .update({ is_current: false })
        .eq('type', policy.type)
        .eq('is_current', true);

      if (updateError) {
        console.error('Error deactivating current policy:', updateError);
      }

      // 새 현재 버전 설정
      const { data: updatedPolicy, error: setError } = await this.supabase
        .from('policies')
        .update({ is_current: true })
        .eq('id', id)
        .select()
        .single();

      if (setError) {
        console.error('Error setting policy as current:', setError);
        return {
          success: false,
          error: '현재 버전 설정 중 오류가 발생했습니다',
        };
      }

      return {
        success: true,
        data: updatedPolicy as Policy,
      };
    } catch (error) {
      console.error('Exception in setAsCurrent:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  /**
   * 모든 정책의 현재 버전 조회
   * @returns 정책 배열
   */
  async getAllCurrentPolicies(): Promise<Policy[]> {
    try {
      const { data, error } = await this.supabase
        .from('policies')
        .select('*')
        .eq('is_current', true)
        .order('type', { ascending: true });

      if (error) {
        console.error('Error fetching all current policies:', error);
        return [];
      }

      return (data as Policy[]) || [];
    } catch (error) {
      console.error('Exception in getAllCurrentPolicies:', error);
      return [];
    }
  }

  /**
   * 모든 정책 조회 (페이지네이션)
   * @param page 페이지 번호
   * @param limit 페이지 크기
   * @returns 정책 배열 및 페이지 정보
   */
  async getAllPolicies(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    policies: Policy[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, count, error } = await this.supabase
        .from('policies')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) {
        console.error('Error fetching all policies:', error);
        return {
          policies: [],
          total: 0,
          page,
          totalPages: 0,
        };
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        policies: (data as Policy[]) || [],
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error('Exception in getAllPolicies:', error);
      return {
        policies: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }
  }
}

/**
 * 정책 타입 검증
 * @param type 검증할 타입
 * @returns 유효 여부
 */
export function isValidPolicyType(type: string): type is PolicyType {
  return Object.values(POLICY_TYPES).includes(type as PolicyType);
}

/**
 * 정책 타입 이름 변환
 * @param type 정책 타입
 * @returns 한글 이름
 */
export function getPolicyTypeName(type: PolicyType): string {
  const names: Record<PolicyType, string> = {
    terms: '이용약관',
    privacy: '개인정보처리방침',
    marketing: '마케팅 수신 동의',
    community: '커뮤니티 가이드라인',
  };
  return names[type] || type;
}
