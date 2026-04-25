"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Book } from "./BookCard";
import BookCard from "./BookCard";

interface Props {
  featuredBook: Book | null;
  metrics: {
    totalTitles: number;
    totalGenres: number;
    totalAuthors: number;
    featuredTitles: number;
    copiesSold: number;
    catalogReviews: number;
    averageRating: number;
  };
  publishers: string[];
  trustCards: Array<{
    title: string;
    publisher: string;
    sold: number;
    rating: number;
    reviews: number;
    summary: string;
  }>;
}

const WORKFLOW = [
  {
    step: "01",
    icon: "👤",
    title: "Register or Login",
    description: "Create your free account to get started with your order.",
  },
  {
    step: "02",
    icon: "📤",
    title: "Upload & Setting File",
    description: "Upload your PDF or select from our catalog. Configure print options.",
  },
  {
    step: "03",
    icon: "🛒",
    title: "Add Shipping Address",
    description: "Enter your delivery address for doorstep delivery.",
  },
  {
    step: "04",
    icon: "💳",
    title: "Make Payment",
    description: "Secure payment via Razorpay. COD available on select orders.",
  },
];

const USP_POINTS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e47911" strokeWidth="2" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "Best Online Document Printing Service",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e47911" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    title: "Upload – Print Setting – Payment",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e47911" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: "Standard Turnaround 48–72 Hours",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e47911" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: "Low Pricing for Every Product",
  },
];

const PRINT_TIPS = [
  "PDF, DOC, DOCX, PPT, PPTX, JPEG, PNG",
  "We recommend: Upload a PDF for perfect print",
];

const REVIEWS = [
  { name: "Arun K.", stars: 5, text: "Printing was good and I appreciate the printer for printing in low prices for a students like us." },
  { name: "Priyam", stars: 5, text: "ONLY GIVE QUALITY SERVICE SO DON'T THINK TOO MUCH AND THEIR CUSTOMER SERVICE IS ALSO GOOD!" },
  { name: "Anand", stars: 5, text: "Superb stuff and well bound, reasonable price too. Looking forward to more orders from here." },
  { name: "Arif", stars: 5, text: "The Quality of printing is quite good and Softcover binding is professional." },
  { name: "Sudhir", stars: 5, text: "Nice Printing. Nice front cover quality and also great side info on edge." },
];

export default function LandingSections({
  featuredBook,
  metrics,
  publishers,
  trustCards,
}: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const FAQS = [
    {
      q: "What can I print on NoteKart Prints?",
      a: "You can upload class notes, lab manuals, assignments, exam prep PDFs, revision bundles – virtually any printable document.",
    },
    {
      q: "Can this handle bulk academic orders?",
      a: "Yes! The workflow is designed for coaching centers, student groups, and faculty teams needing high-volume print runs.",
    },
    {
      q: "How does delivery work?",
      a: "Orders are dispatched in 24–72 hours. We deliver to hostel, home, or coaching centre addresses across India.",
    },
    {
      q: "Are orders cancellable or refundable?",
      a: "Orders cannot be cancelled or refunded once placed since we print on demand. Please review your order carefully before payment.",
    },
    {
      q: "Is COD available?",
      a: "COD is available on select orders. For COD orders, a 40% advance payment is required which is non-refundable.",
    },
  ];

  return (
    <>
      {/* USP / Trust Badges Section */}
      <section className="bg-white border-t border-b border-gray-200 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {USP_POINTS.map((usp, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center text-center gap-2 p-4"
            >
              <div>{usp.icon}</div>
              <p className="text-xs font-bold text-[#232f3e] leading-snug">{usp.title}</p>
              <div className="w-8 h-0.5 bg-[#e47911] rounded-full mt-1" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Easy Steps Section */}
      <section id="how-it-works" className="bg-[#f7f8fa] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-[#232f3e]">Easy Steps to Get Prints</h2>
            <p className="text-sm text-gray-500 mt-1">Simple 4-step process to get your notes printed</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {WORKFLOW.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-5 text-center relative"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-50 border-2 border-[#e47911] flex items-center justify-center text-2xl">
                  {step.icon}
                </div>
                <h3 className="font-bold text-[#232f3e] text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                {i < WORKFLOW.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-3 text-gray-300 text-lg font-bold z-10">→</div>
                )}
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            🔒 Your Files are Secure. After Printing Files will be Deleted.
          </p>
        </div>
      </section>

      {/* Print Tips + Order by Email + Corporate Pricing */}
      <section className="bg-white py-10 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Print Artwork Tips */}
          <div className="border border-gray-200 rounded-xl p-5">
            <h3 className="font-bold text-[#232f3e] mb-3 flex items-center gap-2">
              <span className="text-lg">🖨️</span> Print Artwork Tips
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              To make ordering as print-ready as possible, we accept 5 different file types:
            </p>
            {PRINT_TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <span className="text-[#e47911] font-bold text-xs mt-0.5">✓</span>
                <p className="text-xs text-gray-700">{tip}</p>
              </div>
            ))}
          </div>

          {/* Order by Email */}
          <div className="border border-gray-200 rounded-xl p-5">
            <h3 className="font-bold text-[#232f3e] mb-3 flex items-center gap-2">
              <span className="text-lg">📧</span> Order by Email
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              E-mail your file with printing and contact details to <strong>print@notekart.in</strong>
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[#e47911] font-bold text-xs mt-0.5">✓</span>
                <p className="text-xs text-gray-700">We Will send you the Payment Link</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#e47911] font-bold text-xs mt-0.5">✓</span>
                <p className="text-xs text-gray-700">Make Payment and We will process your Order</p>
              </div>
            </div>
          </div>

          {/* Corporate Pricing */}
          <div className="border-2 border-[#e47911] rounded-xl p-5 bg-orange-50">
            <h3 className="font-bold text-[#232f3e] mb-3 flex items-center gap-2">
              <span className="text-lg">🏢</span> Corporate Pricing
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              We Accept Corporate Bulk orders. Just Contact us at:
            </p>
            <a
              href="mailto:info@notekart.in"
              className="inline-block bg-[#e47911] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#c45500] transition-colors"
            >
              info@notekart.in
            </a>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="bg-[#f7f8fa] py-10 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-black text-[#232f3e] mb-6">Customer Reviews</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {REVIEWS.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill={s <= review.stars ? "#e47911" : "#e0e0e0"}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-4">&ldquo;{review.text}&rdquo;</p>
                <p className="text-xs font-bold text-[#232f3e]">— {review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="bg-[#232f3e] py-8 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl md:text-2xl font-black text-white mb-2">
            Still Thinking!! Tired of Home Deliveries of Pizza??
          </h2>
          <p className="text-[#f5a623] font-bold text-lg">Now Try even Crispier Prints 😉</p>
          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/books">
              <button className="bg-[#e47911] hover:bg-[#c45500] text-white font-bold px-8 py-3 rounded-md transition-colors">
                Shop Now
              </button>
            </Link>
            <Link href="/print">
              <button className="border-2 border-white text-white font-bold px-8 py-3 rounded-md hover:bg-white/10 transition-colors">
                Print Your Notes
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faqs" className="bg-white py-12 px-4 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-[#232f3e] mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-[#232f3e]">{faq.q}</span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"
                    className={`flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-3 text-sm text-gray-600 bg-gray-50 border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
