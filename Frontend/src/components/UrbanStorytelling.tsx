import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { motion } from "framer-motion";
import { ease, useIsMobile } from "@/design-system";
import { useHorizontalStory } from "@/hooks/useHorizontalStory";

const exposureCards = [
  {
    id: 1,
    category: "UV Exposure",
    headline: "Silent exposure.",
    desc: "Harmful UV exposure continues during everyday movement — even during short commutes.",
    micro: "Coverage doesn’t always mean protection.",
    image: "/sun.webp",
  },
  {
    id: 2,
    category: "Dust & Pollution",
    headline: "Everyday atmosphere.",
    desc: "Dust, pollution, and environmental particles become part of everyday movement.",
    micro: "What you breathe is only part of the exposure.",
    image: "/dust.webp",
  },
  {
    id: 3,
    category: "Trapped Heat",
    headline: "Trapped heat.",
    desc: "Heavy coverings and poor airflow can make long outdoor hours uncomfortable.",
    micro: "Protection shouldn’t feel exhausting.",
    image: "/trapped-heat-new.png",
  },
  {
    id: 4,
    category: "Constant Adjustment",
    headline: "Protection that moves away.",
    desc: "Loose coverings shift with movement, creating exposed areas during commuting.",
    micro: "Adjustment isn’t protection.",
    image: "/constant-slipping.webp",
  },
  {
    id: 5,
    category: "Hidden Exposure Zones",
    headline: "Areas often left exposed.",
    desc: "Neck, ears, side profile, and movement zones frequently remain uncovered.",
    micro: "Small gaps create everyday exposure.",
    image: "/product_images/hidden-exposure-new.png",
  },
];

const PANEL_COUNT = 2;

export function UrbanStorytelling() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [active, setActive] = useState(0);

  const handleChange = useCallback((index: number) => setActive(index), []);

  // Mouse-tracked 3D tilt for the exposure cards (drives the existing
  // --rx/--ry/--gx/--gy CSS vars on .u-card — previously unwired).
  const tiltCard = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(px - 0.5) * 13}deg`);
    el.style.setProperty("--rx", `${(0.5 - py) * 13}deg`);
    el.style.setProperty("--gx", `${px * 100}%`);
    el.style.setProperty("--gy", `${py * 100}%`);
  }, []);

  const untiltCard = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--gx", "50%");
    el.style.setProperty("--gy", "50%");
  }, []);

  // Locked chapters: the section freezes and each scroll advances exactly ONE
  // panel (no continuous pan, no skipping to the last page). Manual, deliberate.
  useHorizontalStory({
    sectionRef,
    trackRef: containerRef,
    slideCount: PANEL_COUNT,
    enabled: !isMobile,
    onChange: handleChange,
    mode: "lock",
  });

  // Active-slide focus: the current panel is fully lit; neighbours sit back
  // dimmed. Opacity-only — animating `filter: blur()` on full-screen panels
  // during the scroll-driven pan was the heaviest repaint cost and is removed.
  useEffect(() => {
    if (isMobile) return;
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".u-panel", section);
      panels.forEach((panel, i) => {
        gsap.to(panel, {
          opacity: i === active ? 1 : 0.4,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
      const current = panels[active];
      if (current) {
        const reveals = current.querySelectorAll<HTMLElement>(".u-reveal");
        if (reveals.length) {
          gsap.fromTo(
            reveals,
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.06,
              ease: "power3.out",
              overwrite: "auto",
            },
          );
        }
      }
    }, section);
    return () => ctx.revert();
  }, [active, isMobile]);

  return (
    <>
      <section
        ref={sectionRef}
        id="urban-storytelling"
        className="m-urban relative bg-[#3a2a22] w-full z-10 overflow-hidden min-h-screen md:h-screen"
      >
        <div
          ref={containerRef}
          className="flex flex-col md:flex-row md:flex-nowrap md:w-[200%] md:h-full items-start z-10 relative"
        >
          {/* ═══ PANEL 1 — HERO IDENTITY + PROBLEM STORY ═══ */}
          <div className="u-panel relative flex flex-col w-full md:h-full md:w-1/2 justify-start px-6 md:px-10 lg:px-16 pt-[84px] md:pt-[92px] pb-8 md:pb-6 flex-shrink-0 overflow-hidden bg-[#F5F5DC]">
            <div className="u-hero-stack max-w-[1280px] mx-auto w-full flex flex-col items-center relative z-10">
              {/* ── Heading ── */}
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, delay: 0.1, ease: ease.smooth }}
                className="font-display text-[#3a2a22] leading-[1.1] tracking-tight text-center whitespace-normal md:whitespace-nowrap"
                style={{ fontSize: "clamp(1.3rem, 2.9vw, 2.4rem)" }}
              >
                Everyday exposure doesn’t feel harmful.{" "}
                <span className="italic font-bold text-[#8a5e3c]">Until it becomes everyday.</span>
              </motion.h2>

              {/* ── Subtext ── */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.0, delay: 0.2, ease: ease.smooth }}
                className="mt-3 md:mt-4 text-[#3a2a22] font-light leading-relaxed text-center whitespace-normal md:whitespace-nowrap"
                style={{ fontSize: "clamp(0.85rem, 1.85vw, 1.05rem)" }}
              >
                Daily commuting quietly exposes people to environmental stress —{" "}
                <span className="italic font-bold text-[#8a5e3c]">
                  often while feeling “covered.”
                </span>
              </motion.p>

              {/* ── Refined editorial divider ── */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0.6 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: 0.3, ease: ease.smooth }}
                className="mt-5 mb-5 md:mt-6 md:mb-6 h-px w-20 bg-gradient-to-r from-transparent via-white/25 to-transparent origin-center"
              />

              {/* ── 5 PROBLEM CARDS ── */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.05 }}
                variants={{
                  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.15 } },
                }}
                className="m-exposure-row grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-3.5 w-full max-w-[1240px] mx-auto px-2"
              >
                {exposureCards.map((card, i) => (
                  <motion.article
                    key={card.id}
                    onMouseMove={tiltCard}
                    onMouseLeave={untiltCard}
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 },
                    }}
                    transition={{ duration: 1.05, ease: ease.smooth }}
                    className={`u-card group relative bg-[#3a2a22] border border-[#c08b4f]/15 p-4 md:p-5 rounded-[1rem] text-center shadow-[0_8px_28px_rgba(58,42,34,0.18)] hover:bg-[#473228] hover:shadow-[0_26px_55px_rgba(58,42,34,0.28)] hover:border-[#c08b4f]/35 ${
                      i === 4
                        ? "sm:col-span-2 sm:max-w-[calc(50%-0.4375rem)] sm:mx-auto sm:w-full lg:col-span-1 lg:max-w-none"
                        : ""
                    }`}
                  >
                    {/* Mouse-tracked sheen */}
                    <span className="u-card-sheen absolute inset-0 rounded-[1rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    {/* Top hairline */}
                    <span className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-[#c08b4f]/55 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="aspect-[4/5] rounded-[0.75rem] overflow-hidden mb-2.5 border border-[#3a2a22]/6 bg-[#3a2a22]/5 relative">
                      <img
                        src={card.image}
                        alt={card.category}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover grayscale-[0.25] brightness-[0.92] transition-transform duration-[2400ms] ease-out group-hover:scale-[1.06] group-hover:grayscale-0 group-hover:brightness-100"
                      />
                      {/* warm cinematic overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#3a2a22]/40 via-transparent to-transparent pointer-events-none opacity-70 group-hover:opacity-40 transition-opacity duration-700" />
                    </div>

                    <span className="font-mono text-[10px] md:text-[11px] tracking-[0.24em] text-[#c08b4f] font-semibold block mb-1.5">
                      {card.category}
                    </span>
                    <h3 className="font-display text-[1.125rem] md:text-[1.3rem] text-[#FAF7F3] tracking-tight leading-[1.15] mb-2">
                      {card.headline}
                    </h3>
                    <p className="text-[12.5px] md:text-[13.5px] text-white/65 font-light leading-relaxed mb-3">
                      {card.desc}
                    </p>
                    <div className="border-t border-white/15 pt-2.5">
                      <span className="font-mono text-[10px] md:text-[10.5px] tracking-[0.16em] text-[#c76600] font-semibold italic block leading-snug">
                        {card.micro}
                      </span>
                    </div>
                  </motion.article>
                ))}
              </motion.div>

              {/* ── Closing editorial line ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, delay: 0.4, ease: ease.smooth }}
                className="mt-6 md:mt-8 flex items-center gap-4 justify-center px-4 text-center"
              >
                <span className="hidden sm:block h-px w-10 bg-[#c08b4f]/40" />
                <span className="font-mono text-[10px] md:text-[10.5px] tracking-[0.26em] text-[#d9b27a] font-black italic leading-[1.7]">
                  Everyday habits were never engineered for everyday exposure.
                </span>
                <span className="hidden sm:block h-px w-10 bg-[#c08b4f]/40" />
              </motion.div>
            </div>
          </div>

          {/* ═══ PANEL 2: SECTION 7 — REAL WORLD UTILITY ═══ */}
          <div className="u-panel relative flex flex-col w-full md:h-full md:w-1/2 justify-center md:justify-start px-8 md:px-12 lg:px-24 md:pt-[110px] md:pb-8 overflow-hidden flex-shrink-0 bg-[#ffd9b5]">
            {/* Gradient divider — static */}
            <div
              aria-hidden
              className="hidden md:block absolute left-0 top-[12%] bottom-[12%] w-px bg-gradient-to-b from-transparent via-[#c08b4f]/55 to-transparent pointer-events-none z-30"
            />
            <div className="max-w-[1400px] mx-auto w-full relative z-10">
              {/* ── Header — single line ── */}
              <div className="u-reveal u-p4-reveal text-center mb-6">
                <h2
                  className="font-display text-[#3a2a22] leading-[1.05] tracking-tight"
                  style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.8rem)" }}
                >
                  More than a product.{" "}
                  <span className="italic font-light text-[#c76600]">
                    A different approach to protection.
                  </span>
                </h2>
                <p className="mt-3 text-[1rem] md:text-[1.2rem] text-[#3a2a22]/75 font-light italic leading-relaxed whitespace-nowrap mx-auto">
                  Soliva was created from a simple belief: protection should feel natural, not
                  burdensome.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-14 items-center">
                <div className="flex flex-col gap-8">
                  <div className="u-reveal u-p4-reveal max-w-4xl text-left">
                    <ul className="space-y-4 text-[1.1rem] md:text-[1.3rem] text-[#3a2a22]/80 font-light leading-relaxed max-w-xl">
                      <li className="flex gap-3">
                        <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c76600]" />
                        <span>Everyday life already asks enough from people.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c76600]" />
                        <span>Protection should simplify movement, not complicate it.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c76600]" />
                        <span>
                          Good design disappears into the routine while continuing to do its job.
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c76600]" />
                        <span>
                          Because comfort, confidence, and coverage should never compete with one
                          another.
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-[#3a2a22]/15 pt-8">
                    {[
                      {
                        title: "Human-Centered",
                        desc: "Designed around people, not assumptions.",
                      },
                      {
                        title: "Everyday Ready",
                        desc: "Built for routines that happen every day.",
                      },
                      {
                        title: "Thoughtfully Protective",
                        desc: "Protection that works quietly in the background.",
                      },
                    ].map((block, i) => (
                      <div key={i} className="u-reveal u-p4-reveal group flex flex-col text-left">
                        <div className="flex items-center gap-2.5 mb-3 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                          <span className="block h-px w-6 bg-[#c76600]/40 group-hover:w-10 group-hover:bg-[#c76600]/70 transition-all duration-500" />
                        </div>
                        <h3 className="font-display text-xl md:text-2xl text-[#3a2a22] mb-2 group-hover:text-[#c76600] transition-colors duration-500">
                          {block.title}
                        </h3>
                        <p className="text-[14px] md:text-[15px] text-[#3a2a22]/65 font-light leading-relaxed">
                          {block.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Closing line */}
                  <div className="u-reveal u-p4-reveal border-t border-[#3a2a22]/15 pt-8">
                    <p className="text-[1.1rem] md:text-[1.25rem] text-[#3a2a22]/90 font-light italic leading-relaxed whitespace-nowrap">
                      The future of protection isn't more coverage.{" "}
                      <span className="text-[#c76600] font-medium">It's more thoughtfulness.</span>
                    </p>
                  </div>
                </div>

                {/* Cinematic commuting image — softly integrated into the section */}
                <div className="u-reveal u-p4-reveal relative w-full">
                  {/* Warm atmospheric wash behind */}
                  <div className="absolute -inset-12 bg-[radial-gradient(ellipse_at_55%_45%,rgba(220,150,70,0.25),transparent_72%)] pointer-events-none" />

                  <div
                    className="u-p4-image-wrap relative aspect-[4/5] max-h-[54vh] max-w-[440px] w-full mx-auto overflow-hidden"
                    style={{
                      transform: "translateZ(0)", // cache mask+image into one layer
                      WebkitMaskImage:
                        "radial-gradient(ellipse 95% 95% at 50% 48%, black 55%, rgba(0,0,0,0.55) 78%, transparent 100%)",
                      maskImage:
                        "radial-gradient(ellipse 95% 95% at 50% 48%, black 55%, rgba(0,0,0,0.55) 78%, transparent 100%)",
                    }}
                  >
                    <img
                      src="/everyday-protection-new.webp"
                      alt="Two friends in Soliva everyday protection — comfortable, effortless wear"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="u-p4-img absolute inset-0 w-full h-full object-cover select-none will-change-transform"
                      style={{
                        objectPosition: "50% 28%",
                        filter: "saturate(0.9) contrast(1.04) brightness(0.95) sepia(0.05)",
                      }}
                    />
                    {/* Warm sunlight glow — upper-right */}
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_75%_15%,rgba(245,200,130,0.2),transparent_55%)]" />
                    {/* Cinematic tonal wash */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-[#3a2a22]/45 via-transparent to-[#c08b4f]/12" />
                    {/* Bottom shadow fade into section */}
                    <div className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none bg-gradient-to-t from-[#3a2a22] via-[#3a2a22]/55 to-transparent" />
                    {/* Top soft fade */}
                    <div className="absolute inset-x-0 top-0 h-1/4 pointer-events-none bg-gradient-to-b from-[#3a2a22]/50 to-transparent" />
                    {/* Whisper warm vignette */}
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(58,42,34,0.55)_100%)]" />

                    {/* Tiny Soliva watermark — restrained editorial detail */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 opacity-50">
                      <span className="block h-px w-5 bg-[#d9b27a]/60" />
                      <span className="font-mono text-[8.5px] tracking-[0.42em] uppercase text-[#f3dbab]/80">
                        Soliva
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
