'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getNotificationsAnapath,
  markNotificationAsRead,
} from '@/lib/api';

// Tri : STAT → URGENTE → NORMALE, puis date décroissante
function sortNotifications(notifs: any[]): any[] {
  const priority: Record<string, number> = {
    STAT: 1, URGENTE: 2, NORMALE: 3,
  };
  return [...notifs].sort((a, b) => {
    const ua = a.urgence ?? a.metadata?.urgence
      ?? a.priority ?? 'NORMALE';
    const ub = b.urgence ?? b.metadata?.urgence
      ?? b.priority ?? 'NORMALE';
    const pa = priority[ua] ?? 3;
    const pb = priority[ub] ?? 3;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt ?? b.date ?? 0).getTime()
         - new Date(a.createdAt ?? a.date ?? 0).getTime();
  });
}

// Sons via Web Audio API
function playSound(urgence: string) {
  try {
    const AudioCtx = window.AudioContext ||
      (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (urgence === 'STAT') {
      osc.frequency.value = 880;
      osc.type = 'square';
      gain.gain.setValueAtTime(0, ctx.currentTime);
      [0, 0.3, 0.6].forEach(t => {
        gain.gain.setValueAtTime(0.7, ctx.currentTime + t);
        gain.gain.setValueAtTime(0, ctx.currentTime + t + 0.2);
      });
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.85);
    } else if (urgence === 'URGENTE') {
      osc.frequency.value = 660;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime);
      [0, 0.4].forEach(t => {
        gain.gain.setValueAtTime(0.5, ctx.currentTime + t);
        gain.gain.setValueAtTime(0, ctx.currentTime + t + 0.25);
      });
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.7);
    } else {
      osc.frequency.value = 440;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001, ctx.currentTime + 0.5
      );
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
    setTimeout(() => ctx.close(), 2000);
  } catch {}
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const knownIds = useRef<Set<string>>(new Set());
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    const raw = await getNotificationsAnapath();
    if (!Array.isArray(raw)) return;

    const sorted = sortNotifications(raw);

    // Détecter nouvelles notifications non lues
    const newNotifs = sorted.filter(n =>
      !n.lu && !n.read && !n.lue &&
      !knownIds.current.has(n.id ?? n._id)
    );

    if (newNotifs.length > 0) {
      // Urgence max parmi les nouvelles
      const urgences = newNotifs.map(n =>
        n.urgence ?? n.metadata?.urgence ?? 'NORMALE'
      );
      const maxUrgence = urgences.includes('STAT') ? 'STAT'
        : urgences.includes('URGENTE') ? 'URGENTE' : 'NORMALE';
      playSound(maxUrgence);
      newNotifs.forEach(n =>
        knownIds.current.add(n.id ?? n._id)
      );
    }

    setNotifications(sorted);
  }, []);

  // Polling toutes les 30s avec cleanup
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Compter non-lues
  const unreadCount = notifications.filter(n =>
    !n.lu && !n.read && !n.lue
  ).length;

  // Urgence max pour couleur badge
  const maxUrgence = notifications
    .filter(n => !n.lu && !n.read && !n.lue)
    .reduce((max, n) => {
      const u = n.urgence ?? n.metadata?.urgence ?? 'NORMALE';
      if (u === 'STAT') return 'STAT';
      if (u === 'URGENTE' && max !== 'STAT') return 'URGENTE';
      return max;
    }, 'NORMALE');

  const badgeColor = maxUrgence === 'STAT'
    ? 'bg-red-600 animate-pulse'
    : maxUrgence === 'URGENTE'
    ? 'bg-orange-500'
    : 'bg-blue-600';

  const handleClick = async (notif: any) => {
    // Marquer comme lu
    const id = notif.id ?? notif._id;
    if (id) {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id ?? n._id) === id
          ? { ...n, lu: true, read: true } : n
        )
      );
    }

    // Naviguer vers validation avec l'ID de l'examen
    const anapathId = notif.metadata?.anapathId
      ?? notif.referenceId
      ?? notif.examId
      ?? notif.metadata?.referenceId;

    setIsOpen(false);

    if (anapathId) {
      router.push(`/validation?id=${anapathId}`);
    } else {
      router.push('/validation');
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n =>
      !n.lu && !n.read && !n.lue
    );
    await Promise.all(
      unread.map(n => markNotificationAsRead(n.id ?? n._id))
    );
    setNotifications(prev =>
      prev.map(n => ({ ...n, lu: true, read: true }))
    );
  };

  const getUrgenceFromNotif = (n: any): string =>
    n.urgence ?? n.metadata?.urgence ?? 'NORMALE';

  const formatTime = (dateStr: string): string => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="relative">
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors
          ${maxUrgence === 'STAT' && unreadCount > 0
            ? 'animate-pulse' : ''
          } hover:bg-gray-100`}
      >
        {/* Icône cloche SVG */}
        <svg className="w-6 h-6 text-gray-600" fill="none"
          stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118
               14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0
               10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0
               .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3
               0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Badge nombre */}
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1
            ${badgeColor} text-white text-xs font-bold
            rounded-full min-w-[20px] h-5 flex items-center
            justify-center px-1`}>
            {unreadCount > 15 ? '+15' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown notifications */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96
          bg-white rounded-xl shadow-2xl border border-gray-100
          z-50 overflow-hidden">

          {/* En-tête dropdown */}
          <div className="flex items-center justify-between
            px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600
                  hover:text-blue-800 font-medium"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-[480px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center
                justify-center py-12 text-gray-400">
                <svg className="w-10 h-10 mb-2 opacity-40"
                  fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round"
                    strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0
                       0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2
                       2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0
                       .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0
                       11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const urgence = getUrgenceFromNotif(notif);
                const isUnread = !notif.lu && !notif.read && !notif.lue;
                const id = notif.id ?? notif._id;

                const bgClass = urgence === 'STAT'
                  ? 'bg-red-50 hover:bg-red-100'
                  : urgence === 'URGENTE'
                  ? 'bg-orange-50 hover:bg-orange-100'
                  : 'bg-white hover:bg-gray-50';

                const borderClass = urgence === 'STAT'
                  ? 'border-l-4 border-red-600'
                  : urgence === 'URGENTE'
                  ? 'border-l-4 border-orange-500'
                  : 'border-l-4 border-blue-400';

                const typeExamen = notif.metadata?.typeExamen
                  ?? notif.typeExamen ?? 'Examen';
                const patientId = notif.metadata?.patientId
                  ?? notif.patientId ?? '';
                const serviceNom = notif.metadata?.serviceNom
                  ?? notif.metadata?.serviceId ?? '';
                const time = formatTime(
                  notif.createdAt ?? notif.date ?? ''
                );

                return (
                  <div
                    key={id}
                    onClick={() => handleClick(notif)}
                    className={`${bgClass} ${borderClass}
                      px-4 py-3 cursor-pointer transition-colors
                      border-b border-gray-100 last:border-b-0`}
                  >
                    <div className="flex items-start
                      justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Badge urgence */}
                        {urgence !== 'NORMALE' && (
                          <span className={`inline-block text-xs
                            font-bold px-2 py-0.5 rounded-full
                            mb-1 ${urgence === 'STAT'
                              ? 'bg-red-600 text-white animate-pulse'
                              : 'bg-orange-500 text-white'
                            }`}>
                            {urgence === 'STAT'
                              ? '🚨 STAT' : '⚠️ URGENT'}
                          </span>
                        )}

                        {/* Titre */}
                        <p className={`text-sm font-semibold
                          truncate ${urgence === 'STAT'
                            ? 'text-red-700'
                            : urgence === 'URGENTE'
                            ? 'text-orange-700'
                            : 'text-gray-800'
                          }`}>
                          {typeExamen}
                          {patientId && ` — ${patientId}`}
                        </p>

                        {/* Sous-titre */}
                        <p className="text-xs text-gray-500 mt-0.5">
                          {serviceNom && `${serviceNom} · `}
                          {time}
                        </p>
                      </div>

                      {/* Point non lu */}
                      {isUnread && (
                        <div className="w-2 h-2 bg-blue-600
                          rounded-full mt-1 flex-shrink-0" />
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
