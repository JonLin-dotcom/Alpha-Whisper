// ============================================
// Alpha Whisper v2.0 - Authentication Module
// ============================================

const Auth = {
  showLoginModal() {
    this.renderAuthForms('login');
    document.getElementById('auth-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  showRegisterModal() {
    this.renderAuthForms('register');
    document.getElementById('auth-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  closeAuthModal() {
    document.getElementById('auth-modal').classList.add('hidden');
    document.body.style.overflow = '';
  },

  renderAuthForms(mode) {
    const title = document.getElementById('auth-modal-title');
    const body = document.getElementById('auth-modal-body');

    if (mode === 'login') {
      title.textContent = 'Welcome Back';
      body.innerHTML = `
        <form onsubmit="Auth.handleLogin(event)">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" name="username" class="form-input" placeholder="Enter username" required autocomplete="username">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" name="password" class="form-input" placeholder="Enter password" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn-primary" style="width: 100%;">Sign In</button>
        </form>
        <div class="auth-divider">or</div>
        <button class="btn-secondary" style="width: 100%;" onclick="Auth.showRegisterModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          Create Account
        </button>
      `;
    } else {
      title.textContent = 'Create Account';
      body.innerHTML = `
        <form onsubmit="Auth.handleRegister(event)">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" name="username" class="form-input" placeholder="Choose a username" required autocomplete="username" minlength="3">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" name="email" class="form-input" placeholder="your@email.com" required autocomplete="email">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" name="password" class="form-input" placeholder="Min 6 characters" required autocomplete="new-password" minlength="6">
          </div>
          <div class="form-group">
            <label class="form-label">Confirm Password</label>
            <input type="password" name="password2" class="form-input" placeholder="Confirm password" required autocomplete="new-password">
          </div>
          <button type="submit" class="btn-primary" style="width: 100%;">Create Account</button>
        </form>
        <div class="auth-toggle">
          Already have an account?<button onclick="Auth.showLoginModal()">Sign In</button>
        </div>
      `;
    }
  },

  async handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      App.showLoading(true);
      const result = await api.post('/auth/login', data);

      if (result.token) {
        localStorage.setItem('alpha_whisper_token', result.token);
        localStorage.setItem('alpha_whisper_user', JSON.stringify(result.user));
        AppState.user = result.user;
        App.showToast(`Welcome back, ${result.user.username}!`, 'success');
        Auth.closeAuthModal();
        Auth.updateUIForAuth();
        Portfolio.renderPortfolioTab();
        Profile.renderProfileTab();
      }
    } catch (error) {
      App.showToast(error.message || 'Login failed', 'error');
    } finally {
      App.showLoading(false);
    }
  },

  async handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    if (data.password !== data.password2) {
      App.showToast('Passwords do not match', 'error');
      return;
    }

    try {
      App.showLoading(true);
      const result = await api.post('/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password
      });

      if (result.token) {
        localStorage.setItem('alpha_whisper_token', result.token);
        localStorage.setItem('alpha_whisper_user', JSON.stringify(result.user));
        AppState.user = result.user;
        App.showToast(`Welcome, ${result.user.username}!`, 'success');
        Auth.closeAuthModal();
        Auth.updateUIForAuth();
        Portfolio.renderPortfolioTab();
        Profile.renderProfileTab();
      }
    } catch (error) {
      App.showToast(error.message || 'Registration failed', 'error');
    } finally {
      App.showLoading(false);
    }
  },

  handleLogout() {
    localStorage.removeItem('alpha_whisper_token');
    localStorage.removeItem('alpha_whisper_user');
    AppState.user = null;
    AppState.portfolio = [];
    AppState.holdings = [];
    App.showToast('Logged out successfully', 'info');
    Auth.updateUIForAuth();
    Portfolio.renderPortfolioTab();
    Profile.renderProfileTab();
  },

  async checkAuth() {
    const token = localStorage.getItem('alpha_whisper_token');
    const userStr = localStorage.getItem('alpha_whisper_user');

    if (!token || !userStr) {
      Auth.updateUIForAuth();
      return;
    }

    try {
      AppState.user = JSON.parse(userStr);
      Auth.updateUIForAuth();
    } catch (e) {
      localStorage.removeItem('alpha_whisper_token');
      localStorage.removeItem('alpha_whisper_user');
      Auth.updateUIForAuth();
    }
  },

  updateUIForAuth() {
    const authBtn = document.getElementById('auth-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (AppState.user) {
      authBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
    } else {
      authBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
    }
  }
};
