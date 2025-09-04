// AdminDashboard.jsx - Complete version with all features
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Users,
  Building2,
  Activity,
  Settings,
  Shield,
  Plus,
  Search,
  LogIn,
  Palette,
  Check,
  AlertCircle,
} from 'lucide-react';
import FeatureToggle from './admin/FeatureToggle';
import BrandingModal from './admin/BrandingModal';

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

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/80 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-full w-full bg-gradient-to-r from-transparent via-orange-400/5 to-transparent animate-sweep"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your clients, features, and system settings</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500 animate-shimmer"></div>
          <div className="relative z-10">
            <div className="flex items-center">
              <Users className="h-12 w-12 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900">{organizations.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-500 animate-shimmer"></div>
          <div className="relative z-10">
            <div className="flex items-center">
              <Activity className="h-12 w-12 text-green-600 group-hover:scale-110 transition-transform duration-300" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-3xl font-bold text-gray-900">
                  {organizations.filter(o => o.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-500 animate-shimmer"></div>
          <div className="relative z-10">
            <div className="flex items-center">
              <Building2 className="h-12 w-12 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900">
                  {organizations.reduce((sum, org) => sum + (org.lead_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-500 animate-shimmer"></div>
          <div className="relative z-10">
            <div className="flex items-center">
              <Shield className="h-12 w-12 text-orange-600 group-hover:scale-110 transition-transform duration-300" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Chatbots</p>
                <p className="text-3xl font-bold text-gray-900">
                  {organizations.filter(o => o.features?.chatbots).length}
                </p>
              </div>
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
        <BrandingModal
          isOpen={showBrandingModal}
          org={selectedOrgForEdit}
          onClose={() => setShowBrandingModal(false)}
          fetchOrganizations={fetchOrganizations}
          setStatus={setStatus}
        />
    </div>
  );
}
