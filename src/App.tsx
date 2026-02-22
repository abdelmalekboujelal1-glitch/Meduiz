import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import Assistant from './components/Assistant';
import Dashboard from './components/Dashboard';
import QCMPage from './components/QCMPage';
import BottomNav from './components/BottomNav';
import Login from './components/Login';
import Header from './components/Header';
import { Notification } from './components/NotificationPanel';

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

export interface CustomEvent {
  id?: number;
  user_id: string;
  date: string;
  title: string;
  type: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Score[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.user) return;
    const { user } = session;

    try {
      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      setProfile(profileData || null);

      // Fetch Scores
      const { data: scoresData } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (scoresData) {
        const formattedScores = scoresData.map((s: any) => ({
          subject: s.subject,
          score: s.score,
          date: new Date(s.created_at).toLocaleDateString('fr-DZ'),
          correct: s.correct,
          total: s.total,
          created_at: s.created_at
        }));
        setScores(formattedScores);
      }

      // Fetch Events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id);
      setEvents(eventsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [session]);

  const handleResetProgress = async () => {
    if (confirmReset) {
      try {
        if (session.user) {
            await supabase.from('scores').delete().eq('user_id', session.user.id);
            fetchData(); // Refresh data
        }
      } catch (e) {
        console.error("Error resetting progress:", e);
      }
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
    }
  };

  useEffect(() => {
    if (confirmReset) {
      const timer = setTimeout(() => setConfirmReset(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmReset]);

  const addNotification = (message: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const addEvent = async (event: Omit<CustomEvent, 'user_id' | 'id'>) => {
    if (!session) return;
    if (session.user) {
      await supabase.from('events').insert({ ...event, user_id: session.user.id });
      fetchData();
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error("Session init error:", error);
      setSession(data?.session ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, fetchData]);

  if (loading) {
    return <div className="h-screen w-full bg-[#0a1a0f] flex items-center justify-center text-[#00e676]">Chargement...</div>;
  }

  if (!session) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return (
    <div className="h-screen w-full bg-[#0a1a0f] text-white flex flex-col overflow-hidden font-sans">
      <Header 
        userName={profile?.name || 'Étudiant'} 
        onResetProgress={handleResetProgress} 
        confirmReset={confirmReset} 
        notifications={notifications}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        onClearNotifications={handleClearNotifications}
        onMarkAllRead={handleMarkAllRead}
      />
      <div className="flex-1 relative overflow-hidden">
        <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none', height: '100%' }}>
          <Dashboard 
            onNavigate={setActiveTab} 
            scores={scores} 
            profile={profile} 
            refreshData={fetchData} 
            addNotification={addNotification} 
            events={events}
            isEventModalOpen={isEventModalOpen}
            setIsEventModalOpen={setIsEventModalOpen}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            addEvent={addEvent}
          />
        </div>
        <div style={{ display: activeTab === 'qcm' ? 'block' : 'none', height: '100%' }}>
          <QCMPage refreshData={fetchData} session={session} />
        </div>
        <div style={{ display: activeTab === 'assistant' ? 'block' : 'none', height: '100%' }}>
          <Assistant />
        </div>
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
