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
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col items-center text-center px-6 py-4 border-r border-gray-200 last:border-r-0"
    >
      <span className="text-3xl md:text-4xl font-black text-[#e47911] tabular-nums">
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </span>
      <span className="text-xs font-bold text-[#232f3e] uppercase tracking-wider mt-1">
        {label}
      </span>
      {description && (
        <span className="text-[10px] text-gray-400 mt-0.5">{description}</span>
      )}
    </motion.div>
  );
}

interface Props {
  metrics: {
    totalTitles: number;
    totalGenres: number;
    totalAuthors: number;
    featuredTitles: number;
    copiesSold: number;
    catalogReviews: number;
    averageRating: number;
  };
}

export default function StatsSection({ metrics }: Props) {
  const stats = [
    {
      value: metrics.totalTitles || 500,
      label: "Titles",
      suffix: "+",
      description: "Active catalog",
    },
    {
      value: metrics.totalGenres || 20,
      label: "Subjects",
      suffix: "+",
      description: "Organized categories",
    },
    {
      value: metrics.copiesSold || 10000,
      label: "Orders Delivered",
      suffix: "+",
      description: "Happy customers",
    },
    {
      value: metrics.catalogReviews || 2500,
      label: "Reviews",
      suffix: "+",
      description: "Verified feedback",
    },
    {
      value: Math.round((metrics.averageRating || 4.6) * 10) / 10,
      label: "Avg Rating",
      suffix: "/5",
      description: "Customer satisfaction",
    },
  ];

  return (
    <section className="bg-white border-t border-b border-gray-200 py-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 divide-gray-200">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
