"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // Expose add via context — since Toaster is rendered in layout, we use a global ref trick
  // For simplicity, expose via window in dev; in prod use a proper store
  if (typeof window !== "undefined") {
    (window as any).__basakToast = (
      msg: string,
      type: Toast["type"] = "info",
    ) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-4), { id, message: msg, type }]);
      setTimeout(() => remove(id), 4000);
    };
  }

  const icons = {
    success: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
    error: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  };

  const colors = {
    success: "bg-[#1c2e1c] border-[#30d158]/30 text-[#30d158]",
    error: "bg-[#2e1c1c] border-[#ff453a]/30 text-[#ff453a]",
    info: "bg-[#1c1c2e] border-[#2997ff]/30 text-[#2997ff]",
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border
              backdrop-blur-xl text-sm font-medium max-w-sm shadow-2xl ${colors[t.type]}`}
          >
            {icons[t.type]}
            <span className="text-[#f5f5f7]">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="ml-auto text-white/40 hover:text-white/80 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useToast() {
  return {
    toast: (message: string, type: Toast["type"] = "info") => {
      if (typeof window !== "undefined" && (window as any).__basakToast) {
        (window as any).__basakToast(message, type);
      }
    },
  };
}
