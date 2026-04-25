"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/app/components/Navbar";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-500",
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

  if (authLoading || !user) return <div className="min-h-screen bg-[#f7f8fa]" />;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar />
      <div className="pt-6 pb-20 px-4 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 pt-4">
            <h1 className="text-3xl font-bold text-[#232f3e]">My Orders</h1>
            <p className="text-gray-500 mt-1">Track and manage your purchases.</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-md h-24 animate-pulse border border-gray-200" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-[#232f3e] mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">Your purchases will appear here.</p>
              <Link href="/books" className="bg-[#e47911] hover:bg-[#c45500] text-white font-semibold px-6 py-3 rounded inline-block transition-colors">
                Browse Books
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any, i: number) => (
                <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <button onClick={() => setSelected(selected?.id === order.id ? null : order)}
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-[#232f3e]">#{order.id.slice(-10).toUpperCase()}</span>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        {" · "}{order.items?.length || 0} item(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#232f3e]">Rs. {Number(order.total).toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">incl. GST</p>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${selected?.id === order.id ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {selected?.id === order.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-100">
                        <div className="p-5 space-y-4">
                          <div className="space-y-3">
                            {order.items?.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-3">
                                {item.variation?.image || item.book?.coverImage ? (
                                  <img src={item.variation?.image || item.book.coverImage} alt={item.book.title} className="w-10 h-14 object-cover rounded" />
                                ) : (
                                  <div className="w-10 h-14 bg-gray-100 rounded shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#232f3e] truncate">{item.book?.title}</p>
                                  {item.variation && (
                                    <p className="text-[10px] text-[#e47911]">{item.variation.attributes?.type}: {item.variation.attributes?.value}</p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-0.5">Qty {item.quantity}</p>
                                </div>
                                <p className="text-sm font-semibold text-[#232f3e]">Rs. {Number(item.price * item.quantity).toLocaleString("en-IN")}</p>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-gray-100 pt-3 space-y-1.5">
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Subtotal</span><span>Rs. {Number(order.subtotal).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>GST (18%)</span><span>Rs. {Number(order.tax).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-[#232f3e] pt-1">
                              <span>Total</span><span>Rs. {Number(order.total).toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                          {order.shippingName && (
                            <div className="border-t border-gray-100 pt-3">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Shipping To</p>
                              <p className="text-sm text-[#232f3e]">{order.shippingName}</p>
                              <p className="text-xs text-gray-500">{order.shippingAddress}, {order.shippingCity}, {order.shippingCountry}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={`w-9 h-9 rounded border text-sm font-medium transition-colors ${
                        page === i + 1 ? "bg-[#e47911] border-[#e47911] text-white" : "bg-white border-gray-300 text-gray-600 hover:border-[#e47911]"
                      }`}>
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
