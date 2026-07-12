// ============================================
// Alpha Whisper v2.1 - Markets Tab
// Full US market data: search, indices, trending,
// gainers, losers, most active, sector performance
// ============================================

const Markets = {
  // ==========================================
  // State
  // ==========================================

  /** Current search query */
  searchQuery: '',

  /** Debounce timer for search input */
  searchDebounceTimer: null,

  /** Currently displayed search results */
  searchResults: [],

  /** Current chart period for indices */
  currentPeriod: '1D',

  /** Auto-refresh timer handle */
  refreshTimer: null,

  // ==========================================
  // Mock fallback data
  // ==========================================

  mockIndices: [
    { symbol: 'SPY', name: 'S&P 500 ETF', price: 524.83, change: 2.14, changePercent: 0.41,
      sparkline: [518,520,519,521,522,520,523,522,524,523,525,524.83], color: '#10B981' },
    { symbol: 'QQQ', name: 'Nasdaq 100 ETF', price: 438.27, change: 5.82, changePercent: 1.35,
      sparkline: [430,432,431,433,435,434,436,437,439,438,440,438.27], color: '#8B5CF6' },
    { symbol: 'DIA', name: 'Dow Jones ETF', price: 391.56, change: -0.74, changePercent: -0.19,
      sparkline: [393,392.5,393,391.5,392.3,391.8,391.2,392,391.5,392,391,391.56], color: '#3B82F6' },
    { symbol: 'VIX', name: 'Volatility Index', price: 14.32, change: -0.58, changePercent: -3.89,
      sparkline: [16.5,16,15.5,15.2,15,14.8,14.5,14.3,14.6,14.4,14.1,14.32], color: '#EF4444' }
  ],

  mockTrending: [
    { symbol: 'NVDA', name: 'NVIDIA Corp', price: 892.14, changePercent: 4.32, volume: 48523000 },
    { symbol: 'AAPL', name: 'Apple Inc', price: 178.35, changePercent: 0.85, volume: 52843600 },
    { symbol: 'MSFT', name: 'Microsoft Corp', price: 421.92, changePercent: 1.24, volume: 22156800 },
    { symbol: 'TSLA', name: 'Tesla Inc', price: 172.82, changePercent: -2.15, volume: 98245100 },
    { symbol: 'AMZN', name: 'Amazon.com Inc', price: 185.37, changePercent: 1.68, volume: 36452100 },
    { symbol: 'META', name: 'Meta Platforms', price: 512.75, changePercent: 2.91, volume: 15234800 },
    { symbol: 'GOOGL', name: 'Alphabet Inc', price: 165.98, changePercent: 0.42, volume: 22156800 },
    { symbol: 'AMD', name: 'Adv Micro Dev', price: 178.56, changePercent: -1.23, volume: 45213600 }
  ],

  mockGainers: [
    { symbol: 'PLTR', name: 'Palantir Tech', price: 22.45, changePercent: 12.35, volume: 85241300 },
    { symbol: 'RIVN', name: 'Rivian Auto', price: 11.28, changePercent: 9.82, volume: 65423100 },
    { symbol: 'COIN', name: 'Coinbase Global', price: 198.50, changePercent: 8.45, volume: 18456200 },
    { symbol: 'SQ', name: 'Block Inc', price: 82.35, changePercent: 7.92, volume: 12563200 },
    { symbol: 'ROKU', name: 'Roku Inc', price: 68.45, changePercent: 7.18, volume: 9856200 },
    { symbol: 'SNOW', name: 'Snowflake Inc', price: 145.20, changePercent: 6.85, volume: 7852300 },
    { symbol: 'DOCN', name: 'DigitalOcean', price: 35.60, changePercent: 6.42, volume: 4523100 },
    { symbol: 'NET', name: 'Cloudflare', price: 85.30, changePercent: 6.15, volume: 5234100 },
    { symbol: 'DDOG', name: 'Datadog Inc', price: 118.45, changePercent: 5.88, volume: 4125600 },
    { symbol: 'CRWD', name: 'CrowdStrike', price: 298.50, changePercent: 5.62, volume: 3256400 },
    { symbol: 'ZM', name: 'Zoom Video', price: 62.35, changePercent: 5.35, volume: 6852300 },
    { symbol: 'UBER', name: 'Uber Tech', price: 78.90, changePercent: 5.12, volume: 18256300 },
    { symbol: 'ABNB', name: 'Airbnb Inc', price: 155.20, changePercent: 4.98, volume: 5623100 },
    { symbol: 'LYFT', name: 'Lyft Inc', price: 14.85, changePercent: 4.82, volume: 9856200 },
    { symbol: 'SHOP', name: 'Shopify Inc', price: 72.45, changePercent: 4.65, volume: 7852300 },
    { symbol: 'MDB', name: 'MongoDB Inc', price: 265.80, changePercent: 4.42, volume: 1256300 },
    { symbol: 'S', name: 'SentinelOne', price: 22.35, changePercent: 4.28, volume: 4523100 },
    { symbol: 'OKTA', name: 'Okta Inc', price: 92.45, changePercent: 4.15, volume: 3625400 },
    { symbol: 'FSLY', name: 'Fastly Inc', price: 15.80, changePercent: 3.95, volume: 2856300 },
    { symbol: 'TWLO', name: 'Twilio Inc', price: 58.90, changePercent: 3.82, volume: 3125600 }
  ],

  mockLosers: [
    { symbol: 'INTC', name: 'Intel Corp', price: 31.25, changePercent: -5.42, volume: 45213600 },
    { symbol: 'DIS', name: 'Walt Disney', price: 112.35, changePercent: -4.85, volume: 12563200 },
    { symbol: 'PFE', name: 'Pfizer Inc', price: 27.80, changePercent: -4.62, volume: 36524100 },
    { symbol: 'NKE', name: 'Nike Inc', price: 95.40, changePercent: -4.35, volume: 9856200 },
    { symbol: 'BAC', name: 'Bank of America', price: 37.15, changePercent: -3.92, volume: 45213600 },
    { symbol: 'XOM', name: 'Exxon Mobil', price: 118.50, changePercent: -3.68, volume: 18256300 },
    { symbol: 'WFC', name: 'Wells Fargo', price: 52.35, changePercent: -3.45, volume: 15234800 },
    { symbol: 'CVX', name: 'Chevron Corp', price: 152.80, changePercent: -3.22, volume: 7852300 },
    { symbol: 'KO', name: 'Coca-Cola', price: 60.45, changePercent: -2.95, volume: 11256300 },
    { symbol: 'T', name: 'AT&T Inc', price: 17.35, changePercent: -2.82, volume: 36524100 },
    { symbol: 'VZ', name: 'Verizon', price: 42.10, changePercent: -2.68, volume: 15234800 },
    { symbol: 'IBM', name: 'IBM Corp', price: 198.50, changePercent: -2.45, volume: 4523100 },
    { symbol: 'GE', name: 'GE Aerospace', price: 158.20, changePercent: -2.28, volume: 5234100 },
    { symbol: 'BA', name: 'Boeing Co', price: 185.40, changePercent: -2.15, volume: 7852300 },
    { symbol: 'F', name: 'Ford Motor', price: 12.35, changePercent: -1.98, volume: 65234100 },
    { symbol: 'GM', name: 'General Motors', price: 42.80, changePercent: -1.85, volume: 12563200 },
    { symbol: 'CSCO', name: 'Cisco Systems', price: 48.90, changePercent: -1.72, volume: 18562300 },
    { symbol: 'MRK', name: 'Merck & Co', price: 125.35, changePercent: -1.58, volume: 7852300 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', price: 155.20, changePercent: -1.45, volume: 6523100 },
    { symbol: 'PG', name: 'Procter & Gamble', price: 162.80, changePercent: -1.32, volume: 5623100 }
  ],

  mockMostActive: [
    { symbol: 'TSLA', name: 'Tesla Inc', price: 172.82, changePercent: -2.15, volume: 98245100 },
    { symbol: 'NVDA', name: 'NVIDIA Corp', price: 892.14, changePercent: 4.32, volume: 48523000 },
    { symbol: 'AAPL', name: 'Apple Inc', price: 178.35, changePercent: 0.85, volume: 52843600 },
    { symbol: 'AMD', name: 'Adv Micro Dev', price: 178.56, changePercent: -1.23, volume: 45213600 },
    { symbol: 'AMZN', name: 'Amazon.com Inc', price: 185.37, changePercent: 1.68, volume: 36452100 },
    { symbol: 'META', name: 'Meta Platforms', price: 512.75, changePercent: 2.91, volume: 15234800 },
    { symbol: 'MSFT', name: 'Microsoft Corp', price: 421.92, changePercent: 1.24, volume: 22156800 },
    { symbol: 'GOOGL', name: 'Alphabet Inc', price: 165.98, changePercent: 0.42, volume: 22156800 },
    { symbol: 'PLTR', name: 'Palantir Tech', price: 22.45, changePercent: 12.35, volume: 85241300 },
    { symbol: 'INTC', name: 'Intel Corp', price: 31.25, changePercent: -5.42, volume: 45213600 },
    { symbol: 'F', name: 'Ford Motor', price: 12.35, changePercent: -1.98, volume: 65234100 },
    { symbol: 'BAC', name: 'Bank of America', price: 37.15, changePercent: -3.92, volume: 45213600 },
    { symbol: 'NIO', name: 'NIO Inc', price: 5.85, changePercent: 2.45, volume: 45213600 },
    { symbol: 'RIVN', name: 'Rivian Auto', price: 11.28, changePercent: 9.82, volume: 65423100 },
    { symbol: 'LCID', name: 'Lucid Group', price: 2.95, changePercent: -3.28, volume: 36524100 },
    { symbol: 'UBER', name: 'Uber Tech', price: 78.90, changePercent: 5.12, volume: 18256300 },
    { symbol: 'COIN', name: 'Coinbase Global', price: 198.50, changePercent: 8.45, volume: 18456200 },
    { symbol: 'DIS', name: 'Walt Disney', price: 112.35, changePercent: -4.85, volume: 12563200 },
    { symbol: 'XOM', name: 'Exxon Mobil', price: 118.50, changePercent: -3.68, volume: 18256300 },
    { symbol: 'PFE', name: 'Pfizer Inc', price: 27.80, changePercent: -4.62, volume: 36524100 }
  ],

  mockSectors: [
    { name: 'Technology', changePercent: 1.85, icon: '💻', topStocks: ['AAPL','MSFT','NVDA'] },
    { name: 'Healthcare', changePercent: -0.42, icon: '🏥', topStocks: ['JNJ','PFE','UNH'] },
    { name: 'Financials', changePercent: -1.15, icon: '🏦', topStocks: ['JPM','BAC','WFC'] },
    { name: 'Consumer Disc.', changePercent: 0.78, icon: '🛍️', topStocks: ['AMZN','TSLA','HD'] },
    { name: 'Communication', changePercent: 1.25, icon: '📡', topStocks: ['META','GOOGL','DIS'] },
    { name: 'Industrials', changePercent: -0.35, icon: '🏭', topStocks: ['GE','BA','CAT'] },
    { name: 'Energy', changePercent: -2.10, icon: '⚡', topStocks: ['XOM','CVX','COP'] },
    { name: 'Utilities', changePercent: -0.68, icon: '💡', topStocks: ['NEE','DUK','SO'] },
    { name: 'Real Estate', changePercent: 0.15, icon: '🏠', topStocks: ['AMT','PLD','CCI'] },
    { name: 'Materials', changePercent: -0.92, icon: '⛏️', topStocks: ['LIN','APD','SHW'] },
    { name: 'Consumer Staples', changePercent: -0.55, icon: '🛒', topStocks: ['PG','KO','WMT'] }
  ],

  // ==========================================
  // Main render entry
  // ==========================================

  renderMarketsTab() {
    const container = document.getElementById('markets-content');
    if (!container) return;

    container.innerHTML = '';

    // 1. Global search bar (always at top)
    container.appendChild(this.renderSearchBar());

    // 2. Market Indices
    this.renderIndicesSection(container);

    // 3. Trending Stocks
    this.renderTrendingSection(container);

    // 4. Top Gainers
    this.renderGainersSection(container);

    // 5. Top Losers
    this.renderLosersSection(container);

    // 6. Most Active
    this.renderMostActiveSection(container);

    // 7. Sector Performance
    this.renderSectorsSection(container);

    // Load real data from API
    this.loadLiveData();

    // Start auto-refresh
    this.startAutoRefresh();
  },

  // ==========================================
  // Search bar (global, debounced, typeahead)
  // ==========================================

  renderSearchBar() {
    const wrap = document.createElement('div');
    wrap.className = 'markets-search-wrap';
    wrap.id = 'markets-search-wrap';
    wrap.innerHTML = `
      <div class="markets-search-bar">
        <svg class="markets-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" class="markets-search-input" id="markets-search-input"
          placeholder="Search stocks by symbol or company name..."
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        <button class="markets-search-clear hidden" id="markets-search-clear" onclick="Markets.clearSearch()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="markets-search-dropdown hidden" id="markets-search-dropdown"></div>
    `;

    // Wire up events after insertion
    requestAnimationFrame(() => {
      const input = document.getElementById('markets-search-input');
      const clearBtn = document.getElementById('markets-search-clear');
      if (input) {
        input.addEventListener('input', (e) => this.handleSearchInput(e.target.value));
        input.addEventListener('focus', () => {
          if (this.searchResults.length > 0) this.showDropdown();
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') this.clearSearch();
          if (e.key === 'Enter' && this.searchResults.length > 0) {
            this.openStockDetail(this.searchResults[0].symbol);
          }
        });
      }
      // Hide dropdown on outside click
      document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target)) this.hideDropdown();
      });
    });

    return wrap;
  },

  handleSearchInput(query) {
    this.searchQuery = query.trim();

    // Show/hide clear button
    const clearBtn = document.getElementById('markets-search-clear');
    if (clearBtn) clearBtn.classList.toggle('hidden', this.searchQuery.length === 0);

    // Clear previous debounce
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);

    if (this.searchQuery.length === 0) {
      this.searchResults = [];
      this.hideDropdown();
      return;
    }

    // Debounce API call by 250ms
    this.searchDebounceTimer = setTimeout(() => this.executeSearch(this.searchQuery), 250);
  },

  async executeSearch(query) {
    try {
      const results = await api.searchStocks(query, 10);
      this.searchResults = Array.isArray(results) ? results : [];
      this.renderSearchResults(this.searchResults);
    } catch {
      // Fallback: filter mock data
      const allMock = [...this.mockTrending, ...this.mockGainers, ...this.mockLosers];
      const q = query.toUpperCase();
      this.searchResults = allMock
        .filter(s => s.symbol.includes(q) || s.name.toUpperCase().includes(q))
        .slice(0, 10)
        .map(s => ({ symbol: s.symbol, name: s.name, exchange: 'NYSE' }));
      this.renderSearchResults(this.searchResults);
    }
  },

  renderSearchResults(results) {
    const dropdown = document.getElementById('markets-search-dropdown');
    if (!dropdown) return;

    if (results.length === 0) {
      dropdown.innerHTML = '<div class="markets-search-empty">No results found</div>';
      this.showDropdown();
      return;
    }

    dropdown.innerHTML = results.map(r => `
      <div class="markets-search-result" onclick="Markets.openStockDetail('${r.symbol}')">
        <div class="markets-result-logo">${(r.name || r.symbol).charAt(0)}</div>
        <div class="markets-result-info">
          <div class="markets-result-symbol">${r.symbol}</div>
          <div class="markets-result-name">${r.name || ''}</div>
        </div>
        <div class="markets-result-exchange">${r.exchange || 'NYSE'}</div>
      </div>
    `).join('');

    this.showDropdown();
  },

  showDropdown() {
    const dropdown = document.getElementById('markets-search-dropdown');
    if (dropdown) dropdown.classList.remove('hidden');
  },

  hideDropdown() {
    const dropdown = document.getElementById('markets-search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
  },

  clearSearch() {
    const input = document.getElementById('markets-search-input');
    if (input) input.value = '';
    this.searchQuery = '';
    this.searchResults = [];
    const clearBtn = document.getElementById('markets-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.hideDropdown();
  },

  // ==========================================
  // Indices Section
  // ==========================================

  renderIndicesSection(container) {
    const section = document.createElement('div');
    section.id = 'markets-indices-section';
    section.innerHTML = `
      <div class="markets-section-header">
        <div>
          <div class="markets-section-title">Market Indices</div>
          <div class="markets-section-subtitle">Real-time market overview</div>
        </div>
        <span class="markets-badge-live">Live</span>
      </div>
      <div class="markets-indices-grid" id="markets-indices-grid">
        ${this.renderIndicesSkeleton()}
      </div>
    `;
    container.appendChild(section);
  },

  renderIndicesSkeleton() {
    return Array.from({ length: 4 }, () => `
      <div class="markets-index-card skeleton-pulse">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="skeleton-circle" style="width:40px;height:40px;"></div>
          <div>
            <div class="skeleton-line" style="width:80px;height:16px;margin-bottom:6px;"></div>
            <div class="skeleton-line" style="width:40px;height:12px;"></div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="skeleton-line" style="width:70px;height:20px;margin-bottom:6px;margin-left:auto;"></div>
          <div class="skeleton-line" style="width:50px;height:14px;margin-left:auto;"></div>
        </div>
      </div>
    `).join('');
  },

  renderIndices(indices) {
    const grid = document.getElementById('markets-indices-grid');
    if (!grid) return;

    grid.innerHTML = indices.map(idx => {
      const isPos = (idx.changePercent || 0) >= 0;
      const color = idx.color || (isPos ? '#10B981' : '#EF4444');
      const sparklineData = idx.sparkline || this.generateSparklinePoints(idx.price, idx.changePercent);
      return `
        <div class="markets-index-card" onclick="Markets.openStockDetail('${idx.symbol}')">
          <div class="markets-index-left">
            <div class="markets-index-logo" style="background:${color}20;color:${color};">${idx.symbol.charAt(0)}</div>
            <div>
              <div class="markets-index-name">${idx.name}</div>
              <div class="markets-index-symbol">${idx.symbol}</div>
            </div>
          </div>
          <div class="markets-index-right">
            <div class="markets-index-price">${this.fmtPrice(idx.price)}</div>
            <div class="markets-index-change ${isPos ? 'positive' : 'negative'}">
              ${isPos ? '+' : ''}${(idx.changePercent || 0).toFixed(2)}%
            </div>
            ${this.generateSparklineSVG(sparklineData, isPos)}
          </div>
        </div>
      `;
    }).join('');
  },

  generateSparklinePoints(basePrice, changePercent) {
    const points = [];
    const volatility = Math.abs(changePercent || 1) * 0.3;
    let price = basePrice * (1 - (changePercent || 0) / 100 * 0.5);
    for (let i = 0; i < 20; i++) {
      price = price * (1 + (Math.random() - 0.48) * volatility / 100);
      points.push(price);
    }
    points.push(basePrice);
    return points;
  },

  generateSparklineSVG(data, isPositive) {
    if (!data || data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 120;
    const h = 40;
    const pad = 2;

    const pts = data.map((val, i) => {
      const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
      const y = h - pad - ((val - min) / range) * (h - 2 * pad);
      return `${x},${y}`;
    }).join(' ');

    const color = isPositive ? '#10B981' : '#EF4444';

    return `<svg class="markets-sparkline" viewBox="0 0 ${w} ${h}">
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  },

  // ==========================================
  // Trending Section
  // ==========================================

  renderTrendingSection(container) {
    const section = document.createElement('div');
    section.id = 'markets-trending-section';
    section.className = 'markets-section';
    section.innerHTML = `
      <div class="markets-section-header">
        <div class="markets-section-title">Trending Stocks</div>
        <span class="markets-badge">${this.mockTrending.length} stocks</span>
      </div>
      <div class="markets-trending-scroll" id="markets-trending-list">
        ${this.renderTrendingSkeleton()}
      </div>
    `;
    container.appendChild(section);
  },

  renderTrendingSkeleton() {
    return Array.from({ length: 6 }, () => `
      <div class="markets-trending-card skeleton-pulse" style="min-width:160px;">
        <div class="skeleton-line" style="width:50px;height:16px;margin-bottom:8px;"></div>
        <div class="skeleton-line" style="width:80px;height:12px;margin-bottom:12px;"></div>
        <div class="skeleton-line" style="width:60px;height:20px;margin-bottom:6px;"></div>
        <div class="skeleton-line" style="width:40px;height:14px;"></div>
      </div>
    `).join('');
  },

  renderTrending(stocks) {
    const list = document.getElementById('markets-trending-list');
    if (!list) return;

    list.innerHTML = stocks.map(s => {
      const isPos = (s.changePercent || 0) >= 0;
      return `
        <div class="markets-trending-card" onclick="Markets.openStockDetail('${s.symbol}')">
          <div class="markets-trending-symbol">${s.symbol}</div>
          <div class="markets-trending-name">${s.name || ''}</div>
          <div class="markets-trending-price">${this.fmtPrice(s.price)}</div>
          <div class="markets-trending-change ${isPos ? 'positive' : 'negative'}">
            ${isPos ? '+' : ''}${(s.changePercent || 0).toFixed(2)}%
          </div>
        </div>
      `;
    }).join('');
  },

  // ==========================================
  // Gainers Section
  // ==========================================

  renderGainersSection(container) {
    const section = document.createElement('div');
    section.id = 'markets-gainers-section';
    section.className = 'markets-section';
    section.innerHTML = `
      <div class="markets-section-header">
        <div>
          <div class="markets-section-title">Top Gainers</div>
          <div class="markets-section-subtitle">Biggest movers today</div>
        </div>
        <span class="markets-badge-success">+</span>
      </div>
      <div class="markets-table-wrap" id="markets-gainers-table">
        ${this.renderStockTableSkeleton()}
      </div>
    `;
    container.appendChild(section);
  },

  renderGainers(stocks) {
    this.renderStockTable('markets-gainers-table', stocks, 'gainers');
  },

  // ==========================================
  // Losers Section
  // ==========================================

  renderLosersSection(container) {
    const section = document.createElement('div');
    section.id = 'markets-losers-section';
    section.className = 'markets-section';
    section.innerHTML = `
      <div class="markets-section-header">
        <div>
          <div class="markets-section-title">Top Losers</div>
          <div class="markets-section-subtitle">Biggest decliners today</div>
        </div>
        <span class="markets-badge-danger">-</span>
      </div>
      <div class="markets-table-wrap" id="markets-losers-table">
        ${this.renderStockTableSkeleton()}
      </div>
    `;
    container.appendChild(section);
  },

  renderLosers(stocks) {
    this.renderStockTable('markets-losers-table', stocks, 'losers');
  },

  // ==========================================
  // Most Active Section
  // ==========================================

  renderMostActiveSection(container) {
    const section = document.createElement('div');
    section.id = 'markets-mostactive-section';
    section.className = 'markets-section';
    section.innerHTML = `
      <div class="markets-section-header">
        <div>
          <div class="markets-section-title">Most Active</div>
          <div class="markets-section-subtitle">Highest trading volume today</div>
        </div>
        <span class="markets-badge">Volume</span>
      </div>
      <div class="markets-table-wrap" id="markets-mostactive-table">
        ${this.renderStockTableSkeleton()}
      </div>
    `;
    container.appendChild(section);
  },

  renderMostActive(stocks) {
    this.renderStockTable('markets-mostactive-table', stocks, 'mostactive');
  },

  // ==========================================
  // Shared table rendering
  // ==========================================

  renderStockTableSkeleton() {
    return `
      <table class="markets-table">
        <thead><tr>
          <th>Symbol</th><th>Name</th><th style="text-align:right">Price</th>
          <th style="text-align:right">Change</th><th style="text-align:right">Change %</th><th style="text-align:right">Volume</th>
        </tr></thead>
        <tbody>
          ${Array.from({ length: 5 }, () => `
            <tr class="skeleton-pulse">
              <td><div class="skeleton-line" style="width:50px;height:14px;"></div></td>
              <td><div class="skeleton-line" style="width:120px;height:14px;"></div></td>
              <td style="text-align:right"><div class="skeleton-line" style="width:60px;height:14px;margin-left:auto;"></div></td>
              <td style="text-align:right"><div class="skeleton-line" style="width:50px;height:14px;margin-left:auto;"></div></td>
              <td style="text-align:right"><div class="skeleton-line" style="width:50px;height:14px;margin-left:auto;"></div></td>
              <td style="text-align:right"><div class="skeleton-line" style="width:60px;height:14px;margin-left:auto;"></div></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  renderStockTable(tableId, stocks, type) {
    const container = document.getElementById(tableId);
    if (!container || !stocks || stocks.length === 0) return;

    container.innerHTML = `
      <table class="markets-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th style="text-align:right">Price</th>
            <th style="text-align:right">Change</th>
            <th style="text-align:right">Change %</th>
            <th style="text-align:right">Volume</th>
          </tr>
        </thead>
        <tbody>
          ${stocks.map((s, i) => {
            const isPos = (s.changePercent || 0) >= 0;
            return `
              <tr class="markets-table-row ${i % 2 === 0 ? 'even' : ''}" onclick="Markets.openStockDetail('${s.symbol}')">
                <td>
                  <div class="markets-table-symbol">
                    <div class="markets-table-logo">${(s.name || s.symbol).charAt(0)}</div>
                    <span class="markets-table-symbol-text">${s.symbol}</span>
                  </div>
                </td>
                <td class="markets-table-name">${s.name || ''}</td>
                <td class="markets-table-number">${this.fmtPrice(s.price)}</td>
                <td class="markets-table-number ${isPos ? 'positive' : 'negative'}">${isPos ? '+' : ''}${(s.change || s.price * (s.changePercent || 0) / 100).toFixed(2)}</td>
                <td class="markets-table-number ${isPos ? 'positive' : 'negative'}">${isPos ? '+' : ''}${(s.changePercent || 0).toFixed(2)}%</td>
                <td class="markets-table-number">${this.fmtVolume(s.volume)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  // ==========================================
  // Sectors Section
  // ==========================================

  renderSectorsSection(container) {
    const section = document.createElement('div');
    section.id = 'markets-sectors-section';
    section.className = 'markets-section';
    section.innerHTML = `
      <div class="markets-section-header">
        <div>
          <div class="markets-section-title">Sector Performance</div>
          <div class="markets-section-subtitle">How sectors are performing today</div>
        </div>
      </div>
      <div class="markets-sectors-grid" id="markets-sectors-grid">
        ${this.renderSectorsSkeleton()}
      </div>
    `;
    container.appendChild(section);
  },

  renderSectorsSkeleton() {
    return Array.from({ length: 8 }, () => `
      <div class="markets-sector-card skeleton-pulse">
        <div class="skeleton-line" style="width:30px;height:30px;margin-bottom:8px;"></div>
        <div class="skeleton-line" style="width:80px;height:16px;margin-bottom:6px;"></div>
        <div class="skeleton-line" style="width:50px;height:14px;"></div>
      </div>
    `).join('');
  },

  renderSectors(sectors) {
    const grid = document.getElementById('markets-sectors-grid');
    if (!grid) return;

    grid.innerHTML = sectors.map(sec => {
      const isPos = (sec.changePercent || 0) >= 0;
      const barWidth = Math.min(Math.abs(sec.changePercent || 0) * 20, 100);
      return `
        <div class="markets-sector-card">
          <div class="markets-sector-icon">${sec.icon || '📊'}</div>
          <div class="markets-sector-name">${sec.name}</div>
          <div class="markets-sector-change ${isPos ? 'positive' : 'negative'}">
            ${isPos ? '+' : ''}${(sec.changePercent || 0).toFixed(2)}%
          </div>
          <div class="markets-sector-bar">
            <div class="markets-sector-bar-fill ${isPos ? 'positive' : 'negative'}" style="width:${barWidth}%"></div>
          </div>
          ${sec.topStocks ? `
            <div class="markets-sector-stocks">${sec.topStocks.join(', ')}</div>
          ` : ''}
        </div>
      `;
    }).join('');
  },

  // ==========================================
  // Live data loading
  // ==========================================

  async loadLiveData() {
    // Load all sections in parallel
    await Promise.all([
      this.loadIndices(),
      this.loadTrending(),
      this.loadGainers(),
      this.loadLosers(),
      this.loadMostActive(),
      this.loadSectors()
    ]);
  },

  async loadIndices() {
    try {
      const data = await api.getIndices();
      if (Array.isArray(data) && data.length > 0) {
        this.renderIndices(data);
      } else {
        this.renderIndices(this.mockIndices);
      }
    } catch {
      this.renderIndices(this.mockIndices);
    }
  },

  async loadTrending() {
    try {
      const data = await api.getTrending();
      this.renderTrending(Array.isArray(data) && data.length > 0 ? data : this.mockTrending);
    } catch {
      this.renderTrending(this.mockTrending);
    }
  },

  async loadGainers() {
    try {
      const data = await api.getGainers();
      this.renderGainers(Array.isArray(data) && data.length > 0 ? data : this.mockGainers);
    } catch {
      this.renderGainers(this.mockGainers);
    }
  },

  async loadLosers() {
    try {
      const data = await api.getLosers();
      this.renderLosers(Array.isArray(data) && data.length > 0 ? data : this.mockLosers);
    } catch {
      this.renderLosers(this.mockLosers);
    }
  },

  async loadMostActive() {
    try {
      const data = await api.getMostActive();
      this.renderMostActive(Array.isArray(data) && data.length > 0 ? data : this.mockMostActive);
    } catch {
      this.renderMostActive(this.mockMostActive);
    }
  },

  async loadSectors() {
    try {
      const data = await api.getSectors();
      this.renderSectors(Array.isArray(data) && data.length > 0 ? data : this.mockSectors);
    } catch {
      this.renderSectors(this.mockSectors);
    }
  },

  // ==========================================
  // Auto-refresh (every 30s)
  // ==========================================

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.refreshTimer = setInterval(() => {
      this.loadLiveData();
    }, 30000);
  },

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  },

  // ==========================================
  // Navigation
  // ==========================================

  openStockDetail(symbol) {
    if (!symbol) return;
    if (typeof StockDetail !== 'undefined' && StockDetail.open) {
      StockDetail.open(symbol);
    }
  },

  // ==========================================
  // Formatting utilities
  // ==========================================

  fmtPrice(n) {
    if (n === undefined || n === null) return '$--';
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  fmtVolume(n) {
    if (!n) return '--';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toLocaleString();
  }
};
