# Payment Gateway Implementation - Golden Spoons Foods
## Complete Integration Guide

**Repository:** https://github.com/ugadiharshavardhan/thegoldenspoonfoods

---

## 1. PAYMENT PROCESSING LOGIC (Backend)

### Backend Entry Point
**File Path:** `backend/index.js`

#### 1.1 Razorpay Initialization
```javascript
import Razorpay from "razorpay"
import crypto from "crypto"

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})
```

#### 1.2 Create Order Endpoint
```javascript
// Route: POST /create-order
app.post("/create-order", async (req, res) => {
    const { amount } = req.body  // amount in rupees

    try {
        const order = await razorpay.orders.create({
            amount: amount * 100, // convert to paise
            currency: "INR",
            receipt: "receipt_" + Date.now(),
        })

        res.json(order)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})
```

**Key Features:**
- Creates Razorpay order with amount conversion to paise (smallest unit)
- Generates unique receipt ID with timestamp
- Returns order object with order ID and details

#### 1.3 Payment Verification Endpoint
```javascript
// Route: POST /verify-payment
app.post("/verify-payment", (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    } = req.body

    const body = razorpay_order_id + "|" + razorpay_payment_id

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex")

    if (expectedSignature === razorpay_signature) {
        res.json({ success: true })
    } else {
        res.status(400).json({ success: false })
    }
})
```

**Key Features:**
- Verifies webhook/payment callback signature using HMAC-SHA256
- Compares expected signature with received signature
- Ensures payment authenticity and prevents tampering

#### 1.4 Order Storage/Placement Endpoint
```javascript
// Route: POST /api/orders (Protected with authMiddleware)
app.post("/api/orders", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { items, totalAmount, paymentId } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: "No items in order"
            });
        }

        const newOrder = new OrderModel({
            userId,
            items,
            totalAmount,
            paymentId
        });

        await newOrder.save();

        return res.status(201).json({
            message: "Order placed successfully",
            orderId: newOrder._id
        });
    } catch (error) {
        console.error("Error placing order:", error.message);
        return res.status(500).json({ 
            message: "Internal Server Error" 
        });
    }
});
```

#### 1.5 Get User Orders Endpoint
```javascript
// Route: GET /api/orders (Protected with authMiddleware)
app.get("/api/orders", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const orders = await OrderModel.find({ userId }).sort({
            orderDate: -1
        });

        return res.status(200).json({
            message: "Orders fetched successfully",
            data: orders
        });
    } catch (error) {
        console.error("Error fetching orders:", error.message);
        return res.status(500).json({ 
            message: "Internal Server Error" 
        });
    }
});
```

#### 1.6 Clear Cart After Payment
```javascript
// Route: DELETE /api/clear-cart (Protected with authMiddleware)
app.delete("/api/clear-cart", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        await CartItemModel.deleteMany({ userId })

        return res.status(200).json({
            message: "Cart cleared successfully"
        })
    } catch (error) {
        console.error("Error clearing cart:", error.message)
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
})
```

---

## 2. DATABASE MODELS

### Order Model
**File Path:** `backend/models/OrderModel.js`

```javascript
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [
        {
            itemName: String,
            itemPrice: Number,
            itemUrl: String,
            quantity: Number
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    paymentId: {
        type: String
    },
    status: {
        type: String,
        default: "Placed"
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
});

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;
```

**Schema Fields:**
- `userId`: Reference to user who placed the order
- `items`: Array of ordered food items with details
- `totalAmount`: Total payment amount
- `paymentId`: Razorpay payment identifier
- `status`: Order status (default: "Placed")
- `orderDate`: Timestamp of order creation

---

## 3. FRONTEND PAYMENT IMPLEMENTATION

### Payment Checkout Component
**File Path:** `frontend/src/components/Cart.jsx`

#### 3.1 Razorpay Script Loading
```javascript
useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true)
          return
        }

        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
      })
    }

    loadRazorpay()
  }, [])
```

#### 3.2 Payment Handler - Full Flow
```javascript
onClick={async () => {
  try {
    const token = Cookies.get("jwt_token")

    // 1. Create Razorpay Order
    const orderRes = await fetch(`${BACKEND_URL}/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: ordertotal })
    })

    const orderData = await orderRes.json()

    if (!orderData.id) {
      toast.error("Failed to create order. Please try again.")
      return
    }

    // 2. Open Razorpay Modal
    const options = {
      key: "rzp_test_SBjgUiAL2qDOF8", // Test key (replace with env variable in production)
      amount: orderData.amount,
      currency: "INR",
      name: "Tasty Kitchens",
      description: "Food Order Payment",
      order_id: orderData.id,
      
      handler: async function (response) {
        // 3. Verify Payment
        const verifyRes = await fetch(`${BACKEND_URL}/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response)
        })

        const verifyData = await verifyRes.json()

        if (verifyData.success) {
          // 4. Save Order to Backend
          const orderResponse = await fetch(`${BACKEND_URL}/api/orders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              items: cartItems,
              totalAmount: ordertotal,
              paymentId: response.razorpay_payment_id
            })
          })

          if (orderResponse.ok) {
            // 5. Clear Cart
            const res = await fetch(`${BACKEND_URL}/api/clear-cart`, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${token}`
              }
            })

            if (res.ok) {
              toast.success("Order placed successfully!")
              setCartCount(0)
              navigate("/", { replace: true })
            }
          } else {
            toast.error("Payment verified, but failed to save order.")
          }
        } else {
          toast.error("Payment Verification Failed")
        }
      },

      theme: { color: "#f97316" } // Orange color theme
    }

    const rzp = new window.Razorpay(options)
    rzp.open()

  } catch (error) {
    console.error("Payment error", error)
    toast.error("Something went wrong during payment.")
  }
}}
className="w-full cursor-pointer sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all"
>
  Place Order
</button>
```

**Payment Flow:**
1. User clicks "Place Order" button
2. Frontend creates order on backend (GET order ID)
3. Razorpay modal opens with payment details
4. User completes payment
5. Razorpay returns payment details
6. Frontend verifies payment signature
7. If verified, saves order to database
8. Clears cart and redirects to home

### Orders Display Component
**File Path:** `frontend/src/components/OrdersList.jsx`

```javascript
import React, { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { BACKEND_URL } from '../config'
import { useNavigate } from 'react-router'

function OrdersList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = Cookies.get("jwt_token")
        const response = await fetch(`${BACKEND_URL}/api/orders`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })

        const data = await response.json()
        if (response.ok) {
          setOrders(data.data)
        }
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // Displays orders with status, date, total amount, and items
}

export default OrdersList
```

---

## 4. CONFIGURATION & ENVIRONMENT

### Frontend Configuration
**File Path:** `frontend/src/config.js`

```javascript
export const BACKEND_URL = "https://thegoldenspoonfoods.onrender.com";
// export const BACKEND_URL = "http://localhost:5987"; // Local development
```

### Required Environment Variables

#### Backend (.env)
```
RAZORPAY_KEY_ID=rzp_test_SBjgUiAL2qDOF8
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
MONGODB_URI=your_mongodb_connection_uri
JWT_SECRET_KEY=your_jwt_secret_key
```

#### Frontend
- Razorpay key is hardcoded in Cart.jsx: `rzp_test_SBjgUiAL2qDOF8`
  (⚠️ Should be moved to environment variable in production)

---

## 5. DEPENDENCIES

### Backend Dependencies
**File Path:** `backend/package.json`

```json
{
  "dependencies": {
    "razorpay": "^2.9.6",          // Razorpay payment gateway SDK
    "express": "^5.2.1",           // Web framework
    "mongoose": "^9.1.5",          // MongoDB ODM
    "jsonwebtoken": "^9.0.3",      // JWT authentication
    "bcrypt": "^6.0.0",            // Password hashing
    "cors": "^2.8.6",              // CORS middleware
    "dotenv": "^17.2.3",           // Environment variables
    "crypto": "built-in",          // For signature verification
    "zod": "^4.3.6"                // Data validation
  }
}
```

### Frontend Dependencies
**File Path:** `frontend/package.json`

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router": "^7.13.0",      // Routing
    "js-cookie": "^3.0.5",          // JWT token management
    "react-hot-toast": "^2.6.0",    // Toast notifications
    "react-icons": "^5.5.0",        // Icon library
    "tailwindcss": "^4.1.18"        // CSS framework
  }
}
```

---

## 6. API ENDPOINTS SUMMARY

| Method | Endpoint | Authentication | Purpose |
|--------|----------|-----------------|---------|
| POST | `/create-order` | None | Create Razorpay order |
| POST | `/verify-payment` | None | Verify payment signature |
| POST | `/api/orders` | ✅ JWT | Save order to database |
| GET | `/api/orders` | ✅ JWT | Fetch user's orders |
| DELETE | `/api/clear-cart` | ✅ JWT | Clear cart after payment |
| POST | `/api/addtocart` | ✅ JWT | Add item to cart |
| GET | `/api/cartitems` | ✅ JWT | Get cart items |
| DELETE | `/api/delete/:id` | ✅ JWT | Remove item from cart |

---

## 7. PAYMENT FLOW DIAGRAM

```
┌─────────────────┐
│   Frontend      │
│   (Cart Page)   │
└────────┬────────┘
         │
         │ 1. User clicks "Place Order"
         ↓
┌─────────────────────────────────┐
│  POST /create-order             │
│  (amount: total_rupees)         │
└────────┬────────────────────────┘
         │
         │ 2. Response: { id, amount, ... }
         ↓
┌─────────────────────────────────┐
│  Open Razorpay Checkout Modal   │
│  (key, amount, order_id)        │
└────────┬────────────────────────┘
         │
         │ 3. User completes payment
         ↓
┌─────────────────────────────────┐
│  POST /verify-payment           │
│  (razorpay_order_id,            │
│   razorpay_payment_id,          │
│   razorpay_signature)           │
└────────┬────────────────────────┘
         │
         │ 4. HMAC-SHA256 verification
         │ If signature matches: success
         ↓
┌───────────────────────────────────┐
│  POST /api/orders                 │
│  (items, totalAmount, paymentId)  │
│  + JWT token                      │
└────────┬──────────────────────────┘
         │
         │ 5. Order saved to MongoDB
         ↓
┌──────────────────────────────┐
│  DELETE /api/clear-cart      │
│  + JWT token                 │
└────────┬─────────────────────┘
         │
         │ 6. Cart cleared
         ↓
┌──────────────────┐
│ Success Toast    │
│ Redirect Home    │
└──────────────────┘
```

---

## 8. SECURITY CONSIDERATIONS

### Current Implementation
✅ Payment signature verification using HMAC-SHA256
✅ JWT token authentication for order operations
✅ User isolation (users can only access their own orders)

### Recommended Improvements
⚠️ Move Razorpay key to backend environment variables
⚠️ Add HTTPS enforcement in production
⚠️ Implement webhook handlers for payment confirmations
⚠️ Add order validation and amount verification
⚠️ Implement rate limiting on payment endpoints
⚠️ Add encryption for sensitive payment data

---

## 9. ERROR HANDLING

### Frontend Error Cases
- Order creation failure: "Failed to create order. Please try again."
- Payment verification failure: "Payment Verification Failed"
- Order saving failure: "Payment verified, but failed to save order."
- General payment error: "Something went wrong during payment."

### Backend Error Cases
- Invalid amount: HTTP 400
- Payment verification mismatch: HTTP 400
- Database errors: HTTP 500
- Missing authentication: HTTP 401 (authMiddleware)

---

## 10. INTEGRATION CHECKLIST

- [ ] Set up Razorpay account and get API keys
- [ ] Configure environment variables in backend `.env`
- [ ] Move Razorpay key to frontend environment variables
- [ ] Test payment flow in development
- [ ] Implement webhook handlers for production
- [ ] Set up HTTPS for production
- [ ] Add order tracking/notification features
- [ ] Implement refund handling
- [ ] Add invoice generation
- [ ] Set up payment analytics
- [ ] Test various payment scenarios (success, failure, timeout)
- [ ] Configure CORS properly for production domains

---

## File Structure Summary

```
Project Root
├── backend/
│   ├── index.js (Main server with payment routes)
│   ├── models/
│   │   └── OrderModel.js (Order schema)
│   ├── package.json (Razorpay and dependencies)
│   └── .env (Configuration)
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Cart.jsx (Payment handler)
    │   │   └── OrdersList.jsx (Order display)
    │   └── config.js (Backend URL)
    └── package.json (Dependencies)
```

---

## Repository
- **GitHub:** https://github.com/ugadiharshavardhan/thegoldenspoonfoods
- **Tech Stack:** 
  - Backend: Node.js + Express + MongoDB
  - Frontend: React + Vite + Tailwind CSS
  - Payment Gateway: Razorpay
