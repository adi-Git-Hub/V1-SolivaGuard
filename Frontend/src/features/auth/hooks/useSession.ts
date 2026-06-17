import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { authClient, type Session } from "@/lib/auth-client";

/**
 * Query key for the current session. Mutations should invalidate this key
 * after login / register-verification / reset-password / logout.
 */
export const sessionQueryKey = ["auth", "me"] as const;

/**
 * Returns the current session. Three states:
 *   - `undefined` → still loading (first /auth/me roundtrip in flight)
 *   - `null`      → confirmed signed out (server replied 401)
 *   - `Session`   → signed in
 */
export function useSession(): Session | null | undefined {
  // `enabled` keeps this query inert during SSR.
  const isClient = typeof window !== "undefined";

  const { data, isLoading } = useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => authClient.me(),
    enabled: isClient,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  });

  return useMemo(() => {
    if (!isClient) return null;
    if (isLoading) return undefined;
    return data ?? null;
  }, [data, isLoading, isClient]);
}
