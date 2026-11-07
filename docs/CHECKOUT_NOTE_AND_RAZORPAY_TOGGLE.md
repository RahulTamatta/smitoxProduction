# Checkout note + Razorpay on/off: how it works

Two admin controls, both under **Admin → Settings → App Content → "Checkout settings"**:

1. **Checkout note**: text the admin writes. It appears on the website cart and the Flutter app cart, directly **above the Place Order button**.
2. **Razorpay online payment** switch. When it is **OFF**, customers see only a **Place Order** button. The order is saved with payment method **"Order Placed"**, and the admin decides manually whether to collect by **GPay or COD**. The admin order modal is unchanged.

---

## 1. Where the settings live

The settings are stored on the existing `AppContent` document (the same one used for footer and policy text). Two fields were added:

| Field | Type | Default | Meaning |
|---|---|---|---|
| `checkoutNote` | String (max 5000 chars) | `""` | Note shown above Place Order. Empty = hidden. |
| `razorpayEnabled` | Boolean | `true` | `false` = "Place Order only" mode. |

Existing databases need **no migration**. A document without these fields behaves as Razorpay ON with no note, which is exactly how things worked before.

### API

| Method | Endpoint | Who | Returns |
|---|---|---|---|
| `GET` | `/api/v1/app-content/checkout-settings` | Public | `{ success, checkoutNote, razorpayEnabled }` (small, `no-store`) |
| `PUT` | `/api/v1/app-content/update-content` | Admin (existing route) | Now also accepts `checkoutNote` (string ≤ 5000) and `razorpayEnabled` (boolean). Wrong types → `400`. |

---

## 2. Admin flow

```
Admin → App Content → "Checkout settings" card (top of page)
   ├─ Razorpay switch  [●○]  + pill "Enabled" / "Disabled"
   │     Turning it OFF and pressing Save asks for confirmation first.
   ├─ Checkout note textarea (with a 0/5000 counter)
   └─ "Save app content" → PUT /app-content/update-content
```

Changes apply on the next cart load, so nothing has to be redeployed after you flip the switch.

---

## 3. Customer checkout flow

### Razorpay ON (normal)

Nothing changes: customers still see the payment dropdown (Razorpay / COD / Advance, based on their account's `order_type`). The only addition is the note above Place Order.

### Razorpay OFF

```
Customer opens cart
   │  GET /app-content/checkout-settings → razorpayEnabled: false
   ▼
Cart shows:  Total … | (note, if any) | [ Place Order ]     ← no payment dropdown
   │  tap Place Order
   ▼
POST /product/process-payment  { paymentMethod: "Order Placed", amount: 0, amountPending: <total> }
   │
   ▼  server
   • creates the order straight away (same path as COD: stock check, stock decrement, snapshot)
   • payment.paymentMethod = "Order Placed"
   • payment.transactionId = "MANUAL-<timestamp>-<n>"
   • status = "Pending", amount = 0, amountPending = total
   ▼
Customer is taken to My Orders
   ▼
Admin → Orders list: the Payment column shows "Order Placed"
   → admin contacts the customer and collects the payment by GPay or COD, outside the system
```

**The admin order modal is unchanged.** It already shows `payment.paymentMethod`, so these orders read **"Order Placed"** in the orders list, and the invoice prints "Mode of Payment: Order Placed".

### Server-side rules (enforced in `processPaymentController`)

The server re-reads the switch for every order, so the UI can't be used to get around it.

| Razorpay | Customer sends | Result |
|---|---|---|
| ON | `Razorpay` / `COD` / `Advance` | Same as before |
| ON | `Order Placed` | **400** "Online payment is available again. Please select a payment method…" (includes `razorpayEnabled: true`) |
| OFF | `Order Placed` | Order created as **Order Placed** |
| OFF | `COD` (e.g. an old app build) | Order created, **converted to "Order Placed"** |
| OFF | `Razorpay` / `Advance` (old app builds) | **400** "Online payment is currently unavailable…" (includes `razorpayEnabled: false`) |
| any | Admin placing an order *for* a customer (admin cart with `userId`) | Exempt; keeps the method the admin chose (COD) |

If the switch flips **while a cart is open**, the rejected order's response carries `razorpayEnabled`. The web and app carts re-fetch the settings and switch flow by themselves. The app also re-checks every time it returns to the foreground and on its regular profile refresh.

Razorpay payments that were already in progress when the switch was turned off still verify and complete. Seller subscription payments (`/api/v1/payment/*`) are **not** affected by this switch.

---

## 4. The note UI (long notes)

| | Website | Flutter app |
|---|---|---|
| Position | Directly above **Place Order** (below the dropdown when Razorpay is ON) | Directly above **Place Order** |
| Collapsed | First **4 lines** (CSS line-clamp; line breaks kept) | First **3 lines** (ellipsis) |
| "Show more" | Shown only when the text is actually cut off (measured live, updates on resize) | Shown only when the text is cut off (measured with the device's real width **and font-size setting**) |
| Full text | **Modal**: centred and scrollable on desktop/tablet, **full-screen on phones** | **Bottom sheet**: draggable (50% → 90%), scrollable, selectable text, respects notch / home-bar safe areas, "Got it" button |
| Empty note | Nothing rendered | Nothing rendered |

Why a bottom sheet in the app and a modal on the web: bottom sheets are the native mobile pattern (thumb-reachable, swipe to dismiss). On the web, a full-screen modal on phones and a centred one on desktop avoids cramped overlays.

The app's bottom cart panel (total, note, dropdown, button) is now wrapped in a scroll area capped at 60% of the screen height, plus a bottom safe area. With large system fonts or on small phones it scrolls instead of overflowing.

---

## 5. Files changed

**Server** (`smitoxProduction/server`)
- `models/appContentModel.js`: `checkoutNote`, `razorpayEnabled`
- `models/orderModel.js`: `"Order Placed"` added to `payment.paymentMethod` enum
- `controllers/appContentController.js`: `getCheckoutSettings()` helper, `getCheckoutSettingsController`, validation and saving of the new fields
- `routes/appContentRoutes.js`: `GET /checkout-settings`
- `controllers/productController.js`: Razorpay gating in `processPaymentController`; "Order Placed" handled in `getPaymentStatusController`

**Website** (`smitoxProduction/client/src`)
- `pages/Admin/AppContent.jsx` + `.css`: Checkout settings card (switch, note, confirm on disable)
- `components/CheckoutNote/CheckoutNote.jsx` + `.css`: new note component (clamp + modal)
- `pages/cart/CartPage.jsx`: loads settings, hides dropdown when OFF, sends `"Order Placed"`, shows the note above Place Order

**Flutter app** (`tests/`)
- `lib/features/cart/widgets/checkout_note_card.dart`: new note widget (clamp + bottom sheet)
- `lib/features/cart/cartPage.dart`: loads settings (on open, on resume, on refresh, after a rejected order); hides the dropdown when OFF; note above Place Order; the 6 copies of the "choose default payment method" logic are merged into `_defaultPaymentMethod()`; bottom panel made scroll- and safe-area-aware
- `test/checkout_note_card_test.dart`: widget tests

---

## 6. How it was tested

- **API (22 checks)**, real routes against an in-memory MongoDB, never the real database: defaults; auth (401/403); validation; ON/OFF behaviour for each payment method; stock decrement; old-app COD conversion; admin exemption; a non-admin can't use `userId` to bypass the switch.
- **Website in Chrome (45 checks)**, production build with a mocked API: desktop plus 320 / 360 / 414 px phones; dropdown hidden when OFF; note above Place Order; no horizontal scroll; Show more opens and closes the modal (full-screen on phones); payload is `Order Placed / 0 / total`; redirect to My Orders; short and empty notes; admin switch, confirm dialog, PUT body and 360 px admin layout; the cart switches flow when the admin re-enables Razorpay mid-session.
- **Flutter (11 widget tests)**: 320×568, 390×844 and 820×1180 screens at font scales 1.0 / 1.5 / 2.0. No overflow, Show more opens the full sheet, "Got it" closes it, empty and short notes behave. `flutter analyze` shows no errors.

---

## 7. Deploying

1. Deploy the **server** first. Both carts treat a missing settings endpoint as "Razorpay ON", so the order doesn't matter much, but the server is what enforces the switch.
2. Rebuild the **website** (`client/build` is committed): `cd client && npm run build`.
3. Release a new **app** build. Older app builds still work while Razorpay is ON. While it is OFF, an old build's COD order becomes "Order Placed", and its Razorpay/Advance attempt is refused with a message asking the customer to refresh or update the app.

## 8. Known issues found along the way (not changed)

- **Leaked admin CSS breaks Bootstrap modals site-wide.** `pages/Admin/sellerApplications.css` (`.modal { z-index: 1001 }`, `.btn-close { background: none }`) and `OrderModal.css` (`.modal-backdrop { z-index: 1040 !important }`) apply on every page. The backdrop ends up on top of the modal and the close "×" disappears. The new note modal works around this locally. The cart's existing **StockPopup** uses the same Bootstrap modal, so it is probably affected too (not tested in a browser).
- `PUT /app-content/update-content` also lets users with only the **`settings:read`** capability save changes, and that now includes the Razorpay switch. This was already the case; consider tightening it to `settings:write`.
- `getPaymentStatusController` isn't mounted on any route (it's dead code). It was updated anyway for consistency.
