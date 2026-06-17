const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function run() {
  const email = "test_register_login@example.com";
  const password = "Password123!";
  
  console.log("1. Registering...");
  let res = await fetch("http://localhost:5000/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email,
      password,
    })
  });
  console.log(await res.json());

  await mongoose.connect(process.env.MONGO_URI);
  const pending = await mongoose.connection.db.collection('pendingregistrations').findOne({ email });
  if (!pending) return console.log("No pending registration found.");
  
  console.log("2. Verifying...");
  res = await fetch("http://localhost:5000/api/v1/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp: pending.otp || pending.emailOTP }) // Wait, pending.otp doesn't exist, it stores emailOTP which is hashed. We can't use pending.otp directly. Let's just create an OTP in the database and bypass it, or we can look at the dev logs or generate a known OTP.
  });
  console.log(await res.json());
}
run();
