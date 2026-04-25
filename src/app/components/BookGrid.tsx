"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import BookCard, { Book } from "./BookCard";

interface Props {
  books: Book[];
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function BookGrid({ books }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q) ||
        b.author?.node?.name?.toLowerCase().includes(q) ||
        b.categories?.nodes?.some((c) => c.name.toLowerCase().includes(q)),
    );
  }, [books, search]);

  return (
    <section id="books" className="py-8 px-4 bg-[#f7f8fa]">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-[#232f3e]">All Products</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Showing{" "}
              <span className="font-semibold text-[#232f3e]">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#232f3e]">
                {books.length}
              </span>{" "}
              titles
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-xs w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search books, authors, genres…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-800 placeholder-gray-400 text-sm pl-9 pr-4 py-2.5 rounded-lg outline-none focus:border-[#e47911] focus:ring-1 focus:ring-[#e47911]/30 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            <motion.div
              key="grid"
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {filtered.map((book, i) => (
                <motion.div
                  key={book.id}
                  variants={item}
                  layout
                  transition={{ duration: 0.55 }}
                >
                  <BookCard book={book} index={i} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-20 rounded-xl border border-gray-200 bg-white"
            >
              <div className="text-5xl mb-5">📚</div>
              <p className="text-gray-500 text-lg font-medium">
                No results for &ldquo;{search}&rdquo;
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Try a different search term
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
