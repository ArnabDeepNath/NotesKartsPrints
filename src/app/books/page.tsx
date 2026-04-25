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
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar />
      <main className="pt-6 pb-20 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div ref={headerRef} className="mb-6 pt-4">
          <h1 className="text-3xl md:text-4xl font-bold text-[#232f3e] mb-1">
            Browse Collection
          </h1>
          <p className="text-gray-500 text-sm">
            Showing {total.toLocaleString()} titles
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books, authors, genres..."
              className="w-full bg-white border border-gray-300 rounded-md px-4 py-2.5 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#e47911] pr-10"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-full px-3 bg-[#e47911] hover:bg-[#c45500] text-white rounded-r-md transition-colors"
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

          <div className="flex gap-2 flex-wrap">
            <select
              value={genre}
              onChange={(e) => {
                setGenre(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-gray-300 rounded-md px-3 py-2.5 text-gray-700 text-sm focus:outline-none focus:border-[#e47911] cursor-pointer"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.slug}>
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
              className="bg-white border border-gray-300 rounded-md px-3 py-2.5 text-gray-700 text-sm focus:outline-none focus:border-[#e47911] cursor-pointer"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setFeatured((f) => !f);
                setPage(1);
              }}
              className={`px-3 py-2.5 rounded-md text-sm font-medium transition-all border ${featured ? "bg-[#e47911] border-[#e47911] text-white" : "bg-white border-gray-300 text-gray-600 hover:border-[#e47911] hover:text-[#e47911]"}`}
            >
              ★ Featured
            </button>
          </div>
        </div>

        {/* Genre pills */}
        {genres.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              onClick={() => setGenre("")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${!genre ? "bg-[#232f3e] text-white border-[#232f3e]" : "bg-white text-gray-600 border-gray-300 hover:border-[#232f3e] hover:text-[#232f3e]"}`}
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
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${genre === g.slug ? "text-white" : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"}`}
                style={
                  genre === g.slug
                    ? { backgroundColor: g.color, borderColor: g.color }
                    : {}
                }
              >
                {g.name}{" "}
                {g._count && (
                  <span className="opacity-70">({g._count.books})</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-md overflow-hidden animate-pulse border border-gray-200"
              >
                <div className="bg-gray-200 h-48 w-full" />
                <div className="p-3 space-y-2">
                  <div className="bg-gray-200 h-3 rounded w-3/4" />
                  <div className="bg-gray-200 h-2.5 rounded w-1/2" />
                  <div className="bg-gray-200 h-3 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-[#232f3e] mb-2">
              No books found
            </h3>
            <p className="text-gray-500">
              Try a different search term or filter
            </p>
            <button
              onClick={() => {
                setSearch("");
                setGenre("");
                setFeatured(false);
              }}
              className="mt-6 text-[#146eb4] text-sm hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
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
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-40 hover:border-[#e47911] hover:text-[#e47911] transition-colors text-sm"
            >
              ‹ Prev
            </button>
            {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded border text-sm font-medium transition-colors ${p === page ? "bg-[#e47911] border-[#e47911] text-white" : "bg-white border-gray-300 text-gray-700 hover:border-[#e47911] hover:text-[#e47911]"}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-40 hover:border-[#e47911] hover:text-[#e47911] transition-colors text-sm"
            >
              Next ›
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
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8fa]" />}>
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
    <div className="group bg-white border border-gray-200 rounded-md overflow-hidden hover:shadow-md transition-shadow duration-200">
      <Link href={`/books/${book.id}`}>
        <div className="relative overflow-hidden bg-gray-100 h-48">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #232f3e 0%, #37475a 100%)",
              }}
            >
              <span className="text-white/60 text-3xl">📚</span>
            </div>
          )}
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-[#e47911] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              -{discount}% OFF
            </div>
          )}
          {book.featured && (
            <div className="absolute top-2 right-2 bg-[#232f3e] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              ★ Featured
            </div>
          )}
        </div>
      </Link>

      <div className="p-3">
        {book.genre && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wider mb-1 block"
            style={{ color: book.genre.color }}
          >
            {book.genre.name}
          </span>
        )}
        <Link href={`/books/${book.id}`}>
          <h3 className="text-sm font-semibold text-[#232f3e] leading-snug mb-0.5 line-clamp-2 hover:text-[#146eb4] transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mb-2">{book.author}</p>

        {book.rating !== undefined && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill={s <= Math.round(book.rating!) ? "#e47911" : "none"}
                  stroke="#e47911"
                  strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-[10px] text-gray-500">
              ({book.reviewCount || 0})
            </span>
          </div>
        )}

        <p className="text-[10px] text-green-600 font-medium mb-2">FREE Delivery</p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-[#232f3e]">
              Rs. {Number(book.price).toFixed(0)}
            </span>
            {book.comparePrice && (
              <span className="text-xs text-gray-400 line-through ml-1.5">
                Rs. {Number(book.comparePrice).toFixed(0)}
              </span>
            )}
          </div>
          <button
            onClick={onAddToCart}
            disabled={book.stock === 0}
            className="text-xs px-2 py-1 rounded bg-[#e47911] hover:bg-[#c45500] text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Cart
          </button>
        </div>
        {book.stock === 0 && (
          <p className="text-[10px] text-red-500 mt-1">Out of stock</p>
        )}
      </div>
    </div>
  );
}
