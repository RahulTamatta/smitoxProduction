# Smitox Staging Setup Guide

This guide contains the exact terminal commands to set up and host the **staging** branch on your Hostinger VPS, ensuring it runs independently on `staging.smitox.com`.

---

## 1. Prerequisites (Check these first)
1.  **DNS**: Ensure `staging.smitox.com` points to your VPS IP: `72.61.248.86`.
2.  **Domains**: You should have `smitox.com` and `staging.smitox.com` ready.

---

## 2. Sync Code (Run on Local Machine)
Push the latest fixes from your local machine to the VPS staging directory.

```bash
# Run this from your project root on your local Mac
bash deployment/staging_deploy.sh 72.61.248.86
```

---

## 3. Update Nginx Config (Run on VPS)
Log in to your VPS as `root` and run these commands to set up the subdomain routing.

```bash
# Update the configuration file
cat > /etc/nginx/sites-available/smitox << 'EOF'
# Production - smitox.com
server {
    listen 80;
    server_name smitox.com www.smitox.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads/ {
        proxy_pass http://localhost:8080/uploads/;
    }
}

# Staging - staging.smitox.com
server {
    listen 80;
    server_name staging.smitox.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/ {
        proxy_pass http://localhost:8081/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads/ {
        proxy_pass http://localhost:8081/uploads/;
    }
}
EOF

# Test and Reload Nginx
nginx -t && systemctl reload nginx
```

---

## 4. Build & Start Staging (Run on VPS)
Navigate to the staging directory and start the containers.

```bash
cd /home/ubuntu/smitoxStaging

# Prepare environment variables
cp .env.staging .env

# Build and start stagging (Bakes staging URL into React build)
docker compose up -d --build
```

---

## 5. Verification Commands (Run on VPS)
Check if your services are responding correctly under the staging host header.

```bash
# Verify Staging Frontend
curl -I -H "Host: staging.smitox.com" http://127.0.0.1

# Verify Staging API
curl -I -H "Host: staging.smitox.com" http://127.0.0.1/api/v1/product/get-product
```

If the first command returns `200 OK` and the second returns `200` or `302`, your staging environment is live!
