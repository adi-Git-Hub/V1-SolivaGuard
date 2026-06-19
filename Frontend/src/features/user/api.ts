import { useMutation, useQueryClient } from "@tanstack/react-query";

import { env } from "@/config/env";
import { ApiError } from "@/lib/api";
import { sessionQueryKey } from "@/features/auth/hooks/useSession";

// Avatar upload is multipart/form-data — we cannot use lib/api.ts's JSON wrapper
// directly. This is the one place in the codebase that does a raw fetch with
// FormData. credentials:include is required so the auth cookie travels along.
async function postAvatar(file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData();
  form.append("avatar", file);

  const res = await fetch(`${env.VITE_API_URL}/users/me/avatar`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    console.error("[AVATAR] Upload failed:", {
      status: res.status,
      statusText: res.statusText,
      payload,
    });
    throw new ApiError(res.status, payload.code ?? "UNKNOWN", payload.message ?? res.statusText);
  }

  const body = await res.json();
  return { avatarUrl: body?.data?.user?.avatarUrl };
}

async function deleteAvatar(): Promise<void> {
  const res = await fetch(`${env.VITE_API_URL}/users/me/avatar`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new ApiError(res.status, payload.code ?? "UNKNOWN", payload.message ?? res.statusText);
  }
}

export function useUpdateAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => postAvatar(file),
    onSuccess: (data) => {
      // Patch the session cache immediately so Avatar re-renders without a refetch.
      qc.setQueryData(sessionQueryKey, (old: any) =>
        old ? { ...old, user: { ...old.user, avatarUrl: data.avatarUrl } } : old,
      );
      // Background refetch so any other session fields stay fresh.
      qc.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });
}

export function useRemoveAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteAvatar(),
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionQueryKey }),
  });
}
