'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { LogOut } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface UserSession {
  role: string;
  name?: string;
  email?: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userRole = (session?.user as UserSession | undefined)?.role;

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      toast.error('Session expired. Please login again.');
      router.push('/auth/login');
      return;
    }

    // Redirect if not admin
    if (status === 'authenticated' && userRole !== 'admin') {
      toast.error('Unauthorized: Admin access required.');
      router.push('/');
      return;
    }
  }, [status, userRole, router]);

  // Don't render admin content if not authenticated or not admin
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && userRole !== 'admin')) {
    return null; // Middleware will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome, {session?.user?.name}</p>
          </div>
          <button
            onClick={() => {
              signOut({ redirect: true, callbackUrl: '/' });
              toast.success('Signed out successfully.');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
