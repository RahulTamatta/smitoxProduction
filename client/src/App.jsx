import { Route, Routes } from "react-router-dom"; // Remove ScrollRestoration
import AdminRoute from "./components/Routes/AdminRoute";
import PrivateRoute from "./components/Routes/Private";
import About from "./pages/About";
import AdminOrders from "./pages/Admin/Admin order/AdminOrders.jsx";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import CreateCategory from "./pages/Admin/CreateCategory";
import CreateProduct from "./pages/Admin/CreateProduct";
import PincodeList from "./pages/Admin/PinCode.jsx";
import ProductForYou from "./pages/Admin/ProductForYou.jsx";
import Products from "./pages/Admin/Products";
import SellerAnalytics from "./pages/Admin/SellerAnalytics";
import SubscriptionManagement from "./pages/Admin/SubscriptionManagement";
import SubscriptionPlans from "./pages/Admin/SubscriptionPlans";
import UpdateProduct from "./pages/Admin/UpdateProduct";
import Users from "./pages/Admin/Users";
import BannerManagement from "./pages/Admin/bannerManagement";
import BrandList from "./pages/Admin/brandList";
import MinimumOrder from "./pages/Admin/minimumOrder.jsx";
import SubcategoryList from "./pages/Admin/subCategory";
import AddToCartPage from "./pages/Admin/userCart.jsx";
import UsersLists from "./pages/Admin/userCartLists";
import ForgotPasssword from "./pages/Auth/ForgotPasssword";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Categories from "./pages/Categories";
import CategoryProduct from "./pages/CategoryProduct";
import Contact from "./pages/Contact";
import HomePage from "./pages/HomePage";
import Pagenotfound from "./pages/Pagenotfound";
import Policy from "./pages/Policy";
import ProductDetails from "./pages/ProductDetails";
import Search from "./pages/Search";
import SellerPlanSelection from "./pages/Seller/SellerPlanSelection";
import Terms from "./pages/TermsofUse";
import CartPage from "./pages/cart/CartPage.jsx";
import ReturnPolicy from "./pages/returnPolicy.jsx";
import Dashboard from "./pages/user/Dashboard";
import Orders from "./pages/user/Orders";
import Profile from "./pages/user/Profile";
import WishlistPage from "./pages/wishlists.jsx";

// Seller Onboarding V2 Components
import SellerApplications from "./pages/Admin/SellerApplications";
import ApplicationStatus from "./pages/Seller/ApplicationStatus";
import SellerDashboard from "./pages/Seller/SellerDashboard";
import SellerWizardV2 from "./pages/Seller/SellerWizardV2";

// Checkout Component
import CheckoutPage from "./pages/Checkout/CheckoutPage";

import AdminLogin from "./pages/Auth/AdminLog.jsx";
// Import Redux provider and store
import { Provider } from 'react-redux';
import ScrollToTop from './components/ScrollToTop'; // Ensure correct import
import store from './redux/store';

// Import React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Disable refetch on window focus
      retry: 1, // Retry failed requests once
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ScrollToTop /> {/* Using ScrollToTop component */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/cart" element={<CartPage />} />

          <Route path="/category/:slug" element={<CategoryProduct />} />
          <Route path="/search" element={<Search />} />
          <Route path="/dashboard" element={<PrivateRoute />}>
            <Route path="user" element={<Dashboard />} />
            <Route path="user/orders" element={<Orders />} />
            <Route path="user/profile" element={<Profile />} />
          </Route>
          <Route path="/dashboard" element={<AdminRoute />}>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/create-category" element={<CreateCategory />} />
            <Route path="admin/create-subcategory" element={<SubcategoryList />} />
            <Route path="admin/brand" element={<BrandList />} />
            <Route path="admin/minimumOrder" element={<MinimumOrder />} />

            <Route path="admin/create-product" element={<CreateProduct />} />
            <Route path="admin/create-banner" element={<BannerManagement />} />
            <Route path="admin/product/:slug" element={<UpdateProduct />} />
            <Route path="admin/products" element={<Products />} />
            <Route path="admin/users" element={<Users />} />


            <Route path="admin/UsersLists" element={<UsersLists />} />
            <Route path="admin/orders" element={<AdminOrders />} />
            <Route path="admin/pincodes" element={<PincodeList />} />
            <Route path="admin/productforyou" element={<ProductForYou />} />
            <Route path="admin/subscription-plans" element={<SubscriptionPlans />} />
            <Route path="admin/subscription-management" element={<SubscriptionManagement />} />
            <Route path="admin/analytics" element={<SellerAnalytics />} />
            <Route path="admin/sellers/applications" element={<SellerApplications />} />
          </Route>

          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPasssword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/adminlogin" element={<AdminLogin />} />
          <Route path="/become-seller" element={<SellerPlanSelection />} />
          <Route path="/seller-wizard" element={<PrivateRoute />}>
            <Route index element={<SellerWizardV2 />} />
          </Route>

          {/* Checkout Route */}
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* Seller Onboarding V2 Routes */}
          <Route path="/seller/apply" element={<PrivateRoute />}>
            <Route index element={<SellerWizardV2 />} />
          </Route>
          <Route path="/seller/status" element={<PrivateRoute />}>
            <Route index element={<ApplicationStatus />} />
          </Route>
          <Route path="/seller/dashboard" element={<PrivateRoute />}>
            <Route index element={<SellerDashboard />} />
          </Route>

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/returnPolicy" element={<ReturnPolicy />} />
          <Route path="/add-to-cart/:userId/:user_fullname" element={<AddToCartPage />} />

          <Route path="*" element={<Pagenotfound />} />
        </Routes>
        {/* React Query DevTools - only in development */}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
