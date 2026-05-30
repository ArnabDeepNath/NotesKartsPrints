"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import {
  buildCategoryMap,
  resolveCategoryTile,
  type ManagedCategory,
} from "@/lib/category-menu";

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
  const [categories, setCategories] = useState<ManagedCategory[]>([]);
  const { settings } = useSiteSettings();
  const baseSlides = settings.homepage.heroSlides.length
    ? settings.homepage.heroSlides
    : DEFAULT_FALLBACK.heroSlides;
  const slides = baseSlides.map((item, index) =>
    index === 0
      ? {
          ...item,
          title: "Print Notes On Demand, Without Store Delays",
          subtitle:
            "Upload your PDF, choose print settings, and get doorstep delivery in 48-72 hours.",
          cta: "Start Printing",
          href: "/print",
          badge: "PRINT ON DEMAND",
          bg: "linear-gradient(135deg, #111b31 0%, #17233b 45%, #1f4b7a 100%)",
          accent: "#f5a623",
        }
      : item,
  );
  const categoryMap = buildCategoryMap(categories);
  const categoryTiles = settings.homepage.categoryTiles
    .map((tile) => resolveCategoryTile(tile, categoryMap))
    .filter((tile) => tile.name && tile.href);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const data = (await api.categories.getAll()) as ManagedCategory[];
        if (isMounted && Array.isArray(data)) {
          setCategories(data);
        }
      } catch {
        if (isMounted) {
          setCategories([]);
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const slide = slides[currentSlide] || slides[0];
  const printHighlights = [
    {
      label: "Doorstep Delivery",
      value: "48-72 hrs",
      detail: "Fast turnaround for notes, manuals, and project files.",
    },
    {
      label: "Printed Copies Delivered",
      value: `${Math.max(metrics.copiesSold, 10000).toLocaleString("en-IN")}+`,
      detail: "Students already trust the workflow for urgent print runs.",
    },
    {
      label: "Print-Ready Formats",
      value: "PDF First",
      detail: "Upload clean PDFs and choose binding, paper, and copies.",
    },
  ];

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
            style={{
              background:
                "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
            }}
          >
            <div className="max-w-7xl mx-auto px-8 md:px-12 w-full">
              <div
                className={`grid gap-8 items-center ${
                  slide.image ? "md:grid-cols-[1.4fr_0.9fr]" : "md:grid-cols-1"
                }`}
              >
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f5a623] mb-4">
                    {slide.badge || "FEATURED"}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3">
                    {slide.title}
                  </h1>
                  <p className="text-base md:text-lg text-white/80 mb-6">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={slide.href || "/print"}
                      className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold text-white transition-colors"
                      style={{ backgroundColor: slide.accent || "#e47911" }}
                    >
                      {slide.cta || "Start Printing"}
                    </Link>
                    <Link
                      href="#how-it-works"
                      className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/8"
                    >
                      How It Works
                    </Link>
                  </div>
                </div>
                <div className="hidden md:flex justify-end">
                  {slide.image ? (
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full max-h-[260px] object-contain drop-shadow-2xl"
                    />
                  ) : null}
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

      <section className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-stretch">
            <div className="rounded-[28px] bg-[#17233b] px-6 py-7 md:px-8 md:py-8 text-white shadow-[0_24px_70px_rgba(23,35,59,0.18)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f5a623]">
                Print On Demand
              </div>
              <h2 className="mt-4 max-w-2xl text-2xl font-black leading-tight md:text-4xl">
                Upload your notes once. We print, bind, and deliver them without
                the bookstore wait.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72 md:text-base">
                The catalog supports discovery, but the core service is fast
                academic printing. Students can upload files, set print options,
                and get doorstep delivery from one checkout flow.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/print"
                  className="inline-flex items-center justify-center rounded-full bg-[#e47911] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#c45500]"
                >
                  Start Printing
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/8"
                >
                  See How It Works
                </Link>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {printHighlights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4"
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                      {item.label}
                    </p>
                    <p className="mt-2 text-xl font-black text-[#f5a623]">
                      {item.value}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-white/65">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-[#f1d1ac] bg-[linear-gradient(145deg,#fff7ef_0%,#ffffff_65%)] p-6 shadow-[0_18px_50px_rgba(228,121,17,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e47911]">
                  Why Students Choose It
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-bold text-[#232f3e]">
                      Configure before checkout
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Paper size, binding, print type, paper type, and copies
                      are all selectable inside the print flow.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#232f3e]">
                      Separate from the book catalog
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Books stay browsable, but the landing page now makes the
                      document-printing workflow impossible to miss.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Live Catalog Reach
                    </p>
                    <p className="mt-2 text-3xl font-black text-[#232f3e]">
                      {Math.max(metrics.totalTitles, bookCount).toLocaleString(
                        "en-IN",
                      )}
                      +
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      titles paired with on-demand print support.
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-[#17233b] text-white flex items-center justify-center text-2xl shadow-sm">
                    🖨️
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm text-gray-600">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#e47911]" />
                  Print workflow and catalog shopping now sit in the same
                  first-screen narrative.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      {categoryTiles.length > 0 ? (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-[#232f3e] mb-4">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categoryTiles.map((cat) => (
            <Link key={cat.id} href={cat.href}>
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
      ) : null}
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
      cta: "",
      href: "/books",
      badge: "",
      image: "",
    },
  ],
  categoryTiles: [
    {
      id: "fallback-category-tile",
      name: "NEET PG Full Notes",
      icon: "📗",
      href: "/books?category=neet-pg",
      color: "#e8f5e9",
      targetType: "custom",
      targetId: null,
    },
  ],
};
