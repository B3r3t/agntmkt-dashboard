import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

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
  const [branding, setBranding] = useState(null);
  const [features, setFeatures] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
        setError('No authenticated user');
        setLoading(false);
        return;
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
        // Use setTimeout to avoid navigation issues during context initialization
        setTimeout(() => {
          navigate('/no-organization');
        }, 100);
        setLoading(false);
        return;
      }

      // Get organization branding
      const { data: brandingData } = await supabase
        .from('client_branding')
        .select('*')
        .eq('organization_id', userOrg.organization.id)
        .single();

      // Get organization features
      const { data: featuresData } = await supabase
        .from('client_features')
        .select('feature_name, is_enabled')
        .eq('organization_id', userOrg.organization.id);

      // Process features into an object
      const featuresMap = {};
      featuresData?.forEach(f => {
        featuresMap[f.feature_name] = f.is_enabled;
      });

      // Set the complete organization context
      setOrganization(userOrg.organization);
      setBranding(brandingData || {
        primary_color: '#3B82F6',
        secondary_color: '#10B981',
        accent_color: '#F59E0B',
        logo_url: null,
        custom_css: null
      });
      setFeatures(featuresMap);
      setUserRole(userOrg.role);

    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for role-based access
  const hasRole = (requiredRole) => {
    const roleHierarchy = {
      'user': 1,
      'manager': 2,
      'admin': 3,
      'owner': 4
    };
    
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  const value = {
    organization,
    branding,
    features,
    userRole,
    loading,
    error,
    refreshOrganization: fetchUserOrganization,
    hasRole,
    // Convenience methods
    isOwner: userRole === 'owner',
    isAdmin: userRole === 'admin' || userRole === 'owner',
    isManager: userRole === 'manager' || userRole === 'admin' || userRole === 'owner',
    canManageUsers: userRole === 'admin' || userRole === 'owner',
    canManageSettings: userRole === 'admin' || userRole === 'owner',
    canViewAnalytics: true, // All users can view analytics
    canManageLeads: userRole !== 'user' // Everyone except basic users
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
