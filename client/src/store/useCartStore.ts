import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartStore {
  // Keyed by userId
  users: Record<string, CartItem[]>;
  getItems: (userId: string) => CartItem[];
  addItem: (userId: string, item: CartItem) => void;
  removeItem: (userId: string, id: string, size?: string, color?: string) => void;
  updateQuantity: (userId: string, id: string, quantity: number, size?: string, color?: string) => void;
  clearCart: (userId: string) => void;
  totalItems: (userId: string) => number;
  totalPrice: (userId: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      users: {},
      getItems: (userId) => !userId ? [] : (get().users[userId] || []),
      addItem: (userId, item) => {
        const current = get().users[userId] || [];
        const existing = current.find(
          (i) => i.id === item.id && i.size === item.size && i.color === item.color
        );
        let updated: CartItem[];
        if (existing) {
          updated = current.map((i) =>
            i.id === item.id && i.size === item.size && i.color === item.color
              ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) }
              : i
          );
        } else {
          updated = [...current, item];
        }
        set({ users: { ...get().users, [userId]: updated } });
      },
      removeItem: (userId, id, size, color) => {
        const current = get().users[userId] || [];
        const updated = current.filter(
          (i) => !(i.id === id && (size === undefined || i.size === size) && (color === undefined || i.color === color))
        );
        set({ users: { ...get().users, [userId]: updated } });
      },
      updateQuantity: (userId, id, quantity, size, color) => {
        const current = get().users[userId] || [];
        const updated = current.map((i) => {
          const match = i.id === id &&
            (size === undefined || i.size === size) &&
            (color === undefined || i.color === color);
          return match ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i;
        });
        set({ users: { ...get().users, [userId]: updated } });
      },
      clearCart: (userId) => {
        set({ users: { ...get().users, [userId]: [] } });
      },
      totalItems: (userId) => !userId ? 0 : (get().users[userId] || []).reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: (userId) => !userId ? 0 : (get().users[userId] || []).reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    { name: 'genzstore-cart-v2' }
  )
);
