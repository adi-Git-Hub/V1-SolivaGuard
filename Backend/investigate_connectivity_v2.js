const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connection, isRedisAvailable } = require('./config/redis');
const nodemailer = require('nodemailer');

async function check() {
  console.log('--- Environment Check ---');
  console.log('CWD:', process.cwd());
  console.log('ENV PATH:', path.join(__dirname, '.env'));
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('REDIS_HOST:', process.env.REDIS_HOST);
  console.log('NODE_ENV:', process.env.NODE_ENV);

  console.log('\n--- Redis Check ---');
  try {
    const available = await isRedisAvailable();
    console.log('isRedisAvailable():', available);
    console.log('Redis Status:', connection.status);
  } catch (err) {
    console.error('Redis Error:', err.message);
  }

  console.log('\n--- SMTP Check ---');
  if (!process.env.SMTP_HOST) {
    console.log('CRITICAL: SMTP_HOST is undefined. Skipping SMTP check.');
  } else {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_PORT == '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        timeout: 5000
      });
      console.log('Verifying Transporter for', process.env.SMTP_HOST, '...');
      const verified = await transporter.verify();
      console.log('Transporter.verify():', verified);
    } catch (err) {
      console.error('SMTP Error:', err.message);
      if (err.code === 'EAUTH') console.log('HINT: Authentication failed.');
    }
  }

  process.exit(0);
}

check();
