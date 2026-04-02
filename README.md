# GenZ E-Commerce Premium Platform

A production-ready, high-end fashion e-commerce storefront and backend built with Next.js, Node.js, MongoDB, and Redis.

## 🚀 Tech Stack

- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, Zustand, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), Redis (Caching).
- **Payments**: Stripe & Razorpay.
- **Auth**: NextAuth.js.

## 📂 Project Structure

```text
genzstore/
├── client/                # Next.js Frontend
│   ├── src/
│   │   ├── app/           # App Router
│   │   ├── components/    # UI Components (Hero, Navbar, etc.)
│   │   ├── store/         # Zustand State (Cart)
│   │   └── lib/           # Shared Utilities
│   └── .env.example       # Frontend Env Placeholders
└── server/                # Express Backend
    ├── src/
    │   ├── config/        # Redis & DB Config
    │   ├── controllers/   # Route Logic
    │   ├── models/        # Mongoose Models
    │   ├── routes/        # API Routes (Products, Payments)
    │   └── index.ts       # Entry Point
    └── .env.example       # Backend Env Placeholders
```

## 🛠️ Installation & Running

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Redis (Optional for caching)

### 2. Setup Server
```bash
cd server
npm install
# Copy .env.example to .env and add your keys
npm run dev
```

### 3. Setup Client
```bash
cd client
npm install
# Copy .env.example to .env
npm run dev
```

## 🔐 Environment Variables

| Variable | Description | Source | Required |
|----------|-------------|--------|----------|
| `MONGODB_URI` | MongoDB Connection string | MongoDB Atlas | Yes |
| `REDIS_URL` | Redis Connection URL | Redis Cloud / Local | Optional |
| `STRIPE_SECRET_KEY` | Stripe Secret Key | Stripe Dashboard | Yes |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | Razorpay Dashboard | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth | Random Hash | Yes |

## 📦 Features Included

- **Premium UI**: Framer Motion animations & minimalist typography.
- **Cart System**: Persistent Zustand store.
- **Redis Caching**: Implemented in `server/src/routes/productRoutes.ts`.
- **Dual Payments**: Stripe & Razorpay logic in `server/src/routes/paymentRoutes.ts`.
- **Type Safety**: Full TypeScript implementation across client and server.

## 🚢 Deployment Guide

1. **Frontend**: Deploy `client/` to **Vercel**. Set environment variables in Vercel Dashboard.
2. **Backend**: Deploy `server/` to **Render** or **Railway**. 
3. **Database**: Use **MongoDB Atlas**.
4. **Cache**: Use **Redis Cloud**.
