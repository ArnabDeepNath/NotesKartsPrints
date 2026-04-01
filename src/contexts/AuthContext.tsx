"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { api, setAccessToken, User } from "@/lib/api";

interface CartItem {
  bookId: string;
  title: string;
  author: string;
  price: number;
  coverImage?: string;
  quantity: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (bookId: string) => void;
  updateCartQty: (bookId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const initialized = useRef(false);

  // Restore cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("basak_cart");
      if (stored) setCart(JSON.parse(stored));
    } catch {}
  }, []);

  // Persist cart
  useEffect(() => {
    localStorage.setItem("basak_cart", JSON.stringify(cart));
  }, [cart]);

  // Try to restore session on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const restore = async () => {
      try {
        // Attempt silent refresh
        const refreshRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/refresh`,
          { method: "POST", credentials: "include" },
        );
        if (refreshRes.ok) {
          const { accessToken } = await refreshRes.json();
          setAccessToken(accessToken);
          const { user: me } = await api.auth.me();
          setUser(me);
        }
      } catch {
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data: any = await api.auth.login({ email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data: any = await api.auth.register({ name, email, password });
      setAccessToken(data.accessToken);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {}
    setAccessToken(null);
    setUser(null);
    setCart([]);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  }, []);

  // ─── Cart ─────────────────────────────────────────────────────────────────
  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.bookId === item.bookId);
      if (existing) {
        return prev.map((i) =>
          i.bookId === item.bookId
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i,
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  }, []);

  const removeFromCart = useCallback((bookId: string) => {
    setCart((prev) => prev.filter((i) => i.bookId !== bookId));
  }, []);

  const updateCartQty = useCallback((bookId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.bookId !== bookId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.bookId === bookId ? { ...i, quantity: qty } : i)),
      );
    }
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
