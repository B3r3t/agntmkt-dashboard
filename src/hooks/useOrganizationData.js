import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import logger from '../lib/logger';

export default function useOrganizationData() {
  const [organization, setOrganization] = useState(null);
  const [branding, setBranding] = useState(null);
  const [features, setFeatures] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const location = useLocation();

  const fetchUserOrganization = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('No authenticated user');
        setLoading(false);
        return;
      }

      const tempOrgId = localStorage.getItem('temp_organization_id');
      const originalUserId = localStorage.getItem('admin_original_user');
      const adminImpersonating = localStorage.getItem('admin_impersonating');

      logger.log('Checking impersonation:', { tempOrgId, originalUserId, adminImpersonating, currentUserId: user.id });

      if (!tempOrgId || !adminImpersonating) {
        setIsImpersonating(false);
      }

      if (tempOrgId && originalUserId === user.id && adminImpersonating) {
        logger.log('Loading impersonated organization:', tempOrgId);
        setIsImpersonating(true);

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', tempOrgId)
          .single();

        if (orgError || !orgData) {
          logger.error('Failed to load impersonated org:', orgError);
          localStorage.removeItem('temp_organization_id');
          localStorage.removeItem('admin_impersonating');
          localStorage.removeItem('impersonated_org_name');
          localStorage.removeItem('admin_original_user');
          setError('Impersonated organization not found');
          setIsImpersonating(false);
          setLoading(false);
          return;
        }

        const { data: brandingData } = await supabase
          .from('client_branding')
          .select('*')
          .eq('organization_id', tempOrgId)
          .single();

        const { data: featuresData } = await supabase
          .from('client_features')
          .select('feature_name, is_enabled')
          .eq('organization_id', tempOrgId);

        const featuresMap = {};
        if (featuresData) {
          featuresData.forEach(f => {
            featuresMap[f.feature_name] = f.is_enabled;
          });
        }

        logger.log('Impersonated org loaded:', orgData.name);
        setOrganization(orgData);
        setBranding(brandingData || {
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          accent_color: '#F59E0B',
          logo_url: null,
          custom_css: null
        });
        setFeatures(featuresMap);

        const { data: originalRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', originalUserId)
          .single();

        if (originalRole?.role === 'admin') {
          setUserRole('admin');
          logger.log('Maintaining admin role during impersonation');
        } else {
          setUserRole('client_admin');
          logger.warn('Original user is not admin, setting to client_admin');
        }
      } else {
        logger.log('Loading normal user organization');
        setIsImpersonating(false);

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

        logger.log('User role data:', userRoleData);
        setUserRole(userRoleData?.role || 'user');

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
            logger.log('Organization loaded:', orgData.name);
            setOrganization(orgData);

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
          if (userRoleData?.role === 'admin') {
            logger.log('Admin user without organization');
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

  useEffect(() => {
    fetchUserOrganization();
  }, [fetchUserOrganization]);

  useEffect(() => {
    const tempOrgId = localStorage.getItem('temp_organization_id');
    const adminImpersonating = localStorage.getItem('admin_impersonating');

    if (location.pathname === '/' && tempOrgId && adminImpersonating && !isImpersonating) {
      logger.log('Detected impersonation start, refreshing context...');
      fetchUserOrganization();
    }

    if (location.pathname === '/admin') {
      if (!tempOrgId && !adminImpersonating && isImpersonating) {
        logger.log('Detected return to admin, refreshing context...');
        fetchUserOrganization();
      }
    }
  }, [location.pathname, fetchUserOrganization, isImpersonating]);

  const hasRole = (requiredRole) => {
    const roleHierarchy = {
      'user': 1,
      'manager': 2,
      'client_admin': 3,
      'admin': 4,
      'owner': 5
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  };

  const refreshOrganization = useCallback(() => {
    return fetchUserOrganization();
  }, [fetchUserOrganization]);

  return {
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
}
