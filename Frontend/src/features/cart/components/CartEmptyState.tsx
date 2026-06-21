import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, Sparkles, Star, ScrollText, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useCartUIStore } from "@/features/cart/store";

export function CartEmptyState() {
  const closeCart = useCartUIStore((s) => s.closeCart);
  return (
    <div className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden py-12 px-4">
      {/* Cinematic Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-bronze/5 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] rounded-full bg-champagne/10 blur-[100px]"
        />
      </div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-4xl"
      >
        <div className="glass-card border border-white/10 bg-white/5 backdrop-blur-xl rounded-[32px] p-8 md:p-16 shadow-2xl flex flex-col items-center text-center">
          {/* Elegant Icon Reveal */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
            className="mb-8 relative"
          >
            <div className="absolute inset-0 bg-bronze/20 blur-2xl rounded-full" />
            <div className="relative w-24 h-24 rounded-full border border-bronze/20 flex items-center justify-center bg-background/40 backdrop-blur-md">
              <ShoppingBag className="w-10 h-10 text-bronze/60 stroke-[1.25px]" />
            </div>
          </motion.div>

          {/* Premium Typography Hierarchy */}
          <div className="space-y-4 mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground"
            >
              Your Cart Awaits
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto font-light leading-relaxed"
            >
              Discover pieces designed for precision and protection. Your next essential is just a few clicks away.
            </motion.p>
          </div>

          {/* Primary Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-16"
          >
            <Button
              asChild
              size="lg"
              className="rounded-full px-10 py-7 text-lg group bg-foreground text-background hover:bg-foreground/90 transition-all duration-500 hover:scale-[1.02] shadow-xl shadow-black/10"
            >
              <Link to="/collection" onClick={closeCart}>
                Explore the Collection
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>

          {/* Curated Secondary Destinations Grid */}
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-white/5">
            {[
              { label: "New Arrivals", icon: Sparkles, to: "/collection?sort=newest" },
              { label: "Best Sellers", icon: Star, to: "/collection?sort=popular" },
              { label: "The Story", icon: ScrollText, to: "/story" },
              { label: "Full Catalog", icon: Plus, to: "/collection" },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
              >
                <Link
                  to={item.to as any}
                  onClick={closeCart}
                  className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-bronze/10 group-hover:scale-110 transition-all duration-500">
                    <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-bronze transition-colors" />
                  </div>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
