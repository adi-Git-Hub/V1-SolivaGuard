import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Truck, Receipt, Mail, Shield, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsRoute,
});

const STORAGE_KEY = "soliva_admin_settings";

type Settings = {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  shippingCharge: string;
  freeShippingThreshold: string;
  gstPercent: string;
  autoConfirm: boolean;
  autoSendEmails: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  sessionTimeout: string;
};

const DEFAULTS: Settings = {
  siteName: "Soliva",
  supportEmail: "support@solivaguard.com",
  supportPhone: "+91 98765 43210",
  shippingCharge: "99",
  freeShippingThreshold: "999",
  gstPercent: "18",
  autoConfirm: false,
  autoSendEmails: true,
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  sessionTimeout: "60",
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

function AdminSettingsRoute() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      toast.success("Settings saved");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Failed to save settings");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="font-mono text-[0.5rem] tracking-[0.32em] uppercase font-bold text-[#B88445] mb-1">Configuration</p>
        <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-[#2D241E]">Settings</h1>
        <p className="mt-1 text-[0.8125rem] text-[#3a2a22]/45">Storefront and operational configuration</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* General */}
        <SettingsSection icon={Globe} title="General">
          <Field label="Site Name">
            <input value={settings.siteName} onChange={e => set("siteName", e.target.value)} className={inp} />
          </Field>
          <Field label="Support Email">
            <input type="email" value={settings.supportEmail} onChange={e => set("supportEmail", e.target.value)} className={inp} />
          </Field>
          <Field label="Support Phone">
            <input value={settings.supportPhone} onChange={e => set("supportPhone", e.target.value)} className={inp} />
          </Field>
        </SettingsSection>

        {/* Shipping */}
        <SettingsSection icon={Truck} title="Shipping">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Shipping Charge (₹)">
              <input type="number" min="0" value={settings.shippingCharge} onChange={e => set("shippingCharge", e.target.value)} className={inp} />
            </Field>
            <Field label="Free Shipping Above (₹)">
              <input type="number" min="0" value={settings.freeShippingThreshold} onChange={e => set("freeShippingThreshold", e.target.value)} className={inp} />
            </Field>
          </div>
        </SettingsSection>

        {/* Tax */}
        <SettingsSection icon={Receipt} title="Tax">
          <Field label="GST Percentage (%)" hint="Applied to all orders">
            <input type="number" min="0" max="100" step="0.01" value={settings.gstPercent} onChange={e => set("gstPercent", e.target.value)} className={inp} />
          </Field>
        </SettingsSection>

        {/* Orders */}
        <SettingsSection icon={CheckCircle2} title="Order Settings">
          <ToggleField
            label="Auto-confirm Orders"
            hint="Automatically move paid orders to Confirmed"
            value={settings.autoConfirm}
            onChange={v => set("autoConfirm", v)}
          />
          <ToggleField
            label="Auto-send Order Emails"
            hint="Send status update emails to customers"
            value={settings.autoSendEmails}
            onChange={v => set("autoSendEmails", v)}
          />
        </SettingsSection>

        {/* Email */}
        <SettingsSection icon={Mail} title="Email / SMTP">
          <div className="grid grid-cols-2 gap-4">
            <Field label="SMTP Host">
              <input value={settings.smtpHost} onChange={e => set("smtpHost", e.target.value)} placeholder="smtp.example.com" className={inp} />
            </Field>
            <Field label="SMTP Port">
              <input type="number" value={settings.smtpPort} onChange={e => set("smtpPort", e.target.value)} className={inp} />
            </Field>
          </div>
          <Field label="SMTP Username / Email">
            <input value={settings.smtpUser} onChange={e => set("smtpUser", e.target.value)} placeholder="noreply@solivaguard.com" className={inp} />
          </Field>
          <p className="font-mono text-[0.48rem] text-[#3a2a22]/35">
            SMTP password is managed via server environment variables for security.
          </p>
        </SettingsSection>

        {/* Security */}
        <SettingsSection icon={Shield} title="Security">
          <Field label="Admin Session Timeout (minutes)" hint="0 = no timeout">
            <input type="number" min="0" value={settings.sessionTimeout} onChange={e => set("sessionTimeout", e.target.value)} className={inp} />
          </Field>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
            <p className="font-mono text-[0.5rem] tracking-[0.12em] uppercase font-bold text-amber-700 mb-1">Password Policy</p>
            <p className="text-[0.75rem] text-amber-700/70">Minimum 8 characters, 1 uppercase, 1 number. Managed in authentication service.</p>
          </div>
        </SettingsSection>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-xl bg-[#B88445] px-8 py-3 font-mono text-[0.5rem] tracking-[0.22em] uppercase font-bold text-white transition-all hover:bg-[#D4A05C] active:scale-[0.98]"
          >
            Save Settings
          </button>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 font-mono text-[0.5rem] tracking-[0.16em] uppercase font-bold text-emerald-600"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </motion.span>
          )}
        </div>

        <p className="font-mono text-[0.48rem] text-[#3a2a22]/30">
          Settings are saved locally. Backend integration required for server-side enforcement.
        </p>
      </form>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
const inp = "w-full rounded-xl border border-[#3a2a22]/10 bg-[#F7F3EC] px-3.5 py-2.5 text-[0.8125rem] text-[#2D241E] placeholder-[#3a2a22]/30 outline-none transition-colors focus:border-[#B88445]/40 focus:ring-2 focus:ring-[#B88445]/10";

function SettingsSection({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-5 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.06)]"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#B88445]/10">
          <Icon className="h-3.5 w-3.5 text-[#B88445]" />
        </div>
        <p className="font-mono text-[0.5rem] tracking-[0.24em] uppercase font-bold text-[#3a2a22]/45">{title}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="font-mono text-[0.5rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/50">{label}</label>
        {hint && <span className="font-mono text-[0.45rem] text-[#3a2a22]/30">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ToggleField({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[0.8125rem] font-medium text-[#2D241E]">{label}</p>
        {hint && <p className="font-mono text-[0.48rem] text-[#3a2a22]/35 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${value ? "bg-[#B88445]" : "bg-[#3a2a22]/15"}`}
      >
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
