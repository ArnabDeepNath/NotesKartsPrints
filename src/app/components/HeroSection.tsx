"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

const DotLottieReact = dynamic(
  () =>
    import("@lottiefiles/dotlottie-react").then(
      (module) => module.DotLottieReact,
    ),
  { ssr: false },
);

interface Props {
  bookCount: number;
  metrics: {
    totalTitles: number;
    totalGenres: number;
    totalAuthors: number;
    featuredTitles: number;
    copiesSold: number;
    catalogReviews: number;
    averageRating: number;
  };
}

const TITLE_PARTS = [
  { text: "Print", highlight: false },
  { text: "Notes", highlight: false },
  { text: "On", highlight: false },
  { text: "Demand", highlight: true },
  { text: "For", highlight: true },
  { text: "Every Campus.", highlight: true },
];

const HIGHLIGHTS = [
  "Same-day dispatch for urgent orders",
  "Premium paper, binding, and cover choices",
  "Student dashboard for repeat orders and tracking",
];

const LOTTIE_WAVE_URL =
  "https://assets-v2.lottiefiles.com/a/4c515f18-1185-11ee-ad44-d31b95ba38d4/K3LDCMaBRC.lottie";

export default function HeroSection({ bookCount, metrics }: Props) {
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const dashboardMetrics = [
    { label: "Active titles", value: metrics.totalTitles.toString() },
    { label: "Genres", value: metrics.totalGenres.toString() },
    {
      label: "Catalog reviews",
      value: `${(metrics.catalogReviews / 1000).toFixed(1)}k`,
    },
  ];

  useEffect(() => {
    const validWords = wordsRef.current.filter(Boolean);
    const tl = gsap.timeline({ delay: 0.2 });

    tl.fromTo(
      validWords,
      { opacity: 0, y: 80, rotateX: -60, transformOrigin: "center bottom" },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        stagger: 0.09,
        duration: 1.1,
        ease: "power4.out",
      },
    )
      .fromTo(
        subtitleRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.55",
      )
      .fromTo(
        ctaRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.4",
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center px-6 overflow-hidden pt-24 pb-16">
      {/* Animated background orbs */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        aria-hidden="true"
      >
        <div className="hero-wave-shell">
          <DotLottieReact
            src={LOTTIE_WAVE_URL}
            autoplay
            loop
            className="hero-wave-player"
          />
        </div>
        <div className="ambient-grid absolute inset-0 opacity-[0.05]" />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.07, 0.13, 0.07] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[10%] w-[55vw] h-[55vw] max-w-[750px] max-h-[750px] rounded-full blur-[80px]"
          style={{
            background: "radial-gradient(circle, #2997ff, transparent 70%)",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.09, 0.05] }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2.5,
          }}
          className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] rounded-full blur-[80px]"
          style={{
            background: "radial-gradient(circle, #0ea5e9, transparent 70%)",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.04, 0.07, 0.04] }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
          className="absolute top-[60%] left-[40%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full blur-[60px]"
          style={{
            background: "radial-gradient(circle, #34d399, transparent 70%)",
          }}
        />
      </div>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_460px] gap-12 lg:gap-10 items-center">
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "backOut" }}
            className="relative mb-8 inline-flex items-center gap-2.5 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-sm text-[#86868b]">
              <span className="text-white font-semibold">
                {(metrics.copiesSold || bookCount).toLocaleString()}+
              </span>{" "}
              copies sold across the current NoteKart catalog
            </span>
          </motion.div>

          <h1
            className="text-[clamp(48px,8vw,96px)] font-black tracking-tight leading-[1.02] mb-7"
            style={{ perspective: "1200px" }}
          >
            {TITLE_PARTS.map((part, i) => (
              <span
                key={i}
                ref={(el) => {
                  wordsRef.current[i] = el;
                }}
                className={`inline-block mr-[0.2em] opacity-0 ${
                  part.highlight ? "text-gradient-blue" : "text-white"
                }`}
              >
                {part.text}
              </span>
            ))}
          </h1>

          <p
            ref={subtitleRef}
            className="opacity-0 text-lg md:text-xl text-[#86868b] max-w-[640px] leading-relaxed mb-10 mx-auto lg:mx-0"
          >
            NoteKart Prints helps students, educators, and coaching centers
            upload PDFs, configure print specs, and receive professionally bound
            notes without juggling local vendors, manual follow-ups, or
            uncertain delivery.
          </p>

          <div
            ref={ctaRef}
            className="opacity-0 flex flex-col sm:flex-row gap-4 items-center lg:items-start"
          >
            <motion.a
              href="#pricing"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2.5 bg-[#2997ff] hover:bg-[#1a83ff] text-white font-semibold px-8 py-4 rounded-full text-[15px] transition-colors"
            >
              Start Printing Now
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.a>
            <motion.a
              href="#workflow"
              whileHover={{
                scale: 1.04,
                backgroundColor: "rgba(255,255,255,0.09)",
              }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2.5 bg-white/[0.06] border border-white/[0.12] text-white font-semibold px-8 py-4 rounded-full text-[15px] transition-colors"
            >
              See How It Works
            </motion.a>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto lg:mx-0">
            {HIGHLIGHTS.map((item) => (
              <motion.div
                key={item}
                whileHover={{ y: -6, scale: 1.015 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                className="abstract-panel rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 text-sm text-[#b2b2b8]"
              >
                <span className="block text-white font-medium mb-1">
                  Built for serious print orders
                </span>
                {item}
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#2997ff]/15 via-transparent to-cyan-400/10 blur-2xl" />
          <motion.div
            whileHover={{ y: -8, rotateX: -2, rotateY: 2 }}
            transition={{ type: "spring", stiffness: 160, damping: 18 }}
            className="abstract-panel relative rounded-[2rem] border border-white/[0.08] bg-[#0b0d10]/85 backdrop-blur-xl p-5 md:p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="abstract-film opacity-60" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-white font-semibold text-lg">
                  NoteKart Print Console
                </p>
                <p className="text-[#6e6e73] text-sm">
                  Turn lecture notes into premium deliverables
                </p>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                Live pricing
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {dashboardMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="abstract-panel rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3"
                >
                  <p className="text-[#6e6e73] text-[11px] uppercase tracking-[0.18em]">
                    {metric.label}
                  </p>
                  <p className="text-white text-xl font-black mt-1">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                className="abstract-panel rounded-[1.5rem] border border-white/[0.07] bg-[linear-gradient(135deg,rgba(41,151,255,0.12),rgba(255,255,255,0.03),rgba(14,165,233,0.14),rgba(255,255,255,0.03))] bg-[length:220%_220%] p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-[#8ec8ff] text-xs uppercase tracking-[0.22em] font-semibold">
                      Catalog snapshot
                    </p>
                    <h3 className="text-white text-2xl font-black mt-2">
                      Built on proof visitors can verify
                    </h3>
                  </div>
                  <span className="rounded-full bg-black/30 px-3 py-1 text-xs text-white/80 border border-white/[0.08]">
                    {metrics.featuredTitles} featured picks
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="abstract-panel rounded-2xl bg-black/20 border border-white/[0.08] p-4">
                    <p className="text-[#6e6e73] mb-1">Average rating</p>
                    <p className="text-white font-semibold">
                      {metrics.averageRating.toFixed(1)} / 5 across top catalog
                      titles
                    </p>
                  </div>
                  <div className="abstract-panel rounded-2xl bg-black/20 border border-white/[0.08] p-4">
                    <p className="text-[#6e6e73] mb-1">Distinct authors</p>
                    <p className="text-white font-semibold">
                      {metrics.totalAuthors} writers already represented in the
                      store
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  whileHover={{ y: -4 }}
                  className="abstract-panel rounded-[1.25rem] border border-white/[0.07] bg-white/[0.03] p-4"
                >
                  <p className="text-[#6e6e73] text-xs uppercase tracking-[0.2em] mb-2">
                    Workflow
                  </p>
                  <ul className="space-y-2 text-sm text-[#b8b8be]">
                    <li>Upload PDF or notes bundle</li>
                    <li>Choose paper, print sides, and binding</li>
                    <li>Track status from payment to dispatch</li>
                  </ul>
                </motion.div>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="abstract-panel rounded-[1.25rem] border border-white/[0.07] bg-white/[0.03] p-4"
                >
                  <p className="text-[#6e6e73] text-xs uppercase tracking-[0.2em] mb-2">
                    Why teams use it
                  </p>
                  <ul className="space-y-2 text-sm text-[#b8b8be]">
                    <li>Standardized quality across every batch</li>
                    <li>Instant estimates before checkout</li>
                    <li>Centralized orders for classes and coaching centers</li>
                  </ul>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="text-[10px] text-[#6e6e73] uppercase tracking-[0.22em]">
            Scroll
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6e6e73"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
