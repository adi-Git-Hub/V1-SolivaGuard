import { Heart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function WishlistTab() {
  return (
    <div className="space-y-8 sm:space-y-12">
      <header className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <span className="block h-px w-6 bg-orange-glow/40" />
          <span className="font-mono text-micro-sm sm:text-micro-md tracking-editorial text-orange-glow uppercase font-bold">
            CURATED SELECTION
          </span>
        </div>
        <h1 className="font-display text-brown-deep tracking-tight leading-hero text-display-lg">
          Your Wishlist
        </h1>
      </header>

      <div className="rounded-3xl border border-line-hairline bg-surface-panel/80 p-12 sm:p-20 text-center backdrop-blur-medium shadow-soft">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-glow/10 text-orange-glow"
        >
          <Heart className="h-8 w-8" strokeWidth={1.5} />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="font-display text-2xl sm:text-3xl text-brown-deep tracking-tight mb-3"
        >
          Coming Soon
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="text-sm font-light text-ink-muted max-w-xs mx-auto leading-relaxed"
        >
          Save your favourite Soliva pieces in one place. We're building something beautiful for you.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-glow/20 bg-orange-glow/[0.06] px-4 py-2 font-mono text-[10px] tracking-widest uppercase font-bold text-orange-glow"
        >
          <Sparkles className="h-3 w-3" /> Launching soon
        </motion.div>
      </div>
    </div>
  );
}
