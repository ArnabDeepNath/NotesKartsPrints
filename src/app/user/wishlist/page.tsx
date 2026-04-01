"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/app/components/ui/Toaster";
import Navbar from "@/app/components/Navbar";
import Link from "next/link";

export default function WishlistPage() {
  const { user, loading: authLoading, addToCart } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const data: any = await api.users.wishlist();
      setWishlist(data.wishlist || []);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (bookId: string) => {
    await api.wishlist.toggle(bookId);
    setWishlist((prev) => prev.filter((w) => w.book.id !== bookId));
    toast("Removed from wishlist", "info");
  };

  const handleAddToCart = (book: any) => {
    addToCart({
      bookId: book.id,
      title: book.title,
      author: book.author ?? "",
      price: book.price,
      coverImage: book.coverImage,
      quantity: 1,
    });
    toast("Added to cart", "success");
  };

  if (authLoading || !user) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Wishlist</h1>
            <p className="text-[#86868b] mt-2">
              {wishlist.length} {wishlist.length === 1 ? "book" : "books"} saved
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/[0.04] rounded-3xl h-28 animate-pulse"
                />
              ))}
            </div>
          ) : wishlist.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">♡</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Your wishlist is empty
              </h3>
              <p className="text-[#86868b] mb-6">
                Save books you want to read later.
              </p>
              <Link
                href="/books"
                className="bg-[#2997ff] hover:bg-[#1a83ff] text-white font-semibold px-6 py-3 rounded-xl inline-block transition-colors"
              >
                Explore Books
              </Link>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-3">
                {wishlist.map((item: any) => {
                  const book = item.book;
                  const disc =
                    book.comparePrice &&
                    Number(book.comparePrice) > Number(book.price)
                      ? Math.round(
                          (1 - Number(book.price) / Number(book.comparePrice)) *
                            100,
                        )
                      : null;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 flex items-center gap-5"
                    >
                      <Link
                        href={`/books/${book.id}`}
                        className="flex-shrink-0"
                      >
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-16 h-22 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-16 h-22 bg-white/[0.08] rounded-xl flex items-center justify-center text-2xl">
                            📖
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/books/${book.id}`}>
                          <h3 className="text-base font-semibold text-white hover:text-[#2997ff] transition-colors line-clamp-1">
                            {book.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-[#86868b] mt-0.5">
                          {book.author}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-base font-bold text-white">
                            ₹{Number(book.price).toFixed(0)}
                          </span>
                          {book.comparePrice && (
                            <span className="text-sm text-[#86868b] line-through">
                              ₹{Number(book.comparePrice).toFixed(0)}
                            </span>
                          )}
                          {disc && (
                            <span className="text-xs font-bold text-[#30d158] bg-[#30d158]/10 px-2 py-0.5 rounded-full">
                              {disc}% off
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <button
                          onClick={() => handleAddToCart(book)}
                          className="bg-[#2997ff] hover:bg-[#1a83ff] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleRemove(book.id)}
                          className="text-[#ff453a] text-xs hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}
