import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface TimerProps {
  addNotification?: (message: string) => void;
}

export default function Timer({ addNotification }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      const nextMode = mode === 'study' ? 'break' : 'study';
      const nextTime = nextMode === 'study' ? 25 * 60 : 5 * 60;
      
      if (addNotification) {
        addNotification(mode === 'study' ? "Session d'étude terminée ! Prenez une pause." : "Pause terminée ! C'est l'heure d'étudier.");
      }
      
      setMode(nextMode);
      setTimeLeft(nextTime);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode, addNotification]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'study' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0f2317] border border-[#1a3d25] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#00e676]" />
          <h3 className="font-semibold">Minuteur d'étude</h3>
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
          mode === 'study' ? "bg-[#00e676]/10 text-[#00e676]" : "bg-blue-500/10 text-blue-400"
        )}>
          {mode === 'study' ? 'Étude' : 'Pause'}
        </div>
      </div>
      
      <div className="text-center mb-6">
        <div className="text-4xl font-mono font-bold text-[#e8f5e9] tracking-wider">
          {formatTime(timeLeft)}
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4">
        <button 
          onClick={resetTimer}
          className="p-2 rounded-xl bg-[#0a1a0f] border border-[#1a3d25] text-[#6daa80] hover:text-[#e8f5e9] transition-colors"
        >
          <RotateCcw size={20} />
        </button>
        <button 
          onClick={toggleTimer}
          className={cn(
            "p-3 rounded-2xl transition-all shadow-lg",
            isActive 
              ? "bg-[#ff5252] text-white shadow-[#ff5252]/20" 
              : "bg-[#00e676] text-[#0a1a0f] shadow-[#00e676]/20"
          )}
        >
          {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
        </button>
        <div className="w-10" /> {/* Spacer to balance reset button */}
      </div>
    </div>
  );
}
