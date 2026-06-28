'use client';
import { useState, useEffect, useRef, useCallback }
  from 'react';
import { useRouter } from 'next/navigation';
import {
  getNotificationsAnapath,
  markNotificationAsRead
} from '@/lib/api';

function sortNotifs(notifs: any[]): any[] {
  const p: Record<string,number> =
    { STAT:1, URGENTE:2, NORMALE:3 };
  return [...notifs].sort((a,b) => {
    const ua = a.urgence ?? a.metadata?.urgence ?? 'NORMALE';
    const ub = b.urgence ?? b.metadata?.urgence ?? 'NORMALE';
    const pa = p[ua] ?? 3, pb = p[ub] ?? 3;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt ?? b.date ?? 0).getTime()
         - new Date(a.createdAt ?? a.date ?? 0).getTime();
  });
}

function playSound(urgence: string) {
  try {
    const Ctx = window.AudioContext ||
      (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    if (urgence === 'STAT') {
      osc.frequency.value = 880; osc.type = 'square';
      g.gain.setValueAtTime(0, ctx.currentTime);
      [0,0.3,0.6].forEach(t => {
        g.gain.setValueAtTime(0.7, ctx.currentTime+t);
        g.gain.setValueAtTime(0, ctx.currentTime+t+0.2);
      });
      osc.start(); osc.stop(ctx.currentTime+0.85);
    } else if (urgence === 'URGENTE') {
      osc.frequency.value = 660; osc.type = 'sine';
      g.gain.setValueAtTime(0, ctx.currentTime);
      [0,0.4].forEach(t => {
        g.gain.setValueAtTime(0.5, ctx.currentTime+t);
        g.gain.setValueAtTime(0, ctx.currentTime+t+0.25);
      });
      osc.start(); osc.stop(ctx.currentTime+0.7);
    } else {
      osc.frequency.value = 440; osc.type = 'sine';
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(
        0.001, ctx.currentTime+0.5);
      osc.start(); osc.stop(ctx.currentTime+0.5);
    }
    setTimeout(() => ctx.close(), 2000);
  } catch {}
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const known = useRef<Set<string>>(new Set());
  const router = useRouter();

  const fetch_ = useCallback(async () => {
    const raw = await getNotificationsAnapath();
    if (!Array.isArray(raw) || raw.length === 0) return;
    const sorted = sortNotifs(raw);
    const newOnes = sorted.filter(n =>
      !n.lu && !n.read && !n.lue &&
      !known.current.has(n.id ?? n._id)
    );
    if (newOnes.length > 0) {
      const urg = newOnes.map(n =>
        n.urgence ?? n.metadata?.urgence ?? 'NORMALE');
      const max = urg.includes('STAT') ? 'STAT'
        : urg.includes('URGENTE') ? 'URGENTE' : 'NORMALE';
      playSound(max);
      newOnes.forEach(n =>
        known.current.add(n.id ?? n._id));
    }
    setNotifs(sorted);
  }, []);

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, 30000);
    return () => clearInterval(t);
  }, [fetch_]);

  const unread = notifs.filter(
    n => !n.lu && !n.read && !n.lue).length;

  const maxUrg = notifs
    .filter(n => !n.lu && !n.read && !n.lue)
    .reduce((m,n) => {
      const u = n.urgence ?? n.metadata?.urgence ?? 'NORMALE';
      return u==='STAT' ? 'STAT'
        : u==='URGENTE' && m!=='STAT' ? 'URGENTE' : m;
    }, 'NORMALE');

  const badgeCls = maxUrg === 'STAT'
    ? 'bg-red-600 animate-pulse'
    : maxUrg === 'URGENTE'
    ? 'bg-orange-500' : 'bg-blue-600';

  const handleClick = async (n: any) => {
    const id = n.id ?? n._id;
    if (id) {
      await markNotificationAsRead(id);
      setNotifs(prev => prev.map(x =>
        (x.id??x._id)===id
          ? {...x,lu:true,read:true} : x));
    }
    const aid = n.metadata?.anapathId
      ?? n.referenceId ?? n.examId
      ?? n.metadata?.referenceId;
    setOpen(false);
    router.push(aid
      ? `/validation?id=${aid}` : '/validation');
  };

  const markAll = async () => {
    const unr = notifs.filter(
      n => !n.lu && !n.read && !n.lue);
    await Promise.all(unr.map(n =>
      markNotificationAsRead(n.id ?? n._id)));
    setNotifs(prev =>
      prev.map(n => ({...n,lu:true,read:true})));
  };

  const fmt = (d: string) => d
    ? new Date(d).toLocaleTimeString('fr-FR',
        {hour:'2-digit',minute:'2-digit',hour12:false})
    : '';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full
          hover:bg-gray-100 transition-colors"
      >
        <svg className="w-6 h-6 text-gray-600"
          fill="none" stroke="currentColor"
          viewBox="0 0 24 24">
          <path strokeLinecap="round"
            strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0
               0118 14.158V11a6.002 6.002 0
               00-4-5.659V5a2 2 0 10-4
               0v.341C7.67 6.165 6 8.388 6
               11v3.159c0 .538-.214
               1.055-.595 1.436L4 17h5m6
               0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {unread > 0 && (
          <span className={`absolute -top-1 -right-1
            ${badgeCls} text-white text-xs font-bold
            rounded-full min-w-[20px] h-5
            flex items-center justify-center px-1`}>
            {unread > 15 ? '+15' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96
          bg-white rounded-xl shadow-2xl
          border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center
            justify-between px-4 py-3
            border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">
              Notifications
            </h3>
            {unread > 0 && (
              <button onClick={markAll}
                className="text-xs text-blue-600
                  hover:text-blue-800 font-medium">
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center
                justify-center py-12 text-gray-400">
                <svg className="w-10 h-10 mb-2 opacity-40"
                  fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round"
                    strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032
                       2.032 0 0118 14.158V11a6.002
                       6.002 0 00-4-5.659V5a2 2 0
                       10-4 0v.341C7.67 6.165 6
                       8.388 6 11v3.159c0
                       .538-.214 1.055-.595
                       1.436L4 17h5m6 0v1a3 3 0
                       11-6 0v-1m6 0H9"/>
                </svg>
                <p className="text-sm">
                  Aucune notification
                </p>
              </div>
            ) : notifs.map(n => {
              const urg = n.urgence
                ?? n.metadata?.urgence ?? 'NORMALE';
              const isUnread =
                !n.lu && !n.read && !n.lue;
              const id = n.id ?? n._id;
              const bg = urg==='STAT'
                ? 'bg-red-50 hover:bg-red-100'
                : urg==='URGENTE'
                ? 'bg-orange-50 hover:bg-orange-100'
                : 'bg-white hover:bg-gray-50';
              const border = urg==='STAT'
                ? 'border-l-4 border-red-600'
                : urg==='URGENTE'
                ? 'border-l-4 border-orange-500'
                : 'border-l-4 border-blue-400';
              const type = n.metadata?.typeExamen
                ?? n.typeExamen ?? 'Examen';
              const pat = n.metadata?.patientId
                ?? n.patientId ?? '';
              const svc = n.metadata?.serviceNom
                ?? n.metadata?.serviceId ?? '';

              return (
                <div key={id}
                  onClick={() => handleClick(n)}
                  className={`${bg} ${border}
                    px-4 py-3 cursor-pointer
                    transition-colors border-b
                    border-gray-100 last:border-b-0`}>
                  <div className="flex items-start
                    justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {urg !== 'NORMALE' && (
                        <span className={`inline-block
                          text-xs font-bold px-2 py-0.5
                          rounded-full mb-1
                          ${urg==='STAT'
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-orange-500 text-white'}`}>
                          {urg==='STAT'
                            ? '🚨 STAT' : '⚠️ URGENT'}
                        </span>
                      )}
                      <p className={`text-sm font-semibold
                        truncate
                        ${urg==='STAT'
                          ? 'text-red-700'
                          : urg==='URGENTE'
                          ? 'text-orange-700'
                          : 'text-gray-800'}`}>
                        {type}{pat && ` — ${pat}`}
                      </p>
                      <p className="text-xs
                        text-gray-500 mt-0.5">
                        {svc && `${svc} · `}
                        {fmt(n.createdAt ?? n.date)}
                      </p>
                    </div>
                    {isUnread && (
                      <div className="w-2 h-2
                        bg-blue-600 rounded-full
                        mt-1 flex-shrink-0"/>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
