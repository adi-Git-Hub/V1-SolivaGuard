import { useState } from "react";
import { MapPin, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useAddresses,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/features/user/profile-api";
import {
  AddressFormModal,
  type AddressForm,
} from "@/features/user/components/AddressFormModal";

type SavedAddress = AddressForm & { _id?: string; id?: string };

const aid = (a: SavedAddress) => (a._id ?? a.id) as string;

export function AddressesTab() {
  const { data: addresses = [], isLoading } = useAddresses();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SavedAddress | null>(null);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (addr: SavedAddress) => {
    setEditing(addr);
    setModalOpen(true);
  };

  async function handleSubmit(data: AddressForm) {
    try {
      if (editing) {
        await updateAddress.mutateAsync({ id: aid(editing), ...data });
        toast.success("Address updated");
      } else {
        await addAddress.mutateAsync(data);
        toast.success("Address added");
      }
      setModalOpen(false);
    } catch {
      toast.error("Could not save address. Please check the details.");
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 bg-surface-panel rounded-3xl" />
        ))}
      </div>
    );
  }

  const list = addresses as SavedAddress[];

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
        <Button
          onClick={openAdd}
          className="rounded-full bg-brown-deep text-white h-12 px-8 font-mono text-micro-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </header>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line-soft bg-surface-panel/50 p-12 text-center">
          <MapPin className="mx-auto mb-4 h-8 w-8 text-ink-muted/40" />
          <p className="mb-1 font-display text-lg text-brown-deep">No saved addresses yet</p>
          <p className="mb-6 text-sm text-ink-muted">
            Add a delivery address so checkout is one tap away.
          </p>
          <Button
            onClick={openAdd}
            className="rounded-full bg-brown-deep text-white px-7 font-mono text-micro-sm uppercase tracking-widest"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add your first address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {list.map((addr) => (
            <div
              key={aid(addr)}
              className="bg-surface-panel/90 border border-line-hairline rounded-3xl p-6 sm:p-8 backdrop-blur-medium shadow-soft group flex flex-col justify-between"
            >
              <div>
                <div className="mb-6 flex items-start justify-between">
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-colors duration-500 ${
                      addr.isDefault
                        ? "bg-orange-glow border-orange-glow text-white shadow-md"
                        : "bg-cream border-line-soft text-ink-muted group-hover:border-orange-glow/30"
                    }`}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-brown-deep/5 text-brown-deep text-[10px] font-mono tracking-widest uppercase rounded-full border border-brown-deep/10">
                      {addr.addressType || "Home"}
                    </span>
                    {addr.isDefault && (
                      <span className="px-3 py-1 bg-orange-glow/10 text-orange-glow text-[10px] font-mono tracking-widest uppercase rounded-full border border-orange-glow/20">
                        Default
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="mb-1 font-mono text-micro-md tracking-cta text-brown-deep uppercase font-black">
                  {addr.fullName}
                </h4>
                <p className="mb-3 font-mono text-[11px] tracking-wide text-ink-muted">
                  {addr.phone}
                </p>
                <p className="text-sm text-ink-muted leading-relaxed font-medium italic break-words mb-8">
                  {[addr.houseNo, addr.buildingName, addr.street, addr.landmark]
                    .filter(Boolean)
                    .join(", ")}
                  <br />
                  {addr.city}, {addr.state} {addr.pincode}
                  <br />
                  {addr.country}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-6 border-t border-line-soft">
                {!addr.isDefault && (
                  <Button
                    variant="ghost"
                    onClick={() => setDefault.mutate(aid(addr))}
                    disabled={setDefault.isPending}
                    className="flex-1 min-w-[90px] text-orange-glow hover:text-orange-glow h-10 font-mono text-micro-xs tracking-widest uppercase rounded-xl border border-transparent hover:border-orange-glow/30 transition-all"
                  >
                    <Star className="h-3.5 w-3.5 mr-1.5" />
                    Default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => openEdit(addr)}
                  className="flex-1 min-w-[80px] text-ink-muted hover:text-brown-deep h-10 font-mono text-micro-xs tracking-widest uppercase rounded-xl border border-transparent hover:border-line-soft transition-all"
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Delete this address?")) deleteAddress.mutate(aid(addr));
                  }}
                  disabled={deleteAddress.isPending}
                  className="flex-1 min-w-[80px] text-red-500/60 hover:text-red-500 h-10 font-mono text-micro-xs tracking-widest uppercase rounded-xl border border-transparent hover:border-red-100 transition-all"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Address" : "Add Address"}
        initial={editing ?? undefined}
        saving={addAddress.isPending || updateAddress.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
