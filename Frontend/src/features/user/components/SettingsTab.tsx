import User from "lucide-react/dist/esm/icons/user";
import Bell from "lucide-react/dist/esm/icons/bell";
import Lock from "lucide-react/dist/esm/icons/lock";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Globe from "lucide-react/dist/esm/icons/globe";
import Phone from "lucide-react/dist/esm/icons/phone";
import Mail from "lucide-react/dist/esm/icons/mail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Session } from "@/features/auth/hooks/useSession";
import { Separator } from "@/components/ui/separator";

interface SettingsTabProps {
  session: Session;
}

export function SettingsTab({ session }: SettingsTabProps) {
  return (
    <div className="space-y-8 sm:space-y-12">
      <header className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <span className="block h-px w-6 bg-orange-glow/40" />
          <span className="font-mono text-micro-sm sm:text-micro-md tracking-editorial text-orange-glow uppercase font-bold">
            CALIBRATION
          </span>
        </div>
        <h1 className="font-display text-brown-deep tracking-tight leading-hero text-display-lg">
          Settings
        </h1>
      </header>

      <div className="space-y-6 sm:space-y-8">
        {/* Account Section */}
        <section className="bg-surface-panel/90 border border-line-hairline rounded-3xl overflow-hidden backdrop-blur-medium shadow-soft">
          <div className="p-6 sm:p-8 border-b border-line-soft bg-surface-glass-strong/30 flex items-center gap-4">
             <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <User className="h-5 w-5 text-orange-glow" />
             </div>
             <h3 className="font-display text-xl text-brown-deep font-bold uppercase tracking-tight">Account</h3>
          </div>
          <div className="p-6 sm:p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-2.5">
                <label className="ml-4 font-mono text-[10px] tracking-widest text-ink-muted uppercase font-bold">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-disabled group-focus-within:text-orange-glow transition-colors" />
                  <Input defaultValue={session.user.name} className="h-12 pl-12 rounded-2xl border-line-soft bg-cream/30 focus:border-orange-glow focus:ring-0 transition-all font-medium" />
                </div>
              </div>
              <div className="space-y-2.5">
                <label className="ml-4 font-mono text-[10px] tracking-widest text-ink-muted uppercase font-bold">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-disabled group-focus-within:text-orange-glow transition-colors" />
                  <Input defaultValue={session.user.email} disabled className="h-12 pl-12 rounded-2xl border-line-soft bg-cream/10 text-ink-muted cursor-not-allowed font-medium" />
                </div>
              </div>
            </div>
            <Button className="rounded-full bg-brown-deep text-white px-8 h-12 font-mono text-micro-sm uppercase tracking-widest shadow-md hover:bg-brown">
              Update Profile
            </Button>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-surface-panel/90 border border-line-hairline rounded-3xl overflow-hidden backdrop-blur-medium shadow-soft">
          <div className="p-6 sm:p-8 border-b border-line-soft bg-surface-glass-strong/30 flex items-center gap-4">
             <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-500" />
             </div>
             <h3 className="font-display text-xl text-brown-deep font-bold uppercase tracking-tight">Notifications</h3>
          </div>
          <div className="p-6 sm:p-10 space-y-4">
            {[
              { label: "Email Notifications", desc: "System updates and security alerts." },
              { label: "Order Updates", desc: "Real-time tracking of your Soliva protection." },
              { label: "Marketing Emails", desc: "New collections, events, and insights." },
              { label: "WhatsApp Updates", desc: "Instant mobile delivery alerts." },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-4 group last:border-0 border-b border-line-hairline">
                <div>
                  <h4 className="text-sm font-bold text-brown-deep mb-1">{item.label}</h4>
                  <p className="text-xs text-ink-muted font-medium">{item.desc}</p>
                </div>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-line-strong cursor-pointer hover:bg-orange-glow/50 transition-colors">
                  <div className="h-4 w-4 rounded-full bg-white ml-1 shadow-sm" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-surface-panel/90 border border-line-hairline rounded-3xl overflow-hidden backdrop-blur-medium shadow-soft">
          <div className="p-6 sm:p-8 border-b border-line-soft bg-surface-glass-strong/30 flex items-center gap-4">
             <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Lock className="h-5 w-5 text-green-600" />
             </div>
             <h3 className="font-display text-xl text-brown-deep font-bold uppercase tracking-tight">Security</h3>
          </div>
          <div className="p-6 sm:p-10 space-y-8">
            <div className="flex items-center justify-between py-4 border-b border-line-hairline">
              <div>
                <h4 className="text-sm font-bold text-brown-deep mb-1">Active Sessions</h4>
                <p className="text-xs text-ink-muted font-medium">Currently signed in on 2 devices.</p>
              </div>
              <Button variant="ghost" className="text-orange-glow font-mono text-[10px] tracking-widest uppercase font-black hover:bg-orange-50">
                Manage
              </Button>
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <h4 className="text-sm font-bold text-brown-deep mb-1">Password</h4>
                <p className="text-xs text-ink-muted font-medium">Last changed 4 months ago.</p>
              </div>
              <Button variant="outline" className="rounded-full border-line-strong text-ink-muted font-mono text-[10px] tracking-widest uppercase hover:text-brown-deep">
                Change
              </Button>
            </div>
            <Button variant="ghost" className="w-full text-red-500 font-mono text-micro-sm tracking-widest uppercase border border-dashed border-red-100 py-6 rounded-2xl hover:bg-red-50">
              Logout All Devices
            </Button>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="bg-orange-50/20 border border-orange-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-xl text-brown-deep font-bold uppercase tracking-tight mb-2">Danger Zone</h3>
              <p className="text-sm text-ink-muted font-medium italic">Deleting your account is permanent and cannot be undone.</p>
            </div>
            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-100/50 px-8 py-6 rounded-full border border-red-200">
               Delete Account
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
