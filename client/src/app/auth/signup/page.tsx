'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

import { signIn } from 'next-auth/react';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();
      setLoading(false);
      
      if (res.ok && data.success) {
        toast.success('Registration successful. Please verify your email.');
        router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`);
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (err) {
      setLoading(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center bg-gray-50 px-6 relative">
      <button onClick={() => router.back()} className="absolute top-24 left-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="w-full max-w-md">
        <div className="bg-white p-10 border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Create Account</h1>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Join the GenZ community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Full Name</label>
              <input name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" placeholder="John Doe" required />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Password</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors pr-10 [&::-ms-reveal]:hidden" placeholder="Min. 6 characters" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Confirm Password</label>
              <div className="relative">
                <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors pr-10 [&::-ms-reveal]:hidden" placeholder="Confirm your password" required minLength={6} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white text-xs font-bold uppercase tracking-[0.15em] py-4 hover:bg-gray-900 disabled:bg-gray-300 transition-colors"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">or</p>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="mt-6 w-full flex items-center justify-center gap-3 border border-gray-200 py-3.5 px-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all duration-300"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-black font-bold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
