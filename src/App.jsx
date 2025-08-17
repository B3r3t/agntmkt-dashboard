import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { OrganizationProvider } from './contexts/OrganizationContext';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import LeadsPage from './components/LeadsPage';
import AnalyticsPage from './components/AnalyticsPage';
import ChatbotBuilder from './components/ChatbotBuilder';
import AdminDashboard from './components/AdminDashboard';
import ScoringConfigPage from './components/ScoringConfigPage';
import OnboardingWizard from './components/OnboardingWizard';
import NoOrganization from './components/NoOrganization';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <OrganizationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="chatbots" element={<ChatbotBuilder />} />
            <Route path="scoring" element={<ScoringConfigPage />} />
            <Route path="onboarding" element={<OnboardingWizard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="no-organization" element={<NoOrganization />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </OrganizationProvider>
  );
}

export default App;
