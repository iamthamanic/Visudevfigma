#!/bin/bash

# VisuDEV Screenshot Function Deployment Script
# Usage: ./deploy-screenshots.sh

echo "🚀 Deploying visudev-screenshots Edge Function..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase!"
    echo ""
    echo "Login with:"
    echo "  supabase login"
    echo ""
    exit 1
fi

# Deploy function
echo "📦 Deploying function..."
supabase functions deploy visudev-screenshots

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "Next steps:"
    echo "1. Set the SCREENSHOT_API_KEY secret:"
    echo "   supabase secrets set SCREENSHOT_API_KEY=<your-screenshotone-key>"
    echo ""
    echo "2. Test the health endpoint:"
    echo "   curl https://<project-ref>.supabase.co/functions/v1/visudev-screenshots/health"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Make sure you're linked to the correct project:"
    echo "  supabase link --project-ref tzfnfgzgj3thvwvoeysv"
    echo ""
fi
