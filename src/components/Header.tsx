import React from 'react';
import { Stethoscope, LogOut, Search, Bell, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import NotificationPanel, { Notification } from './NotificationPanel';

interface HeaderProps {
  userName: string;
  onResetProgress: () => void;
  confirmReset: boolean;
  notifications: Notification[];
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  onClearNotifications: () => void;
  onMarkAllRead: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  userName, 
  onResetProgress, 
  confirmReset, 
  notifications, 
  showNotifications, 
  setShowNotifications,
  onClearNotifications,
  onMarkAllRead
}) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="h-16 bg-[#0a1a0f] border-b border-[#1a3d25] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-[#00e676]/10 p-2 rounded-xl">
            <Stethoscope className="w-6 h-6 text-[#00e676]" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-[#00e676] bg-clip-text text-transparent">
            MedUiz
          </span>
        </div>
        <div className="h-8 w-px bg-[#1a3d25] hidden sm:block"></div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-[#e8f5e9]">Bonjour {userName} 👋</h1>
          <p className="text-[10px] text-[#6daa80]">Prêt à apprendre aujourd'hui ?</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6daa80]" />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="bg-[#0f2317] border border-[#1a3d25] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#00e676] w-64 text-[#e8f5e9] placeholder-[#3d6b4d]"
          />
        </div>
                <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-full hover:bg-[#0f2317] transition-colors">
            <Bell className="w-5 h-5 text-[#6daa80]" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00e676] rounded-full border border-[#0a1a0f]"></span>
            )}
          </button>
          {showNotifications && (
            <NotificationPanel 
              notifications={notifications} 
              onClear={onClearNotifications} 
              onMarkAllRead={onMarkAllRead} 
            />
          )}
        </div>
        <button onClick={handleLogout} className="p-2 rounded-full hover:bg-[#0f2317] text-[#6daa80] hover:text-[#ff5252] transition-colors" title="Se déconnecter">
          <LogOut size={20} />
        </button>
        <button 
          onClick={onResetProgress}
          className={cn(
            "p-2 rounded-full transition-all flex items-center gap-2 text-[#6daa80] hover:bg-[#0f2317]",
            confirmReset 
              ? "bg-[#ff5252]/20 text-[#ff5252]"
              : "hover:text-[#ff5252]"
          )}
          title={confirmReset ? "Confirmer la suppression" : "Réinitialiser la progression"}
        >
          <Trash2 size={20} />
          {confirmReset && <span className="text-xs font-bold pr-2">Confirmer ?</span>}
        </button>
      </div>
    </header>
  );
};

export default Header;
