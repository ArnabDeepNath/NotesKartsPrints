"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

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

export default function HeroSection({ bookCount, metrics }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { settings } = useSiteSettings();
  const slides = settings.homepage.heroSlides.length
    ? settings.homepage.heroSlides
    : DEFAULT_FALLBACK.heroSlides;
  const categories = settings.homepage.categoryTiles.length
    ? settings.homepage.categoryTiles
    : DEFAULT_FALLBACK.categoryTiles;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide] || slides[0];

  return (
    <div className="bg-[#f7f8fa]">
      {/* Promo announcement bar */}
      <div className="bg-[#232f3e] text-center py-2 px-4">
        <p className="text-sm text-white">
          {settings.homepage.announcementText}
          <Link
            href={settings.homepage.announcementLinkHref}
            className="underline text-[#f5a623] font-semibold ml-1"
          >
            {settings.homepage.announcementLinkLabel}
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
              <div className="grid md:grid-cols-[1.4fr_0.9fr] gap-8 items-center">
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
                <div className="hidden md:flex justify-end">
                  {slide.image ? (
                    <Link href={slide.href} className="block max-w-sm w-full">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full max-h-[260px] object-contain drop-shadow-2xl"
                      />
                    </Link>
                  ) : (
                    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                      <p className="text-white text-sm font-semibold mb-3">
                        Featured Product
                      </p>
                      <p className="text-white/70 text-sm leading-relaxed">
                        Add a product or banner image URL from admin settings to
                        make this panel clickable to any product or landing
                        page.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
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
          onClick={() =>
            setCurrentSlide((p) => (p - 1 + slides.length) % slides.length)
          }
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors z-10"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          onClick={() => setCurrentSlide((p) => (p + 1) % slides.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors z-10"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Category Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-[#232f3e] mb-4">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
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
                <span className="text-xs font-semibold text-[#232f3e] leading-tight">
                  {cat.name}
                </span>
                <span className="text-[10px] text-[#e47911] font-medium mt-1">
                  Explore More →
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_FALLBACK = {
  heroSlides: [
    {
      title: "Customize, Print & Get Your Notes",
      subtitle: "Delivered right to your doorstep!",
      bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
      accent: "#e47911",
      cta: "Shop Now",
      href: "/books",
      badge: "NEW ARRIVALS",
      image: "",
    },
  ],
  categoryTiles: [
    {
      name: "NEET PG Full Notes",
      icon: "📗",
      href: "/books?category=neet-pg",
      color: "#e8f5e9",
    },
  ],
};
