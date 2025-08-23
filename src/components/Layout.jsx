// Layout.jsx - Fixed without hard refresh
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { Menu, X, ArrowLeft, AlertCircle, Home, Users, TrendingUp, Brain, MessageSquare, Shield, LogOut } from 'lucide-react';
import BackgroundDecoration from './BackgroundDecoration';

export default function Layout() {
  const navigate = useNavigate();
  const { organization, branding, userRole, isImpersonating, features, refreshOrganization } = useOrganization();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Fetch user email
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || '');
    });
  }, []);

  // System admin check - but not when impersonating
  const isSystemAdmin = userRole === 'admin' && !isImpersonating;

  const handleSignOut = async () => {
    // Clear any impersonation data when signing out
    localStorage.removeItem('admin_impersonating');
    localStorage.removeItem('admin_original_user');
    localStorage.removeItem('temp_organization_id');
    localStorage.removeItem('impersonated_org_name');
    localStorage.removeItem('admin_return_url');

    await supabase.auth.signOut();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  // Close mobile sidebar when clicking backdrop
  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const handleReturnToAdmin = async () => {
    console.log('Returning to admin...');

    // Clear ALL impersonation data FIRST
    localStorage.removeItem('admin_impersonating');
    localStorage.removeItem('admin_original_user');
    localStorage.removeItem('temp_organization_id');
    localStorage.removeItem('impersonated_org_name');
    localStorage.removeItem('admin_return_url');

    // Force refresh the organization context
    await refreshOrganization();

    // Then navigate to admin page
    navigate('/admin');
  };

  // Get logo to display
  const logoUrl = branding?.logo_url;
  const orgName = organization?.name || 'Dashboard';
  const impersonatedOrgName = localStorage.getItem('impersonated_org_name');

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <BackgroundDecoration />
      <div className="min-h-screen flex relative">
        {/* Mobile sidebar backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={closeMobileSidebar}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
  fixed lg:relative z-30 h-screen
  bg-white/95 backdrop-blur-sm shadow-xl
  border-r border-white/80
  sidebar-transition
  ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-60'}
`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} overflow-hidden`}>
                {/* Logo */}
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={orgName}
                    className="h-8 w-auto flex-shrink-0"
                  />
                ) : (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">
                      {orgName ? orgName[0].toUpperCase() : 'A'}
                    </span>
                  </div>
                )}
                {/* Brand Name - Hidden when collapsed */}
                {!sidebarCollapsed && (
                  <div>
                    <h2 className="text-gray-900 font-bold text-sm">{orgName}</h2>
                  </div>
                )}
              </div>
              {/* Desktop Collapse Toggle */}
              <button
                onClick={toggleSidebar}
                className="hidden lg:block text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `nav-item-indicator relative flex items-center px-3 py-2.5 rounded-lg
    text-gray-700 hover:bg-gray-100/50 transition-colors
    ${isActive ? 'active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Home
                    className={`h-5 w-5 flex-shrink-0 ${isActive ? '' : 'text-gray-400'}`}
                    style={isActive && branding?.primary_color ? { color: branding.primary_color } : undefined}
                  />
                  {!sidebarCollapsed && <span className="ml-3">Dashboard</span>}
                </>
              )}
            </NavLink>

            <NavLink
              to="/leads"
              className={({ isActive }) =>
                `nav-item-indicator relative flex items-center px-3 py-2.5 rounded-lg
    text-gray-700 hover:bg-gray-100/50 transition-colors
    ${isActive ? 'active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Users
                    className={`h-5 w-5 flex-shrink-0 ${isActive ? '' : 'text-gray-400'}`}
                    style={isActive && branding?.primary_color ? { color: branding.primary_color } : undefined}
                  />
                  {!sidebarCollapsed && <span className="ml-3">Leads</span>}
                </>
              )}
            </NavLink>

            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `nav-item-indicator relative flex items-center px-3 py-2.5 rounded-lg
    text-gray-700 hover:bg-gray-100/50 transition-colors
    ${isActive ? 'active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <TrendingUp
                    className={`h-5 w-5 flex-shrink-0 ${isActive ? '' : 'text-gray-400'}`}
                    style={isActive && branding?.primary_color ? { color: branding.primary_color } : undefined}
                  />
                  {!sidebarCollapsed && <span className="ml-3">Analytics</span>}
                </>
              )}
            </NavLink>

            {features.lead_scoring !== false && (
              <NavLink
                to="/scoring"
                className={({ isActive }) =>
                  `nav-item-indicator relative flex items-center px-3 py-2.5 rounded-lg
    text-gray-700 hover:bg-gray-100/50 transition-colors
    ${isActive ? 'active' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Brain
                      className={`h-5 w-5 flex-shrink-0 ${isActive ? '' : 'text-gray-400'}`}
                      style={isActive && branding?.primary_color ? { color: branding.primary_color } : undefined}
                    />
                    {!sidebarCollapsed && <span className="ml-3">AI Scoring</span>}
                  </>
                )}
              </NavLink>
            )}

            {features.chatbots !== false && (
              <NavLink
                to="/chatbots"
                className={({ isActive }) =>
                  `nav-item-indicator relative flex items-center px-3 py-2.5 rounded-lg
    text-gray-700 hover:bg-gray-100/50 transition-colors
    ${isActive ? 'active' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <MessageSquare
                      className={`h-5 w-5 flex-shrink-0 ${isActive ? '' : 'text-gray-400'}`}
                      style={isActive && branding?.primary_color ? { color: branding.primary_color } : undefined}
                    />
                    {!sidebarCollapsed && <span className="ml-3">Chat AGNT</span>}
                  </>
                )}
              </NavLink>
            )}

            {isSystemAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `nav-item-indicator relative flex items-center px-3 py-2.5 rounded-lg
    text-gray-700 hover:bg-gray-100/50 transition-colors
    ${isActive ? 'active' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Shield
                      className={`h-5 w-5 flex-shrink-0 ${isActive ? '' : 'text-gray-400'}`}
                      style={isActive && branding?.primary_color ? { color: branding.primary_color } : undefined}
                    />
                    {!sidebarCollapsed && <span className="ml-3">Admin</span>}
                  </>
                )}
              </NavLink>
            )}
          </nav>

          {/* User Section at Bottom */}
          <div className="border-t border-gray-200/50 p-4 mt-auto">
            {!sidebarCollapsed && (
              <div className="mb-3">
                <p className="text-xs text-gray-500">Signed in as</p>
                <p className="text-sm font-medium text-gray-700 truncate">{userEmail}</p>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-colors`}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="ml-2">Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Wrapper */}
        <main className={`flex-1 sidebar-transition ${!sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'}`}>
          {/* Mobile top bar here */}
          <div className="lg:hidden bg-white/90 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <button onClick={toggleMobileSidebar} className="text-gray-600 hover:text-gray-900">
              {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center space-x-2">
              {/* Mini logo for mobile */}
              {logoUrl ? (
                <img src={logoUrl} alt={orgName} className="h-6 w-auto" />
              ) : (
                <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xs">
                    {orgName ? orgName[0].toUpperCase() : 'A'}
                  </span>
                </div>
              )}
            </div>
            <div className="w-8" />
          </div>

          {/* Impersonation Banner (if needed) */}
          {isImpersonating && (
            <div className="bg-yellow-50 border-b border-yellow-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-700">
                      You are currently viewing as: <strong>{impersonatedOrgName || orgName}</strong>
                    </p>
                  </div>
                  <button
                    onClick={handleReturnToAdmin}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Return to Admin
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page content */}
          <div className="relative z-[1]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

