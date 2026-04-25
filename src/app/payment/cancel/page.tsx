"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-md p-12 w-full max-w-md text-center">
        <div className="text-center mb-6">
          <Link href="/" className="text-gray-500 text-xs hover:text-[#232f3e] transition-colors">NoteKart Prints</Link>
        </div>
        <div className="w-20 h-20 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#232f3e] mb-2">Payment Cancelled</h1>
        <p className="text-gray-500 mb-8">Your payment was cancelled. Your cart is still saved — return to checkout whenever you're ready.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/checkout" className="bg-[#e47911] hover:bg-[#c45500] text-white font-semibold px-6 py-3 rounded text-sm transition-colors">
            Return to Checkout
          </Link>
          <Link href="/books" className="px-6 py-3 rounded border border-gray-300 text-gray-600 hover:border-[#232f3e] text-sm transition-colors">
            Keep Browsing
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
