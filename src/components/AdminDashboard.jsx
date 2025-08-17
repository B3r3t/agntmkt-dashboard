import React, { useState, useEffect } from 'react';
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
  LogIn
} from 'lucide-react';
import StatusMessage from './StatusMessage';

export default function AdminDashboard() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrgs, setSelectedOrgs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => setStatus({ type: '', message: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      // Fetch organizations with additional data
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          *,
          user_organizations!inner(user_id),
          client_features(feature_name, is_enabled),
          client_branding(primary_color, secondary_color, accent_color, logo_url)
        `)
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Get user counts for each organization
      const orgsWithCounts = await Promise.all(
        (orgsData || []).map(async (org) => {
          // Fetch counts and last activity in parallel
          const [
            { count: userCount },
            { count: leadsCount, data: lastActivityData },
            { count: chatbotsCount },
          ] = await Promise.all([
            supabase
              .from('user_organizations')
              .select('*', { count: 'exact' })
              .eq('organization_id', org.id),
            supabase
              .from('leads')
              .select('created_at', { count: 'exact' })
              .eq('organization_id', org.id)
              .order('created_at', { ascending: false })
              .limit(1),
            supabase
              .from('chatbots')
              .select('*', { count: 'exact' })
              .eq('organization_id', org.id),
          ]);

          // Process features into an object
          const features = {};
          (org.client_features || []).forEach(feature => {
            features[feature.feature_name] = feature.is_enabled;
          });

          return {
            ...org,
            user_count: userCount || 0,
            leads_count: leadsCount || 0,
            chatbots_count: chatbotsCount || 0,
            last_activity: lastActivityData?.[0]?.created_at || org.created_at,
            features: {
              lead_scoring: features.lead_scoring ?? true,
              chatbots: features.chatbots ?? true,
              document_processing: features.document_processing ?? true,
              custom_branding: features.custom_branding ?? true,
              ...features
            },
            branding: org.client_branding?.[0] || {
              primary_color: '#3d3b3a',
              secondary_color: '#737373',
              accent_color: '#ff7f30'
            },
            status: org.status || 'active'
          };
        })
      );

      setOrganizations(orgsWithCounts);
    } catch (error) {
      console.error('Error fetching organizations:', error);
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
    console.log(`Bulk ${action} for organizations:`, selectedOrgs);

    try {
      if (action === 'suspend') {
        // Update organizations status to suspended
        const { error } = await supabase
          .from('organizations')
          .update({ status: 'suspended' })
          .in('id', selectedOrgs);
        
        if (error) throw error;
      }

      // Refresh data and clear selection
      await fetchOrganizations();
      setSelectedOrgs([]);
      setStatus({ type: 'success', message: `Bulk ${action} completed successfully.` });
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      setStatus({ type: 'error', message: `Error performing bulk ${action}.` });
    }
  };

  const handleFeatureToggle = async (orgId, feature) => {
    try {
      // Check if feature exists
      const { data: existingFeature } = await supabase
        .from('client_features')
        .select('*')
        .eq('organization_id', orgId)
        .eq('feature_name', feature)
        .single();

      if (existingFeature) {
        // Update existing feature
        const { error } = await supabase
          .from('client_features')
          .update({ is_enabled: !existingFeature.is_enabled })
          .eq('organization_id', orgId)
          .eq('feature_name', feature);
        
        if (error) throw error;
      } else {
        // Create new feature
        const { error } = await supabase
          .from('client_features')
          .insert({
            organization_id: orgId,
            feature_name: feature,
            is_enabled: true
          });
        
        if (error) throw error;
      }

      // Refresh data
      await fetchOrganizations();
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  const handleImpersonate = async (orgId) => {
    try {
      // Store current admin session
      localStorage.setItem('admin_impersonating', orgId);
      localStorage.setItem('admin_return_url', window.location.pathname);
      
      // Navigate to main dashboard
      window.location.href = '/';
    } catch (error) {
      console.error('Error impersonating client:', error);
    }
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

  const AddClientModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      industry: '',
      contact_email: '',
      contact_name: ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);

      try {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert([formData])
          .select()
          .single();
        if (orgError) throw orgError;
          // Step 2: Create default branding
          const { error: brandingError } = await supabase
            .from('client_branding')
            .insert({
              organization_id: org.id,
              primary_color: '#3B82F6',
              secondary_color: '#10B981', 
              accent_color: '#F59E0B',
              logo_url: null
            });
          if (brandingError) throw brandingError;
          // Initialize default features
          const defaultFeatures = [
            { feature_name: 'lead_scoring', is_enabled: true },
            { feature_name: 'chatbots', is_enabled: true },
            { feature_name: 'document_processing', is_enabled: true },
            { feature_name: 'custom_branding', is_enabled: true }
          ].map(f => ({ ...f, organization_id: org.id }));

          const { error: featuresError } = await supabase
            .from('client_features')
            .insert(defaultFeatures);
          if (featuresError) throw featuresError;

          // Default scoring configuration
          const { error: scoringError } = await supabase
            .from('scoring_configs')
            .insert({
              organization_id: org.id,
              name: 'Default Scoring',
              description: 'Default lead scoring criteria',
              criteria: {
                job_title: { weight: 25 },
                company_size: { weight: 25 },
                industry_match: { weight: 30 },
                engagement: { weight: 20 }
              },
              weights: {
                job_title: 25,
                company_size: 25,
                industry_match: 30,
                engagement: 20
              },
              is_active: true
            });
          if (scoringError) throw scoringError;
        
        // Refresh data and close modal
        await fetchOrganizations();
        setShowAddModal(false);
        setFormData({ name: '', industry: '', contact_email: '', contact_name: '' });
        setStatus({ type: 'success', message: 'Client created successfully.' });
      } catch (error) {
        console.error('Error creating organization:', error);
        setStatus({ type: 'error', message: 'Error creating client. Please try again.' });
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
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{selectedOrgs.length} selected</span>
                  <button
                    onClick={() => handleBulkAction('suspend')}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Bulk Actions
                  </button>
                </div>
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
                      onClick={() => handleImpersonate(org.id)}
                      className="p-2 text-gray-400 hover:text-orange-600 rounded-full hover:bg-gray-100"
                      title="View as Client"
                    >
                      <LogIn className="h-4 w-4" />
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100"
                      title="Edit Branding"
                    >
                      <Palette className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-gray-100">
                      <Settings className="h-4 w-4" title="Settings" />
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
                      onClick={() => handleImpersonate(org.id)}
                      className="p-2 text-orange-600 bg-orange-100 rounded-full"
                      title="View as Client"
                    >
                      <LogIn className="h-4 w-4" />
                    </button>
                    <button 
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
    </div>
  );
}
