const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'Backend/.env' });

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    console.log("Users found:", users.map(u => ({ email: u.email })));
    process.exit(0);
  });
