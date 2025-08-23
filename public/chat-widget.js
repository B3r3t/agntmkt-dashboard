// public/chat-widget.js - Embeddable chat widget 
(function() {
  'use strict';
  
  // Configuration
  const WIDGET_CONFIG = {
    version: '1.0.0',
    baseUrl: window.location.hostname === 'localhost'
      ? 'http://localhost:5173'
      : 'https://agntmkt-dashboard-5kau3r38t-wills-projects-c3d247c1.vercel.app/',
    supabaseUrl: 'https://ibbkdeptefqazanswvqj.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliYmtkZXB0ZWZxYXphbnN3dnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMTMzNzMsImV4cCI6MjA3MDg4OTM3M30.-1YXyUqo29q5eaFwUizDBVf1FqK_NZGNxNA9bCNXrMU'
  };
  
  // Get configuration from script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-chatbot-id]');
  if (!scriptTag) {
    console.error('[ChatWidget] Script tag not found');
    return;
  }
  
  const config = {
    chatbotId: scriptTag.getAttribute('data-chatbot-id'),
    position: scriptTag.getAttribute('data-position') || 'bottom-right',
    size: scriptTag.getAttribute('data-size') || 'medium',
    primaryColor: scriptTag.getAttribute('data-primary-color') || '#3B82F6'
  };
  
  if (!config.chatbotId) {
    console.error('[ChatWidget] No chatbot ID specified');
    return;
  }
  
  // Widget state
  let isOpen = false;
  let isMinimized = false;
  let messages = [];
  let sessionId = null;
  let conversationId = null;
  let chatbotData = null;
  
  // Generate session ID
  function generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Initialize Supabase client
  let supabase;
  function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
      supabase = window.supabase.createClient(WIDGET_CONFIG.supabaseUrl, WIDGET_CONFIG.supabaseAnonKey);
    }
  }
  
  // Load Supabase if not already loaded
  function loadSupabase() {
    return new Promise((resolve, reject) => {
      if (window.supabase) {
        initSupabase();
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js';
      script.onload = () => {
        initSupabase();
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  // Create widget HTML
  function createWidgetHTML() {
    const sizeConfig = {
      small: { width: '320px', height: '400px' },
      medium: { width: '380px', height: '500px' },
      large: { width: '420px', height: '600px' }
    };
    
    const positionConfig = {
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'top-left': { top: '20px', left: '20px' }
    };
    
    const size = sizeConfig[config.size];
    const position = positionConfig[config.position];
    
    return `
      <div id="chat-widget-container" style="
        position: fixed;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ${Object.entries(position).map(([key, value]) => `${key}: ${value};`).join(' ')}
      ">
        <!-- Chat Bubble -->
        <div id="chat-bubble" style="
          width: 60px;
          height: 60px;
          background: ${config.primaryColor};
          border-radius: 50%;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          transition: all 0.3s ease;
          ${isOpen ? 'display: none;' : ''}
        " onclick="toggleChat()">
          💬
        </div>
        
        <!-- Chat Window -->
        <div id="chat-window" style="
          width: ${size.width};
          height: ${isMinimized ? '60px' : size.height};
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          display: ${isOpen ? 'flex' : 'none'};
          flex-direction: column;
          overflow: hidden;
          transition: height 0.3s ease;
        ">
          <!-- Header -->
          <div id="chat-header" style="
            background: ${config.primaryColor};
            color: white;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>🤖</span>
              <span style="font-weight: 500;">AI Assistant</span>
              <div style="width: 8px; height: 8px; background: #10B981; border-radius: 50%;"></div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button onclick="toggleMinimize()" style="
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                font-size: 16px;
              ">
                ${isMinimized ? '🔲' : '➖'}
              </button>
              <button onclick="closeChat()" style="
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                font-size: 16px;
              ">
                ✕
              </button>
            </div>
          </div>
          
          <!-- Messages -->
          <div id="chat-messages" style="
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background: #f9fafb;
            display: ${isMinimized ? 'none' : 'block'};
          ">
            <!-- Messages will be inserted here -->
          </div>
          
          <!-- Input -->
          <div id="chat-input" style="
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            background: white;
            display: ${isMinimized ? 'none' : 'flex'};
            gap: 8px;
          ">
            <textarea 
              id="message-input" 
              placeholder="Type your message..."
              style="
                flex: 1;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 12px;
                resize: none;
                font-family: inherit;
                font-size: 14px;
                min-height: 40px;
                max-height: 100px;
              "
              onkeypress="handleKeyPress(event)"
            ></textarea>
            <button 
              id="send-button" 
              onclick="sendMessage()"
              style="
                background: ${config.primaryColor};
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                font-size: 16px;
                min-width: 44px;
              "
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  // Widget functions
  window.toggleChat = function() {
    isOpen = !isOpen;
    updateWidget();
    if (isOpen && messages.length === 0) {
      // Add welcome message
      addMessage('assistant', chatbotData?.welcome_message || 'Hi! How can I help you today?');
    }
  };
  
  window.closeChat = function() {
    isOpen = false;
    updateWidget();
  };
  
  window.toggleMinimize = function() {
    isMinimized = !isMinimized;
    updateWidget();
  };
  
  window.handleKeyPress = function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };
  
  window.sendMessage = async function() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage('user', message);
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
      // Call edge function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: message,
          chatbotId: config.chatbotId,
          sessionId: sessionId,
          conversationId: conversationId
        }
      });
      
      if (error) throw error;
      
      // Update conversation ID if first message
      if (!conversationId && data.conversationId) {
        conversationId = data.conversationId;
      }
      
      // Add assistant response
      hideTypingIndicator();
      addMessage('assistant', data.response);
      
    } catch (error) {
      console.error('Chat error:', error);
      hideTypingIndicator();
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.', true);
    }
  };
  
  // Message handling
  function addMessage(role, content, error = false) {
    const message = { role, content, timestamp: Date.now(), error };
    messages.push(message);
    renderMessage(message);
    scrollToBottom();
  }
  
  function renderMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      display: flex;
      margin-bottom: 16px;
      ${message.role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
    `;
    
    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
      ${message.role === 'user' 
        ? `background: ${config.primaryColor}; color: white; border-bottom-right-radius: 4px;`
        : message.error
          ? 'background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; border-bottom-left-radius: 4px;'
          : 'background: white; color: #374151; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-bottom-left-radius: 4px;'
      }
    `;
    messageBubble.textContent = message.content;
    
    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
  }
  
  function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.style.cssText = `
      display: flex;
      justify-content: flex-start;
      margin-bottom: 16px;
    `;
    
    typingDiv.innerHTML = `
      <div style="
        background: white;
        padding: 12px 16px;
        border-radius: 16px;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <div style="display: flex; gap: 4px;">
          <div style="width: 6px; height: 6px; background: #9CA3AF; border-radius: 50%; animation: typing 1.4s infinite;"></div>
          <div style="width: 6px; height: 6px; background: #9CA3AF; border-radius: 50%; animation: typing 1.4s infinite 0.2s;"></div>
          <div style="width: 6px; height: 6px; background: #9CA3AF; border-radius: 50%; animation: typing 1.4s infinite 0.4s;"></div>
        </div>
        <span style="font-size: 12px; color: #6B7280;">AI is typing...</span>
      </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
  }
  
  function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }
  
  function scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
  
  // Update widget display
  function updateWidget() {
    const container = document.getElementById('chat-widget-container');
    if (container) {
      container.innerHTML = createWidgetHTML();
    }
  }
  
  // Load chatbot data
  async function loadChatbotData() {
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select('name, welcome_message, settings')
        .eq('id', config.chatbotId)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      chatbotData = data;
      
    } catch (error) {
      console.error('Error loading chatbot data:', error);
      chatbotData = {
        name: 'AI Assistant',
        welcome_message: 'Hi! How can I help you today?'
      };
    }
  }
  
  // Initialize widget
  async function initWidget() {
    try {
      // Load Supabase
      await loadSupabase();
      
      // Generate session ID
      sessionId = generateSessionId();
      
      // Load chatbot configuration
      await loadChatbotData();
      
      // Create widget container
      const container = document.createElement('div');
      container.innerHTML = createWidgetHTML();
      document.body.appendChild(container);
      
      // Add CSS animations
      const style = document.createElement('style');
      style.textContent = `
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
        #chat-bubble:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 25px rgba(0,0,0,0.2);
        }
      `;
      document.head.appendChild(style);
      
    } catch (error) {
      console.error('Widget initialization failed:', error);
    }
  }
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
  
})();
