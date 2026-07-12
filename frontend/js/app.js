// ============================================
// Alpha Whisper v2.0 - Main Application
// ============================================

// Global state
const AppState = {
  currentTab: 'markets',
  user: null,
  portfolio: [],
  holdings: [],
  chatMessages: [],
  marketData: { indices: [], momentum: {} },
  isLoading: false,
  toast: null
};

const App = {
  init() {
    // Check auth
    Auth.checkAuth();

    // Load initial data
    this.loadMarketData();

    // Render initial tab
    this.switchTab('markets', false);

    // Setup event listeners
    this.setupEventListeners();

    console.log('[Alpha Whisper] App initialized');
  },

  switchTab(tabName, animate = true) {
    // Update state
    AppState.currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Show/hide views
    document.querySelectorAll('.tab-view').forEach(view => {
      const isTarget = view.dataset.tab === tabName;
      view.classList.toggle('hidden', !isTarget);
      if (isTarget && animate) {
        view.style.animation = 'none';
        view.offsetHeight; // reflow
        view.style.animation = '';
      }
    });

    // Render tab content
    switch (tabName) {
      case 'markets':
        Markets.renderMarketsTab();
        break;
      case 'whisper':
        Whisper.renderWhisperTab();
        break;
      case 'portfolio':
        Portfolio.renderPortfolioTab();
        break;
      case 'profile':
        Profile.renderProfileTab();
        break;
    }

    // Scroll to top
    document.getElementById('main-content').scrollTop = 0;
  },

  setupEventListeners() {
    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.add('hidden');
          document.body.style.overflow = '';
        }
      });
    });

    // Handle back button on mobile
    window.addEventListener('popstate', () => {
      const openModal = document.querySelector('.modal-overlay:not(.hidden)');
      if (openModal) {
        openModal.classList.add('hidden');
        document.body.style.overflow = '';
        history.pushState(null, '');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // ESC to close modals
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => {
          m.classList.add('hidden');
        });
        document.body.style.overflow = '';
      }
    });
  },

  async loadMarketData() {
    try {
      // Try to fetch from API
      const data = await api.get('/market/indices');
      if (data && data.indices) {
        AppState.marketData = data;
      }
    } catch (e) {
      // Use mock data - already set in Markets module
      console.log('[Alpha Whisper] Using mock market data');
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    toast.innerHTML = `
      ${iconMap[type] || iconMap.info}
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remove after animation
    setTimeout(() => {
      toast.remove();
    }, 3000);
  },

  showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.toggle('hidden', !show);
  },

  // Format helpers
  formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return '$0.00';
    const absVal = Math.abs(value);
    if (absVal >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
    if (absVal >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
    if (absVal >= 1e3) return '$' + (value / 1e3).toFixed(2) + 'K';
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  },

  formatPercentage(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return '0.00%';
    const sign = value >= 0 ? '+' : '';
    return sign + value.toFixed(decimals) + '%';
  },

  formatDate(date, format = 'short') {
    const d = new Date(date);
    if (format === 'short') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (format === 'long') return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (format === 'time') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString();
  },

  // Number animation (counting effect)
  animateNumber(element, target, duration = 800, prefix = '', suffix = '') {
    const start = performance.now();
    const from = 0;
    const to = target;

    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      const current = from + (to - from) * eased;

      element.textContent = prefix + this.formatNumber(current) + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
