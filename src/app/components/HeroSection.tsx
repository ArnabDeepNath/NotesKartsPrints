"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Props {
  bookCount: number;
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

const HERO_SLIDES = [
  {
    title: "Customize, Print & Get Your Notes",
    subtitle: "Delivered right to your doorstep!",
    bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
    accent: "#e47911",
    cta: "Shop Now",
    href: "/books",
    badge: "NEW ARRIVALS",
    image: null,
  },
  {
    title: "NEET PG Revision Notes",
    subtitle: "All 19 Subjects – Full Colour HD Printing",
    bg: "linear-gradient(135deg, #0d1b2a 0%, #1b4332 50%, #0d1b2a 100%)",
    accent: "#f5a623",
    cta: "Order Now",
    href: "/books?category=neet-pg",
    badge: "BESTSELLER",
    image: null,
  },
  {
    title: "Rapid Revision 2026-27",
    subtitle: "All Subjects Full Colour – Dispatch in 24 hrs",
    bg: "linear-gradient(135deg, #2d0036 0%, #6d28d9 50%, #2d0036 100%)",
    accent: "#f5a623",
    cta: "Explore",
    href: "/books?category=rapid-revision",
    badge: "HOT DEAL",
    image: null,
  },
];

const CATEGORY_GRID = [
  { name: "NEET PG Full Notes", icon: "📗", href: "/books?category=neet-pg", color: "#e8f5e9" },
  { name: "Rapid Revision", icon: "⚡", href: "/books?category=rapid-revision", color: "#fff3e0" },
  { name: "BTR Notes", icon: "📘", href: "/books?category=btr-notes", color: "#e3f2fd" },
  { name: "Super Speciality", icon: "🔬", href: "/books?category=super-speciality", color: "#f3e5f5" },
  { name: "USMLE Notes", icon: "🏥", href: "/books?category=usmle", color: "#fce4ec" },
  { name: "Other Notes", icon: "📋", href: "/books?category=other", color: "#e0f7fa" },
  { name: "BDS Dental Notes", icon: "🦷", href: "/books?category=bds-dental", color: "#fff8e1" },
  { name: "Thesis & Plan Work", icon: "📄", href: "/books?category=thesis", color: "#e8eaf6" },
  { name: "MBBS Books", icon: "📚", href: "/books?category=mbbs", color: "#e0f2f1" },
  { name: "MD Books", icon: "🩺", href: "/books?category=md", color: "#fbe9e7" },
];

export default function HeroSection({ bookCount, metrics }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="bg-[#f7f8fa]">
      {/* Promo announcement bar */}
      <div className="bg-[#232f3e] text-center py-2 px-4">
        <p className="text-sm text-white">
          🎉 Enjoy{" "}
          <span className="font-bold text-[#f5a623]">25% OFF</span> for new
          users &nbsp;|&nbsp;{" "}
          <span className="font-bold text-[#f5a623]">12% OFF</span> for
          returning customers &nbsp;|&nbsp; FREE delivery above{" "}
          <span className="font-bold text-[#f5a623]">Rs.499</span>
          &nbsp;
          <Link href="/books?offers=true" className="underline text-[#f5a623] font-semibold ml-1">
            Print smart, save more →
          </Link>
        </p>
      </div>

      {/* Hero Banner Slider */}
      <div className="relative overflow-hidden" style={{ height: "340px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center"
            style={{ background: slide.bg }}
          >
            <div className="max-w-7xl mx-auto px-8 md:px-12 w-full">
              <div className="max-w-2xl">
                <span
                  className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest"
                  style={{ background: slide.accent, color: "#fff" }}
                >
                  {slide.badge}
                </span>
                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3">
                  {slide.title}
                </h1>
                <p className="text-base md:text-lg text-white/80 mb-6">
                  {slide.subtitle}
                </p>
                <div className="flex items-center gap-3">
                  <Link href={slide.href}>
                    <button
                      className="px-8 py-3 font-bold text-sm rounded-md transition-all hover:scale-105"
                      style={{ background: slide.accent, color: "#fff" }}
                    >
                      {slide.cta}
                    </button>
                  </Link>
                  <Link href="/print">
                    <button className="px-8 py-3 font-bold text-sm rounded-md border-2 border-white/40 text-white hover:bg-white/10 transition-all">
                      Print Now
                    </button>
                  </Link>
                </div>
                <div className="mt-5 flex items-center gap-5 text-white/60 text-xs">
                  <span>✓ {metrics.totalTitles}+ Titles</span>
                  <span>✓ Same-day dispatch</span>
                  <span>✓ Premium binding</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentSlide ? "w-6 bg-[#e47911]" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={() => setCurrentSlide((p) => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors z-10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button
          onClick={() => setCurrentSlide((p) => (p + 1) % HERO_SLIDES.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors z-10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Category Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-[#232f3e] mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORY_GRID.map((cat) => (
            <Link key={cat.name} href={cat.href}>
              <motion.div
                whileHover={{ y: -3, boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}
                className="category-card bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center cursor-pointer"
                style={{ borderTopColor: "transparent", borderTopWidth: "3px" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2"
                  style={{ background: cat.color }}
                >
                  {cat.icon}
                </div>
                <span className="text-xs font-semibold text-[#232f3e] leading-tight">{cat.name}</span>
                <span className="text-[10px] text-[#e47911] font-medium mt-1">Explore More →</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
