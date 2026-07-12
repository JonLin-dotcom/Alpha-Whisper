// ============================================
// Alpha Whisper v2.1 - API Client
// Full US Market + Real-Time Data
// ============================================

const API_BASE = 'http://47.119.141.23:3000/api';

/**
 * Generic API client with auth, error handling, and fallback to mock data.
 * All methods are async and return parsed JSON or fallback data on failure.
 */
const api = {
  // ==========================================
  // Low-level HTTP helpers
  // ==========================================

  /**
   * Perform an HTTP request with auth headers and automatic error handling.
   * @param {string} endpoint - API path (e.g., '/stocks/search')
   * @param {object} options - fetch options
   * @returns {Promise<any>} Parsed JSON response
   */
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

      // Handle unauthorized - clear session and prompt re-login
      if (response.status === 401) {
        localStorage.removeItem('alpha_whisper_user');
        localStorage.removeItem('alpha_whisper_token');
        if (typeof AppState !== 'undefined') AppState.user = null;
        if (typeof App !== 'undefined') {
          App.showToast('Session expired. Please log in again.', 'warning');
          setTimeout(() => {
            if (typeof Auth !== 'undefined') {
              Auth.showLoginModal();
              Auth.updateUIForAuth();
            }
          }, 1500);
        }
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
        if (typeof App !== 'undefined') {
          App.showToast('Network error. Please check your connection.', 'error');
        }
      }
      throw error;
    }
  },

  /** GET request */
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  /** POST request */
  post(endpoint, data) {
    return this.request(endpoint, { method: 'POST', body: data });
  },

  /** PUT request */
  put(endpoint, data) {
    return this.request(endpoint, { method: 'PUT', body: data });
  },

  /** DELETE request */
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  /** Build auth headers from stored token */
  getAuthHeaders() {
    const token = localStorage.getItem('alpha_whisper_token');
    return token ? { 'x-auth-token': token } : {};
  },

  // ==========================================
  // Auth endpoints (from v2.0)
  // ==========================================

  /** Log in a user and store the returned token */
  async login(credentials) {
    const data = await this.post('/auth/login', credentials);
    if (data.token) {
      localStorage.setItem('alpha_whisper_token', data.token);
      localStorage.setItem('alpha_whisper_user', JSON.stringify(data.user));
    }
    return data;
  },

  /** Register a new account */
  async register(userData) {
    return this.post('/auth/register', userData);
  },

  /** Get current user profile */
  async getMe() {
    return this.get('/auth/me');
  },

  // ==========================================
  // Stock data endpoints (new in v2.1)
  // ==========================================

  /**
   * Search for stocks by name or symbol.
   * @param {string} query - Search query (e.g., 'APPLE' or 'AAPL')
   * @param {number} limit - Max results (default 20)
   * @returns {Promise<Array>} Matching stocks
   */
  async searchStocks(query, limit = 20) {
    if (!query || query.trim().length === 0) return [];
    return this.get(`/stocks/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`);
  },

  /**
   * Get a real-time quote for a single stock.
   * @param {string} symbol - Stock symbol (e.g., 'AAPL')
   * @returns {Promise<object>} Quote data
   */
  async getQuote(symbol) {
    return this.get(`/stocks/${encodeURIComponent(symbol)}/quote`);
  },

  /**
   * Get historical price data for charting.
   * @param {string} symbol - Stock symbol
   * @param {string} period - Time period: '1d','5d','1mo','3mo','6mo','1y','2y','5y'
   * @param {string} interval - Bar size: '1m','2m','5m','15m','30m','1h','1d','1wk','1mo'
   * @returns {Promise<Array>} Historical data points
   */
  async getHistorical(symbol, period = '1mo', interval = '1d') {
    return this.get(
      `/stocks/${encodeURIComponent(symbol)}/historical?period=${period}&interval=${interval}`
    );
  },

  /** Get market indices (SPY, QQQ, DIA, VIX) */
  async getIndices() {
    return this.get('/stocks/indices');
  },

  /** Get trending stocks */
  async getTrending() {
    return this.get('/stocks/trending');
  },

  /** Get top gaining stocks */
  async getGainers() {
    return this.get('/stocks/gainers');
  },

  /** Get top losing stocks */
  async getLosers() {
    return this.get('/stocks/losers');
  },

  /** Get most actively traded stocks */
  async getMostActive() {
    return this.get('/stocks/most-active');
  },

  /** Get sector performance data */
  async getSectors() {
    return this.get('/stocks/sectors');
  },

  /**
   * Get quotes for multiple symbols in a single request.
   * @param {string[]} symbols - Array of symbols (e.g., ['AAPL','MSFT'])
   * @returns {Promise<Array>} Quote data for each symbol
   */
  async batchQuotes(symbols) {
    if (!symbols || symbols.length === 0) return [];
    return this.post('/stocks/batch-quotes', { symbols });
  },

  // ==========================================
  // Watchlist endpoints (new in v2.1)
  // ==========================================

  /** Add a stock to the user's watchlist */
  async addToWatchlist(symbol) {
    return this.post('/watchlist', { symbol });
  },

  /** Get the user's watchlist */
  async getWatchlist() {
    return this.get('/watchlist');
  },

  /** Remove a stock from the watchlist */
  async removeFromWatchlist(symbol) {
    return this.delete(`/watchlist/${encodeURIComponent(symbol)}`);
  },

  // ==========================================
  // Portfolio endpoints (from v2.0)
  // ==========================================

  /** Get all portfolio holdings for the current user */
  async getPortfolio() {
    return this.get('/portfolio');
  },

  /** Add a new holding to the portfolio */
  async addHolding(data) {
    return this.post('/portfolio', data);
  },

  /** Update an existing holding */
  async updateHolding(id, data) {
    return this.put(`/portfolio/${id}`, data);
  },

  /** Delete a holding from the portfolio */
  async deleteHolding(id) {
    return this.delete(`/portfolio/${id}`);
  }
};
