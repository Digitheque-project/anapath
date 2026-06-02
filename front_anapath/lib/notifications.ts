import axios from 'axios';

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

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? '';

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
  const { data } = await axios.get<ApiNotification[]>(`${apiBase()}/notifications`);
  return data.map(mapApiNotification);
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await axios.get<{ count: number }>(`${apiBase()}/notifications/unread/count`);
  return data.count;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await axios.patch(`${apiBase()}/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await axios.patch(`${apiBase()}/notifications/read-all`);
}
