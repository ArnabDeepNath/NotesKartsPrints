"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/app/components/ui/Toaster";
import Navbar from "@/app/components/Navbar";
import gsap from "gsap";
import { useRef } from "react";

interface Stats {
  totalBooks: number;
  totalUsers: number;
  totalOrders: number;
  revenue: number;
}

const ADMIN_TABS = [
  { id: "overview", label: "Overview", icon: "◎" },
  { id: "books", label: "Books", icon: "📚" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "orders", label: "Orders", icon: "📦" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-500",
};

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const statsRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState("overview");

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topBooks, setTopBooks] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  const [books, setBooks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [bookModal, setBookModal] = useState<{ open: boolean; book?: any }>({
    open: false,
  });
  const [bookForm, setBookForm] = useState<any>({});

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "ADMIN") fetchDashboard();
  }, [user]);

  useEffect(() => {
    if (tab === "books") fetchBooks();
    if (tab === "users") fetchUsers();
    if (tab === "orders") fetchOrders();
  }, [tab]);

  const fetchDashboard = async () => {
    try {
      const data: any = await api.admin.stats();
      setStats(data.stats);
      setRecentOrders(data.recentOrders || []);
      setTopBooks(data.topBooks || []);
      setRecentUsers(data.recentUsers || []);
      if (statsRef.current) {
        const cards = statsRef.current.querySelectorAll(".stat-card");
        gsap.fromTo(
          cards,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power3.out" },
        );
      }
    } catch {
      toast("Failed to load stats", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const { books: b } = (await api.books.list({ limit: 50 })) as any;
      setBooks(b);
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const data: any = await api.admin.users();
      setUsers(data.users || []);
    } catch {}
  };

  const fetchOrders = async () => {
    try {
      const data: any = await api.admin.orders();
      setOrders(data.orders || []);
    } catch {}
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    await api.books.delete(id);
    toast("Book removed", "success");
    fetchBooks();
  };

  const handleBookFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (bookModal.book) {
        await api.books.update(bookModal.book.id, bookForm);
        toast("Book updated", "success");
      } else {
        await api.books.create(bookForm);
        toast("Book created", "success");
      }
      setBookModal({ open: false });
      fetchBooks();
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  const handleModalCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setIsUploadingCover(true);
      const uploadData = new FormData();
      uploadData.append("image", file);
      const uploadRes: any = await api.upload.image(uploadData);
      
      setBookForm((prev: any) => ({ ...prev, coverImage: uploadRes.url }));
      toast("Cover image uploaded", "success");
    } catch (err: any) {
      toast("Image upload failed", "error");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleToggleUserStatus = async (id: string, isActive: boolean) => {
    await api.admin.updateUser(id, { isActive: !isActive } as any);
    toast(isActive ? "User deactivated" : "User activated", "success");
    fetchUsers();
  };

  const handleOrderStatus = async (id: string, status: string) => {
    await api.admin.updateOrder(id, status);
    toast("Order status updated", "success");
    fetchOrders();
  };

  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e47911] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar />
      <div className="pt-0 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-gray-200 px-4 py-6 bg-white">
          <div className="mb-8 pt-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Admin Panel</span>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#e47911] flex items-center justify-center text-white text-xs font-bold">A</div>
              <div>
                <p className="text-sm font-medium text-[#232f3e]">{user.name}</p>
                <p className="text-[10px] text-gray-400">Administrator</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {ADMIN_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded text-sm font-medium transition-all text-left ${
                  tab === t.id ? "bg-[#232f3e] text-white" : "text-gray-600 hover:text-[#232f3e] hover:bg-gray-100"
                }`}
              >
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-200">
            <Link href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#232f3e] transition-colors">
              ← Back to Site
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 px-6 py-6 overflow-y-auto max-h-screen">
          {/* Mobile tabs */}
          <div className="flex gap-2 mb-6 md:hidden overflow-x-auto pb-2">
            {ADMIN_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded text-xs font-medium whitespace-nowrap border ${
                  tab === t.id ? "bg-[#232f3e] text-white border-[#232f3e]" : "text-gray-600 bg-white border-gray-200"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="text-2xl font-bold text-[#232f3e] mb-6">Dashboard Overview</h1>
                <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Total Books", value: stats?.totalBooks ?? "—", icon: "📚" },
                    { label: "Total Users", value: stats?.totalUsers ?? "—", icon: "👥" },
                    { label: "Total Orders", value: stats?.totalOrders ?? "—", icon: "📦" },
                    { label: "Revenue", value: stats ? `Rs. ${Number(stats.revenue).toLocaleString("en-IN")}` : "—", icon: "💰" },
                  ].map((s) => (
                    <div key={s.label} className="stat-card bg-white border border-gray-200 rounded-md p-5">
                      <div className="text-2xl mb-3">{s.icon}</div>
                      <div className="text-2xl font-bold text-[#e47911]">{s.value}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Recent Orders */}
                  <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex justify-between">
                      <h3 className="font-semibold text-[#232f3e] text-sm">Recent Orders</h3>
                      <button onClick={() => setTab("orders")} className="text-xs text-[#146eb4] hover:underline">View all</button>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {recentOrders.slice(0, 5).map((o: any) => (
                        <div key={o.id} className="flex items-center gap-3 p-4">
                          <div className="w-8 h-8 rounded bg-[#232f3e] flex items-center justify-center text-xs font-bold text-white">
                            {o.user?.name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#232f3e] truncate">{o.user?.name}</p>
                            <p className="text-[10px] text-gray-400">{o.items?.length || 0} book(s)</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                            <p className="text-xs font-bold text-[#232f3e] mt-0.5">Rs. {Number(o.total).toFixed(0)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Books */}
                  <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex justify-between">
                      <h3 className="font-semibold text-[#232f3e] text-sm">Top Selling Books</h3>
                      <button onClick={() => setTab("books")} className="text-xs text-[#146eb4] hover:underline">Manage</button>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {topBooks.map((b: any, i: number) => (
                        <div key={b.id} className="flex items-center gap-3 p-4">
                          <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                          {b.coverImage && (
                            <img src={b.coverImage} alt={b.title} className="w-8 h-11 object-cover rounded" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#232f3e] truncate">{b.title}</p>
                            <p className="text-[10px] text-gray-400">{b.sold} sold</p>
                          </div>
                          <p className="text-xs font-bold text-[#232f3e]">Rs. {Number(b.price).toFixed(0)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "books" && (
              <motion.div
                key="books"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#232f3e]">Manage Books</h2>
                  <div className="flex gap-4">
                    <Link href="/admin/categories">
                      <button className="bg-white border border-gray-300 hover:border-[#232f3e] text-[#232f3e] text-sm font-semibold px-5 py-2.5 rounded transition-colors">
                        📦 Manage Categories
                      </button>
                    </Link>
                    <Link href="/admin/books/new">
                      <button className="bg-[#e47911] hover:bg-[#c45500] text-white text-sm font-semibold px-5 py-2.5 rounded transition-colors">
                        + Add Book
                      </button>
                    </Link>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-5 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Book</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {books.map((b: any) => (
                          <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                {b.coverImage && (
                                  <img src={b.coverImage} alt={b.title} className="w-8 h-11 object-cover rounded" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-[#232f3e]">{b.title}</p>
                                  <p className="text-[10px] text-gray-400">{b.author}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#232f3e]">Rs. {Number(b.price).toFixed(0)}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`font-medium ${b.stock === 0 ? "text-red-500" : b.stock < 10 ? "text-yellow-600" : "text-green-600"}`}>{b.stock}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-yellow-500">★ {Number(b.rating).toFixed(1)}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setBookForm(b); setBookModal({ open: true, book: b }); }}
                                  className="text-xs text-[#146eb4] hover:underline"
                                >Edit</button>
                                <button onClick={() => handleDeleteBook(b.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-2xl font-bold text-[#232f3e] mb-6">Manage Users</h2>
                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-5 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map((u: any) => (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-[#232f3e] flex items-center justify-center text-white text-xs font-bold">{u.name.charAt(0)}</div>
                                <div>
                                  <p className="text-sm font-medium text-[#232f3e]">{u.name}</p>
                                  <p className="text-[10px] text-gray-400">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                                u.role === "ADMIN" ? "bg-[#e47911]/15 text-[#e47911]" : "bg-blue-100 text-blue-700"
                              }`}>{u.role}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{u._count?.orders || 0}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                              }`}>{u.isActive ? "Active" : "Banned"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                                className={`text-xs hover:underline ${u.isActive ? "text-red-500" : "text-green-600"}`}
                              >{u.isActive ? "Deactivate" : "Activate"}</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "orders" && (
              <motion.div
                key="orders"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-2xl font-bold text-[#232f3e] mb-6">Manage Orders</h2>
                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-5 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="text-left px-4 py-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Update</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.map((o: any) => (
                          <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3">
                              <p className="text-sm font-mono text-[#232f3e]">#{o.id.slice(-8).toUpperCase()}</p>
                              <p className="text-[10px] text-gray-400">{o.items?.length || 0} item(s)</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-[#232f3e]">{o.user?.name}</p>
                              <p className="text-[10px] text-gray-400">{o.user?.email}</p>
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-[#232f3e]">Rs. {Number(o.total).toFixed(0)}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                defaultValue={o.status}
                                onChange={(e) => handleOrderStatus(o.id, e.target.value)}
                                className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 text-xs focus:outline-none focus:border-[#e47911]"
                              >
                                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Book Modal */}
      <AnimatePresence>
        {bookModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={(e) =>
              e.target === e.currentTarget && setBookModal({ open: false })
            }
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white border border-gray-200 rounded-md p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#232f3e]">
                  {bookModal.book ? "Edit Book" : "Add New Book"}
                </h3>
                <button
                  onClick={() => setBookModal({ open: false })}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-[#232f3e]"
                >✕</button>
              </div>
              <form
                onSubmit={handleBookFormSubmit}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { key: "title", label: "Title", required: true, span: 2 },
                  { key: "author", label: "Author", required: true },
                  { key: "publisher", label: "Publisher" },
                  {
                    key: "price",
                    label: "Price (₹)",
                    required: true,
                    type: "number",
                  },
                  {
                    key: "comparePrice",
                    label: "Compare Price (₹)",
                    type: "number",
                  },
                  { key: "stock", label: "Stock", type: "number" },
                  { key: "pages", label: "Pages", type: "number" },
                  { key: "isbn", label: "ISBN", span: 2 },
                ].map((f) => (
                  <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                      {f.label}
                    </label>
                    <input
                      type={f.type || "text"}
                      required={f.required}
                      value={bookForm[f.key] || ""}
                      onChange={(e) =>
                        setBookForm((prev: any) => ({
                          ...prev,
                          [f.key]: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-gray-300 rounded px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-[#e47911]"
                    />
                  </div>
                ))}
                
                <div className="col-span-2">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Cover Image</label>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={bookForm.coverImage || ""}
                        onChange={(e) => setBookForm((prev: any) => ({ ...prev, coverImage: e.target.value }))}
                        placeholder="Image URL or upload..."
                        className="w-full bg-white border border-gray-300 rounded px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-[#e47911]"
                      />
                    </div>
                    <div className="flex-shrink-0">
                       <div className="relative overflow-hidden inline-block border border-gray-300 bg-white hover:bg-gray-50 rounded px-4 py-2.5 text-sm text-gray-700 font-medium cursor-pointer transition-colors">
                         {isUploadingCover ? "Uploading..." : "Upload File"}
                         <input
                           type="file"
                           accept="image/*"
                           disabled={isUploadingCover}
                           onChange={handleModalCoverImageUpload}
                           className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                         />
                       </div>
                    </div>
                  </div>
                  {bookForm.coverImage && (
                    <div className="mt-4 p-2 border border-gray-200 rounded inline-block">
                      <img src={bookForm.coverImage} className="h-32 object-contain rounded" alt="Cover Preview" />
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
                  <textarea
                    value={bookForm.description || ""}
                    onChange={(e) => setBookForm((prev: any) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full bg-white border border-gray-300 rounded px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-[#e47911] resize-none"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-3 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!bookForm.featured}
                      onChange={(e) =>
                        setBookForm((p: any) => ({
                          ...p,
                          featured: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Featured Book</span>
                  </label>
                </div>
                <div className="col-span-2 flex gap-3 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setBookModal({ open: false })}
                    className="px-6 py-2.5 rounded border border-gray-300 text-gray-600 hover:border-[#232f3e] text-sm transition-colors"
                  >Cancel</button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded bg-[#e47911] hover:bg-[#c45500] text-white text-sm font-semibold transition-colors"
                  >{bookModal.book ? "Update Book" : "Create Book"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
