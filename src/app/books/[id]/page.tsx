"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/app/components/ui/Toaster";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

function StarRating({
  rating,
  onRate,
}: {
  rating: number;
  onRate?: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate?.(star)}
          onMouseEnter={() => onRate && setHover(star)}
          onMouseLeave={() => onRate && setHover(0)}
          className={`text-xl transition-colors ${star <= (hover || rating) ? "text-[#f5a623]" : "text-white/20"} ${onRate ? "cursor-pointer" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const { user } = useAuth();
  const { addToCart } = useAuth();
  const { toast } = useToast();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    api.books
      .get(unwrappedParams.id)
      .then((data: any) => {
        setBook(data.book);
        setInWishlist(data.book?.inWishlist ?? false);
        if (data.book?.variations && data.book.variations.length > 0) {
          setSelectedVariation(data.book.variations[0]);
        }
      })
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [unwrappedParams.id]);

  const handleAddToCart = () => {
    if (!book) return;
    addToCart({
      bookId: book.id,
      variationId: selectedVariation?.id,
      variationString: selectedVariation ? `${selectedVariation.attributes?.type}: ${selectedVariation.attributes?.value}` : undefined,
      title: book.title,
      author: book.author ?? "",
      price: selectedVariation ? Number(selectedVariation.price) : Number(book.price),
      coverImage: selectedVariation?.image || book.coverImage,
      quantity: 1,
    });
    setAdded(true);
    toast(`${book.title} added to cart`, "success");
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = async () => {
    if (!user) {
      toast("Sign in to save books", "error");
      return;
    }
    setWishlistLoading(true);
    try {
      const data: any = await api.wishlist.toggle(book.id);
      setInWishlist(data.inWishlist);
      toast(data.message, "success");
    } catch {
      toast("Failed to update wishlist", "error");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast("Sign in to leave a review", "error");
      return;
    }
    setSubmittingReview(true);
    try {
      await api.books.review(book.id, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      toast("Review submitted!", "success");
      setReviewTitle("");
      setReviewComment("");
      setReviewRating(5);
      // Refresh book to update reviews
      const data: any = await api.books.get(unwrappedParams.id);
      setBook(data.book);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[320px_1fr] gap-12">
            <div className="aspect-[3/4] bg-white/[0.06] rounded-3xl animate-pulse" />
            <div className="space-y-4 pt-4">
              <div className="h-8 bg-white/[0.06] rounded-xl animate-pulse" />
              <div className="h-4 w-1/2 bg-white/[0.04] rounded-xl animate-pulse" />
              <div className="h-12 bg-white/[0.04] rounded-xl animate-pulse mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">📚</p>
          <h2 className="text-xl font-bold text-white mb-2">Book not found</h2>
          <Link href="/books" className="text-[#2997ff] hover:underline">
            ← Browse books
          </Link>
        </div>
      </div>
    );
  }

  const discount = book.comparePrice
    ? Math.round((1 - book.price / book.comparePrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
        <Link
          href="/books"
          className="inline-flex items-center gap-1 text-sm text-[#86868b] hover:text-white transition-colors mb-8"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Books
        </Link>

        {/* Book main section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-[320px_1fr] gap-12 mb-16"
        >
          {/* Cover */}
          <div className="relative">
            {selectedVariation?.image || book.coverImage ? (
              <img
                src={selectedVariation?.image || book.coverImage}
                alt={book.title}
                className="w-full aspect-[3/4] object-cover rounded-3xl shadow-2xl shadow-black/60"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-white/[0.06] rounded-3xl flex items-center justify-center text-8xl">
                📖
              </div>
            )}
            {discount > 0 && (
              <div className="absolute top-4 left-4 bg-[#ff453a] text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                -{discount}%
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {book.genre && (
              <span className="text-xs font-semibold text-[#2997ff] uppercase tracking-wider mb-3">
                {book.genre.name}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="text-lg text-[#86868b] mt-1">{book.subtitle}</p>
            )}
            <p className="text-base text-[#86868b] mt-2">
              by <span className="text-white">{book.author}</span>
            </p>

            {/* Rating */}
            <div className="flex items-center gap-3 mt-4">
              <StarRating rating={Math.round(book.rating || 0)} />
              <span className="text-sm text-[#86868b]">
                {Number(book.rating || 0).toFixed(1)} ({book.reviewCount || 0}{" "}
                reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-6">
              <span className="text-3xl font-bold text-white">
                ₹{Number(selectedVariation ? selectedVariation.price : book.price).toLocaleString("en-IN")}
              </span>
              {(selectedVariation ? selectedVariation.comparePrice : book.comparePrice) && (
                <span className="text-lg text-[#86868b] line-through">
                  ₹{Number(selectedVariation ? selectedVariation.comparePrice : book.comparePrice).toLocaleString("en-IN")}
                </span>
              )}
              {discount > 0 && (
                <span className="text-sm font-semibold text-[#30d158]">
                  Save {discount}%
                </span>
              )}
            </div>

            {/* Variations Selector */}
            {book.variations && book.variations.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-3">Options</p>
                <div className="flex flex-wrap gap-3">
                  {book.variations.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariation(v)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        selectedVariation?.id === v.id
                          ? "border-[#2997ff] bg-[#2997ff]/10 text-white"
                          : "border-white/[0.1] text-[#86868b] hover:border-white/[0.2] hover:text-white"
                      }`}
                    >
                      {v.attributes?.value || 'Option'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <p
              className={`text-sm mt-4 ${
                (selectedVariation ? selectedVariation.stock : book.stock) === 0 ? "text-[#ff453a]" : (selectedVariation ? selectedVariation.stock : book.stock) < 10 ? "text-[#f5a623]" : "text-[#30d158]"
              }`}
            >
              {(selectedVariation ? selectedVariation.stock : book.stock) === 0
                ? "Out of stock"
                : (selectedVariation ? selectedVariation.stock : book.stock) < 10
                  ? `Only ${(selectedVariation ? selectedVariation.stock : book.stock)} left`
                  : "In stock"}
            </p>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleAddToCart}
                disabled={(selectedVariation ? selectedVariation.stock : book.stock) === 0}
                className={`flex-1 py-3.5 rounded-2xl font-semibold text-sm transition-all ${
                  (selectedVariation ? selectedVariation.stock : book.stock) === 0
                    ? "bg-white/[0.04] text-[#86868b] cursor-not-allowed"
                    : added
                      ? "bg-[#30d158] text-white"
                      : "bg-[#2997ff] hover:bg-[#1a83ff] text-white"
                }`}
              >
                {added
                  ? "✓ Added to Cart"
                  : (selectedVariation ? selectedVariation.stock : book.stock) === 0
                    ? "Out of Stock"
                    : "Add to Cart"}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleWishlist}
                disabled={wishlistLoading}
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                  inWishlist
                    ? "border-[#ff453a]/40 bg-[#ff453a]/10 text-[#ff453a]"
                    : "border-white/[0.1] bg-white/[0.04] text-[#86868b] hover:text-[#ff453a]"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill={inWishlist ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </motion.button>
            </div>

            {/* Book details */}
            <div className="grid grid-cols-2 gap-3 mt-8 border-t border-white/[0.06] pt-6">
              {[
                { label: "Publisher", value: book.publisher },
                {
                  label: "Pages",
                  value: book.pages ? `${book.pages} pages` : null,
                },
                { label: "Format", value: book.format },
                { label: "ISBN", value: book.isbn },
                { label: "Language", value: book.language || "English" },
              ]
                .filter((d) => d.value)
                .map((d) => (
                  <div key={d.label}>
                    <p className="text-[10px] font-semibold text-[#48484a] uppercase tracking-wider">
                      {d.label}
                    </p>
                    <p className="text-sm text-white mt-0.5">{d.value}</p>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>

        {/* Description */}
        {book.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-xl font-bold text-white mb-4">
              About this Book
            </h2>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6">
              <p className="text-[#86868b] leading-relaxed whitespace-pre-line">
                {book.description}
              </p>
            </div>
          </motion.div>
        )}

        {/* Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-xl font-bold text-white mb-6">
            Customer Reviews
          </h2>

          {book.reviews?.length > 0 ? (
            <div className="space-y-4 mb-8">
              {book.reviews.map((review: any) => (
                <div
                  key={review.id}
                  className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2997ff] to-[#0066cc] flex items-center justify-center text-white text-xs font-bold">
                        {review.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {review.user?.name}
                        </p>
                        {review.verified && (
                          <p className="text-[10px] text-[#30d158]">
                            ✓ Verified Purchase
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <StarRating rating={review.rating} />
                      <p className="text-[10px] text-[#86868b] mt-0.5">
                        {new Date(review.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  {review.title && (
                    <p className="text-sm font-semibold text-white mt-2">
                      {review.title}
                    </p>
                  )}
                  {review.comment && (
                    <p className="text-sm text-[#86868b] mt-1">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-8 text-center mb-8">
              <p className="text-[#86868b] text-sm">
                No reviews yet. Be the first to review!
              </p>
            </div>
          )}

          {/* Review form */}
          {user ? (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6">
              <h3 className="text-base font-bold text-white mb-4">
                Write a Review
              </h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-2 block">
                    Your Rating
                  </label>
                  <StarRating rating={reviewRating} onRate={setReviewRating} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                    Title
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Summarize your review"
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#2997ff]/60 placeholder-[#48484a]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                    Comment
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts about this book..."
                    rows={4}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#2997ff]/60 placeholder-[#48484a] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-[#2997ff] hover:bg-[#1a83ff] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm flex items-center gap-2"
                >
                  {submittingReview && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6 text-center">
              <p className="text-[#86868b] text-sm mb-3">
                Sign in to leave a review.
              </p>
              <Link
                href="/login"
                className="text-[#2997ff] hover:underline text-sm font-semibold"
              >
                Sign In
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
