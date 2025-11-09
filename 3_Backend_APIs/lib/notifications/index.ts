/**
 * P4BA11: Notification System - Main Export
 * 작업일: 2025-11-09
 * 설명: 알림 시스템 주요 모듈 export
 */

// Template Engine
export {
  TemplateEngine,
  templateEngine,
  TemplateVariables,
  RenderOptions,
  renderCommentNotification,
  renderLikeNotification,
  renderFollowNotification,
  renderMentionNotification,
  renderCustomNotification,
} from './template-engine';

// Type Definitions
export {
  NotificationType,
  NotificationSettings,
  NotificationSettingsUpdate,
  NotificationTemplate,
  NotificationTemplateUpdate,
  NotificationTemplateListResponse,
  NotificationMessage,
  NotificationRecord,
  NotificationSendOptions,
  NotificationSendResult,
  NotificationBatchJob,
  NotificationStats,
  NotificationFilterOptions,
  NotificationQueueItem,
  TemplateVariableMap,
  NotificationChannelSettings,
  UserNotificationPreferences,
  NotificationContext,
  NotificationValidationResult,
  isValidNotificationType,
  isNotificationMessage,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_USER_PREFERENCES,
  NOTIFICATION_PRIORITY,
} from './types';

// Integration Service (example)
export { NotificationService } from './integration-example';
