import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { 
  MessageSquare, 
  Plus, 
  Settings, 
  Eye, 
  Code, 
  FileText,
  Send,
  Bot,
  Edit3,
  Trash2,
  Upload,
  X
} from 'lucide-react';

// Prompt Builder Templates
const PROMPT_TEMPLATES = {
  business_context: [
    { key: 'business_type', question: 'What type of business are you?', placeholder: 'e.g., salon franchise, tech company, consulting firm' },
    { key: 'target_customers', question: 'Who are your main customers?', placeholder: 'e.g., beauty professionals, small business owners, students' },
    { key: 'customer_values', question: 'What do your customers value most?', placeholder: 'e.g., quality, convenience, expertise, affordability' },
    { key: 'unique_selling_prop', question: 'What makes your business unique?', placeholder: 'e.g., premium locations, 24/7 support, industry expertise' }
  ],
  tone_and_voice: [
    { key: 'formality', question: 'How formal should responses be?', type: 'select', options: ['Very formal', 'Professional but friendly', 'Casual and approachable', 'Fun and energetic'] },
    { key: 'personality', question: 'What personality traits should your bot have?', placeholder: 'e.g., helpful, knowledgeable, enthusiastic, patient' },
    { key: 'communication_style', question: 'Any specific phrases or communication style?', placeholder: 'e.g., use "Of course!" instead of "Yes", avoid technical jargon' },
    { key: 'use_emojis', question: 'Should the bot use emojis?', type: 'select', options: ['Never', 'Rarely', 'Occasionally', 'Frequently'] }
  ],
  rules_and_boundaries: [
    { key: 'allowed_topics', question: 'What topics can the bot discuss?', placeholder: 'e.g., pricing, services, booking, general inquiries' },
    { key: 'restricted_topics', question: 'What topics should be avoided?', placeholder: 'e.g., competitor comparisons, medical advice, legal advice' },
    { key: 'lead_collection_trigger', question: 'When should the bot collect contact info?', placeholder: 'e.g., when someone asks about pricing, requests a demo, shows high interest' },
    { key: 'escalation_triggers', question: 'When should the bot transfer to a human?', placeholder: 'e.g., complaints, complex technical issues, pricing negotiations' }
  ],
  lead_collection: [
    { key: 'required_fields', question: 'What information is required from leads?', type: 'checkbox', options: ['Name', 'Email', 'Phone', 'Company', 'Location/ZIP'] },
    { key: 'optional_fields', question: 'What additional info would be helpful?', type: 'checkbox', options: ['Job title', 'Company size', 'Budget range', 'Timeline', 'Specific interests'] },
    { key: 'collection_approach', question: 'How should the bot collect this info?', type: 'select', options: ['All at once', 'Gradually through conversation', 'Only when specifically requested'] }
  ]
};

export default function ChatbotBuilder() {
  const { organization, branding } = useOrganization();
  const navigate = useNavigate();
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Create/Edit States
  const [chatbotData, setChatbotData] = useState({
    name: '',
    description: '',
    welcome_message: 'Hi! How can I help you today?',
    system_prompt: '',
    settings: {
      temperature: 0.7,
      max_tokens: 1000,
      model: 'gpt-4-turbo-preview'
    }
  });
  
  // Guided Prompt Builder States
  const [promptAnswers, setPromptAnswers] = useState({});
  const [currentPromptStep, setCurrentPromptStep] = useState('business_context');
  const [showPromptWizard, setShowPromptWizard] = useState(false);
  
  // Knowledge Base States
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [newKnowledgeTitle, setNewKnowledgeTitle] = useState('');
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('');
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  
  // Testing States
  const [testMessages, setTestMessages] = useState([]);
  const [testInput, setTestInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    if (organization) {
      fetchChatbots();
    }
  }, [organization]);

  useEffect(() => {
    if (selectedChatbot) {
      fetchKnowledgeBase();
      // Add welcome message to test
      setTestMessages([{
        role: 'assistant',
        content: selectedChatbot.welcome_message || 'Hi! How can I help you today?',
        timestamp: Date.now()
      }]);
    }
  }, [selectedChatbot]);

  const fetchChatbots = async () => {
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
    } catch (error) {
      console.error('Error fetching chatbots:', error);
    } finally {
      setLoading(false);
    }
  };

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
      setKnowledgeBase(data || []);
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
    }
  };

  const generateSystemPrompt = (answers) => {
    let prompt = `## Define Business Context\n`;
    prompt += `Your task is to provide customer support for ${answers.business_type || 'this business'}`;
    
    if (answers.target_customers) {
      prompt += `.\n\nOur customers include:\n${answers.target_customers}`;
    }
    
    if (answers.customer_values) {
      prompt += `\n\nThese customers value ${answers.customer_values}.`;
    }
    
    if (answers.unique_selling_prop) {
      prompt += `\n\nWhat makes us unique: ${answers.unique_selling_prop}`;
    }
    
    prompt += `\n\n---\n\n## Tone and Language\n`;
    
    const formalityMap = {
      'Very formal': 'formal and professional',
      'Professional but friendly': 'warm, friendly, supportive, professional, and encouraging',
      'Casual and approachable': 'casual, friendly, and approachable',
      'Fun and energetic': 'fun, energetic, and enthusiastic'
    };
    
    prompt += `Communicate in a ${formalityMap[answers.formality] || 'professional yet friendly'} tone.`;
    
    if (answers.personality) {
      prompt += ` Be ${answers.personality}.`;
    }
    
    if (answers.communication_style) {
      prompt += `\n\n${answers.communication_style}`;
    }
    
    const emojiMap = {
      'Never': 'Do not use emojis.',
      'Rarely': 'Use emojis very sparingly, only when absolutely appropriate.',
      'Occasionally': 'Use appropriate emojis occasionally to add warmth.',
      'Frequently': 'Use emojis frequently to create a friendly, engaging experience.'
    };
    
    if (answers.use_emojis) {
      prompt += `\n\n${emojiMap[answers.use_emojis]}`;
    }
    
    prompt += `\n\n---\n\n## Rules of Engagement\n`;
    
    if (answers.allowed_topics) {
      prompt += `You can discuss: ${answers.allowed_topics}\n`;
    }
    
    if (answers.restricted_topics) {
      prompt += `Avoid discussing: ${answers.restricted_topics}\n`;
    }
    
    if (answers.lead_collection_trigger) {
      prompt += `\nCollect contact information when: ${answers.lead_collection_trigger}`;
      
      if (answers.required_fields) {
        const fields = Array.isArray(answers.required_fields) ? answers.required_fields.join(', ') : answers.required_fields;
        prompt += `\nRequired information: ${fields}`;
      }
      
      if (answers.optional_fields) {
        const fields = Array.isArray(answers.optional_fields) ? answers.optional_fields.join(', ') : answers.optional_fields;
        prompt += `\nAdditional helpful information: ${fields}`;
      }
    }
    
    if (answers.escalation_triggers) {
      prompt += `\n\nEscalate to human support when: ${answers.escalation_triggers}`;
    }
    
    prompt += `\n\n---\n\n## Knowledge Base\nYou have access to the company's knowledge base to answer questions accurately. Always consult the knowledge base before escalating or making assumptions.`;
    
    return prompt;
  };
  const createChatbot = async () => {
    if (!chatbotData.name.trim()) return;
    
    try {
      const { data: newChatbot, error } = await supabase
        .from('chatbots')
        .insert({
          organization_id: organization.id,
          name: chatbotData.name,
          description: chatbotData.description,
          system_prompt: chatbotData.system_prompt,
          welcome_message: chatbotData.welcome_message,
          settings: chatbotData.settings,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh chatbot list
      await fetchChatbots();
      
      // Reset form
      setChatbotData({
        name: '',
        description: '',
        welcome_message: 'Hi! How can I help you today?',
        system_prompt: '',
        settings: {
          temperature: 0.7,
          max_tokens: 1000,
          model: 'gpt-4-turbo-preview'
        }
      });
      setPromptAnswers({});
      setShowCreateModal(false);
      setShowPromptWizard(false);
      
      // Auto-select the new chatbot
      setSelectedChatbot(newChatbot);
      
    } catch (error) {
      console.error('Error creating chatbot:', error.message, error.details);
      alert(`Failed to create chatbot: ${error.message}${error.details ? ' - ' + error.details : ''}`);
    }
  };

  const handlePromptWizardComplete = () => {
    const generatedPrompt = generateSystemPrompt(promptAnswers);
    setChatbotData(prev => ({
      ...prev,
      system_prompt: generatedPrompt
    }));
    setShowPromptWizard(false);
  };

  const testChatbot = async () => {
    if (!testInput.trim() || !selectedChatbot) return;
    
    setTestLoading(true);
    const userMessage = { role: 'user', content: testInput, timestamp: Date.now() };
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
      
      setTestMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Test error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, there was an error testing the chatbot: ${error.message}`,
        timestamp: Date.now(),
        error: true
      };
      setTestMessages(prev => [...prev, errorMessage]);
    } finally {
      setTestLoading(false);
    }
  };

  const addKnowledgeEntry = async () => {
    if (!selectedChatbot || !newKnowledgeTitle.trim() || !newKnowledgeContent.trim()) return;
    
    try {
      // Generate embedding using edge function
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embedding', {
        body: {
          text: newKnowledgeContent,
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
          title: newKnowledgeTitle,
          content: newKnowledgeContent,
          content_type: 'manual',
          embedding: embeddingData.embedding,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh knowledge base display
      await fetchKnowledgeBase();
      
      // Reset form
      setNewKnowledgeTitle('');
      setNewKnowledgeContent('');
      setShowAddKnowledge(false);
      
    } catch (error) {
      console.error('Error adding knowledge entry:', error);
      alert('Failed to add knowledge entry. Please try again.');
    }
  };

  const generateEmbedCode = (chatbot) => {
    const baseUrl = window.location.origin;
    const iframeCode = `<iframe 
  src="${baseUrl}/chat-iframe.html?chatbot=${chatbot.id}" 
  width="100%" 
  height="600" 
  frameborder="0"
  allow="microphone">
</iframe>`;
    
    const scriptCode = `<script 
  src="${baseUrl}/chat-widget.js" 
  data-chatbot-id="${chatbot.id}"
  data-position="bottom-right">
</script>`;
    
    return { iframeCode, scriptCode };
  };

  const deleteChatbot = async (chatbotId) => {
    if (!confirm('Are you sure you want to delete this chatbot? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('chatbots')
        .delete()
        .eq('id', chatbotId);
      
      if (error) throw error;
      
      // Refresh list and clear selection if needed
      await fetchChatbots();
      if (selectedChatbot?.id === chatbotId) {
        setSelectedChatbot(null);
      }
      
    } catch (error) {
      console.error('Error deleting chatbot:', error);
      alert('Failed to delete chatbot. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading chatbots...</div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {!selectedChatbot ? (
          // Overview - List of chatbots
          <>
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h1 className="text-2xl font-bold text-gray-900">AI Chatbots</h1>
                <p className="mt-2 text-sm text-gray-700">
                  Create and manage AI-powered chatbots for your website.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300"
                  style={{
                    backgroundColor: branding?.primary_color || '#EA580C',
                    borderColor: branding?.primary_color || '#EA580C'
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Chatbot
                </button>
              </div>
            </div>

            <div className="mt-8">
              {chatbots.length === 0 ? (
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/80 shadow-lg p-12 text-center">
                  <Bot className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No chatbots yet</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Get started by creating your first AI chatbot.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:shadow-lg transition-all duration-300"
                      style={{
                        backgroundColor: branding?.primary_color || '#EA580C'
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Chatbot
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {chatbots.map((chatbot) => (
                    <div
                      key={chatbot.id}
                      className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 p-6 cursor-pointer relative group"
                    >
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChatbot(chatbot.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div onClick={() => setSelectedChatbot(chatbot)}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <MessageSquare className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {chatbot.name}
                              </h3>
                            </div>
                          </div>
                        </div>
                        
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {chatbot.description || 'No description provided'}
                        </p>
                        
                        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {chatbot.chatbot_knowledge?.[0]?.count || 0} knowledge items
                          </span>
                          <span>
                            {chatbot.chatbot_conversations?.[0]?.count || 0} conversations
                          </span>
                        </div>
                        
                        <div className="mt-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            chatbot.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {chatbot.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          // Chatbot Detail View
          <div>
            <div className="mb-6">
              <button
                onClick={() => setSelectedChatbot(null)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                ← Back to chatbots
              </button>
              <div className="flex justify-between items-start mt-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedChatbot.name}</h1>
                  <p className="text-sm text-gray-600 mt-1">{selectedChatbot.description}</p>
                </div>
                <button
                  onClick={() => navigate(`/chatbots/${selectedChatbot.id}/conversations`)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Conversations
                </button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'overview', label: 'Overview', icon: Eye },
                  { key: 'knowledge', label: 'Knowledge Base', icon: FileText },
                  { key: 'test', label: 'Test Chat', icon: MessageSquare },
                  { key: 'embed', label: 'Embed Code', icon: Code }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                        activeTab === tab.key
                          ? 'border-orange-500 text-orange-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      style={
                        activeTab === tab.key && branding?.primary_color
                          ? { borderBottomColor: branding.primary_color, color: branding.primary_color }
                          : undefined
                      }
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium mb-4">Chatbot Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedChatbot.chatbot_conversations?.[0]?.count || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Conversations</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedChatbot.chatbot_knowledge?.[0]?.count || 0}
                      </div>
                      <div className="text-sm text-gray-600">Knowledge Items</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedChatbot.settings?.model || 'GPT-4'}
                      </div>
                      <div className="text-sm text-gray-600">AI Model</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium mb-4">System Prompt</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedChatbot.system_prompt}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'knowledge' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Knowledge Base</h3>
                  <button
                    onClick={() => setShowAddKnowledge(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:shadow-lg transition-all duration-300"
                    style={{
                      backgroundColor: branding?.primary_color || '#EA580C'
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Knowledge
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow">
                  {knowledgeBase.length === 0 ? (
                    <div className="p-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No knowledge base yet</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Add some knowledge entries to help your chatbot answer questions accurately.
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={() => setShowAddKnowledge(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:shadow-lg transition-all duration-300"
                          style={{
                            backgroundColor: branding?.primary_color || '#EA580C'
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Knowledge Entry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {knowledgeBase.map((item) => (
                        <div key={item.id} className="p-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-3">{item.content}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {item.content_type} • {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'test' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium">Test Your Chatbot</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Chat with your bot to see how it responds
                  </p>
                </div>
                
                <div className="h-96 overflow-y-auto p-6 space-y-4">
                  {testMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : msg.error 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        {msg.tokensUsed && (
                          <p className="text-xs mt-1 opacity-75">
                            {msg.tokensUsed} tokens used
                          </p>
                        )}
                        {msg.relevantKnowledge > 0 && (
                          <p className="text-xs mt-1 opacity-75">
                            Used {msg.relevantKnowledge} knowledge items
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {testLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2">
                        <div className="animate-pulse flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        </div>
                        <span className="text-xs text-gray-500">Bot is typing...</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-6 border-t border-gray-200">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && testChatbot()}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={testLoading}
                    />
                    <button
                      onClick={testChatbot}
                      disabled={!testInput.trim() || testLoading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'embed' && (
              <div className="space-y-6">
                {(() => {
                  const { iframeCode, scriptCode } = generateEmbedCode(selectedChatbot);
                  return (
                    <>
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium mb-4">Iframe Embed</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Add this iframe to your website to embed the chatbot.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                            {iframeCode}
                          </pre>
                        </div>
                        <button
                          onClick={() => navigator.clipboard.writeText(iframeCode)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Copy to clipboard
                        </button>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium mb-4">JavaScript Widget</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Add this script tag to show a floating chat bubble.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                            {scriptCode}
                          </pre>
                        </div>
                        <button
                          onClick={() => navigator.clipboard.writeText(scriptCode)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Copy to clipboard
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Create Chatbot Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-medium">Create New Chatbot</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chatbot Name *
                  </label>
                  <input
                    type="text"
                    value={chatbotData.name}
                    onChange={(e) => setChatbotData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Customer Support Bot"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={chatbotData.description}
                    onChange={(e) => setChatbotData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what this chatbot is for..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Welcome Message
                  </label>
                  <input
                    type="text"
                    value={chatbotData.welcome_message}
                    onChange={(e) => setChatbotData(prev => ({ ...prev, welcome_message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Hi! How can I help you today?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System Prompt
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <button
                      onClick={() => setShowPromptWizard(true)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Use Prompt Wizard
                    </button>
                  </div>
                  <textarea
                    value={chatbotData.system_prompt}
                    onChange={(e) => setChatbotData(prev => ({ ...prev, system_prompt: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="You are a helpful AI assistant..."
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={createChatbot}
                  disabled={!chatbotData.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                >
                  Create Chatbot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prompt Wizard Modal */}
        {showPromptWizard && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-medium">Prompt Builder Wizard</h3>
                <button
                  onClick={() => setShowPromptWizard(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mt-6">
                <div className="mb-6">
                  <div className="flex space-x-4">
                    {Object.keys(PROMPT_TEMPLATES).map((step) => (
                      <button
                        key={step}
                        onClick={() => setCurrentPromptStep(step)}
                        className={`px-3 py-2 text-sm rounded ${
                          currentPromptStep === step
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {PROMPT_TEMPLATES[currentPromptStep].map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.question}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={promptAnswers[field.key] || ''}
                          onChange={(e) => setPromptAnswers(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Choose an option...</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'checkbox' ? (
                        <div className="space-y-2">
                          {field.options.map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={(promptAnswers[field.key] || []).includes(option)}
                                onChange={(e) => {
                                  const current = promptAnswers[field.key] || [];
                                  const updated = e.target.checked
                                    ? [...current, option]
                                    : current.filter(item => item !== option);
                                  setPromptAnswers(prev => ({ ...prev, [field.key]: updated }));
                                }}
                                className="mr-2"
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          value={promptAnswers[field.key] || ''}
                          onChange={(e) => setPromptAnswers(prev => ({ ...prev, [field.key]: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPromptWizard(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePromptWizardComplete}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md"
                >
                  Generate Prompt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Knowledge Modal */}
        {showAddKnowledge && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-medium">Add Knowledge Entry</h3>
                <button
                  onClick={() => setShowAddKnowledge(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newKnowledgeTitle}
                    onChange={(e) => setNewKnowledgeTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Pricing Information"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    value={newKnowledgeContent}
                    onChange={(e) => setNewKnowledgeContent(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter the knowledge content that will help the chatbot answer questions..."
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddKnowledge(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={addKnowledgeEntry}
                  disabled={!newKnowledgeTitle.trim() || !newKnowledgeContent.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                >
                  Add Knowledge
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

