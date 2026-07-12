// ============================================
// Alpha Whisper v2.0 - API Client
// ============================================

const API_BASE = 'http://47.119.141.23:3000/api';

const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const authHeaders = this.getAuthHeaders();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        localStorage.removeItem('alpha_whisper_user');
        localStorage.removeItem('alpha_whisper_token');
        AppState.user = null;
        App.showToast('Session expired. Please log in again.', 'warning');
        setTimeout(() => {
          Auth.showLoginModal();
          Auth.updateUIForAuth();
        }, 1500);
        throw new Error('Unauthorized');
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.message || data?.error || `HTTP ${response.status}`;
        throw new Error(message);
      }

      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        App.showToast('Network error. Please check your connection.', 'error');
      }
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, data) {
    return this.request(endpoint, { method: 'POST', body: data });
  },

  put(endpoint, data) {
    return this.request(endpoint, { method: 'PUT', body: data });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  getAuthHeaders() {
    const token = localStorage.getItem('alpha_whisper_token');
    return token ? { 'x-auth-token': token } : {};
  }
};
