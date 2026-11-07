import { useCallback, useEffect } from "react";
import useCartStore from "../store/cart.store";
import { useAuth } from "./auth";

/**
 * Cart context bridge.
 *
 * The cart used to live in React Context state here, separate from the
 * Zustand store used by the header badge. Now the Zustand store
 * (store/cart.store.js) is the single source of truth; this file keeps the
 * old `const [cart, setCart] = useCart()` API working on top of it, so every
 * page (cart page, product page, product cards, header) shares one cart.
 */
const CartProvider = ({ children }) => {
  const [auth] = useAuth();
  const userId = auth?.user?._id;

  // Load the cart on login / user switch; clear local state on logout.
  useEffect(() => {
    if (userId) {
      useCartStore.getState().syncCart();
    } else {
      useCartStore.getState().resetLocal();
    }
  }, [userId]);

  return children;
};

// custom hook — same shape as before: [cart, setCart]
const useCart = () => {
  const cart = useCartStore((state) => state.cart);
  const setCart = useCallback((updater) => {
    useCartStore.setState((state) => {
      const next = typeof updater === "function" ? updater(state.cart) : updater;
      return { cart: Array.isArray(next) ? next : [] };
    });
  }, []);
  return [cart, setCart];
};

/** Send any pending quantity changes to the server and wait for them. */
const flushPendingCartChanges = () => useCartStore.getState().flushPending();

export { CartProvider, flushPendingCartChanges, useCart };
