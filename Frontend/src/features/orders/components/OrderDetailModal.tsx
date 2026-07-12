import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import type { Order } from "../schema";
import { OrderExperience } from "./OrderExperience";

/**
 * Full order details in a popup — opened by tapping an order anywhere in the
 * profile. Backdrop dismiss, Escape to close, a back button top-left, and a
 * scrollable panel that reuses the same OrderExperience body as the standalone
 * details page (so the two never drift). Cancellation + refund info included.
 */
export function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  // Close on Escape + lock the page scroll while the popup is open.
  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [order, onClose]);

  return (
    <AnimatePresence>
      {order && (
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1000] overflow-y-auto overscroll-contain px-3 py-6 sm:px-6 sm:py-10"
        >
          <div className="fixed inset-0 bg-[#3a2a22]/55 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mx-auto w-full max-w-3xl overflow-hidden rounded-[26px] border border-black/5 bg-[#FAF7F3] shadow-[0_40px_100px_-40px_rgba(58,42,34,0.6)]"
          >
            {/* Sticky top bar — back button (top-left) + order ref */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line-hairline bg-[#FAF7F3]/95 px-5 py-3.5 backdrop-blur-md sm:px-7">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-orange-glow"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                #{order.id.slice(-10).toUpperCase()}
              </span>
            </div>

            <div className="px-5 pb-8 pt-5 sm:px-7">
              <OrderExperience order={order} mode="modal" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
