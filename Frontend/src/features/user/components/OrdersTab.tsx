import Package from "lucide-react/dist/esm/icons/package";
import Truck from "lucide-react/dist/esm/icons/truck";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Clock from "lucide-react/dist/esm/icons/clock";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Info from "lucide-react/dist/esm/icons/info";
import { Button } from "@/components/ui/button";
import { useMyOrders } from "@/features/orders/api";
import { formatMoney } from "@/lib/format";
import { motion } from "framer-motion";

export function OrdersTab() {
  const { data: orders = [], isLoading, isError } = useMyOrders();

  if (isLoading) {
    return <div className="space-y-6">
      {[1, 2].map(i => <div key={i} className="h-64 bg-surface-panel rounded-3xl animate-pulse" />)}
    </div>;
  }

  if (isError) {
    return (
      <div className="p-12 text-center bg-orange-50/50 rounded-3xl border border-orange-100">
        <p className="font-display text-lg text-brown-deep font-bold">Unable to load orders.</p>
        <p className="text-sm text-ink-muted mt-2">Please refresh the page or try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      <header className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <span className="block h-px w-6 bg-orange-glow/40" />
          <span className="font-mono text-micro-sm sm:text-micro-md tracking-editorial text-orange-glow uppercase font-bold">
            PROCUREMENT
          </span>
        </div>
        <h1 className="font-display text-brown-deep tracking-tight leading-hero text-display-lg">
          Your Orders
        </h1>
      </header>

      {orders.length === 0 ? (
        <div className="text-center p-16 sm:p-24 bg-surface-panel/80 rounded-3xl border border-line-hairline backdrop-blur-medium shadow-soft">
          <Package className="h-16 w-16 text-ink-disabled mx-auto mb-6 opacity-30" />
          <h3 className="font-display text-2xl text-brown-deep font-bold mb-3">Your archive is empty</h3>
          <p className="text-ink-muted text-sm max-w-xs mx-auto mb-8 font-medium">When you acquire Soliva protection, your journey will appear here.</p>
          <Button className="rounded-full bg-brown-deep text-white px-10 py-6 uppercase font-bold tracking-cta text-micro-md">
            Start Exploring
          </Button>
        </div>
      ) : (
        <div className="space-y-8 sm:space-y-12">
          {orders.map((order) => {
            const date = new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const steps = ["Placed", "Packed", "Shipped", "Out For Delivery", "Delivered"];
            const currentStepIndex = 
              order.orderStatus === "Pending" ? 0 :
              order.orderStatus === "Processing" ? 1 :
              order.orderStatus === "Shipped" ? 2 :
              order.orderStatus === "Delivered" ? 4 : 1;

            return (
              <div
                key={order.id}
                className="bg-surface-panel/90 border border-line-hairline rounded-3xl p-6 sm:p-10 backdrop-blur-medium shadow-soft group"
              >
                {/* Header info */}
                <div className="flex flex-col lg:flex-row justify-between gap-6 pb-8 border-b border-line-soft mb-8">
                  <div className="flex gap-4 sm:gap-6">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-cream flex items-center justify-center p-2 shrink-0 border border-line-hairline overflow-hidden">
                      {order.orderItems[0]?.image ? (
                        <img src={order.orderItems[0].image} alt={order.orderItems[0].name} className="h-full w-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <Package className="h-8 w-8 text-ink-disabled opacity-40" />
                      )}
                    </div>
                    <div>
                      <span className="block font-mono text-[10px] tracking-widest text-ink-muted uppercase font-bold mb-1">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <h4 className="font-display text-lg sm:text-xl text-brown-deep font-bold mb-1 truncate max-w-[200px] sm:max-w-sm">
                        {order.orderItems[0]?.name || "Soliva Protection"}
                      </h4>
                      <p className="text-xs text-ink-muted font-medium uppercase tracking-widest">{date} • {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center lg:items-end flex-row lg:flex-col justify-between gap-4">
                    <div className="lg:text-right">
                      <span className="block font-mono text-[9px] tracking-cta text-ink-muted uppercase font-bold mb-0.5">
                        Total Value
                      </span>
                      <span className="font-display text-xl sm:text-2xl text-brown-deep font-bold tracking-tight">
                        {formatMoney(order.totalPrice * 100, "INR")}
                      </span>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full font-mono text-[10px] font-black uppercase tracking-widest border ${
                      order.orderStatus === 'Delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                      order.orderStatus === 'Shipped' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-orange-50 text-orange-glow border-orange-100'
                    }`}>
                      {order.orderStatus}
                    </div>
                  </div>
                </div>

                {/* Timeline - Modern UI */}
                <div className="mb-12">
                  {/* Desktop Horizontal */}
                  <div className="hidden sm:flex items-center justify-between relative px-2">
                    <div className="absolute top-4 left-0 right-0 h-[2px] bg-line-soft -z-10" />
                    <div 
                      className="absolute top-4 left-0 h-[2px] bg-orange-glow transition-all duration-1000 ease-in-out -z-10"
                      style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    />
                    {steps.map((step, i) => (
                      <div key={i} className="flex flex-col items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-sm ${
                          i <= currentStepIndex ? "border-orange-glow bg-orange-glow text-white scale-110" : "border-line-strong bg-white text-ink-disabled"
                        }`}>
                          {i < currentStepIndex ? <CheckCircle2 className="h-4 w-4" /> : <div className={`h-1.5 w-1.5 rounded-full ${i === currentStepIndex ? 'bg-white animate-pulse' : 'bg-current opacity-30'}`} />}
                        </div>
                        <span className={`font-mono text-[9px] uppercase tracking-widest text-center whitespace-nowrap ${i <= currentStepIndex ? "text-brown-deep font-bold" : "text-ink-disabled"}`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Mobile Vertical */}
                  <div className="flex sm:hidden flex-col gap-6 relative pl-6">
                    <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-line-soft -z-10" />
                    <div 
                      className="absolute left-[11px] top-0 w-[2px] bg-orange-glow transition-all duration-1000 -z-10"
                      style={{ height: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    />
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                          i <= currentStepIndex ? "border-orange-glow bg-orange-glow text-white" : "border-line-strong bg-white text-ink-disabled"
                        }`}>
                           {i < currentStepIndex ? <CheckCircle2 className="h-3 w-3" /> : <div className={`h-1 w-1 rounded-full ${i === currentStepIndex ? 'bg-white' : 'bg-current opacity-30'}`} />}
                        </div>
                        <span className={`font-mono text-[10px] uppercase tracking-widest ${i <= currentStepIndex ? "text-brown-deep font-bold" : "text-ink-disabled"}`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Delivery Intelligence Card */}
                  <div className="md:col-span-2 bg-surface-glass-strong rounded-2xl p-6 border border-line-soft shadow-inner-light">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-8 w-8 rounded-xl bg-brown-deep/5 flex items-center justify-center">
                        <Truck className="h-4 w-4 text-brown-deep" />
                      </div>
                      <h5 className="font-mono text-micro-sm tracking-widest uppercase text-brown-deep font-bold">Delivery Intelligence</h5>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                        <span className="block font-mono text-[9px] text-ink-muted uppercase tracking-widest mb-1">Expected Delivery</span>
                        <p className="text-sm font-bold text-brown-deep italic">
                          {order.orderStatus === 'Delivered' ? 'Completed' : 'Within 4-6 business days'}
                        </p>
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] text-ink-muted uppercase tracking-widest mb-1">Courier</span>
                        <p className="text-sm font-bold text-brown-deep">Standard Logistics</p>
                      </div>
                      <div className="col-span-2">
                         <div className="flex items-start gap-2 p-3 rounded-xl bg-brown/5 border border-brown/10">
                            <Info className="h-3.5 w-3.5 text-brown-deep/40 mt-0.5" />
                            <p className="text-[11px] text-brown-deep/70 italic leading-relaxed">
                              Tracking information will appear once shipment is assigned by our logistics partner.
                            </p>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-col justify-end gap-3">
                    <Button variant="outline" className="w-full rounded-full h-12 font-mono text-micro-sm tracking-widest uppercase border-line-strong text-ink-muted hover:text-brown-deep hover:bg-white shadow-soft transition-all">
                      View Details
                    </Button>
                    <Button className="w-full rounded-full h-12 font-mono text-micro-sm tracking-widest uppercase bg-brown-deep text-white hover:bg-brown shadow-lg hover:shadow-xl transition-all">
                      Procure Again
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
