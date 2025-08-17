import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Target,
  ChevronRight,
  AlertCircle 
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { organization, loading: orgLoading } = useOrganization();
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeadsToday: 0,
    activeConversations: 0,
    conversionRate: 0
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      fetchDashboardData();
    }
  }, [organization]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch statistics
      const [
        { count: totalLeads },
        { data: todayLeads },
        { data: conversations },
        { data: recent }
      ] = await Promise.all([
        // Total leads count
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id),
        
        // Today's leads
        supabase
          .from('leads')
          .select('*')
          .eq('organization_id', organization.id)
          .gte('created_at', new Date().toISOString().split('T')[0]),
        
        // Active conversations
        supabase
          .from('chatbot_conversations')
          .select('*, chatbot!inner(organization_id)')
          .eq('chatbot.organization_id', organization.id)
          .eq('status', 'active'),
        
        // Recent leads
        supabase
          .from('leads')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      setStats({
        totalLeads: totalLeads || 0,
        newLeadsToday: todayLeads?.length || 0,
        activeConversations: conversations?.length || 0,
        conversionRate: totalLeads > 0 ? 
          ((todayLeads?.filter(l => l.status === 'qualified').length / totalLeads) * 100).toFixed(1) : 0
      });

      setRecentLeads(recent || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No organization found. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to {organization.name}
          </h1>
          <p className="mt-2 text-gray-600">
            Here's your business overview for today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div 
            className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/leads')}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Leads
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.totalLeads}
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
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      New Today
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.newLeadsToday}
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
                  <MessageSquare className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Chats
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.activeConversations}
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
                  <Target className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Conversion
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.conversionRate}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Leads</h2>
              <button
                onClick={() => navigate('/leads')}
                className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
              >
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>

            {recentLeads.length > 0 ? (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{lead.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${lead.status === 'qualified' ? 'bg-green-100 text-green-800' : 
                          lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {lead.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Score: {lead.score || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No leads yet. They'll appear here as they come in.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
