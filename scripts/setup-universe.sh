#!/bin/bash
# HECTRON LIVE UNIVERSE - Setup Script
set -e
RED="\033[0;31m"
GREEN="\033[0;32m"
log_info() { echo -e "$GREEN[INFO] $1" ; }
mkdir -p public/overlay
mkdir -p .github/workflows
if [ ! -f ".env" ]; then cp .env.example .env; fi
npm install
cd api && npm install && cd ..
cd local-agent && npm install && cd ..
echo "Setup complete!"