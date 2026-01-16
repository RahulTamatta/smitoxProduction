# Hostinger VPS Deployment Guide

Quick guide for deploying SmitoxProduction to Hostinger VPS with Docker.

---

## Prerequisites
- Hostinger KVM VPS (recommended KVM 2 at $9.99/mo)
- Docker installed on VPS

---

## 1. Docker Setup (Already Complete)

Your `docker-compose.yml` runs:
- **Server** on port 8080
- **Client** on port 3000

```bash
docker compose up -d --build
```

---

## 2. Nginx Setup (Required)

Run this on your VPS to make the site accessible:

```bash
# Install Nginx
sudo apt update && sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/smitox
```

Paste this config:
```nginx
server {
    listen 80;
    server_name 72.61.248.86;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        proxy_pass http://localhost:8080/uploads/;
    }
}
```

Enable and reload:
```bash
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/smitox /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 3. Access Your Site

After Nginx setup:
- **Website**: http://72.61.248.86
- **API**: http://72.61.248.86/api/v1

---

## Troubleshooting

```bash
# Check containers running
docker ps

# View server logs
docker logs smitox-server

# View client logs  
docker logs smitox-client

# Rebuild containers
docker compose down && docker compose up -d --build
```
