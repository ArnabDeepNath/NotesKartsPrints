"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/app/components/Navbar";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-[#f5a623]/15 text-[#f5a623]",
  PAID: "bg-[#30d158]/15 text-[#30d158]",
  PROCESSING: "bg-[#2997ff]/15 text-[#2997ff]",
  SHIPPED: "bg-[#bf5af2]/15 text-[#bf5af2]",
  DELIVERED: "bg-[#30d158]/15 text-[#30d158]",
  CANCELLED: "bg-[#ff453a]/15 text-[#ff453a]",
  REFUNDED: "bg-white/[0.08] text-[#86868b]",
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data: any = await api.users.orders({
        page: String(page),
        limit: "10",
      });
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">My Orders</h1>
            <p className="text-[#86868b] mt-2">
              Track and manage your purchases.
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/[0.04] rounded-3xl h-24 animate-pulse"
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No orders yet
              </h3>
              <p className="text-[#86868b] mb-6">
                Your purchases will appear here.
              </p>
              <Link
                href="/books"
                className="bg-[#2997ff] hover:bg-[#1a83ff] text-white font-semibold px-6 py-3 rounded-xl inline-block transition-colors"
              >
                Browse Books
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any, i: number) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-3xl overflow-hidden"
                >
                  {/* Order header */}
                  <button
                    onClick={() =>
                      setSelected(selected?.id === order.id ? null : order)
                    }
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-white">
                          #{order.id.slice(-10).toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${STATUS_COLORS[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#86868b] mt-1">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {" · "}
                        {order.items?.length || 0} item(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        ₹{Number(order.total).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-[#86868b] mt-0.5">
                        incl. GST
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-[#86868b] shrink-0 transition-transform ${selected?.id === order.id ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Order items detail */}
                  <AnimatePresence>
                    {selected?.id === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/[0.06]"
                      >
                        <div className="p-5 space-y-4">
                          {/* Items */}
                          <div className="space-y-3">
                            {order.items?.map((item: any) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3"
                              >
                                {item.book?.coverImage && (
                                  <img
                                    src={item.book.coverImage}
                                    alt={item.book.title}
                                    className="w-10 h-14 object-cover rounded-lg"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {item.book?.title}
                                  </p>
                                  <p className="text-xs text-[#86868b]">
                                    Qty {item.quantity}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-white">
                                  ₹
                                  {Number(
                                    item.price * item.quantity,
                                  ).toLocaleString("en-IN")}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Totals */}
                          <div className="border-t border-white/[0.06] pt-3 space-y-1.5">
                            <div className="flex justify-between text-sm text-[#86868b]">
                              <span>Subtotal</span>
                              <span>
                                ₹
                                {Number(order.subtotal).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm text-[#86868b]">
                              <span>GST (18%)</span>
                              <span>
                                ₹{Number(order.tax).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-white pt-1">
                              <span>Total</span>
                              <span>
                                ₹{Number(order.total).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>

                          {/* Shipping */}
                          {order.shippingName && (
                            <div className="border-t border-white/[0.06] pt-3">
                              <p className="text-[10px] font-semibold text-[#48484a] uppercase tracking-wider mb-2">
                                Shipping To
                              </p>
                              <p className="text-sm text-white">
                                {order.shippingName}
                              </p>
                              <p className="text-xs text-[#86868b]">
                                {order.shippingAddress}, {order.shippingCity},{" "}
                                {order.shippingCountry}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${page === i + 1 ? "bg-[#2997ff] text-white" : "bg-white/[0.04] text-[#86868b] hover:text-white"}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
