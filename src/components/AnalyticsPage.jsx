import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { TrendingUp, Users, MessageSquare, Target, Calendar, BarChart3, AlertCircle } from 'lucide-react';

export default function AnalyticsPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    qualifiedLeads: 0,
    totalConversations: 0,
    captureRate: 0,
    avgLeadScore: 0,
    newLeadsToday: 0
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      fetchAnalytics();
    }
  }, [organization]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // First, get chatbot IDs for this organization
      const { data: chatbots } = await supabase
        .from('chatbots')
        .select('id')
        .eq('organization_id', organization.id);
      
      const chatbotIds = chatbots?.map(c => c.id) || [];

      // Fetch all metrics for this organization
      const [
        leadsResult,
        qualifiedResult,
        avgScoreResult,
        todayResult,
        conversationsResult,
        dailyMetricsResult
      ] = await Promise.all([
        // Total leads
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id),
        
        // Qualified leads
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('status', 'qualified'),
        
        // Average lead score - get actual lead data for calculation
        supabase
          .from('leads')
          .select('score')
          .eq('organization_id', organization.id)
          .not('score', 'is', null),
        
        // Today's new leads - get count properly
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .gte('created_at', new Date().toISOString().split('T')[0]),
        
        // Total conversations - query with chatbot IDs
        chatbotIds.length > 0
          ? supabase
              .from('chatbot_conversations')
              .select('*', { count: 'exact', head: true })
              .in('chatbot_id', chatbotIds)
          : { count: 0 },
        
        // Daily metrics from analytics_daily
        supabase
          .from('analytics_daily')
          .select('*')
          .eq('organization_id', organization.id)
          .order('date', { ascending: false })
          .limit(30)
      ]);

      // Extract counts and data
      const totalLeads = leadsResult.count || 0;
      const qualifiedLeads = qualifiedResult.count || 0;
      const todayLeads = todayResult.count || 0;
      const totalConversations = conversationsResult.count || 0;

      // Calculate average score from actual score data
      const avgScoreValue = avgScoreResult.data?.length > 0
        ? avgScoreResult.data.reduce((acc, lead) => acc + (lead.score || 0), 0) / avgScoreResult.data.length
        : 0;

      // Calculate capture rate (leads captured from conversations)
      const captureRate = totalConversations > 0 && totalLeads > 0
        ? ((totalLeads / totalConversations) * 100).toFixed(1)
        : 0;

      setMetrics({
        totalLeads,
        qualifiedLeads,
        totalConversations,
        captureRate,
        avgLeadScore: Math.round(avgScoreValue),
        newLeadsToday: todayLeads
      });

      // Process daily metrics for chart if available
      if (dailyMetricsResult.data?.length > 0) {
        const chartPoints = dailyMetricsResult.data.map(metric => ({
          date: new Date(metric.date).toLocaleDateString(),
          totalLeads: metric.total_leads || 0,
          newLeads: metric.new_leads || 0,
          qualifiedLeads: metric.qualified_leads || 0,
          conversations: metric.total_conversations || 0
        }));
        setChartData(chartPoints);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Log more details for debugging
      console.error('Organization ID:', organization?.id);
      console.error('Error details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analytics...</div>
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
        {/* Header with Organization Name */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {organization.name} Performance Metrics
          </p>
        </div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
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
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {metrics.totalLeads.toLocaleString()}
                      </div>
                      {metrics.newLeadsToday > 0 && (
                        <span className="ml-2 text-sm text-green-600">
                          +{metrics.newLeadsToday} today
                        </span>
                      )}
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
                  <Target className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Qualified Leads
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {metrics.qualifiedLeads.toLocaleString()}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {metrics.totalLeads > 0 
                          ? `${((metrics.qualifiedLeads / metrics.totalLeads) * 100).toFixed(1)}%`
                          : '0%'}
                      </span>
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
                      Conversations
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {metrics.totalConversations.toLocaleString()}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {metrics.captureRate}% capture
                      </span>
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
                  <TrendingUp className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Lead Score
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {metrics.avgLeadScore}
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
                  <BarChart3 className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Conversion Rate
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {metrics.totalLeads > 0 
                        ? `${((metrics.qualifiedLeads / metrics.totalLeads) * 100).toFixed(1)}%`
                        : '0%'}
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
                  <Calendar className="h-6 w-6 text-teal-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      New Today
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {metrics.newLeadsToday}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Lead Sources</h2>
            {chartData.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Recent Performance:</p>
                {chartData.slice(0, 3).map((data, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{data.date}:</span>
                    <span className="font-medium">{data.totalLeads} leads</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                Source breakdown will appear here as data accumulates.
              </p>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Conversion Trends</h2>
            {chartData.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Recent Conversions:</p>
                {chartData.slice(0, 3).map((data, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{data.date}:</span>
                    <span className="font-medium">{data.qualifiedLeads} qualified</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                Trend charts will appear here as data accumulates.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
