import axios from 'axios';

/** Client HTTP partagé — timeout élevé pour le cold start Render (plan gratuit). */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

export const ANAPATH_SERVICE_ID = '66e6d562-a772-40f1-a19a-d3385d862419';

export async function getChus(): Promise<any[]> {
  try {
    const { data } = await api.get('/anapath/chu');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getServicesByChu(chuId: string): Promise<any[]> {
  try {
    const { data } = await api.get(`/anapath/chu/${chuId}/services`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getAnapathServiceInfo(): Promise<any> {
  try {
    const { data } = await api.get('/anapath/service/anapath');
    return data;
  } catch {
    return null;
  }
}

export async function getNotificationsAnapath(): Promise<any[]> {
  try {
    const { data } = await api.get('/anapath/notifications');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getUnreadNotifications(): Promise<any[]> {
  try {
    const { data } = await api.get('/anapath/notifications/non-lues');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.put(`/anapath/notifications/${id}/lire`);
}
