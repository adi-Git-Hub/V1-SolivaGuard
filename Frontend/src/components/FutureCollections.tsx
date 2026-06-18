import { motion } from "framer-motion";
import { viewportOnce, ease } from "@/design-system";
import { PixelTransition } from "@/components/PixelTransition";

// Future Soliva product lines — typography-driven, no images. Each card carries
// its own soft, elegant gradient identity and reveals an oversized "Coming Soon"
// via the PixelTransition hover effect.
const futureCards = [
  {
    word: "Men",
    sub: "Built for everyday movement.",
    grad: "from-[#F8F1E3] to-[#EADCC2]", // warm champagne beige
    border: "border-[#c7a86c]/25",
  },
  {
    word: "Kids",
    sub: "Protection that grows with them.",
    grad: "from-[#FCEDF1] to-[#F6D7E1]", // soft blush pink
    border: "border-[#d889a4]/25",
  },
  {
    word: "Travel",
    sub: "Made for the journeys ahead.",
    grad: "from-[#ECF2F8] to-[#D6E4F1]", // muted mist blue
    border: "border-[#6f93c0]/25",
  },
  {
    word: "Gifting",
    sub: "Thoughtfully given, beautifully made.",
    grad: "from-[#EFF2E3] to-[#DBE5C8]", // warm olive / sage
    border: "border-[#98a868]/30",
  },
];

export function FutureCollections() {
  return (
    <section className="relative w-full px-5 py-12 sm:px-8 md:py-16">
      <div className="mx-auto max-w-[1360px]">
        {/* Editorial header */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: ease.luxe }}
          className="mb-9 text-center md:mb-12"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-7 bg-[#3a2a22]/20" />
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#c76600]">
              The Road Ahead
            </span>
            <span className="h-px w-7 bg-[#3a2a22]/20" />
          </div>
          <h2 className="font-display text-[clamp(2rem,5.5vw,3.25rem)] leading-[1.05] tracking-tight text-[#3a2a22]">
            Future Collections
          </h2>
          <p className="mt-2.5 text-[0.95rem] font-light italic text-[#7b6a5f]">
            Crafted for the journeys ahead.
          </p>
        </motion.header>

        {/* 4-up desktop · 2×2 tablet & mobile */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {futureCards.map((c, i) => (
            <motion.div
              key={c.word}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.6, delay: i * 0.08, ease: ease.luxe }}
              className={`group relative h-[200px] overflow-hidden rounded-[2rem] border ${c.border} bg-gradient-to-br ${c.grad} shadow-[0_18px_44px_-26px_rgba(58,42,34,0.32)] backdrop-blur-[2px] transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_34px_64px_-26px_rgba(58,42,34,0.45)] sm:h-[220px] lg:h-[248px]`}
            >
              {/* soft glass sheen across the top */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-1/2 bg-gradient-to-b from-white/45 to-transparent"
              />
              <PixelTransition
                className="relative z-[2] h-full w-full rounded-[2rem]"
                gridSize={15}
                pixelColor="#F57C22"
                animationStepDuration={0.4}
                ariaLabel={`${c.word} Series — coming soon`}
                firstContent={
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-5 text-center">
                    <span className="font-display text-[2rem] leading-[0.95] tracking-tight text-[#3a2a22] sm:text-[2.3rem] lg:text-[2.7rem]">
                      {c.word}
                    </span>
                    <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.42em] text-[#3a2a22]/55">
                      Series
                    </span>
                  </div>
                }
                secondContent={
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 p-5 text-center">
                    <span className="font-display text-[1.6rem] leading-[0.95] tracking-tight text-[#c76600] sm:text-[1.85rem] lg:text-[2.1rem]">
                      Coming Soon
                    </span>
                    <span className="max-w-[88%] text-[0.82rem] font-light leading-snug text-[#3a2a22]/75">
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
