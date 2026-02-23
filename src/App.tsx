import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import Assistant from './components/Assistant';
import Dashboard from './components/Dashboard';
import QCMPage from './components/QCMPage';
import BottomNav from './components/BottomNav';
import Login from './components/Login';
import Header from './components/Header';
import RemindersPage from './components/RemindersPage';
import MedicalCalculator from './components/MedicalCalculator';
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
  type: 'exam' | 'revision' | 'course' | 'other';
  color?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Score[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationsList, setNotificationsList] = useState<string[]>([]);
  const [notifiedEvents, setNotifiedEvents] = useState<Set<number>>(new Set());

  const addNotification = (message: string) => {
    setNotification(message);
    setNotificationsList(prev => [message, ...prev].slice(0, 10));
    setTimeout(() => setNotification(null), 5000);
  };

  const clearNotifications = () => {
    setNotificationsList([]);
  };

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
      try {
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id);
        
        if (eventsError) {
          if (eventsError.code === 'PGRST204' || eventsError.message.includes('public.events')) {
            console.warn("Events table missing, using local storage fallback");
            const localEvents = localStorage.getItem(`events_${user.id}`);
            if (localEvents) setEvents(JSON.parse(localEvents));
          } else {
            throw eventsError;
          }
        } else if (eventsData) {
          setEvents(eventsData);
        }
      } catch (e) {
        console.error("Error fetching events, falling back to local storage:", e);
        const localEvents = localStorage.getItem(`events_${user.id}`);
        if (localEvents) setEvents(JSON.parse(localEvents));
      }

      // Check for today's events
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter(e => e.date === today);
      if (todayEvents.length > 0) {
        todayEvents.forEach(e => {
          if (e.id && !notifiedEvents.has(e.id)) {
            addNotification(`Rappel: ${e.title} aujourd'hui !`);
            setNotifiedEvents(prev => new Set(prev).add(e.id!));
          }
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [session]);

  const addEvent = async (event: Omit<CustomEvent, 'id' | 'user_id'>) => {
    if (!session?.user) return;
    const userId = session.user.id;
    
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{ ...event, user_id: userId }])
        .select();
      
      if (error) {
        // Check if table is missing
        if (error.message.includes('public.events')) {
          const newEvent = { ...event, id: Date.now(), user_id: userId };
          const updatedEvents = [...events, newEvent];
          setEvents(updatedEvents);
          localStorage.setItem(`events_${userId}`, JSON.stringify(updatedEvents));
          addNotification("Événement enregistré localement (Table manquante)");
          return;
        }
        throw error;
      }
      
      if (data) {
        setEvents(prev => [...prev, ...data]);
        addNotification("Événement ajouté avec succès !");
      }
      fetchData();
    } catch (error: any) {
      console.error("Error adding event:", error);
      
      // Fallback for any other error
      const newEvent = { ...event, id: Date.now(), user_id: userId };
      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      localStorage.setItem(`events_${userId}`, JSON.stringify(updatedEvents));
      
      addNotification("Événement enregistré localement");
    }
  };

  const deleteEvent = async (eventId: number) => {
    if (!session?.user) return;
    const userId = session.user.id;
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) {
        if (error.message.includes('public.events')) {
          const updatedEvents = events.filter(e => e.id !== eventId);
          setEvents(updatedEvents);
          localStorage.setItem(`events_${userId}`, JSON.stringify(updatedEvents));
          addNotification("Événement supprimé localement");
          return;
        }
        throw error;
      }
      
      setEvents(prev => prev.filter(e => e.id !== eventId));
      addNotification("Événement supprimé");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting event:", error);
      const updatedEvents = events.filter(e => e.id !== eventId);
      setEvents(updatedEvents);
      localStorage.setItem(`events_${userId}`, JSON.stringify(updatedEvents));
      addNotification("Événement supprimé localement");
    }
  };

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
    const handleNav = () => {
      setActiveTab('assistant');
      // We could also set a global state to activate the calculator chip
      // but let's keep it simple for now as the user can just click it.
    };
    window.addEventListener('navigate-to-assistant-calc', handleNav);
    return () => window.removeEventListener('navigate-to-assistant-calc', handleNav);
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
        notifications={notificationsList}
        clearNotifications={clearNotifications}
      />
      
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-[#00e676] text-[#0a1a0f] px-6 py-3 rounded-2xl font-bold shadow-2xl shadow-[#00e676]/20 animate-bounce">
          {notification}
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none', height: '100%' }}>
          <Dashboard 
            onNavigate={setActiveTab} 
            scores={scores} 
            profile={profile} 
            refreshData={fetchData} 
            events={events}
            addEvent={addEvent}
            deleteEvent={deleteEvent}
            addNotification={addNotification}
          />
        </div>
        <div style={{ display: activeTab === 'qcm' ? 'block' : 'none', height: '100%' }}>
          <QCMPage refreshData={fetchData} session={session} />
        </div>
        <div style={{ display: activeTab === 'assistant' ? 'block' : 'none', height: '100%' }}>
          <Assistant />
        </div>
        <div style={{ display: activeTab === 'calculator' ? 'block' : 'none', height: '100%' }}>
          <MedicalCalculator />
        </div>
        <div style={{ display: activeTab === 'notifications' ? 'block' : 'none', height: '100%' }}>
          <RemindersPage 
            notifications={notificationsList} 
            events={events} 
          />
        </div>
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
