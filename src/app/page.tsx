import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import StatsSection from "./components/StatsSection";
import FeaturedBook from "./components/FeaturedBook";
import BookGrid from "./components/BookGrid";
import Footer from "./components/Footer";

interface Book {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  slug: string;
  featuredImage?: { node: { sourceUrl: string; altText: string } };
  categories?: { nodes: { name: string }[] };
  author?: { node: { name: string } };
}

const WORDPRESS_API_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
  "https://noteskartprints.in/graphql";

async function getBooks(): Promise<Book[]> {
  try {
    const res = await fetch(WORDPRESS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query GetBooks {
            posts(first: 20, where: { status: PUBLISH }) {
              nodes {
                id
                title
                date
                excerpt
                slug
                featuredImage {
                  node {
                    sourceUrl
                    altText
                  }
                }
                categories {
                  nodes {
                    name
                  }
                }
                author {
                  node {
                    name
                  }
                }
              }
            }
          }
        `,
      }),
      next: { revalidate: 60 },
    });

    const json = await res.json();
    return json?.data?.posts?.nodes ?? [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const books = await getBooks();

  const featuredBook = books[0] ?? null;

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
