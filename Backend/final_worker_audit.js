const { isRedisAvailable } = require('./config/redis');
const { emailQueue } = require('./queues/emailQueue');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function audit() {
  console.log('--- Redis/Worker Audit ---');
  const available = await isRedisAvailable();
  console.log('Redis Available:', available);
  
  if (available) {
    const counts = await emailQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed');
    console.log('EmailQueue Stats:', JSON.stringify(counts, null, 2));
  }
  process.exit(0);
}
audit();
