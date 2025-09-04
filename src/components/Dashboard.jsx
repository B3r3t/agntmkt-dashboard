import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { Users, TrendingUp, MessageSquare, Target, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logger from '../lib/logger';

export default function Dashboard() {
  const { organization, loading: orgLoading, userRole, isImpersonating } = useOrganization();
  const navigate = useNavigate();
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
    } else if (!orgLoading) {
      // No organization (admin without org or loading complete)
      setStats({
        totalLeads: 0,
        newToday: 0,
        activeChats: 0,
        conversionRate: 0
      });
      setRecentLeads([]);
      setLoading(false);
    }
  }, [organization, orgLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      logger.log('Fetching dashboard data for org:', organization.id);

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
        
        // Recent 5 leads
        supabase
          .from('leads')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Active chatbots
        supabase
          .from('chatbots')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('is_active', true)
      ]);

      // Calculate conversion rate (example: qualified leads / total leads)
      const conversionRate = totalLeads > 0 ? Math.round((todayLeads / totalLeads) * 100) : 0;

      setStats({
        totalLeads: totalLeads || 0,
        newToday: todayLeads || 0,
        activeChats: chatbots?.length || 0,
        conversionRate
      });

      setRecentLeads(recentLeadsData || []);
      logger.log('Dashboard data loaded:', { totalLeads, todayLeads, recentLeads: recentLeadsData?.length });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // If user is system admin but not viewing as a client
  if (userRole === 'admin' && !organization && !isImpersonating && !orgLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Welcome {userName || 'Admin'}</h1>
          <p className="mt-2 text-gray-600">System administration dashboard</p>
          
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Admin Portal</h2>
            <p className="text-blue-700 mb-4">
              As a system administrator, you can manage all client organizations and their settings.
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Admin Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 relative z-[1]">
      <div className="px-4 py-6 sm:px-0">
        {/* Header Section with Glassmorphism */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 mb-8 border border-white/80 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-full w-full bg-gradient-to-r from-transparent via-orange-400/5 to-transparent animate-sweep"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-gray-900">Welcome {userName}</h1>
            <p className="mt-2 text-gray-600">Here's your business overview for today</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-500 animate-shimmer"></div>
            <div className="relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Leads
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats.totalLeads}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-500 animate-shimmer"></div>
            <div className="relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      New Today
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats.newToday}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500 animate-shimmer"></div>
            <div className="relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-8 w-8 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Chats
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats.activeChats}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-500 animate-shimmer"></div>
            <div className="relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Conversion
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats.conversionRate}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Leads Section */}
        <div className="mt-8 bg-white/95 backdrop-blur-sm shadow-lg overflow-hidden rounded-3xl border border-white/80 hover:shadow-xl transition-all duration-300">
          <div className="px-6 py-6 sm:px-8 flex justify-between items-center border-b border-gray-100/50">
            <h2 className="text-xl font-semibold text-gray-900">Recent Leads</h2>
            <Link
              to="/leads"
              className="text-sm font-medium text-orange-600 hover:text-orange-500 flex items-center hover:scale-105 transition-all duration-200"
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <ul className="divide-y divide-gray-200">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <li key={lead.id} className="px-6 py-6 sm:px-8 hover:bg-orange-400/5 hover:translate-x-2 transition-all duration-300 rounded-xl mx-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
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
                        {lead.status || 'New'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Score: {lead.score || 0}
                      </span>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-12 text-center">
                <p className="text-gray-500">No leads yet</p>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
