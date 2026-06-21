// Login location & device telemetry helpers.
//
// HARD RULE: nothing here may ever throw. Every function is wrapped so a slow
// or failing third-party geolocation lookup can never break the auth flow.
// IP lookups and reverse-geocoding run fire-and-forget AFTER login succeeds.

/** Real client IP, honouring the proxy chain (nginx → node). */
function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || '';
}

/** Private / loopback ranges can't be geolocated — skip the lookup. */
function isPrivateIp(ip) {
  if (!ip) return true;
  const v = ip.replace(/^::ffff:/, '');
  return (
    v === '::1' ||
    v.startsWith('127.') ||
    v.startsWith('10.') ||
    v.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(v) ||
    v.startsWith('169.254.')
  );
}

/** Derive friendly device / browser / OS strings from a User-Agent. No deps. */
function parseUserAgent(uaRaw = '') {
  const ua = String(uaRaw);
  const browserInfo =
    /Edg\//.test(ua)        ? 'Edge'    :
    /OPR\/|Opera/.test(ua)  ? 'Opera'   :
    /Chrome\//.test(ua) && !/Chromium/.test(ua) ? 'Chrome' :
    /Firefox\//.test(ua)    ? 'Firefox' :
    /Safari\//.test(ua)     ? 'Safari'  : 'Other';

  // Order matters: iOS UAs contain "Mac OS X" and Android UAs contain "Linux",
  // so the more specific platforms must be tested first.
  const osInfo =
    /Windows NT/.test(ua)         ? 'Windows' :
    /(iPhone|iPad|iPod)/.test(ua) ? 'iOS'     :
    /Android/.test(ua)            ? 'Android' :
    /Mac OS X|Macintosh/.test(ua) ? 'macOS'   :
    /Linux/.test(ua)              ? 'Linux'   : 'Other';

  const deviceInfo =
    /iPhone/.test(ua)            ? 'iPhone'      :
    /iPad/.test(ua)             ? 'iPad'        :
    /Android/.test(ua)          ? 'Android'     :
    /Macintosh/.test(ua)        ? 'Mac'         :
    /Windows/.test(ua)          ? 'Windows PC'  :
    /Linux/.test(ua)            ? 'Linux'       :
    /Mobile/.test(ua)           ? 'Mobile'      : 'Desktop';

  return { browserInfo, osInfo, deviceInfo };
}

const timeoutSignal = (ms) => {
  try { return AbortSignal.timeout(ms); } catch { return undefined; }
};

/**
 * IP → { city, state, country, ISP }. Returns null on any failure or for a
 * private IP. Uses ip-api.com free tier (HTTP, no key, ISP included).
 */
async function lookupIpLocation(ip) {
  try {
    if (isPrivateIp(ip)) return null;
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city,isp`,
      { signal: timeoutSignal(4000) },
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (d.status !== 'success') return null;
    return {
      lastLoginCity:    d.city || null,
      lastLoginState:   d.regionName || null,
      lastLoginCountry: d.country || null,
      lastLoginISP:     d.isp || null,
    };
  } catch {
    return null;
  }
}

/**
 * (lat, lon) → { areaName, subLocality, locality, city, state, country }.
 * Uses OpenStreetMap Nominatim (free, no key). Returns null on any failure.
 */
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=16&addressdetails=1`,
      { headers: { 'User-Agent': 'SolivaGuard-Admin/1.0' }, signal: timeoutSignal(5000) },
    );
    if (!res.ok) return null;
    const d = await res.json();
    const a = d.address || {};
    return {
      areaName:         a.suburb || a.neighbourhood || a.quarter || a.residential || null,
      subLocality:      a.neighbourhood || a.quarter || a.suburb || null,
      locality:         a.suburb || a.city_district || a.town || a.village || null,
      lastLoginCity:    a.city || a.town || a.village || a.county || null,
      lastLoginState:   a.state || null,
      lastLoginCountry: a.country || null,
    };
  } catch {
    return null;
  }
}

module.exports = { getClientIp, isPrivateIp, parseUserAgent, lookupIpLocation, reverseGeocode };
