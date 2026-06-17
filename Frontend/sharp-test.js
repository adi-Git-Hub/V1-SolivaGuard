import sharp from 'sharp';
import fs from 'fs';

async function processImage(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    console.log(`\nFile: ${filePath}`);
    console.log(`Format: ${metadata.format}`);
    console.log(`Dimensions: ${metadata.width}x${metadata.height}`);
    console.log(`Size: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB`);
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

async function run() {
  await processImage('public/new_BG.webp');
  await processImage('public/IMG_6255.webp');
  await processImage('public/IMG_3739.webp');
}

run();
