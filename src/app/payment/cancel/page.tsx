"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-12 w-full max-w-md text-center"
      >
        <div className="text-center mb-6">
          <Link
            href="/"
            className="text-[#86868b] text-xs hover:text-white transition-colors"
          >
            Basak Library
          </Link>
        </div>
        <div className="w-20 h-20 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-[#f5a623]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Payment Cancelled
        </h1>
        <p className="text-[#86868b] mb-8">
          Your payment was cancelled. Your cart is still saved — return to
          checkout whenever you're ready.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/checkout"
            className="bg-[#2997ff] hover:bg-[#1a83ff] text-white font-semibold px-6 py-3 rounded-2xl text-sm transition-colors"
          >
            Return to Checkout
          </Link>
          <Link
            href="/books"
            className="px-6 py-3 rounded-2xl border border-white/[0.1] text-[#86868b] hover:text-white text-sm transition-colors"
          >
            Keep Browsing
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
