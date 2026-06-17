import { motion } from "framer-motion";
import Package from "lucide-react/dist/esm/icons/package";
import Heart from "lucide-react/dist/esm/icons/heart";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Shield from "lucide-react/dist/esm/icons/shield";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import type { Session } from "@/features/auth/hooks/useSession";

interface OverviewTabProps {
  session: Session;
  stats: {
    activeOrders: number;
    wishlistCount: number;
    membershipTier: string;
    addressCount: number;
  };
  onNavigate: (tab: string) => void;
}

export function OverviewTab({ session, stats, onNavigate }: OverviewTabProps) {
  return (
    <div className="space-y-8 sm:space-y-12">
      <header className="mb-10 sm:mb-12">
        <div className="mb-4 sm:mb-6 flex items-center gap-4 sm:gap-6">
          <span className="block h-px w-6 sm:w-10 bg-orange-glow/40" />
          <span className="font-mono text-micro-sm sm:text-micro-md tracking-editorial text-orange-glow uppercase font-bold">
            YOUR DOMAIN
          </span>
        </div>
        <h1 className="font-display text-brown-deep tracking-tight leading-hero break-words text-display-lg lg:text-display-xl">
          Welcome back, <br />
          <span className="italic font-serif text-orange-glow">
            {session.user.name.split(" ")[0]}
          </span>
          .
        </h1>
      </header>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {[
          { label: "Active Orders", value: stats.activeOrders.toString().padStart(2, '0'), icon: Package, tab: "orders" },
          { label: "Wishlist Items", value: stats.wishlistCount.toString().padStart(2, '0'), icon: Heart, tab: "wishlist" },
          { label: "Membership", value: stats.membershipTier, icon: Shield, tab: "overview" },
          { label: "Saved Nodes", value: stats.addressCount.toString().padStart(2, '0'), icon: MapPin, tab: "addresses" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.95)" }}
            onClick={() => onNavigate(stat.tab)}
            className="cursor-pointer bg-surface-panel/80 border border-line-hairline rounded-2xl p-5 sm:p-6 backdrop-blur-medium shadow-soft transition-all duration-500 hover:shadow-lg hover:border-orange-glow/20"
          >
            <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-glow/70 mb-3 sm:mb-4" />
            <div className="font-mono text-xl sm:text-2xl text-brown-deep font-black mb-0.5">
              {stat.value}
            </div>
            <div className="font-mono text-[9px] sm:text-micro-xs tracking-cta text-ink-muted uppercase font-bold">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Membership Card */}
        <div className="lg:col-span-1 bg-brown-deep rounded-3xl p-6 sm:p-8 text-cream shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-glow/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-orange-glow/20 transition-all duration-1000" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6 sm:mb-8">
              <div>
                <span className="font-mono text-[10px] tracking-widest uppercase text-cream/60 block mb-1">Current Tier</span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Guardian</h3>
              </div>
              <Shield className="h-8 w-8 text-orange-glow" />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="font-mono text-micro-sm font-bold uppercase tracking-widest text-orange-glow">420 Points</span>
                <span className="font-mono text-[10px] text-cream/50 uppercase">80 to Elite</span>
              </div>
              <div className="h-1.5 w-full bg-cream/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "84%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-orange-glow shadow-[0_0_8px_rgba(245,130,13,0.5)]" 
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-cream/10">
              {[
                "Early Access",
                "Exclusive Colors",
                "Priority Support",
                "Community Access",
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-medium text-cream/80">
                  <CheckCircle2 className="h-3.5 w-3.5 text-orange-glow" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Mini Feed */}
        <div className="lg:col-span-2 bg-surface-panel border border-line-hairline rounded-3xl p-6 sm:p-8 backdrop-blur-medium shadow-sm">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h3 className="font-display text-xl sm:text-2xl text-brown-deep tracking-tight font-bold">
              Recent activity
            </h3>
            <button onClick={() => onNavigate("overview")} className="text-orange-glow font-mono text-micro-sm tracking-widest uppercase font-bold flex items-center gap-1 hover:gap-2 transition-all">
              Details <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-6">
            {[
              { label: "Order Shipped", date: "Today", icon: Package, color: "text-blue-500" },
              { label: "Address Updated", date: "2 days ago", icon: MapPin, color: "text-orange-glow" },
              { label: "Wishlist Added", date: "May 12", icon: Heart, color: "text-red-400" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-cream flex items-center justify-center shrink-0">
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-brown-deep uppercase tracking-wide leading-none mb-1">
                    {activity.label}
                  </div>
                  <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
