// ============================================
// Alpha Whisper v2.1 - Stock Detail Modal
// Full stock view with chart, stats, actions
// ============================================

const StockDetail = {
  /** Currently displayed symbol */
  currentSymbol: null,

  /** Auto-refresh timer handle */
  refreshTimer: null,

  /** Chart data cache for period switching */
  chartCache: {},

  // Default mock data when API is unreachable
  mockQuote: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    price: 178.35,
    change: 1.52,
    changePercent: 0.86,
    open: 177.10,
    high: 179.25,
    low: 176.80,
    volume: 52843600,
    avgVolume: 61253400,
    marketCap: 2780000000000,
    pe: 29.4,
    eps: 6.07,
    beta: 1.28,
    dividendYield: 0.52,
    fiftyTwoWeekHigh: 199.62,
    fiftyTwoWeekLow: 164.08,
    previousClose: 176.83
  },

  mockHistorical: [
    { date: '2024-01-01', close: 176.83 },
    { date: '2024-01-02', close: 177.45 },
    { date: '2024-01-03', close: 176.20 },
    { date: '2024-01-04', close: 178.10 },
    { date: '2024-01-05', close: 177.80 },
    { date: '2024-01-08', close: 179.50 },
    { date: '2024-01-09', close: 178.90 },
    { date: '2024-01-10', close: 180.25 },
    { date: '2024-01-11', close: 179.80 },
    { date: '2024-01-12', close: 181.00 },
    { date: '2024-01-16', close: 180.50 },
    { date: '2024-01-17', close: 182.10 },
    { date: '2024-01-18', close: 181.75 },
    { date: '2024-01-19', close: 183.20 },
    { date: '2024-01-22', close: 182.60 },
    { date: '2024-01-23', close: 184.00 },
    { date: '2024-01-24', close: 183.50 },
    { date: '2024-01-25', close: 185.10 },
    { date: '2024-01-26', close: 184.40 },
    { date: '2024-01-29', close: 186.20 },
    { date: '2024-01-30', close: 185.80 },
    { date: '2024-02-01', close: 178.35 }
  ],

  // ==========================================
  // Public API
  // ==========================================

  /**
   * Open the stock detail modal for a given symbol.
   * @param {string} symbol - Stock symbol (e.g., 'AAPL')
   */
  async open(symbol) {
    if (!symbol) return;
    this.currentSymbol = symbol.toUpperCase();
    this.chartCache = {};

    // Show modal skeleton immediately
    this.renderSkeleton();
    this.getModalEl().classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    try {
      // Fetch quote and historical data in parallel
      const [quote, historical] = await Promise.all([
        this.fetchQuote(this.currentSymbol),
        this.fetchHistorical(this.currentSymbol, '1mo', '1d')
      ]);

      this.render(this.currentSymbol, quote, historical);

      // Start auto-refresh
      this.startAutoRefresh();
    } catch (err) {
      console.warn('StockDetail: API failed, using mock data:', err.message);
      const mockQ = { ...this.mockQuote, symbol: this.currentSymbol, name: this.currentSymbol };
      this.render(this.currentSymbol, mockQ, this.mockHistorical);
    }
  },

  /** Close the modal and stop auto-refresh */
  close() {
    this.stopAutoRefresh();
    this.currentSymbol = null;
    this.chartCache = {};
    this.getModalEl().classList.add('hidden');
    document.body.style.overflow = '';
  },

  // ==========================================
  // Data fetching with fallbacks
  // ==========================================

  async fetchQuote(symbol) {
    try {
      const data = await api.getQuote(symbol);
      return data;
    } catch {
      return { ...this.mockQuote, symbol, name: symbol };
    }
  },

  async fetchHistorical(symbol, period, interval) {
    try {
      const data = await api.getHistorical(symbol, period, interval);
      return Array.isArray(data) ? data : this.mockHistorical;
    } catch {
      return this.mockHistorical;
    }
  },

  // ==========================================
  // Auto-refresh
  // ==========================================

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.refreshTimer = setInterval(async () => {
      if (!this.currentSymbol) return;
      try {
        const quote = await api.getQuote(this.currentSymbol);
        this.updatePriceDisplay(quote);
      } catch {
        // Silently fail on refresh
      }
    }, 30000);
  },

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  },

  // ==========================================
  // DOM helpers
  // ==========================================

  getModalEl() {
    let el = document.getElementById('stock-detail-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'stock-detail-modal';
      el.className = 'stock-detail-modal hidden';
      document.body.appendChild(el);
    }
    return el;
  },

  // ==========================================
  // Rendering
  // ==========================================

  renderSkeleton() {
    const el = this.getModalEl();
    el.innerHTML = `
      <div class="sd-overlay" onclick="StockDetail.close()"></div>
      <div class="sd-panel">
        <button class="sd-close" onclick="StockDetail.close()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="sd-skeleton">
          <div class="sd-skeleton-header">
            <div class="sd-skeleton-circle" style="width:48px;height:48px;"></div>
            <div style="flex:1">
              <div class="sd-skeleton-line" style="width:120px;height:22px;margin-bottom:8px;"></div>
              <div class="sd-skeleton-line" style="width:180px;height:14px;"></div>
            </div>
          </div>
          <div class="sd-skeleton-line" style="width:160px;height:36px;margin:20px 0;"></div>
          <div class="sd-skeleton-line" style="width:100%;height:200px;margin-bottom:20px;"></div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
            ${Array.from({ length: 8 }, () => '<div class="sd-skeleton-line" style="height:56px;"></div>').join('')}
          </div>
        </div>
      </div>
    `;
  },

  render(symbol, quote, historical) {
    const el = this.getModalEl();
    const isPos = (quote.changePercent || 0) >= 0;
    const changeColor = isPos ? 'var(--success)' : 'var(--danger)';
    const arrow = isPos ? '&#9650;' : '&#9660;';

    el.innerHTML = `
      <div class="sd-overlay" onclick="StockDetail.close()"></div>
      <div class="sd-panel">
        <button class="sd-close" onclick="StockDetail.close()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <!-- Header -->
        <div class="sd-header">
          <div class="sd-logo">${(quote.name || symbol).charAt(0)}</div>
          <div class="sd-header-info">
            <div class="sd-symbol">${symbol}</div>
            <div class="sd-name">${quote.name || symbol}</div>
            <div class="sd-exchange">${quote.exchange || 'NYSE'}</div>
          </div>
        </div>

        <!-- Price Block -->
        <div class="sd-price-block">
          <div class="sd-price">${this.fmtPrice(quote.price)}</div>
          <div class="sd-change-row">
            <span class="sd-change" style="color:${changeColor}">${arrow} ${this.fmtSigned(quote.change)}</span>
            <span class="sd-change-pct" style="color:${changeColor}">(${this.fmtSigned(quote.changePercent)}%)</span>
            <span class="sd-market-status">Market Open</span>
          </div>
        </div>

        <!-- Chart -->
        <div class="sd-chart-wrap">
          <div class="sd-chart-periods">
            ${['1D','1W','1M','3M','6M','1Y','5Y'].map(p => `
              <button class="sd-period-btn" data-period="${p}" onclick="StockDetail.switchPeriod('${p}')">${p}</button>
            `).join('')}
          </div>
          <div class="sd-chart-container">
            ${this.renderChart(historical, isPos)}
          </div>
        </div>

        <!-- Key Stats Grid -->
        <div class="sd-stats-title">Key Statistics</div>
        <div class="sd-stats-grid">
          ${this.renderKeyStats(quote)}
        </div>

        <!-- Description placeholder -->
        ${quote.industry || quote.sector ? `
          <div class="sd-info-section">
            <div class="sd-info-title">Company Info</div>
            ${quote.industry ? `<div class="sd-info-tag">${quote.industry}</div>` : ''}
            ${quote.sector ? `<div class="sd-info-tag">${quote.sector}</div>` : ''}
          </div>
        ` : ''}

        <!-- Action Buttons -->
        <div class="sd-actions">
          <button class="sd-btn sd-btn-primary" onclick="StockDetail.addToPortfolio('${symbol}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add to Portfolio
          </button>
          <button class="sd-btn sd-btn-secondary" onclick="StockDetail.toggleWatchlist('${symbol}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            <span id="sd-watchlist-text">Watchlist</span>
          </button>
        </div>
      </div>
    `;

    // Highlight default period
    this.highlightPeriod('1M');
  },

  // ==========================================
  // Chart rendering (SVG area chart)
  // ==========================================

  renderChart(data, isPositive) {
    if (!data || data.length === 0) {
      return '<div style="text-align:center;padding:40px;color:var(--text-muted);">No chart data</div>';
    }

    const prices = data.map(d => d.close || d.price || 0).filter(v => v > 0);
    if (prices.length === 0) {
      return '<div style="text-align:center;padding:40px;color:var(--text-muted);">No price data</div>';
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const width = 600;
    const height = 220;
    const padLeft = 0;
    const padRight = 0;
    const padTop = 10;
    const padBottom = 10;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    // Build area path
    const points = prices.map((val, i) => {
      const x = padLeft + (i / (prices.length - 1)) * chartW;
      const y = padTop + chartH - ((val - min) / range) * chartH;
      return `${x},${y}`;
    });

    const linePoints = points.join(' ');
    const areaPoints = `${points[0]} ${points.join(' ')} ${points[points.length - 1]}`;

    // Gradient ID unique to this render
    const gradId = 'sd-chart-grad-' + Math.random().toString(36).slice(2, 8);
    const strokeColor = isPositive ? '#10B981' : '#EF4444';
    const fillColor = isPositive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';

    // Current price line
    const lastPrice = prices[prices.length - 1];
    const lastY = padTop + chartH - ((lastPrice - min) / range) * chartH;

    return `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%;height:220px;">
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        <polygon points="${padLeft},${padTop + chartH} ${areaPoints} ${padLeft + chartW},${padTop + chartH}" fill="url(#${gradId})"/>
        <polyline points="${linePoints}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="${padLeft}" y1="${lastY}" x2="${padLeft + chartW}" y2="${lastY}" stroke="${strokeColor}" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.4"/>
        <circle cx="${padLeft + chartW}" cy="${lastY}" r="4" fill="${strokeColor}" stroke="white" stroke-width="2"/>
      </svg>
    `;
  },

  // ==========================================
  // Period switching
  // ==========================================

  async switchPeriod(period) {
    if (!this.currentSymbol) return;
    this.highlightPeriod(period);

    // Use cache if available
    if (this.chartCache[period]) {
      this.updateChart(this.chartCache[period]);
      return;
    }

    // Map period to API params
    const periodMap = {
      '1D': ['1d', '5m'],
      '1W': ['5d', '15m'],
      '1M': ['1mo', '1d'],
      '3M': ['3mo', '1d'],
      '6M': ['6mo', '1d'],
      '1Y': ['1y', '1wk'],
      '5Y': ['5y', '1mo']
    };
    const [p, i] = periodMap[period] || ['1mo', '1d'];

    try {
      const data = await api.getHistorical(this.currentSymbol, p, i);
      this.chartCache[period] = data;
      this.updateChart(data);
    } catch {
      // Keep current chart on error
    }
  },

  highlightPeriod(period) {
    const el = this.getModalEl();
    el.querySelectorAll('.sd-period-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.period === period);
    });
  },

  updateChart(data) {
    const container = this.getModalEl().querySelector('.sd-chart-container');
    if (!container) return;
    const isPos = (this.mockQuote.changePercent || 0) >= 0;
    container.innerHTML = this.renderChart(data, isPos);
  },

  // ==========================================
  // Key statistics rendering
  // ==========================================

  renderKeyStats(quote) {
    const stats = [
      { label: 'Market Cap', value: this.fmtMarketCap(quote.marketCap) },
      { label: 'P/E Ratio', value: quote.pe ? quote.pe.toFixed(2) : 'N/A' },
      { label: 'EPS', value: quote.eps ? '$' + quote.eps.toFixed(2) : 'N/A' },
      { label: 'Beta', value: quote.beta ? quote.beta.toFixed(2) : 'N/A' },
      { label: 'Div Yield', value: quote.dividendYield ? quote.dividendYield.toFixed(2) + '%' : 'N/A' },
      { label: '52W High', value: this.fmtPrice(quote.fiftyTwoWeekHigh) },
      { label: '52W Low', value: this.fmtPrice(quote.fiftyTwoWeekLow) },
      { label: 'Volume', value: this.fmtVolume(quote.volume) },
      { label: 'Avg Volume', value: this.fmtVolume(quote.avgVolume) },
      { label: 'Open', value: this.fmtPrice(quote.open) },
      { label: 'High', value: this.fmtPrice(quote.high) },
      { label: 'Low', value: this.fmtPrice(quote.low) },
      { label: 'Prev Close', value: this.fmtPrice(quote.previousClose) },
      { label: 'Day Range', value: quote.low && quote.high ? `$${quote.low.toFixed(2)} - $${quote.high.toFixed(2)}` : 'N/A' }
    ];

    return stats.map(s => `
      <div class="sd-stat-card">
        <div class="sd-stat-label">${s.label}</div>
        <div class="sd-stat-value">${s.value}</div>
      </div>
    `).join('');
  },

  // ==========================================
  // Live price update (during auto-refresh)
  // ==========================================

  updatePriceDisplay(quote) {
    const el = this.getModalEl();
    if (!el || !quote) return;

    const priceEl = el.querySelector('.sd-price');
    const changeRow = el.querySelector('.sd-change-row');
    if (!priceEl || !changeRow) return;

    const isPos = (quote.changePercent || 0) >= 0;
    const changeColor = isPos ? 'var(--success)' : 'var(--danger)';
    const arrow = isPos ? '&#9650;' : '&#9660;';

    priceEl.textContent = this.fmtPrice(quote.price);
    changeRow.innerHTML = `
      <span class="sd-change" style="color:${changeColor}">${arrow} ${this.fmtSigned(quote.change)}</span>
      <span class="sd-change-pct" style="color:${changeColor}">(${this.fmtSigned(quote.changePercent)}%)</span>
      <span class="sd-market-status">Market Open</span>
    `;
  },

  // ==========================================
  // Actions
  // ==========================================

  /** Triggered by "Add to Portfolio" button */
  addToPortfolio(symbol) {
    if (typeof Portfolio !== 'undefined' && Portfolio.openAddForm) {
      this.close();
      Portfolio.openAddForm(symbol);
    } else {
      // Fallback: store in localStorage for later
      const pending = JSON.parse(localStorage.getItem('aw_pending_add') || '[]');
      pending.push({ symbol, timestamp: Date.now() });
      localStorage.setItem('aw_pending_add', JSON.stringify(pending));
      if (typeof App !== 'undefined') App.showToast(`${symbol} queued to add to portfolio`, 'info');
    }
  },

  /** Toggle watchlist status */
  async toggleWatchlist(symbol) {
    const textEl = document.getElementById('sd-watchlist-text');
    try {
      await api.addToWatchlist(symbol);
      if (textEl) textEl.textContent = 'Watchlisted';
      if (typeof App !== 'undefined') App.showToast(`${symbol} added to watchlist`, 'success');
      if (typeof Portfolio !== 'undefined' && Portfolio.renderWatchlist) {
        Portfolio.renderWatchlist();
      }
    } catch {
      if (typeof App !== 'undefined') App.showToast('Failed to update watchlist', 'error');
    }
  },

  // ==========================================
  // Formatting utilities
  // ==========================================

  fmtPrice(n) {
    if (n === undefined || n === null) return '$--';
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  fmtSigned(n) {
    if (n === undefined || n === null) return '--';
    const val = Number(n);
    return (val >= 0 ? '+' : '') + val.toFixed(2);
  },

  fmtMarketCap(n) {
    if (!n) return 'N/A';
    if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    return '$' + n.toLocaleString();
  },

  fmtVolume(n) {
    if (!n) return 'N/A';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toLocaleString();
  }
};

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') StockDetail.close();
});
