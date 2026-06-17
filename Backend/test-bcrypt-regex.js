const bcrypt = require('bcryptjs');
async function run() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('password', salt);
  console.log('Hash:', hash);
  const regex = /^\$2[aby]\$\d{2}\$/;
  console.log('Matches regex?', regex.test(hash));
}
run();
