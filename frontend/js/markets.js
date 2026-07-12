// ============================================
// Alpha Whisper v2.0 - Markets Tab
// ============================================

const Markets = {
  // Mock data for indices
  mockIndices: [
    {
      symbol: 'SPY',
      name: 'S&P 500 ETF',
      price: 524.83,
      change: 2.14,
      changePercent: 0.41,
      sparkline: [520, 521, 519, 522, 523, 521, 524, 523, 525, 524.83],
      color: 'spy'
    },
    {
      symbol: 'QQQ',
      name: 'Nasdaq 100 ETF',
      price: 438.27,
      change: 5.82,
      changePercent: 1.35,
      sparkline: [432, 433, 431, 434, 435, 433, 436, 437, 439, 438.27],
      color: 'qqq'
    },
    {
      symbol: 'DIA',
      name: 'Dow Jones ETF',
      price: 391.56,
      change: -0.74,
      changePercent: -0.19,
      sparkline: [392.5, 392, 393, 391.5, 392.3, 391.8, 391.2, 392, 391.5, 391.56],
      color: 'dia'
    },
    {
      symbol: 'IWM',
      name: 'Russell 2000 ETF',
      price: 203.18,
      change: 1.26,
      changePercent: 0.62,
      sparkline: [201, 202, 201.5, 202.5, 202, 203.5, 203, 202.8, 203.5, 203.18],
      color: 'iwm'
    }
  ],

  // Mock momentum data
  mockMomentum: {
    advancingPercent: 58.3,
    decliningPercent: 41.7,
    newHighs: 127,
    newLows: 23,
    aboveSMA50: 62.5,
    aboveSMA200: 71.2,
    advVolume: 3.2,
    declVolume: 1.8
  },

  currentPeriod: '1D',

  renderMarketsTab() {
    const container = document.getElementById('markets-content');
    const skeleton = document.getElementById('markets-skeleton');

    // Show skeleton briefly for UX
    skeleton.classList.remove('hidden');
    container.innerHTML = '';

    setTimeout(() => {
      skeleton.classList.add('hidden');
      this.buildMarketsView(container);
    }, 400);
  },

  buildMarketsView(container) {
    const indices = AppState.marketData.indices.length > 0
      ? AppState.marketData.indices
      : this.mockIndices;
    const momentum = AppState.marketData.momentum && Object.keys(AppState.marketData.momentum).length > 0
      ? AppState.marketData.momentum
      : this.mockMomentum;

    // Time period selector
    const periods = ['1D', '1W', '1M', '3M', '1Y'];
    const periodSelector = document.createElement('div');
    periodSelector.className = 'card';
    periodSelector.style.padding = '6px';
    periodSelector.innerHTML = `
      <div class="period-selector">
        ${periods.map(p => `
          <button class="period-btn ${p === this.currentPeriod ? 'active' : ''}" onclick="Markets.setPeriod('${p}')">${p}</button>
        `).join('')}
      </div>
    `;
    container.appendChild(periodSelector);

    // Market indices section
    const indicesSection = document.createElement('div');
    indicesSection.innerHTML = `
      <div class="section-title">Market Indices</div>
      <div class="section-subtitle">Real-time market overview</div>
    `;
    container.appendChild(indicesSection);

    indices.forEach(idx => {
      const card = document.createElement('div');
      card.className = 'market-index-card';
      const isPositive = idx.changePercent >= 0;
      card.innerHTML = `
        <div class="market-index-left">
          <div class="market-index-logo ${idx.color}">${idx.symbol[0]}</div>
          <div>
            <div class="market-index-name">${idx.name}</div>
            <div class="market-index-symbol">${idx.symbol}</div>
          </div>
        </div>
        <div class="market-index-right">
          <div class="market-index-price">$${this.fmtPrice(idx.price)}</div>
          <div class="market-index-change ${isPositive ? 'positive' : 'negative'}">
            ${isPositive ? '+' : ''}${idx.changePercent.toFixed(2)}%
          </div>
          ${this.renderSparkline(idx.sparkline, isPositive)}
        </div>
      `;
      container.appendChild(card);
    });

    // Market momentum section
    const momSection = document.createElement('div');
    momSection.className = 'card';
    momSection.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-title">Market Momentum</div>
          <div class="card-subtitle">NYSE breadth indicators</div>
        </div>
        <span class="badge badge-success">Live</span>
      </div>
      <div class="momentum-grid">
        <div class="momentum-card">
          <div class="momentum-label">Advancing</div>
          <div class="momentum-value positive">${momentum.advancingPercent.toFixed(1)}%</div>
          <div class="momentum-sublabel">of stocks</div>
        </div>
        <div class="momentum-card">
          <div class="momentum-label">New Highs</div>
          <div class="momentum-value positive">${momentum.newHighs}</div>
          <div class="momentum-sublabel">today</div>
        </div>
        <div class="momentum-card">
          <div class="momentum-label">New Lows</div>
          <div class="momentum-value ${momentum.newLows > 50 ? 'negative' : 'positive'}">${momentum.newLows}</div>
          <div class="momentum-sublabel">today</div>
        </div>
        <div class="momentum-card">
          <div class="momentum-label">Above SMA 50</div>
          <div class="momentum-value positive">${momentum.aboveSMA50.toFixed(1)}%</div>
          <div class="momentum-sublabel">of stocks</div>
        </div>
        <div class="momentum-card">
          <div class="momentum-label">Above SMA 200</div>
          <div class="momentum-value positive">${momentum.aboveSMA200.toFixed(1)}%</div>
          <div class="momentum-sublabel">of stocks</div>
        </div>
        <div class="momentum-card">
          <div class="momentum-label">Adv/Decl Vol</div>
          <div class="momentum-value positive">${momentum.advVolume.toFixed(1)}x</div>
          <div class="momentum-sublabel">volume ratio</div>
        </div>
      </div>
    `;
    container.appendChild(momSection);

    // Market trends
    const trendsCard = document.createElement('div');
    trendsCard.className = 'card';
    trendsCard.innerHTML = `
      <div class="card-header">
        <div class="card-title">Trending Stocks</div>
        <span class="text-muted text-xs">Last updated: ${new Date().toLocaleTimeString()}</span>
      </div>
      ${this.renderTrendingStocks()}
    `;
    container.appendChild(trendsCard);
  },

  renderTrendingStocks() {
    const stocks = [
      { symbol: 'NVDA', name: 'NVIDIA Corp', price: 892.14, change: 4.32 },
      { symbol: 'AAPL', name: 'Apple Inc', price: 178.35, change: 0.85 },
      { symbol: 'MSFT', name: 'Microsoft Corp', price: 421.92, change: 1.24 },
      { symbol: 'TSLA', name: 'Tesla Inc', price: 172.82, change: -2.15 },
      { symbol: 'AMZN', name: 'Amazon.com', price: 185.37, change: 1.68 },
      { symbol: 'META', name: 'Meta Platforms', price: 512.75, change: 2.91 },
      { symbol: 'GOOGL', name: 'Alphabet Inc', price: 165.98, change: 0.42 },
      { symbol: 'AMD', name: 'Adv Micro Dev', price: 178.56, change: -1.23 },
    ];

    return stocks.map(s => {
      const isPos = s.change >= 0;
      return `
        <div class="stock-row">
          <div class="stock-info">
            <div class="stock-logo">${s.symbol.slice(0, 2)}</div>
            <div class="stock-details">
              <div class="stock-symbol">${s.symbol}</div>
              <div class="stock-name">${s.name}</div>
            </div>
          </div>
          <div class="stock-price-info">
            <div class="stock-price">$${this.fmtPrice(s.price)}</div>
            <div class="stock-change ${isPos ? 'text-success' : 'text-danger'}">
              ${isPos ? '+' : ''}${s.change.toFixed(2)}%
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderSparkline(data, isPositive) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 80, h = 24;
    const padding = 2;

    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (w - 2 * padding);
      const y = h - padding - ((val - min) / range) * (h - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const color = isPositive ? '#10B981' : '#EF4444';

    return `<svg class="sparkline" viewBox="0 0 ${w} ${h}" style="margin-top:4px">
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  },

  setPeriod(period) {
    this.currentPeriod = period;
    // Simulate data refresh with different random values
    this.mockIndices.forEach(idx => {
      const multiplier = period === '1D' ? 1 : period === '1W' ? 5 : period === '1M' ? 20 : period === '3M' ? 60 : 200;
      const baseChange = (Math.random() - 0.4) * multiplier;
      idx.changePercent = baseChange;
      idx.change = idx.price * baseChange / 100;
      // Recalculate sparkline
      const base = idx.price - idx.change;
      idx.sparkline = Array.from({ length: 10 }, (_, i) => base + (idx.change * i / 9) + (Math.random() - 0.5) * idx.price * 0.005);
    });
    this.renderMarketsTab();
  },

  fmtPrice(price) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
};
