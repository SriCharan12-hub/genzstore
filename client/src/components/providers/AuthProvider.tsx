'use client';
import { SessionProvider } from 'next-auth/react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Prevents constant polling that causes CLIENT_FETCH_ERROR on window focus / tab switch
      refetchOnWindowFocus={false}
      // Disable automatic background re-fetching (0 = off)
      refetchInterval={0}
      // Retry failed session fetches only once instead of spamming the console
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
