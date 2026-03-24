"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

interface Props {
  bookCount: number;
}

const TITLE_PARTS = [
  { text: "The", highlight: false },
  { text: "World's", highlight: false },
  { text: "Most", highlight: false },
  { text: "Beautiful", highlight: true },
  { text: "Book", highlight: true },
  { text: "Inventory.", highlight: true },
];

export default function HeroSection({ bookCount }: Props) {
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const validWords = wordsRef.current.filter(Boolean);
    const tl = gsap.timeline({ delay: 0.2 });

    tl.fromTo(
      validWords,
      { opacity: 0, y: 80, rotateX: -60, transformOrigin: "center bottom" },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        stagger: 0.09,
        duration: 1.1,
        ease: "power4.out",
      },
    )
      .fromTo(
        subtitleRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.55",
      )
      .fromTo(
        ctaRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.4",
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden pt-20">
      {/* Animated background orbs */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        aria-hidden="true"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.07, 0.13, 0.07] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[10%] w-[55vw] h-[55vw] max-w-[750px] max-h-[750px] rounded-full blur-[80px]"
          style={{
            background: "radial-gradient(circle, #2997ff, transparent 70%)",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.09, 0.05] }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2.5,
          }}
          className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] rounded-full blur-[80px]"
          style={{
            background: "radial-gradient(circle, #a855f7, transparent 70%)",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.04, 0.07, 0.04] }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
          className="absolute top-[60%] left-[40%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full blur-[60px]"
          style={{
            background: "radial-gradient(circle, #34d399, transparent 70%)",
          }}
        />
      </div>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
        aria-hidden="true"
      />

      {/* Live Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "backOut" }}
        className="relative mb-8 inline-flex items-center gap-2.5 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-2"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
        </span>
        <span className="text-sm text-[#86868b]">
          <span className="text-white font-semibold">{bookCount}</span>{" "}
          {bookCount === 1 ? "Book" : "Books"} in collection
        </span>
      </motion.div>

      {/* Title */}
      <h1
        className="text-[clamp(48px,8vw,100px)] font-black tracking-tight leading-[1.03] mb-7"
        style={{ perspective: "1200px" }}
      >
        {TITLE_PARTS.map((part, i) => (
          <span
            key={i}
            ref={(el) => {
              wordsRef.current[i] = el;
            }}
            className={`inline-block mr-[0.2em] opacity-0 ${
              part.highlight ? "text-gradient-blue" : "text-white"
            }`}
          >
            {part.text}
          </span>
        ))}
      </h1>

      {/* Subtitle */}
      <p
        ref={subtitleRef}
        className="opacity-0 text-lg md:text-xl text-[#86868b] max-w-[520px] leading-relaxed mb-12"
      >
        Discover, organize, and curate an extraordinary collection. Designed for
        readers who believe every book deserves to be celebrated.
      </p>

      {/* CTA Buttons */}
      <div
        ref={ctaRef}
        className="opacity-0 flex flex-col sm:flex-row gap-4 items-center"
      >
        <motion.a
          href="#books"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2.5 bg-[#2997ff] hover:bg-[#1a83ff] text-white font-semibold px-8 py-4 rounded-full text-[15px] transition-colors"
        >
          Explore Collection
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </motion.a>
        <motion.a
          href="#featured"
          whileHover={{
            scale: 1.04,
            backgroundColor: "rgba(255,255,255,0.09)",
          }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2.5 bg-white/[0.06] border border-white/[0.12] text-white font-semibold px-8 py-4 rounded-full text-[15px] transition-colors"
        >
          Featured Picks
        </motion.a>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="text-[10px] text-[#6e6e73] uppercase tracking-[0.22em]">
            Scroll
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6e6e73"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
