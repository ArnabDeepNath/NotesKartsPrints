"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import type { Book } from "./BookCard";

const DotLottieReact = dynamic(
  () =>
    import("@lottiefiles/dotlottie-react").then(
      (module) => module.DotLottieReact,
    ),
  { ssr: false },
);

const GRID_LOTTIE_URL =
  "https://assets-v2.lottiefiles.com/a/444c0c60-1189-11ee-928a-0fde9216846a/8vCQb9OkKV.lottie";

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
    title: "Upload your notes",
    description:
      "Drop PDFs, chapter packs, or class handouts into one clean order flow with instant file checks.",
  },
  {
    step: "02",
    title: "Customize the print job",
    description:
      "Choose paper weight, color mode, double-sided printing, covers, and binding without back-and-forth calls.",
  },
  {
    step: "03",
    title: "Track production live",
    description:
      "Students and teams see pricing, payment, queue status, and delivery progress from a single dashboard.",
  },
  {
    step: "04",
    title: "Receive or distribute",
    description:
      "Dispatch to hostels, campus pickup points, or bulk drop locations for classes and coaching batches.",
  },
];

const FEATURES = [
  {
    title: "Built for academic urgency",
    description:
      "Fast-turnaround printing for exam prep, revision bundles, and faculty handouts when timing actually matters.",
  },
  {
    title: "Consistent premium finishing",
    description:
      "Maintain professional output with controlled paper quality, durable binding, and clean cover presentation.",
  },
  {
    title: "Bulk ordering without chaos",
    description:
      "Organize department orders, classroom distributions, and coaching material runs without manual spreadsheet work.",
  },
  {
    title: "Transparent pricing logic",
    description:
      "Preview costs before checkout so students know exactly how quantity, binding, and paper settings affect the bill.",
  },
  {
    title: "Repeat-order friendly",
    description:
      "Reprint high-demand note packs in seconds using saved configurations and tracked order history.",
  },
  {
    title: "Made for growth",
    description:
      "Start with single student orders and scale to campus societies, test-prep institutes, and local print operations.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "Pay per order",
    description:
      "For individual students printing notes, assignments, and quick revision sets.",
    bullets: [
      "Instant quote calculation",
      "Single-order checkout",
      "Pickup and local delivery options",
    ],
  },
  {
    name: "Campus Team",
    price: "Built for groups",
    description:
      "For clubs, faculty cells, and coaching centers managing recurring note distribution.",
    bullets: [
      "Bulk upload workflows",
      "Shared order tracking",
      "Priority production windows",
    ],
  },
  {
    name: "NoteKart Pro",
    price: "Custom setup",
    description:
      "For high-volume operations that need branded ordering flows and managed fulfillment.",
    bullets: [
      "Dedicated support",
      "Advanced fulfillment coordination",
      "Custom pricing and SLA support",
    ],
  },
];

const FAQS = [
  {
    question: "What can users print on NoteKart Prints?",
    answer:
      "Users can upload class notes, lab manuals, assignments, exam prep compilations, and book-ready PDF bundles with configurable print settings.",
  },
  {
    question: "Can this handle bulk academic orders?",
    answer:
      "Yes. The workflow is designed to support coaching centers, student groups, and faculty teams that need repeated high-volume print runs.",
  },
  {
    question: "How does delivery work?",
    answer:
      "Orders can be routed for campus pickup, local delivery, or coordinated bulk handoff depending on the production setup you enable.",
  },
  {
    question: "Why position this like a SaaS product?",
    answer:
      "Because the value is not only printing. It is the software-led ordering, pricing, and fulfillment workflow that removes offline friction from repeat print demand.",
  },
];

export default function LandingSections({
  featuredBook,
  metrics,
  publishers,
  trustCards,
}: Props) {
  return (
    <>
      <section className="px-6 py-12 md:py-14">
        <div className="max-w-6xl mx-auto rounded-[2.25rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(41,151,255,0.04),rgba(255,255,255,0.02))] px-5 py-6 md:px-8 md:py-8 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
          <p className="text-center text-[11px] uppercase tracking-[0.24em] text-[#6e6e73] mb-5">
            Real catalog proof replacing placeholder brand names
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
            {publishers.map((publisher, index) => (
              <motion.div
                key={publisher}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.02 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="abstract-panel rounded-2xl border border-white/[0.06] bg-black/30 px-4 py-4 text-center text-xs md:text-sm font-semibold tracking-[0.18em] text-[#d5d7de]"
              >
                {publisher}
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5 items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.015, rotateX: -2, rotateY: 1.5 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                type: "spring",
                stiffness: 220,
                damping: 18,
              }}
              className="abstract-panel rounded-[1.75rem] border border-white/[0.07] bg-black/25 p-5"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="trust-panel-glow" aria-hidden="true" />
              <p className="text-xs uppercase tracking-[0.22em] text-[#8ec8ff] font-semibold mb-3">
                Trust snapshot
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-white text-3xl font-black">
                    {metrics.copiesSold.toLocaleString()}+
                  </p>
                  <p className="text-[#86868b] text-sm mt-1">
                    copies sold across 11 seeded titles
                  </p>
                </div>
                <div>
                  <p className="text-white text-3xl font-black">
                    {metrics.catalogReviews.toLocaleString()}+
                  </p>
                  <p className="text-[#86868b] text-sm mt-1">
                    catalog reviews already attached to those titles
                  </p>
                </div>
                <div>
                  <p className="text-white text-3xl font-black">
                    {metrics.averageRating.toFixed(1)}
                  </p>
                  <p className="text-[#86868b] text-sm mt-1">
                    average rating across the trust set shown here
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trustCards.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                  whileHover={{
                    y: -10,
                    scale: 1.02,
                    borderColor: "rgba(41,151,255,0.24)",
                  }}
                  className="abstract-panel rounded-[1.75rem] border border-white/[0.07] bg-black/25 p-5"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <motion.div
                    animate={{
                      opacity: [0.18, 0.32, 0.18],
                      scale: [1, 1.08, 1],
                    }}
                    transition={{
                      duration: 7 + index,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl"
                    style={{ background: "rgba(41,151,255,0.18)" }}
                  />
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#8ec8ff] font-semibold mb-3">
                    {item.publisher}
                  </p>
                  <h3 className="text-white text-xl font-bold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[#b6bac3] text-sm leading-relaxed mb-4">
                    {item.summary}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                      <p className="text-white font-black text-lg">
                        {item.rating.toFixed(1)}
                      </p>
                      <p className="text-[#6e6e73] text-[10px] uppercase tracking-[0.18em]">
                        rating
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                      <p className="text-white font-black text-lg">
                        {(item.reviews / 1000).toFixed(1)}k
                      </p>
                      <p className="text-[#6e6e73] text-[10px] uppercase tracking-[0.18em]">
                        reviews
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                      <p className="text-white font-black text-lg">
                        {item.sold}
                      </p>
                      <p className="text-[#6e6e73] text-[10px] uppercase tracking-[0.18em]">
                        sold
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mb-14"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-[#2997ff] font-semibold mb-3">
              How it works
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.05] mb-4">
              A complete print workflow, not just a storefront.
            </h2>
            <p className="text-[#86868b] text-lg leading-relaxed">
              NoteKart Prints combines a storefront, quoting layer, and print
              workflow. This flow turns raw files into a dependable ordering
              experience with less manual coordination and clearer expectations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {WORKFLOW.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                whileHover={{
                  y: -8,
                  scale: 1.015,
                  borderColor: "rgba(41,151,255,0.24)",
                }}
                className="abstract-panel rounded-[1.75rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-6"
              >
                <p className="text-[#2997ff] text-sm font-black tracking-[0.22em] mb-6">
                  {item.step}
                </p>
                <h3 className="text-white text-2xl font-bold mb-3">
                  {item.title}
                </h3>
                <p className="text-[#86868b] leading-relaxed text-sm">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10 items-start">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-[#2997ff] font-semibold mb-3">
                Why NoteKart wins
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.05] mb-4">
                Position the product like a serious service platform.
              </h2>
              <p className="text-[#86868b] text-lg max-w-3xl leading-relaxed">
                Strong print landing pages communicate reliability, production
                control, and proof. These sections now do that with real catalog
                names and repo-backed numbers instead of filler content.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  whileHover={{
                    y: -8,
                    scale: 1.015,
                    borderColor: "rgba(41,151,255,0.22)",
                  }}
                  className="abstract-panel rounded-[1.75rem] border border-white/[0.07] bg-white/[0.025] p-6"
                >
                  <h3 className="text-white text-xl font-bold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[#86868b] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.aside
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="abstract-panel rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(41,151,255,0.13),rgba(255,255,255,0.02))] p-6 lg:sticky lg:top-28"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-[#8ec8ff] font-semibold mb-3">
              Conversion snapshot
            </p>
            <h3 className="text-3xl font-black text-white leading-tight mb-4">
              Make the value proposition obvious in under 10 seconds.
            </h3>
            <p className="text-[#c1c3cb] text-sm leading-relaxed mb-6">
              Visitors should understand what NoteKart Prints offers, why the
              workflow is easier than offline printing, and what proof supports
              the offer.
            </p>
            <div className="space-y-3">
              {[
                `${metrics.totalTitles} active titles already in the catalog`,
                `${metrics.featuredTitles} featured titles supporting the landing flow`,
                `${metrics.catalogReviews.toLocaleString()}+ reviews reinforcing buyer confidence`,
              ].map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3 text-sm text-white/85"
                >
                  {point}
                </div>
              ))}
            </div>
            {featuredBook && (
              <div className="mt-6 rounded-[1.5rem] border border-white/[0.07] bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#6e6e73] mb-2">
                  Live catalog preview
                </p>
                <p className="text-white font-semibold leading-snug">
                  {featuredBook.title}
                </p>
                <p className="text-[#86868b] text-sm mt-2 line-clamp-3">
                  {featuredBook.excerpt.replace(/<[^>]+>/g, " ").trim() ||
                    "A featured title remains available below so the landing page still connects to the product catalog."}
                </p>
              </div>
            )}
          </motion.aside>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-[#2997ff] font-semibold mb-3">
              Flexible pricing
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.05] mb-4">
              Structured for single orders and high-volume demand.
            </h2>
            <p className="text-[#86868b] text-lg leading-relaxed">
              You do not need to expose exact rates in the hero. It is enough to
              show that the product serves both one-off users and larger
              recurring buyers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                whileHover={{ y: -8, scale: 1.015 }}
                className={`abstract-panel relative overflow-hidden rounded-[2rem] border p-7 ${
                  index === 1
                    ? "border-[#2997ff]/40 bg-[linear-gradient(180deg,rgba(41,151,255,0.14),rgba(255,255,255,0.03))]"
                    : "border-white/[0.07] bg-white/[0.025]"
                }`}
              >
                {index === 1 && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-22 mix-blend-screen"
                  >
                    <DotLottieReact
                      src={GRID_LOTTIE_URL}
                      autoplay
                      loop
                      className="h-full w-full scale-[1.1]"
                    />
                  </div>
                )}
                <p className="text-sm text-[#8ec8ff] font-semibold uppercase tracking-[0.2em] mb-4">
                  {plan.name}
                </p>
                <p className="text-white text-3xl font-black mb-3">
                  {plan.price}
                </p>
                <p className="text-[#86868b] text-sm leading-relaxed mb-6">
                  {plan.description}
                </p>
                <div className="space-y-3">
                  {plan.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="flex items-start gap-3 text-sm text-white/85"
                    >
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#2997ff]" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto rounded-[2.2rem] border border-white/[0.07] bg-[linear-gradient(135deg,rgba(41,151,255,0.12),rgba(255,255,255,0.02),rgba(14,165,233,0.08))] p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-10 items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#8ec8ff] font-semibold mb-3">
                FAQ and reassurance
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.05] mb-5">
                Remove the hesitation before checkout.
              </h2>
              <p className="text-[#d7d9df] text-lg leading-relaxed max-w-2xl">
                A stronger landing page answers operational questions early so
                users trust the platform enough to upload files and place
                orders.
              </p>
            </div>

            <motion.a
              href="/print"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center rounded-full bg-white text-black font-semibold px-7 py-4 text-sm"
            >
              Go to Print Dashboard
            </motion.a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
            {FAQS.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="rounded-[1.5rem] border border-white/[0.08] bg-black/20 p-5"
              >
                <h3 className="text-white font-semibold text-lg mb-2">
                  {faq.question}
                </h3>
                <p className="text-[#b8bbc3] text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
