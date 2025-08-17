import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const OrganizationContext = createContext({});

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}

export function OrganizationProvider({ children }) {
  const [organization, setOrganization] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserOrganization();
  }, []);

  const fetchUserOrganization = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('No authenticated user');
      }

      // Get user's organization and role
      const { data: userOrg, error: orgError } = await supabase
        .from('user_organizations')
        .select(`
          role,
          organization:organizations!inner(
            id,
            name,
            industry,
            website,
            status,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (orgError || !userOrg) {
        // User might not be assigned to any organization yet
        setError('No organization found. Please contact your administrator.');
        return;
      }

      // Get organization branding
      const { data: branding } = await supabase
        .from('client_branding')
        .select('*')
        .eq('organization_id', userOrg.organization.id)
        .single();

      // Get organization features
      const { data: features } = await supabase
        .from('client_features')
        .select('feature_name, is_enabled')
        .eq('organization_id', userOrg.organization.id);

      // Process features into an object
      const featuresMap = {};
      features?.forEach(f => {
        featuresMap[f.feature_name] = f.is_enabled;
      });

      // Set the complete organization context
      setOrganization({
        ...userOrg.organization,
        branding: branding || {
          primary_color: '#3d3b3a',
          secondary_color: '#737373',
          accent_color: '#ff7f30'
        },
        features: featuresMap
      });
      setUserRole(userOrg.role);

    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh organization data
  const refreshOrganization = async () => {
    await fetchUserOrganization();
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    const permissions = {
      owner: ['all'],
      admin: ['manage_users', 'manage_settings', 'view_all_data'],
      manager: ['manage_leads', 'view_reports'],
      user: ['view_own_data']
    };

    return permissions[userRole]?.includes('all') || 
           permissions[userRole]?.includes(permission);
  };

  const value = {
    organization,
    userRole,
    loading,
    error,
    refreshOrganization,
    hasPermission,
    isOwner: userRole === 'owner',
    isAdmin: userRole === 'admin' || userRole === 'owner',
    isManager: userRole === 'manager' || userRole === 'admin' || userRole === 'owner'
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
