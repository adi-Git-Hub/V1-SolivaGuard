const nodemailer = require('nodemailer');
const logger = require('./logger');

// Env names match Backend/.env.example:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// Legacy names (SMTP_EMAIL / SMTP_PASSWORD / FROM_NAME) are still accepted
// as a fallback so older .env files keep working.

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const portStr = process.env.SMTP_PORT;

  if (!host) {
    throw new Error(
      'SMTP_HOST is not set. Configure SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in Backend/.env. ' +
      'For local dev, run Mailpit (docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit) ' +
      'and set SMTP_HOST=localhost, SMTP_PORT=1025 (no user/pass).'
    );
  }

  const port = Number(portStr) || 587;
  // 465 uses implicit TLS; 587 / 25 / 1025 use STARTTLS (or plain in dev).
  const secure = port === 465;

  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

  const transportOpts = {
    host,
    port,
    secure,
    // Short timeouts so a misconfigured / blocked SMTP host fails fast
    // (default Nodemailer timeouts can hang an API request for minutes).
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  };
  if (user && pass) {
    transportOpts.auth = { user, pass };
  }

  return nodemailer.createTransport(transportOpts);
}

function buildFrom() {
  // Prefer SMTP_FROM ("Name <addr>") verbatim. Fall back to a Name+addr build.
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  const name = process.env.FROM_NAME || 'Soliva';
  const addr =
    process.env.SMTP_USER ||
    process.env.SMTP_EMAIL ||
    'no-reply@soliva.example';
  return `${name} <${addr}>`;
}

// Transient SMTP/network failures worth retrying. GoDaddy (smtpout.secureserver.net)
// intermittently resets the connection (ECONNRESET) or stalls the greeting from
// this server, so a single send can fail even when the host is otherwise fine.
const TRANSIENT_ERRORS = new Set([
  'ECONNRESET', 'ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ECONNREFUSED', 'EAI_AGAIN', 'EPIPE',
]);

function isTransient(err) {
  if (err && TRANSIENT_ERRORS.has(err.code)) return true;
  // Nodemailer surfaces greeting/connection timeouts via message, not code.
  return /greeting|timed?\s*out|connection|socket|econnreset/i.test(err?.message || '');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sendEmail = async (options) => {
  const maxAttempts = Number(process.env.SMTP_MAX_RETRIES) || 4;

  const message = {
    from: buildFrom(),
    to: options.email,
    subject: options.subject,
    html: options.html,
  };
  if (options.replyTo) message.replyTo = options.replyTo;
  if (Array.isArray(options.attachments) && options.attachments.length) {
    message.attachments = options.attachments;
  }

  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Fresh transport per attempt so a reset connection isn't reused.
    const transporter = buildTransport();
    try {
      const info = await transporter.sendMail(message);
      logger.info(
        `[EMAIL] Sent to ${options.email} via ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} ` +
        `(messageId=${info.messageId})${attempt > 1 ? ` on attempt ${attempt}/${maxAttempts}` : ''}`
      );
      return info;
    } catch (err) {
      lastErr = err;
      const transient = isTransient(err);
      logger.warn(
        `[EMAIL] Attempt ${attempt}/${maxAttempts} to ${options.email} failed ` +
        `(${err.code || 'ERR'}: ${err.message})${transient && attempt < maxAttempts ? ' — retrying' : ''}`
      );
      if (!transient || attempt === maxAttempts) break;
      await sleep(attempt * 1000); // linear backoff: 1s, 2s, 3s
    } finally {
      transporter.close?.();
    }
  }
  throw lastErr;
};

module.exports = sendEmail;