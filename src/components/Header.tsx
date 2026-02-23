import React, { useState } from 'react';
import { Stethoscope, LogOut, Search, Trash2, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  userName: string;
  onResetProgress: () => void;
  confirmReset: boolean;
  notifications: string[];
  clearNotifications: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  userName, 
  onResetProgress, 
  confirmReset,
  notifications,
  clearNotifications
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="h-16 bg-[#0a1a0f] border-b border-[#1a3d25] flex items-center justify-between px-6 shrink-0 relative z-50">
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

        {/* Notifications Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full hover:bg-[#0f2317] text-[#6daa80] hover:text-[#00e676] transition-colors relative"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#00e676] rounded-full animate-pulse"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 bg-[#0f2317] border border-[#1a3d25] rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="p-4 border-b border-[#1a3d25] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Notifications</h3>
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearNotifications}
                      className="text-[10px] text-[#6daa80] hover:text-[#ff5252]"
                    >
                      Tout effacer
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-[#6daa80] text-xs">
                      Aucune notification
                    </div>
                  ) : (
                    <div className="divide-y divide-[#1a3d25]">
                      {notifications.map((notif, i) => (
                        <div key={i} className="p-3 hover:bg-[#1a3d25]/30 transition-colors">
                          <p className="text-xs text-[#e8f5e9]">{notif}</p>
                          <p className="text-[10px] text-[#6daa80] mt-1">À l'instant</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
