"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Order } from "@/lib/api";
import Navbar from "@/app/components/Navbar";
import OrderDetails from "@/app/components/OrderDetails";

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
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
      const nextOrders = data.orders || [];
      setOrders(nextOrders);
      setSelected((current) =>
        current
          ? nextOrders.find((order: Order) => order.id === current.id) || null
          : null,
      );
      setTotalPages(data.pagination?.totalPages || 1);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user)
    return <div className="min-h-screen bg-[#f7f8fa]" />;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar />
      <div className="pt-6 pb-20 px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 pt-4">
            <div>
              <h1 className="text-2xl font-bold text-[#232f3e] sm:text-3xl">My Orders</h1>
              <p className="mt-1 text-sm text-gray-500 sm:text-base">
                Track and manage your purchases.
              </p>
            </div>
            {orders.length > 0 && (
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="min-h-10 rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-[#232f3e] disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh tracking"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-md h-24 animate-pulse border border-gray-200"
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-[#232f3e] mb-2">
                No orders yet
              </h3>
              <p className="text-gray-500 mb-6">
                Your purchases will appear here.
              </p>
              <Link
                href="/books"
                className="bg-[#e47911] hover:bg-[#c45500] text-white font-semibold px-6 py-3 rounded inline-block transition-colors"
              >
                Browse Books
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: Order, i: number) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white border border-gray-200 rounded-md overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setSelected(selected?.id === order.id ? null : order)
                    }
                    className="w-full flex flex-wrap items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors sm:flex-nowrap sm:gap-4 sm:p-5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-[#232f3e]">
                          #{order.id.slice(-10).toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${STATUS_COLORS[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {" · "}
                        {order.items?.length || 0} item(s)
                      </p>
                      {order.shiprocket?.status && (
                        <p className="mt-2 text-xs font-semibold text-[#146eb4]">
                          Shipment: {order.shiprocket.status}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#232f3e]">
                        Rs. {Number(order.total).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        incl. GST
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${selected?.id === order.id ? "rotate-180" : ""}`}
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

                  <AnimatePresence>
                    {selected?.id === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-100"
                      >
                        <div className="p-3 sm:p-5">
                          <OrderDetails order={order} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-9 h-9 rounded border text-sm font-medium transition-colors ${
                        page === i + 1
                          ? "bg-[#e47911] border-[#e47911] text-white"
                          : "bg-white border-gray-300 text-gray-600 hover:border-[#e47911]"
                      }`}
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
