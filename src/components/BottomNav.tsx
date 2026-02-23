import React from 'react';
import { LayoutGrid, Globe, BrainCircuit, Bell, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a1a0f] border-t border-[#1a3d25] pb-6 pt-3 px-2 sm:px-6 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <button
          onClick={() => onTabChange('dashboard')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors min-w-[56px]",
            activeTab === 'dashboard' ? "text-[#00e676]" : "text-[#6daa80] hover:text-[#e8f5e9]"
          )}
        >
          <LayoutGrid size={18} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
          <span className="text-[8px] font-medium tracking-tight">Tableau</span>
        </button>

        <button
          onClick={() => onTabChange('qcm')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors min-w-[56px]",
            activeTab === 'qcm' ? "text-[#00e676]" : "text-[#6daa80] hover:text-[#e8f5e9]"
          )}
        >
          <BrainCircuit size={18} strokeWidth={activeTab === 'qcm' ? 2.5 : 2} />
          <span className="text-[8px] font-medium tracking-tight">QCM</span>
        </button>

        <button
          onClick={() => onTabChange('assistant')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors min-w-[56px]",
            activeTab === 'assistant' ? "text-[#00e676]" : "text-[#6daa80] hover:text-[#e8f5e9]"
          )}
        >
          <Globe size={18} strokeWidth={activeTab === 'assistant' ? 2.5 : 2} />
          <span className="text-[8px] font-medium tracking-tight">Assistant</span>
        </button>

        <button
          onClick={() => onTabChange('calculator')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors min-w-[56px]",
            activeTab === 'calculator' ? "text-[#00e676]" : "text-[#6daa80] hover:text-[#e8f5e9]"
          )}
        >
          <Calculator size={18} strokeWidth={activeTab === 'calculator' ? 2.5 : 2} />
          <span className="text-[8px] font-medium tracking-tight">Calculs</span>
        </button>

        <button
          onClick={() => onTabChange('notifications')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors min-w-[56px]",
            activeTab === 'notifications' ? "text-[#00e676]" : "text-[#6daa80] hover:text-[#e8f5e9]"
          )}
        >
          <Bell size={18} strokeWidth={activeTab === 'notifications' ? 2.5 : 2} />
          <span className="text-[8px] font-medium tracking-tight">Rappels</span>
        </button>
      </div>
    </div>
  );
}
