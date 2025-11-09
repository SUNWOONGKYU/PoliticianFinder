/**
 * Project Grid Task ID: P4BA12
 * 작업명: 시스템 설정 API - 설정 관리자
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: 전역 시스템 설정 관리 유틸리티 (포인트, 기능 토글, 유지보수 모드)
 */

import { createClient } from '@supabase/supabase-js';
import { CacheManager } from './cache-manager';

// 설정 타입 정의
export const SETTING_CATEGORIES = {
  POINTS: 'points',
  FEATURES: 'features',
  MAINTENANCE: 'maintenance',
  LIMITS: 'limits',
} as const;

export type SettingCategory = typeof SETTING_CATEGORIES[keyof typeof SETTING_CATEGORIES];

// 시스템 설정 인터페이스
export interface SystemSetting {
  key: string;
  value: any;
  description?: string;
  updated_at: string;
}

// 포인트 설정 인터페이스
export interface PointSettings {
  post: number;
  comment: number;
  like: number;
  follow: number;
  share?: number;
  report?: number;
  verification?: number;
}

// 등급 설정 인터페이스
export interface RankSettings {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
  diamond: number;
}

// 기능 토글 설정 인터페이스
export interface FeatureSettings {
  community: boolean;
  ai_evaluation: boolean;
  notifications: boolean;
  advertisements: boolean;
  politician_verification: boolean;
}

// 유지보수 모드 설정 인터페이스
export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  start_time?: string;
  end_time?: string;
}

// 제한 설정 인터페이스
export interface LimitSettings {
  max_upload_size_mb: number;
  max_post_length: number;
  max_comment_length: number;
  max_daily_posts: number;
  max_daily_comments: number;
}

// 설정 업데이트 요청 인터페이스
export interface UpdateSettingRequest {
  key: string;
  value: any;
}

/**
 * 시스템 설정 관리자 클래스
 */
export class SettingsManager {
  private supabase;
  private cache: CacheManager;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.cache = new CacheManager();
  }

  /**
   * 단일 설정 조회
   * @param key 설정 키
   * @param useCache 캐시 사용 여부 (기본: true)
   * @returns 설정 값 또는 null
   */
  async getSetting(key: string, useCache: boolean = true): Promise<any | null> {
    try {
      // 캐시에서 먼저 확인
      if (useCache) {
        const cached = this.cache.get(key);
        if (cached !== null) {
          return cached;
        }
      }

      // DB에서 조회
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .single();

      if (error) {
        console.error(`Error fetching setting ${key}:`, error);
        return null;
      }

      // 캐시에 저장
      if (data) {
        this.cache.set(key, data.value);
        return data.value;
      }

      return null;
    } catch (error) {
      console.error(`Exception in getSetting(${key}):`, error);
      return null;
    }
  }

  /**
   * 여러 설정 조회
   * @param keys 설정 키 배열
   * @returns 설정 객체
   */
  async getSettings(keys: string[]): Promise<Record<string, any>> {
    try {
      const settings: Record<string, any> = {};

      // 캐시에서 먼저 확인
      const uncachedKeys: string[] = [];
      for (const key of keys) {
        const cached = this.cache.get(key);
        if (cached !== null) {
          settings[key] = cached;
        } else {
          uncachedKeys.push(key);
        }
      }

      // DB에서 캐시되지 않은 설정 조회
      if (uncachedKeys.length > 0) {
        const { data, error } = await this.supabase
          .from('system_settings')
          .select('key, value')
          .in('key', uncachedKeys);

        if (error) {
          console.error('Error fetching settings:', error);
        } else if (data) {
          for (const setting of data) {
            settings[setting.key] = setting.value;
            this.cache.set(setting.key, setting.value);
          }
        }
      }

      return settings;
    } catch (error) {
      console.error('Exception in getSettings:', error);
      return {};
    }
  }

  /**
   * 카테고리별 설정 조회
   * @param category 설정 카테고리 (예: 'points', 'features')
   * @returns 설정 객체
   */
  async getSettingsByCategory(category: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('key, value')
        .like('key', `${category}.%`);

      if (error) {
        console.error(`Error fetching settings for category ${category}:`, error);
        return {};
      }

      const settings: Record<string, any> = {};
      if (data) {
        for (const setting of data) {
          const shortKey = setting.key.replace(`${category}.`, '');
          settings[shortKey] = setting.value;
          // 캐시에도 저장
          this.cache.set(setting.key, setting.value);
        }
      }

      return settings;
    } catch (error) {
      console.error(`Exception in getSettingsByCategory(${category}):`, error);
      return {};
    }
  }

  /**
   * 전체 설정 조회
   * @returns 설정 배열
   */
  async getAllSettings(): Promise<SystemSetting[]> {
    try {
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) {
        console.error('Error fetching all settings:', error);
        return [];
      }

      // 캐시에 모두 저장
      if (data) {
        for (const setting of data) {
          this.cache.set(setting.key, setting.value);
        }
      }

      return data as SystemSetting[];
    } catch (error) {
      console.error('Exception in getAllSettings:', error);
      return [];
    }
  }

  /**
   * 설정 업데이트
   * @param key 설정 키
   * @param value 새 값
   * @returns 성공 여부
   */
  async updateSetting(key: string, value: any): Promise<{
    success: boolean;
    error?: string;
    data?: SystemSetting;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('system_settings')
        .update({
          value,
          updated_at: new Date().toISOString(),
        })
        .eq('key', key)
        .select()
        .single();

      if (error) {
        console.error(`Error updating setting ${key}:`, error);
        return {
          success: false,
          error: error.message,
        };
      }

      // 캐시 무효화
      this.cache.delete(key);

      return {
        success: true,
        data: data as SystemSetting,
      };
    } catch (error) {
      console.error(`Exception in updateSetting(${key}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 여러 설정 일괄 업데이트
   * @param updates 업데이트할 설정 배열
   * @returns 성공 여부
   */
  async updateSettings(updates: UpdateSettingRequest[]): Promise<{
    success: boolean;
    error?: string;
    updated: number;
  }> {
    try {
      let updated = 0;

      for (const update of updates) {
        const result = await this.updateSetting(update.key, update.value);
        if (result.success) {
          updated++;
        }
      }

      return {
        success: updated === updates.length,
        updated,
      };
    } catch (error) {
      console.error('Exception in updateSettings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        updated: 0,
      };
    }
  }

  /**
   * 포인트 설정 조회
   * @returns 포인트 설정
   */
  async getPointSettings(): Promise<PointSettings> {
    const settings = await this.getSettingsByCategory('points');
    return {
      post: settings.post || 10,
      comment: settings.comment || 5,
      like: settings.like || 1,
      follow: settings.follow || 20,
      share: settings.share || 3,
      report: settings.report || 5,
      verification: settings.verification || 100,
    };
  }

  /**
   * 등급 설정 조회
   * @returns 등급 설정
   */
  async getRankSettings(): Promise<RankSettings> {
    const settings = await this.getSettingsByCategory('ranks');
    return {
      bronze: settings.bronze || 0,
      silver: settings.silver || 100,
      gold: settings.gold || 500,
      platinum: settings.platinum || 2000,
      diamond: settings.diamond || 10000,
    };
  }

  /**
   * 기능 토글 설정 조회
   * @returns 기능 설정
   */
  async getFeatureSettings(): Promise<FeatureSettings> {
    const settings = await this.getSettingsByCategory('features');
    return {
      community: settings.community !== false,
      ai_evaluation: settings.ai_evaluation !== false,
      notifications: settings.notifications !== false,
      advertisements: settings.advertisements !== false,
      politician_verification: settings.politician_verification !== false,
    };
  }

  /**
   * 유지보수 모드 설정 조회
   * @returns 유지보수 설정
   */
  async getMaintenanceSettings(): Promise<MaintenanceSettings> {
    const settings = await this.getSettingsByCategory('maintenance');
    return {
      enabled: settings.enabled === true,
      message: settings.message || '서비스 점검 중입니다',
      start_time: settings.start_time,
      end_time: settings.end_time,
    };
  }

  /**
   * 제한 설정 조회
   * @returns 제한 설정
   */
  async getLimitSettings(): Promise<LimitSettings> {
    const settings = await this.getSettingsByCategory('limits');
    return {
      max_upload_size_mb: settings.max_upload_size_mb || 10,
      max_post_length: settings.max_post_length || 5000,
      max_comment_length: settings.max_comment_length || 1000,
      max_daily_posts: settings.max_daily_posts || 50,
      max_daily_comments: settings.max_daily_comments || 100,
    };
  }

  /**
   * 유지보수 모드 활성화 여부 확인
   * @returns 유지보수 모드 활성화 여부
   */
  async isMaintenanceMode(): Promise<boolean> {
    const enabled = await this.getSetting('maintenance.enabled');
    return enabled === true;
  }

  /**
   * 특정 기능 활성화 여부 확인
   * @param feature 기능 이름
   * @returns 활성화 여부
   */
  async isFeatureEnabled(feature: string): Promise<boolean> {
    const value = await this.getSetting(`features.${feature}`);
    return value !== false;
  }

  /**
   * 캐시 무효화
   * @param key 특정 키 또는 전체 (기본: 전체)
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

/**
 * 유효한 설정 키 검증
 * @param key 설정 키
 * @returns 유효 여부
 */
export function isValidSettingKey(key: string): boolean {
  const validPrefixes = ['points.', 'ranks.', 'features.', 'maintenance.', 'limits.'];
  return validPrefixes.some(prefix => key.startsWith(prefix));
}

/**
 * 설정 카테고리 추출
 * @param key 설정 키
 * @returns 카테고리 또는 null
 */
export function getSettingCategory(key: string): string | null {
  const parts = key.split('.');
  return parts.length > 1 ? parts[0] : null;
}
