import { Link, createFileRoute } from "@tanstack/react-router";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useInView,
  animate,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Wind, Orbit, Shield, Snowflake, Feather } from "lucide-react";
import { viewportOnce, ease } from "@/design-system";
import { SunlightVisual, AirflowSystem, CoverageFigure } from "@/components/technology/visuals";

export const Route = createFileRoute("/_public/technology")({
  component: HowItWorksRoute,
  head: () => ({
    meta: [
      { title: "How It Works — Soliva Protection System" },
      {
        name: "description",
        content:
          "An engineered protection system for modern movement — advanced UV defense, breathable airflow, and complete coverage, thoughtfully designed.",
      },
    ],
  }),
});

/* ─── Chapter marker ──────────────────────────────────────────────── */
function Chapter({
  number,
  title,
  tone = "warm",
}: {
  number: string;
  title?: string;
  tone?: "warm" | "ivory";
}) {
  const color = tone === "ivory" ? "text-[#d9b27a]" : "text-[#c76600]";
  const line = tone === "ivory" ? "bg-[#d9b27a]/40" : "bg-[#c76600]/40";
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className={`block h-px w-8 ${line}`} />
      <span className={`font-mono text-[0.625rem] tracking-[0.42em] uppercase font-bold ${color}`}>
        {title ? `${number} · ${title}` : number}
      </span>
    </div>
  );
}

/* ─── Subtle one-time perspective-depth settle (no continuous motion) ── */
function Depth({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{ perspective: "1400px" }}>
      <motion.div
        initial={{ opacity: 0, rotateX: 6, y: 26 }}
        whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 1.3, ease: ease.luxe }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ─── 3D glass tilt card — pointer-driven rotateX/rotateY via springs ──
   Motion values keep this off the React render path (no re-renders on
   pointer move). On touch devices the pointer events never fire, so the
   card simply rests flat — fully responsive, zero extra work on mobile. */
function TiltCard({
  children,
  className = "",
  intensity = 12,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  delay?: number;
}) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const spring = { stiffness: 150, damping: 18, mass: 0.4 };
  const srx = useSpring(rx, spring);
  const sry = useSpring(ry, spring);
  // Soft moving glare that tracks the cursor across the glass.
  const gx = useTransform(sry, [-intensity, intensity], ["18%", "82%"]);
  const gy = useTransform(srx, [intensity, -intensity], ["18%", "82%"]);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgba(255,255,255,0.6), transparent 60%)`;
  // Holographic conic sheen whose hue sweeps with the tilt angle.
  const hue = useTransform(sry, [-intensity, intensity], [-22, 22]);
  const holo = useMotionTemplate`conic-gradient(from ${hue}deg at 50% 50%, rgba(246,199,122,0.22), rgba(199,102,0,0.14), rgba(217,178,122,0.2), rgba(246,199,122,0.22))`;

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * intensity * 2);
    rx.set(-py * intensity * 2);
  }
  function reset() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <div style={{ perspective: "1100px" }} className={className}>
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={reset}
        initial={{ opacity: 0, y: 34 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 1, ease: ease.luxe, delay }}
        whileHover={{ y: -8 }}
        style={{
          rotateX: srx,
          rotateY: sry,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        className="group relative h-full rounded-[1.75rem] border border-white/60 bg-white/55 p-7 sm:p-8 shadow-[0_18px_50px_-22px_rgba(58,42,34,0.32)] backdrop-blur-xl transition-shadow duration-500 hover:shadow-[0_40px_90px_-28px_rgba(199,102,0,0.4)]"
      >
        {/* hover glow-ring */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[1.75rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ boxShadow: "0 0 0 1px rgba(199,102,0,0.35), 0 0 44px -6px rgba(199,102,0,0.38)" }}
        />
        {/* holographic sheen — hue tracks the tilt */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: holo }}
        />
        {/* cursor-tracking glare */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: glare }}
        />
        {/* top sheen edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[1.75rem] bg-gradient-to-r from-transparent via-white/80 to-transparent"
        />
        {/* lifted content plane */}
        <motion.div style={{ z: 40, transformStyle: "preserve-3d" }} className="relative">
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─── Count-up metric — animates 0→target once it scrolls into view ─── */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);
  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

/* Staggered content reveal inside each card — the "fade-in content" effect. */
const cardStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: ease.luxe } },
};

/* ─── Engineered pillars — three 3D glass technology cards ──────────── */
const PILLARS = [
  {
    tag: "01",
    icon: ShieldCheck,
    title: "Advanced UV Defense",
    body: "A tightly engineered outer construction blocks the vast majority of UVA and UVB before it ever reaches skin.",
    metricValue: 98,
    metricSuffix: "%",
    metricText: "",
    metricLabel: "UV blocked",
  },
  {
    tag: "02",
    icon: Wind,
    title: "Breathable Airflow",
    body: "Channelled ventilation keeps air moving and heat escaping, so protection never traps warmth against the body.",
    metricValue: 0,
    metricSuffix: "",
    metricText: "All-day",
    metricLabel: "ventilation",
  },
  {
    tag: "03",
    icon: Orbit,
    title: "Complete Coverage",
    body: "Intentional shaping protects the face, ears, neck, and shoulders — the areas most exposed in daily movement.",
    metricValue: 360,
    metricSuffix: "°",
    metricText: "",
    metricLabel: "coverage",
  },
];

function GlassPillars() {
  return (
    <section className="relative py-20 sm:py-28">
      {/* ── Ambient: soft layered cream depth, no hard gradients ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[60%] w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(246,199,122,0.10),transparent_62%)] blur-3xl" />
        <div className="absolute bottom-0 right-[-6%] h-[44%] w-[40%] rounded-full bg-[radial-gradient(circle,rgba(199,102,0,0.06),transparent_60%)] blur-2xl" />
      </div>

      <div className="mx-auto max-w-[1340px] w-full px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 1.1, ease: ease.smooth }}
          className="mb-12 sm:mb-16 text-center"
        >
          <Chapter number="THE SYSTEM" />
          <h2
            className="font-display leading-[1.04] tracking-tight"
            style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.75rem)" }}
          >
            Three layers of{" "}
            <span className="italic font-light text-[#c76600]">quiet engineering.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:gap-7 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <TiltCard key={p.tag} className="h-full" delay={i * 0.1}>
              <motion.div
                variants={cardStagger}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                style={{ transformStyle: "preserve-3d" }}
                className="relative"
              >
                {/* HUD ghost digit — rests at the back of the 3D space */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-2 right-0 select-none font-display text-[4.5rem] leading-none text-[#c76600]/[0.07]"
                >
                  {p.tag}
                </span>

                {/* icon badge — lifted toward the viewer for tilt parallax */}
                <motion.div
                  variants={cardItem}
                  style={{ z: 36 }}
                  className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-gradient-to-br from-white to-[#f6ead7] text-[#c76600] shadow-[0_12px_28px_-12px_rgba(199,102,0,0.55)]"
                >
                  <p.icon className="h-5 w-5" strokeWidth={1.6} />
                </motion.div>

                <motion.span
                  variants={cardItem}
                  className="mt-6 block font-mono text-[0.625rem] tracking-[0.42em] uppercase font-bold text-[#c76600]"
                >
                  {p.tag}
                </motion.span>
                <motion.h3
                  variants={cardItem}
                  style={{ z: 22 }}
                  className="mt-3 font-display text-[1.4rem] sm:text-[1.55rem] leading-tight tracking-tight text-[#3a2a22]"
                >
                  {p.title}
                </motion.h3>
                <motion.p
                  variants={cardItem}
                  className="mt-3.5 text-[0.95rem] leading-[1.7] font-light text-[#7b6a5f]"
                >
                  {p.body}
                </motion.p>
                <motion.div
                  variants={cardItem}
                  style={{ z: 30 }}
                  className="mt-7 flex items-baseline gap-3 border-t border-[#3a2a22]/10 pt-5"
                >
                  <span className="font-display text-[1.85rem] leading-none text-[#c76600]">
                    {p.metricValue ? (
                      <CountUp to={p.metricValue} suffix={p.metricSuffix} />
                    ) : (
                      p.metricText
                    )}
                  </span>
                  <span className="font-mono text-[0.625rem] tracking-[0.3em] uppercase text-[#3a2a22]/50">
                    {p.metricLabel}
                  </span>
                </motion.div>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Exploded architecture — layers separate in 3D depth on reveal ──── */
const ARCH_LAYERS = [
  { title: "UV Defense", desc: "Engineered outer UV shield", icon: Shield, depth: 0 },
  { title: "Airflow System", desc: "Channelled ventilation keeps air moving", icon: Wind, depth: 1 },
  { title: "Cooling Layer", desc: "Heat escapes; the surface stays calm", icon: Snowflake, depth: 2 },
  { title: "Comfort Layer", desc: "Soft against skin for all-day wear", icon: Feather, depth: 3 },
];

function ExplodedArchitecture() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* ── Ambient depth ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-10%] top-[10%] h-[60%] w-[52%] rounded-full bg-[radial-gradient(circle,rgba(210,138,61,0.10),transparent_64%)] blur-3xl" />
        <div className="absolute left-[-8%] bottom-[6%] h-[48%] w-[42%] rounded-full bg-[radial-gradient(circle,rgba(246,199,122,0.07),transparent_62%)] blur-2xl" />
      </div>

      <div className="mx-auto max-w-[1340px] w-full px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 1.1, ease: ease.smooth }}
          className="mb-14 sm:mb-20 text-center"
        >
          <Chapter number="ARCHITECTURE" />
          <h2
            className="font-display leading-[1.04] tracking-tight"
            style={{ fontSize: "clamp(1.45rem, 3.4vw, 2.75rem)" }}
          >
            Engineered in{" "}
            <span className="italic font-light text-[#c76600]">layers.</span>
          </h2>
          <p className="mt-4 mx-auto max-w-xl text-[0.95rem] md:text-[1rem] text-[#7b6a5f] font-light leading-[1.7]">
            Every layer does one job exceptionally well — together they form a single, calm system.
          </p>
        </motion.div>

        {/* 3D exploded stack */}
        <div className="relative mx-auto max-w-[44rem]" style={{ perspective: "1600px" }}>
          {/* glowing core beam threading the layers */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scaleY: 0 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 1.4, ease: ease.luxe }}
            className="pointer-events-none absolute left-1/2 top-0 bottom-0 w-px origin-top -translate-x-1/2 bg-gradient-to-b from-transparent via-[#c76600]/40 to-transparent"
            style={{ boxShadow: "0 0 24px 2px rgba(199,102,0,0.22)" }}
          />
          <motion.div
            initial="rest"
            whileInView="open"
            viewport={viewportOnce}
            style={{ transformStyle: "preserve-3d" }}
            className="relative flex flex-col items-stretch gap-5 sm:gap-7"
          >
            {ARCH_LAYERS.map((l, i) => (
              <motion.div
                key={l.title}
                variants={{
                  rest: { opacity: 0, y: 40, z: -70, rotateX: 16 },
                  open: { opacity: 1, y: 0, z: l.depth * 24, rotateX: 8 },
                }}
                transition={{ duration: 1.1, delay: i * 0.14, ease: ease.luxe }}
                whileHover={{
                  z: l.depth * 24 + 42,
                  rotateX: 3,
                  transition: { duration: 0.45, ease: ease.luxe },
                }}
                style={{ transformStyle: "preserve-3d", willChange: "transform" }}
                className="group relative rounded-2xl border border-white/60 bg-white/55 px-6 py-5 sm:px-8 sm:py-6 shadow-[0_22px_55px_-26px_rgba(58,42,34,0.38)] backdrop-blur-xl transition-shadow duration-500 hover:shadow-[0_42px_92px_-30px_rgba(199,102,0,0.42)]"
              >
                {/* hover glow-ring */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ boxShadow: "0 0 0 1px rgba(199,102,0,0.3), 0 0 34px -8px rgba(199,102,0,0.4)" }}
                />
                <div className="flex items-center gap-4 sm:gap-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/70 bg-gradient-to-br from-white to-[#f6ead7] text-[#c76600] shadow-[0_8px_20px_-10px_rgba(199,102,0,0.55)]">
                    <l.icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.6} />
                  </span>
                  <span className="font-mono text-[0.625rem] tracking-[0.32em] uppercase font-bold text-[#c76600]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="h-8 w-px bg-[#3a2a22]/10" />
                  <div>
                    <h3 className="font-display text-[1.15rem] sm:text-[1.3rem] leading-tight tracking-tight text-[#3a2a22]">
                      {l.title}
                    </h3>
                    <p className="mt-1 text-[0.875rem] leading-[1.55] font-light text-[#7b6a5f]">
                      {l.desc}
                    </p>
                  </div>
                </div>
                {/* depth-floor shadow that deepens with each layer */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-6 -bottom-3 h-3 rounded-full bg-[#3a2a22]/12 blur-md"
                  style={{ transform: "translateZ(-30px)" }}
                />
                {/* connector chevron between plates */}
                {i < ARCH_LAYERS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-1/2 -bottom-[1.45rem] sm:-bottom-[2rem] -translate-x-1/2 font-mono text-[#c76600]/50 text-sm"
                  >
                    ↓
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksRoute() {
  /* ── Hero pointer parallax — subtle depth between ambient + visual.
     Springed motion values; on touch the handler bails, so mobile rests
     perfectly centered with no work on the main thread. ── */
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 60, damping: 20, mass: 0.5 });
  const spy = useSpring(py, { stiffness: 60, damping: 20, mass: 0.5 });
  const ambX = useTransform(spx, (v) => v * 26);
  const ambY = useTransform(spy, (v) => v * 26);
  const visX = useTransform(spx, (v) => v * -16);
  const visY = useTransform(spy, (v) => v * -16);

  function onHeroMove(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onHeroLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <div className="relative w-full bg-[#FAF7F3] overflow-x-hidden text-[#3a2a22]">

      {/* ══════════════════════ CHAPTER ONE — DESIGNED TO PROTECT ══════════════════════ */}
      <section
        className="relative pt-24 pb-16 sm:pt-28 sm:pb-24"
        onPointerMove={onHeroMove}
        onPointerLeave={onHeroLeave}
      >

        {/* ── Sun ambient atmosphere: warm amber bloom layers (now parallax-aware) ── */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ x: ambX, y: ambY, willChange: "transform" }}
        >
          {/* primary deep bloom — top right, mirrors SunlightVisual */}
          <div className="absolute -top-28 right-[-10%] h-[72%] w-[68%] rounded-full bg-[radial-gradient(circle,rgba(210,138,61,0.16)_0%,rgba(184,132,69,0.07)_38%,transparent_66%)] blur-3xl" />
          {/* secondary soft bloom — center left, counterpoint depth */}
          <div className="absolute top-[35%] left-[-8%] h-[50%] w-[46%] rounded-full bg-[radial-gradient(circle,rgba(246,199,122,0.09),transparent_60%)] blur-2xl" />
          {/* diagonal light shaft — crepuscular ray across the section */}
          <div className="absolute inset-0 bg-[linear-gradient(148deg,rgba(246,199,122,0.07)_0%,transparent_42%)]" />
          {/* bottom warm haze to bleed into next section */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#F6C77A]/06 to-transparent" />
        </motion.div>

        <div className="mx-auto max-w-[1340px] w-full px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 1.1, ease: ease.smooth }}
            >
              <Chapter number="HOW IT WORKS" />
              <h1
                className="font-display leading-[1.02] tracking-tight mb-10 whitespace-nowrap"
                style={{ fontSize: "clamp(1.35rem, 3vw, 2.8rem)" }}
              >
                Designed for{" "}
                <span className="italic font-light text-[#c76600]">everyday exposure.</span>
              </h1>

              <div className="max-w-xl space-y-5 text-[1rem] md:text-[1.0625rem] text-[#7b6a5f] font-light leading-[1.75]">
                <p>
                  Every day, your skin faces long hours of sun, heat, dust, and environmental
                  exposure. Yet most coverings were never specifically designed for these
                  conditions.
                </p>
                <p>
                  Soliva was created as a thoughtful everyday protection system—combining
                  comfortable coverage, breathable construction, and effortless wearability into one
                  solution designed for the way modern India moves.
                </p>
              </div>

              <div className="mt-12 flex items-center gap-4">
                <span className="block h-px w-10 bg-[#c76600]/40" />
                <span className="font-mono text-[0.6875rem] tracking-[0.32em] uppercase text-[#3a2a22]/60 font-bold">
                  How it works · The engineering behind calm confidence
                </span>
              </div>
            </motion.div>

            <motion.div
              className="max-w-[26rem] mx-auto lg:mx-0 lg:ml-auto w-full"
              style={{ x: visX, y: visY, willChange: "transform" }}
            >
              <SunlightVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ THE SYSTEM — ENGINEERED GLASS PILLARS ══════════════════════ */}
      <GlassPillars />

      {/* ══════════════════════ CHAPTER THREE — COMFORT WITHOUT COMPROMISE ══════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center py-14">

        {/* ── Wind atmosphere: cool blue air ingress left, warm amber heat exhaust right ── */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-[48%] bg-[radial-gradient(ellipse_90%_80%_at_left_center,rgba(96,165,250,0.07),transparent)]" />
          <div className="absolute inset-y-0 right-0 w-[48%] bg-[radial-gradient(ellipse_90%_80%_at_right_center,rgba(210,138,61,0.07),transparent)]" />
          {/* very subtle blue-to-amber midline shimmer */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(147,197,253,0.03)_0%,transparent_48%,rgba(246,199,122,0.03)_100%)]" />
        </div>

        <div className="mx-auto max-w-[1340px] w-full px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 1, ease: ease.smooth }}
            className="max-w-4xl mb-8 text-center mx-auto"
          >
            <h2
              className="font-display leading-[1.04] tracking-tight whitespace-nowrap"
              style={{ fontSize: "clamp(1.3rem, 3.2vw, 2.5rem)" }}
            >
              Comfortable enough{" "}
              <span className="italic font-light text-[#c76600]">to wear every day.</span>
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-[0.95rem] md:text-[1rem] text-[#7b6a5f] font-light leading-[1.7]">
              Protection should feel natural, not restrictive — air circulates, heat escapes,
              comfort lasts.
            </p>
          </motion.div>

          <Depth className="max-w-[46rem] mx-auto">
            <AirflowSystem />
          </Depth>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 1, delay: 0.2 }}
            className="mt-8 max-w-2xl mx-auto text-center font-display italic text-[#3a2a22]/70 leading-[1.5]"
            style={{ fontSize: "clamp(1rem, 1.6vw, 1.25rem)" }}
          >
            Because the best protection is the one people actually choose to wear consistently.
          </motion.p>
        </div>
      </section>

      {/* ══════════════════════ ARCHITECTURE — EXPLODED LAYER SYSTEM ══════════════════════ */}
      <ExplodedArchitecture />

      {/* ══════════════════════ CHAPTER FOUR — COVERAGE WHERE IT MATTERS ══════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center bg-[#F3ECE2]/40 border-y border-[#3a2a22]/8 py-10 sm:py-12">

        {/* ── Protection atmosphere: warm amber shield glow right, secondary left ── */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-[-8%] top-[-12%] h-[70%] w-[58%] rounded-full bg-[radial-gradient(circle,rgba(199,102,0,0.11)_0%,rgba(210,138,61,0.05)_38%,transparent_64%)] blur-3xl" />
          <div className="absolute left-[-6%] bottom-[-10%] h-[52%] w-[44%] rounded-full bg-[radial-gradient(circle,rgba(246,199,122,0.08),transparent_65%)] blur-2xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(199,102,0,0.04),transparent)]" />
        </div>

        <div className="mx-auto max-w-[1340px] w-full px-5 sm:px-8">
          {/* Header — headline, centered */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 1.1, ease: ease.smooth }}
            className="mb-6 lg:mb-8 text-center"
          >
            <h2
              className="font-display leading-[1.04] tracking-tight whitespace-nowrap"
              style={{ fontSize: "clamp(1.5rem, 3.6vw, 3rem)" }}
            >
              Coverage where it{" "}
              <span className="italic font-light text-[#c76600]">matters most.</span>
            </h2>
          </motion.div>

          {/* Body — text left, image right */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 1.1, delay: 0.1, ease: ease.smooth }}
              className="max-w-xl"
            >
              <div className="space-y-5 text-[1rem] md:text-[1.0625rem] text-[#7b6a5f] font-light leading-[1.75]">
                <p>Protection is only effective where it is present.</p>
                <p>
                  Soliva is intentionally shaped to provide coverage across the areas most commonly
                  exposed during commuting, outdoor activity, and everyday movement—including the
                  face, nose, ears, neck, shoulders, and upper back.
                </p>
              </div>
              <p className="mt-6 font-display italic text-[#3a2a22]/70 text-[1.05rem] md:text-[1.15rem] leading-[1.6]">
                Unlike makeshift coverings that shift, slip, or leave gaps throughout the day,
                Soliva is designed to stay comfortable while providing consistent coverage where it
                matters most.
              </p>
            </motion.div>

            <CoverageFigure />
          </div>
        </div>
      </section>

      {/* ══════════════════════ EPILOGUE — EXPLORE THE COLLECTION ══════════════════════ */}
      <section className="relative flex items-center bg-[#2a1d16] text-[#FAF7F3] overflow-hidden py-24 sm:py-32">

        {/* ── Enhanced dark section atmosphere ── */}
        {/* Primary centre bloom — boosted from 0.06 to 0.11 */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,rgba(245,130,13,0.11),transparent_60%)]" />
        {/* Warm side fills — asymmetric depth */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_65%,rgba(217,178,122,0.06),transparent_50%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_82%_35%,rgba(199,102,0,0.05),transparent_48%)]" />
        {/* diagonal light shaft */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(217,178,122,0.04)_0%,transparent_50%)]" />

        <div className="relative z-10 mx-auto max-w-[1340px] w-full px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 1, delay: 0.3 }}
            className="flex justify-center"
          >
            <Link
              to="/collection"
              className="px-12 py-5 rounded-full bg-[#FAF7F3] text-[#3a2a22] font-mono text-[0.625rem] tracking-[0.32em] uppercase font-bold transition-[transform,background-color] duration-300 hover:bg-[#d9b27a] hover:-translate-y-0.5"
            >
              Explore the Collection
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
