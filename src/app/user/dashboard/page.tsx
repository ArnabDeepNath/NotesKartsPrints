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
  PENDING: "bg-[#f5a623]/15 text-[#f5a623]",
  PAID: "bg-[#30d158]/15 text-[#30d158]",
  PROCESSING: "bg-[#2997ff]/15 text-[#2997ff]",
  SHIPPED: "bg-[#bf5af2]/15 text-[#bf5af2]",
  DELIVERED: "bg-[#30d158]/15 text-[#30d158]",
  CANCELLED: "bg-[#ff453a]/15 text-[#ff453a]",
  REFUNDED: "bg-white/[0.08] text-[#86868b]",
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
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="pt-24 pb-20 px-6 max-w-5xl mx-auto">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="text-[#86868b] text-sm mb-1">Welcome back,</p>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            {user.name}
          </h1>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "Total Orders",
              value: stats.orders,
              icon: "📦",
              link: "/user/orders",
              color: "#2997ff",
            },
            {
              label: "Wishlist",
              value: stats.wishlist,
              icon: "♡",
              link: "/user/wishlist",
              color: "#ff453a",
            },
            {
              label: "Library",
              value: stats.orders,
              icon: "📚",
              link: "/user/library",
              color: "#30d158",
            },
            {
              label: "Reviews",
              value: user._count?.orders || 0,
              icon: "★",
              link: "#",
              color: "#f5a623",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <Link href={stat.link}>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 hover:border-white/[0.15] transition-all cursor-pointer">
                  <div className="text-2xl mb-3">{stat.icon}</div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-[#86868b]">{stat.label}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {[
            {
              label: "Browse Books",
              link: "/books",
              icon: "🔍",
              desc: "Explore new titles",
            },
            {
              label: "My Library",
              link: "/user/library",
              icon: "📖",
              desc: "Your purchased books",
            },
            {
              label: "Wishlist",
              link: "/user/wishlist",
              icon: "💝",
              desc: "Saved for later",
            },
            {
              label: "My Orders",
              link: "/user/orders",
              icon: "🛍️",
              desc: "Track your orders",
            },
            {
              label: "Profile",
              link: "/user/profile",
              icon: "👤",
              desc: "Update your info",
            },
            {
              label: "Settings",
              link: "/user/profile#password",
              icon: "⚙️",
              desc: "Password & security",
            },
          ].map((link, i) => (
            <motion.div
              key={link.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              whileHover={{ y: -4 }}
            >
              <Link href={link.link}>
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 hover:border-white/[0.15] transition-all cursor-pointer">
                  <div className="text-xl mb-2">{link.icon}</div>
                  <div className="text-sm font-semibold text-white mb-0.5">
                    {link.label}
                  </div>
                  <div className="text-xs text-[#86868b]">{link.desc}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">Recent Orders</h2>
            <Link
              href="/user/orders"
              className="text-sm text-[#2997ff] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl overflow-hidden">
            {loadingOrders ? (
              <div className="p-8 text-center text-[#86868b]">
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-3">🛍️</div>
                <p className="text-[#86868b] text-sm">No orders yet</p>
                <Link href="/books">
                  <button className="mt-4 bg-[#2997ff] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#1a83ff] transition-colors">
                    Start Shopping
                  </button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-[#86868b]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#86868b]">
                        {order.items?.length || 0} item(s)
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${STATUS_COLORS[order.status] || ""}`}
                      >
                        {order.status}
                      </span>
                      <span className="text-sm font-bold text-white">
                        ₹{Number(order.total).toFixed(0)}
                      </span>
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
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
