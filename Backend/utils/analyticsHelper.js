const crypto = require('crypto');

/**
 * Categorize traffic source from referrer URL and UTM campaign parameters
 */
function parseTrafficSource(referrer = '', utm = {}) {
  const ref = (referrer || '').toLowerCase();
  const utmSource = (utm?.source || '').toLowerCase();
  const utmMedium = (utm?.medium || '').toLowerCase();
  const utmCampaign = (utm?.campaign || '').toLowerCase();

  // 1. Paid Meta Ads / Campaign
  if (
    utmCampaign &&
    (utmSource.includes('meta') ||
      utmSource.includes('facebook') ||
      utmSource.includes('fb') ||
      utmSource.includes('instagram') ||
      utmSource.includes('ig') ||
      utmMedium.includes('cpc') ||
      utmMedium.includes('paid') ||
      utmMedium.includes('ad'))
  ) {
    return 'Meta Ads / Campaign';
  }

  // 2. Instagram
  if (
    utmSource.includes('instagram') ||
    utmSource.includes('ig') ||
    ref.includes('instagram.com') ||
    ref.includes('cdninstagram.com')
  ) {
    return 'Instagram';
  }

  // 3. Facebook
  if (
    utmSource.includes('facebook') ||
    utmSource.includes('fb') ||
    ref.includes('facebook.com') ||
    ref.includes('fb.com') ||
    ref.includes('messenger.com')
  ) {
    return 'Facebook';
  }

  // 4. Google / Organic Search
  if (
    utmSource.includes('google') ||
    ref.includes('google.') ||
    ref.includes('bing.') ||
    ref.includes('duckduckgo.') ||
    ref.includes('yahoo.') ||
    ref.includes('ecosia.')
  ) {
    return 'Google / Organic Search';
  }

  // 5. Other Referrals (external domain)
  if (ref) {
    try {
      const parsed = new URL(ref.startsWith('http') ? ref : `https://${ref}`);
      const hostname = parsed.hostname.toLowerCase();
      // Exclude self-referrals (solivaguard domain or localhost)
      if (
        !hostname.includes('solivaguard') &&
        !hostname.includes('localhost') &&
        !hostname.includes('127.0.0.1')
      ) {
        return 'Other Referrals';
      }
    } catch {
      // If ref is a non-empty string that doesn't parse, treat as other referral
      if (!ref.includes('solivaguard') && !ref.includes('localhost')) {
        return 'Other Referrals';
      }
    }
  }

  // 6. Direct traffic (no referrer, no UTM)
  return 'Direct';
}

/**
 * Extract Device Type, Browser, and OS from User-Agent string without heavy dependencies
 */
function parseUserAgent(uaString = '') {
  const ua = (uaString || '').toLowerCase();

  // 1. Device Type
  let deviceType = 'Desktop';
  if (
    ua.includes('ipad') ||
    ua.includes('tablet') ||
    ua.includes('playbook') ||
    ua.includes('silk') ||
    (ua.includes('android') && !ua.includes('mobile'))
  ) {
    deviceType = 'Tablet';
  } else if (
    ua.includes('mobile') ||
    ua.includes('iphone') ||
    ua.includes('ipod') ||
    ua.includes('android') ||
    ua.includes('blackberry') ||
    ua.includes('iemobile')
  ) {
    deviceType = 'Mobile';
  }

  // 2. Operating System
  let os = 'Other';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    os = 'iOS';
  } else if (ua.includes('macintosh') || (ua.includes('mac os') && !ua.includes('like mac os'))) {
    os = 'macOS';
  } else if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  // 3. Browser
  let browser = 'Other';
  if (ua.includes('edg/') || ua.includes('edge/')) {
    browser = 'Edge';
  } else if (ua.includes('opr/') || ua.includes('opera')) {
    browser = 'Opera';
  } else if (ua.includes('chrome') && !ua.includes('chromium')) {
    browser = 'Chrome';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  }

  return { deviceType, os, browser };
}

/**
 * Generate a deterministic pseudonymous visitor identifier like "Visitor #A104"
 * from a raw visitor ID string.
 */
function getPseudonym(visitorId = '') {
  if (!visitorId) return 'Visitor #GUEST';
  // Use first 4 hex chars of MD5 to create an uppercase alphanumeric code
  const hash = crypto.createHash('md5').update(String(visitorId)).digest('hex');
  const code = hash.slice(0, 4).toUpperCase();
  return `Visitor #${code}`;
}

module.exports = {
  parseTrafficSource,
  parseUserAgent,
  getPseudonym,
};
