const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const PendingRegistration = require('./models/pendingRegistrationModel');

async function verify() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const pending = await PendingRegistration.find({ email: 'admin@solivaguard.com' }).sort({ createdAt: -1 }).limit(1);
    if (pending.length > 0) {
      console.log('OTP_FOUND:' + pending[0].emailOTP);
    } else {
      console.log('OTP_NOT_FOUND');
    }
    await mongoose.disconnect();
  } catch (err) {
    process.exit(1);
  }
}
verify();
