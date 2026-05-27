'use client';

import { useState, useEffect, useRef } from 'react';

interface Notification {
  id: string;
  type: 'STAT' | 'Urgent' | 'Normal';
  title: string;
  message: string;
  patientId: string;
  anapathId: string;
  requestId: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStoredNotifications();
    
    const handleStatAlert = (event: CustomEvent) => {
      const { id, anapathId, patientId, title, message, timestamp } = event.detail;
      
      const newNotification: Notification = {
        id: `stat-${Date.now()}`,
        type: 'STAT',
        title,
        message,
        patientId,
        anapathId,
        requestId: id,
        timestamp,
        read: false,
      };
      
      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        localStorage.setItem('anapath_notifications', JSON.stringify(updated.slice(0, 50)));
        return updated.slice(0, 50);
      });
      setUnreadCount(prev => prev + 1);
    };
    
    window.addEventListener('stat-alert', handleStatAlert as EventListener);
    
    return () => {
      window.removeEventListener('stat-alert', handleStatAlert as EventListener);
    };
  }, []);

  const loadStoredNotifications = () => {
    try {
      const stored = localStorage.getItem('anapath_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
      }
    } catch (e) {
      console.error('Erreur chargement notifications:', e);
    }
  };

  const markAsRead = (id: string, requestId?: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('anapath_notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    if (requestId) {
      window.location.href = `/worklist/${requestId}`;
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('anapath_notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
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

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'STAT': return 'bg-red-50 border-l-4 border-red-500 hover:bg-red-100';
      case 'Urgent': return 'bg-orange-50 border-l-4 border-orange-500 hover:bg-orange-100';
      default: return 'bg-gray-50 border-l-4 border-gray-300 hover:bg-gray-100';
    }
  };

  const getIcon = (title: string) => {
    if (title.includes('5 minutes')) return '🚨';
    if (title.includes('10 minutes')) return '⏰';
    if (title.includes('dépassé')) return '❌';
    return '🔔';
  };

  const displayCount = unreadCount > 99 ? '99+' : unreadCount > 15 ? '15+' : unreadCount;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
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
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <span className="material-symbols-outlined text-4xl">notifications_none</span>
                <p className="mt-2 text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 cursor-pointer transition-all ${getNotificationStyle(notif.type)} ${!notif.read ? 'bg-opacity-100' : 'bg-opacity-50'}`}
                  onClick={() => markAsRead(notif.id, notif.requestId)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl">{getIcon(notif.title)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{notif.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(notif.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}