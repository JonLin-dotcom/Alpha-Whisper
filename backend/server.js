/**
 * ============================================================
 * Alpha Whisper v2.1 - AI Robo-Advisory Backend
 * Full US Market Integration with Yahoo Finance
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

// Yahoo Finance v2 integration
let yahooFinance;
try {
  yahooFinance = require('yahoo-finance2').default;
  console.log('[YF] yahoo-finance2 loaded successfully');
} catch (e) {
  console.warn('[YF] yahoo-finance2 not installed. Stock data routes will use cached/fallback data.');
  yahooFinance = null;
}

// ===== CONFIG =====
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'alpha-whisper-secret-key-2024';
const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = '7d';
const PRICE_CACHE_TTL_SECONDS = 60;
const HISTORICAL_CACHE_TTL_SECONDS = 300;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

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

// ===== POPULAR US STOCKS SEED DATA =====
const POPULAR_STOCKS = [
  // Mega Cap Tech
  ['AAPL','Apple Inc.','NASDAQ','Technology','Consumer Electronics','mega'],
  ['MSFT','Microsoft Corporation','NASDAQ','Technology','Software','mega'],
  ['GOOGL','Alphabet Inc.','NASDAQ','Technology','Internet Services','mega'],
  ['GOOG','Alphabet Inc.','NASDAQ','Technology','Internet Services','mega'],
  ['AMZN','Amazon.com Inc.','NASDAQ','Consumer Cyclical','Internet Retail','mega'],
  ['NVDA','NVIDIA Corporation','NASDAQ','Technology','Semiconductors','mega'],
  ['META','Meta Platforms Inc.','NASDAQ','Technology','Internet Services','mega'],
  ['TSLA','Tesla Inc.','NASDAQ','Consumer Cyclical','Auto Manufacturers','mega'],
  ['BRK-B','Berkshire Hathaway','NYSE','Financials','Insurance','mega'],
  ['AVGO','Broadcom Inc.','NASDAQ','Technology','Semiconductors','mega'],
  ['JPM','JPMorgan Chase','NYSE','Financials','Banks','mega'],
  ['LLY','Eli Lilly and Company','NYSE','Healthcare','Pharma','mega'],
  ['V','Visa Inc.','NYSE','Financials','Financial Services','mega'],
  ['UNH','UnitedHealth Group','NYSE','Healthcare','Healthcare Plans','mega'],
  ['WMT','Walmart Inc.','NYSE','Consumer Defensive','Retail','mega'],
  ['MA','Mastercard Inc.','NYSE','Financials','Financial Services','mega'],
  ['XOM','Exxon Mobil Corporation','NYSE','Energy','Oil & Gas','mega'],
  ['JNJ','Johnson & Johnson','NYSE','Healthcare','Pharma','mega'],
  ['HD','Home Depot Inc.','NYSE','Consumer Cyclical','Retail','mega'],
  ['PG','Procter & Gamble','NYSE','Consumer Defensive','Household Products','mega'],
  ['ORCL','Oracle Corporation','NYSE','Technology','Software','large'],
  ['COST','Costco Wholesale','NASDAQ','Consumer Defensive','Retail','large'],
  ['ABBV','AbbVie Inc.','NYSE','Healthcare','Pharma','large'],
  ['BAC','Bank of America','NYSE','Financials','Banks','large'],
  ['KO','Coca-Cola Company','NYSE','Consumer Defensive','Beverages','large'],
  ['NFLX','Netflix Inc.','NASDAQ','Communication','Entertainment','large'],
  ['AMD','Advanced Micro Devices','NASDAQ','Technology','Semiconductors','large'],
  ['INTC','Intel Corporation','NASDAQ','Technology','Semiconductors','large'],
  ['CRM','Salesforce Inc.','NYSE','Technology','Software','large'],
  ['DIS','Walt Disney Company','NYSE','Communication','Entertainment','large'],
  ['ADBE','Adobe Inc.','NASDAQ','Technology','Software','large'],
  ['PEP','PepsiCo Inc.','NASDAQ','Consumer Defensive','Beverages','large'],
  ['TMO','Thermo Fisher Scientific','NYSE','Healthcare','Life Sciences','large'],
  ['CSCO','Cisco Systems','NASDAQ','Technology','Communication Equipment','large'],
  ['ABT','Abbott Laboratories','NYSE','Healthcare','Medical Devices','large'],
  ['WFC','Wells Fargo','NYSE','Financials','Banks','large'],
  ['MCD','McDonald\'s Corporation','NYSE','Consumer Cyclical','Restaurants','large'],
  ['ACN','Accenture plc','NYSE','Technology','IT Services','large'],
  ['VZ','Verizon Communications','NYSE','Communication','Telecom','large'],
  ['TXN','Texas Instruments','NASDAQ','Technology','Semiconductors','large'],
  ['NEE','NextEra Energy','NYSE','Utilities','Electric Utilities','large'],
  ['PM','Philip Morris International','NYSE','Consumer Defensive','Tobacco','large'],
  ['QCOM','Qualcomm Inc.','NASDAQ','Technology','Semiconductors','large'],
  ['MS','Morgan Stanley','NYSE','Financials','Investment Banking','large'],
  ['RTX','RTX Corporation','NYSE','Industrials','Aerospace & Defense','large'],
  ['PFE','Pfizer Inc.','NYSE','Healthcare','Pharma','large'],
  ['UPS','United Parcel Service','NYSE','Industrials','Logistics','large'],
  ['HON','Honeywell International','NASDAQ','Industrials','Conglomerates','large'],
  ['AMGN','Amgen Inc.','NASDAQ','Healthcare','Biotech','large'],
  ['CAT','Caterpillar Inc.','NYSE','Industrials','Construction Machinery','large'],
  ['UNP','Union Pacific','NYSE','Industrials','Railroads','large'],
  ['IBM','International Business Machines','NYSE','Technology','IT Services','large'],
  ['GE','GE Aerospace','NYSE','Industrials','Aerospace','large'],
  ['LOW','Lowe\'s Companies','NYSE','Consumer Cyclical','Retail','large'],
  ['SPGI','S&P Global Inc.','NYSE','Financials','Financial Services','large'],
  ['INTU','Intuit Inc.','NASDAQ','Technology','Software','large'],
  ['BKNG','Booking Holdings','NASDAQ','Consumer Cyclical','Travel Services','large'],
  ['LMT','Lockheed Martin','NYSE','Industrials','Aerospace & Defense','large'],
  ['NOW','ServiceNow Inc.','NYSE','Technology','Software','large'],
  ['SBUX','Starbucks Corporation','NASDAQ','Consumer Cyclical','Restaurants','large'],
  ['GS','Goldman Sachs','NYSE','Financials','Investment Banking','large'],
  ['BLK','BlackRock Inc.','NYSE','Financials','Asset Management','large'],
  ['PLTR','Palantir Technologies','NYSE','Technology','Software','large'],
  ['ISRG','Intuitive Surgical','NASDAQ','Healthcare','Medical Devices','large'],
  ['T','AT&T Inc.','NYSE','Communication','Telecom','large'],
  ['MDT','Medtronic plc','NYSE','Healthcare','Medical Devices','large'],
  ['CVS','CVS Health Corporation','NYSE','Healthcare','Healthcare Plans','large'],
  ['DE','Deere & Company','NYSE','Industrials','Farm Machinery','large'],
  ['BA','Boeing Company','NYSE','Industrials','Aerospace & Defense','large'],
  ['SYK','Stryker Corporation','NYSE','Healthcare','Medical Devices','large'],
  ['C','Citigroup Inc.','NYSE','Financials','Banks','large'],
  ['AMAT','Applied Materials','NASDAQ','Technology','Semiconductors','large'],
  ['ADP','Automatic Data Processing','NASDAQ','Technology','IT Services','large'],
  ['UBER','Uber Technologies Inc.','NYSE','Technology','Software','large'],
  ['PGR','Progressive Corporation','NYSE','Financials','Insurance','large'],
  ['ELV','Elevance Health','NYSE','Healthcare','Healthcare Plans','large'],
  ['TJX','TJX Companies','NYSE','Consumer Cyclical','Retail','large'],
  ['MU','Micron Technology','NASDAQ','Technology','Semiconductors','large'],
  ['FI','Fiserv Inc.','NYSE','Technology','IT Services','large'],
  ['VRTX','Vertex Pharmaceuticals','NASDAQ','Healthcare','Biotech','large'],
  ['COP','ConocoPhillips','NYSE','Energy','Oil & Gas','large'],
  ['SO','Southern Company','NYSE','Utilities','Electric Utilities','large'],
  ['NKE','Nike Inc.','NYSE','Consumer Cyclical','Footwear','large'],
  ['SCHW','Charles Schwab','NYSE','Financials','Brokerage','large'],
  ['LRCX','Lam Research','NASDAQ','Technology','Semiconductors','large'],
  ['PANW','Palo Alto Networks','NASDAQ','Technology','Software','large'],
  ['APO','Apollo Global Management','NYSE','Financials','Asset Management','large'],
  ['TMUS','T-Mobile US','NASDAQ','Communication','Telecom','large'],
  ['ADSK','Autodesk Inc.','NASDAQ','Technology','Software','large'],
  ['GILD','Gilead Sciences','NASDAQ','Healthcare','Biotech','large'],
  ['PYPL','PayPal Holdings','NASDAQ','Financials','Financial Services','large'],
  ['SNOW','Snowflake Inc.','NYSE','Technology','Software','large'],
  ['MRVL','Marvell Technology','NASDAQ','Technology','Semiconductors','large'],
  ['DUK','Duke Energy','NYSE','Utilities','Electric Utilities','large'],
  ['REGN','Regeneron Pharmaceuticals','NASDAQ','Healthcare','Biotech','large'],
  ['CEG','Constellation Energy','NASDAQ','Utilities','Electric Utilities','large'],
  ['APH','Amphenol Corporation','NYSE','Technology','Electronic Components','large'],
  ['CRWD','CrowdStrike Holdings','NASDAQ','Technology','Software','large'],
  ['SHOP','Shopify Inc.','NYSE','Technology','Software','large'],
  ['COIN','Coinbase Global','NASDAQ','Financials','Financial Services','large'],
  ['SMCI','Super Micro Computer','NASDAQ','Technology','Hardware','large'],
  ['RDDT','Reddit Inc.','NYSE','Technology','Software','large'],
  ['SOLV','Solventum Corporation','NYSE','Healthcare','Medical Devices','large'],
  ['ETN','Eaton Corporation','NYSE','Industrials','Electrical Equipment','large'],
  ['ITW','Illinois Tool Works','NYSE','Industrials','Conglomerates','large'],
  ['FDX','FedEx Corporation','NYSE','Industrials','Logistics','large'],
  ['MDLZ','Mondelez International','NASDAQ','Consumer Defensive','Food','large'],
  ['EOG','EOG Resources','NYSE','Energy','Oil & Gas','large'],
  ['SLB','Schlumberger','NYSE','Energy','Oilfield Services','large'],
  ['D','Dominion Energy','NYSE','Utilities','Electric Utilities','large'],
  ['CL','Colgate-Palmolive','NYSE','Consumer Defensive','Personal Products','large'],
  ['MMM','3M Company','NYSE','Industrials','Conglomerates','large'],
  ['CSX','CSX Corporation','NASDAQ','Industrials','Railroads','large'],
  ['GD','General Dynamics','NYSE','Industrials','Aerospace & Defense','large'],
  ['KMI','Kinder Morgan','NYSE','Energy','Oil & Gas Midstream','large'],
  ['WM','Waste Management','NYSE','Industrials','Waste Management','large'],
  ['KKR','KKR & Co. Inc.','NYSE','Financials','Asset Management','large'],
  ['NXPI','NXP Semiconductors','NASDAQ','Technology','Semiconductors','large'],
  ['CTAS','Cintas Corporation','NASDAQ','Industrials','Business Services','large'],
  ['EMR','Emerson Electric','NYSE','Industrials','Conglomerates','large'],
  ['HCA','HCA Healthcare','NYSE','Healthcare','Healthcare Facilities','large'],
  ['ECL','Ecolab Inc.','NYSE','Materials','Chemicals','large'],
  ['AON','Aon plc','NYSE','Financials','Insurance','large'],
  ['MAR','Marriott International','NASDAQ','Consumer Cyclical','Hotels','large'],
  ['FTNT','Fortinet Inc.','NASDAQ','Technology','Software','large'],
  ['OKE','ONEOK Inc.','NYSE','Energy','Oil & Gas Midstream','large'],
  ['TGT','Target Corporation','NYSE','Consumer Cyclical','Retail','large'],
  ['BK','Bank of New York Mellon','NYSE','Financials','Banks','large'],
  ['FANG','Diamondback Energy','NASDAQ','Energy','Oil & Gas','large'],
  ['NEM','Newmont Corporation','NYSE','Materials','Gold Mining','large'],
  ['USB','U.S. Bancorp','NYSE','Financials','Banks','large'],
  ['MET','MetLife Inc.','NYSE','Financials','Insurance','large'],
  ['CVX','Chevron Corporation','NYSE','Energy','Oil & Gas','mega'],
  ['AXP','American Express','NYSE','Financials','Financial Services','mega'],
  ['CME','CME Group Inc.','NASDAQ','Financials','Financial Services','large'],
  ['DHI','D.R. Horton','NYSE','Consumer Cyclical','Homebuilding','large'],
  ['DLR','Digital Realty Trust','NYSE','Real Estate','REITs','large'],
  ['SRE','Sempra Energy','NYSE','Utilities','Multi-Utilities','large'],
  ['AEP','American Electric Power','NYSE','Utilities','Electric Utilities','large'],
  ['OXY','Occidental Petroleum','NYSE','Energy','Oil & Gas','large'],
  ['PSX','Phillips 66','NYSE','Energy','Oil & Gas Refining','large'],
  ['AIG','American International Group','NYSE','Financials','Insurance','large'],
  ['GM','General Motors','NYSE','Consumer Cyclical','Auto Manufacturers','large'],
  ['F','Ford Motor Company','NYSE','Consumer Cyclical','Auto Manufacturers','large'],
  ['DAL','Delta Air Lines','NYSE','Industrials','Airlines','large'],
  ['UAL','United Airlines','NYSE','Industrials','Airlines','large'],
  ['ROKU','Roku Inc.','NASDAQ','Communication','Media','large'],
  ['SQ','Block Inc.','NYSE','Technology','Software','large'],
  ['ZM','Zoom Video Communications','NASDAQ','Technology','Software','large'],
  ['ROK','Rockwell Automation','NYSE','Industrials','Electrical Equipment','large'],
  ['TRV','Travelers Companies','NYSE','Financials','Insurance','large'],
  ['AFL','Aflac Inc.','NYSE','Financials','Insurance','large'],
  ['WMB','Williams Companies','NYSE','Energy','Oil & Gas Midstream','large'],
  ['CTSH','Cognizant Technology','NASDAQ','Technology','IT Services','large'],
  ['HPQ','HP Inc.','NYSE','Technology','Hardware','large'],
  ['WBD','Warner Bros Discovery','NASDAQ','Communication','Media','large'],
  ['MRK','Merck & Co.','NYSE','Healthcare','Pharma','mega'],
  // ETFs
  ['SPY','SPDR S&P 500 ETF','NYSE','ETF','Large Cap Blend','mega'],
  ['QQQ','Invesco QQQ Trust','NASDAQ','ETF','Large Cap Growth','mega'],
  ['DIA','SPDR Dow Jones ETF','NYSE','ETF','Large Cap Blend','mega'],
  ['IWM','iShares Russell 2000','NYSE','ETF','Small Cap Blend','large'],
  ['VTI','Vanguard Total Stock Market','NYSE','ETF','Total Market','mega'],
  ['VOO','Vanguard S&P 500 ETF','NYSE','ETF','Large Cap Blend','mega'],
  ['VEA','Vanguard Developed Markets','NYSE','ETF','International','large'],
  ['VWO','Vanguard Emerging Markets','NYSE','ETF','Emerging Markets','large'],
  ['BND','Vanguard Total Bond Market','NASDAQ','ETF','Bonds','large'],
  ['GLD','SPDR Gold Shares','NYSE','ETF','Precious Metals','large'],
  ['XLF','Financial Select Sector SPDR','NYSE','ETF','Financials','large'],
  ['XLK','Technology Select Sector SPDR','NYSE','ETF','Technology','large'],
  ['XLE','Energy Select Sector SPDR','NYSE','ETF','Energy','large'],
  ['XLV','Health Care Select Sector SPDR','NYSE','ETF','Healthcare','large'],
  ['XLI','Industrial Select Sector SPDR','NYSE','ETF','Industrials','large'],
  ['XLP','Consumer Staples Select SPDR','NYSE','ETF','Consumer Defensive','large'],
  ['XLU','Utilities Select Sector SPDR','NYSE','ETF','Utilities','large'],
  ['XRT','SPDR S&P Retail ETF','NYSE','ETF','Consumer Cyclical','small'],
  ['SOXX','iShares Semiconductor ETF','NASDAQ','ETF','Semiconductors','large'],
  ['ARKK','ARK Innovation ETF','NYSE','ETF','Innovation','large'],
  ['BOTZ','Global X Robotics & AI ETF','NASDAQ','ETF','Robotics','small'],
  ['SMH','VanEck Semiconductor ETF','NASDAQ','ETF','Semiconductors','large'],
  // Crypto
  ['MSTR','MicroStrategy Inc.','NASDAQ','Technology','Software','large'],
  ['HOOD','Robinhood Markets','NASDAQ','Financials','Brokerage','large'],
  ['BITO','ProShares Bitcoin Strategy ETF','NYSE','ETF','Crypto','large'],
  ['IBIT','iShares Bitcoin Trust','NASDAQ','ETF','Crypto','large'],
  // Meme / Popular
  ['GME','GameStop Corp.','NYSE','Consumer Cyclical','Retail','mid'],
  ['AMC','AMC Entertainment','NYSE','Communication','Entertainment','small'],
  ['BB','BlackBerry Limited','NYSE','Technology','Software','small'],
  ['NOK','Nokia Corporation','NYSE','Technology','Communication Equipment','mid'],
  ['TLRY','Tilray Brands','NASDAQ','Healthcare','Cannabis','small'],
  ['LCID','Lucid Group','NASDAQ','Consumer Cyclical','Auto Manufacturers','mid'],
  ['RIVN','Rivian Automotive','NASDAQ','Consumer Cyclical','Auto Manufacturers','mid'],
  ['NIO','NIO Inc.','NYSE','Consumer Cyclical','Auto Manufacturers','mid'],
  ['BABA','Alibaba Group','NYSE','Consumer Cyclical','Internet Retail','mega'],
  ['JD','JD.com Inc.','NASDAQ','Consumer Cyclical','Internet Retail','large'],
  ['PDD','PDD Holdings Inc.','NASDAQ','Consumer Cyclical','Internet Retail','large'],
  ['TSM','Taiwan Semiconductor','NYSE','Technology','Semiconductors','mega'],
  ['ASML','ASML Holding','NASDAQ','Technology','Semiconductors','mega'],
  ['SONY','Sony Group Corporation','NYSE','Technology','Consumer Electronics','mega'],
  ['TOYOF','Toyota Motor Corp','OTC','Consumer Cyclical','Auto Manufacturers','mega'],
  ['SAP','SAP SE','NYSE','Technology','Software','mega'],
  ['SAPGF','SAP SE','OTC','Technology','Software','mega']
];

// ===== IN-MEMORY RATE LIMIT STORE =====
const rateLimitStore = new Map();

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

// Rate limiting middleware
app.use((req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  if (!rateLimitStore.has(clientIp)) {
    rateLimitStore.set(clientIp, []);
  }

  const requests = rateLimitStore.get(clientIp);
  // Remove requests outside the window
  while (requests.length > 0 && requests[0] < windowStart) {
    requests.shift();
  }

  if (requests.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Maximum 100 requests per minute.',
      retryAfter: Math.ceil((requests[0] + RATE_LIMIT_WINDOW_MS - now) / 1000)
    });
  }

  requests.push(now);
  next();
});

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

    // ===== NEW v2.1 TABLES =====

    // Full US stock universe
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS stock_list (
        symbol VARCHAR(20) PRIMARY KEY,
        name VARCHAR(200),
        exchange VARCHAR(20),
        sector VARCHAR(100),
        industry VARCHAR(200),
        market_cap_category ENUM('mega','large','mid','small','micro') DEFAULT 'large',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sector (sector),
        INDEX idx_exchange (exchange),
        INDEX idx_active (is_active),
        FULLTEXT INDEX idx_search (symbol, name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Real-time price cache (TTL managed in code)
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS stock_prices (
        symbol VARCHAR(20) PRIMARY KEY,
        price DECIMAL(15,4),
        currency VARCHAR(10) DEFAULT 'USD',
        change DECIMAL(15,4),
        change_pct DECIMAL(8,4),
        volume BIGINT,
        avg_volume BIGINT,
        market_cap BIGINT,
        day_high DECIMAL(15,4),
        day_low DECIMAL(15,4),
        open DECIMAL(15,4),
        prev_close DECIMAL(15,4),
        fifty_two_week_high DECIMAL(15,4),
        fifty_two_week_low DECIMAL(15,4),
        pe_ratio DECIMAL(10,4),
        eps DECIMAL(10,4),
        dividend_yield DECIMAL(8,4),
        beta DECIMAL(8,4),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_change_pct (change_pct),
        INDEX idx_market_cap (market_cap)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // User watchlist
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS watchlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_watch (user_id, symbol)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ===== SEED POPULAR STOCKS =====
    await seedPopularStocks();

    console.log('[DB] All tables verified/created successfully');
  } catch (err) {
    console.error('[DB] Table creation error:', err.message);
    throw err;
  }
}

async function seedPopularStocks() {
  try {
    // Check if already seeded
    const [existing] = await dbPool.query('SELECT COUNT(*) as count FROM stock_list');
    if (existing[0].count >= POPULAR_STOCKS.length) {
      console.log(`[DB] Stock list already seeded with ${existing[0].count} stocks`);
      return;
    }

    console.log(`[DB] Seeding ${POPULAR_STOCKS.length} popular US stocks...`);

    const sql = `
      INSERT IGNORE INTO stock_list (symbol, name, exchange, sector, industry, market_cap_category)
      VALUES ?
    `;

    const values = POPULAR_STOCKS.map(s => [s[0], s[1], s[2], s[3], s[4], s[5]]);
    const [result] = await dbPool.query(sql, [values]);

    console.log(`[DB] Seeded ${result.affectedRows} new stocks into stock_list`);
  } catch (err) {
    console.error('[DB] Stock seeding error:', err.message);
    // Non-fatal: continue even if seeding fails
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

function sanitizeSymbol(symbol) {
  if (typeof symbol !== 'string') return '';
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9\.\-]/g, '').substring(0, 20);
}

// ===== YAHOO FINANCE HELPERS =====

/**
 * Check if cached price is fresh (< TTL seconds)
 */
async function getCachedPrice(symbol) {
  try {
    const [rows] = await dbPool.query(
      `SELECT * FROM stock_prices
       WHERE symbol = ? AND updated_at > DATE_SUB(NOW(), INTERVAL ${PRICE_CACHE_TTL_SECONDS} SECOND)`,
      [symbol]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error(`[YF] Cache read error for ${symbol}:`, err.message);
    return null;
  }
}

/**
 * Update price cache in MySQL
 */
async function updatePriceCache(symbol, quote) {
  try {
    const sql = [
      'INSERT INTO stock_prices (',
      'symbol, price, currency, `change`, change_pct, volume, avg_volume,',
      'market_cap, day_high, day_low, open, prev_close,',
      'fifty_two_week_high, fifty_two_week_low, pe_ratio, eps,',
      'dividend_yield, beta, updated_at',
      ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      'ON DUPLICATE KEY UPDATE',
      'price = VALUES(price),',
      'currency = VALUES(currency),',
      '`change` = VALUES(`change`),',
      'change_pct = VALUES(change_pct),',
      'volume = VALUES(volume),',
      'avg_volume = VALUES(avg_volume),',
      'market_cap = VALUES(market_cap),',
      'day_high = VALUES(day_high),',
      'day_low = VALUES(day_low),',
      'open = VALUES(open),',
      'prev_close = VALUES(prev_close),',
      'fifty_two_week_high = VALUES(fifty_two_week_high),',
      'fifty_two_week_low = VALUES(fifty_two_week_low),',
      'pe_ratio = VALUES(pe_ratio),',
      'eps = VALUES(eps),',
      'dividend_yield = VALUES(dividend_yield),',
      'beta = VALUES(beta),',
      'updated_at = NOW()'
    ].join(' ');
    await dbPool.query(sql, [
      symbol,
      quote.regularMarketPrice || null,
      quote.currency || 'USD',
      quote.regularMarketChange || null,
      quote.regularMarketChangePercent || null,
      quote.regularMarketVolume || null,
      quote.averageDailyVolume3Month || null,
      quote.marketCap || null,
      quote.regularMarketDayHigh || null,
      quote.regularMarketDayLow || null,
      quote.regularMarketOpen || null,
      quote.regularMarketPreviousClose || null,
      quote.fiftyTwoWeekHigh || null,
      quote.fiftyTwoWeekLow || null,
      quote.trailingPE || null,
      quote.epsTrailingTwelveMonths || null,
      quote.dividendYield || null,
      quote.beta || null
    ]);
  } catch (err) {
    console.error('[YF] Cache update error for ' + symbol + ': ' + err.message);
  }
}

/**
 * Get real-time quote with caching
 * Returns cached data if fresh, otherwise fetches from Yahoo Finance
 */
async function getQuote(symbol) {
  const cleanSymbol = sanitizeSymbol(symbol);
  if (!cleanSymbol) throw new Error('Invalid symbol');

  // Check cache first
  const cached = await getCachedPrice(cleanSymbol);
  if (cached) {
    return { ...cached, source: 'cache' };
  }

  // Fetch from Yahoo Finance
  if (!yahooFinance) {
    throw new Error('Yahoo Finance not available');
  }

  try {
    const quote = await yahooFinance.quote(cleanSymbol);
    if (!quote || !quote.regularMarketPrice) {
      throw new Error(`No data available for ${cleanSymbol}`);
    }

    // Update cache (fire and forget)
    await updatePriceCache(cleanSymbol, quote);

    return {
      symbol: cleanSymbol,
      price: quote.regularMarketPrice,
      currency: quote.currency || 'USD',
      change: quote.regularMarketChange,
      change_pct: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
      avg_volume: quote.averageDailyVolume3Month,
      market_cap: quote.marketCap,
      day_high: quote.regularMarketDayHigh,
      day_low: quote.regularMarketDayLow,
      open: quote.regularMarketOpen,
      prev_close: quote.regularMarketPreviousClose,
      fifty_two_week_high: quote.fiftyTwoWeekHigh,
      fifty_two_week_low: quote.fiftyTwoWeekLow,
      pe_ratio: quote.trailingPE,
      eps: quote.epsTrailingTwelveMonths,
      dividend_yield: quote.dividendYield,
      beta: quote.beta,
      updated_at: new Date(),
      source: 'yahoo'
    };
  } catch (err) {
    console.error(`[YF] Quote error for ${cleanSymbol}:`, err.message);

    // Try to return stale cached data as fallback
    try {
      const [staleRows] = await dbPool.query(
        'SELECT * FROM stock_prices WHERE symbol = ?',
        [cleanSymbol]
      );
      if (staleRows.length > 0) {
        return { ...staleRows[0], source: 'stale_cache' };
      }
    } catch (cacheErr) {
      // Ignore cache read errors
    }

    throw err;
  }
}

/**
 * Get historical prices with caching (5 min TTL)
 */
const historicalCache = new Map(); // In-memory cache for historical data

async function getHistorical(symbol, period = '1mo', interval = '1d') {
  const cleanSymbol = sanitizeSymbol(symbol);
  if (!cleanSymbol) throw new Error('Invalid symbol');

  const cacheKey = `${cleanSymbol}_${period}_${interval}`;
  const cached = historicalCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp) < HISTORICAL_CACHE_TTL_SECONDS * 1000) {
    return { symbol: cleanSymbol, data: cached.data, source: 'cache' };
  }

  if (!yahooFinance) {
    throw new Error('Yahoo Finance not available');
  }

  try {
    const result = await yahooFinance.historical(cleanSymbol, {
      period1: getPeriodStart(period),
      period2: new Date(),
      interval: interval
    });

    const data = (result || []).map(row => ({
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : null,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume
    })).filter(d => d.date);

    // Update cache
    historicalCache.set(cacheKey, { timestamp: Date.now(), data });

    // Prevent unbounded memory growth
    if (historicalCache.size > 1000) {
      const oldestKey = historicalCache.keys().next().value;
      historicalCache.delete(oldestKey);
    }

    return { symbol: cleanSymbol, data, source: 'yahoo' };
  } catch (err) {
    console.error(`[YF] Historical error for ${cleanSymbol}:`, err.message);
    // Return cached data even if stale
    if (cached) {
      return { symbol: cleanSymbol, data: cached.data, source: 'stale_cache' };
    }
    throw err;
  }
}

/**
 * Convert period string to start date
 */
function getPeriodStart(period) {
  const now = new Date();
  switch (period) {
    case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '5d': return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    case '1mo': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '3mo': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '6mo': return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case '5y': return new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Get batch quotes efficiently
 */
async function getBatchQuotes(symbols) {
  const results = {};
  const uncachedSymbols = [];

  // Check cache for each symbol
  for (const sym of symbols) {
    const cleanSym = sanitizeSymbol(sym);
    if (!cleanSym) continue;

    const cached = await getCachedPrice(cleanSym);
    if (cached) {
      results[cleanSym] = { ...cached, source: 'cache' };
    } else {
      uncachedSymbols.push(cleanSym);
    }
  }

  // Fetch uncached from Yahoo Finance
  if (uncachedSymbols.length > 0 && yahooFinance) {
    try {
      // yahoo-finance2 supports batch quotes natively
      const quotes = await yahooFinance.quote(uncachedSymbols);
      const quoteArray = Array.isArray(quotes) ? quotes : [quotes];

      for (const quote of quoteArray) {
        const sym = quote.symbol;
        if (!sym) continue;

        const mapped = {
          symbol: sym,
          price: quote.regularMarketPrice,
          currency: quote.currency || 'USD',
          change: quote.regularMarketChange,
          change_pct: quote.regularMarketChangePercent,
          volume: quote.regularMarketVolume,
          avg_volume: quote.averageDailyVolume3Month,
          market_cap: quote.marketCap,
          day_high: quote.regularMarketDayHigh,
          day_low: quote.regularMarketDayLow,
          open: quote.regularMarketOpen,
          prev_close: quote.regularMarketPreviousClose,
          fifty_two_week_high: quote.fiftyTwoWeekHigh,
          fifty_two_week_low: quote.fiftyTwoWeekLow,
          pe_ratio: quote.trailingPE,
          eps: quote.epsTrailingTwelveMonths,
          dividend_yield: quote.dividendYield,
          beta: quote.beta,
          updated_at: new Date(),
          source: 'yahoo'
        };

        results[sym] = mapped;

        // Update cache (fire and forget)
        updatePriceCache(sym, quote).catch(() => {});
      }
    } catch (err) {
      console.error('[YF] Batch quote error:', err.message);
      // Mark remaining as failed
      for (const sym of uncachedSymbols) {
        if (!results[sym]) {
          results[sym] = { symbol: sym, error: 'Fetch failed', source: 'error' };
        }
      }
    }
  }

  return results;
}

/**
 * Search stocks in local database
 */
async function searchStocks(query, limit = 20) {
  try {
    const cleanQuery = sanitizeString(query, 100);
    if (!cleanQuery) return [];

    const searchPattern = `%${cleanQuery}%`;

    // Use FULLTEXT if available, fallback to LIKE
    const [rows] = await dbPool.query(
      `SELECT symbol, name, exchange, sector, market_cap_category
       FROM stock_list
       WHERE symbol LIKE ? OR name LIKE ?
       ORDER BY
         CASE WHEN symbol = ? THEN 0
              WHEN symbol LIKE ? THEN 1
              ELSE 2
         END,
         market_cap_category = 'mega' DESC,
         market_cap_category = 'large' DESC,
         symbol
       LIMIT ?`,
      [searchPattern, searchPattern, cleanQuery, `${cleanQuery}%`, Math.min(limit, 100)]
    );

    return rows;
  } catch (err) {
    console.error('[DB] Stock search error:', err.message);
    return [];
  }
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
- S&P 500 (SPY): Hitting new highs with tech strength
- Nasdaq 100 (QQQ): AI-driven momentum continuing
- Dow Jones (DIA): Blue chips steady
- Russell 2000 (IWM): Small-cap lagging

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


// ============================================================
// ===== ROUTES =====
// ============================================================

// Health check
app.get('/health', async (req, res) => {
  try {
    const conn = await dbPool.getConnection();
    conn.release();

    // Count seeded stocks
    const [stockCount] = await dbPool.query('SELECT COUNT(*) as count FROM stock_list');

    res.json({
      status: 'ok',
      version: '2.1',
      timestamp: new Date().toISOString(),
      db: 'connected',
      yahooFinance: yahooFinance ? 'available' : 'unavailable',
      stocksInUniverse: stockCount[0].count
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      version: '2.1',
      timestamp: new Date().toISOString(),
      db: 'disconnected',
      message: 'Database connection failed'
    });
  }
});

// ============================================================
// ========== AUTH ROUTES ==========
// ============================================================

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

// ============================================================
// ========== STOCK DATA ROUTES (v2.1 - Yahoo Finance) ==========
// ============================================================

// Search stocks (fuzzy match on symbol + name)
// GET /api/stocks/search?q=APPLE&limit=20
app.get('/api/stocks/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    if (!query.trim()) {
      return res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
    }

    const stocks = await searchStocks(query, limit);

    // Also try Yahoo Finance search for broader results
    let yahooResults = [];
    if (yahooFinance && stocks.length < limit) {
      try {
        const yfSearch = await yahooFinance.search(query, { quotes: limit - stocks.length });
        if (yfSearch && yfSearch.quotes) {
          yahooResults = yfSearch.quotes
            .filter(q => q.symbol && q.quoteType === 'EQUITY')
            .map(q => ({
              symbol: q.symbol,
              name: q.shortname || q.longname || q.symbol,
              exchange: q.exchange || 'Unknown',
              sector: null,
              market_cap_category: null,
              source: 'yahoo_search'
            }));
        }
      } catch (yfErr) {
        // Yahoo search is supplementary, ignore errors
      }
    }

    // Merge results, prioritizing DB results
    const existingSymbols = new Set(stocks.map(s => s.symbol));
    const merged = [
      ...stocks,
      ...yahooResults.filter(y => !existingSymbols.has(y.symbol))
    ].slice(0, limit);

    res.json({ success: true, stocks: merged, count: merged.length });
  } catch (err) {
    console.error('[Stocks/Search] Error:', err.message);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

// Get real-time quote (with caching)
// GET /api/stocks/:symbol/quote
app.get('/api/stocks/:symbol/quote', async (req, res) => {
  try {
    const symbol = sanitizeSymbol(req.params.symbol);
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Invalid symbol' });
    }

    const quote = await getQuote(symbol);

    res.json({
      success: true,
      symbol: quote.symbol,
      price: quote.price,
      currency: quote.currency || 'USD',
      change: quote.change,
      changePct: quote.change_pct,
      volume: quote.volume,
      avgVolume: quote.avg_volume,
      marketCap: quote.market_cap,
      dayHigh: quote.day_high,
      dayLow: quote.day_low,
      open: quote.open,
      prevClose: quote.prev_close,
      pe: quote.pe_ratio,
      eps: quote.eps,
      fiftyTwoWeekHigh: quote.fifty_two_week_high,
      fiftyTwoWeekLow: quote.fifty_two_week_low,
      beta: quote.beta,
      dividendYield: quote.dividend_yield,
      updatedAt: quote.updated_at,
      source: quote.source || 'unknown'
    });
  } catch (err) {
    console.error(`[Stocks/Quote] Error for ${req.params.symbol}:`, err.message);
    res.status(500).json({ success: false, message: `Failed to fetch quote for ${req.params.symbol}`, error: err.message });
  }
});

// Get historical prices for chart
// GET /api/stocks/:symbol/historical?period=1mo&interval=1d
app.get('/api/stocks/:symbol/historical', async (req, res) => {
  try {
    const symbol = sanitizeSymbol(req.params.symbol);
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Invalid symbol' });
    }

    const period = sanitizeString(req.query.period || '1mo', 10);
    const interval = sanitizeString(req.query.interval || '1d', 10);

    const result = await getHistorical(symbol, period, interval);

    res.json({
      success: true,
      symbol: result.symbol,
      period,
      interval,
      data: result.data,
      count: result.data.length,
      source: result.source
    });
  } catch (err) {
    console.error(`[Stocks/Historical] Error for ${req.params.symbol}:`, err.message);
    res.status(500).json({ success: false, message: `Failed to fetch historical data for ${req.params.symbol}` });
  }
});

// Market indices
// GET /api/stocks/indices
app.get('/api/stocks/indices', async (req, res) => {
  try {
    const indices = ['SPY', 'QQQ', 'DIA', '^VIX', 'IWM'];

    if (yahooFinance) {
      try {
        const quotes = await yahooFinance.quote(indices);
        const quoteArray = Array.isArray(quotes) ? quotes : [quotes];

        const mapped = quoteArray.map(q => ({
          symbol: q.symbol,
          name: q.shortName || q.longName || q.symbol,
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          changePct: q.regularMarketChangePercent,
          source: 'yahoo'
        }));

        // Cache each index
        for (const q of quoteArray) {
          if (q.symbol && q.regularMarketPrice) {
            updatePriceCache(q.symbol, q).catch(() => {});
          }
        }

        return res.json({ success: true, indices: mapped });
      } catch (yfErr) {
        console.warn('[Stocks/Indices] Yahoo Finance error, falling back to cache:', yfErr.message);
      }
    }

    // Fallback: try cached data
    const [cached] = await dbPool.query(
      `SELECT symbol, price, \`change\` as change, change_pct as changePct
       FROM stock_prices WHERE symbol IN ('SPY','QQQ','DIA','^VIX','IWM')`
    );

    if (cached.length > 0) {
      return res.json({ success: true, indices: cached.map(c => ({ ...c, source: 'cache' })) });
    }

    // Ultimate fallback: static data
    res.json({
      success: true,
      indices: [
        { symbol: 'SPY', name: 'SPDR S&P 500', price: 754.95, change: 3.21, changePct: 0.43, source: 'static' },
        { symbol: 'QQQ', name: 'Invesco QQQ', price: 725.51, change: 2.24, changePct: 0.31, source: 'static' },
        { symbol: 'DIA', name: 'SPDR Dow Jones', price: 525.78, change: 1.58, changePct: 0.30, source: 'static' },
        { symbol: '^VIX', name: 'CBOE Volatility Index', price: 14.50, change: -0.30, changePct: -2.03, source: 'static' },
        { symbol: 'IWM', name: 'iShares Russell 2000', price: 295.99, change: -1.24, changePct: -0.42, source: 'static' }
      ],
      warning: 'Using static fallback data. Yahoo Finance unavailable.'
    });
  } catch (err) {
    console.error('[Stocks/Indices] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch indices' });
  }
});

// Trending stocks
// GET /api/stocks/trending
app.get('/api/stocks/trending', async (req, res) => {
  try {
    if (yahooFinance) {
      try {
        const trending = await yahooFinance.trendingSymbols('US');

        if (trending && trending.quotes) {
          // Fetch quotes for trending symbols
          const symbols = trending.quotes.map(q => q.symbol).filter(Boolean);
          const quotes = await getBatchQuotes(symbols);

          const enriched = symbols.map(sym => {
            const q = quotes[sym];
            return q ? {
              symbol: sym,
              price: q.price,
              change: q.change,
              changePct: q.change_pct,
              volume: q.volume,
              source: q.source
            } : { symbol: sym, source: 'unavailable' };
          }).filter(i => i.price || i.source === 'unavailable');

          return res.json({ success: true, trending: enriched });
        }
      } catch (yfErr) {
        console.warn('[Stocks/Trending] Yahoo Finance error, using cache:', yfErr.message);
      }
    }

    // Fallback: most active from cached prices
    const [rows] = await dbPool.query(
      'SELECT symbol, price, change as changeCol, change_pct as changePct, volume\n' +
      'FROM stock_prices WHERE volume > 0 ORDER BY volume DESC LIMIT 20'
    );
    // Map changeCol back to change
    rows.forEach(r => { r.change = r.changeCol; delete r.changeCol; });

    res.json({ success: true, trending: rows, source: rows.length > 0 ? 'cache' : 'empty' });
  } catch (err) {
    console.error('[Stocks/Trending] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch trending stocks' });
  }
});

// Top gainers
// GET /api/stocks/gainers
app.get('/api/stocks/gainers', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const [rows] = await dbPool.query(
      'SELECT sp.symbol, sp.price, sp.change as changeCol, sp.change_pct as changePct, ' +
      'sp.volume, sp.market_cap, sl.name, sl.sector ' +
      'FROM stock_prices sp ' +
      'LEFT JOIN stock_list sl ON sp.symbol = sl.symbol ' +
      'WHERE sp.change_pct IS NOT NULL AND sp.change_pct > 0 ' +
      'ORDER BY sp.change_pct DESC ' +
      'LIMIT ?',
      [limit]
    );
    rows.forEach(r => { r.change = r.changeCol; delete r.changeCol; });

    res.json({ success: true, gainers: rows, count: rows.length });
  } catch (err) {
    console.error('[Stocks/Gainers] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch gainers' });
  }
});

// Top losers
// GET /api/stocks/losers
app.get('/api/stocks/losers', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const [rows] = await dbPool.query(
      'SELECT sp.symbol, sp.price, sp.change as changeCol, sp.change_pct as changePct, ' +
      'sp.volume, sp.market_cap, sl.name, sl.sector ' +
      'FROM stock_prices sp ' +
      'LEFT JOIN stock_list sl ON sp.symbol = sl.symbol ' +
      'WHERE sp.change_pct IS NOT NULL ' +
      'ORDER BY sp.change_pct ASC ' +
      'LIMIT ?',
      [limit]
    );
    rows.forEach(r => { r.change = r.changeCol; delete r.changeCol; });

    res.json({ success: true, losers: rows, count: rows.length });
  } catch (err) {
    console.error('[Stocks/Losers] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch losers' });
  }
});

// Most active
// GET /api/stocks/most-active
app.get('/api/stocks/most-active', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const [rows] = await dbPool.query(
      'SELECT sp.symbol, sp.price, sp.change as changeCol, sp.change_pct as changePct, ' +
      'sp.volume, sp.avg_volume, sp.market_cap, sl.name, sl.sector ' +
      'FROM stock_prices sp ' +
      'LEFT JOIN stock_list sl ON sp.symbol = sl.symbol ' +
      'WHERE sp.volume IS NOT NULL ' +
      'ORDER BY sp.volume DESC ' +
      'LIMIT ?',
      [limit]
    );
    rows.forEach(r => { r.change = r.changeCol; delete r.changeCol; });

    res.json({ success: true, mostActive: rows, count: rows.length });
  } catch (err) {
    console.error('[Stocks/MostActive] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch most active stocks' });
  }
});

// Sector performance
// GET /api/stocks/sectors
app.get('/api/stocks/sectors', async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      `SELECT sl.sector,
              COUNT(*) as stockCount,
              AVG(sp.change_pct) as avgChangePct,
              SUM(sp.volume) as totalVolume,
              AVG(sp.pe_ratio) as avgPe
       FROM stock_prices sp
       INNER JOIN stock_list sl ON sp.symbol = sl.symbol
       WHERE sl.sector IS NOT NULL AND sl.sector != ''
       GROUP BY sl.sector
       ORDER BY avgChangePct DESC`
    );

    res.json({ success: true, sectors: rows, count: rows.length });
  } catch (err) {
    console.error('[Stocks/Sectors] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch sector performance' });
  }
});

// Batch quotes
// POST /api/stocks/batch-quotes { symbols: ['AAPL','MSFT','NVDA'] }
app.post('/api/stocks/batch-quotes', async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ success: false, message: 'symbols array is required' });
    }

    if (symbols.length > 100) {
      return res.status(400).json({ success: false, message: 'Maximum 100 symbols per batch' });
    }

    const cleanSymbols = symbols.map(s => sanitizeSymbol(s)).filter(Boolean);
    const quotes = await getBatchQuotes(cleanSymbols);

    res.json({
      success: true,
      quotes: Object.values(quotes),
      requested: symbols.length,
      returned: Object.keys(quotes).length
    });
  } catch (err) {
    console.error('[Stocks/BatchQuotes] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch batch quotes' });
  }
});

// ============================================================
// ========== WATCHLIST ROUTES (Auth Required) ==========
// ============================================================

// GET /api/watchlist
app.get('/api/watchlist', verifyToken, async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      `SELECT w.id, w.symbol, w.notes, w.created_at, sl.name, sl.sector
       FROM watchlist w
       LEFT JOIN stock_list sl ON w.symbol = sl.symbol
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [req.userId]
    );

    // Enrich with latest prices
    const enriched = [];
    for (const item of rows) {
      try {
        const cached = await getCachedPrice(item.symbol);
        enriched.push({
          ...item,
          price: cached ? cached.price : null,
          change: cached ? cached.change : null,
          changePct: cached ? cached.change_pct : null
        });
      } catch {
        enriched.push({ ...item, price: null, change: null, changePct: null });
      }
    }

    res.json({ success: true, watchlist: enriched, count: enriched.length });
  } catch (err) {
    console.error('[Watchlist/Get] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch watchlist' });
  }
});

// POST /api/watchlist { symbol, notes }
app.post('/api/watchlist', verifyToken, async (req, res) => {
  try {
    const { symbol, notes } = req.body;

    if (!symbol) {
      return res.status(400).json({ success: false, message: 'symbol is required' });
    }

    const cleanSymbol = sanitizeSymbol(symbol);
    const cleanNotes = notes ? sanitizeString(notes, 500) : null;

    if (!cleanSymbol) {
      return res.status(400).json({ success: false, message: 'Invalid symbol' });
    }

    // Verify symbol exists in stock_list (or add it)
    const [stockExists] = await dbPool.query(
      'SELECT symbol FROM stock_list WHERE symbol = ?',
      [cleanSymbol]
    );

    if (stockExists.length === 0) {
      // Try to fetch from Yahoo Finance to validate
      if (yahooFinance) {
        try {
          const quote = await yahooFinance.quote(cleanSymbol);
          if (quote && quote.symbol) {
            await dbPool.query(
              `INSERT INTO stock_list (symbol, name, exchange, sector, industry, market_cap_category)
               VALUES (?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE symbol = symbol`,
              [
                quote.symbol,
                quote.shortName || quote.longName || quote.symbol,
                quote.exchange || 'Unknown',
                quote.sector || 'Unknown',
                quote.industry || 'Unknown',
                categorizeMarketCap(quote.marketCap)
              ]
            );
          }
        } catch (yfErr) {
          // Symbol may not be valid, but we still allow watchlist addition
        }
      }
    }

    const [result] = await dbPool.query(
      'INSERT INTO watchlist (user_id, symbol, notes) VALUES (?, ?, ?)',
      [req.userId, cleanSymbol, cleanNotes]
    );

    const [item] = await dbPool.query(
      `SELECT w.id, w.symbol, w.notes, w.created_at, sl.name, sl.sector
       FROM watchlist w
       LEFT JOIN stock_list sl ON w.symbol = sl.symbol
       WHERE w.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, item: item[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Symbol already in watchlist' });
    }
    console.error('[Watchlist/Add] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to add to watchlist' });
  }
});

// DELETE /api/watchlist/:symbol
app.delete('/api/watchlist/:symbol', verifyToken, async (req, res) => {
  try {
    const symbol = sanitizeSymbol(req.params.symbol);

    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Invalid symbol' });
    }

    const [result] = await dbPool.query(
      'DELETE FROM watchlist WHERE user_id = ? AND symbol = ?',
      [req.userId, symbol]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Symbol not found in watchlist' });
    }

    res.json({ success: true, message: `${symbol} removed from watchlist` });
  } catch (err) {
    console.error('[Watchlist/Delete] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to remove from watchlist' });
  }
});

function categorizeMarketCap(marketCap) {
  if (!marketCap) return 'large';
  if (marketCap >= 200000000000) return 'mega';
  if (marketCap >= 10000000000) return 'large';
  if (marketCap >= 2000000000) return 'mid';
  if (marketCap >= 300000000) return 'small';
  return 'micro';
}


// ============================================================
// ========== LEGACY MARKET ROUTES (v2.0 preserved) ==========
// ============================================================

// GET /api/market/indices (static fallback preserved for backward compat)
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

// ============================================================
// ========== PORTFOLIO ROUTES (Auth Required) ==========
// ============================================================

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

// ============================================================
// ========== PERFORMANCE ROUTES (Auth Required) ==========
// ============================================================

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

    await dbPool.query(
      `INSERT INTO performance_snapshots
       (user_id, snapshot_date, total_value, total_cost, pnl, pnl_pct, realized_pnl, unrealized_pnl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       total_value = VALUES(total_value), total_cost = VALUES(total_cost),
       pnl = VALUES(pnl), pnl_pct = VALUES(pnl_pct),
       realized_pnl = VALUES(realized_pnl), unrealized_pnl = VALUES(unrealized_pnl)`,
      [req.userId, today, numTotalValue, numTotalCost, pnl, pnlPct, numRealizedPnl, numUnrealizedPnl]
    );

    // Fetch the updated snapshot
    const [snapshot] = await dbPool.query(
      'SELECT * FROM performance_snapshots WHERE user_id = ? AND snapshot_date = ?',
      [req.userId, today]
    );

    res.status(201).json({ success: true, snapshot: snapshot[0] });
  } catch (err) {
    console.error('[Performance/Snapshot] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save snapshot' });
  }
});

// ============================================================
// ========== WHISPER/CHAT ROUTES (Auth Required) ==========
// ============================================================

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

// ============================================================
// ========== ADMIN ROUTES (Admin Auth Required) ==========
// ============================================================

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

    // v2.1: Additional stats
    const [stockCountResult] = await dbPool.query('SELECT COUNT(*) as count FROM stock_list');
    const totalStocks = stockCountResult[0].count;

    const [watchlistCountResult] = await dbPool.query('SELECT COUNT(*) as count FROM watchlist');
    const totalWatchlistItems = watchlistCountResult[0].count;

    const [cachedPricesResult] = await dbPool.query('SELECT COUNT(*) as count FROM stock_prices');
    const cachedPricesCount = cachedPricesResult[0].count;

    res.json({
      totalUsers,
      totalAUM,
      avgReturn,
      activeToday,
      totalHoldings,
      dailySnapshots,
      totalStocks,
      totalWatchlistItems,
      cachedPricesCount,
      version: '2.1'
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

// ============================================================
// ===== 404 HANDLER =====
// ============================================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ============================================================
// ===== CENTRAL ERROR HANDLER =====
// ============================================================
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

// ============================================================
// ===== GRACEFUL SHUTDOWN =====
// ============================================================
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

// ============================================================
// ===== SERVER START =====
// ============================================================
(async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`============================================`);
    console.log(`  Alpha Whisper v2.1 API`);
    console.log(`  Full US Market Integration`);
    console.log(`  Running on port ${PORT}`);
    console.log(`  Database: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
    console.log(`  Yahoo Finance: ${yahooFinance ? 'ENABLED' : 'DISABLED'}`);
    console.log(`  Price Cache TTL: ${PRICE_CACHE_TTL_SECONDS}s`);
    console.log(`  Rate Limit: ${RATE_LIMIT_MAX} req/${RATE_LIMIT_WINDOW_MS/1000}s`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`============================================`);
  });
})();

