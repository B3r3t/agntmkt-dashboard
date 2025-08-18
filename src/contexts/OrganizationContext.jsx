// OrganizationContext.jsx - Final fix with proper refresh handling
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const location = useLocation();

  const fetchUserOrganization = useCallback(async () => {
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

      // Check if admin is impersonating
      const tempOrgId = localStorage.getItem('temp_organization_id');
      const originalUserId = localStorage.getItem('admin_original_user');
      const adminImpersonating = localStorage.getItem('admin_impersonating');
      
      // Clear state first if not impersonating
      if (!tempOrgId || !adminImpersonating) {
        setIsImpersonating(false);
      }
      
      // If admin is impersonating, load the impersonated organization
      if (tempOrgId && originalUserId === user.id && adminImpersonating) {
        console.log('Loading impersonated organization:', tempOrgId);
        setIsImpersonating(true);
        
        // Get the impersonated organization with ALL related data
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', tempOrgId)
          .single();

        if (orgError || !orgData) {
          console.error('Failed to load impersonated org:', orgError);
          // Clear impersonation if org not found
          localStorage.removeItem('temp_organization_id');
          localStorage.removeItem('admin_impersonating');
          localStorage.removeItem('impersonated_org_name');
          localStorage.removeItem('admin_original_user');
          setError('Impersonated organization not found');
          setIsImpersonating(false);
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

        // Process features into an object
        const featuresMap = {};
        if (featuresData) {
          featuresData.forEach(f => {
            featuresMap[f.feature_name] = f.is_enabled;
          });
        }

        console.log('Impersonated org loaded:', orgData.name);
        setOrganization(orgData);
        setBranding(brandingData || {
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          accent_color: '#F59E0B',
          logo_url: null,
          custom_css: null
        });
        setFeatures(featuresMap);
        setUserRole('client_admin'); // Set as client admin when impersonating
        
      } else {
        // Normal user flow - not impersonating
        console.log('Loading normal user organization');
        setIsImpersonating(false);
        
        // Get user's role and organization
        const { data: userRoleData } = await supabase
          .from('user_roles')
          .select(`
            role,
            organization:organizations(*)
          `)
          .eq('user_id', user.id)
          .single();

        if (!userRoleData || !userRoleData.organization) {
          setError('No organization found for user');
          setLoading(false);
          return;
        }

        // Set the user's actual role
        setUserRole(userRoleData.role);
        setOrganization(userRoleData.organization);

        // Get organization branding
        const { data: brandingData } = await supabase
          .from('client_branding')
          .select('*')
          .eq('organization_id', userRoleData.organization.id)
          .single();

        // Get organization features
        const { data: featuresData } = await supabase
          .from('client_features')
          .select('feature_name, is_enabled')
          .eq('organization_id', userRoleData.organization.id);

        // Process features into an object
        const featuresMap = {};
        if (featuresData) {
          featuresData.forEach(f => {
            featuresMap[f.feature_name] = f.is_enabled;
          });
        }

        setBranding(brandingData || {
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          accent_color: '#F59E0B',
          logo_url: null,
          custom_css: null
        });
        setFeatures(featuresMap);
        
        console.log('User organization loaded:', userRoleData.organization.name, 'Role:', userRoleData.role);
      }

    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUserOrganization();
  }, []);

  // Watch for navigation to /admin specifically
  useEffect(() => {
    // If we're on /admin and there's no impersonation data, refresh
    if (location.pathname === '/admin') {
      const tempOrgId = localStorage.getItem('temp_organization_id');
      const adminImpersonating = localStorage.getItem('admin_impersonating');
      
      if (!tempOrgId && !adminImpersonating && isImpersonating) {
        // We were impersonating but now the data is cleared
        console.log('Detected return to admin, refreshing context...');
        fetchUserOrganization();
      }
    }
  }, [location.pathname, isImpersonating]);

  // Helper functions for role-based access
  const hasRole = (requiredRole) => {
    const roleHierarchy = {
      'user': 1,
      'manager': 2,
      'client_admin': 3,
      'admin': 4, // System admin
      'owner': 5
    };
    
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  // Apply custom CSS from branding
  useEffect(() => {
    if (branding?.custom_css) {
      // Remove any existing custom styles
      const existingStyle = document.getElementById('client-custom-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      // Add new custom styles
      const styleElement = document.createElement('style');
      styleElement.id = 'client-custom-styles';
      styleElement.textContent = branding.custom_css;
      document.head.appendChild(styleElement);

      // Cleanup on unmount
      return () => {
        const el = document.getElementById('client-custom-styles');
        if (el) el.remove();
      };
    }
  }, [branding]);

  // Apply brand colors as CSS variables
  useEffect(() => {
    if (branding) {
      const root = document.documentElement;
      if (branding.primary_color) {
        root.style.setProperty('--brand-primary', branding.primary_color);
      }
      if (branding.secondary_color) {
        root.style.setProperty('--brand-secondary', branding.secondary_color);
      }
      if (branding.accent_color) {
        root.style.setProperty('--brand-accent', branding.accent_color);
      }
    }
  }, [branding]);

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
    isAdmin: userRole === 'admin',
    isClientAdmin: userRole === 'client_admin' || userRole === 'admin' || userRole === 'owner',
    isManager: userRole === 'manager' || userRole === 'client_admin' || userRole === 'admin' || userRole === 'owner',
    canManageUsers: userRole === 'client_admin' || userRole === 'admin' || userRole === 'owner',
    canManageSettings: userRole === 'client_admin' || userRole === 'admin' || userRole === 'owner',
    canViewAnalytics: true,
    canManageLeads: userRole !== 'user'
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export default OrganizationProvider;
