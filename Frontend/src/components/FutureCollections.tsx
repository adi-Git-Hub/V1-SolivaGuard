import { motion } from "framer-motion";
import { viewportOnce, ease } from "@/design-system";
import { PixelTransition } from "@/components/PixelTransition";

// Future Soliva product lines — typography-driven, no images. Each card reveals
// "Coming Soon" + its own supporting line via the PixelTransition hover effect.
const futureCards = [
  { title: "Men Series", sub: "Designed for future movement." },
  { title: "Kids Series", sub: "Protection that grows with them." },
  { title: "Travel Series", sub: "Built for the journeys ahead." },
  { title: "Gifting Series", sub: "Thoughtfully given, beautifully made." },
];

export function FutureCollections() {
  return (
    <section className="relative w-full px-5 py-16 sm:px-8 md:py-20">
      <div className="mx-auto max-w-[1360px]">
        {/* Editorial header — same language as the rest of the site */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: ease.luxe }}
          className="mb-10 text-center md:mb-14"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-7 bg-[#3a2a22]/20" />
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#c76600]">
              The Road Ahead
            </span>
            <span className="h-px w-7 bg-[#3a2a22]/20" />
          </div>
          <h2 className="font-display text-[clamp(1.9rem,5vw,3rem)] leading-tight tracking-tight text-[#3a2a22]">
            Future Collections
          </h2>
          <p className="mt-2 text-[0.95rem] font-light text-[#7b6a5f]">
            Crafted for the journeys ahead.
          </p>
        </motion.header>

        {/* 4-up desktop · 2×2 tablet & mobile */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {futureCards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.6, delay: i * 0.08, ease: ease.luxe }}
              className="group h-[180px] overflow-hidden rounded-[1.75rem] border border-white/40 bg-white/45 shadow-[0_18px_44px_-26px_rgba(58,42,34,0.4)] backdrop-blur-md transition-transform duration-500 ease-out hover:-translate-y-1.5 sm:h-[200px] lg:h-[220px]"
            >
              <PixelTransition
                className="h-full w-full rounded-[1.75rem]"
                gridSize={15}
                pixelColor="#F57C22"
                animationStepDuration={0.4}
                ariaLabel={`${c.title} — coming soon`}
                firstContent={
                  <div className="flex h-full w-full items-center justify-center p-5 text-center">
                    <span className="font-display text-[1.05rem] uppercase tracking-[0.12em] text-[#3a2a22] sm:text-xl lg:text-[1.4rem]">
                      {c.title}
                    </span>
                  </div>
                }
                secondContent={
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-5 text-center">
                    <span className="font-mono text-[0.7rem] font-black uppercase tracking-[0.32em] text-[#c76600]">
                      Coming Soon
                    </span>
                    <span className="text-[0.78rem] font-light leading-snug text-[#3a2a22]/75">
                      {c.sub}
                    </span>
                  </div>
                }
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
