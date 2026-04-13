'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAIL = 'sricharanpalem07@gmail.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    setLoading(false);

    if (res?.error) {
      toast.error('Invalid email or password');
    } else {
      toast.success('Signed in successfully');
      if (email.toLowerCase() === ADMIN_EMAIL) {
        router.push('/admin');
      } else {
        router.push('/account');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 relative pt-14 sm:pt-20 pb-8">
      <button
        onClick={() => router.back()}
        className="absolute top-16 sm:top-24 left-4 sm:left-6 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="w-full max-w-sm sm:max-w-md">
        <div className="bg-white p-6 sm:p-10 border border-gray-100 shadow-sm">
          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4 sm:mb-5">
              <Image
                src="/KK-Brand-NoBG-Black-Mark.png"
                alt="KK Brand Logo"
                width={100}
                height={30}
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-1.5">Welcome Back</h1>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors pr-12 [&::-ms-reveal]:hidden"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <a href="/auth/forgot-password" className="text-xs text-gray-400 hover:text-black transition-colors">
                Forgot password?
              </a>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white text-xs font-bold uppercase tracking-[0.15em] py-4 hover:bg-gray-900 disabled:bg-gray-300 transition-colors"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 sm:mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">or</p>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: email.toLowerCase() === ADMIN_EMAIL ? '/admin' : '/' })}
            className="mt-5 sm:mt-6 w-full flex items-center justify-center gap-3 border border-gray-200 py-3.5 px-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all duration-300 active:bg-gray-100"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-black font-bold hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
