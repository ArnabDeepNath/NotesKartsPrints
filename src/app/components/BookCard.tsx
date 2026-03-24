"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";

export interface Book {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  slug?: string;
  featuredImage?: { node: { sourceUrl: string; altText: string } };
  categories?: { nodes: { name: string }[] };
  author?: { node: { name: string } };
}

const COVER_PALETTES = [
  { a: "#1d3557", b: "#457b9d", c: "#a8dadc" },
  { a: "#0f172a", b: "#1e40af", c: "#60a5fa" },
  { a: "#1b4332", b: "#2d6a4f", c: "#52b788" },
  { a: "#3d105a", b: "#6d28d9", c: "#a855f7" },
  { a: "#3b0764", b: "#7c3aed", c: "#c084fc" },
  { a: "#0c1445", b: "#1e3a8a", c: "#3b82f6" },
  { a: "#422006", b: "#92400e", c: "#d97706" },
  { a: "#1a1c2c", b: "#2d3748", c: "#718096" },
  { a: "#0d2137", b: "#126782", c: "#38bdf8" },
  { a: "#4a0e0e", b: "#991b1b", c: "#f87171" },
];

interface Props {
  book: Book;
  index: number;
}

export default function BookCard({ book, index }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springCfg = { stiffness: 180, damping: 22 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), springCfg);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), springCfg);

  const palette = COVER_PALETTES[index % COVER_PALETTES.length];
  const category = book.categories?.nodes?.[0]?.name ?? "General";
  const author = book.author?.node?.name ?? "Unknown";
  const coverImg = book.featuredImage?.node?.sourceUrl;

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.025, z: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer select-none"
    >
      {/* Cover */}
      <div
        className="relative h-52 overflow-hidden"
        style={
          !coverImg
            ? {
                background: `linear-gradient(155deg, ${palette.a} 0%, ${palette.b} 55%, ${palette.c} 100%)`,
              }
            : undefined
        }
      >
        {coverImg ? (
          <img
            src={coverImg}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-end p-5">
            {/* Abstract decorative lines */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full"
                  style={{
                    height: "1px",
                    background: "white",
                    top: `${18 + i * 15}%`,
                    opacity: 0.4 + i * 0.12,
                  }}
                />
              ))}
              <div className="absolute top-5 right-5 w-14 h-14 rounded-full border border-white/25" />
              <div className="absolute top-8 right-8 w-6 h-6 rounded-full border border-white/20" />
            </div>
            <div className="relative z-10">
              <span className="text-[9px] font-bold text-white/55 uppercase tracking-[0.22em] block mb-1.5">
                {category}
              </span>
              <p className="text-white font-bold text-sm leading-snug line-clamp-2">
                {book.title}
              </p>
            </div>
          </div>
        )}

        {/* Hover shine */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.1] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Category pill */}
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[9px] font-bold text-white/90 uppercase tracking-wider bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full">
            {category}
          </span>
        </div>
      </div>

      {/* Info panel */}
      <div
        className="p-4"
        style={{
          background: "#111111",
          border: "1px solid rgba(255,255,255,0.07)",
          borderTop: "none",
          borderBottomLeftRadius: "1rem",
          borderBottomRightRadius: "1rem",
        }}
      >
        <h3 className="text-white font-bold text-sm mb-1.5 line-clamp-1">
          {book.title}
        </h3>
        <div
          className="text-[#6e6e73] text-xs line-clamp-2 mb-3 leading-relaxed excerpt-clean"
          dangerouslySetInnerHTML={{ __html: book.excerpt }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#2997ff] font-medium truncate max-w-[65%]">
            {author}
          </span>
          <span className="text-[11px] text-[#6e6e73]">
            {new Date(book.date).getFullYear()}
          </span>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-2xl bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#2997ff] text-white font-semibold px-6 py-3 rounded-full text-sm shadow-2xl"
          style={{ boxShadow: "0 0 30px rgba(41,151,255,0.4)" }}
        >
          View Details
        </motion.button>
      </div>
    </motion.div>
  );
}
