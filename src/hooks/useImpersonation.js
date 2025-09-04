import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '../contexts/OrganizationContext';

export default function useImpersonation() {
  const navigate = useNavigate();
  const { refreshOrganization } = useOrganization();

  const handleReturnToAdmin = useCallback(async () => {
    console.log('Returning to admin...');

    localStorage.removeItem('admin_impersonating');
    localStorage.removeItem('admin_original_user');
    localStorage.removeItem('temp_organization_id');
    localStorage.removeItem('impersonated_org_name');
    localStorage.removeItem('admin_return_url');

    await refreshOrganization();
    navigate('/admin');
  }, [navigate, refreshOrganization]);

  return { handleReturnToAdmin };
}

