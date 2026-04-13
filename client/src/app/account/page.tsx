'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Package, MapPin, LogOut, ChevronRight, X, CreditCard, Plus, Edit2, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { Address } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const paymentMethodNames: Record<string, string> = {
  razorpay: '💳 Razorpay',
  cod: '🚚 Cash on Delivery',
};

export default function AccountPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<(Address & { _id?: string }) | null>(null);
  const [addressForm, setAddressForm] = useState({
    street: '', city: '', state: '', pincode: '', country: 'India',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please login to view your account');
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchOrders();
      fetchProfile();
    }
  }, [status, session]);

  const fetchProfile = async () => {
    try {
      setLoadingAddresses(true);
      const token = (session?.user as any)?.accessToken;
      if (!token) return;
      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setAddresses(json.data.addresses || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const token = (session?.user as any)?.accessToken;
      if (!token) { setOrders([]); return; }
      const res = await fetch(`${API_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setOrders([]); return; }
      const data = await res.json();
      setOrders(data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (session?.user as any)?.accessToken;
      if (!token) return;
      const method = editingAddress?._id ? 'PUT' : 'POST';
      const url = editingAddress?._id
        ? `${API_URL}/api/users/address/${editingAddress._id}`
        : `${API_URL}/api/users/address`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(addressForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingAddress?._id ? 'Address updated' : 'Address added');
        setAddresses(data.data);
        setShowAddressModal(false);
        setEditingAddress(null);
        setAddressForm({ street: '', city: '', state: '', pincode: '', country: 'India' });
      } else {
        toast.error(data.message || 'Failed to save address');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      const token = (session?.user as any)?.accessToken;
      if (!token) return;
      const res = await fetch(`${API_URL}/api/users/address/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Address deleted');
        setAddresses(data.data);
      } else {
        toast.error(data.message || 'Failed to delete address');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const openEditModal = (addr: Address & { _id?: string }) => {
    setEditingAddress(addr);
    setAddressForm({ street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode, country: addr.country });
    setShowAddressModal(true);
  };

  if (status === 'loading') {
    return (
      <div className="pt-14 sm:pt-20 min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  const tabs = [
    { id: 'orders' as const, label: 'My Orders', icon: Package },
    { id: 'addresses' as const, label: 'Addresses', icon: MapPin },
  ];

  return (
    <div className="pt-14 sm:pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div>
            <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight">My Account</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{session?.user?.name} · {session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold uppercase tracking-wider text-red-500 border border-red-200 hover:bg-red-50 transition-all rounded-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        {/* Mobile/Tablet: Horizontal Tab Bar */}
        <div className="flex border-b border-gray-100 mb-6 sm:mb-8 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 sm:mb-6 text-gray-500">
                Order History · {orders.length} order{orders.length !== 1 ? 's' : ''}
              </h2>
              {loadingOrders ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />)}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-sm">
                  <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">No orders yet. Start shopping!</p>
                  <a href="/products" className="inline-block px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider">
                    Shop Now
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                      className="border border-gray-100 p-4 sm:p-6 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer active:bg-gray-50 rounded-sm"
                    >
                      <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Order</p>
                          <span className="text-xs sm:text-sm font-bold font-mono truncate block">{order._id.slice(-10)}...</span>
                          <span className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-50 text-gray-700'}`}>
                            {order.status}
                          </span>
                          <span className="text-xs text-gray-400">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-sm font-black">{formatPrice(order.totalPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 sm:mb-6 text-gray-500">Saved Addresses</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {loadingAddresses ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : addresses.length === 0 ? (
                  <div className="sm:col-span-2 py-10 text-center border-2 border-dashed border-gray-100 rounded-sm">
                    <MapPin className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No saved addresses yet.</p>
                  </div>
                ) : (
                  addresses.map((addr: any) => (
                    <div key={addr._id} className="border border-gray-200 p-4 sm:p-6 relative group rounded-sm">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Address</span>
                        <div className="flex gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(addr)}
                            className="text-gray-400 hover:text-black transition-colors p-1"
                            aria-label="Edit address"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            aria-label="Delete address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 font-bold">{session?.user?.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{addr.street}</p>
                      <p className="text-sm text-gray-500">{addr.city}, {addr.state} — {addr.pincode}</p>
                      <p className="text-sm text-gray-500">{addr.country}</p>
                    </div>
                  ))
                )}
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressForm({ street: '', city: '', state: '', pincode: '', country: 'India' });
                    setShowAddressModal(true);
                  }}
                  className="border border-dashed border-gray-300 p-4 sm:p-6 flex flex-col items-center justify-center gap-2 text-sm text-gray-400 hover:border-black hover:text-black transition-all min-h-[120px] sm:min-h-[160px] rounded-sm"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs font-medium uppercase tracking-wider">Add New Address</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal — Bottom sheet on mobile */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between rounded-t-2xl sm:rounded-t-lg">
              <h2 className="text-base sm:text-lg font-bold">Order Details</h2>
              <button
                onClick={() => { setShowOrderModal(false); setSelectedOrder(null); }}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Order Header */}
              <div className="grid grid-cols-3 gap-3 pb-4 border-b border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">Order ID</p>
                  <p className="text-xs font-bold font-mono truncate">{selectedOrder._id.slice(-10)}...</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">Date</p>
                  <p className="text-xs font-bold">{new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">Status</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full inline-block ${statusColors[selectedOrder.status] || 'bg-gray-50 text-gray-700'}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-3 sm:mb-4">Items Purchased</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="flex gap-3 pb-3 border-b border-gray-100 last:border-b-0">
                      <div className="w-14 h-14 bg-gray-100 rounded flex-shrink-0">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Qty: <span className="font-semibold">{item.quantity}</span>
                          {item.size && ` · Size: ${item.size}`}
                          {item.color && ` · ${item.color}`}
                        </p>
                        <p className="text-sm font-semibold mt-1">{formatPrice(item.price)} each</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Shipping Address
                </h3>
                <div className="bg-gray-50 p-3 sm:p-4 rounded text-sm">
                  {selectedOrder.shippingAddress ? (
                    <>
                      <p className="font-semibold">{selectedOrder.shippingAddress.name}</p>
                      <p className="text-gray-600 mt-1">{selectedOrder.shippingAddress.street}</p>
                      <p className="text-gray-600">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.pincode}</p>
                      <p className="text-gray-600">{selectedOrder.shippingAddress.country}</p>
                    </>
                  ) : <p className="text-gray-500">No address information</p>}
                </div>
              </div>

              {/* Payment */}
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" /> Payment
                </h3>
                <div className="bg-gray-50 p-3 sm:p-4 rounded space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Method:</span>
                    <span className="font-semibold">{paymentMethodNames[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</span>
                  </div>
                  {selectedOrder.paymentResult?.status && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={selectedOrder.paymentResult.status === 'success' ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                        {selectedOrder.paymentResult.status === 'success' ? '✓ Paid' : 'Pending'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Details */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span>{formatPrice(selectedOrder.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Shipping:</span><span>{selectedOrder.shippingPrice === 0 ? 'Free' : formatPrice(selectedOrder.shippingPrice)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Tax:</span><span>{formatPrice(selectedOrder.taxPrice)}</span></div>
                  <div className="flex justify-between font-black text-base border-t border-gray-200 pt-2 mt-2"><span>Total:</span><span>{formatPrice(selectedOrder.totalPrice)}</span></div>
                </div>
              </div>

              <button
                onClick={() => { setShowOrderModal(false); setSelectedOrder(null); }}
                className="w-full py-3 bg-black text-white font-bold uppercase text-xs tracking-widest rounded hover:bg-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Modal — Bottom sheet on mobile */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <h2 className="text-base sm:text-lg font-bold">{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
                <button
                  onClick={() => { setShowAddressModal(false); setEditingAddress(null); }}
                  className="text-gray-400 hover:text-black w-8 h-8 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddressSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Street Address</label>
                  <input
                    type="text" required value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-black outline-none transition-colors"
                    placeholder="Street name, apartment, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">City</label>
                    <input type="text" required value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-black outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">State</label>
                    <input type="text" required value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-black outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Pincode</label>
                    <input type="text" required value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-black outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Country</label>
                    <select
                      value={addressForm.country}
                      onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-black outline-none transition-colors bg-white"
                    >
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-black text-white font-bold uppercase text-xs tracking-widest mt-2 hover:bg-gray-900 transition-colors"
                >
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
