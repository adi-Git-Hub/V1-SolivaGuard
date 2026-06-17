import { useState, useEffect } from "react";
import Shield from "lucide-react/dist/esm/icons/shield";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Wind from "lucide-react/dist/esm/icons/wind";
import Sun from "lucide-react/dist/esm/icons/sun";
import Thermometer from "lucide-react/dist/esm/icons/thermometer";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Droplets from "lucide-react/dist/esm/icons/droplets";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// Read from env — never hardcode the key (set VITE_OPENWEATHER_API_KEY in .env).
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;

export function ProtectionDashboardTab() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const [meteoRes, aqiRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index`),
        fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`)
      ]);

      const meteoData = await meteoRes.json();
      const aqiData = await aqiRes.json();

      const current = meteoData.current;
      const aqiValue = aqiData.list[0].main.aqi; // 1-5 scale
      
      const aqiMap: Record<number, { status: string; color: string }> = {
        1: { status: "Good", color: "#22c55e" },
        2: { status: "Fair", color: "#84cc16" },
        3: { status: "Moderate", color: "#eab308" },
        4: { status: "Poor", color: "#f97316" },
        5: { status: "Very Poor", color: "#ef4444" },
      };

      setData({
        uv: current.uv_index,
        temp: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        wind: current.wind_speed_10m,
        aqi: aqiMap[aqiValue] || aqiMap[1],
        aqiValue
      });
    } catch (err) {
      setError("Failed to sync environmental intelligence.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        fetchData(latitude, longitude);
      },
      () => setError("Location access denied.")
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const getRecommendation = () => {
    if (!data) return null;
    const recs = [];
    if (data.uv >= 6) recs.push("UV index is High today. Use Full Coverage Soliva Protection.");
    else if (data.uv >= 3) recs.push("Moderate UV exposure. Sunwrap recommended for extended outdoor movement.");
    
    if (data.aqiValue >= 3) recs.push("AQI is Moderate/Poor. Use breathable protection during outdoor exposure.");
    
    if (recs.length === 0) recs.push("Clear conditions detected. Standard protection advised.");
    return recs;
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="block h-px w-6 bg-orange-glow/40" />
            <span className="font-mono text-micro-sm sm:text-micro-md tracking-editorial text-orange-glow uppercase font-bold">
              INTELLIGENCE
            </span>
          </div>
          <h1 className="font-display text-brown-deep tracking-tight leading-hero text-display-lg">
            Protection Dashboard
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={fetchLocation}
          disabled={loading}
          className="rounded-full h-12 border-line-strong text-ink-muted hover:text-brown-deep font-mono text-micro-sm uppercase tracking-widest px-8"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
          Sync Location
        </Button>
      </header>

      {error && (
        <div className="p-6 rounded-2xl bg-orange-50 border border-orange-100 text-orange-700 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: "UV Index", value: data?.uv ?? "--", sub: data?.uv >= 11 ? "Extreme" : data?.uv >= 8 ? "Very High" : data?.uv >= 6 ? "High" : "Low", icon: Sun, color: "text-orange-glow" },
          { label: "Temperature", value: data ? `${data.temp}°C` : "--", sub: "Feels real", icon: Thermometer, color: "text-red-500" },
          { label: "Humidity", value: data ? `${data.humidity}%` : "--", sub: "Relative", icon: Droplets, color: "text-blue-400" },
          { label: "AQI Status", value: data?.aqi.status ?? "--", sub: "Air Quality", icon: Wind, color: "text-green-500", customColor: data?.aqi.color },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-surface-panel/80 border border-line-hairline rounded-2xl p-5 sm:p-6 backdrop-blur-medium shadow-soft transition-all duration-500 hover:shadow-md"
          >
            <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 mb-3 sm:mb-4`} style={{ color: stat.customColor || undefined }} />
            <div className="font-mono text-xl sm:text-2xl text-brown-deep font-black mb-0.5">
              {stat.value}
            </div>
            <div className="font-mono text-[9px] sm:text-micro-xs tracking-cta text-ink-muted uppercase font-bold">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {data && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brown-deep rounded-3xl p-8 sm:p-10 text-cream shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-glow/10 rounded-full -mr-24 -mt-24 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="h-16 w-16 rounded-2xl bg-orange-glow/20 flex items-center justify-center shrink-0 border border-orange-glow/30">
              <Shield className="h-8 w-8 text-orange-glow" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">Soliva Protection Recommendation</h3>
              <div className="space-y-2">
                {getRecommendation()?.map((rec, i) => (
                  <p key={i} className="text-sm sm:text-base text-cream/80 font-medium italic">
                    • {rec}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {loading && !data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface-panel rounded-2xl"></div>
          ))}
        </div>
      )}
    </div>
  );
}
