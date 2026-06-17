import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Plus from "lucide-react/dist/esm/icons/plus";
import MoreVertical from "lucide-react/dist/esm/icons/more-vertical";
import Check from "lucide-react/dist/esm/icons/check";
import { Button } from "@/components/ui/button";
import { useAddresses, useDeleteAddress } from "@/features/user/profile-api";

export function AddressesTab() {
  const { data: addresses = [], isLoading } = useAddresses();
  const deleteAddress = useDeleteAddress();

  if (isLoading) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
      {[1, 2].map(i => <div key={i} className="h-48 bg-surface-panel rounded-3xl" />)}
    </div>;
  }

  // Demo fallback
  const displayAddresses = addresses.length > 0 ? addresses : [
    { id: "1", label: "Primary Residence", street: "42, Shanti Niketan", city: "New Delhi", state: "Delhi", pincode: "110021", isDefault: true },
    { id: "2", label: "Design Atelier", street: "Level 4, DLF Cyber City", city: "Gurgaon", state: "Haryana", pincode: "122002", isDefault: false },
  ];

  return (
    <div className="space-y-8 sm:space-y-12">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="block h-px w-6 bg-orange-glow/40" />
            <span className="font-mono text-micro-sm sm:text-micro-md tracking-editorial text-orange-glow uppercase font-bold">
              NODAL POINTS
            </span>
          </div>
          <h1 className="font-display text-brown-deep tracking-tight leading-hero text-display-lg">
            Saved Addresses
          </h1>
        </div>
        <Button className="rounded-full bg-brown-deep text-white h-12 px-8 font-mono text-micro-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all">
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {displayAddresses.map((addr: any) => (
          <div
            key={addr.id}
            className="bg-surface-panel/90 border border-line-hairline rounded-3xl p-6 sm:p-8 backdrop-blur-medium shadow-soft group flex flex-col justify-between"
          >
            <div>
              <div className="mb-6 flex items-start justify-between">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-colors duration-500 ${addr.isDefault ? 'bg-orange-glow border-orange-glow text-white shadow-md' : 'bg-cream border-line-soft text-ink-muted group-hover:border-orange-glow/30'}`}>
                  <MapPin className="h-5 w-5" />
                </div>
                {addr.isDefault && (
                  <span className="px-3 py-1 bg-brown-deep/5 text-brown-deep text-[10px] font-mono tracking-widest uppercase rounded-full border border-brown-deep/10">
                    Default
                  </span>
                )}
              </div>
              
              <h4 className="mb-3 font-mono text-micro-md tracking-cta text-brown-deep uppercase font-black">
                {addr.label}
              </h4>
              <p className="text-sm text-ink-muted leading-relaxed font-medium italic break-words mb-8">
                {addr.street},<br />
                {addr.city}, {addr.state} {addr.pincode}
              </p>
            </div>

            <div className="flex gap-3 pt-6 border-t border-line-soft">
              <Button
                variant="ghost"
                className="flex-1 text-ink-muted hover:text-brown-deep h-10 font-mono text-micro-xs tracking-widest uppercase rounded-xl border border-transparent hover:border-line-soft transition-all"
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                onClick={() => deleteAddress.mutate(addr.id)}
                disabled={deleteAddress.isPending}
                className="flex-1 text-red-500/60 hover:text-red-500 h-10 font-mono text-micro-xs tracking-widest uppercase rounded-xl border border-transparent hover:border-red-100 transition-all"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
