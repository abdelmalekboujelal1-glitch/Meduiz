import React from 'react';
import { LayoutGrid, Globe, BrainCircuit, Bell, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Tableau' },
    { id: 'qcm', icon: BrainCircuit, label: 'QCM' },
    { id: 'assistant', icon: Globe, label: 'Assistant' },
    { id: 'calculator', icon: Calculator, label: 'Calculs' },
    { id: 'notifications', icon: Bell, label: 'Rappels' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-med-bg border-t border-med-border pb-6 pt-2 px-2 sm:px-6 z-50 transition-colors duration-300">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 min-w-[56px] sm:min-w-[64px] h-[56px] rounded-2xl transition-colors",
                isActive ? "text-med-accent" : "text-med-text-muted hover:text-med-text"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-med-accent/10 rounded-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative z-10"
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className="text-[10px] font-medium tracking-tight relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
