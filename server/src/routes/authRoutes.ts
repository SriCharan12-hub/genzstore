import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import sendEmail from '../utils/sendEmail';
import { signToken } from '../utils/token';
import { authLimiter, signupLimiter } from '../middleware/rateLimiter';
import {
  validateEmail as validateEmailRule,
  validatePassword as validatePasswordRule,
  validateName,
  handleValidationErrors,
} from '../middleware/security';
import { body } from 'express-validator';

const router = express.Router();

// Use JWT_SECRET with fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('CRITICAL: JWT_SECRET environment variable must be set in production');
}

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  WARNING: JWT_SECRET not set. Using default development key. Set NEXT_PUBLIC_API_URL in production!');
}

// Validation is done via middleware validators

// POST /api/auth/register
router.post(
  '/register',
  signupLimiter,
  validateName,
  validateEmailRule,
  validatePasswordRule,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;

      console.log('Registration attempt for:', email, 'Name:', name);
      const exists = await User.findOne({ email });
      if (exists) {
        res.status(400).json({ success: false, message: 'Email already registered' });
        return;
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      const user = await User.create({
        name,
        email,
        password,
        isVerified: false,
        otp,
        otpExpires
      });
      console.log('User created in DB:', user._id, 'isVerified:', user.isVerified);

      try {
        await sendEmail({
          email: user.email,
          subject: 'Verify your GenZ Store Account',
          message: `<h1>Your verification code is: <span style="letter-spacing: 4px;">${otp}</span></h1><p>It expires in 10 minutes.</p>`
        });
      } catch (err) {
        console.error('Email could not be sent', err);
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful. Verification email sent.',
        email: user.email
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ success: false, message });
    }
  }
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  authLimiter,
  validateEmailRule,
  body('otp').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Invalid OTP'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
    
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP are required' });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ success: false, message: 'User already verified' });
      return;
    }

    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
      return;
    }

    user.isVerified = true;
    user.otp = null as any;
    user.otpExpires = null as any;
    await user.save();

    const token = signToken(user.id as string, user.role);

    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      message: 'Email verified'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
});

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validateEmailRule,
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }
    
    if (!user.isVerified) {
      res.status(401).json({ success: false, message: 'Please verify your email to log in' });
      return;
    }
    const token = signToken(user.id as string, user.role);
    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
});

export default router;
