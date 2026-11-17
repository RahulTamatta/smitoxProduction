import express from 'express';
import { 
  getUsers, 
  updateUser, 
  toggleUserStatus, 
  toggleLiveProduct, 
  updateOrderType,
  getWishlist,
  addToWishlist,updateUserRegular,
  removeFromWishlist,
  checkWishlistStatus,fetchProductQuantity,
  getCart,
  updateCartQuantity,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
  getProductQuantity // New controller function
} from '../controllers/userController.js';
import { requireCapability, requireSignIn } from '../middlewares/rbacMiddleware.js';
import { requireSelfOrCapability } from '../middlewares/securityMiddleware.js';

const router = express.Router();

// Existing routes
router.get('/users', requireSignIn, requireCapability('users:read'), getUsers);
router.put('/users/:id', requireSignIn, requireCapability('users:write'), updateUser);
router.put('/users/:id/status', requireSignIn, requireCapability('users:write'), toggleUserStatus);
router.put('/users/:id/regular', requireSignIn, requireCapability('users:write'), updateUserRegular);
router.put('/users/:id/live-product', requireSignIn, requireCapability('users:write'), toggleLiveProduct);
router.put('/users/:id/order-type', requireSignIn, requireCapability('users:write'), updateOrderType);

// Owner or staff with users:write may access a user's wishlist / cart
const ownerOrStaff = [requireSignIn, requireSelfOrCapability('userId', 'users:write')];

// Wishlist routes
router.get("/users/:userId/wishlist", ...ownerOrStaff, getWishlist);
router.post("/users/:userId/wishlist", ...ownerOrStaff, addToWishlist);
router.delete("/users/:userId/wishlist/:productId", ...ownerOrStaff, removeFromWishlist);
router.get("/users/:userId/wishlist/check/:productId", ...ownerOrStaff, checkWishlistStatus);

// Cart routes
router.get('/users/:userId/cart', ...ownerOrStaff, getCart); // Fetch user's cart
router.patch('/users/:userId/cart/:productId', ...ownerOrStaff, updateCartQuantity); // Update quantity in cart
// New route to fetch real-time product quantity
router.get('/users/:userId/products/:productId/quantity', ...ownerOrStaff, getProductQuantity);
router.post('/users/:userId/cart', ...ownerOrStaff, addToCart);
router.get('/users/:userId/cart/products/:productId/quantity', ...ownerOrStaff, fetchProductQuantity); 
router.post('/users/:userId/cartq/:productId', ...ownerOrStaff, updateCart); // Update product in cart
router.delete('/users/:userId/cart/:productId', ...ownerOrStaff, removeFromCart); // Remove product from cart
router.delete('/users/:userId/cart', ...ownerOrStaff, clearCart); // Clear cart

export default router;
