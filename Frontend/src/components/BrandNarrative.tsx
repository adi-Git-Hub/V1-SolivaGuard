import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { viewportOnce, ease } from "@/design-system";
import {
  Instagram,
  Youtube,
  Linkedin,
  Facebook,
  Share2,
  MapPin,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { ParticleLogo } from "./ParticleLogo";
import { TermsAndConditions } from "./TermsAndConditions";

const socials = [
  {
    name: "Instagram",
    url: "https://www.instagram.com/solivaguard/",
    color: "#E1306C",
    icon: Instagram,
  },
  { name: "YouTube", url: "https://www.youtube.com/@SolivaGuard", color: "#FF0000", icon: Youtube },
  {
    name: "Facebook",
    url: "https://www.facebook.com/people/Soliva/61585231307391/",
    color: "#1877F2",
    icon: Facebook,
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/company/solivaguard/",
    color: "#0077B5",
    icon: Linkedin,
  },
  {
    name: "Pinterest",
    url: "https://in.pinterest.com/solivaguard/",
    color: "#BD081C",
    icon: Share2,
  },
];

const label =
  "font-mono text-[0.5625rem] tracking-[0.35em] text-[#c76600] uppercase font-black opacity-70";

/**
 * Tilt3D — wraps a link in a cursor-tracked 3D tilt. As the pointer moves over
 * the element it rotates in perspective toward the cursor and lifts slightly;
 * on leave it springs flat. Only enabled on hover-capable / fine-pointer
 * devices, so mobile taps stay clean and flat.
 */
function Tilt3D({
  children,
  className = "",
  intensity = 18,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 280, damping: 16 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), spring);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), spring);
  // Lift toward the viewer on hover for real depth (z translation in perspective).
  const z = useSpring(0, spring);

  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <motion.div
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerEnter={() => z.set(60)}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
        z.set(0);
      }}
      whileHover={{ scale: 1.18 }}
      style={{ rotateX, rotateY, z, transformPerspective: 600, transformStyle: "preserve-3d" }}
      className={`${className} transition-[filter] duration-300 hover:drop-shadow-[0_14px_26px_rgba(199,102,0,0.45)]`}
    >
      {children}
    </motion.div>
  );
}

export function BrandNarrative() {
  return (
    <div className="m-brand relative w-full bg-[#3a2a22] overflow-hidden z-10 lg:min-h-screen flex flex-col justify-center pt-[140px] pb-6 sm:pb-8">
      {/* Ambient depth */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(245,130,13,0.02),transparent_70%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 sm:px-8 w-full flex flex-col items-center">
        {/* 1. HEADLINE */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 1, ease: ease.smooth }}
          className="flex flex-col items-center text-center mb-2 lg:mb-3"
        >
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-[#c76600] text-xs">✦</span>
            <span className="font-mono text-[0.7rem] tracking-[0.4em] text-[#c76600] uppercase font-black">
              ABOUT SOLIVA
            </span>
          </div>
          <h2
            className="font-display text-white tracking-tight leading-[1.1]"
            style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)" }}
          >
            Thoughtful Protection,{" "}
            <span className="italic text-[#c76600]/90 font-light">Engineered For Real Life.</span>
          </h2>
        </motion.div>

        {/* 2. LOGO (Increased Focal Point) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 1.3, ease: ease.smooth }}
          className="w-full flex items-center justify-center mb-4 lg:mb-5"
        >
          <div className="relative w-full max-w-[600px] lg:max-w-[900px] h-[35vh] lg:h-[40vh] max-h-[600px] mx-auto">
            <ParticleLogo color="#e3c187" />
          </div>
        </motion.div>

        {/* Interaction hint — mobile only (desktop reacts to mouse hover, so it
            needs no prompt; phones react to touch and benefit from the nudge). */}
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 1, delay: 0.3 }}
          className="md:hidden -mt-1 mb-5 flex items-center gap-2 font-mono text-[0.5rem] tracking-[0.32em] uppercase text-white/35"
        >
          <span className="text-[#c76600]">✦</span>
          Touch the logo to interact
        </motion.span>

        {/* 3. SOCIAL/CONTACT ACTIONS */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 1, delay: 0.2, ease: ease.smooth }}
          className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 mb-6 w-full"
        >
          {/* Action — WhatsApp */}
          <div className="flex flex-col items-center gap-2">
            <span className={label}>Connect</span>
            <Tilt3D>
              <a href="https://wa.me/917350640608" className="group flex flex-col items-center">
                <div className="flex items-center gap-2.5 text-white/85 group-hover:text-[#c76600] transition-colors duration-500 font-mono text-[1rem] md:text-[1.1rem] tracking-[0.2em] font-black uppercase">
                  <MessageCircle
                    size={18}
                    className="text-[#25D366] opacity-70 group-hover:opacity-100"
                  />
                  WhatsApp
                </div>
                <div className="h-px w-full bg-white/15 mt-1.5 group-hover:bg-[#c76600] transition-colors" />
              </a>
            </Tilt3D>
          </div>

          {/* Presence — Socials */}
          <div className="flex flex-col items-center gap-2">
            <span className={label}>Presence</span>
            <div className="flex items-center gap-5">
              {socials.map((s) => (
                <Tilt3D key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    className="group relative flex items-center justify-center"
                  >
                    <span
                      className="text-white/45 group-hover:text-[var(--hc)] transition-all duration-500 scale-100 md:scale-110"
                      style={{ "--hc": s.color } as React.CSSProperties}
                    >
                      <s.icon size={19} strokeWidth={1.5} />
                    </span>
                  </a>
                </Tilt3D>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 4. BRAND STATEMENT */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 1, delay: 0.4, ease: ease.smooth }}
          className="max-w-2xl text-center mb-4"
        >
          <p className="text-[0.9rem] md:text-[1rem] text-white/85 font-light leading-relaxed font-display italic px-4">
            Soliva was born from a simple observation: Indian movement is constant exposure. We
            noticed that protection hadn’t evolved alongside the streets it was built for.
          </p>
        </motion.div>

        {/* Brand etymology (amber) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 1.2, delay: 0.6 }}
          className="flex items-center justify-center gap-4 font-mono text-[10px] md:text-[11px] tracking-[0.22em] uppercase text-[#f59e0b] leading-none mb-6"
        >
          <span>
            <span className="font-bold opacity-70">Sol</span> — Sun
          </span>
          <span className="h-3 w-px bg-[#f59e0b]/20" aria-hidden />
          <span>
            <span className="font-bold opacity-70">Iva</span> — Motion
          </span>
        </motion.div>

        {/* 5. ADDRESS & LEGAL (Bottom Area) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 1, delay: 0.8, ease: ease.smooth }}
          className="w-full border-t border-white/5 pt-4 flex flex-col items-center gap-4"
        >
          {/* Identity/Address */}
          <div className="flex flex-col items-center text-center space-y-1">
            <h4 className="font-display text-sm md:text-base text-white/90 tracking-wide">
              Solivaguard Private Limited
            </h4>
            <div className="flex items-start justify-center gap-2 text-white/40 max-w-sm">
              <MapPin size={10} className="text-[#c76600] mt-0.5 shrink-0 opacity-40" />
              <p className="font-mono text-[0.55rem] tracking-[0.12em] leading-relaxed uppercase">
                D-12 Shourya Estate, Pipla, Nagpur 440034, MH India
              </p>
            </div>
          </div>

          {/* Terms & Conditions (The long text block) */}
          <TermsAndConditions
            variant="dark"
            className="mx-auto max-w-2xl text-center opacity-85 text-[0.7rem]"
          />

          {/* Legal Bar */}
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-2 opacity-30 font-mono text-[0.45rem] tracking-[0.45em] uppercase text-white pt-1.5">
            <div className="flex items-center gap-4">
              <span>© 2026 SOLIVA</span>
              <span>Sun · Motion</span>
            </div>
            <span className="hidden md:inline-block">
              By using Soliva you agree to our Terms & Conditions.
            </span>
            <span>Engineered in India</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
