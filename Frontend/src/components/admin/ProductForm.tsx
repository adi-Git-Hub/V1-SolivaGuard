import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { AdminProduct, ProductFormData } from "@/features/admin/api";

interface Props {
  initialData?: AdminProduct | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

const CATEGORIES = [
  "sun protection",
  "running", "hiking", "casual", "training", "outdoor", "trail", "urban",
];

const STATUS_OPTS: { label: string; value: "active" | "draft" | "archived" }[] = [
  { label: "Active",   value: "active"   },
  { label: "Draft",    value: "draft"    },
  { label: "Archived", value: "archived" },
];

export function ProductForm({ initialData, onSubmit, isLoading, submitLabel = "Save Product" }: Props) {
  const [name, setName]               = useState(initialData?.name ?? "");
  const [slug, setSlug]               = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [price, setPrice]             = useState(String(initialData?.price ?? ""));
  const [compareAtPrice, setCompare]  = useState(String(initialData?.compareAtPrice ?? ""));
  const [category, setCategory]       = useState(initialData?.category ?? "");
  const [stock, setStock]             = useState(String(initialData?.stock ?? "0"));
  const [status, setStatus]           = useState<"active" | "draft" | "archived">(initialData?.status ?? "draft");
  const [featured, setFeatured]       = useState(initialData?.featured ?? false);
  const [imageUrl, setImageUrl]       = useState("");
  const [images, setImages]           = useState<Array<{ url: string }>>(initialData?.images ?? []);
  const [tags, setTags]               = useState((initialData?.tags ?? []).join(", "));
  const [errors, setErrors]           = useState<Record<string, string>>({});

  // Auto-slug from name (only when creating)
  useEffect(() => {
    if (!initialData && name) {
      setSlug(name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-"));
    }
  }, [name, initialData]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim())        e.name = "Name is required";
    if (!description.trim()) e.description = "Description is required";
    const p = Number(price);
    if (!price || isNaN(p) || p < 0) e.price = "Valid price required";
    if (!category.trim())    e.category = "Category is required";
    const s = Number(stock);
    if (stock === "" || isNaN(s) || s < 0) e.stock = "Valid stock required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const tagsArr = tags.split(",").map(t => t.trim()).filter(Boolean);
    const data: ProductFormData = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      price: Math.round(Number(price)),
      compareAtPrice: compareAtPrice ? Math.round(Number(compareAtPrice)) : null,
      category: category.trim().toLowerCase(),
      stock: Number(stock),
      status,
      featured,
      images: images.length > 0 ? images : undefined,
      tags: tagsArr.length > 0 ? tagsArr : undefined,
    };
    await onSubmit(data);
  }

  function addImage() {
    const url = imageUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) { toast.error("Enter a valid URL or relative path (e.g. /product_images/foo.webp)"); return; }
    setImages(prev => [...prev, { url }]);
    setImageUrl("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Core info */}
      <Section title="Product Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product Name *" error={errors.name}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Trail Blaze Pro" className={input} />
          </Field>
          <Field label="Slug" error={errors.slug}>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="trail-blaze-pro" className={input} />
          </Field>
        </div>

        <Field label="Description *" error={errors.description}>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Full product description…"
            className={`${input} resize-none`}
          />
        </Field>

        <Field label="Tags" hint="Comma-separated">
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="hiking, outdoor, premium" className={input} />
        </Field>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (₹) *" error={errors.price}>
            <input type="number" min="0" step="1" value={price} onChange={e => setPrice(e.target.value)} placeholder="799" className={input} />
          </Field>
          <Field label="Compare At Price (₹)" hint="Strike-through price">
            <input type="number" min="0" step="1" value={compareAtPrice} onChange={e => setCompare(e.target.value)} placeholder="999" className={input} />
          </Field>
        </div>
      </Section>

      {/* Organisation */}
      <Section title="Organisation">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category *" error={errors.category}>
            <select value={category} onChange={e => setCategory(e.target.value)} className={input}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              {/* Render unknown existing value so it doesn't silently disappear */}
              {category && !CATEGORIES.includes(category) && (
                <option value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
              )}
            </select>
          </Field>
          <Field label="Stock *" error={errors.stock}>
            <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" className={input} />
          </Field>
          <Field label="Status">
            <select value={status} onChange={e => setStatus(e.target.value as "active" | "draft" | "archived")} className={input}>
              {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setFeatured(f => !f)}
            className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${featured ? "bg-[#B88445]" : "bg-[#3a2a22]/15"}`}
          >
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${featured ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className="text-[0.8125rem] text-[#2D241E]">Featured product</span>
        </label>
      </Section>

      {/* Images */}
      <Section title="Product Images">
        <div className="flex gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://…"
            className={`${input} flex-1`}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }}
          />
          <button
            type="button"
            onClick={addImage}
            className="flex items-center gap-1.5 rounded-xl border border-[#B88445]/25 px-3 py-2 font-mono text-[0.5rem] tracking-[0.18em] uppercase font-bold text-[#B88445] transition-all hover:bg-[#B88445]/08"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>

        {images.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((img, i) => (
              <div key={i} className="relative group aspect-square">
                <img src={img.url} alt={`Image ${i + 1}`} className="h-full w-full rounded-xl object-cover border border-[#3a2a22]/08" />
                <button
                  type="button"
                  onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded-md bg-[#B88445]/90 px-1 py-0.5 font-mono text-[0.38rem] text-white">PRIMARY</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#3a2a22]/12 py-8 text-center">
            <ImageIcon className="h-6 w-6 text-[#3a2a22]/20 mb-2" />
            <p className="text-[0.75rem] text-[#3a2a22]/30">No images added yet</p>
          </div>
        )}
      </Section>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-[#B88445] px-8 py-3 font-mono text-[0.5rem] tracking-[0.22em] uppercase font-bold text-white transition-all hover:bg-[#D4A05C] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
const input = "w-full rounded-xl border border-[#3a2a22]/10 bg-[#F7F3EC] px-3.5 py-2.5 text-[0.8125rem] text-[#2D241E] placeholder-[#3a2a22]/30 outline-none transition-colors focus:border-[#B88445]/40 focus:ring-2 focus:ring-[#B88445]/10";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-5 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.06)]"
    >
      <p className="mb-4 font-mono text-[0.5rem] tracking-[0.28em] uppercase font-bold text-[#3a2a22]/40">{title}</p>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

function Field({ label, children, error, hint }: { label: string; children: React.ReactNode; error?: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="font-mono text-[0.5rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/50">{label}</label>
        {hint && <span className="font-mono text-[0.45rem] text-[#3a2a22]/30">{hint}</span>}
      </div>
      {children}
      {error && <p className="font-mono text-[0.5rem] text-red-500">{error}</p>}
    </div>
  );
}
