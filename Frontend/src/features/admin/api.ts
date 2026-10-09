import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { env } from "@/config/env";

/* ─── Shared envelope ────────────────────────────────────────────────── */
type Env<T> = { success: boolean; message?: string; data: T };

/* ─── Shipping Info ──────────────────────────────────────────────────── */
export type ShippingInfo = {
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
  address?: string;
  pinCode?: number;
  phoneNo?: number;
};

/* ─── Order ──────────────────────────────────────────────────────────── */
export type AdminOrder = {
  _id: string;
  user?: { _id?: string; name?: string; email?: string } | string | null;
  shippingInfo?: ShippingInfo | null;
  orderItems: Array<{
    product?: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  paymentInfo?: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    status?: string;
  } | null;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  orderStatus: string;
  events?: Array<{ status: string; message?: string; timestamp?: string }>;
  invoiceNumber?: string;
  receiptNumber?: string;
  invoiceUrl?: string;
  receiptUrl?: string;
  documentsGeneratedAt?: string;
  createdAt?: string;
  deliveredAt?: string;
};

/* ─── Dashboard stats ────────────────────────────────────────────────── */
export type AdminStats = {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  recentOrders: AdminOrder[];
};

/* ─── Product ────────────────────────────────────────────────────────── */
export type AdminProduct = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  images?: Array<{ url: string }>;
  category?: string;
  tags?: string[];
  featured?: boolean;
  status?: "active" | "draft" | "archived";
  stock: number;
  ratings?: number;
  reviewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductFormData = {
  name: string;
  slug?: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  category: string;
  stock: number;
  status: "active" | "draft" | "archived";
  featured?: boolean;
  images?: Array<{ url: string }>;
  tags?: string[];
};

/* ─── Customer ───────────────────────────────────────────────────────── */
export type CustomerStatus = "active" | "blocked";

export type AdminCustomer = {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role?: string;
  isVerified?: boolean;
  status?: CustomerStatus;
  avatarUrl?: string | null;
  createdAt?: string;
  lastLoginAt?: string | null;
  totalOrders: number;
  totalSpend: number;
  avgOrderValue?: number;
  lifetimeValue?: number;
  lastOrder?: string | null;
  activity?: "active" | "inactive";
  // Login location & device telemetry (admin-only).
  lastLoginIP?: string | null;
  lastLoginCity?: string | null;
  lastLoginState?: string | null;
  lastLoginCountry?: string | null;
  lastLoginISP?: string | null;
  deviceInfo?: string | null;
  browserInfo?: string | null;
  osInfo?: string | null;
  lastLatitude?: number | null;
  lastLongitude?: number | null;
  areaName?: string | null;
  subLocality?: string | null;
  locality?: string | null;
};

export type AdminAddress = {
  _id: string;
  fullName: string;
  phone: string;
  houseNo?: string;
  buildingName?: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  addressType?: "Home" | "Work" | "Other";
  isDefault?: boolean;
};

export type CustomerStats = {
  totalCustomers: number;
  activeCustomers: number;
  returningCustomers: number;
  customerRevenue: number;
  highValueCustomers: number;
  blockedCustomers: number;
};

export type CustomerSegment =
  | "all" | "new" | "returning" | "high-value" | "inactive" | "blocked";

/* ─── Inventory ──────────────────────────────────────────────────────── */
export type InventorySummary = {
  totalInventory: number;
  inventoryValue: number;
  outOfStock: number;
  lowStock: number;
};

/* ─── Payment record ─────────────────────────────────────────────────── */
export type AdminPayment = {
  _id: string;
  orderId: string;
  orderStatus: string;
  amount: number;
  paymentInfo?: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    status?: string;
  } | null;
  user?: { _id?: string; name?: string; email?: string } | string | null;
  createdAt?: string;
  invoiceNumber?: string;
  receiptUrl?: string;
};

/* ─── Analytics ──────────────────────────────────────────────────────── */
export type AnalyticsSummary = {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueYear: number;
  ordersToday: number;
  ordersMonth: number;
  avgOrderValue: number;
};

export type RevenueTrendPoint = {
  date: string;
  revenue: number;
  orders: number;
};

export type TopProduct = {
  name: string;
  units: number;
  revenue: number;
};

export type CustomerGrowthPoint = {
  month: string;
  customers: number;
};

export type AdminAnalytics = {
  summary: AnalyticsSummary;
  revenueTrend: RevenueTrendPoint[];
  topProducts: TopProduct[];
  customerGrowth: CustomerGrowthPoint[];
  statusBreakdown: Record<string, number>;
};

/* ─── Query keys ─────────────────────────────────────────────────────── */
export const adminKeys = {
  all:       ["admin"] as const,
  stats:     () => ["admin", "stats"] as const,
  orders:    () => ["admin", "orders"] as const,
  products:  (q?: object) => ["admin", "products", q ?? {}] as const,
  product:   (id: string) => ["admin", "product", id] as const,
  customers: (q?: object) => ["admin", "customers", q ?? {}] as const,
  customerStats: () => ["admin", "customers", "stats"] as const,
  customer:  (id: string) => ["admin", "customer", id] as const,
  inventory: (q?: object) => ["admin", "inventory", q ?? {}] as const,
  payments:  (q?: object) => ["admin", "payments", q ?? {}] as const,
  analytics: () => ["admin", "analytics"] as const,
  analyticsReach: (q?: object) => ["admin", "analytics", "reach", q ?? {}] as const,
  analyticsVisitors: (q?: object) => ["admin", "analytics", "visitors", q ?? {}] as const,
  analyticsVisitorDetail: (id?: string | null) => ["admin", "analytics", "visitor", id ?? ""] as const,
};

/* ─── Dashboard ──────────────────────────────────────────────────────── */
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const res = await api.get<Env<{ stats: AdminStats }>>("/admin/dashboard");
      return res.data.stats;
    },
  });
}

/* ─── Orders ─────────────────────────────────────────────────────────── */
export function useAdminOrders() {
  return useQuery({
    queryKey: adminKeys.orders(),
    queryFn: async () => {
      const res = await api.get<Env<{ orders: AdminOrder[]; totalAmount: number }>>(
        "/orders/admin/orders",
      );
      return res.data;
    },
  });
}

/* ─── Products ───────────────────────────────────────────────────────── */
export type AdminProductsQuery = {
  keyword?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export function useAdminProducts(query: AdminProductsQuery = {}) {
  return useQuery({
    queryKey: adminKeys.products(query),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.keyword)  params.set("keyword", query.keyword);
      if (query.status)   params.set("status", query.status);
      if (query.category) params.set("category", query.category);
      if (query.page)     params.set("page", String(query.page));
      if (query.limit)    params.set("limit", String(query.limit));
      const res = await api.get<Env<{ products: AdminProduct[]; total: number; page: number; limit: number }>>(
        `/admin/products?${params.toString()}`,
      );
      return res.data;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductFormData) =>
      api.post<Env<{ product: AdminProduct }>>("/products/admin/new", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductFormData>) =>
      api.put<Env<{ product: AdminProduct }>>(`/products/admin/${id}`, data),
    onSuccess: (res) => {
      const updated: AdminProduct = res.data.product;
      // Patch every cached admin-products list instantly so the list shows
      // updated values the moment you navigate back (no refetch latency).
      qc.setQueriesData<{ products: AdminProduct[]; total: number; page: number; limit: number }>(
        { queryKey: ["admin", "products"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            products: old.products.map((p) => (p._id === id ? { ...p, ...updated } : p)),
          };
        },
      );
      qc.invalidateQueries({ queryKey: adminKeys.product(id) });
      qc.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<Env<unknown>>(`/products/admin/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
  });
}

/* ─── Customers ──────────────────────────────────────────────────────── */
export type CustomerSortField =
  | "createdAt" | "name" | "totalSpend" | "totalOrders" | "lastOrder" | "avgOrderValue";

export type AdminCustomersQuery = {
  keyword?: string;
  segment?: CustomerSegment;
  status?: CustomerStatus | "";
  sort?: CustomerSortField;
  dir?: "asc" | "desc";
  joinedFrom?: string;
  joinedTo?: string;
  page?: number;
  limit?: number;
};

export function useCustomerStats() {
  return useQuery({
    queryKey: adminKeys.customerStats(),
    queryFn: async () => {
      const res = await api.get<Env<{ stats: CustomerStats }>>("/admin/customers/stats");
      return res.data.stats;
    },
    staleTime: 30_000,
  });
}

export function useAdminCustomers(query: AdminCustomersQuery = {}) {
  return useQuery({
    queryKey: adminKeys.customers(query),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.keyword)             params.set("keyword", query.keyword);
      if (query.segment && query.segment !== "all") params.set("segment", query.segment);
      if (query.status)              params.set("status", query.status);
      if (query.sort)                params.set("sort", query.sort);
      if (query.dir)                 params.set("dir", query.dir);
      if (query.joinedFrom)          params.set("joinedFrom", query.joinedFrom);
      if (query.joinedTo)            params.set("joinedTo", query.joinedTo);
      if (query.page)                params.set("page", String(query.page));
      if (query.limit)               params.set("limit", String(query.limit));
      const res = await api.get<Env<{ customers: AdminCustomer[]; total: number; page: number; limit: number }>>(
        `/admin/customers?${params.toString()}`,
      );
      return res.data;
    },
    placeholderData: (prev) => prev, // keep prior page visible while fetching the next
  });
}

export function useAdminCustomer(id: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.customer(id),
    queryFn: async () => {
      const res = await api.get<Env<{ customer: AdminCustomer; addresses: AdminAddress[]; orders: AdminOrder[] }>>(
        `/admin/customers/${id}`,
      );
      return res.data;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useUpdateCustomerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CustomerStatus }) =>
      api.patch<Env<{ id: string; status: CustomerStatus }>>(`/admin/customers/${id}/status`, { status }),
    onSuccess: (res) => {
      const { id, status } = res.data;
      // Patch every cached customer list instantly so the badge flips with no refetch.
      qc.setQueriesData<{ customers: AdminCustomer[]; total: number; page: number; limit: number }>(
        { queryKey: ["admin", "customers"] },
        (old) => {
          if (!old?.customers) return old;
          return { ...old, customers: old.customers.map((c) => (c._id === id ? { ...c, status } : c)) };
        },
      );
      qc.invalidateQueries({ queryKey: adminKeys.customer(id) });
      qc.invalidateQueries({ queryKey: adminKeys.customerStats() });
    },
  });
}

/** Download all customers as a CSV file (credentialed fetch → blob → save). */
export async function exportCustomersCsv(): Promise<void> {
  const res = await fetch(`${env.VITE_API_URL}/admin/customers/export`, { credentials: "include" });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `soliva-customers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ─── Inventory ──────────────────────────────────────────────────────── */
export type AdminInventoryQuery = {
  keyword?: string;
  stock?: "low" | "out" | "";
};

export function useAdminInventory(query: AdminInventoryQuery = {}) {
  return useQuery({
    queryKey: adminKeys.inventory(query),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.keyword) params.set("keyword", query.keyword);
      if (query.stock)   params.set("stock", query.stock);
      const res = await api.get<Env<{ products: AdminProduct[]; summary: InventorySummary }>>(
        `/admin/inventory?${params.toString()}`,
      );
      return res.data;
    },
  });
}

export function useAdjustInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, adjustment, reason }: { productId: string; adjustment: number; reason?: string }) =>
      api.patch<Env<{ product: AdminProduct; newStock: number }>>(`/admin/inventory/${productId}`, { adjustment, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
  });
}

/* ─── Payments ───────────────────────────────────────────────────────── */
export type AdminPaymentsQuery = {
  status?: string;
  keyword?: string;
};

export function useAdminPayments(query: AdminPaymentsQuery = {}) {
  return useQuery({
    queryKey: adminKeys.payments(query),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.status)  params.set("status", query.status);
      if (query.keyword) params.set("keyword", query.keyword);
      const res = await api.get<Env<{ payments: AdminPayment[]; summary: { totalPaid: number; totalPending: number; totalFailed: number } }>>(
        `/admin/payments?${params.toString()}`,
      );
      return res.data;
    },
  });
}

/* ─── Analytics ──────────────────────────────────────────────────────── */
export function useAdminAnalytics() {
  return useQuery({
    queryKey: adminKeys.analytics(),
    queryFn: async () => {
      const res = await api.get<Env<AdminAnalytics>>("/admin/analytics");
      return res.data;
    },
  });
}

/* ─── Website Reach & Visitor Activity Analytics ─────────────────────── */
export type ReachAnalyticsData = {
  period: string;
  rangeStart: string;
  rangeEnd: string;
  totalVisitors?: number;
  totalPageViews: number;
  uniqueVisitors: number;
  todayVisitors: number;
  activeVisitors: number;
  trafficTrend: Array<{
    date: string;
    pageViews: number;
    uniqueVisitors: number;
  }>;
  topPages: Array<{
    path: string;
    views: number;
    uniqueVisitors: number;
  }>;
  trafficSources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
};

export type VisitorActivityItem = {
  visitorId: string;
  pseudonym: string;
  visitorType: "Logged-in User" | "Guest";
  user: { _id: string; name: string; email: string } | null;
  lastVisitedPage: string;
  lastVisitTime: string;
  firstVisitTime: string;
  trafficSource: string;
  deviceType: string;
  browser: string;
  os: string;
  totalPageViews: number;
};

export type VisitorActivityResponse = {
  visitors: VisitorActivityItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type VisitorDetailData = {
  visitorId: string;
  pseudonym: string;
  visitorType: "Logged-in User" | "Guest";
  user: { _id: string; name: string; email: string } | null;
  totalTrackedEvents: number;
  history: Array<{
    _id: string;
    path: string;
    title: string;
    referrer: string;
    trafficSource: string;
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    };
    deviceType: string;
    browser: string;
    os: string;
    isSessionStart: boolean;
    timestamp: string;
  }>;
};

export function useReachAnalytics(params?: { period?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: adminKeys.analyticsReach(params),
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params?.period) search.set("period", params.period);
      if (params?.startDate) search.set("startDate", params.startDate);
      if (params?.endDate) search.set("endDate", params.endDate);
      const res = await api.get<Env<ReachAnalyticsData>>(`/admin/analytics/reach?${search.toString()}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useVisitorActivity(params: {
  search?: string;
  visitorType?: string;
  trafficSource?: string;
  deviceType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: adminKeys.analyticsVisitors(params),
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params.search) search.set("search", params.search);
      if (params.visitorType && params.visitorType !== "all") search.set("visitorType", params.visitorType);
      if (params.trafficSource && params.trafficSource !== "all") search.set("trafficSource", params.trafficSource);
      if (params.deviceType && params.deviceType !== "all") search.set("deviceType", params.deviceType);
      if (params.startDate) search.set("startDate", params.startDate);
      if (params.endDate) search.set("endDate", params.endDate);
      if (params.page) search.set("page", String(params.page));
      if (params.limit) search.set("limit", String(params.limit));
      const res = await api.get<Env<VisitorActivityResponse>>(`/admin/analytics/visitors?${search.toString()}`);
      return res.data;
    },
    staleTime: 15_000,
  });
}

export function useVisitorDetail(visitorId: string | null) {
  return useQuery({
    queryKey: adminKeys.analyticsVisitorDetail(visitorId),
    queryFn: async () => {
      if (!visitorId) return null;
      const res = await api.get<Env<VisitorDetailData>>(
        `/admin/analytics/visitors/${encodeURIComponent(visitorId)}`,
      );
      return res.data;
    },
    enabled: Boolean(visitorId),
    staleTime: 30_000,
  });
}
