// ============================================
// Alpha Whisper v2.1 - Portfolio Tab
// Any-stock portfolio with search, real-time
// prices, watchlist, and stock detail modal
// ============================================

const Portfolio = {
  // ==========================================
  // State
  // ==========================================

  /** Current holdings with enriched quote data */
  holdings: [],

  /** Watchlist items */
  watchlist: [],

  /** Auto-refresh timer handle */
  refreshTimer: null,

  /** Current sort column and direction */
  sortBy: 'symbol',
  sortAsc: true,

  /** Selected stock for adding */
  selectedAddStock: null,

  /** Search debounce timer */
  addSearchDebounceTimer: null,

  // ==========================================
  // Mock fallback holdings
  // ==========================================

  mockHoldings: [
    { id: 1, symbol: 'AAPL', name: 'Apple Inc.', shares: 50, avg_cost: 165.30, price: 178.35, change: 0.85, changePercent: 0.85 },
    { id: 2, symbol: 'MSFT', name: 'Microsoft Corp.', shares: 25, avg_cost: 385.50, price: 421.92, change: 3.82, changePercent: 1.24 },
    { id: 3, symbol: 'NVDA', name: 'NVIDIA Corp.', shares: 15, avg_cost: 420.00, price: 892.14, change: 36.92, changePercent: 4.32 },
    { id: 4, symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 40, avg_cost: 155.20, price: 165.98, change: 0.70, changePercent: 0.42 },
    { id: 5, symbol: 'AMZN', name: 'Amazon.com Inc.', shares: 35, avg_cost: 172.50, price: 185.37, change: 3.06, changePercent: 1.68 },
    { id: 6, symbol: 'META', name: 'Meta Platforms', shares: 12, avg_cost: 485.00, price: 512.75, change: 14.47, changePercent: 2.91 },
    { id: 7, symbol: 'TSLA', name: 'Tesla Inc.', shares: 30, avg_cost: 195.00, price: 172.82, change: -3.81, changePercent: -2.15 },
    { id: 8, symbol: 'JPM', name: 'JPMorgan Chase', shares: 20, avg_cost: 188.00, price: 195.67, change: 1.47, changePercent: 0.76 }
  ],

  // ==========================================
  // Main render entry
  // ==========================================

  renderPortfolioTab() {
    const container = document.getElementById('portfolio-content');
    if (!container) return;

    this.stopAutoRefresh();
    container.innerHTML = '';

    if (!this.isLoggedIn()) {
      this.renderLoggedOutView(container);
      return;
    }

    this.renderLoggedInView(container);
  },

  isLoggedIn() {
    return !!(typeof AppState !== 'undefined' && AppState.user) ||
           !!localStorage.getItem('alpha_whisper_token');
  },

  // ==========================================
  // Logged-out view
  // ==========================================

  renderLoggedOutView(container) {
    container.innerHTML = `
      <div class="portfolio-cta-card">
        <div class="portfolio-cta-logo">AW</div>
        <h3>Track Your Portfolio</h3>
        <p>Sign in to view your holdings, track performance in real-time, and get AI-powered investment insights tailored to your portfolio.</p>
        <button class="portfolio-btn-primary" onclick="Auth.showLoginModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Sign In to Continue
        </button>
      </div>
    `;
  },

  // ==========================================
  // Logged-in view (full portfolio)
  // ==========================================

  async renderLoggedInView(container) {
    container.innerHTML = '';

    // Initialize holdings from API or mock
    await this.loadHoldings();

    // 1. Search bar to add stocks
    container.appendChild(this.renderSearchToAdd());

    // 2. Add stock form (hidden by default)
    const addFormWrap = document.createElement('div');
    addFormWrap.id = 'portfolio-add-form-wrap';
    addFormWrap.className = 'hidden';
    container.appendChild(addFormWrap);

    // 3. Summary cards
    container.appendChild(this.renderSummaryCards());

    // 4. Holdings table
    const holdingsSection = document.createElement('div');
    holdingsSection.id = 'portfolio-holdings-section';
    holdingsSection.innerHTML = this.renderHoldingsTable(this.holdings);
    container.appendChild(holdingsSection);

    // 5. Watchlist section
    const watchlistSection = document.createElement('div');
    watchlistSection.id = 'portfolio-watchlist-section';
    container.appendChild(watchlistSection);
    await this.renderWatchlistSection(watchlistSection);

    // Start auto-refresh of prices
    this.startAutoRefresh();
  },

  // ==========================================
  // Holdings loading
  // ==========================================

  async loadHoldings() {
    try {
      const data = await api.getPortfolio();
      if (Array.isArray(data) && data.length > 0) {
        this.holdings = data.map(h => ({
          ...h,
          price: h.price || h.avg_cost,
          change: h.change || 0,
          changePercent: h.changePercent || 0
        }));
      } else {
        this.holdings = [...this.mockHoldings];
      }
    } catch {
      this.holdings = [...this.mockHoldings];
    }
  },

  // ==========================================
  // Search to add stocks
  // ==========================================

  renderSearchToAdd() {
    const wrap = document.createElement('div');
    wrap.className = 'portfolio-search-wrap';
    wrap.id = 'portfolio-search-wrap';
    wrap.innerHTML = `
      <div class="portfolio-search-label">Add a Stock to Your Portfolio</div>
      <div class="portfolio-search-bar">
        <svg class="portfolio-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" class="portfolio-search-input" id="portfolio-add-search"
          placeholder="Search by symbol or company name (e.g., AAPL)..."
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        <button class="portfolio-search-clear hidden" id="portfolio-add-clear" onclick="Portfolio.clearAddSearch()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="portfolio-search-dropdown hidden" id="portfolio-add-dropdown"></div>
    `;

    requestAnimationFrame(() => {
      const input = document.getElementById('portfolio-add-search');
      if (input) {
        input.addEventListener('input', (e) => this.handleAddStockSearch(e.target.value));
        input.addEventListener('focus', () => {
          const dd = document.getElementById('portfolio-add-dropdown');
          if (dd && dd.children.length > 0) dd.classList.remove('hidden');
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') this.clearAddSearch();
        });
      }
      document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target)) {
          const dd = document.getElementById('portfolio-add-dropdown');
          if (dd) dd.classList.add('hidden');
        }
      });
    });

    return wrap;
  },

  handleAddStockSearch(query) {
    const clearBtn = document.getElementById('portfolio-add-clear');
    if (clearBtn) clearBtn.classList.toggle('hidden', query.trim().length === 0);

    if (this.addSearchDebounceTimer) clearTimeout(this.addSearchDebounceTimer);

    if (query.trim().length === 0) {
      this.clearAddDropdown();
      return;
    }

    this.addSearchDebounceTimer = setTimeout(() => this.executeAddSearch(query.trim()), 250);
  },

  async executeAddSearch(query) {
    try {
      const results = await api.searchStocks(query, 8);
      this.renderAddDropdownResults(Array.isArray(results) ? results : []);
    } catch {
      // Filter from common stocks
      const common = [
        { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
        { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ' },
        { symbol: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
        { symbol: 'META', name: 'Meta Platforms', exchange: 'NASDAQ' },
        { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
        { symbol: 'JPM', name: 'JPMorgan Chase', exchange: 'NYSE' },
        { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE' },
        { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE' },
        { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE' },
        { symbol: 'PG', name: 'Procter & Gamble', exchange: 'NYSE' },
        { symbol: 'DIS', name: 'Walt Disney', exchange: 'NYSE' },
        { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
        { symbol: 'AMD', name: 'Adv Micro Dev', exchange: 'NASDAQ' },
        { symbol: 'INTC', name: 'Intel Corp.', exchange: 'NASDAQ' },
        { symbol: 'BA', name: 'Boeing Co', exchange: 'NYSE' },
        { symbol: 'KO', name: 'Coca-Cola', exchange: 'NYSE' },
        { symbol: 'MCD', name: "McDonald's Corp", exchange: 'NYSE' },
        { symbol: 'NKE', name: 'Nike Inc.', exchange: 'NYSE' },
        { symbol: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE' },
        { symbol: 'XOM', name: 'Exxon Mobil', exchange: 'NYSE' },
        { symbol: 'BAC', name: 'Bank of America', exchange: 'NYSE' },
        { symbol: 'CSCO', name: 'Cisco Systems', exchange: 'NASDAQ' },
        { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ' },
        { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE' },
        { symbol: 'PYPL', name: 'PayPal Holdings', exchange: 'NASDAQ' },
        { symbol: 'UBER', name: 'Uber Technologies', exchange: 'NYSE' },
        { symbol: 'ABNB', name: 'Airbnb Inc.', exchange: 'NASDAQ' },
        { symbol: 'COIN', name: 'Coinbase Global', exchange: 'NASDAQ' }
      ];
      const q = query.toUpperCase();
      const filtered = common.filter(s =>
        s.symbol.includes(q) || s.name.toUpperCase().includes(q)
      ).slice(0, 8);
      this.renderAddDropdownResults(filtered);
    }
  },

  renderAddDropdownResults(results) {
    const dropdown = document.getElementById('portfolio-add-dropdown');
    if (!dropdown) return;

    if (results.length === 0) {
      dropdown.innerHTML = '<div class="portfolio-search-empty">No stocks found</div>';
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = results.map(r => `
      <div class="portfolio-search-result" onclick="Portfolio.selectStockToAdd('${r.symbol}', '${r.name || r.symbol}')">
        <div class="portfolio-result-logo">${(r.name || r.symbol).charAt(0)}</div>
        <div class="portfolio-result-info">
          <div class="portfolio-result-symbol">${r.symbol}</div>
          <div class="portfolio-result-name">${r.name || ''}</div>
        </div>
        <div class="portfolio-result-exchange">${r.exchange || 'NYSE'}</div>
      </div>
    `).join('');
    dropdown.classList.remove('hidden');
  },

  clearAddDropdown() {
    const dropdown = document.getElementById('portfolio-add-dropdown');
    if (dropdown) {
      dropdown.innerHTML = '';
      dropdown.classList.add('hidden');
    }
  },

  clearAddSearch() {
    const input = document.getElementById('portfolio-add-search');
    if (input) input.value = '';
    this.clearAddDropdown();
    const clearBtn = document.getElementById('portfolio-add-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
  },

  // ==========================================
  // Add stock form
  // ==========================================

  async selectStockToAdd(symbol, name) {
    this.selectedAddStock = { symbol, name };
    this.clearAddSearch();

    // Fetch current price
    let price = 0;
    try {
      const quote = await api.getQuote(symbol);
      price = quote.price || 0;
    } catch {
      price = 100 + Math.random() * 200;
    }

    const wrap = document.getElementById('portfolio-add-form-wrap');
    if (!wrap) return;
    wrap.classList.remove('hidden');
    wrap.innerHTML = `
      <div class="portfolio-add-form-card">
        <div class="portfolio-add-form-header">
          <div class="portfolio-add-form-stock">
            <div class="portfolio-add-form-logo">${name.charAt(0)}</div>
            <div>
              <div class="portfolio-add-form-symbol">${symbol}</div>
              <div class="portfolio-add-form-name">${name}</div>
            </div>
          </div>
          <div class="portfolio-add-form-price">${this.fmtPrice(price)}</div>
        </div>
        <div class="portfolio-add-form-fields">
          <div class="portfolio-form-group">
            <label class="portfolio-form-label">Shares</label>
            <input type="number" class="portfolio-form-input" id="add-shares" placeholder="0" min="0" step="1">
          </div>
          <div class="portfolio-form-group">
            <label class="portfolio-form-label">Avg Cost per Share</label>
            <input type="number" class="portfolio-form-input" id="add-avg-cost" placeholder="0.00" min="0" step="0.01" value="${price > 0 ? price.toFixed(2) : ''}">
          </div>
        </div>
        <div class="portfolio-add-form-actions">
          <button class="portfolio-btn-primary" onclick="Portfolio.submitAddHolding()">Add to Portfolio</button>
          <button class="portfolio-btn-secondary" onclick="Portfolio.cancelAdd()">Cancel</button>
        </div>
      </div>
    `;
  },

  openAddForm(symbol) {
    // Used by StockDetail modal - look up the name and open form
    const known = this.holdings.find(h => h.symbol === symbol);
    const name = known ? known.name : symbol;
    this.selectStockToAdd(symbol, name);
    // Scroll to form
    const wrap = document.getElementById('portfolio-add-form-wrap');
    if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  async submitAddHolding() {
    const sharesInput = document.getElementById('add-shares');
    const avgCostInput = document.getElementById('add-avg-cost');
    const shares = parseFloat(sharesInput?.value);
    const avgCost = parseFloat(avgCostInput?.value);

    if (!this.selectedAddStock || !shares || shares <= 0 || !avgCost || avgCost <= 0) {
      if (typeof App !== 'undefined') App.showToast('Please enter valid shares and average cost', 'error');
      return;
    }

    const { symbol, name } = this.selectedAddStock;

    try {
      // Try API first
      const result = await api.addHolding({ symbol, name, shares, avg_cost: avgCost });
      if (typeof App !== 'undefined') App.showToast(`${symbol} added to portfolio`, 'success');
    } catch {
      // Fallback: add locally
      const newHolding = {
        id: Date.now(),
        symbol,
        name,
        shares,
        avg_cost: avgCost,
        price: avgCost,
        change: 0,
        changePercent: 0
      };
      this.holdings.push(newHolding);
      if (typeof App !== 'undefined') App.showToast(`${symbol} added locally`, 'info');
    }

    this.cancelAdd();
    this.refreshUI();
  },

  cancelAdd() {
    this.selectedAddStock = null;
    const wrap = document.getElementById('portfolio-add-form-wrap');
    if (wrap) {
      wrap.innerHTML = '';
      wrap.classList.add('hidden');
    }
  },

  // ==========================================
  // Summary cards
  // ==========================================

  renderSummaryCards() {
    const stats = this.calculatePortfolioStats();
    const div = document.createElement('div');
    div.className = 'portfolio-summary-grid';
    div.id = 'portfolio-summary-grid';
    div.innerHTML = `
      <div class="portfolio-summary-card">
        <div class="portfolio-summary-label">Total Value</div>
        <div class="portfolio-summary-value">${this.fmtCurrency(stats.totalValue)}</div>
      </div>
      <div class="portfolio-summary-card">
        <div class="portfolio-summary-label">Total P&L</div>
        <div class="portfolio-summary-value" style="color:${stats.totalPL >= 0 ? 'var(--success)' : 'var(--danger)'}">
          ${stats.totalPL >= 0 ? '+' : ''}${this.fmtCurrency(stats.totalPL)}
        </div>
        <div class="portfolio-summary-sub" style="color:${stats.totalPLPercent >= 0 ? 'var(--success)' : 'var(--danger)'}">
          ${stats.totalPLPercent >= 0 ? '+' : ''}${stats.totalPLPercent.toFixed(2)}%
        </div>
      </div>
      <div class="portfolio-summary-card">
        <div class="portfolio-summary-label">Day Change</div>
        <div class="portfolio-summary-value" style="color:${stats.dayChangeValue >= 0 ? 'var(--success)' : 'var(--danger)'}">
          ${stats.dayChangeValue >= 0 ? '+' : ''}${this.fmtCurrency(stats.dayChangeValue)}
        </div>
        <div class="portfolio-summary-sub" style="color:${stats.dayChange >= 0 ? 'var(--success)' : 'var(--danger)'}">
          ${stats.dayChange >= 0 ? '+' : ''}${stats.dayChange.toFixed(2)}%
        </div>
      </div>
      <div class="portfolio-summary-card">
        <div class="portfolio-summary-label">Positions</div>
        <div class="portfolio-summary-value">${this.holdings.length}</div>
        <div class="portfolio-summary-sub">stocks held</div>
      </div>
    `;
    return div;
  },

  calculatePortfolioStats() {
    let totalValue = 0;
    let totalCost = 0;
    let dayChangeValue = 0;
    let dayChange = 0;
    let weightedChangeSum = 0;

    this.holdings.forEach(h => {
      const value = h.shares * (h.price || h.avg_cost);
      const cost = h.shares * h.avg_cost;
      totalValue += value;
      totalCost += cost;
      const hDayChange = value * ((h.changePercent || 0) / 100);
      dayChangeValue += hDayChange;
      weightedChangeSum += (h.changePercent || 0) * value;
    });

    const totalPL = totalValue - totalCost;
    const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    dayChange = totalValue > 0 ? weightedChangeSum / totalValue : 0;

    return { totalValue, totalPL, totalPLPercent, dayChange, dayChangeValue };
  },

  // ==========================================
  // Holdings table (sortable)
  // ==========================================

  renderHoldingsTable(holdings) {
    if (holdings.length === 0) {
      return `
        <div class="portfolio-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/></svg>
          <p>No holdings yet. Search above to add your first stock.</p>
        </div>
      `;
    }

    const sorted = this.sortHoldings(holdings);
    const totalValue = this.holdings.reduce((sum, h) => sum + h.shares * (h.price || h.avg_cost), 0);

    return `
      <div class="portfolio-section-header">
        <div>
          <div class="portfolio-section-title">Holdings</div>
          <div class="portfolio-section-subtitle">${holdings.length} positions</div>
        </div>
        <button class="portfolio-btn-refresh" onclick="Portfolio.refreshPrices()" title="Refresh prices">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        </button>
      </div>
      <div class="portfolio-table-wrap">
        <table class="portfolio-table">
          <thead>
            <tr>
              ${this.renderSortHeader('symbol', 'Symbol')}
              ${this.renderSortHeader('name', 'Name')}
              ${this.renderSortHeader('shares', 'Shares', 'right')}
              ${this.renderSortHeader('avg_cost', 'Avg Cost', 'right')}
              ${this.renderSortHeader('price', 'Price', 'right')}
              ${this.renderSortHeader('changePercent', 'Change', 'right')}
              ${this.renderSortHeader('pl', 'P&L', 'right')}
              ${this.renderSortHeader('value', 'Value', 'right')}
              <th style="text-align:center">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map((h, i) => this.renderHoldingRow(h, totalValue, i)).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderSortHeader(column, label, align = 'left') {
    const isActive = this.sortBy === column;
    const arrow = isActive ? (this.sortAsc ? ' &#9650;' : ' &#9660;') : '';
    const style = align === 'right' ? 'text-align:right;cursor:pointer' : 'cursor:pointer';
    return `<th style="${style}" onclick="Portfolio.setSort('${column}')">${label}${arrow}</th>`;
  },

  setSort(column) {
    if (this.sortBy === column) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortBy = column;
      this.sortAsc = true;
    }
    this.refreshHoldingsTable();
  },

  sortHoldings(holdings) {
    const sorted = [...holdings];
    const dir = this.sortAsc ? 1 : -1;

    sorted.sort((a, b) => {
      switch (this.sortBy) {
        case 'symbol': return dir * a.symbol.localeCompare(b.symbol);
        case 'name': return dir * (a.name || '').localeCompare(b.name || '');
        case 'shares': return dir * ((a.shares || 0) - (b.shares || 0));
        case 'avg_cost': return dir * ((a.avg_cost || 0) - (b.avg_cost || 0));
        case 'price': return dir * ((a.price || a.avg_cost || 0) - (b.price || b.avg_cost || 0));
        case 'changePercent': return dir * ((a.changePercent || 0) - (b.changePercent || 0));
        case 'pl': {
          const plA = (a.shares * ((a.price || a.avg_cost) - a.avg_cost));
          const plB = (b.shares * ((b.price || b.avg_cost) - b.avg_cost));
          return dir * (plA - plB);
        }
        case 'value':
          return dir * ((a.shares * (a.price || a.avg_cost)) - (b.shares * (b.price || b.avg_cost)));
        default: return 0;
      }
    });

    return sorted;
  },

  renderHoldingRow(h, totalValue, index) {
    const price = h.price || h.avg_cost;
    const value = h.shares * price;
    const cost = h.shares * h.avg_cost;
    const pl = value - cost;
    const plPercent = h.avg_cost > 0 ? ((price - h.avg_cost) / h.avg_cost) * 100 : 0;
    const isPos = (h.changePercent || 0) >= 0;
    const isPlPos = pl >= 0;
    const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;

    return `
      <tr class="portfolio-table-row ${index % 2 === 0 ? 'even' : ''}">
        <td>
          <div class="portfolio-row-symbol" onclick="Portfolio.openStockDetail('${h.symbol}')">
            <div class="portfolio-row-logo">${(h.name || h.symbol).charAt(0)}</div>
            <span class="portfolio-row-symbol-text">${h.symbol}</span>
          </div>
        </td>
        <td class="portfolio-row-name">${h.name || ''}</td>
        <td class="portfolio-row-number">${h.shares.toLocaleString()}</td>
        <td class="portfolio-row-number">${this.fmtPrice(h.avg_cost)}</td>
        <td class="portfolio-row-number">
          <div>${this.fmtPrice(price)}</div>
        </td>
        <td class="portfolio-row-number ${isPos ? 'positive' : 'negative'}">
          ${isPos ? '+' : ''}${(h.changePercent || 0).toFixed(2)}%
        </td>
        <td class="portfolio-row-number ${isPlPos ? 'positive' : 'negative'}">
          <div>${isPlPos ? '+' : ''}${this.fmtCurrency(pl)}</div>
          <div style="font-size:11px;opacity:0.8">${isPlPos ? '+' : ''}${plPercent.toFixed(1)}%</div>
        </td>
        <td class="portfolio-row-number">
          <div>${this.fmtCurrency(value)}</div>
          <div style="font-size:11px;color:var(--text-muted)">${weight.toFixed(1)}%</div>
        </td>
        <td style="text-align:center">
          <div class="portfolio-row-actions">
            <button class="portfolio-action-btn" onclick="Portfolio.openStockDetail('${h.symbol}')" title="View">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="portfolio-action-btn" onclick="Portfolio.toggleWatchlist('${h.symbol}')" title="Watchlist">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>
            <button class="portfolio-action-btn delete" onclick="Portfolio.removeHolding(${h.id})" title="Remove">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  refreshHoldingsTable() {
    const section = document.getElementById('portfolio-holdings-section');
    if (section) {
      section.innerHTML = this.renderHoldingsTable(this.holdings);
    }
  },

  // ==========================================
  // Watchlist
  // ==========================================

  async renderWatchlistSection(container) {
    // Load watchlist
    try {
      const data = await api.getWatchlist();
      this.watchlist = Array.isArray(data) ? data : [];
    } catch {
      this.watchlist = [];
    }

    const hasItems = this.watchlist.length > 0;
    container.innerHTML = `
      <div class="portfolio-section-header">
        <div>
          <div class="portfolio-section-title">Watchlist</div>
          <div class="portfolio-section-subtitle">${this.watchlist.length} stocks</div>
        </div>
      </div>
      ${hasItems ? `
        <div class="portfolio-watchlist-grid">
          ${this.watchlist.map(w => this.renderWatchlistItem(w)).join('')}
        </div>
      ` : `
        <div class="portfolio-watchlist-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          <p>Your watchlist is empty. Click the heart icon on any stock to add it here.</p>
        </div>
      `}
    `;
  },

  renderWatchlistItem(item) {
    const isPos = (item.changePercent || 0) >= 0;
    const price = item.price || 0;
    return `
      <div class="portfolio-watchlist-card" onclick="Portfolio.openStockDetail('${item.symbol}')">
        <div class="portfolio-watchlist-top">
          <div class="portfolio-watchlist-symbol">${item.symbol}</div>
          <button class="portfolio-watchlist-remove" onclick="event.stopPropagation(); Portfolio.removeFromWatchlist('${item.symbol}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="portfolio-watchlist-name">${item.name || ''}</div>
        <div class="portfolio-watchlist-bottom">
          <span class="portfolio-watchlist-price">${this.fmtPrice(price)}</span>
          <span class="portfolio-watchlist-change ${isPos ? 'positive' : 'negative'}">
            ${isPos ? '+' : ''}${(item.changePercent || 0).toFixed(2)}%
          </span>
        </div>
      </div>
    `;
  },

  async toggleWatchlist(symbol) {
    const existing = this.watchlist.find(w => w.symbol === symbol);
    try {
      if (existing) {
        await api.removeFromWatchlist(symbol);
        this.watchlist = this.watchlist.filter(w => w.symbol !== symbol);
        if (typeof App !== 'undefined') App.showToast(`${symbol} removed from watchlist`, 'info');
      } else {
        await api.addToWatchlist(symbol);
        this.watchlist.push({ symbol, price: 0, changePercent: 0 });
        if (typeof App !== 'undefined') App.showToast(`${symbol} added to watchlist`, 'success');
      }
      this.refreshWatchlistSection();
    } catch {
      if (typeof App !== 'undefined') App.showToast('Failed to update watchlist', 'error');
    }
  },

  async removeFromWatchlist(symbol) {
    try {
      await api.removeFromWatchlist(symbol);
      this.watchlist = this.watchlist.filter(w => w.symbol !== symbol);
      this.refreshWatchlistSection();
      if (typeof App !== 'undefined') App.showToast(`${symbol} removed from watchlist`, 'info');
    } catch {
      if (typeof App !== 'undefined') App.showToast('Failed to remove from watchlist', 'error');
    }
  },

  refreshWatchlistSection() {
    const section = document.getElementById('portfolio-watchlist-section');
    if (section) this.renderWatchlistSection(section);
  },

  // ==========================================
  // Price refresh (batch update)
  // ==========================================

  async refreshPrices() {
    if (this.holdings.length === 0) return;

    const symbols = [...new Set(this.holdings.map(h => h.symbol))];
    try {
      const quotes = await api.batchQuotes(symbols);
      if (Array.isArray(quotes) && quotes.length > 0) {
        quotes.forEach(q => {
          const holding = this.holdings.find(h => h.symbol === q.symbol);
          if (holding) {
            holding.price = q.price || holding.price;
            holding.change = q.change || holding.change;
            holding.changePercent = q.changePercent !== undefined ? q.changePercent : holding.changePercent;
          }
        });
      }
    } catch {
      // Simulate slight price movements on failure
      this.holdings.forEach(h => {
        const jitter = (Math.random() - 0.5) * 0.2;
        h.price = (h.price || h.avg_cost) * (1 + jitter / 100);
        h.changePercent = (h.changePercent || 0) + jitter;
      });
    }

    this.refreshUI();
  },

  refreshUI() {
    // Update summary
    const summaryGrid = document.getElementById('portfolio-summary-grid');
    if (summaryGrid) {
      const newSummary = this.renderSummaryCards();
      summaryGrid.innerHTML = newSummary.innerHTML;
    }

    // Update holdings table
    this.refreshHoldingsTable();
  },

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.refreshTimer = setInterval(() => this.refreshPrices(), 30000);
  },

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  },

  // ==========================================
  // Holding management
  // ==========================================

  async removeHolding(id) {
    if (!confirm('Remove this holding from your portfolio?')) return;

    try {
      await api.deleteHolding(id);
      this.holdings = this.holdings.filter(h => h.id !== id);
      if (typeof App !== 'undefined') App.showToast('Holding removed', 'info');
    } catch {
      this.holdings = this.holdings.filter(h => h.id !== id);
      if (typeof App !== 'undefined') App.showToast('Holding removed locally', 'info');
    }

    this.refreshUI();
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

  fmtCurrency(n) {
    if (n === undefined || n === null) return '$--';
    const absVal = Math.abs(Number(n));
    if (absVal >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (absVal >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K';
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
};
