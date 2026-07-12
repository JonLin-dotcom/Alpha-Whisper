// ============================================
// Alpha Whisper v2.0 - Portfolio Tab
// ============================================

const Portfolio = {
  mockHoldings: [
    { id: 1, symbol: 'AAPL', name: 'Apple Inc.', shares: 50, avg_cost: 165.30, price: 178.35, change: 0.85 },
    { id: 2, symbol: 'MSFT', name: 'Microsoft Corp.', shares: 25, avg_cost: 385.50, price: 421.92, change: 1.24 },
    { id: 3, symbol: 'NVDA', name: 'NVIDIA Corp.', shares: 15, avg_cost: 420.00, price: 892.14, change: 4.32 },
    { id: 4, symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 40, avg_cost: 155.20, price: 165.98, change: 0.42 },
    { id: 5, symbol: 'AMZN', name: 'Amazon.com Inc.', shares: 35, avg_cost: 172.50, price: 185.37, change: 1.68 },
    { id: 6, symbol: 'META', name: 'Meta Platforms', shares: 12, avg_cost: 485.00, price: 512.75, change: 2.91 },
    { id: 7, symbol: 'TSLA', name: 'Tesla Inc.', shares: 30, avg_cost: 195.00, price: 172.82, change: -2.15 },
    { id: 8, symbol: 'JPM', name: 'JPMorgan Chase', shares: 20, avg_cost: 188.00, price: 195.67, change: 0.76 }
  ],

  getHoldings() {
    if (AppState.user) {
      // Try to get from state first, then fallback to mock
      if (AppState.holdings && AppState.holdings.length > 0) {
        return AppState.holdings;
      }
    }
    return this.mockHoldings;
  },

  calculatePortfolioStats(holdings) {
    let totalValue = 0;
    let totalCost = 0;
    let dayChange = 0;
    let dayChangeValue = 0;

    holdings.forEach(h => {
      const value = h.shares * h.price;
      const cost = h.shares * h.avg_cost;
      totalValue += value;
      totalCost += cost;
      dayChangeValue += value * (h.change / 100);
      dayChange += h.change * (value / (totalValue || 1));
    });

    const totalPL = totalValue - totalCost;
    const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

    return {
      totalValue,
      totalPL,
      totalPLPercent,
      dayChange,
      dayChangeValue,
      cashAvailable: 24750.85
    };
  },

  renderPortfolioTab() {
    const container = document.getElementById('portfolio-content');
    const skeleton = document.getElementById('portfolio-skeleton');

    skeleton.classList.remove('hidden');
    container.innerHTML = '';

    setTimeout(() => {
      skeleton.classList.add('hidden');

      if (!AppState.user) {
        this.renderLoggedOutView(container);
      } else {
        this.renderLoggedInView(container);
      }
    }, 400);
  },

  renderLoggedOutView(container) {
    container.innerHTML = `
      <div class="cta-card">
        <img src="../logo.png" alt="Alpha Whisper" style="width:56px;height:56px;border-radius:50%;margin:0 auto 16px;object-fit:cover;box-shadow:0 4px 20px rgba(59,130,246,0.2);">
        <h3>Track Your Portfolio</h3>
        <p>Sign in to view your holdings, track performance, and get AI-powered investment insights tailored to your portfolio.</p>
        <button class="btn-primary" style="margin-top:8px;" onclick="Auth.showLoginModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Sign In to Continue
        </button>
      </div>
    `;
  },

  renderLoggedInView(container) {
    const holdings = this.getHoldings();
    const stats = this.calculatePortfolioStats(holdings);

    // Summary grid
    const summary = document.createElement('div');
    summary.className = 'summary-grid';
    summary.innerHTML = `
      <div class="summary-card">
        <div class="summary-label">Total Value</div>
        <div class="summary-value">${App.formatCurrency(stats.totalValue)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Total P&L</div>
        <div class="summary-value" style="color: ${stats.totalPL >= 0 ? 'var(--success)' : 'var(--danger)'}">
          ${stats.totalPL >= 0 ? '+' : ''}${App.formatCurrency(stats.totalPL)}
        </div>
        <div class="summary-change" style="color: ${stats.totalPLPercent >= 0 ? 'var(--success)' : 'var(--danger)'}">
          ${stats.totalPLPercent >= 0 ? '+' : ''}${stats.totalPLPercent.toFixed(2)}%
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Day Change</div>
        <div class="summary-value" style="color: ${stats.dayChangeValue >= 0 ? 'var(--success)' : 'var(--danger)'}">
          ${stats.dayChangeValue >= 0 ? '+' : ''}${App.formatCurrency(stats.dayChangeValue)}
        </div>
        <div class="summary-change" style="color: ${stats.dayChange >= 0 ? 'var(--success)' : 'var(--danger)'}">
          ${stats.dayChange >= 0 ? '+' : ''}${stats.dayChange.toFixed(2)}%
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Cash Available</div>
        <div class="summary-value">${App.formatCurrency(stats.cashAvailable)}</div>
      </div>
    `;
    container.appendChild(summary);

    // Performance chart placeholder
    const chartCard = document.createElement('div');
    chartCard.className = 'card';
    chartCard.innerHTML = `
      <div class="card-header">
        <div class="card-title">Performance</div>
        <span class="badge badge-success">+${(stats.totalPLPercent / 3).toFixed(1)}% YTD</span>
      </div>
      <div class="chart-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <span style="margin-left:12px;">Portfolio chart coming soon</span>
      </div>
    `;
    container.appendChild(chartCard);

    // Holdings table
    const holdingsCard = document.createElement('div');
    holdingsCard.className = 'card';
    holdingsCard.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-title">Holdings</div>
          <div class="card-subtitle">${holdings.length} positions</div>
        </div>
        <button class="btn-primary btn-sm" onclick="Portfolio.showAddHoldingModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add
        </button>
      </div>
      <div style="overflow-x:auto;">
        <div class="holdings-header">
          <div>Symbol</div>
          <div style="text-align:right">Shares</div>
          <div style="text-align:right">Price</div>
          <div style="text-align:right">P&L</div>
        </div>
        ${holdings.map(h => this.renderHoldingRow(h, stats.totalValue)).join('')}
      </div>
    `;
    container.appendChild(holdingsCard);

    // Allocation preview
    const allocCard = document.createElement('div');
    allocCard.className = 'card';
    allocCard.innerHTML = `
      <div class="card-title" style="margin-bottom:12px;">Top Allocations</div>
      ${this.renderAllocationBars(holdings, stats.totalValue)}
    `;
    container.appendChild(allocCard);
  },

  renderHoldingRow(holding, totalValue) {
    const value = holding.shares * holding.price;
    const cost = holding.shares * holding.avg_cost;
    const pl = value - cost;
    const plPercent = ((holding.price - holding.avg_cost) / holding.avg_cost) * 100;
    const weight = (value / totalValue) * 100;
    const isPos = pl >= 0;

    return `
      <div class="holdings-row">
        <div>
          <div class="holding-symbol">${holding.symbol}</div>
          <div class="holding-name">${holding.name}</div>
        </div>
        <div class="holding-cell">${holding.shares}</div>
        <div class="holding-cell">
          <div>$${App.formatNumber(holding.price)}</div>
          <div style="font-size:11px;color:${holding.change >= 0 ? 'var(--success)' : 'var(--danger)'}">
            ${holding.change >= 0 ? '+' : ''}${holding.change.toFixed(2)}%
          </div>
        </div>
        <div class="holding-cell">
          <div style="color:${isPos ? 'var(--success)' : 'var(--danger)'};font-weight:600;">
            ${isPos ? '+' : ''}${App.formatCurrency(pl)}
          </div>
          <div style="font-size:11px;color:${isPos ? 'var(--success)' : 'var(--danger)'}">
            ${isPos ? '+' : ''}${plPercent.toFixed(1)}%
          </div>
        </div>
      </div>
    `;
  },

  renderAllocationBars(holdings, totalValue) {
    const sorted = [...holdings].sort((a, b) => (b.shares * b.price) - (a.shares * a.price)).slice(0, 5);
    const colors = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'];

    return sorted.map((h, i) => {
      const value = h.shares * h.price;
      const pct = (value / totalValue) * 100;
      return `
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:13px;font-weight:600;">${h.symbol}</span>
            <span style="font-size:12px;color:var(--text-secondary);">${pct.toFixed(1)}%</span>
          </div>
          <div style="height:6px;background:var(--input-bg);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${colors[i]};border-radius:3px;transition:width 0.6s ease;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  showAddHoldingModal() {
    document.getElementById('holding-id').value = '';
    document.getElementById('holding-symbol').value = '';
    document.getElementById('holding-name').value = '';
    document.getElementById('holding-shares').value = '';
    document.getElementById('holding-avg-cost').value = '';
    document.getElementById('holding-modal-title').textContent = 'Add Holding';
    document.getElementById('holding-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  showEditHoldingModal(holding) {
    document.getElementById('holding-id').value = holding.id;
    document.getElementById('holding-symbol').value = holding.symbol;
    document.getElementById('holding-name').value = holding.name;
    document.getElementById('holding-shares').value = holding.shares;
    document.getElementById('holding-avg-cost').value = holding.avg_cost;
    document.getElementById('holding-modal-title').textContent = 'Edit Holding';
    document.getElementById('holding-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  closeHoldingModal() {
    document.getElementById('holding-modal').classList.add('hidden');
    document.body.style.overflow = '';
  },

  handleHoldingSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('holding-id').value;
    const symbol = document.getElementById('holding-symbol').value.toUpperCase().trim();
    const name = document.getElementById('holding-name').value.trim() || symbol;
    const shares = parseFloat(document.getElementById('holding-shares').value);
    const avgCost = parseFloat(document.getElementById('holding-avg-cost').value);

    if (!symbol || !shares || !avgCost) {
      App.showToast('Please fill in all required fields', 'error');
      return;
    }

    // Simulate price lookup
    const mockPrice = avgCost * (1 + (Math.random() - 0.3) * 0.1);
    const change = (Math.random() - 0.4) * 5;

    const holding = {
      id: id ? parseInt(id) : Date.now(),
      symbol,
      name,
      shares,
      avg_cost: avgCost,
      price: mockPrice,
      change
    };

    if (id) {
      const idx = this.mockHoldings.findIndex(h => h.id === parseInt(id));
      if (idx >= 0) this.mockHoldings[idx] = holding;
      App.showToast('Holding updated', 'success');
    } else {
      this.mockHoldings.push(holding);
      App.showToast('Holding added', 'success');
    }

    this.closeHoldingModal();
    this.renderLoggedInView(document.getElementById('portfolio-content'));
  },

  deleteHolding(id) {
    if (confirm('Delete this holding?')) {
      this.mockHoldings = this.mockHoldings.filter(h => h.id !== id);
      App.showToast('Holding deleted', 'info');
      this.renderLoggedInView(document.getElementById('portfolio-content'));
    }
  }
};
