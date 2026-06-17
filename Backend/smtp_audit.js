const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

console.log('1. SMTP_HOST:', host);
console.log('2. SMTP_PORT:', port);
console.log('3. SMTP_USER:', user);
console.log('4. SMTP_SECURE:', port == '465');
console.log('5. Password Status:');
console.log('   - Exists:', !!pass);
console.log('   - Length:', pass ? pass.length : 0);

// Determine Provider from Host/MX
// We already know from dig MX that it's secureserver.net (GoDaddy)
