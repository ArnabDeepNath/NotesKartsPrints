"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

const CATEGORIES = [
  { label: "NEET PG Full Notes", href: "/books?category=neet-pg" },
  { label: "Rapid Revision", href: "/books?category=rapid-revision" },
  { label: "BTR Notes", href: "/books?category=btr-notes" },
  { label: "Super Speciality", href: "/books?category=super-speciality" },
  { label: "USMLE Notes", href: "/books?category=usmle" },
  { label: "BDS Dental", href: "/books?category=bds-dental" },
  { label: "Thesis & Plan Work", href: "/books?category=thesis" },
  { label: "MBBS Books", href: "/books?category=mbbs" },
  { label: "New Offers", href: "/books?offers=true" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout, cart, cartTotal, cartCount, removeFromCart } = useAuth();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
        setCartOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 w-full" ref={menuRef}>
      {/* Top Info Bar */}
      <div className="bg-[#232f3e] text-white text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/#how-it-works" className="hover:text-[#f5a623] transition-colors">HOW IT WORKS?</a>
            <a href="/#faqs" className="hover:text-[#f5a623] transition-colors">FAQs</a>
            <a href="/books?offers=true" className="hover:text-[#f5a623] transition-colors">OFFERS</a>
            <a href="mailto:print@notekart.in" className="flex items-center gap-1 hover:text-[#f5a623] transition-colors">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              EMAIL: PRINT@NOTEKART.IN
            </a>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/user/orders" className="hover:text-[#f5a623] transition-colors font-semibold">TRACK ORDER</Link>
            {user && <span className="text-[#f5a623] font-semibold">Hi, {user.name.split(" ")[0]}</span>}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #e47911 0%, #f5a623 100%)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              </div>
              <div>
                <span className="text-[#232f3e] font-black text-xl tracking-tight leading-none block">NoteKart</span>
                <span className="text-[#e47911] font-semibold text-[10px] uppercase tracking-widest leading-none">Prints</span>
              </div>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 hidden md:flex">
            <div className="flex w-full rounded-md overflow-hidden border-2 border-[#e47911]">
              <input
                type="text"
                placeholder="Search books, notes, revision materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm text-gray-800 bg-white outline-none placeholder-gray-400"
              />
              <button type="submit" className="bg-[#e47911] hover:bg-[#c45500] px-5 flex items-center justify-center transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Cart */}
            <div className="relative">
              <button
                onClick={() => { setCartOpen((o) => !o); setUserMenuOpen(false); }}
                className="relative flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label="Cart"
              >
                <div className="relative">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#232f3e" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#e47911] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-[10px] text-gray-500 leading-none">Cart</p>
                  <p className="text-sm font-bold text-[#232f3e] leading-tight">
                    {cartCount > 0 ? `${cartCount} item${cartCount > 1 ? "s" : ""}` : "Empty"}
                  </p>
                </div>
              </button>

              <AnimatePresence>
                {cartOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-bold text-[#232f3e]">Shopping Cart ({cartCount} items)</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                      {cart.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">Your cart is empty</div>
                      ) : (
                        cart.map((item) => (
                          <div key={item.bookId} className="flex items-center gap-3 p-3">
                            {item.coverImage && (
                              <img src={item.coverImage} alt={item.title} className="w-10 h-14 object-cover rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                              {item.variationString && <p className="text-[10px] text-[#e47911]">{item.variationString}</p>}
                              <p className="text-xs text-gray-500">x{item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-[#232f3e]">Rs.{(item.price * item.quantity).toFixed(0)}</p>
                              <button
                                onClick={() => removeFromCart(item.bookId, item.variationId)}
                                className="text-[10px] text-red-500 hover:underline mt-0.5"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {cart.length > 0 && (
                      <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-bold text-[#232f3e]">Rs.{cartTotal.toFixed(0)}</span>
                        </div>
                        <Link href="/checkout" onClick={() => setCartOpen(false)}>
                          <button className="w-full bg-[#e47911] hover:bg-[#c45500] text-white text-sm font-bold py-2.5 rounded transition-colors">
                            Proceed to Checkout
                          </button>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => { setUserMenuOpen((o) => !o); setCartOpen(false); }}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#e47911]">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#e47911] flex items-center justify-center text-white text-sm font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-[10px] text-gray-500 leading-none">Hello,</p>
                    <p className="text-sm font-bold text-[#232f3e] leading-tight">{user.name.split(" ")[0]}</p>
                  </div>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        {user.role === "ADMIN" && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-[#e47911] text-[10px] font-bold rounded-full">Admin</span>
                        )}
                      </div>
                      <div className="py-1">
                        {user.role === "ADMIN" && <DropdownLink href="/admin" onClick={() => setUserMenuOpen(false)}>Admin Panel</DropdownLink>}
                        <DropdownLink href="/user/dashboard" onClick={() => setUserMenuOpen(false)}>Dashboard</DropdownLink>
                        <DropdownLink href="/user/library" onClick={() => setUserMenuOpen(false)}>My Library</DropdownLink>
                        <DropdownLink href="/user/orders" onClick={() => setUserMenuOpen(false)}>My Orders</DropdownLink>
                        <DropdownLink href="/user/wishlist" onClick={() => setUserMenuOpen(false)}>Wishlist</DropdownLink>
                        <DropdownLink href="/user/profile" onClick={() => setUserMenuOpen(false)}>Profile Settings</DropdownLink>
                        <div className="my-1 h-px bg-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                        >
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login">
                <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#232f3e" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <div className="hidden md:block text-left">
                    <p className="text-[10px] text-gray-500 leading-none">Hello, Guest</p>
                    <p className="text-sm font-bold text-[#232f3e] leading-tight">Login / Signup</p>
                  </div>
                </div>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#232f3e" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? <><path d="M18 6L6 18" /><path d="M6 6l12 12" /></> : <><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></>}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="flex rounded-md overflow-hidden border-2 border-[#e47911]">
            <input
              type="text"
              placeholder="Search books and notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-sm text-gray-800 bg-white outline-none"
            />
            <button type="submit" className="bg-[#e47911] px-4 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Category Nav Bar */}
      <div className="bg-[#37475a] border-b border-[#232f3e] hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <Link key={cat.label} href={cat.href}>
                <span className={`whitespace-nowrap text-xs font-semibold px-4 py-2.5 inline-block transition-colors hover:bg-[#485769] cursor-pointer ${cat.label === "New Offers" ? "text-[#f5a623]" : "text-white"}`}>
                  {cat.label}
                </span>
              </Link>
            ))}
            <Link href="/books">
              <span className="whitespace-nowrap text-xs font-semibold px-4 py-2.5 inline-block text-white hover:bg-[#485769] transition-colors cursor-pointer">
                All Products &rarr;
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200 shadow-lg overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-0">
              {CATEGORIES.map((cat) => (
                <Link key={cat.label} href={cat.href} onClick={() => setMobileOpen(false)}>
                  <div className={`py-2.5 border-b border-gray-100 text-sm font-medium ${cat.label === "New Offers" ? "text-[#e47911]" : "text-gray-700"}`}>
                    {cat.label}
                  </div>
                </Link>
              ))}
              <div className="pt-3 flex gap-2">
                {user ? (
                  <button onClick={handleLogout} className="w-full border border-red-400 text-red-500 text-sm font-bold py-2.5 rounded">Sign Out</button>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1">
                      <button className="w-full border-2 border-[#232f3e] text-[#232f3e] text-sm font-bold py-2.5 rounded">Sign In</button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1">
                      <button className="w-full bg-[#e47911] text-white text-sm font-bold py-2.5 rounded">Register</button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function DropdownLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick}>
      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
        {children}
      </button>
    </Link>
  );
}
