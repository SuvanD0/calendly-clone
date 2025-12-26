#!/bin/bash

# Setup script for Calendly Clone
# This script helps set up the development environment

set -e

echo "🚀 Setting up Calendly Clone..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate JWT secret if not set
if ! grep -q "JWT_SECRET=.*[a-zA-Z0-9]" .dev.vars 2>/dev/null; then
    echo "🔑 Generating JWT secret..."
    JWT_SECRET=$(openssl rand -hex 32)
    if [ -f .dev.vars ]; then
        sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .dev.vars
        rm .dev.vars.bak 2>/dev/null || true
    else
        echo "JWT_SECRET=$JWT_SECRET" >> .dev.vars
    fi
    echo "✅ JWT secret generated"
fi

# Check if D1 database needs to be created
echo ""
echo "📊 Database Setup:"
echo "To create a D1 database, run:"
echo "  npx wrangler d1 create calendly-db"
echo ""
echo "Then update wrangler.toml with the database_id"
echo ""

# Check if schema needs to be initialized
if [ -f "schema.sql" ]; then
    echo "📋 Database schema file found: schema.sql"
    echo "To initialize the database, run:"
    echo "  npm run db:init"
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create D1 database: npx wrangler d1 create calendly-db"
echo "2. Update wrangler.toml with database_id"
echo "3. Initialize schema: npm run db:init"
echo "4. Add Google OAuth credentials to .dev.vars"
echo "5. Start dev server: npm run dev"
echo ""

