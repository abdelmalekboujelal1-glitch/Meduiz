import React from 'react';
import { LayoutGrid, Globe, BrainCircuit } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a1a0f] border-t border-[#1a3d25] pb-6 pt-3 px-6 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <button
          onClick={() => onTabChange('dashboard')}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-colors",
            activeTab === 'dashboard' ? "text-[#00e676]" : "text-[#6daa80] hover:text-[#e8f5e9]"
          )}
        >
          <LayoutGrid size={22} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">Tableau de bord</span>
        </button>

        <button
          onClick={() => onTabChange('qcm')}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-colors",
            activeTab === 'qcm' ? "text-[#00e676]" : "text-[#6daa80] hover:text-[#e8f5e9]"
          )}
        >
          <BrainCircuit size={22} strokeWidth={activeTab === 'qcm' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">Générateur QCM</span>
        </button>

        <button
          onClick={() => onTabChange('assistant')}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-colors",
            activeTab === 'assistant' ? "text-[#00e676]" : "text-[#6daa80] hover:text-[#e8f5e9]"
          )}
        >
          <Globe size={22} strokeWidth={activeTab === 'assistant' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">Assistant IA</span>
        </button>
      </div>
    </div>
  );
}
