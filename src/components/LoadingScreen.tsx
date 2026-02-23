import React, { useEffect, useState } from 'react';
import { Heart, Dna, Pill, Stethoscope, Microscope, Bone } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [text, setText] = useState('');
  const fullText = "Medicine could never be better";
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showIcons, setShowIcons] = useState(false);

  useEffect(() => {
    // 1. Logo fade in is handled by CSS initial state

    // 2. Tagline typing (starts after 0.5s)
    const typeStartTimeout = setTimeout(() => {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 30); // ~1s to type
    }, 500);

    // 3. Icons appear (starts after 1.5s)
    const iconsTimeout = setTimeout(() => {
      setShowIcons(true);
    }, 1500);

    // 5. Progress bar (starts immediately, finishes in 3.5s)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    // 6. Fade out and complete
    const completeTimeout = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        onComplete();
      }, 500); // Wait for fade out transition
    }, 3500);

    return () => {
      clearTimeout(typeStartTimeout);
      clearTimeout(iconsTimeout);
      clearInterval(progressInterval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  const icons = [
    { Icon: Heart, top: '20%', left: '15%', delay: '0s' },
    { Icon: Dna, top: '25%', right: '15%', delay: '0.2s' },
    { Icon: Pill, bottom: '30%', left: '20%', delay: '0.4s' },
    { Icon: Stethoscope, bottom: '25%', right: '20%', delay: '0.6s' },
    { Icon: Microscope, top: '40%', left: '10%', delay: '0.8s' },
    { Icon: Bone, top: '45%', right: '10%', delay: '1.0s' },
  ];

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-med-bg flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-dot {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0); }
          70% { transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        .ecg-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: dash 2.5s linear infinite;
        }
        .pulse-dot {
          offset-path: path("M0,50 L100,50 L110,45 L120,50 L130,50 L140,20 L150,80 L160,50 L170,50 L180,40 L190,50 L300,50");
          offset-distance: 0%;
          animation: moveDot 2.5s linear infinite;
        }
        @keyframes moveDot {
          to { offset-distance: 100%; }
        }
      `}</style>

      {/* Floating Icons */}
      {showIcons && icons.map(({ Icon, top, left, right, bottom, delay }, index) => (
        <div
          key={index}
          className="absolute text-med-text-muted opacity-0"
          style={{
            top, left, right, bottom,
            animation: `popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards ${delay}, float 3s ease-in-out infinite ${parseFloat(delay) + 0.5}s`
          }}
        >
          <Icon size={32} className="text-med-accent/40" />
        </div>
      ))}

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 mb-4"
          style={{ animation: 'fadeInDown 0.5s ease-out forwards' }}
        >
          <div className="bg-med-accent/10 p-3 rounded-2xl border border-med-accent/20 shadow-[0_0_20px_var(--med-accent)]/20">
            <Stethoscope className="w-10 h-10 text-med-accent" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-med-text to-med-accent bg-clip-text text-transparent tracking-tight">
            MedUiz
          </h1>
        </div>

        {/* Tagline */}
        <div className="h-6 mb-12">
          <p className="text-med-text-muted text-sm font-medium tracking-wide font-mono">
            {text}<span className="animate-pulse text-med-accent">|</span>
          </p>
        </div>

        {/* ECG Animation */}
        <div className="w-full h-24 relative mb-12 overflow-hidden">
          <svg 
            viewBox="0 0 300 100" 
            className="w-full h-full drop-shadow-[0_0_8px_var(--med-accent)]/60"
            preserveAspectRatio="none"
          >
            <path
              d="M0,50 L100,50 L110,45 L120,50 L130,50 L140,20 L150,80 L160,50 L170,50 L180,40 L190,50 L300,50"
              fill="none"
              stroke="var(--med-accent)"
              strokeWidth="2"
              className="ecg-path"
            />
            {/* Pulse Dot (using CSS offset-path if supported, else fallback to just path animation) */}
            <circle r="3" fill="#fff" className="pulse-dot">
              <animate 
                attributeName="opacity" 
                values="1;0.5;1" 
                dur="1s" 
                repeatCount="indefinite" 
              />
            </circle>
          </svg>
          
          {/* Gradient Fade Edges */}
          <div className="absolute inset-0 bg-gradient-to-r from-med-bg via-transparent to-med-bg pointer-events-none" />
        </div>

        {/* Circular Progress */}
        <div className="relative w-12 h-12">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="var(--med-border)"
              strokeWidth="4"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="var(--med-accent)"
              strokeWidth="4"
              strokeDasharray="125.6"
              strokeDashoffset={125.6 - (125.6 * progress) / 100}
              strokeLinecap="round"
              className="transition-all duration-100 ease-out drop-shadow-[0_0_4px_var(--med-accent)]/50"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-med-accent">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
