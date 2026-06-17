const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function proof() {
  console.log('Testing SMTP Auth with current ENV password...');
  const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    debug: true,
    logger: true
  });

  try {
    await transporter.verify();
    console.log('RESULT: SUCCESS');
  } catch (err) {
    console.log('RESULT: FAILED');
    console.log('CODE:', err.responseCode || 'N/A');
    console.log('MESSAGE:', err.message);
    if (err.response) console.log('RAW SMTP:', err.response);
  }
  process.exit(0);
}
proof();
