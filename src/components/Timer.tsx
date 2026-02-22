import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

const modeDetails: Record<TimerMode, { duration: number; label: string }> = {
  pomodoro: { duration: 25, label: 'Pomodoro' },
  shortBreak: { duration: 5, label: 'Petite Pause' },
  longBreak: { duration: 10, label: 'Longue Pause' },
};

interface TimerProps {
  addNotification: (message: string) => void;
}

const Timer: React.FC<TimerProps> = ({ addNotification }) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [minutes, setMinutes] = useState(modeDetails[mode].duration);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

  const totalSeconds = modeDetails[mode].duration * 60;
  const remainingSeconds = minutes * 60 + seconds;
  const progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('MedUiz Timer', {
        body: `Votre session de ${modeDetails[mode].label} est terminée !`,
        icon: '/favicon.ico',
      });
    }
  };

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds((s) => s - 1);
        } else if (minutes > 0) {
          setMinutes((m) => m - 1);
          setSeconds(59);
        } else {
                    const message = `Votre session de ${modeDetails[mode].label} est terminée. Il est temps de faire une pause !`;
          addNotification(message);
          resetTimer(mode, false);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, minutes, seconds, mode]);

  const toggleTimer = () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    if (!isActive) {
      setIsActive(true);
    }
    setIsPaused(!isPaused);
  };

  const resetTimer = (newMode: TimerMode, userInitiated = true) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setIsPaused(true);
    setMode(newMode);
    setMinutes(modeDetails[newMode].duration);
    setSeconds(0);
  };

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="bg-[#0f2317] border border-[#1a3d25] rounded-2xl p-5 text-center">
      <div className="flex justify-center gap-2 mb-4">
        {(Object.keys(modeDetails) as TimerMode[]).map((m) => (
          <button 
            key={m}
            onClick={() => resetTimer(m)}
            className={cn(
              "px-3 py-1 text-xs rounded-full border transition-colors",
              mode === m 
                ? "bg-[#00e676] text-[#0a1a0f] border-transparent font-bold"
                : "bg-transparent border-[#1a3d25] text-[#6daa80] hover:border-[#00e676]/50"
            )}
          >
            {modeDetails[m].label}
          </button>
        ))}
      </div>
      <div className="relative w-48 h-48 mx-auto mb-4">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <circle className="text-[#0a1a0f]" strokeWidth="12" stroke="currentColor" fill="transparent" r={radius} cx="100" cy="100" />
          <circle
            className="text-[#00e676]"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="100"
            cy="100"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-xs text-[#6daa80]">{modeDetails[mode].label}</span>
        </div>
      </div>
      <div className="flex justify-center gap-4">
        <button onClick={() => resetTimer(mode)} className="p-3 rounded-full bg-[#0a1a0f] border border-[#1a3d25] text-[#6daa80] hover:text-white transition-colors">
          <RefreshCw size={20} />
        </button>
        <button 
            onClick={toggleTimer} 
            className="w-16 h-12 flex items-center justify-center rounded-full bg-[#00e676] text-[#0a1a0f] font-bold text-lg hover:bg-[#00b85e] transition-colors shadow-[0_0_15px_rgba(0,230,118,0.3)]"
        >
          {isPaused ? <Play size={24} /> : <Pause size={24} />}
        </button>
      </div>
    </div>
  );
};

export default Timer;
