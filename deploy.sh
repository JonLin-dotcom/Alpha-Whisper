#!/bin/bash

# ============================================
# Alpha Whisper v2.1 - Quick Start Script
# Alibaba Cloud MySQL Setup & Backend Startup
# ============================================

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Alpha Whisper v2.1 - Quick Deploy    ║"
echo "║  Alibaba Cloud (Shenzhen Region)      ║"
echo "╚════════════════════════════════════════╝"
echo ""

# ============================================
# Step 1: Check Prerequisites
# ============================================

echo "[1/5] Checking prerequisites..."
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found."
    echo "   Install from: https://nodejs.org/"
    echo ""
    echo "   macOS:  brew install node"
    echo "   Ubuntu: sudo apt-get install nodejs npm"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js."
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)

echo "✓ Node.js version: $NODE_VERSION"
echo "✓ npm version: $NPM_VERSION"
echo ""

# ============================================
# Step 2: Create Environment File
# ============================================

echo "[2/5] Creating environment configuration..."
echo ""

if [ ! -f "backend/.env" ]; then
    cat > backend/.env << 'EOF'
# Server
PORT=3000
NODE_ENV=development

# JWT Secret (Change this in production!)
JWT_SECRET=alpha-whisper-dev-secret-key-change-this

# Alibaba Cloud MySQL - Shenzhen Region (华南1)
DB_HOST=47.119.141.23
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Aa138088!
DB_NAME=alpha_whisper

# Connection Pool
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0
DB_ENABLE_KEEP_ALIVE=true
DB_KEEP_ALIVE_INITIAL_DELAY=10000

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Cache Settings
PRICE_CACHE_TTL_SECONDS=60
HISTORICAL_CACHE_TTL_SECONDS=300

# Yahoo Finance
YAHOO_FINANCE_ENABLED=true
YAHOO_FINANCE_TIMEOUT=10000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
EOF
    echo "✓ Created backend/.env with Alibaba Cloud credentials"
else
    echo "ⓘ backend/.env already exists, skipping creation"
fi
echo ""

# ============================================
# Step 3: Install Dependencies
# ============================================

echo "[3/5] Installing dependencies..."
echo ""

cd backend

if [ ! -d "node_modules" ]; then
    echo "Running: npm install"
    npm install 2>&1 | grep -E "^(added|up to date)" || true
    echo ""
    echo "✓ Dependencies installed successfully"
else
    echo "ⓘ node_modules already exists, skipping npm install"
    echo "  To reinstall: rm -rf node_modules && npm install"
fi
echo ""

# ============================================
# Step 4: Test Database Connection
# ============================================

echo "[4/5] Testing Alibaba Cloud MySQL connection..."
echo ""

if command -v mysql &> /dev/null; then
    if mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 -e "SELECT 1;" 2>/dev/null > /dev/null; then
        echo "✓ MySQL connection successful (47.119.141.23:3306)"
        
        # Check if database exists
        if mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 -e "USE alpha_whisper;" 2>/dev/null > /dev/null; then
            echo "✓ Database 'alpha_whisper' already exists"
        else
            echo "⚠ Database 'alpha_whisper' not found"
            echo "  Creating database..."
            mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 << 'SQLEOF'
CREATE DATABASE IF NOT EXISTS alpha_whisper CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
SQLEOF
            echo "✓ Database 'alpha_whisper' created successfully"
        fi
    else
        echo "⚠ Could not connect to MySQL"
        echo "  Make sure:"
        echo "  1. Alibaba Cloud instance is running"
        echo "  2. Security group allows port 3306"
        echo "  3. Your IP is whitelisted"
        echo ""
        echo "  The backend will still start but may fail to initialize tables."
        echo "  You can manually create the database with:"
        echo "  mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 << 'EOF'"
        echo "  CREATE DATABASE alpha_whisper CHARACTER SET utf8mb4;"
        echo "  EOF"
    fi
else
    echo "ⓘ MySQL client not installed, skipping connection test"
    echo "  Install with:"
    echo "    macOS:  brew install mysql-client"
    echo "    Ubuntu: sudo apt-get install mysql-client"
    echo ""
    echo "  The backend will attempt to connect anyway."
fi
echo ""

# ============================================
# Step 5: Start Backend Server
# ============================================

echo "[5/5] Starting Alpha Whisper Backend Server..."
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Backend starting on http://localhost:3000"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "In a new terminal, run:"
echo "  cd Alpha-Whisper/frontend"
echo "  python3 -m http.server 8000"
echo ""
echo "Then open: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "════════════════════════════════════════════════════════════════"
echo ""

npm start
