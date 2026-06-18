'use client';

import { useState, useEffect, useRef } from 'react';

interface ExtemporaneTimerProps {
  startTime: Date | string;
  requestId?: string;
  anapathId?: string;
  patientId?: string;
  onTimeOut?: () => void;
}

export default function ExtemporaneTimer({ 
  startTime, 
  onTimeOut,
  anapathId = '',
  patientId = ''
}: ExtemporaneTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [timeoutAlertSent, setTimeoutAlertSent] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Demander la permission pour les notifications au chargement
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    // Charger le son
    audioRef.current = new Audio('/sounds/alert.mp3');
    // Fallback : si le fichier n'existe pas, on utilise un son généré dynamiquement
    audioRef.current.onerror = () => {
      console.warn('⚠️ Fichier son introuvable, utilisation d\'un son de secours');
      audioRef.current = new Audio('data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAABkAAAAZAAAAGQAAABkAAAAZAAAAGQAAABkAAAAZAAAAGQAAABkAAAAZAAAAGQAAABkAAAAZAAAAGQAAABkAAAA');
    };
  }, []);

  useEffect(() => {
    const start = new Date(startTime);
    const deadline = new Date(start.getTime() + 30 * 60 * 1000);

    const updateTimer = () => {
      const now = new Date();
      const remaining = deadline.getTime() - now.getTime();
      
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        if (!timeoutAlertSent) {
          setTimeoutAlertSent(true);
          // Jouer le son d'expiration
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          // Notification système
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ TEMPS ÉCOULÉ !', {
              body: `L'examen ${anapathId} (patient ${patientId}) a dépassé le délai de 30 minutes.`,
              icon: '/icons/icon-192.png',
              requireInteraction: true,
            });
          }
          if (onTimeOut) onTimeOut();
        }
        return;
      }
      
      const seconds = Math.floor(remaining / 1000);
      setTimeLeft(seconds);

      // Alerte à 5 minutes (300 secondes) – déclenchée une seule fois
      if (seconds <= 1500 && seconds > 0 && !alertSent) {
        setAlertSent(true);
        // Jouer le son d'alerte
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
        // Notification système
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('⚠️ ALERTE 5 MINUTES', {
            body: `Il reste 5 minutes pour l'examen ${anapathId} (patient ${patientId}).`,
            icon: '/icons/icon-192.png',
            requireInteraction: true,
          });
        }
        // Notification visuelle dans l'UI
        // On peut aussi déclencher un événement personnalisé
        const event = new CustomEvent('stat-alert', { 
          detail: { message: '5 minutes restantes', anapathId, patientId }
        });
        window.dispatchEvent(event);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [startTime, onTimeOut, alertSent, timeoutAlertSent, anapathId, patientId]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getColor = () => {
    if (isExpired) return 'bg-red-800 text-white';
    if (timeLeft < 600) return 'bg-orange-500 text-white';
    return 'bg-primary text-white';
  };

  // Ne pas afficher le timer si le temps est écoulé (on affiche un message d'erreur)
  if (timeLeft === 0 && isExpired) {
    return (
      <div className="bg-red-800 text-white p-4 rounded-lg text-center shadow-lg animate-pulse">
        <span className="material-symbols-outlined text-3xl">timer_off</span>
        <p className="font-bold text-xl mt-1">⏰ TEMPS ÉCOULÉ</p>
        <p className="text-sm opacity-80">Le délai de 30 minutes est dépassé</p>
        <p className="text-xs mt-2 opacity-60">Alerte envoyée au service demandeur</p>
      </div>
    );
  }

  return (
    <div className={`${getColor()} p-4 rounded-lg text-center transition-all duration-300 shadow-lg`}>
      <div className="flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-2xl animate-pulse">timer</span>
        <span className="font-mono text-3xl font-bold tracking-wider">
          {formatTime(timeLeft)}
        </span>
      </div>
      <p className="text-sm mt-1 font-medium">
        {timeLeft < 600 ? '🚨 ALERTE : Moins de 10 minutes !' : 'Temps restant pour examen STAT'}
      </p>
      {timeLeft < 600 && timeLeft > 0 && (
        <div className="mt-2 text-xs animate-pulse bg-white/20 px-3 py-1 rounded-full inline-block">
          ⚡ Traitement prioritaire !
        </div>
      )}
    </div>
  );
}