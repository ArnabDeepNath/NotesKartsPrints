"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    setStatus("success");
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#86868b]">Verifying your payment…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-[#ff453a]/10 border border-[#ff453a]/20 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-[#ff453a]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Issue</h1>
        <p className="text-[#86868b] mb-6">
          We couldn't verify your payment. If you were charged, contact support.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/user/orders"
            className="px-6 py-3 rounded-2xl border border-white/[0.1] text-[#86868b] hover:text-white text-sm transition-colors"
          >
            View Orders
          </Link>
          <Link
            href="/"
            className="bg-[#2997ff] hover:bg-[#1a83ff] text-white font-semibold px-6 py-3 rounded-2xl text-sm transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-[#30d158]/10 border border-[#30d158]/30 flex items-center justify-center mx-auto mb-6"
      >
        <motion.svg
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-12 h-12 text-[#30d158]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </motion.svg>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          Payment Successful!
        </h1>
        <p className="text-[#86868b] mb-8 max-w-sm mx-auto">
          Thank you for your purchase. Your books are now in your library.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/user/library"
            className="bg-[#2997ff] hover:bg-[#1a83ff] text-white font-semibold px-6 py-3 rounded-2xl text-sm transition-colors"
          >
            Go to My Library
          </Link>
          <Link
            href="/user/orders"
            className="px-6 py-3 rounded-2xl border border-white/[0.1] text-[#86868b] hover:text-white text-sm transition-colors"
          >
            View Orders
          </Link>
          <Link
            href="/books"
            className="px-6 py-3 rounded-2xl border border-white/[0.1] text-[#86868b] hover:text-white text-sm transition-colors"
          >
            Browse More
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <Suspense
        fallback={
          <div className="w-8 h-8 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin" />
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-12 w-full max-w-md"
        >
          <div className="text-center mb-2">
            <Link
              href="/"
              className="text-[#86868b] text-xs hover:text-white transition-colors"
            >
              Basak Library
            </Link>
          </div>
          <SuccessContent />
        </motion.div>
      </Suspense>
    </div>
  );
}
