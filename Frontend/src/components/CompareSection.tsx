import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

/* ════════════════════════════════════════════════════════════════════════
 * SOLIVA — Comparison Section
 * Editorial split-screen poster (magazine spread), NOT side-by-side cards.
 * One continuous canvas: cool-grey "Traditional" half | warm-ivory "Soliva"
 * half, joined by a centre divider with a floating VS badge. Campaign images
 * are embedded into each half's lower corner (no cards, no large radius).
 * Playfair Display + palette scoped to this file — no global changes.
 * ════════════════════════════════════════════════════════════════════════ */

const SERIF = '"Inter", system-ui, sans-serif';
const EASE = [0.16, 1, 0.3, 1] as const;
const ACCENT = "#B88445";

type HalfData = {
  kicker: string;
  title: string;
  subtitle: string;
  points: string[];
  footer: string;
  image: string;
  alt: string;
};

const LEFT: HalfData = {
  kicker: "Traditional",
  title: "Borrowed Protection",
  subtitle: "Built to cover. Not built to protect.",
  points: [
    "Slips while moving",
    "Constant repositioning",
    "Gaps around ears & neck",
    "Heat trapped inside",
    "Designed for coverage, not exposure",
  ],
  footer: "Everyday adjustment became everyday habit.",
  image: "/IMG_6255.webp",
  alt: "Traditional dupatta wrapped over the face — borrowed protection that slips and needs constant adjustment",
};

const RIGHT: HalfData = {
  kicker: "Soliva",
  title: "Protection System™",
  subtitle: "Thoughtfully designed for everyday exposure.",
  points: [
    "Full face, neck & back coverage",
    "Designed for movement",
    "Breathable long-wear comfort",
    "Stays structured all day",
    "Built for everyday exposure",
  ],
  footer: "Protection should quietly work in the background.",
  image: "/IMG_3739.webp",
  alt: "Soliva Protection System designed for everyday movement and exposure",
};

/* ── The everyday adjustment cycle — illustration strip (sliced from source) ── */
const STEPS = [
  { img: "/adjust-1.webp", label: "Pull it back." },
  { img: "/adjust-2.webp", label: "Fix it again." },
  { img: "/adjust-3.webp", label: "Cover again." },
  { img: "/adjust-4.webp", label: "Move again." },
  { img: "/adjust-5.webp", label: "Repeat." },
];

/* ── Thin editorial marks ── */
function Check({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
      aria-hidden="true"
    >
      <path
        d="M5 12.5l4 4L19 6.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Cross({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
      aria-hidden="true"
    >
      <path d="M7 7l10 10M17 7L7 17" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/* ── One half of the poster ── */
function Half({ data, side }: { data: HalfData; side: "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  const isSoliva = side === "right";
  const bg = isSoliva ? "#F6EFE4" : "#E9E9EC";
  const kickerColor = isSoliva ? ACCENT : "rgba(45,36,30,0.42)";
  const titleColor = isSoliva ? "#2D241E" : "rgba(45,36,30,0.78)";
  const subColor = isSoliva ? ACCENT : "rgba(45,36,30,0.5)";
  const line = isSoliva ? "rgba(45,36,30,0.12)" : "rgba(45,36,30,0.1)";
  const textColor = isSoliva ? "#2D241E" : "rgba(45,36,30,0.6)";
  const markColor = isSoliva ? ACCENT : "rgba(45,36,30,0.45)";

  const Features = (
    <ul
      className={`order-1 flex flex-col justify-center px-4 py-3 lg:px-8 lg:py-4 ${
        isSoliva ? "md:order-1" : "md:order-2"
      }`}
    >
      {data.points.map((p, i) => (
        <motion.li
          key={p}
          initial={{ opacity: 0, x: isSoliva ? 12 : -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 + i * 0.05 }}
          className="flex items-center gap-3 border-b py-2.5 last:border-b-0 sm:py-3 lg:py-3.5"
          style={{ borderColor: line }}
        >
          <span
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full sm:h-[26px] sm:w-[26px]"
            style={{ backgroundColor: isSoliva ? "rgba(184,132,69,0.12)" : "rgba(45,36,30,0.05)" }}
          >
            {isSoliva ? <Check color={markColor} /> : <Cross color={markColor} />}
          </span>
          <span
            className="text-[0.85rem] leading-snug sm:text-[0.95rem] lg:text-[1rem]"
            style={{ color: textColor, fontWeight: isSoliva ? 500 : 400 }}
          >
            {p}
          </span>
        </motion.li>
      ))}
    </ul>
  );

  const Image = (
    <div
      className={`relative order-2 h-[220px] self-end overflow-hidden sm:h-[280px] lg:h-[340px] ${
        isSoliva ? "md:order-2" : "md:order-1"
      }`}
    >
      <motion.img
        src={data.image}
        alt={data.alt}
        loading="lazy"
        style={{
          y: reduce ? 0 : imgY,
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 13%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 13%)",
        }}
        className="absolute inset-x-0 bottom-0 h-[110%] w-full scale-[1.02] object-cover object-top"
      />
      {/* warm/cool wash so the image melts into the half */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${bg} 0%, transparent 20%, transparent 92%, ${bg} 100%)`,
        }}
      />
    </div>
  );

  return (
    <div ref={ref} className="relative flex flex-col" style={{ backgroundColor: bg }}>
      {/* Heading block */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="flex flex-col items-center text-center px-4 pt-5 lg:px-6 lg:pt-6"
      >
        <span
          className="mb-1 block text-[0.55rem] font-semibold uppercase tracking-[0.42em]"
          style={{ color: kickerColor }}
        >
          {data.kicker}
        </span>
        <h3
          className="text-[1.2rem] uppercase leading-[1.04] tracking-tight sm:text-[1.4rem] lg:text-[1.6rem]"
          style={{ fontFamily: SERIF, color: titleColor }}
        >
          {data.title.replace(/™$/, "")}
        </h3>
        <p
          className="mt-1 text-[0.8rem] italic sm:text-[0.9rem] lg:text-[0.95rem]"
          style={{ fontFamily: SERIF, color: subColor }}
        >
          {data.subtitle}
        </p>
      </motion.div>

      {/* Image + features composition */}
      <div className="mt-2 grid flex-1 grid-cols-1 items-stretch md:mt-3 md:grid-cols-2">
        {Features}
        {Image}
      </div>

      {/* Footer strip */}
      <div
        className="border-t px-4 py-2 lg:px-6 lg:py-2.5 text-center"
        style={{ borderColor: line }}
      >
        <p
          className="text-[0.8rem] italic sm:text-[0.9rem]"
          style={{ fontFamily: SERIF, color: subColor }}
        >
          {data.footer}
        </p>
      </div>
    </div>
  );
}

export function CompareSection() {
  const reduce = useReducedMotion();

  return (
    <section
      aria-labelledby="compare-heading"
      className="m-compare relative z-10 flex w-full flex-col items-center px-4 pt-20 pb-8 sm:px-8 sm:pt-24 sm:pb-10 md:pt-28 md:pb-12"
      style={{ backgroundColor: "#F7F3EC", color: "#2D241E" }}
    >
      <div className="relative mx-auto w-full max-w-[80rem]">
        {/* ── HEADER ── */}
        <motion.header
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mx-auto mb-4 max-w-2xl text-center md:mb-5"
        >
          <h2
            id="compare-heading"
            className="text-[1.4rem] leading-[1.04] sm:text-2xl md:text-[1.75rem]"
            style={{ fontFamily: SERIF, color: "#2D241E" }}
          >
            Still adjusting{" "}
            <span className="italic" style={{ color: ACCENT }}>
              everyday?
            </span>
          </h2>
        </motion.header>

        {/* ── EDITORIAL SPREAD: CANVAS + PROOF ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="flex flex-col w-full"
        >
          {/* Comparison Split Screen */}
          <div
            className="relative grid grid-cols-1 overflow-hidden rounded-[16px] md:grid-cols-2"
            style={{
              boxShadow: "0 30px 60px -30px rgba(45,36,30,0.35)",
              border: "1px solid rgba(45,36,30,0.08)",
            }}
          >
            <Half data={LEFT} side="left" />
            <Half data={RIGHT} side="right" />

            {/* centre vertical divider (desktop) */}
            <div
              style={{ backgroundColor: "rgba(45,36,30,0.14)" }}
              className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 md:block"
            />

            {/* floating VS badge */}
            <div
              className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
              aria-hidden="true"
            >
              <motion.div
                animate={reduce ? undefined : { y: [0, -4, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full sm:h-[2.75rem] sm:w-[2.75rem] lg:h-[3rem] lg:w-[3rem]"
                style={{
                  backgroundColor: "#FBF8F4",
                  boxShadow:
                    "0 16px 32px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.85)",
                  border: "1px solid rgba(45,36,30,0.12)",
                }}
              >
                <span
                  className="text-[0.8rem] italic sm:text-[0.9rem] lg:text-[1rem]"
                  style={{ fontFamily: SERIF, color: "#2D241E" }}
                >
                  vs
                </span>
              </motion.div>
            </div>
          </div>

          {/* ════ THE ADJUSTMENT CYCLE — unified directly below ════ */}
          <div className="mt-4 w-full md:mt-5 flex flex-col">
            <div className="flex items-center gap-3 px-2 md:px-4 mb-2">
              <span
                className="h-px w-6 sm:w-10"
                style={{ backgroundColor: "rgba(45,36,30,0.15)" }}
              />
              <p
                className="text-[0.65rem] uppercase tracking-[0.24em] font-semibold"
                style={{ fontFamily: SERIF, color: "rgba(45,36,30,0.45)" }}
              >
                The Everyday Adjustment Cycle
              </p>
              <span className="h-px flex-1" style={{ backgroundColor: "rgba(45,36,30,0.06)" }} />
            </div>

            <ul className="mx-auto flex w-full max-w-[64rem] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:grid md:grid-cols-5 md:overflow-visible [&::-webkit-scrollbar]:hidden">
              {STEPS.map((s, i) => (
                <motion.li
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.2 + i * 0.08 }}
                  className="flex w-[38%] shrink-0 snap-center flex-col items-center px-2 first:border-l-0 sm:w-[28%] sm:px-3 md:w-auto md:border-l"
                  style={{ borderColor: "rgba(45,36,30,0.10)" }}
                >
                  <div className="flex h-14 w-full items-end justify-center sm:h-16 md:h-20">
                    <img
                      src={s.img}
                      alt={`Adjusting traditional protection: ${s.label}`}
                      loading="lazy"
                      className="h-full w-auto max-w-full object-contain"
                    />
                  </div>
                  <span
                    className="mt-1.5 text-center text-[0.7rem] italic sm:text-[0.8rem]"
                    style={{ fontFamily: SERIF, color: "rgba(45,36,30,0.78)" }}
                  >
                    {s.label}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
