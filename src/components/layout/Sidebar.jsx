import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  Home,
  Users,
  TrendingUp,
  Brain,
  MessageSquare,
  Shield,
  LogOut,
} from 'lucide-react';

export default function Sidebar({
  sidebarCollapsed,
  mobileSidebarOpen,
  toggleSidebar,
  closeMobileSidebar,
  handleSignOut,
  isSystemAdmin,
  features,
  branding,
  userEmail,
  logoUrl,
  orgName,
}) {
  return (
    <>
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

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
        <div className="p-4 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center ${
                sidebarCollapsed ? 'justify-center' : 'space-x-3'
              } overflow-hidden`}
            >
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
              {!sidebarCollapsed && (
                <div>
                  <h2 className="text-gray-900 font-bold text-sm">{orgName}</h2>
                </div>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className="hidden lg:block text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

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
                  style={
                    isActive && branding?.primary_color
                      ? { color: branding.primary_color }
                      : undefined
                  }
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
                  style={
                    isActive && branding?.primary_color
                      ? { color: branding.primary_color }
                      : undefined
                  }
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
                  style={
                    isActive && branding?.primary_color
                      ? { color: branding.primary_color }
                      : undefined
                  }
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
                    style={
                      isActive && branding?.primary_color
                        ? { color: branding.primary_color }
                        : undefined
                    }
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
                    style={
                      isActive && branding?.primary_color
                        ? { color: branding.primary_color }
                        : undefined
                    }
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
                    style={
                      isActive && branding?.primary_color
                        ? { color: branding.primary_color }
                        : undefined
                    }
                  />
                  {!sidebarCollapsed && <span className="ml-3">Admin</span>}
                </>
              )}
            </NavLink>
          )}
        </nav>

        <div className="border-t border-gray-200/50 p-4 mt-auto">
          {!sidebarCollapsed && (
            <div className="mb-3">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm font-medium text-gray-700 truncate">{userEmail}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center ${
              sidebarCollapsed ? 'justify-center' : ''
            } px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-colors`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-2">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

