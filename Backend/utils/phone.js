// Phone-number normalization (India-first). Existing accounts store a bare
// 10-digit national number, so that stays the canonical stored + lookup form.
const ErrorHandler = require('./errorHandler');

/**
 * Normalize arbitrary user input to a canonical Indian mobile number.
 * @returns {{ national: string, e164: string, msg91: string }}
 * @throws  ErrorHandler(400) when the number is not a valid 10-digit mobile.
 */
function normalizePhone(input, countryCode = '91') {
  const digits = String(input || '').replace(/\D/g, '');
  let national = digits;

  if (digits.length === 10) national = digits;
  else if (digits.length === 11 && digits.startsWith('0')) national = digits.slice(1);
  else if (digits.length === 12 && digits.startsWith(countryCode)) national = digits.slice(countryCode.length);
  else if (digits.length === 13 && digits.startsWith('0' + countryCode)) national = digits.slice(countryCode.length + 1);
  else national = digits.length >= 10 ? digits.slice(-10) : digits;

  // Indian mobile numbers start with 6-9 and are exactly 10 digits.
  if (!/^[6-9]\d{9}$/.test(national)) {
    throw new ErrorHandler('Please enter a valid 10-digit mobile number', 400);
  }

  return {
    national,
    e164: `+${countryCode}${national}`,
    msg91: `${countryCode}${national}`,
  };
}

// Mask for logs / API responses — never echo a full number back.
function maskPhone(national) {
  const n = String(national || '');
  if (n.length < 4) return '••••';
  return `${n.slice(0, 2)}••••${n.slice(-2)}`;
}

// Candidate stored formats so login lookups match legacy / varied data
// (some accounts may have been saved as +91…, 91…, or 0… historically).
function phoneLookupVariants(national, countryCode = '91') {
  return [national, `+${countryCode}${national}`, `${countryCode}${national}`, `0${national}`];
}

module.exports = { normalizePhone, maskPhone, phoneLookupVariants };
