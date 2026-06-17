import type { Category, Product } from "@/features/catalog/schema";

export const mockCategories: Category[] = [
  {
    id: "cat_1",
    slug: "skincare",
    name: "Skincare",
    description: "Cleansers, serums, and creams crafted for everyday ritual.",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
    productCount: 3,
  },
  {
    id: "cat_2",
    slug: "fragrance",
    name: "Fragrance",
    description: "Layered scents inspired by warm light and quiet moments.",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80",
    productCount: 2,
  },
  {
    id: "cat_3",
    slug: "accessories",
    name: "Accessories",
    description: "Considered objects to complete the ritual.",
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80",
    productCount: 2,
  },
];

export const mockProducts: Product[] = [
  {
    id: "prod_1",
    slug: "soliva-airshield-wrap",
    name: "Soliva AirShield Wrap",
    description: "Sculpted coverage. Silent confidence. The flagship dual-layer edition.",
    priceCents: 79900,
    compareAtCents: 120000,
    currency: "INR",
    images: ["/product_images/blue-1.webp"],
    categoryId: "cat_1",
    categorySlug: "protection",
    inStock: true,
    rating: 4.9,
    reviewCount: 312,
  },
  {
    id: "prod_2",
    slug: "soliva-urban-veil",
    name: "Soliva Urban Veil",
    description: "City-weight protection. Zero compromise. Engineered for the daily commute.",
    priceCents: 79900,
    compareAtCents: 120000,
    currency: "INR",
    images: ["/product_images/olive-1.webp"],
    categoryId: "cat_1",
    categorySlug: "protection",
    inStock: true,
    rating: 4.8,
    reviewCount: 204,
  },
  {
    id: "prod_3",
    slug: "soliva-heatguard",
    name: "Soliva HeatGuard",
    description: "Thermal intelligence. All-day calm. Built for peak exposure hours.",
    priceCents: 79900,
    compareAtCents: 120000,
    currency: "INR",
    images: ["/product_images/lime-1.webp"],
    categoryId: "cat_1",
    categorySlug: "protection",
    inStock: true,
    rating: 4.7,
    reviewCount: 178,
  },
  {
    id: "prod_4",
    slug: "soliva-motioncover",
    name: "Soliva MotionCover",
    description: "Adaptive stretch-soft fabric. Moves with you. Stays in place.",
    priceCents: 79900,
    compareAtCents: 120000,
    currency: "INR",
    images: ["/product_images/pink-1.webp"],
    categoryId: "cat_1",
    categorySlug: "protection",
    inStock: true,
    rating: 4.8,
    reviewCount: 142,
  },
  {
    id: "prod_5",
    slug: "soliva-airlite-shield",
    name: "Soliva AirLite Shield",
    description: "Barely there. Completely covered. The lightest in the collection.",
    priceCents: 79900,
    compareAtCents: 120000,
    currency: "INR",
    images: ["/product_images/beige-1.webp"],
    categoryId: "cat_1",
    categorySlug: "protection",
    inStock: true,
    rating: 4.6,
    reviewCount: 96,
  },
];

export function findProductBySlug(slug: string): Product | undefined {
  return mockProducts.find((p) => p.slug === slug);
}

export function findCategoryBySlug(slug: string): Category | undefined {
  return mockCategories.find((c) => c.slug === slug);
}

export function productsByCategory(categorySlug: string): Product[] {
  return mockProducts.filter((p) => p.categorySlug === categorySlug);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.categorySlug.includes(q),
  );
}
