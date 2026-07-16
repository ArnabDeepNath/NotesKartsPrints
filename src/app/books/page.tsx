"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { api, Book, Genre, getImageUrl } from "@/lib/api";
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

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  children?: CategoryNode[];
};

type CategoryTab = {
  id: string;
  label: string;
  slug: string;
  kind: "category" | "subcategory" | "all";
  parentSlug?: string;
};

const flattenCategories = (items: CategoryNode[]): CategoryNode[] => {
  const flattened: CategoryNode[] = [];

  items.forEach((item) => {
    flattened.push(item);
    if (item.children?.length) {
      flattened.push(...flattenCategories(item.children));
    }
  });

  return flattened;
};

const buildBooksHref = ({
  search,
  genre,
  category,
  subcategory,
  featured,
  page,
}: {
  search: string;
  genre: string;
  category: string;
  subcategory: string;
  featured: boolean;
  page: number;
}) => {
  const params = new URLSearchParams();

  if (search) params.set("search", search);
  if (genre) params.set("genre", genre);
  if (category) params.set("category", category);
  if (subcategory) params.set("subcategory", subcategory);
  if (featured) params.set("featured", "true");
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/books?${query}` : "/books";
};

function BooksPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart, user } = useAuth();
  const { toast } = useToast();
  const headerRef = useRef<HTMLDivElement>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [genre, setGenre] = useState(searchParams.get("genre") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [subcategory, setSubcategory] = useState(
    searchParams.get("subcategory") || "",
  );
  const [sort, setSort] = useState("createdAt:desc");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [featured, setFeatured] = useState(
    searchParams.get("featured") === "true",
  );

  useEffect(() => {
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    );
    Promise.all([api.books.genres(), api.categories.getAll()])
      .then(([genreResponse, categoryResponse]) => {
        setGenres(genreResponse.genres || []);
        setCategories(
          Array.isArray(categoryResponse)
            ? (categoryResponse as CategoryNode[])
            : [],
        );
      })
      .catch(() => {
        setGenres([]);
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setGenre(searchParams.get("genre") || "");
    setCategory(searchParams.get("category") || "");
    setSubcategory(searchParams.get("subcategory") || "");
    setPage(Number(searchParams.get("page") || 1));
    setFeatured(searchParams.get("featured") === "true");
  }, [searchParams]);

  const categoryList = useMemo(
    () => flattenCategories(categories),
    [categories],
  );
  const categoryBySlug = useMemo(
    () => new Map(categoryList.map((item) => [item.slug, item])),
    [categoryList],
  );

  const activeSubcategory = subcategory
    ? categoryBySlug.get(subcategory) || null
    : null;
  const activeCategory = useMemo(() => {
    if (activeSubcategory?.parentId) {
      return (
        categoryList.find((item) => item.id === activeSubcategory.parentId) ||
        null
      );
    }

    return category ? categoryBySlug.get(category) || null : null;
  }, [activeSubcategory, category, categoryBySlug, categoryList]);

  const categoryTabs = useMemo<CategoryTab[]>(() => {
    if (activeSubcategory && activeCategory) {
      return [
        {
          id: `${activeCategory.id}-all`,
          label: `All in ${activeCategory.name}`,
          slug: activeCategory.slug,
          kind: "all",
        },
        ...((activeCategory.children || []).map((item) => ({
          id: item.id,
          label: item.name,
          slug: item.slug,
          kind: "subcategory" as const,
          parentSlug: activeCategory.slug,
        })) || []),
      ];
    }

    if (activeCategory) {
      return (activeCategory.children || []).map((item) => ({
        id: item.id,
        label: item.name,
        slug: item.slug,
        kind: "subcategory" as const,
        parentSlug: activeCategory.slug,
      }));
    }

    return categories.map((item) => ({
      id: item.id,
      label: item.name,
      slug: item.slug,
      kind: "category" as const,
    }));
  }, [activeCategory, activeSubcategory, categories]);

  const headerTitle =
    activeSubcategory?.name ||
    activeCategory?.name ||
    (featured
      ? "Featured Collection"
      : search
        ? `Search results for "${search}"`
        : "Browse Collection");

  const headerDescription =
    activeSubcategory?.description ||
    activeCategory?.description ||
    (featured
      ? "A sharper selection of standout titles, reordered around what is trending right now."
      : "Discover curated academic titles, print-ready notes, and revision materials with cleaner category browsing.");

  const headerImage = activeSubcategory?.image || activeCategory?.image || null;

  const applyFilters = useCallback(
    (
      updates: Partial<{
        search: string;
        genre: string;
        category: string;
        subcategory: string;
        featured: boolean;
        page: number;
      }>,
    ) => {
      const nextSearch = updates.search ?? search;
      const nextGenre = updates.genre ?? genre;
      const nextCategory = updates.category ?? category;
      const nextSubcategory = updates.subcategory ?? subcategory;
      const nextFeatured = updates.featured ?? featured;
      const nextPage = updates.page ?? page;

      setSearch(nextSearch);
      setGenre(nextGenre);
      setCategory(nextCategory);
      setSubcategory(nextSubcategory);
      setFeatured(nextFeatured);
      setPage(nextPage);

      router.push(
        buildBooksHref({
          search: nextSearch,
          genre: nextGenre,
          category: nextCategory,
          subcategory: nextSubcategory,
          featured: nextFeatured,
          page: nextPage,
        }),
      );
    },
    [category, featured, genre, page, router, search, subcategory],
  );

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
      if (category) params.category = category;
      if (subcategory) params.subcategory = subcategory;
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
  }, [page, search, genre, category, subcategory, sort, featured]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ page: 1, search });
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
        <div ref={headerRef} className="mb-8 pt-4">
          <div className="relative overflow-hidden rounded-[28px] border border-[#d8e0ea] bg-[linear-gradient(135deg,#f7fafc_0%,#eef3f8_46%,#ffffff_100%)] px-6 py-8 shadow-[0_18px_70px_rgba(35,47,62,0.08)] md:px-8 md:py-10">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,_rgba(228,121,17,0.16),_transparent_56%)]" />
            <div className="relative grid gap-8 md:grid-cols-[1.35fr_0.65fr] md:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146eb4]">
                  <span>Catalog</span>
                  {activeCategory ? (
                    <span className="text-gray-300">/</span>
                  ) : null}
                  {activeCategory ? <span>{activeCategory.name}</span> : null}
                  {activeSubcategory ? (
                    <span className="text-gray-300">/</span>
                  ) : null}
                  {activeSubcategory ? (
                    <span>{activeSubcategory.name}</span>
                  ) : null}
                </div>
                <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-[#172033] md:text-5xl">
                  {headerTitle}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
                  {headerDescription}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Titles
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#232f3e]">
                      {total.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Current View
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#232f3e]">
                      {activeSubcategory
                        ? "Subcategory"
                        : activeCategory
                          ? "Category"
                          : featured
                            ? "Featured"
                            : "Full Catalog"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                  {headerImage ? (
                    <img
                      src={headerImage}
                      alt={headerTitle}
                      className="h-48 w-full rounded-[18px] object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-[18px] bg-[linear-gradient(145deg,#17233b_0%,#2f4d68_100%)] text-center text-white">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f5a623]">
                          Refined Discovery
                        </p>
                        <p className="mt-3 max-w-[14rem] text-xl font-black leading-tight">
                          Browse cleaner category paths without generic tabs.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        {categoryTabs.length > 0 ? (
          <section className="mb-8 rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  {activeCategory || activeSubcategory
                    ? "Explore Nearby"
                    : "Browse Categories"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {activeSubcategory
                    ? "Switch between sibling subcategories or jump back to the parent collection."
                    : activeCategory
                      ? "Move across the subcategories inside this collection."
                      : "Jump directly into a top-level category."}
                </p>
              </div>
              {activeCategory || activeSubcategory ? (
                <button
                  onClick={() =>
                    applyFilters({ category: "", subcategory: "", page: 1 })
                  }
                  className="text-sm font-medium text-[#146eb4] hover:underline"
                >
                  View full catalog
                </button>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {categoryTabs.map((tab) => {
                const isActive =
                  (tab.kind === "category" &&
                    category === tab.slug &&
                    !subcategory) ||
                  (tab.kind === "subcategory" && subcategory === tab.slug) ||
                  (tab.kind === "all" &&
                    activeCategory?.slug === tab.slug &&
                    !subcategory);

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.kind === "subcategory") {
                        applyFilters({
                          category: tab.parentSlug || "",
                          subcategory: tab.slug,
                          page: 1,
                        });
                        return;
                      }

                      applyFilters({
                        category: tab.slug,
                        subcategory: "",
                        page: 1,
                      });
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${isActive ? "bg-[#17233b] text-white shadow-[0_10px_30px_rgba(23,35,59,0.18)]" : "border border-gray-200 bg-[#f8fafc] text-gray-600 hover:border-[#146eb4] hover:text-[#146eb4]"}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Filters */}
        <div className="mb-6 rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <form onSubmit={handleSearch} className="flex-1">
              <label className="block text-sm font-medium text-[#232f3e]">
                <span className="mb-2 block">
                  Search the current collection
                </span>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search books, authors, titles, or revision notes..."
                    className="w-full rounded-2xl border border-gray-300 bg-[#fbfcfe] px-4 py-3 pr-11 text-sm text-gray-800 placeholder-gray-400 focus:border-[#146eb4] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e47911] text-white transition-colors hover:bg-[#c45500]"
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
                </div>
              </label>
            </form>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 md:min-w-[480px]">
              <label className="block text-sm font-medium text-[#232f3e]">
                <span className="mb-2 block">Genre</span>
                <select
                  value={genre}
                  onChange={(e) =>
                    applyFilters({ genre: e.target.value, page: 1 })
                  }
                  className="w-full rounded-2xl border border-gray-300 bg-[#fbfcfe] px-4 py-3 text-sm text-gray-700 focus:border-[#146eb4] focus:outline-none cursor-pointer"
                >
                  <option value="">All Genres</option>
                  {genres.map((g) => (
                    <option key={g.id} value={g.slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-[#232f3e]">
                <span className="mb-2 block">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-2xl border border-gray-300 bg-[#fbfcfe] px-4 py-3 text-sm text-gray-700 focus:border-[#146eb4] focus:outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                onClick={() => applyFilters({ featured: !featured, page: 1 })}
                className={`mt-7 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${featured ? "bg-[#17233b] text-white shadow-[0_12px_30px_rgba(23,35,59,0.16)]" : "border border-gray-300 bg-[#fbfcfe] text-gray-600 hover:border-[#e47911] hover:text-[#e47911]"}`}
              >
                ★ Featured only
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {genre || featured || category || subcategory || search ? (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-[#d9e4f2] bg-[#f8fbff] px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Active filters
            </span>
            {category ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#232f3e] border border-gray-200">
                Category: {activeCategory?.name || category}
              </span>
            ) : null}
            {subcategory ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#232f3e] border border-gray-200">
                Subcategory: {activeSubcategory?.name || subcategory}
              </span>
            ) : null}
            {genre ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#232f3e] border border-gray-200">
                Genre:{" "}
                {genres.find((item) => item.slug === genre)?.name || genre}
              </span>
            ) : null}
            {featured ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#232f3e] border border-gray-200">
                Featured
              </span>
            ) : null}
            {search ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#232f3e] border border-gray-200">
                Search: {search}
              </span>
            ) : null}
            <button
              onClick={() =>
                applyFilters({
                  search: "",
                  genre: "",
                  category: "",
                  subcategory: "",
                  featured: false,
                  page: 1,
                })
              }
              className="ml-auto text-sm font-medium text-[#146eb4] hover:underline"
            >
              Clear all
            </button>
          </div>
        ) : null}

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
                applyFilters({
                  search: "",
                  genre: "",
                  category: "",
                  subcategory: "",
                  featured: false,
                  page: 1,
                });
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
              onClick={() => applyFilters({ page: Math.max(1, page - 1) })}
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
                  onClick={() => applyFilters({ page: p })}
                  className={`w-9 h-9 rounded border text-sm font-medium transition-colors ${p === page ? "bg-[#e47911] border-[#e47911] text-white" : "bg-white border-gray-300 text-gray-700 hover:border-[#e47911] hover:text-[#e47911]"}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() =>
                applyFilters({ page: Math.min(totalPages, page + 1) })
              }
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
              src={getImageUrl(book.coverImage)}
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

        <p className="text-[10px] text-green-600 font-medium mb-2">
          FREE Delivery
        </p>

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
