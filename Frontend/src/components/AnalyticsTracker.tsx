import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { trackPageView } from "@/lib/analyticsTracker";

export function AnalyticsTracker() {
  const location = useLocation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = location.pathname;
    if (lastPathRef.current !== currentPath) {
      lastPathRef.current = currentPath;
      trackPageView(currentPath);
    }
  }, [location.pathname]);

  return null;
}
