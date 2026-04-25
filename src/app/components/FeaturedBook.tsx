"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Book } from "./BookCard";
import BookCard from "./BookCard";

interface Props {
  book: Book;
  allBooks?: Book[];
}

export default function FeaturedBook({ book, allBooks = [] }: Props) {
  const category = book.categories?.nodes?.[0]?.name ?? "Featured";
  const author = book.author?.node?.name ?? "NoteKart Team";
  const coverImg = book.featuredImage?.node?.sourceUrl;
  const price = book.price ?? 599;
  const originalPrice = book.originalPrice ?? Math.round(price * 1.3);

  const topSelling = allBooks.slice(0, 6);

  return (
    <>
      {/* New Offers Section */}
      {allBooks.length > 0 && (
        <section className="bg-[#f7f8fa] py-8 px-4 border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[10px] font-bold text-[#e47911] uppercase tracking-widest block mb-0.5">Limited Time</span>
                <h2 className="text-2xl font-black text-[#232f3e]">New Offers</h2>
              </div>
              <Link href="/books?offers=true">
                <span className="text-sm font-bold text-[#146eb4] hover:underline cursor-pointer">View All Offers →</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allBooks.slice(0, 12).map((b, i) => (
                <BookCard key={b.id} book={b} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured / Editor Pick */}
      <section className="bg-white py-8 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#e47911">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <h2 className="text-2xl font-black text-[#232f3e]">Editor&apos;s Pick</h2>
          </div>

          <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-2xl overflow-hidden flex flex-col md:flex-row">
            {/* Cover */}
            <div className="md:w-64 flex-shrink-0 flex items-center justify-center p-8">
              {coverImg ? (
                <img src={coverImg} alt={book.title} className="w-40 h-52 object-cover rounded-xl shadow-2xl" />
              ) : (
                <div className="w-40 h-52 rounded-xl shadow-2xl bg-gradient-to-b from-[#2d3a8c] to-[#1a2060] flex flex-col items-center justify-center p-4">
                  <span className="text-white/60 text-[8px] uppercase tracking-widest mb-2">{category}</span>
                  <p className="text-white font-bold text-sm text-center leading-snug">{book.title}</p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
              <span className="inline-block bg-[#e47911] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest w-fit mb-3">
                {category}
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-2">{book.title}</h3>
              <p className="text-white/60 text-sm mb-4">by {author}</p>
              {book.excerpt && (
                <p className="text-white/70 text-sm leading-relaxed mb-5 line-clamp-2 excerpt-clean"
                  dangerouslySetInnerHTML={{ __html: book.excerpt }}
                />
              )}
              <div className="flex items-center gap-4 mb-5">
                <span className="text-2xl font-black text-[#f5a623]">Rs. {price.toLocaleString()}</span>
                <span className="text-white/40 line-through text-sm">Rs. {originalPrice.toLocaleString()}</span>
              </div>
              <div className="flex gap-3">
                <Link href={`/books/${book.slug || book.id}`}>
                  <button className="bg-[#e47911] hover:bg-[#c45500] text-white font-bold px-6 py-2.5 rounded-md transition-colors text-sm">
                    Order Now
                  </button>
                </Link>
                <Link href="/books">
                  <button className="border-2 border-white/30 text-white font-bold px-6 py-2.5 rounded-md hover:bg-white/10 transition-colors text-sm">
                    Browse All
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Selling Section */}
      {topSelling.length > 0 && (
        <section className="bg-[#f7f8fa] py-8 px-4 border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[10px] font-bold text-[#e47911] uppercase tracking-widest block mb-0.5">Most Popular</span>
                <h2 className="text-2xl font-black text-[#232f3e]">Top Selling Books</h2>
              </div>
              <Link href="/books">
                <span className="text-sm font-bold text-[#146eb4] hover:underline cursor-pointer">View All →</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {topSelling.map((b, i) => (
                <BookCard key={b.id} book={b} index={i + 20} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
