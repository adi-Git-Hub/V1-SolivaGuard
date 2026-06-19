import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, AlertCircle, Wind, Droplets, Eye, Sunrise, Sunset, Thermometer, Sun, CloudSun } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface WeatherData {
  city: string;
  state: string;
  temp: number;
  feelsLike: number;
  condition: string;
  conditionId: number;
  humidity: number;
  windKph: number;
  visibilityKm: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  currentTime: string;
}

type ExposureLevel = "LOW" | "MODERATE" | "HIGH" | "EXTREME" | "GOOD" | "POOR";

// ── API helpers ───────────────────────────────────────────────────────────────
const OWM_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string;

async function geocode(city: string, state?: string): Promise<{ lat: number; lon: number }> {
  const q = [city, state, "IN"].filter(Boolean).join(",");
  const res = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${OWM_KEY}`,
  );
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.length) throw new Error(`City not found: ${city}`);
  return { lat: data[0].lat, lon: data[0].lon };
}

function fmtTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

async function fetchWeather(city: string, state?: string): Promise<WeatherData> {
  const { lat, lon } = await geocode(city, state);

  const [weatherRes, uviRes] = await Promise.allSettled([
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_KEY}`,
    ),
    fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`),
  ]);

  if (weatherRes.status === "rejected" || !weatherRes.value.ok)
    throw new Error("Weather fetch failed");

  const w = await weatherRes.value.json();
  let uvIndex = 0;
  if (uviRes.status === "fulfilled" && uviRes.value.ok) {
    const uvi = await uviRes.value.json();
    uvIndex = typeof uvi.value === "number" ? uvi.value : 0;
  }

  const now = new Date();
  const currentTime = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return {
    city: w.name || city,
    state: state || "",
    temp: Math.round(w.main.temp),
    feelsLike: Math.round(w.main.feels_like),
    condition: w.weather[0]?.description ?? "Clear",
    conditionId: w.weather[0]?.id ?? 800,
    humidity: w.main.humidity,
    windKph: Math.round((w.wind?.speed ?? 0) * 3.6),
    visibilityKm: Math.round((w.visibility ?? 10000) / 1000),
    uvIndex: Math.round(uvIndex * 10) / 10,
    sunrise: fmtTime(w.sys.sunrise),
    sunset: fmtTime(w.sys.sunset),
    currentTime,
  };
}

// ── Derived helpers ───────────────────────────────────────────────────────────
function weatherEmoji(id: number): string {
  if (id >= 200 && id < 300) return "⛈";
  if (id >= 300 && id < 400) return "🌦";
  if (id >= 500 && id < 600) return "🌧";
  if (id >= 600 && id < 700) return "❄";
  if (id >= 700 && id < 800) return "🌫";
  if (id === 800) return "☀";
  if (id === 801) return "🌤";
  if (id <= 804) return "☁";
  return "🌤";
}

function heatLevel(feelsLike: number): ExposureLevel {
  if (feelsLike >= 45) return "EXTREME";
  if (feelsLike >= 38) return "HIGH";
  if (feelsLike >= 28) return "MODERATE";
  return "LOW";
}

function uvLevel(uvi: number): ExposureLevel {
  if (uvi >= 11) return "EXTREME";
  if (uvi >= 8) return "HIGH";
  if (uvi >= 3) return "MODERATE";
  return "LOW";
}

function visibilityLevel(km: number): ExposureLevel {
  if (km >= 8) return "GOOD";
  if (km >= 4) return "MODERATE";
  if (km >= 1) return "LOW";
  return "POOR";
}

function comfortLevel(feelsLike: number, humidity: number): ExposureLevel {
  const discomfort = feelsLike * 0.6 + humidity * 0.15;
  if (discomfort >= 42) return "EXTREME";
  if (discomfort >= 35) return "HIGH";
  if (discomfort >= 28) return "MODERATE";
  return "LOW";
}

function protectionScore(feelsLike: number, uvi: number): number {
  const uvScore = Math.min(6, (uvi / 11) * 6);
  const heatScore = Math.min(4, Math.max(0, (feelsLike - 20) / 30) * 4);
  return Math.min(10, Math.round((uvScore + heatScore) * 10) / 10);
}

function recommendation(w: WeatherData): string {
  const id = w.conditionId;
  if (id >= 200 && id < 300)
    return "Thunderstorm conditions detected. Avoid outdoor exposure. If commuting, ensure maximum coverage from rain and wind.";
  if (id >= 500 && id < 600)
    return "Rain expected. Carry full face and neck protection for your commute. Wet conditions may reduce UV but increase chill factor.";
  if (id >= 600 && id < 700)
    return "Cold conditions with poor visibility. Layer up and protect exposed skin from wind chill.";
  if (id >= 700 && id < 800)
    return "Reduced visibility due to fog or haze. Exercise caution during commuting. Eye and face coverage recommended.";
  if (w.uvIndex >= 8)
    return `UV index at ${w.uvIndex} — extreme UV radiation. Full face, neck, and arm protection strongly advised. Limit outdoor time between 10 AM – 4 PM.`;
  if (w.feelsLike >= 40)
    return `Feels like ${w.feelsLike}°C — heat stress risk is high. SunWrap protection recommended before any outdoor activity.`;
  if (w.windKph >= 30)
    return `Strong winds at ${w.windKph} km/h. Secure coverage to prevent displacement. Additional wrap coverage advised.`;
  if (w.uvIndex >= 3)
    return `Moderate UV levels detected. Face and neck protection advised for commutes over 15 minutes.`;
  return "Comfortable outdoor conditions today. Light protection is sufficient for short commutes.";
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const badgeStyle: Record<ExposureLevel, string> = {
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  MODERATE: "bg-amber-50 text-amber-700 border-amber-200/80",
  HIGH: "bg-orange-50 text-[#c76600] border-orange-200/80",
  EXTREME: "bg-red-50 text-red-700 border-red-200/80",
  GOOD: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  POOR: "bg-red-50 text-red-700 border-red-200/80",
};

function Badge({ level }: { level: ExposureLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.12em] ${badgeStyle[level]}`}
    >
      {level}
    </span>
  );
}

// ── Circular progress ring ────────────────────────────────────────────────────
function ProtectionRing({ score }: { score: number }) {
  const R = 32;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - score / 10);
  const color = score >= 8 ? "#c0392b" : score >= 6 ? "#c76600" : score >= 4 ? "#d97706" : "#059669";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={R} fill="none" stroke="#e5d5c5" strokeWidth="6" />
          <motion.circle
            cx="40"
            cy="40"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-lg leading-none text-brown-deep">{score}</span>
          <span className="font-mono text-[0.52rem] font-bold text-ink-muted/60 tracking-wide">/ 10</span>
        </div>
      </div>
      <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[#c76600]">
        Protection Score
      </p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-[#e8d9c6]" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-24 rounded bg-[#e8d9c6]" />
          <div className="h-2 w-16 rounded bg-[#e8d9c6]" />
        </div>
      </div>
      <div className="h-8 w-20 rounded bg-[#e8d9c6]" />
      <div className="grid grid-cols-2 gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-7 rounded-lg bg-[#e8d9c6]" />
        ))}
      </div>
      <div className="h-16 rounded-xl bg-[#e8d9c6]" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  city?: string;
  state?: string;
}

export function OutdoorIntelligence({ city, state }: Props) {
  const resolvedCity = city || "Nagpur";
  const resolvedState = state || "Maharashtra";

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["outdoor-intel", resolvedCity, resolvedState],
    queryFn: () => fetchWeather(resolvedCity, resolvedState),
    staleTime: 30 * 60 * 1000,
    gcTime: 35 * 60 * 1000,
    retry: 1,
  });

  return (
    <section className="rounded-2xl sm:rounded-panel border border-line-hairline bg-gradient-to-br from-[#FBF6F0] via-[#F7EFE4]/80 to-[#F2E6D5]/60 p-5 sm:p-6 backdrop-blur-medium shadow-sm overflow-hidden relative">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#c76600]/[0.06] blur-2xl"
      />

      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-orange-glow/10 text-orange-glow">
              <CloudSun className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-[0.82rem] font-semibold tracking-tight text-brown-deep leading-tight">
              Soliva Outdoor Intelligence
            </span>
          </div>
          <p className="mt-1 ml-9 font-mono text-[0.58rem] font-medium uppercase tracking-[0.18em] text-ink-muted/60">
            Real-time environmental conditions
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/60 border border-line-hairline text-ink-muted/50 transition-all hover:text-orange-glow hover:bg-white disabled:opacity-40"
          aria-label="Refresh weather"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c76600]/15 to-transparent mb-4" />

      {/* Loading */}
      {isLoading && <Skeleton />}

      {/* Error */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <AlertCircle className="h-8 w-8 text-ink-muted/30" />
          <div>
            <p className="text-sm font-medium text-brown-deep">Weather data unavailable</p>
            <p className="mt-0.5 text-[11px] font-light text-ink-muted/70">
              Unable to load current outdoor conditions.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-1 rounded-full border border-[#c76600]/30 bg-orange-glow/5 px-4 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-widest text-[#c76600] transition-all hover:bg-orange-glow/10"
          >
            Retry
          </button>
        </div>
      )}

      {/* Data */}
      <AnimatePresence>
        {data && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Hero — icon + location + temp */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white/80 to-[#f7efe4]/60 border border-line-hairline shadow-sm text-2xl">
                  {weatherEmoji(data.conditionId)}
                </div>
                <div>
                  <p className="font-display text-[0.78rem] font-semibold text-brown-deep leading-tight">
                    {data.city}{data.state ? `, ${data.state}` : ""}
                  </p>
                  <p className="mt-0.5 font-mono text-[0.6rem] text-ink-muted/60 capitalize">
                    {data.condition}
                  </p>
                  <p className="mt-0.5 font-mono text-[0.6rem] text-ink-muted/50">{data.currentTime}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-display text-3xl font-bold leading-none text-brown-deep">
                  {data.temp}°
                </p>
                <p className="mt-1 font-mono text-[0.58rem] text-ink-muted/60">
                  Feels {data.feelsLike}°C
                </p>
              </div>
            </div>

            {/* Environment grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { icon: Thermometer, label: "Temp", value: `${data.temp}°C` },
                { icon: Sun, label: "UV Index", value: String(data.uvIndex) },
                { icon: Wind, label: "Wind", value: `${data.windKph} km/h` },
                { icon: Droplets, label: "Humidity", value: `${data.humidity}%` },
                { icon: Eye, label: "Visibility", value: `${data.visibilityKm} km` },
                { emoji: "🌤", label: "Condition", value: data.condition.slice(0, 10) },
                { icon: Sunrise, label: "Sunrise", value: data.sunrise },
                { icon: Sunset, label: "Sunset", value: data.sunset },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-xl border border-line-hairline bg-white/50 px-2.5 py-2 transition-all hover:bg-white/75"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-orange-glow/8 text-[#c76600]">
                    {"icon" in item && item.icon ? (
                      <item.icon className="h-2.5 w-2.5" />
                    ) : (
                      <span className="text-[0.62rem]">{(item as any).emoji}</span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink-muted/55">
                      {item.label}
                    </p>
                    <p className="truncate font-mono text-[0.68rem] font-semibold text-brown-deep leading-tight">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c76600]/12 to-transparent" />

            {/* Exposure Report + Protection Score */}
            <div className="flex items-start gap-3">
              {/* Exposure badges */}
              <div className="flex-1 space-y-1.5">
                <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.18em] text-brown-deep/70 mb-2">
                  Today's Exposure Report
                </p>
                {[
                  { label: "Heat Exposure", level: heatLevel(data.feelsLike) },
                  { label: "UV Exposure", level: uvLevel(data.uvIndex) },
                  { label: "Visibility", level: visibilityLevel(data.visibilityKm) },
                  { label: "Outdoor Comfort", level: comfortLevel(data.feelsLike, data.humidity) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[0.6rem] text-ink-muted/70 leading-tight">
                      {row.label}
                    </span>
                    <Badge level={row.level as ExposureLevel} />
                  </div>
                ))}
              </div>

              {/* Protection ring */}
              <ProtectionRing score={protectionScore(data.feelsLike, data.uvIndex)} />
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c76600]/12 to-transparent" />

            {/* Smart Recommendation */}
            <div className="rounded-xl border border-[#c76600]/15 bg-gradient-to-br from-orange-glow/[0.04] to-transparent p-3">
              <p className="mb-1.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#c76600]">
                Smart Recommendation
              </p>
              <p className="text-[0.72rem] font-light leading-relaxed text-brown-deep/80">
                {recommendation(data)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
