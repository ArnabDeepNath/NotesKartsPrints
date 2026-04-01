"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { api, Book, Genre } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toaster";
import gsap from "gsap";

const SORT_OPTIONS = [
  { label: "Newest", value: "createdAt:desc" },
  { label: "Oldest", value: "createdAt:asc" },
  { label: "Price: Low–High", value: "price:asc" },
  { label: "Price: High–Low", value: "price:desc" },
  { label: "Top Rated", value: "rating:desc" },
  { label: "Best Selling", value: "sold:desc" },
];

function BooksPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart, user } = useAuth();
  const { toast } = useToast();
  const headerRef = useRef<HTMLDivElement>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [genre, setGenre] = useState(searchParams.get("genre") || "");
  const [sort, setSort] = useState("createdAt:desc");
  const [page, setPage] = useState(1);
  const [featured, setFeatured] = useState(
    searchParams.get("featured") === "true",
  );

  useEffect(() => {
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    );
    api.books.genres().then(({ genres: g }) => setGenres(g));
  }, []);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const [sortField, sortOrder] = sort.split(":");
      const params: Record<string, string | number> = {
        page,
        limit: 12,
        sort: sortField,
        order: sortOrder,
      };
      if (search) params.search = search;
      if (genre) params.genre = genre;
      if (featured) params.featured = "true";

      const { books: b, pagination } = await api.books.list(params);
      setBooks(b);
      setTotal(pagination.total);
      setTotalPages(pagination.totalPages);
    } catch {
      toast("Failed to load books", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, genre, sort, featured]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleAddToCart = (book: Book) => {
    addToCart({
      bookId: book.id,
      title: book.title,
      author: book.author,
      price: Number(book.price),
      coverImage: book.coverImage,
      quantity: 1,
    });
    toast(`"${book.title}" added to cart`, "success");
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div ref={headerRef} className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
            Browse <span className="text-gradient-blue">Collection</span>
          </h1>
          <p className="text-[#86868b]">
            Showing {total.toLocaleString()} titles
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books, authors, genres..."
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-2xl px-5 py-3.5 text-white placeholder-[#48484a] text-sm focus:outline-none focus:border-[#2997ff]/50 pr-12"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#48484a] hover:text-white transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </form>

          <div className="flex gap-3 flex-wrap">
            <select
              value={genre}
              onChange={(e) => {
                setGenre(e.target.value);
                setPage(1);
              }}
              className="bg-white/[0.05] border border-white/[0.1] rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#2997ff]/50 appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#1c1c1e]">
                All Genres
              </option>
              {genres.map((g) => (
                <option key={g.id} value={g.slug} className="bg-[#1c1c1e]">
                  {g.name}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="bg-white/[0.05] border border-white/[0.1] rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#2997ff]/50 appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value} className="bg-[#1c1c1e]">
                  {s.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setFeatured((f) => !f);
                setPage(1);
              }}
              className={`px-4 py-3.5 rounded-2xl text-sm font-medium transition-all border ${featured ? "bg-[#f5a623]/15 border-[#f5a623]/30 text-[#f5a623]" : "bg-white/[0.05] border-white/[0.1] text-[#86868b] hover:text-white"}`}
            >
              ★ Featured
            </button>
          </div>
        </div>

        {/* Genre pills */}
        {genres.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            <button
              onClick={() => setGenre("")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${!genre ? "bg-white/[0.12] text-white" : "text-[#86868b] hover:text-white"}`}
            >
              All
            </button>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setGenre(g.slug);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${genre === g.slug ? "text-white" : "text-[#86868b] hover:text-white"}`}
                style={
                  genre === g.slug
                    ? {
                        backgroundColor: `${g.color}22`,
                        border: `1px solid ${g.color}44`,
                        color: g.color,
                      }
                    : {}
                }
              >
                {g.name}{" "}
                {g._count && (
                  <span className="opacity-60">({g._count.books})</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/[0.04] rounded-3xl overflow-hidden animate-pulse"
              >
                <div className="bg-white/[0.06] h-56 w-full" />
                <div className="p-4 space-y-2">
                  <div className="bg-white/[0.06] h-3 rounded-full w-3/4" />
                  <div className="bg-white/[0.06] h-2.5 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No books found
            </h3>
            <p className="text-[#86868b]">
              Try a different search term or filter
            </p>
            <button
              onClick={() => {
                setSearch("");
                setGenre("");
                setFeatured(false);
              }}
              className="mt-6 text-[#2997ff] text-sm hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {books.map((book, i) => (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                >
                  <BookCard
                    book={book}
                    onAddToCart={() => handleAddToCart(book)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white disabled:opacity-40 hover:bg-white/[0.1] transition-colors flex items-center justify-center"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${p === page ? "bg-[#2997ff] text-white" : "bg-white/[0.05] border border-white/[0.1] text-[#86868b] hover:text-white"}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white disabled:opacity-40 hover:bg-white/[0.1] transition-colors flex items-center justify-center"
            >
              ›
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <BooksPageInner />
    </Suspense>
  );
}

function BookCard({
  book,
  onAddToCart,
}: {
  book: Book;
  onAddToCart: () => void;
}) {
  const discount = book.comparePrice
    ? Math.round((1 - Number(book.price) / Number(book.comparePrice)) * 100)
    : 0;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group bg-white/[0.04] border border-white/[0.08] rounded-3xl overflow-hidden hover:border-white/[0.15] transition-all duration-300"
    >
      <Link href={`/books/${book.id}`}>
        <div className="relative overflow-hidden bg-[#1c1c1e] h-56">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="text-white/10 w-16 h-16"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
            </div>
          )}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-[#ff453a] text-white text-[10px] font-bold px-2 py-1 rounded-lg">
              -{discount}%
            </div>
          )}
          {book.featured && (
            <div className="absolute top-3 right-3 bg-[#f5a623]/90 text-black text-[10px] font-bold px-2 py-1 rounded-lg">
              ★ Featured
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        {book.genre && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block"
            style={{ color: book.genre.color }}
          >
            {book.genre.name}
          </span>
        )}
        <Link href={`/books/${book.id}`}>
          <h3 className="text-sm font-semibold text-white leading-snug mb-0.5 line-clamp-2 hover:text-[#2997ff] transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-xs text-[#86868b] mb-3">{book.author}</p>

        {book.rating !== undefined && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill={s <= Math.round(book.rating!) ? "#f5a623" : "none"}
                  stroke="#f5a623"
                  strokeWidth="2"
                  className="opacity-80"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-[10px] text-[#86868b]">
              ({book.reviewCount || 0})
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-white">
              ₹{Number(book.price).toFixed(0)}
            </span>
            {book.comparePrice && (
              <span className="text-xs text-[#86868b] line-through ml-2">
                ₹{Number(book.comparePrice).toFixed(0)}
              </span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAddToCart}
            disabled={book.stock === 0}
            className="w-8 h-8 rounded-xl bg-[#2997ff] hover:bg-[#1a83ff] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>
        {book.stock === 0 && (
          <p className="text-[10px] text-[#ff453a] mt-1">Out of stock</p>
        )}
      </div>
    </motion.div>
  );
}
