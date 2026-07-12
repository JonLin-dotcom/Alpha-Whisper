-- Alpha Whisper v2.0 Database Schema
-- Deploy on Alibaba Cloud MySQL (cn-shenzhen)

CREATE DATABASE IF NOT EXISTS alpha_whisper 
    DEFAULT CHARACTER SET utf8mb4 
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE alpha_whisper;

-- Users table with auth
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    risk_score INT DEFAULT 50 COMMENT '0-100 risk tolerance',
    investment_horizon VARCHAR(20) DEFAULT 'medium' COMMENT 'short/medium/long',
    behavioral_bias VARCHAR(50) DEFAULT 'loss_aversion',
    avatar_url VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB;

-- Portfolio holdings
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL COMMENT 'e.g. AAPL, TSLA',
    name VARCHAR(100) NOT NULL COMMENT 'Company name',
    shares DECIMAL(15,4) NOT NULL DEFAULT 0,
    avg_cost DECIMAL(15,4) NOT NULL DEFAULT 0,
    current_price DECIMAL(15,4) DEFAULT NULL,
    sector VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_symbol (user_id, symbol),
    INDEX idx_user (user_id),
    INDEX idx_symbol (symbol)
) ENGINE=InnoDB;

-- Performance snapshots (daily tracking)
CREATE TABLE IF NOT EXISTS performance_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    snapshot_date DATE NOT NULL,
    total_value DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Total market value',
    total_cost DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Total cost basis',
    realized_pnl DECIMAL(15,2) DEFAULT 0,
    unrealized_pnl DECIMAL(15,2) DEFAULT 0,
    pnl_pct DECIMAL(8,4) DEFAULT 0 COMMENT 'Percentage return',
    benchmark_spy_pct DECIMAL(8,4) DEFAULT NULL COMMENT 'SPY return for same period',
    max_drawdown DECIMAL(8,4) DEFAULT NULL,
    sharpe_ratio DECIMAL(8,4) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_date (user_id, snapshot_date),
    INDEX idx_date (snapshot_date)
) ENGINE=InnoDB;

-- AI chat history
CREATE TABLE IF NOT EXISTS chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_title VARCHAR(100) DEFAULT 'New Chat',
    risk_updates JSON DEFAULT NULL COMMENT 'JSON of risk profile changes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    INDEX idx_session (session_id)
) ENGINE=InnoDB;

-- Admin audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(50) NOT NULL COMMENT 'e.g. view_user, update_portfolio',
    target_type VARCHAR(30) NOT NULL COMMENT 'user/portfolio/system',
    target_id INT DEFAULT NULL,
    details JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id),
    INDEX idx_admin (admin_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Insert default admin user (password: Admin123!)
-- Hash generated with bcrypt
INSERT IGNORE INTO users (username, email, password_hash, is_admin, risk_score) 
VALUES ('admin', 'admin@alphawisper.ai', '$2b$10$YourHashHere', 1, 50);

-- Create read-only dashboard user
CREATE USER IF NOT EXISTS 'dashboard'@'%' IDENTIFIED BY 'Dash2024!';
GRANT SELECT ON alpha_whisper.* TO 'dashboard'@'%';
FLUSH PRIVILEGES;
