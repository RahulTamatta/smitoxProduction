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

const router = express.Router();

// Existing routes
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.put('/users/:id/status', toggleUserStatus);
router.put('/users/:id/regular', updateUserRegular);
router.put('/users/:id/live-product', toggleLiveProduct);
router.put('/users/:id/order-type', updateOrderType);

// Wishlist routes
router.get("/users/:userId/wishlist", getWishlist);
router.post("/users/:userId/wishlist", addToWishlist);
router.delete("/users/:userId/wishlist/:productId", removeFromWishlist);
router.get("/users/:userId/wishlist/check/:productId", checkWishlistStatus);

// Cart routes
router.get('/users/:userId/cart', getCart); // Fetch user's cart
router.patch('/users/:userId/cart/:productId', updateCartQuantity); // Update quantity in cart
// New route to fetch real-time product quantity
router.get('/users/:userId/products/:productId/quantity', getProductQuantity);
router.post('/users/:userId/cart', addToCart);
router.get('/users/:userId/cart/products/:productId/quantity', fetchProductQuantity); 
router.post('/users/:userId/cartq/:productId', updateCart); // Update product in cart
router.delete('/users/:userId/cart/:productId', removeFromCart); // Remove product from cart
router.delete('/users/:userId/cart', clearCart); // Clear cart

export default router;
