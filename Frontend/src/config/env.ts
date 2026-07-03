import { z } from "zod";

function resolveApiUrl(): string {
  let url = import.meta.env.VITE_API_URL as string | undefined;
  url = url ? url.trim() : "";

  // If the URL is already absolute, it's safe to return. Zod will validate it.
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If empty or relative (e.g., "/api/v1"), determine the path
  const path = url.startsWith("/") ? url : (url ? `/${url}` : "/api/v1");

  // In the browser, use the current origin
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }

  // In SSR, Node.js fetch() requires an absolute URL.
  // We use the Docker internal network to bypass public NAT/Nginx for performance and reliability.
  return `http://backend:5000${path}`;
}

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_USE_MOCK_API: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export const env = envSchema.parse({
  VITE_API_URL: resolveApiUrl(),
  VITE_USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API,
});

export type Env = z.infer<typeof envSchema>;
