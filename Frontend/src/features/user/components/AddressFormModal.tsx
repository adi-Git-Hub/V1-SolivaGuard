import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/* Shared address shape used across the profile address book and checkout. */
export type AddressForm = {
  fullName: string;
  phone: string;
  houseNo: string;
  buildingName: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressType: "Home" | "Work" | "Other";
  isDefault: boolean;
};

export const EMPTY_ADDRESS: AddressForm = {
  fullName: "",
  phone: "",
  houseNo: "",
  buildingName: "",
  street: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  addressType: "Home",
  isDefault: false,
};

const PHONE_RE = /^[6-9]\d{9}$/;
const PIN_RE = /^[1-9]\d{5}$/;
const onlyDigits = (s: string) => s.replace(/\D/g, "");

// Unified validation — mirrors the backend zod rules exactly.
export function validateAddress(f: AddressForm): Partial<Record<keyof AddressForm, string>> {
  const e: Partial<Record<keyof AddressForm, string>> = {};
  if (f.fullName.trim().length < 2) e.fullName = "Full name is required";
  if (!PHONE_RE.test(onlyDigits(f.phone))) e.phone = "Enter a valid 10-digit mobile number";
  if (!f.houseNo.trim()) e.houseNo = "House / Flat number is required";
  if (!f.street.trim()) e.street = "Street / Area is required";
  if (!f.city.trim()) e.city = "City is required";
  if (!f.state.trim()) e.state = "State is required";
  if (!PIN_RE.test(onlyDigits(f.pincode))) e.pincode = "Enter a valid 6-digit pincode";
  if (!f.country.trim()) e.country = "Country is required";
  return e;
}

const TYPES: AddressForm["addressType"][] = ["Home", "Work", "Other"];

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "tel";
  maxLength?: number;
  optional?: boolean;
};

function Field({ label, value, onChange, error, placeholder, inputMode, maxLength, optional }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted font-bold">
        {label}
        {optional && <span className="ml-1 normal-case tracking-normal opacity-50">(optional)</span>}
      </span>
      <input
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white/70 px-3.5 py-2.5 text-sm text-brown-deep outline-none transition-colors placeholder:text-ink-muted/40 focus:border-orange-glow ${
          error ? "border-red-400" : "border-line-soft"
        }`}
      />
      {error && <span className="mt-1 block text-[11px] text-red-500">{error}</span>}
    </label>
  );
}

export function AddressFormModal({
  open,
  onClose,
  initial,
  onSubmit,
  saving,
  title = "Add Address",
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<AddressForm>;
  onSubmit: (data: AddressForm) => void | Promise<void>;
  saving?: boolean;
  title?: string;
}) {
  const [form, setForm] = useState<AddressForm>({ ...EMPTY_ADDRESS, ...initial });
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

  // Re-seed whenever the modal is (re)opened for a different address.
  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_ADDRESS, ...initial });
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k: keyof AddressForm, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v as never }));

  function submit() {
    const e = validateAddress(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({
      ...form,
      phone: onlyDigits(form.phone).slice(-10),
      pincode: onlyDigits(form.pincode).slice(0, 6),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-brown-deep">{title}</DialogTitle>
          <DialogDescription className="text-ink-muted">
            Delivery address used for your orders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Address type */}
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("addressType", t)}
                className={`flex-1 rounded-xl border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] font-bold transition-colors ${
                  form.addressType === t
                    ? "border-orange-glow bg-orange-glow/10 text-orange-glow"
                    : "border-line-soft text-ink-muted hover:border-orange-glow/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" value={form.fullName} onChange={(v) => set("fullName", v)} error={errors.fullName} placeholder="Aditya Pande" />
            <Field label="Mobile Number" value={form.phone} onChange={(v) => set("phone", onlyDigits(v).slice(0, 10))} error={errors.phone} placeholder="98765 43210" inputMode="tel" maxLength={10} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="House / Flat No." value={form.houseNo} onChange={(v) => set("houseNo", v)} error={errors.houseNo} placeholder="D-12" />
            <Field label="Apartment / Building" value={form.buildingName} onChange={(v) => set("buildingName", v)} placeholder="Shourya Estate" optional />
          </div>

          <Field label="Street / Area" value={form.street} onChange={(v) => set("street", v)} error={errors.street} placeholder="Pipla Road" />
          <Field label="Landmark" value={form.landmark} onChange={(v) => set("landmark", v)} placeholder="Near Suman Sankul" optional />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City" value={form.city} onChange={(v) => set("city", v)} error={errors.city} placeholder="Nagpur" />
            <Field label="State" value={form.state} onChange={(v) => set("state", v)} error={errors.state} placeholder="Maharashtra" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Pincode" value={form.pincode} onChange={(v) => set("pincode", onlyDigits(v).slice(0, 6))} error={errors.pincode} placeholder="440034" inputMode="numeric" maxLength={6} />
            <Field label="Country" value={form.country} onChange={(v) => set("country", v)} error={errors.country} placeholder="India" />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="h-4 w-4 accent-orange-glow"
            />
            <span className="text-sm text-ink-muted">Set as default address</span>
          </label>
        </div>

        <div className="mt-2 flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1 rounded-full border border-line-soft">
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="flex-1 rounded-full bg-brown-deep text-white hover:bg-brown"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Address"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
