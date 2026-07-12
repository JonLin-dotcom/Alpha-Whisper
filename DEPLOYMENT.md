# Alpha Whisper v2.1 - Deployment Guide

Complete step-by-step guide to deploy Alpha Whisper with a production MySQL database.

## Table of Contents
1. [Quick Start (Local)](#quick-start-local)
2. [Database Setup (Alibaba Cloud MySQL)](#database-setup-alibaba-cloud-mysql)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start (Local)

If you want to run this locally for development first:

### Prerequisites
- **Node.js** v14+ ([download](https://nodejs.org/))
- **npm** v6+ (comes with Node)
- **MySQL** v5.7+ (local or remote)

### 1. Install Dependencies

```bash
# Navigate to backend
cd backend

# Install packages
npm install

# Verify installation
npm list
```

You should see:
```
alpha-whisper@2.1.0
├── express@4.18.2
├── mysql2@3.6.5
├── bcryptjs@2.4.3
├── jsonwebtoken@9.0.2
├── cors@2.8.5
├── helmet@7.1.0
├── dotenv@16.3.1
└── yahoo-finance2@2.11.3
```

### 2. Create Local MySQL Database

```bash
# Start MySQL (macOS with Homebrew)
brew services start mysql

# Or start MySQL service manually on your OS

# Connect to MySQL
mysql -u root -p

# In MySQL shell:
CREATE DATABASE alpha_whisper CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'alpha_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON alpha_whisper.* TO 'alpha_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configure Environment

```bash
# In backend/ directory, create .env file
cat > .env << 'EOF'
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development

# Local MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=alpha_user
DB_PASSWORD=your_secure_password_here
DB_NAME=alpha_whisper
EOF
```

### 4. Start Backend Server

```bash
# Terminal 1: Backend
cd backend
npm start
# or for auto-reload:
npm run dev  # requires nodemon
```

Expected output:
```
============================================
  Alpha Whisper v2.1 API
  Full US Market Integration
  Running on port 3000
  Database: localhost:3306/alpha_whisper
  Yahoo Finance: ENABLED
  Price Cache TTL: 60s
  Rate Limit: 100 req/60s
  Environment: development
============================================
```

### 5. Open Frontend

```bash
# Terminal 2: Frontend (simple HTTP server)
cd frontend
python3 -m http.server 8000
# or use any HTTP server

# Then open in browser:
# http://localhost:8000
```

---

## Database Setup (Alibaba Cloud MySQL)

### Prerequisites
- Alibaba Cloud account ([sign up](https://www.alibabacloud.com/))
- Credit card for billing verification

### Step 1: Create Alibaba Cloud MySQL Instance

1. **Go to ApsaraDB for RDS (MySQL)**
   - Log in to Alibaba Cloud console
   - Search for "ApsaraDB for RDS"
   - Click "Create RDS Instance"

2. **Configure Instance**
   ```
   Region: Your nearest region (e.g., US East Virginia)
   Database Engine: MySQL 8.0 (or 5.7)
   Instance Class: db.t2.medium (entry level, ~$30-50/month)
   Storage: 20 GB (auto-scale enabled recommended)
   Network: VPC (Virtual Private Cloud)
   ```

3. **Set Master Account**
   ```
   Master Username: root
   Master Password: [Strong 8+ char password with uppercase, lowercase, numbers, symbols]
   Example: Aa138088!@ChangeMe
   ```

4. **Click "Create"** - Wait 5-10 minutes for instance to be ready

### Step 2: Configure Security & Access

1. **Get Connection Details**
   - Go to RDS Instances
   - Click your instance → "Basic Information"
   - Copy the **Endpoint** (e.g., `rm-abc123def456.mysql.rds.aliyuncs.com`)
   - Note the **Port** (default 3306)

2. **Create Database User** (Optional but recommended)
   ```sql
   CREATE USER 'alpha_admin'@'%' IDENTIFIED BY 'YourSecurePassword123!';
   GRANT ALL PRIVILEGES ON alpha_whisper.* TO 'alpha_admin'@'%';
   FLUSH PRIVILEGES;
   ```

3. **Configure Whitelist** (Allow your IP)
   - RDS Instance → Security → Whitelist
   - Add your public IP: Find it at https://whatismyipaddress.com/
   - Or allow `0.0.0.0/0` for development (not recommended for production)

### Step 3: Initialize Database

1. **Connect to Remote Database**

   ```bash
   # From your local machine
   mysql -h rm-abc123def456.mysql.rds.aliyuncs.com \
         -u root \
         -p \
         -P 3306
   
   # Enter your root password when prompted
   ```

2. **Create Database**

   ```sql
   CREATE DATABASE alpha_whisper 
   CHARACTER SET utf8mb4 
   COLLATE utf8mb4_unicode_ci;
   
   USE alpha_whisper;
   ```

3. **Create Application User**

   ```sql
   CREATE USER 'alpha_app'@'%' IDENTIFIED BY 'AppPassword123!Change';
   GRANT ALL PRIVILEGES ON alpha_whisper.* TO 'alpha_app'@'%';
   FLUSH PRIVILEGES;
   ```

4. **Verify Connection**

   ```bash
   mysql -h rm-abc123def456.mysql.rds.aliyuncs.com \
         -u alpha_app \
         -p \
         -P 3306 \
         alpha_whisper \
         -e "SELECT 1;"
   ```

---

## Backend Deployment

### Option A: Deploy to Heroku (Free/Paid)

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   cd backend
   heroku create alpha-whisper-api
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set PORT=3000
   heroku config:set JWT_SECRET=your-super-secret-jwt-key-change-this
   heroku config:set DB_HOST=rm-abc123def456.mysql.rds.aliyuncs.com
   heroku config:set DB_PORT=3306
   heroku config:set DB_USER=alpha_app
   heroku config:set DB_PASSWORD=AppPassword123!Change
   heroku config:set DB_NAME=alpha_whisper
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **View Logs**
   ```bash
   heroku logs --tail
   ```

### Option B: Deploy to AWS EC2

1. **Launch EC2 Instance**
   - AMI: Ubuntu 22.04 LTS
   - Instance type: t3.micro (free tier eligible)
   - Security group: Allow ports 22 (SSH), 3000 (HTTP)

2. **Connect via SSH**
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

3. **Install Node.js & PM2**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

4. **Clone Repository**
   ```bash
   git clone https://github.com/JonLin-dotcom/Alpha-Whisper.git
   cd Alpha-Whisper/backend
   npm install
   ```

5. **Create .env File**
   ```bash
   cat > .env << 'EOF'
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key-change-this
   NODE_ENV=production
   DB_HOST=rm-abc123def456.mysql.rds.aliyuncs.com
   DB_PORT=3306
   DB_USER=alpha_app
   DB_PASSWORD=AppPassword123!Change
   DB_NAME=alpha_whisper
   EOF
   ```

6. **Start with PM2**
   ```bash
   pm2 start server.js --name "alpha-whisper-api"
   pm2 save
   pm2 startup
   ```

7. **Setup Nginx Reverse Proxy** (Optional)
   ```bash
   sudo apt-get install -y nginx
   sudo systemctl start nginx
   ```

   Create `/etc/nginx/sites-available/alpha-whisper`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/alpha-whisper /etc/nginx/sites-enabled/
   sudo nginx -s reload
   ```

### Option C: Deploy to Railway / Render

**Railway.app** ([https://railway.app](https://railway.app))
1. Connect GitHub repo
2. Set environment variables in dashboard
3. Auto-deploy on push

---

## Frontend Deployment

### Option A: Deploy to Vercel/Netlify

1. **Create Static Build**
   ```bash
   # Ensure frontend/ is ready (it's already static HTML/JS)
   cd frontend
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Update API Endpoint** in `frontend/js/api.js`:
   ```javascript
   // Before:
   const API_BASE = 'http://47.119.141.23:3000/api';
   
   // After (your backend domain):
   const API_BASE = 'https://alpha-whisper-api.herokuapp.com/api';
   // or
   const API_BASE = 'https://your-ec2-instance.com/api';
   ```

### Option B: Deploy to AWS S3 + CloudFront

1. **Build Distribution**
   ```bash
   # Your frontend is already ready (it's static)
   cd frontend
   ```

2. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://alpha-whisper-frontend
   ```

3. **Upload Files**
   ```bash
   aws s3 sync . s3://alpha-whisper-frontend --delete
   ```

4. **Enable Static Website Hosting**
   - S3 Bucket → Properties → Static Website Hosting
   - Index: `index.html`
   - Error: `index.html`

### Option C: Host Locally on Same EC2 Instance

1. **Use Nginx to serve frontend**
   ```bash
   sudo mkdir -p /var/www/alpha-whisper
   sudo cp -r frontend/* /var/www/alpha-whisper/
   ```

2. **Update Nginx config**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Frontend
       location / {
           root /var/www/alpha-whisper;
           try_files $uri $uri/ /index.html;
       }

       # Backend API proxy
       location /api/ {
           proxy_pass http://localhost:3000/api/;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
       }
   }
   ```

---

## Environment Configuration

### Backend .env (Production)

```bash
# Server
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=generate-a-strong-32-char-random-string

# Database (Alibaba Cloud)
DB_HOST=rm-abc123def456.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=alpha_app
DB_PASSWORD=your_secure_password_123
DB_NAME=alpha_whisper

# Optional: Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

### Frontend Configuration (api.js)

Update `frontend/js/api.js` line 6:
```javascript
// Development
const API_BASE = 'http://localhost:3000/api';

// Production (Heroku)
const API_BASE = 'https://alpha-whisper-api.herokuapp.com/api';

// Production (AWS EC2)
const API_BASE = 'https://your-ec2-domain.com/api';

// Production (Railway)
const API_BASE = 'https://alpha-whisper-prod.up.railway.app/api';
```

---

## Troubleshooting

### Backend Issues

**Error: "ECONNREFUSED" when connecting to database**
```
✗ Database connection failed

Solution:
1. Check MySQL is running
2. Verify credentials in .env
3. Test connection: mysql -h host -u user -p
4. Check whitelist if using cloud MySQL
```

**Error: "PORT 3000 already in use"**
```bash
# Find process on port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

**Yahoo Finance not available**
```
[YF] yahoo-finance2 not installed. Stock data routes will use cached/fallback data.

Solution:
npm install yahoo-finance2

# Or use fallback cached data (app still works)
```

### Frontend Issues

**Error: "API calls fail with 404 or CORS error"**
```javascript
// Problem: API_BASE points to wrong URL
// Solution: Update api.js line 6

// ✓ Correct:
const API_BASE = 'https://your-actual-backend.com/api';

// ✗ Wrong:
const API_BASE = 'http://47.119.141.23:3000/api'; // IP changes!
```

**Port 8000 already in use**
```bash
python3 -m http.server 8001  # Use different port
```

### Database Issues

**Error: "Access denied for user 'alpha_app'@'xxx.xxx.xxx.xxx'"**
```sql
-- Check if user exists
SELECT User, Host FROM mysql.user;

-- Recreate user
DROP USER 'alpha_app'@'%';
CREATE USER 'alpha_app'@'%' IDENTIFIED BY 'NewPassword123!';
GRANT ALL PRIVILEGES ON alpha_whisper.* TO 'alpha_app'@'%';
FLUSH PRIVILEGES;
```

**Slow queries / High CPU usage**
```sql
-- Add indexes
CREATE INDEX idx_user_portfolio ON portfolio_holdings(user_id);
CREATE INDEX idx_user_watchlist ON watchlist(user_id);
CREATE INDEX idx_symbol_prices ON stock_prices(symbol);

-- Check slow query log
SHOW PROCESSLIST;
```

---

## Health Check

After deployment, verify everything works:

```bash
# Backend health
curl https://your-backend.com/health

# Expected response:
{
  "status": "ok",
  "version": "2.1",
  "db": "connected",
  "yahooFinance": "available",
  "stocksInUniverse": 206
}

# Frontend
Open https://your-domain.com in browser
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (32+ random chars)
- [ ] Enable HTTPS/SSL certificate (use Let's Encrypt)
- [ ] Restrict database whitelist to application servers only
- [ ] Enable database backups (Alibaba Cloud RDS)
- [ ] Set up monitoring/alerts (CloudWatch, New Relic, etc.)
- [ ] Review CORS settings in backend (currently allows all: `origin: '*'`)
- [ ] Store API keys in environment variables (never in code)
- [ ] Enable rate limiting (already built-in: 100 req/min)

---

## Performance Optimization

### Database Optimization
```sql
-- Monitor active queries
SHOW PROCESSLIST;

-- Check table sizes
SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'alpha_whisper';

-- Optimize tables
OPTIMIZE TABLE stock_list;
OPTIMIZE TABLE stock_prices;
```

### Caching Layer
Consider adding Redis for:
- Price cache (replace 60s MySQL TTL)
- Session storage
- Rate limit counters

```bash
# Add Redis
npm install redis
```

### CDN for Frontend
- Serve frontend from CloudFront/Cloudflare
- Cache static assets (CSS, JS, images)
- Enable compression

---

## Next Steps

1. **Monitor Performance**
   - Set up application monitoring (New Relic, DataDog)
   - Watch database performance metrics

2. **Backup Strategy**
   - Enable automated daily backups (Alibaba RDS)
   - Test restore process

3. **Scaling**
   - Load balancing for backend
   - Read replicas for database
   - CDN for frontend

---

## Support

For issues:
- Check logs: `heroku logs --tail` or `journalctl -u pm2-root -f`
- Review error messages in browser console (F12 → Console)
- Check MySQL error log: `SHOW ERRORS;`

Good luck with your deployment! 🚀
