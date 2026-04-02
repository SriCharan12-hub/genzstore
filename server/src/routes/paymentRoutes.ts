import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import { paymentLimiter } from '../middleware/rateLimiter';

dotenv.config();

// Validate payment credentials at module load
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ Warning: STRIPE_SECRET_KEY not set. Stripe payments will not work.');
}
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️ Warning: Razorpay credentials not set. Razorpay payments will not work.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16' as any,
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder',
});

const router = express.Router();

// Stripe: Create Payment Intent
router.post('/stripe/create-intent', paymentLimiter, async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    
    if (!amount) {
      res.status(400).json({ success: false, message: 'Amount is required' });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Converts to cents
      currency,
      automatic_payment_methods: { enabled: true },
    });
    res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Payment intent creation failed' });
  }
});

// Razorpay: Create Order
router.post('/razorpay/create-order', paymentLimiter, async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    
    if (!amount) {
      res.status(400).json({ success: false, message: 'Amount is required' });
      return;
    }

    const options = {
      amount: amount * 100, // Converts to paise
      currency,
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Order creation failed' });
  }
});

export default router;
