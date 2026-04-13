import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistProduct {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number;
  thumbnail?: string;
  images?: string[];
  category: string;
  ratings?: number;
  stock: number;
}

interface WishlistStore {
  // Keyed by userId: stores product objects (not just IDs)
  users: Record<string, WishlistProduct[]>;
  getItems: (userId: string) => WishlistProduct[];
  toggle: (userId: string, product: WishlistProduct) => void;
  has: (userId: string, id: string) => boolean;
  clear: (userId: string) => void;
  count: (userId: string) => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      users: {},
      getItems: (userId) => !userId ? [] : (get().users[userId] || []),
      toggle: (userId, product) => {
        const current = get().users[userId] || [];
        const exists = current.some((p) => p._id === product._id);
        const updated = exists
          ? current.filter((p) => p._id !== product._id)
          : [...current, product];
        set({ users: { ...get().users, [userId]: updated } });
      },
      has: (userId, id) => !userId ? false : (get().users[userId] || []).some((p) => p._id === id),
      clear: (userId) => { if (userId) set({ users: { ...get().users, [userId]: [] } }); },
      count: (userId) => !userId ? 0 : (get().users[userId] || []).length,
    }),
    { name: 'genzstore-wishlist-v2' }
  )
);
