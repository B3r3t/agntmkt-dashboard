import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { OrganizationProvider, useOrganization } from './contexts/OrganizationContext';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import LeadsPage from './components/LeadsPage';
import AnalyticsPage from './components/AnalyticsPage';
import ChatbotConversations from './components/ChatbotConversations';
import AdminDashboard from './components/AdminDashboard';
import ScoringConfigPage from './components/ScoringConfigPage';
import OnboardingWizard from './components/OnboardingWizard';
import NoOrganization from './components/NoOrganization';

// Protected Admin Route Component
function ProtectedAdminRoute() {
  const { userRole, loading: orgLoading, isImpersonating, refreshOrganization } = useOrganization();
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    // Check if we just returned from impersonation
    const checkAdminAccess = async () => {
      // If there's no impersonation data but context thinks we're impersonating,
      // we need to refresh
      const impersonatingOrg = localStorage.getItem('admin_impersonating');
      if (!impersonatingOrg && isImpersonating) {
        await refreshOrganization();
      }
      setChecking(false);
    };
    
    checkAdminAccess();
  }, [isImpersonating, refreshOrganization]);
  
  // Show loading while organization context is loading
  if (orgLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admin dashboard...</div>
      </div>
    );
  }
  
  // Allow access if user is admin and not currently impersonating
  if (userRole === 'admin' && !isImpersonating) {
    return <AdminDashboard />;
  }
  
  // Redirect to home if not admin or if impersonating
  return <Navigate to="/" replace />;
}

// Protected Route Component for features
function ProtectedFeatureRoute({ feature, children }) {
  const { features, loading: orgLoading } = useOrganization();
  
  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  // Check if feature is enabled (undefined means enabled by default)
  if (features[feature] === false) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // Clear impersonation data on sign out
      if (!session) {
        localStorage.removeItem('admin_impersonating');
        localStorage.removeItem('admin_original_user');
        localStorage.removeItem('temp_organization_id');
        localStorage.removeItem('impersonated_org_name');
        localStorage.removeItem('admin_return_url');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <div className="text-lg font-medium text-gray-700">Loading application...</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {session ? (
        <OrganizationProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Main Dashboard - always accessible */}
              <Route index element={<Dashboard />} />
              
              {/* Core Features - always accessible */}
              <Route path="leads" element={<LeadsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              
              {/* Feature-gated routes */}
              <Route 
                path="chatbots" 
                element={
                  <ProtectedFeatureRoute feature="chatbots">
                    <ChatbotConversations />
                  </ProtectedFeatureRoute>
                } 
              />
              
              <Route 
                path="scoring" 
                element={
                  <ProtectedFeatureRoute feature="lead_scoring">
                    <ScoringConfigPage />
                  </ProtectedFeatureRoute>
                } 
              />
              
              {/* Onboarding - accessible to all authenticated users */}
              <Route path="onboarding" element={<OnboardingWizard />} />
              
              {/* Admin Dashboard - only for system admins */}
              <Route path="admin" element={<ProtectedAdminRoute />} />
              
              {/* Error/Special Pages */}
              <Route path="no-organization" element={<NoOrganization />} />
              
              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </OrganizationProvider>
      ) : (
        // Unauthenticated routes
        <Routes>
          <Route path="/*" element={<LoginPage />} />
        </Routes>
      )}
    </Router>
  );
}
