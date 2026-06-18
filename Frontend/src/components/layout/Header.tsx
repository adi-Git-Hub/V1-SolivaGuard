import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ShoppingBag, Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ApiStatusDot } from "@/components/shared/ApiStatusDot";
import { SolivaLogo } from "@/components/SolivaLogo";
import { AccountMenu } from "./AccountMenu";
import { useCart } from "@/features/cart/hooks/useCart";
import { useCartUIStore } from "@/features/cart/store";
import { MiniCartDrawer } from "@/features/cart/components/MiniCartDrawer";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "./SearchOverlay";
import { getLenis } from "@/lib/smooth-scroll";

const primaryLinks: readonly { to: string; label: string; search?: Record<string, string> }[] = [
  { to: "/", label: "Home" },
  { to: "/collection", label: "Collection" },
  { to: "/story", label: "Story" },
  { to: "/technology", label: "How It Works" },
];

export function Header() {
  const { itemCount: cartCount } = useCart();
  const openCart = useCartUIStore((s) => s.openCart);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      const videoSection = document.getElementById("video-section");
      const urbanSection = document.getElementById("urban-storytelling");

      if (videoSection && urbanSection) {
        const videoRect = videoSection.getBoundingClientRect();
        const urbanRect = urbanSection.getBoundingClientRect();

        if (videoRect.top <= 100 && urbanRect.top > 100) {
          setIsHidden(true);
        } else {
          setIsHidden(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();

      // Reuse the same navigation + scroll restoration flow:
      // 1. Ensure scroll is enabled and jump to top immediately.
      const lenis = getLenis();
      if (lenis) {
        lenis.start();
        lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }

      // 2. Perform a fresh navigation to trigger the route's internal reset flow.
      navigate({ to: "/" });
    }
  };

  return (
    <>
      <header
        className={cn(
          "m-header fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-700 ease-in-out",
          isHidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100",
        )}
      >
        <div
          className={cn(
            "pointer-events-auto relative mx-auto transition-all duration-700 ease-in-out flex items-center justify-between",
            "border-b backdrop-blur-xl",
            "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/15 before:to-transparent before:pointer-events-none",
            "after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-white/30 after:pointer-events-none",
            isScrolled
              ? "h-[68px] w-[min(96vw,1100px)] px-6 mt-2 rounded-[22px] border border-[#c2410c]/40 bg-[#f97316] shadow-[inset_0_6px_10px_rgba(255,255,255,0.45),inset_0_-10px_16px_rgba(124,45,18,0.5),0_20px_38px_-12px_rgba(124,45,18,0.55)]"
              : "h-[68px] w-full px-8 mt-0 rounded-none border-transparent bg-[#f97316] shadow-none",
          )}
        >
          <div
            className={cn(
              "flex h-full w-full items-center justify-between mx-auto transition-all duration-700",
              !isScrolled && "max-w-7xl",
            )}
          >
            <div className="flex items-center gap-8 lg:gap-12 h-full">
              <Link
                to="/"
                onClick={handleHomeClick}
                className="flex items-center outline-none group h-full py-3 md:py-3.5"
              >
                <img
                  src="/soliva-nav-new.webp"
                  alt="Soliva"
                  className={cn(
                    "object-contain transition-all duration-700 ease-in-out h-full w-auto max-w-[300px]",
                  )}
                />
              </Link>

              <nav className="hidden md:flex items-center gap-6 h-full">
                {primaryLinks.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    search={l.search as any}
                    onClick={l.to === "/" ? handleHomeClick : undefined}
                    className="text-[13px] font-medium tracking-tight text-white/85 hover:text-white transition-colors outline-none"
                    activeOptions={{ exact: l.to === "/" }}
                    activeProps={{ className: "text-white font-semibold" }}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-5 ml-auto">
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex h-10.5 px-3 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all outline-none group"
                  aria-label="Search"
                >
                  <Search className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <AccountMenu />

                <button
                  onClick={() => openCart()}
                  className="flex h-10.5 px-4 items-center justify-center gap-2.5 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all outline-none"
                >
                  <div id="cart-icon-target" className="relative">
                    <ShoppingBag className="h-[18px] w-[18px]" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white px-1.5 text-[9px] font-black text-[#f97316] shadow-sm">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:inline text-[13px] font-medium tracking-tight">
                    Cart
                  </span>
                </button>

                <div className="hidden lg:flex items-center ml-2 border-l border-border/10 pl-3">
                  <ApiStatusDot />
                </div>

                <div className="flex items-center md:hidden ml-1">
                  <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                      <button className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-white/10 outline-none">
                        <Menu className="h-4 w-4 text-white" />
                      </button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      aria-describedby={undefined}
                      className="w-[min(20rem,85vw)] bg-background"
                    >
                      <SheetTitle className="sr-only">Menu</SheetTitle>
                      <nav className="mt-12 flex flex-col gap-1 px-4">
                        {primaryLinks.map((l) => (
                          <Link
                            key={l.label}
                            to={l.to}
                            search={l.search as any}
                            onClick={() => {
                              setMobileOpen(false);
                              if (l.to === "/") handleHomeClick(null as any);
                            }}
                            className="py-2.5 text-sm font-medium border-b border-border/5 text-ink-default hover:text-orange-glow"
                          >
                            {l.label}
                          </Link>
                        ))}
                      </nav>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <MiniCartDrawer />
    </>
  );
}
