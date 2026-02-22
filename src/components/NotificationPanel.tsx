import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onClear: () => void;
  onMarkAllRead: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClear, onMarkAllRead }) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="absolute top-16 right-6 w-80 bg-[#0f2317] border border-[#1a3d25] rounded-2xl shadow-2xl text-[#e8f5e9] z-50">
      <div className="p-4 border-b border-[#1a3d25] flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <Bell size={18} className="text-[#00e676]" />
          Notifications
        </h3>
        {unreadCount > 0 && (
          <span className="px-2 py-0.5 text-xs font-bold text-[#0a1a0f] bg-[#00e676] rounded-full">
            {unreadCount} Nouveau
          </span>
        )}
      </div>
      <div className="p-2 max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-10 text-sm text-[#6daa80]">
            Aucune notification pour le moment.
          </div>
        ) : (
          notifications.map(notification => (
            <div key={notification.id} className={`p-3 rounded-lg ${notification.read ? 'opacity-60' : 'bg-[#0a1a0f]'}`}>
              <p className="text-sm mb-1">{notification.message}</p>
              <p className="text-xs text-[#6daa80]">
                {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: fr })}
              </p>
            </div>
          ))
        )}
      </div>
      {notifications.length > 0 && (
        <div className="p-2 border-t border-[#1a3d25] flex justify-between">
           <button onClick={onMarkAllRead} className="text-xs text-[#6daa80] hover:text-[#00e676] p-2 rounded-md flex items-center gap-1.5 transition-colors">
            <CheckCheck size={14} />
            Marquer comme lu
          </button>
          <button onClick={onClear} className="text-xs text-[#6daa80] hover:text-[#ff5252] p-2 rounded-md transition-colors">
            Effacer
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
