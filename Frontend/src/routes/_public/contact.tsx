import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Mail,
  HelpCircle,
  Copy,
  Check,
  CheckCircle2,
  Send,
  Clock,
  Calendar,
  Shield,
  Lock,
  BadgeCheck
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useSession } from "@/features/auth/hooks/useSession";

export const Route = createFileRoute("/_public/contact")({
  component: ContactPage,
});

const WHATSAPP_URL = "https://wa.me/919479737209";
const SUPPORT_EMAIL = "admin@solivaguard.com";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

function ContactPage() {
  const session = useSession();
  const [copied, setCopied] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    orderNumber: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Logged-in users contact us from their account: name, email and the phone
  // captured at registration are prefilled. Email + phone are locked so the
  // team always gets verified, reply-able contact details.
  const isLoggedIn = !!session?.user;
  const emailLocked = isLoggedIn && !!session?.user?.email;
  const phoneLocked = isLoggedIn && !!session?.user?.phoneNumber;

  useEffect(() => {
    if (!session?.user) return;
    setFormState((prev) => ({
      ...prev,
      name: prev.name || session.user.name || "",
      email: session.user.email || prev.email,
      phone: session.user.phoneNumber || prev.phone,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/contact", {
        name: formState.name,
        email: formState.email,
        phone: formState.phone,
        subject: formState.subject,
        orderNumber: formState.orderNumber,
        message: formState.message,
      });
      setSent(true);
      // Preserve account-bound identity fields on reset so a follow-up message
      // keeps the prefilled (locked) name/email/phone.
      setFormState((prev) => ({
        name: isLoggedIn ? prev.name : "",
        email: isLoggedIn ? prev.email : "",
        phone: isLoggedIn ? prev.phone : "",
        orderNumber: "",
        subject: "",
        message: "",
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F3EE] pt-32 pb-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        
        {/* SECTION 1 — Hero */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-20"
        >
          <h1 className="font-display text-5xl md:text-6xl text-brown-deep mb-6 tracking-tight">
            We're Here to Help
          </h1>
          <p className="text-ink-muted text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Whether you have a question about our products, an order, or just want to say hello, our team is ready to assist you.
          </p>
        </motion.section>

        {/* SECTION 2 — Contact Options Grid */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 max-w-5xl mx-auto"
        >
          {/* WhatsApp */}
          <motion.div variants={fadeInUp} className="group relative bg-white p-8 rounded-3xl border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mb-6 text-[#25D366]">
              <MessageCircle size={24} />
            </div>
            <h3 className="font-display text-xl text-brown-deep mb-2">WhatsApp Support</h3>
            <p className="text-ink-muted text-sm mb-6 font-light leading-relaxed">Fast response for product queries and immediate help.</p>
            <a 
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#c76600] group-hover:gap-3 transition-all"
            >
              Start Chat 
              <span className="text-lg">→</span>
            </a>
          </motion.div>

          {/* Email */}
          <motion.div variants={fadeInUp} className="group relative bg-white p-8 rounded-3xl border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-[#c76600]/10 flex items-center justify-center mb-6 text-[#c76600]">
              <Mail size={24} />
            </div>
            <h3 className="font-display text-xl text-brown-deep mb-2">Email Support</h3>
            <div className="flex items-center justify-between bg-[#F7F3EE] px-3 py-2 rounded-xl mb-6">
              <span className="text-xs font-mono text-brown-deep">{SUPPORT_EMAIL}</span>
              <button onClick={handleCopyEmail} className="text-ink-muted hover:text-[#c76600] transition-colors">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
            <button 
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#c76600] group-hover:gap-3 transition-all"
            >
              Send Email
              <span className="text-lg">→</span>
            </button>
          </motion.div>

          {/* Support Center */}
          <motion.div variants={fadeInUp} className="group relative bg-white p-8 rounded-3xl border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-[#3a2a22]/10 flex items-center justify-center mb-6 text-[#3a2a22]">
              <HelpCircle size={24} />
            </div>
            <h3 className="font-display text-xl text-brown-deep mb-2">Support Center</h3>
            <p className="text-ink-muted text-sm mb-6 font-light leading-relaxed">Browse our help guides and frequently asked questions.</p>
            <Link
              to="/support"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#c76600] group-hover:gap-3 transition-all"
            >
              Explore Help
              <span className="text-lg">→</span>
            </Link>
          </motion.div>
        </motion.section>

        {/* SECTION 3 — Contact Form */}
        <div ref={formRef} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-display text-4xl text-brown-deep mb-6">Send us a Message</h2>
            <p className="text-ink-muted mb-8 font-light leading-relaxed">
              For more detailed inquiries or partnership requests, please fill out the form and our concierge team will reach out within 24 hours.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-brown-deep/70">
                <Clock size={20} className="text-[#c76600]" />
                <span className="text-sm font-medium">Response within 24 hours</span>
              </div>
              <div className="flex items-center gap-4 text-brown-deep/70">
                <Calendar size={20} className="text-[#c76600]" />
                <span className="text-sm font-medium">Monday — Friday, 9am — 6pm</span>
              </div>
              <div className="flex items-center gap-4 text-brown-deep/70">
                <Shield size={20} className="text-[#c76600]" />
                <span className="text-sm font-medium">Secure & encrypted communication</span>
              </div>
            </div>
          </motion.div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center bg-white p-10 md:p-12 rounded-[2.5rem] shadow-xl shadow-black/5"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="font-display text-2xl text-brown-deep mb-3">Your message reached us successfully!</h3>
              <p className="max-w-sm font-light leading-relaxed text-ink-muted">
                Thank you for reaching out. Our team will respond within 24 hours — a confirmation is on its way to your inbox.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-7 text-xs font-bold uppercase tracking-widest text-[#c76600] hover:underline"
              >
                Send another message
              </button>
            </motion.div>
          ) : (
          <motion.form
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            onSubmit={handleSubmit}
            className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-black/5 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-ink-muted/60 px-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formState.name}
                  onChange={e => setFormState({...formState, name: e.target.value})}
                  placeholder="John Doe"
                  className="w-full bg-[#F7F3EE] border-0 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#c76600]/20 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ink-muted/60 px-1">
                  Email Address
                  {emailLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 normal-case tracking-normal">
                      <BadgeCheck size={12} /> Verified
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    required
                    type="email"
                    value={formState.email}
                    readOnly={emailLocked}
                    onChange={e => !emailLocked && setFormState({...formState, email: e.target.value})}
                    placeholder="john@example.com"
                    className={`w-full border-0 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#c76600]/20 transition-all outline-none ${emailLocked ? "bg-[#efe7dd]/70 text-ink-muted cursor-not-allowed pr-11" : "bg-[#F7F3EE]"}`}
                  />
                  {emailLocked && <Lock size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted/50" />}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ink-muted/60 px-1">
                  Phone Number
                  {phoneLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 normal-case tracking-normal">
                      <BadgeCheck size={12} /> From your account
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={formState.phone}
                    readOnly={phoneLocked}
                    onChange={e => !phoneLocked && setFormState({...formState, phone: e.target.value.replace(/[^\d+\s-]/g, "")})}
                    placeholder="9876543210"
                    className={`w-full border-0 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#c76600]/20 transition-all outline-none ${phoneLocked ? "bg-[#efe7dd]/70 text-ink-muted cursor-not-allowed pr-11" : "bg-[#F7F3EE]"}`}
                  />
                  {phoneLocked && <Lock size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted/50" />}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-ink-muted/60 px-1">Subject</label>
                <select 
                  required
                  value={formState.subject}
                  onChange={e => setFormState({...formState, subject: e.target.value})}
                  className="w-full bg-[#F7F3EE] border-0 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#c76600]/20 transition-all outline-none appearance-none"
                >
                  <option value="">Select Topic</option>
                  <option value="Product Query">Product Query</option>
                  <option value="Shipping Status">Shipping Status</option>
                  <option value="Returns">Returns</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-ink-muted/60 px-1">Order # (Optional)</label>
              <input
                type="text"
                value={formState.orderNumber}
                onChange={e => setFormState({...formState, orderNumber: e.target.value})}
                placeholder="SOL-12345"
                className="w-full bg-[#F7F3EE] border-0 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#c76600]/20 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-ink-muted/60 px-1">Your Message</label>
              <textarea
                required
                rows={5}
                value={formState.message}
                onChange={e => setFormState({...formState, message: e.target.value})}
                placeholder="How can we help you?"
                className="w-full bg-[#F7F3EE] border-0 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#c76600]/20 transition-all outline-none resize-none"
              />
            </div>

            <button 
              disabled={isSubmitting}
              className="w-full bg-[#c76600] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#c76600]/20 hover:bg-[#a55500] hover:shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Send Message
                  <Send size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </>
              )}
            </button>
          </motion.form>
          )}
        </div>

        {/* SECTION 4 — Trust Footer */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-12 border-t border-black/5 text-center"
        >
          <p className="text-ink-muted font-light">
            Your journey matters to us. Our dedicated concierge team is committed to providing 
            <span className="text-brown-deep font-semibold"> the same level of care </span> 
            as our products themselves.
          </p>
        </motion.section>

      </div>
    </main>
  );
}
