import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { Users, TrendingUp, MessageSquare, Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { organization, loading: orgLoading } = useOrganization();
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({
    totalLeads: 0,
    newToday: 0,
    activeChats: 0,
    conversionRate: 0
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user name
  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to get name from profile first
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, first_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.display_name || profile?.first_name) {
          setUserName(profile.display_name || profile.first_name);
        } else {
          // Fall back to email parsing
          const emailName = user.email?.split('@')[0];
          if (emailName) {
            setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
          }
        }
      }
    };
    fetchUserName();
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (organization?.id) {
      fetchDashboardData();
    }
  }, [organization]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all stats in parallel
      const [
        { count: totalLeads },
        { count: todayLeads },
        { data: recentLeadsData },
        { data: chatbots }
      ] = await Promise.all([
        // Total leads
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id),
        
        // Today's new leads
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .gte('created_at', new Date().toISOString().split('T')[0]),
        
        // Recent 5 leads with details
        supabase
          .from('leads')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Get chatbots for conversation count
        supabase
          .from('chatbots')
          .select('id')
          .eq('organization_id', organization.id)
      ]);

      // Get active conversations if chatbots exist
      let activeChatsCount = 0;
      if (chatbots && chatbots.length > 0) {
        const chatbotIds = chatbots.map(c => c.id);
        const { count } = await supabase
          .from('chatbot_conversations')
          .select('*', { count: 'exact', head: true })
          .in('chatbot_id', chatbotIds)
          .eq('status', 'active');
        activeChatsCount = count || 0;
      }

      // Calculate conversion rate (qualified leads / total leads)
      const { count: qualifiedCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'qualified');

      const conversionRate = totalLeads > 0 
        ? ((qualifiedCount / totalLeads) * 100).toFixed(1)
        : 0;

      setStats({
        totalLeads: totalLeads || 0,
        newToday: todayLeads || 0,
        activeChats: activeChatsCount,
        conversionRate
      });

      setRecentLeads(recentLeadsData || []);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome {userName || 'back'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Here's your business overview for today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
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
                      {stats.totalLeads.toLocaleString()}
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
                      {stats.newToday.toLocaleString()}
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
                      {stats.activeChats}
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

        {/* Recent Leads Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Leads</h2>
            <Link 
              to="/leads" 
              className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center"
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <ul className="divide-y divide-gray-200">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <li key={lead.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">{lead.email}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lead.status === 'qualified' 
                          ? 'bg-green-100 text-green-800'
                          : lead.status === 'contacted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status || 'new'}
                      </span>
                      {lead.score && (
                        <span className="text-sm text-gray-500">
                          Score: {lead.score}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 sm:px-6">
                <p className="text-sm text-gray-500 text-center">No leads yet</p>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
