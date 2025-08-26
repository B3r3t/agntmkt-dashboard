import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import {
  Users,
  Search,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare
} from 'lucide-react';

export default function LeadsPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedLeads, setExpandedLeads] = useState(new Set());

  useEffect(() => {
    if (organization?.id && organization.id !== 'admin') {
      fetchLeads();
    } else if (!orgLoading && organization?.id === 'admin') {
      setLeads([]);
      setLoading(false);
    }
  }, [organization, orgLoading]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      console.log('Fetching leads for organization:', organization.id);

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`Found ${data?.length || 0} leads for org ${organization.id}`);
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (leadId) => {
    setExpandedLeads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      converted: 'bg-purple-100 text-purple-800',
      lost: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return 'Not provided';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage and track your leads ({filteredLeads.length} total)
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name, email, phone, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>

        {/* Leads Cards */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="ml-2">Loading leads...</span>
              </div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'No leads match your filters'
                  : 'No leads yet. They will appear here when added.'}
              </p>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const isExpanded = expandedLeads.has(lead.id);
              const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown';

              return (
                <div
                  key={lead.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  {/* Collapsed View - Basic Info */}
                  <div className="p-4 cursor-pointer" onClick={() => toggleExpanded(lead.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Name and Status Row */}
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{fullName}</h3>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                  lead.status
                                )}`}
                              >
                                {lead.status || 'new'}
                              </span>
                              {lead.score > 0 && (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(
                                    lead.score
                                  )}`}
                                >
                                  Score: {lead.score}
                                </span>
                              )}
                            </div>

                            {/* Contact Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {/* Email */}
                              <div className="flex items-center text-gray-600">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="truncate">
                                  {lead.email === 'not provided' ? 'No email' : lead.email}
                                </span>
                              </div>

                              {/* Phone */}
                              <div className="flex items-center text-gray-600">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{formatPhone(lead.phone)}</span>
                              </div>

                              {/* Location */}
                              <div className="flex items-center text-gray-600">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                <span>
                                  {lead.location && lead.location !== 'not provided'
                                    ? lead.location
                                    : 'No location'}
                                </span>
                              </div>

                              {/* Date */}
                              <div className="flex items-center text-gray-600">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{formatDate(lead.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Expand/Collapse Icon */}
                          <div className="ml-4 flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded View - Conversation Summary */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
                      <div className="flex items-start">
                        <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Conversation Summary</h4>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {lead.conversation_summary || 'No conversation summary available.'}
                          </p>

                          {/* Additional Details */}
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            {lead.job_title && (
                              <div>
                                <span className="text-gray-500">Job Title: </span>
                                <span className="text-gray-900">{lead.job_title}</span>
                              </div>
                            )}
                            {lead.company && (
                              <div>
                                <span className="text-gray-500">Company: </span>
                                <span className="text-gray-900">{lead.company}</span>
                              </div>
                            )}
                          </div>

                          {/* Conversation Link */}
                          {lead.conversation_link && (
                            <div className="mt-3">
                              <a
                                href={`https://${lead.conversation_link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-orange-600 hover:text-orange-700"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View full conversation →
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

