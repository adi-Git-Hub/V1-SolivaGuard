import { api } from "@/lib/api";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "sol_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function getOrSetVisitorId(): string {
  if (typeof window === "undefined" || !window.localStorage) {
    return generateId();
  }
  let vid = localStorage.getItem("soliva_vid");
  if (!vid) {
    vid = generateId();
    try {
      localStorage.setItem("soliva_vid", vid);
    } catch {
      // ignore storage quota/permission issues
    }
  }
  return vid;
}

function getOrRefreshSession(): { sessionId: string; isSessionStart: boolean } {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return { sessionId: generateId(), isSessionStart: true };
  }

  const now = Date.now();
  let sid = sessionStorage.getItem("soliva_sid");
  const lastActiveStr = sessionStorage.getItem("soliva_last_active");
  const lastActive = lastActiveStr ? Number(lastActiveStr) : 0;

  const isExpired = !lastActive || now - lastActive > INACTIVITY_TIMEOUT_MS;

  if (!sid || isExpired) {
    sid = generateId();
    try {
      sessionStorage.setItem("soliva_sid", sid);
      sessionStorage.setItem("soliva_last_active", String(now));
    } catch {
      // ignore storage errors
    }
    return { sessionId: sid, isSessionStart: true };
  }

  try {
    sessionStorage.setItem("soliva_last_active", String(now));
  } catch {
    // ignore
  }

  return { sessionId: sid, isSessionStart: false };
}

// Module-level deduplication guard against immediate re-renders / route bounces
let lastTrackedPath = "";
let lastTrackedTime = 0;

export function trackPageView(rawPath?: string) {
  if (typeof window === "undefined") return;

  const path = rawPath || window.location.pathname || "/";
  const now = Date.now();

  // Exclude admin dashboard routes — track only public storefront visitors
  if (
    path.startsWith("/admin") ||
    path.startsWith("/sv-b27d3506ce") ||
    path.startsWith("/soliva-admin")
  ) {
    return;
  }

  // Dedupe if the exact same path was reported within 1.5 seconds
  if (path === lastTrackedPath && now - lastTrackedTime < 1500) {
    return;
  }

  lastTrackedPath = path;
  lastTrackedTime = now;

  try {
    const visitorId = getOrSetVisitorId();
    const { sessionId, isSessionStart } = getOrRefreshSession();

    // Parse UTM tags
    const searchParams = new URLSearchParams(window.location.search);
    const utm = {
      source: searchParams.get("utm_source") || undefined,
      medium: searchParams.get("utm_medium") || undefined,
      campaign: searchParams.get("utm_campaign") || undefined,
      term: searchParams.get("utm_term") || undefined,
      content: searchParams.get("utm_content") || undefined,
    };

    const referrer = document.referrer || "";
    const title = document.title || "";

    // Fire-and-forget; credentials: "include" sends auth cookies if logged in
    api.post("/analytics/track", {
      visitorId,
      sessionId,
      path,
      title,
      referrer,
      utm,
      isSessionStart,
    }).catch(() => {
      // Silently catch tracking failures so user experience is never impacted
    });
  } catch {
    // Fail silently in restricted browser contexts
  }
}
