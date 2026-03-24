"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Book } from "./BookCard";

interface Props {
  book: Book;
}

const SPINE_COLORS = [
  { a: "#1d3557", b: "#457b9d", c: "#a8dadc" },
  { a: "#0f172a", b: "#1e40af", c: "#60a5fa" },
  { a: "#1b4332", b: "#2d6a4f", c: "#52b788" },
];

export default function FeaturedBook({ book }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const category = book.categories?.nodes?.[0]?.name ?? "Literature";
  const author = book.author?.node?.name ?? "Unknown Author";
  const coverImg = book.featuredImage?.node?.sourceUrl;
  const palette = SPINE_COLORS[0];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Cover slides in from left
      gsap.fromTo(
        coverRef.current,
        { x: -90, opacity: 0, rotateY: 20 },
        {
          x: 0,
          opacity: 1,
          rotateY: 0,
          duration: 1.3,
          ease: "power4.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            once: true,
          },
        },
      );

      // Text children stagger in from right
      const children = textRef.current
        ? Array.from(textRef.current.children)
        : [];
      gsap.fromTo(
        children,
        { x: 70, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          stagger: 0.11,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            once: true,
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="featured" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-xs text-[#f5a623] font-semibold uppercase tracking-[0.22em]">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#f5a623">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Editor&apos;s Pick
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#f5a623">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-3">
            Featured Book
          </h2>
        </motion.div>

        {/* Feature Card */}
        <div
          ref={sectionRef}
          className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center rounded-[2rem] overflow-hidden p-10 md:p-16 lg:p-20"
          style={{
            background:
              "linear-gradient(140deg, #111 0%, #1c1c1e 60%, #0f0f0f 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Ambient glows */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2rem]"
            aria-hidden="true"
          >
            <div
              className="absolute -top-32 -left-32 w-72 h-72 rounded-full blur-[80px]"
              style={{ background: "rgba(41,151,255,0.09)" }}
            />
            <div
              className="absolute -bottom-32 -right-32 w-72 h-72 rounded-full blur-[80px]"
              style={{ background: "rgba(168,85,247,0.07)" }}
            />
          </div>

          {/* Book Cover 3D */}
          <div
            ref={coverRef}
            className="relative flex justify-center opacity-0"
            style={{ perspective: "900px" }}
          >
            <div className="relative">
              {/* Shadow */}
              <div
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-10 rounded-full blur-3xl"
                style={{ background: "rgba(0,0,0,0.7)" }}
              />

              {/* Book body */}
              <motion.div
                whileHover={{ rotateY: -8, rotateX: 3 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative w-52 sm:w-60 md:w-64 rounded-xl overflow-hidden"
                style={{
                  aspectRatio: "2/3",
                  background: coverImg
                    ? undefined
                    : `linear-gradient(155deg, ${palette.a} 0%, ${palette.b} 55%, ${palette.c} 100%)`,
                  boxShadow:
                    "0 40px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)",
                  transformStyle: "preserve-3d",
                }}
              >
                {coverImg ? (
                  <img
                    src={coverImg}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col justify-end p-7">
                    <div className="absolute inset-0 opacity-15">
                      {[...Array(7)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-full"
                          style={{
                            height: "1px",
                            background: "white",
                            top: `${12 + i * 12}%`,
                          }}
                        />
                      ))}
                      <div className="absolute top-6 right-6 w-20 h-20 rounded-full border-2 border-white/20" />
                    </div>
                    <div className="relative z-10">
                      <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.25em] block mb-2">
                        {category}
                      </span>
                      <h3 className="text-white font-black text-xl leading-tight">
                        {book.title}
                      </h3>
                    </div>
                  </div>
                )}
                {/* Shine layer */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(120deg, rgba(255,255,255,0.12) 0%, transparent 50%)",
                  }}
                />
              </motion.div>

              {/* Spine */}
              <div
                className="absolute left-0 top-0 w-4 h-full rounded-l-xl"
                style={{
                  background: `linear-gradient(to right, ${palette.a}, transparent)`,
                  filter: "brightness(0.65)",
                }}
              />
            </div>
          </div>

          {/* Text Content */}
          <div ref={textRef} className="relative z-10 flex flex-col gap-5">
            <span className="text-xs text-[#2997ff] font-semibold uppercase tracking-[0.22em]">
              {category}
            </span>
            <h3 className="text-3xl md:text-4xl lg:text-[44px] font-black text-white leading-[1.05]">
              {book.title}
            </h3>
            <div
              className="text-[#86868b] text-base leading-relaxed line-clamp-4 excerpt-clean"
              dangerouslySetInnerHTML={{ __html: book.excerpt }}
            />

            {/* Author */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{
                  background: `linear-gradient(135deg, ${palette.b}, ${palette.c})`,
                }}
              >
                {author.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{author}</p>
                <p className="text-[#6e6e73] text-xs">
                  {new Date(book.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {["Featured", category, "Must Read"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full text-[#86868b]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex gap-3 mt-2 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.04, backgroundColor: "#1a83ff" }}
                whileTap={{ scale: 0.97 }}
                className="bg-[#2997ff] text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-colors"
                style={{ boxShadow: "0 0 25px rgba(41,151,255,0.3)" }}
              >
                Read Now
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.04,
                  backgroundColor: "rgba(255,255,255,0.09)",
                }}
                whileTap={{ scale: 0.97 }}
                className="bg-white/[0.06] border border-white/[0.1] text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-colors"
              >
                Add to List
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
