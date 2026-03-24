"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import BookCard, { Book } from "./BookCard";

interface Props {
  books: Book[];
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 44, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
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
    <section id="books" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
        >
          <div>
            <span className="text-xs text-[#2997ff] font-semibold uppercase tracking-[0.22em]">
              The Collection
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-1">
              All Books
            </h2>
            <p className="text-[#86868b] text-base">
              Showing{" "}
              <span className="text-white font-medium">{filtered.length}</span>{" "}
              of <span className="text-white font-medium">{books.length}</span>{" "}
              titles
            </p>
          </div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative max-w-xs w-full"
          >
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#86868b"
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
              className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder-[#6e6e73] text-sm pl-10 pr-4 py-3 rounded-full outline-none focus:border-[#2997ff]/60 focus:bg-white/[0.08] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6e6e73] hover:text-white transition-colors"
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
          </motion.div>
        </motion.div>

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            <motion.div
              key="grid"
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
              className="text-center py-28 rounded-3xl border border-white/[0.07] bg-white/[0.02]"
            >
              <div className="text-5xl mb-5">📚</div>
              <p className="text-[#86868b] text-lg font-medium">
                No results for &ldquo;{search}&rdquo;
              </p>
              <p className="text-[#6e6e73] text-sm mt-2">
                Try a different search term
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
