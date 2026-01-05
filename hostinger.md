# Hostinger MERN Deployment Guide (Docker & Local Storage Version)

This guide provides instructions on how to set up and host the **Smitox Production** project on Hostinger.

---

## 1. Recommended Hosting Plans

For MERN applications, we recommend a plan that gives you full control and SSD/NVMe storage.

### **Option A: Hostinger KVM VPS (Starts at US$ 4.99/mo) - RECOMMENDED**
This is the best choice because it supports **Docker**, which makes deployment extremely easy.
- **KVM 2 (US$ 9.99/mo)**: Recommended specs (2 vCPUs, 8GB RAM, 100GB NVMe).

### **Option B: Hostinger Cloud Startup (hPanel)**
Easier dashboard but more restrictive Node.js environment. Does not support Docker as easily.

---

## 2. Docker Deployment (Recommended for VPS)

Since the project is now Dockerized, you can deploy it in a few commands.

### **Step 1: Install Docker on VPS**
Run these on your Ubuntu VPS:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### **Step 2: Deploy the Stack**
1. **Clone your repo**: `git clone <repo_url>`
2. **Navigate to project**: `cd smitoxProduction`
3. **Configure environment**: Create a `.env` file inside the `server/` directory with your database and API keys.
4. **Start everything**:
   ```bash
   docker compose up -d --build
   ```

### **Step 3: Post-Deployment**
- **Frontend**: Runs on port `3000`
- **Backend**: Runs on port `8080`
- Use **Nginx** as a reverse proxy to point your domain (port 80/443) to port 3000.

---

## 3. Setting Up Local Image Storage

Instead of Cloudinary, you can save files directly to the Hostinger disk.

### **Step 1: Create the Uploads Folder**
On your server (VPS or cPanel), create the directory:
```bash
mkdir -p server/uploads/products
chmod 755 server/uploads
```

### **Step 2: Serving Images via Express**
I have already configured the `server.js` to serve these files:
```javascript
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
```

### **Step 3: Serving Images via Nginx (VPS Only)**
For better performance, tell Nginx to serve the `uploads` folder:
```nginx
location /uploads/ {
    alias /home/root/smitoxProduction/server/uploads/;
}
```

---

## 4. Manual Setup for hPanel (Non-Docker)

If you are using Hostinger's **Shared/Cloud Hosting**:

1. **Upload Files**: Use File Manager to upload your project.
2. **Node.js Setup**:
   - Go to hPanel -> **Advanced** -> **Node.js**.
   - Set **Application Root** to your `server/` folder.
   - Set **Application Startup File** to `server.js`.
3. **Install Dependencies**: Run `npm install` in the `server/` folder via the Node.js panel.
4. **Environment Variables**: Add your `MONGO_URL` and `JWT_SECRET` in the Node.js configuration panel.

---

## 5. Summary Checklist

1. Buy **KVM 2 VPS**.
2. Install **Docker**.
3. Clone repo and create `server/.env`.
4. Run `docker compose up -d --build`.
5. Point your domain to port 3000 using Nginx.
