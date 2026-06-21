import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  description: string;
  detail?: string;          // e.g. "Price: ₹799 → ₹999"
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;    // red confirm button
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, description, detail,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  destructive = false, isLoading = false,
  onConfirm, onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm rounded-2xl bg-[#FDFAF6] p-6 shadow-2xl border border-[#3a2a22]/08"
          >
            {/* Icon */}
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${destructive ? "bg-red-50" : "bg-[#B88445]/10"}`}>
              {destructive
                ? <AlertTriangle className="h-5 w-5 text-red-500" />
                : <Info className="h-5 w-5 text-[#B88445]" />
              }
            </div>

            <h3 className="font-display text-[1.1rem] leading-snug text-[#2D241E]">{title}</h3>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-[#3a2a22]/55">{description}</p>

            {/* Change detail */}
            {detail && (
              <div className="mt-3 rounded-xl border border-[#3a2a22]/08 bg-[#F7F3EC] px-3.5 py-2.5">
                <p className="font-mono text-[0.5rem] tracking-[0.18em] uppercase font-bold text-[#3a2a22]/35 mb-1">Change</p>
                <p className="text-[0.8125rem] font-medium text-[#2D241E]">{detail}</p>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 rounded-xl border border-[#3a2a22]/12 py-2.5 font-mono text-[0.5rem] tracking-[0.18em] uppercase font-bold text-[#3a2a22]/60 transition-all hover:bg-[#3a2a22]/04 disabled:opacity-40"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 rounded-xl py-2.5 font-mono text-[0.5rem] tracking-[0.18em] uppercase font-bold text-white transition-all disabled:opacity-50 ${
                  destructive
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-[#B88445] hover:bg-[#D4A05C]"
                }`}
              >
                {isLoading ? "Please wait…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
