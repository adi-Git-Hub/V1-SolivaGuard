const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const hash = await bcrypt.hash("Password123!", 10);
  await mongoose.connection.db.collection('users').updateOne(
    { email: "adityacloud07@gmail.com" },
    { $set: { password: hash } }
  );
  console.log("Password updated.");
  process.exit(0);
}
run();
