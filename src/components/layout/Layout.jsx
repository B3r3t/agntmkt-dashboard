import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import BackgroundDecoration from '../BackgroundDecoration';
import Sidebar from './Sidebar';
import Header from './Header';
import useImpersonation from '../../hooks/useImpersonation';

export default function Layout() {
  const navigate = useNavigate();
  const { organization, branding, userRole, isImpersonating, features } = useOrganization();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || '');
    });
  }, []);

  const isSystemAdmin = userRole === 'admin' && !isImpersonating;

  const handleSignOut = async () => {
    localStorage.removeItem('admin_impersonating');
    localStorage.removeItem('admin_original_user');
    localStorage.removeItem('temp_organization_id');
    localStorage.removeItem('impersonated_org_name');
    localStorage.removeItem('admin_return_url');

    await supabase.auth.signOut();
    navigate('/');
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const { handleReturnToAdmin } = useImpersonation();

  const logoUrl = branding?.logo_url;
  const orgName = organization?.name || 'Dashboard';
  const impersonatedOrgName = localStorage.getItem('impersonated_org_name');

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <BackgroundDecoration />
      <div className="min-h-screen flex relative">
        <Sidebar
          sidebarCollapsed={sidebarCollapsed}
          mobileSidebarOpen={mobileSidebarOpen}
          toggleSidebar={toggleSidebar}
          closeMobileSidebar={closeMobileSidebar}
          handleSignOut={handleSignOut}
          isSystemAdmin={isSystemAdmin}
          features={features}
          branding={branding}
          userEmail={userEmail}
          logoUrl={logoUrl}
          orgName={orgName}
        />
        <main className={`flex-1 sidebar-transition ${!sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'}`}>
          <Header
            mobileSidebarOpen={mobileSidebarOpen}
            toggleMobileSidebar={toggleMobileSidebar}
            logoUrl={logoUrl}
            orgName={orgName}
            isImpersonating={isImpersonating}
            impersonatedOrgName={impersonatedOrgName}
            handleReturnToAdmin={handleReturnToAdmin}
          />
          <div className="relative z-[1]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

