"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, Order } from "@/lib/api";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-500",
};

export default function UserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ orders: 0, wishlist: 0 });
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setStats({
      orders: user._count?.orders || 0,
      wishlist: user._count?.wishlist || 0,
    });
    api.users
      .orders({ limit: "5" })
      .then(({ orders: o }) => setOrders(o))
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [user]);

  if (authLoading || !user) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar />
      <main className="pt-6 pb-20 px-4 max-w-5xl mx-auto">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-4">
          <p className="text-gray-500 text-sm mb-1">Welcome back,</p>
          <h1 className="text-3xl font-bold text-[#232f3e]">{user.name}</h1>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Orders", value: stats.orders, icon: "📦", link: "/user/orders" },
            { label: "Wishlist", value: stats.wishlist, icon: "♡", link: "/user/wishlist" },
            { label: "Library", value: stats.orders, icon: "📚", link: "/user/library" },
            { label: "Reviews", value: user._count?.orders || 0, icon: "★", link: "#" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link href={stat.link}>
                <div className="bg-white border border-gray-200 rounded-md p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-2xl mb-3">{stat.icon}</div>
                  <div className="text-3xl font-bold text-[#e47911] mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Browse Books", link: "/books", icon: "🔍", desc: "Explore new titles" },
            { label: "My Library", link: "/user/library", icon: "📖", desc: "Your purchased books" },
            { label: "Wishlist", link: "/user/wishlist", icon: "💝", desc: "Saved for later" },
            { label: "My Orders", link: "/user/orders", icon: "🛍️", desc: "Track your orders" },
            { label: "Profile", link: "/user/profile", icon: "👤", desc: "Update your info" },
            { label: "Settings", link: "/user/profile#password", icon: "⚙️", desc: "Password & security" },
          ].map((link, i) => (
            <motion.div key={link.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
              <Link href={link.link}>
                <div className="bg-white border border-gray-200 rounded-md p-4 hover:shadow-md hover:border-[#e47911] transition-all cursor-pointer">
                  <div className="text-xl mb-2">{link.icon}</div>
                  <div className="text-sm font-semibold text-[#232f3e] mb-0.5">{link.label}</div>
                  <div className="text-xs text-gray-500">{link.desc}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#232f3e]">Recent Orders</h2>
            <Link href="/user/orders" className="text-sm text-[#146eb4] hover:underline">View all</Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            {loadingOrders ? (
              <div className="p-8 text-center text-gray-500">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-3">🛍️</div>
                <p className="text-gray-500 text-sm">No orders yet</p>
                <Link href="/books">
                  <button className="mt-4 bg-[#e47911] text-white text-sm font-semibold px-6 py-2.5 rounded hover:bg-[#c45500] transition-colors">
                    Start Shopping
                  </button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-[#232f3e]">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{order.items?.length || 0} item(s)</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${STATUS_COLORS[order.status] || ""}`}>
                        {order.status}
                      </span>
                      <span className="text-sm font-bold text-[#232f3e]">Rs. {Number(order.total).toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#e47911] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
