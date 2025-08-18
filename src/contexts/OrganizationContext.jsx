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
  const [isImpersonating, setIsImpersonating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserOrganization();
  }, []);

  const fetchUserOrganization = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if admin is impersonating
      const tempOrgId = localStorage.getItem('temp_organization_id');
      const originalUserId = localStorage.getItem('admin_original_user');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setError('No authenticated user');
        setLoading(false);
        return;
      }

      // If admin is impersonating, load the impersonated organization
      if (tempOrgId && originalUserId === user.id) {
        setIsImpersonating(true);
        
        // Get the impersonated organization directly
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', tempOrgId)
          .single();

        if (orgError || !orgData) {
          // Clear impersonation if org not found
          localStorage.removeItem('temp_organization_id');
          localStorage.removeItem('admin_impersonating');
          localStorage.removeItem('impersonated_org_name');
          setError('Impersonated organization not found');
          setLoading(false);
          return;
        }

        // Get branding for impersonated org
        const { data: brandingData } = await supabase
          .from('client_branding')
          .select('*')
          .eq('organization_id', tempOrgId)
          .single();

        // Get features for impersonated org
        const { data: featuresData } = await supabase
          .from('client_features')
          .select('feature_name, is_enabled')
          .eq('organization_id', tempOrgId);

        // Process features
        const featuresMap = {};
        featuresData?.forEach(f => {
          featuresMap[f.feature_name] = f.is_enabled;
        });

        setOrganization(orgData);
        setBranding(brandingData || {
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          accent_color: '#F59E0B',
          logo_url: null,
          custom_css: null
        });
        setFeatures(featuresMap);
        setUserRole('impersonating'); // Special role for impersonation
        
      } else {
        // Normal flow - get user's actual organization
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
          setError('No organization found. Please contact your administrator.');
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
      }

    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for role-based access
  const hasRole = (requiredRole) => {
    // If impersonating, treat as client admin
    if (userRole === 'impersonating') {
      const roleHierarchy = {
        'user': 1,
        'manager': 2,
        'admin': 3,
        'owner': 4
      };
      const requiredLevel = roleHierarchy[requiredRole] || 0;
      // Impersonation acts as client admin (level 3)
      return 3 >= requiredLevel;
    }

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
    isImpersonating,
    refreshOrganization: fetchUserOrganization,
    hasRole,
    // Convenience methods
    isOwner: userRole === 'owner',
    isAdmin: userRole === 'admin' || userRole === 'owner',
    isManager: userRole === 'manager' || userRole === 'admin' || userRole === 'owner',
    canManageUsers: userRole === 'admin' || userRole === 'owner',
    canManageSettings: userRole === 'admin' || userRole === 'owner',
    canViewAnalytics: true,
    canManageLeads: userRole !== 'user'
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
