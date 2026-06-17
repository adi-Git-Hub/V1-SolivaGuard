import Heart from "lucide-react/dist/esm/icons/heart";
import ShoppingBag from "lucide-react/dist/esm/icons/shopping-bag";
import Trash2 from "lucide-react/dist/esm/icons/trash2";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/features/catalog/api";
import { useRemoveFromWishlist } from "@/features/user/profile-api";
import { formatMoney } from "@/lib/format";

export function WishlistTab() {
  // Using products as proxy for wishlist items for UI demonstration
  const { data: products = [] } = useProducts({ limit: 4, sort: "newest" });
  const removeFromWishlist = useRemoveFromWishlist();

  return (
    <div className="space-y-8 sm:space-y-12">
      <header className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <span className="block h-px w-6 bg-orange-glow/40" />
          <span className="font-mono text-micro-sm sm:text-micro-md tracking-editorial text-orange-glow uppercase font-bold">
            CURATED SELECTION
          </span>
        </div>
        <h1 className="font-display text-brown-deep tracking-tight leading-hero text-display-lg">
          Your Wishlist
        </h1>
      </header>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-surface-panel/90 border border-line-hairline rounded-3xl p-5 sm:p-6 backdrop-blur-medium shadow-soft group flex gap-5 sm:gap-8"
            >
              <div className="h-32 w-24 sm:h-40 sm:w-32 rounded-2xl bg-cream flex items-center justify-center p-3 shrink-0 border border-line-hairline overflow-hidden">
                <img 
                  src={p.images[0]?.url || "/placeholder.svg"} 
                  alt={p.name} 
                  className="h-full w-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110" 
                />
              </div>
              
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-display text-lg sm:text-xl text-brown-deep font-bold leading-tight truncate">
                      {p.name}
                    </h3>
                    <button 
                      onClick={() => removeFromWishlist.mutate(p.id)}
                      className="text-ink-muted hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                    <span className="text-[10px] font-mono text-ink-muted uppercase tracking-widest">Color: <span className="text-brown-deep font-bold">Blush Pink</span></span>
                    <span className="text-[10px] font-mono text-green-600 uppercase tracking-widest font-bold">In Stock</span>
                  </div>
                  <div className="font-display text-lg text-brown-deep font-bold">
                    {formatMoney(p.price * 100, "INR")}
                  </div>
                </div>

                <Button className="mt-4 w-full rounded-full bg-brown-deep text-white h-10 sm:h-12 font-mono text-micro-sm tracking-widest uppercase hover:bg-brown shadow-md transition-all">
                  <ShoppingBag className="h-3.5 w-3.5 mr-2" />
                  Move to cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-line-hairline bg-surface-panel/80 p-16 sm:p-24 text-center backdrop-blur-medium shadow-soft">
          <Heart className="mx-auto mb-6 h-12 w-12 text-ink-disabled opacity-30" />
          <h3 className="mb-3 font-display text-2xl text-brown-deep font-bold">
            Your heart is open
          </h3>
          <p className="mx-auto mb-10 max-w-xs text-sm font-medium text-ink-muted leading-relaxed">
            Curate your personal collection of Soliva protection systems.
          </p>
          <Button
            asChild
            className="rounded-full bg-brown-deep text-white px-10 py-6 uppercase font-bold tracking-cta text-micro-md shadow-lg"
          >
            <Link to="/collection">Explore Shop</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
