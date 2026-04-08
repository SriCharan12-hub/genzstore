# GenZ E-Commerce Premium Platform

A production-ready, high-end fashion e-commerce storefront and backend built with Next.js, Node.js, MongoDB, and Redis.

## 🚀 Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, Zustand (state management), Framer Motion (animations).
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), Redis (optional caching).
- **Payments**: Razorpay (UPI, cards, net banking), Cash on Delivery (COD).
- **Auth**: NextAuth.js v4.24.13 with OAuth & Email/Password.

## 📂 Project Structure

```text
genzstore/
├── client/                # Next.js Frontend (App Router)
│   ├── src/
│   │   ├── app/           # Pages & Layouts
│   │   ├── components/    # React Components (Navbar, Footer, etc.)
│   │   ├── store/         # Zustand State (Cart, Wishlist)
│   │   ├── lib/           # Utilities & Formatting
│   │   └── types/         # TypeScript Interfaces
│   └── package.json
└── server/                # Express Backend (TypeScript)
    ├── src/
    │   ├── config/        # Redis & Database Config
    │   ├── middleware/    # Auth, Rate Limiting, Security
    │   ├── models/        # Mongoose Schemas
    │   ├── routes/        # API Routes
    │   ├── seeds/         # Database Seeding
    │   ├── scripts/       # Utility Scripts
    │   └── utils/         # Helpers
    └── package.json
```

## 🛠️ Installation & Running

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or MongoDB Atlas)
- Optional: Redis (for caching)

### 2. Setup Server
```bash
cd server
npm install
cp .env.example .env
# Add your MongoDB URI and other credentials
npm run dev
```

### 3. Setup Client
```bash
cd client
npm install
cp .env.local.example .env.local
# Add your API URL and NextAuth credentials
npm run dev
```

## 🔐 Environment Variables

### Server (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `NEXT_PUBLIC_API_URL` | API base URL | Yes |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | Yes |
| `RAZORPAY_SECRET` | Razorpay Secret | Yes |

### Client (.env.local)
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth | Yes |
| `NEXTAUTH_URL` | Frontend URL | Yes |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Optional |

## 📦 Key Features

✅ **Product Management**
- Dynamic pricing based on size
- Category filtering & search
- Stock management with atomic transactions

✅ **Shopping Experience**
- Persistent cart (Zustand)
- Real-time stock availability
- Wishlist functionality

✅ **Payment Processing**
- Razorpay integration (UPI, cards, net banking)
- Cash on Delivery (COD)
- Server-side payment validation (prevents tampering)

✅ **Admin Panel**
- Product CRUD operations
- Order management & status tracking
- User role management
- Size-based pricing configuration

✅ **Security**
- JWT authentication with role-based access control
- Rate limiting (5 levels)
- CORS & helmet protection
- XSS/CSRF/HPP prevention
- Secure OTP generation with crypto.getRandomValues()
- Server-side payment amount validation
- Atomic transactions prevent race conditions

✅ **Performance**
- ISR (Incremental Static Regeneration)
- Database indexes on common queries
- Redis caching (optional)
- .lean() queries for better performance

## 🎯 Quick Start Commands

### Development
```bash
# Server
cd server && npm run dev

# Client (in new terminal)
cd client && npm run dev
```

### Admin Setup
```bash
# Create admin user
cd server
npm run create-admin

# Seed sample products
npm run seed
```

### Utility Scripts
```bash
npm run check-products   # Verify products in DB
npm run clear-orders     # Clear all orders (dev only)
npm run delete-test-users # Remove test users
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Backend (Render/Railway)
1. Connect GitHub repository
2. Set environment variables
3. Set build command: `npm run build`
4. Set start command: `npm start`

## 📖 API Documentation

### Key Endpoints
- `GET /api/products` - List products (with filtering)
- `GET /api/products/detail/:id` - Get product details
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user's orders (admin: all orders)
- `PUT /api/products/:id` - Update product (admin only)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

## 🔧 Troubleshooting

**Products not showing?**
- Run `npm run seed` to add sample products
- Check MongoDB connection in .env

**Payments failing?**
- Verify Razorpay credentials in .env
- Check payment validation in console logs

**Orders not creating?**
- Ensure sufficient stock
- Check server-side amount validation
- Review MongoDB transaction logs

## 📝 License

This project is provided as-is for educational and commercial use.
