// VideoMeet - WebRTC Module
(function() {
  'use strict';

  const WebRTC = {
    localStream: null,
    peerConnections: {},
    config: {
      iceServers: VideoMeet.config.iceServers
    },

    createPeerConnection: function(participantId) {
      const pc = new RTCPeerConnection(this.config);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          Socket.emit('ice-candidate', {
            targetId: participantId,
            candidate: event.candidate
          });
        }
      };

      pc.ontrack = (event) => {
        this.handleRemoteStream(participantId, event.streams[0]);
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`ICE Connection State: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          this.restartConnection(participantId);
        }
      };

      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          pc.addTrack(track, this.localStream);
        });
      }

      this.peerConnections[participantId] = pc;
      return pc;
    },

    startCall: async function(participantId) {
      const pc = this.createPeerConnection(participantId);
      
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        Socket.emit('offer', {
          targetId: participantId,
          offer: offer
        });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    },

    handleOffer: async function(data) {
      const pc = this.createPeerConnection(data.senderId);
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        Socket.emit('answer', {
          targetId: data.senderId,
          answer: answer
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    },

    handleAnswer: async function(data) {
      const pc = this.peerConnections[data.senderId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    },

    handleIceCandidate: async function(data) {
      const pc = this.peerConnections[data.senderId];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    },

    handleRemoteStream: function(participantId, stream) {
      const videoGrid = document.getElementById('videoGrid');
      if (!videoGrid) return;

      let videoTile = document.getElementById(`video-${participantId}`);
      
      if (!videoTile) {
        videoTile = document.createElement('div');
        videoTile.id = `video-${participantId}`;
        videoTile.className = 'video-tile';
        videoTile.innerHTML = `
          <video autoplay playsinline></video>
          <div class="video-overlay">
            <div class="participant-name">
              <span>Participant ${participantId}</span>
            </div>
          </div>
        `;
        videoGrid.appendChild(videoTile);
      }

      const video = videoTile.querySelector('video');
      if (video) {
        video.srcObject = stream;
      }

      this.updateLayout();
    },

    updateLayout: function() {
      const videoGrid = document.getElementById('videoGrid');
      if (!videoGrid) return;

      const tileCount = videoGrid.children.length + 1;
      const container = document.querySelector('.video-grid');
      if (container) {
        container.className = 'video-grid';
        if (tileCount <= 1) container.classList.add('layout-1');
        else if (tileCount === 2) container.classList.add('layout-2');
        else if (tileCount <= 4) container.classList.add('layout-4');
        else if (tileCount <= 9) container.classList.add('layout-9');
      }
    },

    restartConnection: function(participantId) {
      const pc = this.peerConnections[participantId];
      if (pc) {
        pc.restartIce();
      }
    },

    closePeerConnection: function(participantId) {
      const pc = this.peerConnections[participantId];
      if (pc) {
        pc.close();
        delete this.peerConnections[participantId];
      }
      
      const videoTile = document.getElementById(`video-${participantId}`);
      if (videoTile) {
        videoTile.remove();
      }
    },

    closeAllConnections: function() {
      Object.keys(this.peerConnections).forEach(id => {
        this.closePeerConnection(id);
      });
    },

    replaceTrack: function(newTrack) {
      Object.values(this.peerConnections).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === newTrack.kind);
        if (sender) {
          sender.replaceTrack(newTrack);
        }
      });
    }
  };

  window.WebRTC = WebRTC;
})();