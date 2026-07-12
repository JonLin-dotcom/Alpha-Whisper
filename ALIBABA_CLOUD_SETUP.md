# Alibaba Cloud MySQL Database Setup Guide

## Your Alibaba Cloud Instance Information

```
Region: 华南1 (Shenzhen) | cn-shenzhen
Instance ID: i-wz9hx8d78xo1ytosmlrg
Hostname: iZwz9hx8d78xo1ytosmlrgZ
Public IP: 47.119.141.23
Private IP: 172.31.2.242
Login: root
Password: Aa138088!
```

---

## Step 1: Connect to Your Alibaba Cloud MySQL Instance

### Option A: From Local Computer

```bash
# Install MySQL Client (if not already installed)
# macOS:
brew install mysql-client

# Ubuntu/Debian:
sudo apt-get install mysql-client

# Connect to your instance
mysql -h 47.119.141.23 -u root -p -P 3306

# When prompted, enter password: Aa138088!
```

### Option B: Connect from EC2/ECS Instance in Same VPC

```bash
# If you're on an Alibaba Cloud ECS instance, use the private IP:
mysql -h 172.31.2.242 -u root -p -P 3306

# This will be faster (no internet gateway overhead)
```

---

## Step 2: Create Application Database

Once connected to MySQL, run these commands:

```sql
-- Create database with UTF8MB4 support for proper emoji/Chinese character support
CREATE DATABASE alpha_whisper 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Verify database was created
SHOW DATABASES;
```

Expected output:
```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| alpha_whisper      | ✓ (newly created)
| mysql              |
| performance_schema |
+--------------------+
```

---

## Step 3: Create Application User (Recommended)

Creating a dedicated user is better than using root for security:

```sql
-- Create application user
CREATE USER 'alpha_app'@'%' IDENTIFIED BY 'AlphaApp123!@Shenzhen';

-- Grant all privileges on alpha_whisper database
GRANT ALL PRIVILEGES ON alpha_whisper.* TO 'alpha_app'@'%';

-- Flush privileges to apply immediately
FLUSH PRIVILEGES;

-- Verify user was created
SELECT User, Host FROM mysql.user WHERE User = 'alpha_app';
```

Expected output:
```
+----------+------+
| User     | Host |
+----------+------+
| alpha_app| %    | ✓
+----------+------+
```

---

## Step 4: Verify Connection

Test the connection with your application credentials:

```bash
# Test with root (should work immediately)
mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 -e "SELECT 1;"

# Test with application user
mysql -h 47.119.141.23 -u alpha_app -pAlphaApp123!@Shenzhen -P 3306 -e "SELECT 1;"

# Both should return: 1
```

---

## Step 5: Configure Backend Application

### Option A: Using Root Account (Simpler for Development)

Create `backend/.env`:

```bash
cat > backend/.env << 'EOF'
PORT=3000
NODE_ENV=development
JWT_SECRET=your-strong-secret-key-here

DB_HOST=47.119.141.23
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Aa138088!
DB_NAME=alpha_whisper
EOF
```

### Option B: Using Application User (Recommended for Production)

Create `backend/.env`:

```bash
cat > backend/.env << 'EOF'
PORT=3000
NODE_ENV=production
JWT_SECRET=your-strong-secret-key-here

DB_HOST=47.119.141.23
DB_PORT=3306
DB_USER=alpha_app
DB_PASSWORD=AlphaApp123!@Shenzhen
DB_NAME=alpha_whisper
EOF
```

---

## Step 6: Initialize Database Schema

The backend will automatically create tables on first run, but you can manually initialize:

```sql
USE alpha_whisper;

-- Users Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Portfolio Holdings Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock List Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Stock Prices Cache Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Watchlist Table
CREATE TABLE IF NOT EXISTS watchlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_watch (user_id, symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_title VARCHAR(200) DEFAULT 'New Chat',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Performance Snapshots Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verify all tables
SHOW TABLES;
```

---

## Step 7: Test Connection from Backend

```bash
cd backend

# Make sure .env is configured correctly
cat .env

# Install dependencies
npm install

# Start the server
npm start
```

You should see:

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

---

## Step 8: Verify Data

```bash
# Connect to the database
mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 alpha_whisper

# Check tables were created
SHOW TABLES;

# Check users table
SELECT COUNT(*) as user_count FROM users;

# Check stocks were seeded
SELECT COUNT(*) as stock_count FROM stock_list;
SELECT * FROM stock_list LIMIT 5;

# Check prices cache
SELECT COUNT(*) as price_count FROM stock_prices;
```

Expected output:
```
Tables:
+-----------------------+
| Tables_in_alpha_whisper |
+-----------------------+
| chat_messages         |
| chat_sessions         |
| performance_snapshots |
| portfolio_holdings    |
| stock_list            |
| stock_prices          |
| users                 |
| watchlist             |
+-----------------------+

Stock count: 206
Price cache entries: [will grow as prices are fetched]
```

---

## Troubleshooting

### Connection Issues

**Error: "Connection refused"**
```
Problem: Cannot connect to 47.119.141.23:3306

Solutions:
1. Verify Alibaba Cloud instance is running
   - Go to ECS Console → Instances
   - Check if your instance is "Running"

2. Check security group rules
   - Instance → Security Groups
   - Add rule: Inbound → MySQL (3306) → 0.0.0.0/0

3. Test from command line:
   nc -zv 47.119.141.23 3306
```

**Error: "Access denied for user 'root'@'xxx.xxx.xxx.xxx'"**
```
Problem: Wrong password or host not allowed

Solutions:
1. Verify password: Aa138088!
2. Create user with % (all hosts):
   GRANT ALL PRIVILEGES ON alpha_whisper.* TO 'root'@'%';
3. Flush privileges:
   FLUSH PRIVILEGES;
```

### Database Issues

**Error: "Unknown database 'alpha_whisper'"**
```sql
-- Create it:
CREATE DATABASE alpha_whisper CHARACTER SET utf8mb4;

-- Or verify it exists:
SHOW DATABASES;
```

**Error: "Table doesn't exist"**
```
Problem: Tables weren't created

Solution:
The backend will auto-create tables on first run.
Or manually run the schema commands above.
```

---

## Security Best Practices

### For Production Deployment:

1. **Change Root Password**
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'NewStrongPassword123!@';
   FLUSH PRIVILEGES;
   ```

2. **Use Application User (Not Root)**
   ```sql
   CREATE USER 'alpha_app'@'%' IDENTIFIED BY 'SecureAppPassword123!';
   GRANT SELECT, INSERT, UPDATE, DELETE ON alpha_whisper.* TO 'alpha_app'@'%';
   FLUSH PRIVILEGES;
   ```

3. **Restrict Network Access**
   - In Alibaba Cloud ECS Security Group:
   - Only allow MySQL (3306) from your application server IP
   - Not 0.0.0.0/0 in production

4. **Enable SSL/TLS for Connections**
   ```bash
   # Update backend configuration
   DB_SSL=true
   DB_SSL_CA=/path/to/ca-cert.pem
   ```

5. **Enable Automated Backups**
   - Alibaba Cloud RDS Console
   - Backup Frequency: Daily
   - Retention Period: 30 days

---

## Monitoring & Maintenance

### Check Database Size

```sql
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'alpha_whisper'
ORDER BY (data_length + index_length) DESC;
```

### Monitor Active Connections

```sql
SHOW PROCESSLIST;
```

### Optimize Tables

```sql
USE alpha_whisper;

-- Optimize all tables
OPTIMIZE TABLE users;
OPTIMIZE TABLE portfolio_holdings;
OPTIMIZE TABLE stock_list;
OPTIMIZE TABLE stock_prices;
OPTIMIZE TABLE chat_sessions;
OPTIMIZE TABLE chat_messages;
OPTIMIZE TABLE performance_snapshots;
OPTIMIZE TABLE watchlist;
```

### Check Replication Status (if applicable)

```sql
SHOW MASTER STATUS;
SHOW SLAVE STATUS\G
```

---

## Next Steps

1. ✅ Connect to Alibaba Cloud MySQL
2. ✅ Create `alpha_whisper` database
3. ✅ Configure backend `.env` file
4. ✅ Start backend server
5. ✅ Deploy frontend
6. ✅ Register first user and test

You're all set! 🚀

Your app is now connected to Alibaba Cloud MySQL in the Shenzhen region!
