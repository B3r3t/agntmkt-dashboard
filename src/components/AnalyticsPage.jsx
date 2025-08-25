import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Target,
  Calendar,
  BarChart3,
  AlertCircle,
  Hash,
  Activity,
  Minus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const TopicAnalyticsCard = ({ organization }) => {
  const [analysis, setAnalysis] = useState({
    trending: [],
    weekly: [],
    emerging: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (organization?.id) {
      fetchAIAnalysis();
    }
  }, [organization, timeRange]);

  const fetchAIAnalysis = async () => {
    setLoading(true);
    try {
      // First, check for cached analysis (less than 4 hours old)
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

      const { data: cached, error: cacheError } = await supabase
        .from('conversation_analytics')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('time_range', timeRange)
        .gte('analysis_date', fourHoursAgo)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .single();

      if (cached && !cacheError) {
        // Use cached data
        setAnalysis(
          cached?.analysis_data ?? { trending: [], weekly: [], emerging: [] }
        );
        setLoading(false);
        return;
      }

      // If no cache or stale, trigger new analysis
      const { data, error } = await supabase.functions.invoke('analyze-conversations', {
        body: {
          organizationId: organization.id,
          timeRange: timeRange,
        },
      });

      if (error) throw error;
      setAnalysis(
        data?.analysis ?? { trending: [], weekly: [], emerging: [] }
      );
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
      // Could fallback to basic keyword analysis here if needed
      setAnalysis({ trending: [], weekly: [], emerging: [] });
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = organization?.branding?.primary_color || '#ea580c';
  if (!analysis) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/80 shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Hash className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Topic Intelligence</h2>
            <p className="text-sm text-gray-500">What your customers are talking about</p>
          </div>
        </div>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {analysis.weekly.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Topic Categories</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analysis.weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#888" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="mentions" fill={primaryColor} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Trending Topics</h3>
            <div className="space-y-2">
              {analysis.trending.slice(0, 8).map((item, idx) => (
                <div
                  key={item.keyword}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400 w-6">#{idx + 1}</span>
                    <span className="font-medium text-gray-900 capitalize">{item.keyword}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                      {item.count} mentions
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.trend === 'up' && (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">+{item.trendPercent}%</span>
                      </>
                    )}
                    {item.trend === 'down' && (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="text-xs text-red-600 font-medium">{item.trendPercent}%</span>
                      </>
                    )}
                    {item.trend === 'stable' && (
                      <>
                        <Minus className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500">Stable</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {analysis.emerging.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-purple-900 mb-1">Emerging Topics</h4>
                  <p className="text-sm text-purple-700 mb-2">These topics are gaining rapid attention:</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.emerging.map((item) => (
                      <span
                        key={item.keyword}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-sm font-medium text-purple-900"
                      >
                        {item.keyword}
                        <span className="text-xs text-purple-600">+{item.trendPercent}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Quick Insights</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{analysis.trending[0]?.keyword || 'N/A'}</div>
                <div className="text-xs text-gray-500">Most discussed topic</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{analysis.emerging.length}</div>
                <div className="text-xs text-gray-500">Emerging topics</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500 animate-shimmer"></div>
            <div className="relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
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

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-500 animate-shimmer"></div>
            <div className="relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-green-400 group-hover:scale-110 transition-transform duration-300" />
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

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-500 animate-shimmer"></div>
            <div className="relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-8 w-8 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
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

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-500 animate-shimmer"></div>
            <div className="relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
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

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-indigo-500 animate-shimmer"></div>
            <div className="relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
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

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-teal-500 animate-shimmer"></div>
            <div className="relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-teal-400 group-hover:scale-110 transition-transform duration-300" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-orange-400/5 to-transparent animate-scan"></div>
            <div className="relative z-10">
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
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-orange-400/5 to-transparent animate-scan"></div>
            <div className="relative z-10">
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
          {/* Add the AI Topic Analytics card - spans 2 columns on medium screens and 3 on large */}
          <div className="md:col-span-2 lg:col-span-3">
            <TopicAnalyticsCard organization={organization} />
          </div>
        </div>
      </div>
    </div>
  );
}
