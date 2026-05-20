// VideoMeet - Meeting Room Module
(function() {
  'use strict';

  const Meeting = {
    meetingId: null,
    localStream: null,
    screenStream: null,
    peers: {},
    participants: [],
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
    isRecording: false,
    meetingStartTime: null,
    timerInterval: null,

    init: function() {
      const urlParams = new URLSearchParams(window.location.search);
      this.meetingId = urlParams.get('id') || VideoMeet.generateMeetingId();
      
      if (!VideoMeet.state.isAuthenticated) {
        window.location.href = 'index.html';
        return;
      }

      this.renderMeetingInfo();
      this.bindEvents();
      this.requestMediaPermissions();
      this.startTimer();
      Socket.connect(this.meetingId);
    },

    renderMeetingInfo: function() {
      const idEl = document.getElementById('meetingIdDisplay');
      if (idEl) idEl.textContent = this.meetingId;
    },

    requestMediaPermissions: async function() {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        this.setupLocalVideo();
      } catch (err) {
        console.error('Media permission error:', err);
        this.showPermissionError();
      }
    },

    setupLocalVideo: function() {
      const localVideo = document.getElementById('localVideo');
      if (localVideo && this.localStream) {
        localVideo.srcObject = this.localStream;
        localVideo.play();
      }
    },

    showPermissionError: function() {
      const videoGrid = document.getElementById('videoGrid');
      if (videoGrid) {
        videoGrid.innerHTML = `
          <div class="empty-state">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
            <h3>Camera/Microphone Access Required</h3>
            <p class="text-muted">Please allow access to your camera and microphone to join the meeting.</p>
            <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
          </div>
        `;
      }
    },

    bindEvents: function() {
      const toggleMuteBtn = document.getElementById('toggleMuteBtn');
      if (toggleMuteBtn) {
        toggleMuteBtn.addEventListener('click', () => this.toggleMute());
      }

      const toggleVideoBtn = document.getElementById('toggleVideoBtn');
      if (toggleVideoBtn) {
        toggleVideoBtn.addEventListener('click', () => this.toggleVideo());
      }

      const screenShareBtn = document.getElementById('screenShareBtn');
      if (screenShareBtn) {
        screenShareBtn.addEventListener('click', () => this.toggleScreenShare());
      }

      const toggleChatBtn = document.getElementById('toggleChatBtn');
      if (toggleChatBtn) {
        toggleChatBtn.addEventListener('click', () => this.toggleSidebar('chat'));
      }

      const toggleParticipantsBtn = document.getElementById('toggleParticipantsBtn');
      if (toggleParticipantsBtn) {
        toggleParticipantsBtn.addEventListener('click', () => this.toggleSidebar('participants'));
      }

      const toggleRecordBtn = document.getElementById('toggleRecordBtn');
      if (toggleRecordBtn) {
        toggleRecordBtn.addEventListener('click', () => this.toggleRecording());
      }

      const endCallBtn = document.getElementById('endCallBtn');
      if (endCallBtn) {
        endCallBtn.addEventListener('click', () => this.endCall());
      }

      const fullscreenBtn = document.getElementById('fullscreenBtn');
      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
      }

      const raiseHandBtn = document.getElementById('raiseHandBtn');
      if (raiseHandBtn) {
        raiseHandBtn.addEventListener('click', () => this.raiseHand());
      }

      this.setupChatInput();
      this.setupSidebarClose();
    },

    toggleMute: function() {
      this.isMuted = !this.isMuted;
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach(track => {
          track.enabled = !this.isMuted;
        });
      }
      const btn = document.getElementById('toggleMuteBtn');
      if (btn) {
        btn.classList.toggle('muted', this.isMuted);
        btn.querySelector('span').textContent = this.isMuted ? 'Unmute' : 'Mute';
      }
      Socket.emit('participant-update', { muted: this.isMuted });
    },

    toggleVideo: function() {
      this.isVideoOff = !this.isVideoOff;
      if (this.localStream) {
        this.localStream.getVideoTracks().forEach(track => {
          track.enabled = !this.isVideoOff;
        });
      }
      const btn = document.getElementById('toggleVideoBtn');
      if (btn) {
        btn.classList.toggle('active', this.isVideoOff);
        btn.querySelector('span').textContent = this.isVideoOff ? 'Start Video' : 'Stop Video';
      }
      Socket.emit('participant-update', { videoOff: this.isVideoOff });
    },

    toggleScreenShare: async function() {
      if (this.isScreenSharing) {
        if (this.screenStream) {
          this.screenStream.getTracks().forEach(track => track.stop());
          this.screenStream = null;
        }
        this.isScreenSharing = false;
      } else {
        try {
          this.screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
          });
          this.isScreenSharing = true;
          this.screenStream.getVideoTracks()[0].onended = () => {
            this.isScreenSharing = false;
            this.updateScreenShareButton();
          };
        } catch (err) {
          console.log('Screen share cancelled');
          return;
        }
      }
      this.updateScreenShareButton();
      Socket.emit('screen-share-update', { sharing: this.isScreenSharing });
    },

    updateScreenShareButton: function() {
      const btn = document.getElementById('screenShareBtn');
      if (btn) {
        btn.classList.toggle('active', this.isScreenSharing);
        btn.querySelector('span').textContent = this.isScreenSharing ? 'Stop Share' : 'Share Screen';
      }
    },

    toggleSidebar: function(type) {
      const sidebar = document.getElementById('meetingSidebar');
      const allBtns = document.querySelectorAll('.control-btn[data-panel]');
      
      allBtns.forEach(btn => btn.classList.remove('active'));
      
      if (sidebar.classList.contains('open')) {
        const currentType = sidebar.dataset.panel;
        if (currentType === type) {
          sidebar.classList.remove('open');
        } else {
          sidebar.dataset.panel = type;
          this.renderSidebarContent(type);
        }
      } else {
        sidebar.classList.add('open');
        sidebar.dataset.panel = type;
        this.renderSidebarContent(type);
        document.getElementById(`${type}Btn`)?.classList.add('active');
      }
    },

    renderSidebarContent: function(type) {
      const container = document.getElementById('sidebarContent');
      if (!container) return;

      if (type === 'chat') {
        container.innerHTML = Chat.getHTML();
        Chat.init();
      } else if (type === 'participants') {
        container.innerHTML = this.getParticipantsHTML();
      }
    },

    getParticipantsHTML: function() {
      const currentUser = VideoMeet.state.user;
      const participants = [
        { name: currentUser.name, isHost: true, muted: this.isMuted, videoOff: this.isVideoOff },
        ...this.participants
      ];

      return `
        <div class="participants-list">
          ${participants.map(p => `
            <div class="participant-item">
              <div class="avatar">${p.name.charAt(0).toUpperCase()}</div>
              <div class="participant-info">
                <div class="participant-name-text">${p.name}${p.isHost ? ' (Host)' : ''}</div>
              </div>
              <div class="participant-icons">
                ${p.muted ? '<svg class="muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/></svg>' : ''}
                ${p.videoOff ? '<svg class="muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    },

    setupChatInput: function() {
      const chatInput = document.getElementById('chatInput');
      const sendBtn = document.getElementById('sendChatBtn');

      if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', () => Chat.sendMessage(chatInput.value));
        chatInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') Chat.sendMessage(chatInput.value);
        });
      }
    },

    setupSidebarClose: function() {
      const closeBtn = document.getElementById('sidebarCloseBtn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          document.getElementById('meetingSidebar').classList.remove('open');
          document.querySelectorAll('.control-btn[data-panel]').forEach(b => b.classList.remove('active'));
        });
      }
    },

    toggleRecording: function() {
      if (this.isRecording) {
        Recording.stop();
        this.isRecording = false;
      } else {
        if (this.localStream) {
          Recording.start([this.localStream]);
          this.isRecording = true;
        }
      }
      const btn = document.getElementById('toggleRecordBtn');
      if (btn) {
        btn.classList.toggle('recording', this.isRecording);
        btn.querySelector('span').textContent = this.isRecording ? 'Stop Recording' : 'Record';
      }
    },

    toggleFullscreen: function() {
      const container = document.querySelector('.meeting-container');
      if (container) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
          container.classList.remove('fullscreen');
        } else {
          container.requestFullscreen();
          container.classList.add('fullscreen');
        }
      }
    },

    raiseHand: function() {
      const reaction = document.createElement('div');
      reaction.className = 'reaction-float';
      reaction.textContent = '✋';
      reaction.style.left = '50%';
      reaction.style.top = '50%';
      document.querySelector('.meeting-main')?.appendChild(reaction);
      setTimeout(() => reaction.remove(), 2000);
      Socket.emit('reaction', { type: 'hand' });
    },

    endCall: function() {
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => track.stop());
      }
      Socket.disconnect();
      window.location.href = 'dashboard.html';
    },

    startTimer: function() {
      this.meetingStartTime = Date.now();
      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.meetingStartTime) / 1000);
        const timerEl = document.getElementById('meetingTimer');
        if (timerEl) {
          timerEl.textContent = VideoMeet.formatTime(elapsed);
        }
      }, 1000);
    },

    addParticipant: function(participant) {
      this.participants.push(participant);
      this.renderParticipantsList();
    },

    removeParticipant: function(participantId) {
      this.participants = this.participants.filter(p => p.id !== participantId);
      this.renderParticipantsList();
    },

    renderParticipantsList: function() {
      const sidebar = document.getElementById('meetingSidebar');
      if (sidebar.classList.contains('open') && sidebar.dataset.panel === 'participants') {
        this.renderSidebarContent('participants');
      }
    }
  };

  window.Meeting = Meeting;

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('meetingPage')) {
      Meeting.init();
    }
  });
})();