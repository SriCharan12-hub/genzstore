'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Package, LayoutDashboard, ShoppingCart, Plus, Pencil,
  Trash2, BarChart3, Users, X, Save, Loader2
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  category: string;
  brand?: string;
  stock: number;
  description?: string;
  images?: string[];
  sizes?: string[];
  isActive: boolean;
}

interface UserSession {
  role: string;
  accessToken: string;
  email?: string;
  name?: string;
}

const emptyForm = {
  name: '', slug: '', price: '', comparePrice: '', category: '',
  brand: '', stock: '', description: '', images: '', sizes: '', isActive: true,
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'users'>('overview');
  const toastShownRef = useRef<Set<string>>(new Set());

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Image upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedThumbnail, setUploadedThumbnail] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Users state
  interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    createdAt: string;
  }
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Orders state
  interface Order {
    _id: string;
    user: { name: string; email: string };
    items: Array<{ name: string; image: string; quantity: number; price: number; size?: string; color?: string }>;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    };
    paymentMethod: 'stripe' | 'razorpay' | 'cod';
    paymentResult?: {
      id: string;
      status: string;
      paymentId?: string;
      orderId?: string;
    };
    subtotal: number;
    shippingPrice: number;
    taxPrice: number;
    totalPrice: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    isPaid: boolean;
    paidAt?: string;
    isDelivered: boolean;
    deliveredAt?: string;
    createdAt: string;
  }
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Auth guard - Layout and middleware provide primary protection
  useEffect(() => {
    // This is a fallback check in case middleware is bypassed
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && (session?.user as UserSession | undefined)?.role !== 'admin') {
      router.push('/');
    }
  }, [status, session, router]);

  const getToken = () => (session?.user as UserSession | undefined)?.accessToken || '';

  // Fetch all products (including inactive ones for admin)
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_URL}/api/products?limit=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch {
      if (!toastShownRef.current.has('products-error')) {
        toast.error('Failed to load products');
        toastShownRef.current.add('products-error');
      }
    } finally {
      setLoadingProducts(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (activeTab === 'products' && status === 'authenticated') {
      fetchProducts();
    }
  }, [activeTab, status, fetchProducts]);

  // Fetch all users (admin only)
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch {
      if (!toastShownRef.current.has('users-error')) {
        toast.error('Failed to load users');
        toastShownRef.current.add('users-error');
      }
    } finally {
      setLoadingUsers(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (activeTab === 'users' && status === 'authenticated') {
      fetchUsers();
    }
  }, [activeTab, status, fetchUsers]);

  // Update user role
  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    setUpdatingRole(userId);
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        const userName = data.data?.name || 'User';
        if (newRole === 'admin') {
          toast.success(`✅ ${userName} is now an ADMIN!\n\n⚠️ They must log out & log back in to access the admin panel.`, {
            duration: 5000,
          });
        } else {
          toast.success(`✅ ${userName} admin privileges removed.\n\n⚠️ Changes take effect on next login.`, {
            duration: 5000,
          });
        }
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to update role');
      }
    } catch {
      toast.error('Failed to update user role');
    } finally {
      setUpdatingRole(null);
    }
  };

  // Fetch all orders (admin only)
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch {
      if (!toastShownRef.current.has('orders-error')) {
        toast.error('Failed to load orders');
        toastShownRef.current.add('orders-error');
      }
    } finally {
      setLoadingOrders(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (activeTab === 'orders' && status === 'authenticated') {
      fetchOrders();
    }
  }, [activeTab, status, fetchOrders]);

  // Clear error toast ref for current tab on switch
  useEffect(() => {
    const errorKey = `${activeTab}-error`;
    toastShownRef.current.delete(errorKey);
  }, [activeTab]);

  // Fetch data for overview when tab is active
  useEffect(() => {
    if (activeTab === 'overview' && status === 'authenticated') {
      const loadOverviewData = async () => {
        setLoadingOverview(true);
        try {
          const [productsRes, ordersRes] = await Promise.all([
            fetch(`${API_URL}/api/products?limit=100`, {
              headers: { Authorization: `Bearer ${getToken()}` },
            }),
            fetch(`${API_URL}/api/orders`, {
              headers: { Authorization: `Bearer ${getToken()}` },
            }),
          ]);
          const productsData = await productsRes.json();
          const ordersData = await ordersRes.json();
          if (productsData.success) setProducts(productsData.data);
          if (ordersData.success) setOrders(ordersData.data);
        } catch {
          if (!toastShownRef.current.has('overview-error')) {
            toast.error('Failed to load dashboard data');
            toastShownRef.current.add('overview-error');
          }
        } finally {
          setLoadingOverview(false);
        }
      };
      loadOverviewData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, status]);

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderStatus(orderId);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`✅ Order status updated to "${newStatus}"`);
        fetchOrders();
      } else {
        toast.error(data.message || 'Failed to update order status');
      }
    } catch {
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrderStatus(null);
    }
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setSelectedFiles([]);
    setPreviews([]);
    setUploadedThumbnail('');
    setUploadedImages([]);
    setShowForm(true);
  };

  // Open form for edit
  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      price: String(product.price),
      comparePrice: String(product.comparePrice || ''),
      category: product.category,
      brand: product.brand || '',
      stock: String(product.stock),
      description: product.description || '',
      images: (product.images || []).join(', '),
      sizes: (product.sizes || []).join(', '),
      isActive: product.isActive,
    });
    // Show existing images as previews
    const existingUrls = [(product as any).thumbnail, ...(product.images || [])].filter(Boolean);
    setPreviews(existingUrls);
    setSelectedFiles([]);
    setUploadedThumbnail((product as any).thumbnail || '');
    setUploadedImages(product.images || []);
    setShowForm(true);
  };

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setForm((f) => ({
      ...f,
      name: val,
      slug: editingProduct ? f.slug : val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }));
  };

  // Handle file selection with previews
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles(files);
    setUploadedThumbnail('');
    setUploadedImages([]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  // Upload files to Cloudinary via backend
  const uploadImages = async (): Promise<{ thumbnail: string; images: string[] }> => {
    if (selectedFiles.length === 0) {
      return { thumbnail: uploadedThumbnail, images: uploadedImages };
    }
    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((f) => formData.append('images', f));
      const res = await fetch(`${API_URL}/api/upload/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Upload failed');
      return { thumbnail: data.thumbnail, images: data.images };
    } catch (err: any) {
      console.error('Upload Error:', err);
      toast.error(err.message || 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Submit: Create or Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Step 1: Upload images to Cloudinary if new files selected
      let thumbnail = uploadedThumbnail;
      let galleryImages = uploadedImages;

      if (selectedFiles.length > 0) {
        const uploaded = await uploadImages();
        thumbnail = uploaded.thumbnail;
        galleryImages = uploaded.images;
      }

      const payload = {
        name: form.name,
        slug: form.slug,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        category: form.category,
        brand: form.brand,
        stock: Number(form.stock),
        description: form.description,
        thumbnail,
        images: galleryImages,
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        isActive: form.isActive,
      };

      const url = editingProduct
        ? `${API_URL}/api/products/${editingProduct._id}`
        : `${API_URL}/api/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingProduct ? 'Product updated!' : 'Product created!');
        setShowForm(false);
        fetchProducts();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (err: any) {
      console.error('Save Product Error:', err);
      toast.error(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Product deleted');
        setProducts((prev) => prev.filter((p) => p._id !== id));
      } else {
        toast.error(data.message || 'Delete failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (status === 'unauthenticated' || (session?.user as UserSession | undefined)?.role !== 'admin') {
    return null;
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'products' as const, label: 'Products', icon: Package },
    { id: 'orders' as const, label: 'Orders', icon: ShoppingCart },
    { id: 'users' as const, label: 'Users', icon: Users },
  ];

  return (
    <div>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 block mb-1">Admin Panel</span>
            <h1 className="text-3xl font-black uppercase tracking-tight">Dashboard</h1>
          </div>
          {activeTab === 'products' && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-black text-white text-xs font-bold uppercase tracking-wider px-5 py-3 hover:bg-gray-900 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-10 border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px ${
                activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            {loadingOverview ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: 'Total Products',
                      value: products.length,
                      icon: Package,
                      color: 'text-purple-600 bg-purple-50 border-purple-100',
                    },
                    {
                      label: 'Total Orders',
                      value: orders.length,
                      icon: ShoppingCart,
                      color: 'text-blue-600 bg-blue-50 border-blue-100',
                    },
                    {
                      label: 'Total Revenue',
                      value: `₹${orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0).toLocaleString()}`,
                      icon: BarChart3,
                      color: 'text-green-600 bg-green-50 border-green-100',
                    },
                    {
                      label: 'Unique Customers',
                      value: new Set(orders.map((o) => o.user.email)).size,
                      icon: Users,
                      color: 'text-orange-600 bg-orange-50 border-orange-100',
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className={`border rounded-lg p-4 md:p-6 ${stat.color}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-bold uppercase tracking-wider opacity-75 mb-2">
                            {stat.label}
                          </p>
                          <p className="text-2xl md:text-3xl font-black tracking-tight">
                            {stat.value}
                          </p>
                        </div>
                        <stat.icon className="w-8 h-8 opacity-50" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Orders Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    Recent Orders
                  </h3>

                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">No orders yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left px-4 py-3 font-bold text-gray-700 whitespace-nowrap">
                              Order ID
                            </th>
                            <th className="text-left px-4 py-3 font-bold text-gray-700 whitespace-nowrap">
                              Customer
                            </th>
                            <th className="text-center px-4 py-3 font-bold text-gray-700 whitespace-nowrap">
                              Amount
                            </th>
                            <th className="text-center px-4 py-3 font-bold text-gray-700 whitespace-nowrap">
                              Status
                            </th>
                            <th className="text-center px-4 py-3 font-bold text-gray-700 whitespace-nowrap">
                              Payment
                            </th>
                            <th className="text-center px-4 py-3 font-bold text-gray-700 whitespace-nowrap">
                              Date
                            </th>
                            <th className="text-center px-4 py-3 font-bold text-gray-700 whitespace-nowrap">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders
                            .slice(0, 5)
                            .reverse()
                            .map((order) => (
                              <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-700 font-mono text-xs whitespace-nowrap">
                                  {order._id.substring(0, 8)}
                                </td>
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="text-gray-700 font-medium text-sm">
                                      {order.user.name}
                                    </p>
                                    <p className="text-gray-500 text-xs">{order.user.email}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-gray-700 whitespace-nowrap">
                                  ₹{order.totalPrice.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <span
                                    className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${
                                      order.status === 'delivered'
                                        ? 'bg-green-100 text-green-700'
                                        : order.status === 'shipped'
                                        ? 'bg-blue-100 text-blue-700'
                                        : order.status === 'processing'
                                        ? 'bg-purple-100 text-purple-700'
                                        : order.status === 'cancelled'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}
                                  >
                                    {order.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <span
                                    className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${
                                      order.isPaid
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {order.isPaid ? '✓ Paid' : '✗ Pending'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap text-center">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold uppercase transition inline-block"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {orders.length > 5 && (
                    <p className="text-xs text-gray-500 mt-4 text-center">
                      Showing latest 5 orders. Go to Orders tab to view all.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── PRODUCTS TAB ─── */}
        {activeTab === 'products' && (
          <div>
            {/* Product Form Modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      {editingProduct ? 'Edit Product' : 'New Product'}
                    </h3>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-black">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Product Name *</label>
                        <input
                          value={form.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          required
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                          placeholder="e.g. Cyber Hoodie"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Slug *</label>
                        <input
                          value={form.slug}
                          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                          required
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                          placeholder="cyber-hoodie"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Category *</label>
                        <input
                          value={form.category}
                          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                          required
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                          placeholder="Hoodies"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Price (₹) *</label>
                        <input
                          type="number" min="0" step="0.01"
                          value={form.price}
                          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                          required
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                          placeholder="1299"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Compare Price (₹)</label>
                        <input
                          type="number" min="0" step="0.01"
                          value={form.comparePrice}
                          onChange={(e) => setForm((f) => ({ ...f, comparePrice: e.target.value }))}
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                          placeholder="1999"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Brand</label>
                        <input
                          value={form.brand}
                          onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                          placeholder="GenZ"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Stock *</label>
                        <input
                          type="number" min="0"
                          value={form.stock}
                          onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                          required
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                          placeholder="50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Sizes (comma separated)</label>
                        <input
                          value={form.sizes}
                          onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))}
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                          placeholder="S, M, L, XL, XXL"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Description</label>
                        <textarea
                          value={form.description}
                          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                          rows={3}
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors resize-none"
                          placeholder="Product description..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                          Product Images
                          <span className="ml-1 text-gray-400 normal-case font-normal">(First image = thumbnail)</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          className="w-full border border-gray-200 px-4 py-3 text-sm text-gray-600 file:mr-4 file:py-1 file:px-3 file:border-0 file:text-xs file:font-bold file:uppercase file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer"
                        />
                        {/* Image Previews */}
                        {previews.length > 0 && (
                          <div className="mt-3 grid grid-cols-4 gap-2">
                            {previews.map((src, i) => (
                              <div key={i} className="relative aspect-square border border-gray-100 overflow-hidden">
                                <img src={src} alt={`preview-${i}`} className="w-full h-full object-cover" />
                                {i === 0 && (
                                  <span className="absolute top-1 left-1 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 uppercase">Thumb</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {uploading && (
                          <p className="text-xs text-blue-500 mt-2 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Uploading to Cloudinary...
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2 flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={form.isActive}
                          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (visible to customers)</label>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-black text-white text-xs font-bold uppercase tracking-wider px-6 py-3 hover:bg-gray-900 disabled:bg-gray-300 transition-colors"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="border border-gray-200 text-xs font-bold uppercase tracking-wider px-6 py-3 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Products Table */}
            {loadingProducts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-200">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-4">No products yet</p>
                <button onClick={openCreate} className="bg-black text-white text-xs font-bold uppercase tracking-wider px-5 py-3">
                  Add Your First Product
                </button>
              </div>
            ) : (
              <div className="border border-gray-100 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 px-6 py-3">Product</th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 px-6 py-3">Category</th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 px-6 py-3">Price</th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 px-6 py-3">Stock</th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 px-6 py-3">Status</th>
                      <th className="text-right text-[10px] font-bold uppercase tracking-wider text-gray-400 px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold">{product.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{product.slug}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 uppercase tracking-wider">{product.category}</td>
                        <td className="px-6 py-4 text-sm font-medium">{formatPrice(product.price)}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={product.stock < 10 ? 'text-red-500 font-bold' : 'text-gray-600'}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${product.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {product.isActive ? 'Active' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(product)}
                              className="p-2 text-gray-400 hover:text-black transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product._id, product.name)}
                              disabled={deletingId === product._id}
                              className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors"
                              title="Delete"
                            >
                              {deletingId === product._id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── ORDERS TAB ─── */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {loadingOrders ? (
              <div className="text-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-200">
                <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded">
                <table className="w-full text-sm min-w-max">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left font-bold text-xs text-gray-600 uppercase whitespace-nowrap">Order ID</th>
                      <th className="px-4 py-3 text-left font-bold text-xs text-gray-600 uppercase whitespace-nowrap">Customer</th>
                      <th className="px-4 py-3 text-right font-bold text-xs text-gray-600 uppercase whitespace-nowrap">Total</th>
                      <th className="px-4 py-3 text-center font-bold text-xs text-gray-600 uppercase whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-center font-bold text-xs text-gray-600 uppercase whitespace-nowrap">Payment</th>
                      <th className="px-4 py-3 text-left font-bold text-xs text-gray-600 uppercase whitespace-nowrap">Date</th>
                      <th className="px-4 py-3 text-center font-bold text-xs text-gray-600 uppercase whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-mono text-xs whitespace-nowrap">{order._id.substring(0, 8)}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-gray-700 font-medium">{order.user.name}</p>
                            <p className="text-gray-500 text-xs">{order.user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-700 whitespace-nowrap">₹{order.totalPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            disabled={updatingOrderStatus === order._id}
                            className={`px-3 py-1 rounded text-xs font-bold uppercase cursor-pointer disabled:opacity-50 ${
                              order.status === 'delivered'
                                ? 'bg-green-50 text-green-700'
                                : order.status === 'shipped'
                                ? 'bg-blue-50 text-blue-700'
                                : order.status === 'processing'
                                ? 'bg-purple-50 text-purple-700'
                                : order.status === 'cancelled'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-yellow-50 text-yellow-700'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${
                            order.isPaid
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {order.isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold uppercase transition inline-block"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Order Details</h2>
                  <p className="text-blue-100 text-sm">Order ID: {selectedOrder._id.substring(0, 8)}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Name</p>
                      <p className="text-gray-900 font-medium">{selectedOrder.user.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Email</p>
                      <p className="text-gray-900 font-medium">{selectedOrder.user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Order Date</p>
                      <p className="text-gray-900 font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Status</p>
                      <p className={`font-bold uppercase text-xs px-2 py-1 rounded inline-block ${
                        selectedOrder.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : selectedOrder.status === 'shipped'
                          ? 'bg-blue-100 text-blue-700'
                          : selectedOrder.status === 'processing'
                          ? 'bg-purple-100 text-purple-700'
                          : selectedOrder.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedOrder.status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    Products Ordered ({selectedOrder.items.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-white rounded border border-gray-200">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded bg-gray-100"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{item.name}</p>
                          {item.size && <p className="text-xs text-gray-600">Size: {item.size}</p>}
                          {item.color && <p className="text-xs text-gray-600">Color: {item.color}</p>}
                          <p className="text-xs text-gray-600 mt-1">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₹{item.price}</p>
                          <p className="text-xs text-gray-600">x{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    📍 Shipping Address
                  </h3>
                  <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-700">
                    <p className="font-medium">{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                    <p>{selectedOrder.shippingAddress.pincode}, {selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    💳 Payment Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-xs text-gray-500 font-semibold uppercase">Payment Method</p>
                      <p className="text-gray-900 font-bold capitalize">{selectedOrder.paymentMethod}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-xs text-gray-500 font-semibold uppercase">Payment Status</p>
                      <p className={`font-bold uppercase text-xs ${
                        selectedOrder.isPaid ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {selectedOrder.isPaid ? '✓ Paid' : '✗ Pending'}
                      </p>
                    </div>
                    {selectedOrder.paymentResult && (
                      <>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 font-semibold uppercase">Transaction ID</p>
                          <p className="text-gray-900 font-mono text-xs break-all">{selectedOrder.paymentResult.id.substring(0, 20)}...</p>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 font-semibold uppercase">Transaction Status</p>
                          <p className="text-gray-900 font-bold capitalize">{selectedOrder.paymentResult.status}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-900">₹{selectedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium text-gray-900">₹{selectedOrder.shippingPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium text-gray-900">₹{selectedOrder.taxPrice.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between font-bold text-lg">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-blue-700">₹{selectedOrder.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Status */}
                {selectedOrder.isDelivered && selectedOrder.deliveredAt && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-green-700 font-medium">
                      ✓ Delivered on {new Date(selectedOrder.deliveredAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex gap-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 font-medium">
                <span className="font-bold">ℹ️ Important:</span> When you promote a user to admin, they must <span className="font-bold">log out and log back in</span> to access the admin panel. Their current session will not be updated automatically.
              </p>
            </div>

            {loadingUsers ? (
              <div className="text-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-200">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-3 text-left font-bold text-xs text-gray-600 uppercase">Name</th>
                      <th className="px-6 py-3 text-left font-bold text-xs text-gray-600 uppercase">Email</th>
                      <th className="px-6 py-3 text-left font-bold text-xs text-gray-600 uppercase">Role</th>
                      <th className="px-6 py-3 text-left font-bold text-xs text-gray-600 uppercase">Joined</th>
                      <th className="px-6 py-3 text-center font-bold text-xs text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-700 font-medium">{user.name}</td>
                        <td className="px-6 py-3 text-gray-600 text-xs">{user.email}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            user.role === 'admin' 
                              ? 'bg-red-50 text-red-700' 
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-500 text-xs">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-center">
                          {user.role === 'user' ? (
                            <button
                              onClick={() => updateUserRole(user._id, 'admin')}
                              disabled={updatingRole === user._id}
                              title="User must log out and log back in to access admin panel"
                              className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 rounded text-xs font-bold uppercase transition"
                            >
                              {updatingRole === user._id ? 'Making...' : 'Make Admin'}
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserRole(user._id, 'user')}
                              disabled={updatingRole === user._id}
                              title="Admin privileges will be removed on next login"
                              className="px-3 py-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 disabled:opacity-50 rounded text-xs font-bold uppercase transition"
                            >
                              {updatingRole === user._id ? 'Removing...' : 'Remove Admin'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
