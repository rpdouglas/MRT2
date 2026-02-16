#!/bin/bash

echo "🚀 Starting Environment Setup..."

# A. Install Dependencies
echo "📦 Installing NPM Packages..."
npm install

# B. Install Firebase CLI globally
echo "🔥 Installing Firebase Tools..."
npm install -g firebase-tools

# C. Setup Environment Variables
# If secrets are passed to the container, we write them to .env
if [ ! -f .env ]; then
    echo "📝 Creating local .env from Example..."
    # We create a dummy file to prevent Vite crash on start
    echo "VITE_APP_VERSION=CODESPACE-DEV" > .env
    echo "VITE_GEMINI_API_KEY=placeholder_replace_me" >> .env
fi

echo "✅ Ready to Code! Run 'npm run dev' to start."
