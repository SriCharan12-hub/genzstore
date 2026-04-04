# Payment Gateway Architecture & Integration Guide

## 1. System Architecture

### High-Level Payment Flow Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌─────────────┐        ┌─────────────┐        ┌──────────────┐              │
│  │  Cart Page  │───────▶│  Checkout   │───────▶│  Razorpay    │              │
│  │  Component  │        │  Component  │        │  Modal       │              │
│  └─────────────┘        └─────────────┘        └──────────────┘              │
│         ▲                      │                      │                        │
│         │                      │ 1. Create Order     │ 2. Open Modal          │
│         │                      │                      │                        │
│         └──────────────────────┼──────────────────────┼────────────────────┐   │
│                                │                      │                    │   │
│                    ┌───────────▼─────────────────────▼────────┐            │   │
│                    │    Razorpay Checkout Page               │            │   │
│                    │   (Hosted by Razorpay)                  │            │   │
│                    │                                          │            │   │
│                    │   User enters payment details            │            │   │
│                    └───────────┬──────────────────────────────┘            │   │
│                                │                                            │   │
│                    ┌───────────▼──────────┐                                │   │
│                    │ Payment Processing   │                                │   │
│                    │ (Razorpay Service)   │                                │   │
│                    └───────────┬──────────┘                                │   │
│                                │ 3. Payment Result                         │   │
│                    ┌───────────▼──────────────────┐                        │   │
│                    │ Razorpay API Response        │                        │   │
│                    │ - order_id                   │                        │   │
│                    │ - payment_id                 │                        │   │
│                    │ - signature                  │                        │   │
│                    └───────────┬──────────────────┘                        │   │
│                                │                                            │   │
│                                └────────┬─────────────────────────────────┘   │
│                                         │ 4. Verify Payment                    │
│                                         ▼                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                            BACKEND (Node.js/Express)                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│   ┌──────────────────────────────────────────────────────────────────┐       │
│   │ POST /api/payment/verify-payment                                 │       │
│   │                                                                   │       │
│   │ 1. Extract: razorpay_order_id, razorpay_payment_id,             │       │
│   │    razorpay_signature from request                              │       │
│   │                                                                   │       │
│   │ 2. Create HMAC-SHA256 hash:                                      │       │
│   │    hash = HMAC_SHA256(                                           │       │
│   │      order_id|payment_id,                                       │       │
│   │      RAZORPAY_SECRET                                            │       │
│   │    )                                                             │       │
│   │                                                                   │       │
│   │ 3. Compare hash === received_signature                           │       │
│   │    ✓ If match: Success (payment is authentic)                   │       │
│   │    ✗ If no match: Failure (potential tampering)                │       │
│   │                                                                   │       │
│   └────────┬─────────────────────────────────────────────────────────┘       │
│            │                                                                   │
│            │ 5. If Verified ✓                                                 │
│            ▼                                                                   │
│   ┌──────────────────────────────────────────────────────────────────┐       │
│   │ POST /api/payment/orders                                         │       │
│   │                                                                   │       │
│   │ - Save order to MongoDB                                          │       │
│   │ - Link payment_id to order                                       │       │
│   │ - Update inventory                                               │       │
│   │ - Clear user's cart                                              │       │
│   │                                                                   │       │
│   └────────┬─────────────────────────────────────────────────────────┘       │
│            │                                                                   │
│            ▼                                                                   │
│   ┌──────────────────────────────────────────────────────────────────┐       │
│   │ MongoDB Database                                                 │       │
│   │                                                                   │       │
│   │ Orders Collection:                                               │       │
│   │ {                                                                │       │
│   │   _id: ObjectId,                                                 │       │
│   │   userId: ObjectId,                                              │       │
│   │   items: [...],                                                  │       │
│   │   totalAmount: 5000,                                             │       │
│   │   paymentId: 'pay_xxx',                                          │       │
│   │   status: 'Placed',                                              │       │
│   │   orderDate: ISODate()                                           │       │
│   │ }                                                                │       │
│   │                                                                   │       │
│   └──────────────────────────────────────────────────────────────────┘       │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL: RAZORPAY SERVICE                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────┐                                        │
│  │ 1. Create Order                  │                                        │
│  │ - Generate order_id              │                                        │
│  │ - Store amount & currency        │                                        │
│  │ - Expiry: 12 hours               │                                        │
│  └──────────────────────────────────┘                                        │
│                                                                                │
│  ┌──────────────────────────────────┐                                        │
│  │ 2. Process Payment               │                                        │
│  │ - Validate card                  │                                        │
│  │ - Process through payment network│                                        │
│  │ - Generate payment_id            │                                        │
│  │ - Create signature               │                                        │
│  └──────────────────────────────────┘                                        │
│                                                                                │
│  ┌──────────────────────────────────┐                                        │
│  │ 3. Return Response               │                                        │
│  │ - razorpay_order_id              │                                        │
│  │ - razorpay_payment_id            │                                        │
│  │ - razorpay_signature             │                                        │
│  └──────────────────────────────────┘                                        │
│                                                                                │
│  [Webhook Option]                                                            │
│  ┌──────────────────────────────────┐                                        │
│  │ 4. Send Webhook (Optional)       │                                        │
│  │ - POST to configured URL         │                                        │
│  │ - Event: payment.captured        │                                        │
│  │ - Timestamp-based retry logic    │                                        │
│  └──────────────────────────────────┘                                        │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Data Flow

### Step-by-Step Payment Process

```
STEP 1: Initialize Order Creation
───────────────────────────────────────────────────────────────────────────────
Frontend Action:
  - User clicks "Place Order"
  - Cart total calculated: ₹5000
  - JWT token retrieved from cookie

Request to Backend:
  POST /api/payment/create-order
  Body: { amount: 5000 }
  
Backend Processing:
  - Validate amount (> 0)
  - Call razorpay.orders.create()
  - Convert amount to paise: 5000 * 100 = 500000
  
Response:
  {
    id: "order_FHrTiAubEzDdaq",
    entity: "order",
    amount: 500000,
    amount_paid: 0,
    currency: "INR",
    receipt: "receipt_1699526400000",
    status: "created",
    attempts: 0,
    notes: {},
    created_at: 1699526400
  }


STEP 2: Open Razorpay Checkout
───────────────────────────────────────────────────────────────────────────────
Frontend Action:
  - Receive order_id from backend response
  - Create Razorpay options object:
    {
      key: "rzp_test_SBjgUiAL2qDOF8",
      amount: 500000,
      currency: "INR",
      order_id: "order_FHrTiAubEzDdaq",
      name: "GenzStore",
      description: "Purchase"
    }
  
  - Initialize: new window.Razorpay(options)
  - Call: rzp.open()
  
User Action:
  - Razorpay modal opens
  - User enters card/payment details
  - Razorpay processes payment


STEP 3: Payment Success Callback
───────────────────────────────────────────────────────────────────────────────
Razorpay Response (via handler callback):
  {
    razorpay_order_id: "order_FHrTiAubEzDdaq",
    razorpay_payment_id: "pay_FHrVcVqJhPVGkU",
    razorpay_signature: "507e4f6e5d3c8e3c3c3c..."
  }


STEP 4: Verify Payment Signature
───────────────────────────────────────────────────────────────────────────────
Frontend Request:
  POST /api/payment/verify-payment
  Body: {
    razorpay_order_id: "order_FHrTiAubEzDdaq",
    razorpay_payment_id: "pay_FHrVcVqJhPVGkU",
    razorpay_signature: "507e4f6e5d3c8e3c3c3c..."
  }

Backend Processing:
  1. Construct string: "order_FHrTiAubEzDdaq|pay_FHrVcVqJhPVGkU"
  
  2. Create HMAC:
     expectedSignature = HMAC_SHA256(
       "order_FHrTiAubEzDdaq|pay_FHrVcVqJhPVGkU",
       "RAZORPAY_KEY_SECRET_VALUE"
     )
  
  3. Compare:
     if (expectedSignature === "507e4f6e5d3c8e3c3c3c...")
       → Signature valid ✓ Payment is authentic
     else
       → Signature invalid ✗ Potential tampering


STEP 5: Save Order to Database
───────────────────────────────────────────────────────────────────────────────
Frontend Request (if verification success):
  POST /api/payment/orders
  Headers: { Authorization: "Bearer JWT_TOKEN" }
  Body: {
    items: [
      {
        itemId: "123",
        itemName: "Burger",
        itemPrice: 250,
        quantity: 2
      },
      ...
    ],
    totalAmount: 5000,
    paymentId: "pay_FHrVcVqJhPVGkU"
  }

Backend Processing:
  1. Extract userId from JWT token
  2. Validate items and amount
  3. Create OrderModel:
     {
       userId: ObjectId("64a8f2e..."),
       items: [...],
       totalAmount: 5000,
       paymentId: "pay_FHrVcVqJhPVGkU",
       status: "Placed",
       orderDate: ISODate("2024-01-15T10:30:00Z")
     }
  4. Save to MongoDB
  5. Return order_id

Response:
  {
    message: "Order placed successfully",
    orderId: "64a8f2e..."
  }


STEP 6: Clear Cart
───────────────────────────────────────────────────────────────────────────────
Frontend Request:
  DELETE /api/payment/clear-cart
  Headers: { Authorization: "Bearer JWT_TOKEN" }

Backend Processing:
  - Delete all CartItem documents for userId
  - Return success response

Frontend:
  - Show success toast
  - Reset cart count to 0
  - Redirect to home page or order confirmation page
```

---

## 3. Security & Signature Verification

### Why Signature Verification is Critical

```
Potential Attack Scenario Without Verification:
─────────────────────────────────────────────────────────────────

1. Attacker modifies payment response:
   Original: { razorpay_order_id: "order_123", amount: 5000, ... }
   Hacked:   { razorpay_order_id: "order_123", amount: 1, ... }
   
2. Without verification, backend would accept fake amount

With Signature Verification:
─────────────────────────────────────────────────────────────────

1. Backend generates expected signature using SECRET KEY:
   expectedSig = HMAC_SHA256(
     "order_123|pay_abc",
     "SECRET_KEY_ONLY_BACKEND_KNOWS"
   )
   
2. Compare with received signature:
   if (expectedSig !== receivedSig) {
     REJECT - Payment not authentic
   }
   
3. Attacker cannot forge signature without knowing SECRET KEY

Security Properties:
─────────────────────────────────────────────────────────────────
✓ Authenticity: Proves response came from Razorpay
✓ Integrity: Proves data wasn't tampered with
✓ Non-repudiation: Razorpay cannot deny sending it
✗ Confidentiality: Not encrypted (use HTTPS for that)
```

---

## 4. Payment Gateway Comparison

### Razorpay vs Stripe vs PayU vs Other Gateways

| Feature | Razorpay | Stripe | PayU | CCAvenue |
|---------|----------|--------|------|----------|
| **Setup & KYC** | Quick | Medium | Complex | Complex |
| **Transaction Fee** | 2% (INR) | 2% + 5₹ | 1.75% | 1.75% |
| **Settlement** | Next day | 2 days | Variable | Variable |
| **Payment Methods** | Cards, UPI, Wallets, Bank Transfer | Cards, Bank, ACH | Cards, UPI, Wallet | Cards, Net Banking |
| **API Complexity** | Easy | Medium | Medium | Complex |
| **Documentation** | Excellent | Excellent | Good | Average |
| **Test Keys** | Simple | Simple | Complex | Complex |
| **Webhook Support** | Yes | Yes | Yes | Yes |
| **Refund API** | Yes | Yes | Yes | Yes |
| **International** | No | Yes | No | Yes |
| **Dashboard** | Good | Excellent | Average | Average |
| **Support** | Good | Excellent | Average | Average |

### Why This Project Uses Razorpay

```
✓ Optimized for Indian market
✓ Lower transaction fees
✓ Faster settlement
✓ Excellent local payment options (UPI)
✓ Simple integration
✓ Good documentation
✓ Test mode easy to use
✓ Competitive pricing
```

---

## 5. Migration Guide: Switching Payment Gateways

### From Razorpay to Stripe

```javascript
// BEFORE (Razorpay)
─────────────────────────────────────────────────────────
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

app.post("/create-order", async (req, res) => {
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  })
  res.json(order)
})


// AFTER (Stripe)
─────────────────────────────────────────────────────────
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post("/create-order", async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "inr",
    payment_method_types: ["card"],
  })
  res.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  })
})
```

### From Razorpay to PayU

```javascript
// BEFORE (Razorpay)
─────────────────────────────────────────────────────────
const order = await razorpay.orders.create({...})


// AFTER (PayU)
─────────────────────────────────────────────────────────
const payuData = {
  key: process.env.PAYU_KEY,
  txnid: generateUniqueId(),
  amount: amount,
  productinfo: "Food Order",
  firstname: user.name,
  email: user.email,
  phone: user.phone,
  surl: "https://yourdomain.com/payment/success",
  furl: "https://yourdomain.com/payment/failure",
  curl: "https://yourdomain.com/payment/cancel",
}

const hash = calculateHash(payuData)
```

---

## 6. State & Refund Handling

### Order Status Flow

```
                    ┌─────────────────┐
                    │   Customer      │
                    │   Initiated     │
                    │   Payment       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Payment         │
                    │ Processing      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
         ┌──────────│ Payment Result  ├──────────┐
         │          └─────────────────┘          │
         │                                        │
    ┌────▼─────┐                           ┌─────▼────┐
    │ SUCCESS   │                           │ FAILURE  │
    │ ✓ Order  │                           │ ✗ Error  │
    │   Placed │                           │   Abort  │
    └────┬─────┘                           └──────────┘
         │
         │ Order Status: "Placed"
         │
    ┌────▼──────────┐
    │ Confirmation  │
    │ Email Sent    │
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │ Preparing     │ (Admin updates)
    │ Order         │ Status: "Processing"
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │ Shipped       │ (Admin updates)
    │               │ Status: "Shipped"
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │ Delivered     │ (Auto or Admin)
    │               │ Status: "Delivered"
    └────┬──────────┘
         │
         │ ┌──────────────────┐
         ├─│ Request Refund   │
         │ └────────┬─────────┘
         │          │
    ┌────▼──────────▼─────┐
    │ Refund Processing   │
    │ Status: "Refunding" │
    └────┬────────────────┘
         │
    ┌────▼─────────────────┐
    │ Refund Complete      │
    │ Status: "Refunded"   │
    └──────────────────────┘
```

### Refund Implementation

```javascript
app.post("/refund-order", authMiddleware, async (req, res) => {
  try {
    const { orderId, refundAmount, reason } = req.body;
    const userId = req.user.userId;

    // 1. Validate order exists and belongs to user
    const order = await OrderModel.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // 2. Check if already refunded
    if (order.status === "Refunded") {
      return res.status(400).json({ error: "Order already refunded" });
    }

    // 3. Process refund with Razorpay
    const refund = await razorpay.payments.refund(order.paymentId, {
      amount: refundAmount * 100,
      notes: {
        reason: reason,
        orderId: orderId
      }
    });

    // 4. Update order status
    order.status = "Refunded";
    order.refundId = refund.id;
    order.refundAmount = refundAmount;
    order.refundReason = reason;
    await order.save();

    // 5. Send refund confirmation email
    await sendRefundEmail(user.email, orderId, refundAmount);

    res.json({
      message: "Refund processed successfully",
      refundId: refund.id,
      amount: refundAmount
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 7. Error Handling Strategy

### Common Errors and Solutions

```
ERROR: "Order not found"
─────────────────────────────────────────────────────
Cause: Order ID doesn't exist in database
Solution: 
  1. Check if order was actually saved
  2. Verify user has correct permissions
  3. Check database connection
  4. Retry with different order ID


ERROR: "Payment verification failed"
─────────────────────────────────────────────────────
Cause: Signature mismatch
Possible Reasons:
  1. Wrong secret key used
  2. Data was tampered with
  3. Razorpay webhook timeout
  4. Clock skew between servers
Solutions:
  1. Verify RAZORPAY_KEY_SECRET in .env
  2. Check if payment was actually captured in Razorpay dashboard
  3. Log the expected and received signatures
  4. Add retry logic with exponential backoff


ERROR: "Invalid amount"
─────────────────────────────────────────────────────
Cause: Amount not properly formatted
Solution:
  1. Ensure amount is number, not string
  2. Multiply by 100 for paise conversion
  3. Use Math.round() to avoid decimals
  4. Validate amount > 0


ERROR: "Cart is empty"
─────────────────────────────────────────────────────
Cause: No items in cart or cart cleared before payment
Solution:
  1. Check cart items before opening Razorpay
  2. Add loading state to prevent multiple clicks
  3. Don't allow payment for 0 amount
  4. Verify items still exist (price changes)
```

---

## 8. Testing Checklist

### Manual Testing

```
PAYMENT SUCCESS FLOW
─────────────────────────────────────────────────────
□ Load cart page
□ Add items to cart
□ Click "Place Order"
□ Verify order creation endpoint called
□ Razorpay modal opens
□ Enter test card: 4111111111111111
□ Enter any future date (MM/YY)
□ Enter any 3-digit CVV
□ Click Pay
□ Verify payment endpoint called
□ Verify order saved to database
□ Verify cart cleared
□ Verify success message shown
□ Verify redirect to home/order page


PAYMENT FAILURE FLOW
─────────────────────────────────────────────────────
□ Open cart
□ Click "Place Order"
□ Use invalid card: 4000000000000002
□ Try to complete payment
□ Verify failure message shown
□ Verify order NOT saved to database
□ Verify cart still has items
□ Verify cart count unchanged


PAYMENT CANCELLATION
─────────────────────────────────────────────────────
□ Open Razorpay modal
□ Click X to close without paying
□ Verify cancellation handled
□ Verify user back on cart page
□ Verify cart unchanged


EDGE CASES
─────────────────────────────────────────────────────
□ Network failure during payment
□ Browser refresh during payment
□ Multiple payment attempts
□ Concurrent payments from same user
□ Payment with same order ID
□ Refund after payment
```

---

## 9. Deployment Configuration

### Environment Setup

```bash
# AWS EC2 / VPS Deployment
┌─────────────────────────────────────────┐
│ Backend Server                          │
├─────────────────────────────────────────┤
│ Node.js + Express                       │
│ MongoDB (Atlas or self-hosted)          │
│ HTTPS Certificate (Let's Encrypt)       │
│ Environment Variables (.env)            │
│ PM2 (Process Manager)                   │
│ Nginx (Reverse Proxy)                   │
└─────────────────────────────────────────┘
        │
        │
┌───────▼──────────────────────────────────┐
│ Payment Gateway (Razorpay)               │
├──────────────────────────────────────────┤
│ API Credentials (Test → Live)            │
│ Webhook URL: /api/payment/webhook       │
│ Allowed Origins: your-domain.com        │
│ IP Whitelisting (Optional)               │
└──────────────────────────────────────────┘
        │
        │
┌───────▼──────────────────────────────────┐
│ Frontend Deployment (Vercel/Netlify)    │
├──────────────────────────────────────────┤
│ React App (Vite Build)                  │
│ VITE_BACKEND_URL = https://api...       │
│ VITE_RAZORPAY_KEY = rzp_live_...        │
│ HTTPS Enabled                           │
│ CDN Caching                             │
└──────────────────────────────────────────┘

# Production Environment Variables
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXX
MONGODB_URI=mongodb+srv://user:pass@cluster...
JWT_SECRET_KEY=LONG_RANDOM_STRING_HERE
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
NODE_ENV=production
PORT=5987
```

---

## 10. Monitoring & Analytics

### Key Metrics to Track

```javascript
// Payment Success Rate
successRate = (successfulPayments / totalAttempts) * 100

// Average Transaction Time
avgTime = totalTime / numberOfTransactions

// Failed Transactions
causes = {
  network_error: 5%,
  invalid_card: 15%,
  insufficient_funds: 20%,
  user_cancelled: 30%,
  other: 30%
}

// Revenue Tracking
dailyRevenue = sum(orders.totalAmount)
monthlyRevenue = sum(orders from last 30 days)
averageOrderValue = totalRevenue / totalOrders

// Refund Rate
refundRate = (refundedOrders / totalOrders) * 100
```

### Logging Template

```javascript
const logPayment = (event, data) => {
  console.log({
    timestamp: new Date().toISOString(),
    event: event, // "payment_initiated", "payment_success", etc.
    orderId: data.orderId,
    userId: data.userId,
    amount: data.amount,
    paymentId: data.paymentId,
    status: data.status,
    errorMessage: data.error || null,
    responseTime: data.responseTime,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent
  });
};

// Usage
logPayment("payment_success", {
  orderId: order._id,
  userId: user._id,
  amount: 5000,
  paymentId: "pay_xxx",
  status: "completed",
  responseTime: 245, // ms
  ipAddress: req.ip,
  userAgent: req.get('user-agent')
});
```

This comprehensive guide provides everything needed to understand, implement, and maintain payment gateway integration using Razorpay!
