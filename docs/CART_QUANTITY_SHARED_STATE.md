# Product card quantity controller and shared cart state

Every product card on the **website** and in the **Flutter app** now has the same quantity controller as the product page:

```
[ 🛒 Add to Cart ]   ── tap ──▶   [ −   6   + ]
```

Change the quantity anywhere (a card, the product page, the cart page) and every other place shows the new number. This works because each platform now has **one shared cart state** (a single source of truth) instead of each screen keeping its own copy.

---

## 1. The idea in one picture

```
                ┌────────────────────────────────────────────┐
  Home card ───▶│                                            │──▶ Home card
  Category  ───▶│   ONE cart store (per platform)            │──▶ Category / Search
  Search    ───▶│   productId → quantity                     │──▶ Wishlist
  Wishlist  ───▶│   • updates the UI instantly               │──▶ Product page
  Product   ───▶│   • syncs to the server 300 ms after the   │──▶ Cart page
  page          │     last tap (one request, not one per tap)│──▶ Header cart badge
  Cart page ───▶│   • rolls back if the server refuses       │
                └───────────────────┬────────────────────────┘
                                    │  debounced, one request at a time per product
                                    ▼
                    Server cart API (unchanged)
                    POST /carts/users/:id/cartq/:pid   set quantity (404 → add)
                    POST /carts/users/:id/cart         add new line
                    DELETE /carts/users/:id/cart/:pid  quantity reached 0
                    GET  /carts/users/:id/cart         load / refresh
```

**Screens never call the cart API for quantity changes themselves.** They ask the store, and every screen that shows the product re-renders from the store.

## 2. Rules (copied from the product page)

| Rule | Behaviour |
|---|---|
| Step size | `+`/`−` move by the product's `unitSet` (e.g. 6, 12, 18 …). **Add to Cart** starts at `unitSet`. |
| Stock | Can't go above `stock`. The card shows "Only N in stock"; the product page keeps its stock popup. |
| Instant UI | The number changes immediately (optimistic update). |
| Debounce | Server sync runs **300 ms after the last tap**, so tapping `+` five times sends one request. |
| Ordering | Requests for one product run one at a time, in order. A tap made during a request is sent after it. |
| Failure | If the server rejects a change, the number goes back to the last value the server confirmed and an error is shown. |
| Zero | `−` at `unitSet` removes the product (one `DELETE`); the card goes back to **Add to Cart**. |
| Logged out | Add to Cart sends the user to **login**; nothing is saved. |
| Out of stock | Card shows a disabled **Out of stock** button. |
| Card tap | Tapping the controller does **not** open the product page; tapping anywhere else on the card still does. |
| Opening the cart | The cart page first **flushes** any pending taps, so it never shows an outdated quantity. |

"Set" semantics: the store always sends the **final** quantity (`cartq`). If the product isn't in the server cart yet (404), it adds it. This avoids the server's "add = increment" double-counting.

---

## 3. Website (React + Zustand)

**Store:** `client/src/store/cart.store.js` (Zustand, persisted to `localStorage` as `cart-storage`).

Before this change the website had **two** cart states: a React Context (`context/cart.jsx`, used by the cart and product pages) and the Zustand store (used by the header badge). They could disagree. Now:

- **Zustand is the single source of truth.**
- `context/cart.jsx` is a thin **bridge**. `const [cart, setCart] = useCart()` still works everywhere but reads and writes the Zustand store. It also loads the cart on login and clears it locally on logout.

| Piece | File | Role |
|---|---|---|
| Store | `store/cart.store.js` | `getQuantity`, `setProductQuantity`, `stepProductQuantity`, `flushPending`, `applyServerQuantity`, `replaceFromServer`, `resetLocal`, plus the old actions (kept for compatibility) |
| Bridge | `context/cart.jsx` | old `useCart()` API on top of the store; sync on login, reset on logout |
| Controller | `components/CartQuantityControl/*` | Add to Cart ⇄ `[− qty +]`, bound to the store |
| Product card | `pages/ProductCard.jsx` | uses the controller (mobile and desktop layouts). Used on Home, Category, Search, Wishlist and "Products for you" |
| Product page | `components/ProductDetails/hooks/useCartOperations.js` | quantity now read from and written to the store; same return values, so `ProductDetails`/`QuantitySelector` are unchanged |
| Cart page | `pages/cart/CartPage.jsx` | flushes pending taps before loading; its server load/clear/edits update the store |
| Header | `components/Layout/Header.jsx` | badge already used the store; logout now calls `resetLocal()` |

A component subscribes like this, and re-renders only when **this product's** quantity changes:

```js
const quantity = useCartStore((s) =>
  s.cart.find((i) => (i.product?._id || i.product) === productId)?.quantity || 0
);
```

## 4. Flutter app (Provider + ChangeNotifier)

**Store:** `lib/shared/providers/cart_quantity_store.dart`, `CartQuantityStore extends ChangeNotifier`, registered once in `main.dart`'s `MultiProvider`. It loads the cart at startup and per user (cleared on logout or account switch).

| Piece | File | Role |
|---|---|---|
| Store | `shared/providers/cart_quantity_store.dart` | `quantityOf`, `setQuantity`, `step`, `flush`/`flushAll`, `applyServerQuantity`, `replaceAllFromServer`, `clearLocal`, `ensureLoaded`. Server access goes through a small `CartApi` interface (the real one is `HttpCartApi`), so the store can be unit-tested |
| Controller | `shared/widgets/cart_quantity_control.dart` | ADD ⇄ `[− qty +]`; listens with `context.select`, so only that control rebuilds |
| Product card | `features/home/productCard.dart` | controller added; the image now flexes in fixed-size grid cells so nothing overflows |
| Search results | `features/home/search.dart` | controller added to result tiles |
| Wishlist | `features/wishlist/wishlistPage.dart` | controller added to wishlist tiles |
| Product page | `viewmodels/product_view_model.dart`, `features/product/productDetails2.dart` | view model receives the store, listens to it, and sends `+`/`−` through it. **VIEW CART** waits for `flush()`. Widgets are unchanged |
| Cart page | `features/cart/cartPage.dart` | `flushAll()` before loading, then `replaceAllFromServer`; quantity edits call `applyServerQuantity`; clearing after an order calls `clearLocal()` |

After each successful sync the store calls `NotificationService.notifyCartUpdated()`, so the existing home cart badge refreshes as before.

The product card is used by: Home (section 2), sub-category, banner listing, explore, and "Suggested products" on the product page.

---

## 5. Example flow

1. **Home:** tap **Add to Cart** on "Gel pen box" (`unitSet` 6). The card shows `6` at once and the badge shows 1. 300 ms later: `cartq 6` → 404 → `add 6`.
2. Tap `+` three times quickly. The card shows `24` at once; one request `cartq 24`.
3. Open the product: the product page shows **24**. Tap `+` → **30** (the stock limit). One more `+` → stock message.
4. Go back: the home card shows **30**.
5. Tap `−` (24) and open the cart within 300 ms: the cart page flushes first and shows **24**.
6. Tap `−` in the cart page (18), then go back: the card shows **18**.
7. Tap `−` down to 0: the card shows **Add to Cart**, and one `DELETE` is sent.

## 6. Tests

- **Flutter:** 33 tests pass.
  - 12 unit tests for the store: debounce, `unitSet` steps, stock limit, logout, removal at 0, rollback on failure, server values not overwriting pending taps, flushing, in-order requests, merging rapid taps, user switch, clear.
  - 10 widget tests on the real `ProductCard` in a home-style grid:
    - 320 / 390 / 820 px screens at text scale 1.0 and 1.3: no overflow; ADD becomes the stepper
    - two cards plus another "page" share one quantity
    - stock message
    - out-of-stock card
    - product page view model and store stay in sync both ways
  - The 11 earlier checkout-note tests still pass.
  - `flutter analyze lib`: 0 errors.
- **Website:** 37 checks in Chrome against the production build, with a stateful fake cart API:
  - The full flow in section 5, including that rapid taps send exactly one request and that a pending change is flushed before the cart page loads.
  - 320 / 375 / 414 px layouts with no horizontal scroll.
  - Stock toast, logged-out redirect, a fresh load showing the server cart, and no JS errors.

## 7. Small fixes made along the way

- **App card price row:** it overflowed on 320 px phones (an existing issue). The price now scales down slightly instead.
- **Website logout:** `clearCart()` ran after `auth` was removed, so it did nothing and the previous user's cart stayed in the browser. Logout now calls `resetLocal()`, which only clears the browser copy and never touches the server cart.
- **Website cart page:** a failed cart load no longer wipes the quantities shown on product cards.
