# Payment Gateway - Ready-to-Use Code Snippets
## For Quick Integration into GenzStore Project

---

## Backend Implementation (Node.js + Express)

### 1. Install Dependencies

```bash
npm install razorpay express mongoose jsonwebtoken bcrypt cors dotenv zod
```

### 2. Payment Routes Module

Create `backend/routes/paymentRoutes.js`:

```javascript
import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import authMiddleware from '../middleware/auth.js';
import OrderModel from '../models/Order.js';

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
router.post('/create-order', async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                error: 'Invalid amount' 
            });
        }

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: 'receipt_' + Date.now(),
        });

        res.json(order);
    } catch (err) {
        res.status(500).json({ 
            error: err.message 
        });
    }
});

// Verify Payment
router.post('/verify-payment', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing payment parameters' 
            });
        }

        const body = razorpay_order_id + '|' + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            res.json({ success: true });
        } else {
            res.status(400).json({ 
                success: false, 
                error: 'Invalid signature' 
            });
        }
    } catch (err) {
        res.status(500).json({ 
            error: err.message 
        });
    }
});

// Place Order (After Payment Success)
router.post('/orders', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { items, totalAmount, paymentId } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                error: 'No items in order'
            });
        }

        if (!totalAmount || totalAmount <= 0) {
            return res.status(400).json({
                error: 'Invalid total amount'
            });
        }

        const newOrder = await OrderModel.create({
            userId,
            items,
            totalAmount,
            paymentId,
            status: 'Placed',
            orderDate: new Date()
        });

        res.status(201).json({
            message: 'Order placed successfully',
            orderId: newOrder._id,
            order: newOrder
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ 
            error: 'Failed to place order' 
        });
    }
});

// Get User Orders
router.get('/orders', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const orders = await OrderModel.find({ userId }).sort({ orderDate: -1 });

        res.json({
            message: 'Orders fetched successfully',
            data: orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ 
            error: 'Failed to fetch orders' 
        });
    }
});

// Clear Cart After Payment
router.delete('/clear-cart', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        await CartItemModel.deleteMany({ userId });

        res.json({
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ 
            error: 'Failed to clear cart' 
        });
    }
});

export default router;
```

### 3. Order Model

Create `backend/models/Order.js`:

```javascript
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: {
        type: [{
            itemId: String,
            itemName: String,
            itemPrice: Number,
            itemUrl: String,
            quantity: Number
        }],
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentId: {
        type: String,
        index: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Placed'
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    notes: String,
    orderDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    estimatedDelivery: Date,
    actualDelivery: Date
}, { timestamps: true });

const OrderModel = mongoose.model('Order', orderSchema);
export default OrderModel;
```

### 4. Update Main Server File

Add to `backend/index.js`:

```javascript
import paymentRoutes from './routes/paymentRoutes.js';

// ... other middleware

// Payment Routes
app.use('/api/payment', paymentRoutes);

// ... rest of the code
```

### 5. Environment Variables

Create `backend/.env`:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET_KEY=your_jwt_secret_key

# Server
PORT=5987
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

---

## Frontend Implementation (React)

### 1. Install Dependencies

```bash
npm install js-cookie react-hot-toast react-router
```

### 2. Configuration File

Create `frontend/src/config.js`:

```javascript
// Use environment variables for API URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5987';
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_YOUR_KEY';

export { BACKEND_URL, RAZORPAY_KEY };
```

### 3. Checkout Component

Create `frontend/src/components/CheckoutForm.jsx`:

```javascript
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { BACKEND_URL, RAZORPAY_KEY } from '../config';

function CheckoutForm({ cartItems, totalAmount, onSuccess }) {
  const [loading, setLoading] = useState(false);

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const handlePayment = async () => {
    if (!window.Razorpay) {
      toast.error('Razorpay is not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create Order on Backend
      const orderRes = await fetch(`${BACKEND_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount })
      });

      if (!orderRes.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderRes.json();

      if (!orderData.id) {
        throw new Error('Invalid order response');
      }

      // Step 2: Open Razorpay Checkout
      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.amount,
        currency: 'INR',
        name: 'GenzStore',
        description: 'Purchase from GenzStore',
        order_id: orderData.id,
        prefill: {
          email: Cookies.get('user_email') || '',
          contact: Cookies.get('user_phone') || ''
        },
        handler: async (response) => {
          await verifyAndSaveOrder(response);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error('Payment cancelled');
          }
        },
        theme: {
          color: '#f97316' // Orange
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment initiation failed');
      setLoading(false);
    }
  };

  const verifyAndSaveOrder = async (paymentResponse) => {
    try {
      // Step 3: Verify Payment on Backend
      const verifyRes = await fetch(
        `${BACKEND_URL}/api/payment/verify-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentResponse)
        }
      );

      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        throw new Error('Payment verification failed');
      }

      // Step 4: Save Order to Database
      const token = Cookies.get('jwt_token');
      const saveOrderRes = await fetch(
        `${BACKEND_URL}/api/payment/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            items: cartItems,
            totalAmount,
            paymentId: paymentResponse.razorpay_payment_id
          })
        }
      );

      if (!saveOrderRes.ok) {
        throw new Error('Failed to save order');
      }

      const orderResult = await saveOrderRes.json();
      toast.success('Order placed successfully!');

      // Clear cart
      await fetch(`${BACKEND_URL}/api/payment/clear-cart`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Callback to parent component
      if (onSuccess) {
        onSuccess(orderResult.orderId);
      }

    } catch (error) {
      console.error('Order verification error:', error);
      toast.error(error.message || 'Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-form">
      <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="space-y-2">
          {cartItems.map((item) => (
            <div key={item._id} className="flex justify-between">
              <span>{item.itemName} x {item.quantity}</span>
              <span>₹{item.itemPrice * item.quantity}</span>
            </div>
          ))}
        </div>
        
        <div className="border-t-2 border-gray-300 mt-4 pt-4 font-bold">
          <div className="flex justify-between text-lg">
            <span>Total:</span>
            <span>₹{totalAmount}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading || cartItems.length === 0}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
      >
        {loading ? 'Processing...' : 'Pay with Razorpay'}
      </button>
    </div>
  );
}

export default CheckoutForm;
```

### 4. Orders List Component

Create `frontend/src/components/MyOrders.jsx`:

```javascript
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../config';
import Loading from './Loading';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = Cookies.get('jwt_token');
      const res = await fetch(`${BACKEND_URL}/api/payment/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white p-6 rounded-lg shadow border border-gray-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono text-sm">{order._id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p>{new Date(order.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-bold">₹{order.totalAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded">
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-bold mb-2">Items:</p>
                <ul className="text-sm space-y-1">
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {item.itemName} x {item.quantity} = ₹{item.itemPrice * item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;
```

### 5. Environment Variables

Create `frontend/.env":

```env
VITE_BACKEND_URL=http://localhost:5987
VITE_RAZORPAY_KEY=rzp_test_YOUR_KEY_HERE
```

---

## Integration Steps

### Backend
1. Copy `paymentRoutes.js` to `backend/routes/`
2. Update `OrderModel` in `backend/models/`
3. Add import in `backend/index.js`
4. Set up environment variables in `.env`
5. Test endpoints using Postman

### Frontend
1. Copy component files to `frontend/src/components/`
2. Update `config.js` with your API URL and Razorpay key
3. Create `.env` file with environment variables
4. Import and use `CheckoutForm` in your Cart page
5. Add route for `MyOrders` component

### Testing
1. Use Razorpay test keys (starting with `rzp_test_`)
2. Use test card: 4111 1111 1111 1111
3. Any future date for expiry
4. Any CVV for testing

---

## Webhook Implementation (Production)

Add to `backend/routes/paymentRoutes.js`:

```javascript
// Webhook Handler (Add to Express App)
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body.toString();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (signature === expectedSignature) {
    const payload = JSON.parse(body);
    
    if (payload.event === 'payment.captured') {
      // Handle successful payment
      console.log('Payment captured:', payload.payload.payment);
      
      // Update order status in database
      // Send confirmation email
      // Update inventory
    }
    
    res.json({ status: 'ok' });
  } else {
    res.status(400).json({ error: 'Invalid signature' });
  }
});
```

---

## Common Issues & Solutions

### Issue: CORS Error
**Solution:** Add CORS headers in backend
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Issue: Razorpay Modal Not Opening
**Solution:** Ensure script is loaded before using `window.Razorpay`

### Issue: Payment Verified but Order Not Saved
**Solution:** Check database connection, order schema fields, and error logs

### Issue: Invalid Amount Format
**Solution:** Always multiply by 100 for paise conversion on backend

---

## Production Checklist

- [ ] Replace test Razorpay keys with live keys
- [ ] Move all keys to environment variables
- [ ] Enable HTTPS
- [ ] Set up CORS properly
- [ ] Implement logging
- [ ] Add error tracking (Sentry)
- [ ] Set up payment webhook handling
- [ ] Test payment flow end-to-end
- [ ] Add email notifications
- [ ] Implement refund logic
- [ ] Add payment history/analytics
- [ ] Set up monitoring alerts
