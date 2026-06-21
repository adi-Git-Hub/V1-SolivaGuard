import { api } from "@/lib/api";

/**
 * Best-effort precise-location capture, run right after a successful login.
 *
 * Asks the browser for GPS coordinates and reports them to the backend, which
 * reverse-geocodes them for the admin customers console. Entirely silent:
 * - If the user denies permission, we do nothing (the server already captured
 *   an IP-based location during login).
 * - Any network/permission error is swallowed — this must never disrupt login.
 */
export function reportBrowserLocation(): void {
  if (typeof navigator === "undefined" || !navigator.geolocation) return;
  try {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        api
          .post("/auth/location", {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
          .catch(() => {});
      },
      () => {
        /* permission denied / unavailable → fall back to IP-based location */
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  } catch {
    /* getCurrentPosition can throw in insecure contexts — ignore */
  }
}
