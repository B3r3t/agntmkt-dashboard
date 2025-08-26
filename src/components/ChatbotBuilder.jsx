import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { 
  MessageSquare, ChevronDown, ChevronUp, Phone, MapPin,
  Building, Briefcase, Calendar, Star, Clock, User, Bot,
  Settings, Eye, Search, Upload, Sliders, Paperclip, Smile,
  Send, FileText, Code, Palette, Plus, X, Copy, Check,
  Database, Mail, ExternalLink, Loader2, AlertCircle
} from 'lucide-react';

export default function ChatbotBuilder() {
  const { organization, branding } = useOrganization();
  
  // Main navigation state - now includes conversations as main tab
  const [mainTab, setMainTab] = useState('conversations');
  const [configSubTab, setConfigSubTab] = useState('overview');
  
  // Existing chatbot states
  const [chatbots, setChatbots] = useState([]);
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Conversation states (from ChatbotConversations)
  const [conversations, setConversations] = useState([]);
  const [expandedConversation, setExpandedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    withLeads: 0,
    avgSatisfaction: 0,
    todayCount: 0
  });
  
  // Knowledge base states (keep existing)
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [newKnowledgeTitle, setNewKnowledgeTitle] = useState('');
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('');
  
  // Test chat states (keep existing)
  const [testMessages, setTestMessages] = useState([]);
  const [testInput, setTestInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  
  // Appearance configuration state (NEW - consolidated)
  const [appearanceConfig, setAppearanceConfig] = useState({
    // Basic settings
    agnt_name: 'Sales Assistant',
    support_email: 'support@company.com',
    agnt_logo: null,
    
    // Widget appearance
    primary_color: branding?.primary_color || '#ea580c',
    text_color: '#ffffff',
    bg_color: '#ffffff',
    widget_size: 'medium',
    widget_position: 'bottom-right',
    bubble_animation: 'bounce',
    
    // Messages
    welcome_message: 'Hi! How can I help you today?',
    offline_message: 'We\'re currently offline. Please leave a message!',
    initial_greeting: 'Have a question? Click here to chat!',
    
    // Features
    show_typing_indicator: true,
    enable_file_uploads: false,
    enable_emoji_picker: true,
    sound_notifications: true,
    
    // Business hours
    business_hours_enabled: false,
    business_hours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '17:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' }
    }
  });
  
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);
  const [appearancePreviewState, setAppearancePreviewState] = useState('closed');
  
  // Initialize - fetch chatbots
  useEffect(() => {
    if (organization?.id) {
      fetchChatbots();
    }
  }, [organization]);
  
  // Fetch all chatbots for the organization
  const fetchChatbots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select(`
          *,
          chatbot_knowledge(count),
          chatbot_conversations(count)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setChatbots(data || []);
      
      // Auto-select first chatbot if none selected
      if (data?.length > 0 && !selectedChatbot) {
        setSelectedChatbot(data[0]);
      }
    } catch (error) {
      console.error('Error fetching chatbots:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // When chatbot is selected, load its data
  useEffect(() => {
    if (selectedChatbot?.id) {
      // Load conversations if on conversations tab
      if (mainTab === 'conversations') {
        fetchConversations();
      }
      
      // Load configuration data
      if (mainTab === 'configuration') {
        fetchKnowledgeBase();
        loadChatbotSettings();
      }
    }
  }, [selectedChatbot, mainTab]);
  
  // Fetch conversations with proper stats
  const fetchConversations = async () => {
    if (!selectedChatbot) return;
    
    setConversationsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select(`
          id,
          session_id,
          visitor_name,
          visitor_email,
          started_at,
          ended_at,
          message_count,
          satisfaction_rating,
          conversation_summary,
          lead_name,
          email,
          phone,
          company,
          collected_at
        `)
        .eq('chatbot_id', selectedChatbot.id)
        .order('started_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      setConversations(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setConversationsLoading(false);
    }
  };
  
  // Calculate conversation statistics
  const calculateStats = (convData) => {
    const today = new Date().toDateString();
    const todayConvs = convData.filter(c => 
      new Date(c.started_at || c.collected_at).toDateString() === today
    );
    
    const withLeads = convData.filter(c => 
      c.email || c.visitor_email || c.lead_name
    );
    
    const ratings = convData
      .filter(c => c.satisfaction_rating)
      .map(c => c.satisfaction_rating);
    
    setStats({
      total: convData.length,
      withLeads: withLeads.length,
      avgSatisfaction: ratings.length > 0 
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : 0,
      todayCount: todayConvs.length
    });
  };
  
  // Fetch messages for a specific conversation (lazy load)
  const fetchConversationMessages = async (conversationId) => {
    if (conversationMessages[conversationId]) return;
    
    try {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setConversationMessages(prev => ({
        ...prev,
        [conversationId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      setConversationMessages(prev => ({
        ...prev,
        [conversationId]: []
      }));
    }
  };
  
  // Toggle conversation expansion
  const toggleConversation = async (convId) => {
    if (expandedConversation === convId) {
      setExpandedConversation(null);
    } else {
      setExpandedConversation(convId);
      await fetchConversationMessages(convId);
    }
  };
  
  // Fetch knowledge base items
  const fetchKnowledgeBase = async () => {
    if (!selectedChatbot) return;
    
    try {
      const { data, error } = await supabase
        .from('chatbot_knowledge')
        .select('*')
        .eq('chatbot_id', selectedChatbot.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setKnowledgeItems(data || []);
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
    }
  };
  
  // Load chatbot settings including appearance
  const loadChatbotSettings = async () => {
    if (!selectedChatbot) return;
    
    try {
      // Load widget settings from chatbot
      if (selectedChatbot.widget_settings) {
        setAppearanceConfig(prev => ({
          ...prev,
          ...selectedChatbot.widget_settings,
          agnt_name: selectedChatbot.name,
          primary_color: selectedChatbot.theme_color || prev.primary_color,
          welcome_message: selectedChatbot.welcome_message || prev.welcome_message
        }));
      }
      
      // Load organization branding as defaults
      const { data: brandingData } = await supabase
        .from('client_branding')
        .select('*')
        .eq('organization_id', organization.id)
        .single();
      
      if (brandingData && !selectedChatbot.widget_settings) {
        setAppearanceConfig(prev => ({
          ...prev,
          primary_color: brandingData.primary_color || prev.primary_color,
          secondary_color: brandingData.secondary_color,
          accent_color: brandingData.accent_color,
          font_family: brandingData.font_family,
          agnt_logo: brandingData.logo_url
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  // Save appearance configuration
  const saveAppearanceConfig = async () => {
    if (!selectedChatbot) return;
    
    setIsSavingAppearance(true);
    try {
      // Prepare widget_settings object
      const widgetSettings = {
        widget_size: appearanceConfig.widget_size,
        widget_position: appearanceConfig.widget_position,
        bubble_animation: appearanceConfig.bubble_animation,
        text_color: appearanceConfig.text_color,
        bg_color: appearanceConfig.bg_color,
        show_typing_indicator: appearanceConfig.show_typing_indicator,
        enable_file_uploads: appearanceConfig.enable_file_uploads,
        enable_emoji_picker: appearanceConfig.enable_emoji_picker,
        sound_notifications: appearanceConfig.sound_notifications,
        initial_greeting: appearanceConfig.initial_greeting,
        offline_message: appearanceConfig.offline_message,
        business_hours_enabled: appearanceConfig.business_hours_enabled,
        business_hours: appearanceConfig.business_hours,
        support_email: appearanceConfig.support_email,
        agnt_logo: appearanceConfig.agnt_logo
      };
      
      // Update chatbot record
      const { error } = await supabase
        .from('chatbots')
        .update({
          name: appearanceConfig.agnt_name,
          theme_color: appearanceConfig.primary_color,
          welcome_message: appearanceConfig.welcome_message,
          widget_settings: widgetSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedChatbot.id);
      
      if (error) throw error;
      
      // Update local state
      setSelectedChatbot(prev => ({
        ...prev,
        name: appearanceConfig.agnt_name,
        theme_color: appearanceConfig.primary_color,
        welcome_message: appearanceConfig.welcome_message,
        widget_settings: widgetSettings
      }));
      
      alert('Appearance settings saved successfully!');
    } catch (error) {
      console.error('Error saving appearance:', error);
      alert('Failed to save appearance settings');
    } finally {
      setIsSavingAppearance(false);
    }
  };
  
  // Test chat function
  const testChatbot = async () => {
    if (!testInput.trim() || !selectedChatbot) return;
    
    setTestLoading(true);
    const userMessage = { 
      role: 'user', 
      content: testInput, 
      timestamp: Date.now() 
    };
    
    setTestMessages(prev => [...prev, userMessage]);
    setTestInput('');
    
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: testInput,
          chatbotId: selectedChatbot.id,
          sessionId: `test-${Date.now()}`,
          conversationId: null
        }
      });
      
      if (error) throw error;
      
      const botMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
        tokensUsed: data.tokensUsed,
        relevantKnowledge: data.relevantKnowledge
      };
      
      setTestMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Test error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, there was an error: ${error.message}`,
        timestamp: Date.now(),
        error: true
      };
      setTestMessages(prev => [...prev, errorMessage]);
    } finally {
      setTestLoading(false);
    }
  };
  
  // Add knowledge entry
  const addKnowledgeEntry = async () => {
    if (!selectedChatbot || !newKnowledgeTitle.trim() || !newKnowledgeContent.trim()) return;
    
    try {
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embedding', {
        body: {
          text: newKnowledgeContent,
          model: 'text-embedding-3-small'
        }
      });
      
      if (embeddingError) throw embeddingError;
      
      const { error } = await supabase
        .from('chatbot_knowledge')
        .insert({
          chatbot_id: selectedChatbot.id,
          title: newKnowledgeTitle,
          content: newKnowledgeContent,
          content_type: 'manual',
          embedding: embeddingData.embedding,
          is_active: true
        });
      
      if (error) throw error;
      
      await fetchKnowledgeBase();
      setNewKnowledgeTitle('');
      setNewKnowledgeContent('');
      setShowAddKnowledge(false);
      
      alert('Knowledge entry added successfully!');
    } catch (error) {
      console.error('Error adding knowledge:', error);
      alert('Failed to add knowledge entry');
    }
  };
  
  // Format date helper
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      (conv.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       conv.visitor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       conv.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       conv.visitor_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       conv.conversation_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       conv.session_id?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'with_leads' && (conv.email || conv.visitor_email)) ||
      (filterType === 'no_leads' && !conv.email && !conv.visitor_email) ||
      (filterType === 'high_satisfaction' && conv.satisfaction_rating >= 4);
    
    return matchesSearch && matchesFilter;
  });
  
  const primaryColor = appearanceConfig.primary_color || branding?.primary_color || '#ea580c';
  
  // Main render
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header with chatbot selector */}
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">Chat AGNT</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your AI chatbot conversations and configuration
            </p>
          </div>
          
          {/* Chatbot selector or create button */}
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            {chatbots.length > 0 ? (
              <select
                value={selectedChatbot?.id || ''}
                onChange={(e) => {
                  const bot = chatbots.find(b => b.id === e.target.value);
                  setSelectedChatbot(bot);
                  setTestMessages([]); // Clear test messages on switch
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select a chatbot</option>
                {chatbots.map(bot => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Chatbot
              </button>
            )}
          </div>
        </div>
        
        {/* Only show tabs if we have a selected chatbot */}
        {selectedChatbot ? (
          <>
            {/* Main Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setMainTab('conversations')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    mainTab === 'conversations'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  style={mainTab === 'conversations' ? 
                    { borderBottomColor: primaryColor, color: primaryColor } : {}}
                >
                  Conversations
                </button>
                <button
                  onClick={() => setMainTab('configuration')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    mainTab === 'configuration'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  style={mainTab === 'configuration' ? 
                    { borderBottomColor: primaryColor, color: primaryColor } : {}}
                >
                  AGNT Configuration
                </button>
              </nav>
            </div>
            
            {/* Tab Content */}
            {mainTab === 'conversations' ? (
              /* Conversations Tab Content */
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500"></div>
                    <MessageSquare className="h-8 w-8 text-blue-500 mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-500">Total Conversations</div>
                  </div>
                  
                  <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-500"></div>
                    <User className="h-8 w-8 text-green-500 mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats.withLeads}</div>
                    <div className="text-sm text-gray-500">Converted to Leads</div>
                  </div>
                  
                  <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-500"></div>
                    <Star className="h-8 w-8 text-purple-500 mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats.avgSatisfaction}</div>
                    <div className="text-sm text-gray-500">Avg Satisfaction</div>
                  </div>
                  
                  <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-500"></div>
                    <Calendar className="h-8 w-8 text-orange-500" />
                    <div className="text-2xl font-bold text-gray-900">{stats.todayCount}</div>
                    <div className="text-sm text-gray-500">Today's Chats</div>
                  </div>
                </div>
                
                {/* Conversations List */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/80 shadow-lg">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
                      <div className="flex gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="all">All Conversations</option>
                          <option value="with_leads">With Leads</option>
                          <option value="no_leads">No Lead Info</option>
                          <option value="high_satisfaction">High Satisfaction</option>
                        </select>
                      </div>
                    </div>
                    
                    {conversationsLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
                        <p className="mt-2 text-gray-500">Loading conversations...</p>
                      </div>
                    ) : filteredConversations.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No conversations found
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredConversations.map((conv) => (
                          <div
                            key={conv.id}
                            className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50/50 transition-all"
                          >
                            <div
                              className="cursor-pointer"
                              onClick={() => toggleConversation(conv.id)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">
                                      {conv.visitor_name || conv.lead_name || 'Anonymous Visitor'}
                                    </h3>
                                    {(conv.email || conv.visitor_email) && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Lead Captured
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                                    {(conv.email || conv.visitor_email) && (
                                      <span className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {conv.email || conv.visitor_email}
                                      </span>
                                    )}
                                    {conv.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {conv.phone}
                                      </span>
                                    )}
                                    {conv.company && (
                                      <span className="flex items-center gap-1">
                                        <Building className="h-3 w-3" />
                                        {conv.company}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {conv.conversation_summary && (
                                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                      {conv.conversation_summary}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500">
                                      {formatDate(conv.started_at || conv.collected_at)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {conv.message_count || 0} messages
                                    </p>
                                    {conv.satisfaction_rating && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                        <span className="text-xs">{conv.satisfaction_rating}/5</span>
                                      </div>
                                    )}
                                  </div>
                                  {expandedConversation === conv.id ? (
                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Expanded Messages */}
                            {expandedConversation === conv.id && (
                              <div className="mt-4 border-t pt-4">
                                <div className="max-h-96 overflow-y-auto space-y-3">
                                  {conversationMessages[conv.id] ? (
                                    conversationMessages[conv.id].length > 0 ? (
                                      conversationMessages[conv.id].map((message, idx) => (
                                        <div
                                          key={idx}
                                          className={`flex ${
                                            message.role === 'user' ? 'justify-end' : 'justify-start'
                                          }`}
                                        >
                                          <div
                                            className={`max-w-[70%] p-3 rounded-2xl ${
                                              message.role === 'user'
                                                ? 'bg-orange-500 text-white rounded-br-sm'
                                                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                            }`}
                                            style={message.role === 'user' ? 
                                              { backgroundColor: primaryColor } : {}}
                                          >
                                            <div className="flex items-center gap-1 mb-1">
                                              {message.role === 'user' ? (
                                                <User className="h-4 w-4" />
                                              ) : (
                                                <Bot className="h-4 w-4" />
                                              )}
                                              <span className="text-xs font-medium">
                                                {message.role === 'user' ? 'Visitor' : 'AGNT'}
                                              </span>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">
                                              {message.content}
                                            </p>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-center py-4 text-gray-500">
                                        No messages available
                                      </div>
                                    )
                                  ) : (
                                    <div className="text-center py-4">
                                      <Loader2 className="h-6 w-6 animate-spin text-orange-500 mx-auto" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Configuration Tab with Sub-tabs */
              <div>
                {/* Sub-tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-6">
                    {[
                      { key: 'overview', label: 'Overview', icon: Eye },
                      { key: 'knowledge', label: 'Knowledge Base', icon: Database },
                      { key: 'test', label: 'Test Chat', icon: MessageSquare },
                      { key: 'embed', label: 'Embed Code', icon: Code },
                      { key: 'appearance', label: 'Appearance', icon: Palette }
                    ].map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setConfigSubTab(tab.key)}
                          className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                            configSubTab === tab.key
                              ? 'border-orange-500 text-orange-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                          style={configSubTab === tab.key ? 
                            { borderBottomColor: primaryColor, color: primaryColor } : {}}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>
                
                {/* Sub-tab Content - Keep your existing content for each tab */}
                {configSubTab === 'overview' && (
                  /* Your existing Overview content */
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Chatbot Overview</h2>
                    {/* Keep your existing overview content */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Chatbot Name
                        </label>
                        <p className="mt-1 text-sm text-gray-900">{selectedChatbot.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          System Prompt
                        </label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                          {selectedChatbot.system_prompt}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Model
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedChatbot.chat_model || 'gpt-4-turbo-preview'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Knowledge Items
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {knowledgeItems.length} active items
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Total Conversations
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedChatbot.chatbot_conversations?.[0]?.count || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {configSubTab === 'knowledge' && (
                  /* Your existing Knowledge Base content */
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">Knowledge Base</h2>
                      <button
                        onClick={() => setShowAddKnowledge(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Knowledge
                      </button>
                    </div>
                    
                    {/* Keep your existing knowledge base list */}
                    <div className="space-y-3">
                      {knowledgeItems.map(item => (
                        <div key={item.id} className="border rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {item.content}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span>Type: {item.content_type}</span>
                            <span>Added: {formatDate(item.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Add Knowledge Modal */}
                    {showAddKnowledge && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                          <h3 className="text-lg font-semibold mb-4">Add Knowledge Entry</h3>
                          <input
                            type="text"
                            placeholder="Title"
                            value={newKnowledgeTitle}
                            onChange={(e) => setNewKnowledgeTitle(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg mb-3"
                          />
                          <textarea
                            placeholder="Content"
                            value={newKnowledgeContent}
                            onChange={(e) => setNewKnowledgeContent(e.target.value)}
                            rows="4"
                            className="w-full px-3 py-2 border rounded-lg mb-4"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={addKnowledgeEntry}
                              className="flex-1 bg-orange-600 text-white py-2 rounded-lg"
                              style={{ backgroundColor: primaryColor }}
                            >
                              Add
                            </button>
                            <button
                              onClick={() => {
                                setShowAddKnowledge(false);
                                setNewKnowledgeTitle('');
                                setNewKnowledgeContent('');
                              }}
                              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {configSubTab === 'test' && (
                  /* Enhanced Test Chat with proper styling */
                  <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/80 shadow-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Test Your Chatbot</h2>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 h-[500px] flex flex-col">
                      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                        {testMessages.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">Start a conversation to test your chatbot</p>
                          </div>
                        ) : (
                          testMessages.map((message, idx) => (
                            <div
                              key={idx}
                              className={`flex ${
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                              } animate-fade-in`}
                            >
                              <div className={`max-w-[70%] ${
                                message.role === 'user' ? 'order-2' : 'order-1'
                              }`}>
                                <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                                  message.role === 'user'
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-sm'
                                    : message.error
                                    ? 'bg-red-50 text-red-800 border border-red-200'
                                    : 'bg-white text-gray-900 rounded-bl-sm'
                                }`}
                                style={message.role === 'user' && !message.error ? {
                                  backgroundImage: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)`
                                } : {}}>
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                  {message.relevantKnowledge > 0 && (
                                    <p className="text-xs mt-2 opacity-70">
                                      Used {message.relevantKnowledge} knowledge items
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        
                        {testLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex gap-2">
                          <textarea
                            value={testInput}
                            onChange={(e) => setTestInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                testChatbot();
                              }
                            }}
                            placeholder="Type your test message..."
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            rows="1"
                          />
                          <button
                            onClick={() => testChatbot()}
                            disabled={testLoading || !testInput.trim()}
                            className="p-3 rounded-xl bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                          >
                            {testLoading ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {configSubTab === 'embed' && (
                  /* Your existing Embed Code content */
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Embed Code</h2>
                    {/* Keep your existing embed code content */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Widget Script
                        </label>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <code className="text-xs">
                            {`<script src="${window.location.origin}/chat-widget.js"></script>
<script>
  initChatWidget({
    chatbotId: '${selectedChatbot.id}',
    position: '${appearanceConfig.widget_position}'
  });
</script>`}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {configSubTab === 'appearance' && (
                  /* NEW Appearance Tab - Consolidated from ChatbotConversations */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Settings Panel */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-lg font-semibold mb-4">Appearance Settings</h2>
                      
                      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                        {/* Basic Configuration */}
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
                              value={appearanceConfig.agnt_name}
                              onChange={(e) => setAppearanceConfig({
                                ...appearanceConfig,
                                agnt_name: e.target.value
                              })}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Support Email
                            </label>
                            <input
                              type="email"
                              value={appearanceConfig.support_email}
                              onChange={(e) => setAppearanceConfig({
                                ...appearanceConfig,
                                support_email: e.target.value
                              })}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                        
                        {/* Widget Appearance */}
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-medium text-gray-900 flex items-center">
                            <Palette className="h-4 w-4 mr-2" />
                            Widget Appearance
                          </h3>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Widget Size
                            </label>
                            <select
                              value={appearanceConfig.widget_size}
                              onChange={(e) => setAppearanceConfig({
                                ...appearanceConfig,
                                widget_size: e.target.value
                              })}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="small">Small</option>
                              <option value="medium">Medium</option>
                              <option value="large">Large</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Widget Position
                            </label>
                            <select
                              value={appearanceConfig.widget_position}
                              onChange={(e) => setAppearanceConfig({
                                ...appearanceConfig,
                                widget_position: e.target.value
                              })}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="bottom-right">Bottom Right</option>
                              <option value="bottom-left">Bottom Left</option>
                              <option value="top-right">Top Right</option>
                              <option value="top-left">Top Left</option>
                            </select>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Primary Color
                              </label>
                              <input
                                type="color"
                                value={appearanceConfig.primary_color}
                                onChange={(e) => setAppearanceConfig({
                                  ...appearanceConfig,
                                  primary_color: e.target.value
                                })}
                                className="w-full h-10 rounded cursor-pointer"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Text Color
                              </label>
                              <input
                                type="color"
                                value={appearanceConfig.text_color}
                                onChange={(e) => setAppearanceConfig({
                                  ...appearanceConfig,
                                  text_color: e.target.value
                                })}
                                className="w-full h-10 rounded cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Messages */}
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-medium text-gray-900 flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Messages
                          </h3>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Welcome Message
                            </label>
                            <textarea
                              value={appearanceConfig.welcome_message}
                              onChange={(e) => setAppearanceConfig({
                                ...appearanceConfig,
                                welcome_message: e.target.value
                              })}
                              rows="2"
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Offline Message
                            </label>
                            <textarea
                              value={appearanceConfig.offline_message}
                              onChange={(e) => setAppearanceConfig({
                                ...appearanceConfig,
                                offline_message: e.target.value
                              })}
                              rows="2"
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                        
                        {/* Features */}
                        <div className="space-y-3 border-t pt-4">
                          <h3 className="font-medium text-gray-900">Features</h3>
                          
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={appearanceConfig.show_typing_indicator}
                              onChange={(e) => setAppearanceConfig({
                                ...appearanceConfig,
                                show_typing_indicator: e.target.checked
                              })}
                              className="h-4 w-4 text-orange-600 rounded"
                            />
                            <span className="text-sm text-gray-700">Show typing indicator</span>
                          </label>
                          
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={appearanceConfig.enable_emoji_picker}
                              onChange={(e) => setAppearanceConfig({
                                ...appearanceConfig,
                                enable_emoji_picker: e.target.checked
                              })}
                              className="h-4 w-4 text-orange-600 rounded"
                            />
                            <span className="text-sm text-gray-700">Enable emoji picker</span>
                          </label>
                          
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={appearanceConfig.sound_notifications}
                              onChange={(e) => setAppearanceConfig({
                                ...appearanceConfig,
                                sound_notifications: e.target.checked
                              })}
                              className="h-4 w-4 text-orange-600 rounded"
                            />
                            <span className="text-sm text-gray-700">Sound notifications</span>
                          </label>
                        </div>
                      </div>
                      
                      <button
                        onClick={saveAppearanceConfig}
                        disabled={isSavingAppearance}
                        className="w-full mt-6 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {isSavingAppearance ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </div>
                    
                    {/* Live Preview */}
                    <div className="bg-gray-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setAppearancePreviewState('closed')}
                            className={`px-3 py-1 text-sm rounded ${
                              appearancePreviewState === 'closed' 
                                ? 'bg-white text-gray-900 shadow' 
                                : 'text-gray-600 hover:bg-white/50'
                            }`}
                          >
                            Closed
                          </button>
                          <button
                            onClick={() => setAppearancePreviewState('open')}
                            className={`px-3 py-1 text-sm rounded ${
                              appearancePreviewState === 'open' 
                                ? 'bg-white text-gray-900 shadow' 
                                : 'text-gray-600 hover:bg-white/50'
                            }`}
                          >
                            Open
                          </button>
                        </div>
                      </div>
                      
                      {/* Preview Widget */}
                      <div className="relative bg-white rounded-lg shadow-lg h-[500px] overflow-hidden">
                        <div className="p-6">
                          <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-full"></div>
                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                          </div>
                        </div>
                        
                        {/* Widget Preview */}
                        <div className={`absolute ${
                          appearanceConfig.widget_position === 'bottom-right' ? 'bottom-4 right-4' :
                          appearanceConfig.widget_position === 'bottom-left' ? 'bottom-4 left-4' :
                          appearanceConfig.widget_position === 'top-right' ? 'top-4 right-4' :
                          'top-4 left-4'
                        }`}>
                          {appearancePreviewState === 'closed' ? (
                            <div
                              className="rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform w-14 h-14 flex items-center justify-center"
                              style={{ backgroundColor: appearanceConfig.primary_color }}
                            >
                              <MessageSquare className="h-6 w-6" style={{ color: appearanceConfig.text_color }} />
                            </div>
                          ) : (
                            <div className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col">
                              <div
                                className="p-4 rounded-t-lg flex items-center justify-between"
                                style={{ backgroundColor: appearanceConfig.primary_color }}
                              >
                                <span className="font-semibold" style={{ color: appearanceConfig.text_color }}>
                                  {appearanceConfig.agnt_name}
                                </span>
                                <X className="h-5 w-5 cursor-pointer" style={{ color: appearanceConfig.text_color }} />
                              </div>
                              <div className="flex-1 p-4">
                                <div className="bg-gray-100 rounded-lg p-3">
                                  <p className="text-sm">{appearanceConfig.welcome_message}</p>
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
            )}
          </>
        ) : (
          /* No chatbot selected state */
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {chatbots.length === 0 ? 'No chatbots yet' : 'Select a chatbot'}
            </h3>
            <p className="text-gray-500">
              {chatbots.length === 0 
                ? 'Create your first chatbot to get started'
                : 'Choose a chatbot from the dropdown above'}
            </p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Chatbot</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);

              try {
                const { data, error } = await supabase
                  .from('chatbots')
                  .insert({
                    organization_id: organization.id,
                    name: formData.get('name'),
                    description: formData.get('description'),
                    system_prompt: formData.get('system_prompt'),
                    welcome_message: formData.get('welcome_message') || 'Hi! How can I help you today?',
                    chat_model: 'gpt-3.5-turbo',
                    temperature: 0.7,
                    max_tokens: 500,
                    is_active: true,
                    embedding_model: 'text-embedding-3-small'
                  })
                  .select()
                  .single();

                if (error) throw error;

                setChatbots(prev => [...prev, data]);
                setSelectedChatbot(data);
                setShowCreateModal(false);
              } catch (error) {
                alert('Error creating chatbot: ' + error.message);
              }
            }}>
              <input
                name="name"
                type="text"
                placeholder="Chatbot Name"
                required
                className="w-full mb-3 px-3 py-2 border rounded-lg"
              />
              <textarea
                name="system_prompt"
                placeholder="You are a helpful assistant..."
                required
                rows="3"
                className="w-full mb-3 px-3 py-2 border rounded-lg"
              />
              <input
                name="welcome_message"
                type="text"
                placeholder="Hi! How can I help you today?"
                className="w-full mb-3 px-3 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-orange-600 text-white py-2 rounded">
                  Create
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-200 py-2 rounded">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
