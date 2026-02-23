import React from 'react';
import { Bell, Calendar, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { CustomEvent } from '../App';

interface RemindersPageProps {
  notifications: string[];
  events: CustomEvent[];
}

export default function RemindersPage({ notifications, events }: RemindersPageProps) {
  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events
    .filter(e => e.date >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="flex flex-col h-full bg-[#0a1a0f] text-[#e8f5e9] font-sans overflow-hidden">
      <div className="p-6 border-b border-[#1a3d25] bg-[#0a1a0f] sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="text-[#00e676]" size={24} />
          <h1 className="text-xl font-bold text-white">Notifications & Rappels</h1>
        </div>
        <p className="text-[#6daa80] text-xs">Vos alertes et événements à venir.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-8">
        {/* Notifications Section */}
        <section>
          <h2 className="text-sm font-bold text-[#6daa80] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Bell size={14} /> Récents
          </h2>
          {notifications.length === 0 ? (
            <div className="text-center py-8 bg-[#0f2317] rounded-2xl border border-[#1a3d25] border-dashed">
              <CheckCircle2 className="mx-auto text-[#1a3d25] mb-2" size={24} />
              <p className="text-xs text-[#6daa80]">Aucune nouvelle notification</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#0f2317] border-l-4 border-[#00e676] p-4 rounded-r-xl shadow-sm"
                >
                  <p className="text-sm text-white font-medium">{notif}</p>
                  <p className="text-[10px] text-[#6daa80] mt-1">À l'instant</p>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Events Section */}
        <section>
          <h2 className="text-sm font-bold text-[#6daa80] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar size={14} /> Événements à venir
          </h2>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 bg-[#0f2317] rounded-2xl border border-[#1a3d25] border-dashed">
              <Calendar className="mx-auto text-[#1a3d25] mb-2" size={24} />
              <p className="text-xs text-[#6daa80]">Aucun événement prévu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0f2317] border border-[#1a3d25] p-4 rounded-2xl flex items-center gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-[#1a3d25] rounded-xl flex flex-col items-center justify-center text-[#00e676]">
                    <span className="text-[10px] font-bold uppercase">{new Date(event.date).toLocaleString('fr-FR', { month: 'short' })}</span>
                    <span className="text-lg font-black leading-none">{new Date(event.date).getDate()}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{event.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                        event.type === 'exam' ? 'bg-red-500/20 text-red-400' :
                        event.type === 'revision' ? 'bg-blue-500/20 text-blue-400' :
                        event.type === 'course' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-[#00e676]/20 text-[#00e676]'
                      }`}>
                        {event.type === 'exam' ? 'Examen' :
                         event.type === 'revision' ? 'Révision' :
                         event.type === 'course' ? 'Cours' : 'Autre'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
