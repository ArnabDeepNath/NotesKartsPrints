import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import StatsSection from "./components/StatsSection";
import FeaturedBook from "./components/FeaturedBook";
import BookGrid from "./components/BookGrid";
import Footer from "./components/Footer";
import { Book } from "./components/BookCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function toComponentBook(b: any): Book {
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
    author: { node: { name: b.author } },
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

  return (
    <main className="bg-black min-h-screen">
      <Navbar />
      <HeroSection bookCount={books.length} />
      <StatsSection
        totalBooks={books.length}
        totalCategories={uniqueCategories.length}
        totalAuthors={uniqueAuthors.length}
      />
      {featuredBook && <FeaturedBook book={featuredBook} />}
      <BookGrid books={books} />
      <Footer />
    </main>
  );
}
