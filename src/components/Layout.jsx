import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { Menu, X } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const { organization, branding } = useOrganization();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo/Organization Name Section */}
              <div className="flex-shrink-0 flex items-center">
                {branding?.logo_url ? (
                  <>
                    <img 
                      className="h-8 w-auto"
                      src={branding.logo_url}
                      alt={organization?.name || 'Logo'}
                      onError={(e) => {
                        // Hide image and show text fallback if image fails
                        e.target.style.display = 'none';
                        const textFallback = e.target.nextElementSibling;
                        if (textFallback) {
                          textFallback.style.display = 'block';
                        }
                      }}
                    />
                    <span 
                      className="text-xl font-bold hidden"
                      style={{ 
                        color: branding?.primary_color || '#3B82F6' 
                      }}
                    >
                      {organization?.name || 'Lead Platform'}
                    </span>
                  </>
                ) : (
                  <span 
                    className="text-xl font-bold"
                    style={{ 
                      color: branding?.primary_color || '#3B82F6' 
                    }}
                  >
                    {organization?.name || 'Lead Platform'}
                  </span>
                )}
              </div>

              {/* Desktop Navigation Links */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink 
                  to="/" 
                  end
                  className={({ isActive }) =>
                    isActive
                      ? 'border-b-2 border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 text-sm font-medium'
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink 
                  to="/leads"
                  className={({ isActive }) =>
                    isActive
                      ? 'border-b-2 border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 text-sm font-medium'
                  }
                >
                  Leads
                </NavLink>
                <NavLink 
                  to="/analytics"
                  className={({ isActive }) =>
                    isActive
                      ? 'border-b-2 border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 text-sm font-medium'
                  }
                >
                  Analytics
                </NavLink>
                <NavLink 
                  to="/chatbots"
                  className={({ isActive }) =>
                    isActive
                      ? 'border-b-2 border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 text-sm font-medium'
                  }
                >
                  Chatbots
                </NavLink>
                <NavLink 
                  to="/scoring"
                  className={({ isActive }) =>
                    isActive
                      ? 'border-b-2 border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 text-sm font-medium'
                  }
                >
                  Scoring
                </NavLink>
              </div>
            </div>

            {/* Right side - Sign Out button */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button
                onClick={handleSignOut}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
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
                end
                className={({ isActive }) =>
                  isActive
                    ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 block pl-3 pr-4 py-2 text-base font-medium'
                    : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 text-base font-medium'
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/leads"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 block pl-3 pr-4 py-2 text-base font-medium'
                    : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 text-base font-medium'
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Leads
              </NavLink>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 block pl-3 pr-4 py-2 text-base font-medium'
                    : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 text-base font-medium'
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Analytics
              </NavLink>
              <NavLink
                to="/chatbots"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 block pl-3 pr-4 py-2 text-base font-medium'
                    : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 text-base font-medium'
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Chatbots
              </NavLink>
              <NavLink
                to="/scoring"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 block pl-3 pr-4 py-2 text-base font-medium'
                    : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 text-base font-medium'
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Scoring
              </NavLink>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 w-full text-left"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
