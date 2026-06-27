'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getNotificationsAnapath,
  markNotificationAsRead,
} from '@/lib/api';
import { formatDateTime } from '@/lib/dateFormat';

const POLL_INTERVAL_MS = 30_000;

const urgencePriority: Record<string, number> = { STAT: 1, URGENTE: 2, NORMALE: 3 };

function sortNotifications(notifs: any[]) {
  return [...notifs].sort((a, b) => {
    const pa = urgencePriority[a.urgence ?? a.priority ?? 'NORMALE'] ?? 3;
    const pb = urgencePriority[b.urgence ?? b.priority ?? 'NORMALE'] ?? 3;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function getUrgence(notif: any): string {
  return String(notif.urgence ?? notif.priority ?? 'NORMALE').toUpperCase();
}

function isUnread(notif: any): boolean {
  return notif.lu === false || notif.read === false || (!notif.lu && !notif.read);
}

function playNotificationSound(urgence: string) {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  if (urgence === 'STAT') {
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
    oscillator.type = 'square';
    oscillator.start();
    gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
    gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.8, ctx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.8, ctx.currentTime + 0.6);
    gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.8);
    oscillator.stop(ctx.currentTime + 0.8);
  } else if (urgence === 'URGENTE') {
    oscillator.frequency.setValueAtTime(660, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    oscillator.type = 'sine';
    oscillator.start();
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime + 0.4);
    gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.7);
    oscillator.stop(ctx.currentTime + 0.7);
  } else {
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    oscillator.type = 'sine';
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.stop(ctx.currentTime + 0.5);
  }
}

function highestUrgence(notifs: any[]): string {
  let best = 'NORMALE';
  for (const n of notifs) {
    const u = getUrgence(n);
    if (urgencePriority[u] < urgencePriority[best]) best = u;
  }
  return best;
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  const unreadNotifications = notifications.filter(isUnread);
  const unreadCount = unreadNotifications.length;
  const hasStatUnread = unreadNotifications.some((n) => getUrgence(n) === 'STAT');
  const hasUrgentUnread =
    !hasStatUnread && unreadNotifications.some((n) => getUrgence(n) === 'URGENTE');

  const loadNotifications = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      setLoading(false);
      return;
    }

    try {
      const items = sortNotifications(await getNotificationsAnapath());
      const currentIds = new Set(items.map((n) => String(n.id)));

      if (!initialLoadRef.current) {
        const newNotifs = items.filter((n) => !knownIdsRef.current.has(String(n.id)));
        if (newNotifs.length > 0) {
          playNotificationSound(highestUrgence(newNotifs));
        }
      } else {
        initialLoadRef.current = false;
      }

      knownIdsRef.current = currentIds;
      setNotifications(items);
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
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (isOpen) loadNotifications();
  }, [isOpen, loadNotifications]);

  const handleMarkAsRead = async (notif: any) => {
    if (isUnread(notif)) {
      try {
        await markNotificationAsRead(String(notif.id));
      } catch (e) {
        console.error('Erreur marquage notification:', e);
        return;
      }
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, lu: true, read: true } : n)),
    );
    setIsOpen(false);

    const targetId =
      notif.examId ?? notif.metadata?.requestId ?? notif.metadata?.anapathId;
    if (targetId) {
      router.push(`/worklist/${targetId}`);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(isUnread);
    try {
      await Promise.all(unread.map((n) => markNotificationAsRead(String(n.id))));
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true, read: true })));
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

  const getNotificationStyle = (urgence: string) => {
    if (urgence === 'STAT') return 'bg-red-100 border-l-4 border-red-600 hover:bg-red-200';
    if (urgence === 'URGENTE') return 'bg-orange-50 border-l-4 border-orange-500 hover:bg-orange-100';
    return 'bg-gray-50 border-l-4 border-blue-400 hover:bg-gray-100';
  };

  const getTitleStyle = (urgence: string) => {
    if (urgence === 'STAT') return 'text-red-700';
    if (urgence === 'URGENTE') return 'text-orange-700';
    return 'text-gray-800';
  };

  const displayCount = unreadCount > 99 ? '99+' : unreadCount > 15 ? '15+' : unreadCount;

  const badgeClass = hasStatUnread
    ? 'bg-red-600 animate-pulse'
    : hasUrgentUnread
      ? 'bg-orange-500'
      : 'bg-blue-500';

  const bellPulseClass = hasStatUnread ? 'animate-pulse' : '';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600 ${bellPulseClass}`}
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${badgeClass}`}
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
                  Le backend démarre peut-être. Réessayez dans quelques secondes.
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <span className="material-symbols-outlined text-4xl">notifications_none</span>
                <p className="mt-2 text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const urgence = getUrgence(notif);
                const unread = isUnread(notif);
                const title = notif.motif ?? notif.title ?? 'Notification';
                const message = notif.message ?? notif.payload?.observation ?? '';
                const serviceNom =
                  notif.metadata?.serviceNom ?? notif.metadata?.serviceId ?? notif.sourceServiceName;

                return (
                  <div
                    key={notif.id}
                    className={`p-3 cursor-pointer transition-all ${getNotificationStyle(urgence)} ${!unread ? 'opacity-60' : ''}`}
                    onClick={() => handleMarkAsRead(notif)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {urgence === 'STAT' && (
                          <span className="inline-block text-[10px] font-bold text-red-600 animate-pulse mb-1">
                            🚨 STAT
                          </span>
                        )}
                        {urgence === 'URGENTE' && (
                          <span className="inline-block text-[10px] font-bold text-orange-600 mb-1">
                            ⚠️ URGENT
                          </span>
                        )}
                        <p className={`text-sm font-bold ${getTitleStyle(urgence)}`}>{title}</p>
                        {message && <p className="text-xs text-gray-600 mt-0.5">{message}</p>}
                        {serviceNom && (
                          <p className="text-[10px] text-gray-500 mt-0.5">{serviceNom}</p>
                        )}
                        {notif.createdAt && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            {formatDateTime(notif.createdAt)}
                          </p>
                        )}
                      </div>
                      {unread && (
                        <div
                          className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                            urgence === 'STAT'
                              ? 'bg-red-600'
                              : urgence === 'URGENTE'
                                ? 'bg-orange-500'
                                : 'bg-blue-500'
                          }`}
                        />
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
