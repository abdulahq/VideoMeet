// VideoMeet - Socket.IO Module
(function() {
  'use strict';

  const Socket = {
    socket: null,
    connected: false,
    meetingId: null,

    connect: function(meetingId) {
      this.meetingId = meetingId;
      
      if (typeof io !== 'undefined') {
        this.socket = io(VideoMeet.config.socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        this.bindEvents();
      } else {
        console.log('Socket.IO client not loaded - running in offline mode');
        this.connected = true;
        this.simulateParticipants();
      }
    },

    bindEvents: function() {
      if (!this.socket) return;

      this.socket.on('connect', () => {
        this.connected = true;
        console.log('Socket connected');
        this.joinRoom();
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log('Socket disconnected');
      });

      this.socket.on('participant-joined', (data) => {
        Meeting.addParticipant(data);
        Chat.addSystemMessage(`${data.name} joined the meeting`);
      });

      this.socket.on('participant-left', (data) => {
        Meeting.removeParticipant(data.id);
        Chat.addSystemMessage(`${data.name} left the meeting`);
      });

      this.socket.on('participant-update', (data) => {
        const participant = Meeting.participants.find(p => p.id === data.id);
        if (participant) {
          Object.assign(participant, data);
          Meeting.renderParticipantsList();
        }
      });

      this.socket.on('chat-message', (data) => {
        Chat.receiveMessage(data);
      });

      this.socket.on('screen-share-update', (data) => {
        if (data.sharing) {
          this.showScreenShareNotice(data.name);
        }
      });

      this.socket.on('reaction', (data) => {
        this.showReaction(data.name, data.type);
      });

      this.socket.on('offer', (data) => {
        WebRTC.handleOffer(data);
      });

      this.socket.on('answer', (data) => {
        WebRTC.handleAnswer(data);
      });

      this.socket.on('ice-candidate', (data) => {
        WebRTC.handleIceCandidate(data);
      });
    },

    joinRoom: function() {
      if (this.socket) {
        this.socket.emit('join-room', {
          meetingId: this.meetingId,
          user: VideoMeet.state.user
        });
      }
    },

    emit: function(event, data) {
      if (this.socket && this.connected) {
        this.socket.emit(event, data);
      }
    },

    disconnect: function() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      this.connected = false;
    },

    simulateParticipants: function() {
      setTimeout(() => {
        Meeting.addParticipant({ id: '1', name: 'John Doe', isHost: false, muted: false, videoOff: false });
        Chat.addSystemMessage('John Doe joined the meeting');
      }, 2000);

      setTimeout(() => {
        Meeting.addParticipant({ id: '2', name: 'Jane Smith', isHost: false, muted: true, videoOff: false });
        Chat.addSystemMessage('Jane Smith joined the meeting');
      }, 4000);
    },

    showScreenShareNotice: function(name) {
      VideoMeet.showToast(`${name} is sharing their screen`, 'info');
    },

    showReaction: function(name, type) {
      const reactions = { hand: '✋', clap: '👏', heart: '❤️', laugh: '😂', thumbsup: '👍' };
      const reaction = document.createElement('div');
      reaction.className = 'reaction-float';
      reaction.textContent = reactions[type] || '👋';
      reaction.style.left = `${Math.random() * 60 + 20}%`;
      reaction.style.top = '50%';
      document.querySelector('.meeting-main')?.appendChild(reaction);
      setTimeout(() => reaction.remove(), 2000);
    }
  };

  window.Socket = Socket;
})();