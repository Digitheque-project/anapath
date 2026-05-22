'use client';

import { useState, useEffect, useRef } from 'react';

interface ExtemporaneTimerProps {
  startTime: Date | string;
  onTimeOut?: () => void;
  onAlert?: () => void;
}

export default function ExtemporaneTimer({ startTime, onTimeOut, onAlert }: ExtemporaneTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAlert, setIsAlert] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [showAlertToast, setShowAlertToast] = useState(false);
  const [showTimeoutToast, setShowTimeoutToast] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alertSoundIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertTriggeredRef = useRef(false);
  const timeoutTriggeredRef = useRef(false);
  const originalVolumeRef = useRef<number>(1);
  const notificationRef = useRef<Notification | null>(null);

  // Créer un son continu strident (non stop)
  const startContinuousSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      audioContextRef.current = new AudioContextClass();
      const context = audioContextRef.current;

      // Forcer le son même si l'appareil est en silencieux
      if (context.state === 'suspended') {
        context.resume();
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.type = 'sawtooth'; // Son agressif
      oscillator.frequency.value = 880; // Fréquence aiguë
      
      // Volume très fort (max)
      gainNode.gain.value = 0.8;
      
      oscillator.start();
      
      // Sauvegarder l'oscillateur pour pouvoir l'arrêter plus tard
      (window as any).__alertOscillator = oscillator;
      (window as any).__alertGain = gainNode;
      
    } catch (error) {
      console.error('Erreur audio:', error);
    }
  };

  // Arrêter le son d'alerte
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
    } catch (error) {
      console.error('Erreur arrêt son:', error);
    }
  };

  // Arrêter tous les sons en arrière-plan (musique, vidéo, etc.)
  const stopAllBackgroundAudio = () => {
    try {
      // Méthode 1: Créer un élément audio silencieux qui demande le focus audio
      const audioElements = document.querySelectorAll('audio, video');
      audioElements.forEach((element) => {
        const mediaElement = element as HTMLMediaElement;
        if (!mediaElement.paused) {
          originalVolumeRef.current = mediaElement.volume;
          mediaElement.volume = 0;
          mediaElement.pause();
        }
      });

      // Méthode 2: Utiliser l'API AudioContext pour prendre le contrôle
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Méthode 3: Créer un nouveau contexte pour prendre le contrôle audio
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const tempContext = new AudioContextClass();
      tempContext.close();
      
    } catch (error) {
      console.error('Erreur arrêt audio background:', error);
    }
  };

  // Envoyer notification push avec son continu
  const sendPushNotification = (title: string, body: string, isAlertType: boolean = true) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      // Fermer l'ancienne notification si elle existe
      if (notificationRef.current) {
        notificationRef.current.close();
      }

      const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        tag: 'stat-alert',
        requireInteraction: true,
        silent: false, // Le son est géré par notre système
        //vibrate: [500, 300, 500],
      });

      notificationRef.current = notification;

      // Quand on clique sur la notification
      notification.onclick = () => {
        // Arrêter le son d'alerte
        stopContinuousSound();
        // Fermer la notification
        notification.close();
        notificationRef.current = null;
        // Remettre le volume normal sur les médias
        const audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach((element) => {
          const mediaElement = element as HTMLMediaElement;
          if (mediaElement.volume === 0 && originalVolumeRef.current > 0) {
            mediaElement.volume = originalVolumeRef.current;
          }
        });
        // Focus sur la fenêtre
        window.focus();
        // Rediriger vers la page de la demande si nécessaire
        // window.location.href = '/worklist';
      };

      // La notification reste jusqu'à clic (requireInteraction: true)
      
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          sendPushNotification(title, body, isAlertType);
        }
      });
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

    const updateTimer = () => {
      const now = new Date();
      const remaining = deadline.getTime() - now.getTime();
      
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        
        if (!timeoutTriggeredRef.current) {
          timeoutTriggeredRef.current = true;
          setShowTimeoutToast(true);
          
          // Couper tous les sons en arrière-plan
          stopAllBackgroundAudio();
          // Jouer le son continu
          startContinuousSound();
          // Envoyer notification
          sendPushNotification('⏰ TEMPS STAT ÉCOULÉ', 'Le délai de 30 minutes est dépassé ! Traitement en urgence requis.');
          
          if (onTimeOut) onTimeOut();
          setTimeout(() => setShowTimeoutToast(false), 8000);
        }
        return;
      }
      
      setTimeLeft(Math.floor(remaining / 1000));
      
      const remainingSeconds = Math.floor(remaining / 1000);
      // Alerte à 5 minutes (300 secondes) - UNE SEULE FOIS
      if (remainingSeconds <= 300 && !alertTriggeredRef.current && !isExpired) {
        alertTriggeredRef.current = true;
        setIsAlert(true);
        setShowAlertToast(true);
        
        // Couper tous les sons en arrière-plan (musique, vidéo, etc.)
        stopAllBackgroundAudio();
        
        // Démarrer le son continu STRIDENT
        startContinuousSound();
        
        // Envoyer notification PUSH (non bloquante)
        sendPushNotification('🚨 ALERTE STAT ANAPATH', 'Il reste 5 minutes pour traiter l\'examen extemporané ! Cliquez pour arrêter l\'alerte.');
        
        if (onAlert) onAlert();
        setTimeout(() => setShowAlertToast(false), 8000);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => {
      clearInterval(interval);
      stopContinuousSound();
    };
  }, [startTime, onTimeOut, onAlert, isExpired]);

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

  // Arrêter le son manuellement (si on ferme la page)
  useEffect(() => {
    return () => {
      stopContinuousSound();
    };
  }, []);

  // Fonction pour arrêter manuellement l'alerte (si bouton ajouté)
  const stopAlertManually = () => {
    stopContinuousSound();
    if (notificationRef.current) {
      notificationRef.current.close();
      notificationRef.current = null;
    }
  };

  return (
    <>
      {/* Toast notification pour l'alerte 5 min */}
      {showAlertToast && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-red-600 text-white p-4 rounded-lg shadow-2xl border-l-4 border-yellow-400 max-w-sm">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl animate-pulse">warning</span>
              <div className="flex-1">
                <p className="font-bold text-sm">🚨 ALERTE STAT !</p>
                <p className="text-xs mt-1">Il reste 5 minutes pour traiter cet examen extemporané.</p>
                <p className="text-[10px] mt-1 opacity-80">Cliquez sur la notification pour arrêter l'alerte.</p>
              </div>
              <button onClick={() => setShowAlertToast(false)} className="text-white/80 hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification pour le temps écoulé */}
      {showTimeoutToast && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-red-800 text-white p-4 rounded-lg shadow-2xl border-l-4 border-red-400 max-w-sm">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl animate-pulse">timer_off</span>
              <div className="flex-1">
                <p className="font-bold text-sm">⏰ TEMPS STAT ÉCOULÉ !</p>
                <p className="text-xs mt-1">Le délai de 30 minutes est dépassé. Traitement en urgence requis.</p>
                <p className="text-[10px] mt-1 opacity-80">Cliquez sur la notification pour arrêter l'alerte.</p>
              </div>
              <button onClick={() => setShowTimeoutToast(false)} className="text-white/80 hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Le minuteur lui-même */}
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