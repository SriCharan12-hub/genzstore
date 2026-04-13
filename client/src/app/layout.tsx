import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: {
    default: "GenZ Store | Premium Streetwear",
    template: "%s | GenZ Store",
  },
  description: "Premium streetwear for the digital generation. Shop the latest collection of hoodies, tees, outerwear, and accessories.",
  keywords: ["streetwear", "fashion", "premium", "gen z", "clothing", "hoodies", "sneakers"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${outfit.variable} font-sans antialiased text-black bg-white`}>
        <AuthProvider>
          <Toaster position="bottom-center" toastOptions={{ duration: 5000, style: { background: '#000', color: '#fff', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '0' } }} />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
