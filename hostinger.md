# Hostinger MERN Deployment Guide (Local Storage Version)

This guide provides instructions on how to set up and host the **Smitox Production** MERN project on Hostinger **without using Cloudinary**.

---

## 1. Recommended Hosting Plans (Storage Focused)

Since you want to store images locally on the server, you need a plan with high-speed SSD/NVMe storage.

### **Option A: Hostinger KVM VPS (Starts at US$ 4.99/mo)**
This is the best for MERN and local storage because you have full control over the file system.

*   **KVM 1 (US$ 4.99/mo - Entry Level)**:
    *   **Specs**: 1 vCPU, 4GB RAM, 50GB NVMe.
    *   **Good for**: Small stores, starting out, testing.
    *   **Note**: 50GB is enough for ~10,000-20,000 optimized product images. If you expect more, go for KVM 2.
*   **KVM 2 (US$ 9.99/mo - Recommended for Growth)**:
    *   **Specs**: 2 vCPUs, 8GB RAM, 100GB NVMe.
    *   **Good for**: Active production sites, large inventories, and better multi-tasking performance.

### **Option B: Hostinger Cloud Startup (cPanel/hPanel)**
If you prefer a dashboard (hPanel) over a terminal.
- **Why**: Easier to use, but Node.js support is more restricted than VPS.
- **Storage**: Usually 200GB SSD.

---

## 2. Setting Up Local Image Storage

Instead of Cloudinary, your Node.js backend will now save files to a folder on the Hostinger disk.

### **Step 1: Create the Uploads Folder**
On your server (VPS or cPanel), you must create a folder to store images.
```bash
# On VPS terminal:
mkdir -p uploads/products
chmod 755 uploads
```

### **Step 2: Backend Configuration (Multer)**
You need to install `multer` to handle file uploads.
```bash
npm install multer
```
Example code to replace Cloudinary:
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Path on server
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
```

### **Step 3: Serving Images via Nginx (VPS)**
If using a VPS, you must tell Nginx to serve the `uploads` folder as static files so the frontend can see them.
Edit `/etc/nginx/sites-available/default`:
```nginx
location /uploads/ {
    alias /home/root/smitox/uploads/;
}
```

### **Step 4: Serving Images via Express (cPanel)**
If using cPanel/hPanel, add this to your `server.js`:
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

---

## 3. How to Setup for cPanel (hPanel)

If you are using Hostinger's **Shared/Cloud Hosting** (not VPS):

1. **Upload Files**: Use the hPanel **File Manager** to upload your project files.
2. **Node.js Setup**:
   - Go to hPanel -> **Advanced** -> **Node.js**.
   - Select your Node.js version.
   - Set **Application Root** to your project folder.
   - Set **Application URL** to your domain.
   - Set **Application Startup File** to `server.js` (or `index.js`).
3. **Install Extensions**: Click "Edit" and run `npm install`.
4. **Environment Variables**: Add your `MONGO_URL` and `JWT_SECRET` in the Node.js configuration panel.
5. **Images**: Create the `uploads` folder via File Manager and ensure permissions are set to `755`.

---

## 4. Key Differences (Cloudinary vs Local)

| Feature | Cloudinary | Local Storage |
| :--- | :--- | :--- |
| **Cost** | Free tier available | Free (uses server disk) |
| **Setup** | Easy (just API) | Complex (Folder perms, Nginx) |
| **Scaling** | Global CDN | Server-dependent |
| **Backups** | Handled by Cloudinary | **YOU must backup your uploads!** |

---

## 5. Summary Checklist
1. Buy **KVM 2 VPS** (for performance) or **Cloud Startup** (for hPanel).
2. Create an `uploads/` folder in your project root.
3. Install `multer` and update your controllers to save files locally.
4. Update React code to use your domain URL (e.g., `https://yourdomain.com/uploads/img.jpg`) instead of Cloudinary URLs.
