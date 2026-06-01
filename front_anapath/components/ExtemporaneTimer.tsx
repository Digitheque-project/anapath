'use client';

import { useState, useEffect } from 'react';

interface ExtemporaneTimerProps {
  startTime: Date | string;
  requestId?: string;
  anapathId?: string;
  patientId?: string;
  onTimeOut?: () => void;
}

export default function ExtemporaneTimer({ startTime, onTimeOut }: ExtemporaneTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const start = new Date(startTime);
    const deadline = new Date(start.getTime() + 30 * 60 * 1000);

    const updateTimer = () => {
      const now = new Date();
      const remaining = deadline.getTime() - now.getTime();
      
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        if (onTimeOut) onTimeOut();
        return;
      }
      
      setTimeLeft(Math.floor(remaining / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [startTime, onTimeOut]);

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

  if (timeLeft === 0 && isExpired) {
    return (
      <div className="bg-red-800 text-white p-4 rounded-lg text-center">
        <span className="material-symbols-outlined text-3xl">timer_off</span>
        <p className="font-bold mt-1">TEMPS ÉCOULÉ</p>
        <p className="text-xs">Le délai de 30 minutes est dépassé</p>
      </div>
    );
  }

  return (
    <div className={`${getColor()} p-4 rounded-lg text-center transition-all duration-300 shadow-lg`}>
      <div className="flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-2xl">timer</span>
        <span className="font-mono text-3xl font-bold tracking-wider">
          {formatTime(timeLeft)}
        </span>
      </div>
      <p className="text-sm mt-1 font-medium">Temps restant pour examen STAT</p>
    </div>
  );
}