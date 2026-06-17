const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const AuthAuditLog = require('./models/authAuditLogModel');
const PendingRegistration = require('./models/pendingRegistrationModel');

async function verify() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- MongoDB Verification ---');
    
    const audits = await AuthAuditLog.find({ email: 'admin@solivaguard.com' }).sort({ createdAt: -1 }).limit(1);
    console.log('Latest Audit Log for admin:', audits.length > 0 ? JSON.stringify(audits[0], null, 2) : 'NONE FOUND');

    const pending = await PendingRegistration.find({ email: 'admin@solivaguard.com' }).sort({ createdAt: -1 }).limit(1);
    console.log('Pending Registration OTP:', pending.length > 0 ? pending[0].otp : 'NONE FOUND');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

verify();
