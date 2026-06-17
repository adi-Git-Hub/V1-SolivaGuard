import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { env } from "@/config/env";
import { resolveImageUrl } from "@/lib/image";
import {
  findCategoryBySlug,
  findProductBySlug,
  mockCategories,
  mockProducts,
  productsByCategory,
  searchProducts,
} from "@/lib/mock-data";

import type { Category, Product, ProductListQuery } from "./schema";

// ── Backend response shapes (controllers wrap everything via sendResponse) ──
type EnvelopedResponse<T> = { success: boolean; message?: string; data: T };

type RawProduct = {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  images?: Array<{ url?: string } | string>;
  category?: string;
  tags?: string[];
  featured?: boolean;
  stock?: number;
  ratings?: number;
  reviewsCount?: number;
};

type RawCategory = {
  slug: string;
  name: string;
  productCount: number;
  image?: string | null;
};

// ── Adapters: backend doc → frontend Product/Category ──
function normalizeProduct(raw: RawProduct): Product {
  const images = Array.isArray(raw.images)
    ? raw.images
        .map((i) => (typeof i === "string" ? i : i?.url))
        .filter((u): u is string => Boolean(u))
        .map((u) => resolveImageUrl(u))
    : [];

  const category = String(raw.category || "");

  return {
    id: String(raw._id ?? raw.id ?? ""),
    slug: raw.slug || String(raw._id ?? raw.id ?? ""),
    name: raw.name,
    description: raw.description,
    priceCents: Math.round(Number(raw.price ?? 0) * 100),
    compareAtCents:
      raw.compareAtPrice != null ? Math.round(Number(raw.compareAtPrice) * 100) : null,
    currency: raw.currency || "INR",
    images,
    categoryId: category,
    categorySlug: category.toLowerCase(),
    inStock: Number(raw.stock ?? 0) > 0,
    rating: Number(raw.ratings ?? 0),
    reviewCount: Number(raw.reviewsCount ?? 0),
  };
}

function normalizeCategory(raw: RawCategory): Category {
  return {
    id: raw.slug,
    slug: raw.slug,
    name: raw.name,
    description: "",
    image: resolveImageUrl(raw.image),
    productCount: raw.productCount,
  };
}

// ── Fetchers ──
async function fetchProducts(query: ProductListQuery): Promise<Product[]> {
  if (env.VITE_USE_MOCK_API) {
    await delay();
    let list = query.category ? productsByCategory(query.category) : [...mockProducts];
    if (query.minPrice != null) list = list.filter((p) => p.priceCents >= query.minPrice! * 100);
    if (query.maxPrice != null) list = list.filter((p) => p.priceCents <= query.maxPrice! * 100);
    switch (query.sort) {
      case "price-asc":
        list.sort((a, b) => a.priceCents - b.priceCents);
        break;
      case "price-desc":
        list.sort((a, b) => b.priceCents - a.priceCents);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
    }
    return list;
  }

  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.q) params.set("keyword", query.q);
  if (query.minPrice != null) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice != null) params.set("maxPrice", String(query.maxPrice));
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const res = await api.get<EnvelopedResponse<{ products: RawProduct[] }>>(
    `/products?${params.toString()}`,
  );
  return (res.data.products || []).map(normalizeProduct);
}

async function fetchProduct(idOrSlug: string): Promise<Product> {
  if (env.VITE_USE_MOCK_API) {
    await delay();
    const p = findProductBySlug(idOrSlug);
    if (!p) throw new Error("Product not found");
    return p;
  }
  const res = await api.get<EnvelopedResponse<{ product: RawProduct }>>(
    `/products/${encodeURIComponent(idOrSlug)}`,
  );
  return normalizeProduct(res.data.product);
}

async function fetchCategories(): Promise<Category[]> {
  if (env.VITE_USE_MOCK_API) {
    await delay();
    return mockCategories;
  }
  const res = await api.get<EnvelopedResponse<{ categories: RawCategory[] }>>(`/categories`);
  return (res.data.categories || []).map(normalizeCategory);
}

async function fetchCategory(slug: string): Promise<Category> {
  if (env.VITE_USE_MOCK_API) {
    await delay();
    const c = findCategoryBySlug(slug);
    if (!c) throw new Error("Category not found");
    return c;
  }
  // Categories are a small list — fetch all and filter. Saves a route.
  const all = await fetchCategories();
  const found = all.find((c) => c.slug === slug);
  if (!found) throw new Error("Category not found");
  return found;
}

async function fetchSearch(q: string): Promise<Product[]> {
  if (env.VITE_USE_MOCK_API) {
    await delay();
    return searchProducts(q);
  }
  // Backend reuses /products?keyword=... — no separate /search route.
  return fetchProducts({ q, sort: "newest", page: 1, limit: 24 } as ProductListQuery);
}

function delay() {
  return new Promise<void>((r) => setTimeout(r, 200));
}

// ── Query hooks ──
export const catalogKeys = {
  all: ["catalog"] as const,
  products: (query: ProductListQuery) => ["catalog", "products", query] as const,
  product: (idOrSlug: string) => ["catalog", "product", idOrSlug] as const,
  categories: () => ["catalog", "categories"] as const,
  category: (slug: string) => ["catalog", "category", slug] as const,
  search: (q: string) => ["catalog", "search", q] as const,
};

export function useProducts(query: ProductListQuery) {
  return useQuery({
    queryKey: catalogKeys.products(query),
    queryFn: () => fetchProducts(query),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useProduct(idOrSlug: string) {
  return useQuery({
    queryKey: catalogKeys.product(idOrSlug),
    queryFn: () => fetchProduct(idOrSlug),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    enabled: Boolean(idOrSlug),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: catalogKeys.category(slug),
    queryFn: () => fetchCategory(slug),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    enabled: Boolean(slug),
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: catalogKeys.search(q),
    queryFn: () => fetchSearch(q),
    staleTime: 30_000,
    enabled: q.trim().length > 0,
  });
}
