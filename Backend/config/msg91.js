// ── MSG91 SMS provider configuration ────────────────────────────────────────
// Credentials are read from env with safe PLACEHOLDER defaults so the app boots
// without them — the Phone OTP feature simply stays dormant (isConfigured() ===
// false) until real values are set. No code change is needed to go live.
//
// PRODUCTION DEPLOYMENT — set these in .env and restart the backend:
//   MSG91_AUTH_KEY        account auth key from the MSG91 dashboard
//   MSG91_SENDER_ID       6-char DLT-approved sender/header (e.g. SOLIVA)
//   MSG91_TEMPLATE_ID     DLT-approved Flow template id carrying the {{otp}} var
//   MSG91_OTP_TEMPLATE_ID (optional) template id for MSG91's managed OTP API
//   MSG91_COUNTRY_CODE    (optional) default '91'
//   MSG91_MOCK=true       TEST ONLY — enable the feature but LOG the OTP to the
//                         server log instead of sending a real SMS.
//
// Once real credentials are present the feature turns on automatically on the
// next backend restart — nothing else to deploy.

const PLACEHOLDER = {
  AUTH_KEY: 'REPLACE_WITH_MSG91_AUTH_KEY',
  SENDER_ID: 'SOLIVA',
  TEMPLATE_ID: 'REPLACE_WITH_MSG91_TEMPLATE_ID',
};

const config = {
  authKey: process.env.MSG91_AUTH_KEY || PLACEHOLDER.AUTH_KEY,
  senderId: process.env.MSG91_SENDER_ID || PLACEHOLDER.SENDER_ID,
  templateId: process.env.MSG91_TEMPLATE_ID || PLACEHOLDER.TEMPLATE_ID,
  otpTemplateId: process.env.MSG91_OTP_TEMPLATE_ID || '',
  baseUrl: process.env.MSG91_BASE_URL || 'https://control.msg91.com/api/v5',
  countryCode: process.env.MSG91_COUNTRY_CODE || '91',
  // TEST-only switch: run the full flow but log the OTP instead of sending SMS.
  mock: String(process.env.MSG91_MOCK || '').toLowerCase() === 'true',
};

// True only when real (non-placeholder) credentials are present.
function hasRealCredentials() {
  return (
    !!config.authKey &&
    config.authKey !== PLACEHOLDER.AUTH_KEY &&
    !!config.templateId &&
    config.templateId !== PLACEHOLDER.TEMPLATE_ID
  );
}

// The feature is "on" when real creds exist OR mock mode is explicitly enabled
// for testing. When on but without real creds, OTPs are logged, not sent.
function isConfigured() {
  return hasRealCredentials() || config.mock;
}

module.exports = { config, isConfigured, hasRealCredentials, PLACEHOLDER };
