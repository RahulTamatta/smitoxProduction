#!/bin/bash

# Exit script if any command fails
set -e

echo "=========================================="
echo "    🚀 Starting Deployment Script 🚀      "
echo "=========================================="

echo "[1/4] Pulling latest code from GitHub..."
# Update the branch name here if you switch branches in the future
# Generated files (the React build and the lockfile) are rewritten on this
# server by every deploy; discard those local edits so the pull never aborts
# with "local changes would be overwritten". Other local edits are left alone.
git checkout -- client/build server/package-lock.json 2>/dev/null || true
git pull origin hostinger_vps
echo "Deploying commit: $(git log --oneline -1)"

echo "[2/4] Rebuilding the React Client..."
cd client
# Ensure dependencies are up-to-date
npm install
# Create the optimized production build folder
npm run build
cd ..

echo "[3/4] Rebuilding Docker Images for Client and Server..."
# Rebuild both frontend and backend images so code changes in both are deployed
docker compose build --no-cache client
docker compose build --no-cache server

echo "[4/4] Restarting Docker Services..."
# Recreate containers to serve the newly built images
if ! docker compose up -d --force-recreate; then
  echo ""
  echo "❌ docker compose failed to start the containers."
  echo "Most common cause: port 8080 is already in use by a non-Docker process."
  echo "--- Who is listening on 8080:"
  ss -lptn 'sport = :8080' || true
  echo "--- pm2 processes (a bare-metal smitox-server would clash with Docker):"
  command -v pm2 >/dev/null 2>&1 && pm2 list || true
  echo "--- containers:"
  docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
  echo "Free the port, then run: docker compose up -d"
  exit 1
fi

# The app runs in Docker. Do NOT 'pm2 restart all' here: it can resurrect an
# old bare-metal smitox-server that grabs port 8080 and blocks the container.

echo "Waiting for the API to answer..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/bannerManagement/get-banners || true)
  [ "$code" = "200" ] && break
  sleep 3
done
echo "API health check: HTTP $code"
[ "$code" = "200" ] || { echo "❌ API not healthy. See: docker logs smitox-server --tail 50"; exit 1; }

echo "=========================================="
echo "      ✅ Deployment Successful! ✅        "
echo "=========================================="
echo "Note: Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) in your browser to clear cache."
