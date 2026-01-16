# Smitox Fast Deployment Guide

Build locally on your Mac, deploy instantly to VPS.

---

## Step 1: Build Locally (Mac)

```bash
cd /Users/MyWork/GitHub/Companies/smitox/smitoxProduction/client
npm run build
cd ..
```

---

## Step 2: Sync to VPS

```bash
# From project root
rsync -avz --exclude 'node_modules' --exclude '.git' ./ root@72.61.248.86:/home/ubuntu/smitoxProduction/
```

---

## Step 3: Start Containers on VPS

```bash
# SSH into VPS
ssh root@72.61.248.86

# Navigate and start
cd /home/ubuntu/smitoxProduction
docker compose up -d --build
```

Build time on VPS: **~30 seconds** (vs 10+ minutes before)

---

## Why This Works

- React build runs on your Mac (16GB+ RAM)
- VPS only serves pre-built files (no memory issues)
- Docker just copies the `build/` folder
