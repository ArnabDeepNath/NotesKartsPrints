"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export interface Book {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  slug?: string;
  featuredImage?: { node: { sourceUrl: string; altText: string } };
  categories?: { nodes: { name: string }[] };
  author?: { node: { name: string } };
  price?: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  sold?: number;
}

interface Props {
  book: Book;
  index: number;
}

const COVER_COLORS = [
  "#1d3557", "#0f172a", "#1b4332", "#3d105a", "#422006",
  "#0c1445", "#0d2137", "#4a0e0e", "#1a1c2c", "#3b0764",
];

function StarRating({ rating = 4.2 }: { rating?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} width="11" height="11" viewBox="0 0 24 24" fill={star <= Math.round(rating) ? "#e47911" : "#e0e0e0"}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-[10px] text-gray-500 ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function BookCard({ book, index }: Props) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const coverImg = book.featuredImage?.node?.sourceUrl;
  const category = book.categories?.nodes?.[0]?.name ?? "General";
  const author = book.author?.node?.name ?? "NoteKart Team";
  const price = book.price ?? Math.floor(299 + (index * 113) % 700);
  const originalPrice = book.originalPrice ?? Math.round(price * 1.25);
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
  const rating = book.rating ?? (3.8 + (index % 12) * 0.1);

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
      transition={{ duration: 0.2 }}
      className="product-card bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer flex flex-col"
      onClick={() => router.push(`/books/${book.slug || book.id}`)}
    >
      {/* Cover Image */}
      <div className="relative bg-gray-50" style={{ height: "200px" }}>
        {coverImg && !imgError ? (
          <img
            src={coverImg}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4"
            style={{ background: `linear-gradient(155deg, ${COVER_COLORS[index % COVER_COLORS.length]} 0%, ${COVER_COLORS[(index + 3) % COVER_COLORS.length]} 100%)` }}
          >
            <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest block mb-1">{category}</span>
            <p className="text-white font-bold text-sm text-center leading-snug line-clamp-3">{book.title}</p>
            <span className="text-white/60 text-[10px] mt-2">{author}</span>
          </div>
        )}
        {/* Discount badge */}
        {discount > 5 && (
          <div className="absolute top-2 left-2 bg-[#e47911] text-white text-[10px] font-bold px-2 py-0.5 rounded">
            -{discount}% OFF
          </div>
        )}
        {/* Category pill */}
        <div className="absolute top-2 right-2 bg-white/90 text-[#232f3e] text-[9px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
          {category}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-[#0f1111] font-bold text-sm leading-snug line-clamp-2 mb-1 min-h-[2.5rem]">
          {book.title}
        </h3>
        <p className="text-xs text-[#565959] mb-1.5 truncate">{author}</p>

        <StarRating rating={rating} />

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-[#0f1111] font-black text-base">Rs. {price.toLocaleString()}</span>
          <span className="text-gray-400 text-xs line-through">Rs. {originalPrice.toLocaleString()}</span>
        </div>

        {/* Free delivery badge */}
        <p className="text-[10px] text-[#007600] font-medium mt-0.5">FREE Delivery</p>

        {/* Add to Cart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/books/${book.slug || book.id}`);
          }}
          className="mt-auto w-full bg-[#e47911] hover:bg-[#c45500] text-white font-bold text-xs py-2 rounded-md mt-3 transition-colors"
        >
          View Details
        </button>
      </div>
    </motion.div>
  );
}
