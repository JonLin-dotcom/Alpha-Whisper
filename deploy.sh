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

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install from https://nodejs.org/"
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
EOF
    echo "✓ Created backend/.env"
else
    echo "ⓘ backend/.env already exists, skipping"
fi
echo ""

# ============================================
# Step 3: Install Dependencies
# ============================================

echo "[3/5] Installing dependencies..."

cd backend

if [ ! -d "node_modules" ]; then
    npm install
    echo "✓ Dependencies installed"
else
    echo "ⓘ node_modules already exists, skipping npm install"
fi

echo ""

# ============================================
# Step 4: Test Database Connection
# ============================================

echo "[4/5] Testing Alibaba Cloud MySQL connection..."

if command -v mysql &> /dev/null; then
    if mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 -e "SELECT 1;" 2>/dev/null; then
        echo "✓ MySQL connection successful"
        
        # Check if database exists
        if mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 -e "USE alpha_whisper;" 2>/dev/null; then
            echo "✓ Database 'alpha_whisper' already exists"
        else
            echo "⚠ Database 'alpha_whisper' not found"
            echo "  Run: mysql -h 47.119.141.23 -u root -pAa138088! -P 3306 -e \"CREATE DATABASE alpha_whisper CHARACTER SET utf8mb4;\""
        fi
    else
        echo "⚠ Could not connect to MySQL. Using fallback data mode."
        echo "  Make sure Alibaba Cloud instance is running and accessible."
    fi
else
    echo "ⓘ MySQL client not installed, skipping connection test"
    echo "  Install with: brew install mysql-client (macOS) or apt-get install mysql-client (Linux)"
fi

echo ""

# ============================================
# Step 5: Start Backend Server
# ============================================

echo "[5/5] Starting Alpha Whisper Backend..."
echo ""
echo "════════════════════════════════════════"
echo "  Backend Server Starting..."
echo "════════════════════════════════════════"
echo ""

npm start
