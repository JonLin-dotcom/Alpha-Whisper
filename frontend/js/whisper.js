// ============================================
// Alpha Whisper v2.0 - AI Whisper Chat Tab
// AIME-style conversational AI interface
// ============================================

const Whisper = {
  chatMessages: [],
  isTyping: false,

  // Mock AI responses
  mockResponses: {
    greeting: "Hello! I'm Alpha Bot, your AI financial advisor. I can help you analyze stocks, check market trends, review your portfolio, or discover new investment opportunities. What would you like to explore today?",
    insights: "Here are today's key market insights:\n\n**Market Breadth**: 58% of stocks are advancing, indicating moderate bullish sentiment.\n\n**Notable Movers**: NVDA (+4.3%) leads the tech rally following strong AI chip demand. Energy sector showing weakness with crude down 1.2%.\n\n**Volatility**: VIX at 14.2, below the 20 threshold, suggesting calm market conditions.\n\n**Key Level**: S&P 500 holding above the 5,200 support level. Watch for a potential breakout above 5,250.",
    fundamentals: "Let me break down the fundamental analysis framework:\n\n**Valuation Metrics**:\n- P/E Ratio: Compare price to earnings (avg S&P 500: ~24x)\n- P/B Ratio: Price to book value\n- EV/EBITDA: Enterprise value metric\n\n**Growth Indicators**:\n- Revenue growth YoY\n- Earnings growth trajectory\n- Free cash flow trends\n\n**Financial Health**:\n- Debt-to-equity ratio\n- Current ratio (liquidity)\n- Interest coverage\n\nWould you like me to analyze a specific stock's fundamentals?",
    technicals: "Technical Analysis Overview:\n\n**Trend Analysis**:\n- Primary trend: Bullish above 50-day SMA\n- Support: 5,200 | Resistance: 5,250\n- Volume trend: Increasing on up-days\n\n**Key Patterns**:\n- Ascending triangle forming on SPY\n- Golden cross on QQQ (50/200 SMA)\n- Head & shoulders potential on IWM\n\n**Momentum Indicators**:\n- RSI: 62 (neutral, room to run)\n- MACD: Bullish crossover signal\n- Stochastic: Approaching overbought\n\nWhich stock or ETF would you like me to chart?",
    discover: "Here are some interesting opportunities I've found:\n\n**Growth Picks**:\n- $CRWD - Cybersecurity leader, 30%+ revenue growth\n- $PLTR - AI/data analytics, expanding government contracts\n- $CELH - Healthy energy drinks, strong market expansion\n\n**Value Plays**:\n- $BMY - Pharma giant, 5.4% dividend yield, undervalued\n- $VZ - Telecom with 6.5% yield at multi-year lows\n- $F - Ford trading below book value\n\n**Dividend Aristocrats**:\n- $JNJ - 61 years of dividend increases\n- $PG - Consumer staples defensive play\n- $KO - Berkshire-backed beverage giant\n\nWould you like a deep dive on any of these?",
    markets: "Current Market Snapshot:\n\n**US Indices**:\n- S&P 500 (SPY): $524.83 (+0.41%)\n- Nasdaq 100 (QQQ): $438.27 (+1.35%)\n- Dow Jones (DIA): $391.56 (-0.19%)\n- Russell 2000 (IWM): $203.18 (+0.62%)\n\n**Sector Performance**:\n- Technology: +1.8% (leading)\n- Healthcare: +0.5%\n- Financials: +0.3%\n- Energy: -1.2% (lagging)\n- Utilities: -0.4%\n\n**Economic Calendar**:\n- Tomorrow: CPI data release at 8:30 AM ET\n- Thursday: Jobless claims, PPI data\n- Next week: FOMC meeting minutes\n\nThe market is pricing in a 72% probability of rate cuts starting in June.",
    portfolio: "Portfolio Analysis Summary:\n\n**Asset Allocation**:\n- Technology: 35% (overweight)\n- Healthcare: 18% (neutral)\n- Financials: 12% (underweight)\n- Consumer: 15% (neutral)\n- Cash: 20% (opportunistic)\n\n**Risk Assessment**:\n- Portfolio Beta: 1.15 (slightly aggressive)\n- Concentration Risk: High in tech\n- Sector Diversification: Could improve\n\n**Recommendations**:\n1. Consider taking some profits on NVDA (+120% gains)\n2. Add defensive positions (utilities/consumer staples)\n3. Diversify into international markets\n4. Maintain 15-20% cash for opportunities\n\nWould you like me to suggest a specific rebalancing strategy?",
    risk: "Understanding Your Risk Profile:\n\n**Risk Score: 68/100** (Moderate-High)\n\nYour current profile suggests you:\n- Can tolerate 15-20% portfolio drawdowns\n- Have a 5+ year investment horizon\n- Are comfortable with volatility for higher returns\n- Should consider a 70/30 equity/bond allocation\n\n**Suitable Investments**:\n- Index funds (SPY, VTI) as core holdings\n- Growth stocks (max 30% of portfolio)\n- REITs for income (10-15%)\n- International exposure (15-20%)\n\n**Avoid**:\n- Leveraged ETFs for long-term holds\n- Individual stock concentration >10%\n- Crypto speculation >5%\n\nWould you like me to create a model portfolio based on your risk score?",
    help: "I can help you with:\n\n**Market Analysis**:\n- Real-time market data and trends\n- Sector rotation signals\n- Breadth and momentum indicators\n\n**Stock Research**:\n- Fundamental analysis\n- Technical chart patterns\n- Fair value estimates\n\n**Portfolio Management**:\n- Risk assessment\n- Rebalancing suggestions\n- Tax-loss harvesting ideas\n\n**Education**:\n- Options strategies\n- ETF comparisons\n- Economic indicators explained\n\nJust type your question or use the quick action buttons below!"
  },

  renderWhisperTab() {
    const container = document.getElementById('chat-messages');

    if (this.chatMessages.length === 0) {
      // Show welcome state
      this.showWelcome(container);
    }
  },

  showWelcome(container) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    container.innerHTML = `
      <div class="chat-welcome">
        <img src="../logo.png" alt="Alpha Bot" class="chat-welcome-logo">
        <h3>Alpha Bot</h3>
        <p>Your AI-powered financial advisor. Ask me anything about markets, stocks, or your portfolio.</p>
      </div>
    `;

    // Add initial bot greeting
    setTimeout(() => {
      this.addBotMessage(this.mockResponses.greeting, timeStr);
    }, 500);
  },

  sendMessage(text) {
    const input = document.getElementById('chat-input');
    const messageText = text || input.value.trim();

    if (!messageText || this.isTyping) return;

    // Clear input
    if (!text) input.value = '';

    // Add user message
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.addUserMessage(messageText, timeStr);

    // Show typing indicator
    this.showTypingIndicator();

    // Simulate AI response with realistic delay
    const delay = 800 + Math.random() * 1200;

    setTimeout(() => {
      this.hideTypingIndicator();
      const response = this.generateResponse(messageText);
      this.addBotMessage(response, new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, delay);
  },

  quickAction(action) {
    const actionMap = {
      insights: { text: 'Show me today\'s market insights', response: 'insights' },
      fundamentals: { text: 'Explain fundamental analysis', response: 'fundamentals' },
      technicals: { text: 'Show technical analysis overview', response: 'technicals' },
      discover: { text: 'Find investment opportunities', response: 'discover' },
      markets: { text: 'Show current market snapshot', response: 'markets' }
    };

    const actionData = actionMap[action];
    if (actionData) {
      this.sendMessage(actionData.text);
    }
  },

  generateResponse(userText) {
    const lower = userText.toLowerCase();

    if (lower.includes('insight') || lower.includes('today') || lower.includes('market') || lower.includes('news')) {
      return this.mockResponses.insights;
    }
    if (lower.includes('fundamental') || lower.includes('pe ratio') || lower.includes('valuation') || lower.includes('earnings')) {
      return this.mockResponses.fundamentals;
    }
    if (lower.includes('technical') || lower.includes('chart') || lower.includes('pattern') || lower.includes('rsi') || lower.includes('macd') || lower.includes('support') || lower.includes('resistance')) {
      return this.mockResponses.technicals;
    }
    if (lower.includes('discover') || lower.includes('opportunit') || lower.includes('pick') || lower.includes('recommend') || lower.includes('stock to buy') || lower.includes('idea')) {
      return this.mockResponses.discover;
    }
    if (lower.includes('snapshot') || lower.includes('market') || lower.includes('spy') || lower.includes('qqq') || lower.includes('indices') || lower.includes('sector')) {
      return this.mockResponses.markets;
    }
    if (lower.includes('portfolio') || lower.includes('allocation') || lower.includes('rebalance') || lower.includes('my holdings')) {
      return this.mockResponses.portfolio;
    }
    if (lower.includes('risk') || lower.includes('profile') || lower.includes('aggressive') || lower.includes('conservative')) {
      return this.mockResponses.risk;
    }
    if (lower.includes('help') || lower.includes('what can you do') || lower.includes('?') && lower.length < 10) {
      return this.mockResponses.help;
    }

    // Generic response for stock symbols (e.g., $AAPL or AAPL)
    const stockMatch = userText.match(/\$?([A-Z]{1,5})/);
    if (stockMatch) {
      const symbol = stockMatch[1];
      return this.generateStockResponse(symbol);
    }

    // Default contextual response
    return this.generateContextualResponse(userText);
  },

  generateStockResponse(symbol) {
    const mockPrices = {
      AAPL: 178.35, MSFT: 421.92, GOOGL: 165.98, AMZN: 185.37,
      TSLA: 172.82, META: 512.75, NVDA: 892.14, AMD: 178.56,
      NFLX: 625.43, CRM: 298.56, DIS: 112.34, BA: 218.92,
      JPM: 195.67, V: 275.43, MA: 432.18, BAC: 37.52,
      PFE: 27.84, JNJ: 158.23, UNH: 528.91, XOM: 104.56
    };

    const price = mockPrices[symbol] || (50 + Math.random() * 200);
    const change = (Math.random() - 0.4) * 8;
    const pe = (15 + Math.random() * 30).toFixed(1);
    const marketCap = (price > 300 ? 1.5 + Math.random() * 2 : 0.1 + Math.random() * 0.5).toFixed(2);
    const rsi = Math.floor(30 + Math.random() * 50);

    return `**${symbol}** Analysis:\n\n**Price**: $${price.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)\n\n**Key Metrics**:\n- P/E Ratio: ${pe}x\n- Market Cap: $${marketCap}T\n- 52-Week Range: $${(price * 0.7).toFixed(2)} - $${(price * 1.4).toFixed(2)}\n- Dividend Yield: ${(Math.random() * 3).toFixed(2)}%\n\n**Technical Signals**:\n- RSI: ${rsi} (${rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'})\n- 50-Day SMA: ${(price * (1 + (Math.random() - 0.5) * 0.1)).toFixed(2)}\n- Trend: ${change > 0 ? 'Bullish' : 'Bearish'} short-term\n\n**Analyst Consensus**: ${['Strong Buy', 'Buy', 'Hold', 'Buy'][Math.floor(Math.random() * 4)]}\nPrice Target: $${(price * 1.15).toFixed(2)}\n\nWould you like me to compare ${symbol} with similar stocks or analyze its sector?`;
  },

  generateContextualResponse(userText) {
    const responses = [
      `Great question! Based on current market conditions, I'd recommend focusing on quality companies with strong balance sheets and consistent cash flows. The current environment favors businesses with pricing power and durable competitive advantages.\n\nWould you like me to suggest some specific stocks or ETFs that fit this criteria?`,
      `That's an interesting point. When analyzing investments, I always look at three key factors:\n\n1. **Fundamental Quality** - Strong earnings, low debt, competitive moat\n2. **Valuation** - Reasonable entry price relative to intrinsic value\n3. **Technical Setup** - Favorable risk/reward entry point\n\nApplying this framework to your question - could you share which specific stocks or sectors you're considering?`,
      `I appreciate you sharing that. In my analysis, I see several factors at play:\n\n- Macroeconomic trends favoring quality growth\n- Sector rotation into defensive names\n- Earnings season surprises creating opportunities\n\nFor a more detailed analysis, could you specify if you're looking at a particular stock, sector, or asset class?`,
      `From a portfolio strategy perspective, diversification remains key. I typically recommend:\n\n- 60% Core holdings (index ETFs)\n- 25% Growth/satellite positions\n- 15% Cash/opportunistic\n\nThis approach helps capture upside while managing downside risk. Would you like me to review your current allocation?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  },

  addUserMessage(text, time) {
    const container = document.getElementById('chat-messages');

    // Remove welcome if present
    const welcome = container.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message user';
    msgEl.innerHTML = `
      <div style="max-width: 100%;">
        <div class="message-content">${this.escapeHtml(text)}</div>
        <div class="message-time">${time}</div>
      </div>
    `;
    container.appendChild(msgEl);
    this.scrollToBottom();

    this.chatMessages.push({ type: 'user', text, time });
  },

  addBotMessage(text, time) {
    const container = document.getElementById('chat-messages');

    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message bot';
    msgEl.innerHTML = `
      <img src="../logo.png" alt="Alpha Bot" class="message-avatar">
      <div style="max-width: 100%;">
        <div class="message-content">${this.formatMessage(text)}</div>
        <div class="message-time">${time}</div>
      </div>
    `;
    container.appendChild(msgEl);
    this.scrollToBottom();

    this.chatMessages.push({ type: 'bot', text, time });
  },

  showTypingIndicator() {
    this.isTyping = true;
    const container = document.getElementById('chat-messages');

    const indicator = document.createElement('div');
    indicator.className = 'chat-message bot';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <img src="../logo.png" alt="Alpha Bot" class="typing-logo">
      <div class="typing-indicator">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    `;
    container.appendChild(indicator);
    this.scrollToBottom();

    document.getElementById('chat-send-btn').disabled = true;
  },

  hideTypingIndicator() {
    this.isTyping = false;
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
    document.getElementById('chat-send-btn').disabled = false;
  },

  scrollToBottom() {
    const container = document.getElementById('chat-messages');
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 50);
  },

  formatMessage(text) {
    // Convert **bold** to <strong>bold</strong>
    let formatted = this.escapeHtml(text);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert $SYMBOL to styled spans
    formatted = formatted.replace(/\$([A-Z]{1,5})/g, '<span style="color:var(--primary);font-weight:600;">$$$1</span>');
    // Convert newlines to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    // Convert numbered lists
    formatted = formatted.replace(/^(\d+)\.\s/gm, '<strong>$1.</strong> ');
    return formatted;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Enter key to send
document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        Whisper.sendMessage();
      }
    });
  }
});
