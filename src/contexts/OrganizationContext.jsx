// OrganizationContext.jsx - Final fix with proper refresh handling
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import * as logger from '../lib/logger';

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
      
      logger.info('Checking impersonation:', { tempOrgId, originalUserId, adminImpersonating, currentUserId: user.id });
      
      // Clear state first if not impersonating
      if (!tempOrgId || !adminImpersonating) {
        setIsImpersonating(false);
      }
      
      // If admin is impersonating, load the impersonated organization
      if (tempOrgId && originalUserId === user.id && adminImpersonating) {
        logger.info('Loading impersonated organization:', tempOrgId);
        setIsImpersonating(true);
        
        // Get the impersonated organization with ALL related data
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', tempOrgId)
          .single();

        if (orgError || !orgData) {
          logger.error('Failed to load impersonated org:', orgError);
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

        logger.info('Impersonated org loaded:', orgData.name);
        setOrganization(orgData);
        setBranding(brandingData || {
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          accent_color: '#F59E0B',
          logo_url: null,
          custom_css: null
        });
        setFeatures(featuresMap);
        
        // Keep the original admin role when impersonating
        // The isImpersonating flag tells us we're viewing as a client
        // Verify the original user is actually an admin
        const { data: originalRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', originalUserId)
          .single();
        
        if (originalRole?.role === 'admin') {
          setUserRole('admin'); // Keep admin role when impersonating
          logger.info('Maintaining admin role during impersonation');
        } else {
          // Shouldn't happen, but handle gracefully
          setUserRole('client_admin');
          logger.warn('Original user is not admin, setting to client_admin');
        }
        
      } else {
        // Normal user flow - not impersonating
        logger.info('Loading normal user organization');
        setIsImpersonating(false);
        
        // Get user's role and organization
        const { data: userRoleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role, organization_id')
          .eq('user_id', user.id)
          .single();

        if (roleError) {
          logger.error('Error fetching user role:', roleError);
          setError('Failed to fetch user role');
          setLoading(false);
          return;
        }

        logger.info('User role data:', userRoleData);
        setUserRole(userRoleData?.role || 'user');

        // If user has an organization, load it
        if (userRoleData?.organization_id) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', userRoleData.organization_id)
            .single();

          if (orgError) {
            logger.error('Error fetching organization:', orgError);
            setError('Failed to fetch organization');
          } else {
            logger.info('Organization loaded:', orgData.name);
            setOrganization(orgData);

            // Fetch branding
            const { data: brandingData } = await supabase
              .from('client_branding')
              .select('*')
              .eq('organization_id', orgData.id)
              .single();

            setBranding(brandingData || {
              primary_color: '#3B82F6',
              secondary_color: '#10B981',
              accent_color: '#F59E0B',
              logo_url: null,
              custom_css: null
            });

            // Fetch features
            const { data: featuresData } = await supabase
              .from('client_features')
              .select('feature_name, is_enabled')
              .eq('organization_id', orgData.id);

            const featuresMap = {};
            if (featuresData) {
              featuresData.forEach(f => {
                featuresMap[f.feature_name] = f.is_enabled;
              });
            }
            setFeatures(featuresMap);
          }
        } else {
          // User without organization
          if (userRoleData?.role === 'admin') {
            // Admin users don't need an organization (they manage all)
            logger.info('Admin user without organization');
            setOrganization(null);
            setBranding({
              primary_color: '#3B82F6',
              secondary_color: '#10B981',
              accent_color: '#F59E0B',
              logo_url: null,
              custom_css: null
            });
            setFeatures({
              lead_scoring: true,
              chatbots: true,
              analytics: true
            });
          } else {
            // Non-admin without org - this is an error
            setError('No organization found for user');
            setLoading(false);
            return;
          }
        }
      }

    } catch (err) {
      logger.error('Error fetching organization:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUserOrganization();
  }, []);

  // Watch for navigation changes and impersonation
  useEffect(() => {
    const tempOrgId = localStorage.getItem('temp_organization_id');
    const adminImpersonating = localStorage.getItem('admin_impersonating');
    
    // If we're navigating FROM /admin TO / with impersonation data, reload
    if (location.pathname === '/' && tempOrgId && adminImpersonating && !isImpersonating) {
      logger.info('Detected impersonation start, refreshing context...');
      fetchUserOrganization();
    }
    
    // If we're on /admin and there's no impersonation data, refresh
    if (location.pathname === '/admin') {
      if (!tempOrgId && !adminImpersonating && isImpersonating) {
        // We were impersonating but now the data is cleared
        logger.info('Detected return to admin, refreshing context...');
        fetchUserOrganization();
      }
    }
  }, [location.pathname]);

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

  const refreshOrganization = useCallback(() => {
    return fetchUserOrganization();
  }, [fetchUserOrganization]);

  const value = {
    organization,
    branding,
    features,
    userRole,
    loading,
    error,
    isImpersonating,
    hasRole,
    refreshOrganization
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
