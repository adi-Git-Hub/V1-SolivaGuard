require('dotenv').config();
const { connection, isRedisAvailable } = require('./config/redis');
const sendEmail = require('./utils/sendEmail');
const nodemailer = require('nodemailer');

async function check() {
  console.log('--- Environment Check ---');
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
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('Verifying Transporter...');
    const verified = await transporter.verify();
    console.log('Transporter.verify():', verified);
  } catch (err) {
    console.error('SMTP Error:', err.message);
    if (err.code === 'EAUTH') console.log('HINT: Authentication failed. Check SMTP_USER/SMTP_PASS.');
    if (err.code === 'ECONNREFUSED') console.log('HINT: Connection refused. Check SMTP_HOST/SMTP_PORT.');
  }

  process.exit(0);
}

check();
