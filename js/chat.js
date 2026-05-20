// VideoMeet - Chat Module
(function() {
  'use strict';

  const Chat = {
    messages: [],
    container: null,

    init: function() {
      this.container = document.getElementById('chatMessages');
      this.renderMessages();
    },

    getHTML: function() {
      return `
        <div class="meeting-sidebar-header">
          <h3 class="meeting-sidebar-title">Chat</h3>
          <button class="meeting-sidebar-close" id="sidebarCloseBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="meeting-sidebar-content">
          <div class="chat-messages" id="chatMessages">
            ${this.messages.map(m => this.createMessageHTML(m)).join('')}
          </div>
        </div>
        <div class="chat-input-container">
          <div class="chat-input-wrapper">
            <input type="text" class="chat-input" id="chatInput" placeholder="Type a message...">
            <div class="chat-input-actions">
              <button class="chat-input-btn" id="sendChatBtn" title="Send">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    },

    createMessageHTML: function(msg) {
      const isSelf = msg.senderId === VideoMeet.state.user?.id;
      const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      if (msg.type === 'system') {
        return `
          <div class="chat-message system">
            <div class="chat-message-content">
              <div class="chat-message-text" style="color: var(--text-muted); font-size: 0.8125rem;">
                ${this.escapeHtml(msg.text)}
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="chat-message ${isSelf ? 'self' : ''}">
          <div class="avatar avatar-sm">${msg.senderName.charAt(0).toUpperCase()}</div>
          <div class="chat-message-content">
            <div class="chat-message-header">
              <span class="chat-message-name">${this.escapeHtml(msg.senderName)}</span>
              <span class="chat-message-time">${time}</span>
            </div>
            <div class="chat-message-text">${this.escapeHtml(msg.text)}</div>
          </div>
        </div>
      `;
    },

    sendMessage: function(text) {
      const input = document.getElementById('chatInput');
      if (input) input.value = '';

      if (!text.trim()) return;

      const message = {
        id: Date.now().toString(),
        text: text.trim(),
        senderId: VideoMeet.state.user.id,
        senderName: VideoMeet.state.user.name,
        timestamp: new Date().toISOString(),
        type: 'user'
      };

      this.messages.push(message);
      this.renderMessages();
      this.scrollToBottom();

      Socket.emit('chat-message', message);
    },

    receiveMessage: function(data) {
      this.messages.push(data);
      this.renderMessages();
      this.scrollToBottom();
    },

    addSystemMessage: function(text) {
      const message = {
        id: Date.now().toString(),
        text: text,
        timestamp: new Date().toISOString(),
        type: 'system'
      };
      this.messages.push(message);
      
      const container = document.getElementById('meetingSidebar');
      if (container.classList.contains('open') && container.dataset.panel === 'chat') {
        this.renderMessages();
        this.scrollToBottom();
      }
    },

    renderMessages: function() {
      const container = document.getElementById('chatMessages');
      if (container) {
        container.innerHTML = this.messages.map(m => this.createMessageHTML(m)).join('');
      }
    },

    scrollToBottom: function() {
      const container = document.getElementById('chatMessages');
      if (container) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 50);
      }
    },

    escapeHtml: function(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  window.Chat = Chat;
})();