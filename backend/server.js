/**
 * ============================================================
 * Alpha Whisper v2.0 - AI Robo-Advisory Backend
 * Production-ready Node.js/Express REST API
 * ============================================================
 */

// ===== DEPENDENCIES =====
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// ===== CONFIG =====
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'alpha-whisper-secret-key-2024';
const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = '7d';

const DB_CONFIG = {
  host: '47.119.141.23',
  port: 3306,
  user: 'root',
  password: 'Aa138088!',
  database: 'alpha_whisper',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

// ===== APP INIT =====
const app = express();

// ===== MIDDLEWARE =====
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.send.bind(res);
  res.send = function (body) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    return originalSend(body);
  };
  next();
});

// ===== DATABASE POOL =====
let dbPool;

async function initDatabase() {
  try {
    dbPool = mysql.createPool(DB_CONFIG);

    // Test connection
    const conn = await dbPool.getConnection();
    console.log('[DB] Connected to alpha_whisper database successfully');
    conn.release();

    // Create tables if not exist
    await createTables();
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }
}

async function createTables() {
  try {
    // Users table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        risk_score INT DEFAULT 50,
        is_admin TINYINT(1) DEFAULT 0,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Portfolio holdings table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS portfolio_holdings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        name VARCHAR(100) NOT NULL,
        shares DECIMAL(18,4) NOT NULL DEFAULT 0,
        avg_cost DECIMAL(18,4) NOT NULL DEFAULT 0,
        current_price DECIMAL(18,4),
        sector VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_holding (user_id, symbol)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Performance snapshots table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS performance_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        snapshot_date DATE NOT NULL,
        total_value DECIMAL(18,4) NOT NULL DEFAULT 0,
        total_cost DECIMAL(18,4) NOT NULL DEFAULT 0,
        pnl DECIMAL(18,4) NOT NULL DEFAULT 0,
        pnl_pct DECIMAL(8,4) NOT NULL DEFAULT 0,
        realized_pnl DECIMAL(18,4) DEFAULT 0,
        unrealized_pnl DECIMAL(18,4) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_snapshot (user_id, snapshot_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Chat sessions table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_title VARCHAR(200) DEFAULT 'New Chat',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Chat messages table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        role ENUM('user', 'assistant') NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('[DB] All tables verified/created successfully');
  } catch (err) {
    console.error('[DB] Table creation error:', err.message);
    throw err;
  }
}

// ===== AUTH MIDDLEWARE =====
async function verifyToken(req, res, next) {
  try {
    const token = req.headers['x-auth-token'];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No auth token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
}

async function requireAdmin(req, res, next) {
  try {
    await verifyToken(req, res, async () => {
      const [rows] = await dbPool.query(
        'SELECT is_admin FROM users WHERE id = ?',
        [req.userId]
      );
      if (!rows.length || !rows[0].is_admin) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }
      next();
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Admin check failed' });
  }
}

// ===== VALIDATION HELPERS =====
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeString(str, maxLength = 255) {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength);
}

// ===== AI RESPONSE GENERATOR =====
function generateAIResponse(message) {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('buy') || lowerMsg.includes('recommend') || lowerMsg.includes('stock')) {
    return `📊 **Stock Recommendation**

Based on current market momentum and technical indicators, here are my top picks:

**Strong Buy:**
- **AAPL** - Strong earnings momentum, AI integration driving growth. Target: $220+
- **NVDA** - AI infrastructure leader, data center demand remains robust. Target: $150+
- **MSFT** - Cloud revenue accelerating, Copilot adoption growing. Target: $500+

**Moderate Buy:**
- **GOOGL** - Search dominance + cloud growth, undervalued vs. peers. Target: $200+
- **AMZN** - AWS margin expansion, retail efficiency gains. Target: $220+

⚠️ **Risk Consideration:** Market breadth shows 46% advancing vs 44.8% declining. Consider dollar-cost averaging your entries over 2-4 weeks rather than lump sum investing.

Would you like me to analyze any specific stock in detail?`;
  }

  if (lowerMsg.includes('risk') || lowerMsg.includes('volatile') || lowerMsg.includes('safe')) {
    return `⚖️ **Risk Assessment**

Your current risk profile analysis:

**Market Risk Indicators:**
- VIX: ~14.5 (Low volatility environment)
- S&P 500 above 50-day SMA: 53.3% of stocks
- S&P 500 above 200-day SMA: 50.4% of stocks
- New highs vs new lows: 54.8% vs 45.2%

**Risk Recommendations:**
- **Conservative (Risk Score 20-40):** 60% bonds/REITs, 30% large-cap, 10% cash
- **Moderate (Risk Score 40-60):** 40% large-cap, 30% mid/small-cap, 20% bonds, 10% alternatives
- **Aggressive (Risk Score 60-80):** 50% growth stocks, 25% international, 15% small-cap, 10% crypto/alternatives

**Current Market Sentiment:** Neutral-Bullish. Momentum is positive but not overextended. Good time to rebalance if your allocation has drifted >5% from target.

Shall I create a personalized risk-adjusted portfolio for you?`;
  }

  if (lowerMsg.includes('portfolio') || lowerMsg.includes('allocate') || lowerMsg.includes('allocation')) {
    return `📈 **Portfolio Allocation Strategy**

Here's a suggested allocation based on current market conditions:

**Core Holdings (70%):**
| Sector | Allocation | ETFs |
|--------|-----------|------|
| US Large Cap | 25% | VOO, SPY |
| US Mid/Small Cap | 15% | IWM, IJH |
| International | 15% | VXUS, VEA |
| Bonds/Fixed Income | 15% | BND, AGG |

**Satellite Holdings (25%):**
| Theme | Allocation | Picks |
|-------|-----------|-------|
| AI/Tech | 10% | NVDA, MSFT, SMH |
| Healthcare | 8% | XLV, UNH, LLY |
| Energy | 7% | XLE, VDE |

**Cash Reserve (5%)** - For opportunistic buys during corrections

**Rebalancing Rule:** Review quarterly, rebalance when any allocation drifts >5% from target.

This allocation historically delivers 8-12% annual returns with a max drawdown of ~20%.

Would you like me to adjust this for your specific risk tolerance?`;
  }

  if (lowerMsg.includes('market') || lowerMsg.includes('news') || lowerMsg.includes('outlook')) {
    return `📰 **Market Summary - Today**

**Indices Performance:**
- S&P 500 (SPY): $754.95 (+0.43%) - Hitting new highs
- Nasdaq 100 (QQQ): $725.51 (+0.31%) - Tech strength continues
- Dow Jones (DIA): $525.78 (+0.30%) - Blue chips steady
- Russell 2000 (IWM): $295.99 (-0.42%) - Small-cap lagging

**Market Breadth:**
- Advancing: 46.1% | Declining: 44.8%
- New Highs: 54.8% | New Lows: 45.2%
- Above 50-day SMA: 53.3%
- Above 200-day SMA: 50.4%

**Key Themes:**
1. AI infrastructure spending driving semiconductor outperformance
2. Fed rate cut expectations supporting valuation multiples
3. Earnings season showing 8% YoY EPS growth
4. Small-caps underperforming due to rate sensitivity

**Outlook:** Neutral to slightly bullish. Technical indicators suggest continuation of the uptrend, but watch for narrowing breadth as a potential warning sign.

Want me to dive deeper into any sector?`;
  }

  return `👋 Welcome to Alpha Whisper! I'm your AI robo-advisor, here to help you make smarter investment decisions.

**Here's what I can do for you:**

📊 **Stock Recommendations** - Ask "What stocks should I buy?" or "Recommend tech stocks"

⚖️ **Risk Assessment** - Ask "What's my risk profile?" or "Is the market risky right now?"

📈 **Portfolio Allocation** - Ask "How should I allocate my portfolio?" or "Portfolio suggestions"

📰 **Market Analysis** - Ask "Market news" or "What's the market outlook?"

💬 Feel free to ask me anything about investing, and I'll provide data-driven insights tailored to your needs!

What would you like to explore today?`;
}

// ===== ROUTES =====

// Health check
app.get('/health', async (req, res) => {
  try {
    const conn = await dbPool.getConnection();
    conn.release();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      db: 'disconnected',
      message: 'Database connection failed'
    });
  }
});

// ========== AUTH ROUTES ==========

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const cleanUsername = sanitizeString(username, 50);
    const cleanEmail = sanitizeString(email, 100).toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      return res.status(400).json({ success: false, message: 'Username must be 3-50 characters' });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check duplicate
    const [existing] = await dbPool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [cleanUsername, cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const [result] = await dbPool.query(
      'INSERT INTO users (username, email, password_hash, risk_score) VALUES (?, ?, ?, ?)',
      [cleanUsername, cleanEmail, passwordHash, 50]
    );

    const userId = result.insertId;

    // Generate JWT
    const token = jwt.sign({ userId, email: cleanEmail }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        risk_score: 50
      }
    });
  } catch (err) {
    console.error('[Auth/Register] Error:', err.message);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = sanitizeString(email, 100).toLowerCase();

    // Find user
    const [rows] = await dbPool.query(
      'SELECT id, username, email, password_hash, risk_score FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Update last login
    await dbPool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        risk_score: user.risk_score
      }
    });
  } catch (err) {
    console.error('[Auth/Login] Error:', err.message);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      'SELECT id, username, email, risk_score, is_admin, last_login, created_at, updated_at FROM users WHERE id = ?',
      [req.userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('[Auth/Me] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to get user profile' });
  }
});

// ========== MARKET ROUTES (No Auth) ==========

// GET /api/market/indices
app.get('/api/market/indices', (req, res) => {
  res.json({
    indices: [
      {
        symbol: 'SPY',
        name: 'SPDR S&P 500',
        price: 754.95,
        change: 3.21,
        changePct: 0.43,
        sparkline: [748, 750, 749, 752, 751, 753, 755, 754, 756, 755, 754, 755, 754, 755, 754.95]
      },
      {
        symbol: 'QQQ',
        name: 'Invesco QQQ',
        price: 725.51,
        change: 2.24,
        changePct: 0.31,
        sparkline: [720, 722, 721, 724, 723, 725, 724, 726, 725, 727, 726, 725, 726, 725, 725.51]
      },
      {
        symbol: 'DIA',
        name: 'SPDR Dow Jones',
        price: 525.78,
        change: 1.58,
        changePct: 0.30,
        sparkline: [520, 522, 521, 524, 523, 525, 524, 526, 525, 527, 526, 525, 526, 525, 525.78]
      },
      {
        symbol: 'IWM',
        name: 'iShares Russell 2000',
        price: 295.99,
        change: -1.24,
        changePct: -0.42,
        sparkline: [300, 298, 299, 297, 298, 296, 297, 295, 296, 294, 295, 293, 294, 296, 295.99]
      }
    ]
  });
});

// GET /api/market/momentum
app.get('/api/market/momentum', (req, res) => {
  res.json({
    advancing: 46.1,
    declining: 44.8,
    newHigh: 54.8,
    newLow: 45.2,
    aboveSMA50: 53.3,
    belowSMA50: 46.7,
    aboveSMA200: 50.4,
    belowSMA200: 49.6
  });
});

// ========== PORTFOLIO ROUTES (Auth Required) ==========

// GET /api/portfolio
app.get('/api/portfolio', verifyToken, async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      `SELECT id, symbol, name, shares, avg_cost, current_price, sector, created_at, updated_at
       FROM portfolio_holdings WHERE user_id = ? ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json({ holdings: rows });
  } catch (err) {
    console.error('[Portfolio/Get] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch portfolio' });
  }
});

// POST /api/portfolio
app.post('/api/portfolio', verifyToken, async (req, res) => {
  try {
    const { symbol, name, shares, avg_cost, sector } = req.body;

    if (!symbol || !name || shares === undefined || avg_cost === undefined) {
      return res.status(400).json({ success: false, message: 'Symbol, name, shares, and avg_cost are required' });
    }

    const cleanSymbol = sanitizeString(symbol, 20).toUpperCase();
    const cleanName = sanitizeString(name, 100);
    const numShares = parseFloat(shares);
    const numAvgCost = parseFloat(avg_cost);
    const cleanSector = sector ? sanitizeString(sector, 50) : null;

    if (isNaN(numShares) || numShares <= 0) {
      return res.status(400).json({ success: false, message: 'Shares must be a positive number' });
    }
    if (isNaN(numAvgCost) || numAvgCost <= 0) {
      return res.status(400).json({ success: false, message: 'Average cost must be a positive number' });
    }

    const [result] = await dbPool.query(
      `INSERT INTO portfolio_holdings (user_id, symbol, name, shares, avg_cost, sector)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.userId, cleanSymbol, cleanName, numShares, numAvgCost, cleanSector]
    );

    const [holding] = await dbPool.query(
      'SELECT * FROM portfolio_holdings WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ success: true, holding: holding[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Holding already exists for this symbol' });
    }
    console.error('[Portfolio/Create] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create holding' });
  }
});

// PUT /api/portfolio/:id
app.put('/api/portfolio/:id', verifyToken, async (req, res) => {
  try {
    const holdingId = parseInt(req.params.id, 10);
    const { shares, avg_cost } = req.body;

    if (isNaN(holdingId)) {
      return res.status(400).json({ success: false, message: 'Invalid holding ID' });
    }

    // Verify ownership
    const [existing] = await dbPool.query(
      'SELECT id FROM portfolio_holdings WHERE id = ? AND user_id = ?',
      [holdingId, req.userId]
    );

    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Holding not found' });
    }

    const updates = [];
    const values = [];

    if (shares !== undefined) {
      const numShares = parseFloat(shares);
      if (isNaN(numShares) || numShares < 0) {
        return res.status(400).json({ success: false, message: 'Shares must be a non-negative number' });
      }
      updates.push('shares = ?');
      values.push(numShares);
    }

    if (avg_cost !== undefined) {
      const numAvgCost = parseFloat(avg_cost);
      if (isNaN(numAvgCost) || numAvgCost <= 0) {
        return res.status(400).json({ success: false, message: 'Average cost must be a positive number' });
      }
      updates.push('avg_cost = ?');
      values.push(numAvgCost);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(holdingId);

    await dbPool.query(
      `UPDATE portfolio_holdings SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [holding] = await dbPool.query(
      'SELECT * FROM portfolio_holdings WHERE id = ?',
      [holdingId]
    );

    res.json({ success: true, holding: holding[0] });
  } catch (err) {
    console.error('[Portfolio/Update] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update holding' });
  }
});

// DELETE /api/portfolio/:id
app.delete('/api/portfolio/:id', verifyToken, async (req, res) => {
  try {
    const holdingId = parseInt(req.params.id, 10);

    if (isNaN(holdingId)) {
      return res.status(400).json({ success: false, message: 'Invalid holding ID' });
    }

    // Verify ownership and delete
    const [result] = await dbPool.query(
      'DELETE FROM portfolio_holdings WHERE id = ? AND user_id = ?',
      [holdingId, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Holding not found' });
    }

    res.json({ success: true, message: 'Holding deleted' });
  } catch (err) {
    console.error('[Portfolio/Delete] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete holding' });
  }
});

// ========== PERFORMANCE ROUTES (Auth Required) ==========

// GET /api/performance
app.get('/api/performance', verifyToken, async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      `SELECT id, snapshot_date, total_value, total_cost, pnl, pnl_pct, realized_pnl, unrealized_pnl, created_at
       FROM performance_snapshots
       WHERE user_id = ?
       ORDER BY snapshot_date DESC
       LIMIT 90`,
      [req.userId]
    );
    res.json({ snapshots: rows });
  } catch (err) {
    console.error('[Performance/Get] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch performance data' });
  }
});

// POST /api/performance/snapshot
app.post('/api/performance/snapshot', verifyToken, async (req, res) => {
  try {
    const { total_value, total_cost, realized_pnl, unrealized_pnl } = req.body;

    if (total_value === undefined || total_cost === undefined) {
      return res.status(400).json({ success: false, message: 'total_value and total_cost are required' });
    }

    const numTotalValue = parseFloat(total_value);
    const numTotalCost = parseFloat(total_cost);
    const numRealizedPnl = realized_pnl !== undefined ? parseFloat(realized_pnl) : 0;
    const numUnrealizedPnl = unrealized_pnl !== undefined ? parseFloat(unrealized_pnl) : 0;

    if (isNaN(numTotalValue) || isNaN(numTotalCost)) {
      return res.status(400).json({ success: false, message: 'Invalid numeric values' });
    }

    const pnl = numTotalValue - numTotalCost;
    const pnlPct = numTotalCost !== 0 ? ((pnl / numTotalCost) * 100).toFixed(4) : 0;
    const today = new Date().toISOString().split('T')[0];

    const [result] = await dbPool.query(
      `INSERT INTO performance_snapshots
       (user_id, snapshot_date, total_value, total_cost, pnl, pnl_pct, realized_pnl, unrealized_pnl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       total_value = VALUES(total_value), total_cost = VALUES(total_cost),
       pnl = VALUES(pnl), pnl_pct = VALUES(pnl_pct),
       realized_pnl = VALUES(realized_pnl), unrealized_pnl = VALUES(unrealized_pnl)`,
      [req.userId, today, numTotalValue, numTotalCost, pnl, pnlPct, numRealizedPnl, numUnrealizedPnl]
    );

    const [snapshot] = await dbPool.query(
      'SELECT * FROM performance_snapshots WHERE id = ?',
      [result.insertId || result.insertId === 0 ? result.insertId :
        (await dbPool.query('SELECT id FROM performance_snapshots WHERE user_id = ? AND snapshot_date = ?', [req.userId, today]))[0][0].id]
    );

    res.status(201).json({ success: true, snapshot: snapshot[0] });
  } catch (err) {
    console.error('[Performance/Snapshot] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save snapshot' });
  }
});

// ========== WHISPER/CHAT ROUTES (Auth Required) ==========

// GET /api/whisper/chats
app.get('/api/whisper/chats', verifyToken, async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      'SELECT id, session_title, created_at, updated_at FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC',
      [req.userId]
    );
    res.json({ sessions: rows });
  } catch (err) {
    console.error('[Whisper/Chats] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch chat sessions' });
  }
});

// POST /api/whisper/chat
app.post('/api/whisper/chat', verifyToken, async (req, res) => {
  try {
    const { message, session_id } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const cleanMessage = sanitizeString(message, 5000);
    let sessionId = session_id ? parseInt(session_id, 10) : null;

    // Start a transaction for chat operations
    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      // Create new session if no session_id provided
      if (!sessionId) {
        const title = cleanMessage.substring(0, 50) + (cleanMessage.length > 50 ? '...' : '');
        const [sessionResult] = await conn.query(
          'INSERT INTO chat_sessions (user_id, session_title) VALUES (?, ?)',
          [req.userId, title]
        );
        sessionId = sessionResult.insertId;
      } else {
        // Verify session belongs to user
        const [sessionCheck] = await conn.query(
          'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
          [sessionId, req.userId]
        );
        if (!sessionCheck.length) {
          await conn.rollback();
          conn.release();
          return res.status(404).json({ success: false, message: 'Chat session not found' });
        }
      }

      // Save user message
      await conn.query(
        'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
        [sessionId, 'user', cleanMessage]
      );

      // Generate AI response
      const aiResponse = generateAIResponse(cleanMessage);

      // Save AI response
      const [msgResult] = await conn.query(
        'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
        [sessionId, 'assistant', aiResponse]
      );

      // Update session timestamp
      await conn.query(
        'UPDATE chat_sessions SET updated_at = NOW() WHERE id = ?',
        [sessionId]
      );

      await conn.commit();
      conn.release();

      res.status(201).json({
        success: true,
        message: {
          id: msgResult.insertId,
          role: 'assistant',
          content: aiResponse,
          created_at: new Date().toISOString()
        },
        session_id: sessionId
      });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (err) {
    console.error('[Whisper/Chat] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to process chat message' });
  }
});

// ========== ADMIN ROUTES (Admin Auth Required) ==========

// GET /api/admin/users
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = req.query.search ? sanitizeString(req.query.search, 100) : '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const queryParams = [];

    if (search) {
      whereClause = 'WHERE u.username LIKE ? OR u.email LIKE ?';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const [countResult] = await dbPool.query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Get users with portfolio summary
    const [users] = await dbPool.query(
      `SELECT
        u.id, u.username, u.email, u.risk_score, u.is_admin,
        u.created_at, u.last_login,
        COUNT(DISTINCT ph.id) as holdings_count,
        COALESCE(SUM(ph.shares * COALESCE(ph.current_price, ph.avg_cost)), 0) as total_value,
        COALESCE(SUM(ph.shares * (COALESCE(ph.current_price, ph.avg_cost) - ph.avg_cost)), 0) as total_pnl
       FROM users u
       LEFT JOIN portfolio_holdings ph ON u.id = ph.user_id
       ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.json({ users, total, page, limit });
  } catch (err) {
    console.error('[Admin/Users] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// GET /api/admin/stats
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    // Total users
    const [usersResult] = await dbPool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = usersResult[0].count;

    // Active today (users with login today)
    const [activeResult] = await dbPool.query(
      "SELECT COUNT(DISTINCT id) as count FROM users WHERE last_login >= CURDATE()"
    );
    const activeToday = activeResult[0].count;

    // Total holdings count
    const [holdingsResult] = await dbPool.query('SELECT COUNT(*) as count FROM portfolio_holdings');
    const totalHoldings = holdingsResult[0].count;

    // Total AUM (sum of all portfolio values)
    const [aumResult] = await dbPool.query(
      `SELECT COALESCE(SUM(shares * COALESCE(current_price, avg_cost)), 0) as total_aum
       FROM portfolio_holdings`
    );
    const totalAUM = parseFloat(aumResult[0].total_aum);

    // Daily snapshots count (today)
    const [snapshotsResult] = await dbPool.query(
      "SELECT COUNT(*) as count FROM performance_snapshots WHERE snapshot_date = CURDATE()"
    );
    const dailySnapshots = snapshotsResult[0].count;

    // Average return across all users
    const [returnResult] = await dbPool.query(
      `SELECT AVG(pnl_pct) as avg_return FROM performance_snapshots WHERE snapshot_date = CURDATE()`
    );
    const avgReturn = returnResult[0].avg_return ? parseFloat(returnResult[0].avg_return).toFixed(4) : 0;

    res.json({
      totalUsers,
      totalAUM,
      avgReturn,
      activeToday,
      totalHoldings,
      dailySnapshots
    });
  } catch (err) {
    console.error('[Admin/Stats] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/performance-summary
app.get('/api/admin/performance-summary', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause = '';
    const queryParams = [];

    if (startDate && endDate) {
      whereClause = 'WHERE snapshot_date BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }

    const [rows] = await dbPool.query(
      `SELECT
        snapshot_date as date,
        AVG(pnl) as avgPnl,
        SUM(total_value) as totalValue,
        COUNT(DISTINCT user_id) as userCount
       FROM performance_snapshots
       ${whereClause}
       GROUP BY snapshot_date
       ORDER BY snapshot_date DESC`,
      queryParams
    );

    res.json({ daily: rows });
  } catch (err) {
    console.error('[Admin/Performance] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch performance summary' });
  }
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ===== CENTRAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.name}: ${err.message}`);

  // MySQL errors
  if (err.code && err.code.startsWith('ER_')) {
    return res.status(500).json({ success: false, message: 'Database error occurred' });
  }

  // JWT errors
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Default
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  if (dbPool) await dbPool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received, shutting down gracefully');
  if (dbPool) await dbPool.end();
  process.exit(0);
});

// ===== SERVER START =====
(async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`============================================`);
    console.log(`  Alpha Whisper v2.0 API`);
    console.log(`  Running on port ${PORT}`);
    console.log(`  Database: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`============================================`);
  });
})();
