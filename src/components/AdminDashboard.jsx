// AdminDashboard.jsx - Complete version with all features
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Users, Building2, Activity, Settings, Shield, FileText, 
  Plus, Search, Filter, Download, Mail, Trash2, Edit2, 
  LogIn, Palette, ToggleLeft, ToggleRight, Upload, X,
  Check, ChevronDown, MoreVertical, Image, AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrgs, setSelectedOrgs] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedOrgForEdit, setSelectedOrgForEdit] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Check if still impersonating (shouldn't be on admin page)
      const impersonatingOrg = localStorage.getItem('admin_impersonating');
      if (impersonatingOrg) {
        // Clear impersonation and reload
        localStorage.removeItem('admin_impersonating');
        localStorage.removeItem('admin_original_user');
        localStorage.removeItem('temp_organization_id');
        localStorage.removeItem('impersonated_org_name');
        localStorage.removeItem('admin_return_url');
      }

      // Check if user is a system admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'admin') {
        navigate('/');
        return;
      }

      await fetchOrganizations();
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/');
    }
  };

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL organizations without inner join filtering
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          *,
          client_branding(*),
          client_features(*)
        `)
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      console.log('Found organizations:', orgsData?.length);

      // Process the data to include counts and features
      const processedOrgs = await Promise.all(orgsData.map(async (org) => {
        // Get user count
        const { count: userCount } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        // Get lead count
        const { count: leadCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        // Process features into a map
        const featuresMap = {};
        org.client_features?.forEach(f => {
          featuresMap[f.feature_name] = f.is_enabled;
        });

        return {
          ...org,
          user_count: userCount || 0,
          lead_count: leadCount || 0,
          features: featuresMap,
          branding: org.client_branding?.[0] || null
        };
      }));

      console.log('Processed organizations:', processedOrgs);
      setOrganizations(processedOrgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setStatus({ type: 'error', message: 'Error loading organizations.' });
    } finally {
      setLoading(false);
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
      setStatus({ type: 'success', message: 'Feature updated successfully!' });
    } catch (error) {
      console.error('Error toggling feature:', error);
      setStatus({ type: 'error', message: 'Error updating feature.' });
    }
  };

  const handleImpersonate = async (org) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
  
      console.log('Starting impersonation for:', org.name, org.id);
  
      // Store admin session info
      localStorage.setItem('admin_impersonating', org.id);
      localStorage.setItem('admin_original_user', user.id);
      localStorage.setItem('admin_return_url', '/admin');
      localStorage.setItem('impersonated_org_name', org.name);
      localStorage.setItem('temp_organization_id', org.id);
      
      // Navigate to dashboard - context will detect impersonation and refresh
      navigate('/');
      
    } catch (error) {
      console.error('Error impersonating client:', error);
      setStatus({ type: 'error', message: 'Error switching to client view.' });
    }
  };

  const FeatureToggle = ({ enabled, onToggle, feature, orgId, label }) => (
    <div className="flex flex-col items-center space-y-1">
      <span className="text-xs text-gray-600">{label}</span>
      <button
        onClick={() => onToggle(orgId, feature)}
        className={`inline-flex items-center ${enabled ? 'text-green-600' : 'text-gray-400'}`}
        title={`${enabled ? 'Disable' : 'Enable'} ${label}`}
      >
        {enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
      </button>
    </div>
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

  // Branding Modal Component
  const BrandingModal = () => {
    const [brandingData, setBrandingData] = useState({
      primary_color: selectedOrgForEdit?.branding?.primary_color || '#3B82F6',
      secondary_color: selectedOrgForEdit?.branding?.secondary_color || '#10B981',
      accent_color: selectedOrgForEdit?.branding?.accent_color || '#F59E0B',
      logo_url: selectedOrgForEdit?.branding?.logo_url || '',
      custom_css: selectedOrgForEdit?.branding?.custom_css || ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState(brandingData.logo_url);

    const handleLogoUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (PNG, JPG, SVG, or WebP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    };

    const uploadLogoToSupabase = async () => {
      if (!logoFile) return brandingData.logo_url;

      setUploading(true);
      try {
        // Create unique filename
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${selectedOrgForEdit.id}-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('public-assets')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('public-assets')
          .getPublicUrl(filePath);

        return publicUrl;
      } catch (error) {
        console.error('Error uploading logo:', error);
        alert('Error uploading logo. Please try again.');
        return brandingData.logo_url;
      } finally {
        setUploading(false);
      }
    };

    const handleSave = async () => {
      setSaving(true);
      try {
        // Upload logo if a new file was selected
        let logoUrl = brandingData.logo_url;
        if (logoFile) {
          logoUrl = await uploadLogoToSupabase();
        }

        // Save branding data
        const { error } = await supabase
          .from('client_branding')
          .upsert({
            organization_id: selectedOrgForEdit.id,
            primary_color: brandingData.primary_color,
            secondary_color: brandingData.secondary_color,
            accent_color: brandingData.accent_color,
            logo_url: logoUrl,
            custom_css: brandingData.custom_css,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        setStatus({ type: 'success', message: 'Branding updated successfully!' });
        setShowBrandingModal(false);
        await fetchOrganizations();
      } catch (error) {
        console.error('Error saving branding:', error);
        setStatus({ type: 'error', message: 'Error saving branding.' });
      } finally {
        setSaving(false);
      }
    };

    if (!showBrandingModal || !selectedOrgForEdit) return null;

    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Branding - {selectedOrgForEdit.name}
              </h2>
              <button
                onClick={() => setShowBrandingModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Logo Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>
              
              {/* Logo Preview */}
              {logoPreview && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="max-h-32 mx-auto"
                  />
                </div>
              )}

              {/* Upload Options */}
              <div className="space-y-3">
                {/* File Upload */}
                <div>
                  <label className="block">
                    <div className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer">
                      <Upload className="h-5 w-5 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {logoFile ? logoFile.name : 'Click to upload logo'}
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, SVG, or WebP up to 5MB
                  </p>
                </div>

                {/* OR Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                {/* URL Input */}
                <div>
                  <input
                    type="url"
                    placeholder="Enter logo URL"
                    value={brandingData.logo_url}
                    onChange={(e) => {
                      setBrandingData({ ...brandingData, logo_url: e.target.value });
                      setLogoPreview(e.target.value);
                      setLogoFile(null); // Clear file if URL is entered
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Color Pickers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Colors
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Primary</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={brandingData.primary_color}
                      onChange={(e) => setBrandingData({ ...brandingData, primary_color: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingData.primary_color}
                      onChange={(e) => setBrandingData({ ...brandingData, primary_color: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Secondary</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={brandingData.secondary_color}
                      onChange={(e) => setBrandingData({ ...brandingData, secondary_color: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingData.secondary_color}
                      onChange={(e) => setBrandingData({ ...brandingData, secondary_color: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Accent</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={brandingData.accent_color}
                      onChange={(e) => setBrandingData({ ...brandingData, accent_color: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingData.accent_color}
                      onChange={(e) => setBrandingData({ ...brandingData, accent_color: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom CSS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom CSS
              </label>
              <textarea
                value={brandingData.custom_css}
                onChange={(e) => setBrandingData({ ...brandingData, custom_css: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                placeholder=".chat-widget { border-radius: 12px; }
.chat-header { background: linear-gradient(135deg, #E32390, #C71E7C); }"
              />
              <p className="mt-1 text-xs text-gray-500">
                Add custom CSS to style the client's dashboard and chatbot widget
              </p>
            </div>

            {/* Preview Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="space-y-3">
                  {/* Sample Button */}
                  <button
                    style={{ backgroundColor: brandingData.primary_color }}
                    className="px-4 py-2 text-white rounded-md"
                  >
                    Primary Button
                  </button>
                  
                  {/* Sample Elements */}
                  <div className="flex space-x-3">
                    <div 
                      style={{ backgroundColor: brandingData.secondary_color }}
                      className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xs"
                    >
                      Secondary
                    </div>
                    <div 
                      style={{ backgroundColor: brandingData.accent_color }}
                      className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xs"
                    >
                      Accent
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => setShowBrandingModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          org.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Status Messages */}
      {status && (
        <div className={`mb-6 p-4 rounded-lg ${
          status.type === 'success' ? 'bg-green-50 text-green-800' :
          status.type === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          <div className="flex items-center">
            {status.type === 'success' && <Check className="h-5 w-5 mr-2" />}
            {status.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
            <span>{status.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage your clients, features, and system settings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Users className="h-10 w-10 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Activity className="h-10 w-10 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">
                {organizations.filter(o => o.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Building2 className="h-10 w-10 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">
                {organizations.reduce((sum, org) => sum + (org.lead_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Shield className="h-10 w-10 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Chatbots</p>
              <p className="text-2xl font-bold text-gray-900">
                {organizations.filter(o => o.features?.chatbots).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Client Organizations</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="churned">Churned</option>
            </select>
          </div>
        </div>

        {/* Organizations List */}
        <div className="divide-y divide-gray-200">
          {filteredOrgs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No organizations found
            </div>
          ) : (
            filteredOrgs.map((org) => (
              <div key={org.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
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
                        className="mr-4 h-4 w-4 text-orange-600 rounded"
                      />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{org.name}</h3>
                        <p className="text-sm text-gray-500">{org.industry || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {org.user_count} users
                      </span>
                      <span className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        {org.lead_count} leads
                      </span>
                      <span className="flex items-center">
                        <Activity className="h-4 w-4 mr-1" />
                        Last active: {new Date(org.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Feature Toggles - Only Lead Scoring and Chatbots */}
                  <div className="flex items-center space-x-4">
                    <FeatureToggle
                      enabled={org.features?.lead_scoring}
                      onToggle={handleFeatureToggle}
                      feature="lead_scoring"
                      orgId={org.id}
                      label="AI Scoring"
                    />
                    <FeatureToggle
                      enabled={org.features?.chatbots}
                      onToggle={handleFeatureToggle}
                      feature="chatbots"
                      orgId={org.id}
                      label="Chatbots"
                    />
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
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
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Branding Modal */}
      <BrandingModal />
    </div>
  );
}
