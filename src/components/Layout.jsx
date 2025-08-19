// Layout.jsx - Fixed without hard refresh
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { Menu, X, ArrowLeft, AlertCircle } from 'lucide-react';
import BackgroundDecoration from './BackgroundDecoration';

export default function Layout() {
  const navigate = useNavigate();
  const { organization, branding, userRole, isImpersonating, features, refreshOrganization } = useOrganization();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
      {/* Show Return to Admin banner if impersonating */}
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

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-white/80 relative z-10" style={{
        borderBottomColor: branding?.primary_color ? `${branding.primary_color}20` : undefined
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={orgName} 
                    className="h-8 w-auto"
                  />
                ) : (
                  <h1 className="text-xl font-bold" style={{ 
                    color: branding?.primary_color 
                  }}>
                    {orgName}
                  </h1>
                )}
              </div>

              {/* Desktop Navigation Links */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-orange-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                  style={({ isActive }) => 
                    isActive && branding?.primary_color 
                      ? { borderBottomColor: branding.primary_color, color: branding.primary_color }
                      : undefined
                  }
                >
                  Dashboard
                </NavLink>
                
                <NavLink
                  to="/leads"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-orange-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                  style={({ isActive }) => 
                    isActive && branding?.primary_color 
                      ? { borderBottomColor: branding.primary_color, color: branding.primary_color }
                      : undefined
                  }
                >
                  Leads
                </NavLink>

                <NavLink
                  to="/analytics"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-orange-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive && branding?.primary_color
                      ? { borderBottomColor: branding.primary_color, color: branding.primary_color }
                      : undefined
                  }
                >
                  Analytics
                </NavLink>

                {features.lead_scoring !== false && (
                  <NavLink
                    to="/scoring"
                    className={({ isActive }) =>
                      `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-orange-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`
                    }
                    style={({ isActive }) =>
                      isActive && branding?.primary_color
                        ? { borderBottomColor: branding.primary_color, color: branding.primary_color }
                        : undefined
                    }
                  >
                    AI Scoring
                  </NavLink>
                )}

                {features.chatbots !== false && (
                  <NavLink
                    to="/chatbots"
                    className={({ isActive }) =>
                      `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-orange-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`
                    }
                    style={({ isActive }) => 
                      isActive && branding?.primary_color 
                        ? { borderBottomColor: branding.primary_color, color: branding.primary_color }
                        : undefined
                    }
                  >
                    Chatbots
                  </NavLink>
                )}

                {/* Show Admin link for system admins */}
                {isSystemAdmin && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-orange-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`
                    }
                  >
                    Admin
                  </NavLink>
                )}
              </div>
            </div>

            {/* Right side - User menu */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                style={{ 
                  color: branding?.primary_color,
                  borderColor: branding?.primary_color 
                }}
              >
                Sign Out
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? 'bg-orange-50 border-orange-500 text-orange-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </NavLink>
              
              <NavLink
                to="/leads"
                className={({ isActive }) =>
                  `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? 'bg-orange-50 border-orange-500 text-orange-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Leads
              </NavLink>

              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? 'bg-orange-50 border-orange-500 text-orange-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Analytics
              </NavLink>

              {features.lead_scoring !== false && (
                <NavLink
                  to="/scoring"
                  className={({ isActive }) =>
                    `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isActive
                        ? 'bg-orange-50 border-orange-500 text-orange-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  AI Scoring
                </NavLink>
              )}

              {features.chatbots !== false && (
                <NavLink
                  to="/chatbots"
                  className={({ isActive }) =>
                    `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isActive
                        ? 'bg-orange-50 border-orange-500 text-orange-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Chatbots
                </NavLink>
              )}

              {isSystemAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isActive
                        ? 'bg-orange-50 border-orange-500 text-orange-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </NavLink>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
