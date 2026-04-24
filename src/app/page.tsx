import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import StatsSection from "./components/StatsSection";
import FeaturedBook from "./components/FeaturedBook";
import BookGrid from "./components/BookGrid";
import LandingSections from "./components/LandingSections";
import Footer from "./components/Footer";
import { Book } from "./components/BookCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface LandingMetrics {
  totalTitles: number;
  totalGenres: number;
  totalAuthors: number;
  featuredTitles: number;
  copiesSold: number;
  catalogReviews: number;
  averageRating: number;
}

interface TrustCard {
  title: string;
  publisher: string;
  sold: number;
  rating: number;
  reviews: number;
  summary: string;
}

const EMPTY_LANDING_METRICS: LandingMetrics = {
  totalTitles: 0,
  totalGenres: 0,
  totalAuthors: 0,
  featuredTitles: 0,
  copiesSold: 0,
  catalogReviews: 0,
  averageRating: 0,
};

interface ApiBook {
  id: string;
  title: string;
  createdAt?: string;
  description?: string;
  shortDesc?: string;
  coverImage?: string;
  author?: string;
  genre?: { name: string };
  publisher?: string;
  sold?: number;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
}

interface BooksResponse {
  books: ApiBook[];
  pagination?: { total?: number };
}

function toComponentBook(b: ApiBook): Book {
  return {
    id: b.id,
    title: b.title,
    date: b.createdAt || new Date().toISOString(),
    excerpt: b.description || b.shortDesc || "",
    slug: b.id,
    featuredImage: b.coverImage
      ? { node: { sourceUrl: b.coverImage, altText: b.title } }
      : undefined,
    categories: b.genre ? { nodes: [{ name: b.genre.name }] } : undefined,
    author: { node: { name: b.author || "Basakzi Team" } },
  };
}

async function getBooks(): Promise<Book[]> {
  try {
    const res = await fetch(`${API_URL}/books?limit=24`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.books ?? []).map(toComponentBook);
  } catch {
    return [];
  }
}

async function getFeaturedBooks(): Promise<Book[]> {
  try {
    const res = await fetch(`${API_URL}/books?featured=true&limit=6`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.books ?? []).map(toComponentBook);
  } catch {
    return [];
  }
}

async function getCatalogSnapshot(): Promise<BooksResponse> {
  try {
    const res = await fetch(`${API_URL}/books?limit=100&sort=sold&order=desc`, {
      cache: "no-store",
    });
    if (!res.ok) return { books: [] };
    return (await res.json()) as BooksResponse;
  } catch {
    return { books: [] };
  }
}

function buildTrustSummary(book: ApiBook): string {
  const rating = Number(book.rating || 0).toFixed(1);
  const reviews = Number(book.reviewCount || 0).toLocaleString();
  return `${book.title} currently leads with a ${rating} rating across ${reviews} reviews, making it a strong proof point for the live catalog.`;
}

export default async function Home() {
  const [books, featuredBooks, catalogSnapshot] = await Promise.all([
    getBooks(),
    getFeaturedBooks(),
    getCatalogSnapshot(),
  ]);

  const catalogBooks = catalogSnapshot.books ?? [];

  const featuredBook = featuredBooks[0] ?? books[0] ?? null;

  const allCategories = catalogBooks
    .map((book) => book.genre?.name)
    .filter(Boolean);
  const uniqueCategories = [...new Set(allCategories)];

  const allAuthors = catalogBooks.map((b) => b.author).filter(Boolean);
  const uniqueAuthors = [...new Set(allAuthors)];

  const totalCopiesSold = catalogBooks.reduce(
    (sum, book) => sum + (book.sold || 0),
    0,
  );
  const totalCatalogReviews = catalogBooks.reduce(
    (sum, book) => sum + (book.reviewCount || 0),
    0,
  );
  const ratedBooks = catalogBooks.filter((book) => (book.rating || 0) > 0);
  const averageRating = ratedBooks.length
    ? ratedBooks.reduce((sum, book) => sum + (book.rating || 0), 0) /
      ratedBooks.length
    : 0;

  const publishers = [
    ...new Set(catalogBooks.map((book) => book.publisher).filter(Boolean)),
  ]
    .slice(0, 5)
    .map((publisher) => publisher as string);

  const trustCards: TrustCard[] = catalogBooks.slice(0, 3).map((book) => ({
    title: book.title,
    publisher: book.publisher || "Independent Publisher",
    sold: book.sold || 0,
    rating: book.rating || 0,
    reviews: book.reviewCount || 0,
    summary: buildTrustSummary(book),
  }));

  const landingMetrics: LandingMetrics = {
    totalTitles:
      catalogSnapshot.pagination?.total ||
      catalogBooks.length ||
      EMPTY_LANDING_METRICS.totalTitles,
    totalGenres: uniqueCategories.length || EMPTY_LANDING_METRICS.totalGenres,
    totalAuthors: uniqueAuthors.length || EMPTY_LANDING_METRICS.totalAuthors,
    featuredTitles:
      catalogBooks.filter((book) => book.featured).length ||
      featuredBooks.length,
    copiesSold: totalCopiesSold,
    catalogReviews: totalCatalogReviews,
    averageRating,
  };

  return (
    <main className="bg-black min-h-screen">
      <Navbar />
      <HeroSection bookCount={books.length} metrics={landingMetrics} />
      <StatsSection metrics={landingMetrics} />
      <LandingSections
        featuredBook={featuredBook}
        metrics={landingMetrics}
        publishers={publishers}
        trustCards={trustCards}
      />
      {featuredBook && <FeaturedBook book={featuredBook} />}
      <BookGrid books={books} />
      <Footer />
    </main>
  );
}
