#!/bin/bash

# ==========================================
# 🛡️ MRT SECURITY RULE SYNCHRONIZER
# ==========================================
# promotes local firestore.rules to all environments.

# PROJECT IDs (Hardcoded from your architecture docs)
DEV_PROJECT="mrt2-app-dev"
UAT_PROJECT="mrt2-app-uat"
PROD_PROJECT="mrt2-app-prod"

echo "🔒 Starting Security Rule Synchronization..."
echo "📄 Local Source: firestore.rules"
echo "-----------------------------------------"

# Function to deploy to a specific environment
deploy_to_env() {
    local env_name=$1
    local project_id=$2

    echo "👉 Targeting: $env_name ($project_id)"
    
    # 1. Switch context
    firebase use "$project_id" --add "$env_name" 2>/dev/null || firebase use "$project_id"
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to switch to $env_name. Do you have permissions?"
        return 1
    fi

    # 2. Deploy only rules
    echo "🚀 Deploying rules..."
    firebase deploy --only firestore:rules
    
    if [ $? -eq 0 ]; then
        echo "✅ $env_name Synced Successfully."
    else
        echo "❌ Deployment to $env_name FAILED."
        return 1
    fi
    echo "-----------------------------------------"
}

# --- EXECUTION FLOW ---

# 1. DEV (Always Safe)
deploy_to_env "DEV" "$DEV_PROJECT"

# 2. UAT (Ask Confirmation)
read -p "❓ Sync rules to UAT? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    deploy_to_env "UAT" "$UAT_PROJECT"
else
    echo "⏭️  Skipping UAT."
    echo "-----------------------------------------"
fi

# 3. PROD (Ask Confirmation with Warning)
echo "⚠️  WARNING: You are about to update PRODUCTION security rules."
read -p "❓ Sync rules to PROD? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    deploy_to_env "PROD" "$PROD_PROJECT"
else
    echo "⏭️  Skipping PROD."
fi

echo "✨ Sync Sequence Complete."
# Reset to Dev for safety
firebase use "$DEV_PROJECT" > /dev/null
echo "🔄 Reset CLI context to DEV."