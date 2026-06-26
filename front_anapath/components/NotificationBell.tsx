'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
} from '@/lib/notifications';
import { formatDateTime } from '@/lib/dateFormat';
import { getServiceDisplayName } from '@/lib/serviceDisplay';

const POLL_INTERVAL_MS = 30_000;

function isUrgentNotification(notif: NotificationItem): boolean {
  return (
    notif.type === 'STAT' ||
    notif.type === 'Urgent' ||
    notif.rawType === 'STAT_ALERT' ||
    notif.priority === 'high'
  );
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const urgentUnreadCount = notifications.filter((n) => !n.read && isUrgentNotification(n)).length;

  const loadNotifications = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.warn('NEXT_PUBLIC_API_URL non définie');
      setLoading(false);
      return;
    }

    try {
      const [items, count] = await Promise.all([fetchNotifications(), fetchUnreadCount()]);
      setNotifications(items);
      setUnreadCount(count);
      setNetworkError(false);
    } catch (e) {
      setNetworkError(true);
      console.error('Erreur chargement notifications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(loadNotifications, POLL_INTERVAL_MS);

    const handleStatAlert = () => {
      loadNotifications();
    };

    window.addEventListener('stat-alert', handleStatAlert);

    return () => {
      clearInterval(interval);
      window.removeEventListener('stat-alert', handleStatAlert);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  const markAsRead = async (id: string, requestId?: string, notificationType?: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (!notif?.read) {
      try {
        await markNotificationAsRead(id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {
        console.error('Erreur marquage notification:', e);
        return;
      }
    }

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setIsOpen(false);

    if (requestId) {
      router.push(`/worklist/${requestId}`);
    } else if (notificationType === 'STAT') {
      router.push('/dashboard');
    } else if (notificationType === 'Urgent') {
      router.push('/worklist');
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Erreur marquage notifications:', e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationStyle = (notif: NotificationItem) => {
    if (isUrgentNotification(notif)) {
      return 'bg-red-50 border-l-4 border-red-600 hover:bg-red-100';
    }
    return 'bg-gray-50 border-l-4 border-gray-300 hover:bg-gray-100';
  };

  const getIcon = (title: string, type: string) => {
    if (type === 'STAT' || title.includes('ALERTE')) return '🚨';
    if (title.includes('5 minutes')) return '🚨';
    if (title.includes('10 minutes')) return '⏰';
    if (title.includes('dépassé')) return '❌';
    if (title.includes('Résultat')) return '📋';
    if (title.includes('validé')) return '✅';
    return '🔔';
  };

  const displayCount = unreadCount > 99 ? '99+' : unreadCount > 15 ? '15+' : unreadCount;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${urgentUnreadCount > 0 ? 'stat-pulse' : ''}`}
          >
            {displayCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-sm">Chargement…</p>
              </div>
            ) : networkError ? (
              <div className="p-6 text-center text-gray-500">
                <span className="material-symbols-outlined text-3xl text-orange-400">cloud_off</span>
                <p className="mt-2 text-sm font-medium">API indisponible</p>
                <p className="mt-1 text-xs text-gray-400">
                  Le backend Render démarre peut-être (plan gratuit). Réessayez dans quelques secondes.
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <span className="material-symbols-outlined text-4xl">notifications_none</span>
                <p className="mt-2 text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const urgent = isUrgentNotification(notif);
                return (
                  <div
                    key={notif.id}
                    className={`p-3 cursor-pointer transition-all ${getNotificationStyle(notif)} ${!notif.read ? 'bg-opacity-100' : 'bg-opacity-50'}`}
                    onClick={() => markAsRead(notif.id, notif.requestId || undefined, notif.type)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-xl">{getIcon(notif.title, notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${urgent ? 'text-red-700' : 'text-gray-800'}`}>{notif.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {getServiceDisplayName({ source: notif.source, metadata: notif.metadata })}
                        </p>
                        {(notif.anapathId || notif.patientId) && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {[notif.anapathId, notif.patientId && `Patient ${notif.patientId}`]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatDateTime(notif.timestamp)}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${urgent ? 'bg-red-600' : 'bg-blue-500'}`} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
