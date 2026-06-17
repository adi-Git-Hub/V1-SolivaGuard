const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function verify() {
  const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    debug: true,
    logger: true,
    connectionTimeout: 10000 // 10s
  });

  try {
    const success = await transporter.verify();
    console.log('--- RESULT 587 ---');
    console.log('SUCCESS: SMTP connection verified on 587!');
  } catch (err) {
    console.log('--- RESULT 587 ---');
    console.error('FAILED:', err.message);
  }
}
verify();
