const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Firebase Admin — used only to VERIFY the Google ID token the browser sends.
//
// Credentials are loaded from the committed service-account JSON file (the
// canonical source — validated, and what initializeApp actually consumes):
//   services/soliva-9757a-firebase-adminsdk-fbsvc-7658e4ab4b.json
//
// As a fallback, discrete env vars are still honoured if the JSON file is
// absent (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY,
// the last pasted with literal \n which we restore). The server boots fine
// WITHOUT any of these — Google sign-in is simply disabled (verifyIdToken
// then throws a clear 503) until a credential source is present.

const serviceAccountPath = path.join(
  __dirname,
  '../services/soliva-9757a-firebase-adminsdk-fbsvc-7658e4ab4b.json',
);

const hasServiceAccountFile = () => fs.existsSync(serviceAccountPath);

const hasEnvCredentials = () =>
  Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );

// Configuration is driven by an available credential SOURCE, not by the legacy
// env vars alone — the JSON file is the real source ensureInit() initializes from.
const isConfigured = () => hasServiceAccountFile() || hasEnvCredentials();

let initTried = false;

function ensureInit() {
  if (admin.apps.length) return true;
  if (initTried) return admin.apps.length > 0;
  initTried = true;

  if (!isConfigured()) {
    logger.warn(
      '[FIREBASE] Admin not configured (no service-account JSON at services/ and no FIREBASE_* env credentials). Google sign-in is disabled.',
    );
    return false;
  }

  try {
    let credential;

    if (hasServiceAccountFile()) {
      // Preferred: the committed, validated service-account JSON.
      const serviceAccount = require(serviceAccountPath);
      credential = admin.credential.cert(serviceAccount);
    } else {
      // Fallback: discrete env vars (restore real newlines in the private key).
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    }

    admin.initializeApp({ credential });
    logger.info('[FIREBASE] Admin initialized.');
    return true;
  } catch (err) {
    logger.error(`[FIREBASE] Admin initialization failed: ${err.message}`);
    return false;
  }
}

/**
 * Verify a Google ID token issued to the browser. Resolves with the decoded
 * token ({ uid, email, name, picture, email_verified, ... }).
 * Throws a 503-tagged error when the server isn't configured for Google sign-in.
 */
async function verifyIdToken(idToken) {
  if (!ensureInit()) {
    const err = new Error('Google sign-in is not configured on the server.');
    err.statusCode = 503;
    throw err;
  }
  return admin.auth().verifyIdToken(idToken);
}

module.exports = { verifyIdToken, isConfigured };
