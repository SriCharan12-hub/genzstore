import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(request) {
    const token = request.nextauth?.token;
    const path = request.nextUrl.pathname;

    // Protect admin routes
    if (path.startsWith('/admin')) {
      // Check if user is authenticated
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      // Check if user has admin role
      if (token.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Admin routes require both authentication and admin role
        if (path.startsWith('/admin')) {
          return !!(token && token.role === 'admin');
        }

        // Other protected routes just need authentication
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

// Apply middleware to specific routes
export const config = {
  matcher: ['/admin/:path*'],
};
