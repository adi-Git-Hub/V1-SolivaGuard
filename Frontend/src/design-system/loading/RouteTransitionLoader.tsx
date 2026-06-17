import { motion, AnimatePresence } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

/**
 * RouteTransitionLoader — a small, centered, premium circular loader shown only
 * when a route navigation is genuinely slow (pending > ~150ms). It applies a
 * subtle veil over the page (the "slight fade") without blocking interaction or
 * covering the screen with a giant overlay. A short minimum-visible window
 * prevents flicker on borderline-fast transitions.
 *
 * No fake delays: it is driven purely by the router's real pending status.
 */
const SHOW_DELAY = 150; // only appear if navigation is slower than this
const MIN_VISIBLE = 350; // once shown, stay at least this long (anti-flicker)

export function RouteTransitionLoader() {
  const pending = useRouterState({ select: (s) => s.status === "pending" });
  const [visible, setVisible] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (pending) {
      timer = setTimeout(() => {
        setVisible(true);
        shownAt.current = Date.now();
      }, SHOW_DELAY);
    } else if (shownAt.current != null) {
      const elapsed = Date.now() - shownAt.current;
      timer = setTimeout(
        () => {
          setVisible(false);
          shownAt.current = null;
        },
        Math.max(0, MIN_VISIBLE - elapsed),
      );
    } else {
      setVisible(false);
    }

    return () => clearTimeout(timer);
  }, [pending]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-0 z-[900] grid place-items-center"
        >
          {/* subtle veil — fades the current page slightly */}
          <div className="absolute inset-0 bg-[#FAF7F3]/35 backdrop-blur-[1px]" />
          <span className="sr-only">Loading…</span>
          <motion.svg
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-9 w-9 animate-spin"
            viewBox="0 0 36 36"
            fill="none"
          >
            <circle cx="18" cy="18" r="15" stroke="#3a2a22" strokeOpacity="0.12" strokeWidth="2.5" />
            <path d="M33 18a15 15 0 0 0-15-15" stroke="#c76600" strokeWidth="2.5" strokeLinecap="round" />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
