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
          className={`text-xl transition-colors ${star <= (hover || rating) ? "text-[#e47911]" : "text-gray-300"} ${onRate ? "cursor-pointer" : "cursor-default"}`}
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
      <div className="min-h-screen bg-[#f7f8fa]">
        <Navbar />
        <div className="pt-6 pb-20 px-4 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[300px_1fr] gap-10">
            <div className="aspect-[3/4] bg-gray-200 rounded-md animate-pulse" />
            <div className="space-y-4 pt-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 bg-gray-200 rounded animate-pulse mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">📚</p>
          <h2 className="text-xl font-bold text-[#232f3e] mb-2">Book not found</h2>
          <Link href="/books" className="text-[#146eb4] hover:underline">
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
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar />

      <div className="pt-6 pb-20 px-4 max-w-6xl mx-auto">
        <Link
          href="/books"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#232f3e] transition-colors mb-6"
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
          className="grid md:grid-cols-[300px_1fr] gap-10 mb-12"
        >
          {/* Cover */}
          <div className="relative">
            {selectedVariation?.image || book.coverImage ? (
              <img
                src={selectedVariation?.image || book.coverImage}
                alt={book.title}
                className="w-full aspect-[3/4] object-cover rounded-md shadow-lg"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-gray-200 rounded-md flex items-center justify-center text-8xl">
                📖
              </div>
            )}
            {discount > 0 && (
              <div className="absolute top-3 left-3 bg-[#e47911] text-white text-xs font-bold px-2 py-1 rounded">
                -{discount}% OFF
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {book.genre && (
              <span className="text-xs font-semibold text-[#e47911] uppercase tracking-wider mb-3">
                {book.genre.name}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-[#232f3e] leading-tight">
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="text-lg text-gray-500 mt-1">{book.subtitle}</p>
            )}
            <p className="text-base text-gray-500 mt-2">
              by <span className="text-[#232f3e] font-medium">{book.author}</span>
            </p>

            {/* Rating */}
            <div className="flex items-center gap-3 mt-4">
              <StarRating rating={Math.round(book.rating || 0)} />
              <span className="text-sm text-gray-500">
                {Number(book.rating || 0).toFixed(1)} ({book.reviewCount || 0}{" "}
                reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-6">
              <span className="text-3xl font-bold text-[#232f3e]">
                Rs. {Number(selectedVariation ? selectedVariation.price : book.price).toLocaleString("en-IN")}
              </span>
              {(selectedVariation ? selectedVariation.comparePrice : book.comparePrice) && (
                <span className="text-lg text-gray-400 line-through">
                  Rs. {Number(selectedVariation ? selectedVariation.comparePrice : book.comparePrice).toLocaleString("en-IN")}
                </span>
              )}
              {discount > 0 && (
                <span className="text-sm font-semibold text-green-600">
                  Save {discount}%
                </span>
              )}
            </div>
            <p className="text-sm text-green-600 font-medium mt-1">FREE Delivery</p>

            {/* Variations Selector */}
            {book.variations && book.variations.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Options</p>
                <div className="flex flex-wrap gap-3">
                  {book.variations.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariation(v)}
                      className={`px-4 py-2 rounded border text-sm font-medium transition-all ${
                        selectedVariation?.id === v.id
                          ? "border-[#e47911] bg-[#e47911]/10 text-[#e47911]"
                          : "border-gray-300 text-gray-600 hover:border-[#e47911] hover:text-[#e47911]"
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
              className={`text-sm mt-4 font-medium ${
                (selectedVariation ? selectedVariation.stock : book.stock) === 0 ? "text-red-500" : (selectedVariation ? selectedVariation.stock : book.stock) < 10 ? "text-[#e47911]" : "text-green-600"
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
                className={`flex-1 py-3 rounded font-semibold text-sm transition-all ${
                  (selectedVariation ? selectedVariation.stock : book.stock) === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : added
                      ? "bg-green-600 text-white"
                      : "bg-[#e47911] hover:bg-[#c45500] text-white"
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
                className={`w-11 h-11 rounded border flex items-center justify-center transition-all ${
                  inWishlist
                    ? "border-red-300 bg-red-50 text-red-500"
                    : "border-gray-300 bg-white text-gray-400 hover:text-red-500 hover:border-red-300"
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
            <div className="grid grid-cols-2 gap-3 mt-8 border-t border-gray-200 pt-6">
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
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {d.label}
                    </p>
                    <p className="text-sm text-[#232f3e] mt-0.5">{d.value}</p>
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
            <h2 className="text-xl font-bold text-[#232f3e] mb-4">
              About this Book
            </h2>
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
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
          <h2 className="text-xl font-bold text-[#232f3e] mb-6">
            Customer Reviews
          </h2>

          {book.reviews?.length > 0 ? (
            <div className="space-y-4 mb-8">
              {book.reviews.map((review: any) => (
                <div
                  key={review.id}
                  className="bg-white border border-gray-200 rounded-md p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#232f3e] flex items-center justify-center text-white text-xs font-bold">
                        {review.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#232f3e]">
                          {review.user?.name}
                        </p>
                        {review.verified && (
                          <p className="text-[10px] text-green-600">
                            ✓ Verified Purchase
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <StarRating rating={review.rating} />
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(review.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  {review.title && (
                    <p className="text-sm font-semibold text-[#232f3e] mt-2">
                      {review.title}
                    </p>
                  )}
                  {review.comment && (
                    <p className="text-sm text-gray-500 mt-1">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-md p-8 text-center mb-8">
              <p className="text-gray-500 text-sm">
                No reviews yet. Be the first to review!
              </p>
            </div>
          )}

          {/* Review form */}
          {user ? (
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <h3 className="text-base font-bold text-[#232f3e] mb-4">
                Write a Review
              </h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    Your Rating
                  </label>
                  <StarRating rating={reviewRating} onRate={setReviewRating} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Title
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Summarize your review"
                    className="w-full bg-white border border-gray-300 rounded px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-[#e47911] placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Comment
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts about this book..."
                    rows={4}
                    className="w-full bg-white border border-gray-300 rounded px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-[#e47911] placeholder-gray-400 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-[#e47911] hover:bg-[#c45500] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded transition-colors text-sm flex items-center gap-2"
                >
                  {submittingReview && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-md p-6 text-center">
              <p className="text-gray-500 text-sm mb-3">
                Sign in to leave a review.
              </p>
              <Link
                href="/login"
                className="text-[#146eb4] hover:underline text-sm font-semibold"
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
