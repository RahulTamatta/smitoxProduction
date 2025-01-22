import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import Wishlist from '../models/wishlistModel.js';

// Get all users with populated products, wishlist, and cart
export const getUsers = async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";
    
    // Create search query
    const searchQuery = search ? {
      $or: [
        { user_fullname: { $regex: search, $options: "i" } },
        { email_id: { $regex: search, $options: "i" } },
        { mobile_no: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } }
      ]
    } : {};

    const users = await userModel
      .find(searchQuery)
      .populate('products')
      .populate('wishlist')
      .populate('cart.product');

    res.json({ status: 'success', list: users });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
// Update user information by ID
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await userModel.findByIdAndUpdate(id, req.body, { new: true })
      .populate('products')
      .populate('wishlist')
      .populate('cart.product');
    res.json({ status: 'success', user: updatedUser });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Toggle user status (active/inactive) by ID
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status value matches enum
    if (![0, 1,2].includes(status)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid status value. Must be 0, 1, or 2' 
      });
    }

    // Convert status to Number since schema expects Number
    const numericStatus = Number(status);
    
    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      {status:numericStatus},
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      message: 'User status updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error updating user status',
      error: error.message 
    });
  }
};


export const updateUserRegular = async (req, res) => {
  try {
    const { id } = req.params;
    const { regular } = req.body;

    // Validate regular value matches enum
    if (![0, 1, 2].includes(regular)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid regular value. Must be 0, 1, or 2'
      });
    }

    // Convert regular to Number since schema expects Number
    const numericRegular = Number(regular);

    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { regular: numericRegular },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      message: 'User regular status updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user regular status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating user regular status',
      error: error.message
    });
  }
};


export const toggleLiveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);
    user.live_product = !user.live_product;
    await user.save();
    res.json({ status: 'success', user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Update the order type for a user by ID
export const updateOrderType = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_type } = req.body;
    const updatedUser = await userModel.findByIdAndUpdate(id, { order_type }, { new: true })
      .populate('products')
      .populate('wishlist')
      .populate('cart.product');
    res.json({ status: 'success', user: updatedUser });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
// Get Wishlist for a User
export const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const wishlist = await Wishlist.findOne({ user: userId }).populate('products.product');

    if (!wishlist) {
      return res.status(404).json({ status: 'error', message: 'Wishlist not found' });
    }

    res.json({ status: 'success', wishlist: wishlist.products });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};


// Get the user's cart
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ user: userId }).populate('products.product');

    if (!cart) {
      return res.json({ status: 'success', cart: [] });
    }

    res.json({ status: 'success', cart: cart.products });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};


// Update quantity in the cart
export const updateCartQuantity = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    // Log the received request
    console.log("Received request to update cart:");
    console.log("userId:", userId);
    console.log("productId:", productId);
    console.log("Updated quantity:", quantity);

    // Find the user's cart and populate the product details
    let cart = await Cart.findOne({ user: userId }).populate('products.product');
    console.log("Cart contents:", cart);  // Log the cart contents to inspect

    if (!cart) {
      return res.status(404).json({ status: 'error', message: 'Cart not found' });
    }

    // Find the product in the cart
    const productIndex = cart.products.findIndex(
      (item) => item.product._id.toString() === productId.toString()
    );

    if (productIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Product not found in cart' });
    }

    // Update the quantity of the product in the cart
    cart.products[productIndex].quantity = quantity;

    // Save the updated cart
    await cart.save();

    // Return the updated cart
    res.json({
      status: 'success',
      message: 'Cart updated successfully',
      cart: cart.products,  // Return the updated cart products
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};


export const getProductQuantity = async (req, res) => {
  const { userId, productId } = req.params;
  
  try {
    // Log incoming request parameters
    console.log("Incoming request params:", {
      userId,
      productId,
      fullParams: req.params
    });

    // Validate parameters
    if (!userId || !productId) {
      return res.status(400).json({
        message: "Missing required parameters",
        params: { userId, productId }
      });
    }

    // Find the cart with lean() for better performance
    const cart = await Cart.findOne({ 
      user: userId 
    }).lean();

    // Log cart finding results
    console.log("Found cart:", cart);

    if (!cart) {
      return res.status(200).json({ quantity: 0 });
    }

    // Handle potential undefined products array
    const products = cart.products || [];

    // Find product in cart
    const cartProduct = products.find(item => 
      item && item.product && item.product.toString() === productId.toString()
    );

    // Log the found product
    console.log("Found cart product:", cartProduct);

    // Return quantity if found, otherwise 0
    const quantity = cartProduct ? cartProduct.quantity : 0;

    return res.status(200).json({ 
      quantity,
      success: true
    });

  } catch (error) {
    console.error("Server error details:", {
      error,
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      message: "Error fetching product quantity",
      error: error.message
    });
  }
};


// Clear all items from the user's cart
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { products: [] } },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ status: 'error', message: 'Cart not found' });
    }
    
    res.json({ status: 'success', message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};


export const removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({ status: 'error', message: 'Cart not found' });
    }
    
    const initialLength = cart.products.length;
    cart.products = cart.products.filter(item => item.product.toString() !== productId);
    
    if (cart.products.length === initialLength) {
      return res.status(404).json({ status: 'error', message: 'Product not found in cart' });
    }

    await cart.save();
    
    res.json({ status: 'success', message: 'Product removed from cart' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};


// Add a product to the wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { userId } = req.params; // User ID from the request params
    const { productId } = req.body; // Product ID from the request body

    // Check if the wishlist already exists
    const wishlist = await Wishlist.findOne({ user: userId });

    if (wishlist) {
      // Check if the product is already in the wishlist
      const productExists = wishlist.products.some(item => item.product.toString() === productId);
      if (productExists) {
        // If product exists, remove it from the wishlist
        const updatedWishlist = await Wishlist.findOneAndUpdate(
          { user: userId },
          { $pull: { products: { product: productId } } },
          { new: true }
        ).populate('products.product');

        return res.json({ status: 'success', message: 'Product removed from wishlist', wishlist: updatedWishlist });
      } else {
        // If product doesn't exist, add it to the wishlist
        const updatedWishlist = await Wishlist.findOneAndUpdate(
          { user: userId },
          { $addToSet: { products: { product: productId } } },
          { new: true }
        ).populate('products.product');

        return res.json({ status: 'success', message: 'Product added to wishlist', wishlist: updatedWishlist });
      }
    } else {
      // Create a new wishlist if it doesn't exist
      const newWishlist = new Wishlist({ user: userId, products: [{ product: productId }] });
      await newWishlist.save();
      const populatedWishlist = await newWishlist.populate('products.product');

      return res.json({ status: 'success', message: 'Wishlist created and product added', wishlist: populatedWishlist });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Remove Product from Wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: userId },
      { $pull: { products: { product: productId } } },
      { new: true }
    ).populate('products.product');

    if (!wishlist) {
      return res.status(404).json({ status: 'fail', message: "Wishlist not found" });
    }

    res.json({ status: 'success', message: 'Product removed from wishlist', wishlist });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Check if product exists in wishlist
export const checkWishlistStatus = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const wishlist = await Wishlist.findOne({ user: userId });

    const productExists = wishlist ? wishlist.products.some(item => item.product.toString() === productId) : false;

    res.json({ status: 'success', exists: productExists });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Add a product to the user's cart
export const addToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity, bulkProductDetails } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, products: [] });
    }

    // Check if the product is already in the cart
    const productIndex = cart.products.findIndex(item => item.product.toString() === productId);
    if (productIndex > -1) {
      // If the product is already in the cart, update the quantity
      cart.products[productIndex].quantity += quantity;
      cart.products[productIndex].bulkProductDetails.push(bulkProductDetails);
    } else {
      // If the product is not in the cart, add it
      cart.products.push({ product: productId, quantity, bulkProductDetails: [bulkProductDetails] });
    }

    await cart.save();
    res.json({ status: 'success', cart });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};


export const updateCart = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    console.log(`Request received: userId=${userId}, productId=${productId}, quantity=${quantity}`);

    if (!userId || !productId) {
      console.log("Error: Missing userId or productId.");
      return res.status(400).json({ status: "error", message: "Invalid request parameters" });
    }

    if (!quantity && quantity !== 0) {
      console.log("Error: Quantity not provided.");
      return res.status(400).json({ status: "error", message: "Quantity is required" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      console.log("Error: Cart not found.");
      return res.status(404).json({ status: "error", message: "Cart not found" });
    }

    const productIndex = cart.products.findIndex((item) => item.product.toString() === productId);

    if (productIndex > -1) {
      if (quantity <= 0) {
        console.log(`Removing product: ${productId} from cart.`);
        cart.products.splice(productIndex, 1);
      } else {
        console.log(`Updating product: ${productId} with quantity: ${quantity}`);
        cart.products[productIndex].quantity = quantity;
      }

      await cart.save();
      console.log("Cart updated successfully.");
      res.json({ status: "success", cart });
    } else {
      console.log(`Error: Product: ${productId} not found in cart.`);
      res.status(404).json({ status: "error", message: "Product not found in cart" });
    }
  } catch (error) {
    console.error("Error in updateCart:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};


export const fetchCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ user: userId }).populate("products.product", "name price photo");

    if (!cart) {
      return res.status(404).json({ status: "error", message: "Cart not found" });
    }

    res.json({ status: "success", cart });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
export const fetchProductQuantity = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    if (!userId || !productId) {
      console.log("Error: Missing userId or productId.");
      return res.status(400).json({ status: "error", message: "Invalid request parameters" });
    }

    // Find the cart of the user
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      console.log("Error: Cart not found.");
      return res.status(404).json({ status: "error", message: "Cart not found" });
    }

    // Find the product in the cart
    const product = cart.products.find(item => item.product.toString() === productId);

    if (product) {
      console.log(`Product quantity: ${product.quantity}`);
      return res.json({ status: "success", quantity: product.quantity });
    } else {
      console.log(`Error: Product ${productId} not found in cart.`);
      return res.status(404).json({ status: "error", message: "Product not found in cart" });
    }
  } catch (error) {
    console.error("Error in fetchProductQuantity:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};



