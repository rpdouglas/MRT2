#!/bin/bash

echo "🚀 Starting Environment Setup..."

# A. Install Dependencies
echo "📦 Installing NPM Packages..."
npm install

# B. Install Firebase CLI globally
echo "🔥 Installing Firebase Tools..."
npm install -g firebase-tools

# C. Setup Environment Variables
if [ ! -f .env ]; then
    echo "📝 Creating local .env from .env.example..."
    cp .env.example .env
fi

# D. Install Playwright browser binaries and system dependencies
echo "🎭 Installing Playwright Browsers and Dependencies..."
npx playwright install --with-deps

echo "✅ Ready to Code! Run 'npm run dev' to start."
