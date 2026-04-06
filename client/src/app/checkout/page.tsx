'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { formatPrice } from '@/lib/utils';
import { CreditCard, Truck, Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import RazorpayPayment from '@/components/checkout/RazorpayPayment';
import PaymentGateway from '@/components/checkout/PaymentGateway';
import { Address } from '@/types';
import { MapPin, CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, totalPrice, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('cod');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showCODModal, setShowCODModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', street: '', city: '', state: '', pincode: '', country: 'India',
  });
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please login to checkout');
      router.push('/auth/login');
    }
  }, [status, router]);

  // Populate initial data and fetch saved addresses
  useEffect(() => {
    if (session?.user?.email) {
      setFormData(prev => ({ ...prev, email: session.user?.email || '', name: session.user?.name || '' }));
    }
    if (status === 'authenticated' && session?.user) {
      fetchSavedAddresses();
    }
  }, [session, status]);

  const fetchSavedAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const token = (session?.user as any)?.accessToken;
      if (!token) return;

      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setSavedAddresses(json.data.addresses || []);
      }
    } catch (error) {
      console.error('Error fetching saved addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const selectSavedAddress = (addr: Address, index: number) => {
    setSelectedAddressIndex(index);
    setFormData({
      ...formData,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
    });
  };

  if (status === 'loading') {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  const subtotal = totalPrice();
  const shipping = subtotal >= 100 ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Phone validation: only digits, max 10
    if (name === 'phone') {
      const phoneValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: phoneValue });
      return;
    }

    // Pincode validation: only digits, max 6
    if (name === 'pincode') {
      const pincodeValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData({ ...formData, [name]: pincodeValue });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const createOrder = async () => {
    setIsLoading(true);
    
    try {
      // Get token from NextAuth session
      const token = (session?.user as any)?.accessToken;
      
      if (!token) {
        toast.error('Session expired. Please login again.');
        router.push('/auth/login');
        return;
      }

      // Transform cart items to match backend schema
      const orderItems = items.map(item => ({
        product: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderItems,
          shippingAddress: formData,
          paymentMethod,
          paymentResult: paymentResult || undefined,
          subtotal,
          shippingPrice: shipping,
          taxPrice: tax,
          totalPrice: total,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      toast.success(`Order placed successfully! Total: ${formatPrice(total)}`);
      clearCart();
      setPaymentResult(null);
      setTimeout(() => router.push('/account'), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Order failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation - required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.street || !formData.city || !formData.state || !formData.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Phone validation
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    // Payment method validation
    if (paymentMethod === 'razorpay') {
      // Show Razorpay modal instead of creating order
      setShowRazorpayModal(true);
      return;
    } else if (paymentMethod === 'cod') {
      // Show COD modal instead of creating order directly
      setShowCODModal(true);
      return;
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <button onClick={() => router.back()} className="absolute top-24 left-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-3">No items to checkout</h1>
        <a href="/products" className="mt-4 px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest">
          Shop Now
        </a>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-10">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Form */}
          <div className="lg:col-span-3 space-y-8">
            {/* Contact */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" required />
                <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" type="email" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" required />
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone (10 digits)" type="tel" maxLength={10} className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors md:col-span-2" />
              </div>
            </div>

            {/* Shipping */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider">Shipping Address</h2>
                {savedAddresses.length > 0 && (
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Saved Address</span>
                )}
              </div>

              {/* Saved Addresses Selection */}
              {savedAddresses.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-6 mb-6 scrollbar-hide">
                  {savedAddresses.map((addr, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectSavedAddress(addr, index)}
                      className={`flex-shrink-0 w-64 p-4 border text-left transition-all relative ${
                        selectedAddressIndex === index ? 'border-black bg-gray-50 shadow-sm' : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {selectedAddressIndex === index && (
                        <CheckCircle2 className="w-4 h-4 absolute top-3 right-3 text-black" />
                      )}
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                        <div>
                          <p className="text-xs font-bold truncate pr-6">{addr.street}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{addr.city}, {addr.state}</p>
                          <p className="text-[10px] text-gray-500">{addr.pincode}, {addr.country}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                        setSelectedAddressIndex(null);
                        setFormData({ ...formData, street: '', city: '', state: '', pincode: '', country: 'India' });
                    }}
                    className="flex-shrink-0 w-32 p-4 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center gap-1 hover:border-gray-400 hover:text-black text-gray-400 transition-all"
                  >
                    <span className="text-[10px] font-bold uppercase">Clear</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="street" value={formData.street} onChange={handleChange} placeholder="Street Address" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors md:col-span-2" required />
                <input name="city" value={formData.city} onChange={handleChange} placeholder="City" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" required />
                <input name="state" value={formData.state} onChange={handleChange} placeholder="State" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" required />
                <input name="pincode" value={formData.pincode} onChange={handleChange} placeholder="PIN Code (6 digits)" type="tel" maxLength={6} className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" required />
                <select name="country" value={formData.country} onChange={handleChange} className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors bg-white">
                  <option value="India">India</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Payment Method</h2>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`w-full border p-4 text-left transition-all ${paymentMethod === 'razorpay' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-bold">Razorpay</p>
                      <p className="text-[10px] text-gray-400">UPI, Netbanking, Cards</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`w-full border p-4 text-left transition-all ${paymentMethod === 'cod' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-bold">Cash on Delivery</p>
                      <p className="text-[10px] text-gray-400">Pay on delivery</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 p-8 sticky top-24">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name} × {item.quantity}</span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <hr className="my-4 border-gray-200" />
              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatPrice(tax)}</span></div>
              </div>
              <hr className="my-4 border-gray-200" />
              <div className="flex justify-between text-lg font-black mb-8">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white text-xs font-bold uppercase tracking-[0.15em] py-4 hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Place Order'} — {formatPrice(total)}
              </button>
              <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Free Shipping $100+</span>
              </div>
            </div>
          </div>
        </form>

        {/* Razorpay Payment Modal - Only shown when Place Order is clicked */}
        {showRazorpayModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold">Complete Payment</h3>
                  <button
                    onClick={() => setShowRazorpayModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <RazorpayPayment
                  amount={total}
                  orderId={`order_${Date.now()}`}
                  customerEmail={formData.email}
                  customerName={formData.name}
                  customerPhone={formData.phone}
                  onPaymentSuccess={(paymentData) => {
                    setPaymentResult({
                      ...paymentData,
                      status: 'verified',
                    });
                    setShowRazorpayModal(false);
                    toast.success('Payment verified! Creating order...');
                    createOrder();
                  }}
                  onPaymentError={(error) => {
                    toast.error(`Payment failed: ${error}`);
                    setPaymentResult(null);
                  }}
                  isProcessing={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* COD Payment Modal - Only shown when Place Order is clicked */}
        {showCODModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold">Confirm Cash on Delivery</h3>
                  <button
                    onClick={() => setShowCODModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                  <h4 className="text-sm font-bold uppercase mb-3 text-blue-900">Cash on Delivery</h4>
                  <p className="text-sm text-blue-800 mb-4">
                    Pay with cash when your order is delivered. A verified delivery agent will collect the payment at your doorstep.
                  </p>
                  <div className="bg-white rounded p-3 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-lg">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-blue-700">
                    <p>✓ No advance payment required</p>
                    <p>✓ Verify package before payment</p>
                    <p>✓ Secure delivery with ID verification</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-black"
                    />
                    <span className="text-xs text-gray-700">
                      I confirm that I will pay ₹{total.toFixed(2)} in cash upon delivery.
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCODModal(false)}
                      className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-bold text-sm rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setPaymentResult({
                          id: `cod_${Date.now()}`,
                          status: 'pending',
                          method: 'cod',
                          timestamp: new Date().toISOString(),
                        });
                        setShowCODModal(false);
                        toast.success('COD confirmed! Creating order...');
                        createOrder();
                      }}
                      disabled={isLoading}
                      className="flex-1 py-2 px-4 bg-green-600 text-white font-bold text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Creating...' : 'Confirm COD'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
