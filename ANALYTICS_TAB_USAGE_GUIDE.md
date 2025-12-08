# Analytics Tab - User Guide

## Overview
The Analytics tab in Subscription Management provides comprehensive insights into seller applications, approvals, and active subscriptions.

## Accessing Analytics

### Method 1: Via Menu
1. Click **Subscription Management** in the sidebar
2. Click **Analytics** in the dropdown submenu
3. Or click the **Analytics** tab button

### Method 2: Direct URL
Navigate to: `http://localhost:3000/dashboard/admin/subscription-management?tab=analytics`

### Method 3: From Analytics Menu Item
Click **Analytics** in the main admin menu (if you have `analytics:read` capability)
- This redirects to the Analytics tab in Subscription Management

## Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Subscription Management                                      │
│ Create, manage, and monitor subscription plans               │
└─────────────────────────────────────────────────────────────┘

┌─ Tabs ──────────────────────────────────────────────────────┐
│ All Plans | Active | Inactive | Subscriptions | Analytics   │
└─────────────────────────────────────────────────────────────┘

┌─ Capability Warnings (if applicable) ────────────────────────┐
│ ⚠ Your account lacks analytics:read. Totals may fail...     │
│ ⚠ Your account lacks sellers:applications:read. Lists...    │
└─────────────────────────────────────────────────────────────┘

┌─ Filters Section ────────────────────────────────────────────┐
│ From: [date]  To: [date]  Group By: [Day▼]  [Apply]        │
└─────────────────────────────────────────────────────────────┘

┌─ KPI Cards ──────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────┐ │
│ │ Applied      │ │ Accepted     │ │ Rejected     │ │Active│ │
│ │ (distinct)   │ │ (distinct)   │ │ (deduped)    │ │Subs  │ │
│ │              │ │              │ │              │ │      │ │
│ │      42      │ │      38      │ │       4      │ │  35  │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────┘ │
└─────────────────────────────────────────────────────────────┘

┌─ Recently Applied (Submitted) ───────────────────────────────┐
│ Name              │ Email              │ Plan      │ Submitted│
│ John Doe          │ john@example.com   │ Free Plan │ 12/8/25  │
│ Jane Smith        │ jane@example.com   │ Pro Plan  │ 12/7/25  │
└─────────────────────────────────────────────────────────────┘

┌─ Approved (including Pending Payment) ───────────────────────┐
│ Name              │ Email              │ Plan      │ Approved │
│ Alice Johnson     │ alice@example.com  │ Free Plan │ 12/7/25  │
│ Bob Wilson        │ bob@example.com    │ Pro Plan  │ 12/6/25  │
└─────────────────────────────────────────────────────────────┘

┌─ Active Subscriptions & History ─────────────────────────────┐
│ Name              │ Plan      │ Start    │ Expiry   │ Renewals│
│ Alice Johnson     │ Free Plan │ 12/7/25  │ 1/6/26   │    1    │
│ Charlie Brown     │ Pro Plan  │ 12/1/25  │ 1/1/26   │    2    │
└─────────────────────────────────────────────────────────────┘
```

## Features Explained

### 1. Capability Warnings
If you see warning messages, it means your admin account lacks certain permissions:

**Warning: "Your account lacks analytics:read"**
- You cannot fetch KPI totals
- The KPI cards will show "-" (no data)
- Ask your super admin to grant `analytics:read` capability

**Warning: "Your account lacks sellers:applications:read"**
- You cannot fetch application lists
- The tables will be empty
- Ask your super admin to grant `sellers:applications:read` capability

### 2. Filters Section

#### **From Date**
- Select the start date for your analytics range
- Default: 29 days ago
- Format: YYYY-MM-DD

#### **To Date**
- Select the end date for your analytics range
- Default: Today
- Format: YYYY-MM-DD

#### **Group By**
- **Day**: Show daily aggregation (default)
- **Week**: Show weekly aggregation
- **Month**: Show monthly aggregation

#### **Apply Button**
- Click to fetch data with selected filters
- Shows "Loading..." while fetching
- Updates all KPI cards and tables

### 3. KPI Cards

#### **Applied (distinct)**
- **Definition**: Number of unique users who submitted applications
- **Time Range**: Within selected date range
- **Use Case**: Track new seller interest
- **Example**: 42 unique users applied in the last 30 days

#### **Accepted (distinct)**
- **Definition**: Number of unique users approved (first approval only)
- **Time Range**: Within selected date range
- **Use Case**: Track approval rate
- **Example**: 38 unique users were approved

#### **Rejected (deduped)**
- **Definition**: Number of unique users rejected (who didn't reapply successfully)
- **Time Range**: Within selected date range
- **Use Case**: Track rejection rate
- **Example**: 4 users were rejected and didn't reapply

#### **Active Subscriptions (now)**
- **Definition**: Current number of active subscriptions
- **Time Range**: Not affected by date filters (always current)
- **Use Case**: Monitor current seller base
- **Example**: 35 sellers have active subscriptions right now

### 4. Recently Applied (Submitted)

**Purpose**: See sellers who just submitted their applications

**Columns**:
- **Name**: Seller's full name
- **Email**: Contact email
- **Plan**: Selected subscription plan
- **Submitted**: Application submission date/time

**Actions**:
- Click "View" to see full application details
- Click "Approve" to approve the application
- Click "Reject" to reject the application

**Sorting**: Newest submissions first

### 5. Approved (including Pending Payment)

**Purpose**: See sellers whose applications were approved

**Columns**:
- **Name**: Seller's full name
- **Email**: Contact email
- **Plan**: Selected subscription plan
- **Approved At**: Approval date/time

**Status Breakdown**:
- **Approved**: Free plan approved (activated immediately)
- **Approved (Pending Payment)**: Paid plan approved (waiting for payment)

**Sorting**: Most recently approved first

### 6. Active Subscriptions & History

**Purpose**: See sellers with active subscriptions and their renewal history

**Columns**:
- **Name**: Seller's full name (with email below)
- **Plan**: Current subscription plan
- **Plan Start**: When the subscription started
- **Plan Expiry**: When the subscription expires
- **Renewals**: Number of times the subscription was renewed

**Use Cases**:
- Monitor subscription lifecycle
- Identify sellers nearing expiry
- Track renewal patterns
- Identify high-value long-term sellers

## Common Tasks

### Task 1: Check New Applications
1. Go to Analytics tab
2. Set "From" to today's date
3. Set "To" to today's date
4. Click "Apply"
5. Check "Recently Applied (Submitted)" table
6. Review and approve/reject applications

### Task 2: Monitor Approval Rate
1. Go to Analytics tab
2. Set date range (e.g., last 7 days)
3. Note the KPI cards:
   - **Applied**: Total applications
   - **Accepted**: Approved applications
   - **Calculate Rate**: Accepted / Applied × 100%
4. Example: 38 accepted / 42 applied = 90.5% approval rate

### Task 3: Track Active Sellers
1. Go to Analytics tab
2. Check "Active Subscriptions (now)" KPI card
3. Click "Active Subscriptions & History" table
4. Review renewal history for each seller
5. Identify sellers with multiple renewals (loyal customers)

### Task 4: Find Expiring Subscriptions
1. Go to Analytics tab
2. Check "Active Subscriptions & History" table
3. Look for "Plan Expiry" dates
4. Identify sellers expiring in next 7 days
5. Consider sending renewal reminders

### Task 5: Compare Time Periods
1. Go to Analytics tab
2. Set "From" and "To" for first period
3. Click "Apply" and note the numbers
4. Change dates to second period
5. Click "Apply" again
6. Compare KPI cards to see trends

## Tips & Best Practices

### ✅ Do's
- **Use date ranges** to track trends over time
- **Check warnings** to ensure you have proper permissions
- **Review renewal history** to identify loyal sellers
- **Monitor rejection rate** to improve application quality
- **Track active subscriptions** to understand seller base health
- **Use "Group By"** to see patterns (daily/weekly/monthly)

### ❌ Don'ts
- **Don't ignore warnings** - they indicate missing permissions
- **Don't assume all "Approved" are active** - some may be pending payment
- **Don't confuse "Applied" with "Accepted"** - applied includes rejected
- **Don't forget to click "Apply"** - filters don't auto-update

## Troubleshooting

### Problem: KPI cards show "-"
**Solution**: 
- Check for capability warning
- Ensure you have `analytics:read` capability
- Ask super admin to grant permission
- Refresh the page

### Problem: Tables are empty
**Solution**:
- Check for capability warning
- Ensure you have `sellers:applications:read` capability
- Verify date range has data
- Try expanding date range
- Ask super admin to grant permission

### Problem: Data looks outdated
**Solution**:
- Click "Apply" button to refresh
- Check date range is correct
- Verify data in database hasn't changed
- Try different date range

### Problem: Can't approve/reject applications
**Solution**:
- Ensure you have `sellers:applications:approve` capability
- Ensure you have `sellers:applications:reject` capability
- Ask super admin to grant permissions
- Try refreshing the page

## Permissions Required

| Feature | Capability | Required |
|---------|-----------|----------|
| View KPI Cards | `analytics:read` | Yes |
| View Tables | `sellers:applications:read` | Yes |
| Approve Applications | `sellers:applications:approve` | Yes |
| Reject Applications | `sellers:applications:reject` | Yes |

## Data Refresh
- Data updates automatically when you click "Apply"
- No real-time updates (refresh manually)
- Changes take effect immediately after approval/rejection

## Export & Reporting
Currently, you can:
- ✅ View data in tables
- ✅ Copy data manually
- ✅ Take screenshots

Future enhancements:
- 📋 Export to CSV
- 📊 Generate PDF reports
- 📈 Chart visualizations
- 🔄 Scheduled reports

## Support
If you encounter issues:
1. Check the troubleshooting section above
2. Verify your permissions
3. Contact your super admin
4. Check browser console for errors (F12)
