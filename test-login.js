const http = require('http');

async function run() {
  console.log("1. Registering user...");
  let res = await fetch("http://localhost:5000/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email: "test_new@example.com",
      password: "Password123!",
      phoneNumber: "1234567890"
    })
  });
  console.log("Register Response:", await res.json());

  console.log("\n2. Finding OTP in DB...");
  // Connect to DB and fetch the OTP to verify it.
  const mongoose = require('mongoose');
  require('dotenv').config({ path: 'Backend/.env' });
  await mongoose.connect(process.env.MONGO_URI);
  const pending = await mongoose.connection.db.collection('pendingregistrations').findOne({ email: "test_new@example.com" });
  if (!pending) {
    console.log("No pending registration found.");
    return;
  }
  const otp = pending.otp;
  console.log("Found OTP:", otp);

  console.log("\n3. Verifying Email...");
  res = await fetch("http://localhost:5000/api/v1/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test_new@example.com",
      otp: otp
    })
  });
  const verifyData = await res.json();
  console.log("Verify Response:", verifyData);

  const cookies = res.headers.get('set-cookie');
  console.log("Set-Cookie Header:", cookies);

  if (cookies) {
    console.log("\n4. Fetching /auth/me with cookie...");
    const meRes = await fetch("http://localhost:5000/api/v1/auth/me", {
      headers: { "Cookie": cookies }
    });
    console.log("Me Response Status:", meRes.status);
    console.log("Me Response:", await meRes.json());
  }

  process.exit(0);
}
run();
