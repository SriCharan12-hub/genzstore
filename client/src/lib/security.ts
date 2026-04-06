import { Metadata } from 'next';

// Environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';
const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';

// CSP Headers for Next.js
export const generateSecurityHeaders = () => {
  return {
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' ${API_URL};
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\n/g, ' '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
  };
};

// Metadata for security practices
export const securityMetadata: Metadata = {
  verification: {
    me: [WEBSITE_URL],
  },
};
