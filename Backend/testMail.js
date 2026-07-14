require('dotenv').config();
const sendEmail = require('./utils/sendEmail');
sendEmail({
  email: 'test@example.com',
  subject: 'Test Mail',
  html: '<p>Testing</p>'
}).then(() => console.log('Mail sent successfully')).catch(err => console.error('Mail failed', err));
