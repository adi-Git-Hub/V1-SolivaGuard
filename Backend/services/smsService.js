const axios = require('axios');
const logger = require('../utils/logger');
const ErrorHandler = require('../utils/errorHandler');
const { config, isConfigured, hasRealCredentials } = require('../config/msg91');
const { maskPhone } = require('../utils/phone');

// ── MSG91 SMS transport ──────────────────────────────────────────────────────
// The only place that talks to MSG91. Everything above it (phoneOtpService)
// is provider-agnostic, so swapping providers later touches only this file.
//
// When real credentials are absent (or MSG91_MOCK=true) the OTP is written to
// the server log instead of being sent, so every Phone OTP flow is fully
// testable before production credentials exist.

/**
 * Send a one-time code to a 10-digit national mobile number.
 * @returns {Promise<{ delivered: boolean, mock: boolean }>}
 * @throws  ErrorHandler(502) if a configured MSG91 call fails.
 */
async function sendOtpSms(national, otp) {
  const masked = maskPhone(national);

  // Mock / unconfigured → log & succeed. Real delivery stays dormant until
  // MSG91_AUTH_KEY + MSG91_TEMPLATE_ID are set.
  if (!hasRealCredentials()) {
    logger.warn(
      `[SMS:MOCK] OTP for +${config.countryCode}${masked} = ${otp} ` +
        `(MSG91 not configured — set MSG91_AUTH_KEY/MSG91_TEMPLATE_ID to send real SMS)`
    );
    return { delivered: false, mock: true };
  }

  const mobiles = `${config.countryCode}${national}`;
  try {
    const { data } = await axios.post(
      `${config.baseUrl}/flow/`,
      {
        template_id: config.templateId,
        sender: config.senderId,
        short_url: '0',
        // Provide the code under a couple of common variable names so the DLT
        // template's variable ("otp"/"OTP"/"var1") resolves regardless of setup.
        recipients: [{ mobiles, otp, OTP: otp, var1: otp }],
      },
      {
        headers: {
          authkey: config.authKey,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        timeout: 10000,
      }
    );

    if (data && (data.type === 'error' || data.hasError)) {
      throw new Error(data.message || 'MSG91 rejected the request');
    }

    logger.info(
      `[SMS] OTP sent to +${config.countryCode}${masked} via MSG91 ` +
        `(reqId=${(data && data.request_id) || 'n/a'})`
    );
    return { delivered: true, mock: false };
  } catch (err) {
    const detail = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;
    logger.error(`[SMS] MSG91 send failed for +${config.countryCode}${masked}: ${detail}`);
    throw new ErrorHandler('Could not send the SMS code. Please try again in a moment.', 502);
  }
}

module.exports = { sendOtpSms, isConfigured, hasRealCredentials };
