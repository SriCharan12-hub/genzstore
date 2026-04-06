// API Configuration Constants
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';

// Website URL for SEO and canonical URLs
export const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    VERIFY_OTP: '/api/auth/verify-otp',
  },
  PRODUCTS: {
    LIST: '/api/products',
    DETAIL: (slug: string) => `/api/products/${slug}`,
  },
  ORDERS: {
    CREATE: '/api/orders',
    LIST: '/api/orders/my',
    DETAIL: (id: string) => `/api/orders/${id}`,
  },
  PAYMENTS: {
    RAZORPAY_ORDER: '/api/payments/razorpay/create-order',
  },
  USERS: {
    WISHLIST_TOGGLE: (productId: string) => `/api/users/wishlist/${productId}`,
    WISHLIST_GET: '/api/users/wishlist',
    PROFILE: '/api/users/profile',
  },
} as const;
