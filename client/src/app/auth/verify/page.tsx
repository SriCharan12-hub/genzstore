'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) {
      toast.error('Please fill in both email and OTP code.');
      return;
    }
    
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      setLoading(false);
      
      if (res.ok && data.success) {
        toast.success(data.message || 'Email verified successfully!');
        router.push('/auth/login');
      } else {
        toast.error(data.message || 'Verification failed');
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
        <div className="bg-white p-10 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Check Your Email</h1>
          <p className="text-xs text-gray-400 uppercase tracking-wider leading-relaxed mb-8">
            We've sent a 6-digit verification code to<br />
            <span className="text-black font-bold">{email || 'your email address'}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Confirm Email"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                required
                disabled={!!emailParam}
              />
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter 6-digit OTP"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors text-center tracking-[0.5em] font-bold"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-black text-white text-xs font-bold uppercase tracking-[0.15em] py-4 hover:bg-gray-900 disabled:bg-gray-300 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyOTPContent />
    </Suspense>
  );
}
