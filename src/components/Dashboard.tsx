import React, { useEffect, useState } from 'react';
import { 
  Bot, 
  Flame, 
  CheckCircle2,
  TrendingUp,
  Clock,
  MoreHorizontal,
  ChevronRight,
  Trash2,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CustomEvent } from '../App';
import EventModal from './EventModal';
import Timer from './Timer';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { useCalendar } from '../hooks/useCalendar';

const calculateStreak = (data: Score[]) => {
  if (data.length === 0) {
    return 0;
  }

  const sortedDates = [...new Set(data.map(s => new Date(s.created_at).toDateString()))]
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (sortedDates.length > 0) {
    const lastActive = sortedDates[0];
    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      currentStreak = 1;
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const curr = sortedDates[i];
        const next = sortedDates[i+1];
        const diff = Math.floor((curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }
  return currentStreak;
};

interface Score {
  subject: string;
  score: number;
  date: string;
  correct: number;
  total: number;
  created_at: string;
}

interface Profile {
    name: string;
}

interface DashboardProps {
  onNavigate?: (tab: string) => void;
  scores: Score[];
  profile: Profile | null;
  refreshData: () => void;
  addNotification: (message: string) => void;
  events: CustomEvent[];
  addEvent: (event: Omit<CustomEvent, 'user_id' | 'id'>) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
}

export default function Dashboard({
  onNavigate, 
  scores, 
  profile, 
  refreshData, 
  addNotification,
  events,
  addEvent,
  deleteEvent
}: DashboardProps) {
    const [streak, setStreak] = useState(0);
    const {
        selectedDate,
        isEventModalOpen,
        setIsEventModalOpen,
        handleDateClick,
        handleSaveEvent,
        handleDeleteEvent,
        calendarDays,
    } = useCalendar(scores, events, addEvent, deleteEvent);

  useEffect(() => {
    setStreak(calculateStreak(scores));
  }, [scores]);




  const totalQcm = scores.length;
  const avgScore = totalQcm ? Math.round(scores.reduce((a, b) => a + b.score, 0) / totalQcm) : 0;
  
  const weeklyActivity = [
    { name: 'Lun', qcm: 0 },
    { name: 'Mar', qcm: 0 },
    { name: 'Mer', qcm: 0 },
    { name: 'Jeu', qcm: 0 },
    { name: 'Ven', qcm: 0 },
    { name: 'Sam', qcm: 0 },
    { name: 'Dim', qcm: 0 },
  ];

  if (scores.length > 0) {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
      startOfWeek.setHours(0, 0, 0, 0);

      scores.forEach(s => {
          const date = new Date(s.created_at);
          if (date >= startOfWeek) {
              const day = date.getDay(); 
              const index = day === 0 ? 6 : day - 1;
              if (weeklyActivity[index]) {
                  weeklyActivity[index].qcm += 1;
              }
          }
      });
  }

  const performanceData = scores.length > 0 
    ? scores.slice(0, 10).reverse().map((s, i) => ({ name: `T${i+1}`, score: s.score }))
    : [];

  return (
        <>
      {isEventModalOpen && selectedDate && (
        <EventModal 
          date={selectedDate} 
          onClose={() => setIsEventModalOpen(false)} 
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          events={events.filter(e => e.date === format(selectedDate, 'yyyy-MM-dd'))}
        />
      )}
      <div className="flex h-full bg-[#0a1a0f] text-[#e8f5e9] font-sans overflow-hidden">
      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {/* GRID LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* ROW 1: STATS CARDS */}
            <StatCard 
                icon={<CheckCircle2 className="text-[#00e676]" />} 
                label="QCM Complétés" 
                value={totalQcm.toString()} 
            />
            <StatCard 
                icon={<TrendingUp className="text-[#00e676]" />} 
                label="Score Moyen" 
                value={`${avgScore}%`} 
            />
            <StatCard 
                icon={<Clock className="text-[#00e676]" />} 
                label="Événements Aujourd'hui" 
                value={events.filter(e => e.date === new Date().toISOString().split('T')[0]).length.toString()} 
            />
            <StatCard 
                icon={<Flame className="text-[#00e676]" />} 
                label="Série d'étude" 
                value={streak.toString()} 
                subValue="Jours consécutifs"
            />

            {/* ROW 2: CHARTS (Span 3 cols on XL) */}
            <div className="xl:col-span-3 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar Chart */}
                    <div className="bg-[#0f2317] border border-[#1a3d25] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold">Activité QCM</h3>
                            <select className="bg-[#0a1a0f] border border-[#1a3d25] text-xs rounded-lg px-2 py-1 outline-none text-[#6daa80]">
                                <option>Cette semaine</option>
                            </select>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyActivity}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1a3d25" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6daa80', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6daa80', fontSize: 12}} />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: '#0a1a0f', borderColor: '#1a3d25', borderRadius: '8px', color: '#e8f5e9'}}
                                        itemStyle={{color: '#e8f5e9'}}
                                        cursor={{fill: '#1a3d25', opacity: 0.4}}
                                    />
                                    <Bar dataKey="qcm" fill="#00e676" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Line Chart */}
                    <div className="bg-[#0f2317] border border-[#1a3d25] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold">Performance</h3>
                            <div className="flex items-center gap-2 text-xs text-[#00e676]">
                                <TrendingUp size={14} />
                                +12% vs semaine passée
                            </div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1a3d25" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6daa80', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6daa80', fontSize: 12}} />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: '#0a1a0f', borderColor: '#1a3d25', borderRadius: '8px', color: '#e8f5e9'}}
                                        itemStyle={{color: '#e8f5e9'}}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="#00e676" strokeWidth={3} dot={{fill: '#0a1a0f', stroke: '#00e676', strokeWidth: 2, r: 4}} activeDot={{r: 6, fill: '#00e676'}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Results Table */}
                <div className="bg-[#0f2317] border border-[#1a3d25] rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-[#1a3d25] flex items-center justify-between">
                        <h3 className="font-semibold">Résultats récents</h3>
                        <button 
                          onClick={() => onNavigate?.('qcm')} 
                          className="text-xs text-[#00e676] hover:underline"
                        >
                          Voir tout
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#0a1a0f] text-[#6daa80] uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Matière</th>
                                    <th className="px-6 py-3 font-medium">Score</th>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1a3d25]">
                                {scores.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-[#6daa80]">
                                            Aucun résultat disponible
                                        </td>
                                    </tr>
                                ) : (
                                    scores.slice(0, 5).map((score, idx) => (
                                        <tr key={idx} className="hover:bg-[#1a3d25]/30 transition-colors">
                                            <td className="px-6 py-4 font-medium">{score.subject}</td>
                                            <td className="px-6 py-4">{score.score}%</td>
                                            <td className="px-6 py-4 text-[#6daa80]">{score.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                    score.score >= 50 
                                                        ? "bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20" 
                                                        : "bg-[#ff5252]/10 text-[#ff5252] border-[#ff5252]/20"
                                                )}>
                                                    {score.score >= 50 ? 'Validé' : 'Échoué'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ROW 2: RIGHT PANEL (Span 1 col on XL) */}
            <div className="xl:col-span-1 space-y-6">
                                <Timer addNotification={addNotification} />

                {/* Calendar */}
                <div className="bg-[#0f2317] border border-[#1a3d25] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Calendrier</h3>
                        <span className="text-xs text-[#6daa80]">{format(new Date(), 'MMMM yyyy', { locale: fr })}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                            <div key={i} className="text-[#6daa80] py-1">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] sm:text-sm">
                        {calendarDays.map((day, i) => (
                            <div
                                key={i}
                                onClick={() => handleDateClick(day.date)}
                                className={cn(
                                    "aspect-square flex items-center justify-center rounded-lg cursor-pointer hover:bg-[#1a3d25]/60 transition-colors relative font-medium",
                                    {
                                        "bg-[#00e676] text-[#0a1a0f] font-bold hover:bg-[#00e676]": day.isToday,
                                        "text-[#00e676]": !day.isToday && day.hasActivity && !day.hasEvent,
                                        "text-[#0a1a0f] font-bold": day.hasEvent,
                                    }
                                )}
                                style={day.hasEvent ? { backgroundColor: day.eventColor || '#00e676' } : {}}
                            >
                                {format(day.date, 'd')}
                                
                                {!day.isToday && day.hasActivity && !day.hasEvent && (
                                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#00e676]"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shortcuts */}
                <div className="bg-[#0f2317] border border-[#1a3d25] rounded-2xl p-5">
                    <h3 className="font-semibold mb-4">Raccourcis</h3>
                    <div className="space-y-3">
                        <button onClick={() => onNavigate?.('qcm')} className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0a1a0f] border border-[#1a3d25] hover:border-[#00e676] transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#00e676]/10 rounded-lg text-[#00e676]">
                                    <FileText size={16} />
                                </div>
                                <span className="text-sm font-medium">Nouveau QCM</span>
                            </div>
                            <ChevronRight size={16} className="text-[#6daa80] group-hover:text-[#00e676] transition-colors" />
                        </button>
                        <button onClick={() => onNavigate?.('assistant')} className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0a1a0f] border border-[#1a3d25] hover:border-[#00e676] transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#00e676]/10 rounded-lg text-[#00e676]">
                                    <Bot size={16} />
                                </div>
                                <span className="text-sm font-medium">Poser une question</span>
                            </div>
                            <ChevronRight size={16} className="text-[#6daa80] group-hover:text-[#00e676] transition-colors" />
                        </button>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string, subValue?: string }) {
  return (
    <div className="bg-[#0f2317] border border-[#1a3d25] rounded-2xl p-5 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-[#0a1a0f] rounded-xl border border-[#1a3d25]">
          {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
        </div>
        <MoreHorizontal size={16} className="text-[#6daa80] cursor-pointer" />
      </div>
      <div>
        <div className="text-2xl font-bold text-[#e8f5e9] mb-1">{value}</div>
        <div className="text-xs font-medium text-[#6daa80] uppercase tracking-wider">{label}</div>
        {subValue && <div className="text-xs text-[#3d6b4d] mt-1">{subValue}</div>}
      </div>
    </div>
  );
}
