import sharp from 'sharp';

async function check(file) {
  try {
    const meta = await sharp(file).metadata();
    console.log(`${file}: ${meta.width}x${meta.height}, format: ${meta.format}`);
  } catch (e) {
    console.log(`${file}: ERROR ${e.message}`);
  }
}

async function run() {
  await check('public/IMG_6255.jpg');
  await check('public/IMG_3739.jpg');
  await check('public/new_BG.webp');
}

run();
