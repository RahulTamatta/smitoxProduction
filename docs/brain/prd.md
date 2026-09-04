# Product Requirements Document (PRD)

## 1. Product Overview

### Product Name
Smitox B2B Wholesale

### Elevator Pitch
Smitox is a comprehensive B2B wholesale e-commerce platform designed to connect buyers and sellers seamlessly, offering features like multi-tier bulk pricing, subscription-based seller onboarding, and robust order management.

### Problem Statement
Traditional B2B wholesale transactions are often manual, fragmented, and lack transparency. Buyers struggle to find reliable suppliers with transparent bulk pricing, while sellers face challenges in managing inventory, processing large orders, and handling payments securely. Smitox solves this by providing a unified digital marketplace tailored for wholesale operations.

### Target Audience
- **Primary Users (Buyers):** Retailers, distributors, and business owners looking to source products in bulk at wholesale rates.
- **Secondary Users (Sellers):** Manufacturers, wholesalers, and large distributors who want to reach a broader B2B audience.
- **Tertiary Users (Admins):** Platform operators who oversee users, product quality, order fulfillment, and revenue.

### Goals
- **Business goals:** Increase GMV (Gross Merchandise Value) through streamlined bulk ordering, generate recurring revenue via seller subscriptions, and expand the user base.
- **User goals:** Provide a frictionless buying experience with transparent tiered pricing, and offer sellers an easy-to-use dashboard to manage their wholesale business.
- **Technical goals:** Ensure a scalable, secure, and highly available platform capable of handling concurrent transactions and real-time order tracking.

### Non Goals
- This version does not attempt to serve the B2C (Direct-to-Consumer) market.
- Complex bidding or auction systems for products are excluded from V1.

---

## 2. User Personas

### Buyer: Rahul (Retail Store Owner)
- **Age:** 35
- **Role:** Owner of a mid-sized electronics retail shop.
- **Pain Points:** Difficulty finding reliable wholesalers; opaque pricing structures; slow order processing.
- **Motivations:** Wants to maximize profit margins by buying at the best wholesale rates with reliable delivery.
- **Technical proficiency:** Moderate. Uses smartphone apps daily.
- **Success criteria:** Can easily compare bulk prices, place large orders securely, and track delivery in real-time.

### Seller: Amit (Wholesale Distributor)
- **Age:** 42
- **Role:** Operations Manager at a wholesale distribution company.
- **Pain Points:** Managing inventory across multiple channels; handling manual payment reconciliations; high platform commission fees on other sites.
- **Motivations:** Wants to reach a wider network of retail buyers and automate order management.
- **Technical proficiency:** Moderate to High.
- **Success criteria:** Can easily upload product catalogs with bulk pricing tiers, manage orders efficiently, and subscribe to a predictable seller plan.

---

## 3. User Stories

### Core Stories
- **As a Buyer,** I want to see tiered pricing based on quantity, so that I know exactly how much I save when buying in bulk.
- **As a Buyer,** I want to track my order status in real-time, so that I can plan my retail inventory accordingly.
- **As a Seller,** I want to set up my profile and choose a subscription plan, so that I can start listing products on the platform.
- **As a Seller,** I want to define bulk pricing tiers (e.g., Buy 10-50: ₹100, Buy 51-100: ₹90), so that I can incentivize larger orders.
- **As an Admin,** I want to review and approve seller applications, so that I can maintain the quality of suppliers on the platform.

### Secondary Stories
- **As a Buyer,** I want to receive order updates via WhatsApp, so that I don't have to constantly check the app.
- **As an Admin,** I want to feature specific products in a "Products For You" section, so that I can drive sales to high-margin items.

---

## 4. Functional Requirements

### 1. Multi-tier Bulk Pricing
- **Description:** Sellers can define price breaks based on order quantities.
- **Acceptance Criteria:** Buyers see a clear table showing "Quantity Range" vs "Price per Unit". Cart automatically applies the correct price based on quantity.
- **Priority:** P0

### 2. Seller Subscription Management
- **Description:** A robust lifecycle management for seller onboarding, plan selection, and payment.
- **Acceptance Criteria:** Supports draft, submitted, approved, active, suspended states. Secure payment integration (Razorpay) with webhook idempotency.
- **Priority:** P0

### 3. Order Management & Tracking
- **Description:** End-to-end order processing from placement to delivery.
- **Acceptance Criteria:** Supports statuses: Pending, Confirmed, Accepted, Dispatched, Delivered, Cancelled. Generates PDF invoices automatically.
- **Priority:** P0

### 4. Admin Dashboard
- **Description:** Central control panel for platform operators.
- **Acceptance Criteria:** Admins can view metrics, manage users, approve sellers, manage product catalogs, and curate "Products For You".
- **Priority:** P1

---

## 5. Feature List

| Feature | Description | Priority | Included in V1 |
|----------|-------------|-----------|----------------|
| User Auth | Registration, Login, Forgot Password | P0 | Yes |
| Product Catalog | Search, Filter, Categories, Subcategories | P0 | Yes |
| Bulk Pricing | Tiered pricing based on quantity | P0 | Yes |
| Cart & Checkout | Manage cart items, apply bulk prices, COD/Online | P0 | Yes |
| Order Management | Status tracking, PDF invoices, WhatsApp alerts | P0 | Yes |
| Admin Panel | Manage users, products, orders, metrics | P1 | Yes |
| Seller Onboarding | Application flow, Plan selection, Payment | P0 | Yes |
| "Products For You" | Admin curated featured products list | P2 | Yes |

---

## 6. Business Model
- **Seller Subscriptions:** Sellers pay a recurring subscription fee (monthly, quarterly, yearly) to list products and access platform features. This provides predictable, recurring revenue.
- **Transaction Flow:** The platform facilitates the transaction between buyer and seller. Payments can be processed via Razorpay (Online) or Cash on Delivery (COD).

---

## 7. Risks

### Technical Risks
- Concurrency issues during checkout (e.g., inventory overselling).
- Webhook failures from the payment gateway leading to inconsistent subscription states.
- *Mitigation:* Implementing distributed locking and transaction-safe operations in MongoDB.

### Business Risks
- Low seller adoption if the subscription fee is perceived as too high initially.
- *Mitigation:* Offer a freemium model or extended grace periods for early adopters.

### UX Risks
- Complex pricing tiers confusing buyers.
- *Mitigation:* Displaying a very clear, easy-to-read pricing table on the product details page.