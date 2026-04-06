'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Check } from 'lucide-react';

interface PaymentGatewayProps {
  paymentMethod: 'razorpay' | 'cod';
  amount: number;
  onPaymentSuccess: (paymentResult: any) => void;
  isLoading: boolean;
}

export default function PaymentGateway({ 
  paymentMethod, 
  amount, 
  onPaymentSuccess, 
  isLoading 
}: PaymentGatewayProps) {
  const [codAccepted, setCodAccepted] = useState(false);

  const handleCODPayment = () => {
    if (!codAccepted) {
      toast.error('Please confirm the Cash on Delivery terms');
      return;
    }

    toast.success('Cash on Delivery method selected');
    onPaymentSuccess({
      id: `cod_${Date.now()}`,
      status: 'pending',
      method: 'cod',
      timestamp: new Date().toISOString(),
    });
  };

  if (paymentMethod !== 'cod') {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* COD Info Card */}
      <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-lg">
        <h3 className="text-sm font-bold uppercase mb-3 text-blue-900">Cash on Delivery</h3>
        <p className="text-sm text-blue-800 mb-4 leading-relaxed">
          Pay with cash when your order is delivered. A verified delivery agent will collect the payment at your doorstep.
        </p>
        <div className="bg-white rounded p-3 mb-4 border border-blue-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Amount to Pay:</span>
            <span className="font-bold text-lg text-blue-900">₹{(amount / 100).toFixed(2)}</span>
          </div>
        </div>
        <div className="space-y-2 text-xs text-blue-700">
          <p>✓ No advance payment required</p>
          <p>✓ Verify package before payment</p>
          <p>✓ Secure delivery with ID verification</p>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={codAccepted}
            onChange={(e) => setCodAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
            disabled={isLoading}
          />
          <span className="text-xs text-gray-700 leading-relaxed">
            I confirm that I will pay the amount <span className="font-bold">₹{(amount / 100).toFixed(2)}</span> in cash upon delivery. 
            I understand that the delivery partner will verify the package condition before collection.
          </span>
        </label>
      </div>

      {/* Proceed Button */}
      <button
        onClick={handleCODPayment}
        disabled={isLoading || !codAccepted}
        className={`w-full py-3 font-bold uppercase text-sm transition-all flex items-center justify-center gap-2 ${
          isLoading || !codAccepted
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
        }`}
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span> Processing...
          </>
        ) : (
          <>
            {codAccepted && <Check className="w-4 h-4" />}
            Proceed with COD
          </>
        )}
      </button>

      {/* Info Message */}
      <p className="text-[10px] text-gray-500 text-center">
        No payment will be collected until your order is delivered
      </p>
    </div>
  );
}
