export type NotificationType = "comment" | "like" | "share" | "follow" | "politician_update";

export interface NotificationPayload {
  type: NotificationType;
  user_id: string;
  related_id: string;
  message: string;
  data?: Record<string, any>;
}

export async function createNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function getNotificationMessage(type: NotificationType, data: any): string {
  switch (type) {
    case "comment":
      return `${data.author_name}님이 댓글을 달았습니다`;
    case "like":
      return `${data.author_name}님이 공감했습니다`;
    case "share":
      return `${data.author_name}님이 공유했습니다`;
    case "follow":
      return `${data.author_name}님이 팔로우했습니다`;
    case "politician_update":
      return `${data.politician_name}님의 새로운 활동이 있습니다`;
    default:
      return "새 알림이 있습니다";
  }
}
