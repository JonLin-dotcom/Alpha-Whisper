# Alpha Whisper v2.1 - Full Deployment Guide

Comprehensive guide to deploy Alpha Whisper to production.

## Table of Contents
1. [Local Development](#local-development)
2. [Alibaba Cloud MySQL Setup](#alibaba-cloud-mysql-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Production Configuration](#production-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Node.js v14+
- npm v6+
- MySQL 5.7+ (local or remote)

### Setup

```bash
# 1. Clone repo
git clone https://github.com/JonLin-dotcom/Alpha-Whisper.git
cd Alpha-Whisper

# 2. Create .env
cp backend/.env.example backend/.env

# 3. Install dependencies
cd backend
npm install

# 4. Start server
npm start

# 5. Serve frontend (new terminal)
cd frontend
python3 -m http.server 8000
```

---

## Alibaba Cloud MySQL Setup

### Connect to Instance

```bash
# From your local machine
mysql -h 47.119.141.23 -u root -pAa138088! -P 3306

# Or from ECS in same VPC (faster)
mysql -h 172.31.2.242 -u root -pAa138088! -P 3306
```

### Create Database

```sql
CREATE DATABASE alpha_whisper 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

### Create Application User

```sql
CREATE USER 'alpha_app'@'%' IDENTIFIED BY 'SecurePassword123!@';
GRANT ALL PRIVILEGES ON alpha_whisper.* TO 'alpha_app'@'%';
FLUSH PRIVILEGES;
```

### Verify Connection

```bash
mysql -h 47.119.141.23 -u alpha_app -pSecurePassword123!@ alpha_whisper -e "SELECT 1;"
```

---

## Backend Deployment

### Option A: Heroku

```bash
# 1. Install Heroku CLI
npm install -g heroku
heroku login

# 2. Create app
cd backend
heroku create alpha-whisper-api

# 3. Set environment variables
heroku config:set \
  PORT=3000 \
  JWT_SECRET=your-secret-key \
  DB_HOST=47.119.141.23 \
  DB_USER=alpha_app \
  DB_PASSWORD=SecurePassword123!@ \
  DB_NAME=alpha_whisper \
  NODE_ENV=production

# 4. Deploy
git push heroku main

# 5. View logs
heroku logs --tail
```

### Option B: AWS EC2

```bash
# 1. Launch Ubuntu 22.04 t3.micro instance
# 2. Allow ports: 22 (SSH), 3000 (HTTP), 443 (HTTPS)

# 3. SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# 4. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 5. Install PM2 (process manager)
sudo npm install -g pm2

# 6. Clone repo
git clone https://github.com/JonLin-dotcom/Alpha-Whisper.git
cd Alpha-Whisper/backend
npm install

# 7. Create .env
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
JWT_SECRET=your-strong-secret
DB_HOST=47.119.141.23
DB_USER=alpha_app
DB_PASSWORD=SecurePassword123!@
DB_NAME=alpha_whisper
EOF

# 8. Start with PM2
pm2 start server.js --name "alpha-whisper"
pm2 save
pm2 startup

# 9. Setup Nginx reverse proxy
sudo apt-get install -y nginx

# 10. Configure Nginx
sudo tee /etc/nginx/sites-available/alpha-whisper > /dev/null << 'EOF'
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
EOF

# 11. Enable and restart
sudo ln -s /etc/nginx/sites-available/alpha-whisper /etc/nginx/sites-enabled/
sudo nginx -s reload
```

### Option C: Railway.app

```bash
# 1. Go to https://railway.app
# 2. Connect GitHub account
# 3. Create new project from repo
# 4. Set environment variables in dashboard
# 5. Auto-deploys on git push
```

---

## Frontend Deployment

### Option A: Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy frontend
cd frontend
vercel

# 3. Update API endpoint in api.js
# Change: const API_BASE = 'https://your-backend.com/api';
```

### Option B: AWS S3 + CloudFront

```bash
# 1. Create S3 bucket
aws s3 mb s3://alpha-whisper-frontend

# 2. Upload files
cd frontend
aws s3 sync . s3://alpha-whisper-frontend --delete

# 3. Enable static website hosting
# S3 → Bucket → Properties → Static Website Hosting
# Index: index.html, Error: index.html

# 4. Create CloudFront distribution
# CloudFront → Distributions → Create
# Origin: Your S3 bucket
# Caching: Enable compression
```

### Option C: Same EC2 Instance

```bash
# Deploy frontend on same server as backend

# 1. Copy frontend to web root
sudo mkdir -p /var/www/alpha-whisper
sudo cp -r frontend/* /var/www/alpha-whisper/

# 2. Update Nginx config
sudo tee /etc/nginx/sites-available/alpha-whisper > /dev/null << 'EOF'
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
EOF

# 3. Restart Nginx
sudo nginx -s reload
```

---

## Production Configuration

### Backend .env (Production)

```bash
# Server
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=generate-strong-32-char-random-string

# Database
DB_HOST=47.119.141.23
DB_PORT=3306
DB_USER=alpha_app
DB_PASSWORD=your_secure_password
DB_NAME=alpha_whisper

# Connection
DB_CONNECTION_LIMIT=20
DB_ENABLE_KEEP_ALIVE=true

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Cache
PRICE_CACHE_TTL_SECONDS=60
HISTORICAL_CACHE_TTL_SECONDS=300
```

### Frontend Configuration

Update `frontend/js/api.js` line 6:

```javascript
// Production
const API_BASE = 'https://your-domain.com/api';

// Or for Heroku
const API_BASE = 'https://alpha-whisper-api.herokuapp.com/api';

// Or for Railway
const API_BASE = 'https://alpha-whisper.up.railway.app/api';
```

### SSL/HTTPS Setup

```bash
# Using Let's Encrypt (EC2)
sudo apt-get install -y certbot python3-certbot-nginx

sudo certbot certonly --nginx -d your-domain.com

# Update Nginx config
sudo tee /etc/nginx/sites-available/alpha-whisper > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
    }
}
EOF

sudo nginx -s reload
```

---

## Monitoring & Maintenance

### Database Monitoring

```sql
-- Check active connections
SHOW PROCESSLIST;

-- Monitor table sizes
SELECT table_name, 
       ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'alpha_whisper'
ORDER BY (data_length + index_length) DESC;

-- Optimize tables
OPTIMIZE TABLE stock_prices;
OPTIMIZE TABLE stock_list;
```

### Application Monitoring

```bash
# Monitor logs (EC2/Railway)
tail -f /path/to/app.log

# or
heroku logs --tail  # Heroku

# Check uptime
uptime

# Monitor CPU/Memory
top
```

### Backup Strategy

```bash
# Alibaba Cloud RDS
# Enable automated daily backups
# Retention: 30 days
# Test restore process weekly
```

---

## Troubleshooting

### Backend Issues

**Database connection failed:**
```bash
# Test connection
mysql -h 47.119.141.23 -u alpha_app -p alpha_whisper

# Check whitelist
# Alibaba ECS → Security Groups → Add your IP to MySQL rule
```

**Port 3000 already in use:**
```bash
lsof -i :3000
kill -9 <PID>
```

**Yahoo Finance unavailable:**
```bash
npm install yahoo-finance2
```

### Frontend Issues

**API connection failed:**
```javascript
// Update api.js line 6 with correct backend URL
const API_BASE = 'https://your-correct-domain.com/api';
```

**CORS errors:**
```javascript
// Backend already has CORS enabled for all origins
// For production, restrict in server.js:
app.use(cors({
  origin: 'https://your-domain.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (32+ random chars)
- [ ] Enable HTTPS/SSL certificate
- [ ] Restrict database access by IP
- [ ] Enable automated backups
- [ ] Set up monitoring/alerts
- [ ] Review CORS settings
- [ ] Store secrets in environment variables
- [ ] Enable rate limiting
- [ ] Regular security updates

---

## Performance Optimization

### Enable Caching

```bash
# Add Redis for distributed caching
npm install redis

# Use CDN for static assets
# CloudFront for S3
# Cloudflare for domain
```

### Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_user_portfolio ON portfolio_holdings(user_id);
CREATE INDEX idx_user_watchlist ON watchlist(user_id);
CREATE INDEX idx_symbol_prices ON stock_prices(symbol);

-- Regular maintenance
ANALYZE TABLE stock_prices;
```

### Load Balancing

```bash
# Setup multiple backend instances
# Use AWS ELB or Nginx upstream

# Example Nginx upstream config
upstream backend {
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
    server 10.0.1.12:3000;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

---

## Support

For issues:
1. Check logs
2. Verify environment variables
3. Test database connection
4. Review error messages
5. Consult documentation

Good luck with your deployment! 🚀
