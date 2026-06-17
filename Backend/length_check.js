const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const envPass = process.env.SMTP_PASS;
console.log('1. .env file literal length:', envPass ? envPass.length : 'MISSING');
console.log('2. process.env length:', process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 'MISSING');
