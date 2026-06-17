import { z } from "zod";

function resolveApiUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();

  // No env configured — derive a SAME-ORIGIN base. nginx proxies /api/* to the backend,
  // so the current origin (https://solivaguard.com in prod) already serves the API.
  // Never hardcode a host/port here, so the bundle can't leak a localhost URL.
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/v1`;
  }

  // Last-resort SSR fallback (no window). Production origin, never localhost.
  return "https://solivaguard.com/api/v1";
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
