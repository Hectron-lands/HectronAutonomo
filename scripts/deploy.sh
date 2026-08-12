#!/bin/bash
# HECTRON LIVE UNIVERSE - Deploy Script
set -e
ENVIRONMENT=${1:-development}
log_info() { echo "[INFO] $1"; }
log_info "Deploying to Vercel..."
if ! command -v vercel &> /dev/null; then npm install -g vercel; fi
if ! vercel whoami &> /dev/null; then vercel login; fi
git pull origin main
npm run build
vercel deploy --prod --confirm
log_info "Deploy complete!"