import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

// Matches the shape returned by Backend/controllers/adminController.js
type RecentOrder = {
  _id: string;
  totalPrice: number;
  orderStatus: string;
  createdAt: string;
  user?: { name?: string; email?: string } | null;
  paymentInfo?: { status?: string } | null;
  invoiceUrl?: string;
  receiptUrl?: string;
  invoiceNumber?: string;
  shippingInfo?: {
    fullName?: string;
    phone?: string;
    houseNo?: string;
    buildingName?: string;
    street?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    addressType?: string;
    // legacy
    address?: string;
    pinCode?: number;
    phoneNo?: number;
  } | null;
};

export type AdminStats = {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  recentOrders: RecentOrder[];
};

type EnvelopedResponse<T> = { success: boolean; message?: string; data: T };

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => ["admin", "stats"] as const,
};

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const res = await api.get<EnvelopedResponse<{ stats: AdminStats }>>("/admin/dashboard");
      return res.data.stats;
    },
    staleTime: 30_000,
  });
}
