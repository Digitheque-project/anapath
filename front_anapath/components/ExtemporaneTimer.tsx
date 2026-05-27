'use client';

import { useState, useEffect, useRef } from 'react';

interface ExtemporaneTimerProps {
  startTime: Date | string;
  requestId: string;
  anapathId: string;
  patientId: string;
  onTimeOut?: () => void;
  onAlert?: () => void;
}

export default function ExtemporaneTimer({ startTime, requestId, anapathId, patientId, onTimeOut, onAlert }: ExtemporaneTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAlert, setIsAlert] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [soundStarted, setSoundStarted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const notificationRef = useRef<Notification | null>(null);
  const alertTriggeredRef = useRef(false);
  const timeoutTriggeredRef = useRef(false);
  const tenMinAlertTriggeredRef = useRef(false);

  // Générer un son continu strident
  const startContinuousSound = () => {
    if (soundStarted) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      audioContextRef.current = new AudioContextClass();
      const context = audioContextRef.current;

      if (context.state === 'suspended') {
        context.resume();
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.6;
      
      oscillator.start();
      
      (window as any).__alertOscillator = oscillator;
      (window as any).__alertGain = gainNode;
      
      setSoundStarted(true);
      
      const audioElements = document.querySelectorAll('audio, video');
      audioElements.forEach((element) => {
        const mediaElement = element as HTMLMediaElement;
        if (!mediaElement.paused) {
          mediaElement.pause();
        }
      });
      
    } catch (error) {
      console.error('Erreur audio:', error);
    }
  };

  const stopContinuousSound = () => {
    try {
      if ((window as any).__alertOscillator) {
        (window as any).__alertOscillator.stop();
        (window as any).__alertOscillator = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setSoundStarted(false);
    } catch (error) {
      console.error('Erreur arrêt son:', error);
    }
  };

  // Envoyer une notification système
  const sendSystemNotification = (title: string, body: string) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      if (notificationRef.current) {
        notificationRef.current.close();
      }

      const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        tag: `stat-alert-${requestId}`,
        requireInteraction: true,
        vibrate: [500, 300, 500],
      });

      notificationRef.current = notification;

      notification.onclick = () => {
        stopContinuousSound();
        notification.close();
        notificationRef.current = null;
        window.focus();
        window.location.href = `/worklist/${requestId}`;
      };

    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  // Déclencher une alerte dans la cloche (via un événement personnalisé)
  const triggerBellNotification = (type: 'ten_min' | 'five_min' | 'expired') => {
    let title = '';
    let message = '';
    
    switch (type) {
      case 'ten_min':
        title = '⏰ STAT - 10 minutes restantes';
        message = `Examen extemporané pour ${patientId} (${anapathId}) - Traitement urgent requis`;
        break;
      case 'five_min':
        title = '🚨 STAT - 5 minutes restantes !';
        message = `Délai critique pour ${patientId} (${anapathId}) - Intervention immédiate nécessaire`;
        break;
      case 'expired':
        title = '❌ STAT - Délai dépassé';
        message = `Le délai de 30 minutes est écoulé pour ${patientId} (${anapathId})`;
        break;
    }
    
    // Événement personnalisé pour la cloche
    const event = new CustomEvent('stat-alert', {
      detail: {
        id: requestId,
        anapathId,
        patientId,
        title,
        message,
        type,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
    
    // Notification système pour 5 min et expiration
    if (type !== 'ten_min') {
      sendSystemNotification(title, message);
    }
    
    // Son pour 5 min
    if (type === 'five_min') {
      startContinuousSound();
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const start = new Date(startTime);
    const deadline = new Date(start.getTime() + 30 * 60 * 1000);
    const tenMinAlert = new Date(start.getTime() + 20 * 60 * 1000); // 10 min avant = 20 min après début
    const fiveMinAlert = new Date(start.getTime() + 25 * 60 * 1000); // 5 min avant

    const updateTimer = () => {
      const now = new Date();
      const remaining = deadline.getTime() - now.getTime();
      
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        stopContinuousSound();
        
        if (!timeoutTriggeredRef.current) {
          timeoutTriggeredRef.current = true;
          setShowToast(true);
          triggerBellNotification('expired');
          if (onTimeOut) onTimeOut();
          setTimeout(() => setShowToast(false), 8000);
        }
        return;
      }
      
      setTimeLeft(Math.floor(remaining / 1000));
      
      const remainingSeconds = Math.floor(remaining / 1000);
      
      // Alerte à 10 minutes (reste 600 secondes)
      if (remainingSeconds <= 600 && !tenMinAlertTriggeredRef.current && !isExpired) {
        tenMinAlertTriggeredRef.current = true;
        triggerBellNotification('ten_min');
      }
      
      // Alerte à 5 minutes
      if (remainingSeconds <= 300 && !alertTriggeredRef.current && !isExpired) {
        alertTriggeredRef.current = true;
        setIsAlert(true);
        setShowToast(true);
        triggerBellNotification('five_min');
        
        if (onAlert) onAlert();
        setTimeout(() => setShowToast(false), 10000);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => {
      clearInterval(interval);
      stopContinuousSound();
    };
  }, [startTime, requestId, anapathId, patientId, onTimeOut, onAlert, isExpired]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getColor = () => {
    if (isExpired) return 'bg-red-800 text-white';
    if (isAlert) return 'bg-red-600 text-white animate-pulse';
    if (timeLeft < 600) return 'bg-orange-500 text-white';
    return 'bg-primary text-white';
  };

  return (
    <>
      {showToast && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className={`${isExpired ? 'bg-red-800' : 'bg-red-600'} text-white p-4 rounded-lg shadow-2xl max-w-sm`}>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl animate-pulse">warning</span>
              <div className="flex-1">
                <p className="font-bold text-sm">{isExpired ? '⏰ TEMPS STAT ÉCOULÉ !' : '🚨 ALERTE STAT !'}</p>
                <p className="text-xs mt-1">
                  {isExpired 
                    ? 'Le délai de 30 minutes est dépassé. Traitement en urgence requis.' 
                    : 'Il reste 5 minutes pour traiter cet examen extemporané.'}
                </p>
              </div>
              <button onClick={() => setShowToast(false)} className="text-white/80 hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${getColor()} p-4 rounded-lg text-center transition-all duration-300 shadow-lg`}>
        <div className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-2xl">
            {isAlert ? 'warning' : 'timer'}
          </span>
          <span className="font-mono text-3xl font-bold tracking-wider">
            {formatTime(timeLeft)}
          </span>
        </div>
        <p className="text-sm mt-1 font-medium">
          {isAlert ? '🚨 ALERTE STAT - DÉLAI CRITIQUE ! 🚨' : 'Temps restant pour examen STAT'}
        </p>
        {isAlert && (
          <div className="mt-2 text-xs font-bold uppercase tracking-wider animate-pulse flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">notifications_active</span>
            ⏰ 5 MINUTES RESTANTES ⏰
            <span className="material-symbols-outlined text-sm">volume_up</span>
          </div>
        )}
      </div>
    </>
  );
}