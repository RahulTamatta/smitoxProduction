#!/bin/bash

# Exit script if any command fails
set -e

echo "=========================================="
echo "    🚀 Starting Deployment Script 🚀      "
echo "=========================================="

echo "[1/4] Pulling latest code from GitHub..."
# Update the branch name here if you switch branches in the future
git pull origin hostinger_vps

echo "[2/4] Rebuilding the React Client..."
cd client
# Ensure dependencies are up-to-date
npm install
# Create the optimized production build folder
npm run build
cd ..

echo "[3/4] Rebuilding Docker Image for Client (without cache)..."
# This copies the newly generated "build" folder into the docker image
docker compose build --no-cache client

echo "[4/4] Restarting Docker Services..."
# Recreate the container to serve the newly built image
docker compose up -d

# Optional: Restart pm2 if you're running any bare-metal node apps outside Docker
echo "Checking for pm2 processes..."
if command -v pm2 &> /dev/null
then
    pm2 restart all || echo "No pm2 apps running"
fi

echo "=========================================="
echo "      ✅ Deployment Successful! ✅        "
echo "=========================================="
echo "Note: Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) in your browser to clear cache."
