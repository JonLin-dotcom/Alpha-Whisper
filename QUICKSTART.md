# 🚀 Alpha Whisper v2.1 - Deployment Quick Start

> Full-stack AI Robo-Advisory App with Alibaba Cloud MySQL Integration

## Prerequisites

- **Node.js** v14+ ([Download](https://nodejs.org/))
- **npm** v6+
- **MySQL Client** (optional, for database management)
  - macOS: `brew install mysql-client`
  - Ubuntu: `sudo apt-get install mysql-client`

## Your Alibaba Cloud Setup

```
🌍 Region: 华南1 (Shenzhen) | cn-shenzhen
🖥️  Host: 47.119.141.23
📊 Database: alpha_whisper
👤 User: root
🔑 Password: Aa138088!
```

---

## ⚡ Quick Deploy (One Command)

```bash
# Clone repository
git clone https://github.com/JonLin-dotcom/Alpha-Whisper.git
cd Alpha-Whisper

# Make script executable (macOS/Linux)
chmod +x deploy.sh

# Run deploy
./deploy.sh
```

This automatically:
- ✅ Checks Node.js/npm
- ✅ Creates `.env` configuration
- ✅ Installs dependencies
- ✅ Tests Alibaba Cloud connection
- ✅ Starts backend server

---

## Manual Setup (Step-by-Step)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/JonLin-dotcom/Alpha-Whisper.git
cd Alpha-Whisper
```

### 2️⃣ Create Environment File

```bash
cat > backend/.env << 'EOF'
PORT=3000
NODE_ENV=development
JWT_SECRET=alpha-whisper-dev-secret-key-change-this

# Alibaba Cloud MySQL (Shenzhen)
DB_HOST=47.119.141.23
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Aa138088!
DB_NAME=alpha_whisper

DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0
DB_ENABLE_KEEP_ALIVE=true
DB_KEEP_ALIVE_INITIAL_DELAY=10000

RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
PRICE_CACHE_TTL_SECONDS=60
HISTORICAL_CACHE_TTL_SECONDS=300

YAHOO_FINANCE_ENABLED=true
EOF
```

### 3️⃣ Install Dependencies

```bash
cd backend
npm install
```

### 4️⃣ Verify Database Connection

```bash
# Test connection
mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 -e "SELECT 1;"

# Should print: 1 ✓
```

If database doesn't exist, create it:

```bash
mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 << 'EOF'
CREATE DATABASE alpha_whisper CHARACTER SET utf8mb4;
FLUSH PRIVILEGES;
EOF
```

### 5️⃣ Start Backend Server

```bash
npm start
```

✅ Expected output:

```
============================================
  Alpha Whisper v2.1 API
  Full US Market Integration
  Running on port 3000
  Database: 47.119.141.23:3306/alpha_whisper
  Yahoo Finance: ENABLED
  Price Cache TTL: 60s
  Rate Limit: 100 req/60s
  Environment: development
============================================

[DB] Connected to alpha_whisper database successfully
[DB] All tables verified/created successfully
[DB] Seeding 206 popular US stocks...
[DB] Seeded 206 new stocks into stock_list
```

### 6️⃣ Serve Frontend (New Terminal)

```bash
cd frontend
python3 -m http.server 8000
```

### 7️⃣ Open in Browser

```
http://localhost:8000
```

🎉 **App is now running!**

---

## ✅ Verify Installation

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "version": "2.1",
  "db": "connected",
  "yahooFinance": "available",
  "stocksInUniverse": 206
}
```

### Test App

1. Open http://localhost:8000
2. Click "Login"
3. Register: `test@alpha.com` / `TestPass123`
4. Click "Markets" tab
5. Search "AAPL" → Should return results ✓

---

## What Gets Created

When backend starts, it automatically:

✅ **Creates 8 Database Tables:**
- `users` - Accounts & authentication
- `portfolio_holdings` - Stock positions
- `stock_list` - 206 US stocks
- `stock_prices` - Real-time cache
- `watchlist` - User watchlist
- `chat_sessions` - AI conversations
- `chat_messages` - Chat history
- `performance_snapshots` - P&L tracking

✅ **Seeds 206 Popular US Stocks:**
- Mega-cap: AAPL, MSFT, GOOGL, AMZN, NVDA
- Large-cap: ORCL, NFLX, AMD, DIS
- ETFs: SPY, QQQ, DIA, IWM
- International: BABA, TSM, SAP
- Crypto: MSTR, HOOD, BITO

---

## 🐛 Troubleshooting

### "Cannot connect to database"

```bash
# Test manually
mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 -e "SELECT 1;"

# If fails:
# 1. Check Alibaba instance is running
# 2. Verify IP whitelist
# 3. Check password is correct
```

### "Port 3000 already in use"

```bash
# Kill existing process
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### "Port 8000 already in use"

```bash
python3 -m http.server 8001
```

### "npm ERR! code ENOENT"

```bash
cd backend
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### "Frontend shows 'Cannot connect to API'"

Edit `frontend/js/api.js` line 6:

```javascript
// Update API endpoint:
const API_BASE = 'http://localhost:3000/api';
```

---

## 🔧 Configuration

### Environment Variables (backend/.env)

```bash
PORT=3000                           # Server port
NODE_ENV=development                # development or production
JWT_SECRET=change-this-in-prod      # JWT signing key

DB_HOST=47.119.141.23              # Alibaba Cloud IP
DB_PORT=3306                        # MySQL port
DB_USER=root                        # Database user
DB_PASSWORD=Aa138088!              # Database password
DB_NAME=alpha_whisper              # Database name

RATE_LIMIT_MAX=100                 # Requests per minute
PRICE_CACHE_TTL_SECONDS=60        # Cache duration
```

### Frontend Configuration (frontend/js/api.js)

```javascript
// Line 6 - Update based on deployment:

// Local:
const API_BASE = 'http://localhost:3000/api';

// Production:
const API_BASE = 'https://your-domain.com/api';
```

---

## 📚 Full Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Heroku, AWS, Railway
- **[ALIBABA_CLOUD_SETUP.md](./ALIBABA_CLOUD_SETUP.md)** - Database setup
- **[README.md](./README.md)** - Features & API endpoints

---

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/SSL certificate
- [ ] Restrict database access by IP
- [ ] Enable automated backups
- [ ] Review CORS settings
- [ ] Update rate limiting for production

---

## 📞 Support

For issues:
1. Check logs: `tail -f /path/to/backend.log`
2. Verify database: `mysql -h 47.119.141.23 -u root -pAa138088! alpha_whisper`
3. Test API: `curl http://localhost:3000/health`
4. Check browser console: Press F12 → Console tab

---

## 🚀 Next Steps

1. ✅ Deploy locally (done!)
2. 📊 Test with real data
3. 🌐 Deploy to production (see DEPLOYMENT.md)
4. 🔐 Set up SSL/HTTPS
5. 💾 Configure backups

---

**Happy investing! 🚀 Your Alpha Whisper app is live!**
