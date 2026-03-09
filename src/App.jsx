import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import PublicQuoteView from './components/PublicQuoteView';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simple routing for public view
  const urlParams = new URLSearchParams(window.location.search);
  const publicQuoteId = urlParams.get('id');
  const isPublicView = urlParams.get('view') === 'quote';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="loading-screen">Cargando aplicación...</div>;

  // Render public view if requested via URL
  if (isPublicView && publicQuoteId) {
    return <PublicQuoteView quoteId={publicQuoteId} />;
  }

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
