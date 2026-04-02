import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { body, param, query, validationResult } from 'express-validator';

// Helmet Configuration - Set secure HTTP headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:1000'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  frameguard: { action: 'deny' }, // Prevent clickjacking
  noSniff: true, // Prevent MIME sniffing
  xssFilter: true, // Enable XSS filter
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
});

// Data Sanitization - Sanitize data against NoSQL injection
export const sanitizeData = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    const sanitized = sanitizeObject({ ...req.query });
    Object.assign(req.query, sanitized);
  }
  if (req.params) {
    // Express 5: req.params is read-only, use Object.assign
    const sanitizedParams = sanitizeObject({ ...req.params });
    Object.assign(req.params, sanitizedParams);
  }
  next();
};

// Helper function to sanitize objects against NoSQL injection
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    // Sanitize strings that contain dangerous MongoDB operators
    if (obj.includes('$') || obj.includes('{') || obj.includes('}')){
      console.warn(`⚠️ Potential NoSQL injection attempt detected`);
      return obj.replace(/[${}]/g, '_');
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const key in obj) {
      if (key.startsWith('$')) {
        console.warn(`⚠️ Potential NoSQL injection attempt detected in key: ${key}`);
        sanitized[key.replace(/[$]/g, '_')] = sanitizeObject(obj[key]);
      } else {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  return obj;
}

// XSS Protection - Sanitize all request inputs
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeXSS(req.body);
  }
  if (req.query) {
    const sanitizedQuery = sanitizeXSS({ ...req.query });
    Object.assign(req.query, sanitizedQuery);
  }
  if (req.params) {
    // Express 5: req.params is read-only, use Object.assign
    const sanitizedParams = sanitizeXSS({ ...req.params });
    Object.assign(req.params, sanitizedParams);
  }
  next();
};

function sanitizeXSS(data: any): any {
  if (typeof data === 'string') {
    return escapeHtml(data);
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeXSS(item));
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const key in data) {
      sanitized[key] = sanitizeXSS(data[key]);
    }
    return sanitized;
  }
  return data;
}

function escapeHtml(text: string): string {
  const entityMap: { [key: string]: string } = {
    '<': '&lt;',
    '>': '&gt;',
  };
  return String(text).replace(/[<>]/g, (s) => entityMap[s]);
}

// Input Validation Rules
export const validateEmail = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Valid email is required');

export const validatePassword = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters');

export const validateName = body('name')
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage('Name must be between 2 and 50 characters')
  .matches(/^[a-zA-Z\s'-]+$/)
  .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes');

export const validatePhone = body('phone')
  .trim()
  .matches(/^[\d\s\-\+\(\)]+$/)
  .withMessage('Invalid phone number')
  .isLength({ min: 10, max: 15 })
  .withMessage('Phone must be between 10 and 15 characters');

export const validateProductId = param('id')
  .isMongoId()
  .withMessage('Invalid product ID');

export const validateSearchQuery = query('search')
  .optional()
  .trim()
  .isLength({ max: 100 })
  .withMessage('Search query too long')
  .matches(/^[a-zA-Z0-9\s\-]*$/)
  .withMessage('Invalid search characters');

// Validation Error Handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

// CSRF Token Middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  const csrfToken = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-CSRF-Token', csrfToken);
  (req as any).csrfToken = csrfToken;
  next();
};

// Request Size Limiter
export const requestSizeLimiter = (maxSize: string = '10kb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const size = req.get('content-length');
    if (size && parseInt(size) > parseInt(maxSize)) {
      res.status(413).json({ success: false, message: 'Request entity too large' });
      return;
    }
    next();
  };
};

// HPP (HTTP Parameter Pollution) Protection
export const hppProtection = (req: Request, res: Response, next: NextFunction) => {
  if (typeof req.query === 'object') {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        res.status(400).json({ success: false, message: 'Duplicate parameters detected' });
        return;
      }
    }
  }
  next();
};

// Security Headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent browsers from MIME-sniffing a response away from the declared Content-Type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // Prevent DNS prefetching
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  next();
};
