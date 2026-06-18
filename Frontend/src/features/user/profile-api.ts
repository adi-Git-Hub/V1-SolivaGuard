import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type EnvelopedResponse<T> = { success: boolean; message?: string; data: T };

export const profileKeys = {
  all: ["profile"] as const,
  details: () => ["profile", "details"] as const,
  preferences: () => ["profile", "preferences"] as const,
  protectionDashboard: (lat?: number, lon?: number) => ["profile", "protectionDashboard", lat, lon] as const,
  addresses: () => ["profile", "addresses"] as const,
};

// --- Profile & Preferences ---

export function usePreferences() {
  return useQuery({
    queryKey: profileKeys.preferences(),
    queryFn: async () => {
      const res = await api.get<EnvelopedResponse<{ preferences: any }>>("/profile/preferences");
      return res.data.preferences;
    },
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (preferences: any) =>
      api.put<EnvelopedResponse<unknown>>("/profile/preferences", { preferences }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.preferences() });
    },
  });
}

export function useProtectionDashboard(lat?: number, lon?: number) {
  return useQuery({
    queryKey: profileKeys.protectionDashboard(lat, lon),
    queryFn: async () => {
      if (!lat || !lon) return null;
      const res = await api.get<EnvelopedResponse<any>>(`/profile/protection-dashboard?lat=${lat}&lon=${lon}`);
      return res.data;
    },
    enabled: !!lat && !!lon,
    staleTime: 5 * 60_000, // 5 minutes
  });
}

// --- Wishlist ---

export function useRemoveFromWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      api.delete<EnvelopedResponse<unknown>>(`/profile/wishlist/${productId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["catalog"] }); // In case wishlist state is shared
    },
  });
}

// --- Addresses ---

export function useAddresses() {
  return useQuery({
    queryKey: profileKeys.addresses(),
    queryFn: async () => {
      const res = await api.get<EnvelopedResponse<{ addresses: any[] }>>("/profile/addresses");
      return res.data.addresses;
    },
  });
}

export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (address: any) =>
      api.post<EnvelopedResponse<unknown>>("/profile/addresses", address),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.addresses() });
    },
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...address }: { id: string } & Record<string, unknown>) =>
      api.put<EnvelopedResponse<unknown>>(`/profile/addresses/${id}`, address),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.addresses() });
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<EnvelopedResponse<unknown>>(`/profile/addresses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.addresses() });
    },
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.put<EnvelopedResponse<unknown>>(`/profile/addresses/${id}/default`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.addresses() });
    },
  });
}
