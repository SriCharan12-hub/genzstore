import express, { Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import { invalidateProductCache } from '../config/redis';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';
import { orderLimiter } from '../middleware/rateLimiter';
import { validatePaymentAmount, sanitizeOrderData } from '../utils/security';

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
    if (!paymentMethod || !['razorpay', 'cod'].includes(paymentMethod)) {
      res.status(400).json({ success: false, message: 'Valid payment method is required' });
      return;
    }
    if (typeof totalPrice !== 'number' || totalPrice <= 0) {
      res.status(400).json({ success: false, message: 'Valid total price is required' });
      return;
    }

    // CRITICAL: Validate total price matches sum of items
    // Prevents price tampering by recalculating on server
    let calculatedTotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.product || item.id);
      if (!product) {
        res.status(404).json({ success: false, message: `Product ${item.product || item.id} not found` });
        return;
      }
      
      // Security: Prevent negative quantities
      if (item.quantity <= 0) {
        res.status(400).json({ success: false, message: 'Invalid item quantity' });
        return;
      }
      
      // CRITICAL: Use server product price, not client-provided price
      calculatedTotal += product.price * item.quantity;
      
      // Check stock availability
      if (product.stock < item.quantity) {
        res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
        return;
      }
    }

    // Add shipping and tax to calculated total
    const calculatedGrandTotal = calculatedTotal + (shippingPrice || 0) + (taxPrice || 0);

    // Validate that client-provided total matches calculated total
    if (!validatePaymentAmount(calculatedGrandTotal, totalPrice)) {
      console.warn(`🚨 FRAUD ALERT: Order price mismatch. Calculated: ${calculatedGrandTotal}, Claimed: ${totalPrice}`);
      res.status(400).json({ 
        success: false, 
        message: 'Order total mismatch. Please refresh and try again.' 
      });
      return;
    }

    // Check stock availability for all items before creating order
    for (const item of items) {
      const product = await Product.findById(item.product || item.id);
      if (!product) {
        res.status(404).json({ success: false, message: `Product ${item.product || item.id} not found` });
        return;
      }
      if (product.stock < item.quantity) {
        res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
        return;
      }
    }

    // CRITICAL: Use MongoDB session for atomic transaction
    // This prevents race conditions when multiple users order the same product simultaneously
    const session = await Order.startSession();
    session.startTransaction();

    let order: any = null;
    try {
      // Create the order inside the transaction
      order = await Order.create([{ 
        user: req.user!.id, 
        items, 
        shippingAddress, 
        paymentMethod, 
        subtotal, 
        shippingPrice, 
        taxPrice, 
        totalPrice 
      }], { session });

      // Atomically decrement stock for each product within the transaction
      // If any fails, entire transaction rolls back
      for (const item of items) {
        const result = await Product.findByIdAndUpdate(
          item.product || item.id,
          { $inc: { stock: -item.quantity } },
          { new: true, session } // Use the same session
        );

        // Verify stock didn't go negative (shouldn't happen due to pre-check, but atomic verify)
        if (result && result.stock < 0) {
          throw new Error(`Stock went negative for product ${item.product || item.id}`);
        }
        console.log(`✅ Stock updated atomically: Product ${item.product || item.id} reduced by ${item.quantity}`);
      }

      // Commit the transaction
      await session.commitTransaction();
      console.log('✅ Transaction committed successfully');

      // Invalidate product cache after successful transaction
      // Don't fail the order if cache invalidation fails
      try {
        await invalidateProductCache();
      } catch (cacheError) {
        console.warn('⚠️ Cache invalidation failed but order created:', cacheError);
        // Continue anyway - order is already created and saved
      }

      // Call security utility to sanitize order data before returning
      // Convert Mongoose document to plain object to avoid circular references
      const orderPlain = order[0].toObject ? order[0].toObject() : order[0];
      const sanitizedOrder = sanitizeOrderData(orderPlain);

      res.status(201).json({ success: true, data: sanitizedOrder });
    } catch (transactionError: unknown) {
      // Rollback only if transaction is still active
      try {
        await session.abortTransaction();
        console.log('⚠️ Transaction rolled back due to error');
      } catch (abortError) {
        console.log('Transaction already closed');
      }
      const errorMessage = transactionError instanceof Error ? transactionError.message : 'Order creation failed';
      res.status(500).json({ success: false, message: errorMessage });
    } finally {
      // Always end session
      session.endSession();
    }
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// ADMIN: GET all orders (must be before /:id route)
router.get('/', protect, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: orders });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// GET /api/orders/my — Get user's orders (protected)
router.get('/my', protect, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ user: req.user!.id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: orders });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// GET /api/orders/:id — Get single order (protected)
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email').lean();
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    if (order.user._id?.toString() !== req.user!.id && req.user!.role !== 'admin') {
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
    
    // Verify that only the order owner or admin can mark as paid
    if (order.user.toString() !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to update this order' });
      return;
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = req.body;
    await order.save();
    
    console.log(`✅ Order ${order._id} marked as paid. Stock already decremented at order creation.`);
    const orderData = order.toObject();
    res.status(200).json({ success: true, data: orderData });
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
    const orderData = order.toObject();
    res.status(200).json({ success: true, data: orderData });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// PUT /api/orders/:id/cancel — Cancel order and restore stock (protected)
router.put('/:id/cancel', protect, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) { 
      res.status(404).json({ success: false, message: 'Order not found' }); 
      return; 
    }

    // Verify authorization
    if (order.user.toString() !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
      return;
    }

    // Only allow cancellation if not already delivered
    if (order.isDelivered) {
      res.status(400).json({ success: false, message: 'Cannot cancel delivered orders' });
      return;
    }

    // Restore stock for all items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { new: true }
      );
      console.log(`✅ Stock restored: Product ${item.product} increased by ${item.quantity}`);
    }

    // Invalidate product cache after stock change
    await invalidateProductCache();

    // Update order status
    order.status = 'cancelled';
    order.isCancelled = true;
    order.cancelledAt = new Date();
    await order.save();

    const orderData = order.toObject();
    res.status(200).json({ 
      success: true, 
      data: orderData,
      message: 'Order cancelled and stock restored successfully' 
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

export default router;
