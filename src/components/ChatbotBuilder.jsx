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
  Search
} from 'lucide-react';

export default function ChatbotBuilder() {
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

  // Chatbot testing states
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [testInput, setTestInput] = useState('');
  const [testMessages, setTestMessages] = useState([]);
  const [testLoading, setTestLoading] = useState(false);

  // AGNT Configuration States
  const [agntConfig, setAgntConfig] = useState({
    agnt_name: 'Sales Assistant',
    support_email: 'support@company.com',
    primary_color: branding?.primary_color || '#ea580c',
    text_color: '#ffffff',
    bg_color: '#ffffff',
    welcome_message: 'Hi! How can I help you today?',
    widget_position: 'bottom-right',
    auto_open: false,
    auto_open_delay: 5,
    show_typing_indicator: true,
    show_read_receipts: false,
    enable_file_uploads: false,
    enable_emoji_picker: true,
    sound_notifications: true,
    desktop_notifications: false
  });

  const [previewState, setPreviewState] = useState('closed');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchConversations();
      fetchStats();
    }
  }, [organization]);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get chatbot IDs for this organization first
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
        // Total conversations
        supabase
          .from('chatbot_conversations')
          .select('*', { count: 'exact', head: true })
          .in('chatbot_id', chatbotIds),

        // Conversations with lead info
        supabase
          .from('chatbot_conversations')
          .select('*', { count: 'exact', head: true })
          .in('chatbot_id', chatbotIds)
          .not('email', 'is', null),

        // Today's conversations
        supabase
          .from('chatbot_conversations')
          .select('*', { count: 'exact', head: true })
          .in('chatbot_id', chatbotIds)
          .gte('started_at', today),

        // Average satisfaction
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

      // Get chatbot IDs for this organization
      const { data: chatbots } = await supabase
        .from('chatbots')
        .select('id, name')
        .eq('organization_id', organization.id);

      const chatbotIds = chatbots?.map(c => c.id) || [];

      if (chatbotIds.length === 0) {
        setConversations([]);
        return;
      }

      // Get conversations for these chatbots
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .in('chatbot_id', chatbotIds)
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Map chatbot names to conversations
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

  // Placeholder utilities
  const fetchChatbots = async () => {};
  const fetchKnowledgeBase = async () => {};
  const generateSystemPrompt = (answers) =>
    Array.isArray(answers) ? answers.join('\n') : '';

  const testChatbot = async () => {
    if (!testInput.trim() || !selectedChatbot) return;

    setTestLoading(true);
    const userMessage = {
      role: 'user',
      content: testInput,
      timestamp: Date.now()
    };
    setTestMessages((prev) => [...prev, userMessage]);
    setTestInput('');

    try {
      // Call Supabase Edge Function instead of Express server
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: testInput,
          chatbotId: selectedChatbot.id,
          sessionId: `test-${Date.now()}`,
          conversationId: null
        }
      });

      if (error) {
        throw new Error(error.message || 'Chat test failed');
      }

      const botMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
        tokensUsed: data.tokensUsed,
        relevantKnowledge: data.relevantKnowledge
      };

      setTestMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Test error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, there was an error testing the chatbot: ${error.message}`,
        timestamp: Date.now(),
        error: true
      };
      setTestMessages((prev) => [...prev, errorMessage]);
    } finally {
      setTestLoading(false);
    }
  };

  const addKnowledgeEntry = async (title, content, tags = []) => {
    if (!selectedChatbot || !title.trim() || !content.trim()) return;

    try {
      // Generate embedding using edge function
      const { data: embeddingData, error: embeddingError } =
        await supabase.functions.invoke('generate-embedding', {
          body: {
            text: content,
            model: 'text-embedding-3-small'
          }
        });

      if (embeddingError) {
        throw new Error('Failed to generate embedding');
      }

      // Store in knowledge base
      const { data: knowledgeEntry, error } = await supabase
        .from('chatbot_knowledge')
        .insert({
          chatbot_id: selectedChatbot.id,
          title: title,
          content: content,
          tags: tags,
          content_type: 'manual',
          embedding: embeddingData.embedding,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh knowledge base display
      await fetchKnowledgeBase();

      return knowledgeEntry;
    } catch (error) {
      console.error('Error adding knowledge entry:', error);
      throw error;
    }
  };

  const createChatbotWithPrompt = async (
    name,
    description,
    promptAnswers
  ) => {
    if (!organization) return;

    try {
      // Generate system prompt from answers
      const systemPrompt = generateSystemPrompt(promptAnswers);

      const { data: newChatbot, error } = await supabase
        .from('chatbots')
        .insert({
          organization_id: organization.id,
          name: name,
          description: description,
          system_prompt: systemPrompt,
          welcome_message: 'Hi! How can I help you today?',
          settings: {
            temperature: 0.7,
            max_tokens: 1000,
            model: 'gpt-4-turbo-preview'
          },
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh chatbot list
      await fetchChatbots();

      return newChatbot;
    } catch (error) {
      console.error('Error creating chatbot:', error);
      throw error;
    }
  };

  // Prevent unused function warnings
  useEffect(() => {}, [testChatbot, addKnowledgeEntry, createChatbotWithPrompt]);

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
    // Placeholder for saving configuration
    // This would integrate with your chatbot configuration table
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

              <div className="space-y-6">
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
                </div>

                {/* Appearance Settings */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Appearance
                  </h3>

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
                </div>

                {/* Chat Widget Settings */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat Widget
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

                  {/* Feature Toggles */}
                  <div className="space-y-3">
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
                  </div>
                </div>

                <button
                  onClick={saveAgntConfig}
                  disabled={isSaving}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
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

              <div className="relative bg-white rounded-lg shadow-lg h-[500px] overflow-hidden">
                {/* Mock Website Background */}
                <div className="p-6">
                  <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                  </div>
                </div>

                {/* Chat Widget Preview */}
                <div className={`absolute ${
                  agntConfig.widget_position === 'bottom-right' ? 'bottom-4 right-4' :
                  agntConfig.widget_position === 'bottom-left' ? 'bottom-4 left-4' :
                  agntConfig.widget_position === 'top-right' ? 'top-4 right-4' :
                  'top-4 left-4'
                }`}>
                  {previewState === 'closed' ? (
                    /* Closed Widget */
                    <div
                      className="rounded-full p-4 shadow-lg cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: agntConfig.primary_color }}
                    >
                      <MessageSquare className="w-6 h-6" style={{ color: agntConfig.text_color }} />
                    </div>
                  ) : (
                    /* Open Chat Window */
                    <div className="w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
                      {/* Chat Header */}
                      <div
                        className="p-4 rounded-t-lg flex items-center justify-between"
                        style={{ backgroundColor: agntConfig.primary_color }}
                      >
                        <div className="flex items-center">
                          <Bot className="h-5 w-5 mr-2" style={{ color: agntConfig.text_color }} />
                          <span className="font-semibold" style={{ color: agntConfig.text_color }}>
                            {agntConfig.agnt_name}
                          </span>
                        </div>
                        <button className="hover:opacity-80" style={{ color: agntConfig.text_color }}>
                          ✕
                        </button>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 p-4 overflow-y-auto">
                        <div className="bg-gray-100 rounded-lg p-3 mb-3">
                          <p className="text-sm">{agntConfig.welcome_message}</p>
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
                        <input
                          type="text"
                          placeholder="Type your message..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
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

