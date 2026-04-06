'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';

interface RazorpayPaymentProps {
  amount: number;
  orderId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  onPaymentSuccess: (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayPayment({
  amount,
  orderId,
  customerEmail,
  customerName,
  customerPhone,
  onPaymentSuccess,
  onPaymentError,
  isProcessing,
}: RazorpayPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script once on component mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      toast.error('Failed to load Razorpay. Please refresh and try again.');
      onPaymentError('Razorpay script failed to load');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onPaymentError]);

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Razorpay is still loading. Please wait...');
      return;
    }

    if (isLoading || isProcessing) {
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create Razorpay Order on backend
      const orderResponse = await fetch(`${API_URL}/api/payments/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount, // in rupees
          currency: 'INR',
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.message || 'Failed to create Razorpay order');
      }

      const orderData = await orderResponse.json();
      const razorpayOrderId = orderData.order.id;
      const keyId = orderData.keyId;

      // Step 2: Open Razorpay Checkout Modal
      const options = {
        key: keyId,
        amount: Math.round(amount * 100), // amount in paise
        currency: 'INR',
        name: 'GenZ Store',
        description: 'Premium Fashion Apparel',
        order_id: razorpayOrderId,
        customer_notify: 1,
        
        // Customer details
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },

        // Theme
        theme: {
          color: '#000000',
        },

        // Handler for successful payment
        handler: async (response: any) => {
          try {
            // Step 3: Verify payment signature on backend
            const verifyResponse = await fetch(
              `${API_URL}/api/payments/razorpay/verify`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            if (!verifyResponse.ok) {
              const error = await verifyResponse.json();
              throw new Error(error.message || 'Payment verification failed');
            }

            const verifyData = await verifyResponse.json();

            if (verifyData.verified) {
              // Step 4: Payment successful - return data to checkout
              toast.success(`✓ Payment verified successfully!`);
              onPaymentSuccess({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
            } else {
              throw new Error('Payment signature verification failed');
            }
          } catch (error: any) {
            const errorMsg = error instanceof Error ? error.message : 'Verification failed';
            toast.error(`Payment Error: ${errorMsg}`);
            onPaymentError(errorMsg);
          } finally {
            setIsLoading(false);
          }
        },

        // Handler for payment errors
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            // Payment modal dismissed by user
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'Payment initiation failed';
      console.error('Payment error:', error);
      toast.error(`Error: ${errorMsg}`);
      onPaymentError(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 p-6 rounded-lg">
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-sm font-bold uppercase mb-2">Razorpay Payment</h3>
        <p className="text-xs text-gray-500">
          Secure payment via Razorpay - UPI, Cards, Netbanking accepted
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 p-4 rounded mb-6">
        <div className="text-xs text-gray-600 space-y-2">
          <div className="flex justify-between">
            <span>Amount to Pay:</span>
            <span className="font-bold">₹{amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Order ID:</span>
            <span className="font-mono text-[10px]">{orderId.slice(0, 20)}...</span>
          </div>
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{customerName}</span>
          </div>
        </div>
      </div>

      {/* Test Card Info */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded mb-6">
        <p className="text-sm font-bold mb-2">Available Payment Methods:</p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>✓ UPI (Google Pay, PhonePe, BHIM)</li>
          <li>✓ Debit/Credit Cards</li>
          <li>✓ Net Banking</li>
          <li>✓ Wallets (Paytm, Amazon Pay)</li>
        </ul>
        <p className="text-[10px] text-amber-700 mt-3">
          For testing: Use any test card from Razorpay documentation
        </p>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isLoading || isProcessing || !razorpayLoaded}
        className={`w-full py-3 font-bold uppercase text-sm transition-all ${
          isLoading || isProcessing || !razorpayLoaded
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-black text-white hover:bg-gray-800 active:bg-black'
        }`}
      >
        {!razorpayLoaded
          ? 'Loading Payment Gateway...'
          : isLoading || isProcessing
            ? 'Processing Payment...'
            : `Pay ₹${amount.toFixed(2)} Securely`}
      </button>

      <p className="text-[10px] text-gray-400 text-center mt-3">
        🔒 Payments are encrypted and secure
      </p>
    </div>
  );
}
