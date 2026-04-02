import express, { Response } from 'express';
import Order from '../models/Order';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';
import { orderLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// POST /api/orders — Create order (protected)
router.post('/', protect, orderLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { items, shippingAddress, paymentMethod, subtotal, shippingPrice, taxPrice, totalPrice } = req.body;
    
    // Input validation
    if (!items || items.length === 0) { 
      res.status(400).json({ success: false, message: 'Order must contain items' }); 
      return; 
    }
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      res.status(400).json({ success: false, message: 'Complete shipping address is required' });
      return;
    }
    if (!paymentMethod || !['stripe', 'razorpay', 'cod'].includes(paymentMethod)) {
      res.status(400).json({ success: false, message: 'Valid payment method is required' });
      return;
    }
    if (typeof totalPrice !== 'number' || totalPrice <= 0) {
      res.status(400).json({ success: false, message: 'Valid total price is required' });
      return;
    }

    const order = await Order.create({ 
      user: req.user!.id, 
      items, 
      shippingAddress, 
      paymentMethod, 
      subtotal, 
      shippingPrice, 
      taxPrice, 
      totalPrice 
    });
    res.status(201).json({ success: true, data: order });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// ADMIN: GET all orders (must be before /:id route)
router.get('/', protect, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// GET /api/orders/my — Get user's orders (protected)
router.get('/my', protect, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ user: req.user!.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// GET /api/orders/:id — Get single order (protected)
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    if (order.user.toString() !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized' }); return;
    }
    res.status(200).json({ success: true, data: order });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// PUT /api/orders/:id/pay — Mark as paid (protected)
router.put('/:id/pay', protect, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = req.body;
    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// ADMIN: Update order status
router.put('/:id/status', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    order.status = req.body.status;
    if (req.body.status === 'delivered') { order.isDelivered = true; order.deliveredAt = new Date(); }
    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

export default router;
