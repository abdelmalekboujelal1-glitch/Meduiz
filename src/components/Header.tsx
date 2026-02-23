import React, { useState } from 'react';
import { Stethoscope, LogOut, Search, Trash2, Bell, Palette, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Theme, THEMES } from '../lib/themes';

interface HeaderProps {
  userName: string;
  onResetProgress: () => void;
  confirmReset: boolean;
  notifications: string[];
  clearNotifications: () => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  userName, 
  onResetProgress, 
  confirmReset,
  notifications,
  clearNotifications,
  currentTheme,
  onThemeChange
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="h-16 bg-med-bg border-b border-med-border flex items-center justify-between px-3 sm:px-6 shrink-0 relative z-50 transition-colors duration-300">
      <div className="flex items-center gap-2 sm:gap-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-med-accent/10 p-1.5 sm:p-2 rounded-xl">
            <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-med-accent" />
          </div>
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-med-text to-med-accent bg-clip-text text-transparent">
            MedUiz
          </span>
        </div>
        <div className="h-8 w-px bg-med-border hidden md:block"></div>
        <div className="hidden md:block">
          <h1 className="text-sm font-bold text-med-text">Bonjour {userName} 👋</h1>
          <p className="text-[10px] text-med-text-muted">Prêt à apprendre aujourd'hui ?</p>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-4">
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-med-text-muted" />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="bg-med-card border border-med-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-med-accent w-48 xl:w-64 text-med-text placeholder-med-text-dim transition-colors duration-300"
          />
        </div>

        {/* Theme Selector */}
        <div className="relative">
            <button
                onClick={() => setShowThemes(!showThemes)}
                className="p-1.5 sm:p-2 rounded-full hover:bg-med-card text-med-text-muted hover:text-med-accent transition-colors relative"
                title="Changer de thème"
            >
                <Palette size={18} className="sm:w-5 sm:h-5" />
            </button>

            <AnimatePresence>
                {showThemes && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-med-card border border-med-border rounded-2xl shadow-xl overflow-hidden z-[60]"
                    >
                        <div className="p-4 border-b border-med-border">
                            <h3 className="text-sm font-bold text-med-text">Thème</h3>
                        </div>
                        <div className="p-2 max-h-80 overflow-y-auto">
                            {THEMES.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => {
                                        onThemeChange(theme);
                                        setShowThemes(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-xl transition-all mb-1",
                                        currentTheme.id === theme.id 
                                            ? "bg-med-accent/10 text-med-accent" 
                                            : "hover:bg-med-bg text-med-text-muted hover:text-med-text"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-1">
                                            <div className="w-4 h-4 rounded-full border border-med-card" style={{ backgroundColor: theme.colors.accent }} />
                                            <div className="w-4 h-4 rounded-full border border-med-card" style={{ backgroundColor: theme.colors.bg }} />
                                        </div>
                                        <span className="text-xs font-medium">{theme.name}</span>
                                    </div>
                                    {currentTheme.id === theme.id && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 sm:p-2 rounded-full hover:bg-med-card text-med-text-muted hover:text-med-accent transition-colors relative"
          >
            <Bell size={18} className="sm:w-5 sm:h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-med-accent rounded-full animate-pulse"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-med-card border border-med-border rounded-2xl shadow-xl overflow-hidden z-[60]"
              >
                <div className="p-4 border-b border-med-border flex items-center justify-between">
                  <h3 className="text-sm font-bold text-med-text">Notifications</h3>
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearNotifications}
                      className="text-[10px] text-med-text-muted hover:text-med-danger"
                    >
                      Tout effacer
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-med-text-muted text-xs">
                      Aucune notification
                    </div>
                  ) : (
                    <div className="divide-y divide-med-border">
                      {notifications.map((notif, i) => (
                        <div key={i} className="p-3 hover:bg-med-bg/50 transition-colors">
                          <p className="text-xs text-med-text">{notif}</p>
                          <p className="text-[10px] text-med-text-muted mt-1">À l'instant</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={handleLogout} className="p-1.5 sm:p-2 rounded-full hover:bg-med-card text-med-text-muted hover:text-med-danger transition-colors" title="Se déconnecter">
          <LogOut size={18} className="sm:w-5 sm:h-5" />
        </button>
        <button 
          onClick={onResetProgress}
          className={cn(
            "p-1.5 sm:p-2 rounded-full transition-all flex items-center gap-1 sm:gap-2 text-med-text-muted hover:bg-med-card",
            confirmReset 
              ? "bg-med-danger/20 text-med-danger"
              : "hover:text-med-danger"
          )}
          title={confirmReset ? "Confirmer la suppression" : "Réinitialiser la progression"}
        >
          <Trash2 size={18} className="sm:w-5 sm:h-5" />
          {confirmReset && <span className="text-[10px] sm:text-xs font-bold pr-1 sm:pr-2">Confirmer ?</span>}
        </button>
      </div>
    </header>
  );
};

export default Header;