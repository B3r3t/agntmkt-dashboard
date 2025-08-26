(function() {
  'use strict';

  // Make initChatWidget available globally
  window.initChatWidget = function(config) {
    console.log('Initializing chat widget with config:', config);

    // Validate required config
    if (!config || !config.chatbotId) {
      console.error('[ChatWidget] No chatbot ID specified');
      return;
    }

    // Configuration with defaults
    const widgetConfig = {
      chatbotId: config.chatbotId,
      position: config.position || 'bottom-right',
      primaryColor: config.primaryColor || '#ea580c',
      supabaseUrl: config.supabaseUrl || window.location.origin.replace('localhost:5173', 'localhost:54321')
    };

    // Widget state
    let isOpen = false;
    let messages = [];
    let conversationId = null;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Inject styles
    const styleId = 'chat-widget-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        #chat-widget-container * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        #chat-widget-container {
          position: fixed;
          ${widgetConfig.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
          ${widgetConfig.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        #chat-bubble {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${widgetConfig.primaryColor};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: transform 0.3s ease;
        }

        #chat-bubble:hover {
          transform: scale(1.1);
        }

        #chat-widget {
          position: absolute;
          ${widgetConfig.position.includes('bottom') ? 'bottom: 0;' : 'top: 0;'}
          ${widgetConfig.position.includes('right') ? 'right: 0;' : 'left: 0;'}
          width: 380px;
          height: 600px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        #chat-header {
          background: ${widgetConfig.primaryColor};
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        #chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f9fafb;
        }

        #chat-input-container {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          background: white;
          display: flex;
          gap: 8px;
        }

        #chat-input {
          flex: 1;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          resize: none;
          outline: none;
        }

        #chat-input:focus {
          border-color: ${widgetConfig.primaryColor};
        }

        #chat-send {
          background: ${widgetConfig.primaryColor};
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          cursor: pointer;
          font-weight: 500;
        }

        #chat-send:hover {
          opacity: 0.9;
        }

        #chat-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-message {
          margin-bottom: 12px;
          display: flex;
        }

        .chat-message.user {
          justify-content: flex-end;
        }

        .chat-message-bubble {
          max-width: 70%;
          padding: 10px 14px;
          border-radius: 16px;
          word-wrap: break-word;
          font-size: 14px;
          line-height: 1.4;
        }

        .chat-message.user .chat-message-bubble {
          background: ${widgetConfig.primaryColor};
          color: white;
          border-bottom-right-radius: 4px;
        }

        .chat-message.assistant .chat-message-bubble {
          background: #f3f4f6;
          color: #111827;
          border-bottom-left-radius: 4px;
        }

        .chat-typing {
          padding: 10px 14px;
          background: #f3f4f6;
          border-radius: 16px;
          display: inline-block;
          border-bottom-left-radius: 4px;
        }

        .chat-typing span {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #9ca3af;
          margin: 0 2px;
          animation: typing 1.4s infinite;
        }

        .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
        .chat-typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
      `;
      document.head.appendChild(style);
    }

    // Create widget HTML
    function createWidget() {
      // Remove existing widget if present
      const existing = document.getElementById('chat-widget-container');
      if (existing) {
        existing.remove();
      }

      const container = document.createElement('div');
      container.id = 'chat-widget-container';

      // Create bubble
      const bubble = document.createElement('div');
      bubble.id = 'chat-bubble';
      bubble.innerHTML = `
        <svg width="30" height="30" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="white"/>
        </svg>
      `;
      bubble.onclick = toggleChat;

      // Create chat window (hidden initially)
      const widget = document.createElement('div');
      widget.id = 'chat-widget';
      widget.style.display = 'none';

      container.appendChild(bubble);
      container.appendChild(widget);
      document.body.appendChild(container);

      console.log('Widget created and added to page');
    }

    // Toggle chat window
    function toggleChat() {
      isOpen = !isOpen;
      const widget = document.getElementById('chat-widget');
      const bubble = document.getElementById('chat-bubble');

      if (isOpen) {
        widget.style.display = 'flex';
        bubble.style.display = 'none';

        // Initialize chat content if first time
        if (!widget.innerHTML) {
          initializeChatContent();
        }

        // Add welcome message if first time
        if (messages.length === 0) {
          addMessage('assistant', 'Hi! How can I help you today?');
        }
      } else {
        widget.style.display = 'none';
        bubble.style.display = 'flex';
      }
    }

    // Initialize chat content
    function initializeChatContent() {
      const widget = document.getElementById('chat-widget');
      widget.innerHTML = `
        <div id="chat-header">
          <div style="font-weight: 600;">Chat Support</div>
          <button onclick="window.chatWidgetToggle()" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 20px;
          ">×</button>
        </div>
        <div id="chat-messages"></div>
        <div id="chat-input-container">
          <input 
            type="text" 
            id="chat-input" 
            placeholder="Type your message..."
            onkeypress="window.chatWidgetHandleKeypress(event)"
          />
          <button id="chat-send" onclick="window.chatWidgetSend()">Send</button>
        </div>
      `;
    }

    // Global functions for inline handlers
    window.chatWidgetToggle = toggleChat;

    window.chatWidgetHandleKeypress = function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    };

    window.chatWidgetSend = sendMessage;

    // Send message
    async function sendMessage() {
      const input = document.getElementById('chat-input');
      const message = input.value.trim();

      if (!message) return;

      // Add user message
      addMessage('user', message);
      input.value = '';

      // Show typing indicator
      showTyping();

      // Send to API
      try {
        const response = await fetch(`${widgetConfig.supabaseUrl}/functions/v1/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            chatbotId: widgetConfig.chatbotId,
            sessionId: sessionId,
            conversationId: conversationId
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Update conversation ID if new
        if (!conversationId && data.conversationId) {
          conversationId = data.conversationId;
        }

        // Hide typing and add response
        hideTyping();
        addMessage('assistant', data.response || 'Sorry, I couldn\'t process that request.');

      } catch (error) {
        console.error('Chat error:', error);
        hideTyping();
        addMessage('assistant', 'Sorry, I\'m having trouble connecting. Please try again later.');
      }
    }

    // Add message to chat
    function addMessage(role, content) {
      const messagesContainer = document.getElementById('chat-messages');
      if (!messagesContainer) return;

      const messageDiv = document.createElement('div');
      messageDiv.className = `chat-message ${role}`;

      const bubble = document.createElement('div');
      bubble.className = 'chat-message-bubble';
      bubble.textContent = content;

      messageDiv.appendChild(bubble);
      messagesContainer.appendChild(messageDiv);

      // Store message
      messages.push({ role, content, timestamp: Date.now() });

      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Show typing indicator
    function showTyping() {
      const messagesContainer = document.getElementById('chat-messages');
      if (!messagesContainer || document.getElementById('typing-indicator')) return;

      const typingDiv = document.createElement('div');
      typingDiv.id = 'typing-indicator';
      typingDiv.className = 'chat-message assistant';
      typingDiv.innerHTML = `
        <div class="chat-typing">
          <span></span><span></span><span></span>
        </div>
      `;
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Hide typing indicator
    function hideTyping() {
      const typing = document.getElementById('typing-indicator');
      if (typing) {
        typing.remove();
      }
    }

    // Initialize
    createWidget();
    console.log('Chat widget initialized successfully');
  };

  // Auto-initialize if the script has data attributes
  if (document.currentScript) {
    const script = document.currentScript;
    const chatbotId = script.getAttribute('data-chatbot-id');
    if (chatbotId) {
      window.addEventListener('load', function() {
        window.initChatWidget({
          chatbotId: chatbotId,
          position: script.getAttribute('data-position') || 'bottom-right'
        });
      });
    }
  }
})();

