import { api } from './api';

export type NotificationDisplayType = 'STAT' | 'Urgent' | 'Normal';

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  source?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationDisplayType;
  title: string;
  message: string;
  patientId: string;
  anapathId: string;
  requestId: string;
  timestamp: string;
  read: boolean;
}

export function mapApiNotification(n: ApiNotification): NotificationItem {
  const metadata = n.metadata ?? {};
  return {
    id: n.id,
    type: mapDisplayType(n.type, n.priority),
    title: n.title,
    message: n.message,
    patientId: String(metadata.patientId ?? ''),
    anapathId: String(metadata.anapathId ?? ''),
    requestId: String(metadata.requestId ?? metadata.id ?? ''),
    timestamp: n.createdAt,
    read: n.read,
  };
}

function mapDisplayType(type: string, priority?: string): NotificationDisplayType {
  if (type === 'STAT_ALERT') return 'STAT';
  if (type === 'URGENT' || priority === 'high') return 'Urgent';
  return 'Normal';
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const { data } = await api.get<ApiNotification[]>('/notifications');
  return data.map(mapApiNotification);
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/notifications/unread/count');
  return data.count;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
