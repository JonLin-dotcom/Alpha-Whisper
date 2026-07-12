# Alpha Whisper v2.0

> Generative AI Robo-Advisory Framework - Fully redesigned with AInvest-style UI

[![Target SDK](https://img.shields.io/badge/Target%20SDK-34%20(Android%2014)-blue)](https://developer.android.com/about/versions/14)
[![Min SDK](https://img.shields.io/badge/Min%20SDK-28%20(Android%209)-green)](https://developer.android.com/about/versions/pie)
[![Architecture](https://img.shields.io/badge/Arch-arm64--v8a-orange)](https://developer.android.com/ndk/guides/abis)

## What's New in v2.0

### Major Redesign (AInvest-Style UI)
- **Light Theme** - Complete redesign from dark to professional light theme
- **Blue Gradient Primary** - Matches AInvest's professional financial aesthetic
- **4-Tab Navigation** - Markets, Whisper (AI Chat), Portfolio, Profile
- **Mobile-First** - Optimized for 375-430px mobile screens

### New Features
- **User Authentication** - Full registration/login system with JWT
- **Portfolio Tracking** - CRUD holdings, P&L calculation, performance charts
- **AI Chat (AIME-Style)** - Logo avatar in bot messages, quick insight pills
- **Admin Dashboard** - User stats, charts, CSV export
- **MySQL Backend** - Connected to Alibaba Cloud RDS

### App Logo
The green elf mascot logo appears in:
- App launcher icon and header
- AI bot avatar in Whisper chat dialog
- Auth modal branding

## Architecture

```
Alpha Whisper/
├── frontend/               # Pure HTML/CSS/JS SPA (no build tools)
│   ├── index.html          # Main app shell
│   ├── admin.html          # Admin dashboard
│   ├── css/
│   │   └── styles.css      # Complete design system (1,652 lines)
│   ├── js/
│   │   ├── app.js          # State management & router
│   │   ├── api.js          # HTTP client for backend
│   │   ├── auth.js         # Login/register/logout
│   │   ├── markets.js      # Market indices & momentum
│   │   ├── whisper.js      # AI chat with logo avatar
│   │   ├── portfolio.js    # Holdings CRUD + performance
│   │   └── profile.js      # User profile & risk assessment
│   └── logo.png            # Green elf mascot
├── backend/
│   ├── server.js           # Express API (1,053 lines)
│   └── schema.sql          # MySQL database schema
└── android/
    └── alpha-whisper-v2.aab  # Android App Bundle (831 KB)
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | - | User registration |
| `/api/auth/login` | POST | - | User login |
| `/api/auth/me` | GET | Token | Get current user |
| `/api/market/indices` | GET | - | Major indices (SPY, QQQ, DIA, IWM) |
| `/api/market/momentum` | GET | - | Market breadth data |
| `/api/portfolio` | GET/POST | Token | Portfolio holdings CRUD |
| `/api/performance` | GET | Token | Performance history |
| `/api/whisper/chat` | POST | Token | AI chat messages |
| `/api/admin/users` | GET | Admin | All users with summaries |
| `/api/admin/stats` | GET | Admin | Dashboard statistics |

## Database (Alibaba Cloud MySQL)

```
Host: 47.119.141.23:3306
Database: alpha_whisper
Tables:
  - users (auth + risk profile)
  - portfolio_holdings
  - performance_snapshots
  - chat_sessions / chat_messages
  - audit_log
```

## Quick Start

### Backend
```bash
cd backend
npm install express mysql2 bcryptjs jsonwebtoken cors helmet dotenv
node server.js
# Server runs on http://localhost:3000
```

### Frontend
Open `frontend/index.html` in a browser or WebView.

## Android AAB

The AAB file meets all Google Play Console requirements:
- **Target SDK**: 34 (Android 14) > required 33
- **64-bit**: arm64-v8a ABI filter
- **Size**: ~831 KB

## v1.0 Legacy

v1.0 was a web-based prototype. v2.0 is a complete rewrite with:
- New UI design (AInvest-style)
- Added user authentication
- Added portfolio tracking
- Added admin dashboard
- Added MySQL database backend
- Embedded frontend in Android AAB
