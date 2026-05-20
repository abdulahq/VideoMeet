// VideoMeet - Recording Module
(function() {
  'use strict';

  const Recording = {
    mediaRecorder: null,
    recordedChunks: [],
    isRecording: false,
    isPaused: false,
    startTime: null,

    start: function(streams) {
      this.recordedChunks = [];
      
      const combinedStream = new MediaStream();
      streams.forEach(stream => {
        stream.getTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
      });

      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      }
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }

      try {
        this.mediaRecorder = new MediaRecorder(combinedStream, options);
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          this.handleRecordingStop();
        };

        this.mediaRecorder.onerror = (event) => {
          console.error('Recording error:', event);
          VideoMeet.showToast('Recording error occurred', 'error');
        };

        this.mediaRecorder.start(1000);
        this.isRecording = true;
        this.startTime = Date.now();
        
        this.showRecordingIndicator();
        VideoMeet.showToast('Recording started', 'success');
        
      } catch (err) {
        console.error('Failed to start recording:', err);
        VideoMeet.showToast('Failed to start recording', 'error');
      }
    },

    stop: function() {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.isRecording = false;
        this.hideRecordingIndicator();
      }
    },

    pause: function() {
      if (this.mediaRecorder && this.isRecording && !this.isPaused) {
        this.mediaRecorder.pause();
        this.isPaused = true;
        VideoMeet.showToast('Recording paused', 'info');
      }
    },

    resume: function() {
      if (this.mediaRecorder && this.isRecording && this.isPaused) {
        this.mediaRecorder.resume();
        this.isPaused = false;
        VideoMeet.showToast('Recording resumed', 'info');
      }
    },

    handleRecordingStop: function() {
      if (this.recordedChunks.length === 0) {
        VideoMeet.showToast('No recording data', 'error');
        return;
      }

      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const duration = Math.floor((Date.now() - this.startTime) / 1000);
      
      this.saveRecording(blob, url, duration);
    },

    saveRecording: function(blob, url, duration) {
      const recordings = JSON.parse(localStorage.getItem('videomeet_recordings') || '[]');
      
      const recording = {
        id: Date.now().toString(),
        name: `Meeting Recording ${new Date().toLocaleDateString()}`,
        url: url,
        date: new Date().toISOString(),
        duration: duration,
        size: this.formatFileSize(blob.size),
        meetingId: Meeting.meetingId
      };

      recordings.unshift(recording);
      localStorage.setItem('videomeet_recordings', JSON.stringify(recordings));

      this.downloadRecording(blob, recording.name);
    },

    downloadRecording: function(blob, name) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${name.replace(/\s+/g, '_')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      VideoMeet.showToast('Recording saved and downloaded', 'success');
    },

    showRecordingIndicator: function() {
      const indicator = document.getElementById('recordingIndicator');
      if (indicator) {
        indicator.classList.remove('hidden');
      }
    },

    hideRecordingIndicator: function() {
      const indicator = document.getElementById('recordingIndicator');
      if (indicator) {
        indicator.classList.add('hidden');
      }
    },

    formatFileSize: function(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    formatDuration: function(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      
      if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
  };

  window.Recording = Recording;
})();