import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { viewportOnce, ease } from "@/design-system";

/* ════════════════════════════════════════════════════════════════════════
   SOLIVA · TECHNOLOGY VISUAL SYSTEM
   Environmental 3D storytelling — sun, wind, dust, protection.
   Palette: cream #FAF7F3 · brown #3a2a22 · orange #c76600 · bronze #d9b27a
            sun-amber #B88445/#D28A3D/#F6C77A · wind-blue #60A5FA/#93C5FD/#BFDBFE
   ════════════════════════════════════════════════════════════════════════ */

const ORANGE = "#c76600";
const BRONZE = "#d9b27a";
const BLUE   = "#60A5FA";  // wind / air
const AMBER  = "#D28A3D";  // sun / heat

/* ── small caption used under every visual ── */
function VisualCaption({
  children,
  tone = "warm",
}: {
  children: React.ReactNode;
  tone?: "warm" | "dark";
}) {
  const c    = tone === "dark" ? "text-white/40" : "text-[#3a2a22]/45";
  const rule = tone === "dark" ? "bg-[#d9b27a]/40" : "bg-[#c76600]/40";
  return (
    <figcaption className="mt-5 flex items-start gap-3">
      <span className={`mt-2 block h-px w-6 ${rule} flex-shrink-0`} />
      <p className={`font-mono text-[0.625rem] tracking-[0.2em] uppercase leading-[1.7] ${c}`}>
        {children}
      </p>
    </figcaption>
  );
}

/* ── Floating amber sun particles — CSS only, GPU-composited ── */
function SunParticles() {
  const pts = [
    { l: "14%", b: "18%", s: 2.5, d: 0,    dur: 4.2 },
    { l: "28%", b: "30%", s: 1.8, d: 0.9,  dur: 3.6 },
    { l: "44%", b: "14%", s: 3,   d: 1.6,  dur: 5.0 },
    { l: "58%", b: "36%", s: 2,   d: 0.4,  dur: 4.5 },
    { l: "70%", b: "22%", s: 1.5, d: 2.0,  dur: 3.9 },
    { l: "82%", b: "28%", s: 2.8, d: 1.2,  dur: 4.7 },
  ];
  return (
    <>
      <style>{`
        @keyframes sol-float {
          0%   { transform: translateY(0)    scale(1);   opacity: 0.55; }
          50%  { transform: translateY(-44px) scale(0.75); opacity: 0.28; }
          100% { transform: translateY(-88px) scale(0.4);  opacity: 0; }
        }
      `}</style>
      {pts.map((p, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            left: p.l,
            bottom: p.b,
            width: `${p.s}px`,
            height: `${p.s}px`,
            borderRadius: "50%",
            background: AMBER,
            animation: `sol-float ${p.dur}s ease-in-out ${p.d}s infinite`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

/* ── Floating dust particles — CSS only ── */
function DustParticles({ count = 8 }: { count?: number }) {
  return (
    <>
      <style>{`
        @keyframes sol-dust {
          0%   { transform: translate(0,    0)   scale(1);   opacity: 0; }
          15%  { opacity: 0.45; }
          70%  { opacity: 0.2; }
          100% { transform: translate(36px, -28px) scale(0.5); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            left:   `${8 + i * 11}%`,
            top:    `${20 + ((i * 17) % 60)}%`,
            width:  `${1.2 + (i % 3) * 0.6}px`,
            height: `${1.2 + (i % 3) * 0.6}px`,
            borderRadius: "50%",
            background: BRONZE,
            animation: `sol-dust ${3.5 + (i % 4) * 0.7}s ease-in-out ${i * 0.55}s infinite`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   CHAPTER 1 — WARM SUNLIGHT  (calm environmental opening)
   Concentric sun arcs + rays, volumetric glow bloom, floating particles.
   ════════════════════════════════════════════════════════════════════════ */
export function SunlightVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const glowY = useTransform(scrollYProgress, [0, 1], [-26, 26]);
  const arcsY = useTransform(scrollYProgress, [0, 1], [14, -14]);
  const bloom2Y = useTransform(scrollYProgress, [0, 1], [-14, 22]);

  const cx = 360;
  const cy = 132;
  const rays = Array.from({ length: 14 }, (_, i) => {
    const a = Math.PI * (0.48 + (i / 13) * 1.04);
    return { x2: cx + Math.cos(a) * 340, y2: cy + Math.sin(a) * 340 };
  });

  return (
    <figure ref={ref} className="relative w-full">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.25rem] border border-[#3a2a22]/8 bg-gradient-to-b from-[#FBEFD9] via-[#F5E4C6] to-[#EDE0CE]">

        {/* ── deep volumetric glow — primary ── */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-14 right-[-16%] h-[78%] w-[78%] rounded-full"
          style={{
            y: glowY,
            background: "radial-gradient(circle, rgba(210,138,61,0.58) 0%, rgba(245,130,13,0.22) 38%, transparent 68%)",
            filter: "blur(2px)",
          }}
        />

        {/* ── secondary bloom — deeper, cooler amber ── */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-6 right-[10%] h-[55%] w-[55%] rounded-full"
          style={{
            y: bloom2Y,
            background: "radial-gradient(circle, rgba(246,199,122,0.35) 0%, rgba(184,132,69,0.10) 50%, transparent 72%)",
            filter: "blur(8px)",
          }}
        />

        {/* ── light shaft — diagonal crepuscular ray ── */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(135deg, rgba(246,199,122,0.13) 0%, transparent 55%)",
          }}
        />

        {/* ── SVG: rays, arcs, sun core, silhouette ── */}
        <motion.svg
          viewBox="0 0 420 525"
          className="absolute inset-0 h-full w-full"
          style={{ y: arcsY }}
          fill="none"
        >
          {rays.map((r, i) => (
            <motion.line
              key={i}
              x1={cx} y1={cy} x2={r.x2} y2={r.y2}
              stroke={AMBER}
              strokeWidth={i % 3 === 0 ? 1.4 : 0.9}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: i % 3 === 0 ? 0.30 : 0.18 }}
              viewport={viewportOnce}
              transition={{ duration: 1.6, delay: 0.15 + i * 0.055, ease: ease.smooth }}
            />
          ))}

          {[46, 86, 128, 176, 224].map((r, i) => (
            <motion.circle
              key={r} cx={cx} cy={cy} r={r}
              stroke={i < 2 ? ORANGE : AMBER}
              strokeWidth={i === 0 ? 2 : 0.9}
              opacity={0.5 - i * 0.08}
              initial={{ scale: 0.6, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 0.5 - i * 0.08 }}
              viewport={viewportOnce}
              transition={{ duration: 1.3, delay: 0.12 + i * 0.13, ease: ease.luxe }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          ))}

          {/* sun core — bright + halo */}
          <motion.circle
            cx={cx} cy={cy} r={36}
            fill={AMBER} fillOpacity={0.14}
            initial={{ scale: 0 }} whileInView={{ scale: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 0.9, delay: 0.1 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          <motion.circle
            cx={cx} cy={cy} r={22}
            fill={ORANGE}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 0.95 }}
            viewport={viewportOnce}
            transition={{ duration: 1, delay: 0.1, ease: ease.luxe }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />

          {/* calm silhouette */}
          <motion.path
            d="M150 525 Q150 470 165 452 Q150 442 152 418 Q155 396 178 396 Q201 396 204 418 Q206 442 191 452 Q206 470 206 525 Z"
            fill="#3a2a22" opacity={0.14}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 0.14, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 1.2, delay: 0.5, ease: ease.smooth }}
          />
        </motion.svg>

        {/* ── ambient floating particles ── */}
        <SunParticles />

        {/* ── warm haze at bottom ── */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-[#EFE2D2]/80 to-transparent" />

        {/* ── upper heat haze ── */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[22%] bg-gradient-to-b from-[#F6C77A]/18 to-transparent" />

        <span className="absolute bottom-6 left-6 font-mono text-[0.5625rem] tracking-[0.3em] uppercase text-[#3a2a22]/45 font-bold">
          08:14 · Morning Light
        </span>

        {/* ── temperature badge ── */}
        <div className="absolute top-5 right-5 flex items-center gap-1.5 rounded-full border border-[#D28A3D]/25 bg-[#F6C77A]/15 px-2.5 py-1 backdrop-blur-sm">
          <span className="font-mono text-[0.52rem] tracking-[0.18em] uppercase font-bold text-[#B88445]">38°C · UV 9</span>
        </div>
      </div>
      <VisualCaption>Warm exposure · the everyday environment Soliva is built for</VisualCaption>
    </figure>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   CHAPTER 2 — UPF 50+ PROTECTION RINGS
   Layered fabric rings deflecting incoming UV. Glassmorphism shield.
   ════════════════════════════════════════════════════════════════════════ */
export function ProtectionRings() {
  const cx = 240;
  const cy = 240;
  const beams = [-0.18, 0.0, 0.18, 0.36].map((off) => {
    const angle = Math.PI * (0.78 + off);
    const sx = cx + Math.cos(angle) * 250;
    const sy = cy + Math.sin(angle) * 250;
    const hx = cx + Math.cos(angle) * 152;
    const hy = cy + Math.sin(angle) * 152;
    return { sx, sy, hx, hy };
  });

  return (
    <figure className="relative w-full">
      {/* glassmorphism glow behind the card */}
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_50%,rgba(199,102,0,0.18),transparent_65%)] blur-2xl" />

      <div className="relative aspect-square w-full max-w-[30rem] mx-auto overflow-hidden rounded-[2.25rem] border border-[#c76600]/14 bg-gradient-to-br from-[#F4ECE0] to-[#EDE3D2] shadow-[0_20px_60px_-20px_rgba(199,102,0,0.22)]">

        {/* inner glow pulse */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(199,102,0,0.10),transparent_55%)]" />

        <svg viewBox="0 0 480 480" className="absolute inset-0 h-full w-full" fill="none">
          {/* UV beams */}
          {beams.map((b, i) => (
            <g key={i}>
              <motion.line
                x1={b.sx} y1={b.sy} x2={b.hx} y2={b.hy}
                stroke={ORANGE}
                strokeWidth={1.4} strokeDasharray="4 5"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.55 }}
                viewport={viewportOnce}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.12, ease: ease.smooth }}
              />
              <motion.circle
                cx={b.hx} cy={b.hy} r={4}
                fill={ORANGE}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 0.85 }}
                viewport={viewportOnce}
                transition={{ duration: 0.5, delay: 0.9 + i * 0.12, ease: ease.luxe }}
                style={{ transformOrigin: `${b.hx}px ${b.hy}px` }}
              />
              {/* deflection ripple */}
              <motion.circle
                cx={b.hx} cy={b.hy} r={10}
                stroke={ORANGE} strokeWidth={0.8} strokeOpacity={0.4}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1.4, opacity: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.8, delay: 1.0 + i * 0.12 }}
                style={{ transformOrigin: `${b.hx}px ${b.hy}px` }}
              />
            </g>
          ))}

          {/* concentric fabric layers */}
          {[150, 116, 84].map((r, i) => (
            <motion.circle
              key={r} cx={cx} cy={cy} r={r}
              stroke="#3a2a22"
              strokeOpacity={0.16 + i * 0.06}
              strokeWidth={i === 0 ? 1.4 : 1}
              strokeDasharray={i === 0 ? "2 6" : undefined}
              initial={{ scale: 0.5, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={viewportOnce}
              transition={{ duration: 1, delay: 0.2 + i * 0.14, ease: ease.luxe }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          ))}

          {/* glass shield — protected core */}
          <motion.circle
            cx={cx} cy={cy} r={60}
            fill={ORANGE} fillOpacity={0.12}
            stroke={ORANGE} strokeWidth={1.8}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 0.9, delay: 0.5, ease: ease.luxe }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          {/* inner core dot */}
          <motion.circle
            cx={cx} cy={cy} r={22}
            fill={ORANGE} fillOpacity={0.22}
            initial={{ scale: 0 }} whileInView={{ scale: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7, delay: 0.65 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        </svg>

        {/* center label */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, delay: 0.7, ease: ease.luxe }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <span className="font-display text-[1.7rem] leading-none text-[#3a2a22]">UPF 50+</span>
          <span className="mt-1.5 font-mono text-[0.5rem] tracking-[0.24em] uppercase text-[#c76600] font-bold">
            &lt; 2% UV transmitted
          </span>
        </motion.div>

        <span className="absolute top-6 left-6 font-mono text-[0.5625rem] tracking-[0.28em] uppercase text-[#3a2a22]/45 font-bold">
          UV ↘
        </span>
      </div>
      <VisualCaption>Protection woven into the fabric — UV deflected before it reaches skin</VisualCaption>
    </figure>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   CHAPTER 3 — AIRFLOW SYSTEM  (scroll-linked breathable cross-section)
   Wind paths: COOL BLUE. Heat: amber. Split atmosphere.
   ════════════════════════════════════════════════════════════════════════ */
export function AirflowSystem() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const flow     = useTransform(scrollYProgress, [0, 1], [240, -240]);
  const flowFast = useTransform(scrollYProgress, [0, 1], [180, -180]);
  const heatRise = useTransform(scrollYProgress, [0, 1], [10, -16]);

  const airPaths = [
    "M40 250 C 160 250, 200 150, 360 150 S 560 250, 690 250",
    "M40 195 C 170 195, 220 110, 360 110 S 580 195, 690 195",
    "M40 300 C 150 300, 210 360, 360 360 S 560 300, 690 300",
  ];

  return (
    <figure ref={ref} className="relative w-full">
      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-[2.25rem] border border-[#3a2a22]/8 bg-gradient-to-br from-[#F5EEE3] to-[#ECE2D2]">

        {/* ── cool air atmosphere — left ingress ── */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[38%] bg-[radial-gradient(ellipse_at_left_center,rgba(96,165,250,0.10),transparent_70%)]" />

        {/* ── heat atmosphere — right egress ── */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-[radial-gradient(ellipse_at_right_center,rgba(210,138,61,0.10),transparent_70%)]" />

        {/* ── directional divider ── */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#3a2a22]/8 to-transparent" />

        <svg viewBox="0 0 720 360" className="absolute inset-0 h-full w-full" fill="none">
          {/* fabric layers (cross-section) */}
          {[
            { y: 70, label: "OUTER" },
            { y: 175, label: "MID" },
            { y: 280, label: "INNER" },
          ].map((layer, i) => (
            <motion.g
              key={layer.label}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.9, delay: i * 0.12, ease: ease.smooth }}
            >
              <rect
                x={36} y={layer.y} width={648} height={26} rx={13}
                fill="#3a2a22" fillOpacity={0.05}
                stroke="#3a2a22" strokeOpacity={0.12}
              />
              {Array.from({ length: 22 }, (_, k) => (
                <circle key={k} cx={56 + k * 28} cy={layer.y + 13} r={1.4}
                  fill="#3a2a22" fillOpacity={0.18} />
              ))}
            </motion.g>
          ))}

          {/* ── BLUE airflow paths — wind is cool blue ── */}
          {airPaths.map((d, i) => (
            <motion.path
              key={i} d={d}
              stroke={BLUE}
              strokeWidth={i === 1 ? 2 : 1.6}
              strokeOpacity={i === 1 ? 0.65 : 0.45}
              strokeDasharray="6 12"
              strokeLinecap="round"
              style={{ strokeDashoffset: i === 1 ? flowFast : flow }}
            />
          ))}

          {/* ── blue particle dots on midline path ── */}
          {[120, 240, 360, 480, 600].map((cx, i) => {
            const py = [195, 165, 110, 165, 195][i];
            return (
              <motion.circle
                key={cx} cx={cx} cy={py} r={2.8}
                fill={BLUE} fillOpacity={0.6}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 0.6, scale: 1 }}
                viewport={viewportOnce}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                style={{ transformOrigin: `${cx}px ${py}px` }}
              />
            );
          })}

          {/* ── heat escaping upward — amber ── */}
          {[200, 330, 470, 560].map((x, i) => (
            <motion.g key={x} style={{ y: heatRise }} opacity={0.45}>
              <path
                d={`M${x} 60 q -6 -10 0 -20 q 6 -10 0 -20`}
                stroke={AMBER} strokeWidth={1.6} strokeLinecap="round" fill="none"
              />
            </motion.g>
          ))}

          {/* flow direction arrow — blue */}
          <motion.path
            d="M676 250 l 10 0 m -4 -4 l 4 4 l -4 4"
            stroke={BLUE} strokeWidth={1.8} fill="none"
            initial={{ opacity: 0 }} whileInView={{ opacity: 0.8 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6, delay: 0.6 }}
          />
        </svg>

        {/* ── labels ── */}
        <div className="absolute left-6 top-5 flex flex-col gap-[1.15rem] font-mono text-[0.5rem] tracking-[0.22em] uppercase text-[#3a2a22]/40 font-bold pointer-events-none">
          <span>Outer · shields</span>
          <span>Mid · airflow</span>
          <span>Inner · soft</span>
        </div>

        {/* air in tag — blue */}
        <div className="absolute top-5 left-1/4 -translate-x-1/2 flex items-center gap-1 rounded-full border border-blue-200/50 bg-blue-50/60 px-2 py-0.5 backdrop-blur-sm pointer-events-none">
          <span className="font-mono text-[0.48rem] tracking-[0.18em] uppercase font-bold text-blue-500">Air in</span>
        </div>

        {/* heat out tag — amber */}
        <div className="absolute top-5 right-6 flex items-center gap-1 rounded-full border border-[#D28A3D]/30 bg-[#F6C77A]/20 px-2 py-0.5 backdrop-blur-sm pointer-events-none">
          <span className="font-mono text-[0.48rem] tracking-[0.18em] uppercase font-bold text-[#B88445]">Heat out</span>
        </div>

        <span className="absolute bottom-5 right-6 font-mono text-[0.5625rem] tracking-[0.26em] uppercase text-[#c76600]/80 font-bold">
          Air in → heat out
        </span>
      </div>
      <VisualCaption>A breathable system — air moves through the weave while heat escapes</VisualCaption>
    </figure>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   CHAPTER 4 — COVERAGE FIGURE  (scroll-driven progressive zone activation)
   Enhanced with glassmorphism shield + pulsing zone rings.
   ════════════════════════════════════════════════════════════════════════ */
const ZONES = [
  { no: "01", name: "Face",      x: 250, y: 150, lx: 70, ly: 120 },
  { no: "02", name: "Nose",      x: 268, y: 168, lx: 70, ly: 175 },
  { no: "03", name: "Ears",      x: 214, y: 158, lx: 70, ly: 230 },
  { no: "04", name: "Neck",      x: 244, y: 232, lx: 70, ly: 285 },
  { no: "05", name: "Shoulders", x: 250, y: 300, lx: 70, ly: 340 },
  { no: "06", name: "Back",      x: 196, y: 290, lx: 70, ly: 395 },
];

export function CoverageFigure() {
  const inView = { once: true, amount: 0.35 } as const;

  return (
    <div className="flex justify-center lg:justify-end">
      <motion.figure
        initial={{ opacity: 0, y: 60, scale: 0.84, rotateX: 10 }}
        whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        viewport={inView}
        transition={{ duration: 1.4, ease: ease.luxe }}
        style={{ transformPerspective: 1100 }}
        className="relative w-full max-w-[20rem] lg:max-w-[21rem]"
      >
        {/* ── deep ambient glow behind the figure ── */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={inView}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem]"
          style={{ background: "radial-gradient(circle at 50% 38%, rgba(199,102,0,0.28), rgba(210,138,61,0.12) 38%, transparent 65%)", filter: "blur(20px)" }}
        />

        {/* ── secondary softer glow ── */}
        <div aria-hidden className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.8rem]" style={{ background: "radial-gradient(circle at 50% 50%, rgba(246,199,122,0.14), transparent 62%)", filter: "blur(12px)" }} />

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.25rem] border border-[#c76600]/16 bg-gradient-to-b from-[#F4ECE0] to-[#E9DECB] shadow-[0_24px_64px_-24px_rgba(199,102,0,0.28)]">

          {/* ── glassmorphism shield overlay ── */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[2.25rem]"
            style={{
              background: "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 45%, transparent 70%)",
              backdropFilter: "blur(0.5px)",
            }}
          />

          <style>{`
            @keyframes shield-pulse {
              0%, 100% { opacity: 0.18; transform: scale(1); }
              50%       { opacity: 0.32; transform: scale(1.04); }
            }
          `}</style>

          <svg viewBox="0 0 420 525" className="absolute inset-0 h-full w-full" fill="none">
            {/* shield pulse ring */}
            <circle
              cx={236} cy={210} r={168}
              stroke={ORANGE} strokeWidth={1}
              strokeDasharray="3 8"
              style={{ animation: "shield-pulse 3.2s ease-in-out infinite", transformOrigin: "236px 210px" }}
            />

            {/* coverage aura */}
            <motion.circle
              cx={236} cy={210} r={150}
              fill={ORANGE}
              initial={{ opacity: 0 }} whileInView={{ opacity: 0.18 }}
              viewport={inView}
              transition={{ duration: 1, delay: 0.3 }}
            />

            {/* secondary warm aura */}
            <motion.circle
              cx={236} cy={210} r={108}
              fill={AMBER} fillOpacity={0.08}
              initial={{ scale: 0.7, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={inView}
              transition={{ duration: 1.1, delay: 0.4 }}
              style={{ transformOrigin: "236px 210px" }}
            />

            {/* stylized bust silhouette */}
            <path
              d="M236 70
                 c 42 0 66 30 66 70
                 c 0 26 -10 44 -24 56
                 c 22 8 34 18 40 40
                 c 8 30 10 70 12 118
                 l -188 0
                 c 2 -48 4 -88 12 -118
                 c 6 -22 18 -32 40 -40
                 c -14 -12 -24 -30 -24 -56
                 c 0 -40 24 -70 66 -70 Z"
              fill="#3a2a22" fillOpacity={0.09}
              stroke="#3a2a22" strokeOpacity={0.18} strokeWidth={1.2}
            />

            {/* coverage sweep arc */}
            <motion.path
              d="M170 96 q 66 -44 132 0 q 30 26 30 70 q 0 40 -20 64 q 26 12 34 40"
              stroke={ORANGE} strokeWidth={1.6} fill="none"
              initial={{ opacity: 0.18, pathLength: 0 }}
              whileInView={{ opacity: 0.55, pathLength: 1 }}
              viewport={inView}
              transition={{ duration: 1.1, delay: 0.3, ease: ease.luxe }}
            />

            {/* zone markers */}
            <motion.g
              initial="hidden" whileInView="visible"
              viewport={inView}
              variants={{ visible: { transition: { staggerChildren: 0.14, delayChildren: 0.4 } } }}
            >
              {ZONES.map((z) => (
                <motion.g
                  key={z.no}
                  variants={{ hidden: { opacity: 0, scale: 0.2 }, visible: { opacity: 1, scale: 1 } }}
                  transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ transformOrigin: `${z.x}px ${z.y}px` }}
                >
                  {/* outer glow halo */}
                  <circle cx={z.x} cy={z.y} r={22} fill={ORANGE} fillOpacity={0.07} />
                  {/* ring */}
                  <circle cx={z.x} cy={z.y} r={13}
                    fill={ORANGE} fillOpacity={0.16}
                    stroke={ORANGE} strokeOpacity={0.9} strokeWidth={1.4} />
                  {/* core dot */}
                  <circle cx={z.x} cy={z.y} r={2.6} fill={ORANGE} />
                </motion.g>
              ))}
            </motion.g>
          </svg>

          <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between">
            <span className="font-mono text-[0.5625rem] tracking-[0.26em] uppercase text-[#3a2a22]/45 font-bold">
              Coverage map
            </span>
            {/* shield label */}
            <div className="flex items-center gap-1 rounded-full border border-[#c76600]/25 bg-[#c76600]/10 px-2 py-0.5">
              <span className="font-mono text-[0.48rem] tracking-[0.14em] uppercase font-bold text-[#c76600]">Protected</span>
            </div>
          </div>
        </div>
        <VisualCaption>Every protected zone · front · side · back</VisualCaption>
      </motion.figure>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   CHAPTER 5 — ENVIRONMENT SYSTEM  (Heat · Dust · Pollution · Movement)
   Four forces — animated dust particles, heat shimmer.
   ════════════════════════════════════════════════════════════════════════ */
function ForceGlyph({ kind }: { kind: "heat" | "dust" | "pollution" | "movement" }) {
  const s = { stroke: BRONZE, strokeWidth: 1.4, fill: "none", strokeLinecap: "round" as const };
  if (kind === "heat")
    return (
      <svg viewBox="0 0 40 40" className="h-7 w-7">
        <path d="M12 27 q -5 -7 0 -14 q 5 -7 0 -13" {...s} />
        <path d="M20 27 q -5 -7 0 -14 q 5 -7 0 -13" {...s} />
        <path d="M28 27 q -5 -7 0 -14 q 5 -7 0 -13" {...s} />
      </svg>
    );
  if (kind === "dust")
    return (
      <svg viewBox="0 0 40 40" className="h-7 w-7">
        {[[12, 14],[24, 11],[30, 20],[16, 24],[26, 28],[10, 30],[20, 19]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 1.6 : 2.4} fill={BRONZE} fillOpacity={0.85} />
        ))}
      </svg>
    );
  if (kind === "pollution")
    return (
      <svg viewBox="0 0 40 40" className="h-7 w-7">
        <circle cx={16} cy={18} r={7} fill={BRONZE} fillOpacity={0.22} />
        <circle cx={25} cy={22} r={9} fill={BRONZE} fillOpacity={0.16} />
        <path d="M8 30 h 24" {...s} strokeOpacity={0.5} />
      </svg>
    );
  return (
    <svg viewBox="0 0 40 40" className="h-7 w-7">
      <path d="M6 14 h 22" {...s} />
      <path d="M6 21 h 28" {...s} />
      <path d="M6 28 h 18" {...s} />
      <path d="M30 21 l 5 0 m -4 -3 l 4 3 l -4 3" {...s} />
    </svg>
  );
}

const FORCES = [
  { kind: "heat",      label: "Heat",      note: "Peak sun hours" },
  { kind: "dust",      label: "Dust",      note: "Open roads" },
  { kind: "pollution", label: "Pollution", note: "Urban air" },
  { kind: "movement",  label: "Movement",  note: "Constant motion" },
] as const;

export function EnvironmentSystem() {
  return (
    <figure className="relative w-full">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 1, ease: ease.luxe }}
          className="flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-full border border-[#d9b27a]/30 bg-[#2a1d16] text-center shadow-[0_0_60px_-20px_rgba(217,178,122,0.4)]"
        >
          <span className="font-display text-sm text-[#FAF7F3] leading-tight">Protected</span>
          <span className="mt-1 font-mono text-[0.45rem] tracking-[0.22em] uppercase text-[#d9b27a]/70 font-bold">
            One system
          </span>
        </motion.div>
      </div>

      <div className="relative mx-auto grid max-w-[58rem] grid-cols-2 gap-3 sm:gap-4">
        {FORCES.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 0.9, delay: i * 0.12, ease: ease.luxe }}
            className={`relative flex flex-col gap-2 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 sm:p-7 overflow-hidden ${
              i === 0 ? "items-start"
              : i === 1 ? "items-end text-right"
              : i === 2 ? "items-start"
              : "items-end text-right"
            }`}
          >
            {/* per-card atmospheric accent */}
            {f.kind === "heat" && (
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(210,138,61,0.12),transparent_65%)]" />
            )}
            {f.kind === "dust" && <DustParticles count={6} />}
            {f.kind === "pollution" && (
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(217,178,122,0.08),transparent_60%)]" />
            )}
            {f.kind === "movement" && (
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(96,165,250,0.05)_0%,transparent_50%)]" />
            )}

            <ForceGlyph kind={f.kind} />
            <span className="font-display text-xl text-[#FAF7F3] relative z-10">{f.label}</span>
            <span className="font-mono text-[0.5625rem] tracking-[0.24em] uppercase text-white/40 font-bold relative z-10">
              {f.note}
            </span>
          </motion.div>
        ))}
      </div>

      <figcaption className="mt-6 text-center font-mono text-[0.625rem] tracking-[0.24em] uppercase text-white/40">
        Designed for real environments — not laboratory conditions
      </figcaption>
    </figure>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   EPILOGUE — LAYERED SIMPLIFICATION  (calm convergence into one line)
   ════════════════════════════════════════════════════════════════════════ */
export function LayeredEpilogue() {
  const layers = [0, 1, 2, 3, 4];
  return (
    <figure className="relative mx-auto w-full max-w-[40rem]">
      <svg viewBox="0 0 600 200" className="w-full" fill="none">
        {layers.map((i) => {
          const spread = 36 - i * 9;
          return (
            <motion.path
              key={i}
              d={`M40 ${100 - spread} C 200 ${100 - spread}, 400 ${100 - spread + spread * 0.5}, 560 100`}
              stroke={i === 0 ? "#3a2a22" : BRONZE}
              strokeOpacity={i === 0 ? 0.5 : 0.3 - i * 0.04}
              strokeWidth={i === 0 ? 1.6 : 1}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={viewportOnce}
              transition={{ duration: 1.6, delay: 0.15 * i, ease: ease.luxe }}
            />
          );
        })}
        <motion.line
          x1={40} y1={100} x2={560} y2={100}
          stroke={BRONZE} strokeWidth={1.4}
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.85 }}
          viewport={viewportOnce}
          transition={{ duration: 1.8, delay: 0.7, ease: ease.luxe }}
        />
      </svg>
      <figcaption className="mt-2 text-center font-mono text-[0.625rem] tracking-[0.26em] uppercase text-white/35">
        Many layers · one effortless experience
      </figcaption>
    </figure>
  );
}
