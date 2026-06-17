import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Throttle network and CPU slightly to simulate a real device
  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  
  // Capture trace
  await page.tracing.start({ path: 'trace.json', screenshots: true });

  const resources = [];
  page.on('response', async (response) => {
    const request = response.request();
    let size = 0;
    try {
      const buffer = await response.buffer();
      size = buffer.length;
    } catch (e) {
      // Ignore
    }
    resources.push({
      url: request.url(),
      type: request.resourceType(),
      size: size
    });
  });

  await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
  
  await page.tracing.stop();
  await browser.close();

  // Aggregate resource data
  const totalSize = resources.reduce((acc, r) => acc + r.size, 0);
  const sortedResources = resources.sort((a, b) => b.size - a.size).slice(0, 10);
  
  console.log('--- Network Payload ---');
  console.log(`Total payload: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('\n--- Top 10 Largest Assets ---');
  sortedResources.forEach(r => {
    console.log(`${(r.size / 1024).toFixed(2)} KB - ${r.url}`);
  });
  
})();
