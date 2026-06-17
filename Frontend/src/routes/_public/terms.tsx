import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Bell,
  ClipboardList,
  Scale,
  Sun,
  Wind,
  Bike,
  Baby,
  Flame,
  Droplets,
  Ban,
  Package,
  Layers,
  ChevronDown,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/_public/terms")({
  component: TermsRoute,
  head: () => ({
    meta: [
      { title: "Terms, Privacy & Care — Soliva" },
      {
        name: "description",
        content:
          "Soliva's privacy policy, terms & conditions, protection guide, FAQ and care guide.",
      },
    ],
  }),
});

const ease = [0.22, 1, 0.36, 1] as const;
const viewportOnce = { once: true, margin: "-60px" } as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease },
  }),
};

const eyebrow =
  "font-mono text-[0.625rem] tracking-[0.4em] uppercase text-[#c76600] font-bold";

const collectItems = [
  "Name",
  "Mobile number",
  "Email address",
  "Delivery address",
  "Payment information (processed securely)",
];

const whyItems = [
  "Order processing",
  "Shipping updates",
  "Customer support",
  "Product communication",
  "Website improvement",
];

const termsItems = [
  { icon: ClipboardList, title: "Product Information", body: "We strive to ensure product information and visuals remain accurate." },
  { icon: Scale, title: "Pricing", body: "Prices may change without prior notice." },
  { icon: ShieldCheck, title: "Website Usage", body: "Users agree not to misuse website functionality." },
  { icon: Lock, title: "Intellectual Property", body: "All Soliva content, imagery, and branding belong to Soliva." },
  { icon: ShieldCheck, title: "Limitation of Liability", body: "Soliva shall not be responsible for delays beyond operational control." },
  { icon: Scale, title: "Governing Law", body: "Governed under Indian laws." },
];

const protectionSections = [
  { emoji: "☀", icon: Sun, title: "Sun Exposure Guide", body: "Protection works best before exposure begins — plan coverage around peak UV hours." },
  { emoji: "🌫", icon: Wind, title: "Dust & Pollution Awareness", body: "Shield your face from airborne dust and particulate matter on busy routes." },
  { emoji: "🛵", icon: Bike, title: "Daily Commute Protection Tips", body: "Consistent coverage for two-wheelers, walks, and stop-and-go traffic." },
  { emoji: "👶", icon: Baby, title: "Kids Outdoor Protection Tips", body: "Lightweight, breathable coverage built for active, growing routines." },
  { emoji: "🔥", icon: Flame, title: "Heat Exposure Awareness", body: "Stay cool and hydrated — breathable layers reduce trapped heat." },
];

const protectionTips = [
  "Prefer breathable protective layers",
  "Reduce prolonged direct exposure",
  "Prioritize consistent coverage",
  "Stay hydrated outdoors",
];

const faqs = [
  { q: "Is it suitable for daily commuting?", a: "Yes — SunWrap is engineered for daily commutes: lightweight, breathable, and stable through stop-and-go movement." },
  { q: "Can it be worn for long hours?", a: "Absolutely. The breathable weave is designed for eight-hour days in motion without trapping heat." },
  { q: "Is it suitable for summer conditions?", a: "Yes. It's purpose-built for Indian summers — heat, dust, and sustained UV exposure." },
  { q: "How should I wash it?", a: "Gentle hand or machine wash in cold water. Do not bleach, and air dry to preserve the fabric." },
  { q: "Is exchange available?", a: "Unused items in original condition can be exchanged within 14 days of delivery." },
];

const careItems = [
  { icon: Droplets, text: "Gentle wash recommended" },
  { icon: Ban, text: "Do not bleach" },
  { icon: Wind, text: "Air dry preferred" },
  { icon: Package, text: "Store clean and dry" },
  { icon: Layers, text: "Avoid prolonged folding under pressure" },
];

const navSections = [
  { id: "privacy", label: "Privacy" },
  { id: "terms", label: "Terms" },
  { id: "protection", label: "Protection Guide" },
  { id: "faq", label: "FAQ" },
  { id: "care", label: "Care Guide" },
];

function SectionHeading({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="mb-8"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-7 bg-[#c76600]/40" />
        <span className={eyebrow}>{kicker}</span>
      </div>
      <h2
        className="font-display tracking-tight text-[#3a2a22] leading-[1.1]"
        style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.5rem)" }}
      >
        {title}
      </h2>
      {sub && <p className="mt-3 max-w-[52ch] text-[0.95rem] font-light leading-relaxed text-[#7b6a5f]">{sub}</p>}
    </motion.div>
  );
}

function TermsRoute() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="relative w-full overflow-hidden bg-[#FAF7F3] text-[#3a2a22]">
      {/* ambient depth */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-[-6%] right-[-8%] h-[42%] w-[42%] rounded-full bg-[#c76600]/10 blur-[130px]" />
        <div className="absolute bottom-[10%] left-[-10%] h-[36%] w-[36%] rounded-full bg-[#d8b496]/15 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-5 pt-28 pb-24 sm:px-8 sm:pt-32">
        {/* ── HERO ── */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="mb-12"
        >
          <motion.div variants={fadeUp} className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-[#c76600]/50" />
            <span className={eyebrow}>Legal · Guides · Care</span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="font-display tracking-tight text-[#3a2a22] leading-[1.04]"
            style={{ fontSize: "clamp(2.4rem, 7vw, 4rem)" }}
          >
            Terms, Privacy &amp; <span className="italic font-light text-[#c76600]">Care.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 max-w-[56ch] text-[1rem] font-light leading-relaxed text-[#7b6a5f]">
            Everything that protects you — your data, your rights, and your SunWrap. Written plainly,
            built around everyday movement.
          </motion.p>
          <motion.p variants={fadeUp} className="mt-3 font-mono text-[0.7rem] tracking-wide text-[#3a2a22]/45">
            Last updated <time dateTime="2026-06-16">16 June 2026</time>
          </motion.p>

          {/* anchor nav */}
          <motion.nav variants={fadeUp} className="mt-8 flex flex-wrap gap-2.5">
            {navSections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-[#3a2a22]/12 bg-white/60 px-4 py-2 font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[#3a2a22]/70 transition-all duration-300 hover:border-[#c76600]/40 hover:bg-white hover:text-[#c76600] hover:shadow-[0_8px_18px_-12px_rgba(58,42,34,0.4)]"
              >
                {s.label}
              </a>
            ))}
          </motion.nav>
        </motion.header>

        {/* ════ PRIVACY POLICY ════ */}
        <section id="privacy" className="scroll-mt-28 mb-20">
          <SectionHeading kicker="01 — Privacy Policy" title="Your information, handled with care." />

          <div className="grid gap-5 sm:grid-cols-2">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewportOnce} custom={0}
              className="rounded-3xl border border-[#3a2a22]/8 bg-white/70 p-7 shadow-[0_18px_50px_-30px_rgba(58,42,34,0.4)] backdrop-blur-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#c76600]/10 text-[#c76600]"><ClipboardList size={17} /></span>
                <h3 className="font-display text-xl text-[#3a2a22]">Information We Collect</h3>
              </div>
              <ul className="space-y-2.5">
                {collectItems.map((it) => (
                  <li key={it} className="flex items-start gap-2.5 text-[0.9rem] font-light text-[#3a2a22]/80">
                    <Check size={15} className="mt-0.5 shrink-0 text-[#c76600]" strokeWidth={2.5} />
                    {it}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewportOnce} custom={1}
              className="rounded-3xl border border-[#3a2a22]/8 bg-white/70 p-7 shadow-[0_18px_50px_-30px_rgba(58,42,34,0.4)] backdrop-blur-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#c76600]/10 text-[#c76600]"><Bell size={17} /></span>
                <h3 className="font-display text-xl text-[#3a2a22]">Why We Collect It</h3>
              </div>
              <ul className="space-y-2.5">
                {whyItems.map((it) => (
                  <li key={it} className="flex items-start gap-2.5 text-[0.9rem] font-light text-[#3a2a22]/80">
                    <Check size={15} className="mt-0.5 shrink-0 text-[#c76600]" strokeWidth={2.5} />
                    {it}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewportOnce}
              className="flex items-start gap-4 rounded-3xl border border-[#3a2a22]/8 bg-[#3a2a22] p-7 text-[#FAF7F3]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#c76600]/20 text-[#c76600]"><Lock size={18} /></span>
              <div>
                <h3 className="font-display text-lg">Data Security</h3>
                <p className="mt-1.5 text-[0.88rem] font-light leading-relaxed text-[#FAF7F3]/70">
                  Your information is stored securely and is never sold to third parties.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewportOnce}
              className="flex items-start gap-4 rounded-3xl border border-[#3a2a22]/8 bg-white/70 p-7 backdrop-blur-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#c76600]/10 text-[#c76600]"><Bell size={18} /></span>
              <div>
                <h3 className="font-display text-lg text-[#3a2a22]">Communication Preference</h3>
                <p className="mt-1.5 text-[0.88rem] font-light leading-relaxed text-[#7b6a5f]">
                  Users may opt out of promotional communication anytime.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════ TERMS & CONDITIONS ════ */}
        <section id="terms" className="scroll-mt-28 mb-20">
          <SectionHeading kicker="02 — Terms & Conditions" title="The agreement, kept simple." />
          <div className="grid gap-4 sm:grid-cols-2">
            {termsItems.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                custom={i % 2}
                whileHover={{ y: -3 }}
                className="group rounded-2xl border border-[#3a2a22]/8 bg-white/60 p-6 backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(58,42,34,0.45)]"
              >
                <span className="mb-4 grid h-9 w-9 place-items-center rounded-full bg-[#c76600]/10 text-[#c76600] transition-colors group-hover:bg-[#c76600]/15">
                  <Icon size={16} />
                </span>
                <h3 className="font-display text-lg text-[#3a2a22]">{title}</h3>
                <p className="mt-1.5 text-[0.88rem] font-light leading-relaxed text-[#7b6a5f]">{body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ════ PROTECTION GUIDE ════ */}
        <section id="protection" className="scroll-mt-28 mb-20">
          <SectionHeading
            kicker="03 — Protection Guide"
            title="Thoughtful protection starts before exposure."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {protectionSections.map(({ emoji, icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                custom={i % 2}
                whileHover={{ y: -3 }}
                className="group flex items-start gap-4 rounded-2xl border border-[#3a2a22]/8 bg-white/60 p-6 backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(58,42,34,0.45)]"
              >
                <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#c76600]/15 to-[#c76600]/5 text-[#c76600]">
                  <Icon size={20} strokeWidth={1.8} />
                  <span aria-hidden className="absolute -top-1.5 -right-1.5 text-sm">{emoji}</span>
                </span>
                <div>
                  <h3 className="font-display text-lg leading-tight text-[#3a2a22]">{title}</h3>
                  <p className="mt-1.5 text-[0.86rem] font-light leading-relaxed text-[#7b6a5f]">{body}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* quick tips */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="mt-5 rounded-2xl border border-[#c76600]/15 bg-[#c76600]/[0.04] p-6"
          >
            <p className="mb-4 font-mono text-[0.625rem] font-bold uppercase tracking-[0.24em] text-[#c76600]">
              Quick Tips
            </p>
            <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {protectionTips.map((t) => (
                <div key={t} className="flex items-center gap-2.5 text-[0.9rem] font-medium text-[#3a2a22]/80">
                  <Check size={15} className="shrink-0 text-[#c76600]" strokeWidth={2.5} />
                  {t}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ════ FAQ ════ */}
        <section id="faq" className="scroll-mt-28 mb-20">
          <SectionHeading kicker="04 — FAQ" title="Questions, answered." />
          <div className="space-y-3">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <motion.div
                  key={f.q}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  className="overflow-hidden rounded-2xl border border-[#3a2a22]/8 bg-white/60 backdrop-blur-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="font-display text-[1.05rem] text-[#3a2a22]">{f.q}</span>
                    <motion.span
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ duration: 0.3, ease }}
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors ${open ? "bg-[#c76600] text-white" : "bg-[#3a2a22]/5 text-[#3a2a22]/60"}`}
                    >
                      <ChevronDown size={15} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease }}
                      >
                        <p className="px-6 pb-5 text-[0.92rem] font-light leading-relaxed text-[#7b6a5f]">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ════ CARE GUIDE ════ */}
        <section id="care" className="scroll-mt-28">
          <SectionHeading kicker="05 — Care Guide" title="Keep it at its best." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {careItems.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                custom={i % 3}
                className="flex items-center gap-3.5 rounded-2xl border border-[#3a2a22]/8 bg-white/60 p-5 backdrop-blur-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#c76600]/10 text-[#c76600]">
                  <Icon size={17} strokeWidth={1.9} />
                </span>
                <span className="text-[0.9rem] font-medium leading-snug text-[#3a2a22]/80">{text}</span>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
