import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Sun, Wind, Bike } from "lucide-react";
import { viewportOnce, ease } from "@/design-system";

// Mobile-only trust chips shown near the banner (md:hidden on desktop).
const heroChips = [
  { icon: Sun, label: "UV Protection" },
  { icon: Wind, label: "Breathable Comfort" },
  { icon: Bike, label: "Daily Commute Ready" },
];

const stripItems = [
  "Lightweight",
  "Certified UV Protection",
  "Full Coverage",
  "Thoughtful Protection",
  "Built for Indian Conditions",
  "Breathable",
  "More Freedom",
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.039zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
    </svg>
  );
}

export function Hero({ isRevealed = false }: { isRevealed?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const scrollOpacity = useTransform(scrollYProgress, [0.8, 1], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="m-hero relative flex min-h-svh md:h-screen w-full flex-col overflow-hidden bg-[#FAF7F3] pt-[68px]"
    >
      <motion.div
        style={{ opacity: scrollOpacity }}
        className="flex min-h-0 flex-1 flex-col justify-center md:justify-start"
      >
        {/* ── Full-bleed cinematic banner (sits right below the navbar) ── */}
        <div className="m-hero-banner relative min-h-0 w-full md:flex-1 overflow-hidden">
          {/* ════ MOBILE HERO (mobile only): video → information → chips → CTA ════ */}

          {/* 1 · Hero video — the dominant element */}
          <motion.video
            key="hero-video"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: ease.luxe }}
            className="m-hero-video md:hidden block w-full"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/homepage-banner-mobile.webp"
          >
            <source src="/soliva-hero.mp4" type="video/mp4" />
          </motion.video>

          {/* 2 · Information — micro-headline below the video */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: ease.luxe }}
            className="md:hidden flex items-center justify-center gap-2.5 px-5"
          >
            <span className="h-px w-6 bg-[#3a2a22]/20" />
            <span className="whitespace-nowrap font-mono text-[0.6rem] font-bold uppercase tracking-[0.26em] text-[#c76600]">
              Premium Everyday Protection
            </span>
            <span className="h-px w-6 bg-[#3a2a22]/20" />
          </motion.div>

          {/* 3 · Trust chips */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22, ease: ease.luxe }}
            className="md:hidden flex flex-wrap items-center justify-center gap-2 px-5"
          >
            {heroChips.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#3a2a22]/10 bg-white/70 px-3 py-1.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-[#3a2a22]/75"
              >
                <Icon className="h-3 w-3 text-[#c76600]" />
                {label}
              </span>
            ))}
          </motion.div>

          {/* 4 · WhatsApp CTA */}
          <motion.a
            href="https://chat.whatsapp.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join Soliva Community"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32, ease: ease.luxe }}
            className="md:hidden inline-flex items-center gap-2.5 rounded-full bg-[#25D366] px-5 py-2.5 text-white shadow-[0_8px_20px_-8px_rgba(37,211,102,0.75)] active:scale-[0.97]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="font-mono text-[0.7rem] font-bold tracking-[0.01em]">
              Join Soliva Community
            </span>
          </motion.a>

          {/* ════ DESKTOP HERO (desktop only): the landscape banner ════ */}
          <img
            src="/hero-poster.webp"
            alt="Soliva — Thoughtful protection for everyday life"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            className="hidden md:block w-full object-cover object-center md:h-full transition-transform duration-[3000ms] md:hover:scale-[1.03]"
          />

          {/* Soft cinematic scrims (desktop) */}
          <div className="hidden md:block pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-luxury-beige/5 via-transparent to-luxury-beige/15" />

          {/* Top-right — WhatsApp logo + animated join message (desktop only) */}
          <div className="hidden md:block absolute right-5 top-5 z-30 md:right-7 md:top-7">
            <a
              href="https://chat.whatsapp.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join Soliva Community"
              className="group flex items-center gap-2"
            >
              {/* Animated hint message — gently nudges toward the logo */}
              <motion.span
                animate={{ x: [0, -3, 0], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="rounded-full bg-white/90 px-3 py-1.5 font-mono text-[0.6rem] font-bold tracking-[0.01em] text-[#128C7E] shadow-[0_6px_18px_-8px_rgba(0,0,0,0.35)] backdrop-blur transition-transform duration-200 group-hover:scale-105 md:text-[0.65rem]"
              >
                Join Soliva Community
              </motion.span>

              {/* WhatsApp logo only — brand green, with a pulsing ripple */}
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_8px_20px_-6px_rgba(37,211,102,0.9)] transition-transform duration-200 group-hover:scale-110">
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-[#25D366]"
                  animate={{ opacity: [0.5, 0], scale: [1, 1.9] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
                <WhatsAppIcon className="relative h-6 w-6" />
              </span>
            </a>
          </div>
        </div>

        {/* ── Marquee strip — desktop only (the mobile hero ends at the chips) ── */}
        <div className="hidden md:block w-full shrink-0 border-t border-[#3a2a22]/10 bg-[#3a2a22] py-1.5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex items-center justify-center whitespace-nowrap">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="flex items-center gap-3 pr-3"
            >
              {[...stripItems, ...stripItems].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold tracking-[0.04em] text-[#e3c187]">{t}</span>
                  <span className="text-xs text-[#e3c187]/40">*</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
