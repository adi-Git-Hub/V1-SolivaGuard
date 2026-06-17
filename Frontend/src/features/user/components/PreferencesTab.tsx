import { useState, useEffect } from "react";
import { toast } from "sonner";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
import { Button } from "@/components/ui/button";
import { usePreferences, useUpdatePreferences } from "@/features/user/profile-api";

export function PreferencesTab() {
  const { data: preferences, isLoading } = usePreferences();
  const updatePreferences = useUpdatePreferences();

  const [formData, setFormData] = useState({
    commuteType: "Bike",
    outdoorExposure: "1-2 hours",
    locationPreference: { autoDetect: true },
    notifications: {
      uvAlerts: true,
      aqiAlerts: true,
      orderUpdates: true,
      emailNotifications: true,
    },
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        commuteType: preferences.commuteType || "Bike",
        outdoorExposure: preferences.outdoorExposure || "1-2 hours",
        locationPreference: preferences.locationPreference || { autoDetect: true },
        notifications: preferences.notifications || {
          uvAlerts: true,
          aqiAlerts: true,
          orderUpdates: true,
          emailNotifications: true,
        },
      });
    }
  }, [preferences]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences.mutate(formData, {
      onSuccess: () => toast.success("Preferences updated successfully"),
      onError: () => toast.error("Failed to update preferences"),
    });
  };

  const handleChange = (field: string, value: any, category?: "notifications" | "locationPreference") => {
    setFormData((prev) => {
      if (category) {
        return {
          ...prev,
          [category]: {
            ...prev[category],
            [field]: value,
          },
        };
      }
      return { ...prev, [field]: value };
    });
  };

  if (isLoading) {
    return <div className="h-64 bg-surface-panel rounded-2xl animate-pulse"></div>;
  }

  return (
    <div className="space-y-8">
      <header className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <span className="block h-px w-6 bg-brown/20" />
          <span className="font-mono text-micro-md tracking-editorial text-orange-glow uppercase font-bold">
            PERSONALIZATION
          </span>
        </div>
        <h1 className="font-display text-brown-deep tracking-tight leading-hero text-display-lg flex items-center gap-3">
          Preferences
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-surface-panel border border-line-hairline rounded-2xl p-8 backdrop-blur-medium shadow-sm space-y-8">
          
          {/* Commute Type */}
          <div>
            <h3 className="font-mono text-micro-lg tracking-cta text-brown-deep uppercase font-black mb-4">Commute Type</h3>
            <div className="flex flex-wrap gap-3">
              {['Bike', 'Scooter', 'Car', 'Metro', 'Walk'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('commuteType', type)}
                  className={`px-6 py-2.5 rounded-full font-mono text-micro-sm uppercase tracking-widest transition-all duration-300 ${
                    formData.commuteType === type 
                      ? 'bg-brown-deep text-white shadow-md' 
                      : 'bg-surface-glass-ghost border border-line-soft text-ink-muted hover:border-orange-glow/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-line-soft" />

          {/* Outdoor Exposure */}
          <div>
            <h3 className="font-mono text-micro-lg tracking-cta text-brown-deep uppercase font-black mb-4">Outdoor Exposure</h3>
            <div className="flex flex-wrap gap-3">
              {['Less than 1 hour', '1-2 hours', '2-4 hours', '4+ hours'].map((exposure) => (
                <button
                  key={exposure}
                  type="button"
                  onClick={() => handleChange('outdoorExposure', exposure)}
                  className={`px-6 py-2.5 rounded-full font-mono text-micro-sm uppercase tracking-widest transition-all duration-300 ${
                    formData.outdoorExposure === exposure 
                      ? 'bg-brown-deep text-white shadow-md' 
                      : 'bg-surface-glass-ghost border border-line-soft text-ink-muted hover:border-orange-glow/50'
                  }`}
                >
                  {exposure}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-line-soft" />

          {/* Location & Notifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-mono text-micro-lg tracking-cta text-brown-deep uppercase font-black mb-4">Location Settings</h3>
              <label className="flex items-center justify-between p-4 rounded-xl border border-line-soft bg-surface-glass-ghost cursor-pointer hover:border-orange-glow/30 transition-colors">
                <div>
                  <div className="font-bold text-sm text-brown-deep">Auto Detect Location</div>
                  <div className="text-xs text-ink-muted mt-1">Required for accurate environmental protection intelligence.</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.locationPreference.autoDetect}
                  onChange={(e) => handleChange('autoDetect', e.target.checked, 'locationPreference')}
                  className="w-5 h-5 accent-orange-glow cursor-pointer"
                />
              </label>
            </div>

            <div>
              <h3 className="font-mono text-micro-lg tracking-cta text-brown-deep uppercase font-black mb-4">Notifications</h3>
              <div className="space-y-3">
                {[
                  { id: 'uvAlerts', label: 'UV Alerts', desc: 'Get notified of extreme UV conditions.' },
                  { id: 'aqiAlerts', label: 'AQI Alerts', desc: 'Air quality hazard warnings.' },
                  { id: 'orderUpdates', label: 'Order Updates', desc: 'Shipping and delivery tracking.' },
                  { id: 'emailNotifications', label: 'Email Notifications', desc: 'News, launches, and insights.' },
                ].map((notif) => (
                  <label key={notif.id} className="flex items-center justify-between p-3.5 rounded-xl border border-line-soft bg-surface-glass-ghost cursor-pointer hover:border-orange-glow/30 transition-colors">
                    <div>
                      <div className="font-bold text-sm text-brown-deep">{notif.label}</div>
                      <div className="text-xs text-ink-muted mt-0.5">{notif.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={(formData.notifications as any)[notif.id]}
                      onChange={(e) => handleChange(notif.id, e.target.checked, 'notifications')}
                      className="w-5 h-5 accent-orange-glow cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={updatePreferences.isPending}
            className="rounded-full bg-brown-deep px-10 py-6 text-micro-md uppercase font-bold tracking-cta text-white shadow-lg transition-all duration-500 hover:bg-brown hover:shadow-xl"
          >
            {updatePreferences.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </form>
    </div>
  );
}
