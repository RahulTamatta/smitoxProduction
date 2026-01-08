#!/bin/bash

# Staging Deployment Helper Script
# Usage: ./deployment/staging_deploy.sh <VPS_IP>

VPS_IP=$1

if [ -z "$VPS_IP" ]; then
    echo "Usage: ./deployment/staging_deploy.sh <VPS_IP>"
    exit 1
fi

echo "🚀 Starting Staging Deployment to $VPS_IP..."

# 1. Create Staging Directory on VPS (if not exists)
echo "📂 Ensuring staging directory exists on VPS..."
ssh root@$VPS_IP "mkdir -p /home/ubuntu/smitoxStaging"

# 2. Sync Files (excluding node_modules and uploads to prevent overwrite)
echo "qc Syncing files to /home/ubuntu/smitoxStaging..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'server/uploads' ./ root@$VPS_IP:/home/ubuntu/smitoxStaging/

# 3. Copy .env.staging to .env on VPS for correct Docker Compose usage
# We rename it to .env so docker-compose picks it up automatically or we specify it.
# Actually, docker-compose supports --env-file. But simpler to just have the right .env there.
echo "📄 Configuring Staging Environment..."
ssh root@$VPS_IP "cp /home/ubuntu/smitoxStaging/.env.staging /home/ubuntu/smitoxStaging/.env"

# 4. Restart Staging Containers
echo "🔄 Restarting Staging Containers..."
ssh root@$VPS_IP "cd /home/ubuntu/smitoxStaging && docker compose up -d --build"

echo "✅ Staging Deployment Complete!"
echo "🌍 Staging Client: http://$VPS_IP:3001"
echo "🔌 Staging Server: http://$VPS_IP:8081"
