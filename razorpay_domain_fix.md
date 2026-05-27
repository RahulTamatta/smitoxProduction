# Razorpay Domain Mismatch Issue Analysis

## Issue Summary

Razorpay is blocking payment attempts from `www.smitox.com` because the domain is not registered with your Merchant ID `FUJTPVr0mDMISD` in Razorpay's dashboard.

**Key Details from Error Email:**
- **Attempted Domain:** `www.smitox.com`
- **Originating URL:** `https://www.smitox.com/cart`
- **Merchant ID:** `FUJTPVr0mDMISD`

---

## Root Cause: Dashboard Config (Not Code)

After examining your codebase, I found that **your application does NOT have any hardcoded domain restrictions**. The issue is **entirely on the Razorpay dashboard configuration side**.

### Codebase Findings
The codebase uses **both** `www.smitox.com` and `smitox.com` interchangeably for images, API endpoints, and links. Razorpay automatically detects the domain where the checkout is initiated (`www.smitox.com`) and blocks it if only the non-www version is whitelisted.

---

## Technical Solution: Razorpay Dashboard Fix

### Step-by-Step Instructions

1.  **Login to Razorpay Dashboard**
    - Go to [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2.  **Switch to Live Mode**
    - Ensure you are in **Live Mode** (the Merchant ID in the error belongs to your Live account).
3.  **Navigate to Domain Settings**
    - Go to **Settings** → **Website and Apps** → **Websites** (or **Allowed Domains**).
4.  **Add BOTH Domain Variants**
    - Add `smitox.com`
    - Add `www.smitox.com`
5.  **Save and Wait**
    - Click **Save**. The changes are usually instant but may take up to 5 minutes to propagate.

### Why this happens?
Razorpay has a security feature that requires you to whitelist the exact domains from which payments can be accepted. Since your site is accessible at `https://www.smitox.com/cart`, but Razorpay only knows about `smitox.com`, it identifies this as a "Domain Mismatch".

---

## Next Steps & Recommendations

1.  **Standardize Domain Usage:** In the future, we should standardize the codebase to use one primary domain (either with or without `www`) via environment variables to avoid such mismatches.
2.  **Verify Webhooks:** While in the dashboard, ensure your webhook URL is also correctly configured for the `www` domain if applicable.
3.  **Test:** After saving the dashboard settings, retry a payment from `https://www.smitox.com/cart`.

---

**Status:** No code changes needed in the repository at this time. Only dashboard configuration is required.
