import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/features/catalog/api";
import { useCart } from "@/features/cart/hooks/useCart";
import { useSession } from "@/features/auth/hooks/useSession";
import { useCheckoutStore } from "@/features/checkout/store";
import { viewportOnce } from "@/design-system";
import { TermsAndConditions } from "@/components/TermsAndConditions";
import { useFlyToCart, FlyToCartProvider } from "@/features/cart/components/FlyToCart";

export const Route = createFileRoute("/_public/products/$slug")({
  component: ProductRoute,
});

type SolivaProduct = {
  slug: string;
  name: string;
  line: string;
  description: string;
  story: string;
  tags: readonly string[];
  advantages: readonly string[];
  image: string;
  tone: string;
  glow: string;
  priceCents: number;
  compareAtCents: number;
};

const solivaProducts: readonly SolivaProduct[] = [
  {
    slug: "soliva-airshield-wrap",
    name: "Soliva AirShield Wrap",
    line: "Sculpted coverage. Silent confidence.",
    description:
      "The flagship edition — a dual-layer architecture that moves with your silhouette, deflecting harsh UV while staying invisible in wear.",
    story:
      "Born from 2,310 hours of field research across Delhi summers. The AirShield Wrap is the product that started it all — engineered to replace the constant readjusting, the trapped heat, the compromised coverage. Two precision layers work in tandem: the outer deflects, the inner breathes. What remains is calm, sculptural protection that disappears the moment you put it on.",
    tags: ["Advanced UV Defense", "Breathable", "Full Coverage"],
    advantages: [
      "Dual-layer UV deflection architecture",
      "360° face and neck coverage",
      "Breathable airflow channels",
      "Zero-slip kinetic stability",
      "Lightweight all-day comfort",
      "Designed for Indian climate",
    ],
    image: "/product_images/IMG_6211.jpg",
    tone: "from-[#F0F4FF] via-[#DBEAFE] to-[#BFDBFE]",
    glow: "rgba(147, 180, 235, 0.3)",
    priceCents: 79900,
    compareAtCents: 120000,
  },
  {
    slug: "soliva-urban-veil",
    name: "Soliva Urban Veil",
    line: "City-weight protection. Zero compromise.",
    description:
      "Engineered for the daily commute — a lighter weave that shields without trapping heat, designed for eight-hour days in motion.",
    story:
      "The Urban Veil was designed for the woman who spends 90 minutes on a two-wheeler every day. Lighter than the AirShield, with the same uncompromising UV architecture — calibrated for city speed, pollution exposure, and the heat that builds between stops. A commuter's quiet armour.",
    tags: ["Advanced UV Defense", "Lightweight", "Daily Wear"],
    advantages: [
      "City-optimised lightweight weave",
      "Pollution barrier technology",
      "Quick-dry moisture management",
      "No-adjustment secure fit",
      "Compact fold-and-go design",
      "8-hour wear comfort tested",
    ],
    image: "/product_images/IMG_6210.png",
    tone: "from-[#F9F8F6] via-[#EDEBE8] to-[#DEDBD7]",
    glow: "rgba(180, 175, 168, 0.28)",
    priceCents: 79900,
    compareAtCents: 120000,
  },
  {
    slug: "soliva-heatguard",
    name: "Soliva HeatGuard",
    line: "Thermal intelligence. All-day calm.",
    description:
      "Built for peak exposure — heat-reflective fabric that keeps skin cool during the harshest afternoon hours, without adding bulk.",
    story:
      "Delhi at 2 PM. 44°C. The HeatGuard was engineered for exactly this moment — when every other fabric traps heat against your skin. Our thermal-reflective outer layer actively deflects infrared radiation, while the inner mesh maintains continuous airflow. The result: measurably cooler skin, even in peak exposure.",
    tags: ["Heat Reflective", "Advanced UV Defense", "All-Day Comfort"],
    advantages: [
      "Thermal-reflective outer surface",
      "Active infrared deflection",
      "Continuous airflow mesh lining",
      "Peak-heat engineered",
      "Sweat-resistant finish",
      "Extended outdoor wear rated",
    ],
    image: "/product_images/IMG_6209.jpg",
    tone: "from-[#F5FFF7] via-[#DCFCE7] to-[#BBF7D0]",
    glow: "rgba(134, 220, 160, 0.28)",
    priceCents: 79900,
    compareAtCents: 120000,
  },
  {
    slug: "soliva-motioncover",
    name: "Soliva MotionCover",
    line: "Moves with you. Stays in place.",
    description:
      "Adaptive stretch-soft fabric that holds its form through every ride, walk, and commute — no slipping, no readjusting, no thought required.",
    story:
      "We studied 142 women during their daily commute. The number one complaint: constant readjusting. The MotionCover solves this with adaptive stretch-soft fabric that grips gently at anchor points and flexes everywhere else. Ride a scooter, turn your head, check your mirror — it stays exactly where you placed it.",
    tags: ["Advanced UV Defense", "Stretch-Soft", "Indian Climate"],
    advantages: [
      "Adaptive stretch-soft fabric",
      "Anchor-point stability system",
      "Full range of motion",
      "Two-wheeler optimised design",
      "No hair-pull, no makeup smudge",
      "Machine washable durability",
    ],
    image: "/product_images/IMG_6212.jpg",
    tone: "from-[#FFF5F7] via-[#FCE7F3] to-[#FBCFE8]",
    glow: "rgba(244, 180, 210, 0.3)",
    priceCents: 79900,
    compareAtCents: 120000,
  },
  {
    slug: "soliva-airlite-shield",
    name: "Soliva AirLite Shield",
    line: "Barely there. Completely covered.",
    description:
      "The lightest in the collection — featherweight fabric that disappears on skin while delivering the same uncompromising protection.",
    story:
      "Some days, less is the only option. The AirLite Shield is our most minimal edition — sheer enough to forget you're wearing it, dense enough to block what matters. Designed for the woman who wants protection without presence. The fabric weighs almost nothing. The coverage misses nothing.",
    tags: ["Ultra-Light", "Advanced UV Defense", "Breathable"],
    advantages: [
      "Featherweight construction",
      "Near-invisible on-skin feel",
      "Full spectrum UV coverage",
      "Ultra-compact portability",
      "Quick-dry technology",
      "Sensitive skin friendly",
    ],
    image: "/product_images/IMG_6208.jpg",
    tone: "from-[#FBF6F0] via-[#EDE0D0] to-[#D9C4AA]",
    glow: "rgba(190, 160, 120, 0.3)",
    priceCents: 79900,
    compareAtCents: 120000,
  },
];

function findSolivaProduct(slug: string) {
  return solivaProducts.find((p) => p.slug === slug);
}

function ProductRoute() {
  const { slug } = Route.useParams();
  const solivaProduct = findSolivaProduct(slug);

  return (
    <FlyToCartProvider>
      {solivaProduct ? <SolivaProductDetail product={solivaProduct} /> : <ApiProductDetail slug={slug} />}
    </FlyToCartProvider>
  );
}

// --- NEW COMPONENT: Premium Add To Cart Button ---
function AddToCartButton({ 
  productName, 
  priceCents, 
  onAdd, 
  imageSrc, 
  imageRef 
}: { 
  productName: string; 
  priceCents: number; 
  onAdd: () => void;
  imageSrc: string;
  imageRef: React.RefObject<HTMLImageElement>;
}) {
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const { flyToCart } = useFlyToCart();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (state !== "idle") return;

    // 1. Button compresses, text changes to "Adding..."
    setState("adding");

    // 2. Soft loading transition for 500ms
    setTimeout(() => {
      setState("added");
      
      // 3. Trigger actual cart logic
      onAdd();

      // 4. Trigger fly-to-cart animation using the product image
      if (imageRef.current) {
        flyToCart(imageSrc, imageRef.current);
      }

      // 5. Reset after 2 seconds
      setTimeout(() => {
        setState("idle");
      }, 2000);

    }, 500);
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={state !== "idle"}
      className="relative w-full rounded-full py-5 sm:py-6 overflow-hidden font-bold uppercase tracking-cta text-micro-lg transition-all duration-300"
      animate={{
        scale: state === "adding" ? 0.98 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        // Maintain base styling depending on state
        backgroundColor: state === "added" ? "transparent" : "#3a2a22", // brown-deep
        color: state === "added" ? "#3a2a22" : "#ffffff",
      }}
    >
      {/* Background Layer for Idle/Adding */}
      <motion.div 
        className="absolute inset-0 bg-brown-deep -z-10"
        animate={{ opacity: state === "added" ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Premium Champagne Fill for Added State (Left to Right) */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#f3dcb2] to-[#e3c187] -z-10 shadow-[0_0_20px_rgba(243,220,178,0.5)]"
        initial={{ x: "-100%" }}
        animate={{ x: state === "added" ? "0%" : "-100%" }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      />

      {/* Button Content */}
      <div className="relative z-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              Add to Cart — ₹{(priceCents / 100).toLocaleString("en-IN")}
            </motion.span>
          )}
          {state === "adding" && (
            <motion.span
              key="adding"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              Adding...
            </motion.span>
          )}
          {state === "added" && (
            <motion.span
              key="added"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Check className="w-5 h-5" /> Added To Cart
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

function SolivaProductDetail({ product }: { product: SolivaProduct }) {
  const { add: addToCart } = useCart();
  const navigate = useNavigate();
  const session = useSession();
  const setCheckoutItems = useCheckoutStore((s) => s.setItems);
  const imageRef = useRef<HTMLImageElement>(null);

  const { data: dbProduct } = useProduct(product.slug);
  const productId = dbProduct?.id ?? product.slug;
  const editionNum = solivaProducts.indexOf(product) + 1;
  const editionId = String(editionNum).padStart(2, "0");

  function onAdd() {
    addToCart({
      productId,
      slug: product.slug,
      name: product.name,
      image: product.image,
      priceCents: product.priceCents,
      currency: "INR",
    });
  }

  function onBuyNow() {
    if (!dbProduct) {
      toast.error("Product loading, please try again");
      return;
    }
    setCheckoutItems([
      {
        productId,
        name: product.name,
        image: product.image,
        price: product.priceCents / 100,
        quantity: 1,
      },
    ]);
    navigate({ to: "/checkout" });
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-luxury-beige/60 pt-24 sm:pt-28 pb-16 sm:pb-24 z-10 safe-x">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_20%_30%,rgba(245,130,13,0.04),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(252,231,243,0.5),transparent_60%)] opacity-80" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_70%_80%,rgba(243,236,226,1),transparent_50%),radial-gradient(circle_at_30%_90%,rgba(245,130,13,0.06),transparent_40%)] opacity-70" />
      </div>

      <article className="relative z-10 mx-auto max-w-[88rem] px-4 sm:px-6 md:px-12">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8 sm:mb-12 flex items-center gap-1.5 sm:gap-2 font-mono text-micro-md tracking-cta text-ink-muted uppercase font-bold"
        >
          <Link to="/" className="hover:text-brown-deep transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <Link to="/collection" className="hover:text-brown-deep transition-colors">
            Collection
          </Link>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="text-brown-deep truncate max-w-[50vw] sm:max-w-none">
            {product.name}
          </span>
        </motion.nav>

        {/* Split layout */}
        <div className="grid gap-10 sm:gap-12 md:grid-cols-2 lg:gap-20 items-start">
          {/* LEFT — Product image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="sticky top-28">
              <div
                className={`relative aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-panel-lg bg-gradient-to-br ${product.tone} border border-line-soft shadow-editorial`}
              >
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    background: `radial-gradient(circle at 50% 45%, ${product.glow}, transparent 70%)`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10 md:p-12">
                  <motion.img
                    ref={imageRef}
                    src={product.image}
                    alt={product.name}
                    fetchPriority="high"
                    className="w-full h-full object-contain drop-shadow-[0_12px_32px_rgba(58,42,34,0.18)] transition-transform duration-700 hover:scale-[1.03]"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-brown-deep/20 blur-atmospheric pointer-events-none bottom-[6%] w-[65%] h-4" />

                {/* Edition chip */}
                <div className="absolute top-5 sm:top-6 left-5 sm:left-6 bg-surface-glass-strong backdrop-blur-subtle rounded-2xl px-3 py-2 shadow-sm">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-mono text-micro-xs tracking-cta text-brown-deep/60 uppercase font-bold">
                      Edition
                    </span>
                    <span className="font-mono text-sm tracking-tighter text-brown-deep font-bold">
                      {editionId}
                    </span>
                  </div>
                </div>

                <div className="absolute top-5 sm:top-6 right-5 sm:right-6 bg-surface-glass-strong backdrop-blur-subtle rounded-full px-3 py-1.5 shadow-sm">
                  <span className="font-mono text-micro-xs tracking-cta text-orange-glow uppercase font-bold">
                    Launch
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — Product content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="block h-px w-5 bg-brown/20" />
              <span className="font-mono text-micro-sm tracking-editorial text-orange-glow uppercase font-bold">
                SS 26 · Edition {editionId}
              </span>
            </div>
            <h1
              className="font-display text-brown-deep tracking-tight leading-hero"
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
            >
              {product.name}
            </h1>
            <p className="mt-2 text-base sm:text-lg text-ink-soft font-light italic">
              {product.line}
            </p>

            {/* Pricing */}
            <div className="mt-6 sm:mt-8 flex items-baseline gap-4">
              <span className="font-mono text-2xl sm:text-3xl text-brown-deep tracking-tight font-medium">
                ₹{(product.priceCents / 100).toLocaleString("en-IN")}
              </span>
              <span className="font-mono text-sm text-ink-muted/50 line-through tracking-tight">
                ₹{(product.compareAtCents / 100).toLocaleString("en-IN")}
              </span>
            </div>
            <span className="mt-1.5 font-mono text-micro-xs tracking-cta text-orange-glow uppercase font-bold">
              Launch Edition — Limited Offer
            </span>

            {/* Advantages */}
            <div className="mt-8 sm:mt-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="block h-px w-4 bg-brown/20" />
                <span className="font-mono text-micro-xs tracking-cta text-brown-deep/60 uppercase font-bold">
                  Why this edition
                </span>
              </div>
              <ul className="space-y-3">
                {product.advantages.map((adv, i) => (
                  <motion.li
                    key={adv}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={viewportOnce}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-start gap-3 text-sm text-ink-soft font-light"
                  >
                    <Check className="h-4 w-4 mt-0.5 text-orange-glow/80 shrink-0" />
                    <span>{adv}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* CTAs */}
            <div className="mt-8 sm:mt-10 flex flex-col gap-3">
              <AddToCartButton 
                productName={product.name} 
                priceCents={product.priceCents} 
                onAdd={onAdd} 
                imageSrc={product.image}
                imageRef={imageRef}
              />
              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-full py-5 sm:py-6 border-brown-deep/20 text-brown-deep hover:bg-brown-deep hover:text-white transition-all duration-500 font-bold uppercase tracking-cta text-micro-lg"
                onClick={onBuyNow}
              >
                Buy Now
              </Button>
            </div>

            {/* Tags */}
            <ul className="mt-8 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <li
                  key={tag}
                  className="border border-line-hairline bg-surface-panel/70 backdrop-blur-subtle rounded-full px-3 py-1 text-micro-xs font-mono tracking-cta uppercase text-brown-deep/75 font-bold"
                >
                  {tag}
                </li>
              ))}
            </ul>

            {/* Story */}
            <div className="mt-10 sm:mt-12 border-t border-line-soft pt-8 sm:pt-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="block h-px w-4 bg-brown/20" />
                <span className="font-mono text-micro-xs tracking-cta text-brown-deep/60 uppercase font-bold">
                  The Story
                </span>
              </div>
              <p className="text-sm sm:text-base text-ink-muted font-light leading-relaxed">
                {product.story}
              </p>
            </div>

            {/* Product specs */}
            <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line-soft pt-8 sm:pt-10">
              {[
                { label: "Protection", value: "Advanced UV" },
                { label: "Weight", value: "Ultra-Light" },
                { label: "Season", value: "SS 2026" },
                { label: "Origin", value: "Delhi, India" },
              ].map((spec) => (
                <div key={spec.label} className="space-y-1">
                  <dt className="font-mono text-micro-xs tracking-cta text-ink-muted uppercase font-bold">
                    {spec.label}
                  </dt>
                  <dd className="font-display text-base text-brown-deep italic">{spec.value}</dd>
                </div>
              ))}
            </div>

            {/* Terms & Conditions — compact summary + full modal */}
            <div className="mt-8 sm:mt-10 border-t border-line-soft pt-6">
              <TermsAndConditions variant="light" />
            </div>
          </motion.div>
        </div>
      </article>
    </div>
  );
}

function ApiProductDetail({ slug }: { slug: string }) {
  const { data: product, isLoading, isError } = useProduct(slug);
  const { add: addToCart } = useCart();
  const navigate = useNavigate();
  const session = useSession();
  const setCheckoutItems = useCheckoutStore((s) => s.setItems);
  const imageRef = useRef<HTMLImageElement>(null);

  if (isError) throw notFound();

  if (isLoading || !product) {
    return (
      <div className="mx-auto grid max-w-[90rem] gap-8 px-4 py-16 sm:gap-10 sm:px-6 sm:py-20 md:grid-cols-2 md:gap-12 md:px-12 md:py-32 safe-x">
        <Skeleton className="aspect-[4/5] w-full rounded-2xl sm:rounded-panel bg-cream/50" />
        <div className="space-y-5 sm:space-y-6">
          <Skeleton className="h-10 sm:h-12 w-2/3 bg-cream/50" />
          <Skeleton className="h-7 sm:h-8 w-32 bg-cream/50" />
          <Skeleton className="h-28 sm:h-32 w-full bg-cream/50" />
          <Skeleton className="h-12 sm:h-14 w-full bg-cream/50" />
        </div>
      </div>
    );
  }

  function onAdd() {
    if (!product) return;
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      priceCents: product.priceCents,
      currency: product.currency,
    });
  }

  function onBuyNow() {
    if (!product) return;
    setCheckoutItems([
      {
        productId: product.id,
        name: product.name,
        image: product.images[0],
        price: product.priceCents / 100,
        quantity: 1,
      },
    ]);
    navigate({ to: "/checkout" });
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-luxury-beige/60 pt-24 sm:pt-32 pb-16 sm:pb-24 z-10 safe-x">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_20%_30%,rgba(245,130,13,0.04),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(252,231,243,0.5),transparent_60%)] opacity-80" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_70%_80%,rgba(243,236,226,1),transparent_50%),radial-gradient(circle_at_30%_90%,rgba(245,130,13,0.06),transparent_40%)] opacity-70" />
      </div>
      <article className="relative z-10 mx-auto max-w-[90rem] px-4 sm:px-6 md:px-12 py-8 sm:py-12 md:py-16">
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 sm:mb-12 flex items-center gap-1.5 sm:gap-2 font-mono text-micro-md tracking-cta text-ink-muted uppercase font-bold"
        >
          <Link to="/" className="hover:text-brown-deep transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="text-brown-deep truncate">{product.name}</span>
        </motion.nav>
        <div className="grid gap-8 sm:gap-12 md:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-panel bg-cream/30 border border-line-hairline shadow-editorial backdrop-blur-medium">
              <img
                ref={imageRef}
                src={product.images[0]}
                alt={product.name}
                fetchPriority="high"
                className="h-full w-full object-cover mix-blend-multiply opacity-90 transition-transform duration-700 hover:scale-105"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="flex flex-col space-y-6 sm:space-y-8"
          >
            <h1 className="font-display text-brown-deep tracking-tight leading-hero text-display-lg">
              {product.name}
            </h1>
            <div className="font-mono text-2xl text-brown-deep tracking-tight font-medium">
              ₹{(product.priceCents / 100).toLocaleString("en-IN")}
            </div>
            <p className="text-base leading-relaxed text-ink-soft font-light italic">
              {product.description}
            </p>
            <div className="flex flex-col gap-3">
              <AddToCartButton 
                productName={product.name} 
                priceCents={product.priceCents} 
                onAdd={onAdd} 
                imageSrc={product.images[0]}
                imageRef={imageRef}
              />
              {product.inStock && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full py-5 sm:py-6 border-brown-deep/20 text-brown-deep hover:bg-brown-deep hover:text-white transition-all duration-500 font-bold uppercase tracking-cta text-micro-lg"
                  onClick={onBuyNow}
                >
                  Buy Now
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </article>
    </div>
  );
}
