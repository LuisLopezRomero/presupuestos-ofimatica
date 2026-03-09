import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import './App.css';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="app-container">
      {!session ? (
        <Auth />
      ) : (
        <Dashboard session={session} />
      )}
    </div>
  )
}

export default App;
