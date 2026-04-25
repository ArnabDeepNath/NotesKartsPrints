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

  if (authLoading || !user) return <div className="min-h-screen bg-[#f7f8fa]" />;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar />
      <div className="pt-6 pb-20 px-4 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 pt-4">
            <h1 className="text-3xl font-bold text-[#232f3e]">My Library</h1>
            <p className="text-gray-500 mt-1">Books you own — read anytime.</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-md aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-[#232f3e] mb-2">No books yet</h3>
              <p className="text-gray-500 mb-6">Purchase books to see them here.</p>
              <Link href="/books" className="bg-[#e47911] hover:bg-[#c45500] text-white font-semibold px-6 py-3 rounded inline-block transition-colors">
                Browse Books
              </Link>
            </div>
          ) : (
            <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5" layout>
              <AnimatePresence>
                {books.map((book: any, i: number) => (
                  <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="group cursor-pointer">
                    <Link href={`/books/${book.id}`}>
                      <div className="relative aspect-[3/4] rounded-md overflow-hidden bg-gray-100 border border-gray-200 mb-3 shadow-sm group-hover:shadow-md transition-all duration-300">
                        {book.coverImage ? (
                          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
                        )}
                        <div className="absolute inset-0 bg-[#232f3e]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                          <span className="text-white text-xs font-semibold">Read Book →</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-medium text-[#232f3e] line-clamp-2 group-hover:text-[#e47911] transition-colors">{book.title}</h3>
                      <p className="text-gray-500 text-xs mt-1">{book.author}</p>
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
