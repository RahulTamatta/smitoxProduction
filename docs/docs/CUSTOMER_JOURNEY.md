# Customer Journey & Mobile App Flow

This document maps the end-to-end customer journey, focusing primarily on the Flutter Mobile App (`/tests/lib`) and corresponding web customer portal paths.

## 1. App Initialization & Onboarding
1. **App Launch**: `main.dart` initializes Firebase, Sentry, and the API utilities.
2. **Update Check**: The `Upgrader` package runs immediately. If `minAppVersion` is higher than the installed version, a forced update modal blocks access until the user updates via the App Store/Play Store.
3. **Session Check**: `SharedPreferences` checks for a stored JWT token. 
   - If missing: Renders `LoginScreen` (`/login`).
   - If present: Routes directly to `Dashboard` (`/dashboard`).

## 2. Authentication Flow
- **Login**: User enters credentials.
- **Provider**: `AuthProvider` (ChangeNotifier) handles the API call to `/api/v1/auth/login`.
- **State**: The returned JWT is saved to `SharedPreferences` and injected into the Dio API interceptors for future requests.

## 3. Browsing & Discovery (Dashboard)
The `Dashboard` is the main scaffold containing a Bottom Navigation Bar.
- **Home Tab**: Displays `DealSlider` (Carousel of Banners), `Category` circles, and `ProductsForYou` grids.
- **Search Flow**: Triggering search hits the Elasticsearch backend (`/api/v1/search/autocomplete`) for instant results.
- **Category Navigation**: Tapping a category queries `/api/v1/product/get-product` filtered by `categoryId`.

## 4. Product Interaction
- **Product Details Page**: Shows high-resolution images (cached via `cached_network_image`), price, and bulk pricing tiers.
- **Add to Cart**: Tapping "Add to Cart" triggers `CartProvider.addToCart`. 
   - Similar to the web's Zustand implementation, the Flutter `CartProvider` does an optimistic UI update, immediately showing the cart badge increment before the backend `/carts/users/:userId/cart` responds.
- **Wishlist**: Users can toggle the heart icon to add/remove products via `WishlistProvider`.

## 5. Checkout & Payment
1. **Cart Review**: User navigates to the Cart tab. `CartProvider.getTotalPrice()` calculates the sum based on applicable bulk discounts.
2. **Address Selection**: User inputs or selects a saved shipping address.
3. **Payment Initiation**: User selects Razorpay. The Flutter app calls the backend to generate a Razorpay Order ID.
4. **Razorpay SDK**: The native `razorpay_flutter` SDK opens. The user completes the transaction.
5. **Verification**: The SDK returns a `payment_id` and `signature` to the app, which forwards it to the Node.js backend (`/api/v1/product/verify-payment`) for HMAC validation.
6. **Success**: The backend clears the remote cart and creates the Order snapshot. The app clears the local `CartProvider` state and redirects to the Orders tab.

## 6. Post-Purchase Journey
- **Order Tracking**: The user views their order history in the Orders tab. Status changes ("Dispatched", "Delivered") are pulled from the backend.
- **Push Notifications**: Firebase Cloud Messaging (FCM) sends push notifications to the device when an admin updates the order status.
