/**
 * P4BA11: Notification System Type Definitions
 * 작업일: 2025-11-09
 * 설명: 알림 시스템 타입 정의
 */

/**
 * 알림 타입 열거형
 */
export enum NotificationType {
  COMMENT = 'comment',
  LIKE = 'like',
  FOLLOW = 'follow',
  MENTION = 'mention',
  REPLY = 'reply',
  SYSTEM = 'system',
}

/**
 * 알림 전역 설정 인터페이스
 */
export interface NotificationSettings {
  id: string;
  notifications_enabled: boolean;
  batch_processing_enabled: boolean;
  batch_interval_minutes: number;
  max_notifications_per_user: number;
  rate_limit_per_minute: number;
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}

/**
 * 알림 설정 업데이트 요청
 */
export interface NotificationSettingsUpdate {
  notifications_enabled?: boolean;
  batch_processing_enabled?: boolean;
  batch_interval_minutes?: number;
  max_notifications_per_user?: number;
  rate_limit_per_minute?: number;
  email_notifications_enabled?: boolean;
  push_notifications_enabled?: boolean;
}

/**
 * 알림 템플릿 인터페이스
 */
export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title_template: string;
  body_template: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 템플릿 업데이트 요청
 */
export interface NotificationTemplateUpdate {
  type: NotificationType;
  title_template?: string;
  body_template?: string;
  is_enabled?: boolean;
}

/**
 * 템플릿 목록 응답
 */
export interface NotificationTemplateListResponse {
  templates: NotificationTemplate[];
  total: number;
}

/**
 * 알림 메시지 인터페이스
 */
export interface NotificationMessage {
  title: string;
  body: string;
  type: NotificationType;
  recipient_id: string;
  sender_id?: string;
  reference_id?: string;
  reference_type?: 'post' | 'comment' | 'user';
  metadata?: Record<string, any>;
}

/**
 * 알림 데이터베이스 레코드
 */
export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  sender_id: string | null;
  reference_id: string | null;
  reference_type: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  read_at: string | null;
}

/**
 * 알림 발송 옵션
 */
export interface NotificationSendOptions {
  send_email?: boolean;
  send_push?: boolean;
  priority?: 'low' | 'normal' | 'high';
  delay_minutes?: number;
  batch?: boolean;
}

/**
 * 알림 발송 결과
 */
export interface NotificationSendResult {
  success: boolean;
  notification_id?: string;
  email_sent?: boolean;
  push_sent?: boolean;
  error?: string;
  queued?: boolean;
}

/**
 * 배치 알림 작업
 */
export interface NotificationBatchJob {
  id: string;
  user_id: string;
  notifications: NotificationMessage[];
  scheduled_at: string;
  processed: boolean;
  processed_at: string | null;
  result: NotificationSendResult | null;
}

/**
 * 알림 통계
 */
export interface NotificationStats {
  total_sent: number;
  total_read: number;
  total_unread: number;
  read_rate: number;
  by_type: Record<NotificationType, number>;
  last_24_hours: number;
  last_7_days: number;
  last_30_days: number;
}

/**
 * 알림 필터 옵션
 */
export interface NotificationFilterOptions {
  user_id?: string;
  type?: NotificationType;
  is_read?: boolean;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
  order_by?: 'created_at' | 'read_at';
  order_direction?: 'asc' | 'desc';
}

/**
 * 알림 큐 아이템
 */
export interface NotificationQueueItem {
  id: string;
  message: NotificationMessage;
  options: NotificationSendOptions;
  attempts: number;
  max_attempts: number;
  scheduled_at: string;
  last_attempt_at: string | null;
  error: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * 템플릿 변수 맵
 */
export interface TemplateVariableMap {
  [NotificationType.COMMENT]: {
    작성자: string;
    댓글내용: string;
    게시글제목?: string;
  };
  [NotificationType.LIKE]: {
    작성자: string;
    게시글제목?: string;
  };
  [NotificationType.FOLLOW]: {
    작성자: string;
    팔로워이름: string;
  };
  [NotificationType.MENTION]: {
    작성자: string;
    게시글제목: string;
  };
  [NotificationType.REPLY]: {
    작성자: string;
    댓글내용: string;
  };
  [NotificationType.SYSTEM]: {
    메시지: string;
    [key: string]: string;
  };
}

/**
 * 알림 채널 설정
 */
export interface NotificationChannelSettings {
  email: {
    enabled: boolean;
    types: NotificationType[];
  };
  push: {
    enabled: boolean;
    types: NotificationType[];
  };
  in_app: {
    enabled: boolean;
    types: NotificationType[];
  };
}

/**
 * 사용자별 알림 설정
 */
export interface UserNotificationPreferences {
  user_id: string;
  channels: NotificationChannelSettings;
  quiet_hours: {
    enabled: boolean;
    start_time: string; // HH:mm format
    end_time: string;   // HH:mm format
  };
  frequency: 'realtime' | 'batched' | 'daily_digest';
  muted_users: string[];
  muted_types: NotificationType[];
  created_at: string;
  updated_at: string;
}

/**
 * 알림 전송 컨텍스트
 */
export interface NotificationContext {
  user_id: string;
  settings: NotificationSettings;
  user_preferences: UserNotificationPreferences;
  template: NotificationTemplate;
  variables: Record<string, string>;
  options: NotificationSendOptions;
}

/**
 * 알림 검증 결과
 */
export interface NotificationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 타입 가드: NotificationType 체크
 */
export function isValidNotificationType(type: string): type is NotificationType {
  return Object.values(NotificationType).includes(type as NotificationType);
}

/**
 * 타입 가드: NotificationMessage 체크
 */
export function isNotificationMessage(obj: any): obj is NotificationMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.title === 'string' &&
    typeof obj.body === 'string' &&
    typeof obj.type === 'string' &&
    isValidNotificationType(obj.type) &&
    typeof obj.recipient_id === 'string'
  );
}

/**
 * 기본 알림 설정 상수
 */
export const DEFAULT_NOTIFICATION_SETTINGS: Readonly<NotificationSettings> = {
  id: '00000000-0000-0000-0000-000000000001',
  notifications_enabled: true,
  batch_processing_enabled: false,
  batch_interval_minutes: 15,
  max_notifications_per_user: 50,
  rate_limit_per_minute: 100,
  email_notifications_enabled: true,
  push_notifications_enabled: true,
  updated_at: new Date().toISOString(),
  updated_by: null,
};

/**
 * 기본 사용자 알림 설정
 */
export const DEFAULT_USER_PREFERENCES: Omit<
  UserNotificationPreferences,
  'user_id' | 'created_at' | 'updated_at'
> = {
  channels: {
    email: {
      enabled: true,
      types: [
        NotificationType.COMMENT,
        NotificationType.MENTION,
        NotificationType.FOLLOW,
      ],
    },
    push: {
      enabled: true,
      types: Object.values(NotificationType),
    },
    in_app: {
      enabled: true,
      types: Object.values(NotificationType),
    },
  },
  quiet_hours: {
    enabled: false,
    start_time: '22:00',
    end_time: '08:00',
  },
  frequency: 'realtime',
  muted_users: [],
  muted_types: [],
};

/**
 * 알림 타입 우선순위 (높을수록 중요)
 */
export const NOTIFICATION_PRIORITY: Record<NotificationType, number> = {
  [NotificationType.SYSTEM]: 5,
  [NotificationType.MENTION]: 4,
  [NotificationType.REPLY]: 3,
  [NotificationType.COMMENT]: 2,
  [NotificationType.FOLLOW]: 1,
  [NotificationType.LIKE]: 1,
};
