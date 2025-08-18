import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  Users,
  Settings,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Shield,
  Palette,
  ToggleLeft,
  ToggleRight,
  Activity,
  Calendar,
  TrendingUp,
  FileText,
  Zap,
  LogIn,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  Pause,
  Play,
  UserX,
  Mail,
  ArrowLeft
} from 'lucide-react';
import StatusMessage from './StatusMessage';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrgs, setSelectedOrgs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedOrgForEdit, setSelectedOrgForEdit] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isImpersonating, setIsImpersonating] = useState(false);
  const bulkActionsRef = useRef(null);
  const navigate = useNavigate();

  // Check if currently impersonating
  useEffect(() => {
    const impersonatingOrg = localStorage.getItem('admin_impersonating');
    const originalUserId = localStorage.getItem('admin_original_user');
    if (impersonatingOrg && originalUserId) {
      setIsImpersonating(true);
    }
  }, []);

  // Click outside handler for bulk actions dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (bulkActionsRef.current && !bulkActionsRef.current.contains(event.target)) {
        setShowBulkActions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => setStatus({ type: '', message: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching organizations as admin...');
      
      // Test admin status first
      const { data: adminTest } = await supabase.rpc('is_admin');
      console.log('✅ Admin status:', adminTest);
      
      if (!adminTest) {
        setStatus({ 
          type: 'error', 
          message: 'Access denied. Admin privileges required.' 
        });
        setLoading(false);
        return;
      }

      // Fetch ALL organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      if (!orgsData || orgsData.length === 0) {
        setStatus({ 
          type: 'warning', 
          message: 'No organizations found.' 
        });
        setOrganizations([]);
        return;
      }

      // Get additional data for each organization
      const orgsWithCounts = await Promise.all(
        orgsData.map(async (org) => {
          try {
            const [userCountResult, leadsCountResult, chatbotsCountResult, brandingResult] = await Promise.all([
              supabase.from('user_organizations').select('*', { count: 'exact' }).eq('organization_id', org.id),
              supabase.from('leads').select('*', { count: 'exact' }).eq('organization_id', org.id),
              supabase.from('chatbots').select('*', { count: 'exact' }).eq('organization_id', org.id),
              supabase.from('client_branding').select('*').eq('organization_id', org.id).single()
            ]);

            return {
              ...org,
              user_count: userCountResult.count || 0,
              leads_count: leadsCountResult.count || 0,
              chatbots_count: chatbotsCountResult.count || 0,
              last_activity: org.updated_at || org.created_at,
              features: {
                lead_scoring: true,
                chatbots: true,
                document_processing: true,
                custom_branding: true
              },
              branding: brandingResult.data || {
                primary_color: '#3d3b3a',
                secondary_color: '#737373',
                accent_color: '#ff7f30'
              },
              status: org.status || 'active'
            };
          } catch (error) {
            console.error(`Error fetching data for ${org.name}:`, error);
            return {
              ...org,
              user_count: 0,
              leads_count: 0,
              chatbots_count: 0,
              last_activity: org.created_at,
              features: {
                lead_scoring: true,
                chatbots: true,
                document_processing: true,
                custom_branding: true
              },
              branding: {
                primary_color: '#3d3b3a',
                secondary_color: '#737373',
                accent_color: '#ff7f30'
              },
              status: org.status || 'active'
            };
          }
        })
      );

      setOrganizations(orgsWithCounts);
      setStatus({ 
        type: 'success', 
        message: `Successfully loaded ${orgsWithCounts.length} organizations.` 
      });
      
    } catch (error) {
      console.error('💥 Error fetching organizations:', error);
      setStatus({ 
        type: 'error', 
        message: `Error: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (org.industry || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleBulkAction = async (action) => {
    if (selectedOrgs.length === 0) {
      setStatus({ type: 'warning', message: 'No organizations selected.' });
      return;
    }

    try {
      let updateData = {};
      let successMessage = '';

      switch(action) {
        case 'suspend':
          updateData = { status: 'suspended' };
          successMessage = `Suspended ${selectedOrgs.length} organization(s).`;
          break;
        case 'activate':
          updateData = { status: 'active' };
          successMessage = `Activated ${selectedOrgs.length} organization(s).`;
          break;
        case 'delete':
          if (!confirm(`Are you sure you want to delete ${selectedOrgs.length} organization(s)? This action cannot be undone.`)) {
            return;
          }
          const { error: deleteError } = await supabase
            .from('organizations')
            .delete()
            .in('id', selectedOrgs);
          if (deleteError) throw deleteError;
          successMessage = `Deleted ${selectedOrgs.length} organization(s).`;
          break;
        case 'email':
          // Open email modal or redirect to email service
          setStatus({ type: 'info', message: 'Email feature coming soon!' });
          return;
        default:
          return;
      }

      if (action !== 'delete') {
        const { error } = await supabase
          .from('organizations')
          .update(updateData)
          .in('id', selectedOrgs);
        
        if (error) throw error;
      }

      await fetchOrganizations();
      setSelectedOrgs([]);
      setShowBulkActions(false);
      setStatus({ type: 'success', message: successMessage });
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      setStatus({ type: 'error', message: `Error performing bulk ${action}.` });
    }
  };

  const handleFeatureToggle = async (orgId, feature) => {
    try {
      const { data: existingFeature } = await supabase
        .from('client_features')
        .select('*')
        .eq('organization_id', orgId)
        .eq('feature_name', feature)
        .single();

      if (existingFeature) {
        const { error } = await supabase
          .from('client_features')
          .update({ is_enabled: !existingFeature.is_enabled })
          .eq('organization_id', orgId)
          .eq('feature_name', feature);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_features')
          .insert({
            organization_id: orgId,
            feature_name: feature,
            is_enabled: true
          });
        
        if (error) throw error;
      }

      await fetchOrganizations();
    } catch (error) {
      console.error('Error toggling feature:', error);
      setStatus({ type: 'error', message: 'Error updating feature.' });
    }
  };

  const handleImpersonate = async (org) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Store admin session info
      localStorage.setItem('admin_impersonating', org.id);
      localStorage.setItem('admin_original_user', user.id);
      localStorage.setItem('admin_return_url', window.location.pathname);
      localStorage.setItem('impersonated_org_name', org.name);
      
      // Set a temporary organization override
      localStorage.setItem('temp_organization_id', org.id);
      
      // Navigate to main dashboard
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error impersonating client:', error);
      setStatus({ type: 'error', message: 'Error switching to client view.' });
    }
  };

  const handleReturnToAdmin = () => {
    // Clear impersonation data
    localStorage.removeItem('admin_impersonating');
    localStorage.removeItem('admin_original_user');
    localStorage.removeItem('temp_organization_id');
    localStorage.removeItem('impersonated_org_name');
    
    // Return to admin dashboard
    const returnUrl = localStorage.getItem('admin_return_url') || '/admin';
    localStorage.removeItem('admin_return_url');
    
    window.location.href = returnUrl;
  };

  const FeatureToggle = ({ enabled, onToggle, feature, orgId }) => (
    <button
      onClick={() => onToggle(orgId, feature)}
      className={`inline-flex items-center ${enabled ? 'text-green-600' : 'text-gray-400'}`}
      title={`${enabled ? 'Disable' : 'Enable'} ${feature.replace('_', ' ')}`}
    >
      {enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
    </button>
  );

  const StatusBadge = ({ status }) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-yellow-100 text-yellow-800', 
      suspended: 'bg-red-100 text-red-800',
      churned: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.active}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Active'}
      </span>
    );
  };

  // Branding Modal
  const BrandingModal = () => {
    const [brandingData, setBrandingData] = useState({
      primary_color: selectedOrgForEdit?.branding?.primary_color || '#3B82F6',
      secondary_color: selectedOrgForEdit?.branding?.secondary_color || '#10B981',
      accent_color: selectedOrgForEdit?.branding?.accent_color || '#F59E0B',
      logo_url: selectedOrgForEdit?.branding?.logo_url || '',
      custom_css: selectedOrgForEdit?.branding?.custom_css || ''
    });
    const [saving, setSaving] = useState(false);

    if (!showBrandingModal || !selectedOrgForEdit) return null;

    const handleSave = async () => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('client_branding')
          .upsert({
            organization_id: selectedOrgForEdit.id,
            ...brandingData,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        setStatus({ type: 'success', message: 'Branding updated successfully!' });
        setShowBrandingModal(false);
        await fetchOrganizations();
      } catch (error) {
        setStatus({ type: 'error', message: 'Error updating branding.' });
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Edit Branding - {selectedOrgForEdit.name}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Logo URL</label>
              <input
                type="url"
                value={brandingData.logo_url}
                onChange={(e) => setBrandingData(prev => ({ ...prev, logo_url: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Color</label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="color"
                  value={brandingData.primary_color}
                  onChange={(e) => setBrandingData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="h-8 w-16"
                />
                <input
                  type="text"
                  value={brandingData.primary_color}
                  onChange={(e) => setBrandingData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="color"
                  value={brandingData.secondary_color}
                  onChange={(e) => setBrandingData(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="h-8 w-16"
                />
                <input
                  type="text"
                  value={brandingData.secondary_color}
                  onChange={(e) => setBrandingData(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Accent Color</label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="color"
                  value={brandingData.accent_color}
                  onChange={(e) => setBrandingData(prev => ({ ...prev, accent_color: e.target.value }))}
                  className="h-8 w-16"
                />
                <input
                  type="text"
                  value={brandingData.accent_color}
                  onChange={(e) => setBrandingData(prev => ({ ...prev, accent_color: e.target.value }))}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Custom CSS</label>
              <textarea
                value={brandingData.custom_css}
                onChange={(e) => setBrandingData(prev => ({ ...prev, custom_css: e.target.value }))}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                placeholder="/* Custom CSS styles */"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowBrandingModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Settings Modal
  const SettingsModal = () => {
    const [settingsData, setSettingsData] = useState({
      name: selectedOrgForEdit?.name || '',
      industry: selectedOrgForEdit?.industry || '',
      website: selectedOrgForEdit?.website || '',
      contact_name: selectedOrgForEdit?.contact_name || '',
      contact_email: selectedOrgForEdit?.contact_email || '',
      status: selectedOrgForEdit?.status || 'active'
    });
    const [saving, setSaving] = useState(false);

    if (!showSettingsModal || !selectedOrgForEdit) return null;

    const handleSave = async () => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('organizations')
          .update({
            ...settingsData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedOrgForEdit.id);

        if (error) throw error;

        setStatus({ type: 'success', message: 'Settings updated successfully!' });
        setShowSettingsModal(false);
        await fetchOrganizations();
      } catch (error) {
        setStatus({ type: 'error', message: 'Error updating settings.' });
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Edit Settings - {selectedOrgForEdit.name}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization Name</label>
              <input
                type="text"
                value={settingsData.name}
                onChange={(e) => setSettingsData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Industry</label>
              <input
                type="text"
                value={settingsData.industry}
                onChange={(e) => setSettingsData(prev => ({ ...prev, industry: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                value={settingsData.website}
                onChange={(e) => setSettingsData(prev => ({ ...prev, website: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Name</label>
              <input
                type="text"
                value={settingsData.contact_name}
                onChange={(e) => setSettingsData(prev => ({ ...prev, contact_name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Email</label>
              <input
                type="email"
                value={settingsData.contact_email}
                onChange={(e) => setSettingsData(prev => ({ ...prev, contact_email: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={settingsData.status}
                onChange={(e) => setSettingsData(prev => ({ ...prev, status: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="churned">Churned</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add Client Modal (same as before but updated)
  const AddClientModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      industry: '',
      contact_email: '',
      contact_name: '',
      website: ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert([formData])
          .select()
          .single();
        if (orgError) throw orgError;

        // Add yourself as admin of the new organization
        await supabase.from('user_organizations').insert({
          user_id: user.id,
          organization_id: org.id,
          role: 'admin'
        });

        // Create default branding
        await supabase.from('client_branding').insert({
          organization_id: org.id,
          primary_color: '#3B82F6',
          secondary_color: '#10B981', 
          accent_color: '#F59E0B'
        });

        // Initialize default features
        const defaultFeatures = [
          { feature_name: 'lead_scoring', is_enabled: true },
          { feature_name: 'chatbots', is_enabled: true },
          { feature_name: 'document_processing', is_enabled: true },
          { feature_name: 'custom_branding', is_enabled: true }
        ].map(f => ({ ...f, organization_id: org.id }));

        await supabase.from('client_features').insert(defaultFeatures);
        
        await fetchOrganizations();
        setShowAddModal(false);
        setFormData({ name: '', industry: '', contact_email: '', contact_name: '', website: '' });
        setStatus({ 
          type: 'success', 
          message: `Client "${org.name}" created successfully!` 
        });
        
      } catch (error) {
        console.error('Error creating organization:', error);
        setStatus({ 
          type: 'error', 
          message: `Error creating client: ${error.message}` 
        });
      } finally {
        setSaving(false);
      }
    };

    if (!showAddModal) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Client</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder="e.g., Burger King Franchise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder="e.g., Quick Service Restaurant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder="Primary contact person"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder="contact@client.com"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admin dashboard...</div>
      </div>
    );
  }

  // Show "Return to Admin" banner if impersonating
  if (isImpersonating) {
    const impersonatedOrgName = localStorage.getItem('impersonated_org_name');
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
              <p className="text-sm text-yellow-700">
                You are currently viewing as: <strong>{impersonatedOrgName}</strong>
              </p>
            </div>
            <button
              onClick={handleReturnToAdmin}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      
      {/* Header Section */}
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your clients, features, and system settings</p>
          </div>
          <div className="mt-4 sm:mt-0 sm:flex-none">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </button>
          </div>
        </div>
      </div>

      <StatusMessage type={status.type} message={status.message} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Clients</dt>
                  <dd className="text-lg font-medium text-gray-900">{organizations.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Clients</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {organizations.filter(org => org.status === 'active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {organizations.reduce((sum, org) => sum + (org.leads_count || 0), 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Chatbots</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {organizations.reduce((sum, org) => sum + (org.chatbots_count || 0), 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search clients..."
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="churned">Churned</option>
              </select>
              
              {selectedOrgs.length > 0 && (
                <div className="relative" ref={bulkActionsRef}>
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Bulk Actions
                    <ChevronDown className="ml-2 h-3 w-3" />
                  </button>
                  
                  {showBulkActions && (
                    <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <button
                          onClick={() => handleBulkAction('activate')}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Play className="mr-3 h-4 w-4" />
                          Activate
                        </button>
                        <button
                          onClick={() => handleBulkAction('suspend')}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Pause className="mr-3 h-4 w-4" />
                          Suspend
                        </button>
                        <button
                          onClick={() => handleBulkAction('email')}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Mail className="mr-3 h-4 w-4" />
                          Send Email
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => handleBulkAction('delete')}
                          className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                        >
                          <Trash2 className="mr-3 h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {selectedOrgs.length > 0 && (
                <span className="text-sm text-gray-500">{selectedOrgs.length} selected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client Table - Desktop */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="hidden md:block">
          <ul className="divide-y divide-gray-200">
            {filteredOrgs.map((org) => (
              <li key={org.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedOrgs.includes(org.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrgs([...selectedOrgs, org.id]);
                        } else {
                          setSelectedOrgs(selectedOrgs.filter(id => id !== org.id));
                        }
                      }}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                          <p className="text-sm text-gray-500 truncate">{org.industry || 'No industry specified'}</p>
                        </div>
                        <StatusBadge status={org.status} />
                      </div>
                      
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-6">
                        <div className="flex items-center">
                          <Users className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          {org.user_count} users
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          {org.leads_count} leads
                        </div>
                        <div className="flex items-center">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          Last active: {new Date(org.last_activity).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div className="hidden md:flex items-center space-x-4 mr-6">
                    <div className="text-xs text-gray-500">
                      <div>Lead Scoring</div>
                      <FeatureToggle 
                        enabled={org.features.lead_scoring} 
                        feature="lead_scoring"
                        orgId={org.id}
                        onToggle={handleFeatureToggle}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>Chatbots</div>
                      <FeatureToggle 
                        enabled={org.features.chatbots} 
                        feature="chatbots"
                        orgId={org.id}
                        onToggle={handleFeatureToggle}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>Branding</div>
                      <FeatureToggle 
                        enabled={org.features.custom_branding} 
                        feature="custom_branding"
                        orgId={org.id}
                        onToggle={handleFeatureToggle}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleImpersonate(org)}
                      className="p-2 text-gray-400 hover:text-orange-600 rounded-full hover:bg-gray-100"
                      title="View as Client"
                    >
                      <LogIn className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedOrgForEdit(org);
                        setShowBrandingModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100"
                      title="Edit Branding"
                    >
                      <Palette className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedOrgForEdit(org);
                        setShowSettingsModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-gray-100"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <div className="space-y-4 p-4">
            {filteredOrgs.map((org) => (
              <div key={org.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-500">{org.industry}</p>
                  </div>
                  <StatusBadge status={org.status} />
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                  <div>
                    <span className="block font-medium">Users</span>
                    <span>{org.user_count}</span>
                  </div>
                  <div>
                    <span className="block font-medium">Leads</span>
                    <span>{org.leads_count}</span>
                  </div>
                  <div>
                    <span className="block font-medium">Bots</span>
                    <span>{org.chatbots_count}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleImpersonate(org)}
                      className="p-2 text-orange-600 bg-orange-100 rounded-full"
                      title="View as Client"
                    >
                      <LogIn className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedOrgForEdit(org);
                        setShowBrandingModal(true);
                      }}
                      className="p-2 text-blue-600 bg-blue-100 rounded-full"
                      title="Edit Branding"
                    >
                      <Palette className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <FeatureToggle 
                      enabled={org.features.lead_scoring} 
                      feature="lead_scoring"
                      orgId={org.id}
                      onToggle={handleFeatureToggle}
                    />
                    <FeatureToggle 
                      enabled={org.features.chatbots} 
                      feature="chatbots"
                      orgId={org.id}
                      onToggle={handleFeatureToggle}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {filteredOrgs.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by adding your first client.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first client
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Action Tabs */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                <p className="text-sm text-gray-500">Global configuration and security</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Activity Logs</h3>
                <p className="text-sm text-gray-500">Monitor system and user activity</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-500">Platform performance metrics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddClientModal />
      <BrandingModal />
      <SettingsModal />
    </div>
  );
}
