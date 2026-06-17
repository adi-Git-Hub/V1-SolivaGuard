import { useBlocker } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

/**
 * UnsavedChangesGuard — drop-in navigation protection. Pass `when` = true only
 * while the user has genuinely modified, unsaved data; it then:
 *   • intercepts in-app route changes and shows the Soliva "Leave This Page?"
 *     modal (Stay Here / Leave Page), and
 *   • arms the browser's native beforeunload prompt for refresh / tab close.
 *
 * When `when` is false it is completely inert (no spurious warnings).
 */
export function UnsavedChangesGuard({ when }: { when: boolean }) {
  const blocker = useBlocker({
    shouldBlockFn: () => when,
    enableBeforeUnload: () => when,
    withResolver: true,
  });

  const blocked = blocker.status === "blocked";

  return (
    <AnimatePresence>
      {blocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1100] grid place-items-center p-5"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="leave-title"
          aria-describedby="leave-desc"
        >
          <div className="absolute inset-0 bg-[#3a2a22]/45 backdrop-blur-sm" onClick={blocker.reset} />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[400px] rounded-[26px] border border-black/5 bg-[#FAF7F3] p-7 shadow-[0_30px_80px_-30px_rgba(58,42,34,0.5)] sm:p-8"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c76600]/10 text-[#c76600]">
              <AlertTriangle size={22} strokeWidth={2} />
            </div>

            <h3 id="leave-title" className="font-display text-2xl tracking-tight text-[#3a2a22]">
              Leave this page?
            </h3>
            <p id="leave-desc" className="mt-2.5 text-[0.95rem] font-light leading-relaxed text-[#7b6a5f]">
              You have unsaved changes. Leaving now may cause your progress to be lost.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={blocker.proceed}
                className="h-12 flex-1 rounded-2xl border border-[#3a2a22]/15 bg-transparent text-xs font-bold uppercase tracking-widest text-[#3a2a22]/70 transition-colors hover:border-[#3a2a22]/30 hover:text-[#3a2a22]"
              >
                Leave Page
              </button>
              <button
                type="button"
                autoFocus
                onClick={blocker.reset}
                className="h-12 flex-1 rounded-2xl bg-[#3a2a22] text-xs font-bold uppercase tracking-widest text-[#FAF7F3] shadow-lg shadow-[#3a2a22]/20 transition-all hover:bg-black hover:-translate-y-0.5"
              >
                Stay Here
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
