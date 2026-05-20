// VideoMeet - Main Application
(function() {
  'use strict';

  window.VideoMeet = {
    config: {
      appName: 'VideoMeet',
      version: '1.0.0',
      apiBaseUrl: '/api',
      socketUrl: 'http://localhost:3001',
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    },

    state: {
      user: null,
      isAuthenticated: false,
      currentMeeting: null,
      isRecording: false,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false
    },

    init: function() {
      this.loadUserSession();
      this.bindEvents();
      this.checkPage();
    },

    loadUserSession: function() {
      const userData = sessionStorage.getItem('videomeet_user');
      if (userData) {
        this.state.user = JSON.parse(userData);
        this.state.isAuthenticated = true;
      }
    },

    saveUserSession: function(user) {
      sessionStorage.setItem('videomeet_user', JSON.stringify(user));
      this.state.user = user;
      this.state.isAuthenticated = true;
    },

    clearSession: function() {
      sessionStorage.removeItem('videomeet_user');
      this.state.user = null;
      this.state.isAuthenticated = false;
    },

    bindEvents: function() {
      document.addEventListener('click', (e) => {
        if (e.target.closest('.dropdown')) return;
        document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
      });

      window.addEvent('beforeunload', () => {
        if (this.state.currentMeeting) {
          return 'You are in a meeting. Are you sure you want to leave?';
        }
      });
    },

    checkPage: function() {
      const path = window.location.pathname;
      if (path.includes('dashboard.html') && !this.state.isAuthenticated) {
        window.location.href = 'index.html';
      } else if ((path.includes('index.html') || path === '/') && this.state.isAuthenticated) {
        window.location.href = 'dashboard.html';
      }
    },

    generateMeetingId: function() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      let result = '';
      for (let i = 0; i < 3; i++) {
        if (i > 0) result += '-';
        for (let j = 0; j < 3; j++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }
      return result;
    },

    copyToClipboard: function(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Copied to clipboard!', 'success');
      }).catch(() => {
        this.showToast('Failed to copy', 'error');
      });
    },

    showToast: function(message, type = 'info') {
      const container = document.querySelector('.toast-container') || this.createToastContainer();
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `
        <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${type === 'success' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' :
            type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' :
            '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
        </svg>
        <div class="toast-content">
          <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      `;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    },

    createToastContainer: function() {
      const container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
      return container;
    },

    formatTime: function(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      return `${m}:${s.toString().padStart(2, '0')}`;
    },

    formatDate: function(date) {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  document.addEventListener('DOMContentLoaded', () => VideoMeet.init());
})();