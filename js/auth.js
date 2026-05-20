// VideoMeet - Authentication Module
(function() {
  'use strict';

  const Auth = {
    users: JSON.parse(localStorage.getItem('videomeet_users') || '[]'),

    login: function(email, password) {
      const user = this.users.find(u => u.email === email && u.password === password);
      if (user) {
        const userData = { id: user.id, name: user.name, email: user.email };
        VideoMeet.saveUserSession(userData);
        return { success: true, user: userData };
      }
      return { success: false, error: 'Invalid email or password' };
    },

    signup: function(name, email, password) {
      if (this.users.find(u => u.email === email)) {
        return { success: false, error: 'Email already registered' };
      }
      const user = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
      };
      this.users.push(user);
      this.saveUsers();
      const userData = { id: user.id, name: user.name, email: user.email };
      VideoMeet.saveUserSession(userData);
      return { success: true, user: userData };
    },

    logout: function() {
      VideoMeet.clearSession();
      window.location.href = 'index.html';
    },

    saveUsers: function() {
      localStorage.setItem('videomeet_users', JSON.stringify(this.users));
    },

    validateEmail: function(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    validatePassword: function(password) {
      return password.length >= 6;
    }
  };

  window.Auth = Auth;

  document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('loginError');

        if (!email || !password) {
          errorEl.textContent = 'Please fill in all fields';
          errorEl.parentElement.classList.add('has-error');
          return;
        }

        const result = Auth.login(email, password);
        if (result.success) {
          window.location.href = 'dashboard.html';
        } else {
          errorEl.textContent = result.error;
          errorEl.parentElement.classList.add('has-error');
        }
      });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const errorEl = document.getElementById('signupError');

        if (!name || !email || !password || !confirmPassword) {
          errorEl.textContent = 'Please fill in all fields';
          errorEl.parentElement.classList.add('has-error');
          return;
        }

        if (!Auth.validateEmail(email)) {
          errorEl.textContent = 'Please enter a valid email address';
          errorEl.parentElement.classList.add('has-error');
          return;
        }

        if (!Auth.validatePassword(password)) {
          errorEl.textContent = 'Password must be at least 6 characters';
          errorEl.parentElement.classList.add('has-error');
          return;
        }

        if (password !== confirmPassword) {
          errorEl.textContent = 'Passwords do not match';
          errorEl.parentElement.classList.add('has-error');
          return;
        }

        const result = Auth.signup(name, email, password);
        if (result.success) {
          window.location.href = 'dashboard.html';
        } else {
          errorEl.textContent = result.error;
          errorEl.parentElement.classList.add('has-error');
        }
      });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => Auth.logout());
    }
  });
})();