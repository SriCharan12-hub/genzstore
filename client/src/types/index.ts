export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  category: string;
  subcategory?: string;
  brand: string;
  images: string[];
  stock: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  reviews: Review[];
  ratings: number;
  numReviews: number;
  createdAt: string;
}

export interface Review {
  _id: string;
  user: string | { _id: string; name: string; avatar?: string };
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  stock: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  phone?: string;
  addresses: Address[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Order {
  _id: string;
  user: string | User;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: 'razorpay' | 'cod';
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
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface OrderItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  pages?: number;
  source?: string;
}
