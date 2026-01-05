#!/bin/bash

# VPS Setup Script for Smitox Production
# Run this script on your Hostinger VPS as root

echo "=== Smitox VPS Setup Script ==="
echo ""

# Step 1: Install Nginx
echo "Step 1: Installing Nginx..."
apt update
apt install nginx -y
systemctl enable nginx

# Step 2: Create Nginx config
echo "Step 2: Creating Nginx configuration..."
cat > /etc/nginx/sites-available/smitox << 'EOF'
server {
    listen 80;
    server_name 72.61.248.86;

    # Frontend - React App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API - Express Server
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads folder for local images
    location /uploads/ {
        proxy_pass http://localhost:8080/uploads/;
    }
}
EOF

# Step 3: Enable the site
echo "Step 3: Enabling Nginx site..."
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/smitox /etc/nginx/sites-enabled/

# Step 4: Test and reload Nginx
echo "Step 4: Testing and reloading Nginx..."
nginx -t
if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo ""
    echo "=== SUCCESS ==="
    echo "Nginx is now configured!"
    echo "Your site should be accessible at: http://72.61.248.86"
else
    echo "ERROR: Nginx configuration test failed!"
    exit 1
fi

# Step 5: Check Docker containers
echo ""
echo "Step 5: Checking Docker containers..."
docker ps

echo ""
echo "=== Setup Complete ==="
