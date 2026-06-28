'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getNotificationsAnapath,
  markNotificationAsRead,
} from '@/lib/api';

const POLL_INTERVAL_MS = 30_000;

const priority: Record<string, number> = { STAT: 1, URGENTE: 2, NORMALE: 3 };

function sortNotifications(notifs: any[]) {
  return [...notifs].sort((a, b) => {
    const ua = a.urgence ?? a.metadata?.urgence ?? a.priority ?? 'NORMALE';
    const ub = b.urgence ?? b.metadata?.urgence ?? b.priority ?? 'NORMALE';
    const pa = priority[ua] ?? 3;
    const pb = priority[ub] ?? 3;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function getUrgence(notif: any): string {
  return String(notif.urgence ?? notif.metadata?.urgence ?? notif.priority ?? 'NORMALE').toUpperCase();
}

function isUnread(notif: any): boolean {
  return notif.lu === false || notif.read === false || (!notif.lu && !notif.read);
}

function playNotificationSound(urgence: string) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (urgence === 'STAT') {
      osc.frequency.value = 880;
      osc.type = 'square';
      gain.gain.setValueAtTime(0, ctx.currentTime);
      [0, 0.3, 0.6].forEach((t) => {
        gain.gain.setValueAtTime(0.7, ctx.currentTime + t);
        gain.gain.setValueAtTime(0, ctx.currentTime + t + 0.2);
      });
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } else if (urgence === 'URGENTE') {
      osc.frequency.value = 660;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime);
      [0, 0.4].forEach((t) => {
        gain.gain.setValueAtTime(0.5, ctx.currentTime + t);
        gain.gain.setValueAtTime(0, ctx.currentTime + t + 0.25);
      });
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.7);
    } else {
      osc.frequency.value = 440;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    console.warn('Audio non disponible:', e);
  }
}

function formatTime24h(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getNotificationTitle(notif: any): string {
  const typeExamen =
    notif.metadata?.typeExamen ?? notif.typeExamen ?? notif.motif ?? notif.title ?? 'Notification';
  const patientNom =
    notif.metadata?.patientNom ??
    notif.metadata?.patientName ??
    notif.patientNom ??
    '';
  if (patientNom) return `${typeExamen} — ${patientNom}`;
  return String(typeExamen);
}

function getNotificationSubtitle(notif: any): string {
  const service =
    notif.metadata?.serviceNom ?? notif.metadata?.serviceId ?? notif.sourceServiceName ?? '';
  const time = notif.createdAt ? formatTime24h(notif.createdAt) : '';
  if (service && time) return `${service} · ${time}`;
  return service || time || '';
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);

  const unreadNotifications = notifications.filter(isUnread);
  const unreadCount = unreadNotifications.length;
  const hasStatUnread = unreadNotifications.some((n) => getUrgence(n) === 'STAT');
  const hasUrgentUnread =
    !hasStatUnread && unreadNotifications.some((n) => getUrgence(n) === 'URGENTE');

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const notifs = sortNotifications(await getNotificationsAnapath());

        if (!initialLoad.current) {
          const newIds = notifs
            .filter((n) => !knownIds.current.has(String(n.id)) && isUnread(n))
            .map((n) => String(n.id));

          if (newIds.length > 0) {
            const urgences = notifs
              .filter((n) => newIds.includes(String(n.id)))
              .map((n) => getUrgence(n));
            const maxUrgence = urgences.includes('STAT')
              ? 'STAT'
              : urgences.includes('URGENTE')
                ? 'URGENTE'
                : 'NORMALE';
            playNotificationSound(maxUrgence);
            newIds.forEach((id) => knownIds.current.add(id));
          }
        } else {
          notifs.forEach((n) => knownIds.current.add(String(n.id)));
          initialLoad.current = false;
        }

        setNotifications(notifs);
      } catch (e) {
        console.error('Erreur chargement notifications:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    try {
      await markNotificationAsRead(String(notif.id));
    } catch (e) {
      console.error('Erreur marquage notification:', e);
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, lu: true, read: true } : n)),
    );

    const anapathId =
      notif.metadata?.anapathId ?? notif.examId ?? notif.referenceId ?? notif.metadata?.requestId;
    if (anapathId) router.push(`/worklist/${anapathId}`);
    setIsOpen(false);
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

  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);
  const badgeClass = hasStatUnread
    ? 'bg-red-600 animate-pulse'
    : hasUrgentUnread
      ? 'bg-orange-500'
      : 'bg-blue-500';
  const bellPulseClass = hasStatUnread ? 'animate-pulse' : '';

  const getItemClass = (urgence: string) => {
    if (urgence === 'STAT') return 'bg-red-50 border-l-4 border-red-600 p-3 cursor-pointer';
    if (urgence === 'URGENTE') return 'bg-orange-50 border-l-4 border-orange-500 p-3 cursor-pointer';
    return 'bg-white border-l-4 border-blue-400 p-3 cursor-pointer';
  };

  const getTitleClass = (urgence: string) => {
    if (urgence === 'STAT') return 'text-red-700 font-bold';
    if (urgence === 'URGENTE') return 'text-orange-700 font-bold';
    return 'text-gray-800 font-medium';
  };

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
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <span className="material-symbols-outlined text-4xl">notifications_none</span>
                <p className="mt-2 text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const urgence = getUrgence(notif);
                const unread = isUnread(notif);
                const title = getNotificationTitle(notif);
                const subtitle = getNotificationSubtitle(notif);

                return (
                  <div
                    key={notif.id}
                    className={`${getItemClass(urgence)} transition-all hover:opacity-90 ${!unread ? 'opacity-60' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {urgence === 'STAT' && (
                          <span className="animate-pulse bg-red-600 text-white text-xs px-2 py-0.5 rounded-full inline-block mb-1">
                            🚨 STAT
                          </span>
                        )}
                        {urgence === 'URGENTE' && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full inline-block mb-1">
                            ⚠️ URGENT
                          </span>
                        )}
                        <p className={`text-sm ${getTitleClass(urgence)}`}>{title}</p>
                        {subtitle && (
                          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                        )}
                      </div>
                      {unread && (
                        <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-red-500" />
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
