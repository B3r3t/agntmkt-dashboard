import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  MapPin,
  Building,
  Briefcase,
  Calendar,
  Star,
  Clock,
  User,
  Bot,
  Settings,
  Eye,
  Search,
  Upload,
  Sliders,
  Paperclip,
  Smile,
  Send
} from 'lucide-react';

export default function ChatbotConversations() {
  const { organization, branding } = useOrganization();
  const [activeTab, setActiveTab] = useState('conversations');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedConversation, setExpandedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    withLeads: 0,
    avgSatisfaction: 0,
    todayCount: 0
  });
  
  // ENHANCED AGNT Configuration State
  const [agntConfig, setAgntConfig] = useState({
    // Basic
    agnt_name: 'Sales Assistant',
    support_email: 'support@company.com',
    agnt_logo: null,
    
    // Appearance
    primary_color: branding?.primary_color || '#ea580c',
    text_color: '#ffffff',
    bg_color: '#ffffff',
    widget_size: 'medium',
    
    // Messages
    welcome_message: 'Hi! How can I help you today?',
    offline_message: 'We\'re currently offline. Please leave a message and we\'ll get back to you!',
    initial_greeting: 'Have a question? Click here to chat!',
    
    // Widget Behavior
    widget_position: 'bottom-right',
    auto_open: false,
    auto_open_delay: 5,
    greeting_delay: 3,
    
    // Features
    show_typing_indicator: true,
    show_read_receipts: false,
    enable_file_uploads: false,
    enable_emoji_picker: true,
    sound_notifications: true,
    desktop_notifications: false,
    
    // Business Hours
    business_hours_enabled: false,
    business_hours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '17:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' },
    },
    
    // Advanced
    language: 'en',
    bubble_animation: 'bounce',
    response_delay: 1000,
    max_file_size: 5,
    allowed_file_types: '.pdf,.doc,.docx,.jpg,.png',
  });
  
  const [previewState, setPreviewState] = useState('closed');
  const [isSaving, setIsSaving] = useState(false);

  // Widget Size Configurations
  const widgetSizes = {
    small: { width: '280px', height: '400px', buttonSize: '48px', fontSize: '14px' },
    medium: { width: '350px', height: '500px', buttonSize: '56px', fontSize: '15px' },
    large: { width: '400px', height: '600px', buttonSize: '64px', fontSize: '16px' },
  };

  // Logo Upload Handler
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAgntConfig({ ...agntConfig, agnt_logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (organization?.id) {
      fetchConversations();
      fetchStats();
    }
  }, [organization]);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: chatbots } = await supabase
        .from('chatbots')
        .select('id')
        .eq('organization_id', organization.id);
      
      const chatbotIds = chatbots?.map(c => c.id) || [];
      
      if (chatbotIds.length === 0) {
        setStats({ total: 0, withLeads: 0, avgSatisfaction: 0, todayCount: 0 });
        return;
      }

      const [totalResult, withLeadsResult, todayResult, satisfactionResult] = await Promise.all([
        supabase
          .from('chatbot_conversations')
          .select('*', { count: 'exact', head: true })
          .in('chatbot_id', chatbotIds),
        
        supabase
          .from('chatbot_conversations')
          .select('*', { count: 'exact', head: true })
          .in('chatbot_id', chatbotIds)
          .not('email', 'is', null),
        
        supabase
          .from('chatbot_conversations')
          .select('*', { count: 'exact', head: true })
          .in('chatbot_id', chatbotIds)
          .gte('started_at', today),
        
        supabase
          .from('chatbot_conversations')
          .select('satisfaction_rating')
          .in('chatbot_id', chatbotIds)
          .not('satisfaction_rating', 'is', null)
      ]);

      const avgSatisfaction = satisfactionResult.data?.length > 0
        ? satisfactionResult.data.reduce((acc, conv) => acc + conv.satisfaction_rating, 0) / satisfactionResult.data.length
        : 0;

      setStats({
        total: totalResult.count || 0,
        withLeads: withLeadsResult.count || 0,
        avgSatisfaction: avgSatisfaction.toFixed(1),
        todayCount: todayResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      const { data: chatbots } = await supabase
        .from('chatbots')
        .select('id, name')
        .eq('organization_id', organization.id);
      
      const chatbotIds = chatbots?.map(c => c.id) || [];
      
      if (chatbotIds.length === 0) {
        setConversations([]);
        return;
      }

      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .in('chatbot_id', chatbotIds)
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const conversationsWithChatbotNames = data?.map(conv => ({
        ...conv,
        chatbot_name: chatbots.find(c => c.id === conv.chatbot_id)?.name || 'Unknown'
      })) || [];
      
      setConversations(conversationsWithChatbotNames);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('turn_number', { ascending: true })
        .order('role_order', { ascending: true });

      if (error) throw error;

      setConversationMessages(prev => ({
        ...prev,
        [conversationId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const toggleConversationExpansion = async (conversationId) => {
    if (expandedConversation === conversationId) {
      setExpandedConversation(null);
    } else {
      setExpandedConversation(conversationId);
      if (!conversationMessages[conversationId]) {
        await fetchConversationMessages(conversationId);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startedAt, endedAt) => {
    if (!startedAt || !endedAt) return 'N/A';
    const duration = new Date(endedAt) - new Date(startedAt);
    const minutes = Math.floor(duration / 60000);
    return `${minutes} min`;
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      (conv.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       conv.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       conv.conversation_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       conv.session_id?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'with_leads' && conv.email) ||
      (filterType === 'no_leads' && !conv.email) ||
      (filterType === 'high_satisfaction' && conv.satisfaction_rating >= 4);
    
    return matchesSearch && matchesFilter;
  });

  const saveAgntConfig = async () => {
    setIsSaving(true);
    // TODO: Save to database
    setTimeout(() => {
      setIsSaving(false);
      alert('Configuration saved successfully!');
    }, 1000);
  };

  const primaryColor = branding?.primary_color || '#ea580c';

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">Chat AGNT</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your AI chatbot conversations and configuration
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'conversations'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              style={activeTab === 'conversations' && primaryColor ? 
                { borderBottomColor: primaryColor, color: primaryColor } : {}}
            >
              Conversations
            </button>
            <button
              onClick={() => setActiveTab('configuration')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'configuration'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              style={activeTab === 'configuration' && primaryColor ? 
                { borderBottomColor: primaryColor, color: primaryColor } : {}}
            >
              AGNT Configuration
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'conversations' ? (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500 animate-shimmer"></div>
                <div className="relative z-10">
                  <MessageSquare className="h-8 w-8 text-blue-500 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-500">Total Conversations</div>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-500 animate-shimmer"></div>
                <div className="relative z-10">
                  <User className="h-8 w-8 text-green-500 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.withLeads}</div>
                  <div className="text-sm text-gray-500">Converted to Leads</div>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-500 animate-shimmer"></div>
                <div className="relative z-10">
                  <Star className="h-8 w-8 text-purple-500 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.avgSatisfaction}</div>
                  <div className="text-sm text-gray-500">Avg Satisfaction</div>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-500 animate-shimmer"></div>
                <div className="relative z-10">
                  <Calendar className="h-8 w-8 text-orange-500 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.todayCount}</div>
                  <div className="text-sm text-gray-500">Today's Chats</div>
                </div>
              </div>
            </div>

            {/* Conversations List */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/80 shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="search"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">All Conversations</option>
                      <option value="with_leads">With Lead Info</option>
                      <option value="no_leads">No Lead Info</option>
                      <option value="high_satisfaction">High Satisfaction</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading conversations...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No conversations found</div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div key={conversation.id} className="hover:bg-gray-50 transition-colors">
                      {/* Conversation Summary Row */}
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => toggleConversationExpansion(conversation.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              {conversation.lead_name || conversation.visitor_name ? (
                                <span className="font-medium text-gray-900">
                                  {conversation.lead_name || conversation.visitor_name}
                                </span>
                              ) : (
                                <span className="font-medium text-gray-500">
                                  Anonymous Visitor
                                </span>
                              )}
                              
                              {conversation.email && (
                                <span className="text-sm text-gray-500">{conversation.email}</span>
                              )}
                              
                              {conversation.email ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Lead Captured
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  No Lead Info
                                </span>
                              )}
                            </div>

                            {/* Lead Details if available */}
                            {(conversation.phone || conversation.zip_code || conversation.company) && (
                              <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
                                {conversation.phone && (
                                  <span className="flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {conversation.phone}
                                  </span>
                                )}
                                {conversation.zip_code && (
                                  <span className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {conversation.zip_code}
                                  </span>
                                )}
                                {conversation.company && (
                                  <span className="flex items-center">
                                    <Building className="h-3 w-3 mr-1" />
                                    {conversation.company}
                                  </span>
                                )}
                                {conversation.profession && (
                                  <span className="flex items-center">
                                    <Briefcase className="h-3 w-3 mr-1" />
                                    {conversation.profession}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Conversation Summary */}
                            {conversation.conversation_summary && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {conversation.conversation_summary}
                              </p>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(conversation.started_at)}
                              </span>
                              <span className="flex items-center">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {conversation.message_count || 0} messages
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDuration(conversation.started_at, conversation.ended_at)}
                              </span>
                              {conversation.satisfaction_rating && (
                                <span className="flex items-center">
                                  <Star className="h-3 w-3 mr-1" />
                                  {conversation.satisfaction_rating}/5
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="ml-4 flex items-center">
                            {expandedConversation === conversation.id ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Messages Section */}
                      {expandedConversation === conversation.id && (
                        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                          <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                            {conversationMessages[conversation.id]?.length > 0 ? (
                              conversationMessages[conversation.id].map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-2xl px-4 py-2 rounded-lg ${
                                      message.role === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white border border-gray-200 text-gray-800'
                                    }`}
                                  >
                                    <div className="flex items-center mb-1">
                                      {message.role === 'user' ? (
                                        <User className="h-4 w-4 mr-1" />
                                      ) : (
                                        <Bot className="h-4 w-4 mr-1" />
                                      )}
                                      <span className="text-xs font-medium">
                                        {message.role === 'user' ? 'Visitor' : 'AGNT'}
                                      </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                Loading messages...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* AGNT Configuration Tab */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/80 shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AGNT Settings</h2>
              
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Basic Configuration
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AGNT Name
                    </label>
                    <input
                      type="text"
                      value={agntConfig.agnt_name}
                      onChange={(e) => setAgntConfig({ ...agntConfig, agnt_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Support Email (for escalation)
                    </label>
                    <input
                      type="email"
                      value={agntConfig.support_email}
                      onChange={(e) => setAgntConfig({ ...agntConfig, support_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AGNT Logo (32x32px recommended)
                    </label>
                    <div className="flex items-center space-x-3">
                      {agntConfig.agnt_logo && (
                        <img 
                          src={agntConfig.agnt_logo} 
                          alt="AGNT Logo" 
                          className="w-8 h-8 rounded object-cover border border-gray-300"
                        />
                      )}
                      <label className="flex items-center px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <Upload className="h-4 w-4 mr-2 text-gray-600" />
                        <span className="text-sm text-gray-700">Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      {agntConfig.agnt_logo && (
                        <button
                          onClick={() => setAgntConfig({ ...agntConfig, agnt_logo: null })}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appearance Settings */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Appearance
                  </h3>
                  
                  {/* Widget Size */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Widget Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['small', 'medium', 'large'].map((size) => (
                        <button
                          key={size}
                          onClick={() => setAgntConfig({ ...agntConfig, widget_size: size })}
                          className={`px-3 py-2 rounded-lg border text-sm capitalize transition-all ${
                            agntConfig.widget_size === size
                              ? 'border-orange-500 bg-orange-50 text-orange-600'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {agntConfig.widget_size === 'small' && 'Compact: 280x400px - Best for mobile'}
                      {agntConfig.widget_size === 'medium' && 'Standard: 350x500px - Recommended'}
                      {agntConfig.widget_size === 'large' && 'Large: 400x600px - Best for desktop'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Primary Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={agntConfig.primary_color}
                          onChange={(e) => setAgntConfig({ ...agntConfig, primary_color: e.target.value })}
                          className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={agntConfig.primary_color}
                          onChange={(e) => setAgntConfig({ ...agntConfig, primary_color: e.target.value })}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Text Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={agntConfig.text_color}
                          onChange={(e) => setAgntConfig({ ...agntConfig, text_color: e.target.value })}
                          className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={agntConfig.text_color}
                          onChange={(e) => setAgntConfig({ ...agntConfig, text_color: e.target.value })}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Animation Style */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Entrance Animation</label>
                    <select
                      value={agntConfig.bubble_animation}
                      onChange={(e) => setAgntConfig({ ...agntConfig, bubble_animation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="bounce">Bounce</option>
                      <option value="fade">Fade In</option>
                      <option value="slide">Slide Up</option>
                      <option value="scale">Scale</option>
                    </select>
                  </div>
                </div>

                {/* Chat Widget Settings */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages & Content
                  </h3>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Welcome Message</label>
                    <textarea
                      rows="2"
                      value={agntConfig.welcome_message}
                      onChange={(e) => setAgntConfig({ ...agntConfig, welcome_message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  {/* Offline Message */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Offline Message</label>
                    <textarea
                      rows="2"
                      value={agntConfig.offline_message}
                      onChange={(e) => setAgntConfig({ ...agntConfig, offline_message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Shown when outside business hours"
                    />
                  </div>
                  
                  {/* Initial Greeting */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Initial Greeting Bubble</label>
                    <input
                      type="text"
                      value={agntConfig.initial_greeting}
                      onChange={(e) => setAgntConfig({ ...agntConfig, initial_greeting: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Shows before chat is opened"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Widget Position</label>
                    <select
                      value={agntConfig.widget_position}
                      onChange={(e) => setAgntConfig({ ...agntConfig, widget_position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                    </select>
                  </div>
                  
                  {/* Language Selection */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Language</label>
                    <select
                      value={agntConfig.language}
                      onChange={(e) => setAgntConfig({ ...agntConfig, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="pt">Portuguese</option>
                      <option value="it">Italian</option>
                    </select>
                  </div>
                </div>

                {/* Business Hours Section */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Business Hours
                  </h3>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={agntConfig.business_hours_enabled}
                      onChange={(e) => setAgntConfig({ ...agntConfig, business_hours_enabled: e.target.checked })}
                      className="h-4 w-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Enable Business Hours</span>
                  </label>
                  
                  {agntConfig.business_hours_enabled && (
                    <div className="space-y-2 pl-4">
                      {Object.entries(agntConfig.business_hours).map(([day, hours]) => (
                        <div key={day} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={hours.enabled}
                            onChange={(e) => setAgntConfig({
                              ...agntConfig,
                              business_hours: {
                                ...agntConfig.business_hours,
                                [day]: { ...hours, enabled: e.target.checked }
                              }
                            })}
                            className="h-4 w-4 text-orange-600 rounded"
                          />
                          <span className="text-sm text-gray-700 w-20 capitalize">{day}</span>
                          <input
                            type="time"
                            value={hours.start}
                            onChange={(e) => setAgntConfig({
                              ...agntConfig,
                              business_hours: {
                                ...agntConfig.business_hours,
                                [day]: { ...hours, start: e.target.value }
                              }
                            })}
                            disabled={!hours.enabled}
                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <input
                            type="time"
                            value={hours.end}
                            onChange={(e) => setAgntConfig({
                              ...agntConfig,
                              business_hours: {
                                ...agntConfig.business_hours,
                                [day]: { ...hours, end: e.target.value }
                              }
                            })}
                            disabled={!hours.enabled}
                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Feature Toggles */}
                <div className="space-y-3 border-t pt-4">
                  <h3 className="font-medium text-gray-900 flex items-center mb-2">
                    <Sliders className="h-4 w-4 mr-2" />
                    Features
                  </h3>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={agntConfig.auto_open}
                      onChange={(e) => setAgntConfig({ ...agntConfig, auto_open: e.target.checked })}
                      className="h-4 w-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Auto-open after {agntConfig.auto_open_delay} seconds</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={agntConfig.show_typing_indicator}
                      onChange={(e) => setAgntConfig({ ...agntConfig, show_typing_indicator: e.target.checked })}
                      className="h-4 w-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Show typing indicator</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={agntConfig.sound_notifications}
                      onChange={(e) => setAgntConfig({ ...agntConfig, sound_notifications: e.target.checked })}
                      className="h-4 w-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Sound notifications</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={agntConfig.enable_file_uploads}
                      onChange={(e) => setAgntConfig({ ...agntConfig, enable_file_uploads: e.target.checked })}
                      className="h-4 w-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Enable file uploads</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={agntConfig.enable_emoji_picker}
                      onChange={(e) => setAgntConfig({ ...agntConfig, enable_emoji_picker: e.target.checked })}
                      className="h-4 w-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Enable emoji picker</span>
                  </label>
                </div>
              </div>

              <button
                onClick={saveAgntConfig}
                disabled={isSaving}
                className="w-full mt-6 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>

            {/* Preview Panel */}
            <div className="bg-gray-100 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPreviewState('closed')}
                    className={`px-3 py-1 text-sm rounded ${
                      previewState === 'closed' 
                        ? 'bg-white text-gray-900 shadow' 
                        : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    Closed
                  </button>
                  <button
                    onClick={() => setPreviewState('open')}
                    className={`px-3 py-1 text-sm rounded ${
                      previewState === 'open' 
                        ? 'bg-white text-gray-900 shadow' 
                        : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    Open
                  </button>
                </div>
              </div>
              
              <div className="relative bg-white rounded-lg shadow-lg h-[600px] overflow-hidden">
                {/* Mock Website Background */}
                <div className="p-6">
                  <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                  </div>
                </div>
                
                {/* Initial Greeting Bubble (shows when closed) */}
                {previewState === 'closed' && agntConfig.initial_greeting && (
                  <div className={`absolute ${
                    agntConfig.widget_position === 'bottom-right' ? 'bottom-20 right-4' :
                    agntConfig.widget_position === 'bottom-left' ? 'bottom-20 left-4' :
                    agntConfig.widget_position === 'top-right' ? 'top-20 right-4' :
                    'top-20 left-4'
                  }`}>
                    <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs animate-bounce">
                      <p className="text-sm text-gray-700">{agntConfig.initial_greeting}</p>
                      <div className="absolute bottom-0 right-4 w-3 h-3 bg-white transform rotate-45 translate-y-1.5"></div>
                    </div>
                  </div>
                )}
                
                {/* Chat Widget Preview */}
                <div className={`absolute ${
                  agntConfig.widget_position === 'bottom-right' ? 'bottom-4 right-4' :
                  agntConfig.widget_position === 'bottom-left' ? 'bottom-4 left-4' :
                  agntConfig.widget_position === 'top-right' ? 'top-4 right-4' :
                  'top-4 left-4'
                }`}>
                  {previewState === 'closed' ? (
                    /* Closed Widget with Logo */
                    <div
                      className={`rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center`}
                      style={{ 
                        backgroundColor: agntConfig.primary_color,
                        width: widgetSizes[agntConfig.widget_size].buttonSize,
                        height: widgetSizes[agntConfig.widget_size].buttonSize,
                      }}
                    >
                      {agntConfig.agnt_logo ? (
                        <img 
                          src={agntConfig.agnt_logo} 
                          alt="Chat" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <MessageSquare 
                          className={`$
                            {agntConfig.widget_size === 'small' ? 'w-5 h-5' :
                            agntConfig.widget_size === 'medium' ? 'w-6 h-6' :
                            'w-7 h-7'}
                          `} 
                          style={{ color: agntConfig.text_color }} 
                        />
                      )}
                    </div>
                  ) : (
                    /* Open Chat Window */
                    <div 
                      className="bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col"
                      style={{
                        width: widgetSizes[agntConfig.widget_size].width,
                        height: widgetSizes[agntConfig.widget_size].height,
                      }}
                    >
                      {/* Chat Header */}
                      <div
                        className="p-4 rounded-t-lg flex items-center justify-between"
                        style={{ backgroundColor: agntConfig.primary_color }}
                      >
                        <div className="flex items-center">
                          {agntConfig.agnt_logo ? (
                            <img 
                              src={agntConfig.agnt_logo} 
                              alt={agntConfig.agnt_name} 
                              className="h-6 w-6 rounded-full object-cover mr-2"
                            />
                          ) : (
                            <Bot className="h-5 w-5 mr-2" style={{ color: agntConfig.text_color }} />
                          )}
                          <span 
                            className="font-semibold" 
                            style={{ 
                              color: agntConfig.text_color,
                              fontSize: widgetSizes[agntConfig.widget_size].fontSize 
                            }}
                          >
                            {agntConfig.agnt_name}
                          </span>
                        </div>
                        <button className="hover:opacity-80" style={{ color: agntConfig.text_color }}>
                          ✕
                        </button>
                      </div>
                      
                      {/* Online/Offline Status */}
                      {agntConfig.business_hours_enabled && (
                        <div className="bg-gray-50 px-4 py-2 border-b text-xs flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-gray-600">We're online</span>
                        </div>
                      )}
                      
                      {/* Chat Messages */}
                      <div className="flex-1 p-4 overflow-y-auto">
                        <div className="bg-gray-100 rounded-lg p-3 mb-3">
                          <p className="text-sm" style={{ fontSize: widgetSizes[agntConfig.widget_size].fontSize }}>
                            {agntConfig.welcome_message}
                          </p>
                        </div>
                        {agntConfig.show_typing_indicator && (
                          <div className="bg-gray-100 rounded-lg p-3 inline-block">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Chat Input */}
                      <div className="p-4 border-t">
                        <div className="flex items-center space-x-2">
                          {agntConfig.enable_file_uploads && (
                            <button className="text-gray-400 hover:text-gray-600">
                              <Paperclip className="h-5 w-5" />
                            </button>
                          )}
                          <input
                            type="text"
                            placeholder="Type your message..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            style={{ fontSize: widgetSizes[agntConfig.widget_size].fontSize }}
                          />
                          {agntConfig.enable_emoji_picker && (
                            <button className="text-gray-400 hover:text-gray-600">
                              <Smile className="h-5 w-5" />
                            </button>
                          )}
                          <button 
                            className="p-2 rounded-lg transition-colors"
                            style={{ backgroundColor: agntConfig.primary_color }}
                          >
                            <Send className="h-4 w-4" style={{ color: agntConfig.text_color }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
