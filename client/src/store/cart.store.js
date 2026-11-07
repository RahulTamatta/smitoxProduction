import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

/**
 * Cart Store (Zustand) — the single source of truth for the cart on the website.
 *
 * Everything reads/writes the same `cart` array:
 *   - product cards (Home, Category, Search, Wishlist, "Products for you")
 *   - product page (useCartOperations)
 *   - cart page + anything using `useCart()` from context/cart (bridged here)
 *   - header cart badge
 *
 * Quantity changes follow the product page rules: steps of `unitSet`, stock
 * limit, instant (optimistic) UI, a 300 ms debounced server sync per product,
 * requests serialised per product, and rollback to the last server value on
 * failure.
 */

export const QUANTITY_SYNC_DEBOUNCE_MS = 300;

// Sync bookkeeping lives outside React state (it is never rendered/persisted).
const engine = {
  timers: new Map(), // productId -> timeout id
  inflight: new Map(), // productId -> Promise (serialised chain)
  serverQty: new Map(), // productId -> last quantity confirmed by server
  requestIds: new Map(), // productId -> latest request id
  debounceMs: QUANTITY_SYNC_DEBOUNCE_MS,
};

const idOf = (item) => item?.product?._id || item?.product;

const readUserId = () => {
  try {
    const auth = localStorage.getItem('auth');
    if (auth) return JSON.parse(auth)?.user?._id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
  }
  return null;
};

const hasPending = (productId) =>
  engine.timers.has(productId) || engine.inflight.has(productId);

const resetEngine = () => {
  engine.timers.forEach((t) => clearTimeout(t));
  engine.timers.clear();
  engine.serverQty.clear();
  engine.requestIds.clear();
};

const useCartStore = create(
  persist(
    (set, get) => {
      /** Put `quantity` of `product` into the local cart array (0 removes). */
      const writeLocal = (product, productId, quantity) => {
        set((state) => {
          const cart = Array.isArray(state.cart) ? state.cart : [];
          const exists = cart.some((item) => idOf(item) === productId);
          if (quantity <= 0) {
            return { cart: cart.filter((item) => idOf(item) !== productId) };
          }
          if (exists) {
            return {
              cart: cart.map((item) =>
                idOf(item) === productId
                  ? { ...item, quantity, product: typeof item.product === 'object' ? item.product : product }
                  : item
              ),
            };
          }
          return { cart: [...cart, { _id: `local-${productId}`, product, quantity, bulkProductDetails: [] }] };
        });
      };

      /** Send the current local quantity of a product to the server. */
      const performSync = async (productId) => {
        const userId = get().getUserId();
        if (!userId) return;
        const item = get().cart.find((i) => idOf(i) === productId);
        const target = item ? item.quantity : 0;
        const confirmed = engine.serverQty.get(productId) ?? 0;
        if (target === confirmed) return;

        const requestId = (engine.requestIds.get(productId) || 0) + 1;
        engine.requestIds.set(productId, requestId);
        try {
          if (target <= 0) {
            await api.delete(`/carts/users/${userId}/cart/${productId}`);
          } else {
            try {
              // "Set" semantics: update the line, or add it if not there yet.
              await api.post(`/carts/users/${userId}/cartq/${productId}`, { quantity: target });
            } catch (error) {
              if (error?.response?.status !== 404) throw error;
              await api.post(`/carts/users/${userId}/cart`, {
                productId,
                quantity: target,
                bulkProductDetails: {},
              });
            }
          }
          engine.serverQty.set(productId, target);
          set({ error: null });
        } catch (error) {
          const current = get().cart.find((i) => idOf(i) === productId)?.quantity ?? 0;
          const isLatest = engine.requestIds.get(productId) === requestId;
          if (isLatest && current === target && !engine.timers.has(productId)) {
            // Roll back to what the server has.
            writeLocal(item?.product, productId, confirmed);
          }
          set({
            error: error?.response?.data?.message || error?.message || 'Failed to update cart',
          });
        }
      };

      const syncNow = (productId) => {
        const timer = engine.timers.get(productId);
        if (timer) {
          clearTimeout(timer);
          engine.timers.delete(productId);
        }
        const previous = engine.inflight.get(productId) || Promise.resolve();
        const current = previous
          .then(() => performSync(productId))
          .finally(() => {
            if (engine.inflight.get(productId) === current) engine.inflight.delete(productId);
          });
        engine.inflight.set(productId, current);
        return current;
      };

      return {
        // State
        cart: [],
        isLoading: false,
        error: null,

        // ───────── Quantity API used by product cards + product page ─────────

        /** Quantity of a product in the cart (0 if absent). */
        getQuantity: (productId) =>
          get().cart.find((item) => idOf(item) === productId)?.quantity || 0,

        /**
         * Set the quantity for a product. Updates the UI immediately and syncs
         * to the server after a short debounce.
         * Returns 'ok' | 'notLoggedIn' | 'exceedsStock' | 'unavailable'.
         */
        setProductQuantity: (product, quantity) => {
          const productId = product?._id;
          if (!productId) return 'unavailable';
          if (!get().getUserId()) return 'notLoggedIn';
          const stock = Number(product.stock ?? 0);
          const next = Math.max(0, Math.round(quantity));
          if (next > stock) return 'exceedsStock';
          if (next === get().getQuantity(productId)) return 'ok';

          writeLocal(product, productId, next);

          const existing = engine.timers.get(productId);
          if (existing) clearTimeout(existing);
          engine.timers.set(
            productId,
            setTimeout(() => {
              engine.timers.delete(productId);
              syncNow(productId);
            }, engine.debounceMs)
          );
          return 'ok';
        },

        /** One `unitSet` step up or down (the +/− buttons). */
        stepProductQuantity: (product, increase) => {
          const unitSet = Math.max(1, Number(product?.unitSet) || 1);
          const current = get().getQuantity(product?._id);
          return get().setProductQuantity(product, current + (increase ? unitSet : -unitSet));
        },

        /** Send pending changes for one product now and wait. */
        flushProduct: (productId) => {
          if (engine.timers.has(productId)) return syncNow(productId);
          return engine.inflight.get(productId) || Promise.resolve();
        },

        /** Send every pending change now (before reading the server cart). */
        flushPending: () => {
          const ids = new Set([...engine.timers.keys(), ...engine.inflight.keys()]);
          return Promise.all([...ids].map((id) => get().flushProduct(id)));
        },

        /**
         * The server reports `quantity` for a product (product page initial
         * fetch, cart page edits). Ignored while a local change is pending.
         */
        applyServerQuantity: (product, quantity) => {
          const productId = product?._id || product;
          if (!productId || hasPending(productId)) return;
          const q = Math.max(0, Number(quantity) || 0);
          engine.serverQty.set(productId, q);
          if (get().getQuantity(productId) !== q) {
            const existing = get().cart.find((i) => idOf(i) === productId)?.product;
            writeLocal(typeof product === 'object' ? product : existing, productId, q);
          }
        },

        /** Clear local state only (logout / user switch). Never touches the server. */
        resetLocal: () => {
          resetEngine();
          set({ cart: [], error: null });
        },

        // ───────── Legacy actions (kept for existing callers) ─────────

        addToCart: async (product, quantity) => {
          if (!get().getUserId()) {
            set({ error: 'Please login to add items to cart' });
            return false;
          }
          const step = quantity || Math.max(1, Number(product?.unitSet) || 1);
          const result = get().setProductQuantity(product, get().getQuantity(product?._id) + step);
          if (result !== 'ok') return false;
          await get().flushProduct(product._id);
          return get().getQuantity(product._id) > 0;
        },

        removeFromCart: async (productId) => {
          const product = get().cart.find((i) => idOf(i) === productId)?.product || { _id: productId, stock: 0 };
          get().setProductQuantity({ ...product, _id: productId }, 0);
          await get().flushProduct(productId);
          return get().getQuantity(productId) === 0;
        },

        increaseQuantity: async (productId, amount) => {
          const item = get().cart.find((i) => idOf(i) === productId);
          if (!item) return false;
          const step = amount || Math.max(1, Number(item.product?.unitSet) || 1);
          const newQuantity = item.quantity + step;
          if (newQuantity > item.product.stock) {
            set({ error: 'Insufficient stock' });
            return false;
          }
          get().setProductQuantity(item.product, newQuantity);
          return { productId, quantity: newQuantity };
        },

        decreaseQuantity: async (productId, amount) => {
          const item = get().cart.find((i) => idOf(i) === productId);
          if (!item) return false;
          const step = amount || Math.max(1, Number(item.product?.unitSet) || 1);
          const newQuantity = Math.max(0, item.quantity - step);
          get().setProductQuantity(item.product, newQuantity);
          return newQuantity > 0 ? { productId, quantity: newQuantity } : true;
        },

        setQuantity: async (productId, quantity) => {
          const item = get().cart.find((i) => idOf(i) === productId);
          if (!item) return false;
          const result = get().setProductQuantity(item.product, quantity);
          if (result === 'exceedsStock') {
            set({ error: 'Insufficient stock' });
            return false;
          }
          await get().flushProduct(productId);
          return true;
        },

        /** Empty the cart on the server and locally (after placing an order). */
        clearCart: async () => {
          const userId = get().getUserId();
          resetEngine();
          const previousCart = [...get().cart];
          set({ cart: [] });
          if (!userId) return true;
          try {
            await api.delete(`/carts/users/${userId}/cart`);
            return true;
          } catch (error) {
            set({ cart: previousCart, error: error.message });
            return false;
          }
        },

        /**
         * Load the cart from the server (login, page load). Pending local
         * changes are sent first and are never overwritten.
         */
        syncCart: async () => {
          const userId = get().getUserId();
          if (!userId) {
            get().resetLocal();
            return;
          }
          set({ isLoading: true });
          try {
            await get().flushPending();
            const { data } = await api.get(`/carts/users/${userId}/cart`);
            if (get().getUserId() !== userId) return; // user changed meanwhile
            get().replaceFromServer((data.cart || []).filter((item) => item && item.product));
            set({ isLoading: false });
          } catch (error) {
            set({ error: error.message, isLoading: false });
          }
        },

        /** Replace the cart with server items, keeping products with pending local changes. */
        replaceFromServer: (serverItems) => {
          const items = Array.isArray(serverItems) ? serverItems : [];
          const serverIds = new Set();
          items.forEach((item) => {
            const id = idOf(item);
            serverIds.add(id);
            if (!hasPending(id)) engine.serverQty.set(id, item.quantity);
          });
          set((state) => {
            const pendingLocal = (state.cart || []).filter((item) => hasPending(idOf(item)));
            const pendingIds = new Set(pendingLocal.map(idOf));
            const fromServer = items.filter((item) => !pendingIds.has(idOf(item)));
            [...engine.serverQty.keys()].forEach((id) => {
              if (!serverIds.has(id) && !hasPending(id)) engine.serverQty.set(id, 0);
            });
            return { cart: [...fromServer, ...pendingLocal.filter((i) => i.quantity > 0)] };
          });
        },

        getUserId: () => readUserId(),

        getTotalPrice: () => {
          const { cart } = get();
          return cart.reduce((total, item) => {
            if (!item || !item.product) return total;
            const price = getPriceForProduct(item.product, item.quantity);
            return total + price * item.quantity;
          }, 0);
        },

        getItemCount: () => get().cart.length,
      };
    },
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);

/** Test hook: shorten the debounce. */
export const __setQuantityDebounceForTests = (ms) => {
  engine.debounceMs = ms;
};

/**
 * Helper function to get price based on quantity and bulk pricing
 */
const getPriceForProduct = (product, quantity) => {
  if (!product) return 0;

  const unitSet = product.unitSet || 1;

  if (product.bulkProducts && product.bulkProducts.length > 0) {
    const sortedBulkProducts = [...product.bulkProducts]
      .filter((bp) => bp && bp.minimum)
      .sort((a, b) => b.minimum - a.minimum);

    if (sortedBulkProducts.length > 0 && quantity >= sortedBulkProducts[0].minimum * unitSet) {
      return parseFloat(sortedBulkProducts[0].selling_price_set);
    }

    const applicableBulk = sortedBulkProducts.find(
      (bp) => quantity >= bp.minimum * unitSet && (!bp.maximum || quantity <= bp.maximum * unitSet)
    );

    if (applicableBulk) {
      return parseFloat(applicableBulk.selling_price_set);
    }
  }

  return parseFloat(product.perPiecePrice || product.price || 0);
};

export default useCartStore;
