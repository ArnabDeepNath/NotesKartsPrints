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
      <div className="w-12 h-12 border-2 border-[#e47911] border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500">Verifying your payment…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500"
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
        <h1 className="text-2xl font-bold text-[#232f3e] mb-2">Payment Issue</h1>
        <p className="text-gray-500 mb-6">
          We couldn't verify your payment. If you were charged, contact support.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/user/orders" className="px-6 py-3 rounded border border-gray-300 text-gray-600 hover:border-[#232f3e] text-sm transition-colors">
            View Orders
          </Link>
          <Link href="/" className="bg-[#e47911] hover:bg-[#c45500] text-white font-semibold px-6 py-3 rounded text-sm transition-colors">
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
        className="w-24 h-24 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6"
      >
        <motion.svg
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-12 h-12 text-green-500"
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
        <h1 className="text-3xl font-bold text-[#232f3e] mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          Thank you for your purchase. Your books are now in your library.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/user/library" className="bg-[#e47911] hover:bg-[#c45500] text-white font-semibold px-6 py-3 rounded text-sm transition-colors">
            Go to My Library
          </Link>
          <Link href="/user/orders" className="px-6 py-3 rounded border border-gray-300 text-gray-600 hover:border-[#232f3e] text-sm transition-colors">
            View Orders
          </Link>
          <Link href="/books" className="px-6 py-3 rounded border border-gray-300 text-gray-600 hover:border-[#232f3e] text-sm transition-colors">
            Browse More
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center p-6">
      <Suspense fallback={<div className="w-8 h-8 border-2 border-[#e47911] border-t-transparent rounded-full animate-spin" />}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-md p-12 w-full max-w-md">
          <div className="text-center mb-2">
            <Link href="/" className="text-gray-500 text-xs hover:text-[#232f3e] transition-colors">NoteKart Prints</Link>
          </div>
          <SuccessContent />
        </motion.div>
      </Suspense>
    </div>
  );
}
