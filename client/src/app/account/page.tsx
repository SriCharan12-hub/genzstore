'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<(Address & { _id?: string }) | null>(null);
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please login to view your account');
      router.push('/auth/login');
    }
  }, [status, router]);

  // Fetch data from API
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
      
      if (!token) {
        console.warn('No token available');
        setOrders([]);
        return;
      }

      const res = await fetch(`${API_URL}/api/orders/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error('Failed to fetch orders:', res.status);
        setOrders([]);
        return;
      }

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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
    if (!confirm('Are you sure you want to delete this address?')) return;
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
    setAddressForm({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
    });
    setShowAddressModal(true);
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

  const tabs = [
    { id: 'orders' as const, label: 'My Orders', icon: Package },
    { id: 'addresses' as const, label: 'Addresses', icon: MapPin },
  ];

  return (
    <div className="pt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-10">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all ${
                    activeTab === tab.id ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-red-500 hover:bg-red-50 transition-all mt-4">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-6">Order History</h2>
                {loadingOrders ? (
                  <p className="text-sm text-gray-500">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-gray-500">No orders yet. Start shopping now!</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div 
                        key={order._id} 
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                        }}
                        className="border border-gray-100 p-6 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-sm font-bold">{order._id}</span>
                            <span className="text-xs text-gray-400 ml-3">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${statusColors[order.status] || 'bg-gray-50 text-gray-700'}`}>
                              {order.status}
                            </span>
                            <span className="text-xs text-gray-400">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</span>
                          </div>
                          <span className="text-sm font-bold">{formatPrice(order.totalPrice)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}



            {activeTab === 'addresses' && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-6">Saved Addresses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loadingAddresses ? (
                    <p className="text-sm text-gray-500">Loading addresses...</p>
                  ) : addresses.length === 0 ? (
                    <div className="md:col-span-2 py-10 text-center border-2 border-dashed border-gray-100">
                       <p className="text-sm text-gray-400">No saved addresses yet.</p>
                    </div>
                  ) : (
                    addresses.map((addr: any) => (
                      <div key={addr._id} className="border border-gray-200 p-6 relative group">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Address</span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openEditModal(addr)}
                              className="text-gray-400 hover:text-black transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAddress(addr._id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 font-bold">{session?.user?.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{addr.street}</p>
                        <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
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
                    className="border border-dashed border-gray-300 p-6 flex flex-col items-center justify-center gap-2 text-sm text-gray-400 hover:border-black hover:text-black transition-all min-h-[160px]"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add New Address</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">Order Details</h2>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Order Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order ID</p>
                  <p className="text-sm font-bold font-mono">{selectedOrder._id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order Date</p>
                  <p className="text-sm font-bold">{new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded inline-block ${statusColors[selectedOrder.status] || 'bg-gray-50 text-gray-700'}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Items Purchased */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Items Purchased</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 pb-3 border-b border-gray-100 last:border-b-0">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover rounded"
                          />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Qty: <span className="font-semibold">{item.quantity}</span>
                          {item.size && ` • Size: ${item.size}`}
                          {item.color && ` • Color: ${item.color}`}
                        </p>
                        <p className="text-sm font-semibold mt-2">{formatPrice(item.price)} each</p>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Shipping Address
                </h3>
                <div className="bg-gray-50 p-4 rounded">
                  {selectedOrder.shippingAddress ? (
                    <>
                      <p className="text-sm font-semibold">{selectedOrder.shippingAddress.name || 'Address'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedOrder.shippingAddress.street}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.pincode}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.country}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No address information</p>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Information
                </h3>
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold">{paymentMethodNames[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</span>
                  </div>
                  {selectedOrder.paymentResult?.id && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-[11px]">{selectedOrder.paymentResult.id}</span>
                    </div>
                  )}
                  {selectedOrder.paymentResult?.status && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className={selectedOrder.paymentResult.status === 'success' ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                        {selectedOrder.paymentResult.status === 'success' ? '✓ Paid' : 'Pending'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Details */}
              <div className="bg-gray-50 p-4 rounded">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping:</span>
                    <span>{selectedOrder.shippingPrice === 0 ? 'Free' : formatPrice(selectedOrder.shippingPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span>{formatPrice(selectedOrder.taxPrice)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2">
                    <span>Total:</span>
                    <span>{formatPrice(selectedOrder.totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setSelectedOrder(null);
                }}
                className="w-full py-3 bg-black text-white font-bold uppercase text-sm rounded hover:bg-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
              <button 
                onClick={() => {
                  setShowAddressModal(false);
                  setEditingAddress(null);
                }}
                className="text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  className="w-full border border-gray-200 px-4 py-2 text-sm focus:border-black outline-none transition-colors"
                  placeholder="Street name, apartment, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full border border-gray-200 px-4 py-2 text-sm focus:border-black outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full border border-gray-200 px-4 py-2 text-sm focus:border-black outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full border border-gray-200 px-4 py-2 text-sm focus:border-black outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Country</label>
                  <select
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="w-full border border-gray-200 px-4 py-2 text-sm focus:border-black outline-none transition-colors"
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
                className="w-full py-3 bg-black text-white font-bold uppercase text-xs tracking-widest mt-4 hover:bg-gray-900 transition-colors"
              >
                {editingAddress ? 'Update Address' : 'Save Address'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
