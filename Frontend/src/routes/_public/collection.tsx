import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { viewportOnce, ease } from "@/design-system";
import { FutureCollections } from "@/components/FutureCollections";
import { useCart } from "@/features/cart/hooks/useCart";
import { useCheckoutStore } from "@/features/checkout/store";
import {
  Check,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Sun,
  Wind,
  ScanFace,
  ThermometerSun,
  RotateCcw,
} from "lucide-react";
import { z } from "zod";

const collectionSearchSchema = z.object({
  edition: z.string().optional(),
});

export const Route = createFileRoute("/_public/collection")({
  validateSearch: (search) => collectionSearchSchema.parse(search),
  component: CollectionRoute,
  head: () => ({
    meta: [
      { title: "SunWrap by Soliva — Women's Collection" },
      {
        name: "description",
        content:
          "Full face, neck & back coverage designed for everyday movement. Available in 5 editions.",
      },
    ],
  }),
});

/* ── One product · five editions · four gallery views each.
   Exact edition naming kept consistent site-wide. ── */
const editions = [
  {
    id: "blush-pink",
    name: "Blush Pink",
    swatch: "#E4B7C6",
    images: [
      { view: "Front View", src: "/product_images/pink-1.webp" },
      { view: "Side View", src: "/product_images/pink-3.webp" },
      { view: "Back View", src: "/product_images/pink-2.webp" },
      { view: "Lifestyle View", src: "/product_images/pink-4.webp" },
    ],
  },
  {
    id: "green-edition",
    name: "Olive Green",
    swatch: "#6A7038",
    images: [
      { view: "Front View", src: "/product_images/olive-1.webp" },
      { view: "Side View", src: "/product_images/olive-3.webp" },
      { view: "Back View", src: "/product_images/olive-2.webp" },
      { view: "Lifestyle View", src: "/product_images/olive-4.webp" },
    ],
  },
  {
    id: "deep-blue",
    name: "Deep Blue",
    swatch: "#33508A",
    images: [
      { view: "Front View", src: "/product_images/blue-1.webp" },
      { view: "Side View", src: "/product_images/blue-3.webp" },
      { view: "Back View", src: "/product_images/blue-2.webp" },
      { view: "Lifestyle View", src: "/product_images/blue-4.webp" },
    ],
  },
  {
    id: "classic-beige",
    name: "Classic Beige",
    swatch: "#D8C3A0",
    images: [
      { view: "Front View", src: "/product_images/beige-1.webp" },
      { view: "Side View", src: "/product_images/beige-3.webp" },
      { view: "Back View", src: "/product_images/beige-2.webp" },
      { view: "Lifestyle View", src: "/product_images/beige-4.webp" },
    ],
  },
  {
    id: "zesty-lime",
    name: "Zesty Lime",
    swatch: "#AEC96B",
    images: [
      { view: "Front View", src: "/product_images/lime-1.webp" },
      { view: "Side View", src: "/product_images/lime-3.webp" },
      { view: "Back View", src: "/product_images/lime-2.webp" },
      { view: "Lifestyle View", src: "/product_images/lime-4.webp" },
    ],
    isUnavailable: true,
  },
] as const;

const lifestyleTags = [
  { emoji: "🛵", label: "Daily Commutes" },
  { emoji: "🎓", label: "College Travel" },
  { emoji: "💼", label: "Work Movement" },
  { emoji: "☀️", label: "Outdoor Hours" },
  { emoji: "✈️", label: "Weekend Journeys" },
];

/* Collection preview cards — placeholder content (client replaces text). */
const collections = [
  {
    no: "01",
    title: "Women",
    intro: "Protection designed around everyday movement.",
    bullets: ["Daily commutes", "College travel", "Work movement", "Outdoor hours"],
    paragraph: "Thoughtfully engineered coverage for the rhythms of modern everyday life.",
    tagline: "Everyday Essentials",
    bg: "from-[#FBEFF1] to-[#F6E1E7]", // soft blush pink
    comingSoon: false, // Women is live
  },
  {
    no: "02",
    title: "Kids",
    intro: "Protection made for little explorers.",
    bullets: ["School rides", "Outdoor play", "Family outings", "Everyday adventures"],
    paragraph: "Comfort-first coverage built around active, growing routines.",
    tagline: "For Little Explorers",
    bg: "from-[#EEF6EF] to-[#DCEDE0]", // soft mint green
    comingSoon: true,
  },
  {
    no: "03",
    title: "Men",
    intro: "Protection designed for everyday movement.",
    bullets: ["Daily commutes", "Work travel", "Outdoor hours", "Everyday exposure"],
    paragraph: "Built around real-world routines where comfort and coverage matter most.",
    tagline: "Built for Movement",
    bg: "from-[#EEF3FA] to-[#DBE7F3]", // soft powder blue
    comingSoon: true,
  },
  {
    no: "04",
    title: "Gifting",
    intro: "Thoughtful protection, ready to gift.",
    bullets: ["Travel gifting", "Family gifting", "Everyday essentials", "Seasonal gifting"],
    paragraph: "Curated protection kits designed for the people you care about.",
    tagline: "Ready to Gift",
    bg: "from-[#FAF4EA] to-[#F0E5D2]", // soft cream beige
    comingSoon: true,
  },
];

/* Editorial "Built for Movement" insight cards (copied from homepage insight). */

const eyebrow = "font-mono text-[0.625rem] tracking-[0.4em] uppercase text-[#c76600] font-bold";

/* Directional slide for the main gallery image (smooth horizontal slider). */
const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? "-100%" : "100%", opacity: 0 }),
};

function CollectionRoute() {
  const { edition: editionParam } = Route.useSearch();
  const [editionIndex, setEditionIndex] = useState(() => {
    if (editionParam) {
      const idx = editions.findIndex((e) => e.id === editionParam);
      return idx !== -1 ? idx : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (editionParam) {
      const idx = editions.findIndex((e) => e.id === editionParam);
      if (idx !== -1) setEditionIndex(idx);
    }
  }, [editionParam]);

  const [viewIndex, setViewIndex] = useState(0);
  const [direction, setDirection] = useState(0); // slide direction: 1 = next, -1 = prev
  const [added, setAdded] = useState(false);
  const cart = useCart();
  const navigate = useNavigate();
  const setCheckoutItems = useCheckoutStore((s) => s.setItems);

  const edition = editions[editionIndex];
  const image = edition.images[viewIndex];
  const VIEW_COUNT = edition.images.length;

  // Switching colour resets the gallery to the Front View of that edition.
  const selectEdition = (i: number) => {
    setDirection(0);
    setEditionIndex(i);
    setViewIndex(0);
  };
  const nextView = () => {
    setDirection(1);
    setViewIndex((v) => (v + 1) % VIEW_COUNT);
  };
  const prevView = () => {
    setDirection(-1);
    setViewIndex((v) => (v - 1 + VIEW_COUNT) % VIEW_COUNT);
  };
  // Jump straight to a view (thumbnails) — slide toward the target.
  const goToView = (i: number) => {
    setDirection(i >= viewIndex ? 1 : -1);
    setViewIndex(i);
  };

  const reduce = useReducedMotion();

  const addToCart = () => {
    cart.add({
      productId: "soliva-sunwrap",
      slug: "soliva-sunwrap",
      name: `SunWrap by Soliva — ${edition.name}`,
      image: edition.images[0].src,
      priceCents: 79900,
      currency: "INR",
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Buy Now → stage this edition as the checkout line, then jump to the
  // checkout page (address/details) which in turn opens Razorpay.
  const buyNow = () => {
    setCheckoutItems([
      {
        productId: "soliva-sunwrap",
        name: `SunWrap by Soliva — ${edition.name}`,
        image: edition.images[0].src,
        price: 799,
        quantity: 1,
      },
    ]);
    navigate({ to: "/checkout" });
  };

  return (
    <div className="relative w-full bg-[#FAF7F3] text-[#3a2a22] pb-24 lg:pb-0">
      {/* ════════ SECTION 1 — PRODUCT HERO ════════ */}
      <section className="relative pt-20 md:pt-28 pb-14 md:pb-16 lg:min-h-screen lg:flex lg:items-center lg:pt-28 lg:pb-16">
        <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
          {/* ── MOBILE headline (mobile only) — small, sits above the product image.
               Hidden ≥768px; the desktop eyebrow+headline live in the RIGHT column. ── */}
          <div className="md:hidden mb-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-[#c76600]/40" />
              <span className={eyebrow}>Women's Collection</span>
            </div>
            <h1
              className="font-display tracking-tight leading-[1.15] text-balance"
              style={{ fontSize: "clamp(1.4rem, 6vw, 1.75rem)" }}
            >
              Thoughtful protection for{" "}
              <span className="italic font-light text-[#c76600]">everyday movement.</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1fr] gap-6 md:gap-10 lg:gap-16 items-center">
            {/* LEFT — premium product gallery (5 editions × 4 views) */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: ease.smooth }}
              className="order-1 lg:order-none flex flex-col gap-2.5 md:gap-4 w-full max-w-[240px] mx-auto md:max-w-none lg:max-w-[420px] lg:mx-auto"
            >
              {/* Main image — floating/breathing; slide on colour/view change, swipe on touch */}
              <div className="relative aspect-[4/5] w-full">
                {/* Soft spotlight / ambient glow behind the product (tinted to the edition) */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-5 sm:-inset-7 rounded-[3rem] blur-3xl opacity-70 transition-all duration-700"
                  style={{
                    background: `radial-gradient(58% 52% at 50% 42%, ${edition.swatch}55, transparent 72%)`,
                  }}
                />
                <motion.div
                  animate={
                    reduce
                      ? undefined
                      : { y: [0, -4, 0], rotate: [-0.6, 0.6, -0.6], scale: [1, 1.012, 1] }
                  }
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="group relative h-full w-full overflow-hidden rounded-[2.25rem] border border-[#3a2a22]/5 bg-[#EDE6D8] shadow-[0_28px_60px_-30px_rgba(58,42,34,0.4)] will-change-transform"
                >
                  <AnimatePresence initial={false} custom={direction}>
                    <motion.img
                      key={`${edition.id}-${viewIndex}`}
                      src={image.src}
                      alt={`SunWrap by Soliva — ${edition.name}, ${image.view}`}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.16}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -60) nextView();
                        else if (info.offset.x > 60) prevView();
                      }}
                      transition={{
                        x: { type: "spring", stiffness: 320, damping: 34 },
                        opacity: { duration: 0.25, ease: ease.smooth },
                      }}
                      className={`absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing will-change-transform ${
                        image.src.includes("/variant-") ? "object-contain p-4" : "object-cover"
                      }`}
                    />
                  </AnimatePresence>

                  <span className="absolute top-5 left-5 z-10 font-mono text-[0.55rem] tracking-[0.24em] uppercase font-bold text-[#3a2a22]/60 bg-white/65 backdrop-blur px-2.5 py-1 rounded-full">
                    {edition.name}
                  </span>

                  {/* Desktop hover arrows */}
                  <button
                    onClick={prevView}
                    aria-label="Previous image"
                    className="hidden lg:grid absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 place-items-center rounded-full bg-white/75 backdrop-blur text-[#3a2a22] shadow-md opacity-0 group-hover:opacity-100 transition-[opacity,transform] duration-300 hover:scale-110"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={nextView}
                    aria-label="Next image"
                    className="hidden lg:grid absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 place-items-center rounded-full bg-white/75 backdrop-blur text-[#3a2a22] shadow-md opacity-0 group-hover:opacity-100 transition-[opacity,transform] duration-300 hover:scale-110"
                  >
                    <ChevronRight size={18} />
                  </button>
                </motion.div>
              </div>

              {/* Arrows + counter */}
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={prevView}
                  aria-label="Previous image"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#3a2a22]/15 text-[#3a2a22]/70 transition-[transform,color,border-color] duration-300 hover:text-[#3a2a22] hover:border-[#3a2a22]/40 hover:-translate-x-0.5"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-mono text-[0.75rem] tracking-[0.2em] text-[#3a2a22]/70 tabular-nums">
                  {viewIndex + 1} / {VIEW_COUNT}
                </span>
                <button
                  onClick={nextView}
                  aria-label="Next image"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#3a2a22]/15 text-[#3a2a22]/70 transition-[transform,color,border-color] duration-300 hover:text-[#3a2a22] hover:border-[#3a2a22]/40 hover:translate-x-0.5"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Thumbnails — switch with colour, current highlighted */}
              <div className="grid grid-cols-4 gap-3">
                {edition.images.map((img, i) => (
                  <button
                    key={img.view}
                    onClick={() => goToView(i)}
                    aria-label={img.view}
                    title={img.view}
                    className={`relative aspect-square overflow-hidden rounded-[0.9rem] border transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1 ${
                      i === viewIndex
                        ? "border-[#c76600] shadow-[0_10px_22px_-12px_rgba(199,102,0,0.55)]"
                        : "border-[#3a2a22]/10 hover:border-[#c76600]/40 hover:shadow-[0_10px_22px_-12px_rgba(199,102,0,0.4)]"
                    }`}
                    style={{
                      background: `linear-gradient(155deg, ${edition.swatch}1f, ${edition.swatch}08)`,
                    }}
                  >
                    <img
                      src={img.src}
                      alt={img.view}
                      loading="lazy"
                      className={`absolute inset-0 h-full w-full ${
                        img.src.includes("/variant-") ? "object-contain p-1.5" : "object-cover"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* RIGHT — editorial copy + lifestyle tags.
                 order-2 on mobile keeps this column BELOW the gallery (order-1);
                 md:order-none restores the original grid placement ≥768px. */}
            <div className="order-2 md:order-none flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease: ease.smooth }}
                className="hidden md:flex items-center gap-3 mb-6"
              >
                <span className="h-px w-8 bg-[#c76600]/40" />
                <span className={eyebrow}>Women's Collection</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.45, ease: ease.smooth }}
                className="hidden md:block font-display tracking-tight leading-[1.12] max-w-[16ch] text-balance"
                style={{ fontSize: "clamp(1.95rem, 3.4vw, 2.6rem)" }}
              >
                Thoughtful protection for{" "}
                <span className="italic font-light text-[#c76600]">everyday movement.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.55, ease: ease.smooth }}
                className="order-3 md:order-none mt-7 md:mt-6 font-display text-xl md:text-2xl text-[#3a2a22]"
              >
                SunWrap by Soliva
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.65, ease: ease.smooth }}
                className="order-4 md:order-none mt-3 max-w-[440px] text-[0.95rem] md:text-[1rem] text-[#7b6a5f] font-light leading-relaxed"
              >
                Full face, neck &amp; back coverage designed for everyday movement.
              </motion.p>

              {/* Lifestyle tags */}
              <div className="order-5 md:order-none mt-6 md:mt-8 flex flex-wrap gap-2.5">
                {lifestyleTags.map((t, i) => (
                  <motion.span
                    key={t.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + i * 0.1, ease: ease.smooth }}
                    whileHover={{ y: -2 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#3a2a22]/12 bg-white/50 px-3 py-1.5 font-mono text-[0.625rem] tracking-[0.1em] uppercase text-[#3a2a22]/70 font-semibold transition-all duration-300 hover:border-[#c76600]/35 hover:bg-white hover:text-[#3a2a22] hover:shadow-[0_8px_18px_-12px_rgba(58,42,34,0.4)]"
                  >
                    <span aria-hidden className="text-[0.7rem] opacity-80">{t.emoji}</span>
                    {t.label}
                  </motion.span>
                ))}
              </div>

              {/* Colour selector — Available in 5 Editions */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.25, ease: ease.smooth }}
                className="order-1 md:order-none mt-5 md:mt-8"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[0.625rem] tracking-[0.28em] uppercase text-[#3a2a22]/55 font-bold">
                    Available in 5 Editions
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={edition.name}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.25, ease: ease.smooth }}
                      className="font-mono text-[0.6875rem] tracking-[0.12em] text-[#3a2a22] font-semibold"
                    >
                      {edition.name}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="flex items-center gap-3.5">
                  {editions.map((e, i) => (
                    <button
                      key={e.id}
                      onClick={() => selectEdition(i)}
                      aria-label={e.name}
                      title={e.name}
                      className={`relative h-11 w-11 sm:h-9 sm:w-9 rounded-full shadow-[0_3px_8px_-2px_rgba(58,42,34,0.3)] transition-all duration-300 ease-out hover:scale-110 ${
                        i === editionIndex
                          ? "scale-105 ring-2 ring-offset-2 ring-offset-[#FAF7F3] ring-[#c76600] shadow-[0_8px_18px_-5px_rgba(199,102,0,0.55)]"
                          : "ring-0 ring-offset-2 ring-offset-[#FAF7F3] ring-transparent hover:shadow-[0_8px_16px_-5px_rgba(58,42,34,0.4)]"
                      }`}
                      style={{ background: e.swatch }}
                    >
                      <AnimatePresence>
                        {i === editionIndex && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.4 }}
                            transition={{ duration: 0.25, ease: ease.smooth }}
                            className="absolute inset-0 grid place-items-center"
                          >
                            <Check size={14} className="text-white/90" strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* ── Price — launch pricing · luxury presentation ── */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.32, ease: ease.smooth }}
                className="order-2 md:order-none mt-5 md:mt-8"
              >
                <span className="font-mono text-[0.625rem] tracking-[0.28em] uppercase text-[#3a2a22]/55 font-bold">
                  {edition.isUnavailable ? "Status" : "Launch Price"}
                </span>
                {edition.isUnavailable ? (
                  <div className="mt-2.5">
                    <span
                      className="font-display leading-none tracking-tight text-[#3a2a22]"
                      style={{ fontSize: "clamp(2rem, 4vw, 2.6rem)" }}
                    >
                      Currently Unavailable
                    </span>
                  </div>
                ) : (
                  <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5">
                    <span
                      className="font-display leading-none tracking-tight text-[#3a2a22]"
                      style={{ fontSize: "clamp(2.4rem, 4vw, 3rem)" }}
                    >
                      ₹799
                    </span>
                    <span className="text-[1.05rem] font-light text-[#7b6a5f]/65 line-through decoration-[#7b6a5f]/40">
                      MRP ₹999
                    </span>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.75rem] font-medium text-[#3a2a22]/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck size={14} strokeWidth={1.9} className="text-[#c76600]" />
                    Free Shipping
                  </span>
                  <span aria-hidden className="h-3 w-px bg-[#3a2a22]/15" />
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck size={14} strokeWidth={1.9} className="text-[#c76600]" />
                    GST Included
                  </span>
                  <span aria-hidden className="h-3 w-px bg-[#3a2a22]/15" />
                  <span className="inline-flex items-center gap-1.5">
                    <RotateCcw size={14} strokeWidth={1.9} className="text-[#c76600]" />
                    Easy Returns
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.4, ease: ease.smooth }}
                className="order-6 md:order-none mt-8 flex w-full max-w-[460px] items-stretch gap-3"
              >
                {/* Buy Now — primary → /checkout (details) → Razorpay */}
                <motion.button
                  disabled={edition.isUnavailable}
                  onClick={buyNow}
                  whileHover={edition.isUnavailable ? {} : { y: -3 }}
                  whileTap={edition.isUnavailable ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.3, ease: ease.smooth }}
                  className={`group inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-4 font-mono text-[0.7rem] tracking-[0.16em] uppercase font-black shadow-editorial transition-[background,box-shadow,transform] duration-300 sm:px-8 sm:tracking-[0.22em] ${
                    edition.isUnavailable
                      ? "bg-[#3a2a22]/40 text-[#f7f3ee]/60 cursor-not-allowed"
                      : "bg-gradient-to-b from-[#43312a] to-[#2e211b] text-[#f7f3ee] hover:from-[#4a3730] hover:to-[#231a15] hover:shadow-[0_22px_46px_-18px_rgba(58,42,34,0.65)]"
                  }`}
                >
                  {edition.isUnavailable ? "Out of Stock" : "Buy Now"}
                  {!edition.isUnavailable && (
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  )}
                </motion.button>

                {/* Add to Cart — secondary */}
                <motion.button
                  disabled={edition.isUnavailable}
                  onClick={addToCart}
                  whileHover={edition.isUnavailable ? {} : { y: -3 }}
                  whileTap={edition.isUnavailable ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.3, ease: ease.smooth }}
                  className={`group inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 py-4 font-mono text-[0.7rem] tracking-[0.16em] uppercase font-bold backdrop-blur transition-[background,border-color,box-shadow,transform] duration-300 sm:px-8 sm:tracking-[0.22em] ${
                    edition.isUnavailable
                      ? "border-[#3a2a22]/10 bg-white/20 text-[#3a2a22]/40 cursor-not-allowed"
                      : "border-[#3a2a22]/25 bg-white/50 text-[#3a2a22] hover:border-[#3a2a22]/45 hover:bg-white hover:shadow-[0_16px_36px_-22px_rgba(58,42,34,0.4)]"
                  }`}
                >
                  {added ? (
                    <>
                      <Check size={14} /> Added
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={14} /> Add to Cart
                    </>
                  )}
                </motion.button>
              </motion.div>

              {/* ════════ SECTION 8 — TRUST BLOCK ════════ */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.7, ease: ease.smooth }}
                className="order-7 md:order-none mt-9 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[#3a2a22]/10 pt-7"
              >
                {[
                  { icon: Sun, label: "Advanced UV Defense" },
                  { icon: Wind, label: "Breathable Fabric" },
                  { icon: ScanFace, label: "Full Face Coverage" },
                  { icon: ThermometerSun, label: "Designed For Indian Conditions" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#c76600]/10 text-[#c76600]">
                      <Icon size={15} strokeWidth={1.9} />
                    </span>
                    <span className="text-[0.8rem] font-medium leading-tight text-[#3a2a22]/80">
                      {label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FUTURE COLLECTIONS — premium product roadmap ════════ */}
      <FutureCollections />

      {/* ════════ FREEDOM — full image (object-contain, nothing cropped) ════════ */}
      <section className="relative w-full overflow-hidden bg-[#3a2a22] py-12 md:py-16">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 flex items-center justify-center">
          <img
            src="/product_images/IMG_0491.webp"
            alt="Soliva — everyday protection that moves with you"
            decoding="async"
            draggable={false}
            className="w-auto max-w-full max-h-[85vh] rounded-[1.5rem] object-contain select-none shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)]"
          />
        </div>
      </section>

      {/* ════════ SECTION 11 — STICKY MOBILE CTA ════════ */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-[#3a2a22]/10 bg-[#FAF7F3]/92 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl shadow-[0_-8px_24px_-12px_rgba(58,42,34,0.25)]">
        <div className="flex flex-col leading-none">
          {edition.isUnavailable ? (
            <span className="font-display text-lg text-[#3a2a22]">Sold Out</span>
          ) : (
            <>
              <span className="font-display text-xl text-[#3a2a22]">₹799</span>
              <span className="text-[0.65rem] text-[#7b6a5f]/70 line-through">₹999</span>
            </>
          )}
        </div>
        <button
          onClick={edition.isUnavailable ? undefined : buyNow}
          disabled={edition.isUnavailable}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 font-mono text-[0.7rem] font-black uppercase tracking-[0.18em] transition-colors ${
            edition.isUnavailable
              ? "cursor-not-allowed bg-[#3a2a22]/40 text-white/60"
              : "bg-[#3a2a22] text-[#f7f3ee] active:bg-[#2e211b]"
          }`}
        >
          {edition.isUnavailable ? (
            "Out of Stock"
          ) : (
            <>
              Buy Now <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
