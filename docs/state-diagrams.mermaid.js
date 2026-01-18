/**
 * Mermaid State Diagram for Subscription System
 * Render at: https://mermaid.live/
 */

/*
# Application Status State Diagram

```mermaid
stateDiagram-v2
    [*] --> draft: Create Application

    draft --> submitted: User Submits
    
    submitted --> under_review: Admin Opens
    submitted --> rejected: Admin Rejects
    
    under_review --> approved: Admin Approves (Free Plan)
    under_review --> approved_pending_payment: Admin Approves (Paid Plan)
    under_review --> rejected: Admin Rejects
    
    approved --> active: Automatic
    
    approved_pending_payment --> active: Payment Success
    approved_pending_payment --> approved_payment_failed: Payment Failed
    approved_pending_payment --> cancelled: User Cancels
    
    approved_payment_failed --> approved_pending_payment: Retry Payment
    approved_payment_failed --> payment_retry_exhausted: Max Retries
    approved_payment_failed --> cancelled: User Cancels
    
    payment_retry_exhausted --> approved_pending_payment: Admin Override
    payment_retry_exhausted --> cancelled: Timeout
    
    active --> expiring_soon: 7 Days Before Expiry
    active --> suspended: Admin Suspends
    active --> cancelled: User Cancels
    
    expiring_soon --> active: User Renews
    expiring_soon --> expired: No Renewal
    expiring_soon --> suspended: Admin Suspends
    
    expired --> active: User Renews
    expired --> grace_period: Enter Grace Period
    
    grace_period --> active: User Renews
    grace_period --> suspended: Grace Ended (Downgrade)
    
    suspended --> active: Admin Reactivates
    
    rejected --> draft: User Reapplies
    
    cancelled --> [*]
```

# Payment Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as Backend API
    participant RZ as Razorpay
    participant WH as Webhook Handler
    participant DB as Database

    %% Admin Approval
    Note over API: Admin approves application
    API->>RZ: Create Order
    RZ-->>API: Order ID
    API->>DB: Save order, status = pending_payment
    API-->>F: Checkout details

    %% User Payment
    U->>F: Click Pay
    F->>RZ: Open Checkout
    U->>RZ: Enter payment details
    RZ->>RZ: Process payment
    
    par Synchronous Path
        RZ-->>F: Payment success callback
        F->>API: POST /verify-payment
        API->>API: Verify signature
        API->>DB: Acquire lock
        API->>DB: Begin transaction
        API->>DB: Update Application (active)
        API->>DB: Create/Update Profile
        API->>DB: Update User (seller role)
        API->>DB: Commit transaction
        API->>DB: Release lock
        API-->>F: Success + token version
        F->>U: Redirect to dashboard
    and Asynchronous Path
        RZ->>WH: Webhook: payment.captured
        WH->>DB: Check idempotency
        alt Already processed
            WH-->>RZ: 200 OK (skip)
        else Not processed
            WH->>DB: Store webhook event
            WH->>DB: Acquire lock
            WH->>DB: Check application status
            alt Already active
                WH->>DB: Release lock (idempotent skip)
            else Not active
                WH->>DB: Activate subscription
            end
            WH-->>RZ: 200 OK
        end
    end
```

# Reconciliation Flow

```mermaid
flowchart TD
    START([Every 5 Minutes]) --> FIND[Find pending payments > 5 min old]
    FIND --> LOOP{For each application}
    
    LOOP --> FETCH[Fetch order from Razorpay]
    FETCH --> CHECK{Order status?}
    
    CHECK -->|paid| VERIFY[Check if webhook processed]
    CHECK -->|expired| FAIL[Mark as failed]
    CHECK -->|pending| SKIP[Skip, still waiting]
    
    VERIFY --> PROCESSED{Already processed?}
    PROCESSED -->|Yes| SKIP
    PROCESSED -->|No| ACTIVATE[Activate subscription]
    
    ACTIVATE --> NEXT
    FAIL --> NEXT
    SKIP --> NEXT[Next application]
    NEXT --> LOOP
    
    LOOP -->|Done| INCOMPLETE[Find incomplete activations]
    INCOMPLETE --> FIX[Fix user roles]
    FIX --> END([Complete])
```

# Circuit Breaker State Diagram

```mermaid
stateDiagram-v2
    [*] --> CLOSED
    
    CLOSED --> CLOSED: Success (reset failures)
    CLOSED --> CLOSED: Failure (failures++)
    CLOSED --> OPEN: failures >= threshold
    
    OPEN --> OPEN: Reject all calls
    OPEN --> HALF_OPEN: timeout elapsed
    
    HALF_OPEN --> CLOSED: 2 consecutive successes
    HALF_OPEN --> OPEN: Any failure
```

*/

// Export for documentation generation
export const diagrams = {
    applicationStates: 'stateDiagram-v2...',
    paymentFlow: 'sequenceDiagram...',
    reconciliation: 'flowchart TD...',
    circuitBreaker: 'stateDiagram-v2...',
};

export default diagrams;
