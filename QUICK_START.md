# Quick Start Guide - Smitox B2B Platform

## 📋 Project Overview

Smitox B2B Wholesale is a comprehensive e-commerce platform for B2B transactions with:
- Multi-tier product pricing (bulk discounts)
- Real-time order management
- Advanced search and filtering
- Responsive design (mobile, tablet, desktop)
- Role-based access control (RBAC)
- Payment gateway integration
- Invoice generation (PDF)
- WhatsApp integration

---

## 🚀 Getting Started

### Prerequisites
- Node.js v14+
- MongoDB
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repo-url>
cd smitoxProduction

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..

# Create .env file in root
cp .env.example .env

# Create .env file in client
cp client/.env.example client/.env
```

### Environment Variables

**Root .env:**
```
MONGODB_URI=mongodb://localhost:27017/smitox
JWT_SECRET=your_jwt_secret_key
PORT=8080
NODE_ENV=development
```

**client/.env:**
```
REACT_APP_API_URL=http://localhost:8080
```

### Running the Application

```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or separately:

# Terminal 1: Backend
npm start

# Terminal 2: Frontend
cd client
npm start
```

Visit: http://localhost:3000

---

## 📁 Project Structure

```
smitoxProduction/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── context/          # Context API
│   │   ├── styles/           # CSS files
│   │   └── App.js
│   └── package.json
├── controllers/              # Express controllers
├── models/                   # Mongoose models
├── routes/                   # API routes
├── middlewares/              # Custom middlewares
├── helpers/                  # Helper functions
├── server.js                 # Express server
└── package.json
```

---

## 🔑 Key Features

### For Customers
- Browse products with advanced filters
- View bulk pricing tiers
- Add to cart with quantity management
- Checkout with COD/Online payment
- Track orders
- Download invoices

### For Admins
- Dashboard with KPIs
- Product management (CRUD)
- Order management with status tracking
- User management
- Category & Subcategory management
- ProductForYou featured products
- Invoice generation
- WhatsApp order updates

---

## 🎨 Recent Updates

### Products Page Redesign (Dec 3, 2024)
- ✅ Fixed sidebar overlap issue
- ✅ Modern UI matching Orders page
- ✅ Tab-based filtering
- ✅ Responsive design
- ✅ Enhanced table styling

### Architecture Documentation
- ✅ Created `furtherplans.md` with:
  - System architecture diagrams
  - Database schema documentation
  - API endpoint reference
  - User flows and wireframes
  - Future enhancement roadmap

---

## 📡 API Endpoints

### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/user-auth
GET    /api/v1/auth/admin-auth
```

### Products
```
GET    /api/v1/product/get-product
GET    /api/v1/product/get-product/:id
POST   /api/v1/product/create-product
PUT    /api/v1/product/update-product/:id
DELETE /api/v1/product/delete-product/:id
```

### Orders
```
GET    /api/v1/order/get-orders
POST   /api/v1/order/create-order
PUT    /api/v1/order/update-order/:id
GET    /api/v1/order/admin-orders
```

See `furtherplans.md` for complete API reference.

---

## 🧪 Testing

### Manual Testing
1. Visit http://localhost:3000
2. Register/Login as customer
3. Browse products
4. Add to cart
5. Checkout
6. Visit http://localhost:3000/dashboard/admin (as admin)
7. Test admin features

### Testing Checklist
- [ ] User registration
- [ ] User login
- [ ] Product browsing
- [ ] Search functionality
- [ ] Add to cart
- [ ] Checkout process
- [ ] Order creation
- [ ] Admin dashboard
- [ ] Product management
- [ ] Order management

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Ensure MongoDB is running
mongod

# Or use MongoDB Atlas
# Update MONGODB_URI in .env
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=8081

# Or kill process using port 8080
lsof -ti:8080 | xargs kill -9
```

### CORS Errors
- Check backend CORS configuration
- Verify REACT_APP_API_URL in client/.env

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules client/node_modules
npm install
cd client && npm install
```

---

## 📚 Documentation

- **Architecture**: See `furtherplans.md`
- **Changes**: See `CHANGES_SUMMARY.md`
- **API Reference**: See `furtherplans.md` → API Endpoints section
- **Database Schema**: See `furtherplans.md` → Database Schema section

---

## 🔐 Security

- Passwords hashed with bcrypt
- JWT authentication
- Role-based access control
- Input validation
- CORS protection
- Environment variables for secrets

---

## 📈 Performance

- Pagination for large datasets
- Image optimization
- Lazy loading components
- Database indexing
- Caching strategies

---

## 🚢 Deployment

### Production Build
```bash
# Frontend
cd client
npm run build

# Backend
NODE_ENV=production npm start
```

### Using PM2
```bash
npm install -g pm2

# Start
pm2 start server.js --name "smitox-server"

# Monitor
pm2 monit

# Logs
pm2 logs smitox-server
```

---

## 📞 Support & Contact

- **Email**: support@smitox.com
- **Documentation**: See `furtherplans.md`
- **Issues**: GitHub Issues
- **Wiki**: Project Wiki

---

## 🎯 Next Steps

1. Review `furtherplans.md` for architecture overview
2. Explore admin dashboard at `/dashboard/admin`
3. Test all features on different devices
4. Review code in `client/src` and `controllers/`
5. Check API endpoints in `routes/`

---

## ✨ Version Info

- **Version**: 1.0
- **Last Updated**: December 3, 2024
- **Status**: Production Ready
- **Node**: v14+
- **React**: 18.x
- **MongoDB**: 4.0+

---

Happy coding! 🚀
