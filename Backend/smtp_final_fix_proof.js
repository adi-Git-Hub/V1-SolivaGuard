const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function proof() {
  console.log('Testing SMTP Auth with NEW provided password...');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT == '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    debug: true,
    logger: true
  });

  try {
    await transporter.verify();
    console.log('--- RESULT ---');
    console.log('SUCCESS: Authentication Verified with the new password!');
  } catch (err) {
    console.log('--- RESULT ---');
    console.log('FAILED:', err.message);
    console.log('CODE:', err.responseCode || 'N/A');
    if (err.response) console.log('RAW:', err.response);
  }
  process.exit(0);
}
proof();
