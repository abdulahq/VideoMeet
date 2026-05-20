// VideoMeet - Dashboard Module
(function() {
  'use strict';

  const Dashboard = {
    meetings: JSON.parse(localStorage.getItem('videomeet_meetings') || '[]'),
    recordings: JSON.parse(localStorage.getItem('videomeet_recordings') || '[]'),

    init: function() {
      if (!VideoMeet.state.isAuthenticated) {
        window.location.href = 'index.html';
        return;
      }
      this.renderUserInfo();
      this.renderMeetings();
      this.renderRecordings();
      this.bindEvents();
    },

    renderUserInfo: function() {
      const user = VideoMeet.state.user;
      const nameEl = document.getElementById('userName');
      const emailEl = document.getElementById('userEmail');
      const avatarEl = document.getElementById('userAvatar');

      if (nameEl) nameEl.textContent = user.name;
      if (emailEl) emailEl.textContent = user.email;
      if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
    },

    renderMeetings: function() {
      const upcomingContainer = document.getElementById('upcomingMeetings');
      const historyContainer = document.getElementById('historyMeetings');

      const upcoming = this.meetings.filter(m => new Date(m.scheduledTime) > new Date() && m.status !== 'completed');
      const history = this.meetings.filter(m => m.status === 'completed' || new Date(m.scheduledTime) < new Date());

      if (upcomingContainer) {
        if (upcoming.length === 0) {
          upcomingContainer.innerHTML = this.getEmptyState('No upcoming meetings');
        } else {
          upcomingContainer.innerHTML = upcoming.map(m => this.createMeetingCard(m)).join('');
        }
      }

      if (historyContainer) {
        if (history.length === 0) {
          historyContainer.innerHTML = this.getEmptyState('No meeting history');
        } else {
          historyContainer.innerHTML = history.map(m => this.createMeetingCard(m, true)).join('');
        }
      }
    },

    renderRecordings: function() {
      const container = document.getElementById('recordingsList');
      if (!container) return;

      if (this.recordings.length === 0) {
        container.innerHTML = this.getEmptyState('No recordings yet');
      } else {
        container.innerHTML = this.recordings.map(r => this.createRecordingCard(r)).join('');
      }
    },

    createMeetingCard: function(meeting, isHistory = false) {
      return `
        <div class="meeting-card card card-hover">
          <div class="card-body">
            <div class="meeting-card-header flex items-center justify-between">
              <div>
                <h4 class="meeting-title">${this.escapeHtml(meeting.title)}</h4>
                <p class="meeting-time text-muted">${VideoMeet.formatDate(meeting.scheduledTime)}</p>
              </div>
              <span class="badge ${meeting.status === 'completed' ? 'badge-gray' : 'badge-success'}">${meeting.status}</span>
            </div>
            <div class="meeting-card-id">
              <span class="text-muted">Meeting ID:</span>
              <code>${meeting.id}</code>
              <button class="btn-icon-sm btn-ghost copy-btn" data-id="${meeting.id}" title="Copy ID">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            </div>
            ${!isHistory ? `
              <div class="meeting-card-actions">
                <a href="meeting.html?id=${meeting.id}" class="btn btn-primary btn-sm">Join Meeting</a>
                <button class="btn btn-ghost btn-sm" onclick="Dashboard.deleteMeeting('${meeting.id}')">Delete</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    },

    createRecordingCard: function(recording) {
      return `
        <div class="recording-card card card-hover">
          <div class="card-body flex items-center gap-4">
            <div class="recording-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
            <div class="recording-info flex-1">
              <h4 class="recording-title">${this.escapeHtml(recording.name)}</h4>
              <p class="recording-meta text-muted">${recording.size} • ${VideoMeet.formatDate(recording.date)}</p>
            </div>
            <a href="${recording.url}" download="${recording.name}" class="btn btn-sm btn-secondary">Download</a>
          </div>
        </div>
      `;
    },

    getEmptyState: function(message) {
      return `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p class="text-muted">${message}</p>
        </div>
      `;
    },

    bindEvents: function() {
      document.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-btn');
        if (copyBtn) {
          VideoMeet.copyToClipboard(copyBtn.dataset.id);
        }
      });

      const newMeetingBtn = document.getElementById('newMeetingBtn');
      if (newMeetingBtn) {
        newMeetingBtn.addEventListener('click', () => this.createNewMeeting());
      }

      const joinMeetingBtn = document.getElementById('joinMeetingBtn');
      if (joinMeetingBtn) {
        joinMeetingBtn.addEventListener('click', () => this.showJoinModal());
      }

      const joinSubmitBtn = document.getElementById('joinSubmitBtn');
      if (joinSubmitBtn) {
        joinSubmitBtn.addEventListener('click', () => this.joinMeeting());
      }
    },

    createNewMeeting: function() {
      const meetingId = VideoMeet.generateMeetingId();
      const meeting = {
        id: meetingId,
        title: 'New Meeting',
        scheduledTime: new Date().toISOString(),
        status: 'scheduled',
        hostId: VideoMeet.state.user.id
      };
      this.meetings.unshift(meeting);
      this.saveMeetings();
      window.location.href = `meeting.html?id=${meetingId}`;
    },

    showJoinModal: function() {
      const modal = document.getElementById('joinMeetingModal');
      if (modal) {
        modal.classList.add('active');
      }
    },

    joinMeeting: function() {
      const meetingId = document.getElementById('joinMeetingInput').value.trim();
      if (meetingId) {
        window.location.href = `meeting.html?id=${meetingId}`;
      }
    },

    deleteMeeting: function(id) {
      this.meetings = this.meetings.filter(m => m.id !== id);
      this.saveMeetings();
      this.renderMeetings();
      VideoMeet.showToast('Meeting deleted', 'success');
    },

    saveMeetings: function() {
      localStorage.setItem('videomeet_meetings', JSON.stringify(this.meetings));
    },

    escapeHtml: function(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  window.Dashboard = Dashboard;

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboardPage')) {
      Dashboard.init();
    }
  });
})();