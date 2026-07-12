// ============================================
// Alpha Whisper v2.0 - Profile Tab
// ============================================

const Profile = {
  renderProfileTab() {
    const container = document.getElementById('profile-content');
    container.innerHTML = '';

    if (!AppState.user) {
      this.renderLoggedOutView(container);
    } else {
      this.renderLoggedInView(container);
    }
  },

  renderLoggedOutView(container) {
    container.innerHTML = `
      <div class="profile-card" style="margin-top: 16px;">
        <img src="../logo.png" alt="Alpha Whisper" style="width:64px;height:64px;border-radius:50%;margin:0 auto 16px;object-fit:cover;box-shadow:0 4px 20px rgba(59,130,246,0.2);">
        <h3 style="font-size:20px;font-weight:700;margin-bottom:4px;">Welcome to Alpha Whisper</h3>
        <p style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;">Sign in to access personalized insights and portfolio tracking.</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn-primary" onclick="Auth.showLoginModal()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Sign In
          </button>
          <button class="btn-secondary" onclick="Auth.showRegisterModal()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Create Account
          </button>
        </div>
      </div>
    `;
  },

  renderLoggedInView(container) {
    const user = AppState.user;
    const riskScore = user.risk_score || 65;
    const riskLevel = riskScore < 40 ? 'low' : riskScore < 70 ? 'medium' : 'high';
    const riskLabel = riskScore < 40 ? 'Conservative' : riskScore < 70 ? 'Moderate' : 'Aggressive';

    // User card
    const userCard = document.createElement('div');
    userCard.className = 'profile-card';
    userCard.innerHTML = `
      <div class="profile-avatar">${(user.username || 'U').charAt(0).toUpperCase()}</div>
      <div class="profile-name">${user.username || 'User'}</div>
      <div class="profile-email">${user.email || ''}</div>
      <div style="display:flex;gap:16px;justify-content:center;margin-top:8px;">
        <div style="text-align:center;">
          <div style="font-size:18px;font-weight:700;">8</div>
          <div style="font-size:11px;color:var(--text-secondary);">Holdings</div>
        </div>
        <div style="width:1px;background:var(--border);"></div>
        <div style="text-align:center;">
          <div style="font-size:18px;font-weight:700;">$124K</div>
          <div style="font-size:11px;color:var(--text-secondary);">Portfolio</div>
        </div>
        <div style="width:1px;background:var(--border);"></div>
        <div style="text-align:center;">
          <div style="font-size:18px;font-weight:700;color:var(--success);">+18%</div>
          <div style="font-size:11px;color:var(--text-secondary);">Return</div>
        </div>
      </div>

      <!-- Risk Profile -->
      <div class="risk-section">
        <div class="risk-label">Risk Profile: ${riskLabel}</div>
        <div class="risk-bar">
          <div class="risk-bar-fill ${riskLevel}" style="width: ${riskScore}%"></div>
        </div>
        <div class="risk-zones">
          <span>Conservative</span>
          <span>Moderate</span>
          <span>Aggressive</span>
        </div>
        <div class="risk-score-text">Score: ${riskScore}/100</div>
      </div>
    `;
    container.appendChild(userCard);

    // Menu items
    const menu = document.createElement('div');
    menu.className = 'profile-menu';
    menu.style.marginTop = '12px';
    menu.innerHTML = `
      <div class="menu-item" onclick="Profile.showEditProfile()">
        <div class="menu-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
        <div class="menu-text">Edit Profile</div>
        <div class="menu-chevron">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>

      <div class="menu-item" onclick="Profile.showChangePassword()">
        <div class="menu-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div class="menu-text">Change Password</div>
        <div class="menu-chevron">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>

      <div class="menu-item" onclick="Profile.showRiskAssessment()">
        <div class="menu-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="menu-text">Risk Assessment</div>
        <div class="menu-chevron">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>

      <div class="menu-item" onclick="Profile.showHelp()">
        <div class="menu-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="menu-text">Help & Support</div>
        <div class="menu-chevron">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>

      <div class="menu-item" onclick="Auth.handleLogout()" style="color: var(--danger);">
        <div class="menu-icon" style="color: var(--danger);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </div>
        <div class="menu-text" style="color: var(--danger);">Log Out</div>
        <div class="menu-chevron">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    `;
    container.appendChild(menu);

    // App info
    const appInfo = document.createElement('div');
    appInfo.style.cssText = 'text-align:center;padding:20px 0;color:var(--text-muted);font-size:12px;';
    appInfo.innerHTML = `Alpha Whisper v2.0 &middot; Build 2024.06`;
    container.appendChild(appInfo);
  },

  showEditProfile() {
    const modal = document.getElementById('auth-modal');
    document.getElementById('auth-modal-title').textContent = 'Edit Profile';
    document.getElementById('auth-modal-body').innerHTML = `
      <form onsubmit="Profile.handleEditProfile(event)">
        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" id="edit-username" class="form-input" value="${AppState.user?.username || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" id="edit-email" class="form-input" value="${AppState.user?.email || ''}" required>
        </div>
        <button type="submit" class="btn-primary" style="width:100%;">Save Changes</button>
      </form>
    `;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  handleEditProfile(event) {
    event.preventDefault();
    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;

    AppState.user = { ...AppState.user, username, email };
    localStorage.setItem('alpha_whisper_user', JSON.stringify(AppState.user));
    App.showToast('Profile updated', 'success');
    document.getElementById('auth-modal').classList.add('hidden');
    document.body.style.overflow = '';
    this.renderProfileTab();
  },

  showChangePassword() {
    const modal = document.getElementById('auth-modal');
    document.getElementById('auth-modal-title').textContent = 'Change Password';
    document.getElementById('auth-modal-body').innerHTML = `
      <form onsubmit="Profile.handleChangePassword(event)">
        <div class="form-group">
          <label class="form-label">Current Password</label>
          <input type="password" id="current-password" class="form-input" placeholder="Enter current password" required>
        </div>
        <div class="form-group">
          <label class="form-label">New Password</label>
          <input type="password" id="new-password" class="form-input" placeholder="Min 6 characters" required minlength="6">
        </div>
        <div class="form-group">
          <label class="form-label">Confirm New Password</label>
          <input type="password" id="confirm-password" class="form-input" placeholder="Confirm new password" required>
        </div>
        <button type="submit" class="btn-primary" style="width:100%;">Update Password</button>
      </form>
    `;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  handleChangePassword(event) {
    event.preventDefault();
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;

    if (newPass !== confirmPass) {
      App.showToast('Passwords do not match', 'error');
      return;
    }

    App.showToast('Password updated successfully', 'success');
    document.getElementById('auth-modal').classList.add('hidden');
    document.body.style.overflow = '';
  },

  showRiskAssessment() {
    const modal = document.getElementById('auth-modal');
    document.getElementById('auth-modal-title').textContent = 'Risk Assessment';
    document.getElementById('auth-modal-body').innerHTML = `
      <form onsubmit="Profile.handleRiskAssessment(event)">
        <div class="form-group">
          <label class="form-label">1. Investment Time Horizon</label>
          <select id="risk-horizon" class="form-input">
            <option value="10">Less than 1 year</option>
            <option value="25">1-3 years</option>
            <option value="50" selected>3-7 years</option>
            <option value="75">7-15 years</option>
            <option value="100">15+ years</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">2. Maximum Loss Tolerance</label>
          <select id="risk-tolerance" class="form-input">
            <option value="10">No loss acceptable</option>
            <option value="30">Up to 10%</option>
            <option value="50" selected>Up to 20%</option>
            <option value="75">Up to 35%</option>
            <option value="100">More than 35%</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">3. Investment Knowledge</label>
          <select id="risk-knowledge" class="form-input">
            <option value="10">Beginner</option>
            <option value="35">Some experience</option>
            <option value="60" selected>Knowledgeable</option>
            <option value="85">Experienced</option>
            <option value="100">Expert</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">4. Income Stability</label>
          <select id="risk-income" class="form-input">
            <option value="15">Unstable / Variable</option>
            <option value="40">Somewhat stable</option>
            <option value="65" selected>Stable</option>
            <option value="90">Very stable</option>
          </select>
        </div>
        <button type="submit" class="btn-primary" style="width:100%;">Calculate Risk Score</button>
      </form>
    `;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  handleRiskAssessment(event) {
    event.preventDefault();
    const horizon = parseInt(document.getElementById('risk-horizon').value);
    const tolerance = parseInt(document.getElementById('risk-tolerance').value);
    const knowledge = parseInt(document.getElementById('risk-knowledge').value);
    const income = parseInt(document.getElementById('risk-income').value);

    const score = Math.round((horizon + tolerance + knowledge + income) / 4);
    const level = score < 40 ? 'Conservative' : score < 70 ? 'Moderate' : 'Aggressive';

    AppState.user = { ...AppState.user, risk_score: score };
    localStorage.setItem('alpha_whisper_user', JSON.stringify(AppState.user));

    document.getElementById('auth-modal-body').innerHTML = `
      <div style="text-align:center;padding:16px 0;">
        <div style="font-size:48px;font-weight:700;color:var(--primary);margin-bottom:8px;">${score}</div>
        <div style="font-size:18px;font-weight:600;margin-bottom:4px;">${level} Investor</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Your risk profile has been updated</div>
        <div class="risk-bar" style="margin-bottom:16px;">
          <div class="risk-bar-fill ${score < 40 ? 'low' : score < 70 ? 'medium' : 'high'}" style="width:${score}%"></div>
        </div>
        <button class="btn-primary" style="width:100%;" onclick="Auth.closeAuthModal();Profile.renderProfileTab();">Done</button>
      </div>
    `;
  },

  showHelp() {
    const modal = document.getElementById('auth-modal');
    document.getElementById('auth-modal-title').textContent = 'Help & Support';
    document.getElementById('auth-modal-body').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="card" style="padding:12px;">
          <div style="font-weight:600;margin-bottom:4px;">How do I add a stock to my portfolio?</div>
          <div style="font-size:13px;color:var(--text-secondary);">Go to the Portfolio tab, tap "Add", and enter the stock symbol, shares, and average cost.</div>
        </div>
        <div class="card" style="padding:12px;">
          <div style="font-weight:600;margin-bottom:4px;">What is the risk score?</div>
          <div style="font-size:13px;color:var(--text-secondary);">Your risk score (0-100) helps us tailor investment advice. Lower = conservative, Higher = aggressive.</div>
        </div>
        <div class="card" style="padding:12px;">
          <div style="font-weight:600;margin-bottom:4px;">How does Alpha Bot work?</div>
          <div style="font-size:13px;color:var(--text-secondary);">Alpha Bot uses AI to analyze market data, provide insights, and answer your investment questions.</div>
        </div>
        <div class="card" style="padding:12px;">
          <div style="font-weight:600;margin-bottom:4px;">Contact Support</div>
          <div style="font-size:13px;color:var(--text-secondary);">Email: support@alphawhisper.com</div>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
};
