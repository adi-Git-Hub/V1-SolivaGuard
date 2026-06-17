import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck } from "lucide-react";

/**
 * PaymentProcessingOverlay — a calm, premium "Payment In Progress" card shown
 * while the secure payment is initializing or being verified. It reassures the
 * user not to refresh/close without any scary or technical language, and uses a
 * subtle indeterminate progress shimmer (no spinner, no bounce).
 */
export function PaymentProcessingOverlay({ open, label }: { open: boolean; label?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[1000] grid place-items-center p-5"
        >
          <div className="absolute inset-0 bg-[#3a2a22]/55 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[400px] rounded-[26px] border border-black/5 bg-[#FAF7F3] p-8 text-center shadow-[0_30px_80px_-30px_rgba(58,42,34,0.55)]"
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c76600]/12 text-[#c76600]"
            >
              <Lock size={24} strokeWidth={2} />
            </motion.div>

            <h3 className="font-display text-2xl tracking-tight text-[#3a2a22]">Payment in progress</h3>
            <p className="mx-auto mt-2.5 max-w-[300px] text-[0.92rem] font-light leading-relaxed text-[#7b6a5f]">
              {label ||
                "Please don't refresh, close this tab, or navigate away while we securely verify your payment."}
            </p>

            {/* indeterminate progress shimmer */}
            <div className="relative mx-auto mt-7 h-1 w-full max-w-[260px] overflow-hidden rounded-full bg-[#3a2a22]/8">
              <motion.span
                initial={{ x: "-40%" }}
                animate={{ x: "140%" }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-[#c76600]"
              />
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[0.7rem] font-medium uppercase tracking-widest text-[#3a2a22]/40">
              <ShieldCheck size={13} /> Secured by Razorpay
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
