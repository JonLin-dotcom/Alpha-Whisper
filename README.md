# Alpha Whisper v2.1

> Generative AI Robo-Advisory Framework — Now with Full US Market Real-Time Data

[![Target SDK](https://img.shields.io/badge/Target%20SDK-34%20(Android%2014)-blue)](https://developer.android.com/about/versions/14)
[![Min SDK](https://img.shields.io/badge/Min%20SDK-28%20(Android%209)-green)](https://developer.android.com/about/versions/pie)
[![Architecture](https://img.shields.io/badge/Arch-arm64--v8a-orange)](https://developer.android.com/ndk/guides/abis)
[![Yahoo Finance](https://img.shields.io/badge/Data-Yahoo%20Finance-purple)](https://finance.yahoo.com)
[![Database](https://img.shields.io/badge/DB-Alibaba%20Cloud%20MySQL-cyan)](https://www.alibabacloud.com/product/apsaradb-for-rds)

## What's New in v2.1

### Full US Stock Market Integration
- **206 pre-seeded US stocks** — Mega-cap tech, large-caps, ETFs, crypto, international ADRs
- **Search ALL stocks** — Fuzzy search by symbol or company name
- **Real-time Yahoo Finance data** — Live prices, changes, volume, market cap
- **60-second price cache** in MySQL for lightning-fast responses
- **Trending lists** — Daily Gainers, Losers, Most Active, Sector Performance
- **Stock detail modal** — Price chart, key stats (P/E, EPS, Beta, 52W range), add to portfolio/watchlist

### Portfolio Upgrade
- **Any stock can be added** — Search and add any US stock, not limited to 5
- **Real-time P&L** — Auto-refresh prices every 30 seconds via batch quotes
- **Watchlist** — Track stocks without adding to portfolio
- **Sortable holdings table** — Sort by any column

### Markets Tab Overhaul
- **Global search bar** — Debounced typeahead with symbol + name matching
- **Market indices** — SPY, QQQ, DIA, VIX with sparkline charts
- **Trending stocks** — Horizontal scrollable cards
- **Top Gainers/Losers/Most Active** — 20-row tables with real-time data
- **Sector performance** — Visual grid of all 11 sectors

## Architecture

```
Alpha Whisper/
├── frontend/                 # Pure HTML/CSS/JS SPA
│   ├── index.html            # Main app shell (with stock-detail.js)
│   ├── admin.html            # Admin dashboard
│   ├── css/
│   │   └── styles.css        # AInvest-style design system
│   ├── js/
│   │   ├── api.js            # API client (stocks, watchlist, batch quotes)
│   │   ├── app.js            # SPA router & state management
│   │   ├── auth.js           # Login/register/logout
│   │   ├── markets.js        # Full market data + search + trending
│   │   ├── portfolio.js      # Any-stock portfolio + watchlist
│   │   ├── stock-detail.js   # Stock detail modal with chart & stats
│   │   ├── whisper.js        # AI chat with logo avatar
│   │   └── profile.js        # User profile & settings
│   └── logo.png              # Green elf mascot
├── backend/
│   ├── server.js             # Express API (2,281 lines)
│   │                         #   + yahoo-finance2 integration
│   │                         #   + 206 pre-seeded US stocks
│   │                         #   + 60s price cache
│   │                         #   + watchlist endpoints
│   │                         #   + batch quotes
│   │                         #   + rate limiting (100 req/min)
│   └── schema.sql            # MySQL schema (8 tables)
└── android/
    └── alpha-whisper-v2.1.aab  # Google Play AAB (832 KB)
```

## API Endpoints

### Authentication
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | - | User registration |
| `/api/auth/login` | POST | - | User login (JWT) |
| `/api/auth/me` | GET | Token | Current user profile |

### Stocks (Yahoo Finance Powered)
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/stocks/search?q=APPLE` | GET | - | Search all US stocks |
| `/api/stocks/:symbol/quote` | GET | - | Real-time quote (60s cache) |
| `/api/stocks/:symbol/historical` | GET | - | Price history for charts |
| `/api/stocks/indices` | GET | - | SPY, QQQ, DIA, VIX, IWM |
| `/api/stocks/trending` | GET | - | Yahoo Finance trending US |
| `/api/stocks/gainers` | GET | - | Top 20 gainers |
| `/api/stocks/losers` | GET | - | Top 20 losers |
| `/api/stocks/most-active` | GET | - | Top 20 by volume |
| `/api/stocks/sectors` | GET | - | Sector performance |
| `/api/stocks/batch-quotes` | POST | - | Multi-symbol quotes |

### Watchlist
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/watchlist` | POST | Token | Add to watchlist |
| `/api/watchlist` | GET | Token | Get watchlist |
| `/api/watchlist/:symbol` | DELETE | Token | Remove from watchlist |

### Portfolio & Performance
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/portfolio` | GET/POST | Token | Holdings CRUD |
| `/api/performance` | GET | Token | Performance history |

### AI Whisper
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/whisper/chat` | POST | Token | AI chat with contextual advice |

### Admin
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/stats` | GET | Admin | Dashboard statistics |
| `/api/admin/users` | GET | Admin | All users |

## Database (Alibaba Cloud MySQL)

```
Host: 47.119.141.23:3306
Database: alpha_whisper
Tables: 8
  - users              (auth + profile)
  - portfolio_holdings (user's stock positions)
  - performance_snapshots (daily P&L tracking)
  - chat_sessions      (AI chat history)
  - chat_messages
  - stock_list         (206 US stocks, FULLTEXT search)
  - stock_prices       (real-time cache, 60s TTL)
  - watchlist          (user's watchlist)
```

## Quick Start

### Backend
```bash
cd backend
npm install express mysql2 bcryptjs jsonwebtoken cors helmet dotenv yahoo-finance2
node server.js
# API runs on http://localhost:3000
# Auto-creates tables + seeds 206 US stocks on first run
```

### Frontend
Open `frontend/index.html` in browser or Android WebView.

### Deploy to Android
The AAB includes the full frontend embedded as assets, loads via `file:///android_asset/frontend/index.html`.

## Android AAB

| Spec | Value |
|------|-------|
| Target SDK | 34 (Android 14) |
| Min SDK | 28 (Android 9) |
| ABI | arm64-v8a |
| Size | ~832 KB |
| Backend | Node.js + Express + MySQL |
| Data Source | Yahoo Finance (real-time) |

## Changelog

### v2.1 (2026-07-12)
- Full US stock market search via Yahoo Finance
- Real-time price quotes with 60s MySQL cache
- Trending stocks, gainers, losers, most active
- Stock detail modal with chart and key stats
- Any-stock portfolio (was limited to 5)
- User watchlist
- Batch quotes for efficient portfolio refresh
- 206 pre-seeded popular US stocks
- Rate limiting (100 req/min)

### v2.0 (2026-07-11)
- AInvest-style light theme UI redesign
- 4-tab navigation (Markets/Whisper/Portfolio/Profile)
- User authentication (JWT)
- AI Chat with logo avatar
- Admin dashboard
- MySQL backend (Alibaba Cloud)

### v1.0 (Legacy)
- Dark theme web prototype
- Basic AI chatbot interface
- Static portfolio display
