"use client";

import {
  motion,
  useMotionValueEvent,
  useScroll,
  AnimatePresence,
} from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { label: "Explore", href: "/books" },
  { label: "Featured", href: "/books?featured=true" },
  { label: "Collections", href: "/books#collections" },
  { label: "About", href: "#about" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { scrollY } = useScroll();
  const { user, logout, cart, cartTotal, cartCount, removeFromCart } =
    useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 60));

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

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/80 backdrop-blur-2xl border-b border-white/[0.07]"
          : "bg-transparent"
      }`}
    >
      <nav
        className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between"
        ref={menuRef}
      >
        {/* Logo */}
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #2997ff 0%, #0066cc 100%)",
                boxShadow: "0 0 20px rgba(41,151,255,0.35)",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
            </div>
            <span className="text-white font-bold text-[17px] tracking-tight">
              Basak <span className="text-[#86868b] font-normal">Library</span>
            </span>
          </motion.div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href}>
              <motion.span
                className={`text-sm transition-colors duration-200 cursor-pointer ${pathname === link.href ? "text-white" : "text-[#86868b] hover:text-white"}`}
                whileHover={{ color: "#f5f5f7" }}
              >
                {link.label}
              </motion.span>
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/books">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center"
              aria-label="Search"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#86868b"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </motion.button>
          </Link>

          {/* Cart */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCartOpen((o) => !o);
                setUserMenuOpen(false);
              }}
              className="relative w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center"
              aria-label="Cart"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#86868b"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#2997ff] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </motion.button>
            <AnimatePresence>
              {cartOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 mt-2 w-80 bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-4 border-b border-white/[0.08]">
                    <p className="text-sm font-semibold text-white">
                      Shopping Cart
                    </p>
                    <p className="text-xs text-[#86868b]">
                      {cartCount} item(s)
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.05]">
                    {cart.length === 0 ? (
                      <div className="p-6 text-center text-[#86868b] text-sm">
                        Your cart is empty
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.bookId}
                          className="flex items-center gap-3 p-3"
                        >
                          {item.coverImage && (
                            <img
                              src={item.coverImage}
                              alt={item.title}
                              className="w-10 h-14 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-[#86868b]">
                              ×{item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-white">
                              ₹{(item.price * item.quantity).toFixed(0)}
                            </p>
                            <button
                              onClick={() => removeFromCart(item.bookId)}
                              className="text-[10px] text-[#ff453a] hover:underline mt-0.5"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {cart.length > 0 && (
                    <div className="p-4 border-t border-white/[0.08]">
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-[#86868b]">Total</span>
                        <span className="font-bold text-white">
                          ₹{cartTotal.toFixed(0)}
                        </span>
                      </div>
                      <Link href="/checkout" onClick={() => setCartOpen(false)}>
                        <button className="w-full bg-[#2997ff] hover:bg-[#1a83ff] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                          Checkout →
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
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setUserMenuOpen((o) => !o);
                  setCartOpen(false);
                }}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#2997ff]/50 hover:border-[#2997ff] transition-colors"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2997ff] to-[#0066cc] flex items-center justify-center text-white text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </motion.button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-2 w-56 bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
                  >
                    <div className="p-3 border-b border-white/[0.08]">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-[#86868b] truncate">
                        {user.email}
                      </p>
                      {user.role === "ADMIN" && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[#f5a623]/15 text-[#f5a623] text-[10px] font-bold rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="p-1.5">
                      {user.role === "ADMIN" && (
                        <MenuLink
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          ⬡ Admin Panel
                        </MenuLink>
                      )}
                      <MenuLink
                        href="/user/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        ◎ Dashboard
                      </MenuLink>
                      <MenuLink
                        href="/user/library"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        📚 My Library
                      </MenuLink>
                      <MenuLink
                        href="/user/wishlist"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        ♡ Wishlist
                      </MenuLink>
                      <MenuLink
                        href="/user/profile"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        ◉ Settings
                      </MenuLink>
                      <div className="my-1 h-px bg-white/[0.08]" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#ff453a] hover:bg-[#ff3b30]/10 rounded-xl transition-colors text-left"
                      >
                        ⎋ Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="text-sm text-[#86868b] hover:text-white transition-colors px-3 py-2"
                >
                  Sign In
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-[#2997ff] hover:bg-[#1a83ff] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
                >
                  Get Started
                </motion.button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setMobileOpen((o) => !o)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.1]"
          aria-label="Toggle menu"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {mobileOpen ? (
              <>
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </>
            ) : (
              <>
                <path d="M3 12h18" />
                <path d="M3 6h18" />
                <path d="M3 18h18" />
              </>
            )}
          </svg>
        </motion.button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 backdrop-blur-2xl border-t border-white/[0.07] px-6 pb-6"
          >
            <div className="pt-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="text-[#86868b] hover:text-white text-base py-3 border-b border-white/[0.05] transition-colors">
                    {link.label}
                  </div>
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                {user ? (
                  <>
                    <p className="text-sm text-[#86868b]">
                      Signed in as{" "}
                      <span className="text-white">{user.name}</span>
                    </p>
                    {user.role === "ADMIN" && (
                      <Link href="/admin" onClick={() => setMobileOpen(false)}>
                        <button className="w-full text-left text-sm text-[#f5a623] py-2">
                          Admin Panel
                        </button>
                      </Link>
                    )}
                    <Link
                      href="/user/dashboard"
                      onClick={() => setMobileOpen(false)}
                    >
                      <button className="w-full text-left text-sm text-white py-2">
                        Dashboard
                      </button>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left text-sm text-[#ff453a] py-2"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <button className="w-full border border-white/[0.15] text-white text-sm font-semibold py-3 rounded-xl">
                        Sign In
                      </button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      <button className="w-full bg-[#2997ff] text-white text-sm font-semibold py-3 rounded-xl">
                        Get Started
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={onClick}>
      <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#86868b] hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors text-left">
        {children}
      </button>
    </Link>
  );
}
