import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { useOrder } from "@/features/orders/api";
import { OrderExperience } from "@/features/orders/components/OrderExperience";

export const Route = createFileRoute("/_public/track/$orderId")({
  component: TrackOrderRoute,
  head: () => ({ meta: [{ title: "Track Order — SOLIVA" }] }),
});

function TrackOrderRoute() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, isError } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FAF7F3]">
        <Loader2 className="h-7 w-7 animate-spin text-orange-glow" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FAF7F3] px-6 text-center">
        <div>
          <p className="font-display text-xl text-brown-deep">Order not found</p>
          <p className="mt-1 text-sm text-ink-muted">It may have been removed, or you need to sign in.</p>
          <button
            onClick={() => navigate({ to: "/profile" })}
            className="mt-5 rounded-full bg-brown-deep px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FAF7F3] text-brown-deep safe-x pb-24">
      <OrderExperience order={order} mode="track" />
    </div>
  );
}
