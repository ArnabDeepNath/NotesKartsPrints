"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/app/components/Navbar";
import Link from "next/link";

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.users
        .library()
        .then((data: any) => setBooks(data.books || []))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">My Library</h1>
            <p className="text-[#86868b] mt-2">Books you own — read anytime.</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/[0.04] rounded-3xl aspect-[3/4] animate-pulse"
                />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No books yet
              </h3>
              <p className="text-[#86868b] mb-6">
                Purchase books to see them here.
              </p>
              <Link
                href="/books"
                className="bg-[#2997ff] hover:bg-[#1a83ff] text-white font-semibold px-6 py-3 rounded-xl inline-block transition-colors"
              >
                Browse Books
              </Link>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5"
              layout
            >
              <AnimatePresence>
                {books.map((book: any, i: number) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group cursor-pointer"
                  >
                    <Link href={`/books/${book.id}`}>
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08] mb-3 shadow-xl group-hover:shadow-[0_0_30px_rgba(41,151,255,0.15)] transition-all duration-300">
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            📖
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                          <span className="text-white text-xs font-semibold">
                            Read Book →
                          </span>
                        </div>
                      </div>
                      <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-[#2997ff] transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-[#86868b] text-xs mt-1">
                        {book.author}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
