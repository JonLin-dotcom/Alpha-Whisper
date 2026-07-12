# 🚀 Alpha Whisper Deployment - Step-by-Step Guide

> Your deployment is about to start! Here's everything you need to know.

---

## 📋 Pre-Deployment Checklist

Before running the deploy script, verify:

- [ ] **Node.js v14+** installed
  ```bash
  node --version  # Should show v14.0.0 or higher
  ```

- [ ] **npm v6+** installed
  ```bash
  npm --version   # Should show 6.0.0 or higher
  ```

- [ ] **Git** installed
  ```bash
  git --version
  ```

- [ ] **MySQL Client** (optional but recommended)
  ```bash
  # macOS
  brew install mysql-client
  
  # Ubuntu/Debian
  sudo apt-get install mysql-client
  
  # Windows: Download from mysql.com or use WSL
  ```

- [ ] **Alibaba Cloud instance is running**
  - IP: 47.119.141.23 should be reachable
  - Database: alpha_whisper should exist

---

## 🎯 Deployment Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/JonLin-dotcom/Alpha-Whisper.git
cd Alpha-Whisper
```

**Expected output:**
```
Cloning into 'Alpha-Whisper'...
remote: Enumerating objects: 150, done.
remote: Counting objects: 100% (150/150), done.
remote: Compressing objects: 100% (80/80), done.
Receiving objects: 100% (150/150), 2.5 MiB | 5.0 MiB/s
Unpacking objects: 100% (150/150), done.
```

### Step 2: Make Script Executable

```bash
chmod +x deploy.sh
```

### Step 3: Run Deployment Script

```bash
./deploy.sh
```

---

## 📊 What the Script Does

The `deploy.sh` script will:

### [1/5] Check Prerequisites ✓
```
Checking for:
- Node.js (v14+)
- npm (v6+)
- Database connectivity

Output:
✓ Node.js version: v18.12.0
✓ npm version: 8.19.2
```

### [2/5] Create Environment File ✓
```
Creates: backend/.env
Contains:
- PORT=3000
- JWT_SECRET=alpha-whisper-dev-secret-key-change-this
- DB_HOST=47.119.141.23
- DB_USER=root
- DB_PASSWORD=Aa138088!
- DB_NAME=alpha_whisper
```

### [3/5] Install Dependencies ✓
```
Running: npm install
Installing 7 packages:
✓ express@4.18.2
✓ mysql2@3.6.5
✓ bcryptjs@2.4.3
✓ jsonwebtoken@9.0.2
✓ cors@2.8.5
✓ helmet@7.1.0
✓ dotenv@16.3.1
✓ yahoo-finance2@2.11.3

Time: 2-3 minutes
```

### [4/5] Test Database Connection ✓
```
Testing MySQL connection to 47.119.141.23:3306...
✓ MySQL connection successful
✓ Database 'alpha_whisper' exists
✓ Tables verified
```

### [5/5] Start Backend Server ✓
```
Running: npm start

Server should start with:
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

---

## 🎮 Testing After Deployment

### In New Terminal Window 1: Verify Backend

```bash
# Test health check
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "ok",
#   "version": "2.1",
#   "db": "connected",
#   "yahooFinance": "available",
#   "stocksInUniverse": 206
# }
```

### In New Terminal Window 2: Serve Frontend

```bash
cd Alpha-Whisper/frontend
python3 -m http.server 8000

# Expected output:
# Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

### Open in Browser

```
http://localhost:8000
```

**You should see:**
1. Alpha Whisper logo with green elf
2. "Login" and "Register" buttons
3. Markets/Whisper/Portfolio/Profile navigation

---

## ✅ First-Time User Setup

1. **Register Account**
   - Email: `test@example.com`
   - Password: `TestPass123`
   - Click "Register"

2. **Test Markets Tab**
   - Click "Markets"
   - Search: "AAPL"
   - Should see Apple Inc. with current price

3. **Test AI Chat**
   - Click "Whisper" tab
   - Type: "What stocks should I buy?"
   - Should get AI recommendations

4. **Add to Portfolio**
   - Click "Portfolio" tab
   - Click "Add Holding"
   - Symbol: AAPL
   - Shares: 10
   - Avg Cost: 180
   - Click "Save"

---

## 🔧 Troubleshooting During Deployment

### Script Says: "Node.js not found"

```bash
# Install Node.js
# macOS
brew install node

# Ubuntu
sudo apt-get install nodejs npm

# Windows
# Download from https://nodejs.org/

# Verify
node --version
npm --version
```

### Script Says: "Cannot connect to database"

```bash
# Option 1: Verify MySQL is accessible
mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 -e "SELECT 1;"

# Option 2: Check Alibaba Cloud security group
# ECS Console → Security Groups → Add MySQL rule (port 3306)

# Option 3: Create database manually
mysql -h 47.119.141.23 -u root -pAa138088! << 'EOF'
CREATE DATABASE alpha_whisper CHARACTER SET utf8mb4;
SHOW DATABASES;
EXIT;
EOF
```

### Script Says: "Port 3000 already in use"

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### npm install takes forever

```bash
# Clear npm cache
npm cache clean --force

# Use faster registry
npm config set registry https://registry.npmmirror.com/

# Try again
npm install
```

### "Yahoo Finance not available"

```bash
# The app still works! This just means stock data will use cached fallback.
# To fix:
npm install yahoo-finance2

# Restart backend
npm start
```

---

## 📁 File Structure After Deployment

```
Alpha-Whisper/
├── backend/
│   ├── .env                 ← Created by deploy script
│   ├── server.js            ← Main Express server (2,281 lines)
│   ├── package.json
│   ├── package-lock.json    ← Created after npm install
│   └── node_modules/        ← Created after npm install
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── markets.js
│   │   ├── whisper.js
│   │   ├── portfolio.js
│   │   ├── stock-detail.js
│   │   └── profile.js
│   └── logo.png
│
├── QUICKSTART.md            ← This file
├── DEPLOYMENT.md
├── ALIBABA_CLOUD_SETUP.md
└── deploy.sh
```

---

## 🗄️ Database Structure Created

After first run, your Alibaba Cloud database will contain:

```sql
alpha_whisper/
├── users                    (User accounts)
├── portfolio_holdings       (Stock positions)
├── stock_list              (206 US stocks pre-seeded)
├── stock_prices            (Real-time cache)
├── watchlist               (User watchlist)
├── chat_sessions           (AI conversations)
├── chat_messages           (Chat history)
└── performance_snapshots   (Performance tracking)
```

---

## 🔌 API Endpoints Available

After deployment, these endpoints are live:

### Authentication
```
POST   /api/auth/register      - Create account
POST   /api/auth/login         - Login
GET    /api/auth/me            - Get user profile
```

### Stock Data
```
GET    /api/stocks/search?q=AAPL              - Search stocks
GET    /api/stocks/AAPL/quote                 - Real-time quote
GET    /api/stocks/AAPL/historical            - Price history
GET    /api/stocks/indices                    - Market indices
GET    /api/stocks/trending                   - Trending stocks
GET    /api/stocks/gainers                    - Top gainers
GET    /api/stocks/losers                     - Top losers
GET    /api/stocks/most-active                - Most active
POST   /api/stocks/batch-quotes               - Multiple quotes
```

### Portfolio
```
GET    /api/portfolio                         - Get holdings
POST   /api/portfolio                         - Add holding
PUT    /api/portfolio/:id                     - Update holding
DELETE /api/portfolio/:id                     - Delete holding
```

### More
```
GET    /api/watchlist                         - Get watchlist
POST   /api/watchlist                         - Add to watchlist
POST   /api/whisper/chat                      - AI chat
GET    /health                                - Health check
```

---

## 🔐 Security Notes

⚠️ **Development Only:**
The credentials shown here are for **development/demo only**.

✅ **Before Production:**
- [ ] Change `JWT_SECRET` to random 32-character string
- [ ] Change database password
- [ ] Use environment variables (never hardcode credentials)
- [ ] Enable HTTPS/SSL
- [ ] Restrict database IP access

Generate strong secret:
```bash
openssl rand -base64 32
```

---

## 📊 Performance Expectations

| Component | Time | Details |
|-----------|------|---------|
| Clone repo | 30s | Depends on internet speed |
| npm install | 2-3 min | Installs 7 packages |
| DB connection test | 5s | Connects to Alibaba Cloud |
| Backend startup | 10s | Creates tables, seeds stocks |
| **Total** | **~5 min** | First time only |

---

## ✨ What's Next?

After successful deployment:

1. **✅ Test Locally**
   - Register account
   - Search stocks
   - Add portfolio
   - Chat with AI

2. **📝 Read Documentation**
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
   - [ALIBABA_CLOUD_SETUP.md](./ALIBABA_CLOUD_SETUP.md) - Database details
   - [README.md](./README.md) - Feature overview

3. **🌐 Deploy to Production**
   - Heroku (10 minutes)
   - AWS EC2 (30 minutes)
   - Railway.app (15 minutes)

4. **🔐 Security**
   - Set up SSL/HTTPS
   - Configure backups
   - Monitor performance

---

## 🆘 Getting Help

If something goes wrong:

1. **Check logs**
   ```bash
   # Backend logs
   tail -f nohup.out
   
   # Database connection
   mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 -e "SELECT 1;"
   ```

2. **Test connectivity**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Check browser console**
   - Press F12 in browser
   - Click "Console" tab
   - Look for error messages

4. **Review documentation**
   - See [QUICKSTART.md](./QUICKSTART.md)
   - See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🎉 Success Checklist

After deployment is complete:

- [ ] Script completed without errors
- [ ] Backend running on port 3000
- [ ] Frontend accessible at http://localhost:8000
- [ ] Can register new account
- [ ] Can search for stocks (AAPL, MSFT, etc.)
- [ ] Can see real-time prices
- [ ] Can add to portfolio
- [ ] Can chat with AI bot
- [ ] Health check returns "ok"

---

**Congratulations! Your Alpha Whisper app is live! 🚀**

### Quick Links
- 🌐 Frontend: http://localhost:8000
- 🔌 Backend API: http://localhost:3000/api
- 📊 Health Check: http://localhost:3000/health
- 💾 Database: 47.119.141.23:3306/alpha_whisper

---

**Happy investing! 📈**
