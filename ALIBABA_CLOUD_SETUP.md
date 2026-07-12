# Alibaba Cloud MySQL Database Setup Guide

## Your Instance Information

```
Region: 华南1 (Shenzhen) | cn-shenzhen
Instance ID: i-wz9hx8d78xo1ytosmlrg
Public IP: 47.119.141.23
Private IP: 172.31.2.242
Login: root
Password: Aa138088!
Database: alpha_whisper
```

---

## Step 1: Connect to MySQL

### From Local Computer

```bash
# Install MySQL Client
# macOS:
brew install mysql-client

# Ubuntu:
sudo apt-get install mysql-client

# Connect
mysql -h 47.119.141.23 -u root -pAa138088! -P 3306
```

### From ECS in Same VPC (Faster)

```bash
mysql -h 172.31.2.242 -u root -pAa138088! -P 3306
```

---

## Step 2: Create Database

```sql
CREATE DATABASE alpha_whisper 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

SHOW DATABASES;  -- Verify
```

---

## Step 3: Create Application User

```sql
-- Create user
CREATE USER 'alpha_app'@'%' IDENTIFIED BY 'AlphaApp123!@Shenzhen';

-- Grant privileges
GRANT ALL PRIVILEGES ON alpha_whisper.* TO 'alpha_app'@'%';

FLUSH PRIVILEGES;

-- Verify
SELECT User, Host FROM mysql.user WHERE User = 'alpha_app';
```

---

## Step 4: Initialize Schema

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

-- Portfolio Holdings
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

-- Stock List
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
    FULLTEXT INDEX idx_search (symbol, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Stock Prices
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

-- Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_watch (user_id, symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_title VARCHAR(200) DEFAULT 'New Chat',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Performance Snapshots
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

SHOW TABLES;  -- Verify all tables created
```

---

## Step 5: Verify Connection

```bash
# Test with root
mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 -e "SELECT 1;"

# Test with app user
mysql -h 47.119.141.23 -u alpha_app -pAlphaApp123!@Shenzhen -P 3306 -e "SELECT 1;"

# Both should return: 1
```

---

## Step 6: Configure Backend

Create `backend/.env`:

```bash
cat > backend/.env << 'EOF'
PORT=3000
NODE_ENV=development
JWT_SECRET=your-strong-secret-key

DB_HOST=47.119.141.23
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Aa138088!
DB_NAME=alpha_whisper
EOF
```

---

## Step 7: Test Connection from Backend

```bash
cd backend
npm install
npm start
```

Expected output:
```
[DB] Connected to alpha_whisper database successfully
[DB] All tables verified/created successfully
[DB] Seeding 206 popular US stocks...
[DB] Seeded 206 new stocks into stock_list
```

---

## Troubleshooting

### Connection Refused

```bash
# Verify instance is running
# Alibaba ECS Console → Check instance status

# Check security group
# Add rule: MySQL (3306) → 0.0.0.0/0

# Test connectivity
nc -zv 47.119.141.23 3306
```

### Access Denied

```sql
-- Verify user exists
SELECT User, Host FROM mysql.user WHERE User = 'alpha_app';

-- Recreate user
DROP USER 'alpha_app'@'%';
CREATE USER 'alpha_app'@'%' IDENTIFIED BY 'NewPassword123!';
GRANT ALL PRIVILEGES ON alpha_whisper.* TO 'alpha_app'@'%';
FLUSH PRIVILEGES;
```

### Database Not Found

```sql
-- Create database
CREATE DATABASE alpha_whisper CHARACTER SET utf8mb4;

-- Verify
SHOW DATABASES;
```

---

## Security Best Practices

1. **Change root password**
   ```sql
   ALTER USER 'root'@'%' IDENTIFIED BY 'NewStrongPassword123!';
   FLUSH PRIVILEGES;
   ```

2. **Use application user (not root)**
   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE ON alpha_whisper.* TO 'alpha_app'@'%';
   ```

3. **Restrict network access**
   - Only allow MySQL from your app server IP
   - Not 0.0.0.0/0 in production

4. **Enable automated backups**
   - Alibaba RDS → Backups → Daily
   - Retention: 30 days

5. **Enable SSL/TLS**
   ```bash
   DB_SSL=true
   ```

---

## Monitoring

```sql
-- Active connections
SHOW PROCESSLIST;

-- Table sizes
SELECT table_name, 
       ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'alpha_whisper';

-- Optimize tables
OPTIMIZE TABLE stock_prices;
OPTIMIZE TABLE stock_list;
```

---

You're all set! Your database is ready for Alpha Whisper. 🚀
