"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface StatCardProps {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  description?: string;
}

function StatCard({
  value,
  label,
  suffix = "",
  prefix = "",
  description,
}: StatCardProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView || value === 0) return;
    const duration = 1900;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.02, borderColor: "rgba(41,151,255,0.25)" }}
      className="flex flex-col items-center text-center p-8 rounded-3xl transition-all"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <span className="text-5xl md:text-6xl font-black text-white mb-2 tabular-nums">
        {prefix}
        {count}
        {suffix}
      </span>
      <span className="text-sm font-semibold text-[#86868b] uppercase tracking-[0.18em] mb-1">
        {label}
      </span>
      {description && (
        <span className="text-xs text-[#6e6e73] mt-1">{description}</span>
      )}
    </motion.div>
  );
}

interface Props {
  totalBooks: number;
  totalCategories: number;
  totalAuthors: number;
}

export default function StatsSection({
  totalBooks,
  totalCategories,
  totalAuthors,
}: Props) {
  const stats = [
    {
      value: totalBooks > 0 ? totalBooks : 0,
      label: "Books",
      suffix: "+",
      description: "Catalogued titles",
    },
    {
      value: totalCategories > 0 ? totalCategories : 12,
      label: "Genres",
      suffix: "+",
      description: "Rich categories",
    },
    {
      value: totalAuthors > 0 ? totalAuthors : 8,
      label: "Authors",
      description: "Curated voices",
    },
    {
      value: 99,
      label: "Satisfaction",
      suffix: "%",
      description: "Reader approval",
    },
  ];

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-xs text-[#6e6e73] uppercase tracking-[0.22em] mb-8"
        >
          By the numbers
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
