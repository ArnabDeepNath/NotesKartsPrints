import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import StatsSection from "./components/StatsSection";
import FeaturedBook from "./components/FeaturedBook";
import BookGrid from "./components/BookGrid";
import LandingSections from "./components/LandingSections";
import Footer from "./components/Footer";
import { Book } from "./components/BookCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const FALLBACK_LANDING_METRICS = {
  totalTitles: 11,
  totalGenres: 8,
  totalAuthors: 11,
  featuredTitles: 6,
  copiesSold: 7461,
  catalogReviews: 84815,
  averageRating: 4.6,
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

export default async function Home() {
  const [books, featuredBooks] = await Promise.all([
    getBooks(),
    getFeaturedBooks(),
  ]);

  const featuredBook = featuredBooks[0] ?? books[0] ?? null;

  const allCategories = books.flatMap(
    (b) => b.categories?.nodes?.map((c) => c.name) ?? [],
  );
  const uniqueCategories = [...new Set(allCategories)];

  const allAuthors = books.map((b) => b.author?.node?.name).filter(Boolean);
  const uniqueAuthors = [...new Set(allAuthors)];

  const landingMetrics = {
    totalTitles: books.length || FALLBACK_LANDING_METRICS.totalTitles,
    totalGenres:
      uniqueCategories.length || FALLBACK_LANDING_METRICS.totalGenres,
    totalAuthors: uniqueAuthors.length || FALLBACK_LANDING_METRICS.totalAuthors,
    featuredTitles:
      featuredBooks.length || FALLBACK_LANDING_METRICS.featuredTitles,
    copiesSold: FALLBACK_LANDING_METRICS.copiesSold,
    catalogReviews: FALLBACK_LANDING_METRICS.catalogReviews,
    averageRating: FALLBACK_LANDING_METRICS.averageRating,
  };

  return (
    <main className="bg-black min-h-screen">
      <Navbar />
      <HeroSection bookCount={books.length} metrics={landingMetrics} />
      <StatsSection metrics={landingMetrics} />
      <LandingSections featuredBook={featuredBook} metrics={landingMetrics} />
      {featuredBook && <FeaturedBook book={featuredBook} />}
      <BookGrid books={books} />
      <Footer />
    </main>
  );
}
