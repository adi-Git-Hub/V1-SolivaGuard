import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, MessageCircle, Mail, HelpCircle, Copy, Check, X } from "lucide-react";

// Mirrors the channels exposed on /contact so a restricted user can reach a
// human immediately from the login screen.
const WHATSAPP_URL = "https://wa.me/919479737209";
const SUPPORT_EMAIL = "admin@solivaguard.com";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Shown when a blocked customer attempts to sign in. The backend rejects the
 * login with a 403 / `ACCOUNT_BLOCKED`; this surfaces a clear, branded
 * "you are restricted — contact admin" dialog with live contact options.
 */
export function RestrictedModal({ open, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#3a2a22]/55 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[440px] overflow-hidden rounded-[28px] border border-white/70 bg-[#FAF7F3] shadow-[0_30px_80px_-24px_rgba(58,42,34,0.45)]"
          >
            <button
              type="button" onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#3a2a22]/40 transition-colors hover:bg-[#3a2a22]/06 hover:text-[#3a2a22]"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Header band */}
            <div className="relative bg-[#3a2a22] px-7 pt-8 pb-7 text-center">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-1/4 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#c76600]/20 blur-[70px]" />
              </div>
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c76600]/30 bg-[#c76600]/15 text-[#e3a463]">
                <ShieldAlert size={30} strokeWidth={1.8} />
              </div>
              <h2 className="relative font-display text-[1.6rem] leading-tight tracking-tight text-[#FAF7F3]">
                Account Restricted
              </h2>
              <p className="relative mx-auto mt-2 max-w-[19rem] text-[0.875rem] font-light leading-relaxed text-[#FAF7F3]/70">
                Your account has been restricted by the administrator. You can no longer sign in.
                Please contact the admin to resolve this.
              </p>
            </div>

            {/* Contact options */}
            <div className="space-y-2.5 px-6 py-6">
              <p className="mb-1 text-center font-mono text-[0.5rem] tracking-[0.28em] uppercase font-bold text-[#3a2a22]/40">
                Contact the team
              </p>

              <a
                href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-[#3a2a22]/08 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-[#25D366]/40 hover:shadow-[0_12px_28px_-14px_rgba(37,211,102,0.5)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366]/12 text-[#25D366]">
                  <MessageCircle size={18} />
                </span>
                <span className="flex-1">
                  <span className="block text-[0.85rem] font-semibold text-[#3a2a22]">WhatsApp Support</span>
                  <span className="block text-[0.7rem] font-light text-[#3a2a22]/50">Fastest way to reach us</span>
                </span>
                <span className="text-[#c76600] opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </a>

              <div className="flex items-center gap-3 rounded-2xl border border-[#3a2a22]/08 bg-white px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c76600]/12 text-[#c76600]">
                  <Mail size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.85rem] font-semibold text-[#3a2a22]">Email Support</span>
                  <span className="block truncate font-mono text-[0.68rem] text-[#3a2a22]/50">{SUPPORT_EMAIL}</span>
                </span>
                <button
                  type="button" onClick={copyEmail}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#3a2a22]/40 transition-colors hover:bg-[#3a2a22]/05 hover:text-[#c76600]"
                  aria-label="Copy email"
                >
                  {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                </button>
              </div>

              <Link
                to="/support" onClick={onClose}
                className="group flex items-center gap-3 rounded-2xl border border-[#3a2a22]/08 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-[#3a2a22]/20 hover:shadow-[0_12px_28px_-16px_rgba(58,42,34,0.4)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3a2a22]/08 text-[#3a2a22]">
                  <HelpCircle size={18} />
                </span>
                <span className="flex-1">
                  <span className="block text-[0.85rem] font-semibold text-[#3a2a22]">Support Center</span>
                  <span className="block text-[0.7rem] font-light text-[#3a2a22]/50">Browse help &amp; FAQs</span>
                </span>
                <span className="text-[#c76600] opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </Link>

              <button
                type="button" onClick={onClose}
                className="mt-1 w-full rounded-2xl py-3 text-center font-mono text-[0.6rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/45 transition-colors hover:text-[#3a2a22]"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** True when a login attempt failed specifically because the account is blocked.
 *  Matches the backend's `ACCOUNT_BLOCKED` code (a bare 403 may just be a
 *  temporary lock, which must not trigger this dialog). */
export function isRestrictedError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  return (err as { code?: string }).code === "ACCOUNT_BLOCKED";
}
