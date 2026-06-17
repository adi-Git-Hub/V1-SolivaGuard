const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function verify() {
  console.log('Testing connection to: smtpout.secureserver.net');
  console.log('User:', process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true, // SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    debug: true,
    logger: true
  });

  try {
    const success = await transporter.verify();
    console.log('--- RESULT ---');
    console.log('SUCCESS: SMTP connection and authentication verified!');
  } catch (err) {
    console.log('--- RESULT ---');
    console.error('FAILED:', err.message);
    if (err.response) console.error('SMTP Response:', err.response);
  }
}

verify();
