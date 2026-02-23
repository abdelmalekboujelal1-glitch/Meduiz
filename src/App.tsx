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
import { THEMES, Theme } from './lib/themes';
import LoadingScreen from './components/LoadingScreen';

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
  const [showSplash, setShowSplash] = useState(false);
  const [splashHasRun, setSplashHasRun] = useState(false);
  const [scores, setScores] = useState<Score[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationsList, setNotificationsList] = useState<string[]>([]);
  const [notifiedEvents, setNotifiedEvents] = useState<Set<number>>(new Set());
  
  // Theme State
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);

  // Apply Theme Colors
  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;
    
    root.style.setProperty('--med-bg', colors.bg);
    root.style.setProperty('--med-card', colors.card);
    root.style.setProperty('--med-border', colors.border);
    root.style.setProperty('--med-accent', colors.accent);
    root.style.setProperty('--med-accent-dark', colors.accentDark);
    root.style.setProperty('--med-text', colors.text);
    root.style.setProperty('--med-text-muted', colors.textMuted);
    root.style.setProperty('--med-text-dim', colors.textDim);
    root.style.setProperty('--med-input', colors.input);
    root.style.setProperty('--med-danger', colors.danger);
    root.style.setProperty('--med-warning', colors.warning);
  }, [currentTheme]);

  const addNotification = useCallback((message: string) => {
    setNotification(message);
    setNotificationsList(prev => [message, ...prev].slice(0, 10));
    setTimeout(() => setNotification(null), 5000);
  }, []);

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
          if (eventsError.code === 'PGRST204' || eventsError.code === '42P01' || eventsError.message.includes('public.events')) {
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
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [session]);

  // Separate effect for today's events notifications to avoid stale closures in fetchData
  useEffect(() => {
    if (events.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter(e => e.date === today);
      
      todayEvents.forEach(e => {
        if (e.id && !notifiedEvents.has(e.id)) {
          addNotification(`Rappel: ${e.title} aujourd'hui !`);
          setNotifiedEvents(prev => new Set(prev).add(e.id!));
        }
      });
    }
  }, [events, notifiedEvents]);

  const addEvent = async (event: Omit<CustomEvent, 'id' | 'user_id'>) => {
    if (!session?.user) return;
    const userId = session.user.id;
    
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{ ...event, user_id: userId }])
        .select();
      
      if (error) {
        // Check if table is missing (42P01 is Postgres code for undefined_table)
        if (error.code === '42P01' || error.message.includes('public.events')) {
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
        if (error.code === '42P01' || error.message.includes('public.events')) {
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
      if (error) {
        console.error("Session init error:", error);
        setSession(null);
      } else {
        setSession(data?.session ?? null);
      }
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
    };
    window.addEventListener('navigate-to-assistant-calc', handleNav);
    return () => window.removeEventListener('navigate-to-assistant-calc', handleNav);
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, fetchData]);

  // Trigger splash screen when session is established and it hasn't run yet
  useEffect(() => {
    if (session && !splashHasRun && !loading) {
      setShowSplash(true);
    }
  }, [session, splashHasRun, loading]);

  if (showSplash) {
    return <LoadingScreen onComplete={() => {
      setShowSplash(false);
      setSplashHasRun(true);
    }} />;
  }

  if (loading) {
    return <div className="h-screen w-full bg-med-bg flex items-center justify-center text-med-accent">Chargement...</div>;
  }

  if (!session) {
    return <Login onLoginSuccess={() => {}} />;
  }

  // Prevent dashboard flash while waiting for splash to trigger
  if (!splashHasRun) {
    return null;
  }

  return (
    <div className="h-screen w-full bg-med-bg text-med-text flex flex-col overflow-hidden font-sans transition-colors duration-300">
      <Header 
        userName={profile?.name || 'Étudiant'} 
        onResetProgress={handleResetProgress} 
        confirmReset={confirmReset} 
        notifications={notificationsList}
        clearNotifications={clearNotifications}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
      />
      
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-med-accent text-med-bg px-6 py-3 rounded-2xl font-bold shadow-2xl shadow-med-accent/20 animate-bounce">
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
